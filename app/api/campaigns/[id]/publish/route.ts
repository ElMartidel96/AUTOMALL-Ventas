/**
 * Campaign Publish — POST
 *
 * Publishes a campaign to Facebook.
 * Auth: x-wallet-address header → ownership verification
 * Idempotent: if already published, returns existing data.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTypedClient } from '@/lib/supabase/client';
import { FEATURE_CAMPAIGNS } from '@/lib/config/features';
import { publishToFacebook } from '@/lib/campaigns/campaign-service';

async function getSellerId(wallet: string) {
  const supabase = getTypedClient();
  const { data } = await supabase
    .from('sellers')
    .select('id')
    .eq('wallet_address', wallet.toLowerCase())
    .eq('is_active', true)
    .single();
  return (data as { id: string } | null)?.id ?? null;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!FEATURE_CAMPAIGNS) {
    return NextResponse.json({ error: 'Feature disabled' }, { status: 403 });
  }

  const wallet = req.headers.get('x-wallet-address');
  if (!wallet || !/^0x[a-fA-F0-9]{40}$/i.test(wallet)) {
    return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
  }

  const sellerId = await getSellerId(wallet);
  if (!sellerId) {
    return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
  }

  const { id } = await params;

  try {
    const result = await publishToFacebook(id, wallet);
    return NextResponse.json({
      success: true,
      fb_post_id: result.fbPostId,
      permalink: result.permalink,
      fb_ad_id: result.fbAdId,
      ad_status: result.adStatus,
      ad_message: result.adMessage,
    });
  } catch (err) {
    console.error('[API] POST /api/campaigns/[id]/publish error:', err);
    const msg = err instanceof Error ? err.message : 'Failed to publish campaign';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
