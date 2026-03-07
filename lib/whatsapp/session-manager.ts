/**
 * WhatsApp Session Manager — Concurrency-Safe State Machine
 *
 * Handles vehicle listing creation via WhatsApp photos + AI Vision.
 *
 * Design principles:
 *   - Photos are SILENTLY accumulated (no WA response per photo → no rate limiting)
 *   - wa_message_log is the source of truth for media IDs (no race-prone array updates)
 *   - Text message triggers AI extraction (user sends details after photos)
 *   - 2-second delay before extraction (allows remaining photos to arrive)
 *   - Non-destructive session creation (insert-or-fetch, never overwrites)
 *   - Dedup with 60-second window (prevents immediate retries, allows later ones)
 *
 * State transitions:
 *   idle ──(image)──────────> collecting (silent)
 *   idle ──(text, no photos)> idle (send welcome)
 *   collecting ──(image)────> collecting (silent accumulate)
 *   collecting ──(text)─────> extracting (trigger AI)
 *   extracting ──(AI done)──> confirming (show result)
 *   confirming ──(publish)──> creating (create vehicle)
 *   confirming ──(text)─────> collecting (field correction)
 *   confirming ──(cancel)───> idle (cleanup)
 *   creating ──(success)────> idle (done, reset)
 *   creating ──(error)──────> error
 *   complete/error ──(any)──> idle (fresh start)
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
const PHOTO_SETTLE_DELAY_MS = 2000;

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

  // Normalize to E.164 — webhook sends "12814680109", DB stores "+12814680109"
  const normalizedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;

  // Dedup: skip if this message was processed in the last 60 seconds
  // (allows retries after cooldown, prevents immediate duplicates from Meta retries)
  const { data: alreadyProcessed } = await supabase
    .from('wa_message_log')
    .select('id')
    .eq('wa_message_id', message.id)
    .gte('created_at', new Date(Date.now() - 60_000).toISOString())
    .limit(1);

  if (alreadyProcessed && alreadyProcessed.length > 0) {
    return;
  }

  // Mark message as read (fire-and-forget)
  markAsRead(waPhoneNumberId, message.id, accessToken).catch(() => {});

  // 1. Lookup seller by phone number (normalized E.164)
  const { data: phoneLink } = await supabase
    .from('wa_phone_links')
    .select('*')
    .eq('phone_number', normalizedPhone)
    .single();

  if (!phoneLink) {
    const lang = detectLanguage(message);
    await safeSend(waPhoneNumberId, phoneNumber, templates.phoneNotLinkedMessage(lang), accessToken);
    await logMessage(null, message.id, 'inbound', message.type, normalizedPhone, getMessageContent(message), getMediaId(message), message);
    return;
  }

  const link = phoneLink as unknown as WAPhoneLink;
  const lang = link.language;

  // 2. Handle unsupported message types early
  if (!['text', 'image', 'interactive', 'button'].includes(message.type)) {
    await safeSend(waPhoneNumberId, phoneNumber, templates.unsupportedMessageType(lang), accessToken);
    await logMessage(null, message.id, 'inbound', message.type, normalizedPhone, null, null, message);
    return;
  }

  // 3. Get or create session (non-destructive — never overwrites existing)
  const session = await getOrCreateSession(normalizedPhone, link, waPhoneNumberId);

  // 4. Log inbound message (with session_id + media_id for later retrieval)
  await logMessage(session.id, message.id, 'inbound', message.type, normalizedPhone, getMessageContent(message), getMediaId(message), message);

  // 5. Route based on current state + message type
  try {
    switch (session.state) {
      case 'idle':
      case 'error':
      case 'complete':
        await handleIdleState(session, message, waPhoneNumberId, accessToken, link);
        break;

      case 'collecting':
        await handleCollectingState(session, message, waPhoneNumberId, accessToken, link);
        break;

      case 'extracting':
        // AI is working — acknowledge only for text (ignore photos)
        if (message.type === 'text') {
          await safeSend(waPhoneNumberId, session.phone_number, templates.extractingMessage(lang), accessToken);
        }
        break;

      case 'confirming':
        await handleConfirmingState(session, message, waPhoneNumberId, accessToken, link);
        break;

      case 'creating':
        // Vehicle is being created — acknowledge only for text
        if (message.type === 'text') {
          await safeSend(waPhoneNumberId, session.phone_number, templates.creatingMessage(lang), accessToken);
        }
        break;

      default:
        await safeSend(waPhoneNumberId, session.phone_number, templates.welcomeMessage(lang), accessToken);
    }
  } catch (error) {
    console.error(`[WA-Session] Error handling message for ${normalizedPhone}:`, error);
    await updateSessionState(session.id, 'error');
    await safeSend(waPhoneNumberId, phoneNumber, templates.errorMessage(lang), accessToken);
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
    // Transition to collecting — photos accumulate silently via message log.
    // No WA response sent (avoids rate limiting with multiple concurrent photos).
    // If session is already in error/complete, reset it first.
    if (session.state === 'error' || session.state === 'complete') {
      await resetSession(session.id);
    }
    await updateSession(session.id, {
      state: 'collecting',
      image_urls: [],
      extracted_vehicle: null,
      missing_fields: [],
      vehicle_id: null,
    });
  } else if (message.type === 'text') {
    // Text in idle — check if photos were already accumulated (from concurrent photo handlers)
    const mediaIds = await getSessionMediaIds(session.id);
    if (mediaIds.length > 0) {
      // Photos exist + text arrived → trigger extraction
      await triggerExtraction(session, mediaIds, waPhoneNumberId, accessToken, link);
    } else {
      // No photos yet → send welcome
      await safeSend(waPhoneNumberId, session.phone_number, templates.welcomeMessage(lang), accessToken);
    }
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
    // Photos accumulate silently via message log.
    // No response, no array update — wa_message_log is the source of truth.
    return;
  }

  if (message.type === 'text' && message.text?.body) {
    // Text triggers extraction — wait briefly for remaining photos to arrive
    await new Promise(resolve => setTimeout(resolve, PHOTO_SETTLE_DELAY_MS));

    // Gather all media IDs from message log (race-condition-safe)
    const mediaIds = await getSessionMediaIds(session.id);
    if (mediaIds.length === 0) {
      await safeSend(waPhoneNumberId, session.phone_number, templates.welcomeMessage(lang), accessToken);
      return;
    }

    await triggerExtraction(session, mediaIds, waPhoneNumberId, accessToken, link);
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

  // New image during confirmation → start new vehicle
  if (message.type === 'image') {
    await cleanupStagingImages(session.image_urls || []);
    await resetSession(session.id);
    await updateSession(session.id, {
      state: 'collecting',
      image_urls: [],
      extracted_vehicle: null,
      missing_fields: [],
      vehicle_id: null,
    });
    return;
  }

  let action: string | null = null;

  // Check for button reply
  if (message.type === 'interactive' && message.interactive?.button_reply) {
    action = message.interactive.button_reply.id;
  } else if (message.type === 'button' && message.button?.payload) {
    action = message.button.payload;
  } else if (message.type === 'text' && message.text?.body) {
    const text = message.text.body.toLowerCase().trim();
    if (['si', 'sí', 'yes', 'ok', 'crear', 'create', 'catalogo', 'catalog', '1'].includes(text)) {
      action = 'publish_catalog';
    } else if (['facebook', 'fb', 'ambos', 'both', '2'].includes(text)) {
      action = 'publish_catalog_fb';
    } else if (['cancelar', 'cancel', 'no', '3'].includes(text)) {
      action = 'confirm_cancel';
    } else {
      // Field correction — go back to collecting
      action = 'field_correction';
    }
  }

  switch (action) {
    case 'publish_catalog':
      await createVehicleFlow(session, waPhoneNumberId, accessToken, link, false);
      break;

    case 'publish_catalog_fb':
      await createVehicleFlow(session, waPhoneNumberId, accessToken, link, true);
      break;

    case 'field_correction':
      await updateSession(session.id, { state: 'collecting' });
      await safeSend(waPhoneNumberId, session.phone_number, templates.editInstructionsMessage(lang), accessToken);
      break;

    case 'confirm_cancel':
      await cleanupStagingImages(session.image_urls || []);
      await resetSession(session.id);
      await safeSend(waPhoneNumberId, session.phone_number, templates.welcomeMessage(lang), accessToken);
      break;

    default:
      // Re-send confirmation
      if (session.extracted_vehicle) {
        const vehicleData = session.extracted_vehicle as unknown as Record<string, unknown>;
        const { _staged_images: _, ...extractedFields } = vehicleData;
        const sellerHandle = await getSellerHandle(link.wallet_address);
        const { text, buttons } = templates.confirmationMessage(lang, extractedFields as unknown as ExtractedVehicle, sellerHandle);
        await sendInteractiveMessage(waPhoneNumberId, session.phone_number, text, buttons, accessToken).catch(err => {
          console.error('[WA-Session] Failed to resend confirmation:', err);
        });
      }
  }
}

// ─────────────────────────────────────────────
// AI Extraction Pipeline
// ─────────────────────────────────────────────

/**
 * Trigger extraction: send acknowledgment, then run AI pipeline.
 * Uses media IDs from wa_message_log (not session array) for race-safety.
 */
