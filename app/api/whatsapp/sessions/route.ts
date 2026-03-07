/**
 * WhatsApp Sessions API
 *
 * GET — List recent sessions for a seller
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTypedClient } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const wallet = request.headers.get('x-wallet-address');
    if (!wallet) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getTypedClient();

    const { data, error } = await supabase
      .from('wa_sessions')
      .select('id, state, image_urls, extracted_vehicle, vehicle_id, language, created_at, updated_at')
      .eq('wallet_address', wallet.toLowerCase())
      .order('updated_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('[WA-Sessions] Query error:', error);
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('[WA-Sessions] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
