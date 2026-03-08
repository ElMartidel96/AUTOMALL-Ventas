/**
 * Campaign Service — Centralized Business Logic
 *
 * Shared between web API routes and WhatsApp agent handlers.
 * All DB operations use service_role via getTypedClient().
 * Auth verification is the caller's responsibility.
 */

import { getTypedClient } from '@/lib/supabase/client';
import {
  publishPhotoPost,
  uploadUnpublishedPhoto,
  publishCarouselPost,
} from '@/lib/meta/facebook-api';
import { buildFBCaption, generateAdCopy, buildLandingURL } from './ad-copy-generator';
import { getTemplate } from './campaign-templates';
import type {
  Campaign,
  CampaignInsert,
  CampaignUpdate,
  CampaignMetrics,
  PublicCampaignData,
  PublicVehicle,
  PublicSeller,
  CampaignEventInsert,
} from './types';
import type { VehicleForCopy } from './ad-copy-generator';
import type { MetaConnection, SellerForFeed } from '@/lib/meta/types';

const MAX_CAROUSEL_IMAGES = 10;

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function safeErrorMsg(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

async function getSellerByWallet(walletAddress: string): Promise<SellerForFeed | null> {
  const supabase = getTypedClient();
  const { data } = await supabase
    .from('sellers')
    .select('id, handle, business_name, phone, whatsapp, city, state, wallet_address')
    .eq('wallet_address', walletAddress.toLowerCase())
    .single();

  if (!data) return null;
  return {
    id: data.id,
    handle: data.handle,
    business_name: data.business_name || data.handle,
    phone: data.phone || null,
    whatsapp: data.whatsapp || null,
    city: data.city || null,
    state: data.state || null,
    wallet_address: data.wallet_address,
  } as SellerForFeed;
}

async function getSellerIdByWallet(walletAddress: string): Promise<string | null> {
  const supabase = getTypedClient();
  const { data } = await supabase
    .from('sellers')
    .select('id')
    .eq('wallet_address', walletAddress.toLowerCase())
    .eq('is_active', true)
    .single();
  return (data as { id: string } | null)?.id ?? null;
}

// ─────────────────────────────────────────────
// CRUD
// ─────────────────────────────────────────────

export async function createCampaign(
  walletAddress: string,
  input: Omit<CampaignInsert, 'seller_id' | 'wallet_address'>
): Promise<Campaign> {
  const sellerId = await getSellerIdByWallet(walletAddress);
  if (!sellerId) throw new Error('Seller not found');

  const seller = await getSellerByWallet(walletAddress);
  if (!seller) throw new Error('Seller not found');

  // Auto-generate ad copy if not provided
  const template = getTemplate(input.type);
  let headline_en = input.headline_en;
  let headline_es = input.headline_es;
  let body_en = input.body_en;
  let body_es = input.body_es;

  // If copy not provided, generate from vehicles
  if (!headline_en || !headline_es || !body_en || !body_es) {
    const vehicles = await getVehiclesForCopy(input.vehicle_ids);
    const tempSlug = input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const copy = generateAdCopy({
      campaignType: input.type,
      vehicles,
      seller,
      lang: input.caption_language || 'both',
      slug: tempSlug,
      customHeadlineEn: input.headline_en,
      customHeadlineEs: input.headline_es,
    });
    headline_en = headline_en || copy.headline_en;
    headline_es = headline_es || copy.headline_es;
    body_en = body_en || copy.body_en;
    body_es = body_es || copy.body_es;
  }

  const supabase = getTypedClient();
  const { data, error } = await supabase
    .from('campaigns')
    .insert({
      seller_id: sellerId,
      wallet_address: walletAddress.toLowerCase(),
      name: input.name,
      type: input.type,
      status: 'draft',
      vehicle_ids: input.vehicle_ids,
      headline_en,
      headline_es,
      body_en,
      body_es,
      cta_text_en: input.cta_text_en || 'Message on WhatsApp',
      cta_text_es: input.cta_text_es || 'Escribenos por WhatsApp',
      daily_budget_usd: input.daily_budget_usd || null,
      total_budget_usd: input.total_budget_usd || null,
      start_date: input.start_date || null,
      end_date: input.end_date || null,
      caption_language: input.caption_language || 'both',
      target_audience_notes: input.target_audience_notes
        || `Local only: ${seller.city || 'Houston'}, ${seller.state || 'TX'} — 25mi radius. No out-of-state leads.`,
    })
    .select('*')
    .single();

  if (error) throw new Error(`Failed to create campaign: ${error.message}`);
  return data as unknown as Campaign;
}

export async function getCampaigns(walletAddress: string): Promise<Campaign[]> {
  const supabase = getTypedClient();
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('wallet_address', walletAddress.toLowerCase())
    .in('status', ['draft', 'active', 'paused', 'completed'])
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch campaigns: ${error.message}`);
  return (data || []) as unknown as Campaign[];
}

export async function getCampaignById(
  id: string,
  walletAddress: string
): Promise<Campaign | null> {
  const supabase = getTypedClient();
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', id)
    .eq('wallet_address', walletAddress.toLowerCase())
    .single();

  if (error) return null;
  return data as unknown as Campaign;
}

export async function updateCampaign(
  id: string,
  walletAddress: string,
  updates: CampaignUpdate
): Promise<Campaign> {
  const supabase = getTypedClient();
  const { data, error } = await supabase
    .from('campaigns')
    .update(updates)
    .eq('id', id)
    .eq('wallet_address', walletAddress.toLowerCase())
    .select('*')
    .single();

  if (error) throw new Error(`Failed to update campaign: ${error.message}`);
  return data as unknown as Campaign;
}

export async function deleteCampaign(id: string, walletAddress: string): Promise<void> {
  const supabase = getTypedClient();
  const { error } = await supabase
    .from('campaigns')
    .update({ status: 'archived' })
    .eq('id', id)
    .eq('wallet_address', walletAddress.toLowerCase());

  if (error) throw new Error(`Failed to delete campaign: ${error.message}`);
}

// ─────────────────────────────────────────────
// Publish to Facebook
// ─────────────────────────────────────────────

export async function publishToFacebook(
  campaignId: string,
  walletAddress: string
): Promise<{ fbPostId: string | null; permalink: string | null }> {
  const supabase = getTypedClient();
  const wallet = walletAddress.toLowerCase();

  // 1. Get campaign
  const campaign = await getCampaignById(campaignId, walletAddress);
  if (!campaign) throw new Error('Campaign not found');

  // Idempotency: if already published, return existing data
  if (campaign.fb_publish_status === 'published' && campaign.fb_post_ids.length > 0) {
    return {
      fbPostId: campaign.fb_post_ids[0],
      permalink: campaign.fb_permalink_url,
    };
  }

  // 2. Get Meta connection
  const { data: connection } = await supabase
    .from('seller_meta_connections')
    .select('*')
    .eq('wallet_address', wallet)
    .eq('is_active', true)
    .single();

  if (!connection) throw new Error('Facebook not connected. Connect in your profile first.');
  const conn = connection as unknown as MetaConnection;

  // 3. Get seller + vehicles
  const seller = await getSellerByWallet(walletAddress);
  if (!seller) throw new Error('Seller not found');

  const vehicles = await getVehiclesForCopy(campaign.vehicle_ids);
  if (vehicles.length === 0) throw new Error('No vehicles found for this campaign');

  // 4. Mark as publishing (atomic)
  await supabase
    .from('campaigns')
    .update({ fb_publish_status: 'publishing' })
    .eq('id', campaignId)
    .eq('wallet_address', wallet);

  try {
    // 5. Build caption
    const caption = buildFBCaption({
      campaignType: campaign.type,
      vehicles,
      seller,
      lang: campaign.caption_language,
      slug: campaign.landing_slug || campaignId,
    });

    // 6. Get vehicle images
    const imageUrls = await getVehicleImageUrls(campaign.vehicle_ids);

    if (imageUrls.length === 0) {
      throw new Error('No vehicle images available. Add photos to your vehicles first.');
    }

    // 7. Publish to FB
    let fbPostId: string | null = null;

    if (imageUrls.length === 1) {
      const result = await publishPhotoPost(
        conn.fb_page_id,
        conn.fb_page_access_token,
        caption,
        imageUrls[0],
      );
      fbPostId = result.id || result.post_id || null;
    } else {
      const photoIds: string[] = [];
      for (const url of imageUrls.slice(0, MAX_CAROUSEL_IMAGES)) {
        const photo = await uploadUnpublishedPhoto(
          conn.fb_page_id,
          conn.fb_page_access_token,
          url,
        );
        photoIds.push(photo.id);
      }
      const result = await publishCarouselPost(
        conn.fb_page_id,
        conn.fb_page_access_token,
        caption,
        photoIds,
      );
      fbPostId = result.id || null;
    }

    const permalink = fbPostId ? `https://facebook.com/${fbPostId}` : null;

    // 8. Update campaign as published
    await supabase
      .from('campaigns')
      .update({
        fb_publish_status: 'published',
        fb_post_ids: fbPostId ? [fbPostId] : [],
        fb_published_at: new Date().toISOString(),
        fb_permalink_url: permalink,
        status: campaign.status === 'draft' ? 'active' : campaign.status,
      })
      .eq('id', campaignId);

    // 9. Log in meta_publication_log
    try {
      await supabase.from('meta_publication_log').insert({
        vehicle_id: campaign.vehicle_ids[0],
        seller_id: campaign.seller_id,
        connection_id: conn.id,
        post_type: 'campaign',
        fb_post_id: fbPostId,
        status: 'published',
        caption,
        image_urls: imageUrls,
        campaign_id: campaignId,
        permalink_url: permalink,
      });
    } catch (logErr) {
      console.error('[CampaignService] Failed to write publication log:', safeErrorMsg(logErr));
    }

    console.log(`[CampaignService] Published campaign ${campaignId} → FB post ${fbPostId}`);
    return { fbPostId, permalink };
  } catch (err) {
    // Rollback status on failure
    await supabase
      .from('campaigns')
      .update({ fb_publish_status: 'failed' })
      .eq('id', campaignId);

    console.error(`[CampaignService] Publish failed for ${campaignId}:`, safeErrorMsg(err));
    throw err;
  }
}

