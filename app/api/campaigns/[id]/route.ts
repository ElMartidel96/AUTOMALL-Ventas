/**
 * Campaign Detail API
 *
 * GET    /api/campaigns/[id]  — Get campaign by ID (public for landing pages)
 * PATCH  /api/campaigns/[id]  — Update campaign
 * DELETE /api/campaigns/[id]  — Delete campaign
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTypedClient } from '@/lib/supabase/client';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = getTypedClient();

    // Campaign can be fetched by ID or by slug
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    let query = supabase.from('campaigns').select('*');
    if (isUuid) {
      query = query.eq('id', id);
    } else {
      query = query.eq('landing_slug', id);
    }

    const { data: campaign, error } = await query.single();

    if (error || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Get seller info for landing page
    const { data: seller } = await supabase
      .from('sellers')
      .select('id, handle, business_name, phone, whatsapp, city, state, logo_url')
      .eq('id', (campaign as Record<string, unknown>).seller_id)
      .single();

    // Get vehicles if campaign has vehicle_ids
    const vehicleIds = (campaign as Record<string, unknown>).vehicle_ids as string[] || [];
    let vehicles: Record<string, unknown>[] = [];

    if (vehicleIds.length > 0) {
      const { data: vehicleData } = await supabase
        .from('vehicles')
        .select('id, brand, model, year, price, mileage, condition, transmission, fuel_type, body_type, exterior_color, status')
        .in('id', vehicleIds)
        .eq('status', 'active');

      if (vehicleData) {
        // Get images for vehicles
        const vIds = vehicleData.map((v: { id: string }) => v.id);
        const { data: images } = await supabase
          .from('vehicle_images')
          .select('vehicle_id, public_url, display_order')
          .in('vehicle_id', vIds)
          .order('display_order', { ascending: true });

        const imageMap: Record<string, string> = {};
        for (const img of (images || []) as { vehicle_id: string; public_url: string }[]) {
          if (!imageMap[img.vehicle_id]) {
            imageMap[img.vehicle_id] = img.public_url;
          }
        }

        vehicles = vehicleData.map((v: { id: string }) => ({
          ...v,
          image_url: imageMap[v.id] || null,
        }));
      }
    }

    // Get lead count
    const { count } = await supabase
      .from('campaign_leads')
      .select('id', { count: 'exact', head: true })
      .eq('campaign_id', (campaign as Record<string, unknown>).id);

    return NextResponse.json({
      campaign,
      seller,
      vehicles,
      lead_count: count || 0,
    });
  } catch (error) {
    console.error('[Campaign] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { wallet_address, ...updates } = body;

    if (!wallet_address) {
      return NextResponse.json({ error: 'Missing wallet_address' }, { status: 400 });
    }

    const supabase = getTypedClient();

    const { data: campaign, error } = await supabase
      .from('campaigns')
      .update(updates)
      .eq('id', id)
      .eq('wallet_address', wallet_address)
      .select()
      .single();

    if (error || !campaign) {
      return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 });
    }

    return NextResponse.json({ campaign });
  } catch (error) {
    console.error('[Campaign] PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const wallet = request.nextUrl.searchParams.get('wallet');

    if (!wallet) {
      return NextResponse.json({ error: 'Missing wallet parameter' }, { status: 400 });
    }

    const supabase = getTypedClient();

    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', id)
      .eq('wallet_address', wallet);

    if (error) {
      return NextResponse.json({ error: 'Failed to delete campaign' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Campaign] DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
