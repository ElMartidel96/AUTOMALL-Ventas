/**
 * Discord Slash Command Handlers
 *
 * Handles all slash command interactions
 */

import {
  InteractionResponseType,
  MessageFlags,
  type DiscordInteraction,
  type InteractionResponse,
  type CommandOption,
} from '../types'
import {
  proposalEmbed,
  taskEmbed,
  taskListEmbed,
  taskClaimedEmbed,
  helpEmbed,
  statsEmbed,
  leaderboardEmbed,
  errorEmbed,
  successEmbed,
} from '../components/embeds'
import { proposalVoteButtons, taskActionButtons, paginationButtons, helpButtons } from '../components/buttons'
import { proposeModal, linkWalletModal } from '../components/modals'
import * as proposalService from '../services/proposal-service'
import {
  announceProposalApproved,
  announceProposalRejected,
  syncTaskToDiscord,
  announceTaskClaimed,
} from '../services/discord-sync-service'
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
 * Get option value from interaction
 */
function getOption<T = string>(options: CommandOption[] | undefined, name: string): T | undefined {
  if (!options) return undefined
  const option = options.find((o) => o.name === name)
  return option?.value as T | undefined
}

/**
 * Get user display name
 */
function getUserDisplayName(interaction: DiscordInteraction): string {
  const user = interaction.member?.user || interaction.user
  return user?.global_name || user?.username || 'Usuario'
}

// ============================================================================
// COMMAND HANDLERS
// ============================================================================

/**
 * /propose command - Create a new task proposal
 */
export async function handlePropose(
  interaction: DiscordInteraction
): Promise<InteractionResponse> {
  const options = interaction.data?.options
  const title = getOption(options, 'title')
  const description = getOption(options, 'description')
  const category = getOption(options, 'category')
  const reward = getOption<number>(options, 'reward')

  if (!title || !description) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        embeds: [errorEmbed('Error', 'Título y descripción son requeridos')],
        flags: MessageFlags.EPHEMERAL,
      },
    }
  }

  const user = interaction.member?.user || interaction.user
  const discordId = user?.id
  const discordUsername = user?.global_name || user?.username

  // Create proposal in database
  const proposal = await proposalService.createProposal({
    title,
    description,
    source: 'discord',
    proposedByDiscordId: discordId,
    proposedByDiscordUsername: discordUsername,
    discordChannelId: interaction.channel_id,
    suggestedCategory: category,
    suggestedReward: reward,
  })

  if (!proposal) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        embeds: [errorEmbed('Error', 'No se pudo crear la propuesta. Intenta de nuevo.')],
        flags: MessageFlags.EPHEMERAL,
      },
    }
  }

  // Create embed with voting buttons
  const embed = proposalEmbed({
    id: proposal.id,
    title: proposal.title,
    description: proposal.description || '',
    proposer: discordUsername || 'Anónimo',
    suggestedCategory: category,
    suggestedReward: reward,
    votesUp: 0,
    votesDown: 0,
  })

  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      embeds: [embed],
      components: proposalVoteButtons(proposal.id),
    },
  }
}

/**
 * /tasks command - List available tasks
 */
export async function handleTasks(
  interaction: DiscordInteraction
): Promise<InteractionResponse> {
  const options = interaction.data?.options
  const category = getOption(options, 'category')
  const status = getOption(options, 'status')

  // Build query
  let query = getSupabase().from('tasks').select('*').order('created_at', { ascending: false })

  if (category && category !== 'all') {
    query = query.eq('category', category)
  }

  if (status === 'available') {
    query = query.eq('status', 'available')
  } else if (status === 'in_progress') {
    query = query.eq('status', 'in_progress')
  } else if (status === 'urgent') {
    query = query.eq('is_urgent', true)
  } else if (status === 'featured') {
    query = query.eq('is_featured', true)
  } else {
    // Default: show available tasks
    query = query.eq('status', 'available')
  }

  const { data: tasks, error } = await query.limit(5)

  if (error || !tasks) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        embeds: [errorEmbed('Error', 'No se pudieron cargar las tareas')],
        flags: MessageFlags.EPHEMERAL,
      },
    }
  }

  if (tasks.length === 0) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        embeds: [
          {
            title: '📋 Tareas',
            description: '_No hay tareas disponibles con los filtros seleccionados_',
            color: 0x3498db,
          },
        ],
        flags: MessageFlags.EPHEMERAL,
      },
    }
  }

  // Get total count for pagination
  const { count } = await getSupabase()
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'available')

  const totalPages = Math.ceil((count || 0) / 5)
  const filterLabel = category || status || 'available'

  const embed = taskListEmbed(tasks, 1, totalPages, filterLabel)

  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      embeds: [embed],
      components: totalPages > 1 ? paginationButtons('tasks', 1, totalPages, filterLabel) : [],
    },
  }
}

