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
 *   confirming ──("cancel")─> idle (cleanup staging)
 *   creating ──(success)────> complete (ask about Facebook)
 *   creating ──(error)──────> error
 *   complete ──("fb yes")───> idle (publish to FB + reset)
 *   complete ──("fb no")────> idle (skip FB + reset)
 *   complete ──(image)──────> collecting (new vehicle)
 *   error ──(image)─────────> collecting (retry with new vehicle)
 */

import { getTypedClient } from '@/lib/supabase/client';
import {
  sendTextMessage,
  sendInteractiveMessage,
  markAsRead,
} from './api';
import { extractVehicleData, findMissingFields } from './vehicle-extractor';
import { createVehicleFromExtraction } from './vehicle-creator';
import { cleanupStagingImages } from './image-pipeline';
import * as templates from './reply-templates';
import type { WAMessage, WASession, WAPhoneLink, ExtractedVehicle } from './types';
import type { StagedImage } from './image-pipeline';

const MAX_IMAGES = 10;
const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || 'autosmall.org';

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
    const lang = detectLanguage(message);
    await sendTextMessage(waPhoneNumberId, phoneNumber, templates.phoneNotLinkedMessage(lang), accessToken);
    await logMessage(null, message.id, 'inbound', message.type, phoneNumber, getMessageContent(message), getMediaId(message), message);
    return;
  }

  const link = phoneLink as unknown as WAPhoneLink;
  const lang = link.language;

  // 2. Handle unsupported message types early
  if (!['text', 'image', 'interactive', 'button'].includes(message.type)) {
    await sendTextMessage(waPhoneNumberId, phoneNumber, templates.unsupportedMessageType(lang), accessToken);
    await logMessage(null, message.id, 'inbound', message.type, phoneNumber, null, null, message);
    return;
  }

  // 3. Get or create session
  let session = await getActiveSession(phoneNumber);

  if (!session) {
    session = await createSession(link, waPhoneNumberId);
  }

  // Log inbound message
  await logMessage(session.id, message.id, 'inbound', message.type, phoneNumber, getMessageContent(message), getMediaId(message), message);

  // 4. Route based on current state + message type
  try {
    switch (session.state) {
      case 'idle':
      case 'error':
        await handleIdleState(session, message, waPhoneNumberId, accessToken, link);
        break;

      case 'collecting':
        await handleCollectingState(session, message, waPhoneNumberId, accessToken, link);
        break;

      case 'extracting':
        // AI is working — acknowledge
        await sendTextMessage(waPhoneNumberId, phoneNumber, templates.extractingMessage(lang), accessToken);
        break;

      case 'confirming':
        await handleConfirmingState(session, message, waPhoneNumberId, accessToken, link);
        break;

      case 'creating':
        // Vehicle is being created — acknowledge
        await sendTextMessage(waPhoneNumberId, phoneNumber, templates.creatingMessage(lang), accessToken);
        break;

      case 'complete':
        await handleCompleteState(session, message, waPhoneNumberId, accessToken, link);
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
    const mediaId = message.image?.id;
    if (!mediaId) return;

    // Start collecting images for new vehicle
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
    // Text without photos — send welcome
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
    const text = message.text.body.toLowerCase().trim();
    if (['si', 'sí', 'yes', 'ok', 'crear', 'create', '1'].includes(text)) {
      action = 'confirm_yes';
    } else if (['editar', 'edit', 'cambiar', 'change', '2'].includes(text)) {
      action = 'confirm_edit';
    } else if (['cancelar', 'cancel', 'no', '3'].includes(text)) {
      action = 'confirm_cancel';
    } else {
      // Treat as field update — store text and re-extract
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
      // Cleanup staging images before resetting
      await cleanupStagingImages(session.image_urls || []);
      await resetSession(session.id);
      await sendTextMessage(waPhoneNumberId, session.phone_number, templates.welcomeMessage(lang), accessToken);
      break;

    default:
      // Re-send confirmation
      if (session.extracted_vehicle) {
        const vehicleData = session.extracted_vehicle as unknown as Record<string, unknown>;
        const { _staged_images: _, ...extractedFields } = vehicleData;
        const sellerHandle = await getSellerHandle(link.wallet_address);
        const { text, buttons } = templates.confirmationMessage(lang, extractedFields as unknown as ExtractedVehicle, sellerHandle);
        await sendInteractiveMessage(waPhoneNumberId, session.phone_number, text, buttons, accessToken);
      }
  }
}

/**
 * Handle messages in 'complete' state — Facebook publish confirmation.
 * Vehicle has been created and user was asked "Want to publish to Facebook?"
 */
async function handleCompleteState(
  session: WASession,
  message: WAMessage,
  waPhoneNumberId: string,
  accessToken: string,
  link: WAPhoneLink
): Promise<void> {
  const lang = link.language;

  // If user sends a new image, start new vehicle
  if (message.type === 'image') {
    await handleIdleState(session, message, waPhoneNumberId, accessToken, link);
    return;
  }

  let action: string | null = null;

  // Check for button reply
  if (message.type === 'interactive' && message.interactive?.button_reply) {
    action = message.interactive.button_reply.id;
  } else if (message.type === 'text' && message.text?.body) {
    const text = message.text.body.toLowerCase().trim();
    if (['si', 'sí', 'yes', 'ok', 'publicar', 'publish', '1'].includes(text)) {
      action = 'fb_yes';
    } else if (['no', 'nah', 'skip', '2'].includes(text)) {
      action = 'fb_no';
    }
  }

  if (action === 'fb_yes') {
    await publishToFacebook(session, waPhoneNumberId, accessToken, link);
  } else if (action === 'fb_no') {
    await sendTextMessage(waPhoneNumberId, session.phone_number, templates.fbSkippedMessage(lang), accessToken);
    await resetSession(session.id);
  } else {
    // Unrecognized input — treat as "skip" and ready for next vehicle
    await sendTextMessage(waPhoneNumberId, session.phone_number, templates.fbSkippedMessage(lang), accessToken);
    await resetSession(session.id);
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

  try {
    // Phase 1: Download images from WA → stage in Supabase Storage
    const { stageWhatsAppImages } = await import('./image-pipeline');

    const stagedImages = await stageWhatsAppImages(
      session.image_media_ids || [],
      link.wallet_address,
      accessToken
    );

    if (stagedImages.length === 0) {
      await updateSessionState(session.id, 'error');
      await sendTextMessage(waPhoneNumberId, session.phone_number, templates.errorMessage(lang), accessToken);
      return;
    }

    const imageUrls = stagedImages.map(img => img.public_url);

    // Store public URLs for reference
    await updateSession(session.id, { image_urls: imageUrls });

    // Get latest text messages
    const freshSession = await getActiveSession(session.phone_number);
    const textMessages = freshSession?.raw_text_messages || session.raw_text_messages || [];

    // Run AI extraction (has 90s timeout internally)
    const extracted = await extractVehicleData(imageUrls, textMessages);

    // Check for missing required fields
    const missing = findMissingFields(extracted);

    if (missing.length > 0) {
      // Store extraction + staged images data (staged images persisted for later finalization)
      await updateSession(session.id, {
        state: 'collecting',
        extracted_vehicle: { ...extracted, _staged_images: stagedImages },
        missing_fields: missing,
      });
      await sendTextMessage(waPhoneNumberId, session.phone_number, templates.missingFieldsMessage(lang, missing), accessToken);
      return;
    }

    // All fields present — ask for confirmation
    const sellerHandle = await getSellerHandle(link.wallet_address);
    await updateSession(session.id, {
      state: 'confirming',
      extracted_vehicle: { ...extracted, _staged_images: stagedImages },
      missing_fields: [],
    });

    const { text, buttons } = templates.confirmationMessage(lang, extracted, sellerHandle);
    await sendInteractiveMessage(waPhoneNumberId, session.phone_number, text, buttons, accessToken);
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
    const vehicleData = session.extracted_vehicle as unknown as Record<string, unknown>;
    if (!vehicleData) throw new Error('No extracted vehicle data');

    // Separate staged images from extraction data
    const stagedImages = (vehicleData._staged_images as StagedImage[]) || [];
    const { _staged_images: _, ...extractedFields } = vehicleData;
    const extracted = extractedFields as unknown as ExtractedVehicle;

    // If no staged images in session data, reconstruct from URLs
    const imagesToUse = stagedImages.length > 0
      ? stagedImages
      : (session.image_urls || []).map((url: string) => ({
          public_url: url,
          storage_path: url.includes('/vehicle-images/') ? url.split('/vehicle-images/')[1] : '',
          file_size: 0,
          mime_type: 'image/jpeg',
        }));

    const result = await createVehicleFromExtraction(
      extracted,
      link.wallet_address,
      imagesToUse,
    );

    await updateSession(session.id, {
      state: 'complete',
      vehicle_id: result.vehicleId,
    });

    // Send success message + ask about Facebook
    const { text, buttons } = templates.vehicleCreatedMessage(lang, extracted, result.catalogUrl);
    await sendInteractiveMessage(waPhoneNumberId, session.phone_number, text, buttons, accessToken);
  } catch (error) {
    console.error(`[WA-Session] Vehicle creation failed:`, error);
    await updateSessionState(session.id, 'error');
    await sendTextMessage(waPhoneNumberId, session.phone_number, templates.errorMessage(lang), accessToken);
  }
}

// ─────────────────────────────────────────────
// Facebook Publishing
// ─────────────────────────────────────────────

async function publishToFacebook(
  session: WASession,
  waPhoneNumberId: string,
  accessToken: string,
  link: WAPhoneLink
): Promise<void> {
  const lang = link.language;

  if (!session.vehicle_id) {
    await sendTextMessage(waPhoneNumberId, session.phone_number, templates.errorMessage(lang), accessToken);
    await resetSession(session.id);
    return;
  }

  try {
    // Check if seller has Meta connection
    const supabase = getTypedClient();
    const { data: connection } = await supabase
      .from('seller_meta_connections')
      .select('id, is_active')
      .eq('wallet_address', link.wallet_address.toLowerCase())
      .eq('is_active', true)
      .single();

    if (!connection) {
      await sendTextMessage(waPhoneNumberId, session.phone_number, templates.fbNotConnectedMessage(lang), accessToken);
      await resetSession(session.id);
      return;
    }

    // Publish via auto-publisher with forcePublish (bypass auto_publish_on_active check)
    const { handleStatusChange } = await import('@/lib/meta/auto-publisher');

    await handleStatusChange({
      vehicleId: session.vehicle_id,
      sellerAddress: link.wallet_address,
      oldStatus: 'draft',
      newStatus: 'active',
      forcePublish: true,
    });

    await sendTextMessage(waPhoneNumberId, session.phone_number, templates.fbPublishedMessage(lang), accessToken);
  } catch (error) {
    console.error(`[WA-Session] FB publish failed for vehicle ${session.vehicle_id}:`, error);
    await sendTextMessage(waPhoneNumberId, session.phone_number, templates.fbErrorMessage(lang), accessToken);
  }

  await resetSession(session.id);
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
    // Cleanup staging images from expired session
    cleanupStagingImages(session.image_urls || []).catch(() => {});
    // Reset expired session
    await resetSession(session.id);
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

async function resetSession(sessionId: string): Promise<void> {
  await updateSession(sessionId, {
    state: 'idle',
    image_media_ids: [],
    image_urls: [],
    raw_text_messages: [],
    extracted_vehicle: null,
    missing_fields: [],
    vehicle_id: null,
  });
}

async function appendTextMessage(sessionId: string, text: string): Promise<void> {
  const supabase = getTypedClient();

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
  const spanishIndicators = ['hola', 'precio', 'año', 'carro', 'vendo', 'fotos', 'gracias', 'quiero', 'millaje', 'vehiculo'];
  const englishIndicators = ['hello', 'price', 'car', 'sell', 'photos', 'thanks', 'want', 'mileage', 'vehicle'];
  const spanishScore = spanishIndicators.filter(w => text.includes(w)).length;
  const englishScore = englishIndicators.filter(w => text.includes(w)).length;
  // Default to Spanish (Houston Hispanic market)
  return englishScore > spanishScore ? 'en' : 'es';
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
