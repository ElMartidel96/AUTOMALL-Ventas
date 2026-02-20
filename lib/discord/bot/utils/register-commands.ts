/**
 * Discord Slash Commands Registration
 *
 * Registers slash commands with Discord API
 * Run once to set up commands, or after modifying command definitions
 */

import { ApplicationCommandOptionType, type SlashCommand } from '../types'

const DISCORD_API_BASE = 'https://discord.com/api/v10'

/**
 * All slash commands for the CryptoGift DAO Bot
 */
export const SLASH_COMMANDS: SlashCommand[] = [
  {
    name: 'propose',
    description: 'Proponer una nueva tarea para la comunidad / Propose a new community task',
    options: [
      {
        name: 'title',
        description: 'Título de la tarea / Task title',
        type: ApplicationCommandOptionType.STRING,
        required: true,
        max_length: 100,
      },
      {
        name: 'description',
        description: 'Descripción detallada / Detailed description',
        type: ApplicationCommandOptionType.STRING,
        required: true,
        max_length: 1000,
      },
      {
        name: 'category',
        description: 'Categoría sugerida / Suggested category',
        type: ApplicationCommandOptionType.STRING,
        required: false,
        choices: [
          { name: '💻 Desarrollo / Development', value: 'development' },
          { name: '🎨 Diseño / Design', value: 'design' },
          { name: '📝 Contenido / Content', value: 'content' },
          { name: '📢 Marketing', value: 'marketing' },
          { name: '🤝 Comunidad / Community', value: 'community' },
          { name: '🔬 Investigación / Research', value: 'research' },
        ],
      },
      {
        name: 'reward',
        description: 'Recompensa CGC sugerida / Suggested CGC reward',
        type: ApplicationCommandOptionType.INTEGER,
        required: false,
        min_value: 50,
        max_value: 10000,
      },
    ],
  },
  {
    name: 'tasks',
    description: 'Ver tareas disponibles / View available tasks',
    options: [
      {
        name: 'category',
        description: 'Filtrar por categoría / Filter by category',
        type: ApplicationCommandOptionType.STRING,
        required: false,
        choices: [
          { name: '📋 Todas / All', value: 'all' },
          { name: '💻 Desarrollo / Development', value: 'development' },
          { name: '🎨 Diseño / Design', value: 'design' },
          { name: '📝 Contenido / Content', value: 'content' },
          { name: '📢 Marketing', value: 'marketing' },
          { name: '🤝 Comunidad / Community', value: 'community' },
        ],
      },
      {
        name: 'status',
        description: 'Estado de las tareas / Task status',
        type: ApplicationCommandOptionType.STRING,
        required: false,
        choices: [
          { name: '🟢 Disponibles / Available', value: 'available' },
          { name: '🟡 En progreso / In progress', value: 'in_progress' },
          { name: '🔥 Urgentes / Urgent', value: 'urgent' },
          { name: '⭐ Destacadas / Featured', value: 'featured' },
        ],
      },
    ],
  },
  {
    name: 'claim',
    description: 'Reclamar una tarea / Claim a task',
    options: [
      {
        name: 'task_id',
        description: 'ID de la tarea (ej: CGC-001) / Task ID (e.g., CGC-001)',
        type: ApplicationCommandOptionType.STRING,
        required: true,
      },
    ],
  },
  {
    name: 'vote',
    description: 'Votar en una propuesta / Vote on a proposal',
    options: [
      {
        name: 'proposal_id',
        description: 'ID de la propuesta / Proposal ID',
        type: ApplicationCommandOptionType.STRING,
        required: true,
      },
      {
        name: 'vote',
        description: 'Tu voto / Your vote',
        type: ApplicationCommandOptionType.STRING,
        required: true,
        choices: [
          { name: '✅ A favor / In favor', value: 'up' },
          { name: '❌ En contra / Against', value: 'down' },
        ],
      },
      {
        name: 'comment',
        description: 'Comentario opcional / Optional comment',
        type: ApplicationCommandOptionType.STRING,
        required: false,
        max_length: 500,
      },
    ],
  },
  {
    name: 'approve',
    description: '[MOD] Aprobar una propuesta / Approve a proposal',
    options: [
      {
        name: 'proposal_id',
        description: 'ID de la propuesta / Proposal ID',
        type: ApplicationCommandOptionType.STRING,
        required: true,
      },
      {
        name: 'reward',
        description: 'Recompensa final CGC / Final CGC reward',
        type: ApplicationCommandOptionType.INTEGER,
        required: false,
        min_value: 50,
        max_value: 10000,
      },
      {
        name: 'complexity',
        description: 'Complejidad (1-10) / Complexity (1-10)',
        type: ApplicationCommandOptionType.INTEGER,
        required: false,
        min_value: 1,
        max_value: 10,
      },
    ],
    default_member_permissions: '8', // Administrator permission
  },
  {
    name: 'reject',
    description: '[MOD] Rechazar una propuesta / Reject a proposal',
    options: [
      {
        name: 'proposal_id',
        description: 'ID de la propuesta / Proposal ID',
        type: ApplicationCommandOptionType.STRING,
        required: true,
      },
      {
        name: 'reason',
        description: 'Razón del rechazo / Rejection reason',
        type: ApplicationCommandOptionType.STRING,
        required: true,
        max_length: 500,
      },
    ],
    default_member_permissions: '8', // Administrator permission
  },
  {
    name: 'my-tasks',
    description: 'Ver tus tareas asignadas / View your assigned tasks',
  },
  {
    name: 'my-proposals',
    description: 'Ver tus propuestas / View your proposals',
  },
  {
    name: 'link-wallet',
    description: 'Vincular tu wallet a Discord / Link your wallet to Discord',
    options: [
      {
        name: 'wallet',
        description: 'Tu dirección de wallet (0x...) / Your wallet address (0x...)',
        type: ApplicationCommandOptionType.STRING,
        required: true,
      },
    ],
  },
  {
    name: 'leaderboard',
    description: 'Ver el ranking de colaboradores / View collaborator leaderboard',
    options: [
      {
        name: 'period',
        description: 'Período de tiempo / Time period',
        type: ApplicationCommandOptionType.STRING,
        required: false,
        choices: [
          { name: '📅 Esta semana / This week', value: 'week' },
          { name: '📆 Este mes / This month', value: 'month' },
          { name: '📊 Todo el tiempo / All time', value: 'all' },
        ],
      },
    ],
  },
  {
    name: 'help',
    description: 'Ver ayuda del bot / View bot help',
    options: [
      {
        name: 'command',
        description: 'Comando específico / Specific command',
        type: ApplicationCommandOptionType.STRING,
        required: false,
        choices: [
          { name: '/propose', value: 'propose' },
          { name: '/tasks', value: 'tasks' },
          { name: '/claim', value: 'claim' },
          { name: '/vote', value: 'vote' },
          { name: '/link-wallet', value: 'link-wallet' },
        ],
      },
    ],
  },
  {
    name: 'stats',
    description: 'Ver estadísticas del DAO / View DAO statistics',
  },
]

