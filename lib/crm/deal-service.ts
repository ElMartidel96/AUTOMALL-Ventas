/**
 * Deal Service — CRUD + payment schedule + financial stats
 *
 * Single interface to crm_deals / crm_payments tables.
 * Consumed by: API routes, WhatsApp handlers, MCP tools.
 */

import { getTypedClient } from '@/lib/supabase/client';
import type {
  CRMDeal, CRMPayment, DealInsert, DealUpdate,
  PaymentUpdate, DealStats, DealFilters,
} from './types';

const LOG = '[DealService]';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/** Escape PostgREST special chars in LIKE/ILIKE patterns */
function sanitizeSearch(input: string): string {
  return input
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_');
}

function addInterval(date: Date, frequency: string, n: number): Date {
  const d = new Date(date);
  switch (frequency) {
    case 'weekly':
      d.setDate(d.getDate() + (7 * n));
      break;
    case 'biweekly':
      d.setDate(d.getDate() + (14 * n));
      break;
    case 'monthly':
      d.setMonth(d.getMonth() + n);
      break;
  }
  return d;
}

// ─────────────────────────────────────────────
// List Deals (paginated + filtered)
// ─────────────────────────────────────────────

export async function listDeals(sellerId: string, filters: DealFilters = {}) {
  const supabase = getTypedClient();
  const page = filters.page || 1;
  const limit = Math.min(filters.limit || 20, 50);
  const offset = (page - 1) * limit;

  let query = supabase
    .from('crm_deals')
    .select('*', { count: 'exact' })
    .eq('seller_id', sellerId)
    .order('sale_date', { ascending: false });

  if (filters.deal_status) {
    query = query.eq('deal_status', filters.deal_status);
  }
  if (filters.financing_type) {
    query = query.eq('financing_type', filters.financing_type);
  }
  if (filters.search) {
    const safe = sanitizeSearch(filters.search);
    query = query.or(
      `client_name.ilike.%${safe}%,vehicle_brand.ilike.%${safe}%,vehicle_model.ilike.%${safe}%`
    );
  }
  if (filters.date_from) {
    query = query.gte('sale_date', filters.date_from);
  }
  if (filters.date_to) {
    query = query.lte('sale_date', filters.date_to);
  }

  query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;
  if (error) {
    console.error(LOG, 'listDeals error:', error.message);
    throw new Error(`Failed to list deals: ${error.message}`);
  }

  const total = count ?? 0;
  return {
    deals: (data ?? []) as CRMDeal[],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

// ─────────────────────────────────────────────
// Get Deal by ID (with payments)
// ─────────────────────────────────────────────

export async function getDealById(dealId: string, sellerId: string) {
  const supabase = getTypedClient();

  const { data: deal, error } = await supabase
    .from('crm_deals')
    .select('*')
    .eq('id', dealId)
    .eq('seller_id', sellerId)
    .single();

  if (error || !deal) return null;

  const { data: payments } = await supabase
    .from('crm_payments')
    .select('*')
    .eq('deal_id', dealId)
    .order('payment_number', { ascending: true });

  return {
    deal: deal as CRMDeal,
    payments: (payments ?? []) as CRMPayment[],
  };
}

// ─────────────────────────────────────────────
// Create Deal + Payment Schedule
// ─────────────────────────────────────────────

export async function createDeal(sellerId: string, data: DealInsert) {
  console.log(LOG, 'Creating deal for', data.client_name);
  const supabase = getTypedClient();

  const downPayment = data.down_payment || 0;
  const financingType = data.financing_type || 'cash';
  const numInstallments = financingType === 'cash' ? 0 : (data.num_installments || 0);

  const financedAmount = data.sale_price - downPayment;
  const installmentAmount = numInstallments > 0
    ? (data.installment_amount || Math.round((financedAmount / numInstallments) * 100) / 100)
    : null;

  const insert = {
    seller_id: sellerId,
    lead_id: data.lead_id || null,
    client_name: data.client_name,
    client_phone: data.client_phone || null,
    client_email: data.client_email || null,
    client_whatsapp: data.client_whatsapp || null,
    referred_by: data.referred_by || null,
    vehicle_id: data.vehicle_id || null,
    vehicle_brand: data.vehicle_brand,
    vehicle_model: data.vehicle_model,
    vehicle_year: data.vehicle_year,
    vehicle_color: data.vehicle_color || null,
    vehicle_vin: data.vehicle_vin || null,
    vehicle_mileage: data.vehicle_mileage || null,
    vehicle_trim: data.vehicle_trim || null,
    sale_date: data.sale_date || new Date().toISOString().split('T')[0],
    sale_price: data.sale_price,
    down_payment: downPayment,
    financing_type: financingType,
    finance_company: data.finance_company || null,
    num_installments: numInstallments,
    first_payment_date: data.first_payment_date || null,
    payment_day: data.payment_day || null,
    payment_frequency: data.payment_frequency || 'weekly',
    installment_amount: installmentAmount,
    total_collected: 0,
    outstanding_balance: financedAmount,
    deal_status: 'active' as const,
    gps_installed: data.gps_installed || false,
    commission: data.commission || 0,
    notes: data.notes || null,
  };

  // Cash sale: collected = full price, outstanding = 0
  if (financingType === 'cash') {
    insert.total_collected = data.sale_price;
    insert.outstanding_balance = 0;
  }

  const { data: deal, error } = await supabase
    .from('crm_deals')
    .insert(insert)
    .select()
    .single();

  if (error) {
    console.error(LOG, 'createDeal error:', error.message);
    throw new Error(`Failed to create deal: ${error.message}`);
  }

  // Generate payment schedule for financed deals
  if (numInstallments > 0 && installmentAmount && data.first_payment_date) {
    await generatePaymentSchedule(
      deal.id, sellerId, numInstallments, installmentAmount,
      data.first_payment_date, data.payment_frequency || 'weekly'
    );
  }

  // If lead_id provided, mark lead as 'won'
  if (data.lead_id) {
    await supabase
      .from('crm_leads')
      .update({ status: 'won', converted_at: new Date().toISOString() })
      .eq('id', data.lead_id)
      .eq('seller_id', sellerId);
  }

  console.log(LOG, 'Deal created:', deal.id);
  return deal as CRMDeal;
}

// ─────────────────────────────────────────────
// Generate Payment Schedule
// ─────────────────────────────────────────────

async function generatePaymentSchedule(
  dealId: string, sellerId: string,
  numInstallments: number, installmentAmount: number,
  firstPaymentDate: string, frequency: string
) {
  console.log(LOG, `Generating ${numInstallments} payments for deal ${dealId}`);
  const supabase = getTypedClient();
  const startDate = new Date(firstPaymentDate + 'T12:00:00');

  const payments = [];
  for (let i = 0; i < numInstallments; i++) {
    const dueDate = addInterval(startDate, frequency, i);
    payments.push({
      deal_id: dealId,
      seller_id: sellerId,
      payment_number: i + 1,
      due_date: dueDate.toISOString().split('T')[0],
      amount: installmentAmount,
      paid_amount: 0,
      status: 'pending',
    });
  }

  const { error } = await supabase.from('crm_payments').insert(payments);
  if (error) {
    console.error(LOG, 'generatePaymentSchedule error:', error.message);
  }
}

// ─────────────────────────────────────────────
// Update Deal
// ─────────────────────────────────────────────

export async function updateDeal(dealId: string, sellerId: string, data: DealUpdate) {
  const supabase = getTypedClient();

  const allowed = [
    'client_name', 'client_phone', 'client_email', 'client_whatsapp', 'referred_by',
    'vehicle_brand', 'vehicle_model', 'vehicle_year', 'vehicle_color', 'vehicle_vin',
    'vehicle_mileage', 'vehicle_trim',
    'sale_date', 'sale_price', 'down_payment',
    'financing_type', 'finance_company', 'num_installments', 'first_payment_date',
    'payment_day', 'payment_frequency', 'installment_amount',
    'deal_status', 'gps_installed', 'commission', 'notes',
  ];

  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in data) {
      updates[key] = (data as Record<string, unknown>)[key];
    }
  }

  if (Object.keys(updates).length === 0) {
    throw new Error('No valid fields to update');
  }

  // Auto-set completed_at when status changes to 'completed'
  if (updates.deal_status === 'completed') {
    updates.completed_at = new Date().toISOString();
  }

  // If sale_price or down_payment change, recalculate outstanding_balance
  if (updates.sale_price !== undefined || updates.down_payment !== undefined) {
    // Fetch current deal to merge values
    const { data: current } = await supabase
      .from('crm_deals')
      .select('sale_price, down_payment, total_collected, financing_type')
      .eq('id', dealId)
      .eq('seller_id', sellerId)
      .single();

    if (current) {
      const newSalePrice = Number(updates.sale_price ?? current.sale_price);
      const newDownPayment = Number(updates.down_payment ?? current.down_payment);
      const newFinancedAmount = newSalePrice - newDownPayment;
      const finType = (updates.financing_type as string) || current.financing_type;

      if (finType === 'cash') {
        updates.total_collected = newSalePrice;
        updates.outstanding_balance = 0;
      } else {
        updates.outstanding_balance = Math.max(newFinancedAmount - Number(current.total_collected), 0);
      }
    }
  }

  const { data: deal, error } = await supabase
    .from('crm_deals')
    .update(updates)
    .eq('id', dealId)
    .eq('seller_id', sellerId)
    .select()
    .single();

  if (error) {
    console.error(LOG, 'updateDeal error:', error.message);
    throw new Error(`Failed to update deal: ${error.message}`);
  }

  return deal as CRMDeal;
}

