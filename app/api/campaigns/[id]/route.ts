/**
 * Campaign by ID — GET / PATCH / DELETE
 *
 * Auth: x-wallet-address header → ownership verification
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTypedClient } from '@/lib/supabase/client';
import { FEATURE_CAMPAIGNS } from '@/lib/config/features';
import {
  getCampaignById,
  updateCampaign,
  deleteCampaign,
  getCampaignFullStats,
} from '@/lib/campaigns/campaign-service';
import type { CampaignType, CampaignStatus, CaptionLanguage } from '@/lib/campaigns/types';

const VALID_STATUSES: CampaignStatus[] = ['draft', 'active', 'paused', 'completed', 'archived'];
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

function validateWallet(req: NextRequest): string | null {
  const wallet = req.headers.get('x-wallet-address');
  if (!wallet || !/^0x[a-fA-F0-9]{40}$/i.test(wallet)) return null;
  return wallet;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!FEATURE_CAMPAIGNS) {
    return NextResponse.json({ error: 'Feature disabled' }, { status: 403 });
  }

  const wallet = validateWallet(req);
  if (!wallet) return NextResponse.json({ error: 'Invalid wallet' }, { status: 400 });

  const sellerId = await getSellerId(wallet);
  if (!sellerId) return NextResponse.json({ error: 'Seller not found' }, { status: 404 });

  const { id } = await params;
  const campaign = await getCampaignById(id, wallet);

  if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });

  // Include full stats if requested
  const includeStats = req.nextUrl.searchParams.get('stats') === 'true';
  if (includeStats) {
    try {
      const stats = await getCampaignFullStats(id, wallet);
      return NextResponse.json({ campaign, stats });
    } catch {
      // Stats fetch failed — return campaign without stats
      return NextResponse.json({ campaign, stats: null });
    }
  }

  return NextResponse.json({ campaign });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!FEATURE_CAMPAIGNS) {
    return NextResponse.json({ error: 'Feature disabled' }, { status: 403 });
  }

  const wallet = validateWallet(req);
  if (!wallet) return NextResponse.json({ error: 'Invalid wallet' }, { status: 400 });

  const sellerId = await getSellerId(wallet);
  if (!sellerId) return NextResponse.json({ error: 'Seller not found' }, { status: 404 });

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Whitelist safe fields
  const updates: Record<string, unknown> = {};

  if (body.name && typeof body.name === 'string') updates.name = body.name.trim();
  if (body.type && VALID_TYPES.includes(body.type as CampaignType)) updates.type = body.type;
  if (body.status && VALID_STATUSES.includes(body.status as CampaignStatus)) updates.status = body.status;
  if (Array.isArray(body.vehicle_ids)) updates.vehicle_ids = body.vehicle_ids;
  if (body.headline_en !== undefined) updates.headline_en = body.headline_en || null;
  if (body.headline_es !== undefined) updates.headline_es = body.headline_es || null;
  if (body.body_en !== undefined) updates.body_en = body.body_en || null;
  if (body.body_es !== undefined) updates.body_es = body.body_es || null;
  if (body.daily_budget_usd !== undefined) updates.daily_budget_usd = body.daily_budget_usd || null;
  if (body.total_budget_usd !== undefined) updates.total_budget_usd = body.total_budget_usd || null;
  if (body.start_date !== undefined) updates.start_date = body.start_date || null;
  if (body.end_date !== undefined) updates.end_date = body.end_date || null;
  if (body.caption_language && VALID_LANGS.includes(body.caption_language as CaptionLanguage)) updates.caption_language = body.caption_language;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  try {
    const campaign = await updateCampaign(id, wallet, updates);
    return NextResponse.json({ campaign });
  } catch (err) {
    console.error('[API] PATCH /api/campaigns/[id] error:', err);
    return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!FEATURE_CAMPAIGNS) {
    return NextResponse.json({ error: 'Feature disabled' }, { status: 403 });
  }

  const wallet = validateWallet(req);
  if (!wallet) return NextResponse.json({ error: 'Invalid wallet' }, { status: 400 });

  const sellerId = await getSellerId(wallet);
  if (!sellerId) return NextResponse.json({ error: 'Seller not found' }, { status: 404 });

  const { id } = await params;

  // Check if user wants to delete FB posts too
  const deleteFromFB = req.nextUrl.searchParams.get('deleteFromFB') === 'true';

  try {
    const result = await deleteCampaign(id, wallet, deleteFromFB);
    return NextResponse.json({ success: true, deletedPostsCount: result.deletedPostsCount });
  } catch (err) {
    console.error('[API] DELETE /api/campaigns/[id] error:', err);
    return NextResponse.json({ error: 'Failed to delete campaign' }, { status: 500 });
  }
}
