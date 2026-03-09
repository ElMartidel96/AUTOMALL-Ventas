/**
 * Facebook Graph API v22.0 Wrapper
 *
 * Token exchange, page management, photo upload, and post publishing.
 * No external dependencies — uses native fetch.
 */

import type {
  FBTokenResponse,
  FBPagesResponse,
  FBPage,
  FBPostResponse,
  FBPhotoResponse,
  FBAdAccount,
  FBCampaignResponse,
  FBAdSetResponse,
  FBAdCreativeResponse,
  FBAdResponse,
  FBAdInsightsData,
} from './types';
import type { FBTargeting } from './targeting-helper';

const GRAPH_API = 'https://graph.facebook.com/v22.0';
const META_APP_ID = process.env.META_APP_ID || '';
const META_APP_SECRET = process.env.META_APP_SECRET || '';
const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || 'autosmall.org';
const CALLBACK_URL = `https://${APP_DOMAIN}/api/meta/oauth/callback`;

// ─────────────────────────────────────────────
// Error Extraction — FULL Facebook error details
// ─────────────────────────────────────────────

interface FBAPIError {
  message: string;
  type?: string;
  code?: number;
  error_subcode?: number;
  fbtrace_id?: string;
  error_user_title?: string;
  error_user_msg?: string;
}

function _extractFBError(responseBody: unknown): FBAPIError {
  const body = responseBody as { error?: Record<string, unknown> };
  const e = body?.error || {};
  return {
    message: (e.message as string) || 'Unknown error',
    type: (e.type as string) || undefined,
    code: (e.code as number) || undefined,
    error_subcode: (e.error_subcode as number) || undefined,
    fbtrace_id: (e.fbtrace_id as string) || undefined,
    error_user_title: (e.error_user_title as string) || undefined,
    error_user_msg: (e.error_user_msg as string) || undefined,
  };
}

function _formatFBError(prefix: string, fbErr: FBAPIError): string {
  const parts = [prefix];
  parts.push(fbErr.message);
  if (fbErr.code) parts.push(`(code=${fbErr.code})`);
  if (fbErr.error_subcode) parts.push(`(subcode=${fbErr.error_subcode})`);
  if (fbErr.type) parts.push(`[${fbErr.type}]`);
  if (fbErr.error_user_msg) parts.push(`— ${fbErr.error_user_msg}`);
  return parts.join(' ');
}

function _logFBError(tag: string, fbErr: FBAPIError): void {
  console.error(`[FB-API] ${tag}:`, JSON.stringify(fbErr));
}

// ─────────────────────────────────────────────
// OAuth Token Exchange
// ─────────────────────────────────────────────

/** Exchange authorization code for short-lived user token */
export async function exchangeCodeForToken(code: string): Promise<FBTokenResponse> {
  const url = new URL(`${GRAPH_API}/oauth/access_token`);
  url.searchParams.set('client_id', META_APP_ID);
  url.searchParams.set('client_secret', META_APP_SECRET);
  url.searchParams.set('redirect_uri', CALLBACK_URL);
  url.searchParams.set('code', code);

  const res = await fetch(url.toString());
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Token exchange failed: ${err.error?.message || res.statusText}`);
  }
  return res.json();
}

/** Exchange short-lived token for long-lived user token (60 days) */
export async function getLongLivedToken(shortToken: string): Promise<FBTokenResponse> {
  const url = new URL(`${GRAPH_API}/oauth/access_token`);
  url.searchParams.set('grant_type', 'fb_exchange_token');
  url.searchParams.set('client_id', META_APP_ID);
  url.searchParams.set('client_secret', META_APP_SECRET);
  url.searchParams.set('fb_exchange_token', shortToken);

  const res = await fetch(url.toString());
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Long-lived token exchange failed: ${err.error?.message || res.statusText}`);
  }
  return res.json();
}

// ─────────────────────────────────────────────
// Page Management
// ─────────────────────────────────────────────

