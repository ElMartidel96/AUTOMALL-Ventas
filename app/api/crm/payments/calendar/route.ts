/**
 * CRM Payment Calendar API
 *
 * GET /api/crm/payments/calendar — Get payments grouped by date
 *
 * Query params:
 *   view: 'today' | 'week' | 'overdue' | 'all' (default: 'all')
 *   from: YYYY-MM-DD (optional, for custom range)
 *   to:   YYYY-MM-DD (optional, for custom range)
 *
 * Header: x-wallet-address (required)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTypedClient } from '@/lib/supabase/client';
import { FEATURE_CRM } from '@/lib/config/features';

interface CalendarPayment {
  id: string;
  deal_id: string;
  payment_number: number;
  due_date: string;
  amount: number;
  paid_amount: number;
  paid_date: string | null;
  status: string;
  payment_method: string | null;
  client_name: string;
  client_phone: string | null;
  client_whatsapp: string | null;
  vehicle_brand: string;
  vehicle_model: string;
  vehicle_year: number;
  deal_status: string;
  installment_amount: number | null;
}

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

  const sp = req.nextUrl.searchParams;
  const view = sp.get('view') || 'all';
  const supabase = getTypedClient();

  // Calculate date ranges
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  // Get end of week (Sunday)
  const endOfWeek = new Date(now);
  endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));
  const weekEnd = endOfWeek.toISOString().split('T')[0];

  // 30 days ahead for "all" view
  const thirtyDaysAhead = new Date(now);
  thirtyDaysAhead.setDate(thirtyDaysAhead.getDate() + 30);
  const allEnd = thirtyDaysAhead.toISOString().split('T')[0];

  try {
    // ── Overdue payments (always included) ──
    const { data: overdueRaw, error: overdueErr } = await supabase
      .from('crm_payments')
      .select('id, deal_id, payment_number, due_date, amount, paid_amount, paid_date, status, payment_method')
      .eq('seller_id', sellerId)
      .in('status', ['pending', 'overdue'])
      .lt('due_date', today)
      .order('due_date', { ascending: true })
      .limit(100);

    if (overdueErr) throw new Error(overdueErr.message);

    // ── Today's payments ──
    const { data: todayRaw, error: todayErr } = await supabase
      .from('crm_payments')
      .select('id, deal_id, payment_number, due_date, amount, paid_amount, paid_date, status, payment_method')
      .eq('seller_id', sellerId)
      .eq('due_date', today)
      .order('status', { ascending: true })
      .limit(50);

    if (todayErr) throw new Error(todayErr.message);

    // ── Upcoming payments (based on view) ──
    let upcomingEnd = allEnd;
    if (view === 'today') upcomingEnd = today;
    else if (view === 'week') upcomingEnd = weekEnd;
    else if (sp.get('to')) upcomingEnd = sp.get('to')!;

    const fromDate = sp.get('from') || today;

    const { data: upcomingRaw, error: upcomingErr } = await supabase
      .from('crm_payments')
      .select('id, deal_id, payment_number, due_date, amount, paid_amount, paid_date, status, payment_method')
      .eq('seller_id', sellerId)
      .in('status', ['pending'])
      .gt('due_date', today)
      .lte('due_date', upcomingEnd)
      .order('due_date', { ascending: true })
      .limit(200);

    if (upcomingErr) throw new Error(upcomingErr.message);

    // Collect all unique deal IDs
    const allPayments = [...(overdueRaw ?? []), ...(todayRaw ?? []), ...(upcomingRaw ?? [])];
    const dealIds = [...new Set(allPayments.map(p => p.deal_id))];

    // Fetch deal info for all referenced deals
    let dealMap = new Map<string, { client_name: string; client_phone: string | null; client_whatsapp: string | null; vehicle_brand: string; vehicle_model: string; vehicle_year: number; deal_status: string; installment_amount: number | null }>();

    if (dealIds.length > 0) {
      const { data: deals } = await supabase
        .from('crm_deals')
        .select('id, client_name, client_phone, client_whatsapp, vehicle_brand, vehicle_model, vehicle_year, deal_status, installment_amount')
        .in('id', dealIds);

      for (const d of deals ?? []) {
        dealMap.set(d.id, {
          client_name: d.client_name,
          client_phone: d.client_phone,
          client_whatsapp: d.client_whatsapp,
          vehicle_brand: d.vehicle_brand,
          vehicle_model: d.vehicle_model,
          vehicle_year: d.vehicle_year,
          deal_status: d.deal_status,
          installment_amount: d.installment_amount,
        });
      }
    }

    // Enrich payments with deal info
    function enrichPayments(payments: typeof allPayments): CalendarPayment[] {
      return payments
        .filter(p => {
          const deal = dealMap.get(p.deal_id);
          return deal && deal.deal_status === 'active';
        })
        .map(p => {
          const deal = dealMap.get(p.deal_id)!;
          return {
            ...p,
            client_name: deal.client_name,
            client_phone: deal.client_phone,
            client_whatsapp: deal.client_whatsapp,
            vehicle_brand: deal.vehicle_brand,
            vehicle_model: deal.vehicle_model,
            vehicle_year: deal.vehicle_year,
            deal_status: deal.deal_status,
            installment_amount: deal.installment_amount,
          };
        });
    }

    // Deduplicate (today's entries might overlap with overdue/upcoming)
    const seenIds = new Set<string>();
    function dedup(payments: CalendarPayment[]): CalendarPayment[] {
      return payments.filter(p => {
        if (seenIds.has(p.id)) return false;
        seenIds.add(p.id);
        return true;
      });
    }

    const overdue = dedup(enrichPayments(overdueRaw ?? []));
    const todayPayments = dedup(enrichPayments(todayRaw ?? []));
    const upcoming = dedup(enrichPayments(upcomingRaw ?? []));

    // Summary stats
    const overdueTotal = overdue.reduce((sum, p) => sum + Number(p.amount), 0);
    const todayTotal = todayPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const upcomingTotal = upcoming.reduce((sum, p) => sum + Number(p.amount), 0);

    return NextResponse.json({
      date: today,
      view,
      overdue: { payments: overdue, total: overdueTotal, count: overdue.length },
      today: { payments: todayPayments, total: todayTotal, count: todayPayments.length },
      upcoming: { payments: upcoming, total: upcomingTotal, count: upcoming.length },
      summary: {
        total_due_today: todayTotal,
        total_overdue: overdueTotal,
        total_upcoming: upcomingTotal,
        overdue_count: overdue.length,
        today_count: todayPayments.length,
        upcoming_count: upcoming.length,
      },
    });
  } catch (err) {
    console.error('[CRM] Payment calendar error:', err);
    return NextResponse.json({ error: 'Failed to load payment calendar' }, { status: 500 });
  }
}
