/**
 * Proposal Vote API
 *
 * Handles voting on task proposals
 * Supports both wallet-connected users and Discord-linked users
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { updateProposalInDiscord } from '@/lib/discord/bot/services/discord-sync-service'

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

interface VoteInput {
  proposalId: string
  voteType: 'up' | 'down'
  voterWallet?: string
  voterDiscordId?: string
  voterDiscordUsername?: string
  comment?: string
  source: 'web' | 'discord'
}

interface VoteResult {
  success: boolean
  action: 'created' | 'updated' | 'removed'
  newVoteCounts: {
    votesUp: number
    votesDown: number
  }
}

/**
 * Sync vote counts to Discord embed (fire-and-forget)
 * Updates the proposal message in Discord with new vote counts
 */
async function syncVotesToDiscord(proposalId: string) {
  try {
    // Fetch full proposal data for Discord update
    const { data: proposal } = await getSupabase()
      .from('task_proposals')
      .select('*')
      .eq('id', proposalId)
      .single()

    if (!proposal || !proposal.discord_message_id) {
      // No Discord message to update
      return
    }

    const proposer =
      proposal.proposed_by_wallet ||
      proposal.proposed_by_discord_username ||
      proposal.proposed_by_discord ||
      proposal.proposed_by_address ||
      'Anonymous'

    await updateProposalInDiscord(proposal.discord_message_id, {
      id: proposal.id,
      title: proposal.ai_refined_title || proposal.title,
      description: proposal.ai_refined_description || proposal.description,
      proposer,
      suggestedCategory: proposal.suggested_category,
      suggestedReward: proposal.suggested_reward,
      votesUp: proposal.votes_up || 0,
      votesDown: proposal.votes_down || 0,
    })

    console.log(`[Vote API] Discord sync completed for proposal ${proposalId}`)
  } catch (error) {
    console.error('[Vote API] Discord sync error:', error)
  }
}

