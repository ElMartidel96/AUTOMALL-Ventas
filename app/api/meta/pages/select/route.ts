/**
 * Meta Page Selection
 *
 * POST /api/meta/pages/select
 * Body: { pageId: "123..." }
 * Cookie: meta_pending (from OAuth callback)
 *
 * Seller selects which Facebook page to connect.
 * Exchanges user token → permanent page access token.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getTypedClient } from '@/lib/supabase/client';
import { getPageAccessToken } from '@/lib/meta/facebook-api';
import { FEATURE_META_INTEGRATION } from '@/lib/config/features';

const selectSchema = z.object({
  pageId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  if (!FEATURE_META_INTEGRATION) {
    return NextResponse.json({ error: 'Feature not enabled' }, { status: 404 });
  }

  const metaPending = request.cookies.get('meta_pending')?.value;
  if (!metaPending) {
    return NextResponse.json({ error: 'No pending page selection' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const parsed = selectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid page ID' }, { status: 400 });
    }

    const pendingData = JSON.parse(Buffer.from(metaPending, 'base64url').toString());
    const { user_token, fb_user_id, seller_id, wallet_address, pages, ad_account_id, permissions } = pendingData;

    // Verify the selected page is in the list
    const selectedPage = pages.find((p: { id: string; name: string }) => p.id === parsed.data.pageId);
    if (!selectedPage) {
      return NextResponse.json({ error: 'Page not in your pages list' }, { status: 400 });
    }

    // Get permanent page access token
    const pageAccessToken = await getPageAccessToken(user_token, selectedPage.id);

    const supabase = getTypedClient();

    // Upsert connection — store both page token (organic) and user token (Marketing API)
    const { error } = await supabase
      .from('seller_meta_connections')
      .upsert(
        {
          seller_id,
          wallet_address,
          fb_user_id,
          fb_page_id: selectedPage.id,
          fb_page_name: selectedPage.name,
          fb_page_access_token: pageAccessToken,
          fb_user_access_token: user_token,
          permissions: permissions || ['pages_manage_posts', 'pages_read_engagement', 'pages_show_list'],
          ad_account_id: ad_account_id || null,
          is_active: true,
          connected_at: new Date().toISOString(),
        },
        { onConflict: 'seller_id' }
      );

    if (error) {
      console.error('[MetaPages] Save error:', error);
      return NextResponse.json({ error: 'Failed to save connection' }, { status: 500 });
    }

    // Clear pending cookie
    const response = NextResponse.json({ success: true, page_name: selectedPage.name });
    response.cookies.set('meta_pending', '', { maxAge: 0, path: '/' });
    return response;
  } catch (error) {
    console.error('[MetaPages] Select error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