// ─────────────────────────────────────────────
// Delete Deal (cascade deletes payments)
// ─────────────────────────────────────────────

export async function deleteDeal(dealId: string, sellerId: string) {
  const supabase = getTypedClient();
  const { error } = await supabase
    .from('crm_deals')
    .delete()
    .eq('id', dealId)
    .eq('seller_id', sellerId);

  if (error) {
    console.error(LOG, 'deleteDeal error:', error.message);
    throw new Error(`Failed to delete deal: ${error.message}`);
  }
  return true;
}

// ─────────────────────────────────────────────
// List Payments for a Deal
// ─────────────────────────────────────────────

export async function listPayments(dealId: string, sellerId: string) {
  const supabase = getTypedClient();
  const { data, error } = await supabase
    .from('crm_payments')
    .select('*')
    .eq('deal_id', dealId)
    .eq('seller_id', sellerId)
    .order('payment_number', { ascending: true });

  if (error) {
    console.error(LOG, 'listPayments error:', error.message);
    throw new Error(`Failed to list payments: ${error.message}`);
  }

  return (data ?? []) as CRMPayment[];
}

// ─────────────────────────────────────────────
// Record Payment
// ─────────────────────────────────────────────

export async function recordPayment(paymentId: string, sellerId: string, data: PaymentUpdate) {
  const supabase = getTypedClient();

  const updates: Record<string, unknown> = {};
  if (data.paid_amount !== undefined) updates.paid_amount = data.paid_amount;
  if (data.paid_date !== undefined) updates.paid_date = data.paid_date;
  if (data.status !== undefined) updates.status = data.status;
  if (data.payment_method !== undefined) updates.payment_method = data.payment_method;
  if (data.notes !== undefined) updates.notes = data.notes;

  // Auto-set paid_date and paid_amount for 'paid' status
  if (updates.status === 'paid') {
    if (!updates.paid_date) updates.paid_date = new Date().toISOString().split('T')[0];
    // If no paid_amount specified, get the full amount
    if (updates.paid_amount === undefined) {
      const { data: payment } = await supabase
        .from('crm_payments')
        .select('amount')
        .eq('id', paymentId)
        .single();
      if (payment) updates.paid_amount = payment.amount;
    }
  }

  const { data: payment, error } = await supabase
    .from('crm_payments')
    .update(updates)
    .eq('id', paymentId)
    .eq('seller_id', sellerId)
    .select()
    .single();

  if (error) {
    console.error(LOG, 'recordPayment error:', error.message);
    throw new Error(`Failed to record payment: ${error.message}`);
  }

  // The DB trigger recalc_deal_totals handles updating the deal totals
  return payment as CRMPayment;
}

