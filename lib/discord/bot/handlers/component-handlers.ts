/**
 * Discord Component Handlers
 *
 * Handles button clicks, select menus, and modal submissions
 */

import {
  InteractionResponseType,
  MessageFlags,
  type DiscordInteraction,
  type InteractionResponse,
} from '../types'
import {
  proposalEmbed,
  taskEmbed,
  successEmbed,
  errorEmbed,
} from '../components/embeds'
import {
  proposalVoteButtons,
  taskClaimedButtons,
} from '../components/buttons'
import {
  rejectProposalModal,
  approveProposalModal,
  submitTaskModal,
  abandonTaskModal,
} from '../components/modals'
import * as proposalService from '../services/proposal-service'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

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
 * Get user display name
 */
function getUserDisplayName(interaction: DiscordInteraction): string {
  const user = interaction.member?.user || interaction.user
  return user?.global_name || user?.username || 'Usuario'
}

// ============================================================================
// BUTTON HANDLERS
// ============================================================================

/**
 * Handle vote button click
 */
export async function handleVoteButton(
  interaction: DiscordInteraction,
  proposalId: string,
  voteType: 'up' | 'down'
): Promise<InteractionResponse> {
  const user = interaction.member?.user || interaction.user
  const discordId = user?.id

  if (!discordId) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        embeds: [errorEmbed('Error', 'No se pudo identificar tu usuario')],
        flags: MessageFlags.EPHEMERAL,
      },
    }
  }

  const result = await proposalService.castVote(proposalId, voteType, { discordId })

  if (!result.success) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        embeds: [errorEmbed('Error', result.error || 'No se pudo registrar el voto')],
        flags: MessageFlags.EPHEMERAL,
      },
    }
  }

  // Get updated vote counts
  const votes = await proposalService.getVoteCounts(proposalId)
  const voteEmoji = voteType === 'up' ? '✅' : '❌'

  // Update the original message with new vote counts
  const proposal = await proposalService.getProposal(proposalId)

  if (proposal) {
    // Return update message response
    return {
      type: InteractionResponseType.UPDATE_MESSAGE,
      data: {
        embeds: [
          proposalEmbed({
            id: proposal.id,
            title: proposal.title,
            description: proposal.description || '',
            proposer: proposal.proposed_by_discord_username || 'Anónimo',
            suggestedCategory: proposal.suggested_category || undefined,
            suggestedReward: proposal.suggested_reward || undefined,
            votesUp: votes.up,
            votesDown: votes.down,
          }),
        ],
        components: proposalVoteButtons(proposalId),
      },
    }
  }

  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      embeds: [
        successEmbed(
          'Voto Registrado',
          `${voteEmoji} Tu voto ha sido registrado.\n\n📊 **Votos:** ✅ ${votes.up} | ❌ ${votes.down}`
        ),
      ],
      flags: MessageFlags.EPHEMERAL,
    },
  }
}

/**
 * Handle view proposal button
 */
export async function handleViewProposal(
  interaction: DiscordInteraction,
  proposalId: string
): Promise<InteractionResponse> {
  const proposal = await proposalService.getProposal(proposalId)

  if (!proposal) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        embeds: [errorEmbed('Error', 'Propuesta no encontrada')],
        flags: MessageFlags.EPHEMERAL,
      },
    }
  }

  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      embeds: [
        {
          title: `📋 ${proposal.title}`,
          description: proposal.ai_refined_description || proposal.description || '_Sin descripción_',
          color: 0x8b5cf6,
          fields: [
            {
              name: '👤 Propuesto por',
              value: proposal.proposed_by_discord_username || 'Anónimo',
              inline: true,
            },
            {
              name: '📁 Categoría',
              value: proposal.suggested_category || 'Por definir',
              inline: true,
            },
            {
              name: '💰 Recompensa',
              value: proposal.suggested_reward ? `${proposal.suggested_reward} CGC` : 'Pendiente',
              inline: true,
            },
            {
              name: '📊 Estado',
              value:
                proposal.status === 'pending'
                  ? '⏳ Pendiente'
                  : proposal.status === 'voting'
                    ? '🗳️ En votación'
                    : proposal.status === 'approved'
                      ? '✅ Aprobada'
                      : proposal.status === 'rejected'
                        ? '❌ Rechazada'
                        : '🎯 Convertida',
              inline: true,
            },
            {
              name: '📊 Votos',
              value: `✅ ${proposal.votes_up} | ❌ ${proposal.votes_down}`,
              inline: true,
            },
            {
              name: '📅 Creada',
              value: new Date(proposal.created_at).toLocaleDateString('es-ES'),
              inline: true,
            },
          ],
        },
      ],
      flags: MessageFlags.EPHEMERAL,
    },
  }
}