async function triggerExtraction(
  session: WASession,
  mediaIds: string[],
  waPhoneNumberId: string,
  accessToken: string,
  link: WAPhoneLink
): Promise<void> {
  const lang = link.language;
  const count = Math.min(mediaIds.length, MAX_IMAGES);

  await updateSessionState(session.id, 'extracting');

  // Send single acknowledgment with photo count
  const ackMsg = lang === 'es'
    ? `Recibi ${count} ${count === 1 ? 'foto' : 'fotos'}. Analizando... Un momento.`
    : `Received ${count} ${count === 1 ? 'photo' : 'photos'}. Analyzing... One moment.`;
  await safeSend(waPhoneNumberId, session.phone_number, ackMsg, accessToken);

  // Fire-and-forget: run AI extraction
  runExtraction(session, mediaIds.slice(0, MAX_IMAGES), waPhoneNumberId, accessToken, link).catch((err) => {
    console.error(`[WA-Session] Extraction error:`, err);
  });
}

async function runExtraction(
  session: WASession,
  mediaIds: string[],
  waPhoneNumberId: string,
  accessToken: string,
  link: WAPhoneLink
): Promise<void> {
  const lang = link.language;

  try {
    // Phase 1: Download images from WA → stage in Supabase Storage
    const { stageWhatsAppImages } = await import('./image-pipeline');

    const stagedImages = await stageWhatsAppImages(
      mediaIds,
      link.wallet_address,
      accessToken
    );

    if (stagedImages.length === 0) {
      await updateSessionState(session.id, 'error');
      await safeSend(waPhoneNumberId, session.phone_number, templates.errorMessage(lang), accessToken);
      return;
    }

    const imageUrls = stagedImages.map(img => img.public_url);

    // Store public URLs for reference
    await updateSession(session.id, { image_urls: imageUrls });

    // Get all text messages from the message log (race-condition-safe)
    const textMessages = await getSessionTexts(session.id);

    // Run AI extraction (has 90s timeout internally)
    const extracted = await extractVehicleData(imageUrls, textMessages);

    // Check for missing required fields
    const missing = findMissingFields(extracted);

    if (missing.length > 0) {
      await updateSession(session.id, {
        state: 'collecting',
        extracted_vehicle: { ...extracted, _staged_images: stagedImages },
        missing_fields: missing,
      });
      await safeSend(waPhoneNumberId, session.phone_number, templates.missingFieldsMessage(lang, missing), accessToken);
      return;
    }

    // All fields present — ask for confirmation with publish destination buttons
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
    await safeSend(waPhoneNumberId, session.phone_number, templates.errorMessage(lang), accessToken);
  }
}

