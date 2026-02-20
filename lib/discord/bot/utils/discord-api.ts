/**
 * Discord API Utilities
 *
 * Helper functions for making requests to Discord API
 */

const DISCORD_API_BASE = 'https://discord.com/api/v10'
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN
const APPLICATION_ID = process.env.DISCORD_APPLICATION_ID

interface DiscordAPIOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: any
  headers?: Record<string, string>
}

/**
 * Make a request to the Discord API
 */
export async function discordAPI(
  endpoint: string,
  options: DiscordAPIOptions = {}
): Promise<any> {
  const { method = 'GET', body, headers = {} } = options

  if (!BOT_TOKEN) {
    throw new Error('DISCORD_BOT_TOKEN not configured')
  }

  const url = endpoint.startsWith('http') ? endpoint : `${DISCORD_API_BASE}${endpoint}`

  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bot ${BOT_TOKEN}`,
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('[Discord API] Error:', response.status, errorText)
    throw new Error(`Discord API error: ${response.status} - ${errorText}`)
  }

  // Some endpoints return 204 No Content
  if (response.status === 204) {
    return null
  }

  return response.json()
}

/**
 * Send a message to a channel
 */
export async function sendChannelMessage(
  channelId: string,
  content: string | { content?: string; embeds?: any[]; components?: any[] }
): Promise<any> {
  const body = typeof content === 'string' ? { content } : content

  return discordAPI(`/channels/${channelId}/messages`, {
    method: 'POST',
    body,
  })
}

/**
 * Edit a message
 */
export async function editMessage(
  channelId: string,
  messageId: string,
  content: string | { content?: string; embeds?: any[]; components?: any[] }
): Promise<any> {
  const body = typeof content === 'string' ? { content } : content

  return discordAPI(`/channels/${channelId}/messages/${messageId}`, {
    method: 'PATCH',
    body,
  })
}

/**
 * Delete a message
 */
export async function deleteMessage(channelId: string, messageId: string): Promise<void> {
  await discordAPI(`/channels/${channelId}/messages/${messageId}`, {
    method: 'DELETE',
  })
}

/**
 * Create a thread from a message
 */
export async function createThread(
  channelId: string,
  messageId: string,
  name: string,
  autoArchiveDuration: 60 | 1440 | 4320 | 10080 = 1440
): Promise<any> {
  return discordAPI(`/channels/${channelId}/messages/${messageId}/threads`, {
    method: 'POST',
    body: {
      name,
      auto_archive_duration: autoArchiveDuration,
    },
  })
}

/**
 * Add a reaction to a message
 */
export async function addReaction(
  channelId: string,
  messageId: string,
  emoji: string
): Promise<void> {
  const encodedEmoji = encodeURIComponent(emoji)
  await discordAPI(`/channels/${channelId}/messages/${messageId}/reactions/${encodedEmoji}/@me`, {
    method: 'PUT',
  })
}

/**
 * Get reactions on a message
 */
export async function getReactions(
  channelId: string,
  messageId: string,
  emoji: string
): Promise<any[]> {
  const encodedEmoji = encodeURIComponent(emoji)
  return discordAPI(`/channels/${channelId}/messages/${messageId}/reactions/${encodedEmoji}`)
}

/**
 * Get a user by ID
 */
export async function getUser(userId: string): Promise<any> {
  return discordAPI(`/users/${userId}`)
}

/**
 * Get a guild member
 */
export async function getGuildMember(guildId: string, userId: string): Promise<any> {
  return discordAPI(`/guilds/${guildId}/members/${userId}`)
}

/**
 * Check if a user has a specific role
 */
export async function userHasRole(
  guildId: string,
  userId: string,
  roleId: string
): Promise<boolean> {
  try {
    const member = await getGuildMember(guildId, userId)
    return member.roles.includes(roleId)
  } catch {
    return false
  }
}

/**
 * Send a DM to a user
 */
export async function sendDM(userId: string, content: string | { embeds?: any[] }): Promise<any> {
  // First, create a DM channel
  const dmChannel = await discordAPI('/users/@me/channels', {
    method: 'POST',
    body: { recipient_id: userId },
  })

  // Then send the message
  const body = typeof content === 'string' ? { content } : content
  return sendChannelMessage(dmChannel.id, body)
}

/**
 * Get channel info
 */
export async function getChannel(channelId: string): Promise<any> {
  return discordAPI(`/channels/${channelId}`)
}

/**
 * Respond to an interaction (for deferred responses)
 */
export async function editOriginalInteractionResponse(
  interactionToken: string,
  content: { content?: string; embeds?: any[]; components?: any[] }
): Promise<any> {
  if (!APPLICATION_ID) {
    throw new Error('DISCORD_APPLICATION_ID not configured')
  }

  return discordAPI(`/webhooks/${APPLICATION_ID}/${interactionToken}/messages/@original`, {
    method: 'PATCH',
    body: content,
  })
}

/**
 * Send a followup message to an interaction
 */
export async function sendFollowupMessage(
  interactionToken: string,
  content: { content?: string; embeds?: any[]; components?: any[]; flags?: number }
): Promise<any> {
  if (!APPLICATION_ID) {
    throw new Error('DISCORD_APPLICATION_ID not configured')
  }

  return discordAPI(`/webhooks/${APPLICATION_ID}/${interactionToken}`, {
    method: 'POST',
    body: content,
  })
}

/**
 * Delete the original interaction response
 */
export async function deleteOriginalInteractionResponse(interactionToken: string): Promise<void> {
  if (!APPLICATION_ID) {
    throw new Error('DISCORD_APPLICATION_ID not configured')
  }

  await discordAPI(`/webhooks/${APPLICATION_ID}/${interactionToken}/messages/@original`, {
    method: 'DELETE',
  })
}