/** Get all pages the user manages (using long-lived user token) */
export async function getUserPages(userAccessToken: string): Promise<FBPage[]> {
  const url = new URL(`${GRAPH_API}/me/accounts`);
  url.searchParams.set('access_token', userAccessToken);
  url.searchParams.set('fields', 'id,name,access_token,category');

  const res = await fetch(url.toString());
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Failed to get pages: ${err.error?.message || res.statusText}`);
  }
  const data: FBPagesResponse = await res.json();
  return data.data || [];
}

/** Get page access token from a long-lived user token.
 *  Page tokens obtained this way are PERMANENT (never expire). */
export async function getPageAccessToken(
  userAccessToken: string,
  pageId: string
): Promise<string> {
  const url = new URL(`${GRAPH_API}/${pageId}`);
  url.searchParams.set('fields', 'access_token');
  url.searchParams.set('access_token', userAccessToken);

  const res = await fetch(url.toString());
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Failed to get page token: ${err.error?.message || res.statusText}`);
  }
  const data = await res.json();
  return data.access_token;
}

// ─────────────────────────────────────────────
// Publishing
// ─────────────────────────────────────────────

/**
 * Download image from URL → Buffer.
 * Used to bypass Facebook's inability to fetch images from certain CDNs
 * (e.g. Supabase Storage URLs that return "Missing or invalid image file").
 */
async function downloadImageBlob(imageUrl: string): Promise<{ blob: Blob; mimeType: string }> {
  const res = await fetch(imageUrl);
  if (!res.ok) {
    throw new Error(`Image download failed (${res.status}): ${imageUrl}`);
  }
  const mimeType = res.headers.get('content-type') || 'image/jpeg';
  const blob = await res.blob();
  return { blob, mimeType };
}

/** Publish a single-image post to a Facebook page.
 *  Strategy: try URL-based upload first, fall back to binary upload. */
export async function publishPhotoPost(
  pageId: string,
  pageAccessToken: string,
  caption: string,
  imageUrl: string
): Promise<FBPostResponse> {
  // Try URL-based upload first (faster — Facebook downloads directly)
  try {
    const url = new URL(`${GRAPH_API}/${pageId}/photos`);
    const body = new URLSearchParams();
    body.set('url', imageUrl);
    body.set('caption', caption);
    body.set('access_token', pageAccessToken);

    const res = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (res.ok) return res.json();

    const err = await res.json();
    const errMsg = err.error?.message || res.statusText;
    console.warn(`[FB-API] URL-based photo post failed: ${errMsg} — trying binary upload`);
  } catch (urlErr) {
    console.warn(`[FB-API] URL-based photo post error:`, urlErr);
  }

  // Fallback: download image and upload as binary (multipart/form-data)
  console.log(`[FB-API] Binary fallback: downloading ${imageUrl}`);
  const { blob, mimeType } = await downloadImageBlob(imageUrl);
  const ext = mimeType.includes('png') ? 'png' : 'jpg';

  const formData = new FormData();
  formData.set('source', blob, `photo.${ext}`);
  formData.set('caption', caption);
  formData.set('access_token', pageAccessToken);

  const url = new URL(`${GRAPH_API}/${pageId}/photos`);
  const res = await fetch(url.toString(), { method: 'POST', body: formData });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Photo post failed (binary): ${err.error?.message || res.statusText}`);
  }
  return res.json();
}

/** Upload unpublished photo (for carousel).
 *  Strategy: try URL-based upload first, fall back to binary upload. */
export async function uploadUnpublishedPhoto(
  pageId: string,
  pageAccessToken: string,
  imageUrl: string
): Promise<FBPhotoResponse> {
  // Try URL-based upload first
  try {
    const url = new URL(`${GRAPH_API}/${pageId}/photos`);
    const body = new URLSearchParams();
    body.set('url', imageUrl);
    body.set('published', 'false');
    body.set('access_token', pageAccessToken);

    const res = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (res.ok) return res.json();

    const err = await res.json();
    const errMsg = err.error?.message || res.statusText;
    console.warn(`[FB-API] URL-based photo upload failed: ${errMsg} — trying binary upload`);
  } catch (urlErr) {
    console.warn(`[FB-API] URL-based photo upload error:`, urlErr);
  }

  // Fallback: download and upload as binary
  console.log(`[FB-API] Binary fallback: downloading ${imageUrl}`);
  const { blob, mimeType } = await downloadImageBlob(imageUrl);
  const ext = mimeType.includes('png') ? 'png' : 'jpg';

  const formData = new FormData();
  formData.set('source', blob, `photo.${ext}`);
  formData.set('published', 'false');
  formData.set('access_token', pageAccessToken);

  const url = new URL(`${GRAPH_API}/${pageId}/photos`);
  const res = await fetch(url.toString(), { method: 'POST', body: formData });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Photo upload failed (binary): ${err.error?.message || res.statusText}`);
  }
  return res.json();
}