// ─────────────────────────────────────────────
// Metrics
// ─────────────────────────────────────────────

export async function getCampaignMetrics(campaignId: string): Promise<CampaignMetrics> {
  const supabase = getTypedClient();

  const { data: events } = await supabase
    .from('campaign_events')
    .select('event_type')
    .eq('campaign_id', campaignId);

  const metrics: CampaignMetrics = {
    page_views: 0,
    vehicle_views: 0,
    whatsapp_clicks: 0,
    phone_clicks: 0,
    total_leads: 0,
  };

  for (const e of (events || []) as { event_type: string }[]) {
    switch (e.event_type) {
      case 'page_view': metrics.page_views++; break;
      case 'vehicle_view': metrics.vehicle_views++; break;
      case 'whatsapp_click': metrics.whatsapp_clicks++; break;
      case 'phone_click': metrics.phone_clicks++; break;
    }
  }

  // Count leads linked to this campaign
  const { count } = await supabase
    .from('campaign_leads')
    .select('id', { count: 'exact', head: true })
    .eq('campaign_id', campaignId);

  metrics.total_leads = count || 0;

  return metrics;
}

// ─────────────────────────────────────────────
// Public data (for landing page)
// ─────────────────────────────────────────────

export async function getCampaignBySlug(slug: string): Promise<PublicCampaignData | null> {
  const supabase = getTypedClient();

  const { data: campaign } = await supabase
    .from('campaigns')
    .select('*')
    .eq('landing_slug', slug)
    .in('status', ['active', 'paused', 'draft'])
    .single();

  if (!campaign) return null;
  const c = campaign as unknown as Campaign;

  // Get vehicles
  const vehicles: PublicVehicle[] = [];
  if (c.vehicle_ids.length > 0) {
    const { data: vehicleData } = await supabase
      .from('vehicles')
      .select('id, year, brand, model, trim, price, mileage, exterior_color, transmission, condition')
      .in('id', c.vehicle_ids);

    for (const v of (vehicleData || []) as Array<{
      id: string; year: number; brand: string; model: string; trim: string | null;
      price: number; mileage: number | null; exterior_color: string | null;
      transmission: string | null; condition: string | null;
    }>) {
      // Get first image
      const { data: img } = await supabase
        .from('vehicle_images')
        .select('public_url')
        .eq('vehicle_id', v.id)
        .order('display_order', { ascending: true })
        .limit(1)
        .single();

      vehicles.push({
        id: v.id,
        year: v.year,
        brand: v.brand,
        model: v.model,
        trim: v.trim,
        price: v.price,
        mileage: v.mileage,
        exterior_color: v.exterior_color,
        transmission: v.transmission,
        condition: v.condition,
        image_url: (img as { public_url: string } | null)?.public_url || null,
      });
    }
  }

  // Get seller (public info only — no tokens, no wallet)
  const { data: sellerData } = await supabase
    .from('sellers')
    .select('handle, business_name, phone, whatsapp, city, state')
    .eq('id', c.seller_id)
    .single();

  const seller: PublicSeller = sellerData
    ? {
        handle: sellerData.handle,
        business_name: sellerData.business_name || sellerData.handle,
        phone: sellerData.phone || null,
        whatsapp: sellerData.whatsapp || null,
        city: sellerData.city || null,
        state: sellerData.state || null,
      }
    : { handle: 'dealer', business_name: 'Dealer', phone: null, whatsapp: null, city: null, state: null };

  return {
    id: c.id,
    name: c.name,
    type: c.type,
    headline_en: c.headline_en,
    headline_es: c.headline_es,
    body_en: c.body_en,
    body_es: c.body_es,
    cta_text_en: c.cta_text_en,
    cta_text_es: c.cta_text_es,
    landing_slug: c.landing_slug || slug,
    vehicles,
    seller,
  };
}

