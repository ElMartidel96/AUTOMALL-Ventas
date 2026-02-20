/**
 * Discord Sync Service
 *
 * Bidirectional synchronization between web and Discord
 * Posts updates to Discord channels when events occur on the web
 */

import {
  sendChannelMessage,
  editMessage,
  createThread,
} from '../utils/discord-api'
import {
  proposalEmbed,
  proposalApprovedEmbed,
  proposalRejectedEmbed,
  taskEmbed,
  taskClaimedEmbed,
  taskCompletedEmbed,
} from '../components/embeds'
import {
  proposalVoteButtons,
  taskActionButtons,
} from '../components/buttons'
import type { Proposal } from '../types'
import type { Task } from '@/lib/supabase/types'

// Channel IDs from environment (matching .env.local variable names)
const PROPOSALS_CHANNEL_ID = process.env.DISCORD_CHANNEL_PROPOSALS_ID
const TASKS_CHANNEL_ID = process.env.DISCORD_CHANNEL_TASK_DAO_ID
const ANNOUNCEMENTS_CHANNEL_ID = process.env.DISCORD_ANNOUNCEMENTS_CHANNEL_ID

interface SyncResult {
  success: boolean
  messageId?: string
  threadId?: string
  error?: string
}

// ============================================================================
// PROPOSAL SYNC
// ============================================================================

/**
 * Post a new proposal to Discord
 */