/**
 * /claim command - Claim a task
 */
export async function handleClaim(
  interaction: DiscordInteraction
): Promise<InteractionResponse> {
  const taskId = getOption(interaction.data?.options, 'task_id')

  if (!taskId) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        embeds: [errorEmbed('Error', 'ID de tarea requerido')],
        flags: MessageFlags.EPHEMERAL,
      },
    }
  }

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

  const claimer = getUserDisplayName(interaction)

  // Announce claim in #task-dao channel (fire-and-forget)
  announceTaskClaimed(task, claimer).catch((err) =>
    console.error('[Discord] Failed to announce claim:', err)
  )

  const embed = taskClaimedEmbed(task, claimer)

  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      embeds: [embed],
    },
  }
}

/**
 * /vote command - Vote on a proposal
 */
export async function handleVote(
  interaction: DiscordInteraction
): Promise<InteractionResponse> {
  const options = interaction.data?.options
  const proposalId = getOption(options, 'proposal_id')
  const vote = getOption(options, 'vote') as 'up' | 'down'
  const comment = getOption(options, 'comment')

  if (!proposalId || !vote) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        embeds: [errorEmbed('Error', 'ID de propuesta y voto requeridos')],
        flags: MessageFlags.EPHEMERAL,
      },
    }
  }

  const user = interaction.member?.user || interaction.user
  const discordId = user?.id

  const result = await proposalService.castVote(proposalId, vote, { discordId }, comment)

  if (!result.success) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        embeds: [errorEmbed('Error', result.error || 'No se pudo registrar el voto')],
        flags: MessageFlags.EPHEMERAL,
      },
    }
  }

  const votes = await proposalService.getVoteCounts(proposalId)
  const voteEmoji = vote === 'up' ? '✅' : '❌'

  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      embeds: [
        successEmbed(
          'Voto Registrado',
          `${voteEmoji} Tu voto ha sido registrado.\n\n📊 **Votos actuales:** ✅ ${votes.up} | ❌ ${votes.down}`
        ),
      ],
      flags: MessageFlags.EPHEMERAL,
    },
  }
}

/**
 * /approve command - Approve a proposal (moderator)
 */
export async function handleApprove(
  interaction: DiscordInteraction
): Promise<InteractionResponse> {
  // Check if user has moderator permissions
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

  const options = interaction.data?.options
  const proposalId = getOption(options, 'proposal_id')
  const reward = getOption<number>(options, 'reward')
  const complexity = getOption<number>(options, 'complexity')

  if (!proposalId) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        embeds: [errorEmbed('Error', 'ID de propuesta requerido')],
        flags: MessageFlags.EPHEMERAL,
      },
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
  const taskReward = reward || proposal.suggested_reward || 100
  const taskComplexity = complexity || proposal.suggested_complexity || 3

  const { data: newTask, error: taskError } = await getSupabase()
    .from('tasks')
    .insert({
      title: proposal.ai_refined_title || proposal.title,
      description: proposal.ai_refined_description || proposal.description,
      category: proposal.suggested_category || 'general',
      reward_cgc: taskReward,
      complexity: taskComplexity,
      estimated_days: Math.ceil(taskComplexity / 2),
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

  // Sync to Discord: announce approval and publish task
  const approver = getUserDisplayName(interaction)

  // Announce approval in announcements channel (fire-and-forget)
  announceProposalApproved(proposal, approver).catch((err) =>
    console.error('[Discord] Failed to announce approval:', err)
  )

  // Publish new task to #task-dao channel (fire-and-forget)
  syncTaskToDiscord(newTask).catch((err) =>
    console.error('[Discord] Failed to sync task:', err)
  )

  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      embeds: [
        successEmbed(
          'Propuesta Aprobada',
          `✅ **${proposal.title}** ha sido aprobada y convertida en tarea.\n\n🎯 **ID de Tarea:** \`${newTask.task_id}\`\n💰 **Recompensa:** ${taskReward} CGC\n⭐ **Complejidad:** ${taskComplexity}/10`
        ),
      ],
      components: taskActionButtons(newTask.task_id),
    },
  }
}

