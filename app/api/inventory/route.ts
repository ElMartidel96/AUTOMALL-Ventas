/**
 * Vehicle Inventory API — List + Create
 *
 * GET  /api/inventory?seller=0x...&status=active&brand=Toyota&page=1&limit=20
 * POST /api/inventory — Create a new vehicle (returns { id })
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getTypedClient } from '@/lib/supabase/client';

const createVehicleSchema = z.object({
  seller_address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  vin: z.string().max(17).optional().nullable(),
  brand: z.string().min(1).max(50),
  model: z.string().min(1).max(100),
  year: z.coerce.number().int().min(1900).max(2030),
  trim: z.string().max(100).optional().nullable(),
  body_type: z.string().max(50).optional().nullable(),
  doors: z.coerce.number().int().min(1).max(6).optional().nullable(),
  price: z.coerce.number().positive().max(99999999),
  price_negotiable: z.boolean().optional(),
  mileage: z.coerce.number().int().min(0).max(9999999),
  condition: z.enum(['new', 'like_new', 'excellent', 'good', 'fair']).optional(),
  exterior_color: z.string().max(50).optional().nullable(),
  interior_color: z.string().max(50).optional().nullable(),
  transmission: z.enum(['automatic', 'manual', 'cvt']).optional().nullable(),
  fuel_type: z.enum(['gasoline', 'diesel', 'electric', 'hybrid', 'plugin_hybrid']).optional().nullable(),
  drivetrain: z.enum(['fwd', 'rwd', 'awd', '4wd']).optional().nullable(),
  engine: z.string().max(100).optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  features: z.array(z.string().max(100)).max(50).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const seller = searchParams.get('seller');
    const status = searchParams.get('status');
    const brand = searchParams.get('brand');
    const search = searchParams.get('search');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const offset = (page - 1) * limit;

    if (!seller) {
      return NextResponse.json(
        { error: 'seller parameter is required', success: false },
        { status: 400 }
      );
    }

    const supabase = getTypedClient();
    let query = supabase
      .from('vehicles')
      .select('*', { count: 'exact' })
      .eq('seller_address', seller.toLowerCase())
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && ['draft', 'active', 'sold', 'archived'].includes(status)) {
      query = query.eq('status', status);
    }
    if (brand) {
      query = query.ilike('brand', brand);
    }
    if (search) {
      query = query.or(`brand.ilike.%${search}%,model.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('[Inventory] List error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch vehicles', success: false },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('[Inventory] GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createVehicleSchema.safeParse(body);

    if (!parsed.success) {
      const details = parsed.error.flatten();
      console.error('[Inventory] Validation failed:', JSON.stringify(details));
      return NextResponse.json(
        { error: 'Validation failed', details, success: false },
        { status: 400 }
      );
    }

    const supabase = getTypedClient();

    // Lookup seller_handle from seller_address
    let sellerHandle: string | undefined;
    const { data: sellerRow } = await supabase
      .from('sellers')
      .select('handle')
      .eq('wallet_address', parsed.data.seller_address.toLowerCase())
      .eq('is_active', true)
      .single();
    if (sellerRow?.handle) {
      sellerHandle = sellerRow.handle;
    }

    const vehicleData = {
      ...parsed.data,
      seller_address: parsed.data.seller_address.toLowerCase(),
      seller_handle: sellerHandle,
      status: 'draft' as const,
    };

    const { data, error } = await supabase
      .from('vehicles')
      .insert(vehicleData)
      .select('id')
      .single();

    if (error) {
      console.error('[Inventory] Create error:', error);
      return NextResponse.json(
        { error: 'Failed to create vehicle', success: false },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { id: data.id },
    }, { status: 201 });
  } catch (error) {
    console.error('[Inventory] POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    );
  }
}
