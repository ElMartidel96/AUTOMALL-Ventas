/**
 * WhatsApp Session Manager — Smart AI Vehicle Assistant
 *
 * Handles vehicle listing creation via WhatsApp photos + AI Vision.
 *
 * Design principles:
 *   - EVERY photo gets acknowledgment with running count (proof bot is alive)
 *   - No image count or size limits — platform handles optimization
 *   - Text message triggers AI extraction with photo count + text preview
 *   - ALL processing is SYNCHRONOUS — Vercel kills fire-and-forget promises
 *   - Smart auto-fill estimates missing optional fields (transmission, features, etc.)
 *   - Missing required fields → offer AI auto-fill button
 *   - wa_message_log is source of truth for media IDs (race-condition safe)
 *   - Session reset NULLs old message log entries → clean photo count per listing
 *   - Extraction watchdog: short expiry prevents stuck sessions forever
 *   - Universal restart command ("reiniciar") works in any state
 *   - Prominent error logging — token/auth issues surface immediately
 *
 * State transitions:
 *   idle ──(image)──────────> collecting (ack with count)
 *   idle ──(text, has photos)> extracting (trigger AI)
 *   idle ──(text, no photos)─> idle (send welcome)
 *   collecting ──(image)────> collecting (ack with count)
 *   collecting ──(text)─────> extracting (send "analyzing...", run AI)
 *   extracting ──(text)─────> extracting (ack "still analyzing")
 *   extracting ──(expired)──> idle (watchdog auto-reset, 2 min)
 *   confirming ──(auto_fill)> confirming (fill & show with publish options)
 *   confirming ──(publish)──> creating (create vehicle)
 *   confirming ──(text)─────> extracting (re-extract with new text)
 *   confirming ──(image)────> collecting (new vehicle, reset)
 *   confirming ──(cancel)───> idle (cleanup)
 *   creating ──(success)────> idle (done, reset)
 *   creating ──(error)──────> error
 *   error/complete ──(any)──> idle (fresh start)
 *   ANY ──("reiniciar")─────> idle (user restart command)
 */

import { getTypedClient } from '@/lib/supabase/client';
import {
  sendTextMessage,
  sendInteractiveMessage,
  markAsRead,
} from './api';
import { extractVehicleData, findMissingFields, smartAutoFill, MAX_EXTRACTION_IMAGES } from './vehicle-extractor';
import { createVehicleFromExtraction } from './vehicle-creator';
import { cleanupStagingImages } from './image-pipeline';
import { routeCommand } from './command-router';
import * as templates from './reply-templates';
import type { WAMessage, WASession, WAPhoneLink, ExtractedVehicle, CommandContext } from './types';
import type { StagedImage } from './image-pipeline';
import type { WAButton } from './types';

// Restart keywords — user can type these in ANY state to reset
const RESTART_KEYWORDS = [
  'reiniciar', 'restart', 'reset', 'empezar', 'start over',
  '/reiniciar', '/restart', '/reset', '/nuevo', '/new',
];

