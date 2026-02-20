/**
 * Proposals API Endpoint
 *
 * Handles task proposal operations for both web and Discord
 * Compatible with both old and new proposal schemas
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { syncProposalToDiscord } from '@/lib/discord/bot/services/discord-sync-service'

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

// Valid status values
type ProposalStatus = 'pending' | 'voting' | 'approved' | 'rejected' | 'converted' | 'reviewing'

interface ProposalResponse {
  id: string
  title: string
  description: string
  status: ProposalStatus
  source: 'web' | 'discord'

  // Proposer info
  proposedByWallet: string | null
  proposedByDiscordId: string | null
  proposedByDiscordUsername: string | null

  // Voting
  votesUp: number
  votesDown: number
  voteScore: number
  approvalPercentage: number

  // Suggestions
  suggestedDomain: string | null
  suggestedCategory: string | null
  suggestedReward: number | null
  suggestedComplexity: number | null
  estimatedDays: number | null

  // AI Refinement
  refinedTitle: string | null
  refinedDescription: string | null
  aiAnalysis: Record<string, unknown> | null

  // Final values (after approval)
  finalReward: number | null
  finalComplexity: number | null
  finalDomain: string | null
  finalCategory: string | null

  // Approval info
  approvedByWallet: string | null
  approvedByDiscordId: string | null
  approvedAt: string | null
  rejectionReason: string | null

  // Discord integration
  discordMessageId: string | null
  discordThreadId: string | null

  // Result
  resultingTaskId: string | null

  // Timestamps
  createdAt: string
  updatedAt: string
}

/**
 * GET /api/proposals
 *
 * List proposals with optional filtering
 * Query params:
 * - status: filter by status (pending, voting, approved, rejected, converted)
 * - source: filter by source (web, discord)
 * - limit: number of results (default 20, max 100)
 * - offset: pagination offset
 * - orderBy: field to order by (default: created_at)
 * - orderDir: order direction (asc/desc, default: desc)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as ProposalStatus | null
    const source = searchParams.get('source') as 'web' | 'discord' | null
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')
    const orderBy = searchParams.get('orderBy') || 'created_at'
    const orderDir = searchParams.get('orderDir') === 'asc'

    // Use the view that includes computed stats
    let query = getSupabase()
      .from('v_proposals_with_stats')
      .select('*')
      .order(orderBy, { ascending: orderDir })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq('status', status)
    }

    if (source) {
      query = query.eq('source', source)
    }

    const { data: proposals, error } = await query

    if (error) {
      // If view doesn't exist, fallback to direct table query
      if (error.code === '42P01') {
        console.warn('[Proposals API] View not found, using table directly')
        return await getProposalsFromTable(status, source, limit, offset, orderBy, orderDir)
      }

      console.error('[Proposals API] Error fetching proposals:', error)
      return NextResponse.json(
        { error: 'Failed to fetch proposals', details: error.message },
        { status: 500 }
      )
    }

    // Transform to consistent response format
    const transformedProposals: ProposalResponse[] = (proposals || []).map(transformProposal)

    return NextResponse.json({
      success: true,
      data: transformedProposals,
      count: transformedProposals.length,
      pagination: {
        limit,
        offset,
        hasMore: transformedProposals.length === limit,
      },
    })
  } catch (error) {
    console.error('[Proposals API] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/proposals
 *
 * Create a new proposal
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      title,
      description,
      // New schema fields
      source = 'web',
      proposedByWallet,
      proposedByDiscordId,
      proposedByDiscordUsername,
      suggestedDomain,
      suggestedCategory,
      suggestedReward,
      suggestedComplexity,
      // Old schema fields (for backwards compatibility)
      proposed_by_address,
      proposed_by_discord,
      platform_origin,
      estimated_complexity,
      estimated_days,
    } = body

    // Validate required fields
    if (!title || title.trim().length < 3) {
      return NextResponse.json(
        { success: false, error: 'Title must be at least 3 characters' },
        { status: 400 }
      )
    }

    if (!description || description.trim().length < 10) {
      return NextResponse.json(
        { success: false, error: 'Description must be at least 10 characters' },
        { status: 400 }
      )
    }

    // Build proposal data (support both schemas)
    const proposalData: Record<string, unknown> = {
      title: title.trim(),
      description: description.trim(),
      status: 'pending',
    }

    // New schema fields
    if (source) proposalData.source = source
    if (proposedByWallet) proposalData.proposed_by_wallet = proposedByWallet
    if (proposedByDiscordId) proposalData.proposed_by_discord_id = proposedByDiscordId
    if (proposedByDiscordUsername) proposalData.proposed_by_discord_username = proposedByDiscordUsername
    if (suggestedDomain) proposalData.suggested_domain = suggestedDomain
    if (suggestedCategory) proposalData.suggested_category = suggestedCategory
    if (suggestedReward) proposalData.suggested_reward = suggestedReward
    if (suggestedComplexity) proposalData.suggested_complexity = suggestedComplexity

    // Old schema fields (backwards compatibility)
    if (proposed_by_address) proposalData.proposed_by_address = proposed_by_address
    if (proposed_by_discord) proposalData.proposed_by_discord = proposed_by_discord
    if (platform_origin) proposalData.platform_origin = platform_origin
    if (estimated_complexity) proposalData.estimated_complexity = estimated_complexity
    if (estimated_days) proposalData.estimated_days = estimated_days

    const { data: proposal, error } = await getSupabase()
      .from('task_proposals')
      .insert(proposalData)
      .select()
      .single()

    if (error) {
      console.error('[Proposals API] Error creating proposal:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to create proposal', details: error.message },
        { status: 500 }
      )
    }

    console.log(`[Proposals API] Created proposal: ${proposal.id}`)

    // Trigger AI refinement if OpenAI is configured
    if (process.env.OPENAI_API_KEY) {
      triggerAIRefinement(proposal.id, title.trim(), description.trim()).catch((err) =>
        console.error('[Proposals API] AI refinement error:', err)
      )
    }

    // Sync proposal to Discord for voting (fire-and-forget)
    // This posts the proposal to #proposals channel with voting buttons
    syncProposalToDiscord({
      id: proposal.id,
      title: title.trim(),
      description: description.trim(),
      proposer: proposedByWallet || proposedByDiscordUsername || 'Anonymous',
      suggestedCategory: suggestedCategory,
      suggestedReward: suggestedReward,
    })
      .then(async (syncResult) => {
        if (syncResult.success && syncResult.messageId) {
          // Update proposal with Discord message ID for future updates
          await getSupabase()
            .from('task_proposals')
            .update({
              discord_message_id: syncResult.messageId,
              discord_thread_id: syncResult.threadId || null,
            })
            .eq('id', proposal.id)
          console.log(`[Proposals API] Synced to Discord: ${syncResult.messageId}`)
        } else {
          console.warn('[Proposals API] Discord sync skipped or failed:', syncResult.error)
        }
      })
      .catch((err) => console.error('[Proposals API] Discord sync error:', err))

    return NextResponse.json({
      success: true,
      message: 'Proposal submitted successfully',
      data: transformProposal(proposal),
    })
  } catch (error) {
    console.error('[Proposals API] Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Fallback function to query table directly if view doesn't exist
 */
