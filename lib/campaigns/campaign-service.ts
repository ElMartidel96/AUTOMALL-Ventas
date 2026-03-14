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
  deletePost,
  fetchPostEngagement,
  createFBCampaign,
  createFBAdSet,
  createFBAdCreative,
  createFBLinkAdCreative,
  createFBCTWACreative,
  createFBAd,
  updateFBObjectStatus,
  deleteFBCampaignObject,
  getAdInsights,
  verifyAdAccountAccess,
  verifyTokenPermissions,
} from '@/lib/meta/facebook-api';
import { buildTargeting } from '@/lib/meta/targeting-helper';
import { buildFBCaption, generateAdCopy, generatePaidAdCopy, buildLandingURL } from './ad-copy-generator';
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
  FBAdObjective,
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
    .select('id, handle, business_name, phone, whatsapp, city, state, address, wallet_address')
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
    address: data.address || null,
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

/**
 * Unpublish all Facebook posts for a campaign.
 * Iterates fb_post_ids[], deletes each from FB, updates publication log + campaign.
 */
export async function unpublishFromFacebook(
  campaignId: string,
  walletAddress: string
): Promise<{ deletedPostsCount: number }> {
  const supabase = getTypedClient();
  const wallet = walletAddress.toLowerCase();

  const campaign = await getCampaignById(campaignId, walletAddress);
  if (!campaign) throw new Error('Campaign not found');

  if (campaign.fb_post_ids.length === 0) {
    return { deletedPostsCount: 0 };
  }

  // Get Meta connection for page access token
  const { data: connection } = await supabase
    .from('seller_meta_connections')
    .select('*')
    .eq('wallet_address', wallet)
    .eq('is_active', true)
    .single();

  if (!connection) throw new Error('Facebook not connected');
  const conn = connection as unknown as MetaConnection;

  // Delete paid ad structure first (if exists) — requires USER token
  if (campaign.fb_campaign_id) {
    const adToken = conn.fb_user_access_token || conn.fb_page_access_token;
    try {
      await deleteFBCampaignObject(campaign.fb_campaign_id, adToken);
      console.log(`[CampaignService] Deleted FB ad campaign ${campaign.fb_campaign_id}`);
    } catch (err) {
      console.error(`[CampaignService] Failed to delete FB ad campaign:`, safeErrorMsg(err));
    }
  }

  let deletedCount = 0;
  for (const postId of campaign.fb_post_ids) {
    try {
      await deletePost(postId, conn.fb_page_access_token);
      deletedCount++;
    } catch (err) {
      console.error(`[CampaignService] Failed to delete FB post ${postId}:`, safeErrorMsg(err));
    }
  }

  // Update publication log entries to 'deleted'
  try {
    await supabase
      .from('meta_publication_log')
      .update({ status: 'deleted' })
      .eq('campaign_id', campaignId)
      .eq('status', 'published');
  } catch (logErr) {
    console.error('[CampaignService] Failed to update publication log:', safeErrorMsg(logErr));
  }

  // Clear FB data from campaign (organic + paid)
  await supabase
    .from('campaigns')
    .update({
      fb_post_ids: [],
      fb_publish_status: 'unpublished',
      fb_permalink_url: null,
      fb_campaign_id: null,
      fb_adset_id: null,
      fb_ad_id: null,
      fb_creative_id: null,
      fb_ad_status: 'none',
    })
    .eq('id', campaignId)
    .eq('wallet_address', wallet);

  console.log(`[CampaignService] Unpublished campaign ${campaignId}: ${deletedCount} posts deleted from FB`);
  return { deletedPostsCount: deletedCount };
}

/**
 * Delete (archive) a campaign, optionally removing its FB posts first.
 */
export async function deleteCampaign(
  id: string,
  walletAddress: string,
  deleteFromFB: boolean = false
): Promise<{ deletedPostsCount: number }> {
  let deletedPostsCount = 0;

  if (deleteFromFB) {
    const result = await unpublishFromFacebook(id, walletAddress);
    deletedPostsCount = result.deletedPostsCount;
  }

  const supabase = getTypedClient();
  const { error } = await supabase
    .from('campaigns')
    .update({ status: 'archived' })
    .eq('id', id)
    .eq('wallet_address', walletAddress.toLowerCase());

  if (error) throw new Error(`Failed to delete campaign: ${error.message}`);
  return { deletedPostsCount };
}

/**
 * Full stats for a campaign: landing page metrics + Facebook engagement.
 *
 * IMPORTANT: Errors are surfaced in the response (not hidden as zeros) so the AI
 * agent can tell the user what's wrong and suggest corrective actions.
 */
