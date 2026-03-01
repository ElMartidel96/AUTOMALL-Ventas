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

const UpdateDealerProfileInput = z.object({
  business_name: z.string().min(1).max(200).optional().describe('Business name'),
  tagline: z.string().max(300).optional().describe('Business tagline/slogan'),
  phone: z.string().max(20).optional().describe('Business phone number'),
  whatsapp: z.string().max(20).optional().describe('WhatsApp number'),
  email: z.string().email().optional().describe('Business email'),
  address: z.string().max(500).optional().describe('Business address'),
  city: z.string().max(100).optional().describe('City'),
  state: z.string().max(50).optional().describe('State'),
  social_instagram: z.string().max(100).optional().describe('Instagram handle'),
  social_facebook: z.string().max(200).optional().describe('Facebook URL'),
  social_tiktok: z.string().max(100).optional().describe('TikTok handle'),
  service_radius_km: z.number().min(5).max(500).optional().describe('Service area radius in km'),
  catalog_display_mode: z.enum(['service_area', 'full_catalog', 'personal_only']).optional()
    .describe('Catalog display mode for subdomain: service_area (nearby dealers), full_catalog (all), personal_only (own inventory)'),
})

const GetProfileCompletionInput = z.object({})

const GetDashboardStatsInput = z.object({})

// ===================================================
// HANDLERS
// ===================================================

async function getMyProfile(_input: z.infer<typeof GetMyProfileInput>, ctx: ToolContext) {
  if (!supabaseAdmin) throw new Error('Database not configured')

  const { data, error } = await supabaseAdmin
    .from('users')
    .select('wallet_address, role, display_name, email, phone, avatar_url, social_instagram, social_facebook, social_tiktok, created_at, updated_at')
    .eq('wallet_address', ctx.walletAddress)
    .single()

  if (error) throw new Error(`Profile not found: ${error.message}`)

  return { profile: data }
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
    .select('id, wallet_address, handle, business_name, tagline, phone, whatsapp, email, logo_url, hero_image_url, address, city, state, social_instagram, social_facebook, social_tiktok, is_active, onboarding_completed, created_at')

  if (input.dealer_handle) {
    query = query.eq('handle', input.dealer_handle)
  } else if (input.dealer_address) {
    query = query.eq('wallet_address', input.dealer_address)
  } else {
    query = query.eq('wallet_address', ctx.walletAddress)
  }

  const { data, error } = await query.single()

  if (error) throw new Error(`Dealer profile not found: ${error.message}`)

  // Build subdomain URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://autosmall.org'
  const subdomainUrl = `https://${data.handle}.autosmall.org`

  return {
    dealer: data,
    subdomain_url: subdomainUrl,
    profile_url: `${baseUrl}/profile`,
  }
}

async function updateDealerProfile(input: z.infer<typeof UpdateDealerProfileInput>, ctx: ToolContext) {
  if (!supabaseAdmin) throw new Error('Database not configured')

  // Build updates object (only include provided fields)
  const updates: Record<string, any> = {}
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) updates[key] = value
  }

  if (Object.keys(updates).length === 0) {
    return { message: 'No fields to update' }
  }

  // Verify ownership
  const { data: existing } = await supabaseAdmin
    .from('sellers')
    .select('wallet_address')
    .eq('wallet_address', ctx.walletAddress)
    .single()

  if (!existing) {
    throw new Error('Dealer profile not found. Complete onboarding first at /onboarding')
  }

  const { data, error } = await supabaseAdmin
    .from('sellers')
    .update(updates)
    .eq('wallet_address', ctx.walletAddress)
    .select()
    .single()

  if (error) throw new Error(`Failed to update dealer profile: ${error.message}`)

  return { dealer: data, message: 'Dealer profile updated successfully' }
}

async function getProfileCompletion(_input: z.infer<typeof GetProfileCompletionInput>, ctx: ToolContext) {
  if (!supabaseAdmin) throw new Error('Database not configured')

  // Get both user and seller profiles
  const [userRes, sellerRes] = await Promise.all([
    supabaseAdmin.from('users').select('*').eq('wallet_address', ctx.walletAddress).single(),
    supabaseAdmin.from('sellers').select('*').eq('wallet_address', ctx.walletAddress).single(),
  ])

  const user = userRes.data
  const seller = sellerRes.data

  const missing: string[] = []
  let completed = 0
  let total = 0

  // User profile fields
  const userFields = [
    { field: 'display_name', label: 'Display name' },
    { field: 'phone', label: 'Phone number' },
    { field: 'avatar_url', label: 'Profile photo' },
  ]

  for (const f of userFields) {
    total++
    if (user?.[f.field]) completed++
    else missing.push(f.label)
  }

  // Seller profile fields (if seller)
  if (seller || ctx.role === 'seller') {
    const sellerFields = [
      { field: 'business_name', label: 'Business name' },
      { field: 'phone', label: 'Business phone' },
      { field: 'email', label: 'Business email' },
      { field: 'logo_url', label: 'Business logo' },
      { field: 'hero_image_url', label: 'Hero image' },
      { field: 'tagline', label: 'Tagline/slogan' },
      { field: 'whatsapp', label: 'WhatsApp number' },
      { field: 'social_instagram', label: 'Instagram' },
    ]

    for (const f of sellerFields) {
      total++
      if (seller?.[f.field]) completed++
      else missing.push(f.label)
    }
  }

  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

  return {
    completion_percentage: percentage,
    completed_fields: completed,
    total_fields: total,
    missing_fields: missing,
    has_seller_profile: !!seller,
    onboarding_completed: seller?.onboarding_completed ?? false,
  }
}

