/**
 * Campaigns API — GET (list) + POST (create)
 *
 * Auth: x-wallet-address header → seller_id ownership
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTypedClient } from '@/lib/supabase/client';
import { FEATURE_CAMPAIGNS } from '@/lib/config/features';
import { createCampaign, getCampaigns } from '@/lib/campaigns/campaign-service';
import type { CampaignType, CaptionLanguage } from '@/lib/campaigns/types';

const VALID_TYPES: CampaignType[] = ['inventory_showcase', 'seasonal_promo', 'clearance', 'financing', 'trade_in', 'custom'];
const VALID_LANGS: CaptionLanguage[] = ['en', 'es', 'both'];

async function getSellerId(wallet: string) {
  const supabase = getTypedClient();
  const { data } = await supabase
    .from('sellers')
    .select('id')
    .eq('wallet_address', wallet.toLowerCase())
    .eq('is_active', true)
    .single();
  return (data as { id: string } | null)?.id ?? null;
}

export async function GET(req: NextRequest) {
  if (!FEATURE_CAMPAIGNS) {
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

  try {
    const campaigns = await getCampaigns(wallet);
    return NextResponse.json({ campaigns });
  } catch (err) {
    console.error('[API] GET /api/campaigns error:', err);
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!FEATURE_CAMPAIGNS) {
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

  // Whitelist fields
  const name = body.name as string | undefined;
  const type = body.type as CampaignType | undefined;
  const vehicle_ids = body.vehicle_ids as string[] | undefined;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }
  if (!type || !VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: 'Invalid campaign type' }, { status: 400 });
  }
  if (!vehicle_ids || !Array.isArray(vehicle_ids) || vehicle_ids.length === 0) {
    return NextResponse.json({ error: 'At least one vehicle_id is required' }, { status: 400 });
  }
  if (vehicle_ids.length > 10) {
    return NextResponse.json({ error: 'Maximum 10 vehicles per campaign' }, { status: 400 });
  }

  const captionLang = body.caption_language as CaptionLanguage | undefined;

  try {
    const campaign = await createCampaign(wallet, {
      name: name.trim(),
      type,
      vehicle_ids,
      headline_en: (body.headline_en as string) || null,
      headline_es: (body.headline_es as string) || null,
      body_en: (body.body_en as string) || null,
      body_es: (body.body_es as string) || null,
      daily_budget_usd: typeof body.daily_budget_usd === 'number' ? body.daily_budget_usd : null,
      total_budget_usd: typeof body.total_budget_usd === 'number' ? body.total_budget_usd : null,
      start_date: (body.start_date as string) || null,
      end_date: (body.end_date as string) || null,
      caption_language: captionLang && VALID_LANGS.includes(captionLang) ? captionLang : 'both',
    });

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (err) {
    console.error('[API] POST /api/campaigns error:', err);
    const msg = err instanceof Error ? err.message : 'Failed to create campaign';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
