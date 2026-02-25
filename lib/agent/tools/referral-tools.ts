/**
 * Referral Tools — Referral network & stats
 *
 * Read tools for referral system access.
 * Uses Supabase admin client for direct DB access.
 */

import { z } from 'zod'
import type { AgentTool, ToolContext } from '../types/connector-types'
import { supabaseAdmin } from '@/lib/supabase/client'

// ===================================================
// SCHEMAS
// ===================================================

const GetMyReferralCodeInput = z.object({})

const GetReferralStatsInput = z.object({})

const GetReferralNetworkInput = z.object({
  limit: z.number().int().min(1).max(50).optional().default(20),
})

// ===================================================
// HANDLERS
// ===================================================

async function getMyReferralCode(_input: z.infer<typeof GetMyReferralCodeInput>, ctx: ToolContext) {
  if (!supabaseAdmin) throw new Error('Database not configured')

  const { data, error } = await supabaseAdmin
    .from('referral_codes')
    .select('code, created_at')
    .eq('wallet_address', ctx.walletAddress)
    .single()

  if (error) {
    return { code: null, message: 'No referral code found. Visit the referrals page to generate one.' }
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://autosmall.org'
  return {
    code: data.code,
    link: `${baseUrl}?ref=${data.code}`,
    created_at: data.created_at,
  }
}

async function getReferralStats(_input: z.infer<typeof GetReferralStatsInput>, ctx: ToolContext) {
  if (!supabaseAdmin) throw new Error('Database not configured')

  const { data: referrals, error } = await supabaseAdmin
    .from('referrals')
    .select('id, referred_address, status, created_at')
    .eq('referrer_address', ctx.walletAddress)

  if (error) throw new Error(`Failed to get referral stats: ${error.message}`)

  const total = referrals?.length ?? 0
  const active = referrals?.filter((r: any) => r.status === 'active').length ?? 0
  const pending = referrals?.filter((r: any) => r.status === 'pending').length ?? 0

  return {
    total_referrals: total,
    active_referrals: active,
    pending_referrals: pending,
  }
}

async function getReferralNetwork(input: z.infer<typeof GetReferralNetworkInput>, ctx: ToolContext) {
  if (!supabaseAdmin) throw new Error('Database not configured')

  const { data, error } = await supabaseAdmin
    .from('referrals')
    .select(`
      id,
      referred_address,
      status,
      created_at,
      referred:users!referrals_referred_address_fkey(display_name, role)
    `)
    .eq('referrer_address', ctx.walletAddress)
    .order('created_at', { ascending: false })
    .limit(input.limit ?? 20)

  if (error) throw new Error(`Failed to get network: ${error.message}`)

  return { referrals: data ?? [] }
}

// ===================================================
// TOOL DEFINITIONS
// ===================================================

export const referralTools: AgentTool[] = [
  {
    name: 'get_my_referral_code',
    description: 'Get your personal referral code and shareable link.',
    category: 'Referrals',
    inputSchema: GetMyReferralCodeInput,
    permission: 'read',
    roles: ['buyer', 'seller', 'birddog', 'admin'],
    handler: getMyReferralCode,
  },
  {
    name: 'get_referral_stats',
    description: 'Get your referral statistics (total, active, pending referrals).',
    category: 'Referrals',
    inputSchema: GetReferralStatsInput,
    permission: 'read',
    roles: ['buyer', 'seller', 'birddog', 'admin'],
    handler: getReferralStats,
  },
  {
    name: 'get_referral_network',
    description: 'View your referral network — list of people you have referred with their status.',
    category: 'Referrals',
    inputSchema: GetReferralNetworkInput,
    permission: 'read',
    roles: ['seller', 'admin'],
    handler: getReferralNetwork,
  },
]