/**
 * Handle claim task button
 */
export async function handleClaimTaskButton(
  interaction: DiscordInteraction,
  taskId: string
): Promise<InteractionResponse> {
  const user = interaction.member?.user || interaction.user
  const discordId = user?.id

  // Check if user has linked wallet
  const wallet = await proposalService.getLinkedWallet(discordId || '')

  if (!wallet) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        embeds: [
          errorEmbed(
            'Wallet No Vinculada',
            'Debes vincular tu wallet primero con `/link-wallet`'
          ),
        ],
        flags: MessageFlags.EPHEMERAL,
      },
    }
  }

  // Get and verify task
  const { data: task, error: taskError } = await getSupabase()
    .from('tasks')
    .select('*')
    .eq('task_id', taskId)
    .single()

  if (taskError || !task) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        embeds: [errorEmbed('Error', `Tarea ${taskId} no encontrada`)],
        flags: MessageFlags.EPHEMERAL,
      },
    }
  }

  if (task.status !== 'available') {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        embeds: [
          errorEmbed(
            'Tarea No Disponible',
            `Esta tarea ya está ${task.status === 'in_progress' ? 'en progreso' : task.status}`
          ),
        ],
        flags: MessageFlags.EPHEMERAL,
      },
    }
  }

  // Claim the task
  const { error: claimError } = await getSupabase()
    .from('tasks')
    .update({
      status: 'in_progress',
      assignee: wallet,
      claimed_at: new Date().toISOString(),
    })
    .eq('task_id', taskId)

  if (claimError) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        embeds: [errorEmbed('Error', 'No se pudo reclamar la tarea')],
        flags: MessageFlags.EPHEMERAL,
      },
    }
  }

  // Update task in database
  const updatedTask = { ...task, status: 'in_progress', assignee: wallet }

  return {
    type: InteractionResponseType.UPDATE_MESSAGE,
    data: {
      embeds: [taskEmbed(updatedTask)],
      components: taskClaimedButtons(taskId),
    },
  }
}

/**
 * Handle view task button
 */
export async function handleViewTask(
  interaction: DiscordInteraction,
  taskId: string
): Promise<InteractionResponse> {
  const { data: task } = await getSupabase()
    .from('tasks')
    .select('*')
    .eq('task_id', taskId)
    .single()

  if (!task) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        embeds: [errorEmbed('Error', 'Tarea no encontrada')],
        flags: MessageFlags.EPHEMERAL,
      },
    }
  }

  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      embeds: [taskEmbed(task)],
      flags: MessageFlags.EPHEMERAL,
    },
  }
}

/**
 * Handle approve proposal button (opens modal)
 */
export async function handleApproveProposalButton(
  interaction: DiscordInteraction,
  proposalId: string
): Promise<InteractionResponse> {
  // Check moderator permissions
  const permissions = interaction.member?.permissions
  const isAdmin = permissions && (BigInt(permissions) & BigInt(0x8)) === BigInt(0x8)

  if (!isAdmin) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        embeds: [errorEmbed('Sin Permisos', 'Solo los moderadores pueden aprobar propuestas')],
        flags: MessageFlags.EPHEMERAL,
      },
    }
  }

  return approveProposalModal(proposalId)
}

/**
 * Handle reject proposal button (opens modal)
 */
export async function handleRejectProposalButton(
  interaction: DiscordInteraction,
  proposalId: string
): Promise<InteractionResponse> {
  // Check moderator permissions
  const permissions = interaction.member?.permissions
  const isAdmin = permissions && (BigInt(permissions) & BigInt(0x8)) === BigInt(0x8)

  if (!isAdmin) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        embeds: [errorEmbed('Sin Permisos', 'Solo los moderadores pueden rechazar propuestas')],
        flags: MessageFlags.EPHEMERAL,
      },
    }
  }

  return rejectProposalModal(proposalId)
}

/**
 * Handle submit task button (opens modal)
 */
export async function handleSubmitTaskButton(
  interaction: DiscordInteraction,
  taskId: string
): Promise<InteractionResponse> {
  return submitTaskModal(taskId)
}

/**
 * Handle abandon task button (opens modal)
 */
export async function handleAbandonTaskButton(
  interaction: DiscordInteraction,
  taskId: string
): Promise<InteractionResponse> {
  return abandonTaskModal(taskId)
}

// ============================================================================
// MODAL HANDLERS
// ============================================================================

/**
 * Handle approve proposal modal submission
 */
