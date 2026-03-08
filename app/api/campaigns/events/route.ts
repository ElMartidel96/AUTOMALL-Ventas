/**
 * Campaign Event Tracking — POST
 *
 * Public endpoint (no auth). Rate-limited by IP.
 * Records landing page analytics: page_view, whatsapp_click, etc.
 */

import { NextRequest, NextResponse } from 'next/server';
import { trackCampaignEvent } from '@/lib/campaigns/campaign-service';
import type { CampaignEventType } from '@/lib/campaigns/types';

const VALID_EVENTS: CampaignEventType[] = [
  'page_view', 'vehicle_view', 'whatsapp_click',
  'phone_click', 'scroll_50', 'scroll_100',
];

// Simple in-memory rate limiter (10 req/min per IP)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return false;
  }

  entry.count++;
  if (entry.count > 10) return true;
  return false;
}

// Note: In serverless (Vercel), the map resets on cold starts.
// This provides per-instance rate limiting which is still useful for hot instances.

export async function POST(req: NextRequest) {
  // Clean stale entries on each request (lightweight, avoids setInterval in serverless)
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(ip);
  }
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'unknown';

  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Rate limited' }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const campaign_id = body.campaign_id as string | undefined;
  const event_type = body.event_type as CampaignEventType | undefined;

  if (!campaign_id || typeof campaign_id !== 'string') {
    return NextResponse.json({ error: 'campaign_id required' }, { status: 400 });
  }
  if (!event_type || !VALID_EVENTS.includes(event_type)) {
    return NextResponse.json({ error: 'Invalid event_type' }, { status: 400 });
  }

  // Simple IP hash (privacy-friendly)
  const encoder = new TextEncoder();
  const ipData = encoder.encode(ip + '_campaign_salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', ipData);
  const ipHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);

  // Fire-and-forget: don't block response for analytics
  trackCampaignEvent({
    campaign_id,
    event_type,
    vehicle_id: (body.vehicle_id as string) || null,
    session_id: (body.session_id as string) || null,
    utm_source: (body.utm_source as string) || null,
    utm_medium: (body.utm_medium as string) || null,
    utm_campaign: (body.utm_campaign as string) || null,
    ip_hash: ipHash,
  });

  return NextResponse.json({ ok: true });
}
