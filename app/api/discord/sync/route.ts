/**
 * Discord Sync Trigger API
 *
 * Manual trigger for syncing data between web and Discord
 * This is the "button" that can be pressed to update Discord
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import {
  syncTaskToDiscord,
  syncProposalToDiscord,
  isDiscordSyncConfigured,
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

/**
 * POST /api/discord/sync
 *
 * Manually trigger sync operations
 *
 * Body options:
 * - { action: "sync_new_tasks" } - Sync all tasks not yet posted to Discord
 * - { action: "sync_new_proposals" } - Sync all proposals not yet posted
 * - { action: "sync_task", taskId: "CGC-001" } - Sync a specific task
 * - { action: "sync_proposal", proposalId: "uuid" } - Sync a specific proposal
 * - { action: "status" } - Get sync status
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin authorization
    const authHeader = request.headers.get('authorization')
    const expectedKey = process.env.DISCORD_ADMIN_SECRET

    if (expectedKey && authHeader !== `Bearer ${expectedKey}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if Discord is configured
    if (!isDiscordSyncConfigured()) {
      return NextResponse.json(
        {
          error: 'Discord sync not configured',
          details: 'Missing DISCORD_BOT_TOKEN, DISCORD_APPLICATION_ID, or channel IDs',
        },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { action, taskId, proposalId } = body

    switch (action) {
      case 'sync_new_tasks':
        return await handleSyncNewTasks()

      case 'sync_new_proposals':
        return await handleSyncNewProposals()

      case 'sync_task':
        if (!taskId) {
          return NextResponse.json({ error: 'taskId required' }, { status: 400 })
        }
        return await handleSyncTask(taskId)

      case 'sync_proposal':
        if (!proposalId) {
          return NextResponse.json({ error: 'proposalId required' }, { status: 400 })
        }
        return await handleSyncProposal(proposalId)

      case 'status':
        return await handleSyncStatus()

      default:
        return NextResponse.json(
          {
            error: 'Invalid action',
            validActions: ['sync_new_tasks', 'sync_new_proposals', 'sync_task', 'sync_proposal', 'status'],
          },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('[Discord Sync API] Error:', error)
    return NextResponse.json(
      {
        error: 'Sync failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/discord/sync
 *
 * Get sync status
 */
export async function GET(request: NextRequest) {
  try {
    return await handleSyncStatus()
  } catch (error) {
    console.error('[Discord Sync API] Status error:', error)
    return NextResponse.json(
      { error: 'Failed to get status' },
      { status: 500 }
    )
  }
}

/**
 * Sync all new tasks to Discord
 */
async function handleSyncNewTasks() {
  // Get tasks that haven't been synced to Discord
  const { data: tasks, error } = await getSupabase()
    .from('tasks')
    .select('*')
    .is('discord_message_id', null)
    .eq('status', 'available')
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }

  if (!tasks || tasks.length === 0) {
    return NextResponse.json({
      success: true,
      message: 'No new tasks to sync',
      synced: 0,
    })
  }

  const results = []

  for (const task of tasks) {
    const result = await syncTaskToDiscord(task)

    if (result.success && result.messageId) {
      // Update task with Discord message ID
      await getSupabase()
        .from('tasks')
        .update({ discord_message_id: result.messageId })
        .eq('task_id', task.task_id)

      results.push({
        taskId: task.task_id,
        success: true,
        messageId: result.messageId,
      })
    } else {
      results.push({
        taskId: task.task_id,
        success: false,
        error: result.error,
      })
    }
  }

  const successful = results.filter((r) => r.success).length

  return NextResponse.json({
    success: true,
    message: `Synced ${successful} of ${tasks.length} tasks`,
    synced: successful,
    results,
  })
}

/**
 * Sync all new proposals to Discord
 */
