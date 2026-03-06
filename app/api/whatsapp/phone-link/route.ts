/**
 * WhatsApp Phone Link API
 *
 * POST — Link/update seller's WhatsApp phone number
 * GET  — Get linked phone number for seller
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
    const { data } = await supabase
      .from('wa_phone_links')
      .select('*')
      .eq('wallet_address', wallet.toLowerCase())
      .single();

    return NextResponse.json({ success: true, data: data || null });
  } catch (error) {
    console.error('[WA-PhoneLink] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const wallet = request.headers.get('x-wallet-address');
    if (!wallet) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { phone_number, auto_activate, language } = body;

    if (!phone_number || !/^\+[1-9]\d{6,14}$/.test(phone_number)) {
      return NextResponse.json(
        { error: 'Valid E.164 phone number required (e.g. +13215551234)' },
        { status: 400 }
      );
    }

    const supabase = getTypedClient();
    const walletAddr = wallet.toLowerCase();

    // Get seller ID
    const { data: seller } = await supabase
      .from('sellers')
      .select('id')
      .eq('wallet_address', walletAddr)
      .eq('is_active', true)
      .single();

    if (!seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
    }

    // Upsert phone link
    const { data, error } = await supabase
      .from('wa_phone_links')
      .upsert({
        seller_id: (seller as Record<string, unknown>).id as string,
        wallet_address: walletAddr,
        phone_number,
        verified: true,
        auto_activate: auto_activate !== false,
        language: language || 'es',
      }, { onConflict: 'wallet_address' })
      .select('*')
      .single();

    if (error) {
      console.error('[WA-PhoneLink] Upsert error:', error);
      return NextResponse.json({ error: 'Failed to link phone' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[WA-PhoneLink] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
