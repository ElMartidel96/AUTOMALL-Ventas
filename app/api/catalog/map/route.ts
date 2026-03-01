/**
 * Catalog Map API — vehicles with locations for map display
 *
 * GET /api/catalog/map?limit=200
 *
 * Returns active vehicles positioned on the map using their seller's
 * geocoded location. Each vehicle inherits its dealer's lat/lng.
 * Public endpoint — no authentication required.
 *
 * NOTE: Does NOT query vehicle-level lat/lng columns (migration may not
 * be applied). Uses seller locations as the canonical source of truth.
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

    // Step 1: Fetch active vehicles (basic fields only — no lat/lng columns)
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

    // Step 2: Get unique seller handles
    const handles = [...new Set(
      (vehicles || [])
        .map((v: { seller_handle: string | null }) => v.seller_handle)
        .filter(Boolean)
    )] as string[]

    if (handles.length === 0) {
      const response = NextResponse.json({ success: true, data: [], total: 0 })
      response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
      return response
    }

    // Step 3: Fetch sellers with geocoded locations
    const { data: sellers } = await supabaseAdmin
      .from('sellers')
      .select('handle, latitude, longitude, business_name, address, city, state')
      .eq('is_active', true)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .in('handle', handles)

    const sellerMap: Record<string, {
      latitude: number
      longitude: number
      business_name: string
      address: string | null
      city: string | null
      state: string | null
    }> = {}

    for (const s of sellers || []) {
      if (s.latitude != null && s.longitude != null) {
        sellerMap[s.handle] = {
          latitude: s.latitude,
          longitude: s.longitude,
          business_name: s.business_name,
          address: s.address,
          city: s.city,
          state: s.state,
        }
      }
    }

    // Step 4: Map vehicles to their seller's location
    type VehicleRow = NonNullable<typeof vehicles>[number]
    const mappedVehicles = (vehicles || [])
      .map((v: VehicleRow) => {
        const seller = v.seller_handle ? sellerMap[v.seller_handle] : null

        // Skip vehicles whose seller has no geocoded location
        if (!seller) return null

        return {
          id: v.id,
          brand: v.brand,
          model: v.model,
          year: v.year,
          price: v.price,
          mileage: v.mileage,
          primary_image_url: v.primary_image_url,
          seller_handle: v.seller_handle,
          seller_name: seller.business_name,
          latitude: seller.latitude,
          longitude: seller.longitude,
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
