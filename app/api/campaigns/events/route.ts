/**
 * Campaign Events API
 *
 * POST /api/campaigns/events — Track landing page events (public, no auth)
 *
 * Fire-and-forget event tracking for campaign landing pages.
 * Used to track page views, WhatsApp clicks, phone clicks, etc.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTypedClient } from '@/lib/supabase/client';

const VALID_EVENTS = [
  'page_view',
  'whatsapp_click',
  'phone_click',
  'vehicle_view',
  'share',
  'scroll_50',
  'scroll_100',
] as const;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      campaign_id,
      event_type,
      vehicle_id,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_content,
    } = body;

    if (!campaign_id || !event_type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!VALID_EVENTS.includes(event_type)) {
      return NextResponse.json({ error: 'Invalid event type' }, { status: 400 });
    }

    const supabase = getTypedClient();

    const referrer = request.headers.get('referer') || '';
    const userAgent = request.headers.get('user-agent') || '';

    // Fire and forget — don't wait for response
    supabase
      .from('campaign_events')
      .insert({
        campaign_id,
        event_type,
        vehicle_id: vehicle_id || null,
        referrer,
        user_agent: userAgent,
        utm_source: utm_source || null,
        utm_medium: utm_medium || null,
        utm_campaign: utm_campaign || null,
        utm_content: utm_content || null,
      })
      .then(() => {})
      .catch((err: unknown) => console.error('[CampaignEvents] Insert error:', err));

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true }); // Always return OK for tracking
  }
}