// ─────────────────────────────────────────────
// Events
// ─────────────────────────────────────────────

export async function trackCampaignEvent(event: CampaignEventInsert): Promise<void> {
  try {
    const supabase = getTypedClient();
    const { error } = await supabase.from('campaign_events').insert(event);
    if (error) {
      console.error('[CampaignService] Event tracking failed:', error.message, { campaign_id: event.campaign_id, event_type: event.event_type });
    }
  } catch (err) {
    console.error('[CampaignService] Event tracking exception:', safeErrorMsg(err));
  }
}

// ─────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────

async function getVehiclesForCopy(vehicleIds: string[]): Promise<VehicleForCopy[]> {
  if (vehicleIds.length === 0) return [];

  const supabase = getTypedClient();
  const { data } = await supabase
    .from('vehicles')
    .select('id, year, brand, model, trim, price, mileage, condition')
    .in('id', vehicleIds);

  if (!data) return [];

  const vehicles: VehicleForCopy[] = [];
  for (const v of data as Array<{
    id: string; year: number; brand: string; model: string;
    trim: string | null; price: number; mileage: number | null; condition: string | null;
  }>) {
    // Get first image for the vehicle
    const { data: img } = await supabase
      .from('vehicle_images')
      .select('public_url')
      .eq('vehicle_id', v.id)
      .order('display_order', { ascending: true })
      .limit(1)
      .single();

    vehicles.push({
      id: v.id,
      year: v.year,
      brand: v.brand,
      model: v.model,
      trim: v.trim,
      price: v.price,
      mileage: v.mileage,
      condition: v.condition,
      image_url: (img as { public_url: string } | null)?.public_url || null,
    });
  }

  return vehicles;
}