// ─────────────────────────────────────────────
// Vehicle Creation Pipeline
// ─────────────────────────────────────────────

async function createVehicleFlow(
  session: WASession,
  waPhoneNumberId: string,
  accessToken: string,
  link: WAPhoneLink,
  publishToFb: boolean
): Promise<void> {
  const lang = link.language;

  await updateSessionState(session.id, 'creating');
  await safeSend(waPhoneNumberId, session.phone_number, templates.creatingMessage(lang), accessToken);

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

    // Publish to Facebook if requested
    let fbPublished = false;
    if (publishToFb) {
      try {
        fbPublished = await tryPublishToFacebook(result.vehicleId, link);
      } catch (err) {
        console.error(`[WA-Session] FB publish failed for vehicle ${result.vehicleId}:`, err);
      }
    }

    // Send unified success message
    const successMsg = templates.vehiclePublishedMessage(lang, extracted, result.catalogUrl, publishToFb, fbPublished);
    await safeSend(waPhoneNumberId, session.phone_number, successMsg, accessToken);

    // Reset session — ready for next vehicle
    await resetSession(session.id);
  } catch (error) {
    console.error(`[WA-Session] Vehicle creation failed:`, error);
    await updateSessionState(session.id, 'error');
    await safeSend(waPhoneNumberId, session.phone_number, templates.errorMessage(lang), accessToken);
  }
}

