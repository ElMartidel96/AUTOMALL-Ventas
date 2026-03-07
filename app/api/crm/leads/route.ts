/**
 * CRM Leads API
 *
 * GET  /api/crm/leads  — List leads with filtering/pagination
 * POST /api/crm/leads  — Create a new lead
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

export async function GET(req: NextRequest) {
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

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const source = searchParams.get('source');
  const interest = searchParams.get('interest_level');
  const search = searchParams.get('search');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
  const offset = (page - 1) * limit;

  const supabase = getTypedClient();

  let query = supabase
    .from('crm_leads')
    .select('*', { count: 'exact' })
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq('status', status);
  if (source) query = query.eq('source', source);
  if (interest) query = query.eq('interest_level', interest);
  if (search) {
    query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data: leads, count, error } = await query;

  if (error) {
    console.error('[CRM] Leads query error:', error.message);
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
  }

  return NextResponse.json({
    leads: leads || [],
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  });
}

export async function POST(req: NextRequest) {
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

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { name, phone, email, whatsapp, source, source_detail, vehicle_id, interest_level, status: leadStatus, notes, budget_min, budget_max } = body as {
    name?: string;
    phone?: string;
    email?: string;
    whatsapp?: string;
    source?: string;
    source_detail?: string;
    vehicle_id?: string;
    interest_level?: string;
    status?: string;
    notes?: string;
    budget_min?: number;
    budget_max?: number;
  };

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  const supabase = getTypedClient();
  const { data: lead, error } = await supabase
    .from('crm_leads')
    .insert({
      seller_id: sellerId,
      name: name.trim(),
      phone: phone || null,
      email: email || null,
      whatsapp: whatsapp || null,
      source: source || 'manual',
      source_detail: source_detail || null,
      vehicle_id: vehicle_id || null,
      interest_level: interest_level || 'warm',
      status: leadStatus || 'new',
      notes: notes || null,
      budget_min: budget_min ?? null,
      budget_max: budget_max ?? null,
    })
    .select()
    .single();

  if (error) {
    console.error('[CRM] Create lead error:', error.message);
    return NextResponse.json({ error: `Failed to create lead: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ lead }, { status: 201 });
}
