/**
 * Payment Reminders Cron
 *
 * GET /api/cron/payment-reminders — Vercel Cron (daily 8am CST)
 *
 * Sends WhatsApp message to each seller with today's payment collection list.
 * Includes overdue payments as urgent alerts.
 *
 * Auth: CRON_SECRET header (Vercel injects this automatically)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTypedClient } from '@/lib/supabase/client';
import { FEATURE_CRM } from '@/lib/config/features';
import { sendTextMessage } from '@/lib/whatsapp/api';

const LOG = '[PaymentCron]';

type SellerRow = { id: string; business_name: string | null; handle: string | null; whatsapp: string | null; phone: string | null };
type PaymentRow = { id: string; deal_id: string; payment_number: number; due_date: string; amount: number; status: string };
type DealRow = { id: string; client_name: string; client_phone: string | null; vehicle_brand: string; vehicle_model: string; deal_status: string };

export async function GET(req: NextRequest) {
  // Verify cron secret (Vercel sets this header for cron jobs)
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!FEATURE_CRM) {
    return NextResponse.json({ status: 'skipped', reason: 'CRM disabled' });
  }

  const waToken = process.env.WHATSAPP_TOKEN;
  const waPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!waToken || !waPhoneNumberId) {
    console.log(LOG, 'WhatsApp not configured, skipping reminders');
    return NextResponse.json({ status: 'skipped', reason: 'WhatsApp not configured' });
  }

  const supabase = getTypedClient();
  const today = new Date().toISOString().split('T')[0];

  try {
    // Get all active sellers with their WhatsApp numbers
    // Columns: id, handle, business_name, phone, whatsapp
    const { data: sellers } = await supabase
      .from('sellers')
      .select('id, business_name, handle, whatsapp, phone')
      .eq('is_active', true);

    if (!sellers || sellers.length === 0) {
      return NextResponse.json({ status: 'ok', message: 'No active sellers' });
    }

    let totalSent = 0;

    for (const seller of sellers) {
      // Seller needs a WhatsApp number to receive reminders
      const sellerWA = seller.whatsapp || seller.phone;
      if (!sellerWA) continue;

      // Get today's payments for this seller
      const { data: todayPayments } = await supabase
        .from('crm_payments')
        .select('id, deal_id, payment_number, due_date, amount, status')
        .eq('seller_id', seller.id)
        .eq('due_date', today)
        .in('status', ['pending', 'overdue']);

      // Get overdue payments
      const { data: overduePayments } = await supabase
        .from('crm_payments')
        .select('id, deal_id, payment_number, due_date, amount, status')
        .eq('seller_id', seller.id)
        .lt('due_date', today)
        .in('status', ['pending', 'overdue'])
        .order('due_date', { ascending: true })
        .limit(20);

      const todayList = (todayPayments ?? []) as PaymentRow[];
      const overdueList = (overduePayments ?? []) as PaymentRow[];
      const allPayments = [...overdueList, ...todayList];
      if (allPayments.length === 0) continue;

      // Get deal info for these payments
      const dealIds = [...new Set(allPayments.map(p => p.deal_id))];
      const { data: deals } = await supabase
        .from('crm_deals')
        .select('id, client_name, client_phone, vehicle_brand, vehicle_model, deal_status')
        .in('id', dealIds)
        .eq('deal_status', 'active');

      const dealsList = (deals ?? []) as DealRow[];
      const dealMap = new Map<string, DealRow>(dealsList.map(d => [d.id, d]));

      // Build message
      const overdueItems = overdueList
        .filter(p => dealMap.has(p.deal_id))
        .map(p => {
          const d = dealMap.get(p.deal_id)!;
          return `⚠️ *${d.client_name}* — $${Number(p.amount).toLocaleString()} (vencido ${p.due_date}) — ${d.vehicle_brand} ${d.vehicle_model}`;
        });

      const todayItems = todayList
        .filter(p => dealMap.has(p.deal_id))
        .map(p => {
          const d = dealMap.get(p.deal_id)!;
          const phone = d.client_phone ? ` (${d.client_phone})` : '';
          return `📌 *${d.client_name}*${phone} — $${Number(p.amount).toLocaleString()} — ${d.vehicle_brand} ${d.vehicle_model}`;
        });

      if (overdueItems.length === 0 && todayItems.length === 0) continue;

      const totalToday = todayList
        .filter(p => dealMap.has(p.deal_id))
        .reduce((s, p) => s + Number(p.amount), 0);
      const totalOverdue = overdueList
        .filter(p => dealMap.has(p.deal_id))
        .reduce((s, p) => s + Number(p.amount), 0);

      let msg = `🗓️ *COBROS DEL DÍA — ${today}*\n`;
      msg += `Hola ${seller.business_name || seller.handle || 'Vendedor'},\n\n`;

      if (overdueItems.length > 0) {
        msg += `🚨 *ATRASADOS (${overdueItems.length}):* $${totalOverdue.toLocaleString()}\n`;
        msg += overdueItems.join('\n') + '\n\n';
      }

      if (todayItems.length > 0) {
        msg += `📅 *HOY (${todayItems.length}):* $${totalToday.toLocaleString()}\n`;
        msg += todayItems.join('\n') + '\n\n';
      }

      msg += `💰 *Total por cobrar:* $${(totalToday + totalOverdue).toLocaleString()}\n`;
      msg += `\n_Responde "pagos" para ver tu calendario completo._`;

      try {
        await sendTextMessage(waPhoneNumberId, sellerWA, msg, waToken);
        totalSent++;
        console.log(LOG, `Reminder sent to seller ${seller.id} (${overdueItems.length} overdue, ${todayItems.length} today)`);
      } catch (sendErr) {
        console.error(LOG, `Failed to send to seller ${seller.id}:`, sendErr instanceof Error ? sendErr.message : sendErr);
      }
    }

    console.log(LOG, `Done. Sent ${totalSent} reminders.`);
    return NextResponse.json({ status: 'ok', sent: totalSent, date: today });
  } catch (err) {
    console.error(LOG, 'Cron error:', err);
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 });
  }
}
