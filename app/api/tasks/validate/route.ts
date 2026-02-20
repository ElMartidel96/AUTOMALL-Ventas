/**
 * ✅ Task Validation API Endpoint
 * 
 * Handles task validation by authorized validators
 */

import { NextRequest, NextResponse } from 'next/server'
import { TaskService } from '@/lib/tasks/task-service'
import { authHelpers, type AuthContext } from '@/lib/auth/middleware'
import { getDAORedis, RedisKeys } from '@/lib/redis-dao'
import { notifyTaskCompleted, notifyTaskSubmitted } from '@/lib/discord/task-notifications'

const taskService = new TaskService()
const redis = getDAORedis()

// Hardcoded validators for now - should be from smart contract roles
const AUTHORIZED_VALIDATORS = [
  '0xc655BF2Bd9AfA997c757Bef290A9Bb6ca41c5dE6', // Deployer
  '0x3244DFBf9E5374DF2f106E89Cf7972E5D4C9ac31', // DAO
]

export const POST = authHelpers.admin(async (request: NextRequest, context: AuthContext) => {
  try {
    const body = await request.json()
    const { taskId, approved, notes } = body
    
    // Get validatorAddress from context or body
    const validatorAddress = context.address || body.validatorAddress

    // Validate inputs
    if (!taskId || !validatorAddress || approved === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: taskId, validatorAddress, and approved',
        },
        { status: 400 }
      )
    }

    // Check if validator is authorized
    const isAuthorized = AUTHORIZED_VALIDATORS.some(
      addr => addr.toLowerCase() === validatorAddress.toLowerCase()
    )

    if (!isAuthorized) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized validator address',
        },
        { status: 403 }
      )
    }

    // Get task to verify it exists and has evidence
    const task = await taskService.getTaskById(taskId)
    
    if (!task) {
      return NextResponse.json(
        {
          success: false,
          error: 'Task not found',
        },
        { status: 404 }
      )
    }

    if (task.status !== 'in_progress' || !task.evidence_url) {
      return NextResponse.json(
        {
          success: false,
          error: 'Task must be in progress with evidence submitted',
        },
        { status: 400 }
      )
    }

    // Update task status based on validation
    let newStatus = 'in_progress'
    let updateData: any = {}

    if (approved) {
      // Check if this is a payment completion (contains "PAYMENT RELEASED" in notes)
      const isPaymentCompleted = notes && notes.includes('PAYMENT RELEASED')
      
      newStatus = isPaymentCompleted ? 'completed' : 'validated'
      updateData = {
        status: newStatus,
        validated_at: new Date().toISOString(),
        validator_address: validatorAddress,
        validation_notes: notes,
      }
      
      // If payment was completed, add completion timestamp
      if (isPaymentCompleted) {
        updateData.completed_at = new Date().toISOString()
      }

      // Store validation in Redis
      await redis.hset(
        RedisKeys.questCompletion(taskId, task.assignee_address!),
        'status',
        newStatus
      )
      await redis.hset(
        RedisKeys.questCompletion(taskId, task.assignee_address!),
        'validated_at',
        new Date().toISOString()
      )
      await redis.hset(
        RedisKeys.questCompletion(taskId, task.assignee_address!),
        'validator',
        validatorAddress
      )

      // If payment was completed, update collaborator earnings
      if (isPaymentCompleted && task.assignee_address) {
        try {
          const { getServerClient } = await import('@/lib/supabase/client')
          const reward = parseInt(notes.match(/PAYMENT RELEASED: (\d+)/)?.[1] || '0')
          
          // Update collaborator earnings
          const client = await getServerClient()
          
          // First, check if collaborator exists - use any cast to bypass type inference issues
          const { data: existingCollaborator, error: fetchError } = await (client as any)
            .from('collaborators')
            .select('id, total_cgc_earned, tasks_completed')
            .eq('wallet_address', task.assignee_address)
            .single()
          
          if (existingCollaborator && !fetchError) {
            // Update existing collaborator
            const newTotalCgc = (existingCollaborator.total_cgc_earned || 0) + reward
            const newTasksCompleted = (existingCollaborator.tasks_completed || 0) + 1
            
            const { error: updateError } = await (client as any)
              .from('collaborators')
              .update({
                total_cgc_earned: newTotalCgc,
                tasks_completed: newTasksCompleted,
                last_activity: new Date().toISOString()
              })
              .eq('wallet_address', task.assignee_address)
            
            if (updateError) {
              console.error('Error updating collaborator:', updateError)
            }
          } else if (fetchError?.code === 'PGRST116' || !existingCollaborator) {
            // No collaborator found, create new one
            const { error: insertError } = await (client as any)
              .from('collaborators')
              .insert({
                wallet_address: task.assignee_address,
                total_cgc_earned: reward,
                tasks_completed: 1,
                tasks_in_progress: 0,
                reputation_score: 0,
                is_active: true,
                joined_at: new Date().toISOString(),
                last_activity: new Date().toISOString()
              })
            
            if (insertError) {
              console.error('Error creating collaborator:', insertError)
            }
          }
          
          console.log(`💰 Updated collaborator earnings: +${reward} CGC for ${task.assignee_address}`)
        } catch (earningsError) {
          console.error('Error updating collaborator earnings:', earningsError)
        }
      }

      console.log(`✅ Task ${taskId} ${isPaymentCompleted ? 'completed with payment' : 'validated'} by ${validatorAddress}`)

      // Send Discord notification for completed task (non-blocking)
      if (isPaymentCompleted && task.assignee_address) {
        const txHash = notes?.match(/TX: (0x[a-fA-F0-9]+)/)?.[1]
        notifyTaskCompleted(task, task.assignee_address, txHash).catch((err) =>
          console.error('[Discord] Failed to send completion notification:', err)
        )
      }
    } else {
      // Rejected - reset to in_progress, clear evidence
      updateData = {
        status: 'in_progress',
        evidence_url: null,
        pr_url: null,
        validation_notes: notes,
        rejected_at: new Date().toISOString(),
        rejected_by: validatorAddress,
      }

      console.log(`❌ Task ${taskId} rejected by ${validatorAddress}`)
    }

    // Update task in database
    const updated = await taskService.updateTask(taskId, updateData)

    if (!updated) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update task status',
        },
        { status: 500 }
      )
    }

    // TODO: Trigger smart contract validation - this needs to be done from frontend
    // due to wallet signing requirements. Frontend should call:
    // 1. useTaskValidation hook with taskId and approved
    // 2. If approved and blockchain validation succeeds, trigger payment release

    return NextResponse.json({
      success: true,
      message: approved ? 'Task validated successfully' : 'Task validation rejected',
      data: {
        taskId,
        status: newStatus,
        validatedBy: validatorAddress,
        approved,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Error validating task:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to validate task',
      },
      { status: 500 }
    )
  }
})

export const GET = authHelpers.admin(async (request: NextRequest, context: AuthContext) => {
  try {
    // Get tasks pending validation
    const tasks = await taskService.getTasksByStatus('in_progress')
    
    // Filter to only tasks with evidence submitted
    const pendingValidation = tasks.filter(task => task.evidence_url)

    return NextResponse.json({
      success: true,
      data: pendingValidation,
      count: pendingValidation.length,
    })
  } catch (error) {
    console.error('Error fetching tasks for validation:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch tasks for validation',
      },
      { status: 500 }
    )
  }
})