async function getDashboardStats(_input: z.infer<typeof GetDashboardStatsInput>, ctx: ToolContext) {
  if (!supabaseAdmin) throw new Error('Database not configured')

  // Get vehicle stats
  const { data: vehicles, error } = await supabaseAdmin
    .from('vehicles')
    .select('status, price, views_count, inquiries_count, sold_at, created_at')
    .eq('seller_address', ctx.walletAddress)

  if (error) throw new Error(`Failed to get dashboard stats: ${error.message}`)

  type VehicleStat = { status: string; price: number; views_count: number; inquiries_count: number; sold_at: string | null; created_at: string }
  const all = (vehicles ?? []) as VehicleStat[]
  const active = all.filter(v => v.status === 'active')
  const drafts = all.filter(v => v.status === 'draft')
  const sold = all.filter(v => v.status === 'sold')
  const archived = all.filter(v => v.status === 'archived')

  // This month's sales
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const soldThisMonth = sold.filter(v => v.sold_at && v.sold_at >= monthStart)

  const totalViews = all.reduce((sum, v) => sum + (v.views_count || 0), 0)
  const totalInquiries = all.reduce((sum, v) => sum + (v.inquiries_count || 0), 0)
  const totalValue = active.reduce((sum, v) => sum + (v.price || 0), 0)
  const avgPrice = active.length > 0 ? Math.round(totalValue / active.length) : 0

  // Get referral stats
  const { count: referralCount } = await supabaseAdmin
    .from('referrals')
    .select('id', { count: 'exact', head: true })
    .eq('referrer_address', ctx.walletAddress)

  return {
    inventory: {
      total: all.length,
      active: active.length,
      drafts: drafts.length,
      sold: sold.length,
      archived: archived.length,
    },
    performance: {
      total_views: totalViews,
      total_inquiries: totalInquiries,
      sales_this_month: soldThisMonth.length,
    },
    financials: {
      total_active_value: totalValue,
      average_price: avgPrice,
    },
    referrals: {
      total: referralCount ?? 0,
    },
  }
}

// ===================================================
// TOOL DEFINITIONS
// ===================================================

export const profileTools: AgentTool[] = [
  {
    name: 'get_my_profile',
    description: 'Get your user profile information (name, contact, social media).',
    category: 'Profile',
    inputSchema: GetMyProfileInput,
    permission: 'read',
    roles: ['buyer', 'seller', 'birddog', 'admin'],
    handler: getMyProfile,
  },
  {
    name: 'update_my_profile',
    description: 'Update your personal profile (display name, phone, Instagram, Facebook, TikTok).',
    category: 'Profile',
    inputSchema: UpdateMyProfileInput,
    permission: 'write',
    roles: ['buyer', 'seller', 'birddog', 'admin'],
    handler: updateMyProfile,
  },
  {
    name: 'get_dealer_profile',
    description: 'Get a dealer\'s public profile including business name, location, contact, subdomain URL, and social media. Search by handle or wallet address.',
    category: 'Profile',
    inputSchema: GetDealerProfileInput,
    permission: 'read',
    roles: ['buyer', 'seller', 'birddog', 'admin'],
    handler: getDealerProfile,
  },
  {
    name: 'update_dealer_profile',
    description: 'Update your dealership profile (business name, tagline, phone, WhatsApp, email, address, social media).',
    category: 'Profile',
    inputSchema: UpdateDealerProfileInput,
    permission: 'write',
    roles: ['seller', 'admin'],
    handler: updateDealerProfile,
  },
  {
    name: 'get_profile_completion',
    description: 'Check how complete your profile is, with percentage and list of missing fields. Helps you improve your profile.',
    category: 'Profile',
    inputSchema: GetProfileCompletionInput,
    permission: 'read',
    roles: ['buyer', 'seller', 'birddog', 'admin'],
    handler: getProfileCompletion,
  },
  {
    name: 'get_dashboard_stats',
    description: 'Get your complete dashboard statistics: inventory counts, views, inquiries, sales this month, total value, average price, and referral count.',
    category: 'Analytics',
    inputSchema: GetDashboardStatsInput,
    permission: 'read',
    roles: ['seller', 'admin'],
    handler: getDashboardStats,
  },
]
