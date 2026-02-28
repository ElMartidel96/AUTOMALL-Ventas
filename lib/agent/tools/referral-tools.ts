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
  limit: z.number().int().min(1).max(50).optional().describe('Max results (default 20)'),
})

const GetReferralLeaderboardInput = z.object({
  limit: z.number().int().min(1).max(20).optional().describe('Top N referrers (default 10)'),
})

// ===================================================
// HANDLERS
// ===================================================

async function getMyReferralCode(_input: z.infer<typeof GetMyReferralCodeInput>, ctx: ToolContext) {
  if (!supabaseAdmin) throw new Error('Database not configured')

  const { data, error } = await supabaseAdmin
    .from('referral_codes')
    .select('code, total_referrals, click_count, conversion_rate, created_at')
    .eq('wallet_address', ctx.walletAddress)
    .single()

  if (error) {
    return { code: null, message: 'No referral code found. Visit the referrals page to generate one.' }
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://autosmall.org'
  return {
    code: data.code,
    link: `${baseUrl}?ref=${data.code}`,
    total_referrals: data.total_referrals,
    click_count: data.click_count,
    conversion_rate: data.conversion_rate,
    created_at: data.created_at,
  }
}

async function getReferralStats(_input: z.infer<typeof GetReferralStatsInput>, ctx: ToolContext) {
  if (!supabaseAdmin) throw new Error('Database not configured')

  const { data: referrals, error } = await supabaseAdmin
    .from('referrals')
    .select('id, referred_address, status, level, created_at')
    .eq('referrer_address', ctx.walletAddress)

  if (error) throw new Error(`Failed to get referral stats: ${error.message}`)

  const all = referrals ?? []
  const active = all.filter((r: any) => r.status === 'active')
  const pending = all.filter((r: any) => r.status === 'pending')
  const byLevel: Record<string, number> = {}
  for (const r of all) {
    const level = `level_${r.level || 1}`
    byLevel[level] = (byLevel[level] || 0) + 1
  }

  return {
    total_referrals: all.length,
    active_referrals: active.length,
    pending_referrals: pending.length,
    by_level: byLevel,
  }
}

async function getReferralNetwork(input: z.infer<typeof GetReferralNetworkInput>, ctx: ToolContext) {
  if (!supabaseAdmin) throw new Error('Database not configured')

  const { data, error } = await supabaseAdmin
    .from('referrals')
    .select('id, referred_address, status, level, created_at')
    .eq('referrer_address', ctx.walletAddress)
    .order('created_at', { ascending: false })
    .limit(input.limit ?? 20)

  if (error) throw new Error(`Failed to get network: ${error.message}`)

  return { referrals: data ?? [] }
}

async function getReferralLeaderboard(input: z.infer<typeof GetReferralLeaderboardInput>) {
  if (!supabaseAdmin) throw new Error('Database not configured')

  const { data, error } = await supabaseAdmin
    .from('referral_codes')
    .select('wallet_address, code, total_referrals, click_count, conversion_rate')
    .gt('total_referrals', 0)
    .order('total_referrals', { ascending: false })
    .limit(input.limit ?? 10)

  if (error) throw new Error(`Failed to get leaderboard: ${error.message}`)

  return {
    leaderboard: (data ?? []).map((entry: any, index: number) => ({
      rank: index + 1,
      referral_code: entry.code,
      total_referrals: entry.total_referrals,
      click_count: entry.click_count,
      conversion_rate: entry.conversion_rate,
    })),
  }
}

// ===================================================
// TOOL DEFINITIONS
// ===================================================

export const referralTools: AgentTool[] = [
  {
    name: 'get_my_referral_code',
    description: 'Get your personal referral code, shareable link, and referral stats (clicks, conversions).',
    category: 'Referrals',
    inputSchema: GetMyReferralCodeInput,
    permission: 'read',
    roles: ['buyer', 'seller', 'birddog', 'admin'],
    handler: getMyReferralCode,
  },
  {
    name: 'get_referral_stats',
    description: 'Get detailed referral statistics: total, active, pending, and breakdown by level.',
    category: 'Referrals',
    inputSchema: GetReferralStatsInput,
    permission: 'read',
    roles: ['buyer', 'seller', 'birddog', 'admin'],
    handler: getReferralStats,
  },
  {
    name: 'get_referral_network',
    description: 'View your referral network — list of people you have referred with their status and level.',
    category: 'Referrals',
    inputSchema: GetReferralNetworkInput,
    permission: 'read',
    roles: ['seller', 'admin'],
    handler: getReferralNetwork,
  },
  {
    name: 'get_referral_leaderboard',
    description: 'See the top referrers on the platform. Shows ranking, referral count, and conversion rates.',
    category: 'Referrals',
    inputSchema: GetReferralLeaderboardInput,
    permission: 'read',
    roles: ['buyer', 'seller', 'birddog', 'admin'],
    handler: getReferralLeaderboard,
  },
]
