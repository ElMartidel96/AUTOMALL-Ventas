/**
 * WhatsApp Session Manager — State Machine
 *
 * Manages the conversation flow for vehicle listing creation via WhatsApp.
 *
 * State transitions:
 *   idle ──(image)──────────> collecting
 *   collecting ──(image)────> collecting (accumulate)
 *   collecting ──(text)─────> extracting (trigger AI)
 *   extracting ──(AI done)──> confirming (show result)
 *   confirming ──("yes")────> creating (create vehicle)
 *   confirming ──("edit")───> collecting (re-enter)
 *   confirming ──("cancel")─> idle
 *   creating ──(success)────> complete
 *   creating ──(error)──────> error
 *   complete ──(image)──────> collecting (new vehicle)
 */

import { getTypedClient } from '@/lib/supabase/client';
import {
  sendTextMessage,
  sendInteractiveMessage,
  markAsRead,
} from './api';
import { extractVehicleData, findMissingFields } from './vehicle-extractor';
import { createVehicleFromExtraction } from './vehicle-creator';
import * as templates from './reply-templates';
import type { WAMessage, WASession, WAPhoneLink, ExtractedVehicle } from './types';

const MAX_IMAGES = 10;

// ─────────────────────────────────────────────
// Main Entry Point
// ─────────────────────────────────────────────

export async function handleIncomingMessage(
  phoneNumber: string,
  waPhoneNumberId: string,
  message: WAMessage,
  accessToken: string
): Promise<void> {
  const supabase = getTypedClient();

  // Mark message as read (fire-and-forget)
  markAsRead(waPhoneNumberId, message.id, accessToken).catch(() => {});

  // 1. Lookup seller by phone number
  const { data: phoneLink } = await supabase
    .from('wa_phone_links')
    .select('*')
    .eq('phone_number', phoneNumber)
    .single();

  if (!phoneLink) {
    // Phone not linked — tell user to link in profile
    const lang = detectLanguage(message);
    await sendTextMessage(waPhoneNumberId, phoneNumber, templates.phoneNotLinkedMessage(lang), accessToken);
    await logMessage(null, message.id, 'inbound', message.type, phoneNumber, getMessageContent(message), getMediaId(message), message);
    return;
  }

  const link = phoneLink as unknown as WAPhoneLink;
  const lang = link.language;

  // 2. Get or create session
  let session = await getActiveSession(phoneNumber);

  if (!session) {
    session = await createSession(link, waPhoneNumberId);
  }

  // Log inbound message
  await logMessage(session.id, message.id, 'inbound', message.type, phoneNumber, getMessageContent(message), getMediaId(message), message);

  // 3. Route based on current state + message type
  try {
    switch (session.state) {
      case 'idle':
      case 'complete':
      case 'error':
        await handleIdleState(session, message, waPhoneNumberId, accessToken, link);
        break;

      case 'collecting':
        await handleCollectingState(session, message, waPhoneNumberId, accessToken, link);
        break;

      case 'extracting':
        // AI is working — just acknowledge
        await sendTextMessage(waPhoneNumberId, phoneNumber, templates.extractingMessage(lang), accessToken);
        break;

      case 'confirming':
        await handleConfirmingState(session, message, waPhoneNumberId, accessToken, link);
        break;

      case 'creating':
        // Vehicle is being created — just acknowledge
        await sendTextMessage(waPhoneNumberId, phoneNumber, templates.creatingMessage(lang), accessToken);
        break;

      default:
        await sendTextMessage(waPhoneNumberId, phoneNumber, templates.welcomeMessage(lang), accessToken);
    }
  } catch (error) {
    console.error(`[WA-Session] Error handling message for ${phoneNumber}:`, error);
    await updateSessionState(session.id, 'error');
    await sendTextMessage(waPhoneNumberId, phoneNumber, templates.errorMessage(lang), accessToken);
  }
}

// ─────────────────────────────────────────────
// State Handlers
// ─────────────────────────────────────────────

