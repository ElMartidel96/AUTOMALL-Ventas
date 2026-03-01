/**
 * Geo Tools — Near Me dealer search & service area management
 *
 * Location-based tools for the MCP Gateway.
 * Uses Supabase SQL functions for Haversine distance queries.
 */

import { z } from 'zod'
import type { AgentTool, ToolContext } from '../types/connector-types'
import { supabaseAdmin } from '@/lib/supabase/client'
import { HOUSTON_CENTER } from '@/lib/geo/types'

// ===================================================
// SCHEMAS
// ===================================================

const SearchNearbyDealersInput = z.object({
  latitude: z.number().min(-90).max(90).optional().describe('Latitude. If omitted, uses Houston center (29.76).'),
  longitude: z.number().min(-180).max(180).optional().describe('Longitude. If omitted, uses Houston center (-95.37).'),
  radius_km: z.number().min(1).max(500).optional().describe('Search radius in km (default 50)'),
  limit: z.number().int().min(1).max(50).optional().describe('Max results (default 20)'),
})

const GetDealerServiceAreaInput = z.object({
  dealer_handle: z.string().optional().describe('Dealer handle. If omitted, returns your own.'),
})

const UpdateServiceAreaInput = z.object({
  service_radius_km: z.number().min(5).max(500).optional().describe('Service area radius in km'),
  catalog_display_mode: z.enum(['service_area', 'full_catalog', 'personal_only']).optional()
    .describe('How to display catalog on your subdomain: service_area (nearby dealers), full_catalog (all), personal_only (your inventory)'),
})

const SearchVehiclesNearbyInput = z.object({
  latitude: z.number().min(-90).max(90).describe('Center latitude'),
  longitude: z.number().min(-180).max(180).describe('Center longitude'),
  radius_km: z.number().min(1).max(200).optional().describe('Search radius in km (default 50)'),
  brand: z.string().optional().describe('Filter by brand'),
  price_max: z.number().optional().describe('Maximum price in USD'),
  body_type: z.string().optional().describe('Body type filter (sedan, suv, truck, etc.)'),
  limit: z.number().int().min(1).max(50).optional().describe('Max results (default 20)'),
})

// ===================================================
// HANDLERS
// ===================================================

async function searchNearbyDealers(input: z.infer<typeof SearchNearbyDealersInput>) {
  if (!supabaseAdmin) throw new Error('Database not configured')

  const lat = input.latitude ?? HOUSTON_CENTER.latitude
  const lng = input.longitude ?? HOUSTON_CENTER.longitude
  const radius = input.radius_km ?? 50

  const { data, error } = await supabaseAdmin.rpc('sellers_within_radius', {
    center_lat: lat,
    center_lng: lng,
    radius_km: radius,
  })

  if (error) throw new Error(`Nearby search failed: ${error.message}`)

  const limit = input.limit ?? 20
  const sellers = (data ?? []).slice(0, limit)

  return {
    center: { latitude: lat, longitude: lng },
    radius_km: radius,
    dealers_found: sellers.length,
    dealers: sellers,
  }
}

async function getDealerServiceArea(input: z.infer<typeof GetDealerServiceAreaInput>, ctx: ToolContext) {
  if (!supabaseAdmin) throw new Error('Database not configured')

  let query = supabaseAdmin
    .from('sellers')
    .select('handle, business_name, latitude, longitude, service_radius_km, catalog_display_mode, geocode_status, address, city, state')

  if (input.dealer_handle) {
    query = query.eq('handle', input.dealer_handle)
  } else {
    query = query.eq('wallet_address', ctx.walletAddress)
  }

  const { data, error } = await query.single()
  if (error) throw new Error(`Dealer not found: ${error.message}`)

  // Count nearby dealers if geocoded
  let nearbyCount = 0
  if (data.latitude && data.longitude) {
    const { data: nearby } = await supabaseAdmin.rpc('sellers_within_radius', {
      center_lat: data.latitude,
      center_lng: data.longitude,
      radius_km: data.service_radius_km || 40,
    })
    nearbyCount = nearby?.length ?? 0
  }

  return {
    dealer: {
      handle: data.handle,
      business_name: data.business_name,
      address: data.address,
      city: data.city,
      state: data.state,
    },
    service_area: {
      latitude: data.latitude,
      longitude: data.longitude,
      radius_km: data.service_radius_km,
      catalog_display_mode: data.catalog_display_mode,
      geocode_status: data.geocode_status,
    },
    nearby_dealers_in_area: nearbyCount,
  }
}

