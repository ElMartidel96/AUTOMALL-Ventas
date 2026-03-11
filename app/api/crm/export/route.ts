/**
 * CRM Export API
 *
 * GET /api/crm/export — Download XLSX file of all deals + payments
 *
 * Header: x-wallet-address (required)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTypedClient } from '@/lib/supabase/client';
import { FEATURE_CRM } from '@/lib/config/features';
import { getDealsForExport } from '@/lib/crm/deal-service';
import { generateDealExcel } from '@/lib/crm/excel-generator';

async function getSellerId(wallet: string) {
  const supabase = getTypedClient();
  const { data } = await supabase
    .from('sellers')
    .select('id, name')
    .eq('wallet_address', wallet.toLowerCase())
    .eq('is_active', true)
    .single();
  return data ?? null;
}

export async function GET(req: NextRequest) {
  if (!FEATURE_CRM) {
    return NextResponse.json({ error: 'Feature disabled' }, { status: 403 });
  }

  const wallet = req.headers.get('x-wallet-address');
  if (!wallet || !/^0x[a-fA-F0-9]{40}$/i.test(wallet)) {
    return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
  }

  const seller = await getSellerId(wallet);
  if (!seller) {
    return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
  }

  try {
    const { deals, paymentsByDeal } = await getDealsForExport(seller.id);
    const buffer = await generateDealExcel(deals, paymentsByDeal, seller.name);

    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `AUTOMALL_Control_Ventas_${dateStr}.xlsx`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('[CRM] Export error:', err);
    return NextResponse.json({ error: 'Failed to generate export' }, { status: 500 });
  }
}