async function handleIdleState(
  session: WASession,
  message: WAMessage,
  waPhoneNumberId: string,
  accessToken: string,
  link: WAPhoneLink
): Promise<void> {
  const lang = link.language;

  if (message.type === 'image') {
    // Start collecting images for new vehicle
    const mediaId = message.image?.id;
    if (!mediaId) return;

    await updateSession(session.id, {
      state: 'collecting',
      image_media_ids: [mediaId],
      image_urls: [],
      raw_text_messages: [],
      extracted_vehicle: null,
      missing_fields: [],
      vehicle_id: null,
    });

    // If there's a caption, store it as text
    if (message.image?.caption) {
      await appendTextMessage(session.id, message.image.caption);
    }

    await sendTextMessage(waPhoneNumberId, session.phone_number, templates.photoReceived(lang, 1), accessToken);
  } else if (message.type === 'text') {
    // Text without photos first — send welcome
    await sendTextMessage(waPhoneNumberId, session.phone_number, templates.welcomeMessage(lang), accessToken);
  }
}

async function handleCollectingState(
  session: WASession,
  message: WAMessage,
  waPhoneNumberId: string,
  accessToken: string,
  link: WAPhoneLink
): Promise<void> {
  const lang = link.language;

  if (message.type === 'image') {
    const mediaId = message.image?.id;
    if (!mediaId) return;

    const currentIds = session.image_media_ids || [];

    if (currentIds.length >= MAX_IMAGES) {
      await sendTextMessage(waPhoneNumberId, session.phone_number, templates.maxImagesReached(lang), accessToken);
      return;
    }

    const newIds = [...currentIds, mediaId];
    await updateSession(session.id, { image_media_ids: newIds });

    // If there's a caption, store it as text
    if (message.image?.caption) {
      await appendTextMessage(session.id, message.image.caption);
    }

    if (newIds.length >= MAX_IMAGES) {
      await sendTextMessage(waPhoneNumberId, session.phone_number, templates.maxImagesReached(lang), accessToken);
    } else {
      await sendTextMessage(waPhoneNumberId, session.phone_number, templates.photoReceived(lang, newIds.length), accessToken);
    }
  } else if (message.type === 'text' && message.text?.body) {
    // Text message triggers AI extraction
    await appendTextMessage(session.id, message.text.body);

    // Refresh session to get latest media IDs
    const freshSession = await getActiveSession(session.phone_number);
    if (!freshSession || (freshSession.image_media_ids || []).length === 0) {
      await sendTextMessage(waPhoneNumberId, session.phone_number, templates.welcomeMessage(lang), accessToken);
      return;
    }

    await updateSessionState(session.id, 'extracting');
    await sendTextMessage(waPhoneNumberId, session.phone_number, templates.extractingMessage(lang), accessToken);

    // Fire-and-forget: run AI extraction
    runExtraction(freshSession, waPhoneNumberId, accessToken, link).catch((err) => {
      console.error(`[WA-Session] Extraction error:`, err);
    });
  }
}

async function handleConfirmingState(
  session: WASession,
  message: WAMessage,
  waPhoneNumberId: string,
  accessToken: string,
  link: WAPhoneLink
): Promise<void> {
  const lang = link.language;
  let action: string | null = null;

  // Check for button reply
  if (message.type === 'interactive' && message.interactive?.button_reply) {
    action = message.interactive.button_reply.id;
  } else if (message.type === 'button' && message.button?.payload) {
    action = message.button.payload;
  } else if (message.type === 'text' && message.text?.body) {
    // Parse text as confirmation
    const text = message.text.body.toLowerCase().trim();
    if (['si', 'sí', 'yes', 'ok', 'crear', 'create', '1'].includes(text)) {
      action = 'confirm_yes';
    } else if (['editar', 'edit', 'cambiar', 'change', '2'].includes(text)) {
      action = 'confirm_edit';
    } else if (['cancelar', 'cancel', 'no', '3'].includes(text)) {
      action = 'confirm_cancel';
    } else {
      // Treat as field update — re-extract with new info
      action = 'confirm_edit';
      await appendTextMessage(session.id, message.text.body);
    }
  }

  switch (action) {
    case 'confirm_yes':
      await createVehicleFlow(session, waPhoneNumberId, accessToken, link);
      break;

    case 'confirm_edit':
      await updateSession(session.id, { state: 'collecting' });
      await sendTextMessage(waPhoneNumberId, session.phone_number, templates.editInstructionsMessage(lang), accessToken);
      break;

    case 'confirm_cancel':
      await updateSession(session.id, {
        state: 'idle',
        image_media_ids: [],
        raw_text_messages: [],
        extracted_vehicle: null,
      });
      await sendTextMessage(waPhoneNumberId, session.phone_number, templates.welcomeMessage(lang), accessToken);
      break;

    default:
      // Re-send confirmation
      if (session.extracted_vehicle) {
        const sellerHandle = await getSellerHandle(link.wallet_address);
        const { text, buttons } = templates.confirmationMessage(lang, session.extracted_vehicle as ExtractedVehicle, sellerHandle);
        await sendInteractiveMessage(waPhoneNumberId, session.phone_number, text, buttons, accessToken);
      }
  }
}

