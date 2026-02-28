/**
 * Meta Pages List
 *
 * GET /api/meta/pages
 * Header: x-wallet-address
 *
 * Returns the pending pages list from the OAuth callback cookie.
 */

import { NextRequest, NextResponse } from 'next/server';
import { FEATURE_META_INTEGRATION } from '@/lib/config/features';

export async function GET(request: NextRequest) {
  if (!FEATURE_META_INTEGRATION) {
    return NextResponse.json({ error: 'Feature not enabled' }, { status: 404 });
  }

  const metaPending = request.cookies.get('meta_pending')?.value;
  if (!metaPending) {
    return NextResponse.json({ error: 'No pending page selection', pages: [] }, { status: 400 });
  }

  try {
    const data = JSON.parse(Buffer.from(metaPending, 'base64url').toString());
    return NextResponse.json({
      success: true,
      pages: data.pages || [],
    });
  } catch {
    return NextResponse.json({ error: 'Invalid pending data' }, { status: 400 });
  }
}