async function updateServiceArea(input: z.infer<typeof UpdateServiceAreaInput>, ctx: ToolContext) {
  if (!supabaseAdmin) throw new Error('Database not configured')

  const updates: Record<string, unknown> = {}
  if (input.service_radius_km !== undefined) updates.service_radius_km = input.service_radius_km
  if (input.catalog_display_mode !== undefined) updates.catalog_display_mode = input.catalog_display_mode

  if (Object.keys(updates).length === 0) {
    return { message: 'No fields to update' }
  }

  const { data, error } = await supabaseAdmin
    .from('sellers')
    .update(updates)
    .eq('wallet_address', ctx.walletAddress)
    .select('handle, service_radius_km, catalog_display_mode')
    .single()

  if (error) throw new Error(`Failed to update service area: ${error.message}`)

  return { dealer: data, message: 'Service area updated successfully' }
}

async function searchVehiclesNearby(input: z.infer<typeof SearchVehiclesNearbyInput>) {
  if (!supabaseAdmin) throw new Error('Database not configured')

  const radius = input.radius_km ?? 50

  // Find seller handles within radius
  const { data: handles } = await supabaseAdmin.rpc('seller_handles_in_service_area', {
    dealer_lat: input.latitude,
    dealer_lng: input.longitude,
    dealer_radius: radius,
  })

  if (!handles || handles.length === 0) {
    return { vehicles: [], total: 0, message: 'No dealers found in this area' }
  }

  let query = supabaseAdmin
    .from('vehicles')
    .select('id, brand, model, year, price, condition, mileage, exterior_color, body_type, fuel_type, transmission, primary_image_url, seller_handle')
    .eq('status', 'active')
    .in('seller_handle', handles)

  if (input.brand) query = query.ilike('brand', `%${input.brand}%`)
  if (input.price_max) query = query.lte('price', input.price_max)
  if (input.body_type) query = query.ilike('body_type', `%${input.body_type}%`)

  query = query.order('created_at', { ascending: false }).limit(input.limit ?? 20)

  const { data, error } = await query

  if (error) throw new Error(`Vehicle search failed: ${error.message}`)

  return {
    center: { latitude: input.latitude, longitude: input.longitude },
    radius_km: radius,
    dealers_in_area: handles.length,
    vehicles_found: data?.length ?? 0,
    vehicles: data ?? [],
  }
}

// ===================================================
// TOOL DEFINITIONS
// ===================================================

export const geoTools: AgentTool[] = [
  {
    name: 'search_nearby_dealers',
    description: 'Find car dealers near a location. Returns dealer names, distance, contact info, and vehicle counts. Default center is Houston, TX.',
    category: 'Geo',
    inputSchema: SearchNearbyDealersInput,
    permission: 'read',
    roles: ['buyer', 'seller', 'birddog', 'admin'],
    handler: searchNearbyDealers,
  },
  {
    name: 'get_dealer_service_area',
    description: 'Get a dealer\'s service area configuration: radius, catalog display mode, and count of nearby dealers. Omit handle to see your own.',
    category: 'Geo',
    inputSchema: GetDealerServiceAreaInput,
    permission: 'read',
    roles: ['buyer', 'seller', 'birddog', 'admin'],
    handler: getDealerServiceArea,
  },
  {
    name: 'update_service_area',
    description: 'Update your dealership\'s service area radius (in km) and catalog display mode (service_area, full_catalog, or personal_only).',
    category: 'Geo',
    inputSchema: UpdateServiceAreaInput,
    permission: 'write',
    roles: ['seller', 'admin'],
    handler: updateServiceArea,
  },
  {
    name: 'search_vehicles_nearby',
    description: 'Search for vehicles near a geographic location. Finds all dealers within the radius and returns their active inventory. Supports brand, price, and body type filters.',
    category: 'Geo',
    inputSchema: SearchVehiclesNearbyInput,
    permission: 'read',
    roles: ['buyer', 'seller', 'birddog', 'admin'],
    handler: searchVehiclesNearby,
  },
]