// ─────────────────────────────────────────────
// AI Extraction Pipeline
// ─────────────────────────────────────────────

async function runExtraction(
  session: WASession,
  waPhoneNumberId: string,
  accessToken: string,
  link: WAPhoneLink
): Promise<void> {
  const lang = link.language;
  const supabase = getTypedClient();

  try {
    // Phase 1: Download images from WA → stage in Supabase Storage (no vehicle_images records)
    const { stageWhatsAppImages } = await import('./image-pipeline');

    const stagedImages = await stageWhatsAppImages(
      session.image_media_ids || [],
      link.wallet_address,
      accessToken
    );

    const imageUrls = stagedImages.map(img => img.public_url);
    const stagedPaths = stagedImages.map(img => img.storage_path);

    // Store public URLs + staged paths for later finalization
    await updateSession(session.id, { image_urls: imageUrls });

    // Get latest text messages
    const freshSession = await getActiveSession(session.phone_number);
    const textMessages = freshSession?.raw_text_messages || session.raw_text_messages || [];

    // Run AI extraction
    const extracted = await extractVehicleData(imageUrls, textMessages);

    // Check for missing required fields
    const missing = findMissingFields(extracted);

    if (missing.length > 0) {
      await updateSession(session.id, {
        state: 'collecting',
        extracted_vehicle: extracted,
        missing_fields: missing,
      });
      await sendTextMessage(waPhoneNumberId, session.phone_number, templates.missingFieldsMessage(lang, missing), accessToken);
      return;
    }

    // All fields present — ask for confirmation
    const sellerHandle = await getSellerHandle(link.wallet_address);
    await updateSession(session.id, {
      state: 'confirming',
      extracted_vehicle: extracted,
      missing_fields: [],
    });

    const { text, buttons } = templates.confirmationMessage(lang, extracted, sellerHandle);
    await sendInteractiveMessage(waPhoneNumberId, session.phone_number, text, buttons, accessToken);

    // Clean up temp images — they'll be re-uploaded with real vehicle ID
    // Actually, we keep them and will move/reassign when vehicle is created
  } catch (error) {
    console.error(`[WA-Session] Extraction failed:`, error);
    await updateSessionState(session.id, 'error');
    await sendTextMessage(waPhoneNumberId, session.phone_number, templates.errorMessage(lang), accessToken);
  }
}

// ─────────────────────────────────────────────
// Vehicle Creation Pipeline
// ─────────────────────────────────────────────

async function createVehicleFlow(
  session: WASession,
  waPhoneNumberId: string,
  accessToken: string,
  link: WAPhoneLink
): Promise<void> {
  const lang = link.language;

  await updateSessionState(session.id, 'creating');
  await sendTextMessage(waPhoneNumberId, session.phone_number, templates.creatingMessage(lang), accessToken);

  try {
    const extracted = session.extracted_vehicle as ExtractedVehicle;
    if (!extracted) throw new Error('No extracted vehicle data');

    // Reconstruct staged images from session data (URLs stored during extraction)
    const imageUrls = session.image_urls || [];
    const stagedImages = imageUrls.map((url: string) => ({
      public_url: url,
      // Extract storage_path from the public URL (after /object/public/vehicle-images/)
      storage_path: url.includes('/vehicle-images/') ? url.split('/vehicle-images/')[1] : '',
      file_size: 0,
      mime_type: 'image/jpeg',
    }));

    const result = await createVehicleFromExtraction(
      extracted,
      link.wallet_address,
      stagedImages,
      link.auto_activate
    );

    await updateSession(session.id, {
      state: 'complete',
      vehicle_id: result.vehicleId,
    });

    const message = templates.completeMessage(lang, extracted, result.catalogUrl, result.publishedToFb);
    await sendTextMessage(waPhoneNumberId, session.phone_number, message, accessToken);
  } catch (error) {
    console.error(`[WA-Session] Vehicle creation failed:`, error);
    await updateSessionState(session.id, 'error');
    await sendTextMessage(waPhoneNumberId, session.phone_number, templates.errorMessage(lang), accessToken);
  }
}

// ─────────────────────────────────────────────
// Session CRUD
// ─────────────────────────────────────────────