export async function handleApproveProposalModal(
  interaction: DiscordInteraction,
  proposalId: string
): Promise<InteractionResponse> {
  const components = interaction.data?.components || []

  // Extract values from modal
  let reward = 100
  let complexity = 3
  let category = 'general'
  let estimatedDays = 2

  for (const row of components) {
    for (const component of row.components || []) {
      if (component.custom_id === 'reward') {
        reward = parseInt(component.value || '100', 10)
      } else if (component.custom_id === 'complexity') {
        complexity = parseInt(component.value || '3', 10)
      } else if (component.custom_id === 'category') {
        category = component.value || 'general'
      } else if (component.custom_id === 'estimated_days') {
        estimatedDays = parseInt(component.value || '2', 10)
      }
    }
  }

  const proposal = await proposalService.getProposal(proposalId)

  if (!proposal) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        embeds: [errorEmbed('Error', 'Propuesta no encontrada')],
        flags: MessageFlags.EPHEMERAL,
      },
    }
  }

  const user = interaction.member?.user || interaction.user

  // Update proposal status
  await proposalService.updateProposalStatus(proposalId, 'approved', {
    approvedByDiscordId: user?.id,
  })

  // Create task from proposal
  const { data: newTask, error: taskError } = await getSupabase()
    .from('tasks')
    .insert({
      title: proposal.ai_refined_title || proposal.title,
      description: proposal.ai_refined_description || proposal.description,
      category,
      reward_cgc: reward,
      complexity,
      estimated_days: estimatedDays,
      status: 'available',
      proposed_from_discord: true,
      proposal_id: proposalId,
    })
    .select()
    .single()

  if (taskError) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        embeds: [errorEmbed('Error', 'No se pudo crear la tarea')],
        flags: MessageFlags.EPHEMERAL,
      },
    }
  }

  // Update proposal with resulting task
  await proposalService.updateProposalStatus(proposalId, 'converted', {
    resultingTaskId: newTask.task_id,
  })

  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      embeds: [
        successEmbed(
          'Propuesta Aprobada',
          `✅ **${proposal.title}** ha sido aprobada.\n\n🎯 **Tarea:** \`${newTask.task_id}\`\n💰 **Recompensa:** ${reward} CGC\n⭐ **Complejidad:** ${complexity}/10\n⏱️ **Tiempo:** ${estimatedDays} día${estimatedDays > 1 ? 's' : ''}`
        ),
      ],
    },
  }
}

/**
 * Handle reject proposal modal submission
 */
export async function handleRejectProposalModal(
  interaction: DiscordInteraction,
  proposalId: string
): Promise<InteractionResponse> {
  const components = interaction.data?.components || []

  let reason = ''
  for (const row of components) {
    for (const component of row.components || []) {
      if (component.custom_id === 'reason') {
        reason = component.value || ''
      }
    }
  }

  const proposal = await proposalService.getProposal(proposalId)

  if (!proposal) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        embeds: [errorEmbed('Error', 'Propuesta no encontrada')],
        flags: MessageFlags.EPHEMERAL,
      },
    }
  }

  const user = interaction.member?.user || interaction.user

  await proposalService.updateProposalStatus(proposalId, 'rejected', {
    approvedByDiscordId: user?.id,
    rejectionReason: reason,
  })

  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      embeds: [
        {
          title: '❌ Propuesta Rechazada',
          description: `**${proposal.title}** ha sido rechazada.`,
          color: 0xed4245,
          fields: [
            {
              name: '📝 Razón',
              value: reason,
              inline: false,
            },
            {
              name: '👤 Rechazada por',
              value: getUserDisplayName(interaction),
              inline: true,
            },
          ],
        },
      ],
    },
  }
}

/**
 * Handle submit task modal submission
 */
export async function handleSubmitTaskModal(
  interaction: DiscordInteraction,
  taskId: string
): Promise<InteractionResponse> {
  const components = interaction.data?.components || []

  let description = ''
  let evidenceUrl = ''
  let notes = ''

  for (const row of components) {
    for (const component of row.components || []) {
      if (component.custom_id === 'description') {
        description = component.value || ''
      } else if (component.custom_id === 'evidence_url') {
        evidenceUrl = component.value || ''
      } else if (component.custom_id === 'notes') {
        notes = component.value || ''
      }
    }
  }

  const user = interaction.member?.user || interaction.user
  const discordId = user?.id
  const wallet = await proposalService.getLinkedWallet(discordId || '')

  // Verify task belongs to user
  const { data: task } = await getSupabase()
    .from('tasks')
    .select('*')
    .eq('task_id', taskId)
    .single()

  if (!task) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        embeds: [errorEmbed('Error', 'Tarea no encontrada')],
        flags: MessageFlags.EPHEMERAL,
      },
    }
  }

  if (task.assignee?.toLowerCase() !== wallet?.toLowerCase()) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        embeds: [errorEmbed('Error', 'Esta tarea no te pertenece')],
        flags: MessageFlags.EPHEMERAL,
      },
    }
  }

  // Update task status
  const { error } = await getSupabase()
    .from('tasks')
    .update({
      status: 'submitted',
      submission_description: description,
      submission_url: evidenceUrl,
      submission_notes: notes,
      submitted_at: new Date().toISOString(),
    })
    .eq('task_id', taskId)

  if (error) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        embeds: [errorEmbed('Error', 'No se pudo enviar la tarea')],
        flags: MessageFlags.EPHEMERAL,
      },
    }
  }

  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      embeds: [
        successEmbed(
          'Tarea Enviada',
          `📤 **${task.title}** ha sido enviada para revisión.\n\nUn moderador revisará tu trabajo pronto. ¡Gracias por contribuir!`
        ),
      ],
    },
  }
}

