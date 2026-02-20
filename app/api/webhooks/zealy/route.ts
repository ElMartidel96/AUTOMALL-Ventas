/**
 * 🏆 Zealy Webhook Handler
 * 
 * Processes Zealy quest completions and syncs with task management
 * Integrates with CryptoGift DAO rewards system
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerClient } from '@/lib/supabase/client'
import { verifyZealySignature } from '@/lib/zealy/verify'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Rate limiting
const redis = Redis.fromEnv()
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'),
  analytics: true,
})

interface ZealyWebhookPayload {
  event: string
  data: {
    quest?: {
      id: string
      name: string
      description: string
      xp: number
      type: string
    }
    user?: {
      id: string
      name: string
      discordId?: string
      twitterId?: string
      walletAddress?: string
    }
    submission?: {
      id: string
      status: 'pending' | 'approved' | 'rejected'
      submittedAt: string
    }
  }
  timestamp: string
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.ip ?? 'anonymous'
    const { success: rateLimitOk } = await ratelimit.limit(`zealy_webhook:${ip}`)
    
    if (!rateLimitOk) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      )
    }

    // Get request body and headers
    const body = await request.text()
    const signature = request.headers.get('x-zealy-signature')
    const timestamp = request.headers.get('x-zealy-timestamp')

    // Verify Zealy signature
    const isValid = verifyZealySignature(body, signature, timestamp)
    if (!isValid) {
      console.error('Invalid Zealy webhook signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    const payload: ZealyWebhookPayload = JSON.parse(body)

    // Handle different Zealy events
    switch (payload.event) {
      case 'quest.completed':
        return handleQuestCompleted(payload)
      case 'quest.approved':
        return handleQuestApproved(payload)
      case 'quest.rejected':
        return handleQuestRejected(payload)
      case 'user.joined':
        return handleUserJoined(payload)
      default:
        console.log('Unhandled Zealy event:', payload.event)
        return NextResponse.json({ success: true, message: 'Event acknowledged' })
    }

  } catch (error) {
    console.error('Zealy webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleQuestCompleted(payload: ZealyWebhookPayload) {
  console.log('Zealy quest completed:', payload.data.quest?.name)
  
  const { quest, user, submission } = payload.data
  
  if (!quest || !user) {
    return NextResponse.json({ error: 'Missing quest or user data' }, { status: 400 })
  }

  try {
    const supabase = await getServerClient()
    
    // Log the quest completion for tracking
    const { error: logError } = await supabase
      .from('task_history')
      .insert({
        task_id: `zealy_${quest.id}`,
        action: 'quest_completed',
        actor_address: user.walletAddress || user.name,
        metadata: {
          questName: quest.name,
          questXP: quest.xp,
          zealyUserId: user.id,
          submissionId: submission?.id
        }
      } as any)

    if (logError) {
      console.error('Error logging quest completion:', logError)
    }

    // If user has wallet address, update their collaborator profile
    if (user.walletAddress) {
      await updateCollaboratorFromZealy(user, quest.xp)
    }

    return NextResponse.json({
      success: true,
      message: 'Quest completion processed'
    })

  } catch (error) {
    console.error('Error handling quest completion:', error)
    return NextResponse.json(
      { error: 'Failed to process quest completion' },
      { status: 500 }
    )
  }
}

async function handleQuestApproved(payload: ZealyWebhookPayload) {
  console.log('Zealy quest approved:', payload.data.quest?.name)
  
  const { quest, user } = payload.data
  
  if (!quest || !user) {
    return NextResponse.json({ error: 'Missing quest or user data' }, { status: 400 })
  }

  try {
    const supabase = await getServerClient()

    // Check if this quest maps to a DAO task
    const mappedTask = await findMappedTask(quest.id)
    
    if (mappedTask) {
      // Update task status to completed
      const { error: updateError } = await (supabase as any)
        .from('tasks')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          evidence_url: `https://zealy.io/c/cryptogiftdao/questboard/${quest.id}`
        } as any)
        .eq('task_id', (mappedTask as any).task_id)

      if (updateError) {
        console.error('Error updating mapped task:', updateError)
      }
    }

    // Log the approval
    const { error: logError } = await supabase
      .from('task_history')
      .insert({
        task_id: (mappedTask as any)?.task_id || `zealy_${quest.id}`,
        action: 'quest_approved',
        actor_address: user.walletAddress || user.name,
        metadata: {
          questName: quest.name,
          questXP: quest.xp,
          zealyUserId: user.id
        }
      } as any)

    if (logError) {
      console.error('Error logging quest approval:', logError)
    }

    return NextResponse.json({
      success: true,
      message: 'Quest approval processed'
    })

  } catch (error) {
    console.error('Error handling quest approval:', error)
    return NextResponse.json(
      { error: 'Failed to process quest approval' },
      { status: 500 }
    )
  }
}

async function handleQuestRejected(payload: ZealyWebhookPayload) {
  console.log('Zealy quest rejected:', payload.data.quest?.name)
  
  const { quest, user } = payload.data
  
  try {
    const supabase = await getServerClient()
    
    // Log the rejection
    const { error: logError } = await supabase
      .from('task_history')
      .insert({
        task_id: `zealy_${quest?.id}`,
        action: 'quest_rejected',
        actor_address: user?.walletAddress || user?.name,
        metadata: {
          questName: quest?.name,
          questXP: quest?.xp,
          zealyUserId: user?.id
        }
      } as any)

    if (logError) {
      console.error('Error logging quest rejection:', logError)
    }

    return NextResponse.json({
      success: true,
      message: 'Quest rejection processed'
    })

  } catch (error) {
    console.error('Error handling quest rejection:', error)
    return NextResponse.json(
      { error: 'Failed to process quest rejection' },
      { status: 500 }
    )
  }
}

async function handleUserJoined(payload: ZealyWebhookPayload) {
  console.log('New Zealy user joined:', payload.data.user?.name)
  
  const { user } = payload.data
  
  if (!user) {
    return NextResponse.json({ error: 'Missing user data' }, { status: 400 })
  }

  try {
    const supabase = await getServerClient()
    
    // If user has wallet address, create or update collaborator profile
    if (user.walletAddress) {
      const { error: upsertError } = await supabase
        .from('collaborators')
        .upsert({
          wallet_address: user.walletAddress,
          username: user.name,
          discord_username: user.discordId,
          is_active: true,
          joined_at: new Date().toISOString()
        } as any, {
          onConflict: 'wallet_address'
        })

      if (upsertError) {
        console.error('Error upserting collaborator from Zealy:', upsertError)
      }
    }

    // Log the user joining
    const { error: logError } = await supabase
      .from('task_history')
      .insert({
        task_id: 'system_event',
        action: 'zealy_user_joined',
        actor_address: user.walletAddress || user.name,
        metadata: {
          userName: user.name,
          zealyUserId: user.id,
          discordId: user.discordId,
          twitterId: user.twitterId
        }
      } as any)

    if (logError) {
      console.error('Error logging user join:', logError)
    }

    return NextResponse.json({
      success: true,
      message: 'User join processed'
    })

  } catch (error) {
    console.error('Error handling user join:', error)
    return NextResponse.json(
      { error: 'Failed to process user join' },
      { status: 500 }
    )
  }
}

async function updateCollaboratorFromZealy(user: any, xpGained: number) {
  const supabase = await getServerClient()
  
  try {
    // Update or create collaborator profile
    const { error } = await supabase
      .from('collaborators')
      .upsert({
        wallet_address: user.walletAddress,
        username: user.name,
        reputation_score: xpGained, // Use XP as reputation boost
        is_active: true,
        updated_at: new Date().toISOString()
      } as any, {
        onConflict: 'wallet_address'
      })

    if (error) {
      console.error('Error updating collaborator from Zealy:', error)
    }
  } catch (error) {
    console.error('Error in updateCollaboratorFromZealy:', error)
  }
}

async function findMappedTask(questId: string) {
  const supabase = await getServerClient()
  
  try {
    // Look for tasks that might be mapped to this Zealy quest
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .or(`task_id.eq.zealy_${questId},tags.cs.{zealy}`)
      .single()

    return data
  } catch (error) {
    // No mapped task found
    return null
  }
}

export async function GET(request: NextRequest) {
  // Health check endpoint
  return NextResponse.json({ 
    status: 'Zealy webhook endpoint is operational',
    timestamp: new Date().toISOString()
  })
}