/**
 * Catalog Tools — Vehicle search & browsing
 *
 * Read-only tools available to ALL roles.
 * Uses Supabase admin client for direct DB access.
 */

import { z } from 'zod'
import type { AgentTool, ToolContext } from '../types/connector-types'
import { supabaseAdmin } from '@/lib/supabase/client'

// ===================================================
// SCHEMAS
// ===================================================

const SearchVehiclesInput = z.object({
  brand: z.string().optional().describe('Car brand (e.g. Toyota, Ford)'),
  model: z.string().optional().describe('Car model (e.g. Camry, F-150)'),
  year_min: z.number().int().optional().describe('Minimum year'),
  year_max: z.number().int().optional().describe('Maximum year'),
  price_min: z.number().optional().describe('Minimum price in USD'),
  price_max: z.number().optional().describe('Maximum price in USD'),
  condition: z.enum(['new', 'used', 'certified']).optional().describe('Vehicle condition'),
  limit: z.number().int().min(1).max(50).optional().default(20).describe('Max results (default 20)'),
  offset: z.number().int().min(0).optional().default(0).describe('Pagination offset'),
})

const GetVehicleDetailsInput = z.object({
  vehicle_id: z.string().uuid().describe('Vehicle UUID'),
})

const CompareVehiclesInput = z.object({
  vehicle_ids: z.array(z.string().uuid()).min(2).max(3).describe('2-3 vehicle UUIDs to compare'),
})

// ===================================================
// HANDLERS
// ===================================================

async function searchVehicles(input: z.infer<typeof SearchVehiclesInput>, ctx: ToolContext) {
  if (!supabaseAdmin) throw new Error('Database not configured')

  let query = supabaseAdmin
    .from('vehicles')
    .select('id, brand, model, year, price, condition, mileage, color, status, images, created_at')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(input.limit ?? 20)
    .range(input.offset ?? 0, (input.offset ?? 0) + (input.limit ?? 20) - 1)

  if (input.brand) query = query.ilike('brand', `%${input.brand}%`)
  if (input.model) query = query.ilike('model', `%${input.model}%`)
  if (input.year_min) query = query.gte('year', input.year_min)
  if (input.year_max) query = query.lte('year', input.year_max)
  if (input.price_min) query = query.gte('price', input.price_min)
  if (input.price_max) query = query.lte('price', input.price_max)
  if (input.condition) query = query.eq('condition', input.condition)

  const { data, error, count } = await query

  if (error) throw new Error(`Search failed: ${error.message}`)

  return {
    vehicles: data ?? [],
    total: count ?? (data?.length ?? 0),
    limit: input.limit ?? 20,
    offset: input.offset ?? 0,
  }
}

async function getVehicleDetails(input: z.infer<typeof GetVehicleDetailsInput>, ctx: ToolContext) {
  if (!supabaseAdmin) throw new Error('Database not configured')

  const { data, error } = await supabaseAdmin
    .from('vehicles')
    .select('*')
    .eq('id', input.vehicle_id)
    .single()

  if (error) throw new Error(`Vehicle not found: ${error.message}`)

  return { vehicle: data }
}

async function compareVehicles(input: z.infer<typeof CompareVehiclesInput>, ctx: ToolContext) {
  if (!supabaseAdmin) throw new Error('Database not configured')

  const { data, error } = await supabaseAdmin
    .from('vehicles')
    .select('id, brand, model, year, price, condition, mileage, color, engine, transmission, fuel_type, features')
    .in('id', input.vehicle_ids)

  if (error) throw new Error(`Comparison failed: ${error.message}`)

  return { vehicles: data ?? [] }
}

// ===================================================
// TOOL DEFINITIONS
// ===================================================

export const catalogTools: AgentTool[] = [
  {
    name: 'search_vehicles',
    description: 'Search the vehicle catalog with filters (brand, model, year, price, condition). Returns a paginated list of available vehicles.',
    category: 'Catalog',
    inputSchema: SearchVehiclesInput,
    permission: 'read',
    roles: ['buyer', 'seller', 'birddog', 'admin'],
    handler: searchVehicles,
  },
  {
    name: 'get_vehicle_details',
    description: 'Get complete details for a specific vehicle by its ID, including all specs, images, and seller info.',
    category: 'Catalog',
    inputSchema: GetVehicleDetailsInput,
    permission: 'read',
    roles: ['buyer', 'seller', 'birddog', 'admin'],
    handler: getVehicleDetails,
  },
  {
    name: 'compare_vehicles',
    description: 'Compare 2-3 vehicles side by side, showing specs, price, and features for each.',
    category: 'Catalog',
    inputSchema: CompareVehiclesInput,
    permission: 'read',
    roles: ['buyer', 'seller', 'birddog', 'admin'],
    handler: compareVehicles,
  },
]