export async function getCampaignFullStats(
  campaignId: string,
  walletAddress: string
): Promise<{
  landing: CampaignMetrics;
  fb: {
    published: boolean;
    impressions: number;
    reach: number;
    likes: number;
    comments: number;
    shares: number;
    clicks: number;
    error?: string;
  };
  ad: {
    status: string;
    spend: number;
    impressions: number;
    reach: number;
    clicks: number;
    conversations: number;
    costPerConversation: number;
    error?: string;
  } | null;
  publishedAt: string | null;
  errors?: string[];
}> {
  const supabase = getTypedClient();
  const wallet = walletAddress.toLowerCase();
  const errors: string[] = [];

  // Landing page metrics
  const landing = await getCampaignMetrics(campaignId);

  // Campaign data
  const campaign = await getCampaignById(campaignId, walletAddress);
  const fbResult: {
    published: boolean;
    impressions: number;
    reach: number;
    likes: number;
    comments: number;
    shares: number;
    clicks: number;
    error?: string;
  } = {
    published: false,
    impressions: 0,
    reach: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    clicks: 0,
  };

  if (!campaign || campaign.fb_post_ids.length === 0) {
    return { landing, fb: fbResult, ad: null, publishedAt: campaign?.fb_published_at || null };
  }

  fbResult.published = true;

  // Get Meta connection for page access token
  const { data: connection } = await supabase
    .from('seller_meta_connections')
    .select('*')
    .eq('wallet_address', wallet)
    .eq('is_active', true)
    .single();

  if (!connection) {
    const noConnMsg = 'Facebook not connected — cannot fetch real-time stats. Reconnect Facebook in Profile > Facebook & WhatsApp.';
    fbResult.error = noConnMsg;
    errors.push(noConnMsg);
  } else {
    const conn = connection as unknown as MetaConnection;

    // Try user token first (has pages_read_engagement granted), fall back to page token
    const engagementToken = conn.fb_user_access_token || conn.fb_page_access_token;
    let permissionErrorLogged = false;

    for (const postId of campaign.fb_post_ids) {
      // Skip remaining posts if we already know it's a permission issue (won't work for any post)
      if (permissionErrorLogged) break;

      try {
        const eng = await fetchPostEngagement(postId, engagementToken);

        // Check if engagement fetch hit the App Review permission wall
        if (eng.permissionError) {
          permissionErrorLogged = true;
          const permErr = 'Organic engagement stats (likes, comments, shares) are unavailable. The Facebook app needs "pages_read_engagement" Advanced Access (requires Facebook App Review). Reconnecting Facebook will NOT fix this — it is an app-level limitation. Ad spend/clicks/reach from the Marketing API are still available above.';
          fbResult.error = permErr;
          errors.push(permErr);
          continue;
        }

        fbResult.likes += eng.likes;
        fbResult.comments += eng.comments;
        fbResult.shares += eng.shares;
        fbResult.impressions += eng.impressions;
        fbResult.reach += eng.reach;
        fbResult.clicks += eng.clicks;

        // Save snapshot to fb_post_engagement
        const { data: pubLog } = await supabase
          .from('meta_publication_log')
          .select('id')
          .eq('campaign_id', campaignId)
          .eq('fb_post_id', postId)
          .single();

        if (pubLog) {
          try {
            await supabase.from('fb_post_engagement').insert({
              publication_id: (pubLog as { id: string }).id,
              fb_post_id: postId,
              likes_count: eng.likes,
              comments_count: eng.comments,
              shares_count: eng.shares,
              reactions_count: eng.likes,
              impressions: eng.impressions,
              reach: eng.reach,
              clicks: eng.clicks,
            });
          } catch {
            // Snapshot save is best-effort
          }
        }
      } catch (err) {
        const errMsg = safeErrorMsg(err);
        console.error(`[CampaignService] Failed to fetch engagement for ${postId}:`, errMsg);

        if (errMsg.includes('access token') || errMsg.includes('OAuthException') || errMsg.includes('Session has expired')) {
          const tokenErr = 'Facebook access token expired or invalid. Reconnect Facebook in Profile > Facebook & WhatsApp.';
          fbResult.error = tokenErr;
          errors.push(tokenErr);
        } else {
          fbResult.error = `Facebook API error: ${errMsg}`;
          errors.push(`FB engagement error for post ${postId}: ${errMsg}`);
        }
      }
    }
  }

  // Paid ad insights
  let adResult: {
    status: string;
    spend: number;
    impressions: number;
    reach: number;
    clicks: number;
    conversations: number;
    costPerConversation: number;
    error?: string;
  } | null = null;

  const hasAdStatus = campaign.fb_ad_status && campaign.fb_ad_status !== 'none';
  if (hasAdStatus && connection) {
    const conn = connection as unknown as MetaConnection;
    // Marketing API REQUIRES user access token — page tokens cannot access ad insights
    const adToken: string | undefined = conn.fb_user_access_token || undefined;

    if (!adToken) {
      adResult = {
        status: campaign.fb_ad_status!,
        spend: 0, impressions: 0, reach: 0, clicks: 0, conversations: 0, costPerConversation: 0,
        error: 'No user access token available for ad insights. Reconnect Facebook in Profile > Facebook & WhatsApp to grant Marketing API access.',
      };
      errors.push(adResult.error!);
    } else {
      // Try multiple levels: ad → campaign (Facebook Ads Manager shows campaign-level data)
      const idsToTry: Array<{ id: string; level: string }> = [];
      if (campaign.fb_ad_id) idsToTry.push({ id: campaign.fb_ad_id, level: 'ad' });
      if (campaign.fb_campaign_id) idsToTry.push({ id: campaign.fb_campaign_id, level: 'campaign' });

      let foundInsights = false;
      let lastError = '';
      for (const { id, level } of idsToTry) {
        if (foundInsights) break;

        const adInsightsResult = await getAdInsights(id, adToken);

        if (adInsightsResult.data) {
          const insights = adInsightsResult.data;
          const spend = parseFloat(insights.spend) || 0;
          const conversations = (insights.actions || [])
            .filter(a => a.action_type === 'onsite_conversion.messaging_conversation_started_7d')
            .reduce((sum, a) => sum + parseInt(a.value, 10), 0);
          const costPerConv = (insights.cost_per_action_type || [])
            .find(a => a.action_type === 'onsite_conversion.messaging_conversation_started_7d');

          adResult = {
            status: campaign.fb_ad_status!,
            spend,
            impressions: parseInt(insights.impressions, 10) || 0,
            reach: parseInt(insights.reach, 10) || 0,
            clicks: parseInt(insights.clicks, 10) || 0,
            conversations,
            costPerConversation: costPerConv ? parseFloat(costPerConv.value) : 0,
          };
          foundInsights = true;
          console.log(`[CampaignService] Got ad insights from ${level} level (${id}): spend=$${spend} clicks=${adResult.clicks} reach=${adResult.reach}`);
        } else if (adInsightsResult.error) {
          lastError = adInsightsResult.error;
          console.warn(`[CampaignService] Ad insights failed at ${level} level (${id}): ${lastError}`);
        }
      }

      if (!foundInsights) {
        adResult = {
          status: campaign.fb_ad_status!,
          spend: 0, impressions: 0, reach: 0, clicks: 0, conversations: 0, costPerConversation: 0,
        };

        if (lastError) {
          if (lastError.includes('ads_read') || lastError.includes('ads_management')) {
            adResult.error = 'Facebook permission missing for ad insights. Reconnect Facebook in Profile > Facebook & WhatsApp to grant "ads_read" permission.';
          } else if (lastError.includes('access token') || lastError.includes('OAuthException') || lastError.includes('Session has expired')) {
            adResult.error = 'Facebook token expired. Reconnect Facebook in Profile > Facebook & WhatsApp.';
          } else {
            adResult.error = `Ad insights API error: ${lastError}`;
          }
          errors.push(adResult.error!);
        }
      }
    }
  }

  return {
    landing,
    fb: fbResult,
    ad: adResult,
    publishedAt: campaign.fb_published_at,
    ...(errors.length > 0 ? { errors } : {}),
  };
}