/**
 * POST /api/proposals/vote
 *
 * Cast a vote on a proposal
 * Body: VoteInput
 *
 * Logic:
 * - If user hasn't voted: creates new vote
 * - If user voted the same way: removes vote (toggle off)
 * - If user voted opposite way: updates vote
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: VoteInput = await request.json()

    // Validate required fields
    if (!body.proposalId) {
      return NextResponse.json(
        { error: 'proposalId is required' },
        { status: 400 }
      )
    }

    if (!body.voteType || !['up', 'down'].includes(body.voteType)) {
      return NextResponse.json(
        { error: 'voteType must be "up" or "down"' },
        { status: 400 }
      )
    }

    if (!body.voterWallet && !body.voterDiscordId) {
      return NextResponse.json(
        { error: 'Either voterWallet or voterDiscordId is required' },
        { status: 400 }
      )
    }

    // Verify proposal exists and is votable
    const { data: proposal, error: proposalError } = await getSupabase()
      .from('task_proposals')
      .select('id, status, votes_up, votes_down')
      .eq('id', body.proposalId)
      .single()

    if (proposalError || !proposal) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      )
    }

    // Only allow voting on proposals in 'voting' or 'pending' status
    if (!['pending', 'voting'].includes(proposal.status)) {
      return NextResponse.json(
        { error: `Cannot vote on proposals with status: ${proposal.status}` },
        { status: 400 }
      )
    }

    // Check if user already voted
    let existingVoteQuery = getSupabase()
      .from('proposal_votes')
      .select('*')
      .eq('proposal_id', body.proposalId)

    if (body.voterWallet) {
      existingVoteQuery = existingVoteQuery.eq('voter_wallet', body.voterWallet)
    } else if (body.voterDiscordId) {
      existingVoteQuery = existingVoteQuery.eq('voter_discord_id', body.voterDiscordId)
    }

    const { data: existingVote } = await existingVoteQuery.single()

    let result: VoteResult

    if (existingVote) {
      if (existingVote.vote_type === body.voteType) {
        // Same vote - toggle off (remove vote)
        const { error: deleteError } = await getSupabase()
          .from('proposal_votes')
          .delete()
          .eq('id', existingVote.id)

        if (deleteError) {
          console.error('[Vote API] Error removing vote:', deleteError)
          return NextResponse.json(
            { error: 'Failed to remove vote' },
            { status: 500 }
          )
        }

        result = { success: true, action: 'removed', newVoteCounts: { votesUp: 0, votesDown: 0 } }
      } else {
        // Different vote - update
        const { error: updateError } = await getSupabase()
          .from('proposal_votes')
          .update({
            vote_type: body.voteType,
            comment: body.comment || existingVote.comment,
          })
          .eq('id', existingVote.id)

        if (updateError) {
          console.error('[Vote API] Error updating vote:', updateError)
          return NextResponse.json(
            { error: 'Failed to update vote' },
            { status: 500 }
          )
        }

        result = { success: true, action: 'updated', newVoteCounts: { votesUp: 0, votesDown: 0 } }
      }
    } else {
      // New vote
      const voteData = {
        proposal_id: body.proposalId,
        voter_wallet: body.voterWallet || null,
        voter_discord_id: body.voterDiscordId || null,
        voter_discord_username: body.voterDiscordUsername || null,
        vote_type: body.voteType,
        source: body.source || 'web',
        comment: body.comment || null,
      }

      const { error: insertError } = await getSupabase()
        .from('proposal_votes')
        .insert(voteData)

      if (insertError) {
        console.error('[Vote API] Error creating vote:', insertError)

        // Check for duplicate constraint
        if (insertError.code === '23505') {
          return NextResponse.json(
            { error: 'You have already voted on this proposal' },
            { status: 409 }
          )
        }

        return NextResponse.json(
          { error: 'Failed to create vote' },
          { status: 500 }
        )
      }

      result = { success: true, action: 'created', newVoteCounts: { votesUp: 0, votesDown: 0 } }
    }

    // Fetch updated vote counts (trigger should have updated them)
    const { data: updatedProposal } = await getSupabase()
      .from('task_proposals')
      .select('votes_up, votes_down')
      .eq('id', body.proposalId)
      .single()

    if (updatedProposal) {
      result.newVoteCounts = {
        votesUp: updatedProposal.votes_up || 0,
        votesDown: updatedProposal.votes_down || 0,
      }
    }

    console.log(
      `[Vote API] Vote ${result.action} on proposal ${body.proposalId} by ${body.voterWallet || body.voterDiscordId}`
    )

    // Sync updated vote counts to Discord (fire-and-forget)
    syncVotesToDiscord(body.proposalId).catch((err) =>
      console.error('[Vote API] Discord sync failed:', err)
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('[Vote API] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/proposals/vote?proposalId=xxx&voterWallet=xxx
 *
 * Check if user has voted on a proposal
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const proposalId = searchParams.get('proposalId')
    const voterWallet = searchParams.get('voterWallet')
    const voterDiscordId = searchParams.get('voterDiscordId')

    if (!proposalId) {
      return NextResponse.json(
        { error: 'proposalId is required' },
        { status: 400 }
      )
    }

    if (!voterWallet && !voterDiscordId) {
      return NextResponse.json(
        { error: 'Either voterWallet or voterDiscordId is required' },
        { status: 400 }
      )
    }

    let query = getSupabase()
      .from('proposal_votes')
      .select('*')
      .eq('proposal_id', proposalId)

    if (voterWallet) {
      query = query.eq('voter_wallet', voterWallet)
    } else if (voterDiscordId) {
      query = query.eq('voter_discord_id', voterDiscordId)
    }

    const { data: vote, error } = await query.single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned (not an error for this use case)
      console.error('[Vote API] Error checking vote:', error)
      return NextResponse.json(
        { error: 'Failed to check vote status' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      hasVoted: !!vote,
      voteType: vote?.vote_type || null,
      votedAt: vote?.created_at || null,
    })
  } catch (error) {
    console.error('[Vote API] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/proposals/vote
 *
 * Remove a vote from a proposal
 * Body: { proposalId, voterWallet?, voterDiscordId? }
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()

    if (!body.proposalId) {
      return NextResponse.json(
        { error: 'proposalId is required' },
        { status: 400 }
      )
    }

    if (!body.voterWallet && !body.voterDiscordId) {
      return NextResponse.json(
        { error: 'Either voterWallet or voterDiscordId is required' },
        { status: 400 }
      )
    }

    let query = getSupabase()
      .from('proposal_votes')
      .delete()
      .eq('proposal_id', body.proposalId)

    if (body.voterWallet) {
      query = query.eq('voter_wallet', body.voterWallet)
    } else if (body.voterDiscordId) {
      query = query.eq('voter_discord_id', body.voterDiscordId)
    }

    const { error } = await query

    if (error) {
      console.error('[Vote API] Error deleting vote:', error)
      return NextResponse.json(
        { error: 'Failed to delete vote' },
        { status: 500 }
      )
    }

    // Fetch updated vote counts
    const { data: updatedProposal } = await getSupabase()
      .from('task_proposals')
      .select('votes_up, votes_down')
      .eq('id', body.proposalId)
      .single()

    // Sync updated vote counts to Discord (fire-and-forget)
    syncVotesToDiscord(body.proposalId).catch((err) =>
      console.error('[Vote API] Discord sync failed:', err)
    )

    return NextResponse.json({
      success: true,
      newVoteCounts: {
        votesUp: updatedProposal?.votes_up || 0,
        votesDown: updatedProposal?.votes_down || 0,
      },
    })
  } catch (error) {
    console.error('[Vote API] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
