/**
 * Meta Connection Settings
 *
 * PATCH /api/meta/settings
 * Header: x-wallet-address
 * Body: { auto_publish_on_active?, auto_publish_on_sold?, include_price?, include_hashtags?, caption_language? }
 *
 * Updates auto-publish preferences for the seller's Meta connection.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getTypedClient } from '@/lib/supabase/client';
import { FEATURE_META_INTEGRATION } from '@/lib/config/features';

const settingsSchema = z.object({
  auto_publish_on_active: z.boolean().optional(),
  auto_publish_on_sold: z.boolean().optional(),
  include_price: z.boolean().optional(),
  include_hashtags: z.boolean().optional(),
  caption_language: z.enum(['en', 'es', 'both']).optional(),
});

export async function PATCH(request: NextRequest) {
  if (!FEATURE_META_INTEGRATION) {
    return NextResponse.json({ error: 'Feature not enabled' }, { status: 404 });
  }

  const wallet = request.headers.get('x-wallet-address');
  if (!wallet || !/^0x[a-fA-F0-9]{40}$/i.test(wallet)) {
    return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const parsed = settingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid settings' }, { status: 400 });
    }

    // Only include fields that were actually provided
    const updates: Record<string, unknown> = {};
    const d = parsed.data;
    if (d.auto_publish_on_active !== undefined) updates.auto_publish_on_active = d.auto_publish_on_active;
    if (d.auto_publish_on_sold !== undefined) updates.auto_publish_on_sold = d.auto_publish_on_sold;
    if (d.include_price !== undefined) updates.include_price = d.include_price;
    if (d.include_hashtags !== undefined) updates.include_hashtags = d.include_hashtags;
    if (d.caption_language !== undefined) updates.caption_language = d.caption_language;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No settings to update' }, { status: 400 });
    }

    const supabase = getTypedClient();

    const { error } = await supabase
      .from('seller_meta_connections')
      .update(updates)
      .eq('wallet_address', wallet.toLowerCase())
      .eq('is_active', true);

    if (error) {
      console.error('[MetaSettings] Update error:', error);
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[MetaSettings] Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
