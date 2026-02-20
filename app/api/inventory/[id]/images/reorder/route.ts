/**
 * Vehicle Image Reorder API
 *
 * PUT /api/inventory/[id]/images/reorder
 * Body: { seller: "0x...", imageIds: ["uuid1", "uuid2", ...] }
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getTypedClient } from '@/lib/supabase/client';

const reorderSchema = z.object({
  seller: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  imageIds: z.array(z.string().uuid()).min(1).max(10),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id: vehicleId } = await context.params;
    const body = await request.json();
    const parsed = reorderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', success: false },
        { status: 400 }
      );
    }

    const supabase = getTypedClient();
    const sellerAddr = parsed.data.seller.toLowerCase();

    // Verify ownership
    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('seller_address')
      .eq('id', vehicleId)
      .single();

    if (!vehicle || vehicle.seller_address !== sellerAddr) {
      return NextResponse.json(
        { error: 'Unauthorized', success: false },
        { status: 403 }
      );
    }

    // Update display_order for each image
    const updates = parsed.data.imageIds.map((imageId, index) =>
      supabase
        .from('vehicle_images')
        .update({
          display_order: index,
          is_primary: index === 0,
        })
        .eq('id', imageId)
        .eq('vehicle_id', vehicleId)
    );

    await Promise.all(updates);

    // Update primary_image_url on vehicle
    const { data: primary } = await supabase
      .from('vehicle_images')
      .select('public_url')
      .eq('vehicle_id', vehicleId)
      .eq('is_primary', true)
      .single();

    if (primary) {
      await supabase
        .from('vehicles')
        .update({ primary_image_url: primary.public_url })
        .eq('id', vehicleId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Inventory] Reorder error:', error);
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    );
  }
}