/** Publish a carousel (multi-image) post to a Facebook page */
export async function publishCarouselPost(
  pageId: string,
  pageAccessToken: string,
  caption: string,
  mediaFbIds: string[]
): Promise<FBPostResponse> {
  const url = new URL(`${GRAPH_API}/${pageId}/feed`);

  const body = new URLSearchParams();
  body.set('message', caption);
  body.set('access_token', pageAccessToken);
  mediaFbIds.forEach((id, i) => {
    body.set(`attached_media[${i}]`, JSON.stringify({ media_fbid: id }));
  });

  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Carousel post failed: ${err.error?.message || res.statusText}`);
  }
  return res.json();
}

// ─────────────────────────────────────────────
// Deletion
// ─────────────────────────────────────────────

/** Delete a post from Facebook.
 *  Treats "already deleted" errors (100/803) as success. */
export async function deletePost(
  fbPostId: string,
  pageAccessToken: string
): Promise<{ success: boolean }> {
  const url = new URL(`${GRAPH_API}/${fbPostId}`);
  url.searchParams.set('access_token', pageAccessToken);

  const res = await fetch(url.toString(), { method: 'DELETE' });

  if (res.ok) {
    const data = await res.json();
    return { success: data.success === true };
  }

  const err = await res.json().catch(() => ({ error: { code: 0, message: res.statusText } }));
  const code = err.error?.code;

  // Post already deleted manually or doesn't exist — treat as success
  if (code === 100 || code === 803) {
    console.log(`[FB-API] Post ${fbPostId} already deleted (code ${code})`);
    return { success: true };
  }

  throw new Error(`Delete post failed: ${err.error?.message || res.statusText}`);
}

// ─────────────────────────────────────────────
// Engagement
// ─────────────────────────────────────────────

/** Fetch engagement metrics for a single post via Graph API */
export async function fetchPostEngagement(
  fbPostId: string,
  pageAccessToken: string
): Promise<{
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
  reach: number;
  clicks: number;
}> {
  // Get basic engagement counts
  const url = new URL(`${GRAPH_API}/${fbPostId}`);
  url.searchParams.set('fields', 'likes.summary(true),comments.summary(true),shares');
  url.searchParams.set('access_token', pageAccessToken);

  const res = await fetch(url.toString());
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Fetch engagement failed: ${err.error?.message || res.statusText}`);
  }

  const data = await res.json();
  const likes = data.likes?.summary?.total_count || 0;
  const comments = data.comments?.summary?.total_count || 0;
  const shares = data.shares?.count || 0;

  // Try to get insights (impressions, reach, clicks) — may fail for non-page posts
  let impressions = 0;
  let reach = 0;
  let clicks = 0;

  try {
    const insightsUrl = new URL(`${GRAPH_API}/${fbPostId}/insights`);
    insightsUrl.searchParams.set('metric', 'post_impressions,post_impressions_unique,post_clicks');
    insightsUrl.searchParams.set('access_token', pageAccessToken);

    const insightsRes = await fetch(insightsUrl.toString());
    if (insightsRes.ok) {
      const insightsData = await insightsRes.json();
      for (const metric of (insightsData.data || []) as { name: string; values: { value: number }[] }[]) {
        const value = metric.values?.[0]?.value || 0;
        if (metric.name === 'post_impressions') impressions = value;
        else if (metric.name === 'post_impressions_unique') reach = value;
        else if (metric.name === 'post_clicks') clicks = value;
      }
    }
  } catch {
    // Insights not available for all post types — ignore
  }

  return { likes, comments, shares, impressions, reach, clicks };
}

// ─────────────────────────────────────────────
// OAuth URL Builder
// ─────────────────────────────────────────────

const FB_PERMISSIONS = [
  'pages_manage_posts',
  'pages_read_engagement',
  'pages_show_list',
  'ads_management',
  'ads_read',
  'business_management',
];

export function buildOAuthUrl(state: string): string {
  const url = new URL('https://www.facebook.com/v22.0/dialog/oauth');
  url.searchParams.set('client_id', META_APP_ID);
  url.searchParams.set('redirect_uri', CALLBACK_URL);
  url.searchParams.set('scope', FB_PERMISSIONS.join(','));
  url.searchParams.set('state', state);
  url.searchParams.set('response_type', 'code');
  return url.toString();
}

