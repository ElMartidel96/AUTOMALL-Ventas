/**
 * Manual Facebook Publish Endpoint
 *
 * POST /api/meta/publish
 * Body: { vehicleId: string, sellerAddress: string }
 *
 * Publishes a vehicle post to the seller's connected Facebook page.
 * Gated by FEATURE_META_INTEGRATION.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTypedClient } from '@/lib/supabase/client';
import { FEATURE_META_INTEGRATION } from '@/lib/config/features';
import {
  publishPhotoPost,
  uploadUnpublishedPhoto,
  publishCarouselPost,
} from '@/lib/meta/facebook-api';
import { generateCaption } from '@/lib/meta/caption-generator';
import type { MetaConnection, VehicleForFeed, SellerForFeed } from '@/lib/meta/types';

const MAX_CAROUSEL_IMAGES = 10;

export async function POST(req: NextRequest) {
  if (!FEATURE_META_INTEGRATION) {
    return NextResponse.json({ error: 'Feature disabled' }, { status: 403 });
  }

  let body: { vehicleId?: string; sellerAddress?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { vehicleId, sellerAddress } = body;

  if (!vehicleId || typeof vehicleId !== 'string') {
    return NextResponse.json({ error: 'vehicleId is required' }, { status: 400 });
  }
  if (!sellerAddress || typeof sellerAddress !== 'string' || !/^0x[a-fA-F0-9]{40}$/.test(sellerAddress)) {
    return NextResponse.json({ error: 'Valid sellerAddress is required' }, { status: 400 });
  }

  const supabase = getTypedClient();

  // Verify Meta connection
  const { data: connectionRow } = await supabase
    .from('seller_meta_connections')
    .select('*')
    .eq('wallet_address', sellerAddress.toLowerCase())
    .eq('is_active', true)
    .single();

  if (!connectionRow) {
    return NextResponse.json({ error: 'No active Meta connection found' }, { status: 404 });
  }

  const conn = connectionRow as unknown as MetaConnection;

  // Get vehicle + verify ownership
  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('id, brand, model, year, price, mileage, condition, transmission, fuel_type, drivetrain, body_type, exterior_color, vin, description, status, seller_address')
    .eq('id', vehicleId)
    .eq('seller_address', sellerAddress.toLowerCase())
    .single();

  if (!vehicle) {
    return NextResponse.json({ error: 'Vehicle not found or not owned by this seller' }, { status: 404 });
  }

  if (vehicle.status !== 'active') {
    return NextResponse.json({ error: 'Only active vehicles can be published' }, { status: 400 });
  }

  // Get seller details
  const { data: seller } = await supabase
    .from('sellers')
    .select('id, handle, business_name, phone, whatsapp, city, state, wallet_address')
    .eq('wallet_address', sellerAddress.toLowerCase())
    .single();

  if (!seller) {
    return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
  }

  const vehicleData: VehicleForFeed = {
    id: vehicle.id,
    brand: vehicle.brand,
    model: vehicle.model,
    year: vehicle.year,
    price: vehicle.price,
    mileage: vehicle.mileage,
    condition: vehicle.condition,
    transmission: vehicle.transmission,
    fuel_type: vehicle.fuel_type,
    drivetrain: vehicle.drivetrain,
    body_type: vehicle.body_type,
    exterior_color: vehicle.exterior_color,
    vin: vehicle.vin,
    description: vehicle.description,
    status: vehicle.status,
    seller_address: vehicle.seller_address,
  };

  const sellerData: SellerForFeed = {
    id: seller.id,
    handle: seller.handle,
    business_name: seller.business_name || seller.handle,
    phone: seller.phone || null,
    whatsapp: seller.whatsapp || null,
    city: seller.city || null,
    state: seller.state || null,
    wallet_address: seller.wallet_address,
  };

  // Generate caption
  const caption = generateCaption({
    postType: 'new_listing',
    vehicle: vehicleData,
    seller: sellerData,
    connection: conn,
  });

  // Get vehicle images
  const { data: images } = await supabase
    .from('vehicle_images')
    .select('id, url, position')
    .eq('vehicle_id', vehicleId)
    .order('position', { ascending: true })
    .limit(MAX_CAROUSEL_IMAGES);

  const imageUrls = (images || []).map((img: { id: string; url: string; position: number }) => img.url);

  if (imageUrls.length === 0) {
    return NextResponse.json({ error: 'Vehicle has no images' }, { status: 400 });
  }

  // Create pending log entry
  const { data: logEntry } = await supabase
    .from('meta_publication_log')
    .insert({
      vehicle_id: vehicleId,
      seller_id: conn.seller_id,
      connection_id: conn.id,
      post_type: 'manual',
      status: 'pending',
      caption,
      image_urls: imageUrls,
    })
    .select('id')
    .single();

  const logId = logEntry?.id;

  try {
    let fbPostId: string | null = null;

    if (imageUrls.length === 1) {
      const result = await publishPhotoPost(
        conn.fb_page_id,
        conn.fb_page_access_token,
        caption,
        imageUrls[0]
      );
      fbPostId = result.id || result.post_id || null;
    } else {
      const photoIds: string[] = [];
      for (const url of imageUrls) {
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

    // Update log as published
    if (logId) {
      await supabase
        .from('meta_publication_log')
        .update({ status: 'published', fb_post_id: fbPostId })
        .eq('id', logId);
    }

    return NextResponse.json({ success: true, fb_post_id: fbPostId });
  } catch (error) {
    // Mark log as failed
    if (logId) {
      await supabase
        .from('meta_publication_log')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
        })
        .eq('id', logId);
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to publish' },
      { status: 500 }
    );
  }
}
