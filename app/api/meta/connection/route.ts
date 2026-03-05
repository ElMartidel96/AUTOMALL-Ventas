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
    });
  } catch (error) {
    console.error('[MetaConnection] Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
