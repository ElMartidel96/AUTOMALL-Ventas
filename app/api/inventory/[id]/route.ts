/**
 * Vehicle Detail API — Get + Update + Delete
 *
 * GET    /api/inventory/[id]
 * PUT    /api/inventory/[id]
 * DELETE /api/inventory/[id]?seller=0x...
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getTypedClient } from '@/lib/supabase/client';

const updateVehicleSchema = z.object({
  seller_address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  vin: z.string().max(17).optional().nullable(),
  brand: z.string().min(1).max(50).optional(),
  model: z.string().min(1).max(100).optional(),
  year: z.coerce.number().int().min(1900).max(2030).optional(),
  trim: z.string().max(100).optional().nullable(),
  body_type: z.string().max(50).optional().nullable(),
  doors: z.coerce.number().int().min(1).max(6).optional().nullable(),
  price: z.coerce.number().positive().max(99999999).optional(),
  price_negotiable: z.boolean().optional(),
  mileage: z.coerce.number().int().min(0).max(9999999).optional(),
  condition: z.enum(['new', 'like_new', 'excellent', 'good', 'fair']).optional(),
  exterior_color: z.string().max(50).optional().nullable(),
  interior_color: z.string().max(50).optional().nullable(),
  transmission: z.enum(['automatic', 'manual', 'cvt']).optional().nullable(),
  fuel_type: z.enum(['gasoline', 'diesel', 'electric', 'hybrid', 'plugin_hybrid']).optional().nullable(),
  drivetrain: z.enum(['fwd', 'rwd', 'awd', '4wd']).optional().nullable(),
  engine: z.string().max(100).optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  features: z.array(z.string().max(100)).max(50).optional(),
  contact_phone: z.string().max(20).optional().nullable(),
  contact_whatsapp: z.string().max(20).optional().nullable(),
  contact_city: z.string().max(100).optional().nullable(),
  contact_state: z.string().max(50).optional().nullable(),
  latitude: z.coerce.number().min(-90).max(90).optional().nullable(),
  longitude: z.coerce.number().min(-180).max(180).optional().nullable(),
  location_source: z.enum(['dealer', 'manual', 'geolocated']).optional().nullable(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = getTypedClient();

    const { data: vehicle, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !vehicle) {
      return NextResponse.json(
        { error: 'Vehicle not found', success: false },
        { status: 404 }
      );
    }

    const { data: images } = await supabase
      .from('vehicle_images')
      .select('*')
      .eq('vehicle_id', id)
      .order('display_order', { ascending: true });

    return NextResponse.json({
      success: true,
      data: { ...vehicle, images: images || [] },
    });
  } catch (error) {
    console.error('[Inventory] GET detail error:', error);
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = updateVehicleSchema.safeParse(body);

    if (!parsed.success) {
      const details = parsed.error.flatten();
      console.error('[Inventory] Update validation failed:', JSON.stringify(details));
      return NextResponse.json(
        { error: 'Validation failed', details, success: false },
        { status: 400 }
      );
    }

    const supabase = getTypedClient();
    const sellerAddress = parsed.data.seller_address.toLowerCase();

    // Verify ownership
    const { data: existing } = await supabase
      .from('vehicles')
      .select('seller_address')
      .eq('id', id)
      .single();

    if (!existing || existing.seller_address !== sellerAddress) {
      return NextResponse.json(
        { error: 'Vehicle not found or unauthorized', success: false },
        { status: 403 }
      );
    }

    // Remove seller_address from update payload (used for auth only)
    const { seller_address: _, ...updateData } = parsed.data;

    // First attempt: include geo fields (latitude, longitude, location_source)
    // If the columns don't exist yet (migration not run), retry without them
    let data;
    let error;

    ({ data, error } = await supabase
      .from('vehicles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single());

    if (error && error.code === 'PGRST204') {
      // Column not found — likely geo columns not yet in DB. Strip them and retry.
      const { latitude: _lat, longitude: _lng, location_source: _src, ...safeData } = updateData;
      console.warn('[Inventory] Geo columns missing, retrying without them');
      ({ data, error } = await supabase
        .from('vehicles')
        .update(safeData)
        .eq('id', id)
        .select()
        .single());
    }

    if (error) {
      console.error('[Inventory] Update error:', error);
      return NextResponse.json(
        { error: 'Failed to update vehicle', success: false },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[Inventory] PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const seller = searchParams.get('seller');

    if (!seller) {
      return NextResponse.json(
        { error: 'seller parameter is required', success: false },
        { status: 400 }
      );
    }

    const supabase = getTypedClient();
    const sellerAddress = seller.toLowerCase();

    // Verify ownership
    const { data: existing } = await supabase
      .from('vehicles')
      .select('seller_address')
      .eq('id', id)
      .single();

    if (!existing || existing.seller_address !== sellerAddress) {
      return NextResponse.json(
        { error: 'Vehicle not found or unauthorized', success: false },
        { status: 403 }
      );
    }

    // Get images to delete from storage
    const { data: images } = await supabase
      .from('vehicle_images')
      .select('storage_path')
      .eq('vehicle_id', id);

    // Delete images from storage
    if (images && images.length > 0) {
      const paths = images.map((img: { storage_path: string }) => img.storage_path);
      await supabase.storage.from('vehicle-images').remove(paths);
    }

    // Delete vehicle (cascades to vehicle_images via FK)
    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[Inventory] Delete error:', error);
      return NextResponse.json(
        { error: 'Failed to delete vehicle', success: false },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Inventory] DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    );
  }
}
