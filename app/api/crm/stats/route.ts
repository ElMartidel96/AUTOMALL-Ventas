/**
 * CRM Stats API
 *
 * GET /api/crm/stats — Pipeline counts, conversion rate, leads by source
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

  const supabase = getTypedClient();

  // Get all leads for this seller
  const { data: leads } = await supabase
    .from('crm_leads')
    .select('status, source, interest_level, created_at')
    .eq('seller_id', sellerId);

  const allLeads = leads || [];

  // Pipeline counts
  const pipeline: Record<string, number> = {
    new: 0,
    contacted: 0,
    qualified: 0,
    negotiating: 0,
    won: 0,
    lost: 0,
  };
  for (const lead of allLeads) {
    pipeline[lead.status] = (pipeline[lead.status] || 0) + 1;
  }

  // Leads by source
  const bySource: Record<string, number> = {};
  for (const lead of allLeads) {
    bySource[lead.source] = (bySource[lead.source] || 0) + 1;
  }

  // Interest level breakdown
  const byInterest: Record<string, number> = {
    hot: 0,
    warm: 0,
    cold: 0,
    lost: 0,
  };
  for (const lead of allLeads) {
    byInterest[lead.interest_level] = (byInterest[lead.interest_level] || 0) + 1;
  }

  // Conversion rate
  const total = allLeads.length;
  const won = pipeline.won || 0;
  const conversionRate = total > 0 ? Math.round((won / total) * 100) : 0;

  // New leads this week
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const newThisWeek = allLeads.filter(
    (l: { created_at: string }) => new Date(l.created_at) >= oneWeekAgo
  ).length;

  return NextResponse.json({
    total,
    pipeline,
    bySource,
    byInterest,
    conversionRate,
    newThisWeek,
  });
}
