/**
 * Discord Task Notifications Service
 *
 * Sends automated notifications to Discord when task events occur.
 * Uses Discord webhooks for real-time updates.
 *
 * @author CryptoGift Wallets DAO
 * @version 1.0.0
 */

import { TASK_DOMAINS, TASK_TYPES, type TaskDomain, type TaskType } from '@/lib/tasks/task-constants'

// Webhook URL from environment
const DISCORD_WEBHOOK_URL = process.env.DISCORD_TASK_WEBHOOK_URL

// Discord embed colors
const COLORS = {
  new_task: 0x3b82f6,      // Blue - New task available
  claimed: 0xf59e0b,       // Amber - Task claimed
  completed: 0x22c55e,     // Green - Task completed
  urgent: 0xef4444,        // Red - Urgent task
  featured: 0xa855f7,      // Purple - Featured task
}

interface TaskData {
  task_id: string
  title: string
  description?: string | null
  reward_cgc: number
  complexity: number
  estimated_days: number
  domain?: TaskDomain | null
  category?: string | null
  task_type?: TaskType | null
  is_featured?: boolean
  is_urgent?: boolean
  assignee?: string | null
}

interface DiscordEmbed {
  title: string
  description?: string
  color: number
  fields: Array<{ name: string; value: string; inline?: boolean }>
  footer?: { text: string; icon_url?: string }
  timestamp?: string
  thumbnail?: { url: string }
}

interface DiscordWebhookPayload {
  content?: string
  embeds: DiscordEmbed[]
  username?: string
  avatar_url?: string
}

/**
 * Send a Discord webhook notification
 */
async function sendDiscordNotification(payload: DiscordWebhookPayload): Promise<boolean> {
  if (!DISCORD_WEBHOOK_URL) {
    console.warn('[Discord] Webhook URL not configured')
    return false
  }

  try {
    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...payload,
        username: payload.username || 'CGC Task Bot',
        avatar_url: payload.avatar_url || 'https://cryptogift.mbxarts.com/cgc-icon.png',
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Discord] Webhook failed:', response.status, errorText)
      return false
    }

    console.log('[Discord] Notification sent successfully')
    return true
  } catch (error) {
    console.error('[Discord] Error sending notification:', error)
    return false
  }
}

/**
 * Get domain emoji and label
 */
function getDomainInfo(domain: TaskDomain | null | undefined): { emoji: string; label: string } {
  if (!domain || !TASK_DOMAINS[domain]) {
    return { emoji: '🎯', label: 'General' }
  }
  return { emoji: TASK_DOMAINS[domain].emoji, label: TASK_DOMAINS[domain].label }
}

/**
 * Get task type emoji and label
 */
function getTypeInfo(taskType: TaskType | null | undefined): { emoji: string; label: string } {
  if (!taskType || !TASK_TYPES[taskType]) {
    return { emoji: '📋', label: 'Task' }
  }
  return { emoji: TASK_TYPES[taskType].emoji, label: TASK_TYPES[taskType].label }
}

/**
 * Format wallet address for display
 */
