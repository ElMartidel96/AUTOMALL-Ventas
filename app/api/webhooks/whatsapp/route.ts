/**
 * WhatsApp Webhook — Incoming Messages
 *
 * GET  — Webhook verification (Meta sends once during setup)
 * POST — Incoming messages (text, image, interactive, etc.)
 *
 * Security: HMAC-SHA256 signature verification
 * Processing: SYNCHRONOUS — must await all processing before returning.
 *   Vercel serverless kills the function after response is sent,
 *   so fire-and-forget promises NEVER complete.
 */

import { NextRequest, NextResponse } from 'next/server';
import { FEATURE_WHATSAPP } from '@/lib/config/features';
import { verifyWhatsAppSignature } from '@/lib/whatsapp/verify';
import { handleIncomingMessage } from '@/lib/whatsapp/session-manager';
import type { WAWebhookPayload, WAMessage } from '@/lib/whatsapp/types';

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || '';
const WA_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || '';

// Allow up to 60s — extraction with GPT-4o Vision can take 30-45s
export const maxDuration = 60;

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

  // Diagnostic: surface config issues immediately
  if (!WA_ACCESS_TOKEN) {
    console.error('[WA-Webhook] WHATSAPP_ACCESS_TOKEN env var is MISSING — bot cannot send messages');
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

    // 3. Collect messages to process + log status updates (delivery failures)
    const messagesToProcess: Array<{
      phoneNumber: string;
      waPhoneNumberId: string;
      message: WAMessage;
    }> = [];

    for (const entry of payload.entry || []) {
      for (const change of entry.changes || []) {
        const value = change.value;

        // Log delivery status updates — critical for diagnosing silent delivery failures
        if (value?.statuses) {
          for (const s of value.statuses as Array<{ id?: string; status?: string; recipient_id?: string; errors?: Array<{ code?: number; title?: string }> }>) {
            if (s.status === 'failed' || s.errors?.length) {
              const errCodes = s.errors?.map(e => `${e.code}:${e.title}`).join(', ') || 'unknown';
              console.error(`[WA-STATUS] DELIVERY FAILED → msgId=${s.id?.slice(-8) || '?'}, to=${s.recipient_id?.slice(-4) || '?'}, errors=[${errCodes}]`);
            } else if (s.status === 'sent' || s.status === 'delivered' || s.status === 'read') {
              console.log(`[WA-STATUS] ${s.status} → msgId=${s.id?.slice(-8) || '?'}, to=${s.recipient_id?.slice(-4) || '?'}`);
            }
          }
        }

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

    // Diagnostic: log message count per webhook call
    if (messagesToProcess.length > 0) {
      console.log(`[WA-Webhook] ${messagesToProcess.length} message(s): ${messagesToProcess.map(m => `${m.message.type}:${m.message.id.slice(0,8)}`).join(', ')}`);
    }

    // 4. Process each message SYNCHRONOUSLY — must complete before returning.
    //    Vercel serverless kills the function after response, so fire-and-forget
    //    promises NEVER complete. Each webhook call typically has 1 message.
    for (const { phoneNumber, waPhoneNumberId, message } of messagesToProcess) {
      try {
        await handleIncomingMessage(phoneNumber, waPhoneNumberId, message, WA_ACCESS_TOKEN);
      } catch (err) {
        console.error(`[WA-Webhook] Error processing message from ${phoneNumber}:`, err);
      }
    }

    // 5. Return 200 after processing completes
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[WA-Webhook] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