/**
 * Delete vehicle FB posts from meta_publication_log.
 * Returns the count of deleted FB posts.
 */
export async function deleteVehicleFBPosts(
  vehicleId: string,
  walletAddress: string
): Promise<{ deletedPostsCount: number }> {
  const supabase = getTypedClient();
  const wallet = walletAddress.toLowerCase();

  // Get all published posts for this vehicle
  const sellerId = await getSellerIdByWallet(walletAddress);
  if (!sellerId) throw new Error('Seller not found');

  const { data: publications } = await supabase
    .from('meta_publication_log')
    .select('id, fb_post_id, connection_id')
    .eq('vehicle_id', vehicleId)
    .eq('seller_id', sellerId)
    .eq('status', 'published');

  if (!publications || publications.length === 0) {
    return { deletedPostsCount: 0 };
  }

  // Get Meta connection for page access token
  const { data: connection } = await supabase
    .from('seller_meta_connections')
    .select('*')
    .eq('wallet_address', wallet)
    .eq('is_active', true)
    .single();

  if (!connection) throw new Error('Facebook not connected');
  const conn = connection as unknown as MetaConnection;

  let deletedCount = 0;
  for (const pub of publications as { id: string; fb_post_id: string | null }[]) {
    if (!pub.fb_post_id) continue;
    try {
      await deletePost(pub.fb_post_id, conn.fb_page_access_token);
      deletedCount++;
    } catch (err) {
      console.error(`[CampaignService] Failed to delete vehicle FB post ${pub.fb_post_id}:`, safeErrorMsg(err));
    }
  }

  // Update publication log entries to 'deleted'
  const pubIds = (publications as { id: string }[]).map(p => p.id);
  await supabase
    .from('meta_publication_log')
    .update({ status: 'deleted' })
    .in('id', pubIds);

  console.log(`[CampaignService] Deleted ${deletedCount} FB posts for vehicle ${vehicleId}`);
  return { deletedPostsCount: deletedCount };
}

/**
 * Count published FB posts for a vehicle.
 */
export async function getVehicleFBPostCount(
  vehicleId: string,
  sellerId: string
): Promise<number> {
  const supabase = getTypedClient();
  const { count } = await supabase
    .from('meta_publication_log')
    .select('id', { count: 'exact', head: true })
    .eq('vehicle_id', vehicleId)
    .eq('seller_id', sellerId)
    .eq('status', 'published');

  return count || 0;
}

// ─────────────────────────────────────────────
// Publish to Facebook
// ─────────────────────────────────────────────

