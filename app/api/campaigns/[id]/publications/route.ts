/**
 * Campaign Publications API
 *
 * GET /api/campaigns/[id]/publications
 * Query: ?wallet=0x...
 *
 * Returns Facebook publications linked to this campaign,
 * including engagement metrics if available.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTypedClient } from '@/lib/supabase/client';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, context: RouteContext) {
  const { id: campaignId } = await context.params;
  const wallet = req.nextUrl.searchParams.get('wallet');

  if (!wallet) {
    return NextResponse.json({ error: 'Missing wallet' }, { status: 400 });
  }

  const supabase = getTypedClient();

  // Verify campaign belongs to seller
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('id, fb_post_ids, fb_published_at, fb_publish_status')
    .eq('id', campaignId)
    .eq('wallet_address', wallet)
    .single();

  if (!campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  }

  // Get all publications linked to this campaign
  const { data: publications } = await supabase
    .from('meta_publication_log')
    .select('id, vehicle_id, post_type, fb_post_id, permalink_url, status, error_message, caption, image_urls, created_at')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: false });

  // Get engagement snapshots for published posts
  const pubIds = (publications || [])
    .filter((p: { status: string }) => p.status === 'published')
    .map((p: { id: string }) => p.id);

  let engagement: Record<string, { likes: number; comments: number; shares: number; reactions: number }> = {};

  if (pubIds.length > 0) {
    const { data: snapshots } = await supabase
      .from('fb_post_engagement')
      .select('publication_id, likes_count, comments_count, shares_count, reactions_count, fetched_at')
      .in('publication_id', pubIds)
      .order('fetched_at', { ascending: false });

    for (const s of (snapshots || []) as {
      publication_id: string;
      likes_count: number;
      comments_count: number;
      shares_count: number;
      reactions_count: number;
    }[]) {
      if (!engagement[s.publication_id]) {
        engagement[s.publication_id] = {
          likes: s.likes_count,
          comments: s.comments_count,
          shares: s.shares_count,
          reactions: s.reactions_count,
        };
      }
    }
  }

  // Get campaign events summary
  const { data: eventCounts } = await supabase
    .from('campaign_events')
    .select('event_type')
    .eq('campaign_id', campaignId);

  const eventSummary: Record<string, number> = {};
  for (const evt of (eventCounts || []) as { event_type: string }[]) {
    eventSummary[evt.event_type] = (eventSummary[evt.event_type] || 0) + 1;
  }

  return NextResponse.json({
    campaign: {
      fb_post_ids: (campaign as Record<string, unknown>).fb_post_ids,
      fb_published_at: (campaign as Record<string, unknown>).fb_published_at,
      fb_publish_status: (campaign as Record<string, unknown>).fb_publish_status,
    },
    publications: (publications || []).map((p: Record<string, unknown>) => ({
      ...p,
      engagement: engagement[p.id as string] || null,
    })),
    events: eventSummary,
  });
}