/**
 * Register commands with Discord (global or guild-specific)
 */
export async function registerCommands(
  applicationId: string,
  botToken: string,
  guildId?: string
): Promise<void> {
  const endpoint = guildId
    ? `${DISCORD_API_BASE}/applications/${applicationId}/guilds/${guildId}/commands`
    : `${DISCORD_API_BASE}/applications/${applicationId}/commands`

  console.log(`[Discord] Registering ${SLASH_COMMANDS.length} commands...`)
  console.log(`[Discord] Endpoint: ${endpoint}`)

  const response = await fetch(endpoint, {
    method: 'PUT',
    headers: {
      'Authorization': `Bot ${botToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(SLASH_COMMANDS),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to register commands: ${response.status} - ${error}`)
  }

  const data = await response.json()
  console.log(`[Discord] Successfully registered ${data.length} commands`)

  // Log each command
  for (const cmd of data) {
    console.log(`  ✅ /${cmd.name} (ID: ${cmd.id})`)
  }
}

/**
 * Get all registered commands
 */
export async function getCommands(
  applicationId: string,
  botToken: string,
  guildId?: string
): Promise<any[]> {
  const endpoint = guildId
    ? `${DISCORD_API_BASE}/applications/${applicationId}/guilds/${guildId}/commands`
    : `${DISCORD_API_BASE}/applications/${applicationId}/commands`

  const response = await fetch(endpoint, {
    headers: {
      'Authorization': `Bot ${botToken}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to get commands: ${response.status}`)
  }

  return response.json()
}

/**
 * Delete a specific command
 */
export async function deleteCommand(
  applicationId: string,
  botToken: string,
  commandId: string,
  guildId?: string
): Promise<void> {
  const endpoint = guildId
    ? `${DISCORD_API_BASE}/applications/${applicationId}/guilds/${guildId}/commands/${commandId}`
    : `${DISCORD_API_BASE}/applications/${applicationId}/commands/${commandId}`

  const response = await fetch(endpoint, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bot ${botToken}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to delete command: ${response.status}`)
  }
}
