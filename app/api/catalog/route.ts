/**
 * Public Catalog API — List active vehicles
 *
 * GET /api/catalog?brand=Toyota&minPrice=5000&maxPrice=30000&sort=newest&page=1&limit=24
 *
 * No authentication required. Only returns status='active' vehicles.
 * seller_address is excluded from responses.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getTypedClient } from '@/lib/supabase/client';

const querySchema = z.object({
  brand: z.string().max(50).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().max(99999999).optional(),
  minYear: z.coerce.number().int().min(1900).optional(),
  maxYear: z.coerce.number().int().max(2030).optional(),
  body_type: z.string().max(50).optional(),
  fuel_type: z.enum(['gasoline', 'diesel', 'electric', 'hybrid', 'plugin_hybrid']).optional(),
  transmission: z.enum(['automatic', 'manual', 'cvt']).optional(),
  drivetrain: z.enum(['fwd', 'rwd', 'awd', '4wd']).optional(),
  minMileage: z.coerce.number().int().min(0).optional(),
  maxMileage: z.coerce.number().int().max(9999999).optional(),
  condition: z.enum(['new', 'like_new', 'excellent', 'good', 'fair']).optional(),
  search: z.string().max(100).optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc', 'year_desc', 'mileage_asc']).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

function sanitizeVehicle(v: Record<string, unknown>) {
  const { seller_address: _, ...safe } = v;
  return safe;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const raw: Record<string, string> = {};
    searchParams.forEach((value, key) => { raw[key] = value; });

    const parsed = querySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parsed.error.flatten(), success: false },
        { status: 400 }
      );
    }

    const {
      brand, minPrice, maxPrice, minYear, maxYear,
      body_type, fuel_type, transmission, drivetrain,
      minMileage, maxMileage, condition, search,
      sort = 'newest',
      page = 1,
      limit = 24,
    } = parsed.data;

    const offset = (page - 1) * limit;
    const supabase = getTypedClient();

    // Build query — only active vehicles
    let query = supabase
      .from('vehicles')
      .select('*', { count: 'exact' })
      .eq('status', 'active');

    // Filters
    if (brand) query = query.ilike('brand', brand);
    if (minPrice !== undefined) query = query.gte('price', minPrice);
    if (maxPrice !== undefined) query = query.lte('price', maxPrice);
    if (minYear !== undefined) query = query.gte('year', minYear);
    if (maxYear !== undefined) query = query.lte('year', maxYear);
    if (body_type) query = query.ilike('body_type', body_type);
    if (fuel_type) query = query.eq('fuel_type', fuel_type);
    if (transmission) query = query.eq('transmission', transmission);
    if (drivetrain) query = query.eq('drivetrain', drivetrain);
    if (minMileage !== undefined) query = query.gte('mileage', minMileage);
    if (maxMileage !== undefined) query = query.lte('mileage', maxMileage);
    if (condition) query = query.eq('condition', condition);
    if (search) query = query.or(`brand.ilike.%${search}%,model.ilike.%${search}%`);

    // Sort
    switch (sort) {
      case 'price_asc': query = query.order('price', { ascending: true }); break;
      case 'price_desc': query = query.order('price', { ascending: false }); break;
      case 'year_desc': query = query.order('year', { ascending: false }); break;
      case 'mileage_asc': query = query.order('mileage', { ascending: true }); break;
      default: query = query.order('published_at', { ascending: false });
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('[Catalog] List error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch vehicles', success: false },
        { status: 500 }
      );
    }

    // Get filter aggregates for sidebar
    const { data: filterData } = await supabase
      .from('vehicles')
      .select('brand, body_type, price')
      .eq('status', 'active') as { data: { brand: string; body_type: string | null; price: number }[] | null };

    const filterRows = filterData || [];
    const brands = [...new Set(filterRows.map(v => v.brand))].sort();
    const bodyTypes = [...new Set(filterRows.filter(v => v.body_type).map(v => v.body_type!))].sort();
    const prices = filterRows.map(v => v.price);
    const priceRange: [number, number] = prices.length > 0
      ? [Math.min(...prices), Math.max(...prices)]
      : [0, 0];

    const response = NextResponse.json({
      success: true,
      data: (data || []).map(sanitizeVehicle),
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
      filters: { brands, bodyTypes, priceRange },
    });

    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return response;
  } catch (error) {
    console.error('[Catalog] GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    );
  }
}