async function getProposalsFromTable(
  status: ProposalStatus | null,
  source: 'web' | 'discord' | null,
  limit: number,
  offset: number,
  orderBy: string,
  orderDir: boolean
) {
  let query = getSupabase()
    .from('task_proposals')
    .select('*')
    .order(orderBy, { ascending: orderDir })
    .range(offset, offset + limit - 1)

  if (status) {
    query = query.eq('status', status)
  }

  if (source) {
    query = query.eq('source', source)
  }

  const { data: proposals, error } = await query

  if (error) {
    console.error('[Proposals API] Table query error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch proposals', details: error.message },
      { status: 500 }
    )
  }

  const transformedProposals: ProposalResponse[] = (proposals || []).map(transformProposal)

  return NextResponse.json({
    success: true,
    data: transformedProposals,
    count: transformedProposals.length,
    pagination: {
      limit,
      offset,
      hasMore: transformedProposals.length === limit,
    },
  })
}

/**
 * Transform raw DB row to consistent response format
 * Handles both old and new schema fields
 */
function transformProposal(row: Record<string, unknown>): ProposalResponse {
  const votesUp = (row.votes_up as number) || 0
  const votesDown = (row.votes_down as number) || 0
  const totalVotes = votesUp + votesDown

  return {
    id: row.id as string,
    title: row.title as string,
    description: (row.description as string) || '',
    status: (row.status as ProposalStatus) || 'pending',
    source: (row.source as 'web' | 'discord') || (row.platform_origin as 'web' | 'discord') || 'web',

    // Proposer info (handle both schemas)
    proposedByWallet: (row.proposed_by_wallet as string) || (row.proposed_by_address as string) || null,
    proposedByDiscordId: (row.proposed_by_discord_id as string) || null,
    proposedByDiscordUsername: (row.proposed_by_discord_username as string) || (row.proposed_by_discord as string) || null,

    // Voting
    votesUp,
    votesDown,
    voteScore: (row.vote_score as number) || (votesUp - votesDown),
    approvalPercentage: (row.approval_percentage as number) || (totalVotes > 0 ? Math.round((votesUp / totalVotes) * 100) : 0),

    // Suggestions
    suggestedDomain: (row.suggested_domain as string) || null,
    suggestedCategory: (row.suggested_category as string) || null,
    suggestedReward: (row.suggested_reward as number) || null,
    suggestedComplexity: (row.suggested_complexity as number) || (row.estimated_complexity as number) || null,
    estimatedDays: (row.suggested_estimated_days as number) || (row.estimated_days as number) || null,

    // AI Refinement
    refinedTitle: (row.ai_refined_title as string) || null,
    refinedDescription: (row.ai_refined_description as string) || null,
    aiAnalysis: (row.ai_analysis as Record<string, unknown>) || null,

    // Final values
    finalReward: (row.final_reward as number) || null,
    finalComplexity: (row.final_complexity as number) || null,
    finalDomain: (row.final_domain as string) || null,
    finalCategory: (row.final_category as string) || null,

    // Approval info
    approvedByWallet: (row.approved_by_wallet as string) || (row.approved_by as string) || null,
    approvedByDiscordId: (row.approved_by_discord_id as string) || null,
    approvedAt: (row.approved_at as string) || null,
    rejectionReason: (row.rejection_reason as string) || (row.review_notes as string) || null,

    // Discord integration
    discordMessageId: (row.discord_message_id as string) || null,
    discordThreadId: (row.discord_thread_id as string) || null,

    // Result
    resultingTaskId: (row.resulting_task_id as string) || null,

    // Timestamps
    createdAt: row.created_at as string,
    updatedAt: (row.updated_at as string) || (row.created_at as string),
  }
}