/**
 * Handle abandon task modal submission
 */
export async function handleAbandonTaskModal(
  interaction: DiscordInteraction,
  taskId: string
): Promise<InteractionResponse> {
  const components = interaction.data?.components || []

  let reason = ''
  for (const row of components) {
    for (const component of row.components || []) {
      if (component.custom_id === 'reason') {
        reason = component.value || ''
      }
    }
  }

  const user = interaction.member?.user || interaction.user
  const discordId = user?.id
  const wallet = await proposalService.getLinkedWallet(discordId || '')

  // Verify task belongs to user
  const { data: task } = await getSupabase()
    .from('tasks')
    .select('*')
    .eq('task_id', taskId)
    .single()

  if (!task) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        embeds: [errorEmbed('Error', 'Tarea no encontrada')],
        flags: MessageFlags.EPHEMERAL,
      },
    }
  }

  if (task.assignee?.toLowerCase() !== wallet?.toLowerCase()) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        embeds: [errorEmbed('Error', 'Esta tarea no te pertenece')],
        flags: MessageFlags.EPHEMERAL,
      },
    }
  }

  // Release the task
  const { error } = await getSupabase()
    .from('tasks')
    .update({
      status: 'available',
      assignee: null,
      claimed_at: null,
      abandon_reason: reason,
      abandoned_at: new Date().toISOString(),
    })
    .eq('task_id', taskId)

  if (error) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        embeds: [errorEmbed('Error', 'No se pudo abandonar la tarea')],
        flags: MessageFlags.EPHEMERAL,
      },
    }
  }

  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      embeds: [
        {
          title: '🚫 Tarea Abandonada',
          description: `Has abandonado **${task.title}**.\n\nLa tarea está ahora disponible para otros colaboradores.`,
          color: 0xf39c12,
        },
      ],
      flags: MessageFlags.EPHEMERAL,
    },
  }
}

// ============================================================================
// ROUTER
// ============================================================================

/**
 * Route button interactions
 */
export async function routeButtonInteraction(
  interaction: DiscordInteraction
): Promise<InteractionResponse> {
  const customId = interaction.data?.custom_id || ''
  const [action, ...params] = customId.split(':')

  switch (action) {
    case 'vote_up':
      return handleVoteButton(interaction, params[0], 'up')
    case 'vote_down':
      return handleVoteButton(interaction, params[0], 'down')
    case 'view_proposal':
      return handleViewProposal(interaction, params[0])
    case 'claim_task':
      return handleClaimTaskButton(interaction, params[0])
    case 'view_task':
      return handleViewTask(interaction, params[0])
    case 'approve_proposal':
      return handleApproveProposalButton(interaction, params[0])
    case 'reject_proposal':
      return handleRejectProposalButton(interaction, params[0])
    case 'submit_task':
      return handleSubmitTaskButton(interaction, params[0])
    case 'abandon_task':
      return handleAbandonTaskButton(interaction, params[0])
    default:
      return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          embeds: [errorEmbed('Error', 'Acción no reconocida')],
          flags: MessageFlags.EPHEMERAL,
        },
      }
  }
}

/**
 * Route modal submissions
 */
export async function routeModalSubmission(
  interaction: DiscordInteraction
): Promise<InteractionResponse> {
  const customId = interaction.data?.custom_id || ''
  const [action, ...params] = customId.split(':')

  switch (action) {
    case 'approve_modal':
      return handleApproveProposalModal(interaction, params[0])
    case 'reject_modal':
      return handleRejectProposalModal(interaction, params[0])
    case 'submit_task_modal':
      return handleSubmitTaskModal(interaction, params[0])
    case 'abandon_task_modal':
      return handleAbandonTaskModal(interaction, params[0])
    default:
      return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          embeds: [errorEmbed('Error', 'Formulario no reconocido')],
          flags: MessageFlags.EPHEMERAL,
        },
      }
  }
}