// Watchdog: extraction sessions expire after 2 minutes (if function dies, session auto-resets)
const EXTRACTION_WATCHDOG_MS = 2 * 60 * 1000;
// Normal session expiry: 30 minutes of inactivity
const SESSION_EXPIRY_MS = 30 * 60 * 1000;
// Max photos per listing — soft cap, photos beyond this are silently ignored
const MAX_PHOTOS = 20;

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

  console.log(`[WA] ← ${message.type} from ...${normalizedPhone.slice(-4)} (id: ${message.id.slice(0, 10)})`);

  // Dedup: skip if this exact message was processed in the last 60 seconds
  const { data: alreadyProcessed } = await supabase
    .from('wa_message_log')
    .select('id')
    .eq('wa_message_id', message.id)
    .gte('created_at', new Date(Date.now() - 60_000).toISOString())
    .limit(1);

  if (alreadyProcessed && alreadyProcessed.length > 0) {
    console.log(`[WA] Dedup: skipping ${message.id.slice(0, 10)} (already processed)`);
    return;
  }

  // Mark message as read (best-effort)
  try { await markAsRead(waPhoneNumberId, message.id, accessToken); } catch { /* cosmetic — ignore */ }

  // 1. Lookup seller by phone number (normalized E.164)
  const { data: phoneLink, error: linkError } = await supabase
    .from('wa_phone_links')
    .select('*')
    .eq('phone_number', normalizedPhone)
    .single();

  if (!phoneLink) {
    console.log(`[WA] Phone not linked: ${normalizedPhone} (error: ${linkError?.message || 'not found'})`);
    const lang = detectLanguage(message);
    await safeSend(waPhoneNumberId, phoneNumber, templates.phoneNotLinkedMessage(lang), accessToken);
    await logMessage(null, message.id, 'inbound', message.type, normalizedPhone, getMessageContent(message), getMediaId(message), message);
    return;
  }

  const link = phoneLink as unknown as WAPhoneLink;
  const lang = link.language;

  console.log(`[WA] Seller found: ${link.seller_id.slice(0, 8)} lang=${lang}`);

  // 2. Handle unsupported message types early
  if (!['text', 'image', 'interactive', 'button'].includes(message.type)) {
    await safeSend(waPhoneNumberId, phoneNumber, templates.unsupportedMessageType(lang), accessToken);
    await logMessage(null, message.id, 'inbound', message.type, normalizedPhone, null, null, message);
    return;
  }

  // 3. Get or create session (handles expiry + watchdog auto-reset)
  const session = await getOrCreateSession(normalizedPhone, link, waPhoneNumberId);
  console.log(`[WA] Session: ${session.id.slice(0, 8)} state=${session.state}`);

  // 4. Log inbound message (with session_id + media_id for later retrieval)
  await logMessage(session.id, message.id, 'inbound', message.type, normalizedPhone, getMessageContent(message), getMediaId(message), message);

  // 5. Universal restart command — works in ANY state
  if (message.type === 'text' && message.text?.body) {
    const text = message.text.body.toLowerCase().trim();
    if (RESTART_KEYWORDS.includes(text)) {
      console.log(`[WA] Restart command detected in state=${session.state}`);
      try { await cleanupStagingImages(session.image_urls || []); } catch { /* best-effort */ }
      await resetSession(session.id);
      await safeSend(waPhoneNumberId, session.phone_number, templates.restartConfirmation(lang), accessToken);
      return;
    }
  }

  // 6. Route based on current state + message type
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
        await handleExtractingState(session, message, waPhoneNumberId, accessToken, link);
        break;

      case 'confirming':
        await handleConfirmingState(session, message, waPhoneNumberId, accessToken, link);
        break;

      case 'creating':
        if (message.type === 'text') {
          await safeSend(waPhoneNumberId, session.phone_number, templates.creatingMessage(lang), accessToken);
        }
        break;

      default:
        console.log(`[WA] Unknown state: ${session.state}, sending welcome`);
        await safeSend(waPhoneNumberId, session.phone_number, templates.welcomeMessage(lang), accessToken);
    }
  } catch (error) {
    console.error(`[WA] Error handling message for ${normalizedPhone}:`, error);
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

  // ── Image → vehicle creation flow (unchanged) ──
  if (message.type === 'image') {
    // Coming from error/complete → clean old listing data, keep current photo's log entry
    if (session.state === 'error' || session.state === 'complete') {
      await resetSession(session.id, message.id);
    }
    await updateSession(session.id, {
      state: 'collecting',
      image_urls: [],
      extracted_vehicle: null,
      missing_fields: [],
      vehicle_id: null,
      command_context: null,
    });

    // Send ack with current photo count from message log
    const photoCount = await getSessionMediaCount(session.id);
    console.log(`[WA] → Photo ack #${photoCount} (idle → collecting)`);
    await safeSend(waPhoneNumberId, session.phone_number, templates.photoReceived(lang, photoCount), accessToken);
    return;
  }

  // ── Text or button → command router first, then vehicle flow ──
  const textContent = getMessageContent(message) || '';
  const buttonActionId = getButtonActionId(message);

  // Check for active command_context or button action or text command
  const currentContext = session.command_context as CommandContext | null;

  // Try command router (handles sub-flows, slash commands, keywords, numbers, buttons)
  if (textContent || buttonActionId) {
    const result = await routeCommand(textContent, lang, link, currentContext, buttonActionId);

    if (result) {
      console.log(`[WA-CMD] Routed: "${textContent.substring(0, 30)}" → response`);
      // Update command_context in session
      await updateSession(session.id, {
        command_context: result.newContext !== undefined ? result.newContext : null,
      });

      // Send response
      if (result.buttons && result.buttons.length > 0) {
        await safeSendInteractive(waPhoneNumberId, session.phone_number, result.text, result.buttons, accessToken);
      } else {
        await safeSend(waPhoneNumberId, session.phone_number, result.text, accessToken);
      }
      return;
    }
  }

  // ── No command matched → check for photos in log (vehicle extraction flow) ──
  if (message.type === 'text') {
    const mediaIds = await getSessionMediaIds(session.id);
    if (mediaIds.length > 0) {
      console.log(`[WA] Text in idle but ${mediaIds.length} photos in log → triggering extraction`);
      // Clear command_context when entering vehicle flow
      await updateSession(session.id, { command_context: null });
      await triggerExtraction(session, mediaIds, message, waPhoneNumberId, accessToken, link);
      return;
    }

    // No photos, no command matched → text might be vehicle details arriving before photos
    // (WhatsApp sends text ~3s before forwarded photos). Text is already logged in wa_message_log.
    // Show brief ack instead of menu — if photos arrive next, extraction will include this text.
    console.log(`[WA] Text in idle, no photos, no command → brief ack (text saved for later extraction)`);
    await safeSend(waPhoneNumberId, session.phone_number, templates.textReceivedWaitingPhotos(lang), accessToken);
  }
}