function formatAddress(address: string | null | undefined): string {
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

/**
 * Notify when a new task is created
 */
export async function notifyNewTask(task: TaskData): Promise<boolean> {
  const domainInfo = getDomainInfo(task.domain)
  const typeInfo = getTypeInfo(task.task_type)

  // Determine color based on urgency/featured status
  let color = COLORS.new_task
  let badge = ''
  if (task.is_urgent) {
    color = COLORS.urgent
    badge = '🔥 **URGENT** '
  } else if (task.is_featured) {
    color = COLORS.featured
    badge = '⭐ **FEATURED** '
  }

  const embed: DiscordEmbed = {
    title: `${badge}📌 New Task Available!`,
    description: `**${task.title}**\n\n${task.description || '_No description provided_'}`,
    color,
    fields: [
      {
        name: `${domainInfo.emoji} Domain`,
        value: domainInfo.label,
        inline: true,
      },
      {
        name: `${typeInfo.emoji} Type`,
        value: typeInfo.label,
        inline: true,
      },
      {
        name: '💰 Reward',
        value: `**${task.reward_cgc.toLocaleString()} CGC**`,
        inline: true,
      },
      {
        name: '📊 Complexity',
        value: getComplexityBar(task.complexity),
        inline: true,
      },
      {
        name: '⏱️ Estimated Time',
        value: `${task.estimated_days} day${task.estimated_days > 1 ? 's' : ''}`,
        inline: true,
      },
      {
        name: '🔗 Task ID',
        value: `\`${task.task_id}\``,
        inline: true,
      },
    ],
    footer: {
      text: 'CryptoGift Wallets DAO • Claim this task at cryptogift.mbxarts.com/tasks',
    },
    timestamp: new Date().toISOString(),
  }

  return sendDiscordNotification({
    content: task.is_urgent
      ? '🚨 @here A new **URGENT** task needs attention!'
      : undefined,
    embeds: [embed],
  })
}

/**
 * Notify when a task is claimed
 */
export async function notifyTaskClaimed(task: TaskData, claimedBy: string): Promise<boolean> {
  const domainInfo = getDomainInfo(task.domain)

  const embed: DiscordEmbed = {
    title: '🎯 Task Claimed!',
    description: `**${task.title}**`,
    color: COLORS.claimed,
    fields: [
      {
        name: '👤 Claimed By',
        value: `\`${formatAddress(claimedBy)}\``,
        inline: true,
      },
      {
        name: `${domainInfo.emoji} Domain`,
        value: domainInfo.label,
        inline: true,
      },
      {
        name: '💰 Reward',
        value: `${task.reward_cgc.toLocaleString()} CGC`,
        inline: true,
      },
      {
        name: '⏱️ Deadline',
        value: `${task.estimated_days} day${task.estimated_days > 1 ? 's' : ''}`,
        inline: true,
      },
    ],
    footer: {
      text: 'Good luck! Submit your work when ready.',
    },
    timestamp: new Date().toISOString(),
  }

  return sendDiscordNotification({ embeds: [embed] })
}

/**
 * Notify when a task is completed
 */
export async function notifyTaskCompleted(
  task: TaskData,
  completedBy: string,
  txHash?: string
): Promise<boolean> {
  const domainInfo = getDomainInfo(task.domain)

  const fields = [
    {
      name: '🏆 Completed By',
      value: `\`${formatAddress(completedBy)}\``,
      inline: true,
    },
    {
      name: `${domainInfo.emoji} Domain`,
      value: domainInfo.label,
      inline: true,
    },
    {
      name: '💰 Reward Paid',
      value: `**${task.reward_cgc.toLocaleString()} CGC**`,
      inline: true,
    },
  ]

  // Add transaction link if available
  if (txHash) {
    fields.push({
      name: '🔗 Transaction',
      value: `[View on BaseScan](https://basescan.org/tx/${txHash})`,
      inline: true,
    })
  }

  const embed: DiscordEmbed = {
    title: '✅ Task Completed!',
    description: `**${task.title}**\n\nCongratulations to the contributor! 🎉`,
    color: COLORS.completed,
    fields,
    footer: {
      text: 'Thank you for contributing to CryptoGift DAO!',
    },
    timestamp: new Date().toISOString(),
  }

  return sendDiscordNotification({ embeds: [embed] })
}

/**
 * Notify when task submission is pending review
 */
export async function notifyTaskSubmitted(task: TaskData, submittedBy: string): Promise<boolean> {
  const embed: DiscordEmbed = {
    title: '📝 Task Submitted for Review',
    description: `**${task.title}**\n\nA contributor has submitted their work for validation.`,
    color: 0x6366f1, // Indigo
    fields: [
      {
        name: '👤 Submitted By',
        value: `\`${formatAddress(submittedBy)}\``,
        inline: true,
      },
      {
        name: '💰 Pending Reward',
        value: `${task.reward_cgc.toLocaleString()} CGC`,
        inline: true,
      },
      {
        name: '🔗 Task ID',
        value: `\`${task.task_id}\``,
        inline: true,
      },
    ],
    footer: {
      text: 'Awaiting admin validation',
    },
    timestamp: new Date().toISOString(),
  }

  return sendDiscordNotification({ embeds: [embed] })
}

/**
 * Send a batch notification for multiple new tasks
 */
export async function notifyBatchNewTasks(tasks: TaskData[]): Promise<boolean> {
  if (tasks.length === 0) return true
  if (tasks.length === 1) return notifyNewTask(tasks[0])

  const totalRewards = tasks.reduce((sum, t) => sum + t.reward_cgc, 0)
  const urgentCount = tasks.filter((t) => t.is_urgent).length
  const featuredCount = tasks.filter((t) => t.is_featured).length

  const taskList = tasks
    .slice(0, 10) // Max 10 tasks in list
    .map((t) => {
      const badge = t.is_urgent ? '🔥' : t.is_featured ? '⭐' : '•'
      return `${badge} **${t.title}** - ${t.reward_cgc.toLocaleString()} CGC`
    })
    .join('\n')

  const embed: DiscordEmbed = {
    title: `📋 ${tasks.length} New Tasks Available!`,
    description: taskList + (tasks.length > 10 ? `\n_...and ${tasks.length - 10} more_` : ''),
    color: urgentCount > 0 ? COLORS.urgent : COLORS.new_task,
    fields: [
      {
        name: '💰 Total Rewards',
        value: `**${totalRewards.toLocaleString()} CGC**`,
        inline: true,
      },
      {
        name: '🔥 Urgent',
        value: urgentCount.toString(),
        inline: true,
      },
      {
        name: '⭐ Featured',
        value: featuredCount.toString(),
        inline: true,
      },
    ],
    footer: {
      text: 'View all tasks at cryptogift.mbxarts.com/tasks',
    },
    timestamp: new Date().toISOString(),
  }

  return sendDiscordNotification({
    content: urgentCount > 0 ? '🚨 @here New tasks including URGENT ones!' : undefined,
    embeds: [embed],
  })
}

export default {
  notifyNewTask,
  notifyTaskClaimed,
  notifyTaskCompleted,
  notifyTaskSubmitted,
  notifyBatchNewTasks,
}
