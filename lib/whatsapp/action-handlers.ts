/**
 * WhatsApp Action Handlers — DB queries + business logic
 *
 * Each handler fetches data from Supabase, formats the response,
 * and returns { text, buttons? } for the command router to send.
 *
 * Design: Direct DB queries (not via API routes) for speed + simplicity.
 * Auth is already verified in session-manager.ts (wa_phone_links → seller_id).
 */

import { getTypedClient } from '@/lib/supabase/client';
import type { WAPhoneLink, WAButton, CommandContext } from './types';
import * as ct from './command-templates';

type Lang = 'en' | 'es';

interface CommandResult {
  text: string;
  buttons?: WAButton[];
  newContext?: CommandContext | null;
}

// ─────────────────────────────────────────────
// Seller Lookup (shared)
// ─────────────────────────────────────────────

async function getSellerInfo(walletAddress: string) {
  const supabase = getTypedClient();
  const { data } = await supabase
    .from('sellers')
    .select('id, handle, business_name, phone, whatsapp, city, state, address, latitude, longitude')
    .eq('wallet_address', walletAddress.toLowerCase())
    .single();
  return data as {
    id: string; handle: string; business_name: string | null;
    phone: string | null; whatsapp: string | null;
    city: string | null; state: string | null;
    address: string | null;
    latitude: number | null; longitude: number | null;
  } | null;
}