// ─────────────────────────────────────────────
// Deal Stats (financial aggregates)
// ─────────────────────────────────────────────

export async function getDealStats(sellerId: string): Promise<DealStats> {
  const supabase = getTypedClient();

  const { data: deals, error } = await supabase
    .from('crm_deals')
    .select('deal_status, sale_price, total_collected, outstanding_balance, sale_date')
    .eq('seller_id', sellerId);

  if (error) {
    console.error(LOG, 'getDealStats error:', error.message);
    throw new Error(`Failed to get stats: ${error.message}`);
  }

  const all = deals ?? [];
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

  let totalRevenue = 0, totalCollected = 0, totalOutstanding = 0;
  let active = 0, completed = 0, defaulted = 0, thisMonth = 0;

  for (const d of all) {
    totalRevenue += Number(d.sale_price);
    totalCollected += Number(d.total_collected);
    totalOutstanding += Number(d.outstanding_balance);
    if (d.deal_status === 'active') active++;
    if (d.deal_status === 'completed') completed++;
    if (d.deal_status === 'default') defaulted++;
    if (d.sale_date >= monthStart) thisMonth++;
  }

  // Count overdue payments
  const today = now.toISOString().split('T')[0];
  const { count: overdueCount } = await supabase
    .from('crm_payments')
    .select('*', { count: 'exact', head: true })
    .eq('seller_id', sellerId)
    .eq('status', 'pending')
    .lt('due_date', today);

  return {
    total_deals: all.length,
    active_deals: active,
    completed_deals: completed,
    defaulted_deals: defaulted,
    total_revenue: totalRevenue,
    total_collected: totalCollected,
    total_outstanding: totalOutstanding,
    avg_sale_price: all.length > 0 ? Math.round(totalRevenue / all.length) : 0,
    deals_this_month: thisMonth,
    overdue_payments: overdueCount ?? 0,
  };
}

