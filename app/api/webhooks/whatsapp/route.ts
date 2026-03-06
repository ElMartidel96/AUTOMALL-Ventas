/**
 * WhatsApp Webhook — Incoming Messages
 *
 * GET  — Webhook verification (Meta sends once during setup)
 * POST — Incoming messages (text, image, interactive, etc.)
 *
 * Pattern: same as app/api/webhooks/discord/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
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

    // 3. Return 200 IMMEDIATELY (Meta requirement: <20 seconds)
    //    Process messages in the background after returning
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

    // Fire-and-forget: process each message
    for (const { phoneNumber, waPhoneNumberId, message } of messagesToProcess) {
      handleIncomingMessage(phoneNumber, waPhoneNumberId, message, WA_ACCESS_TOKEN)
        .catch((err) => {
          console.error(`[WA-Webhook] Error processing message from ${phoneNumber}:`, err);
        });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[WA-Webhook] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
