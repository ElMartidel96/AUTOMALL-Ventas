/**
 * Inventory Tools — Seller vehicle management
 *
 * Write tools restricted to seller/admin roles.
 * Uses Supabase admin client for direct DB access.
 *
 * DB schema reference (vehicles table):
 *   condition CHECK (new|like_new|excellent|good|fair)
 *   exterior_color / interior_color (NOT "color")
 *   primary_image_url (NOT "images")
 *   features TEXT[] (array)
 */

import { z } from 'zod'
import type { AgentTool, ToolContext } from '../types/connector-types'
import { supabaseAdmin } from '@/lib/supabase/client'
import { extractVehicleData, smartAutoFill, findMissingFields } from '@/lib/whatsapp/vehicle-extractor'
import { createVehicleFromExtraction } from '@/lib/whatsapp/vehicle-creator'
import type { StagedImage } from '@/lib/whatsapp/image-pipeline'
import type { ExtractedVehicle } from '@/lib/whatsapp/types'

// ===================================================
// SCHEMAS
// ===================================================

const ListMyVehiclesInput = z.object({
  status: z.enum(['draft', 'active', 'sold', 'archived']).optional().describe('Filter by status'),
  limit: z.number().int().min(1).max(50).optional().describe('Max results (default 20)'),
  offset: z.number().int().min(0).optional().describe('Pagination offset'),
})

const AddVehicleInput = z.object({
  brand: z.string().min(1).describe('Car brand (e.g. Toyota, Ford, Chevrolet)'),
  model: z.string().min(1).describe('Car model (e.g. Camry, F-150, Silverado)'),
  year: z.number().int().min(1990).max(2027).describe('Model year'),
  price: z.number().min(0).describe('Price in USD'),
  condition: z.enum(['new', 'like_new', 'excellent', 'good', 'fair']).describe('Vehicle condition'),
  mileage: z.number().int().min(0).describe('Mileage in miles'),
  exterior_color: z.string().optional().describe('Exterior color'),
  interior_color: z.string().optional().describe('Interior color'),
  trim: z.string().optional().describe('Trim level (e.g. LE, XLT, LT)'),
  body_type: z.string().optional().describe('Body type (e.g. sedan, suv, truck, coupe, van, hatchback)'),
  doors: z.number().int().min(2).max(5).optional().describe('Number of doors'),
  engine: z.string().optional().describe('Engine type (e.g. V6 3.5L, I4 2.0L Turbo)'),
  transmission: z.enum(['automatic', 'manual', 'cvt']).optional(),
  fuel_type: z.enum(['gasoline', 'diesel', 'electric', 'hybrid', 'plugin_hybrid']).optional(),
  drivetrain: z.enum(['fwd', 'rwd', 'awd', '4wd']).optional().describe('Drivetrain type'),
  description: z.string().max(2000).optional().describe('Vehicle description'),
  features: z.array(z.string()).optional().describe('List of features (e.g. ["Bluetooth", "Backup Camera", "Sunroof"])'),
  vin: z.string().max(17).optional().describe('VIN number'),
  price_negotiable: z.boolean().optional().describe('Whether the price is negotiable'),
  contact_phone: z.string().max(20).optional().describe('Contact phone for this vehicle'),
  contact_whatsapp: z.string().max(20).optional().describe('WhatsApp number for this vehicle'),
  contact_city: z.string().max(100).optional().describe('City where the vehicle is located'),
  contact_state: z.string().max(50).optional().describe('State where the vehicle is located'),
  latitude: z.number().min(-90).max(90).optional().describe('Vehicle latitude'),
  longitude: z.number().min(-180).max(180).optional().describe('Vehicle longitude'),
  location_source: z.enum(['dealer', 'manual', 'geolocated']).optional().describe('How location was set'),
})

