/**
 * Vehicle Engagement Endpoint
 *
 * GET /api/meta/engagement/[vehicleId]
 * Header: x-wallet-address
 *
 * Returns engagement history for a specific vehicle's publications.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTypedClient } from '@/lib/supabase/client';
import { FEATURE_META_INTEGRATION } from '@/lib/config/features';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ vehicleId: string }> }
) {
  if (!FEATURE_META_INTEGRATION) {
    return NextResponse.json({ error: 'Feature disabled' }, { status: 403 });
  }

  const wallet = req.headers.get('x-wallet-address');
  if (!wallet || !/^0x[a-fA-F0-9]{40}$/i.test(wallet)) {
    return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
  }

  const { vehicleId } = await params;

  const supabase = getTypedClient();

  // Verify seller connection
  const { data: conn } = await supabase
    .from('seller_meta_connections')
    .select('id')
    .eq('wallet_address', wallet.toLowerCase())
    .eq('is_active', true)
    .single();

  if (!conn) {
    return NextResponse.json({ error: 'No active Meta connection' }, { status: 404 });
  }

  // Get publications for this vehicle
  const { data: publications } = await supabase
    .from('meta_publication_log')
    .select('id, fb_post_id, post_type, status, permalink_url, created_at')
    .eq('connection_id', conn.id)
    .eq('vehicle_id', vehicleId)
    .eq('status', 'published')
    .not('fb_post_id', 'is', null)
    .order('created_at', { ascending: false });

  if (!publications || publications.length === 0) {
    return NextResponse.json({ publications: [], engagement: {} });
  }

  // Get latest engagement for each publication
  const pubIds = publications.map((p: { id: string }) => p.id);
  const { data: snapshots } = await supabase
    .from('fb_post_engagement')
    .select('publication_id, likes_count, comments_count, shares_count, reactions_count, impressions, reach, clicks, engaged_users, fetched_at')
    .in('publication_id', pubIds)
    .order('fetched_at', { ascending: false });

  // Latest per publication
  const engagement: Record<string, {
    likes: number;
    comments: number;
    shares: number;
    reactions: number;
    impressions: number | null;
    reach: number | null;
    clicks: number | null;
    engaged_users: number | null;
    fetched_at: string;
  }> = {};

  interface SnapshotRow {
    publication_id: string;
    likes_count: number;
    comments_count: number;
    shares_count: number;
    reactions_count: number;
    impressions: number | null;
    reach: number | null;
    clicks: number | null;
    engaged_users: number | null;
    fetched_at: string;
  }

  for (const s of (snapshots || []) as SnapshotRow[]) {
    if (!engagement[s.publication_id]) {
      engagement[s.publication_id] = {
        likes: s.likes_count,
        comments: s.comments_count,
        shares: s.shares_count,
        reactions: s.reactions_count,
        impressions: s.impressions,
        reach: s.reach,
        clicks: s.clicks,
        engaged_users: s.engaged_users,
        fetched_at: s.fetched_at,
      };
    }
  }

  return NextResponse.json({ publications, engagement });
}
