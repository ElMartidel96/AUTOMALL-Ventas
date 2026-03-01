/**
 * Public Catalog API — Vehicle detail
 *
 * GET /api/catalog/[id]
 *
 * Returns full vehicle detail with images and related vehicles.
 * Only active vehicles are visible. Increments views_count.
 * seller_address is excluded from response.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTypedClient } from '@/lib/supabase/client';

function sanitizeVehicle(v: Record<string, unknown>) {
  const { seller_address: _, ...safe } = v;
  return safe;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Vehicle ID is required', success: false },
        { status: 400 }
      );
    }

    const supabase = getTypedClient();

    // Fetch vehicle — only active
    const { data: vehicle, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', id)
      .eq('status', 'active')
      .single();

    if (error || !vehicle) {
      return NextResponse.json(
        { error: 'Vehicle not found', success: false },
        { status: 404 }
      );
    }

    // Fetch images
    const { data: images } = await supabase
      .from('vehicle_images')
      .select('*')
      .eq('vehicle_id', id)
      .order('display_order', { ascending: true });

    // Fetch related vehicles (same brand, active, not this one)
    const { data: related } = await supabase
      .from('vehicles')
      .select('*')
      .eq('brand', vehicle.brand)
      .eq('status', 'active')
      .neq('id', id)
      .limit(4);

    // Lookup seller contact if vehicle has seller_handle
    let sellerContact: {
      business_name: string
      phone: string | null
      whatsapp: string | null
      logo_url: string | null
      address: string | null
      city: string | null
      state: string | null
      latitude: number | null
      longitude: number | null
    } | undefined;
    const vehicleSafe = sanitizeVehicle(vehicle);
    if (vehicleSafe.seller_handle) {
      const { data: sellerData } = await supabase
        .from('sellers')
        .select('business_name, phone, whatsapp, logo_url, address, city, state, latitude, longitude')
        .eq('handle', vehicleSafe.seller_handle)
        .eq('is_active', true)
        .single();
      if (sellerData) {
        sellerContact = {
          business_name: sellerData.business_name,
          phone: sellerData.phone || null,
          whatsapp: sellerData.whatsapp || null,
          logo_url: sellerData.logo_url || null,
          address: sellerData.address || null,
          city: sellerData.city || null,
          state: sellerData.state || null,
          latitude: sellerData.latitude ?? null,
          longitude: sellerData.longitude ?? null,
        };
      }
    }

    // Increment views_count
    supabase
      .from('vehicles')
      .update({ views_count: (vehicle.views_count || 0) + 1 })
      .eq('id', id)
      .then(() => {});

    const response = NextResponse.json({
      success: true,
      data: {
        ...vehicleSafe,
        contact_phone: vehicleSafe.contact_phone ?? null,
        contact_whatsapp: vehicleSafe.contact_whatsapp ?? null,
        contact_city: vehicleSafe.contact_city ?? null,
        contact_state: vehicleSafe.contact_state ?? null,
        seller_contact: sellerContact,
        images: images || [],
        related: (related || []).map(sanitizeVehicle),
      },
    });

    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return response;
  } catch (error) {
    console.error('[Catalog] Detail error:', error);
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    );
  }
}
