/**
 * Campaign Facebook Publish Endpoint
 *
 * POST /api/campaigns/[id]/publish
 * Body: { wallet_address: string }
 *
 * Publishes all campaign vehicles to the seller's Facebook page as a
 * carousel post with campaign-optimized copy. Links the publications
 * back to the campaign for tracking.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTypedClient } from '@/lib/supabase/client';
import { FEATURE_META_INTEGRATION, FEATURE_CAMPAIGNS } from '@/lib/config/features';
import {
  publishPhotoPost,
  uploadUnpublishedPhoto,
  publishCarouselPost,
} from '@/lib/meta/facebook-api';
import type { MetaConnection } from '@/lib/meta/types';

type RouteContext = { params: Promise<{ id: string }> };

const MAX_CAROUSEL_IMAGES = 10;
const DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || 'autosmall.org';

export async function POST(req: NextRequest, context: RouteContext) {
  if (!FEATURE_META_INTEGRATION || !FEATURE_CAMPAIGNS) {
    return NextResponse.json({ error: 'Feature disabled' }, { status: 403 });
  }

  const { id: campaignId } = await context.params;

  let body: { wallet_address?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { wallet_address } = body;
  if (!wallet_address) {
    return NextResponse.json({ error: 'Missing wallet_address' }, { status: 400 });
  }

  const supabase = getTypedClient();

  // 1. Verify campaign exists and belongs to seller
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', campaignId)
    .eq('wallet_address', wallet_address)
    .single();

  if (!campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  }

  const campaignData = campaign as Record<string, unknown>;

  // 2. Get Meta connection
  const { data: connectionRow } = await supabase
    .from('seller_meta_connections')
    .select('*')
    .eq('wallet_address', wallet_address.toLowerCase())
    .eq('is_active', true)
    .single();

  if (!connectionRow) {
    return NextResponse.json({ error: 'No active Facebook connection. Connect your page first.' }, { status: 404 });
  }

  const conn = connectionRow as unknown as MetaConnection;

  // 3. Get vehicles in the campaign
  const vehicleIds = (campaignData.vehicle_ids as string[]) || [];
  if (vehicleIds.length === 0) {
    return NextResponse.json({ error: 'Campaign has no vehicles' }, { status: 400 });
  }

  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('id, brand, model, year, price, mileage, condition, status')
    .in('id', vehicleIds)
    .eq('status', 'active');

  if (!vehicles || vehicles.length === 0) {
    return NextResponse.json({ error: 'No active vehicles found' }, { status: 400 });
  }

  // 4. Get seller info
  const { data: seller } = await supabase
    .from('sellers')
    .select('id, handle, business_name, phone, whatsapp, city, state')
    .eq('wallet_address', wallet_address.toLowerCase())
    .single();

  if (!seller) {
    return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
  }

  // 5. Mark campaign as publishing
  await supabase
    .from('campaigns')
    .update({ fb_publish_status: 'publishing' })
    .eq('id', campaignId);

  // 6. Get all images for campaign vehicles
  const vIds = vehicles.map((v: { id: string }) => v.id);
  const { data: allImages } = await supabase
    .from('vehicle_images')
    .select('vehicle_id, public_url, display_order')
    .in('vehicle_id', vIds)
    .order('display_order', { ascending: true });

  // Group images by vehicle, take first per vehicle for campaign post
  const imagesByVehicle: Record<string, string[]> = {};
  for (const img of (allImages || []) as { vehicle_id: string; public_url: string }[]) {
    if (!imagesByVehicle[img.vehicle_id]) imagesByVehicle[img.vehicle_id] = [];
    imagesByVehicle[img.vehicle_id].push(img.public_url);
  }

  // 7. Build campaign caption
  const landingSlug = campaignData.landing_slug as string;
  const landingUrl = `https://${DOMAIN}/w/${landingSlug}`;
  const headlineEn = campaignData.headline_en as string || '';
  const headlineEs = campaignData.headline_es as string || '';
  const bodyEn = campaignData.body_en as string || '';
  const bodyEs = campaignData.body_es as string || '';
  const captionLang = campaignData.caption_language as string || 'both';
  const sellerHandle = (seller as { handle: string }).handle;
  const sellerWhatsapp = (seller as { whatsapp: string | null }).whatsapp;
  const sellerPhone = (seller as { phone: string | null }).phone;

  let caption = '';
  if (captionLang === 'en' || captionLang === 'both') {
    caption += `${headlineEn}\n\n${bodyEn}\n`;
  }
  if (captionLang === 'both') {
    caption += '\n---\n\n';
  }
  if (captionLang === 'es' || captionLang === 'both') {
    caption += `${headlineEs}\n\n${bodyEs}\n`;
  }

  // Add vehicle list
  caption += '\n';
  for (const v of vehicles as { brand: string; model: string; year: number; price: number }[]) {
    const price = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v.price);
    caption += `• ${v.year} ${v.brand} ${v.model} — ${price}\n`;
  }

  // Add contact info + landing page
  caption += '\n';
  if (sellerWhatsapp) caption += `💬 wa.me/${sellerWhatsapp.replace(/\D/g, '')}\n`;
  if (sellerPhone) caption += `📞 ${sellerPhone}\n`;
  caption += `🔗 ${landingUrl}\n`;

  // Hashtags
  caption += '\n#AutosHouston #CarsForSale #HoustonCars #UsedCars #AutosUsados';

  // 8. Collect up to MAX_CAROUSEL_IMAGES (1 per vehicle, then fill from first vehicle)
  const campaignImages: string[] = [];
  for (const v of vehicles as { id: string }[]) {
    const imgs = imagesByVehicle[v.id];
    if (imgs && imgs.length > 0) {
      campaignImages.push(imgs[0]);
    }
    if (campaignImages.length >= MAX_CAROUSEL_IMAGES) break;
  }

  if (campaignImages.length === 0) {
    await supabase
      .from('campaigns')
      .update({ fb_publish_status: 'failed' })
      .eq('id', campaignId);
    return NextResponse.json({ error: 'No vehicle images available' }, { status: 400 });
  }

  // 9. Publish to Facebook
  try {
    let fbPostId: string | null = null;
    let permalinkUrl: string | null = null;

    if (campaignImages.length === 1) {
      const result = await publishPhotoPost(
        conn.fb_page_id,
        conn.fb_page_access_token,
        caption,
        campaignImages[0]
      );
      fbPostId = result.id || result.post_id || null;
    } else {
      const photoIds: string[] = [];
      for (const url of campaignImages) {
        const photo = await uploadUnpublishedPhoto(
          conn.fb_page_id,
          conn.fb_page_access_token,
          url
        );
        photoIds.push(photo.id);
      }
      const result = await publishCarouselPost(
        conn.fb_page_id,
        conn.fb_page_access_token,
        caption,
        photoIds
      );
      fbPostId = result.id || null;
    }

    // Fetch permalink
    if (fbPostId) {
      try {
        const plRes = await fetch(
          `https://graph.facebook.com/v22.0/${fbPostId}?fields=permalink_url&access_token=${conn.fb_page_access_token}`
        );
        if (plRes.ok) {
          const plData = await plRes.json();
          permalinkUrl = plData.permalink_url || null;
        }
      } catch {
        // Non-critical
      }
    }

    // 10. Log publication with campaign correlation
    await supabase
      .from('meta_publication_log')
      .insert({
        vehicle_id: vIds[0], // Primary vehicle
        seller_id: (seller as { id: string }).id,
        connection_id: conn.id,
        post_type: 'campaign',
        status: 'published',
        fb_post_id: fbPostId,
        permalink_url: permalinkUrl,
        caption,
        image_urls: campaignImages,
        campaign_id: campaignId,
      });

    // 11. Update campaign with FB data
    await supabase
      .from('campaigns')
      .update({
        fb_post_ids: fbPostId ? [fbPostId] : [],
        fb_published_at: new Date().toISOString(),
        fb_publish_status: 'published',
      })
      .eq('id', campaignId);

    return NextResponse.json({
      success: true,
      fb_post_id: fbPostId,
      permalink_url: permalinkUrl,
    });
  } catch (error) {
    console.error('[CampaignPublish] Error:', error);

    await supabase
      .from('campaigns')
      .update({ fb_publish_status: 'failed' })
      .eq('id', campaignId);

    // Log failed attempt
    await supabase
      .from('meta_publication_log')
      .insert({
        vehicle_id: vIds[0],
        seller_id: (seller as { id: string }).id,
        connection_id: conn.id,
        post_type: 'campaign',
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        caption,
        image_urls: campaignImages,
        campaign_id: campaignId,
      });

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to publish' },
      { status: 500 }
    );
  }
}
