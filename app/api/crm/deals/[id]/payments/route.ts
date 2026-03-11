/**
 * CRM Deal Payments API
 *
 * GET   /api/crm/deals/[id]/payments  — List payments for a deal
 * PATCH /api/crm/deals/[id]/payments  — Record/update a payment
 *
 * Header: x-wallet-address (required)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTypedClient } from '@/lib/supabase/client';
import { FEATURE_CRM } from '@/lib/config/features';
import { listPayments, recordPayment } from '@/lib/crm/deal-service';
import type { PaymentStatus } from '@/lib/crm/types';

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

  try {
    const payments = await listPayments(id, sellerId);
    return NextResponse.json({ payments });
  } catch (err) {
    console.error('[CRM] List payments error:', err);
    return NextResponse.json({ error: 'Failed to list payments' }, { status: 500 });
  }
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

  const { id: dealId } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { payment_id, paid_amount, paid_date, status, payment_method, notes } = body;
  if (!payment_id) {
    return NextResponse.json({ error: 'payment_id is required' }, { status: 400 });
  }

  // Verify payment belongs to this deal
  const supabase = getTypedClient();
  const { data: paymentCheck } = await supabase
    .from('crm_payments')
    .select('id')
    .eq('id', String(payment_id))
    .eq('deal_id', dealId)
    .eq('seller_id', sellerId)
    .single();

  if (!paymentCheck) {
    return NextResponse.json({ error: 'Payment not found for this deal' }, { status: 404 });
  }

  try {
    const payment = await recordPayment(String(payment_id), sellerId, {
      paid_amount: paid_amount !== undefined ? Number(paid_amount) : undefined,
      paid_date: paid_date ? String(paid_date) : undefined,
      status: (status as PaymentStatus) || undefined,
      payment_method: payment_method ? String(payment_method) : undefined,
      notes: notes ? String(notes) : undefined,
    });
    return NextResponse.json({ payment });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to record payment';
    console.error('[CRM] Record payment error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