const UpdateVehicleInput = z.object({
  vehicle_id: z.string().uuid().describe('Vehicle UUID to update'),
  price: z.number().min(0).optional().describe('New price in USD'),
  description: z.string().max(2000).optional().describe('New description'),
  mileage: z.number().int().min(0).optional().describe('Updated mileage'),
  exterior_color: z.string().optional().describe('Exterior color'),
  interior_color: z.string().optional().describe('Interior color'),
  condition: z.enum(['new', 'like_new', 'excellent', 'good', 'fair']).optional().describe('Vehicle condition'),
  trim: z.string().optional().describe('Trim level'),
  body_type: z.string().optional().describe('Body type'),
  engine: z.string().optional().describe('Engine type'),
  transmission: z.enum(['automatic', 'manual', 'cvt']).optional(),
  fuel_type: z.enum(['gasoline', 'diesel', 'electric', 'hybrid', 'plugin_hybrid']).optional(),
  drivetrain: z.enum(['fwd', 'rwd', 'awd', '4wd']).optional(),
  features: z.array(z.string()).optional().describe('Updated features list'),
  price_negotiable: z.boolean().optional(),
  contact_phone: z.string().max(20).optional().describe('Contact phone for this vehicle'),
  contact_whatsapp: z.string().max(20).optional().describe('WhatsApp number for this vehicle'),
  contact_city: z.string().max(100).optional().describe('City where the vehicle is located'),
  contact_state: z.string().max(50).optional().describe('State where the vehicle is located'),
  latitude: z.number().min(-90).max(90).optional().describe('Vehicle latitude'),
  longitude: z.number().min(-180).max(180).optional().describe('Vehicle longitude'),
  location_source: z.enum(['dealer', 'manual', 'geolocated']).optional().describe('How location was set'),
})

const UpdateVehicleStatusInput = z.object({
  vehicle_id: z.string().uuid().describe('Vehicle UUID'),
  status: z.enum(['draft', 'active', 'sold', 'archived']).describe('New status'),
})

const DeleteVehicleInput = z.object({
  vehicle_id: z.string().uuid().describe('Vehicle UUID to delete permanently'),
})

const GetVehicleImagesInput = z.object({
  vehicle_id: z.string().uuid().describe('Vehicle UUID'),
})

const DecodeVinInput = z.object({
  vin: z.string().min(17).max(17).describe('17-character VIN number'),
})

// ===================================================
// HELPERS
// ===================================================

const norm = (a: string) => a.toLowerCase()

// ===================================================
// HANDLERS
// ===================================================

async function listMyVehicles(input: z.infer<typeof ListMyVehiclesInput>, ctx: ToolContext) {
  if (!supabaseAdmin) throw new Error('Database not configured')

  let query = supabaseAdmin
    .from('vehicles')
    .select('id, brand, model, year, price, condition, mileage, status, exterior_color, body_type, primary_image_url, image_count, views_count, inquiries_count, created_at, published_at', { count: 'exact' })
    .eq('seller_address', norm(ctx.walletAddress))
    .order('created_at', { ascending: false })

  if (input.status) query = query.eq('status', input.status)

  const lim = input.limit ?? 20
  const off = input.offset ?? 0
  query = query.range(off, off + lim - 1)

  const { data, error, count } = await query

  if (error) throw new Error(`Failed to list vehicles: ${error.message}`)

  return { vehicles: data ?? [], total: count ?? (data?.length ?? 0) }
}

async function addVehicle(input: z.infer<typeof AddVehicleInput>, ctx: ToolContext) {
  if (!supabaseAdmin) throw new Error('Database not configured')

  // Lookup seller_handle from wallet address
  let sellerHandle: string | undefined
  const { data: sellerRow } = await supabaseAdmin
    .from('sellers')
    .select('handle, phone, whatsapp, city, state, latitude, longitude')
    .eq('wallet_address', norm(ctx.walletAddress))
    .eq('is_active', true)
    .single()
  if (sellerRow?.handle) sellerHandle = sellerRow.handle

  const { data, error } = await supabaseAdmin
    .from('vehicles')
    .insert({
      seller_address: norm(ctx.walletAddress),
      seller_handle: sellerHandle,
      contact_phone: input.contact_phone ?? sellerRow?.phone ?? null,
      contact_whatsapp: input.contact_whatsapp ?? sellerRow?.whatsapp ?? null,
      contact_city: input.contact_city ?? sellerRow?.city ?? 'Houston',
      contact_state: input.contact_state ?? sellerRow?.state ?? 'TX',
      latitude: input.latitude ?? sellerRow?.latitude ?? null,
      longitude: input.longitude ?? sellerRow?.longitude ?? null,
      location_source: input.location_source ?? (sellerRow?.latitude != null ? 'dealer' : null),
      brand: input.brand,
      model: input.model,
      year: input.year,
      price: input.price,
      condition: input.condition,
      mileage: input.mileage,
      exterior_color: input.exterior_color,
      interior_color: input.interior_color,
      trim: input.trim,
      body_type: input.body_type,
      doors: input.doors,
      engine: input.engine,
      transmission: input.transmission,
      fuel_type: input.fuel_type,
      drivetrain: input.drivetrain,
      description: input.description,
      features: input.features ?? [],
      vin: input.vin,
      price_negotiable: input.price_negotiable,
      status: 'draft',
    })
    .select()
    .single()

  if (error) throw new Error(`Failed to add vehicle: ${error.message}`)

  return { vehicle: data, message: 'Vehicle added as draft. Set status to "active" to publish it in the catalog.' }
}