/**
 * /reject command - Reject a proposal (moderator)
 */
export async function handleReject(
  interaction: DiscordInteraction
): Promise<InteractionResponse> {
  // Check if user has moderator permissions
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

  const options = interaction.data?.options
  const proposalId = getOption(options, 'proposal_id')
  const reason = getOption(options, 'reason')

  if (!proposalId || !reason) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        embeds: [errorEmbed('Error', 'ID de propuesta y razón requeridos')],
        flags: MessageFlags.EPHEMERAL,
      },
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

  // Announce rejection in proposals channel (fire-and-forget)
  const rejector = getUserDisplayName(interaction)
  announceProposalRejected(proposal, rejector, reason).catch((err) =>
    console.error('[Discord] Failed to announce rejection:', err)
  )

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
 * /my-tasks command - List user's assigned tasks
 */
export async function handleMyTasks(
  interaction: DiscordInteraction
): Promise<InteractionResponse> {
  const user = interaction.member?.user || interaction.user
  const discordId = user?.id

  const wallet = await proposalService.getLinkedWallet(discordId || '')

  if (!wallet) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        embeds: [
          errorEmbed(
            'Wallet No Vinculada',
            'Vincula tu wallet con `/link-wallet` para ver tus tareas'
          ),
        ],
        flags: MessageFlags.EPHEMERAL,
      },
    }
  }

  const { data: tasks } = await getSupabase()
    .from('tasks')
    .select('*')
    .eq('assignee', wallet)
    .in('status', ['in_progress', 'submitted', 'completed'])
    .order('claimed_at', { ascending: false })
    .limit(10)

  if (!tasks || tasks.length === 0) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        embeds: [
          {
            title: '📋 Mis Tareas',
            description: '_No tienes tareas asignadas_\n\nUsa `/tasks` para ver tareas disponibles.',
            color: 0x3498db,
          },
        ],
        flags: MessageFlags.EPHEMERAL,
      },
    }
  }

  const taskLines = tasks.map((task: { status: string; title: string; reward_cgc: number; task_id: string }) => {
    const statusIcon =
      task.status === 'in_progress'
        ? '🟡'
        : task.status === 'submitted'
          ? '📤'
          : '✅'
    return `${statusIcon} **${task.title}**\n   💰 ${task.reward_cgc} CGC | ID: \`${task.task_id}\``
  })

  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      embeds: [
        {
          title: '📋 Mis Tareas',
          description: taskLines.join('\n\n'),
          color: 0x3498db,
        },
      ],
      flags: MessageFlags.EPHEMERAL,
    },
  }
}

/**
 * /my-proposals command - List user's proposals
 */
export async function handleMyProposals(
  interaction: DiscordInteraction
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

  const proposals = await proposalService.getProposalsByDiscordUser(discordId)

  if (proposals.length === 0) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        embeds: [
          {
            title: '📝 Mis Propuestas',
            description: '_No tienes propuestas_\n\nUsa `/propose` para crear una.',
            color: 0x3498db,
          },
        ],
        flags: MessageFlags.EPHEMERAL,
      },
    }
  }

  const proposalLines = proposals.slice(0, 10).map((p) => {
    const statusIcon =
      p.status === 'pending'
        ? '⏳'
        : p.status === 'voting'
          ? '🗳️'
          : p.status === 'approved'
            ? '✅'
            : p.status === 'rejected'
              ? '❌'
              : '🎯'
    return `${statusIcon} **${p.title}**\n   📊 ✅ ${p.votes_up} | ❌ ${p.votes_down} | ID: \`${p.id.slice(0, 8)}\``
  })

  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      embeds: [
        {
          title: '📝 Mis Propuestas',
          description: proposalLines.join('\n\n'),
          color: 0x3498db,
        },
      ],
      flags: MessageFlags.EPHEMERAL,
    },
  }
}

