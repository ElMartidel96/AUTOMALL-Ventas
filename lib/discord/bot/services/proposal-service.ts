/**
 * Proposal Service
 *
 * Handles all database operations for the proposal system
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Proposal } from '../types'

// Lazy initialization to avoid build-time errors
let _supabase: SupabaseClient | null = null

function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !key) {
      throw new Error('Supabase configuration missing')
    }

    _supabase = createClient(url, key)
  }
  return _supabase
}

// Getter for backward compatibility
const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return (getSupabase() as any)[prop]
  }
})

// ============================================================================
// PROPOSAL OPERATIONS
// ============================================================================

/**
 * Create a new proposal
 */
export async function createProposal(data: {
  title: string
  description: string
  source: 'discord' | 'web'
  proposedByWallet?: string
  proposedByDiscordId?: string
  proposedByDiscordUsername?: string
  discordMessageId?: string
  discordChannelId?: string
  suggestedCategory?: string
  suggestedReward?: number
}): Promise<Proposal | null> {
  const { data: proposal, error } = await supabase
    .from('task_proposals')
    .insert({
      title: data.title,
      description: data.description,
      source: data.source,
      proposed_by_wallet: data.proposedByWallet,
      proposed_by_discord_id: data.proposedByDiscordId,
      proposed_by_discord_username: data.proposedByDiscordUsername,
      discord_message_id: data.discordMessageId,
      discord_channel_id: data.discordChannelId,
      suggested_category: data.suggestedCategory,
      suggested_reward: data.suggestedReward,
      status: 'pending',
    })
    .select()
    .single()

  if (error) {
    console.error('[Proposal] Create error:', error)
    return null
  }

  return proposal
}

/**
 * Get a proposal by ID
 */
export async function getProposal(id: string): Promise<Proposal | null> {
  const { data, error } = await supabase
    .from('task_proposals')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('[Proposal] Get error:', error)
    return null
  }

  return data
}

/**
 * Get proposals by status
 */
export async function getProposalsByStatus(
  status: 'pending' | 'voting' | 'approved' | 'rejected' | 'converted',
  limit = 10
): Promise<Proposal[]> {
  const { data, error } = await supabase
    .from('task_proposals')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[Proposal] Get by status error:', error)
    return []
  }

  return data || []
}

/**
 * Get proposals by Discord user
 */
export async function getProposalsByDiscordUser(discordId: string): Promise<Proposal[]> {
  const { data, error } = await supabase
    .from('task_proposals')
    .select('*')
    .eq('proposed_by_discord_id', discordId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[Proposal] Get by user error:', error)
    return []
  }

  return data || []
}

/**
 * Update proposal status
 */
export async function updateProposalStatus(
  id: string,
  status: 'pending' | 'voting' | 'approved' | 'rejected' | 'converted',
  additionalData?: {
    approvedByWallet?: string
    approvedByDiscordId?: string
    rejectionReason?: string
    resultingTaskId?: string
  }
): Promise<boolean> {
  const updateData: any = {
    status,
    updated_at: new Date().toISOString(),
  }

  if (status === 'approved') {
    updateData.approved_at = new Date().toISOString()
    if (additionalData?.approvedByWallet) {
      updateData.approved_by_wallet = additionalData.approvedByWallet
    }
    if (additionalData?.approvedByDiscordId) {
      updateData.approved_by_discord_id = additionalData.approvedByDiscordId
    }
  }

  if (status === 'rejected' && additionalData?.rejectionReason) {
    updateData.rejection_reason = additionalData.rejectionReason
  }

  if (status === 'converted' && additionalData?.resultingTaskId) {
    updateData.resulting_task_id = additionalData.resultingTaskId
  }

  const { error } = await supabase
    .from('task_proposals')
    .update(updateData)
    .eq('id', id)

  if (error) {
    console.error('[Proposal] Update status error:', error)
    return false
  }

  return true
}

/**
 * Update proposal with AI refinement
 */
