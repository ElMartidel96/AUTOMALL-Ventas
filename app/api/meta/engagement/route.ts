/**
 * Engagement Sync Endpoint
 *
 * POST /api/meta/engagement
 * Header: x-wallet-address
 * Body: { vehicleId?: string }
 *
 * Fetches latest engagement from Graph API for published posts,
 * saves snapshots to fb_post_engagement, returns updated metrics.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTypedClient } from '@/lib/supabase/client';
import { FEATURE_META_INTEGRATION } from '@/lib/config/features';
import { fetchBatchEngagement } from '@/lib/meta/engagement-fetcher';

const STALE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

interface PublicationRow {
  id: string;
  vehicle_id: string;
  fb_post_id: string | null;
  created_at: string;
}

interface EngagementSnapshotRow {
  publication_id: string;
  fetched_at: string;
}

interface MetricsSnapshotRow {
  publication_id: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  reactions_count: number;
  fetched_at: string;
}

export async function POST(req: NextRequest) {
  if (!FEATURE_META_INTEGRATION) {
    return NextResponse.json({ error: 'Feature disabled' }, { status: 403 });
  }

  const wallet = req.headers.get('x-wallet-address');
  if (!wallet || !/^0x[a-fA-F0-9]{40}$/i.test(wallet)) {
    return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
  }

  let body: { vehicleId?: string } = {};
  try {
    body = await req.json();
  } catch {
    // Empty body is ok
  }

  const supabase = getTypedClient();

  // Get Meta connection
  const { data: conn } = await supabase
    .from('seller_meta_connections')
    .select('id, fb_page_id, fb_page_access_token')
    .eq('wallet_address', wallet.toLowerCase())
    .eq('is_active', true)
    .single();

  if (!conn) {
    return NextResponse.json({ error: 'No active Meta connection' }, { status: 404 });
  }

  // Get published posts (with fb_post_id)
  let query = supabase
    .from('meta_publication_log')
    .select('id, vehicle_id, fb_post_id, created_at')
    .eq('connection_id', conn.id)
    .eq('status', 'published')
    .not('fb_post_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(50);

  if (body.vehicleId) {
    query = query.eq('vehicle_id', body.vehicleId);
  }

  const { data: publications } = await query;

  if (!publications || publications.length === 0) {
    return NextResponse.json({ synced: 0, metrics: {} });
  }

  const pubs = publications as PublicationRow[];

  // Check staleness — get latest snapshot per publication
  const pubIds = pubs.map((p) => p.id);
  const { data: latestSnapshots } = await supabase
    .from('fb_post_engagement')
    .select('publication_id, fetched_at')
    .in('publication_id', pubIds)
    .order('fetched_at', { ascending: false });

  const latestByPub = new Map<string, string>();
  for (const s of (latestSnapshots || []) as EngagementSnapshotRow[]) {
    if (!latestByPub.has(s.publication_id)) {
      latestByPub.set(s.publication_id, s.fetched_at);
    }
  }

  // Filter to stale posts only
  const now = Date.now();
  const stalePosts = pubs.filter((pub) => {
    const lastFetch = latestByPub.get(pub.id);
    if (!lastFetch) return true;
    return now - new Date(lastFetch).getTime() > STALE_THRESHOLD_MS;
  });

  if (stalePosts.length === 0) {
    const metrics = await getCachedMetrics(supabase, pubIds);
    return NextResponse.json({ synced: 0, cached: true, metrics });
  }

  // Fetch from Graph API
  const postsToFetch = stalePosts.map((p) => ({
    fbPostId: p.fb_post_id!,
    publicationId: p.id,
  }));

  const engagementMap = await fetchBatchEngagement(
    postsToFetch,
    (conn as { fb_page_access_token: string }).fb_page_access_token
  );

  // Save snapshots
  const snapshots = [];
  for (const [pubId, eng] of engagementMap) {
    const post = stalePosts.find((p) => p.id === pubId);
    if (!post) continue;

    snapshots.push({
      publication_id: pubId,
      fb_post_id: post.fb_post_id!,
      likes_count: eng.likes_count,
      comments_count: eng.comments_count,
      shares_count: eng.shares_count,
      reactions_count: eng.reactions_count,
      impressions: eng.impressions ?? null,
      reach: eng.reach ?? null,
      clicks: eng.clicks ?? null,
      engaged_users: eng.engaged_users ?? null,
    });

    // Update permalink if found
    if (eng.permalink_url) {
      await supabase
        .from('meta_publication_log')
        .update({ permalink_url: eng.permalink_url })
        .eq('id', pubId);
    }
  }

  if (snapshots.length > 0) {
    await supabase.from('fb_post_engagement').insert(snapshots);
  }

  // Return fresh metrics
  const metrics = await getCachedMetrics(supabase, pubIds);
  return NextResponse.json({ synced: snapshots.length, metrics });
}

async function getCachedMetrics(supabase: ReturnType<typeof getTypedClient>, pubIds: string[]) {
  const { data: allSnapshots } = await supabase
    .from('fb_post_engagement')
    .select('publication_id, likes_count, comments_count, shares_count, reactions_count, fetched_at')
    .in('publication_id', pubIds)
    .order('fetched_at', { ascending: false });

  const metrics: Record<string, { likes: number; comments: number; shares: number; reactions: number }> = {};
  for (const s of (allSnapshots || []) as MetricsSnapshotRow[]) {
    if (!metrics[s.publication_id]) {
      metrics[s.publication_id] = {
        likes: s.likes_count,
        comments: s.comments_count,
        shares: s.shares_count,
        reactions: s.reactions_count,
      };
    }
  }
  return metrics;
}