/**
 * Trigger AI refinement for a proposal (fire-and-forget)
 */
async function triggerAIRefinement(proposalId: string, title: string, description: string) {
  try {
    const { refineProposal, isRefinementError } = await import(
      '@/lib/discord/bot/services/ai-refinement-service'
    )

    const result = await refineProposal(title, description)

    if (isRefinementError(result)) {
      console.warn(`[AI Refinement] Failed for proposal ${proposalId}:`, result.error)
      return
    }

    const { error } = await getSupabase()
      .from('task_proposals')
      .update({
        ai_refined_title: result.refinedTitle,
        ai_refined_description: result.refinedDescription,
        suggested_domain: result.suggestedDomain,
        suggested_category: result.suggestedCategory,
        suggested_reward: result.suggestedReward,
        suggested_complexity: result.suggestedComplexity,
        suggested_estimated_days: result.estimatedDays,
        ai_analysis: {
          skills: result.skills,
          deliverables: result.deliverables,
          acceptanceCriteria: result.acceptanceCriteria,
          confidence: result.confidence,
        },
        ai_processed_at: new Date().toISOString(),
        status: 'voting',
      })
      .eq('id', proposalId)

    if (error) {
      console.error(`[AI Refinement] Update failed for ${proposalId}:`, error)
    } else {
      console.log(`[AI Refinement] Completed for proposal ${proposalId}`)
    }
  } catch (error) {
    console.error(`[AI Refinement] Error for proposal ${proposalId}:`, error)
  }
}