// ─────────────────────────────────────────────
// Get All Deals for Export
// ─────────────────────────────────────────────

export async function getDealsForExport(sellerId: string) {
  const supabase = getTypedClient();

  const { data: deals, error } = await supabase
    .from('crm_deals')
    .select('*')
    .eq('seller_id', sellerId)
    .order('sale_date', { ascending: false });

  if (error) throw new Error(`Failed to get deals for export: ${error.message}`);

  // Get all payments for these deals
  const dealIds = (deals ?? []).map((d: CRMDeal) => d.id);
  let payments: CRMPayment[] = [];
  if (dealIds.length > 0) {
    const { data: pmts } = await supabase
      .from('crm_payments')
      .select('*')
      .in('deal_id', dealIds)
      .order('payment_number', { ascending: true });
    payments = (pmts ?? []) as CRMPayment[];
  }

  // Group payments by deal_id
  const paymentsByDeal = new Map<string, CRMPayment[]>();
  for (const p of payments) {
    const list = paymentsByDeal.get(p.deal_id) || [];
    list.push(p);
    paymentsByDeal.set(p.deal_id, list);
  }

  return {
    deals: (deals ?? []) as CRMDeal[],
    paymentsByDeal,
  };
}

// ─────────────────────────────────────────────
// Convert Lead to Deal
// ─────────────────────────────────────────────

export async function convertLeadToDeal(leadId: string, sellerId: string, dealData: DealInsert) {
  const supabase = getTypedClient();

  // Get lead data to auto-populate
  const { data: lead } = await supabase
    .from('crm_leads')
    .select('*')
    .eq('id', leadId)
    .eq('seller_id', sellerId)
    .single();

  if (!lead) throw new Error('Lead not found');

  // Merge lead data into deal (deal data takes priority)
  const merged: DealInsert = {
    ...dealData,
    lead_id: leadId,
    client_name: dealData.client_name || lead.name,
    client_phone: dealData.client_phone || lead.phone || undefined,
    client_email: dealData.client_email || lead.email || undefined,
    client_whatsapp: dealData.client_whatsapp || lead.whatsapp || undefined,
  };

  return createDeal(sellerId, merged);
}