async function getSellerId(walletAddress: string): Promise<string | null> {
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
// MENU
// ─────────────────────────────────────────────

export async function handleMenu(lang: Lang): Promise<CommandResult> {
  const { text, buttons } = ct.mainMenu(lang);
  return { text, buttons, newContext: null };
}

// ─────────────────────────────────────────────
// INVENTORY — List Vehicles
// ─────────────────────────────────────────────

const ITEMS_PER_PAGE = 5;

export async function handleListVehicles(
  lang: Lang,
  link: WAPhoneLink,
  page: number = 1,
  statusFilter: string = 'all'
): Promise<CommandResult> {
  const supabase = getTypedClient();
  const offset = (page - 1) * ITEMS_PER_PAGE;

  let query = supabase
    .from('vehicles')
    .select('id, year, brand, model, trim, price, status', { count: 'exact' })
    .eq('seller_address', link.wallet_address.toLowerCase())
    .order('created_at', { ascending: false })
    .range(offset, offset + ITEMS_PER_PAGE - 1);

  if (statusFilter !== 'all') {
    query = query.eq('status', statusFilter);
  } else {
    query = query.in('status', ['active', 'draft', 'sold']);
  }

  const { data: vehicles, count } = await query;

  const total = count || 0;
  const items = (vehicles || []) as Array<{
    id: string; year: number | null; brand: string | null;
    model: string | null; trim: string | null; price: number | null; status: string;
  }>;
  const hasMore = offset + ITEMS_PER_PAGE < total;

  const { text, buttons } = ct.vehicleList(lang, items, total, page, hasMore, statusFilter);

  // Store item IDs for number selection
  const itemIds = items.map(v => v.id);
  const newContext: CommandContext = {
    flow: 'list_vehicles',
    step: 1,
    data: { page, statusFilter, items: itemIds },
  };

  return { text, buttons, newContext };
}

// ─────────────────────────────────────────────
// INVENTORY — Vehicle Detail
// ─────────────────────────────────────────────

export async function handleVehicleDetail(
  lang: Lang,
  link: WAPhoneLink,
  vehicleId: string
): Promise<CommandResult> {
  const supabase = getTypedClient();
  const seller = await getSellerInfo(link.wallet_address);
  const handle = seller?.handle || 'dealer';

  const { data } = await supabase
    .from('vehicles')
    .select('id, year, brand, model, trim, price, mileage, exterior_color, transmission, condition, status, views_count, inquiries_count')
    .eq('id', vehicleId)
    .eq('seller_address', link.wallet_address.toLowerCase())
    .single();

  if (!data) {
    return { text: lang === 'es' ? 'Vehiculo no encontrado.' : 'Vehicle not found.', newContext: null };
  }

  const v = data as {
    id: string; year: number | null; brand: string | null; model: string | null;
    trim: string | null; price: number | null; mileage: number | null;
    exterior_color: string | null; transmission: string | null; condition: string | null;
    status: string; views_count: number; inquiries_count: number;
  };

  // Check if vehicle has FB posts
  let hasFBPosts = false;
  if (seller) {
    try {
      const { getVehicleFBPostCount } = await import('@/lib/campaigns/campaign-service');
      const fbCount = await getVehicleFBPostCount(vehicleId, seller.id);
      hasFBPosts = fbCount > 0;
    } catch {
      // Non-critical — default to false
    }
  }

  const { text, buttons } = ct.vehicleDetailCard(lang, { ...v, seller_handle: handle, has_fb_posts: hasFBPosts });

  const newContext: CommandContext = {
    flow: 'vehicle_detail',
    step: 1,
    data: { vehicleId: v.id, vehicleTitle: `${v.year} ${v.brand} ${v.model}` },
  };

  return { text, buttons, newContext };
}

// ─────────────────────────────────────────────
// INVENTORY — Change Price
// ─────────────────────────────────────────────

export async function handleChangePriceStart(
  lang: Lang,
  vehicleId: string,
  vehicleTitle: string,
  currentPrice: number | null
): Promise<CommandResult> {
  const text = ct.changePricePrompt(lang, vehicleTitle, currentPrice);
  const newContext: CommandContext = {
    flow: 'change_price',
    step: 1,
    data: { vehicleId, vehicleTitle },
  };
  return { text, newContext };
}

export async function handleChangePriceExecute(
  lang: Lang,
  link: WAPhoneLink,
  vehicleId: string,
  vehicleTitle: string,
  priceText: string
): Promise<CommandResult> {
  const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
  if (isNaN(price) || price <= 0 || price > 500000) {
    return {
      text: lang === 'es'
        ? 'Precio no valido. Escribe un numero entre 1 y 500,000.\nEj: 15000'
        : 'Invalid price. Type a number between 1 and 500,000.\nEx: 15000',
      newContext: { flow: 'change_price', step: 1, data: { vehicleId, vehicleTitle } },
    };
  }

  const supabase = getTypedClient();
  const { error } = await supabase
    .from('vehicles')
    .update({ price })
    .eq('id', vehicleId)
    .eq('seller_address', link.wallet_address.toLowerCase());

  if (error) {
    console.error('[WA-CMD] Price update error:', error.message);
    return { text: ct.commandError(lang, 'change_price'), newContext: null };
  }

  return { text: ct.priceUpdated(lang, vehicleTitle, price), newContext: null };
}

// ─────────────────────────────────────────────
// INVENTORY — Sell Vehicle
// ─────────────────────────────────────────────

export async function handleSellVehicle(
  lang: Lang,
  link: WAPhoneLink,
  vehicleId: string,
  vehicleTitle: string
): Promise<CommandResult> {
  const supabase = getTypedClient();
  const { error } = await supabase
    .from('vehicles')
    .update({ status: 'sold', sold_at: new Date().toISOString() })
    .eq('id', vehicleId)
    .eq('seller_address', link.wallet_address.toLowerCase())
    .eq('status', 'active');

  if (error) {
    console.error('[WA-CMD] Sell vehicle error:', error.message);
    return { text: ct.commandError(lang, 'sell'), newContext: null };
  }

  // Try publishing "sold" to Facebook
  let fbPublished = false;
  try {
    const { handleStatusChange } = await import('@/lib/meta/auto-publisher');
    await handleStatusChange({
      vehicleId,
      sellerAddress: link.wallet_address,
      oldStatus: 'active',
      newStatus: 'sold',
    });
    fbPublished = true;
  } catch {
    // FB publish is best-effort
  }

  return { text: ct.vehicleSold(lang, vehicleTitle, fbPublished), newContext: null };
}

// ─────────────────────────────────────────────
// INVENTORY — Activate Vehicle
// ─────────────────────────────────────────────

export async function handleActivateVehicle(
  lang: Lang,
  link: WAPhoneLink,
  vehicleId: string,
  vehicleTitle: string
): Promise<CommandResult> {
  const supabase = getTypedClient();
  const { error } = await supabase
    .from('vehicles')
    .update({ status: 'active', published_at: new Date().toISOString() })
    .eq('id', vehicleId)
    .eq('seller_address', link.wallet_address.toLowerCase())
    .eq('status', 'draft');

  if (error) {
    console.error('[WA-CMD] Activate vehicle error:', error.message);
    return { text: ct.commandError(lang, 'activate'), newContext: null };
  }

  return { text: ct.vehicleActivated(lang, vehicleTitle), newContext: null };
}

// ─────────────────────────────────────────────
// INVENTORY — Publish to Facebook
// ─────────────────────────────────────────────

export async function handlePublishFB(
  lang: Lang,
  link: WAPhoneLink,
  vehicleId: string,
  vehicleTitle: string
): Promise<CommandResult> {
  try {
    const supabase = getTypedClient();
    const { data: connection } = await supabase
      .from('seller_meta_connections')
      .select('id, is_active')
      .eq('wallet_address', link.wallet_address.toLowerCase())
      .eq('is_active', true)
      .single();

    if (!connection) {
      return { text: ct.fbPublishResult(lang, vehicleTitle, false), newContext: null };
    }

    const { handleStatusChange } = await import('@/lib/meta/auto-publisher');
    await handleStatusChange({
      vehicleId,
      sellerAddress: link.wallet_address,
      oldStatus: 'draft',
      newStatus: 'active',
      forcePublish: true,
    });

    return { text: ct.fbPublishResult(lang, vehicleTitle, true), newContext: null };
  } catch (err) {
    console.error('[WA-CMD] FB publish error:', err);
    return { text: ct.fbPublishResult(lang, vehicleTitle, false), newContext: null };
  }
}

// ─────────────────────────────────────────────
// CRM — List Leads
// ─────────────────────────────────────────────

export async function handleListLeads(
  lang: Lang,
  link: WAPhoneLink,
  page: number = 1
): Promise<CommandResult> {
  const sellerId = await getSellerId(link.wallet_address);
  if (!sellerId) {
    return { text: ct.commandError(lang, 'leads'), newContext: null };
  }

  const supabase = getTypedClient();
  const offset = (page - 1) * ITEMS_PER_PAGE;

  const { data: leads, count } = await supabase
    .from('crm_leads')
    .select('id, name, phone, source, interest_level, status', { count: 'exact' })
    .eq('seller_id', sellerId)
    .order('interest_level', { ascending: true }) // hot first
    .order('created_at', { ascending: false })
    .range(offset, offset + ITEMS_PER_PAGE - 1);

  const total = count || 0;
  const items = (leads || []) as Array<{
    id: string; name: string; phone: string | null;
    source: string | null; interest_level: string | null; status: string | null;
  }>;
  const hasMore = offset + ITEMS_PER_PAGE < total;

  const { text, buttons } = ct.leadList(lang, items, total, page, hasMore);

  const itemIds = items.map(l => l.id);
  const newContext: CommandContext = {
    flow: 'list_leads',
    step: 1,
    data: { page, items: itemIds },
  };

  return { text, buttons, newContext };
}

// ─────────────────────────────────────────────
// CRM — Create Lead (multi-step)
// ─────────────────────────────────────────────

export async function handleCreateLeadStep(
  lang: Lang,
  link: WAPhoneLink,
  step: number,
  data: Record<string, unknown>,
  userInput: string
): Promise<CommandResult> {
  switch (step) {
    case 0: {
      // Initial prompt — ask for name
      const text = ct.createLeadStep(lang, 1, data);
      return { text, newContext: { flow: 'create_lead', step: 1, data: {} } };
    }
    case 1: {
      // Got name → ask for phone
      const name = userInput.trim();
      if (name.length < 2) {
        return {
          text: lang === 'es' ? 'Nombre muy corto. Escribe el nombre del cliente:' : 'Name too short. Type the client\'s name:',
          newContext: { flow: 'create_lead', step: 1, data: {} },
        };
      }
      const text = ct.createLeadStep(lang, 2, { name });
      return { text, newContext: { flow: 'create_lead', step: 2, data: { name } } };
    }
    case 2: {
      // Got phone → ask for source
      const skip = ['saltar', 'skip', '-', 'no'].includes(userInput.toLowerCase().trim());
      const phone = skip ? null : userInput.trim();
      const newData = { ...data, phone };
      const text = ct.createLeadStep(lang, 3, newData);
      const buttons = ct.createLeadSourceButtons(lang);
      return {
        text,
        buttons,
        newContext: { flow: 'create_lead', step: 3, data: newData },
      };
    }
    case 3: {
      // Got source → create lead
      let source = 'manual';
      const lower = userInput.toLowerCase().trim();
      if (lower.includes('whatsapp') || lower === 'source_whatsapp') source = 'whatsapp';
      else if (lower.includes('facebook') || lower.includes('fb') || lower === 'source_facebook') source = 'facebook';

      const sellerId = await getSellerId(link.wallet_address);
      if (!sellerId) {
        return { text: ct.commandError(lang, 'create_lead'), newContext: null };
      }

      const supabase = getTypedClient();
      const { error } = await supabase
        .from('crm_leads')
        .insert({
          seller_id: sellerId,
          name: data.name as string,
          phone: data.phone as string | null,
          source,
          interest_level: 'warm',
          status: 'new',
        });

      if (error) {
        console.error('[WA-CMD] Create lead error:', error.message);
        return { text: ct.commandError(lang, 'create_lead'), newContext: null };
      }

      return { text: ct.leadCreated(lang, data.name as string), newContext: null };
    }
    default:
      return { text: ct.commandError(lang, 'create_lead'), newContext: null };
  }
}

// ─────────────────────────────────────────────
// STATISTICS
// ─────────────────────────────────────────────

export async function handleStats(lang: Lang, link: WAPhoneLink): Promise<CommandResult> {
  const supabase = getTypedClient();
  const wallet = link.wallet_address.toLowerCase();

  // Inventory counts by status
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('status')
    .eq('seller_address', wallet);

  const inv = { active: 0, sold: 0, draft: 0, archived: 0, total: 0 };
  for (const v of (vehicles || []) as { status: string }[]) {
    inv.total++;
    if (v.status in inv) (inv as Record<string, number>)[v.status]++;
  }

  // Leads counts
  const sellerId = await getSellerId(link.wallet_address);
  const leads = { total: 0, hot: 0, warm: 0, cold: 0 };
  if (sellerId) {
    const { data: allLeads } = await supabase
      .from('crm_leads')
      .select('interest_level')
      .eq('seller_id', sellerId);

    for (const l of (allLeads || []) as { interest_level: string }[]) {
      leads.total++;
      if (l.interest_level in leads) (leads as Record<string, number>)[l.interest_level]++;
    }
  }

  // Facebook summary
  let fb: { posts: number; totalLikes: number; totalComments: number } | null = null;
  const { data: conn } = await supabase
    .from('seller_meta_connections')
    .select('id')
    .eq('wallet_address', wallet)
    .eq('is_active', true)
    .single();

  if (conn) {
    const connId = (conn as { id: string }).id;
    const { data: pubs, count: pubCount } = await supabase
      .from('meta_publication_log')
      .select('id', { count: 'exact' })
      .eq('connection_id', connId)
      .eq('status', 'published');

    fb = { posts: pubCount || 0, totalLikes: 0, totalComments: 0 };

    if (pubs && pubs.length > 0) {
      const pubIds = (pubs as { id: string }[]).map(p => p.id);
      const { data: engagement } = await supabase
        .from('fb_post_engagement')
        .select('publication_id, likes_count, comments_count')
        .in('publication_id', pubIds)
        .order('fetched_at', { ascending: false });

      // Deduplicate — take latest snapshot per publication
      const seen = new Set<string>();
      for (const e of (engagement || []) as { publication_id: string; likes_count: number; comments_count: number }[]) {
        if (!seen.has(e.publication_id)) {
          seen.add(e.publication_id);
          fb.totalLikes += e.likes_count || 0;
          fb.totalComments += e.comments_count || 0;
        }
      }
    }
  }

  // Referrals
  const { data: refCode } = await supabase
    .from('referral_codes')
    .select('code, total_referrals')
    .eq('wallet_address', wallet)
    .single();

  const referrals = {
    total: (refCode as { total_referrals: number } | null)?.total_referrals || 0,
    code: (refCode as { code: string } | null)?.code || null,
  };

  const { text, buttons } = ct.statsMessage(lang, { inventory: inv, leads, fb, referrals });
  return { text, buttons, newContext: null };
}

// ─────────────────────────────────────────────
// FACEBOOK STATUS
// ─────────────────────────────────────────────

export async function handleFacebookStatus(lang: Lang, link: WAPhoneLink): Promise<CommandResult> {
  const supabase = getTypedClient();
  const wallet = link.wallet_address.toLowerCase();

  const { data: conn } = await supabase
    .from('seller_meta_connections')
    .select('id, fb_page_name, auto_publish_on_active, is_active')
    .eq('wallet_address', wallet)
    .eq('is_active', true)
    .single();

  if (!conn) {
    const { text, buttons } = ct.facebookStatus(lang, {
      connected: false, pageName: null, autoPublish: false, recentPosts: [],
    });
    return { text, buttons, newContext: null };
  }

  const mc = conn as { id: string; fb_page_name: string; auto_publish_on_active: boolean };

  // Get recent published posts with engagement
  const { data: pubs } = await supabase
    .from('meta_publication_log')
    .select('id, vehicle_id, fb_post_id')
    .eq('connection_id', mc.id)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(5);

  const recentPosts: Array<{ vehicleTitle: string; likes: number; comments: number }> = [];

  for (const pub of (pubs || []) as { id: string; vehicle_id: string; fb_post_id: string | null }[]) {
    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('year, brand, model')
      .eq('id', pub.vehicle_id)
      .single();

    let likes = 0, comments = 0;
    if (pub.fb_post_id) {
      const { data: eng } = await supabase
        .from('fb_post_engagement')
        .select('likes_count, comments_count')
        .eq('publication_id', pub.id)
        .order('fetched_at', { ascending: false })
        .limit(1);

      if (eng && eng.length > 0) {
        const e = eng[0] as { likes_count: number; comments_count: number };
        likes = e.likes_count;
        comments = e.comments_count;
      }
    }

    const v = vehicle as { year: number; brand: string; model: string } | null;
    const title = v ? `${v.year} ${v.brand} ${v.model}` : 'Unknown';
    recentPosts.push({ vehicleTitle: title, likes, comments });
  }

  const { text, buttons } = ct.facebookStatus(lang, {
    connected: true,
    pageName: mc.fb_page_name,
    autoPublish: mc.auto_publish_on_active,
    recentPosts,
  });

  return { text, buttons, newContext: null };
}

// ─────────────────────────────────────────────
// REFERRALS
// ─────────────────────────────────────────────

export async function handleReferrals(lang: Lang, link: WAPhoneLink): Promise<CommandResult> {
  const supabase = getTypedClient();
  const wallet = link.wallet_address.toLowerCase();

  const { data: refCode } = await supabase
    .from('referral_codes')
    .select('code, total_referrals')
    .eq('wallet_address', wallet)
    .single();

  const code = (refCode as { code: string } | null)?.code || null;
  const totalReferrals = (refCode as { total_referrals: number } | null)?.total_referrals || 0;

  const APP_DOMAIN_VAL = process.env.NEXT_PUBLIC_APP_DOMAIN || 'autosmall.org';
  const refLink = code ? `${APP_DOMAIN_VAL}/ref/${code}` : null;

  const { text, buttons } = ct.referralsMessage(lang, { code, totalReferrals, link: refLink });
  return { text, buttons, newContext: null };
}

// ─────────────────────────────────────────────
// PROFILE
// ─────────────────────────────────────────────

export async function handleProfile(lang: Lang, link: WAPhoneLink): Promise<CommandResult> {
  const seller = await getSellerInfo(link.wallet_address);
  if (!seller) {
    return { text: ct.commandError(lang, 'profile'), newContext: null };
  }

  const { text, buttons } = ct.profileMessage(lang, {
    businessName: seller.business_name,
    handle: seller.handle,
    phone: seller.phone,
    city: seller.city,
    state: seller.state,
  });

  return { text, buttons, newContext: null };
}

export async function handleEditProfileStart(
  lang: Lang,
  field: 'phone' | 'location'
): Promise<CommandResult> {
  const text = field === 'phone'
    ? ct.editPhonePrompt(lang)
    : ct.editLocationPrompt(lang);

  return {
    text,
    newContext: { flow: 'edit_profile', step: 1, data: { field } },
  };
}

export async function handleEditProfileExecute(
  lang: Lang,
  link: WAPhoneLink,
  field: string,
  value: string
): Promise<CommandResult> {
  const supabase = getTypedClient();
  const wallet = link.wallet_address.toLowerCase();

  if (field === 'phone') {
    const { error } = await supabase
      .from('sellers')
      .update({ phone: value.trim() })
      .eq('wallet_address', wallet);

    if (error) {
      console.error('[WA-CMD] Update phone error:', error.message);
      return { text: ct.commandError(lang, 'edit_phone'), newContext: null };
    }
    return { text: ct.profileUpdated(lang, lang === 'es' ? 'Telefono' : 'Phone'), newContext: null };
  }

  if (field === 'location') {
    // Parse "City, State" format
    const parts = value.split(',').map(s => s.trim());
    const city = parts[0] || value.trim();
    const state = parts[1] || null;

    const updates: Record<string, unknown> = { city };
    if (state) updates.state = state;

    const { error } = await supabase
      .from('sellers')
      .update(updates)
      .eq('wallet_address', wallet);

    if (error) {
      console.error('[WA-CMD] Update location error:', error.message);
      return { text: ct.commandError(lang, 'edit_location'), newContext: null };
    }
    return { text: ct.profileUpdated(lang, lang === 'es' ? 'Ubicacion' : 'Location'), newContext: null };
  }

  return { text: ct.commandError(lang, 'edit_profile'), newContext: null };
}

// ─────────────────────────────────────────────
// CAMPAIGNS
// ─────────────────────────────────────────────

export async function handleCampaigns(lang: Lang, link: WAPhoneLink): Promise<CommandResult> {
  try {
    const { getCampaignQuickStats } = await import('@/lib/campaigns/campaign-service');
    const stats = await getCampaignQuickStats(link.wallet_address);
    const { text, buttons } = ct.campaignMenu(lang, stats);
    return { text, buttons, newContext: null };
  } catch (err) {
    console.error('[WA-CMD] Campaign menu error:', err);
    return { text: ct.commandError(lang, 'campaigns'), newContext: null };
  }
}

export async function handleListCampaigns(
  lang: Lang,
  link: WAPhoneLink,
  page: number = 1
): Promise<CommandResult> {
  try {
    const { getCampaigns } = await import('@/lib/campaigns/campaign-service');
    const all = await getCampaigns(link.wallet_address);

    const offset = (page - 1) * ITEMS_PER_PAGE;
    const paged = all.slice(offset, offset + ITEMS_PER_PAGE);
    const hasMore = offset + ITEMS_PER_PAGE < all.length;

    const items = paged.map(c => ({
      id: c.id,
      name: c.name,
      type: c.type,
      status: c.status,
      vehicle_count: c.vehicle_ids.length,
      fb_publish_status: c.fb_publish_status,
    }));

    const { text, buttons } = ct.campaignList(lang, items, all.length, page, hasMore);

    const itemIds = paged.map(c => c.id);
    const newContext: CommandContext = {
      flow: 'list_campaigns',
      step: 1,
      data: { page, items: itemIds },
    };

    return { text, buttons, newContext };
  } catch (err) {
    console.error('[WA-CMD] List campaigns error:', err);
    return { text: ct.commandError(lang, 'campaigns'), newContext: null };
  }
}

export async function handleCampaignDetail(
  lang: Lang,
  link: WAPhoneLink,
  campaignId: string
): Promise<CommandResult> {
  try {
    const { getCampaignById, getCampaignMetrics } = await import('@/lib/campaigns/campaign-service');
    const campaign = await getCampaignById(campaignId, link.wallet_address);
    if (!campaign) {
      return { text: lang === 'es' ? 'Campana no encontrada.' : 'Campaign not found.', newContext: null };
    }

    const metrics = await getCampaignMetrics(campaignId);

    const { text, buttons } = ct.campaignDetail(lang, {
      id: campaign.id,
      name: campaign.name,
      type: campaign.type,
      status: campaign.status,
      vehicle_count: campaign.vehicle_ids.length,
      daily_budget: campaign.daily_budget_usd,
      fb_publish_status: campaign.fb_publish_status,
      fb_permalink_url: campaign.fb_permalink_url,
      fb_ad_status: campaign.fb_ad_status,
      fb_ad_objective: campaign.fb_ad_objective,
      landing_slug: campaign.landing_slug,
      metrics: {
        page_views: metrics.page_views,
        whatsapp_clicks: metrics.whatsapp_clicks,
        total_leads: metrics.total_leads,
      },
    });

    return { text, buttons, newContext: null };
  } catch (err) {
    console.error('[WA-CMD] Campaign detail error:', err);
    return { text: ct.commandError(lang, 'campaigns'), newContext: null };
  }
}

export async function handleCampaignCreateStep(
  lang: Lang,
  link: WAPhoneLink,
  step: number,
  data: Record<string, unknown>,
  userInput: string
): Promise<CommandResult> {
  const supabase = getTypedClient();

  switch (step) {
    case 0: {
      // Step 1: Choose campaign type
      const { getAllTemplates } = await import('@/lib/campaigns/campaign-templates');
      const templates = getAllTemplates();
      const templateInfos = templates.map(t => ({
        type: t.type,
        emoji: t.emoji,
        name: lang === 'es' ? t.name_es : t.name_en,
        description: lang === 'es' ? t.description_es : t.description_en,
      }));
      const { text, buttons } = ct.campaignCreateTypeStep(lang, templateInfos);
      return {
        text,
        buttons,
        newContext: { flow: 'create_campaign', step: 1, data: {} },
      };
    }

    case 1: {
      // Got campaign type → show vehicles
      const input = userInput.toLowerCase().trim();
      const { getTemplate } = await import('@/lib/campaigns/campaign-templates');

      // Match template by button ID (tpl_*) or keyword
      let campaignType = 'inventory_showcase';
      if (input.startsWith('tpl_')) {
        campaignType = input.replace('tpl_', '');
      } else if (input.includes('inventario') || input.includes('inventory') || input.includes('showcase')) {
        campaignType = 'inventory_showcase';
      } else if (input.includes('oferta') || input.includes('promo') || input.includes('seasonal')) {
        campaignType = 'seasonal_promo';
      } else if (input.includes('liquidacion') || input.includes('clearance')) {
        campaignType = 'clearance';
      } else if (input.includes('financiamiento') || input.includes('financing')) {
        campaignType = 'financing';
      } else if (input.includes('trade') || input.includes('intercambio')) {
        campaignType = 'trade_in';
      } else if (input.includes('custom') || input.includes('personalizada')) {
        campaignType = 'custom';
      }

      const template = getTemplate(campaignType as import('@/lib/campaigns/types').CampaignType);
      const typeName = lang === 'es' ? template.name_es : template.name_en;

      // Get active vehicles
      const { data: vehicles } = await supabase
        .from('vehicles')
        .select('id, year, brand, model, price')
        .eq('seller_address', link.wallet_address.toLowerCase())
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(20);

      const activeVehicles = (vehicles || []) as Array<{
        id: string; year: number | null; brand: string | null;
        model: string | null; price: number | null;
      }>;

      if (activeVehicles.length === 0) {
        return { text: ct.campaignNoActiveVehicles(lang), newContext: null };
      }

      const vehicleOptions = activeVehicles.map((v, i) => ({
        num: i + 1,
        year: v.year,
        brand: v.brand,
        model: v.model,
        price: v.price,
      }));

      const text = ct.campaignCreateVehiclesStep(lang, vehicleOptions, typeName);
      return {
        text,
        newContext: {
          flow: 'create_campaign',
          step: 2,
          data: {
            campaignType,
            typeName,
            vehicleIds: activeVehicles.map(v => v.id),
            vehicleTitles: activeVehicles.map(v => `${v.year} ${v.brand} ${v.model}`),
          },
        },
      };
    }

    case 2: {
      // Got vehicle selection → ask for budget
      const input = userInput.toLowerCase().trim();
      const allIds = (data.vehicleIds as string[]) || [];
      const allTitles = (data.vehicleTitles as string[]) || [];

      let selectedIds: string[];
      let selectedTitles: string[];

      if (input === 'todos' || input === 'all') {
        selectedIds = allIds;
        selectedTitles = allTitles;
      } else {
        // Parse comma-separated numbers
        const nums = input.split(/[,\s]+/).map(n => parseInt(n.trim())).filter(n => !isNaN(n) && n > 0);
        if (nums.length === 0) {
          return {
            text: lang === 'es' ? 'Envía números separados por coma (ej: 1,3) o "todos".' : 'Send numbers separated by comma (e.g. 1,3) or "all".',
            newContext: { flow: 'create_campaign', step: 2, data },
          };
        }
        selectedIds = nums.filter(n => n <= allIds.length).map(n => allIds[n - 1]);
        selectedTitles = nums.filter(n => n <= allTitles.length).map(n => allTitles[n - 1]);
      }

      if (selectedIds.length === 0) {
        return {
          text: lang === 'es' ? 'Selección no válida. Intenta de nuevo.' : 'Invalid selection. Try again.',
          newContext: { flow: 'create_campaign', step: 2, data },
        };
      }

      const { getTemplate } = await import('@/lib/campaigns/campaign-templates');
      const template = getTemplate((data.campaignType as string) as import('@/lib/campaigns/types').CampaignType);
      const summary = selectedTitles.join(', ');

      const text = ct.campaignCreateBudgetStep(
        lang,
        summary.length > 80 ? `${selectedIds.length} vehiculos` : summary,
        template.suggested_daily_budget.min,
        template.suggested_daily_budget.max,
      );

      return {
        text,
        newContext: {
          flow: 'create_campaign',
          step: 3,
          data: {
            ...data,
            selectedIds,
            selectedTitles,
          },
        },
      };
    }

    case 3: {
      // Got budget → show preview + confirm
      const input = userInput.toLowerCase().trim();
      const skip = ['saltar', 'skip', '-', 'no', '0'].includes(input);
      const budget = skip ? null : parseFloat(input.replace(/[^0-9.]/g, ''));
      const validBudget = budget && !isNaN(budget) && budget > 0 ? budget : null;

      const { getTemplate } = await import('@/lib/campaigns/campaign-templates');
      const template = getTemplate((data.campaignType as string) as import('@/lib/campaigns/types').CampaignType);
      const typeName = (data.typeName as string) || (lang === 'es' ? template.name_es : template.name_en);

      // Generate preview body
      const { generateAdCopy, buildLandingURL } = await import('@/lib/campaigns/ad-copy-generator');

      const seller = await getSellerInfo(link.wallet_address);
      const sellerForFeed = {
        id: '', handle: seller?.handle || 'dealer',
        business_name: seller?.business_name || 'Dealer',
        phone: seller?.phone || null, whatsapp: seller?.whatsapp || null,
        city: seller?.city || null, state: seller?.state || null,
        address: seller?.address || null,
        wallet_address: link.wallet_address,
      };

      const selectedIds = (data.selectedIds as string[]) || [];

      // Fetch real vehicle data for accurate preview (with actual prices)
      const { data: realVehicles } = await supabase
        .from('vehicles')
        .select('id, year, brand, model, trim, price, mileage')
        .in('id', selectedIds);

      const vehicleMap = new Map(
        ((realVehicles || []) as Array<{
          id: string; year: number; brand: string; model: string;
          trim: string | null; price: number; mileage: number | null;
        }>).map(v => [v.id, v])
      );

      const simpleVehicles = selectedIds.map(id => {
        const v = vehicleMap.get(id);
        return {
          id,
          year: v?.year || 2024,
          brand: v?.brand || 'Vehicle',
          model: v?.model || '',
          trim: v?.trim || null,
          price: v?.price || 0,
          mileage: v?.mileage || null,
        };
      });

      const tempSlug = typeName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const copy = generateAdCopy({
        campaignType: (data.campaignType as string) as import('@/lib/campaigns/types').CampaignType,
        vehicles: simpleVehicles,
        seller: sellerForFeed,
        lang: 'both',
        slug: tempSlug,
      });

      const bodyPreview = lang === 'es' ? copy.body_es : copy.body_en;

      const { text, buttons } = ct.campaignCreateConfirmStep(lang, {
        typeName,
        vehicleCount: selectedIds.length,
        budget: validBudget,
        bodyPreview,
        landingUrl: buildLandingURL(tempSlug),
      });

      return {
        text,
        buttons,
        newContext: {
          flow: 'create_campaign',
          step: 4,
          data: {
            ...data,
            budget: validBudget,
          },
        },
      };
    }

    case 4: {
      // Confirm → create (and optionally publish)
      const publishFB = userInput === 'cmd_camp_create_pub';

      const { getTemplate } = await import('@/lib/campaigns/campaign-templates');
      const template = getTemplate((data.campaignType as string) as import('@/lib/campaigns/types').CampaignType);
      const campaignName = lang === 'es' ? template.name_es : template.name_en;

      try {
        const { createCampaign, publishToFacebook } = await import('@/lib/campaigns/campaign-service');

        const campaign = await createCampaign(link.wallet_address, {
          name: campaignName,
          type: (data.campaignType as string) as import('@/lib/campaigns/types').CampaignType,
          vehicle_ids: (data.selectedIds as string[]) || [],
          daily_budget_usd: (data.budget as number) || null,
          caption_language: 'both',
        });

        if (publishFB) {
          try {
            const result = await publishToFacebook(campaign.id, link.wallet_address);
            return {
              text: ct.campaignPublished(lang, campaignName, result.permalink, campaign.landing_slug || '', result.adStatus, (data.budget as number) || null, result.adMessage),
              newContext: null,
            };
          } catch (fbErr) {
            console.error('[WA-CMD] Campaign FB publish error:', fbErr);
            // Campaign was created but FB publish failed
            const createdText = ct.campaignCreated(lang, campaignName, campaign.landing_slug || '');
            const fbError = lang === 'es'
              ? '\n\n⚠️ No se pudo publicar en Facebook. Verifica tu conexion en /fb'
              : '\n\n⚠️ Could not publish to Facebook. Check your connection at /fb';
            return { text: createdText + fbError, newContext: null };
          }
        }

        return {
          text: ct.campaignCreated(lang, campaignName, campaign.landing_slug || ''),
          newContext: null,
        };
      } catch (err) {
        console.error('[WA-CMD] Campaign create error:', err);
        return { text: ct.commandError(lang, 'create_campaign'), newContext: null };
      }
    }

    default:
      return { text: ct.commandError(lang, 'create_campaign'), newContext: null };
  }
}

export async function handleCampaignPublish(
  lang: Lang,
  link: WAPhoneLink,
  campaignId: string
): Promise<CommandResult> {
  try {
    const { publishToFacebook, getCampaignById } = await import('@/lib/campaigns/campaign-service');
    const campaign = await getCampaignById(campaignId, link.wallet_address);
    if (!campaign) {
      return { text: lang === 'es' ? 'Campana no encontrada.' : 'Campaign not found.', newContext: null };
    }

    const result = await publishToFacebook(campaignId, link.wallet_address);
    return {
      text: ct.campaignPublished(lang, campaign.name, result.permalink, campaign.landing_slug || '', result.adStatus, campaign.daily_budget_usd, result.adMessage),
      newContext: null,
    };
  } catch (err) {
    console.error('[WA-CMD] Campaign publish error:', err);
    const errMsg = err instanceof Error ? err.message : 'Unknown error';
    const text = lang === 'es'
      ? `❌ Error al publicar: ${errMsg}`
      : `❌ Publish error: ${errMsg}`;
    return { text, newContext: null };
  }
}

export async function handleCampaignToggleStatus(
  lang: Lang,
  link: WAPhoneLink,
  campaignId: string,
  newStatus: 'active' | 'paused'
): Promise<CommandResult> {
  try {
    const { updateCampaign, getCampaignById, pauseFBAd, resumeFBAd } = await import('@/lib/campaigns/campaign-service');
    const campaign = await getCampaignById(campaignId, link.wallet_address);
    if (!campaign) {
      return { text: lang === 'es' ? 'Campana no encontrada.' : 'Campaign not found.', newContext: null };
    }

    await updateCampaign(campaignId, link.wallet_address, { status: newStatus });

    // Also pause/resume the paid ad if it exists
    if (campaign.fb_ad_id && campaign.fb_ad_status && campaign.fb_ad_status !== 'none' && campaign.fb_ad_status !== 'error') {
      try {
        if (newStatus === 'paused') {
          await pauseFBAd(campaignId, link.wallet_address);
        } else if (newStatus === 'active') {
          await resumeFBAd(campaignId, link.wallet_address);
        }
      } catch (adErr) {
        console.error('[WA-CMD] Ad toggle error (non-fatal):', adErr);
      }
    }

    return { text: ct.campaignStatusChanged(lang, campaign.name, newStatus), newContext: null };
  } catch (err) {
    console.error('[WA-CMD] Campaign toggle error:', err);
    return { text: ct.commandError(lang, 'campaigns'), newContext: null };
  }
}

// ─────────────────────────────────────────────
// CAMPAIGN — Delete
// ─────────────────────────────────────────────

export async function handleCampaignDelete(
  lang: Lang,
  link: WAPhoneLink,
  campaignId: string
): Promise<CommandResult> {
  try {
    const { getCampaignById } = await import('@/lib/campaigns/campaign-service');
    const campaign = await getCampaignById(campaignId, link.wallet_address);
    if (!campaign) {
      return { text: lang === 'es' ? 'Campana no encontrada.' : 'Campaign not found.', newContext: null };
    }

    const fbPostCount = campaign.fb_post_ids.length;
    const { text, buttons } = ct.campaignDeleteConfirm(lang, {
      name: campaign.name,
      fbPostCount,
    });

    return {
      text,
      buttons,
      newContext: {
        flow: 'campaign_delete',
        step: 1,
        data: { campaignId, campaignName: campaign.name, fbPostCount },
      },
    };
  } catch (err) {
    console.error('[WA-CMD] Campaign delete prompt error:', err);
    return { text: ct.commandError(lang, 'campaigns'), newContext: null };
  }
}

export async function handleCampaignDeleteConfirm(
  lang: Lang,
  link: WAPhoneLink,
  campaignId: string
): Promise<CommandResult> {
  try {
    const { deleteCampaign, getCampaignById } = await import('@/lib/campaigns/campaign-service');
    const campaign = await getCampaignById(campaignId, link.wallet_address);
    if (!campaign) {
      return { text: lang === 'es' ? 'Campana no encontrada.' : 'Campaign not found.', newContext: null };
    }

    const hasFBPosts = campaign.fb_post_ids.length > 0;
    const result = await deleteCampaign(campaignId, link.wallet_address, hasFBPosts);

    return {
      text: ct.campaignDeleted(lang, campaign.name, result.deletedPostsCount),
      newContext: null,
    };
  } catch (err) {
    console.error('[WA-CMD] Campaign delete confirm error:', err);
    return { text: ct.commandError(lang, 'campaigns'), newContext: null };
  }
}

// ─────────────────────────────────────────────
// CAMPAIGN — Full Stats
// ─────────────────────────────────────────────

export async function handleCampaignStats(
  lang: Lang,
  link: WAPhoneLink,
  campaignId: string
): Promise<CommandResult> {
  try {
    const { getCampaignFullStats, getCampaignById } = await import('@/lib/campaigns/campaign-service');
    const campaign = await getCampaignById(campaignId, link.wallet_address);
    if (!campaign) {
      return { text: lang === 'es' ? 'Campana no encontrada.' : 'Campaign not found.', newContext: null };
    }

    const stats = await getCampaignFullStats(campaignId, link.wallet_address);

    const { text, buttons } = ct.campaignFullStats(lang, {
      id: campaignId,
      name: campaign.name,
      landing: stats.landing,
      fb: stats.fb,
      ad: stats.ad,
      publishedAt: stats.publishedAt,
    });

    return { text, buttons, newContext: null };
  } catch (err) {
    console.error('[WA-CMD] Campaign stats error:', err);
    return { text: ct.commandError(lang, 'campaigns'), newContext: null };
  }
}

// ─────────────────────────────────────────────
// CAMPAIGN — Switch Ad Objective
// ─────────────────────────────────────────────

export async function handleCampaignSwitchObjective(
  lang: Lang,
  link: WAPhoneLink,
  campaignId: string
): Promise<CommandResult> {
  try {
    const { getCampaignById } = await import('@/lib/campaigns/campaign-service');
    const campaign = await getCampaignById(campaignId, link.wallet_address);
    if (!campaign) {
      return { text: lang === 'es' ? 'Campana no encontrada.' : 'Campaign not found.', newContext: null };
    }

    if (!campaign.fb_campaign_id) {
      return {
        text: lang === 'es'
          ? '⚠️ No hay anuncio pagado activo. Publica la campana primero.'
          : '⚠️ No active paid ad. Publish the campaign first.',
        newContext: null,
      };
    }

    const currentObjective = campaign.fb_ad_objective || 'whatsapp_conversations';
    const newObjective = currentObjective === 'awareness' ? 'whatsapp_conversations' : 'awareness';

    const { text, buttons } = ct.campaignSwitchConfirm(lang, {
      id: campaign.id,
      name: campaign.name,
      currentObjective,
      newObjective,
    });

    return {
      text,
      buttons,
      newContext: {
        flow: 'campaign_switch',
        step: 0,
        data: { campaignId: campaign.id, newObjective },
      },
    };
  } catch (err) {
    console.error('[WA-CMD] Campaign switch objective error:', err);
    return { text: ct.commandError(lang, 'campaigns'), newContext: null };
  }
}

export async function handleCampaignSwitchConfirm(
  lang: Lang,
  link: WAPhoneLink,
  campaignId: string,
  newObjective: string
): Promise<CommandResult> {
  try {
    const { switchAdObjective } = await import('@/lib/campaigns/campaign-service');
    const result = await switchAdObjective(
      campaignId,
      link.wallet_address,
      newObjective as 'awareness' | 'whatsapp_clicks' | 'whatsapp_conversations'
    );

    const objLabels: Record<string, { es: string; en: string }> = {
      awareness: { es: '📡 Alcance (Awareness)', en: '📡 Reach (Awareness)' },
      whatsapp_clicks: { es: '💬 WhatsApp Clicks (legacy)', en: '💬 WhatsApp Clicks (legacy)' },
      whatsapp_conversations: { es: '💬 WhatsApp Conversaciones', en: '💬 WhatsApp Conversations' },
    };
    const label = lang === 'es'
      ? (objLabels[newObjective]?.es || newObjective)
      : (objLabels[newObjective]?.en || newObjective);
    const statusLabel = result.adStatus === 'active'
      ? (lang === 'es' ? 'activo' : 'active')
      : (lang === 'es' ? 'pausado' : 'paused');

    const text = lang === 'es'
      ? `✅ Objetivo cambiado a ${label}.\nEl anuncio esta ${statusLabel}.`
      : `✅ Objective switched to ${label}.\nThe ad is ${statusLabel}.`;

    return { text, newContext: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[WA-CMD] Campaign switch confirm error:', msg);
    const text = lang === 'es'
      ? `⚠️ Error al cambiar objetivo: ${msg}`
      : `⚠️ Failed to switch objective: ${msg}`;
    return { text, newContext: null };
  }
}

// ─────────────────────────────────────────────
// VEHICLE — Delete FB Posts
// ─────────────────────────────────────────────

export async function handleDeleteVehicleFBPost(
  lang: Lang,
  link: WAPhoneLink,
  vehicleId: string
): Promise<CommandResult> {
  try {
    const supabase = getTypedClient();
    const seller = await getSellerInfo(link.wallet_address);
    if (!seller) {
      return { text: ct.commandError(lang, 'delete_fb'), newContext: null };
    }

    // Get vehicle title
    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('year, brand, model')
      .eq('id', vehicleId)
      .single();

    const v = vehicle as { year: number; brand: string; model: string } | null;
    const title = v ? `${v.year} ${v.brand} ${v.model}` : 'Vehicle';

    // Count published FB posts
    const { getVehicleFBPostCount } = await import('@/lib/campaigns/campaign-service');
    const count = await getVehicleFBPostCount(vehicleId, seller.id);

    if (count === 0) {
      return {
        text: lang === 'es'
          ? `*${title}* no tiene posts en Facebook.`
          : `*${title}* has no Facebook posts.`,
        newContext: null,
      };
    }

    const { text, buttons } = ct.vehicleFBDeleteConfirm(lang, title, vehicleId, count);

    return {
      text,
      buttons,
      newContext: {
        flow: 'delete_vehicle_fb',
        step: 1,
        data: { vehicleId, vehicleTitle: title, fbCount: count },
      },
    };
  } catch (err) {
    console.error('[WA-CMD] Vehicle FB delete prompt error:', err);
    return { text: ct.commandError(lang, 'delete_fb'), newContext: null };
  }
}

export async function handleDeleteVehicleFBPostConfirm(
  lang: Lang,
  link: WAPhoneLink,
  vehicleId: string
): Promise<CommandResult> {
  try {
    const supabase = getTypedClient();

    // Get vehicle title
    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('year, brand, model')
      .eq('id', vehicleId)
      .single();

    const v = vehicle as { year: number; brand: string; model: string } | null;
    const title = v ? `${v.year} ${v.brand} ${v.model}` : 'Vehicle';

    const { deleteVehicleFBPosts } = await import('@/lib/campaigns/campaign-service');
    const result = await deleteVehicleFBPosts(vehicleId, link.wallet_address);

    return {
      text: ct.vehicleFBDeleted(lang, title, result.deletedPostsCount),
      newContext: null,
    };
  } catch (err) {
    console.error('[WA-CMD] Vehicle FB delete confirm error:', err);
    const errMsg = err instanceof Error ? err.message : 'Unknown error';
    return {
      text: ct.vehicleFBDeleteError(lang, 'Vehicle', errMsg),
      newContext: null,
    };
  }
}

// ─────────────────────────────────────────────
// DEALS / VENTAS
// ─────────────────────────────────────────────

const DEALS_PER_PAGE = 5;

export async function handleListDeals(lang: Lang, link: WAPhoneLink, page = 1): Promise<CommandResult> {
  const sellerId = await getSellerId(link.wallet_address);
  if (!sellerId) return { text: ct.noSellerFound(lang), newContext: null };

  const { listDeals } = await import('@/lib/crm/deal-service');
  const result = await listDeals(sellerId, { page, limit: DEALS_PER_PAGE });
  const hasMore = page < result.totalPages;

  const { text, buttons } = ct.dealList(lang, result.deals, result.total, page, hasMore);
  return {
    text,
    buttons,
    newContext: {
      flow: 'list_deals',
      step: 0,
      data: {
        page,
        items: result.deals.map((d: { id: string }) => d.id),
      },
    },
  };
}

export async function handleCreateDealStep(
  lang: Lang,
  link: WAPhoneLink,
  step: number,
  data: Record<string, unknown>,
  userInput: string
): Promise<CommandResult> {
  const sellerId = await getSellerId(link.wallet_address);
  if (!sellerId) return { text: ct.noSellerFound(lang), newContext: null };

  // Merge any new input with existing data
  const merged = { ...data };

  if (step === 0 && userInput) {
    // First input — try to parse everything from it
    const { parseDealFromText, getMissingDealFields } = await import('@/lib/crm/deal-parser');
    const parsed = parseDealFromText(userInput);
    Object.assign(merged, parsed);

    const missing = getMissingDealFields(parsed);
    if (missing.length === 0) {
      // All required fields present — create deal immediately!
      return createDealFromData(lang, sellerId, merged);
    }

    // Ask for the first missing field
    const nextStep = getStepForMissingField(missing[0]);
    const { text, buttons } = ct.createDealStep(lang, nextStep, merged, missing);
    return { text, buttons, newContext: { flow: 'create_deal_deal', step: nextStep, data: merged } };
  }

  // Subsequent steps
  switch (step) {
    case 1: // client_name
      merged.client_name = userInput.trim();
      break;
    case 2: { // vehicle info (year brand model)
      const { parseDealFromText } = await import('@/lib/crm/deal-parser');
      const vParsed = parseDealFromText(userInput);
      if (vParsed.vehicle_brand) merged.vehicle_brand = vParsed.vehicle_brand;
      if (vParsed.vehicle_model) merged.vehicle_model = vParsed.vehicle_model;
      if (vParsed.vehicle_year) merged.vehicle_year = vParsed.vehicle_year;
      if (vParsed.vehicle_color) merged.vehicle_color = vParsed.vehicle_color;
      break;
    }
    case 3: { // sale price
      const { parseDealFromText } = await import('@/lib/crm/deal-parser');
      const pParsed = parseDealFromText(userInput);
      if (pParsed.sale_price) merged.sale_price = pParsed.sale_price;
      else {
        const num = parseFloat(userInput.replace(/[$,]/g, ''));
        if (num > 0) merged.sale_price = num;
      }
      break;
    }
    case 4: { // down payment / financing
      const lower = userInput.toLowerCase().trim();
      if (lower === 'cash' || lower === 'efectivo' || lower === 'contado') {
        merged.financing_type = 'cash';
        merged.down_payment = merged.sale_price;
      } else {
        const { parseDealFromText } = await import('@/lib/crm/deal-parser');
        const fParsed = parseDealFromText(userInput);
        if (fParsed.down_payment) merged.down_payment = fParsed.down_payment;
        else {
          const num = parseFloat(userInput.replace(/[$,]/g, ''));
          if (num > 0) merged.down_payment = num;
        }
        if (!merged.financing_type) merged.financing_type = 'in_house';
      }
      break;
    }
  }

  // Check if we now have everything
  const { getMissingDealFields } = await import('@/lib/crm/deal-parser');
  const asParsed = {
    client_name: merged.client_name as string | undefined,
    vehicle_brand: merged.vehicle_brand as string | undefined,
    vehicle_model: merged.vehicle_model as string | undefined,
    vehicle_year: merged.vehicle_year as number | undefined,
    sale_price: merged.sale_price as number | undefined,
  };
  const missing = getMissingDealFields(asParsed);

  if (missing.length === 0) {
    return createDealFromData(lang, sellerId, merged);
  }

  const nextStep = getStepForMissingField(missing[0]);
  const { text, buttons } = ct.createDealStep(lang, nextStep, merged, missing);
  return { text, buttons, newContext: { flow: 'create_deal_deal', step: nextStep, data: merged } };
}

async function createDealFromData(lang: Lang, sellerId: string, data: Record<string, unknown>): Promise<CommandResult> {
  try {
    const { createDeal } = await import('@/lib/crm/deal-service');
    const deal = await createDeal(sellerId, {
      client_name: data.client_name as string,
      vehicle_brand: data.vehicle_brand as string,
      vehicle_model: data.vehicle_model as string,
      vehicle_year: data.vehicle_year as number,
      sale_price: data.sale_price as number,
      client_phone: data.client_phone as string | undefined,
      down_payment: (data.down_payment as number) || 0,
      financing_type: (data.financing_type as 'cash' | 'in_house' | 'external') || 'cash',
      num_installments: (data.num_installments as number) || 0,
      payment_frequency: (data.payment_frequency as 'weekly' | 'biweekly' | 'monthly') || 'weekly',
      first_payment_date: data.first_payment_date as string | undefined,
      installment_amount: data.installment_amount as number | undefined,
      vehicle_color: data.vehicle_color as string | undefined,
      vehicle_vin: data.vehicle_vin as string | undefined,
      vehicle_mileage: data.vehicle_mileage as number | undefined,
      referred_by: data.referred_by as string | undefined,
      notes: data.notes as string | undefined,
    });

    const { text, buttons } = ct.dealCreated(lang, deal);
    return { text, buttons, newContext: null };
  } catch (err) {
    console.error('[WA-CMD] Create deal error:', err);
    const errMsg = err instanceof Error ? err.message : 'Unknown error';
    return {
      text: lang === 'es' ? `Error creando venta: ${errMsg}` : `Error creating deal: ${errMsg}`,
      newContext: null,
    };
  }
}

function getStepForMissingField(field: string): number {
  switch (field) {
    case 'client_name': return 1;
    case 'vehicle_brand':
    case 'vehicle_model':
    case 'vehicle_year': return 2;
    case 'sale_price': return 3;
    default: return 1;
  }
}

export async function handleDealDetail(lang: Lang, link: WAPhoneLink, dealId: string): Promise<CommandResult> {
  const sellerId = await getSellerId(link.wallet_address);
  if (!sellerId) return { text: ct.noSellerFound(lang), newContext: null };

  const { getDealById } = await import('@/lib/crm/deal-service');
  const result = await getDealById(dealId, sellerId);
  if (!result) {
    return { text: lang === 'es' ? 'Venta no encontrada.' : 'Deal not found.', newContext: null };
  }

  const { text, buttons } = ct.dealDetail(lang, result.deal, result.payments);
  return { text, buttons, newContext: null };
}

export async function handleRecordPaymentStep(
  lang: Lang,
  link: WAPhoneLink,
  step: number,
  data: Record<string, unknown>,
  userInput: string
): Promise<CommandResult> {
  const sellerId = await getSellerId(link.wallet_address);
  if (!sellerId) return { text: ct.noSellerFound(lang), newContext: null };

  if (step === 0) {
    // Show deals with outstanding balance
    const { listDeals } = await import('@/lib/crm/deal-service');
    const result = await listDeals(sellerId, { deal_status: 'active', limit: 10 });
    const dealsWithBalance = result.deals.filter((d: { outstanding_balance: number }) => Number(d.outstanding_balance) > 0);

    if (dealsWithBalance.length === 0) {
      return {
        text: lang === 'es' ? 'No tienes ventas con saldo pendiente.' : 'No deals with outstanding balance.',
        newContext: null,
      };
    }

    const { text, buttons } = ct.paymentSelectDeal(lang, dealsWithBalance);
    return {
      text,
      buttons,
      newContext: {
        flow: 'record_payment',
        step: 1,
        data: { items: dealsWithBalance.map((d: { id: string }) => d.id) },
      },
    };
  }

  if (step === 1) {
    // User selected deal number
    const items = (data.items as string[]) || [];
    const idx = parseInt(userInput) - 1;
    if (idx < 0 || idx >= items.length) {
      return { text: ct.invalidNumber(lang), newContext: { flow: 'record_payment', step: 1, data } };
    }

    const dealId = items[idx];
    const { getDealById } = await import('@/lib/crm/deal-service');
    const result = await getDealById(dealId, sellerId);
    if (!result) return { text: lang === 'es' ? 'Venta no encontrada.' : 'Deal not found.', newContext: null };

    // Find next pending payment
    const nextPayment = result.payments.find((p: { status: string }) => p.status === 'pending' || p.status === 'overdue');
    if (!nextPayment) {
      return { text: lang === 'es' ? 'No hay pagos pendientes para esta venta.' : 'No pending payments for this deal.', newContext: null };
    }

    const { text, buttons } = ct.paymentConfirm(lang, result.deal, nextPayment);
    return {
      text,
      buttons,
      newContext: {
        flow: 'record_payment',
        step: 2,
        data: { dealId, paymentId: nextPayment.id, amount: nextPayment.amount },
      },
    };
  }

  return { text: lang === 'es' ? 'Flujo inesperado.' : 'Unexpected flow.', newContext: null };
}

export async function handleRecordPaymentConfirm(
  lang: Lang,
  link: WAPhoneLink,
  data: Record<string, unknown>
): Promise<CommandResult> {
  const sellerId = await getSellerId(link.wallet_address);
  if (!sellerId) return { text: ct.noSellerFound(lang), newContext: null };

  try {
    const { recordPayment, getDealById } = await import('@/lib/crm/deal-service');
    const paymentId = data.paymentId as string;
    const dealId = data.dealId as string;

    const payment = await recordPayment(paymentId, sellerId, { status: 'paid' });
    const result = await getDealById(dealId, sellerId);

    const { text, buttons } = ct.paymentRecorded(lang, result?.deal ?? null, payment);
    return { text, buttons, newContext: null };
  } catch (err) {
    console.error('[WA-CMD] Record payment error:', err);
    return {
      text: lang === 'es' ? 'Error registrando pago.' : 'Error recording payment.',
      newContext: null,
    };
  }
}

// ─────────────────────────────────────────────
// SUPPORT
// ─────────────────────────────────────────────

export async function handleSupport(lang: Lang, link: WAPhoneLink): Promise<CommandResult> {
  const seller = await getSellerInfo(link.wallet_address);
  return { text: ct.supportMessage(lang, seller?.handle || null), newContext: null };
}