async function updateVehicle(input: z.infer<typeof UpdateVehicleInput>, ctx: ToolContext) {
  if (!supabaseAdmin) throw new Error('Database not configured')

  const { vehicle_id, ...updates } = input

  // Remove undefined values
  const cleanUpdates: Record<string, any> = {}
  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) cleanUpdates[key] = value
  }

  if (Object.keys(cleanUpdates).length === 0) {
    return { message: 'No fields to update' }
  }

  // Verify ownership
  const { data: existing } = await supabaseAdmin
    .from('vehicles')
    .select('seller_address')
    .eq('id', vehicle_id)
    .single()

  if (!existing || existing.seller_address !== norm(ctx.walletAddress)) {
    throw new Error('Vehicle not found or not owned by you')
  }

  const { data, error } = await supabaseAdmin
    .from('vehicles')
    .update(cleanUpdates)
    .eq('id', vehicle_id)
    .select()
    .single()

  if (error) throw new Error(`Failed to update vehicle: ${error.message}`)

  return { vehicle: data, message: 'Vehicle updated successfully' }
}

async function updateVehicleStatus(input: z.infer<typeof UpdateVehicleStatusInput>, ctx: ToolContext) {
  if (!supabaseAdmin) throw new Error('Database not configured')

  const { data: existing } = await supabaseAdmin
    .from('vehicles')
    .select('seller_address, status')
    .eq('id', input.vehicle_id)
    .single()

  if (!existing || existing.seller_address !== norm(ctx.walletAddress)) {
    throw new Error('Vehicle not found or not owned by you')
  }

  const { data, error } = await supabaseAdmin
    .from('vehicles')
    .update({ status: input.status })
    .eq('id', input.vehicle_id)
    .select()
    .single()

  if (error) throw new Error(`Failed to update status: ${error.message}`)

  return { vehicle: data, message: `Status changed from "${existing.status}" to "${input.status}"` }
}

async function deleteVehicle(input: z.infer<typeof DeleteVehicleInput>, ctx: ToolContext) {
  if (!supabaseAdmin) throw new Error('Database not configured')

  const { data: existing } = await supabaseAdmin
    .from('vehicles')
    .select('seller_address, brand, model, year, status')
    .eq('id', input.vehicle_id)
    .single()

  if (!existing || existing.seller_address !== norm(ctx.walletAddress)) {
    throw new Error('Vehicle not found or not owned by you')
  }

  if (existing.status === 'active') {
    throw new Error('Cannot delete an active listing. Change status to "draft" or "archived" first.')
  }

  const { error } = await supabaseAdmin
    .from('vehicles')
    .delete()
    .eq('id', input.vehicle_id)

  if (error) throw new Error(`Failed to delete vehicle: ${error.message}`)

  return { message: `Deleted ${existing.year} ${existing.brand} ${existing.model} permanently.` }
}

async function getVehicleImages(input: z.infer<typeof GetVehicleImagesInput>, ctx: ToolContext) {
  if (!supabaseAdmin) throw new Error('Database not configured')

  // Verify ownership
  const { data: vehicle } = await supabaseAdmin
    .from('vehicles')
    .select('seller_address, brand, model, year')
    .eq('id', input.vehicle_id)
    .single()

  if (!vehicle || vehicle.seller_address !== norm(ctx.walletAddress)) {
    throw new Error('Vehicle not found or not owned by you')
  }

  const { data, error } = await supabaseAdmin
    .from('vehicle_images')
    .select('id, public_url, display_order, is_primary, file_size, mime_type, created_at')
    .eq('vehicle_id', input.vehicle_id)
    .order('display_order', { ascending: true })

  if (error) throw new Error(`Failed to get images: ${error.message}`)

  return {
    vehicle: `${vehicle.year} ${vehicle.brand} ${vehicle.model}`,
    images: data ?? [],
    total: data?.length ?? 0,
  }
}

async function decodeVin(input: z.infer<typeof DecodeVinInput>) {
  const url = `https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${input.vin}?format=json`

  const res = await fetch(url)
  if (!res.ok) throw new Error('NHTSA VIN decoder service unavailable')

  const data = await res.json()
  const results = data?.Results ?? []

  const getValue = (variableId: number) =>
    results.find((r: any) => r.VariableId === variableId)?.Value || null

  return {
    vin: input.vin,
    make: getValue(26),
    model: getValue(28),
    year: getValue(29),
    trim: getValue(38),
    body_class: getValue(5),
    doors: getValue(14),
    engine_cylinders: getValue(13),
    displacement_l: getValue(11),
    fuel_type: getValue(24),
    drive_type: getValue(15),
    transmission: getValue(37),
    plant_country: getValue(75),
    vehicle_type: getValue(39),
  }
}

