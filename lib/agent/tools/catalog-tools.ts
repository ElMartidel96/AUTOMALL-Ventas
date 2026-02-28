/**
 * Catalog Tools — Vehicle search & browsing
 *
 * Read-only tools available to ALL roles.
 * Uses Supabase admin client for direct DB access.
 *
 * DB schema reference (vehicles table):
 *   id, seller_address, vin, brand, model, year, trim, body_type, doors,
 *   price, price_negotiable, mileage, condition (new|like_new|excellent|good|fair),
 *   exterior_color, interior_color, transmission (automatic|manual|cvt),
 *   fuel_type (gasoline|diesel|electric|hybrid|plugin_hybrid),
 *   drivetrain (fwd|rwd|awd|4wd), engine, description, features[],
 *   status (draft|active|sold|archived), primary_image_url, image_count,
 *   views_count, inquiries_count, created_at, updated_at, published_at, sold_at
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
  condition: z.enum(['new', 'like_new', 'excellent', 'good', 'fair']).optional().describe('Vehicle condition'),
  body_type: z.string().optional().describe('Body type (e.g. sedan, suv, truck, coupe, van)'),
  fuel_type: z.enum(['gasoline', 'diesel', 'electric', 'hybrid', 'plugin_hybrid']).optional().describe('Fuel type'),
  transmission: z.enum(['automatic', 'manual', 'cvt']).optional().describe('Transmission type'),
  sort_by: z.enum(['price_asc', 'price_desc', 'year_desc', 'mileage_asc', 'newest']).optional().describe('Sort order'),
  limit: z.number().int().min(1).max(50).optional().describe('Max results (default 20)'),
  offset: z.number().int().min(0).optional().describe('Pagination offset'),
})

const GetVehicleDetailsInput = z.object({
  vehicle_id: z.string().uuid().describe('Vehicle UUID'),
})

const CompareVehiclesInput = z.object({
  vehicle_ids: z.array(z.string().uuid()).min(2).max(3).describe('2-3 vehicle UUIDs to compare'),
})

const GetFeaturedVehiclesInput = z.object({
  limit: z.number().int().min(1).max(20).optional().describe('Max results (default 8)'),
})

const GetAvailableFiltersInput = z.object({})

const SearchByBudgetInput = z.object({
  budget: z.number().min(1000).describe('Maximum budget in USD'),
  preferences: z.string().optional().describe('Free text preferences (e.g. "SUV for family", "fuel efficient", "truck for work")'),
})

const CalculateMonthlyPaymentInput = z.object({
  price: z.number().min(0).describe('Vehicle price in USD'),
  down_payment: z.number().min(0).optional().describe('Down payment in USD (default 0)'),
  interest_rate: z.number().min(0).max(30).optional().describe('Annual interest rate % (default 6.5)'),
  term_months: z.number().int().min(12).max(84).optional().describe('Loan term in months (default 60)'),
})

// ===================================================
// HANDLERS
// ===================================================

async function searchVehicles(input: z.infer<typeof SearchVehiclesInput>) {
  if (!supabaseAdmin) throw new Error('Database not configured')

  let query = supabaseAdmin
    .from('vehicles')
    .select('id, brand, model, year, price, condition, mileage, exterior_color, body_type, fuel_type, transmission, primary_image_url, image_count, created_at', { count: 'exact' })
    .eq('status', 'active')

  if (input.brand) query = query.ilike('brand', `%${input.brand}%`)
  if (input.model) query = query.ilike('model', `%${input.model}%`)
  if (input.year_min) query = query.gte('year', input.year_min)
  if (input.year_max) query = query.lte('year', input.year_max)
  if (input.price_min) query = query.gte('price', input.price_min)
  if (input.price_max) query = query.lte('price', input.price_max)
  if (input.condition) query = query.eq('condition', input.condition)
  if (input.body_type) query = query.ilike('body_type', `%${input.body_type}%`)
  if (input.fuel_type) query = query.eq('fuel_type', input.fuel_type)
  if (input.transmission) query = query.eq('transmission', input.transmission)

  // Sort
  switch (input.sort_by) {
    case 'price_asc': query = query.order('price', { ascending: true }); break
    case 'price_desc': query = query.order('price', { ascending: false }); break
    case 'year_desc': query = query.order('year', { ascending: false }); break
    case 'mileage_asc': query = query.order('mileage', { ascending: true }); break
    default: query = query.order('created_at', { ascending: false })
  }

  const lim = input.limit ?? 20
  const off = input.offset ?? 0
  query = query.range(off, off + lim - 1)

  const { data, error, count } = await query

  if (error) throw new Error(`Search failed: ${error.message}`)

  return {
    vehicles: data ?? [],
    total: count ?? (data?.length ?? 0),
    limit: lim,
    offset: off,
  }
}

async function getVehicleDetails(input: z.infer<typeof GetVehicleDetailsInput>) {
  if (!supabaseAdmin) throw new Error('Database not configured')

  const [vehicleRes, imagesRes] = await Promise.all([
    supabaseAdmin
      .from('vehicles')
      .select('*')
      .eq('id', input.vehicle_id)
      .single(),
    supabaseAdmin
      .from('vehicle_images')
      .select('id, public_url, display_order, is_primary')
      .eq('vehicle_id', input.vehicle_id)
      .order('display_order', { ascending: true }),
  ])

  if (vehicleRes.error) throw new Error(`Vehicle not found: ${vehicleRes.error.message}`)

  return {
    vehicle: vehicleRes.data,
    images: imagesRes.data ?? [],
  }
}

async function compareVehicles(input: z.infer<typeof CompareVehiclesInput>) {
  if (!supabaseAdmin) throw new Error('Database not configured')

  const { data, error } = await supabaseAdmin
    .from('vehicles')
    .select('id, brand, model, year, trim, price, condition, mileage, exterior_color, interior_color, engine, transmission, fuel_type, drivetrain, body_type, doors, features, primary_image_url')
    .in('id', input.vehicle_ids)

  if (error) throw new Error(`Comparison failed: ${error.message}`)

  return { vehicles: data ?? [] }
}

async function getFeaturedVehicles(input: z.infer<typeof GetFeaturedVehiclesInput>) {
  if (!supabaseAdmin) throw new Error('Database not configured')

  const { data, error } = await supabaseAdmin
    .from('vehicles')
    .select('id, brand, model, year, price, mileage, exterior_color, body_type, primary_image_url, condition')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(input.limit ?? 8)

  if (error) throw new Error(`Failed to get featured vehicles: ${error.message}`)

  return { vehicles: data ?? [] }
}

async function getAvailableFilters() {
  if (!supabaseAdmin) throw new Error('Database not configured')

  const { data, error } = await supabaseAdmin
    .from('vehicles')
    .select('brand, body_type, fuel_type, transmission, condition, price, year')
    .eq('status', 'active')

  if (error) throw new Error(`Failed to get filters: ${error.message}`)

  const vehicles = (data ?? []) as Array<{ brand: string; body_type: string; fuel_type: string; transmission: string; condition: string; price: number; year: number }>
  const brands = [...new Set(vehicles.map(v => v.brand).filter(Boolean))].sort()
  const bodyTypes = [...new Set(vehicles.map(v => v.body_type).filter(Boolean))].sort()
  const fuelTypes = [...new Set(vehicles.map(v => v.fuel_type).filter(Boolean))].sort()
  const transmissions = [...new Set(vehicles.map(v => v.transmission).filter(Boolean))].sort()
  const conditions = [...new Set(vehicles.map(v => v.condition).filter(Boolean))].sort()
  const prices = vehicles.map(v => v.price).filter(Boolean)
  const years = vehicles.map(v => v.year).filter(Boolean)

  return {
    brands,
    body_types: bodyTypes,
    fuel_types: fuelTypes,
    transmissions,
    conditions,
    price_range: prices.length > 0 ? { min: Math.min(...prices), max: Math.max(...prices) } : null,
    year_range: years.length > 0 ? { min: Math.min(...years), max: Math.max(...years) } : null,
    total_active: vehicles.length,
  }
}

async function searchByBudget(input: z.infer<typeof SearchByBudgetInput>) {
  if (!supabaseAdmin) throw new Error('Database not configured')

  let query = supabaseAdmin
    .from('vehicles')
    .select('id, brand, model, year, price, condition, mileage, exterior_color, body_type, fuel_type, transmission, primary_image_url')
    .eq('status', 'active')
    .lte('price', input.budget)
    .order('price', { ascending: false })
    .limit(10)

  // If preferences mention body types, try to filter
  if (input.preferences) {
    const prefs = input.preferences.toLowerCase()
    if (prefs.includes('suv')) query = query.ilike('body_type', '%suv%')
    else if (prefs.includes('truck')) query = query.ilike('body_type', '%truck%')
    else if (prefs.includes('sedan')) query = query.ilike('body_type', '%sedan%')
    else if (prefs.includes('van')) query = query.ilike('body_type', '%van%')

    if (prefs.includes('electric')) query = query.eq('fuel_type', 'electric')
    else if (prefs.includes('hybrid')) query = query.eq('fuel_type', 'hybrid')
  }

  const { data, error } = await query

  if (error) throw new Error(`Budget search failed: ${error.message}`)

  return {
    budget: input.budget,
    vehicles_found: data?.length ?? 0,
    vehicles: data ?? [],
  }
}

async function calculateMonthlyPayment(input: z.infer<typeof CalculateMonthlyPaymentInput>) {
  const price = input.price
  const downPayment = input.down_payment ?? 0
  const annualRate = input.interest_rate ?? 6.5
  const termMonths = input.term_months ?? 60

  const principal = price - downPayment
  if (principal <= 0) {
    return { monthly_payment: 0, total_cost: downPayment, total_interest: 0, message: 'Down payment covers the full price.' }
  }

  const monthlyRate = annualRate / 100 / 12

  let monthly: number
  if (monthlyRate === 0) {
    monthly = principal / termMonths
  } else {
    monthly = principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / (Math.pow(1 + monthlyRate, termMonths) - 1)
  }

  const totalCost = monthly * termMonths + downPayment
  const totalInterest = totalCost - price

  return {
    monthly_payment: Math.round(monthly * 100) / 100,
    principal,
    down_payment: downPayment,
    interest_rate: annualRate,
    term_months: termMonths,
    total_cost: Math.round(totalCost * 100) / 100,
    total_interest: Math.round(totalInterest * 100) / 100,
  }
}

// ===================================================
// TOOL DEFINITIONS
// ===================================================

export const catalogTools: AgentTool[] = [
  {
    name: 'search_vehicles',
    description: 'Search the vehicle catalog with filters (brand, model, year, price, condition, body type, fuel type, transmission). Returns a paginated list of available vehicles.',
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
    description: 'Compare 2-3 vehicles side by side, showing all specs, price, features, and images for each.',
    category: 'Catalog',
    inputSchema: CompareVehiclesInput,
    permission: 'read',
    roles: ['buyer', 'seller', 'birddog', 'admin'],
    handler: compareVehicles,
  },
  {
    name: 'get_featured_vehicles',
    description: 'Get the latest featured vehicles from the catalog. Great for browsing or recommendations.',
    category: 'Catalog',
    inputSchema: GetFeaturedVehiclesInput,
    permission: 'read',
    roles: ['buyer', 'seller', 'birddog', 'admin'],
    handler: getFeaturedVehicles,
  },
  {
    name: 'get_available_filters',
    description: 'Get all available filter options for the catalog (brands, body types, fuel types, price range, year range). Useful for guiding searches.',
    category: 'Catalog',
    inputSchema: GetAvailableFiltersInput,
    permission: 'read',
    roles: ['buyer', 'seller', 'birddog', 'admin'],
    handler: getAvailableFilters,
  },
  {
    name: 'search_by_budget',
    description: 'Find vehicles within a budget. Optionally specify preferences like "SUV for family" or "fuel efficient sedan".',
    category: 'Catalog',
    inputSchema: SearchByBudgetInput,
    permission: 'read',
    roles: ['buyer', 'seller', 'birddog', 'admin'],
    handler: searchByBudget,
  },
  {
    name: 'calculate_monthly_payment',
    description: 'Calculate estimated monthly payment for a vehicle (loan calculator). Input price, down payment, interest rate, and term.',
    category: 'Catalog',
    inputSchema: CalculateMonthlyPaymentInput,
    permission: 'read',
    roles: ['buyer', 'seller', 'birddog', 'admin'],
    handler: calculateMonthlyPayment,
  },
]
