/**
 * Profile Tools — User and dealer profile management
 *
 * Read tools available to ALL roles. Write tools for own profile only.
 * Uses Supabase admin client for direct DB access.
 */

import { z } from 'zod'
import type { AgentTool, ToolContext } from '../types/connector-types'
import { supabaseAdmin } from '@/lib/supabase/client'

// ===================================================
// SCHEMAS
// ===================================================

const GetMyProfileInput = z.object({})

const UpdateMyProfileInput = z.object({
  display_name: z.string().min(1).max(100).optional().describe('Display name'),
  phone: z.string().max(20).optional().describe('Phone number'),
  social_instagram: z.string().max(100).optional().describe('Instagram handle'),
  social_facebook: z.string().max(200).optional().describe('Facebook profile URL'),
  social_tiktok: z.string().max(100).optional().describe('TikTok handle'),
})

const GetDealerProfileInput = z.object({
  dealer_address: z.string().optional().describe('Dealer wallet address. If omitted, returns your own dealer profile.'),
  dealer_handle: z.string().optional().describe('Dealer handle/subdomain name'),
})

// ===================================================
// HANDLERS
// ===================================================

async function getMyProfile(_input: z.infer<typeof GetMyProfileInput>, ctx: ToolContext) {
  if (!supabaseAdmin) throw new Error('Database not configured')

  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('wallet_address', ctx.walletAddress)
    .single()

  if (error) throw new Error(`Profile not found: ${error.message}`)

  // Strip sensitive fields
  const { ...profile } = data
  return { profile }
}

async function updateMyProfile(input: z.infer<typeof UpdateMyProfileInput>, ctx: ToolContext) {
  if (!supabaseAdmin) throw new Error('Database not configured')

  const updates: Record<string, any> = {}
  if (input.display_name !== undefined) updates.display_name = input.display_name
  if (input.phone !== undefined) updates.phone = input.phone
  if (input.social_instagram !== undefined) updates.social_instagram = input.social_instagram
  if (input.social_facebook !== undefined) updates.social_facebook = input.social_facebook
  if (input.social_tiktok !== undefined) updates.social_tiktok = input.social_tiktok

  if (Object.keys(updates).length === 0) {
    return { message: 'No fields to update' }
  }

  updates.updated_at = new Date().toISOString()

  const { data, error } = await supabaseAdmin
    .from('users')
    .update(updates)
    .eq('wallet_address', ctx.walletAddress)
    .select()
    .single()

  if (error) throw new Error(`Failed to update profile: ${error.message}`)

  return { profile: data, message: 'Profile updated successfully' }
}

async function getDealerProfile(input: z.infer<typeof GetDealerProfileInput>, ctx: ToolContext) {
  if (!supabaseAdmin) throw new Error('Database not configured')

  let query = supabaseAdmin
    .from('sellers')
    .select('id, wallet_address, handle, business_name, tagline, phone, whatsapp, email, logo_url, hero_image_url, city, state, social_instagram, social_facebook, social_tiktok, is_active, created_at')

  if (input.dealer_handle) {
    query = query.eq('handle', input.dealer_handle)
  } else if (input.dealer_address) {
    query = query.eq('wallet_address', input.dealer_address)
  } else {
    query = query.eq('wallet_address', ctx.walletAddress)
  }

  const { data, error } = await query.single()

  if (error) throw new Error(`Dealer profile not found: ${error.message}`)

  return { dealer: data }
}

// ===================================================
// TOOL DEFINITIONS
// ===================================================

export const profileTools: AgentTool[] = [
  {
    name: 'get_my_profile',
    description: 'Get your user profile information (name, contact, bio, social media).',
    category: 'Profile',
    inputSchema: GetMyProfileInput,
    permission: 'read',
    roles: ['buyer', 'seller', 'birddog', 'admin'],
    handler: getMyProfile,
  },
  {
    name: 'update_my_profile',
    description: 'Update your profile information (display name, phone, social media).',
    category: 'Profile',
    inputSchema: UpdateMyProfileInput,
    permission: 'write',
    roles: ['buyer', 'seller', 'birddog', 'admin'],
    handler: updateMyProfile,
  },
  {
    name: 'get_dealer_profile',
    description: 'Get a dealer\'s public profile (business name, location, contact). Search by wallet address or handle.',
    category: 'Profile',
    inputSchema: GetDealerProfileInput,
    permission: 'read',
    roles: ['buyer', 'seller', 'birddog', 'admin'],
    handler: getDealerProfile,
  },
]
