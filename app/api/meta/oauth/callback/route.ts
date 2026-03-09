/**
 * Meta OAuth Callback
 *
 * GET /api/meta/oauth/callback?code=...&state=...
 *
 * Facebook redirects here after user approves.
 * Exchanges code → short-lived token → long-lived token.
 * Fetches user pages and redirects to page selection.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTypedClient } from '@/lib/supabase/client';
import {
  exchangeCodeForToken,
  getLongLivedToken,
  getUserPages,
  getPageAccessToken,
  getFBUserId,
  getUserAdAccounts,
} from '@/lib/meta/facebook-api';
import { FEATURE_META_INTEGRATION } from '@/lib/config/features';
import type { MetaOAuthState } from '@/lib/meta/types';

const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || 'autosmall.org';

export async function GET(request: NextRequest) {
  if (!FEATURE_META_INTEGRATION) {
    return NextResponse.redirect(`https://${APP_DOMAIN}/profile?tab=meta&status=error&reason=disabled`);
  }

  const code = request.nextUrl.searchParams.get('code');
  const stateParam = request.nextUrl.searchParams.get('state');
  const errorParam = request.nextUrl.searchParams.get('error');

  // User denied access
  if (errorParam) {
    return NextResponse.redirect(
      `https://${APP_DOMAIN}/profile?tab=meta&status=denied`
    );
  }

  if (!code || !stateParam) {
    return NextResponse.redirect(
      `https://${APP_DOMAIN}/profile?tab=meta&status=error&reason=missing_params`
    );
  }

  let state: MetaOAuthState;
  try {
    state = JSON.parse(Buffer.from(stateParam, 'base64url').toString());
  } catch {
    return NextResponse.redirect(
      `https://${APP_DOMAIN}/profile?tab=meta&status=error&reason=invalid_state`
    );
  }

  // Validate state freshness (10 min max)
  if (Date.now() - state.timestamp > 10 * 60 * 1000) {
    return NextResponse.redirect(
      `https://${APP_DOMAIN}/profile?tab=meta&status=error&reason=expired`
    );
  }

  try {
    // 1. Exchange code → short-lived token
    const shortTokenResponse = await exchangeCodeForToken(code);

    // 2. Exchange short-lived → long-lived user token
    const longTokenResponse = await getLongLivedToken(shortTokenResponse.access_token);
    const longLivedUserToken = longTokenResponse.access_token;

    // 3. Get FB user ID
    const fbUserId = await getFBUserId(longLivedUserToken);

    // 4. Get user's pages
    const pages = await getUserPages(longLivedUserToken);

    if (pages.length === 0) {
      return NextResponse.redirect(
        `https://${APP_DOMAIN}/profile?tab=meta&status=error&reason=no_pages`
      );
    }

    // Discover ad account (best-effort)
    let adAccountId: string | null = null;
    try {
      const adAccounts = await getUserAdAccounts(longLivedUserToken);
      if (adAccounts.length > 0) adAccountId = adAccounts[0].id;
    } catch {
      // OK — organic only mode, no ad account available
    }

    // If only one page, connect it directly
    if (pages.length === 1) {
      const page = pages[0];
      // Get permanent page access token
      const pageAccessToken = await getPageAccessToken(longLivedUserToken, page.id);

      const supabase = getTypedClient();

      // Upsert connection (one per seller)
      await supabase
        .from('seller_meta_connections')
        .upsert(
          {
            seller_id: state.seller_id,
            wallet_address: state.wallet_address,
            fb_user_id: fbUserId,
            fb_page_id: page.id,
            fb_page_name: page.name,
            fb_page_access_token: pageAccessToken,
            permissions: ['pages_manage_posts', 'pages_read_engagement', 'pages_show_list', 'ads_management', 'ads_read'],
            ad_account_id: adAccountId,
            is_active: true,
            connected_at: new Date().toISOString(),
          },
          { onConflict: 'seller_id' }
        );

      return NextResponse.redirect(
        `https://${APP_DOMAIN}/profile?tab=meta&status=success`
      );
    }

    // Multiple pages — store temp token and redirect to page selection
    // Store the long-lived user token temporarily in a cookie (encrypted)
    const pagesData = pages.map((p) => ({ id: p.id, name: p.name, category: p.category }));
    const tempData = Buffer.from(
      JSON.stringify({
        user_token: longLivedUserToken,
        fb_user_id: fbUserId,
        seller_id: state.seller_id,
        wallet_address: state.wallet_address,
        pages: pagesData,
        ad_account_id: adAccountId,
      })
    ).toString('base64url');

    const response = NextResponse.redirect(
      `https://${APP_DOMAIN}/profile?tab=meta&status=select_page`
    );
    response.cookies.set('meta_pending', tempData, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('[MetaOAuth] Callback error:', error);
    return NextResponse.redirect(
      `https://${APP_DOMAIN}/profile?tab=meta&status=error&reason=exchange_failed`
    );
  }
}
