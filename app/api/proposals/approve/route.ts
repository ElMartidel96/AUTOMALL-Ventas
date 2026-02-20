/**
 * Proposal Approval API
 *
 * Handles proposal approval and rejection from web interface
 * Syncs status changes to Discord automatically
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import {
  announceProposalApproved,
  announceProposalRejected,
  syncTaskToDiscord,
} from '@/lib/discord/bot/services/discord-sync-service'

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

// Admin wallets (same as CLAUDE.md)
const ADMIN_WALLETS = [
  '0xc655BF2Bd9AfA997c757Bef290A9Bb6ca41c5dE6', // Deployer
  '0x3244DFBf9E5374DF2f106E89Cf7972E5D4C9ac31', // DAO Aragon
].map((w) => w.toLowerCase())

interface ApproveInput {
  proposalId: string
  action: 'approve' | 'reject'
  approverWallet: string
  reward?: number
  complexity?: number
  reason?: string // Required for rejection
}

/**
 * POST /api/proposals/approve
 *
 * Approve or reject a proposal
 * Only admin wallets can perform this action
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: ApproveInput = await request.json()

    // Validate required fields
    if (!body.proposalId) {
      return NextResponse.json(
        { success: false, error: 'proposalId is required' },
        { status: 400 }
      )
    }

    if (!body.action || !['approve', 'reject'].includes(body.action)) {
      return NextResponse.json(
        { success: false, error: 'action must be "approve" or "reject"' },
        { status: 400 }
      )
    }

    if (!body.approverWallet) {
      return NextResponse.json(
        { success: false, error: 'approverWallet is required' },
        { status: 400 }
      )
    }

    // Verify admin authorization
    if (!ADMIN_WALLETS.includes(body.approverWallet.toLowerCase())) {
      return NextResponse.json(
        { success: false, error: 'Only admin wallets can approve/reject proposals' },
        { status: 403 }
      )
    }

    if (body.action === 'reject' && !body.reason) {
      return NextResponse.json(
        { success: false, error: 'Rejection reason is required' },
        { status: 400 }
      )
    }

    // Get proposal
    const { data: proposal, error: proposalError } = await getSupabase()
      .from('task_proposals')
      .select('*')
      .eq('id', body.proposalId)
      .single()

    if (proposalError || !proposal) {
      return NextResponse.json(
        { success: false, error: 'Proposal not found' },
        { status: 404 }
      )
    }

    // Verify proposal is in votable state
    if (!['pending', 'voting'].includes(proposal.status)) {
      return NextResponse.json(
        { success: false, error: `Cannot process proposal with status: ${proposal.status}` },
        { status: 400 }
      )
    }

    if (body.action === 'approve') {
      return await handleApproval(proposal, body)
    } else {
      return await handleRejection(proposal, body)
    }
  } catch (error) {
    console.error('[Proposals Approve API] Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Handle proposal approval
 */
async function handleApproval(
  proposal: Record<string, unknown>,
  input: ApproveInput
): Promise<NextResponse> {
  const taskReward = input.reward || (proposal.suggested_reward as number) || 100
  const taskComplexity = input.complexity || (proposal.suggested_complexity as number) || 3

  // Update proposal status
  const { error: updateError } = await getSupabase()
    .from('task_proposals')
    .update({
      status: 'approved',
      approved_by_wallet: input.approverWallet,
      approved_at: new Date().toISOString(),
      final_reward: taskReward,
      final_complexity: taskComplexity,
    })
    .eq('id', input.proposalId)

  if (updateError) {
    console.error('[Proposals Approve API] Update error:', updateError)
    return NextResponse.json(
      { success: false, error: 'Failed to update proposal' },
      { status: 500 }
    )
  }

  // Create task from proposal
  const { data: newTask, error: taskError } = await getSupabase()
    .from('tasks')
    .insert({
      title: (proposal.ai_refined_title as string) || (proposal.title as string),
      description: (proposal.ai_refined_description as string) || (proposal.description as string),
      category: (proposal.suggested_category as string) || 'general',
      reward_cgc: taskReward,
      complexity: taskComplexity,
      estimated_days: Math.ceil(taskComplexity / 2),
      status: 'available',
      proposed_from_discord: proposal.source === 'discord',
      proposal_id: input.proposalId,
    })
    .select()
    .single()

  if (taskError || !newTask) {
    console.error('[Proposals Approve API] Task creation error:', taskError)
    // Revert proposal status
    await getSupabase()
      .from('task_proposals')
      .update({ status: 'voting' })
      .eq('id', input.proposalId)

    return NextResponse.json(
      { success: false, error: 'Failed to create task' },
      { status: 500 }
    )
  }

  // Update proposal with resulting task
  await getSupabase()
    .from('task_proposals')
    .update({
      status: 'converted',
      resulting_task_id: newTask.task_id,
    })
    .eq('id', input.proposalId)

  // Format approver for display
  const approverDisplay = `${input.approverWallet.slice(0, 6)}...${input.approverWallet.slice(-4)}`

  // Sync to Discord: announce approval and publish task (fire-and-forget)
  announceProposalApproved(proposal as unknown as Parameters<typeof announceProposalApproved>[0], approverDisplay)
    .catch((err) => console.error('[Proposals Approve API] Discord announce error:', err))

  syncTaskToDiscord(newTask)
    .catch((err) => console.error('[Proposals Approve API] Discord task sync error:', err))

  console.log(`[Proposals Approve API] Proposal ${input.proposalId} approved, task ${newTask.task_id} created`)

  return NextResponse.json({
    success: true,
    message: 'Proposal approved and task created',
    data: {
      proposalId: input.proposalId,
      taskId: newTask.task_id,
      reward: taskReward,
      complexity: taskComplexity,
    },
  })
}

/**
 * Handle proposal rejection
 */
async function handleRejection(
  proposal: Record<string, unknown>,
  input: ApproveInput
): Promise<NextResponse> {
  // Update proposal status
  const { error: updateError } = await getSupabase()
    .from('task_proposals')
    .update({
      status: 'rejected',
      approved_by_wallet: input.approverWallet, // Using same field for rejector
      rejection_reason: input.reason,
      approved_at: new Date().toISOString(),
    })
    .eq('id', input.proposalId)

  if (updateError) {
    console.error('[Proposals Approve API] Update error:', updateError)
    return NextResponse.json(
      { success: false, error: 'Failed to update proposal' },
      { status: 500 }
    )
  }

  // Format rejector for display
  const rejectorDisplay = `${input.approverWallet.slice(0, 6)}...${input.approverWallet.slice(-4)}`

  // Announce rejection to Discord (fire-and-forget)
  announceProposalRejected(
    proposal as unknown as Parameters<typeof announceProposalRejected>[0],
    rejectorDisplay,
    input.reason || 'No reason provided'
  ).catch((err) => console.error('[Proposals Approve API] Discord reject announce error:', err))

  console.log(`[Proposals Approve API] Proposal ${input.proposalId} rejected: ${input.reason}`)

  return NextResponse.json({
    success: true,
    message: 'Proposal rejected',
    data: {
      proposalId: input.proposalId,
      reason: input.reason,
    },
  })
}