// Custom ack schedule to avoid WhatsApp rate limit (131056) while keeping seller informed
// Ack at: 1, 5, 9, 13, then every 2 odd (15, 17, 19...)
function shouldAckPhoto(count: number): boolean {
  if (count === 1) return true;
  if (count < 5) return false;
  if (count === 5 || count === 9 || count === 13) return true;
  if (count > 13 && count % 2 === 1) return true;
  return false;
}

async function handleCollectingState(
  session: WASession,
  message: WAMessage,
  waPhoneNumberId: string,
  accessToken: string,
  link: WAPhoneLink
): Promise<void> {
  if (message.type === 'image') {
    const imageCount = await getSessionMediaCount(session.id);

    // Photo cap: at MAX_PHOTOS send notification, beyond that stay silent
    if (imageCount >= MAX_PHOTOS) {
      if (imageCount === MAX_PHOTOS) {
        console.log(`[WA] Photo cap reached (${MAX_PHOTOS}), notifying user`);
        await safeSend(waPhoneNumberId, session.phone_number, templates.maxImagesReached(link.language, MAX_PHOTOS), accessToken);
      } else {
        console.log(`[WA] Photo #${imageCount} over cap (silent)`);
      }
      return;
    }

    // Throttled acks: custom schedule (1, 5, 9, 13, then every 2 odd) to prevent rate limit
    // (1st photo ack comes from handleIdleState when transitioning idle → collecting)
    if (shouldAckPhoto(imageCount)) {
      console.log(`[WA] → Photo ack #${imageCount} (collecting, throttled)`);
      await safeSend(waPhoneNumberId, session.phone_number, templates.photoReceived(link.language, imageCount), accessToken);
    } else {
      console.log(`[WA] Photo #${imageCount} received (silent)`);
    }
    return;
  }

  if (message.type === 'text' && message.text?.body) {
    // Text triggers extraction — gather all media IDs from message log
    const mediaIds = await getSessionMediaIds(session.id);
    if (mediaIds.length === 0) {
      console.log(`[WA] Text received but 0 photos in log — sending welcome`);
      await safeSend(waPhoneNumberId, session.phone_number, templates.welcomeMessage(link.language), accessToken);
      return;
    }

    await triggerExtraction(session, mediaIds, message, waPhoneNumberId, accessToken, link);
  }
}

