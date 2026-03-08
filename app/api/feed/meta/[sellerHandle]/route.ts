/**
 * Meta Product Feed Endpoint
 *
 * GET /api/feed/meta/[sellerHandle]
 *
 * Returns XML RSS 2.0 feed for Meta Automotive Inventory.
 * Consumed by WhatsApp Business Catalog + Facebook Shop.
 * Public endpoint — no auth required (Meta polls via HTTP).
 *
 * Cache: 1 hour CDN + 2 hour stale-while-revalidate
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTypedClient } from '@/lib/supabase/client';
import { vehicleToFeedItem, generateFeedXml } from '@/lib/meta/feed-generator';
import { FEATURE_META_INTEGRATION } from '@/lib/config/features';
import type { VehicleForFeed, VehicleImage, SellerForFeed } from '@/lib/meta/types';

type RouteContext = { params: Promise<{ sellerHandle: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  if (!FEATURE_META_INTEGRATION) {
    return new NextResponse('Feature not enabled', { status: 404 });
  }

  try {
    const { sellerHandle } = await context.params;

    if (!sellerHandle || sellerHandle.length > 60) {
      return new NextResponse('Invalid seller handle', { status: 400 });
    }

    const supabase = getTypedClient();

    // Get seller by handle
    const { data: seller, error: sellerError } = await supabase
      .from('sellers')
      .select('id, handle, business_name, phone, whatsapp, city, state, address, wallet_address')
      .eq('handle', sellerHandle)
      .single();

    if (sellerError || !seller) {
      return new NextResponse('Seller not found', { status: 404 });
    }

    const sellerData: SellerForFeed = {
      id: seller.id,
      handle: seller.handle,
      business_name: seller.business_name || sellerHandle,
      phone: seller.phone || null,
      whatsapp: seller.whatsapp || null,
      city: seller.city || null,
      state: seller.state || null,
      address: seller.address || null,
      wallet_address: seller.wallet_address,
    };

    // Get active vehicles for this seller
    const { data: vehicles, error: vehiclesError } = await supabase
      .from('vehicles')
      .select('id, brand, model, year, price, mileage, condition, transmission, fuel_type, drivetrain, body_type, exterior_color, vin, description, status, seller_address')
      .eq('seller_address', seller.wallet_address)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (vehiclesError) {
      console.error('[MetaFeed] Vehicles query error:', vehiclesError);
      return new NextResponse('Internal error', { status: 500 });
    }

    const vehicleRows = (vehicles || []) as unknown as VehicleForFeed[];

    if (vehicleRows.length === 0) {
      // Return empty but valid feed
      const xml = generateFeedXml([], sellerData);
      return new NextResponse(xml, {
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        },
      });
    }

    // Get images for all vehicles in one query
    const vehicleIds = vehicleRows.map((v: VehicleForFeed) => v.id);
    const { data: allImages } = await supabase
      .from('vehicle_images')
      .select('id, public_url, display_order, vehicle_id')
      .in('vehicle_id', vehicleIds)
      .order('display_order', { ascending: true });

    // Group images by vehicle_id
    const imagesByVehicle: Record<string, VehicleImage[]> = {};
    for (const img of (allImages || []) as unknown as (VehicleImage & { vehicle_id: string })[]) {
      const vid = img.vehicle_id;
      if (!imagesByVehicle[vid]) imagesByVehicle[vid] = [];
      imagesByVehicle[vid].push({
        id: img.id,
        public_url: img.public_url,
        display_order: img.display_order,
      });
    }

    // Build feed items — skip vehicles without images (Meta requires image_link)
    const feedItems = vehicleRows
      .filter((v: VehicleForFeed) => (imagesByVehicle[v.id] || []).length > 0)
      .map((v: VehicleForFeed) => {
        return vehicleToFeedItem(v, sellerData, imagesByVehicle[v.id]);
      });

    const xml = generateFeedXml(feedItems, sellerData);

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    });
  } catch (error) {
    console.error('[MetaFeed] Error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
