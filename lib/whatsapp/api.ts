/**
 * WhatsApp Cloud API Client
 *
 * Send text, interactive (button), and image messages.
 * Download media from WhatsApp servers.
 * Uses native fetch — same pattern as lib/meta/facebook-api.ts.
 */

import type { WAMessageResponse, WAButton, WAMediaResponse } from './types';

const GRAPH_API = 'https://graph.facebook.com/v22.0';

/**
 * Extract a human-readable error message from Meta API error responses.
 * Meta returns: { error: { message: "...", type: "...", code: 123 } }
 */
function formatApiError(err: unknown, fallback: string): string {
  if (!err || typeof err !== 'object') return fallback;
  const e = err as Record<string, unknown>;
  if (e.error && typeof e.error === 'object') {
    const inner = e.error as Record<string, unknown>;
    return `${inner.message || fallback} (code: ${inner.code || '?'})`;
  }
  if (e.message) return String(e.message);
  return fallback;
}

// ─────────────────────────────────────────────
// Send Messages
// ─────────────────────────────────────────────

export async function sendTextMessage(
  phoneNumberId: string,
  to: string,
  text: string,
  token: string
): Promise<WAMessageResponse> {
  const url = `${GRAPH_API}/${phoneNumberId}/messages`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`WA send text failed: ${formatApiError(err, res.statusText)}`);
  }
  return res.json();
}

export async function sendInteractiveMessage(
  phoneNumberId: string,
  to: string,
  bodyText: string,
  buttons: WAButton[],
  token: string
): Promise<WAMessageResponse> {
  const url = `${GRAPH_API}/${phoneNumberId}/messages`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: bodyText },
        action: { buttons },
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`WA send interactive failed: ${formatApiError(err, res.statusText)}`);
  }
  return res.json();
}

export async function sendImageMessage(
  phoneNumberId: string,
  to: string,
  imageUrl: string,
  caption: string,
  token: string
): Promise<WAMessageResponse> {
  const url = `${GRAPH_API}/${phoneNumberId}/messages`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'image',
      image: { link: imageUrl, caption },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`WA send image failed: ${formatApiError(err, res.statusText)}`);
  }
  return res.json();
}

// ─────────────────────────────────────────────
// Media
// ─────────────────────────────────────────────

/** Get the download URL for a media ID */
export async function getMediaUrl(
  mediaId: string,
  token: string
): Promise<WAMediaResponse> {
  const url = `${GRAPH_API}/${mediaId}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`WA get media URL failed: ${formatApiError(err, res.statusText)}`);
  }
  return res.json();
}

/** Download media binary from WhatsApp CDN */
export async function downloadMedia(
  mediaUrl: string,
  token: string
): Promise<Buffer> {
  const res = await fetch(mediaUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`WA media download failed: ${res.statusText}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// ─────────────────────────────────────────────
// Read Receipts
// ─────────────────────────────────────────────

export async function markAsRead(
  phoneNumberId: string,
  messageId: string,
  token: string
): Promise<void> {
  const url = `${GRAPH_API}/${phoneNumberId}/messages`;

  await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId,
    }),
  });
}
