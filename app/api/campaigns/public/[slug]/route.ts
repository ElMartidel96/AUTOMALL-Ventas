/**
 * Public Campaign Data — GET
 *
 * No auth required. Serves data for the landing page.
 * Returns campaign + vehicles + seller (no sensitive data).
 * Cache: s-maxage=300 (5 minutes CDN cache)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCampaignBySlug } from '@/lib/campaigns/campaign-service';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  if (!slug || slug.length < 3) {
    return NextResponse.json({ error: 'Invalid slug' }, { status: 400 });
  }

  try {
    const data = await getCampaignBySlug(slug);

    if (!data) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    return NextResponse.json({ campaign: data }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (err) {
    console.error('[API] GET /api/campaigns/public/[slug] error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
