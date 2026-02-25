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
  bio: z.string().max(500).optional().describe('Short bio'),
  phone: z.string().max(20).optional().describe('Phone number'),
  city: z.string().max(100).optional().describe('City'),
  state: z.string().max(100).optional().describe('State'),
  instagram: z.string().max(100).optional().describe('Instagram handle'),
  facebook: z.string().max(200).optional().describe('Facebook profile URL'),
  tiktok: z.string().max(100).optional().describe('TikTok handle'),
})

const GetDealerProfileInput = z.object({
  dealer_address: z.string().optional().describe('Dealer wallet address. If omitted, returns your own dealer profile.'),
  dealer_slug: z.string().optional().describe('Dealer slug/subdomain name'),
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
  if (input.bio !== undefined) updates.bio = input.bio
  if (input.phone !== undefined) updates.phone = input.phone
  if (input.city !== undefined) updates.city = input.city
  if (input.state !== undefined) updates.state = input.state
  if (input.instagram !== undefined) updates.instagram = input.instagram
  if (input.facebook !== undefined) updates.facebook = input.facebook
  if (input.tiktok !== undefined) updates.tiktok = input.tiktok

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
    .from('seller_profiles')
    .select('id, wallet_address, dealership_name, slug, description, logo_url, banner_url, city, state, phone, website, created_at')

  if (input.dealer_slug) {
    query = query.eq('slug', input.dealer_slug)
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
    description: 'Update your profile information (display name, bio, phone, city, social media).',
    category: 'Profile',
    inputSchema: UpdateMyProfileInput,
    permission: 'write',
    roles: ['buyer', 'seller', 'birddog', 'admin'],
    handler: updateMyProfile,
  },
  {
    name: 'get_dealer_profile',
    description: 'Get a dealer\'s public profile (dealership name, location, contact). Search by address or slug.',
    category: 'Profile',
    inputSchema: GetDealerProfileInput,
    permission: 'read',
    roles: ['buyer', 'seller', 'birddog', 'admin'],
    handler: getDealerProfile,
  },
]