/**
 * /link-wallet command - Link wallet to Discord
 */
export async function handleLinkWallet(
  interaction: DiscordInteraction
): Promise<InteractionResponse> {
  const wallet = getOption(interaction.data?.options, 'wallet')

  if (!wallet) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        embeds: [errorEmbed('Error', 'Dirección de wallet requerida')],
        flags: MessageFlags.EPHEMERAL,
      },
    }
  }

  // Validate wallet format
  if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        embeds: [errorEmbed('Error', 'Formato de wallet inválido. Debe ser 0x... (42 caracteres)')],
        flags: MessageFlags.EPHEMERAL,
      },
    }
  }

  const user = interaction.member?.user || interaction.user
  const discordId = user?.id
  const discordUsername = user?.global_name || user?.username

  if (!discordId) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        embeds: [errorEmbed('Error', 'No se pudo identificar tu usuario')],
        flags: MessageFlags.EPHEMERAL,
      },
    }
  }

  const result = await proposalService.linkDiscordWallet(discordId, discordUsername || '', wallet)

  if (!result.success) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        embeds: [errorEmbed('Error', result.error || 'No se pudo vincular la wallet')],
        flags: MessageFlags.EPHEMERAL,
      },
    }
  }

  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      embeds: [
        successEmbed(
          'Wallet Vinculada',
          `🔗 Tu wallet ha sido vinculada correctamente.\n\n**Wallet:** \`${wallet.slice(0, 6)}...${wallet.slice(-4)}\`\n\nAhora puedes reclamar tareas y recibir recompensas.`
        ),
      ],
      flags: MessageFlags.EPHEMERAL,
    },
  }
}

/**
 * /leaderboard command - Show top contributors
 */
export async function handleLeaderboard(
  interaction: DiscordInteraction
): Promise<InteractionResponse> {
  const period = (getOption(interaction.data?.options, 'period') as 'week' | 'month' | 'all') || 'all'

  const users = await proposalService.getLeaderboard(period, 10)

  if (users.length === 0) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        embeds: [
          {
            title: '🏆 Leaderboard',
            description: '_No hay datos disponibles para este período_',
            color: 0x9b59b6,
          },
        ],
      },
    }
  }

  const embed = leaderboardEmbed(
    users.map((u, i) => ({
      position: i + 1,
      username: u.username,
      wallet: u.wallet,
      tasksCompleted: u.tasksCompleted,
      cgcEarned: u.cgcEarned,
    })),
    period
  )

  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      embeds: [embed],
    },
  }
}

/**
 * /help command - Show help information
 */
export async function handleHelp(
  interaction: DiscordInteraction
): Promise<InteractionResponse> {
  const command = getOption(interaction.data?.options, 'command')

  const embed = helpEmbed(command)

  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      embeds: [embed],
      components: helpButtons(),
    },
  }
}

/**
 * /stats command - Show DAO statistics
 */
export async function handleStats(
  interaction: DiscordInteraction
): Promise<InteractionResponse> {
  // Get task stats
  const { data: tasks } = await getSupabase().from('tasks').select('status, reward_cgc')

  type TaskRow = { status: string; reward_cgc: number | null }
  const taskStats = {
    total: tasks?.length || 0,
    available: tasks?.filter((t: TaskRow) => t.status === 'available').length || 0,
    completed: tasks?.filter((t: TaskRow) => t.status === 'completed').length || 0,
    totalRewards: tasks?.filter((t: TaskRow) => t.status === 'completed').reduce((sum: number, t: TaskRow) => sum + (t.reward_cgc || 0), 0) || 0,
  }

  // Get collaborator count (unique assignees)
  const { data: assignees } = await getSupabase()
    .from('tasks')
    .select('assignee')
    .not('assignee', 'is', null)

  const uniqueCollaborators = new Set(assignees?.map((a: { assignee: string }) => a.assignee)).size

  // Get proposal stats
  const proposalStats = await proposalService.getProposalStats()

  const embed = statsEmbed({
    totalTasks: taskStats.total,
    availableTasks: taskStats.available,
    completedTasks: taskStats.completed,
    totalRewards: taskStats.totalRewards,
    collaborators: uniqueCollaborators,
    proposalsPending: proposalStats.pendingProposals,
  })

  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      embeds: [embed],
    },
  }
}