async function handleExtractingState(
  session: WASession,
  message: WAMessage,
  waPhoneNumberId: string,
  accessToken: string,
  link: WAPhoneLink
): Promise<void> {
  const lang = link.language;

  if (message.type === 'image') {
    // Photo during extraction — log silently (won't be in current extraction, avoids rate limit)
    const imageCount = await getSessionMediaCount(session.id);
    console.log(`[WA] Photo #${imageCount} during extraction (silent)`);
  } else if (message.type === 'text') {
    await safeSend(waPhoneNumberId, session.phone_number, templates.extractingMessage(lang), accessToken);
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
    try { await cleanupStagingImages(session.image_urls || []); } catch { /* best-effort */ }
    await resetSession(session.id, message.id);
    await updateSession(session.id, {
      state: 'collecting',
      image_urls: [],
      extracted_vehicle: null,
      missing_fields: [],
      vehicle_id: null,
    });
    const photoCount = await getSessionMediaCount(session.id);
    console.log(`[WA] New image in confirming → reset to collecting (${photoCount} photo)`);
    await safeSend(waPhoneNumberId, session.phone_number, templates.photoReceived(lang, photoCount), accessToken);
    return;
  }

  let action: string | null = null;

  // Check for button reply (interactive or legacy button)
  if (message.type === 'interactive' && message.interactive?.button_reply) {
    action = message.interactive.button_reply.id;
  } else if (message.type === 'button' && message.button?.payload) {
    action = message.button.payload;
  } else if (message.type === 'text' && message.text?.body) {
    const text = message.text.body.toLowerCase().trim();
    // Auto-fill keywords
    if (['auto', 'completar', 'rellenar', 'fill', 'autofill', 'auto completar', 'auto-completar', 'automatico'].includes(text)) {
      action = 'auto_fill';
    }
    // Publish keywords (catalog only)
    else if (['si', 'sí', 'yes', 'ok', 'crear', 'create', 'catalogo', 'catalog', 'publicar', 'publica', 'publish', '1'].includes(text)) {
      action = 'publish_catalog';
    }
    // Publish + FB keywords
    else if (['facebook', 'fb', 'ambos', 'both', '2', 'catalogo fb', 'catalog fb'].includes(text)) {
      action = 'publish_catalog_fb';
    }
    // Cancel keywords
    else if (['cancelar', 'cancel', 'no', '3'].includes(text)) {
      action = 'confirm_cancel';
    }
    // Everything else = field correction → re-extract
    else {
      action = 'field_correction';
    }
  }

  console.log(`[WA] Confirming action: ${action}`);

  switch (action) {
    case 'auto_fill': {
      // Run smart auto-fill on the extracted vehicle data
      const vehicleData = session.extracted_vehicle as unknown as Record<string, unknown>;
      if (!vehicleData) break;
      const { _staged_images: stagedImgs, _auto_filled: _, ...extractedFields } = vehicleData;
      const extracted = extractedFields as unknown as ExtractedVehicle;

      const { filled, autoFilledFields } = smartAutoFill(extracted);
      console.log(`[WA] Auto-filled ${autoFilledFields.length} fields: ${autoFilledFields.join(', ')}`);

      // Update session with auto-filled data
      await updateSession(session.id, {
        extracted_vehicle: { ...filled, _staged_images: stagedImgs, _auto_filled: autoFilledFields },
        missing_fields: [],
      });

      // Show smart confirmation with publish buttons
      const sellerHandle = await getSellerHandle(link.wallet_address);
      const sellerHasLoc = await checkSellerLocation(link.wallet_address);
      const { text, buttons } = templates.smartConfirmation(lang, filled, autoFilledFields, sellerHandle, !sellerHasLoc);
      await safeSendInteractive(waPhoneNumberId, session.phone_number, text, buttons, accessToken);
      break;
    }

    case 'publish_catalog':
      await createVehicleFlow(session, waPhoneNumberId, accessToken, link, false);
      break;

    case 'publish_catalog_fb':
      await createVehicleFlow(session, waPhoneNumberId, accessToken, link, true);
      break;

    case 'field_correction': {
      // Re-extract with updated text — gather all texts including this new one
      const mediaIds = await getSessionMediaIds(session.id);
      if (mediaIds.length > 0) {
        await triggerExtraction(session, mediaIds, message, waPhoneNumberId, accessToken, link);
      } else {
        await updateSession(session.id, { state: 'collecting' });
        await safeSend(waPhoneNumberId, session.phone_number, templates.editInstructionsMessage(lang), accessToken);
      }
      break;
    }

    case 'confirm_cancel':
      try { await cleanupStagingImages(session.image_urls || []); } catch { /* best-effort */ }
      await resetSession(session.id);
      await safeSend(waPhoneNumberId, session.phone_number, templates.welcomeMessage(lang), accessToken);
      break;

    default: {
      // Re-send the current confirmation
      const vd = session.extracted_vehicle as unknown as Record<string, unknown>;
      if (vd) {
        const { _staged_images: _si, _auto_filled: af, ...ef } = vd;
        const sellerHandle = await getSellerHandle(link.wallet_address);
        const autoFilled = (af as string[]) || [];
        const missing = session.missing_fields || [];

        if (missing.length > 0) {
          const { text, buttons } = templates.missingRequiredMessage(lang, ef as unknown as ExtractedVehicle, missing);
          await safeSendInteractive(waPhoneNumberId, session.phone_number, text, buttons, accessToken);
        } else {
          const hasLoc = await checkSellerLocation(link.wallet_address);
          const { text, buttons } = templates.smartConfirmation(lang, ef as unknown as ExtractedVehicle, autoFilled, sellerHandle, !hasLoc);
          await safeSendInteractive(waPhoneNumberId, session.phone_number, text, buttons, accessToken);
        }
      }
    }
  }
}