// ─────────────────────────────────────────────
// User Info
// ─────────────────────────────────────────────

export async function getFBUserId(accessToken: string): Promise<string> {
  const url = new URL(`${GRAPH_API}/me`);
  url.searchParams.set('fields', 'id');
  url.searchParams.set('access_token', accessToken);

  const res = await fetch(url.toString());
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Failed to get user ID: ${err.error?.message || res.statusText}`);
  }
  const data = await res.json();
  return data.id;
}

// ─────────────────────────────────────────────
// Permission Detection
// ─────────────────────────────────────────────

/** Query Facebook to get actually granted permissions (not hardcoded) */
export async function getGrantedPermissions(userAccessToken: string): Promise<string[]> {
  const url = new URL(`${GRAPH_API}/me/permissions`);
  url.searchParams.set('access_token', userAccessToken);

  const res = await fetch(url.toString());
  if (!res.ok) {
    console.warn('[FB-API] Failed to get permissions, using requested list');
    return FB_PERMISSIONS; // fallback to requested
  }

  const data = await res.json();
  const granted = ((data.data || []) as Array<{ permission: string; status: string }>)
    .filter(p => p.status === 'granted')
    .map(p => p.permission);

  return granted;
}

// ─────────────────────────────────────────────
// Marketing API — Paid Ad Management
// ─────────────────────────────────────────────

/**
 * Discover ad accounts the user can ADVERTISE on.
 * Uses permitted_tasks (v22.0) instead of deprecated user_role.
 * Falls back to /me/adaccounts if assigned_ad_accounts fails.
 */
export async function getUserAdAccounts(userAccessToken: string): Promise<FBAdAccount[]> {
  // Try v22.0 endpoint first: /me/assigned_ad_accounts (includes permitted_tasks)
  let accounts = await _fetchAdAccounts(
    `${GRAPH_API}/me/assigned_ad_accounts`,
    'id,name,account_status,permitted_tasks',
    userAccessToken,
  );

  // Fallback: /me/adaccounts (basic fields only — no deprecated user_role)
  if (accounts === null) {
    console.warn('[FB-API] assigned_ad_accounts failed, falling back to /me/adaccounts');
    accounts = await _fetchAdAccounts(
      `${GRAPH_API}/me/adaccounts`,
      'id,name,account_status',
      userAccessToken,
    );
  }

  if (accounts === null) {
    throw new Error('Failed to get ad accounts from both endpoints');
  }

  // Only active accounts
  return accounts.filter(a => a.account_status === 1);
}

async function _fetchAdAccounts(
  endpoint: string,
  fields: string,
  token: string,
): Promise<FBAdAccount[] | null> {
  const url = new URL(endpoint);
  url.searchParams.set('fields', fields);
  url.searchParams.set('access_token', token);

  const res = await fetch(url.toString());
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const fbErr = _extractFBError(err);
    _logFBError(`_fetchAdAccounts(${endpoint.split('/').pop()})`, fbErr);
    return null; // Signal failure so caller can try fallback
  }
  const data = await res.json();
  return (data.data || []) as FBAdAccount[];
}

/**
 * Pick the BEST ad account for creating ads.
 * Uses permitted_tasks (MANAGE/ADVERTISE) from v22.0 API.
 * Falls back to name heuristic if tasks aren't available.
 */
export function pickWritableAdAccount(accounts: FBAdAccount[]): FBAdAccount | null {
  // 1. Prefer accounts with ADVERTISE or MANAGE permitted_tasks
  const writable = accounts.filter(a =>
    a.permitted_tasks?.includes('ADVERTISE') || a.permitted_tasks?.includes('MANAGE')
  );
  if (writable.length > 0) {
    // Prefer MANAGE (full admin) over just ADVERTISE
    const admin = writable.find(a => a.permitted_tasks?.includes('MANAGE'));
    return admin || writable[0];
  }

  // 2. If permitted_tasks not available (fallback endpoint), use name heuristic
  const notReadOnly = accounts.filter(a =>
    !a.name?.toLowerCase().includes('read-only') &&
    !a.name?.toLowerCase().includes('solo lectura')
  );
  if (notReadOnly.length > 0) return notReadOnly[0];

  // 3. No writable account found
  return null;
}

/**
 * Pre-flight check: verify the token can access the ad account.
 * Uses permitted_tasks (v22.0) instead of deprecated user_role.
 */
export async function verifyAdAccountAccess(
  adAccountId: string,
  accessToken: string
): Promise<{
  accessible: boolean;
  accountStatus: number;
  name: string;
  permittedTasks: string[];
  canCreateAds: boolean;
  error?: string;
}> {
  const accountId = adAccountId.replace(/^act_/, '');
  const url = new URL(`${GRAPH_API}/act_${accountId}`);
  url.searchParams.set('fields', 'id,name,account_status,permitted_tasks,disable_reason');
  url.searchParams.set('access_token', accessToken);

  const res = await fetch(url.toString());
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const fbErr = _extractFBError(err);
    _logFBError('verifyAdAccountAccess', fbErr);
    return {
      accessible: false,
      accountStatus: 0,
      name: '',
      permittedTasks: [],
      canCreateAds: false,
      error: _formatFBError('', fbErr),
    };
  }

  const data = await res.json();
  const permittedTasks = (data.permitted_tasks || []) as string[];
  // MANAGE or ADVERTISE can create ads (v22.0 permitted_tasks)
  const canCreateAds = permittedTasks.includes('MANAGE') || permittedTasks.includes('ADVERTISE');

  return {
    accessible: true,
    accountStatus: data.account_status || 0,
    name: data.name || '',
    permittedTasks,
    canCreateAds,
  };
}

/**
 * Pre-flight check: verify token permissions in real-time.
 * Returns which of the requested permissions are actually granted.
 */
export async function verifyTokenPermissions(
  accessToken: string
): Promise<{ granted: string[]; declined: string[]; tokenValid: boolean }> {
  const url = new URL(`${GRAPH_API}/me/permissions`);
  url.searchParams.set('access_token', accessToken);

  const res = await fetch(url.toString());
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const fbErr = _extractFBError(err);
    _logFBError('verifyTokenPermissions', fbErr);
    // Token invalid or expired
    return { granted: [], declined: [], tokenValid: false };
  }

  const data = await res.json();
  const perms = (data.data || []) as Array<{ permission: string; status: string }>;
  const granted = perms.filter(p => p.status === 'granted').map(p => p.permission);
  const declined = perms.filter(p => p.status === 'declined').map(p => p.permission);

  return { granted, declined, tokenValid: true };
}

/** Create a Facebook campaign with OUTCOME_ENGAGEMENT objective */
export async function createFBCampaign(
  adAccountId: string,
  accessToken: string,
  opts: { name: string }
): Promise<FBCampaignResponse> {
  const accountId = adAccountId.replace(/^act_/, '');
  const url = new URL(`${GRAPH_API}/act_${accountId}/campaigns`);

  const body = new URLSearchParams();
  body.set('name', opts.name);
  body.set('objective', 'OUTCOME_ENGAGEMENT');
  body.set('status', 'PAUSED');
  body.set('special_ad_categories', '[]');
  body.set('access_token', accessToken);

  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const fbErr = _extractFBError(err);
    _logFBError(`createFBCampaign(act_${accountId})`, fbErr);
    throw new Error(_formatFBError('Create campaign failed:', fbErr));
  }
  return res.json();
}

/** Create a Facebook AdSet optimized for WhatsApp conversations */
export async function createFBAdSet(
  adAccountId: string,
  accessToken: string,
  opts: {
    name: string;
    campaignId: string;
    dailyBudgetCents: number;
    pageId: string;
    whatsappNumber: string;
    targeting: FBTargeting;
    startTime?: string;
  }
): Promise<FBAdSetResponse> {
  const accountId = adAccountId.replace(/^act_/, '');
  const url = new URL(`${GRAPH_API}/act_${accountId}/adsets`);

  const body = new URLSearchParams();
  body.set('name', opts.name);
  body.set('campaign_id', opts.campaignId);
  body.set('optimization_goal', 'CONVERSATIONS');
  body.set('destination_type', 'WHATSAPP');
  body.set('billing_event', 'IMPRESSIONS');
  body.set('bid_strategy', 'LOWEST_COST_WITHOUT_CAP');
  body.set('daily_budget', opts.dailyBudgetCents.toString());
  body.set('promoted_object', JSON.stringify({
    page_id: opts.pageId,
    whatsapp_phone_number: opts.whatsappNumber,
  }));
  body.set('targeting', JSON.stringify(opts.targeting));
  body.set('status', 'PAUSED');
  if (opts.startTime) {
    body.set('start_time', opts.startTime);
  }
  body.set('access_token', accessToken);

  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const fbErr = _extractFBError(err);
    _logFBError(`createFBAdSet(act_${accountId})`, fbErr);
    throw new Error(_formatFBError('Create adset failed:', fbErr));
  }
  return res.json();
}

/** Create an ad creative using an existing organic post (object_story_id) */
export async function createFBAdCreative(
  adAccountId: string,
  accessToken: string,
  opts: { name: string; objectStoryId: string }
): Promise<FBAdCreativeResponse> {
  const accountId = adAccountId.replace(/^act_/, '');
  const url = new URL(`${GRAPH_API}/act_${accountId}/adcreatives`);

  const body = new URLSearchParams();
  body.set('name', opts.name);
  body.set('object_story_id', opts.objectStoryId);
  body.set('access_token', accessToken);

  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const fbErr = _extractFBError(err);
    _logFBError(`createFBAdCreative(act_${accountId})`, fbErr);
    throw new Error(_formatFBError('Create ad creative failed:', fbErr));
  }
  return res.json();
}

/** Create an ad that links an adset with a creative */
export async function createFBAd(
  adAccountId: string,
  accessToken: string,
  opts: { name: string; adsetId: string; creativeId: string }
): Promise<FBAdResponse> {
  const accountId = adAccountId.replace(/^act_/, '');
  const url = new URL(`${GRAPH_API}/act_${accountId}/ads`);

  const body = new URLSearchParams();
  body.set('name', opts.name);
  body.set('adset_id', opts.adsetId);
  body.set('creative', JSON.stringify({ creative_id: opts.creativeId }));
  body.set('status', 'PAUSED');
  body.set('access_token', accessToken);

  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const fbErr = _extractFBError(err);
    _logFBError(`createFBAd(act_${accountId})`, fbErr);
    throw new Error(_formatFBError('Create ad failed:', fbErr));
  }
  return res.json();
}

/** Update the status of a campaign, adset, or ad */
export async function updateFBObjectStatus(
  objectId: string,
  accessToken: string,
  status: 'ACTIVE' | 'PAUSED' | 'DELETED'
): Promise<void> {
  const url = new URL(`${GRAPH_API}/${objectId}`);

  const body = new URLSearchParams();
  body.set('status', status);
  body.set('access_token', accessToken);

  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const fbErr = _extractFBError(err);
    _logFBError(`updateFBObjectStatus(${objectId}, ${status})`, fbErr);
    throw new Error(_formatFBError(`Update status failed for ${objectId}:`, fbErr));
  }
}

/** Delete a Facebook campaign object (cascades to adset/ad) */
export async function deleteFBCampaignObject(
  campaignId: string,
  accessToken: string
): Promise<void> {
  const url = new URL(`${GRAPH_API}/${campaignId}`);
  url.searchParams.set('access_token', accessToken);

  const res = await fetch(url.toString(), { method: 'DELETE' });

  if (res.ok) return;

  const err = await res.json().catch(() => ({ error: { code: 0, message: res.statusText } }));
  const fbErr = _extractFBError(err);

  // Already deleted — treat as success
  if (fbErr.code === 100 || fbErr.code === 803) {
    console.log(`[FB-API] Campaign ${campaignId} already deleted (code ${fbErr.code})`);
    return;
  }

  _logFBError(`deleteFBCampaignObject(${campaignId})`, fbErr);
  throw new Error(_formatFBError('Delete campaign failed:', fbErr));
}

/** Get ad insights (spend, impressions, reach, clicks, conversations) */
export async function getAdInsights(
  adId: string,
  accessToken: string
): Promise<FBAdInsightsData | null> {
  const url = new URL(`${GRAPH_API}/${adId}/insights`);
  url.searchParams.set('fields', 'impressions,reach,clicks,spend,actions,cost_per_action_type');
  url.searchParams.set('access_token', accessToken);

  const res = await fetch(url.toString());
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const fbErr = _extractFBError(err);
    console.warn(`[FB-API] Ad insights failed for ${adId}:`, JSON.stringify(fbErr));
    return null;
  }

  const data = await res.json();
  if (!data.data || data.data.length === 0) return null;
  return data.data[0] as FBAdInsightsData;
}
