/**
 * Discord Embed Templates
 *
 * Pre-built embeds for common bot responses
 */

import { EmbedColors, type DiscordEmbed, type Proposal } from '../types'
import type { Task } from '@/lib/supabase/types'

const CGC_ICON_URL = 'https://cryptogift.mbxarts.com/cgc-icon.png'
const WEBSITE_URL = 'https://cryptogift.mbxarts.com'

/**
 * Format wallet address for display
 */
function formatAddress(address: string | null): string {
  if (!address) return 'Unknown'
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

/**
 * Get complexity bar visualization
 */
function getComplexityBar(complexity: number): string {
  const filled = Math.min(complexity, 10)
  const empty = 10 - filled
  return '█'.repeat(filled) + '░'.repeat(empty) + ` (${complexity}/10)`
}

// ============================================================================
// PROPOSAL EMBEDS
// ============================================================================

/**
 * Embed for a new proposal
 */
export function proposalEmbed(proposal: {
  id: string
  title: string
  description: string
  proposer: string
  suggestedCategory?: string
  suggestedReward?: number
  votesUp?: number
  votesDown?: number
}): DiscordEmbed {
  return {
    title: '📝 Nueva Propuesta de Tarea',
    description: `**${proposal.title}**\n\n${proposal.description || '_Sin descripción_'}`,
    color: EmbedColors.CGC_BRAND,
    fields: [
      {
        name: '👤 Propuesto por',
        value: proposal.proposer,
        inline: true,
      },
      {
        name: '📁 Categoría',
        value: proposal.suggestedCategory || 'Por definir',
        inline: true,
      },
      {
        name: '💰 Recompensa sugerida',
        value: proposal.suggestedReward ? `${proposal.suggestedReward} CGC` : 'Pendiente',
        inline: true,
      },
      {
        name: '📊 Votos',
        value: `✅ ${proposal.votesUp || 0} | ❌ ${proposal.votesDown || 0}`,
        inline: true,
      },
      {
        name: '🔗 ID',
        value: `\`${proposal.id.slice(0, 8)}\``,
        inline: true,
      },
    ],
    footer: {
      text: 'CryptoGift Wallets DAO • Usa los botones para votar',
      icon_url: CGC_ICON_URL,
    },
    timestamp: new Date().toISOString(),
  }
}

/**
 * Embed for proposal approved
 */
export function proposalApprovedEmbed(proposal: Proposal, approver: string): DiscordEmbed {
  return {
    title: '✅ Propuesta Aprobada',
    description: `**${proposal.title}** ha sido aprobada y se convertirá en una tarea.`,
    color: EmbedColors.SUCCESS,
    fields: [
      {
        name: '📋 Título',
        value: proposal.ai_refined_title || proposal.title,
        inline: false,
      },
      {
        name: '💰 Recompensa',
        value: `${proposal.suggested_reward || 100} CGC`,
        inline: true,
      },
      {
        name: '⭐ Complejidad',
        value: `${proposal.suggested_complexity || 3}/10`,
        inline: true,
      },
      {
        name: '👤 Aprobada por',
        value: approver,
        inline: true,
      },
      {
        name: '📊 Votos finales',
        value: `✅ ${proposal.votes_up} | ❌ ${proposal.votes_down}`,
        inline: true,
      },
    ],
    footer: {
      text: 'La tarea estará disponible pronto en /tasks',
      icon_url: CGC_ICON_URL,
    },
    timestamp: new Date().toISOString(),
  }
}

/**
 * Embed for proposal rejected
 */
export function proposalRejectedEmbed(
  proposal: Proposal,
  rejector: string,
  reason: string
): DiscordEmbed {
  return {
    title: '❌ Propuesta Rechazada',
    description: `**${proposal.title}** ha sido rechazada.`,
    color: EmbedColors.ERROR,
    fields: [
      {
        name: '📝 Razón',
        value: reason || 'No especificada',
        inline: false,
      },
      {
        name: '👤 Rechazada por',
        value: rejector,
        inline: true,
      },
      {
        name: '📊 Votos finales',
        value: `✅ ${proposal.votes_up} | ❌ ${proposal.votes_down}`,
        inline: true,
      },
    ],
    footer: {
      text: 'Puedes proponer una versión mejorada con /propose',
      icon_url: CGC_ICON_URL,
    },
    timestamp: new Date().toISOString(),
  }
}

// ============================================================================
// TASK EMBEDS
// ============================================================================

/**
 * Embed for a single task
 */
export function taskEmbed(task: Task): DiscordEmbed {
  const badges: string[] = []
  if (task.is_urgent) badges.push('🔥 URGENTE')
  if (task.is_featured) badges.push('⭐ DESTACADA')

  return {
    title: badges.length > 0 ? `${badges.join(' ')} ${task.title}` : task.title,
    description: task.description || '_Sin descripción_',
    color: task.is_urgent ? EmbedColors.ERROR : task.is_featured ? EmbedColors.PURPLE : EmbedColors.INFO,
    fields: [
      {
        name: '💰 Recompensa',
        value: `**${task.reward_cgc.toLocaleString()} CGC**`,
        inline: true,
      },
      {
        name: '⭐ Complejidad',
        value: getComplexityBar(task.complexity),
        inline: true,
      },
      {
        name: '⏱️ Tiempo estimado',
        value: `${task.estimated_days} día${task.estimated_days > 1 ? 's' : ''}`,
        inline: true,
      },
      {
        name: '📁 Categoría',
        value: task.category || 'General',
        inline: true,
      },
      {
        name: '🔗 ID',
        value: `\`${task.task_id}\``,
        inline: true,
      },
      {
        name: '📊 Estado',
        value: task.status === 'available' ? '🟢 Disponible' :
               task.status === 'in_progress' ? '🟡 En progreso' :
               task.status === 'completed' ? '✅ Completada' : task.status,
        inline: true,
      },
    ],
    footer: {
      text: `CryptoGift DAO • ${WEBSITE_URL}/tasks`,
      icon_url: CGC_ICON_URL,
    },
    timestamp: new Date().toISOString(),
  }
}

/**
 * Embed for task list
 */
export function taskListEmbed(
  tasks: Task[],
  page: number,
  totalPages: number,
  filter?: string
): DiscordEmbed {
  const taskLines = tasks.map((task, i) => {
    const badge = task.is_urgent ? '🔥' : task.is_featured ? '⭐' : '•'
    return `${badge} **${task.title}**\n   💰 ${task.reward_cgc} CGC | ⭐ Nivel ${task.complexity} | ⏱️ ${task.estimated_days}d\n   ID: \`${task.task_id}\``
  })

  return {
    title: `📋 Tareas ${filter ? `(${filter})` : 'Disponibles'} (${tasks.length})`,
    description: taskLines.join('\n\n') || '_No hay tareas disponibles_',
    color: EmbedColors.INFO,
    footer: {
      text: `Página ${page}/${totalPages} • Usa /claim [ID] para reclamar`,
      icon_url: CGC_ICON_URL,
    },
    timestamp: new Date().toISOString(),
  }
}

/**
 * Embed for task claimed
 */
export function taskClaimedEmbed(task: Task, claimer: string): DiscordEmbed {
  const deadline = new Date()
  deadline.setDate(deadline.getDate() + task.estimated_days)

  return {
    title: '🎯 ¡Tarea Reclamada!',
    description: `**${task.title}**`,
    color: EmbedColors.SUCCESS,
    fields: [
      {
        name: '👤 Reclamada por',
        value: claimer,
        inline: true,
      },
      {
        name: '💰 Recompensa',
        value: `${task.reward_cgc.toLocaleString()} CGC`,
        inline: true,
      },
      {
        name: '⏱️ Fecha límite',
        value: deadline.toLocaleDateString('es-ES', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        }),
        inline: true,
      },
    ],
    footer: {
      text: 'Completa la tarea y sube evidencia en la web',
      icon_url: CGC_ICON_URL,
    },
    timestamp: new Date().toISOString(),
  }
}