export async function syncProposalToDiscord(proposal: {
  id: string
  title: string
  description: string
  proposer: string
  suggestedCategory?: string
  suggestedReward?: number
}): Promise<SyncResult> {
  if (!PROPOSALS_CHANNEL_ID) {
    console.warn('[Discord Sync] DISCORD_CHANNEL_PROPOSALS_ID not configured')
    return { success: false, error: 'Channel not configured' }
  }

  try {
    const embed = proposalEmbed({
      ...proposal,
      votesUp: 0,
      votesDown: 0,
    })

    const message = await sendChannelMessage(PROPOSALS_CHANNEL_ID, {
      embeds: [embed],
      components: proposalVoteButtons(proposal.id),
    })

    console.log(`[Discord Sync] Proposal posted: ${message.id}`)

    // Optionally create a discussion thread
    const thread = await createThread(
      PROPOSALS_CHANNEL_ID,
      message.id,
      `💬 Discusión: ${proposal.title.slice(0, 90)}`,
      1440 // 1 day auto-archive
    )

    return {
      success: true,
      messageId: message.id,
      threadId: thread?.id,
    }
  } catch (error) {
    console.error('[Discord Sync] Failed to sync proposal:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Update a proposal in Discord (after votes change)
 */
export async function updateProposalInDiscord(
  messageId: string,
  proposal: {
    id: string
    title: string
    description: string
    proposer: string
    suggestedCategory?: string
    suggestedReward?: number
    votesUp: number
    votesDown: number
  }
): Promise<SyncResult> {
  if (!PROPOSALS_CHANNEL_ID) {
    return { success: false, error: 'Channel not configured' }
  }

  try {
    const embed = proposalEmbed(proposal)

    await editMessage(PROPOSALS_CHANNEL_ID, messageId, {
      embeds: [embed],
      components: proposalVoteButtons(proposal.id),
    })

    return { success: true, messageId }
  } catch (error) {
    console.error('[Discord Sync] Failed to update proposal:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Announce proposal approval in Discord
 */
export async function announceProposalApproved(
  proposal: Proposal,
  approver: string
): Promise<SyncResult> {
  const channelId = ANNOUNCEMENTS_CHANNEL_ID || PROPOSALS_CHANNEL_ID

  if (!channelId) {
    return { success: false, error: 'Channel not configured' }
  }

  try {
    const embed = proposalApprovedEmbed(proposal, approver)

    const message = await sendChannelMessage(channelId, {
      content: '🎉 ¡Nueva tarea disponible!',
      embeds: [embed],
    })

    return { success: true, messageId: message.id }
  } catch (error) {
    console.error('[Discord Sync] Failed to announce approval:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Announce proposal rejection in Discord
 */
export async function announceProposalRejected(
  proposal: Proposal,
  rejector: string,
  reason: string
): Promise<SyncResult> {
  if (!PROPOSALS_CHANNEL_ID) {
    return { success: false, error: 'Channel not configured' }
  }

  try {
    const embed = proposalRejectedEmbed(proposal, rejector, reason)

    const message = await sendChannelMessage(PROPOSALS_CHANNEL_ID, {
      embeds: [embed],
    })

    return { success: true, messageId: message.id }
  } catch (error) {
    console.error('[Discord Sync] Failed to announce rejection:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ============================================================================
// TASK SYNC
// ============================================================================

/**
 * Post a new task to Discord
 */
export async function syncTaskToDiscord(task: Task): Promise<SyncResult> {
  if (!TASKS_CHANNEL_ID) {
    console.warn('[Discord Sync] DISCORD_CHANNEL_TASK_DAO_ID not configured')
    return { success: false, error: 'Channel not configured' }
  }

  try {
    const embed = taskEmbed(task)

    const content = task.is_urgent
      ? '🔥 **¡TAREA URGENTE!**'
      : task.is_featured
        ? '⭐ **Tarea Destacada**'
        : '📋 **Nueva Tarea Disponible**'

    const message = await sendChannelMessage(TASKS_CHANNEL_ID, {
      content,
      embeds: [embed],
      components: taskActionButtons(task.task_id),
    })

    console.log(`[Discord Sync] Task posted: ${message.id}`)

    return { success: true, messageId: message.id }
  } catch (error) {
    console.error('[Discord Sync] Failed to sync task:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Announce task claimed in Discord
 */
export async function announceTaskClaimed(
  task: Task,
  claimer: string
): Promise<SyncResult> {
  if (!TASKS_CHANNEL_ID) {
    return { success: false, error: 'Channel not configured' }
  }

  try {
    const embed = taskClaimedEmbed(task, claimer)

    const message = await sendChannelMessage(TASKS_CHANNEL_ID, {
      embeds: [embed],
    })

    return { success: true, messageId: message.id }
  } catch (error) {
    console.error('[Discord Sync] Failed to announce claim:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Announce task completed in Discord
 */
export async function announceTaskCompleted(
  task: Task,
  completer: string,
  txHash?: string
): Promise<SyncResult> {
  const channelId = ANNOUNCEMENTS_CHANNEL_ID || TASKS_CHANNEL_ID

  if (!channelId) {
    return { success: false, error: 'Channel not configured' }
  }

  try {
    const embed = taskCompletedEmbed(task, completer, txHash)

    const message = await sendChannelMessage(channelId, {
      content: '🏆 ¡Tarea completada!',
      embeds: [embed],
    })

    return { success: true, messageId: message.id }
  } catch (error) {
    console.error('[Discord Sync] Failed to announce completion:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ============================================================================
// UTILITY
// ============================================================================

/**
 * Send a generic announcement
 */
export async function sendAnnouncement(
  title: string,
  description: string,
  color = 0x8b5cf6
): Promise<SyncResult> {
  const channelId = ANNOUNCEMENTS_CHANNEL_ID

  if (!channelId) {
    return { success: false, error: 'Announcements channel not configured' }
  }

  try {
    const message = await sendChannelMessage(channelId, {
      embeds: [
        {
          title,
          description,
          color,
          timestamp: new Date().toISOString(),
          footer: {
            text: 'CryptoGift Wallets DAO',
            icon_url: 'https://cryptogift.mbxarts.com/cgc-icon.png',
          },
        },
      ],
    })

    return { success: true, messageId: message.id }
  } catch (error) {
    console.error('[Discord Sync] Failed to send announcement:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Check if Discord sync is configured
 */
export function isDiscordSyncConfigured(): boolean {
  return !!(
    process.env.DISCORD_BOT_TOKEN &&
    process.env.DISCORD_APPLICATION_ID &&
    (PROPOSALS_CHANNEL_ID || TASKS_CHANNEL_ID)
  )
}