export async function updateProposalWithAI(
  id: string,
  refinement: {
    aiRefinedTitle: string
    aiRefinedDescription: string
    suggestedDomain?: string
    suggestedCategory?: string
    suggestedReward?: number
    suggestedComplexity?: number
  }
): Promise<boolean> {
  const { error } = await supabase
    .from('task_proposals')
    .update({
      ai_refined_title: refinement.aiRefinedTitle,
      ai_refined_description: refinement.aiRefinedDescription,
      suggested_domain: refinement.suggestedDomain,
      suggested_category: refinement.suggestedCategory,
      suggested_reward: refinement.suggestedReward,
      suggested_complexity: refinement.suggestedComplexity,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    console.error('[Proposal] Update AI error:', error)
    return false
  }

  return true
}

/**
 * Update Discord message ID for a proposal
 */
export async function updateProposalDiscordMessage(
  id: string,
  messageId: string,
  threadId?: string
): Promise<boolean> {
  const updateData: any = {
    discord_message_id: messageId,
    updated_at: new Date().toISOString(),
  }

  if (threadId) {
    updateData.discord_thread_id = threadId
  }

  const { error } = await supabase
    .from('task_proposals')
    .update(updateData)
    .eq('id', id)

  if (error) {
    console.error('[Proposal] Update message ID error:', error)
    return false
  }

  return true
}

// ============================================================================
// VOTING OPERATIONS
// ============================================================================

/**
 * Cast a vote on a proposal
 */
export async function castVote(
  proposalId: string,
  vote: 'up' | 'down',
  voterId: {
    wallet?: string
    discordId?: string
  },
  comment?: string
): Promise<{ success: boolean; error?: string }> {
  // Check if user already voted
  const { data: existingVote } = await supabase
    .from('proposal_votes')
    .select('id, vote_type')
    .eq('proposal_id', proposalId)
    .or(
      voterId.wallet
        ? `voter_wallet.eq.${voterId.wallet}`
        : `voter_discord_id.eq.${voterId.discordId}`
    )
    .single()

  if (existingVote) {
    if (existingVote.vote_type === vote) {
      return { success: false, error: 'Ya votaste en esta propuesta' }
    }

    // Update existing vote
    const { error: updateError } = await supabase
      .from('proposal_votes')
      .update({
        vote_type: vote,
        comment,
      })
      .eq('id', existingVote.id)

    if (updateError) {
      console.error('[Vote] Update error:', updateError)
      return { success: false, error: 'Error al actualizar voto' }
    }

    return { success: true }
  }

  // Create new vote
  const { error: insertError } = await supabase.from('proposal_votes').insert({
    proposal_id: proposalId,
    voter_wallet: voterId.wallet,
    voter_discord_id: voterId.discordId,
    vote_type: vote,
    comment,
    source: 'discord',
  })

  if (insertError) {
    console.error('[Vote] Insert error:', insertError)
    return { success: false, error: 'Error al registrar voto' }
  }

  return { success: true }
}

/**
 * Get vote counts for a proposal
 */
export async function getVoteCounts(proposalId: string): Promise<{
  up: number
  down: number
}> {
  const { data } = await supabase
    .from('task_proposals')
    .select('votes_up, votes_down')
    .eq('id', proposalId)
    .single()

  return {
    up: data?.votes_up || 0,
    down: data?.votes_down || 0,
  }
}

/**
 * Check if user has voted
 */
export async function hasUserVoted(
  proposalId: string,
  voterId: { wallet?: string; discordId?: string }
): Promise<'up' | 'down' | null> {
  const query = supabase
    .from('proposal_votes')
    .select('vote_type')
    .eq('proposal_id', proposalId)

  if (voterId.wallet) {
    query.eq('voter_wallet', voterId.wallet)
  } else if (voterId.discordId) {
    query.eq('voter_discord_id', voterId.discordId)
  }

  const { data } = await query.single()
  return data?.vote_type || null
}

// ============================================================================
// DISCORD USER LINK OPERATIONS
// ============================================================================

/**
 * Link a Discord account to a wallet
 */
export async function linkDiscordWallet(
  discordId: string,
  discordUsername: string,
  wallet: string
): Promise<{ success: boolean; error?: string }> {
  // Check if wallet is already linked
  const { data: existingLink } = await supabase
    .from('discord_user_links')
    .select('discord_id')
    .eq('wallet_address', wallet.toLowerCase())
    .single()

  if (existingLink && existingLink.discord_id !== discordId) {
    return { success: false, error: 'Esta wallet ya está vinculada a otra cuenta' }
  }

  // Upsert the link
  const { error } = await supabase.from('discord_user_links').upsert(
    {
      discord_id: discordId,
      discord_username: discordUsername,
      wallet_address: wallet.toLowerCase(),
      linked_at: new Date().toISOString(),
    },
    {
      onConflict: 'discord_id',
    }
  )

  if (error) {
    console.error('[Link] Upsert error:', error)
    return { success: false, error: 'Error al vincular wallet' }
  }

  return { success: true }
}

/**
 * Get wallet linked to Discord user
 */
export async function getLinkedWallet(discordId: string): Promise<string | null> {
  const { data } = await supabase
    .from('discord_user_links')
    .select('wallet_address')
    .eq('discord_id', discordId)
    .single()

  return data?.wallet_address || null
}

/**
 * Get Discord user linked to wallet
 */
export async function getLinkedDiscordUser(
  wallet: string
): Promise<{ discordId: string; username: string } | null> {
  const { data } = await supabase
    .from('discord_user_links')
    .select('discord_id, discord_username')
    .eq('wallet_address', wallet.toLowerCase())
    .single()

  if (!data) return null

  return {
    discordId: data.discord_id,
    username: data.discord_username,
  }
}

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Get proposal statistics
 */
export async function getProposalStats(): Promise<{
  totalProposals: number
  pendingProposals: number
  approvedProposals: number
  rejectedProposals: number
  convertedToTasks: number
}> {
  const { data } = await supabase.from('task_proposals').select('status')

  if (!data) {
    return {
      totalProposals: 0,
      pendingProposals: 0,
      approvedProposals: 0,
      rejectedProposals: 0,
      convertedToTasks: 0,
    }
  }

  type ProposalRow = { status: string }
  return {
    totalProposals: data.length,
    pendingProposals: data.filter((p: ProposalRow) => p.status === 'pending' || p.status === 'voting').length,
    approvedProposals: data.filter((p: ProposalRow) => p.status === 'approved').length,
    rejectedProposals: data.filter((p: ProposalRow) => p.status === 'rejected').length,
    convertedToTasks: data.filter((p: ProposalRow) => p.status === 'converted').length,
  }
}

/**
 * Get leaderboard data
 */
export async function getLeaderboard(
  period: 'week' | 'month' | 'all' = 'all',
  limit = 10
): Promise<
  Array<{
    discordId: string
    username: string
    wallet?: string
    tasksCompleted: number
    cgcEarned: number
  }>
> {
  // Get date filter
  let dateFilter = ''
  const now = new Date()

  if (period === 'week') {
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    dateFilter = weekAgo.toISOString()
  } else if (period === 'month') {
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    dateFilter = monthAgo.toISOString()
  }

  // Get completed tasks with assignees
  let query = supabase
    .from('tasks')
    .select('assignee, reward_cgc, validated_at')
    .eq('status', 'completed')
    .not('assignee', 'is', null)

  if (dateFilter) {
    query = query.gte('validated_at', dateFilter)
  }

  const { data: tasks } = await query

  if (!tasks || tasks.length === 0) {
    return []
  }

  // Aggregate by wallet
  const walletStats: Record<string, { tasksCompleted: number; cgcEarned: number }> = {}

  for (const task of tasks) {
    const wallet = task.assignee.toLowerCase()
    if (!walletStats[wallet]) {
      walletStats[wallet] = { tasksCompleted: 0, cgcEarned: 0 }
    }
    walletStats[wallet].tasksCompleted += 1
    walletStats[wallet].cgcEarned += task.reward_cgc || 0
  }

  // Get Discord links for these wallets
  const wallets = Object.keys(walletStats)
  const { data: links } = await supabase
    .from('discord_user_links')
    .select('wallet_address, discord_id, discord_username')
    .in('wallet_address', wallets)

  const linkMap: Record<string, { discordId: string; username: string }> = {}
  for (const link of links || []) {
    linkMap[link.wallet_address] = {
      discordId: link.discord_id,
      username: link.discord_username,
    }
  }

  // Build leaderboard
  const leaderboard = Object.entries(walletStats)
    .map(([wallet, stats]) => {
      const link = linkMap[wallet]
      return {
        discordId: link?.discordId || '',
        username: link?.username || `${wallet.slice(0, 6)}...${wallet.slice(-4)}`,
        wallet,
        ...stats,
      }
    })
    .sort((a, b) => b.cgcEarned - a.cgcEarned)
    .slice(0, limit)

  return leaderboard
}
