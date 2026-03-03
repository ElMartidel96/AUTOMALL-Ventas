/**
 * Campaign CRUD API
 *
 * GET  /api/campaigns       — List campaigns for authenticated seller
 * POST /api/campaigns       — Create a new campaign
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTypedClient } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const wallet = request.nextUrl.searchParams.get('wallet');
    if (!wallet) {
      return NextResponse.json({ error: 'Missing wallet parameter' }, { status: 400 });
    }

    const supabase = getTypedClient();

    // Get seller
    const { data: seller } = await supabase
      .from('sellers')
      .select('id')
      .eq('wallet_address', wallet)
      .single();

    if (!seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
    }

    // Get campaigns with lead counts
    const { data: campaigns, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('seller_id', seller.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Campaigns] List error:', error);
      return NextResponse.json({ error: 'Failed to list campaigns' }, { status: 500 });
    }

    // Get lead counts per campaign
    const campaignIds = (campaigns || []).map((c: { id: string }) => c.id);
    let leadCounts: Record<string, number> = {};

    if (campaignIds.length > 0) {
      const { data: counts } = await supabase
        .from('campaign_leads')
        .select('campaign_id')
        .in('campaign_id', campaignIds);

      if (counts) {
        for (const row of counts as { campaign_id: string }[]) {
          leadCounts[row.campaign_id] = (leadCounts[row.campaign_id] || 0) + 1;
        }
      }
    }

    const result = (campaigns || []).map((c: Record<string, unknown>) => ({
      ...c,
      lead_count: leadCounts[c.id as string] || 0,
    }));

    return NextResponse.json({ campaigns: result });
  } catch (error) {
    console.error('[Campaigns] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { wallet_address, ...campaignData } = body;

    if (!wallet_address) {
      return NextResponse.json({ error: 'Missing wallet_address' }, { status: 400 });
    }

    const supabase = getTypedClient();

    // Get seller
    const { data: seller } = await supabase
      .from('sellers')
      .select('id, handle, whatsapp, phone')
      .eq('wallet_address', wallet_address)
      .single();

    if (!seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
    }

    // Create campaign
    const { data: campaign, error } = await supabase
      .from('campaigns')
      .insert({
        seller_id: seller.id,
        wallet_address,
        whatsapp_number: campaignData.whatsapp_number || seller.whatsapp || seller.phone || '',
        ...campaignData,
      })
      .select()
      .single();

    if (error) {
      console.error('[Campaigns] Create error:', error);
      return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
    }

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error) {
    console.error('[Campaigns] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