async function getActiveSession(phoneNumber: string): Promise<WASession | null> {
  const supabase = getTypedClient();

  const { data } = await supabase
    .from('wa_sessions')
    .select('*')
    .eq('phone_number', phoneNumber)
    .single();

  if (!data) return null;

  const session = data as unknown as WASession;

  // Check expiry
  if (new Date(session.expires_at) < new Date()) {
    // Reset expired session
    await updateSession(session.id, {
      state: 'idle',
      image_media_ids: [],
      image_urls: [],
      raw_text_messages: [],
      extracted_vehicle: null,
      missing_fields: [],
      vehicle_id: null,
    });
    session.state = 'idle';
    session.image_media_ids = [];
    session.image_urls = [];
    session.raw_text_messages = [];
    session.extracted_vehicle = null;
    session.missing_fields = [];
    session.vehicle_id = null;
  }

  // Extend expiry
  await supabase
    .from('wa_sessions')
    .update({ expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() })
    .eq('id', session.id);

  return session;
}

async function createSession(link: WAPhoneLink, waPhoneNumberId: string): Promise<WASession> {
  const supabase = getTypedClient();

  const { data, error } = await supabase
    .from('wa_sessions')
    .upsert({
      seller_id: link.seller_id,
      wallet_address: link.wallet_address,
      phone_number: link.phone_number,
      wa_phone_number_id: waPhoneNumberId,
      state: 'idle',
      language: link.language,
      image_media_ids: [],
      image_urls: [],
      raw_text_messages: [],
      missing_fields: [],
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    }, { onConflict: 'phone_number' })
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(`Failed to create session: ${error?.message}`);
  }

  return data as unknown as WASession;
}

async function updateSession(
  sessionId: string,
  updates: Partial<Record<string, unknown>>
): Promise<void> {
  const supabase = getTypedClient();
  await supabase
    .from('wa_sessions')
    .update(updates)
    .eq('id', sessionId);
}

async function updateSessionState(sessionId: string, state: string): Promise<void> {
  await updateSession(sessionId, { state });
}

async function appendTextMessage(sessionId: string, text: string): Promise<void> {
  const supabase = getTypedClient();

  // Get current messages
  const { data } = await supabase
    .from('wa_sessions')
    .select('raw_text_messages')
    .eq('id', sessionId)
    .single();

  const current = ((data as Record<string, unknown>)?.raw_text_messages as string[]) || [];
  await updateSession(sessionId, { raw_text_messages: [...current, text] });
}

// ─────────────────────────────────────────────
// Message Logging
// ─────────────────────────────────────────────

async function logMessage(
  sessionId: string | null,
  waMessageId: string | null,
  direction: 'inbound' | 'outbound',
  messageType: string,
  phoneNumber: string,
  content: string | null,
  mediaId: string | null,
  rawPayload: unknown
): Promise<void> {
  try {
    const supabase = getTypedClient();
    await supabase
      .from('wa_message_log')
      .insert({
        session_id: sessionId,
        wa_message_id: waMessageId,
        direction,
        message_type: messageType,
        phone_number: phoneNumber,
        content,
        media_id: mediaId,
        raw_payload: rawPayload,
      });
  } catch (error) {
    // Fire-and-forget — don't break the flow
    console.error('[WA-Log] Failed to log message:', error);
  }
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function getMessageContent(message: WAMessage): string | null {
  if (message.text?.body) return message.text.body;
  if (message.image?.caption) return message.image.caption;
  if (message.interactive?.button_reply?.title) return message.interactive.button_reply.title;
  if (message.button?.text) return message.button.text;
  return null;
}

function getMediaId(message: WAMessage): string | null {
  return message.image?.id || null;
}

function detectLanguage(message: WAMessage): 'en' | 'es' {
  const text = (message.text?.body || message.image?.caption || '').toLowerCase();
  const spanishWords = ['hola', 'precio', 'ano', 'carro', 'vendo', 'fotos', 'gracias', 'quiero'];
  const isSpanish = spanishWords.some(w => text.includes(w));
  return isSpanish ? 'es' : 'en';
}

async function getSellerHandle(walletAddress: string): Promise<string> {
  try {
    const supabase = getTypedClient();
    const { data } = await supabase
      .from('sellers')
      .select('handle')
      .eq('wallet_address', walletAddress.toLowerCase())
      .single();
    return (data as Record<string, unknown>)?.handle as string || 'dealer';
  } catch {
    return 'dealer';
  }
}
