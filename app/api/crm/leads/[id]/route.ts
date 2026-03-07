/**
 * CRM Lead Detail API
 *
 * GET    /api/crm/leads/[id]  — Get lead details
 * PATCH  /api/crm/leads/[id]  — Update lead
 * DELETE /api/crm/leads/[id]  — Delete lead
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

  const { id } = await params;

  const supabase = getTypedClient();
  const { data: lead, error } = await supabase
    .from('crm_leads')
    .select('*')
    .eq('id', id)
    .eq('seller_id', sellerId)
    .single();

  if (error || !lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  return NextResponse.json({ lead });
}

export async function PATCH(
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

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Only allow safe fields
  const allowed = ['name', 'phone', 'email', 'whatsapp', 'source', 'source_detail', 'vehicle_id', 'interest_level', 'status', 'notes', 'budget_min', 'budget_max', 'last_contacted_at', 'converted_at'];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) {
      updates[key] = body[key];
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  // If status changed to 'won', set converted_at
  if (updates.status === 'won' && !updates.converted_at) {
    updates.converted_at = new Date().toISOString();
  }

  const supabase = getTypedClient();
  const { data: lead, error } = await supabase
    .from('crm_leads')
    .update(updates)
    .eq('id', id)
    .eq('seller_id', sellerId)
    .select()
    .single();

  if (error) {
    console.error('[CRM] Update lead error:', error.message);
    return NextResponse.json({ error: `Failed to update: ${error.message}` }, { status: 500 });
  }

  if (!lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  return NextResponse.json({ lead });
}

export async function DELETE(
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

  const { id } = await params;

  const supabase = getTypedClient();
  const { error } = await supabase
    .from('crm_leads')
    .delete()
    .eq('id', id)
    .eq('seller_id', sellerId);

  if (error) {
    console.error('[CRM] Delete lead error:', error.message);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