// ─────────────────────────────────────────────
// AI Extraction Pipeline
// ─────────────────────────────────────────────

/**
 * Trigger extraction: send smart acknowledgment, set watchdog expiry,
 * then run AI extraction pipeline SYNCHRONOUSLY.
 */
async function triggerExtraction(
  session: WASession,
  mediaIds: string[],
  textMessage: WAMessage | null,
  waPhoneNumberId: string,
  accessToken: string,
  link: WAPhoneLink
): Promise<void> {
  const lang = link.language;

  // Cap media IDs to MAX_PHOTOS (soft limit — extras were logged but not used)
  const cappedMediaIds = mediaIds.slice(0, MAX_PHOTOS);

  // Set state + SHORT expiry (watchdog). If function dies during extraction,
  // the session will auto-reset on the next message (expiry triggers reset).
  await updateSession(session.id, {
    state: 'extracting',
    expires_at: new Date(Date.now() + EXTRACTION_WATCHDOG_MS).toISOString(),
  });

  // Get text preview for the acknowledgment
  const textContent = textMessage?.text?.body || '';
  const ackMsg = templates.extractionStartMessage(lang, cappedMediaIds.length, textContent);
  await safeSend(waPhoneNumberId, session.phone_number, ackMsg, accessToken);

  // SYNCHRONOUS: must complete before Vercel kills the function
  await runExtraction(session, cappedMediaIds, waPhoneNumberId, accessToken, link);
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
    console.log(`[WA] Staging ${mediaIds.length} images from WhatsApp CDN...`);
    const { stageWhatsAppImages } = await import('./image-pipeline');

    const stagedImages = await stageWhatsAppImages(
      mediaIds,
      link.wallet_address,
      accessToken
    );

    if (stagedImages.length === 0) {
      console.error(`[WA] All image downloads failed — likely bad WHATSAPP_ACCESS_TOKEN`);
      await updateSessionState(session.id, 'error');
      await safeSend(waPhoneNumberId, session.phone_number, templates.errorMessage(lang), accessToken);
      return;
    }

    console.log(`[WA] Staged ${stagedImages.length}/${mediaIds.length} images successfully`);
    const imageUrls = stagedImages.map(img => img.public_url);

    // Keep buffers for inline GPT-4o analysis (avoids OpenAI download timeout from Supabase)
    const imageBuffers = stagedImages.map(img => img.buffer);

    // Store public URLs for reference (but free buffers from session — they live in local scope only)
    await updateSession(session.id, { image_urls: imageUrls });

    // Get all text messages from the message log (scoped to current listing)
    const textMessages = await getSessionTexts(session.id);
    console.log(`[WA] Running AI extraction with ${imageUrls.length} images (${imageBuffers.filter(Boolean).length} inline) + ${textMessages.length} texts`);

    // Run AI extraction with inline buffers (40s timeout — must finish before Vercel's 60s kill)
    const extracted = await extractVehicleData(imageUrls, textMessages, imageBuffers);
    console.log(`[WA] AI extracted: ${extracted.brand} ${extracted.model} ${extracted.year} $${extracted.price} ${extracted.mileage}mi`);

    // Smart reorder: sort images by AI-classified category for optimal catalog presentation
    const reorderedStaged = reorderStagedImages(stagedImages, extracted.image_order, MAX_EXTRACTION_IMAGES);

    // Strip buffers before saving to JSONB — buffers are not serializable
    const stagedForSession = reorderedStaged.map(({ buffer: _buf, ...rest }) => rest);

    // Check for missing required fields
    const missingRequired = findMissingFields(extracted);

    if (missingRequired.length > 0) {
      // Missing required fields → show what was found + offer auto-fill
      console.log(`[WA] Missing required: ${missingRequired.join(', ')}`);
      await updateSession(session.id, {
        state: 'confirming',
        extracted_vehicle: { ...extracted, _staged_images: stagedForSession },
        missing_fields: missingRequired,
        expires_at: new Date(Date.now() + SESSION_EXPIRY_MS).toISOString(), // Restore normal expiry
      });
      const { text, buttons } = templates.missingRequiredMessage(lang, extracted, missingRequired);
      await safeSendInteractive(waPhoneNumberId, session.phone_number, text, buttons, accessToken);
      return;
    }

    // All required fields present → auto-fill optional fields → show smart confirmation
    const { filled, autoFilledFields } = smartAutoFill(extracted);
    console.log(`[WA] Auto-filled ${autoFilledFields.length} optional fields: ${autoFilledFields.join(', ')}`);

    const sellerHandle = await getSellerHandle(link.wallet_address);
    const sellerHasLocation = await checkSellerLocation(link.wallet_address);
    await updateSession(session.id, {
      state: 'confirming',
      extracted_vehicle: { ...filled, _staged_images: stagedForSession, _auto_filled: autoFilledFields },
      missing_fields: [],
      expires_at: new Date(Date.now() + SESSION_EXPIRY_MS).toISOString(), // Restore normal expiry
    });

    const { text, buttons } = templates.smartConfirmation(lang, filled, autoFilledFields, sellerHandle, !sellerHasLocation);
    await safeSendInteractive(waPhoneNumberId, session.phone_number, text, buttons, accessToken);
  } catch (error) {
    console.error(`[WA] Extraction failed:`, error);
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

    // Separate staged images and auto-fill metadata from extraction data
    const stagedImages = (vehicleData._staged_images as StagedImage[]) || [];
    const { _staged_images: _, _auto_filled: _af, ...extractedFields } = vehicleData;
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

    console.log(`[WA] Creating vehicle: ${extracted.brand} ${extracted.model} ${extracted.year} with ${imagesToUse.length} images`);

    const result = await createVehicleFromExtraction(
      extracted,
      link.wallet_address,
      imagesToUse,
    );

    console.log(`[WA] Vehicle created: ${result.vehicleId} → ${result.catalogUrl}`);

    // Publish to Facebook if requested
    let fbPublished = false;
    if (publishToFb) {
      try {
        fbPublished = await tryPublishToFacebook(result.vehicleId, link);
        console.log(`[WA] FB publish: ${fbPublished ? 'success' : 'skipped (no connection)'}`);
      } catch (err) {
        console.error(`[WA] FB publish failed:`, err);
      }
    }

    // Send unified success message
    const successMsg = templates.vehiclePublishedMessage(lang, extracted, result.catalogUrl, publishToFb, fbPublished);
    await safeSend(waPhoneNumberId, session.phone_number, successMsg, accessToken);

    // Reset session — ready for next vehicle (NULL all old message log entries)
    await resetSession(session.id);
  } catch (error) {
    console.error(`[WA] Vehicle creation failed:`, error);
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

    // Check expiry — this also handles the extraction watchdog.
    // If extraction timed out (Vercel killed function), expires_at was set to 2 min.
    // After 2 min, the session auto-resets here.
    if (new Date(session.expires_at) < new Date()) {
      const wasExtracting = session.state === 'extracting';
      console.log(`[WA] Session expired (was state=${session.state}), resetting`);
      try { await cleanupStagingImages(session.image_urls || []); } catch { /* best-effort */ }
      await resetSession(session.id);
      session.state = 'idle';
      session.image_urls = [];
      session.extracted_vehicle = null;
      session.missing_fields = [];
      session.vehicle_id = null;

      // If the session was stuck in extracting, it was the watchdog that triggered
      if (wasExtracting) {
        console.log(`[WA] Watchdog auto-reset: extraction timed out`);
      }
    }

    // Extend expiry — but NOT for extracting/creating states (preserve watchdog)
    if (!['extracting', 'creating'].includes(session.state)) {
      await supabase
        .from('wa_sessions')
        .update({ expires_at: new Date(Date.now() + SESSION_EXPIRY_MS).toISOString() })
        .eq('id', session.id);
    }

    return session;
  }

  // No session exists — create new one (INSERT, not UPSERT)
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
      expires_at: new Date(Date.now() + SESSION_EXPIRY_MS).toISOString(),
    })
    .select('*')
    .single();

  if (error) {
    // Race condition: another handler created the session concurrently
    console.log(`[WA] Session insert race — fetching existing`);
    const { data: raceData } = await supabase
      .from('wa_sessions')
      .select('*')
      .eq('phone_number', phone)
      .single();

    if (raceData) return raceData as unknown as WASession;
    throw new Error(`Failed to create session: ${error.message}`);
  }

  console.log(`[WA] New session created: ${newData.id}`);
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

