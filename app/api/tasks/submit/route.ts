/**
 * 📝 Task Submit API Endpoint
 * 
 * Handles evidence submission for tasks
 */

import { NextRequest, NextResponse } from 'next/server'
import { TaskService } from '@/lib/tasks/task-service'
import { authHelpers, type AuthContext } from '@/lib/auth/middleware'
import { getDAORedis, RedisKeys } from '@/lib/redis-dao'
import { notifyTaskSubmitted } from '@/lib/discord/task-notifications'

const taskService = new TaskService()
const redis = getDAORedis()

export const POST = authHelpers.protected(async (request: NextRequest, context: AuthContext) => {
  try {
    const body = await request.json()
    const { taskId, evidenceUrl, prUrl } = body
    
    // Get userAddress from context or body
    const userAddress = context.address || body.userAddress

    // Validate inputs
    if (!taskId || !evidenceUrl || !userAddress) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: taskId, evidenceUrl, and userAddress',
        },
        { status: 400 }
      )
    }

    // Validate URLs
    try {
      new URL(evidenceUrl)
      if (prUrl) new URL(prUrl)
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid URL format',
        },
        { status: 400 }
      )
    }

    // Get task to verify assignee
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

    if (task.assignee_address !== userAddress) {
      return NextResponse.json(
        {
          success: false,
          error: 'You are not assigned to this task',
        },
        { status: 403 }
      )
    }

    if (task.status !== 'in_progress') {
      return NextResponse.json(
        {
          success: false,
          error: 'Task is not in progress',
        },
        { status: 400 }
      )
    }

    // Submit evidence with blockchain validation
    const result = await taskService.submitTaskEvidence(taskId, userAddress, evidenceUrl, prUrl)

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to submit evidence',
        },
        { status: 500 }
      )
    }

    // Store in validation queue
    await redis.hset(
      RedisKeys.questCompletion(taskId, userAddress),
      'status',
      'pending_validation'
    )
    await redis.hset(
      RedisKeys.questCompletion(taskId, userAddress),
      'submitted_at',
      new Date().toISOString()
    )

    // Send Discord notification for submitted evidence (non-blocking)
    notifyTaskSubmitted(task, userAddress).catch((err) =>
      console.error('[Discord] Failed to send submission notification:', err)
    )
    console.log('✅ Evidence submitted, Discord notification sent for task:', taskId)

    return NextResponse.json({
      success: true,
      message: 'Evidence submitted successfully. Awaiting validation.',
      data: {
        taskId,
        evidenceUrl,
        prUrl,
        submittedAt: new Date().toISOString(),
        status: 'pending_validation',
        txHash: result.txHash,
      },
    })
  } catch (error) {
    console.error('Error submitting evidence:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to submit evidence',
      },
      { status: 500 }
    )
  }
})