/**
 * 🤖 Discord Webhook Handler
 * 
 * Processes Discord events and syncs with task management
 * Integrates with CryptoGift DAO task system
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerClient } from '@/lib/supabase/client'
import { verifyDiscordSignature } from '@/lib/discord/verify'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Rate limiting for webhook endpoints
const redis = Redis.fromEnv()
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(50, '1 m'),
  analytics: true,
})

interface DiscordWebhookPayload {
  type: number
  data?: any
  guild_id?: string
  channel_id?: string
  user?: {
    id: string
    username: string
    discriminator: string
  }
  member?: {
    user: {
      id: string
      username: string
    }
    nick?: string
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.ip ?? 'anonymous'
    const { success: rateLimitOk } = await ratelimit.limit(`discord_webhook:${ip}`)
    
    if (!rateLimitOk) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      )
    }

    // Get request body and headers
    const body = await request.text()
    const signature = request.headers.get('X-Signature-Ed25519')
    const timestamp = request.headers.get('X-Signature-Timestamp')

    // Verify Discord signature
    const isValid = verifyDiscordSignature(body, signature, timestamp)
    if (!isValid) {
      console.error('Invalid Discord webhook signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    const payload: DiscordWebhookPayload = JSON.parse(body)

    // Handle Discord ping/verification
    if (payload.type === 1) {
      return NextResponse.json({ type: 1 })
    }

    // Handle slash commands
    if (payload.type === 2) {
      return handleSlashCommand(payload)
    }

    // Handle other Discord events
    if (payload.type === 3) {
      return handleDiscordEvent(payload)
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Discord webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleSlashCommand(payload: DiscordWebhookPayload) {
  const { data } = payload
  
  if (!data?.name) {
    return NextResponse.json({ type: 4, data: { content: 'Unknown command' } })
  }

  switch (data.name) {
    case 'tasks':
      return handleTasksCommand(payload)
    case 'profile':
      return handleProfileCommand(payload)
    case 'leaderboard':
      return handleLeaderboardCommand(payload)
    default:
      return NextResponse.json({
        type: 4,
        data: { content: 'Command not recognized' }
      })
  }
}

async function handleTasksCommand(payload: DiscordWebhookPayload) {
  try {
    const supabase = await getServerClient()
    
    // Get available tasks count
    const { count: availableCount } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'available')

    // Get in progress tasks count
    const { count: progressCount } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'in_progress')

    const response = {
      type: 4,
      data: {
        embeds: [{
          title: '🎯 CryptoGift DAO Tasks',
          description: 'Current task status overview',
          color: 0x7C3AED, // Purple
          fields: [
            {
              name: '🎯 Available Tasks',
              value: `${availableCount || 0} tasks ready to claim`,
              inline: true
            },
            {
              name: '⏳ In Progress',
              value: `${progressCount || 0} tasks being worked on`,
              inline: true
            },
            {
              name: '🔗 Dashboard',
              value: '[View Tasks](https://crypto-gift-wallets-dao.vercel.app/tasks)',
              inline: false
            }
          ],
          timestamp: new Date().toISOString(),
          footer: {
            text: 'CryptoGift DAO'
          }
        }]
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error handling tasks command:', error)
    return NextResponse.json({
      type: 4,
      data: { content: '❌ Error fetching task information' }
    })
  }
}

async function handleProfileCommand(payload: DiscordWebhookPayload) {
  const discordUserId = payload.member?.user?.id || payload.user?.id
  
  if (!discordUserId) {
    return NextResponse.json({
      type: 4,
      data: { content: '❌ Could not identify Discord user' }
    })
  }

  try {
    const supabase = await getServerClient()
    
    // Find collaborator by Discord username
    const discordUsername = payload.member?.user?.username || payload.user?.username
    
    if (!discordUsername) {
      return NextResponse.json({
        type: 4,
        data: { content: '❌ Unable to identify Discord user' }
      })
    }
    
    const { data: collaborator } = await supabase
      .from('collaborators')
      .select('*')
      .eq('discord_username', discordUsername)
      .single()

    if (!collaborator) {
      return NextResponse.json({
        type: 4,
        data: {
          content: '👋 Welcome! You don\'t have a profile yet.',
          embeds: [{
            title: '🚀 Get Started',
            description: 'Connect your wallet and start contributing!',
            color: 0x10B981, // Green
            fields: [{
              name: '🔗 Dashboard',
              value: '[Connect Wallet](https://crypto-gift-wallets-dao.vercel.app/tasks)',
              inline: false
            }]
          }]
        }
      })
    }

    const response = {
      type: 4,
      data: {
        embeds: [{
          title: `👤 ${(collaborator as any).username || 'Anonymous'}`,
          description: (collaborator as any).bio || 'DAO Contributor',
          color: 0x7C3AED,
          fields: [
            {
              name: '💎 CGC Earned',
              value: `${(collaborator as any).total_cgc_earned || 0} CGC`,
              inline: true
            },
            {
              name: '✅ Tasks Completed',
              value: `${(collaborator as any).tasks_completed || 0}`,
              inline: true
            },
            {
              name: '🏆 Reputation',
              value: `${(collaborator as any).reputation_score || 0}`,
              inline: true
            }
          ],
          timestamp: new Date().toISOString()
        }]
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error handling profile command:', error)
    return NextResponse.json({
      type: 4,
      data: { content: '❌ Error fetching profile information' }
    })
  }
}

async function handleLeaderboardCommand(payload: DiscordWebhookPayload) {
  try {
    const supabase = await getServerClient()
    
    // Get top 10 collaborators with explicit typing
    const { data: topCollaborators } = await supabase
      .from('collaborators')
      .select('username, total_cgc_earned, tasks_completed')
      .order('total_cgc_earned', { ascending: false })
      .limit(10) as { data: { username: string | null; total_cgc_earned: number; tasks_completed: number }[] | null; error: any }

    if (!topCollaborators || topCollaborators.length === 0) {
      return NextResponse.json({
        type: 4,
        data: { content: '📊 No contributors yet. Be the first!' }
      })
    }

    const leaderboardText = topCollaborators
      .map((collab: { username: string | null; total_cgc_earned: number; tasks_completed: number }, index: number) => {
        const rank = index + 1
        const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`
        return `${medal} **${collab.username || 'Anonymous'}** - ${collab.total_cgc_earned || 0} CGC (${collab.tasks_completed || 0} tasks)`
      })
      .join('\n')

    const response = {
      type: 4,
      data: {
        embeds: [{
          title: '🏆 Leaderboard - Top Contributors',
          description: leaderboardText,
          color: 0xF59E0B, // Amber
          footer: {
            text: 'CryptoGift DAO • Earn CGC by completing tasks'
          },
          timestamp: new Date().toISOString()
        }]
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error handling leaderboard command:', error)
    return NextResponse.json({
      type: 4,
      data: { content: '❌ Error fetching leaderboard' }
    })
  }
}

async function handleDiscordEvent(payload: DiscordWebhookPayload) {
  // Handle Discord component interactions, button clicks, etc.
  console.log('Discord event received:', payload.type)
  
  return NextResponse.json({
    type: 6 // Acknowledge without response
  })
}

export async function GET(request: NextRequest) {
  // Health check endpoint
  return NextResponse.json({ 
    status: 'Discord webhook endpoint is operational',
    timestamp: new Date().toISOString()
  })
}