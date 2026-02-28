/**
 * Meta Disconnect
 *
 * DELETE /api/meta/disconnect
 * Header: x-wallet-address
 *
 * Deactivates the seller's Meta connection (soft delete).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTypedClient } from '@/lib/supabase/client';
import { FEATURE_META_INTEGRATION } from '@/lib/config/features';

export async function DELETE(request: NextRequest) {
  if (!FEATURE_META_INTEGRATION) {
    return NextResponse.json({ error: 'Feature not enabled' }, { status: 404 });
  }

  const wallet = request.headers.get('x-wallet-address');
  if (!wallet || !/^0x[a-fA-F0-9]{40}$/i.test(wallet)) {
    return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
  }

  try {
    const supabase = getTypedClient();

    const { error } = await supabase
      .from('seller_meta_connections')
      .update({
        is_active: false,
        fb_page_access_token: '', // Clear token on disconnect
      })
      .eq('wallet_address', wallet.toLowerCase());

    if (error) {
      console.error('[MetaDisconnect] Error:', error);
      return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[MetaDisconnect] Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
