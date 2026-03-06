/**
 * WhatsApp Webhook — Incoming Messages
 *
 * GET  — Webhook verification (Meta sends once during setup)
 * POST — Incoming messages (text, image, interactive, etc.)
 *
 * Security: HMAC-SHA256 signature verification
 * Performance: Returns 200 immediately, processes async
 */

import { NextRequest, NextResponse } from 'next/server';
import { FEATURE_WHATSAPP } from '@/lib/config/features';
import { verifyWhatsAppSignature } from '@/lib/whatsapp/verify';
import { handleIncomingMessage } from '@/lib/whatsapp/session-manager';
import type { WAWebhookPayload, WAMessage } from '@/lib/whatsapp/types';

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || '';
const WA_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || '';

// Allow up to 30s for processing
export const maxDuration = 30;

// ─────────────────────────────────────────────
// GET — Webhook Verification
// ─────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === VERIFY_TOKEN && VERIFY_TOKEN) {
    console.log('[WA-Webhook] Verification successful');
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

// ─────────────────────────────────────────────
// POST — Incoming Messages
// ─────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // Feature flag check — accept webhook but don't process
  if (!FEATURE_WHATSAPP) {
    return NextResponse.json({ success: true });
  }

  try {
    const rawBody = await request.text();

    // 1. Verify HMAC-SHA256 signature
    const signature = request.headers.get('X-Hub-Signature-256');
    if (!verifyWhatsAppSignature(rawBody, signature)) {
      console.error('[WA-Webhook] Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // 2. Parse payload
    const payload: WAWebhookPayload = JSON.parse(rawBody);

    // 3. Collect messages to process (ignore status updates, read receipts, etc.)
    const messagesToProcess: Array<{
      phoneNumber: string;
      waPhoneNumberId: string;
      message: WAMessage;
    }> = [];

    for (const entry of payload.entry || []) {
      for (const change of entry.changes || []) {
        const value = change.value;
        if (!value?.messages) continue;

        const waPhoneNumberId = value.metadata.phone_number_id;

        for (const message of value.messages) {
          messagesToProcess.push({
            phoneNumber: message.from,
            waPhoneNumberId,
            message,
          });
        }
      }
    }

    // 4. Fire-and-forget: process each message
    for (const { phoneNumber, waPhoneNumberId, message } of messagesToProcess) {
      handleIncomingMessage(phoneNumber, waPhoneNumberId, message, WA_ACCESS_TOKEN)
        .catch((err) => {
          console.error(`[WA-Webhook] Error processing message from ${phoneNumber}:`, err);
        });
    }

    // 5. Return 200 immediately (Meta requirement: respond < 20 seconds)
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[WA-Webhook] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
