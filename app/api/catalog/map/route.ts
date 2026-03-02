/**
 * Catalog Map API — vehicles with locations for map display
 *
 * GET /api/catalog/map?limit=200
 *
 * Returns active vehicles positioned on the map.
 * Priority: vehicle's own lat/lng → seller's geocoded lat/lng.
 * Public endpoint — no authentication required.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/client'

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional(),
})

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured', success: false }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const raw: Record<string, string> = {}
    searchParams.forEach((value, key) => { raw[key] = value })

    const parsed = querySchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: parsed.error.flatten(), success: false },
        { status: 400 },
      )
    }

    const { limit = 100 } = parsed.data

    // Step 1: Fetch active vehicles WITH their own location fields
    const { data: vehicles, error } = await supabaseAdmin
      .from('vehicles')
      .select(`
        id,
        brand,
        model,
        year,
        price,
        mileage,
        primary_image_url,
        seller_handle,
        latitude,
        longitude
      `)
      .eq('status', 'active')
      .limit(limit)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[CatalogMap] Query error:', error)
      return NextResponse.json({ error: 'Failed to fetch vehicles', success: false }, { status: 500 })
    }

    // Step 2: Get unique seller handles (for name lookup + fallback coords for legacy vehicles)
    const handles = [...new Set(
      (vehicles || [])
        .map((v: { seller_handle: string | null }) => v.seller_handle)
        .filter(Boolean)
    )] as string[]

    type SellerInfo = { latitude: number; longitude: number; business_name: string }
    const sellerMap: Record<string, SellerInfo> = {}

    if (handles.length > 0) {
      const { data: sellers } = await supabaseAdmin
        .from('sellers')
        .select('handle, latitude, longitude, business_name')
        .eq('is_active', true)
        .in('handle', handles)

      for (const s of sellers || []) {
        if (s.latitude != null && s.longitude != null) {
          sellerMap[s.handle] = {
            latitude: s.latitude,
            longitude: s.longitude,
            business_name: s.business_name,
          }
        }
      }
    }

    // Step 3: Map vehicles — use vehicle coords first, seller as fallback
    type VehicleRow = NonNullable<typeof vehicles>[number]
    const mappedVehicles = (vehicles || [])
      .map((v: VehicleRow) => {
        const seller = v.seller_handle ? sellerMap[v.seller_handle] : null

        // Priority: vehicle's own coords → seller's coords
        const lat = v.latitude ?? seller?.latitude
        const lng = v.longitude ?? seller?.longitude

        // Skip vehicles with no resolvable location
        if (lat == null || lng == null) return null

        return {
          id: v.id,
          brand: v.brand,
          model: v.model,
          year: v.year,
          price: v.price,
          mileage: v.mileage,
          primary_image_url: v.primary_image_url,
          seller_handle: v.seller_handle,
          seller_name: seller?.business_name || null,
          latitude: lat,
          longitude: lng,
        }
      })
      .filter(Boolean)

    const response = NextResponse.json({
      success: true,
      data: mappedVehicles,
      total: mappedVehicles.length,
    })

    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
    return response
  } catch (error) {
    console.error('[CatalogMap] Error:', error)
    return NextResponse.json({ error: 'Internal server error', success: false }, { status: 500 })
  }
}
