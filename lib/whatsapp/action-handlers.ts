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
    .select('id, handle, business_name, phone, whatsapp, city, state, latitude, longitude')
    .eq('wallet_address', walletAddress.toLowerCase())
    .single();
  return data as {
    id: string; handle: string; business_name: string | null;
    phone: string | null; whatsapp: string | null;
    city: string | null; state: string | null;
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

  const { text, buttons } = ct.vehicleDetailCard(lang, { ...v, seller_handle: handle });

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
// SUPPORT
// ─────────────────────────────────────────────

export async function handleSupport(lang: Lang, link: WAPhoneLink): Promise<CommandResult> {
  const seller = await getSellerInfo(link.wallet_address);
  return { text: ct.supportMessage(lang, seller?.handle || null), newContext: null };
}