/**
 * Embed for task completed
 */
export function taskCompletedEmbed(task: Task, completer: string, txHash?: string): DiscordEmbed {
  const fields = [
    {
      name: '🏆 Completada por',
      value: completer,
      inline: true,
    },
    {
      name: '💰 Recompensa pagada',
      value: `**${task.reward_cgc.toLocaleString()} CGC**`,
      inline: true,
    },
  ]

  if (txHash) {
    fields.push({
      name: '🔗 Transacción',
      value: `[Ver en BaseScan](https://basescan.org/tx/${txHash})`,
      inline: true,
    })
  }

  return {
    title: '✅ ¡Tarea Completada!',
    description: `**${task.title}**\n\n¡Felicitaciones al colaborador! 🎉`,
    color: EmbedColors.SUCCESS,
    fields,
    footer: {
      text: '¡Gracias por contribuir a CryptoGift DAO!',
      icon_url: CGC_ICON_URL,
    },
    timestamp: new Date().toISOString(),
  }
}

// ============================================================================
// UTILITY EMBEDS
// ============================================================================

/**
 * Help embed
 */
export function helpEmbed(specificCommand?: string): DiscordEmbed {
  if (specificCommand) {
    const commandHelp: Record<string, { title: string; description: string; usage: string }> = {
      propose: {
        title: '/propose',
        description: 'Proponer una nueva tarea para que la comunidad vote y los moderadores aprueben.',
        usage: '/propose title:"Mi tarea" description:"Descripción detallada" category:desarrollo reward:500',
      },
      tasks: {
        title: '/tasks',
        description: 'Ver las tareas disponibles con filtros opcionales.',
        usage: '/tasks category:desarrollo status:available',
      },
      claim: {
        title: '/claim',
        description: 'Reclamar una tarea disponible para trabajar en ella.',
        usage: '/claim task_id:CGC-001',
      },
      vote: {
        title: '/vote',
        description: 'Votar a favor o en contra de una propuesta.',
        usage: '/vote proposal_id:abc123 vote:up comment:"Buena idea"',
      },
      'link-wallet': {
        title: '/link-wallet',
        description: 'Vincular tu wallet de Ethereum/Base a tu cuenta de Discord.',
        usage: '/link-wallet wallet:0x1234...abcd',
      },
    }

    const help = commandHelp[specificCommand]
    if (help) {
      return {
        title: `📖 Ayuda: ${help.title}`,
        description: help.description,
        color: EmbedColors.INFO,
        fields: [
          {
            name: '📝 Uso',
            value: `\`${help.usage}\``,
            inline: false,
          },
        ],
        footer: {
          text: 'CryptoGift Wallets DAO',
          icon_url: CGC_ICON_URL,
        },
      }
    }
  }

  return {
    title: '🤖 CryptoGift DAO Bot - Ayuda',
    description: 'Bot para gestionar tareas y propuestas de la comunidad.',
    color: EmbedColors.CGC_BRAND,
    fields: [
      {
        name: '📝 Propuestas',
        value: '`/propose` - Proponer nueva tarea\n`/vote` - Votar en propuestas\n`/my-proposals` - Ver tus propuestas',
        inline: false,
      },
      {
        name: '📋 Tareas',
        value: '`/tasks` - Ver tareas disponibles\n`/claim` - Reclamar tarea\n`/my-tasks` - Ver tus tareas',
        inline: false,
      },
      {
        name: '👤 Cuenta',
        value: '`/link-wallet` - Vincular wallet\n`/leaderboard` - Ver ranking\n`/stats` - Estadísticas del DAO',
        inline: false,
      },
      {
        name: '🔗 Enlaces',
        value: `[Website](${WEBSITE_URL}) • [Tareas](${WEBSITE_URL}/tasks) • [Discord](https://discord.gg/XzmKkrvhHc)`,
        inline: false,
      },
    ],
    footer: {
      text: 'Usa /help [comando] para más detalles',
      icon_url: CGC_ICON_URL,
    },
  }
}

