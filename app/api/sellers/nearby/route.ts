/**
 * Nearby Sellers API
 *
 * GET /api/sellers/nearby?lat=29.76&lng=-95.37&radius=50
 *
 * Returns sellers within a geographic radius, sorted by distance.
 * Public endpoint — no authentication required.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/client'

const querySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(1).max(500).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
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
        { error: 'Invalid parameters. Required: lat, lng', details: parsed.error.flatten(), success: false },
        { status: 400 },
      )
    }

    const { lat, lng, radius = 50, limit = 50 } = parsed.data

    // Call the SQL function
    const { data, error } = await supabaseAdmin.rpc('sellers_within_radius', {
      center_lat: lat,
      center_lng: lng,
      radius_km: radius,
    })

    if (error) {
      console.error('[Nearby] RPC error:', error)
      return NextResponse.json(
        { error: 'Failed to find nearby sellers', success: false },
        { status: 500 },
      )
    }

    const sellers = (data || []).slice(0, limit)

    // Enrich with vehicle counts
    if (sellers.length > 0) {
      const handles = sellers.map((s: { handle: string }) => s.handle)
      const { data: vehicleCounts } = await supabaseAdmin
        .from('vehicles')
        .select('seller_handle')
        .eq('status', 'active')
        .in('seller_handle', handles)

      const countMap: Record<string, number> = {}
      for (const v of vehicleCounts || []) {
        const h = (v as { seller_handle: string }).seller_handle
        countMap[h] = (countMap[h] || 0) + 1
      }

      for (const s of sellers) {
        (s as Record<string, unknown>).vehicle_count = countMap[s.handle] || 0
      }
    }

    const response = NextResponse.json({
      success: true,
      data: sellers,
      total: sellers.length,
    })

    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
    return response
  } catch (error) {
    console.error('[Nearby] Error:', error)
    return NextResponse.json({ error: 'Internal server error', success: false }, { status: 500 })
  }
}
