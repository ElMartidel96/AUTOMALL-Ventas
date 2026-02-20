/**
 * 📋 Tasks API Endpoint
 *
 * Handles CRUD operations for tasks
 */

import { NextRequest, NextResponse } from 'next/server'
import { TaskService } from '@/lib/tasks/task-service'
import { authHelpers } from '@/lib/auth/middleware'
import { getDAORedis } from '@/lib/redis-dao'
import { supabaseAdmin } from '@/lib/supabase/client'

const redis = getDAORedis()

export const GET = authHelpers.public(async (request: NextRequest) => {
  try {
    // Early check for Supabase client
    if (!supabaseAdmin) {
      console.error('Supabase admin client not initialized')
      return NextResponse.json(
        {
          success: false,
          error: 'Database service unavailable. Please check environment configuration.',
          debug: {
            has_url: Boolean(process.env.NEXT_PUBLIC_SUPABASE_DAO_URL || process.env.SUPABASE_DAO_URL),
            has_anon_key: Boolean(process.env.NEXT_PUBLIC_SUPABASE_DAO_ANON_KEY || process.env.SUPABASE_DAO_ANON_KEY),
            has_service_key: Boolean(process.env.SUPABASE_DAO_SERVICE_KEY),
          }
        },
        { status: 503 }
      )
    }

    const taskService = new TaskService()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const userAddress = searchParams.get('address')
    const limit = parseInt(searchParams.get('limit') || '50')

    // New taxonomy filters (v2.0)
    const domain = searchParams.get('domain')
    const category = searchParams.get('category')
    const taskType = searchParams.get('task_type')
    const isFeatured = searchParams.get('featured') === 'true'
    const isUrgent = searchParams.get('urgent') === 'true'
    const sortBy = searchParams.get('sort') || 'reward'
    const sortOrder = searchParams.get('order') || 'desc'

    let tasks

    switch (status) {
      case 'available':
        tasks = await taskService.getAvailableTasks(userAddress || undefined)
        break
      case 'claimed':
        tasks = await taskService.getUserClaimedTasks(userAddress || '')
        break
      case 'in_progress':
        tasks = await taskService.getTasksInProgress()
        break
      case 'completed':
        tasks = await taskService.getCompletedTasks(limit)
        break
      default:
        // Show available tasks + user's claimed/in_progress tasks (if userAddress provided)
        tasks = await taskService.getUserRelevantTasks(userAddress || undefined)
    }

    // Apply taxonomy filters if provided
    if (tasks && tasks.length > 0) {
      // Filter by domain
      if (domain) {
        tasks = tasks.filter((t: { domain?: string | null }) => t.domain === domain)
      }

      // Filter by category
      if (category) {
        tasks = tasks.filter((t: { category?: string | null }) => t.category === category)
      }

      // Filter by task type
      if (taskType) {
        tasks = tasks.filter((t: { task_type?: string | null }) => t.task_type === taskType)
      }

      // Filter featured tasks
      if (isFeatured) {
        tasks = tasks.filter((t: { is_featured?: boolean }) => t.is_featured === true)
      }

      // Filter urgent tasks
      if (isUrgent) {
        tasks = tasks.filter((t: { is_urgent?: boolean }) => t.is_urgent === true)
      }

      // Sort tasks
      tasks = tasks.sort((a: { reward_cgc?: number; complexity?: number; created_at?: string }, b: { reward_cgc?: number; complexity?: number; created_at?: string }) => {
        let compareValue = 0
        switch (sortBy) {
          case 'reward':
            compareValue = (b.reward_cgc || 0) - (a.reward_cgc || 0)
            break
          case 'complexity':
            compareValue = (b.complexity || 0) - (a.complexity || 0)
            break
          case 'created':
            compareValue = new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
            break
          default:
            compareValue = (b.reward_cgc || 0) - (a.reward_cgc || 0)
        }
        return sortOrder === 'asc' ? -compareValue : compareValue
      })
    }

    // Calculate stats by domain for the response
    const domainStats: Record<string, number> = {}
    if (tasks && tasks.length > 0) {
      for (const task of tasks) {
        const taskDomain = (task as { domain?: string }).domain || 'development'
        domainStats[taskDomain] = (domainStats[taskDomain] || 0) + 1
      }
    }

    return NextResponse.json({
      success: true,
      data: tasks,
      count: tasks.length,
      stats: {
        byDomain: domainStats,
        total: tasks.length,
        featured: tasks.filter((t: { is_featured?: boolean }) => t.is_featured).length,
        urgent: tasks.filter((t: { is_urgent?: boolean }) => t.is_urgent).length,
      },
    })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch tasks',
        errorType: error instanceof Error ? error.constructor.name : 'Unknown',
      },
      { status: 500 }
    )
  }
})

export const POST = authHelpers.protected(async (request: NextRequest) => {
  try {
    const body = await request.json()
    const { action } = body

    if (action === 'initialize') {
      // Initialize tasks (only for admin)
      const authHeader = request.headers.get('authorization')
      if (!authHeader || !authHeader.includes('admin-key')) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        )
      }

      const taskService = new TaskService()
      await taskService.initializeTasks()
      
      return NextResponse.json({
        success: true,
        message: 'Tasks initialized successfully',
      })
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error in tasks POST:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Operation failed',
      },
      { status: 500 }
    )
  }
})