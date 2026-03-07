/**
 * WhatsApp Webhook Signature Verification
 *
 * HMAC-SHA256 using META_APP_SECRET (same secret used by Facebook OAuth).
 */

import { createHmac } from 'crypto';

const META_APP_SECRET = process.env.META_APP_SECRET || '';

export function verifyWhatsAppSignature(
  rawBody: string,
  signatureHeader: string | null
): boolean {
  if (!signatureHeader || !META_APP_SECRET) return false;

  const expectedSignature = createHmac('sha256', META_APP_SECRET)
    .update(rawBody)
    .digest('hex');

  const providedSignature = signatureHeader.replace('sha256=', '');

  return expectedSignature === providedSignature;
}
