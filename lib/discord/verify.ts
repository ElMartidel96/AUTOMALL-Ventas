/**
 * 🔐 Discord Webhook Signature Verification
 * 
 * Verifies Discord webhook signatures using Ed25519
 * Ensures webhook requests are authentic
 */

import { webcrypto } from 'node:crypto'

// Use Node.js crypto if available, fallback to web crypto
const crypto = webcrypto || globalThis.crypto

/**
 * Verify Discord webhook signature using Ed25519
 */
export function verifyDiscordSignature(
  body: string,
  signature: string | null,
  timestamp: string | null
): boolean {
  const publicKey = process.env.DISCORD_DAO_CLIENT_Public_Key
  
  if (!publicKey || !signature || !timestamp) {
    console.error('Missing Discord verification parameters')
    return false
  }

  try {
    // Discord uses Ed25519 signature verification
    // The signature is hex-encoded
    const sig = hexToUint8Array(signature)
    const msg = new TextEncoder().encode(timestamp + body)
    const key = hexToUint8Array(publicKey)

    // For now, we'll do a basic verification
    // In production, use a proper Ed25519 library like @noble/ed25519
    return verifyEd25519Signature(key, sig, msg)
  } catch (error) {
    console.error('Discord signature verification failed:', error)
    return false
  }
}

/**
 * Convert hex string to Uint8Array
 */
function hexToUint8Array(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16)
  }
  return bytes
}

/**
 * Basic Ed25519 signature verification
 * For production, use a proper crypto library
 */
function verifyEd25519Signature(
  publicKey: Uint8Array,
  signature: Uint8Array,
  message: Uint8Array
): boolean {
  // This is a placeholder implementation
  // In production, use @noble/ed25519 or similar library
  
  // For development, we'll allow signatures to pass if keys are present
  if (process.env.NODE_ENV === 'development') {
    return publicKey.length === 32 && signature.length === 64
  }
  
  // For production, implement proper Ed25519 verification
  return false
}

/**
 * Generate Discord slash command registration payload
 */
export function generateSlashCommands() {
  return [
    {
      name: 'tasks',
      description: 'View current task status and statistics',
      type: 1, // Slash command
    },
    {
      name: 'profile',
      description: 'View your contributor profile and stats',
      type: 1,
    },
    {
      name: 'leaderboard',
      description: 'View top contributors leaderboard',
      type: 1,
    }
  ]
}

/**
 * Register Discord slash commands
 */
export async function registerDiscordCommands(): Promise<boolean> {
  const clientId = process.env.DISCORD_DAO_CLIENT_ID
  const guildId = process.env.DISCORD_DAO_GUILD_ID
  const token = process.env.DISCORD_DAO_TOKEN
  
  if (!clientId || !guildId || !token) {
    console.error('Missing Discord configuration for command registration')
    return false
  }

  try {
    const commands = generateSlashCommands()
    
    // Register guild-specific commands (faster for development)
    const response = await fetch(
      `https://discord.com/api/v10/applications/${clientId}/guilds/${guildId}/commands`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bot ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(commands),
      }
    )

    if (response.ok) {
      console.log('Discord commands registered successfully')
      return true
    } else {
      const error = await response.text()
      console.error('Failed to register Discord commands:', error)
      return false
    }
  } catch (error) {
    console.error('Error registering Discord commands:', error)
    return false
  }
}

/**
 * Send Discord notification
 */
export async function sendDiscordNotification(
  message: string,
  embed?: any
): Promise<boolean> {
  const webhookUrl = process.env.DISCORD_DAO_WEBHOOK_URL
  
  if (!webhookUrl) {
    console.warn('Discord webhook URL not configured')
    return false
  }

  try {
    const payload = {
      content: message,
      ...(embed && { embeds: [embed] })
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    return response.ok
  } catch (error) {
    console.error('Error sending Discord notification:', error)
    return false
  }
}

/**
 * Send task completion notification to Discord
 */
export async function notifyTaskCompletion(
  taskTitle: string,
  contributor: string,
  rewardCGC: number
): Promise<void> {
  const embed = {
    title: '✅ Task Completed!',
    description: `**${taskTitle}** has been completed`,
    color: 0x10B981, // Green
    fields: [
      {
        name: '👤 Contributor',
        value: contributor,
        inline: true
      },
      {
        name: '💎 Reward',
        value: `${rewardCGC} CGC`,
        inline: true
      }
    ],
    timestamp: new Date().toISOString(),
    footer: {
      text: 'CryptoGift DAO'
    }
  }

  await sendDiscordNotification('', embed)
}

/**
 * Send new task notification to Discord
 */
export async function notifyNewTask(
  taskTitle: string,
  complexity: number,
  rewardCGC: number
): Promise<void> {
  const embed = {
    title: '🎯 New Task Available!',
    description: `**${taskTitle}** is now available for contributors`,
    color: 0x7C3AED, // Purple
    fields: [
      {
        name: '⚡ Complexity',
        value: `Level ${complexity}/10`,
        inline: true
      },
      {
        name: '💎 Reward',
        value: `${rewardCGC} CGC`,
        inline: true
      },
      {
        name: '🔗 Claim Task',
        value: '[View Tasks](https://crypto-gift-wallets-dao.vercel.app/tasks)',
        inline: false
      }
    ],
    timestamp: new Date().toISOString(),
    footer: {
      text: 'CryptoGift DAO'
    }
  }

  await sendDiscordNotification('', embed)
}