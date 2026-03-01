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
  seller: z.string().max(30).optional(),
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
  // Geo-filtering (Near Me)
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radius: z.coerce.number().min(1).max(500).optional(),
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
      seller: sellerHandle,
      brand, minPrice, maxPrice, minYear, maxYear,
      body_type, fuel_type, transmission, drivetrain,
      minMileage, maxMileage, condition, search,
      sort = 'newest',
      page = 1,
      limit = 24,
      lat, lng, radius,
    } = parsed.data;

    // Also check x-seller-handle header (set by middleware for subdomain requests)
    const headerHandle = request.headers.get('x-seller-handle');
    const effectiveSellerHandle = sellerHandle || headerHandle;

    const offset = (page - 1) * limit;
    const supabase = getTypedClient();

    // Build query — only active vehicles
    let query = supabase
      .from('vehicles')
      .select('*', { count: 'exact' })
      .eq('status', 'active');

    // ── Geo-aware seller filtering ──────────────────────────────────
    if (effectiveSellerHandle) {
      // Subdomain request — check seller's catalog_display_mode
      const { data: sellerGeo } = await supabase
        .from('sellers')
        .select('catalog_display_mode, latitude, longitude, service_radius_km')
        .eq('handle', effectiveSellerHandle)
        .single();

      switch (sellerGeo?.catalog_display_mode) {
        case 'personal_only':
          query = query.eq('seller_handle', effectiveSellerHandle);
          break;
        case 'full_catalog':
          // No seller filter — show all active vehicles
          break;
        case 'service_area':
        default:
          if (sellerGeo?.latitude && sellerGeo?.longitude) {
            const { data: nearbyHandles } = await supabase.rpc('seller_handles_in_service_area', {
              dealer_lat: sellerGeo.latitude,
              dealer_lng: sellerGeo.longitude,
              dealer_radius: sellerGeo.service_radius_km || 40,
            });
            if (nearbyHandles && nearbyHandles.length > 0) {
              query = query.in('seller_handle', nearbyHandles);
            } else {
              query = query.eq('seller_handle', effectiveSellerHandle);
            }
          } else {
            // Not geocoded — fallback to personal only
            query = query.eq('seller_handle', effectiveSellerHandle);
          }
          break;
      }
    } else if (lat !== undefined && lng !== undefined) {
      // Near Me geo-filter (non-subdomain, user location)
      const searchRadius = radius || 50;
      const { data: nearbyHandles } = await supabase.rpc('seller_handles_in_service_area', {
        dealer_lat: lat,
        dealer_lng: lng,
        dealer_radius: searchRadius,
      });
      if (nearbyHandles && nearbyHandles.length > 0) {
        query = query.in('seller_handle', nearbyHandles);
      }
      // If no nearby sellers, show all (don't filter)
    }

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

    // Batch lookup seller contact info for vehicles in this page
    const vehicles = (data || []).map(sanitizeVehicle);
    const sellerHandles = [...new Set(
      vehicles
        .map((v: Record<string, unknown>) => v.seller_handle as string | undefined)
        .filter((h: string | undefined): h is string => !!h)
    )];

    let sellerMap: Record<string, { business_name: string; phone: string | null; whatsapp: string | null; logo_url: string | null }> = {};
    if (sellerHandles.length > 0) {
      const { data: sellers } = await supabase
        .from('sellers')
        .select('handle, business_name, phone, whatsapp, logo_url')
        .in('handle', sellerHandles)
        .eq('is_active', true);
      if (sellers) {
        for (const s of sellers) {
          sellerMap[s.handle] = {
            business_name: s.business_name,
            phone: s.phone || null,
            whatsapp: s.whatsapp || null,
            logo_url: s.logo_url || null,
          };
        }
      }
    }

    // Merge seller_contact into each vehicle
    const vehiclesWithContact = vehicles.map((v: Record<string, unknown>) => ({
      ...v,
      seller_contact: v.seller_handle && sellerMap[v.seller_handle as string]
        ? sellerMap[v.seller_handle as string]
        : undefined,
    }));

    // Get filter aggregates for sidebar
    let filterQuery = supabase
      .from('vehicles')
      .select('brand, body_type, price')
      .eq('status', 'active');
    if (effectiveSellerHandle) filterQuery = filterQuery.eq('seller_handle', effectiveSellerHandle);
    const { data: filterData } = await filterQuery as { data: { brand: string; body_type: string | null; price: number }[] | null };

    const filterRows = filterData || [];
    const brands = [...new Set(filterRows.map(v => v.brand))].sort();
    const bodyTypes = [...new Set(filterRows.filter(v => v.body_type).map(v => v.body_type!))].sort();
    const prices = filterRows.map(v => v.price);
    const priceRange: [number, number] = prices.length > 0
      ? [Math.min(...prices), Math.max(...prices)]
      : [0, 0];

    const response = NextResponse.json({
      success: true,
      data: vehiclesWithContact,
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
