/**
 * 🏆 Leaderboard API Endpoint
 *
 * Returns collaborator rankings with accurate statistics
 * Statistics are sourced directly from tasks table (source of truth)
 */

import { NextRequest, NextResponse } from 'next/server'
import { TaskService } from '@/lib/tasks/task-service'
import { authHelpers } from '@/lib/auth/middleware'

const taskService = new TaskService()

export const GET = authHelpers.public(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const address = searchParams.get('address')

    // Get leaderboard
    const leaderboard = await taskService.getLeaderboard(limit)

    // If specific address requested, get their details
    let userRank = null
    if (address) {
      const collaborator = await taskService.getCollaborator(address)
      if (collaborator) {
        userRank = {
          ...collaborator,
          position: leaderboard.findIndex(c => c.address === address) + 1,
        }
      }
    }

    // Calculate statistics from leaderboard_view (uses total_tasks_completed field)
    const collabCGC = leaderboard.reduce(
      (sum, c) => sum + (c.total_cgc_earned || 0),
      0
    )
    const collabTasksCompleted = leaderboard.reduce(
      (sum, c) => sum + (c.total_tasks_completed || 0),
      0
    )

    // Get accurate stats directly from tasks table (source of truth)
    let tasksCompletedFromDB = 0
    let cgcDistributedFromDB = 0
    try {
      const completedTasks = await taskService.getCompletedTasks(1000)
      tasksCompletedFromDB = completedTasks.length
      cgcDistributedFromDB = completedTasks.reduce(
        (sum, t) => sum + (t.reward_cgc || 0),
        0
      )
    } catch (e) {
      console.warn('Failed to get completed tasks from DB, using collaborators data:', e)
    }

    // Use the higher value (in case collaborators is outdated or tasks is more accurate)
    const totalTasksCompleted = Math.max(collabTasksCompleted, tasksCompletedFromDB)
    const totalCGCDistributed = Math.max(collabCGC, cgcDistributedFromDB)

    return NextResponse.json({
      success: true,
      data: {
        leaderboard,
        userRank,
        statistics: {
          totalCollaborators: leaderboard.length,
          totalCGCDistributed,
          totalTasksCompleted,
          averageCGCPerCollaborator:
            leaderboard.length > 0 ? totalCGCDistributed / leaderboard.length : 0,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch leaderboard',
      },
      { status: 500 }
    )
  }
})