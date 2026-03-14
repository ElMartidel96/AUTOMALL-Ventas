/**
 * CRM Export API
 *
 * GET /api/crm/export — Download XLSX file of all deals + payments
 *
 * Auth: x-wallet-address header OR ?wallet= query param
 * (query param enables direct links from agent/WhatsApp)
 */

import { NextRequest, NextResponse } from 'next/server';
import { FEATURE_CRM } from '@/lib/config/features';

// Force dynamic — never cache this route
export const dynamic = 'force-dynamic';

const LOG = '[CRM Export]';

export async function GET(req: NextRequest) {
  console.log(LOG, 'Export request received');

  if (!FEATURE_CRM) {
    console.log(LOG, 'CRM feature disabled');
    return NextResponse.json({ error: 'Feature disabled' }, { status: 403 });
  }

  // Accept wallet from header OR query param (agent links use query param)
  const wallet = req.headers.get('x-wallet-address')
    || req.nextUrl.searchParams.get('wallet')
    || '';

  if (!wallet || !/^0x[a-fA-F0-9]{40}$/i.test(wallet)) {
    console.log(LOG, 'Invalid wallet:', wallet ? wallet.slice(0, 10) + '...' : 'EMPTY');
    return NextResponse.json(
      { error: 'Wallet address required. Use header x-wallet-address or ?wallet= query param.' },
      { status: 400 }
    );
  }

  console.log(LOG, 'Wallet:', wallet.slice(0, 10) + '...');

  try {
    // Dynamic imports — prevents webpack bundling issues with exceljs
    const { getTypedClient } = await import('@/lib/supabase/client');
    const supabase = getTypedClient();

    // Get seller info (columns: id, handle, business_name, phone, whatsapp)
    const { data: seller, error: sellerErr } = await supabase
      .from('sellers')
      .select('id, business_name, handle')
      .eq('wallet_address', wallet.toLowerCase())
      .eq('is_active', true)
      .single();

    if (sellerErr || !seller) {
      console.log(LOG, 'Seller not found:', sellerErr?.message || 'no row', 'wallet:', wallet.slice(0, 10));
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
    }

    const sellerName = seller.business_name || seller.handle || 'Seller';
    console.log(LOG, 'Seller found:', seller.id, sellerName);

    // Dynamic import of deal service and excel generator
    const { getDealsForExport } = await import('@/lib/crm/deal-service');
    const { generateDealExcel } = await import('@/lib/crm/excel-generator');

    const { deals, paymentsByDeal } = await getDealsForExport(seller.id);
    console.log(LOG, `Exporting ${deals.length} deals`);

    const buffer = await generateDealExcel(deals, paymentsByDeal, sellerName);
    console.log(LOG, `Generated XLSX: ${buffer.length} bytes`);

    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `AUTOMALL_Control_Ventas_${dateStr}.xlsx`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(LOG, 'Export failed:', message);
    return NextResponse.json({ error: 'Failed to generate export', details: message }, { status: 500 });
  }
}
