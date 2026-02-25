/**
 * Inventory Tools — Seller vehicle management
 *
 * Write tools restricted to seller/admin roles.
 * Uses Supabase admin client for direct DB access.
 */

import { z } from 'zod'
import type { AgentTool, ToolContext } from '../types/connector-types'
import { supabaseAdmin } from '@/lib/supabase/client'

// ===================================================
// SCHEMAS
// ===================================================

const ListMyVehiclesInput = z.object({
  status: z.enum(['draft', 'active', 'sold', 'archived']).optional().describe('Filter by status'),
  limit: z.number().int().min(1).max(50).optional().default(20),
  offset: z.number().int().min(0).optional().default(0),
})

const AddVehicleInput = z.object({
  brand: z.string().min(1).describe('Car brand'),
  model: z.string().min(1).describe('Car model'),
  year: z.number().int().min(1990).max(2027).describe('Model year'),
  price: z.number().min(0).describe('Price in USD'),
  condition: z.enum(['new', 'used', 'certified']).describe('Vehicle condition'),
  mileage: z.number().int().min(0).optional().describe('Mileage in miles'),
  color: z.string().optional().describe('Exterior color'),
  engine: z.string().optional().describe('Engine type (e.g. V6 3.5L)'),
  transmission: z.enum(['automatic', 'manual', 'cvt']).optional(),
  fuel_type: z.enum(['gasoline', 'diesel', 'electric', 'hybrid']).optional(),
  description: z.string().max(2000).optional().describe('Vehicle description'),
  vin: z.string().max(17).optional().describe('VIN number'),
})

const UpdateVehicleInput = z.object({
  vehicle_id: z.string().uuid().describe('Vehicle UUID to update'),
  price: z.number().min(0).optional(),
  description: z.string().max(2000).optional(),
  mileage: z.number().int().min(0).optional(),
  color: z.string().optional(),
})

const UpdateVehicleStatusInput = z.object({
  vehicle_id: z.string().uuid().describe('Vehicle UUID'),
  status: z.enum(['draft', 'active', 'sold', 'archived']).describe('New status'),
})

// ===================================================
// HANDLERS
// ===================================================

async function listMyVehicles(input: z.infer<typeof ListMyVehiclesInput>, ctx: ToolContext) {
  if (!supabaseAdmin) throw new Error('Database not configured')

  let query = supabaseAdmin
    .from('vehicles')
    .select('id, brand, model, year, price, condition, mileage, status, images, created_at')
    .eq('seller_address', ctx.walletAddress)
    .order('created_at', { ascending: false })
    .limit(input.limit ?? 20)
    .range(input.offset ?? 0, (input.offset ?? 0) + (input.limit ?? 20) - 1)

  if (input.status) query = query.eq('status', input.status)

  const { data, error } = await query

  if (error) throw new Error(`Failed to list vehicles: ${error.message}`)

  return { vehicles: data ?? [], total: data?.length ?? 0 }
}

async function addVehicle(input: z.infer<typeof AddVehicleInput>, ctx: ToolContext) {
  if (!supabaseAdmin) throw new Error('Database not configured')

  const { data, error } = await supabaseAdmin
    .from('vehicles')
    .insert({
      ...input,
      seller_address: ctx.walletAddress,
      status: 'draft',
    })
    .select()
    .single()

  if (error) throw new Error(`Failed to add vehicle: ${error.message}`)

  return { vehicle: data, message: 'Vehicle added as draft. Set status to "active" to publish.' }
}

async function updateVehicle(input: z.infer<typeof UpdateVehicleInput>, ctx: ToolContext) {
  if (!supabaseAdmin) throw new Error('Database not configured')

  const { vehicle_id, ...updates } = input

  // Verify ownership
  const { data: existing } = await supabaseAdmin
    .from('vehicles')
    .select('seller_address')
    .eq('id', vehicle_id)
    .single()

  if (!existing || existing.seller_address !== ctx.walletAddress) {
    throw new Error('Vehicle not found or not owned by you')
  }

  const { data, error } = await supabaseAdmin
    .from('vehicles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', vehicle_id)
    .select()
    .single()

  if (error) throw new Error(`Failed to update vehicle: ${error.message}`)

  return { vehicle: data }
}

async function updateVehicleStatus(input: z.infer<typeof UpdateVehicleStatusInput>, ctx: ToolContext) {
  if (!supabaseAdmin) throw new Error('Database not configured')

  // Verify ownership
  const { data: existing } = await supabaseAdmin
    .from('vehicles')
    .select('seller_address, status')
    .eq('id', input.vehicle_id)
    .single()

  if (!existing || existing.seller_address !== ctx.walletAddress) {
    throw new Error('Vehicle not found or not owned by you')
  }

  const { data, error } = await supabaseAdmin
    .from('vehicles')
    .update({ status: input.status, updated_at: new Date().toISOString() })
    .eq('id', input.vehicle_id)
    .select()
    .single()

  if (error) throw new Error(`Failed to update status: ${error.message}`)

  return { vehicle: data, message: `Status changed from "${existing.status}" to "${input.status}"` }
}

// ===================================================
// TOOL DEFINITIONS
// ===================================================

export const inventoryTools: AgentTool[] = [
  {
    name: 'list_my_vehicles',
    description: 'List all vehicles in your inventory. Optionally filter by status (draft, active, sold, archived).',
    category: 'Inventory',
    inputSchema: ListMyVehiclesInput,
    permission: 'read',
    roles: ['seller', 'admin'],
    handler: listMyVehicles,
  },
  {
    name: 'add_vehicle',
    description: 'Add a new vehicle to your inventory. It will be created as a draft — you must change its status to "active" to publish.',
    category: 'Inventory',
    inputSchema: AddVehicleInput,
    permission: 'write',
    roles: ['seller', 'admin'],
    handler: addVehicle,
  },
  {
    name: 'update_vehicle',
    description: 'Update details of one of your vehicles (price, description, mileage, color).',
    category: 'Inventory',
    inputSchema: UpdateVehicleInput,
    permission: 'write',
    roles: ['seller', 'admin'],
    handler: updateVehicle,
  },
  {
    name: 'update_vehicle_status',
    description: 'Change the status of one of your vehicles (draft → active → sold → archived).',
    category: 'Inventory',
    inputSchema: UpdateVehicleStatusInput,
    permission: 'write',
    roles: ['seller', 'admin'],
    handler: updateVehicleStatus,
  },
]