export async function publishToFacebook(
  campaignId: string,
  walletAddress: string
): Promise<{
  fbPostId: string | null;
  permalink: string | null;
  fbAdId: string | null;
  adStatus: 'active' | 'organic_only' | 'error' | 'missing_requirements';
  adMessage: string | null;
}> {
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
      fbAdId: campaign.fb_ad_id || null,
      adStatus: campaign.fb_ad_status === 'active' ? 'active' : campaign.fb_ad_status === 'error' ? 'error' : 'organic_only',
      adMessage: null,
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
    // ── ALL-OR-NOTHING: If campaign has budget, pre-flight checks BEFORE organic post ──
    const adAccountId = conn.ad_account_id;
    const hasBudget = campaign.daily_budget_usd && campaign.daily_budget_usd >= 1;
    const userToken = conn.fb_user_access_token;

    if (hasBudget) {
      const missingReqs: string[] = [];

      if (!adAccountId) {
        missingReqs.push('NO_AD_ACCOUNT: Reconecta Facebook en tu perfil para autorizar permisos de anuncios / Reconnect Facebook in your profile to authorize ad permissions');
      }
      if (!userToken) {
        missingReqs.push('NO_USER_TOKEN: Reconecta Facebook — se necesita el token de usuario para el Marketing API / Reconnect Facebook — user token needed for Marketing API');
      }

      // Live pre-flight checks with Facebook API
      if (missingReqs.length === 0 && userToken && adAccountId) {
        console.log(`[CampaignService] Pre-flight check: token=${userToken.substring(0, 8)}... adAccount=${adAccountId}`);

        const permCheck = await verifyTokenPermissions(userToken);
        console.log(`[CampaignService] Token permissions: valid=${permCheck.tokenValid} granted=[${permCheck.granted.join(',')}] declined=[${permCheck.declined.join(',')}]`);

        if (!permCheck.tokenValid) {
          missingReqs.push('TOKEN_EXPIRED: El token de Facebook ha expirado. Reconecta Facebook en tu perfil / Facebook token expired. Reconnect Facebook in your profile');
        } else if (!permCheck.granted.includes('ads_management')) {
          const declinedNote = permCheck.declined.includes('ads_management')
            ? ' (permiso RECHAZADO por el usuario)'
            : ' (permiso NO otorgado — puede requerir App Review en developers.facebook.com)';
          missingReqs.push(`NO_ADS_PERMISSION: El token no tiene permiso "ads_management"${declinedNote} / Token lacks "ads_management" permission${declinedNote}`);
        }

        if (missingReqs.length === 0) {
          const acctCheck = await verifyAdAccountAccess(adAccountId, userToken);
          console.log(`[CampaignService] Ad account check: accessible=${acctCheck.accessible} status=${acctCheck.accountStatus} disable_reason=${acctCheck.disableReason} name="${acctCheck.name}"`);

          if (!acctCheck.accessible) {
            missingReqs.push(`AD_ACCOUNT_INACCESSIBLE: No se puede acceder al ad account ${adAccountId}. Error: ${acctCheck.error || 'unknown'} / Cannot access ad account`);
          } else if (acctCheck.accountStatus !== 1) {
            const statusMap: Record<number, string> = { 2: 'DISABLED', 3: 'UNSETTLED', 7: 'PENDING_RISK_REVIEW', 8: 'PENDING_SETTLEMENT', 9: 'IN_GRACE_PERIOD', 100: 'PENDING_CLOSURE', 101: 'CLOSED', 201: 'ANY_ACTIVE', 202: 'ANY_CLOSED' };
            const statusName = statusMap[acctCheck.accountStatus] || `UNKNOWN(${acctCheck.accountStatus})`;
            const disableNote = acctCheck.disableReason ? ` (disable_reason=${acctCheck.disableReason})` : '';
            missingReqs.push(`AD_ACCOUNT_NOT_ACTIVE: Ad account "${acctCheck.name}" status=${statusName}${disableNote}. Verifica en business.facebook.com / Check business.facebook.com`);
          }
          // NOTE: We do NOT check canCreateAds here — permitted_tasks/user_role are not
          // available on individual GET /act_{id}. The actual createFBCampaign() call will
          // fail with a clear error if the user lacks permission on this account.
        }
      }

      // ALL-OR-NOTHING: If pre-flight checks fail, ABORT — no organic post either
      if (missingReqs.length > 0) {
        const missingCodes = missingReqs.map(r => r.split(':')[0]).join(', ');
        console.error(`[CampaignService] ALL-OR-NOTHING ABORT for ${campaignId} — missing: ${missingCodes}`);
        // Reset status to draft (nothing was published)
        await supabase
          .from('campaigns')
          .update({ fb_publish_status: 'failed', fb_ad_status: 'error' })
          .eq('id', campaignId);
        throw new Error(`Ad requirements not met — campaign NOT published. Missing: ${missingCodes}. Details: ${missingReqs.join(' | ')}`);
      }

      console.log(`[CampaignService] All pre-flight checks PASSED for ${campaignId} — proceeding to publish`);
    }

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

    // 7. Publish organic post to FB
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

    // ── 10. Paid ad creation — branching by fb_ad_objective ──
    //   awareness:              OUTCOME_AWARENESS + REACH + boost organic post
    //   whatsapp_clicks:        OUTCOME_TRAFFIC + LINK_CLICKS + link ad with wa.me CTA (legacy)
    //   whatsapp_conversations: OUTCOME_ENGAGEMENT + CONVERSATIONS + native CTWA ad (recommended)
    let fbAdId: string | null = null;
    let adStatus: 'active' | 'organic_only' | 'error' | 'missing_requirements' = 'organic_only';
    let adMessage: string | null = null;

    if (hasBudget && adAccountId && userToken && fbPostId) {
      const adObjective: FBAdObjective = campaign.fb_ad_objective || 'whatsapp_conversations';

      // 10.0 Pre-check: whatsapp objectives require phone/whatsapp
      if (adObjective === 'whatsapp_clicks' || adObjective === 'whatsapp_conversations') {
        const whatsappPhone = seller.whatsapp || seller.phone;
        if (!whatsappPhone) {
          // ALL-OR-NOTHING: rollback organic post
          try { await deletePost(fbPostId, conn.fb_page_access_token); } catch { /* best effort */ }
          await supabase.from('campaigns').update({
            fb_publish_status: 'failed', fb_post_ids: [], fb_published_at: null,
            fb_permalink_url: null, fb_ad_status: 'error',
            status: campaign.status === 'active' ? 'draft' : campaign.status,
          }).eq('id', campaignId);
          try { await supabase.from('meta_publication_log').update({ status: 'deleted' }).eq('campaign_id', campaignId).eq('fb_post_id', fbPostId); } catch { /* best effort */ }
          throw new Error('Add your WhatsApp number in your profile to run ads / Agrega tu numero de WhatsApp en tu perfil para crear anuncios');
        }
      }

      try {
        await supabase.from('campaigns').update({ fb_ad_status: 'creating' }).eq('id', campaignId);

        const targeting = buildTargeting(seller.city, seller.state, 50);
        const dailyBudgetCents = Math.round(campaign.daily_budget_usd! * 100);

        let fbCampaignId: string;
        let fbAdSetId: string;
        let fbCreativeId: string;
        let fbAdIdResult: string;

        if (adObjective === 'whatsapp_clicks') {
          // ── WHATSAPP CLICKS: OUTCOME_TRAFFIC + LINK_CLICKS + wa.me link ad ──
          const fbCampaign = await createFBCampaign(adAccountId, userToken, {
            name: `AutoMALL — ${campaign.name}`,
            objective: 'OUTCOME_TRAFFIC',
          });
          fbCampaignId = fbCampaign.id;

          const fbAdSet = await createFBAdSet(adAccountId, userToken, {
            name: `${campaign.name} — Houston Area`,
            campaignId: fbCampaignId,
            dailyBudgetCents,
            pageId: conn.fb_page_id,
            targeting,
            optimizationGoal: 'LINK_CLICKS',
            destinationType: 'WEBSITE',
          });
          fbAdSetId = fbAdSet.id;

          const paidCopy = generatePaidAdCopy({
            campaignType: campaign.type,
            vehicles,
            seller,
            lang: campaign.caption_language,
            discountAmount: 1500,
          });

          const fbCreative = await createFBLinkAdCreative(adAccountId, userToken, {
            name: `Creative — ${campaign.name}`,
            pageId: conn.fb_page_id,
            link: paidCopy.whatsappUrl,
            imageUrl: imageUrls[0],
            message: paidCopy.message,
            headline: paidCopy.headline,
            description: paidCopy.description,
          });
          fbCreativeId = fbCreative.id;

          const fbAd = await createFBAd(adAccountId, userToken, {
            name: `Ad — ${campaign.name}`,
            adsetId: fbAdSetId,
            creativeId: fbCreativeId,
          });
          fbAdIdResult = fbAd.id;

        } else if (adObjective === 'whatsapp_conversations') {
          // ── WHATSAPP CONVERSATIONS: OUTCOME_ENGAGEMENT + CONVERSATIONS ──
          // Strategy: try native CTWA first (best). If WhatsApp not linked to page
          // (error 1487246), fallback to boosting the organic post with ENGAGEMENT
          // objective (same approach as the friend's campaign that gets 55 conversations).
          const whatsappPhone = (seller.whatsapp || seller.phone || '').replace(/\D/g, '');
          let usedCTWA = false;

          // Always start with OUTCOME_ENGAGEMENT campaign
          const fbCampaign = await createFBCampaign(adAccountId, userToken, {
            name: `AutoMALL — ${campaign.name}`,
            objective: 'OUTCOME_ENGAGEMENT',
          });
          fbCampaignId = fbCampaign.id;

          // Try native CTWA ad set (CONVERSATIONS + WHATSAPP destination)
          try {
            const fbAdSet = await createFBAdSet(adAccountId, userToken, {
              name: `${campaign.name} — Houston Area`,
              campaignId: fbCampaignId,
              dailyBudgetCents,
              pageId: conn.fb_page_id,
              targeting,
              optimizationGoal: 'CONVERSATIONS',
              destinationType: 'WHATSAPP',
              whatsappNumber: whatsappPhone,
            });
            fbAdSetId = fbAdSet.id;
            usedCTWA = true;
          } catch (ctwaErr) {
            const ctwaMsg = safeErrorMsg(ctwaErr);
            const isWhatsAppNotLinked = ctwaMsg.includes('1487246') || ctwaMsg.includes('Invalid parameter');
            if (!isWhatsAppNotLinked) throw ctwaErr; // Unknown error — don't swallow

            // Fallback: boost organic post with ENGAGEMENT (like friend's campaign)
            console.warn(`[CampaignService] CTWA failed (WhatsApp not linked to page), falling back to engagement boost: ${ctwaMsg}`);
            const fbAdSet = await createFBAdSet(adAccountId, userToken, {
              name: `${campaign.name} — Houston Area`,
              campaignId: fbCampaignId,
              dailyBudgetCents,
              pageId: conn.fb_page_id,
              targeting,
              // No destinationType, no whatsappNumber — simple engagement boost
            });
            fbAdSetId = fbAdSet.id;
          }

          if (usedCTWA) {
            // ── Full CTWA: native WhatsApp button + greeting + autofill ──
            const paidCopy = generatePaidAdCopy({
              campaignType: campaign.type,
              vehicles,
              seller,
              lang: campaign.caption_language,
              discountAmount: 1500,
            });

            const v0 = vehicles[0];
            const greetingEs = v0
              ? `Hola! Bienvenido a ${seller.business_name || 'Autos MALL'}. Preguntanos sobre el ${v0.year} ${v0.brand} ${v0.model} o cualquier vehiculo de nuestro inventario.`
              : `Hola! Bienvenido a ${seller.business_name || 'Autos MALL'}. Preguntanos sobre nuestros vehiculos disponibles.`;
            const greetingEn = v0
              ? `Hi! Welcome to ${seller.business_name || 'Autos MALL'}. Ask us about the ${v0.year} ${v0.brand} ${v0.model} or any vehicle in our inventory.`
              : `Hi! Welcome to ${seller.business_name || 'Autos MALL'}. Ask us about our available vehicles.`;
            const greeting = campaign.caption_language === 'en' ? greetingEn : greetingEs;

            const autofillEs = v0
              ? `Hola! Vi su anuncio en Facebook. Me interesa el ${v0.year} ${v0.brand} ${v0.model}. Aun esta disponible el descuento de $1,500?`
              : `Hola! Vi su anuncio en Facebook. Aun esta disponible el descuento de $1,500?`;
            const autofillEn = v0
              ? `Hi! I saw your ad on Facebook. I'm interested in the ${v0.year} ${v0.brand} ${v0.model}. Is the $1,500 discount still available?`
              : `Hi! I saw your ad on Facebook. Is the $1,500 discount still available?`;
            const autofill = campaign.caption_language === 'en' ? autofillEn : autofillEs;

            const fbCreative = await createFBCTWACreative(adAccountId, userToken, {
              name: `Creative — ${campaign.name}`,
              pageId: conn.fb_page_id,
              imageUrl: imageUrls[0],
              message: paidCopy.message,
              headline: paidCopy.headline,
              description: paidCopy.description,
              greetingText: greeting,
              autofillMessage: autofill,
            });
            fbCreativeId = fbCreative.id;
          } else {
            // ── Fallback: boost organic post with ENGAGEMENT ──
            // Same approach as the friend's campaign that gets 55 conversations.
            // OUTCOME_ENGAGEMENT still targets engagers (messagers included).
            const objectStoryId = `${conn.fb_page_id}_${fbPostId.split('_').pop()}`;
            const fbCreative = await createFBAdCreative(adAccountId, userToken, {
              name: `Creative — ${campaign.name}`,
              objectStoryId,
            });
            fbCreativeId = fbCreative.id;
            console.log(`[CampaignService] Using engagement boost fallback for ${campaignId} (link WhatsApp to Page for full CTWA)`);
          }

          const fbAd = await createFBAd(adAccountId, userToken, {
            name: `Ad — ${campaign.name}`,
            adsetId: fbAdSetId,
            creativeId: fbCreativeId,
          });
          fbAdIdResult = fbAd.id;

        } else {
          // ── AWARENESS: OUTCOME_AWARENESS + REACH + boost organic post ──
          const fbCampaign = await createFBCampaign(adAccountId, userToken, {
            name: `AutoMALL — ${campaign.name}`,
            objective: 'OUTCOME_AWARENESS',
          });
          fbCampaignId = fbCampaign.id;

          const fbAdSet = await createFBAdSet(adAccountId, userToken, {
            name: `${campaign.name} — Houston Area`,
            campaignId: fbCampaignId,
            dailyBudgetCents,
            pageId: conn.fb_page_id,
            targeting,
            // REACH mode: no optimizationGoal override (defaults to REACH), no destinationType
          });
          fbAdSetId = fbAdSet.id;

          // Boost the organic post via object_story_id
          const objectStoryId = `${conn.fb_page_id}_${fbPostId.split('_').pop()}`;
          const fbCreative = await createFBAdCreative(adAccountId, userToken, {
            name: `Creative — ${campaign.name}`,
            objectStoryId,
          });
          fbCreativeId = fbCreative.id;

          const fbAd = await createFBAd(adAccountId, userToken, {
            name: `Ad — ${campaign.name}`,
            adsetId: fbAdSetId,
            creativeId: fbCreativeId,
          });
          fbAdIdResult = fbAd.id;
        }

        // Activate all objects (campaign → adset → ad)
        await updateFBObjectStatus(fbCampaignId, userToken, 'ACTIVE');
        await updateFBObjectStatus(fbAdSetId, userToken, 'ACTIVE');
        await updateFBObjectStatus(fbAdIdResult, userToken, 'ACTIVE');

        // Save IDs to DB
        await supabase.from('campaigns').update({
          fb_campaign_id: fbCampaignId,
          fb_adset_id: fbAdSetId,
          fb_ad_id: fbAdIdResult,
          fb_creative_id: fbCreativeId,
          fb_ad_status: 'active',
          fb_ad_objective: adObjective,
        }).eq('id', campaignId);

        fbAdId = fbAdIdResult;
        adStatus = 'active';
        adMessage = null;
        console.log(`[CampaignService] Paid ad ACTIVE for ${campaignId} → FB ad ${fbAdIdResult} (objective=${adObjective})`);
      } catch (adErr) {
        // ALL-OR-NOTHING: Ad creation failed AFTER organic post → ROLLBACK organic post
        const errorDetail = safeErrorMsg(adErr);
        console.error(`[CampaignService] Paid ad FAILED for ${campaignId}: ${errorDetail} — ROLLING BACK organic post`);

        try { await deletePost(fbPostId, conn.fb_page_access_token); console.log(`[CampaignService] Rollback: deleted organic post ${fbPostId}`); } catch (delErr) { console.error(`[CampaignService] Rollback: failed to delete ${fbPostId}:`, safeErrorMsg(delErr)); }

        await supabase.from('campaigns').update({
          fb_publish_status: 'failed', fb_post_ids: [], fb_published_at: null,
          fb_permalink_url: null, fb_ad_status: 'error',
          status: campaign.status === 'active' ? 'draft' : campaign.status,
        }).eq('id', campaignId);

        try { await supabase.from('meta_publication_log').update({ status: 'deleted' }).eq('campaign_id', campaignId).eq('fb_post_id', fbPostId); } catch { /* best effort */ }

        throw new Error(`Paid ad creation failed — campaign rolled back. Error: ${errorDetail}`);
      }
    }
    // No budget → organic_only is fine, no error needed

    return { fbPostId, permalink, fbAdId, adStatus, adMessage };
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
// Ad Management (Pause / Resume / Delete)
// ─────────────────────────────────────────────

export async function pauseFBAd(
  campaignId: string,
  walletAddress: string
): Promise<void> {
  const supabase = getTypedClient();
  const campaign = await getCampaignById(campaignId, walletAddress);
  if (!campaign) throw new Error('Campaign not found');
  if (!campaign.fb_campaign_id || !campaign.fb_adset_id || !campaign.fb_ad_id) {
    throw new Error('No paid ad to pause');
  }

  const { data: connection } = await supabase
    .from('seller_meta_connections')
    .select('*')
    .eq('wallet_address', walletAddress.toLowerCase())
    .eq('is_active', true)
    .single();

  if (!connection) throw new Error('Facebook not connected');
  const conn = connection as unknown as MetaConnection;
  const adToken = conn.fb_user_access_token || conn.fb_page_access_token;

  await updateFBObjectStatus(campaign.fb_ad_id, adToken, 'PAUSED');
  await updateFBObjectStatus(campaign.fb_adset_id, adToken, 'PAUSED');
  await updateFBObjectStatus(campaign.fb_campaign_id, adToken, 'PAUSED');

  await supabase
    .from('campaigns')
    .update({ fb_ad_status: 'paused' })
    .eq('id', campaignId);

  console.log(`[CampaignService] Paused FB ad for campaign ${campaignId}`);
}

export async function resumeFBAd(
  campaignId: string,
  walletAddress: string
): Promise<void> {
  const supabase = getTypedClient();
  const campaign = await getCampaignById(campaignId, walletAddress);
  if (!campaign) throw new Error('Campaign not found');
  if (!campaign.fb_campaign_id || !campaign.fb_adset_id || !campaign.fb_ad_id) {
    throw new Error('No paid ad to resume');
  }

  const { data: connection } = await supabase
    .from('seller_meta_connections')
    .select('*')
    .eq('wallet_address', walletAddress.toLowerCase())
    .eq('is_active', true)
    .single();

  if (!connection) throw new Error('Facebook not connected');
  const conn = connection as unknown as MetaConnection;
  const adToken = conn.fb_user_access_token || conn.fb_page_access_token;

  await updateFBObjectStatus(campaign.fb_campaign_id, adToken, 'ACTIVE');
  await updateFBObjectStatus(campaign.fb_adset_id, adToken, 'ACTIVE');
  await updateFBObjectStatus(campaign.fb_ad_id, adToken, 'ACTIVE');

  await supabase
    .from('campaigns')
    .update({ fb_ad_status: 'active' })
    .eq('id', campaignId);

  console.log(`[CampaignService] Resumed FB ad for campaign ${campaignId}`);
}

export async function deleteFBAd(
  campaignId: string,
  walletAddress: string
): Promise<void> {
  const supabase = getTypedClient();
  const campaign = await getCampaignById(campaignId, walletAddress);
  if (!campaign) throw new Error('Campaign not found');
  if (!campaign.fb_campaign_id) return; // nothing to delete

  const { data: connection } = await supabase
    .from('seller_meta_connections')
    .select('*')
    .eq('wallet_address', walletAddress.toLowerCase())
    .eq('is_active', true)
    .single();

  if (!connection) throw new Error('Facebook not connected');
  const conn = connection as unknown as MetaConnection;
  const adToken = conn.fb_user_access_token || conn.fb_page_access_token;

  await deleteFBCampaignObject(campaign.fb_campaign_id, adToken);

  await supabase
    .from('campaigns')
    .update({
      fb_campaign_id: null,
      fb_adset_id: null,
      fb_ad_id: null,
      fb_creative_id: null,
      fb_ad_status: 'none',
    })
    .eq('id', campaignId);

  console.log(`[CampaignService] Deleted FB ad for campaign ${campaignId}`);
}

// ─────────────────────────────────────────────
// Switch Ad Objective (awareness ↔ whatsapp_clicks)
// ─────────────────────────────────────────────

/**
 * Switch the ad objective for a published campaign.
 * Deletes the entire FB ad structure (campaign+adset+ad+creative) and recreates
 * with the new objective. The organic post is NOT touched.
 * Preserves pause/active state across the switch.
 */
export async function switchAdObjective(
  campaignId: string,
  walletAddress: string,
  newObjective: FBAdObjective
): Promise<{
  fbAdId: string;
  adStatus: 'active' | 'paused' | 'error';
  adMessage: string | null;
}> {
  const supabase = getTypedClient();
  const wallet = walletAddress.toLowerCase();

  // 1. Get campaign
  const campaign = await getCampaignById(campaignId, walletAddress);
  if (!campaign) throw new Error('Campaign not found');
  if (!campaign.fb_campaign_id) throw new Error('No paid ad to switch — publish the campaign first');
  if (campaign.fb_post_ids.length === 0) throw new Error('No organic post — publish the campaign first');

  // 2. No-op if same objective
  if (campaign.fb_ad_objective === newObjective) {
    return {
      fbAdId: campaign.fb_ad_id || '',
      adStatus: campaign.fb_ad_status === 'active' ? 'active' : 'paused',
      adMessage: `Objective is already ${newObjective}`,
    };
  }

  // 3. Get Meta connection
  const { data: connection } = await supabase
    .from('seller_meta_connections')
    .select('*')
    .eq('wallet_address', wallet)
    .eq('is_active', true)
    .single();

  if (!connection) throw new Error('Facebook not connected');
  const conn = connection as unknown as MetaConnection;
  const userToken = conn.fb_user_access_token;
  if (!userToken) throw new Error('User token missing — reconnect Facebook');
  const adAccountId = conn.ad_account_id;
  if (!adAccountId) throw new Error('No ad account — reconnect Facebook');

  // 4. Pre-check: whatsapp objectives require phone
  if (newObjective === 'whatsapp_clicks' || newObjective === 'whatsapp_conversations') {
    const seller = await getSellerByWallet(walletAddress);
    if (!seller || (!seller.whatsapp && !seller.phone)) {
      throw new Error('Add your WhatsApp number in your profile / Agrega tu numero de WhatsApp en tu perfil');
    }
  }

  // 5. Remember current state to preserve after switch
  const wasActive = campaign.fb_ad_status === 'active';

  console.log(`[CampaignService] Switching objective for ${campaignId}: ${campaign.fb_ad_objective} → ${newObjective} (was ${wasActive ? 'active' : 'paused'})`);

  // 6. Delete existing FB campaign (cascades to adset/ad/creative)
  try {
    await deleteFBCampaignObject(campaign.fb_campaign_id, userToken);
  } catch (delErr) {
    console.error(`[CampaignService] Failed to delete old campaign:`, safeErrorMsg(delErr));
    // Continue anyway — the old campaign might already be deleted
  }

  // 7. Clear old FB ad fields
  await supabase.from('campaigns').update({
    fb_campaign_id: null,
    fb_adset_id: null,
    fb_ad_id: null,
    fb_creative_id: null,
    fb_ad_status: 'creating',
  }).eq('id', campaignId);

  // 8. Recreate with new objective
  try {
    const seller = await getSellerByWallet(walletAddress);
    if (!seller) throw new Error('Seller not found');

    const vehicles = await getVehiclesForCopy(campaign.vehicle_ids);
    const targeting = buildTargeting(seller.city, seller.state, 50);
    const dailyBudgetCents = Math.round((campaign.daily_budget_usd || 5) * 100);
    const fbPostId = campaign.fb_post_ids[0];

    let fbCampaignId: string;
    let fbAdSetId: string;
    let fbCreativeId: string;
    let fbAdIdResult: string;

    if (newObjective === 'whatsapp_conversations') {
      // ── WHATSAPP CONVERSATIONS: OUTCOME_ENGAGEMENT + CONVERSATIONS + native CTWA ──
      const whatsappPhone = (seller.whatsapp || seller.phone || '').replace(/\D/g, '');
      let usedCTWA = false;

      const fbCampaign = await createFBCampaign(adAccountId, userToken, {
        name: `AutoMALL — ${campaign.name}`,
        objective: 'OUTCOME_ENGAGEMENT',
      });
      fbCampaignId = fbCampaign.id;

      // Try native CTWA, fallback to engagement boost if WhatsApp not linked
      try {
        const fbAdSet = await createFBAdSet(adAccountId, userToken, {
          name: `${campaign.name} — Houston Area`,
          campaignId: fbCampaignId,
          dailyBudgetCents,
          pageId: conn.fb_page_id,
          targeting,
          optimizationGoal: 'CONVERSATIONS',
          destinationType: 'WHATSAPP',
          whatsappNumber: whatsappPhone,
        });
        fbAdSetId = fbAdSet.id;
        usedCTWA = true;
      } catch (ctwaErr) {
        const ctwaMsg = safeErrorMsg(ctwaErr);
        const isWhatsAppNotLinked = ctwaMsg.includes('1487246') || ctwaMsg.includes('Invalid parameter');
        if (!isWhatsAppNotLinked) throw ctwaErr;

        console.warn(`[CampaignService] CTWA failed (WhatsApp not linked), falling back to engagement boost: ${ctwaMsg}`);
        const fbAdSet = await createFBAdSet(adAccountId, userToken, {
          name: `${campaign.name} — Houston Area`,
          campaignId: fbCampaignId,
          dailyBudgetCents,
          pageId: conn.fb_page_id,
          targeting,
        });
        fbAdSetId = fbAdSet.id;
      }

      if (usedCTWA) {
        const imageUrls = await getVehicleImageUrls(campaign.vehicle_ids);
        const paidCopy = generatePaidAdCopy({
          campaignType: campaign.type,
          vehicles,
          seller,
          lang: campaign.caption_language,
          discountAmount: 1500,
        });

        const v0 = vehicles[0];
        const greetingEs = v0
          ? `Hola! Bienvenido a ${seller.business_name || 'Autos MALL'}. Preguntanos sobre el ${v0.year} ${v0.brand} ${v0.model} o cualquier vehiculo de nuestro inventario.`
          : `Hola! Bienvenido a ${seller.business_name || 'Autos MALL'}. Preguntanos sobre nuestros vehiculos disponibles.`;
        const greetingEn = v0
          ? `Hi! Welcome to ${seller.business_name || 'Autos MALL'}. Ask us about the ${v0.year} ${v0.brand} ${v0.model} or any vehicle in our inventory.`
          : `Hi! Welcome to ${seller.business_name || 'Autos MALL'}. Ask us about our available vehicles.`;
        const greeting = campaign.caption_language === 'en' ? greetingEn : greetingEs;

        const autofillEs = v0
          ? `Hola! Vi su anuncio en Facebook. Me interesa el ${v0.year} ${v0.brand} ${v0.model}. Aun esta disponible el descuento de $1,500?`
          : `Hola! Vi su anuncio en Facebook. Aun esta disponible el descuento de $1,500?`;
        const autofillEn = v0
          ? `Hi! I saw your ad on Facebook. I'm interested in the ${v0.year} ${v0.brand} ${v0.model}. Is the $1,500 discount still available?`
          : `Hi! I saw your ad on Facebook. Is the $1,500 discount still available?`;
        const autofill = campaign.caption_language === 'en' ? autofillEn : autofillEs;

        const fbCreative = await createFBCTWACreative(adAccountId, userToken, {
          name: `Creative — ${campaign.name}`,
          pageId: conn.fb_page_id,
          imageUrl: imageUrls[0] || '',
          message: paidCopy.message,
          headline: paidCopy.headline,
          description: paidCopy.description,
          greetingText: greeting,
          autofillMessage: autofill,
        });
        fbCreativeId = fbCreative.id;
      } else {
        const objectStoryId = `${conn.fb_page_id}_${fbPostId.split('_').pop()}`;
        const fbCreative = await createFBAdCreative(adAccountId, userToken, {
          name: `Creative — ${campaign.name}`,
          objectStoryId,
        });
        fbCreativeId = fbCreative.id;
        console.log(`[CampaignService] Switch: using engagement boost fallback for ${campaignId}`);
      }

      const fbAd = await createFBAd(adAccountId, userToken, {
        name: `Ad — ${campaign.name}`,
        adsetId: fbAdSetId,
        creativeId: fbCreativeId,
      });
      fbAdIdResult = fbAd.id;

    } else if (newObjective === 'whatsapp_clicks') {
      // ── WHATSAPP CLICKS (legacy): OUTCOME_TRAFFIC + LINK_CLICKS + wa.me link ad ──
      const fbCampaign = await createFBCampaign(adAccountId, userToken, {
        name: `AutoMALL — ${campaign.name}`,
        objective: 'OUTCOME_TRAFFIC',
      });
      fbCampaignId = fbCampaign.id;

      const fbAdSet = await createFBAdSet(adAccountId, userToken, {
        name: `${campaign.name} — Houston Area`,
        campaignId: fbCampaignId,
        dailyBudgetCents,
        pageId: conn.fb_page_id,
        targeting,
        optimizationGoal: 'LINK_CLICKS',
        destinationType: 'WEBSITE',
      });
      fbAdSetId = fbAdSet.id;

      const imageUrls = await getVehicleImageUrls(campaign.vehicle_ids);
      const paidCopy = generatePaidAdCopy({
        campaignType: campaign.type,
        vehicles,
        seller,
        lang: campaign.caption_language,
        discountAmount: 1500,
      });

      const fbCreative = await createFBLinkAdCreative(adAccountId, userToken, {
        name: `Creative — ${campaign.name}`,
        pageId: conn.fb_page_id,
        link: paidCopy.whatsappUrl,
        imageUrl: imageUrls[0] || '',
        message: paidCopy.message,
        headline: paidCopy.headline,
        description: paidCopy.description,
      });
      fbCreativeId = fbCreative.id;

      const fbAd = await createFBAd(adAccountId, userToken, {
        name: `Ad — ${campaign.name}`,
        adsetId: fbAdSetId,
        creativeId: fbCreativeId,
      });
      fbAdIdResult = fbAd.id;

    } else {
      // ── AWARENESS: OUTCOME_AWARENESS + REACH + boost organic post ──
      const fbCampaign = await createFBCampaign(adAccountId, userToken, {
        name: `AutoMALL — ${campaign.name}`,
        objective: 'OUTCOME_AWARENESS',
      });
      fbCampaignId = fbCampaign.id;

      const fbAdSet = await createFBAdSet(adAccountId, userToken, {
        name: `${campaign.name} — Houston Area`,
        campaignId: fbCampaignId,
        dailyBudgetCents,
        pageId: conn.fb_page_id,
        targeting,
      });
      fbAdSetId = fbAdSet.id;

      const objectStoryId = `${conn.fb_page_id}_${fbPostId.split('_').pop()}`;
      const fbCreative = await createFBAdCreative(adAccountId, userToken, {
        name: `Creative — ${campaign.name}`,
        objectStoryId,
      });
      fbCreativeId = fbCreative.id;

      const fbAd = await createFBAd(adAccountId, userToken, {
        name: `Ad — ${campaign.name}`,
        adsetId: fbAdSetId,
        creativeId: fbCreativeId,
      });
      fbAdIdResult = fbAd.id;
    }

    // 9. Activate or leave paused (preserve previous state)
    const targetStatus: 'ACTIVE' | 'PAUSED' = wasActive ? 'ACTIVE' : 'PAUSED';
    await updateFBObjectStatus(fbCampaignId, userToken, targetStatus);
    await updateFBObjectStatus(fbAdSetId, userToken, targetStatus);
    await updateFBObjectStatus(fbAdIdResult, userToken, targetStatus);

    // 10. Save new IDs + objective
    const finalAdStatus = wasActive ? 'active' : 'paused';
    await supabase.from('campaigns').update({
      fb_campaign_id: fbCampaignId,
      fb_adset_id: fbAdSetId,
      fb_ad_id: fbAdIdResult,
      fb_creative_id: fbCreativeId,
      fb_ad_status: finalAdStatus,
      fb_ad_objective: newObjective,
    }).eq('id', campaignId);

    console.log(`[CampaignService] Objective switched to ${newObjective} for ${campaignId} → FB ad ${fbAdIdResult} (${finalAdStatus})`);

    return {
      fbAdId: fbAdIdResult,
      adStatus: finalAdStatus as 'active' | 'paused',
      adMessage: null,
    };
  } catch (err) {
    const errorDetail = safeErrorMsg(err);
    console.error(`[CampaignService] Switch objective FAILED for ${campaignId}: ${errorDetail}`);

    // Mark as error — organic post is still live
    await supabase.from('campaigns').update({
      fb_ad_status: 'error',
      fb_ad_objective: newObjective,
    }).eq('id', campaignId);

    throw new Error(`Failed to switch ad objective: ${errorDetail}`);
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
    .select('handle, business_name, phone, whatsapp, city, state, address, latitude, longitude')
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
        address: sellerData.address || null,
        latitude: sellerData.latitude || null,
        longitude: sellerData.longitude || null,
      }
    : { handle: 'dealer', business_name: 'Dealer', phone: null, whatsapp: null, city: null, state: null, address: null, latitude: null, longitude: null };

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