async function handleSyncNewProposals() {
  // Get proposals that haven't been synced to Discord
  const { data: proposals, error } = await getSupabase()
    .from('task_proposals')
    .select('*')
    .is('discord_message_id', null)
    .in('status', ['pending', 'voting'])
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch proposals' }, { status: 500 })
  }

  if (!proposals || proposals.length === 0) {
    return NextResponse.json({
      success: true,
      message: 'No new proposals to sync',
      synced: 0,
    })
  }

  const results = []

  for (const proposal of proposals) {
    const result = await syncProposalToDiscord({
      id: proposal.id,
      title: proposal.title,
      description: proposal.description || '',
      proposer: proposal.proposed_by_discord_username || 'Web User',
      suggestedCategory: proposal.suggested_category,
      suggestedReward: proposal.suggested_reward,
    })

    if (result.success && result.messageId) {
      // Update proposal with Discord message ID
      await getSupabase()
        .from('task_proposals')
        .update({
          discord_message_id: result.messageId,
          discord_thread_id: result.threadId,
        })
        .eq('id', proposal.id)

      results.push({
        proposalId: proposal.id,
        success: true,
        messageId: result.messageId,
      })
    } else {
      results.push({
        proposalId: proposal.id,
        success: false,
        error: result.error,
      })
    }
  }

  const successful = results.filter((r) => r.success).length

  return NextResponse.json({
    success: true,
    message: `Synced ${successful} of ${proposals.length} proposals`,
    synced: successful,
    results,
  })
}

/**
 * Sync a specific task
 */
async function handleSyncTask(taskId: string) {
  const { data: task, error } = await getSupabase()
    .from('tasks')
    .select('*')
    .eq('task_id', taskId)
    .single()

  if (error || !task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }

  const result = await syncTaskToDiscord(task)

  if (result.success && result.messageId) {
    await getSupabase()
      .from('tasks')
      .update({ discord_message_id: result.messageId })
      .eq('task_id', taskId)
  }

  return NextResponse.json({
    success: result.success,
    taskId,
    messageId: result.messageId,
    error: result.error,
  })
}

/**
 * Sync a specific proposal
 */
async function handleSyncProposal(proposalId: string) {
  const { data: proposal, error } = await getSupabase()
    .from('task_proposals')
    .select('*')
    .eq('id', proposalId)
    .single()

  if (error || !proposal) {
    return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
  }

  const result = await syncProposalToDiscord({
    id: proposal.id,
    title: proposal.title,
    description: proposal.description || '',
    proposer: proposal.proposed_by_discord_username || 'Web User',
    suggestedCategory: proposal.suggested_category,
    suggestedReward: proposal.suggested_reward,
  })

  if (result.success && result.messageId) {
    await getSupabase()
      .from('task_proposals')
      .update({
        discord_message_id: result.messageId,
        discord_thread_id: result.threadId,
      })
      .eq('id', proposalId)
  }

  return NextResponse.json({
    success: result.success,
    proposalId,
    messageId: result.messageId,
    threadId: result.threadId,
    error: result.error,
  })
}

/**
 * Get sync status
 */
async function handleSyncStatus() {
  // Count tasks pending sync
  const { count: tasksPending } = await getSupabase()
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .is('discord_message_id', null)
    .eq('status', 'available')

  // Count proposals pending sync
  const { count: proposalsPending } = await getSupabase()
    .from('task_proposals')
    .select('*', { count: 'exact', head: true })
    .is('discord_message_id', null)
    .in('status', ['pending', 'voting'])

  // Count synced items
  const { count: tasksSynced } = await getSupabase()
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .not('discord_message_id', 'is', null)

  const { count: proposalsSynced } = await getSupabase()
    .from('task_proposals')
    .select('*', { count: 'exact', head: true })
    .not('discord_message_id', 'is', null)

  return NextResponse.json({
    configured: isDiscordSyncConfigured(),
    tasks: {
      pending: tasksPending || 0,
      synced: tasksSynced || 0,
    },
    proposals: {
      pending: proposalsPending || 0,
      synced: proposalsSynced || 0,
    },
    channels: {
      proposals: process.env.DISCORD_CHANNEL_PROPOSALS_ID ? 'configured' : 'not set',
      tasks: process.env.DISCORD_CHANNEL_TASK_DAO_ID ? 'configured' : 'not set',
      announcements: process.env.DISCORD_ANNOUNCEMENTS_CHANNEL_ID ? 'configured' : 'not set',
    },
  })
}