// ===================================================
// IMAGE-BASED VEHICLE TOOLS (same pipeline as WhatsApp)
// ===================================================

const ExtractVehicleFromImagesInput = z.object({
  image_urls: z.array(z.string()).min(1).max(10).describe('Public URLs of staged vehicle images'),
  text_description: z.string().optional().describe('Optional seller text describing the vehicle (brand, model, year, price, etc.)'),
})

const CreateVehicleFromImagesInput = z.object({
  brand: z.string().min(1).describe('Vehicle brand'),
  model: z.string().min(1).describe('Vehicle model'),
  year: z.number().int().describe('Model year'),
  price: z.number().describe('Price in USD'),
  mileage: z.number().int().describe('Mileage in miles'),
  condition: z.enum(['new', 'like_new', 'excellent', 'good', 'fair']).optional(),
  exterior_color: z.string().optional(),
  interior_color: z.string().optional(),
  body_type: z.string().optional(),
  transmission: z.enum(['automatic', 'manual', 'cvt']).optional(),
  fuel_type: z.enum(['gasoline', 'diesel', 'electric', 'hybrid', 'plugin_hybrid']).optional(),
  drivetrain: z.enum(['fwd', 'rwd', 'awd', '4wd']).optional(),
  engine: z.string().optional(),
  trim: z.string().optional(),
  doors: z.number().int().optional(),
  vin: z.string().optional(),
  features: z.array(z.string()).optional(),
  description: z.string().optional(),
  image_urls: z.array(z.string()).min(1).describe('Staged image URLs to attach to the vehicle'),
})

/**
 * Derive storage_path from a Supabase Storage public URL.
 * URL format: https://{project}.supabase.co/storage/v1/object/public/vehicle-images/{path}
 */
function storagePathFromUrl(url: string): string {
  const marker = '/vehicle-images/'
  const idx = url.indexOf(marker)
  if (idx === -1) return url
  return url.substring(idx + marker.length)
}

async function extractVehicleFromImages(
  input: z.infer<typeof ExtractVehicleFromImagesInput>,
  ctx: ToolContext,
) {
  const { image_urls, text_description } = input
  const textMessages = text_description ? [text_description] : []

  // Download images to buffers BEFORE sending to GPT-4o Vision.
  // This avoids the known issue of GPT-4o timing out when downloading from Supabase CDN.
  // Same approach as WhatsApp pipeline: inline buffers for reliability.
  const buffers: (Buffer | undefined)[] = await Promise.all(
    image_urls.map(async (url) => {
      try {
        const res = await fetch(url)
        if (!res.ok) return undefined
        return Buffer.from(await res.arrayBuffer())
      } catch {
        return undefined
      }
    })
  )

  // Use the EXACT same extractor as WhatsApp (GPT-4o Vision)
  const raw = await extractVehicleData(image_urls, textMessages, buffers)

  // Smart auto-fill (same as WhatsApp)
  const { filled, autoFilledFields } = smartAutoFill(raw)

  // Find missing required fields (same as WhatsApp)
  const missingFields = findMissingFields(filled)

  return {
    extracted: filled,
    auto_filled: autoFilledFields,
    missing_required: missingFields,
    image_count: image_urls.length,
    image_urls,
    message: missingFields.length > 0
      ? `Extracted vehicle data. Missing required fields: ${missingFields.join(', ')}. Please provide them to complete the listing.`
      : 'All required fields extracted. Ready to create the listing — please confirm the details.',
  }
}

