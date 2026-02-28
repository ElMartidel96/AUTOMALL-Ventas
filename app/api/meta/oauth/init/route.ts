/**
 * Meta OAuth Init
 *
 * GET /api/meta/oauth/init?wallet=0x...
 *
 * Generates Facebook OAuth URL and redirects the seller.
 * State parameter contains encrypted wallet + seller info.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTypedClient } from '@/lib/supabase/client';
import { buildOAuthUrl } from '@/lib/meta/facebook-api';
import { FEATURE_META_INTEGRATION } from '@/lib/config/features';

export async function GET(request: NextRequest) {
  if (!FEATURE_META_INTEGRATION) {
    return NextResponse.json({ error: 'Feature not enabled' }, { status: 404 });
  }

  const wallet = request.nextUrl.searchParams.get('wallet');
  if (!wallet || !/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
    return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
  }

  if (!process.env.META_APP_ID || !process.env.META_APP_SECRET) {
    return NextResponse.json({ error: 'Meta app not configured' }, { status: 503 });
  }

  try {
    const supabase = getTypedClient();

    // Find seller by wallet
    const { data: seller } = await supabase
      .from('sellers')
      .select('id')
      .eq('wallet_address', wallet.toLowerCase())
      .single();

    if (!seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
    }

    // Build state: base64(JSON) — contains wallet + seller_id + nonce
    const state = Buffer.from(
      JSON.stringify({
        wallet_address: wallet.toLowerCase(),
        seller_id: seller.id,
        timestamp: Date.now(),
        nonce: crypto.randomUUID(),
      })
    ).toString('base64url');

    const authUrl = buildOAuthUrl(state);

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('[MetaOAuth] Init error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