// ─────────────────────────────────────────────
// Facebook Publishing
// ─────────────────────────────────────────────

async function tryPublishToFacebook(vehicleId: string, link: WAPhoneLink): Promise<boolean> {
  const supabase = getTypedClient();
  const { data: connection } = await supabase
    .from('seller_meta_connections')
    .select('id, is_active')
    .eq('wallet_address', link.wallet_address.toLowerCase())
    .eq('is_active', true)
    .single();

  if (!connection) return false;

  const { handleStatusChange } = await import('@/lib/meta/auto-publisher');

  await handleStatusChange({
    vehicleId,
    sellerAddress: link.wallet_address,
    oldStatus: 'draft',
    newStatus: 'active',
    forcePublish: true,
  });

  return true;
}

// ─────────────────────────────────────────────
// Session CRUD (Concurrency-Safe)
// ─────────────────────────────────────────────

/**
 * Get or create a session. Non-destructive: never overwrites an existing session.
 * Handles race conditions where multiple concurrent handlers try to create.
 */
async function getOrCreateSession(
  phone: string,
  link: WAPhoneLink,
  waPhoneNumberId: string
): Promise<WASession> {
  const supabase = getTypedClient();

  // Try to get existing session
  const { data: existing } = await supabase
    .from('wa_sessions')
    .select('*')
    .eq('phone_number', phone)
    .single();

  if (existing) {
    const session = existing as unknown as WASession;

    // Check expiry
    if (new Date(session.expires_at) < new Date()) {
      cleanupStagingImages(session.image_urls || []).catch(() => {});
      await resetSession(session.id);
      session.state = 'idle';
      session.image_urls = [];
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

  // No session exists — create new one (INSERT, not UPSERT, to avoid overwriting)
  const { data: newData, error } = await supabase
    .from('wa_sessions')
    .insert({
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
    })
    .select('*')
    .single();

  if (error) {
    // Race condition: another handler created the session concurrently
    const { data: raceData } = await supabase
      .from('wa_sessions')
      .select('*')
      .eq('phone_number', phone)
      .single();

    if (raceData) return raceData as unknown as WASession;
    throw new Error(`Failed to create session: ${error.message}`);
  }

  return newData as unknown as WASession;
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

// ─────────────────────────────────────────────
// Message Log Queries (Source of Truth for Media)
// ─────────────────────────────────────────────

/**
 * Get all media IDs for a session from the message log.
 * This is race-condition-safe: each handler INSERTs to the log independently,
 * and we SELECT all at query time. No read-modify-write on arrays.
 */
async function getSessionMediaIds(sessionId: string): Promise<string[]> {
  const supabase = getTypedClient();
  const { data } = await supabase
    .from('wa_message_log')
    .select('media_id')
    .eq('session_id', sessionId)
    .eq('direction', 'inbound')
    .not('media_id', 'is', null)
    .order('created_at', { ascending: true })
    .limit(MAX_IMAGES);

  return (data || []).map((row: { media_id: string }) => row.media_id);
}

/**
 * Get all text content for a session from the message log.
 * Includes both standalone text messages and image captions.
 */
async function getSessionTexts(sessionId: string): Promise<string[]> {
  const supabase = getTypedClient();
  const { data } = await supabase
    .from('wa_message_log')
    .select('content')
    .eq('session_id', sessionId)
    .eq('direction', 'inbound')
    .not('content', 'is', null)
    .order('created_at', { ascending: true });

  return (data || []).map((row: { content: string }) => row.content);
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
    console.error('[WA-Log] Failed to log message:', error);
  }
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/**
 * Send a text message, swallowing errors (rate limits, etc.).
 * Prevents cascading failures when WhatsApp rate-limits us.
 */
async function safeSend(
  phoneNumberId: string,
  to: string,
  text: string,
  token: string
): Promise<void> {
  try {
    await sendTextMessage(phoneNumberId, to, text, token);
  } catch (err) {
    console.error('[WA-Session] Send failed (rate limited?):', err);
  }
}

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