/**
 * Stats embed
 */
export function statsEmbed(stats: {
  totalTasks: number
  availableTasks: number
  completedTasks: number
  totalRewards: number
  collaborators: number
  proposalsPending: number
}): DiscordEmbed {
  return {
    title: '📊 Estadísticas del DAO',
    color: EmbedColors.CGC_BRAND,
    fields: [
      {
        name: '📋 Tareas Totales',
        value: stats.totalTasks.toString(),
        inline: true,
      },
      {
        name: '🟢 Disponibles',
        value: stats.availableTasks.toString(),
        inline: true,
      },
      {
        name: '✅ Completadas',
        value: stats.completedTasks.toString(),
        inline: true,
      },
      {
        name: '💰 CGC Distribuidos',
        value: stats.totalRewards.toLocaleString(),
        inline: true,
      },
      {
        name: '👥 Colaboradores',
        value: stats.collaborators.toString(),
        inline: true,
      },
      {
        name: '📝 Propuestas Pendientes',
        value: stats.proposalsPending.toString(),
        inline: true,
      },
    ],
    footer: {
      text: 'CryptoGift Wallets DAO',
      icon_url: CGC_ICON_URL,
    },
    timestamp: new Date().toISOString(),
  }
}

/**
 * Error embed
 */
export function errorEmbed(title: string, message: string): DiscordEmbed {
  return {
    title: `❌ ${title}`,
    description: message,
    color: EmbedColors.ERROR,
    footer: {
      text: 'Si el problema persiste, contacta a un moderador',
      icon_url: CGC_ICON_URL,
    },
  }
}

/**
 * Success embed
 */
export function successEmbed(title: string, message: string): DiscordEmbed {
  return {
    title: `✅ ${title}`,
    description: message,
    color: EmbedColors.SUCCESS,
    footer: {
      text: 'CryptoGift Wallets DAO',
      icon_url: CGC_ICON_URL,
    },
  }
}

/**
 * Leaderboard embed
 */
export function leaderboardEmbed(
  users: Array<{
    position: number
    username: string
    wallet?: string
    tasksCompleted: number
    cgcEarned: number
  }>,
  period: string
): DiscordEmbed {
  const medals = ['🥇', '🥈', '🥉']

  const lines = users.map((user, i) => {
    const medal = i < 3 ? medals[i] : `${user.position}.`
    const wallet = user.wallet ? ` (${formatAddress(user.wallet)})` : ''
    return `${medal} **${user.username}**${wallet}\n   📋 ${user.tasksCompleted} tareas | 💰 ${user.cgcEarned.toLocaleString()} CGC`
  })

  const periodLabels: Record<string, string> = {
    week: 'Esta Semana',
    month: 'Este Mes',
    all: 'Todo el Tiempo',
  }

  return {
    title: `🏆 Leaderboard - ${periodLabels[period] || period}`,
    description: lines.join('\n\n') || '_No hay datos disponibles_',
    color: EmbedColors.PURPLE,
    footer: {
      text: 'Completa tareas para subir en el ranking',
      icon_url: CGC_ICON_URL,
    },
    timestamp: new Date().toISOString(),
  }
}
