/**
 * 📜 Task History API
 *
 * Returns completed tasks with assignee addresses and timestamps
 * Data is fetched dynamically from Supabase - NO hardcoded data
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Lazy initialization
let _supabase: ReturnType<typeof createClient> | null = null

function getSupabase() {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_DAO_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_DAO_SERVICE_KEY

    if (!url || !key) {
      throw new Error('Supabase configuration missing')
    }

    _supabase = createClient(url, key)
  }
  return _supabase
}

export interface HistoryEntry {
  id: string
  task_id: string
  title: string
  reward_cgc: number
  category: string | null
  priority: string
  assignee_address: string
  completed_at: string
  validated_at: string | null
  validator_address: string | null
  claimed_at: string | null
  evidence_url: string | null
  pr_url: string | null
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase()
    const { searchParams } = new URL(request.url)

    // Optional filters
    const wallet = searchParams.get('wallet')?.toLowerCase()
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query for completed tasks
    let query = supabase
      .from('tasks')
      .select(`
        id,
        task_id,
        title,
        reward_cgc,
        category,
        priority,
        assignee_address,
        completed_at,
        validated_at,
        validator_address,
        claimed_at,
        evidence_url,
        pr_url
      `)
      .eq('status', 'completed')
      .not('assignee_address', 'is', null)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Filter by wallet if provided
    if (wallet) {
      query = query.ilike('assignee_address', wallet)
    }

    const { data: completedTasks, error: tasksError, count } = await query

    if (tasksError) {
      console.error('Error fetching history:', tasksError)
      return NextResponse.json({ error: tasksError.message }, { status: 500 })
    }

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .not('assignee_address', 'is', null)
      .not('completed_at', 'is', null)

    // Calculate stats
    const totalCGC = completedTasks?.reduce((sum: number, t: { reward_cgc?: number }) => sum + (t.reward_cgc || 0), 0) || 0
    const uniqueWallets = new Set(completedTasks?.map((t: { assignee_address?: string }) => t.assignee_address?.toLowerCase()).filter(Boolean))

    return NextResponse.json({
      success: true,
      history: completedTasks || [],
      pagination: {
        total: totalCount || 0,
        limit,
        offset,
        hasMore: (offset + limit) < (totalCount || 0)
      },
      stats: {
        totalCompleted: totalCount || 0,
        totalCGCDistributed: totalCGC,
        uniqueContributors: uniqueWallets.size
      }
    })

  } catch (error) {
    console.error('Error in history API:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch history' },
      { status: 500 }
    )
  }
}