async function createVehicleFromImagesHandler(
  input: z.infer<typeof CreateVehicleFromImagesInput>,
  ctx: ToolContext,
) {
  const { image_urls, ...vehicleFields } = input

  // Build ExtractedVehicle from input
  const extracted: ExtractedVehicle = {
    brand: vehicleFields.brand,
    model: vehicleFields.model,
    year: vehicleFields.year,
    price: vehicleFields.price,
    mileage: vehicleFields.mileage,
    condition: vehicleFields.condition || 'good',
    exterior_color: vehicleFields.exterior_color || null,
    interior_color: vehicleFields.interior_color || null,
    body_type: vehicleFields.body_type || null,
    transmission: vehicleFields.transmission || 'automatic',
    fuel_type: vehicleFields.fuel_type || 'gasoline',
    drivetrain: vehicleFields.drivetrain || null,
    engine: vehicleFields.engine || null,
    trim: vehicleFields.trim || null,
    doors: vehicleFields.doors || null,
    vin: vehicleFields.vin || null,
    features: vehicleFields.features || [],
    description: vehicleFields.description || null,
    confidence: {},
  }

  // Build StagedImage array from URLs (same structure as WhatsApp pipeline)
  const stagedImages: StagedImage[] = image_urls.map((url) => {
    const storagePath = storagePathFromUrl(url)
    const ext = storagePath.split('.').pop() || 'jpg'
    const mimeMap: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }
    return {
      public_url: url,
      storage_path: storagePath,
      file_size: 0, // Will be filled by DB record
      mime_type: mimeMap[ext] || 'image/jpeg',
    }
  })

  // Use the EXACT same creator as WhatsApp
  const result = await createVehicleFromExtraction(extracted, ctx.walletAddress, stagedImages)

  return {
    vehicle_id: result.vehicleId,
    catalog_url: result.catalogUrl,
    image_count: image_urls.length,
    message: `Vehicle created: ${extracted.year} ${extracted.brand} ${extracted.model}. Published and visible in the catalog.`,
  }
}

// ===================================================
// TOOL DEFINITIONS
// ===================================================

export const inventoryTools: AgentTool[] = [
  {
    name: 'list_my_vehicles',
    description: 'List all vehicles in your inventory with views count, inquiries, and image count. Optionally filter by status.',
    category: 'Inventory',
    inputSchema: ListMyVehiclesInput,
    permission: 'read',
    roles: ['seller', 'admin'],
    handler: listMyVehicles,
  },
  {
    name: 'add_vehicle',
    description: 'Add a new vehicle to your inventory with full specs (brand, model, year, price, condition, color, engine, transmission, features, VIN, etc.). Created as draft — change status to "active" to publish.',
    category: 'Inventory',
    inputSchema: AddVehicleInput,
    permission: 'write',
    roles: ['seller', 'admin'],
    handler: addVehicle,
  },
  {
    name: 'update_vehicle',
    description: 'Update any field of one of your vehicles (price, description, mileage, color, condition, features, engine, transmission, etc.).',
    category: 'Inventory',
    inputSchema: UpdateVehicleInput,
    permission: 'write',
    roles: ['seller', 'admin'],
    handler: updateVehicle,
  },
  {
    name: 'update_vehicle_status',
    description: 'Change the status of one of your vehicles: draft (hidden), active (published in catalog), sold, or archived.',
    category: 'Inventory',
    inputSchema: UpdateVehicleStatusInput,
    permission: 'write',
    roles: ['seller', 'admin'],
    handler: updateVehicleStatus,
  },
  {
    name: 'delete_vehicle',
    description: 'Permanently delete a vehicle from your inventory. Cannot delete active listings — archive or draft them first.',
    category: 'Inventory',
    inputSchema: DeleteVehicleInput,
    permission: 'write',
    roles: ['seller', 'admin'],
    handler: deleteVehicle,
  },
  {
    name: 'get_vehicle_images',
    description: 'List all images for one of your vehicles, with URLs, display order, and primary flag.',
    category: 'Inventory',
    inputSchema: GetVehicleImagesInput,
    permission: 'read',
    roles: ['seller', 'admin'],
    handler: getVehicleImages,
  },
  {
    name: 'decode_vin',
    description: 'Decode a VIN (Vehicle Identification Number) to get make, model, year, engine, transmission, and more from NHTSA database.',
    category: 'Inventory',
    inputSchema: DecodeVinInput,
    permission: 'read',
    roles: ['seller', 'admin'],
    handler: decodeVin,
  },
  {
    name: 'extract_vehicle_from_images',
    description: 'Analyze vehicle photos with AI Vision to extract brand, model, year, price, mileage, condition, colors, and all specs. Uses GPT-4o to identify the vehicle from images. Call this when the user uploads vehicle images or sends image URLs. Returns extracted data + missing required fields.',
    category: 'Inventory',
    inputSchema: ExtractVehicleFromImagesInput,
    permission: 'write',
    roles: ['seller', 'admin'],
    handler: extractVehicleFromImages,
  },
  {
    name: 'create_vehicle_from_images',
    description: 'Create a new vehicle listing from AI-extracted data with attached images. Call this AFTER extract_vehicle_from_images, once the user confirms the extracted details. Moves staged images to the vehicle folder and publishes the listing.',
    category: 'Inventory',
    inputSchema: CreateVehicleFromImagesInput,
    permission: 'write',
    roles: ['seller', 'admin'],
    handler: createVehicleFromImagesHandler,
  },
]
