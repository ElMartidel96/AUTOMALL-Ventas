/**
 * CRM Lead Interactions API
 *
 * GET  /api/crm/leads/[id]/interactions  — List interactions for a lead
 * POST /api/crm/leads/[id]/interactions  — Add interaction to a lead
 *
 * Header: x-wallet-address (required)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTypedClient } from '@/lib/supabase/client';
import { FEATURE_CRM } from '@/lib/config/features';

async function getSellerId(wallet: string) {
  const supabase = getTypedClient();
  const { data } = await supabase
    .from('sellers')
    .select('id')
    .eq('wallet_address', wallet.toLowerCase())
    .eq('is_active', true)
    .single();
  return data?.id ?? null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!FEATURE_CRM) {
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

  const { id: leadId } = await params;

  const supabase = getTypedClient();

  // Verify lead ownership
  const { data: lead } = await supabase
    .from('crm_leads')
    .select('id')
    .eq('id', leadId)
    .eq('seller_id', sellerId)
    .single();

  if (!lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  const { data: interactions, error } = await supabase
    .from('crm_interactions')
    .select('*')
    .eq('lead_id', leadId)
    .order('interaction_at', { ascending: false });

  if (error) {
    console.error('[CRM] Interactions query error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch interactions' }, { status: 500 });
  }

  return NextResponse.json({ interactions: interactions || [] });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!FEATURE_CRM) {
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

  const { id: leadId } = await params;

  // Verify lead ownership
  const supabase = getTypedClient();
  const { data: lead } = await supabase
    .from('crm_leads')
    .select('id')
    .eq('id', leadId)
    .eq('seller_id', sellerId)
    .single();

  if (!lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { type, direction, summary, details, vehicle_id, fb_post_id } = body as {
    type?: string;
    direction?: string;
    summary?: string;
    details?: string;
    vehicle_id?: string;
    fb_post_id?: string;
  };

  if (!type || !summary) {
    return NextResponse.json({ error: 'type and summary are required' }, { status: 400 });
  }

  const { data: interaction, error } = await supabase
    .from('crm_interactions')
    .insert({
      lead_id: leadId,
      seller_id: sellerId,
      type,
      direction: direction || 'internal',
      summary,
      details: details || null,
      vehicle_id: vehicle_id || null,
      fb_post_id: fb_post_id || null,
    })
    .select()
    .single();

  if (error) {
    console.error('[CRM] Create interaction error:', error.message);
    return NextResponse.json({ error: `Failed to create interaction: ${error.message}` }, { status: 500 });
  }

  // Update last_contacted_at on the lead
  if (['call', 'whatsapp', 'email', 'sms', 'facebook_message'].includes(type)) {
    await supabase
      .from('crm_leads')
      .update({ last_contacted_at: new Date().toISOString() })
      .eq('id', leadId);
  }

  return NextResponse.json({ interaction }, { status: 201 });
}
