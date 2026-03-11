/**
 * CRM Deals API
 *
 * GET  /api/crm/deals  — List deals (paginated + filtered)
 * POST /api/crm/deals  — Create new deal
 *
 * Header: x-wallet-address (required)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTypedClient } from '@/lib/supabase/client';
import { FEATURE_CRM } from '@/lib/config/features';
import { listDeals, createDeal, convertLeadToDeal } from '@/lib/crm/deal-service';
import type { DealInsert, DealFilters, FinancingType, PaymentFrequency } from '@/lib/crm/types';

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
  const filters: DealFilters = {
    deal_status: (sp.get('deal_status') as DealFilters['deal_status']) || undefined,
    financing_type: (sp.get('financing_type') as DealFilters['financing_type']) || undefined,
    search: sp.get('search') || undefined,
    date_from: sp.get('date_from') || undefined,
    date_to: sp.get('date_to') || undefined,
    page: sp.get('page') ? parseInt(sp.get('page')!) : 1,
    limit: sp.get('limit') ? parseInt(sp.get('limit')!) : 20,
  };

  try {
    const result = await listDeals(sellerId, filters);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[CRM] List deals error:', err);
    return NextResponse.json({ error: 'Failed to list deals' }, { status: 500 });
  }
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

  // Validate required fields
  const { client_name, vehicle_brand, vehicle_model, vehicle_year, sale_price } = body;
  if (!client_name || !vehicle_brand || !vehicle_model || !vehicle_year || !sale_price) {
    return NextResponse.json(
      { error: 'Missing required fields: client_name, vehicle_brand, vehicle_model, vehicle_year, sale_price' },
      { status: 400 }
    );
  }

  const dealData: DealInsert = {
    client_name: String(client_name),
    vehicle_brand: String(vehicle_brand),
    vehicle_model: String(vehicle_model),
    vehicle_year: Number(vehicle_year),
    sale_price: Number(sale_price),
    lead_id: body.lead_id ? String(body.lead_id) : undefined,
    client_phone: body.client_phone ? String(body.client_phone) : undefined,
    client_email: body.client_email ? String(body.client_email) : undefined,
    client_whatsapp: body.client_whatsapp ? String(body.client_whatsapp) : undefined,
    referred_by: body.referred_by ? String(body.referred_by) : undefined,
    vehicle_id: body.vehicle_id ? String(body.vehicle_id) : undefined,
    vehicle_color: body.vehicle_color ? String(body.vehicle_color) : undefined,
    vehicle_vin: body.vehicle_vin ? String(body.vehicle_vin) : undefined,
    vehicle_mileage: body.vehicle_mileage ? Number(body.vehicle_mileage) : undefined,
    vehicle_trim: body.vehicle_trim ? String(body.vehicle_trim) : undefined,
    sale_date: body.sale_date ? String(body.sale_date) : undefined,
    down_payment: body.down_payment !== undefined ? Number(body.down_payment) : undefined,
    financing_type: (body.financing_type as FinancingType) || undefined,
    finance_company: body.finance_company ? String(body.finance_company) : undefined,
    num_installments: body.num_installments !== undefined ? Number(body.num_installments) : undefined,
    first_payment_date: body.first_payment_date ? String(body.first_payment_date) : undefined,
    payment_day: body.payment_day !== undefined ? Number(body.payment_day) : undefined,
    payment_frequency: (body.payment_frequency as PaymentFrequency) || undefined,
    installment_amount: body.installment_amount !== undefined ? Number(body.installment_amount) : undefined,
    gps_installed: body.gps_installed !== undefined ? Boolean(body.gps_installed) : undefined,
    commission: body.commission !== undefined ? Number(body.commission) : undefined,
    notes: body.notes ? String(body.notes) : undefined,
  };

  // Auto-populate from vehicle inventory if vehicle_id provided
  if (dealData.vehicle_id) {
    const supabase = getTypedClient();
    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('brand, model, year, color, vin, mileage, trim')
      .eq('id', dealData.vehicle_id)
      .single();
    if (vehicle) {
      if (!dealData.vehicle_brand || dealData.vehicle_brand === String(vehicle_brand)) {
        dealData.vehicle_brand = vehicle.brand;
      }
      if (!dealData.vehicle_model || dealData.vehicle_model === String(vehicle_model)) {
        dealData.vehicle_model = vehicle.model;
      }
      dealData.vehicle_year = dealData.vehicle_year || vehicle.year;
      dealData.vehicle_color = dealData.vehicle_color || vehicle.color || undefined;
      dealData.vehicle_vin = dealData.vehicle_vin || vehicle.vin || undefined;
      dealData.vehicle_mileage = dealData.vehicle_mileage || vehicle.mileage || undefined;
      dealData.vehicle_trim = dealData.vehicle_trim || vehicle.trim || undefined;
    }
  }

  try {
    const deal = body.lead_id
      ? await convertLeadToDeal(String(body.lead_id), sellerId, dealData)
      : await createDeal(sellerId, dealData);
    return NextResponse.json({ deal }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create deal';
    console.error('[CRM] Create deal error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
