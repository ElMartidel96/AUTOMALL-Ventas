/**
 * Meta Connection Status
 *
 * GET /api/meta/connection
 * Header: x-wallet-address
 *
 * Returns the current Meta connection state for the seller.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTypedClient } from '@/lib/supabase/client';
import { FEATURE_META_INTEGRATION } from '@/lib/config/features';

export async function GET(request: NextRequest) {
  if (!FEATURE_META_INTEGRATION) {
    return NextResponse.json({ error: 'Feature not enabled' }, { status: 404 });
  }

  const wallet = request.headers.get('x-wallet-address');
  if (!wallet || !/^0x[a-fA-F0-9]{40}$/i.test(wallet)) {
    return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
  }

  try {
    const supabase = getTypedClient();

    // Get connection
    const { data: connection } = await supabase
      .from('seller_meta_connections')
      .select('id, fb_page_id, fb_page_name, permissions, auto_publish_on_active, auto_publish_on_sold, include_price, include_hashtags, caption_language, is_active, connected_at, updated_at')
      .eq('wallet_address', wallet.toLowerCase())
      .single();

    if (!connection || !connection.is_active) {
      return NextResponse.json({ connected: false, connection: null });
    }

    // Get recent publication log
    const { data: recentPubs } = await supabase
      .from('meta_publication_log')
      .select('id, vehicle_id, post_type, fb_post_id, status, error_message, caption, created_at')
      .eq('connection_id', connection.id)
      .order('created_at', { ascending: false })
      .limit(10);

    // Build map of successfully published vehicles → fb_post_id
    const { data: publishedRows } = await supabase
      .from('meta_publication_log')
      .select('vehicle_id, fb_post_id')
      .eq('connection_id', connection.id)
      .eq('status', 'published')
      .not('fb_post_id', 'is', null)
      .order('created_at', { ascending: false });

    const publishedVehicles: Record<string, string> = {};
    for (const row of (publishedRows || [])) {
      if (!publishedVehicles[row.vehicle_id]) {
        publishedVehicles[row.vehicle_id] = row.fb_post_id!;
      }
    }

    // Get seller handle for feed URL
    const { data: seller } = await supabase
      .from('sellers')
      .select('handle')
      .eq('wallet_address', wallet.toLowerCase())
      .single();

    const domain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'autosmall.org';
    const feedUrl = seller?.handle
      ? `https://${domain}/api/feed/meta/${seller.handle}`
      : null;

    // Engagement summary — latest snapshot per published post
    let engagementSummary = null;
    const publishedPubIds = (publishedRows || []).map((r: { vehicle_id: string; fb_post_id: string }) => r.vehicle_id).length > 0
      ? (recentPubs || []).filter((p: { status: string }) => p.status === 'published').map((p: { id: string }) => p.id)
      : [];

    if (publishedPubIds.length > 0) {
      const { data: engSnapshots } = await supabase
        .from('fb_post_engagement')
        .select('publication_id, likes_count, comments_count, shares_count, reactions_count, fetched_at')
        .in('publication_id', publishedPubIds)
        .order('fetched_at', { ascending: false });

      if (engSnapshots && engSnapshots.length > 0) {
        // Latest per publication
        const latestByPub = new Map<string, { likes: number; comments: number; shares: number; reactions: number; vehicle_id: string; fb_post_id: string }>();
        for (const s of engSnapshots) {
          if (!latestByPub.has(s.publication_id)) {
            const pub = (recentPubs || []).find((p: { id: string }) => p.id === s.publication_id);
            latestByPub.set(s.publication_id, {
              likes: s.likes_count,
              comments: s.comments_count,
              shares: s.shares_count,
              reactions: s.reactions_count,
              vehicle_id: pub?.vehicle_id || '',
              fb_post_id: pub?.fb_post_id || '',
            });
          }
        }

        let totalLikes = 0, totalComments = 0, totalShares = 0, totalReactions = 0;
        let bestPost: { fb_post_id: string; vehicle_id: string; likes: number; comments: number; shares: number } | null = null;
        let bestTotal = 0;

        for (const [, v] of latestByPub) {
          totalLikes += v.likes;
          totalComments += v.comments;
          totalShares += v.shares;
          totalReactions += v.reactions;
          const postTotal = v.likes + v.comments + v.shares;
          if (postTotal > bestTotal) {
            bestTotal = postTotal;
            bestPost = { fb_post_id: v.fb_post_id, vehicle_id: v.vehicle_id, likes: v.likes, comments: v.comments, shares: v.shares };
          }
        }

        engagementSummary = {
          total_likes: totalLikes,
          total_comments: totalComments,
          total_shares: totalShares,
          total_reactions: totalReactions,
          total_posts: latestByPub.size,
          best_post: bestPost,
        };
      }
    }

    return NextResponse.json({
      connected: true,
      connection: {
        fb_page_name: connection.fb_page_name,
        auto_publish_on_active: connection.auto_publish_on_active,
        auto_publish_on_sold: connection.auto_publish_on_sold,
        include_price: connection.include_price,
        include_hashtags: connection.include_hashtags,
        caption_language: connection.caption_language,
        connected_at: connection.connected_at,
      },
      feedUrl,
      recentPublications: recentPubs || [],
      publishedVehicles,
      engagementSummary,
    });
  } catch (error) {
    console.error('[MetaConnection] Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