/**
 * Reset session for a new listing.
 * NULLs out old wa_message_log entries so the next listing starts with a clean
 * photo count. If keepMessageId is provided, that message is excluded (it's the
 * first message of the new listing, already logged with this session_id).
 */
async function resetSession(sessionId: string, keepMessageId?: string): Promise<void> {
  const supabase = getTypedClient();

  // Disassociate old message log entries from this session.
  // New listing messages will get this same session_id, but old ones won't pollute queries.
  if (keepMessageId) {
    await supabase
      .from('wa_message_log')
      .update({ session_id: null })
      .eq('session_id', sessionId)
      .neq('wa_message_id', keepMessageId);
  } else {
    await supabase
      .from('wa_message_log')
      .update({ session_id: null })
      .eq('session_id', sessionId);
  }

  // Reset session state
  await supabase
    .from('wa_sessions')
    .update({
      state: 'idle',
      image_media_ids: [],
      image_urls: [],
      raw_text_messages: [],
      extracted_vehicle: null,
      missing_fields: [],
      vehicle_id: null,
      command_context: null,
      expires_at: new Date(Date.now() + SESSION_EXPIRY_MS).toISOString(),
    })
    .eq('id', sessionId);
}

// ─────────────────────────────────────────────
// Message Log Queries (Source of Truth for Media)
// ─────────────────────────────────────────────