async function getVehicleImageUrls(vehicleIds: string[]): Promise<string[]> {
  if (vehicleIds.length === 0) return [];

  const supabase = getTypedClient();
  const urls: string[] = [];

  for (const vId of vehicleIds) {
    const { data: images } = await supabase
      .from('vehicle_images')
      .select('public_url')
      .eq('vehicle_id', vId)
      .order('display_order', { ascending: true })
      .limit(3); // Max 3 images per vehicle to keep carousel manageable

    for (const img of (images || []) as { public_url: string }[]) {
      urls.push(img.public_url);
      if (urls.length >= MAX_CAROUSEL_IMAGES) return urls;
    }
  }

  return urls;
}

/**
 * Quick stats for a seller's campaigns (used by WhatsApp menu).
 */
export async function getCampaignQuickStats(walletAddress: string): Promise<{
  active: number;
  total: number;
  leadsThisMonth: number;
}> {
  const supabase = getTypedClient();
  const wallet = walletAddress.toLowerCase();

  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('status')
    .eq('wallet_address', wallet)
    .in('status', ['draft', 'active', 'paused', 'completed']);

  const all = (campaigns || []) as { status: string }[];
  const active = all.filter(c => c.status === 'active').length;

  // Leads this month
  const sellerId = await getSellerIdByWallet(walletAddress);
  let leadsThisMonth = 0;
  if (sellerId) {
    const firstOfMonth = new Date();
    firstOfMonth.setDate(1);
    firstOfMonth.setHours(0, 0, 0, 0);

    const { count } = await supabase
      .from('campaign_leads')
      .select('id', { count: 'exact', head: true })
      .eq('seller_id', sellerId)
      .gte('created_at', firstOfMonth.toISOString());

    leadsThisMonth = count || 0;
  }

  return { active, total: all.length, leadsThisMonth };
}
