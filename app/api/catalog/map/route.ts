/**
 * Catalog Map API — vehicles with locations for map display
 *
 * GET /api/catalog/map?lat=29.76&lng=-95.37&radius=100
 *
 * Returns active vehicles that have lat/lng, along with their seller info.
 * Falls back to seller's lat/lng when vehicle has none.
 * Public endpoint — no authentication required.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/client'

const querySchema = z.object({
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radius: z.coerce.number().min(1).max(500).optional(),
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

    // Fetch active vehicles — join with seller for fallback location
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
        longitude,
        contact_city,
        contact_state
      `)
      .eq('status', 'active')
      .limit(limit)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[CatalogMap] Query error:', error)
      return NextResponse.json({ error: 'Failed to fetch vehicles', success: false }, { status: 500 })
    }

    // Get unique seller handles that have vehicles
    const handles = [...new Set((vehicles || []).map((v: { seller_handle: string | null }) => v.seller_handle).filter(Boolean))] as string[]

    // Fetch sellers with their locations and business names
    let sellerMap: Record<string, { latitude: number | null; longitude: number | null; business_name: string }> = {}
    if (handles.length > 0) {
      const { data: sellers } = await supabaseAdmin
        .from('sellers')
        .select('handle, latitude, longitude, business_name')
        .eq('is_active', true)
        .in('handle', handles)

      for (const s of sellers || []) {
        sellerMap[s.handle] = {
          latitude: s.latitude,
          longitude: s.longitude,
          business_name: s.business_name,
        }
      }
    }

    // Build response — use vehicle's own location or fall back to seller's location
    type VehicleRow = typeof vehicles extends (infer T)[] ? T : never
    const mappedVehicles = (vehicles || [])
      .map((v: VehicleRow) => {
        const seller = v.seller_handle ? sellerMap[v.seller_handle] : null
        const lat = v.latitude ?? seller?.latitude
        const lng = v.longitude ?? seller?.longitude

        // Skip vehicles without any location
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
