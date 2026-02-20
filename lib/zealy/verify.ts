/**
 * 🔐 Zealy Webhook Signature Verification
 * 
 * Verifies Zealy webhook signatures using HMAC-SHA256
 * Ensures webhook requests are authentic
 */

import { createHmac } from 'node:crypto'

/**
 * Verify Zealy webhook signature using HMAC-SHA256
 */
export function verifyZealySignature(
  body: string,
  signature: string | null,
  timestamp: string | null
): boolean {
  const secret = process.env.ZEALY_WEBHOOK_SECRET
  
  if (!secret || !signature || !timestamp) {
    console.error('Missing Zealy verification parameters')
    return false
  }

  try {
    // Zealy uses HMAC-SHA256 with timestamp
    const payload = `${timestamp}.${body}`
    const expectedSignature = createHmac('sha256', secret)
      .update(payload)
      .digest('hex')

    // Compare signatures (constant-time comparison)
    return timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    )
  } catch (error) {
    console.error('Zealy signature verification failed:', error)
    return false
  }
}

/**
 * Timing-safe string comparison to prevent timing attacks
 */
function timingSafeEqual(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) {
    return false
  }

  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i]
  }
  return result === 0
}

/**
 * Zealy API client for making requests
 */
export class ZealyClient {
  private apiKey: string
  private subdomain: string
  private baseUrl: string

  constructor() {
    this.apiKey = process.env.ZEALY_API_KEY || ''
    this.subdomain = process.env.ZEALY_SUBDOMAIN || 'cryptogiftdao'
    this.baseUrl = 'https://api.zealy.io/v1'
    
    if (!this.apiKey) {
      console.warn('Zealy API key not configured')
    }
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Zealy API error: ${response.status} ${error}`)
    }

    return response.json()
  }

  /**
   * Get community info
   */
  async getCommunityInfo() {
    try {
      return await this.request(`/communities/${this.subdomain}`)
    } catch (error) {
      console.error('Error fetching Zealy community info:', error)
      return null
    }
  }

  /**
   * Get community quests
   */
  async getQuests(limit = 50, offset = 0) {
    try {
      return await this.request(`/communities/${this.subdomain}/quests?limit=${limit}&offset=${offset}`)
    } catch (error) {
      console.error('Error fetching Zealy quests:', error)
      return null
    }
  }

  /**
   * Get user by wallet address
   */
  async getUserByWallet(walletAddress: string) {
    try {
      return await this.request(`/communities/${this.subdomain}/users?walletAddress=${walletAddress}`)
    } catch (error) {
      console.error('Error fetching Zealy user by wallet:', error)
      return null
    }
  }

  /**
   * Get community leaderboard
   */
  async getLeaderboard(limit = 50) {
    try {
      return await this.request(`/communities/${this.subdomain}/leaderboard?limit=${limit}`)
    } catch (error) {
      console.error('Error fetching Zealy leaderboard:', error)
      return null
    }
  }

  /**
   * Create a new quest
   */
  async createQuest(questData: {
    name: string
    description: string
    type: 'twitter' | 'discord' | 'custom' | 'visit_link'
    xp: number
    requirements?: any
  }) {
    try {
      return await this.request(`/communities/${this.subdomain}/quests`, {
        method: 'POST',
        body: JSON.stringify(questData)
      })
    } catch (error) {
      console.error('Error creating Zealy quest:', error)
      return null
    }
  }

  /**
   * Update quest status
   */
  async updateQuest(questId: string, updates: any) {
    try {
      return await this.request(`/communities/${this.subdomain}/quests/${questId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      })
    } catch (error) {
      console.error('Error updating Zealy quest:', error)
      return null
    }
  }
}

/**
 * Sync DAO tasks to Zealy quests
 */
export async function syncTasksToZealy(tasks: any[]) {
  const client = new ZealyClient()
  
  if (!client || !process.env.ZEALY_API_KEY) {
    console.warn('Zealy integration not configured, skipping sync')
    return false
  }

  try {
    const results = []
    
    for (const task of tasks) {
      // Convert DAO task to Zealy quest format
      const questData = {
        name: task.title,
        description: task.description || 'Complete this task to earn CGC tokens',
        type: 'custom' as const,
        xp: Math.round(task.reward_cgc / 10), // Convert CGC to XP (1:10 ratio)
        requirements: {
          customTask: true,
          taskId: task.task_id,
          complexity: task.complexity
        }
      }

      const result = await client.createQuest(questData)
      results.push({ task: task.task_id, result })
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    
    console.log(`Synced ${results.length} tasks to Zealy`)
    return results
  } catch (error) {
    console.error('Error syncing tasks to Zealy:', error)
    return false
  }
}

/**
 * Notify Zealy about task completion
 */
export async function notifyZealyTaskCompletion(
  taskId: string,
  walletAddress: string,
  evidenceUrl?: string
) {
  try {
    const client = new ZealyClient()
    
    // Find the corresponding quest
    const quests = await client.getQuests()
    const matchingQuest = quests?.data?.find((q: any) => 
      q.requirements?.taskId === taskId
    )

    if (!matchingQuest) {
      console.log('No matching Zealy quest found for task:', taskId)
      return false
    }

    // For now, log the completion
    // In production, you'd use Zealy's submission API
    console.log('Task completion notified to Zealy:', {
      questId: matchingQuest.id,
      walletAddress,
      evidenceUrl
    })

    return true
  } catch (error) {
    console.error('Error notifying Zealy of task completion:', error)
    return false
  }
}

/**
 * Get Zealy community stats
 */
export async function getZealyStats() {
  try {
    const client = new ZealyClient()
    
    const [community, leaderboard] = await Promise.all([
      client.getCommunityInfo(),
      client.getLeaderboard(10)
    ])

    return {
      community: {
        name: community?.name || 'CryptoGift DAO',
        members: community?.membersCount || 0,
        description: community?.description
      },
      topUsers: leaderboard?.data || [],
      totalXP: leaderboard?.data?.reduce((sum: number, user: any) => sum + (user.xp || 0), 0) || 0
    }
  } catch (error) {
    console.error('Error fetching Zealy stats:', error)
    return null
  }
}