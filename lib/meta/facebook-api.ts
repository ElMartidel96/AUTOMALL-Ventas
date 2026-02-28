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
} from './types';

const GRAPH_API = 'https://graph.facebook.com/v22.0';
const META_APP_ID = process.env.META_APP_ID || '';
const META_APP_SECRET = process.env.META_APP_SECRET || '';
const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || 'autosmall.org';
const CALLBACK_URL = `https://${APP_DOMAIN}/api/meta/oauth/callback`;

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

/** Publish a single-image post to a Facebook page */
export async function publishPhotoPost(
  pageId: string,
  pageAccessToken: string,
  caption: string,
  imageUrl: string
): Promise<FBPostResponse> {
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

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Photo post failed: ${err.error?.message || res.statusText}`);
  }
  return res.json();
}

/** Upload unpublished photo (for carousel) */
export async function uploadUnpublishedPhoto(
  pageId: string,
  pageAccessToken: string,
  imageUrl: string
): Promise<FBPhotoResponse> {
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

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Photo upload failed: ${err.error?.message || res.statusText}`);
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
// OAuth URL Builder
// ─────────────────────────────────────────────

const FB_PERMISSIONS = [
  'pages_manage_posts',
  'pages_read_engagement',
  'pages_show_list',
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
