/**
 * Vehicle Status API
 *
 * PUT /api/inventory/[id]/status
 * Body: { seller: "0x...", status: "active" | "sold" | "archived" | "draft" }
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getTypedClient } from '@/lib/supabase/client';

const statusSchema = z.object({
  seller: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  status: z.enum(['draft', 'active', 'sold', 'archived']),
});

// Allowed status transitions
const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ['active', 'archived'],
  active: ['sold', 'archived', 'draft'],
  sold: ['archived'],
  archived: ['draft'],
};

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id: vehicleId } = await context.params;
    const body = await request.json();
    const parsed = statusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', success: false },
        { status: 400 }
      );
    }

    const supabase = getTypedClient();
    const sellerAddr = parsed.data.seller.toLowerCase();
    const newStatus = parsed.data.status;

    // Get current vehicle
    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('seller_address, status')
      .eq('id', vehicleId)
      .single();

    if (!vehicle || vehicle.seller_address !== sellerAddr) {
      return NextResponse.json(
        { error: 'Vehicle not found or unauthorized', success: false },
        { status: 403 }
      );
    }

    // Validate transition
    const allowed = VALID_TRANSITIONS[vehicle.status] || [];
    if (!allowed.includes(newStatus)) {
      return NextResponse.json(
        { error: `Cannot change status from '${vehicle.status}' to '${newStatus}'`, success: false },
        { status: 400 }
      );
    }

    // Build update with timestamps
    const updatePayload: Record<string, unknown> = { status: newStatus };
    const now = new Date().toISOString();

    if (newStatus === 'active' && vehicle.status === 'draft') {
      updatePayload.published_at = now;
    }
    if (newStatus === 'sold') {
      updatePayload.sold_at = now;
    }

    const { data, error } = await supabase
      .from('vehicles')
      .update(updatePayload)
      .eq('id', vehicleId)
      .select()
      .single();

    if (error) {
      console.error('[Inventory] Status update error:', error);
      return NextResponse.json(
        { error: 'Failed to update status', success: false },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[Inventory] Status error:', error);
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    );
  }
}