async function getSessionMediaIds(sessionId: string): Promise<string[]> {
  const supabase = getTypedClient();
  const { data } = await supabase
    .from('wa_message_log')
    .select('media_id')
    .eq('session_id', sessionId)
    .eq('direction', 'inbound')
    .not('media_id', 'is', null)
    .order('created_at', { ascending: true });

  return (data || []).map((row: { media_id: string }) => row.media_id);
}

async function getSessionMediaCount(sessionId: string): Promise<number> {
  const supabase = getTypedClient();
  const { count } = await supabase
    .from('wa_message_log')
    .select('id', { count: 'exact', head: true })
    .eq('session_id', sessionId)
    .eq('direction', 'inbound')
    .not('media_id', 'is', null);

  return count || 0;
}

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
    console.error('[WA] Failed to log message:', error);
  }
}

// ─────────────────────────────────────────────
// Send Helpers (with diagnostic logging)
// ─────────────────────────────────────────────

async function safeSend(
  phoneNumberId: string,
  to: string,
  text: string,
  token: string
): Promise<boolean> {
  try {
    await sendTextMessage(phoneNumberId, to, text, token);
    console.log(`[WA] → ...${to.slice(-4)}: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
    return true;
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`[WA] SEND FAILED to ${to}: ${errMsg}`);
    if (errMsg.includes('190') || errMsg.includes('auth') || errMsg.includes('token') || errMsg.includes('OAuthException')) {
      console.error(`[WA] TOKEN ISSUE — Check WHATSAPP_ACCESS_TOKEN env var in Vercel`);
    }
    return false;
  }
}

async function safeSendInteractive(
  phoneNumberId: string,
  to: string,
  bodyText: string,
  buttons: WAButton[],
  token: string
): Promise<boolean> {
  try {
    await sendInteractiveMessage(phoneNumberId, to, bodyText, buttons, token);
    console.log(`[WA] → ...${to.slice(-4)}: [buttons] "${bodyText.substring(0, 50)}..."`);
    return true;
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`[WA] INTERACTIVE SEND FAILED to ${to}: ${errMsg}`);
    if (errMsg.includes('190') || errMsg.includes('auth') || errMsg.includes('token') || errMsg.includes('OAuthException')) {
      console.error(`[WA] TOKEN ISSUE — Check WHATSAPP_ACCESS_TOKEN env var in Vercel`);
    }
    // Fallback: try sending as plain text
    console.log(`[WA] Falling back to plain text...`);
    return safeSend(phoneNumberId, to, bodyText, token);
  }
}

// ─────────────────────────────────────────────
// Smart Image Reordering
// ─────────────────────────────────────────────

const IMAGE_CATEGORY_PRIORITY: Record<string, number> = {
  exterior_front: 1,
  exterior_angle: 2,
  exterior_side: 3,
  exterior_rear: 4,
  interior_dashboard: 5,
  interior_seats: 6,
  interior_detail: 7,
  engine: 8,
  wheels_tires: 9,
  trunk: 10,
  document: 11,
  damage: 12,
  other: 13,
};

/**
 * Reorder staged images by AI-classified category for optimal catalog display.
 * Only the first `maxAnalyzed` images are classified by GPT-4o — the rest keep original order.
 * Fallback: any error → original order. NEVER throws.
 */
function reorderStagedImages(
  staged: StagedImage[],
  imageOrder: Array<{ index: number; category: string }> | undefined,
  maxAnalyzed: number
): StagedImage[] {
  if (!imageOrder || imageOrder.length === 0) return staged;

  try {
    const analyzed = staged.slice(0, maxAnalyzed);
    const rest = staged.slice(maxAnalyzed);

    const priorityMap = new Map<number, number>();
    for (const item of imageOrder) {
      if (item.index >= 0 && item.index < analyzed.length) {
        priorityMap.set(item.index, IMAGE_CATEGORY_PRIORITY[item.category] ?? 13);
      }
    }

    const sorted = analyzed
      .map((img, i) => ({ img, priority: priorityMap.get(i) ?? 13, i }))
      .sort((a, b) => a.priority - b.priority || a.i - b.i)
      .map(x => x.img);

    console.log(`[WA] Reordered ${sorted.length} images by AI classification`);
    return [...sorted, ...rest];
  } catch {
    console.warn('[WA] Image reorder failed, using original order');
    return staged;
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

function getButtonActionId(message: WAMessage): string | null {
  if (message.type === 'interactive' && message.interactive?.button_reply?.id) {
    return message.interactive.button_reply.id;
  }
  if (message.type === 'button' && message.button?.payload) {
    return message.button.payload;
  }
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

async function checkSellerLocation(walletAddress: string): Promise<boolean> {
  try {
    const supabase = getTypedClient();
    const { data } = await supabase
      .from('sellers')
      .select('city, state, latitude, longitude')
      .eq('wallet_address', walletAddress.toLowerCase())
      .single();
    if (!data) return false;
    const seller = data as Record<string, unknown>;
    // Has location if city+state are set, OR lat/lng are set
    return !!(seller.city && seller.state) || !!(seller.latitude && seller.longitude);
  } catch {
    return false;
  }
}
