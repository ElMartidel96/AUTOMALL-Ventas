/**
 * 🔄 Sync Collaborators API
 *
 * Recalculates collaborator statistics from completed tasks
 * Ensures data consistency between tasks and collaborators tables
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

interface CollaboratorStats {
  wallet_address: string
  total_cgc_earned: number
  tasks_completed: number
  task_titles: string[]
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase()

    // 1. Get all completed tasks with assignee
    const { data: completedTasks, error: tasksError } = await supabase
      .from('tasks')
      .select('task_id, title, reward_cgc, assignee_address, completed_at')
      .eq('status', 'completed')
      .not('assignee_address', 'is', null)

    if (tasksError) {
      return NextResponse.json({ error: tasksError.message }, { status: 500 })
    }

    if (!completedTasks || completedTasks.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No completed tasks found',
        synced: 0
      })
    }

    // 2. Aggregate by wallet address
    const statsMap = new Map<string, CollaboratorStats>()

    for (const task of completedTasks) {
      if (!task.assignee_address) continue

      const address = task.assignee_address.toLowerCase()
      const existing: CollaboratorStats = statsMap.get(address) || {
        wallet_address: address,
        total_cgc_earned: 0,
        tasks_completed: 0,
        task_titles: [] as string[]
      }

      existing.total_cgc_earned += task.reward_cgc || 0
      existing.tasks_completed += 1
      existing.task_titles.push(task.title as string)

      statsMap.set(address, existing)
    }

    // 3. Upsert collaborators
    const results = []

    for (const [address, stats] of statsMap.entries()) {
      // Check if collaborator exists
      const { data: existing } = await supabase
        .from('collaborators')
        .select('id')
        .eq('wallet_address', address)
        .single()

      if (existing) {
        // Update existing
        const { error: updateError } = await supabase
          .from('collaborators')
          .update({
            total_cgc_earned: stats.total_cgc_earned,
            tasks_completed: stats.tasks_completed,
            is_active: true,
            last_activity: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('wallet_address', address)

        results.push({
          address,
          action: 'updated',
          success: !updateError,
          stats
        })
      } else {
        // Create new
        const { error: insertError } = await supabase
          .from('collaborators')
          .insert({
            wallet_address: address,
            total_cgc_earned: stats.total_cgc_earned,
            tasks_completed: stats.tasks_completed,
            tasks_in_progress: 0,
            reputation_score: stats.tasks_completed * 10, // Basic reputation
            is_active: true,
            joined_at: new Date().toISOString(),
            last_activity: new Date().toISOString()
          })

        results.push({
          address,
          action: 'created',
          success: !insertError,
          stats
        })
      }
    }

    // 4. Recalculate ranks if function exists
    try {
      await supabase.rpc('calculate_rank')
    } catch (e) {
      console.warn('calculate_rank function not available:', e)
    }

    const successful = results.filter(r => r.success).length

    return NextResponse.json({
      success: true,
      message: `Synced ${successful} collaborators from ${completedTasks.length} completed tasks`,
      synced: successful,
      totalCGC: Array.from(statsMap.values()).reduce((sum, s) => sum + s.total_cgc_earned, 0),
      results
    })

  } catch (error) {
    console.error('Error syncing collaborators:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sync failed' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const supabase = getSupabase()

    // Get stats for display
    const { data: completedTasks, error: tasksError } = await supabase
      .from('tasks')
      .select('task_id, title, reward_cgc, assignee_address, completed_at')
      .eq('status', 'completed')
      .not('assignee_address', 'is', null)

    const { data: collaborators, error: collabError } = await supabase
      .from('collaborators')
      .select('wallet_address, total_cgc_earned, tasks_completed')
      .order('total_cgc_earned', { ascending: false })

    // Calculate expected vs actual
    const expectedStats = new Map<string, { cgc: number; tasks: number }>()
    for (const task of completedTasks || []) {
      if (!task.assignee_address) continue
      const addr = task.assignee_address.toLowerCase()
      const existing = expectedStats.get(addr) || { cgc: 0, tasks: 0 }
      existing.cgc += task.reward_cgc || 0
      existing.tasks += 1
      expectedStats.set(addr, existing)
    }

    const actualStats = new Map<string, { cgc: number; tasks: number }>()
    for (const collab of collaborators || []) {
      if (!collab.wallet_address) continue
      actualStats.set(collab.wallet_address.toLowerCase(), {
        cgc: collab.total_cgc_earned || 0,
        tasks: collab.tasks_completed || 0
      })
    }

    // Find discrepancies
    const discrepancies = []
    for (const [addr, expected] of expectedStats.entries()) {
      const actual = actualStats.get(addr)
      if (!actual || actual.cgc !== expected.cgc || actual.tasks !== expected.tasks) {
        discrepancies.push({
          address: addr,
          expected,
          actual: actual || { cgc: 0, tasks: 0 },
          needsSync: true
        })
      }
    }

    return NextResponse.json({
      completedTasks: completedTasks?.length || 0,
      totalExpectedCGC: Array.from(expectedStats.values()).reduce((s: number, e: { cgc: number }) => s + e.cgc, 0),
      collaboratorsInDB: collaborators?.length || 0,
      totalActualCGC: collaborators?.reduce((s: number, c: { total_cgc_earned?: number }) => s + (c.total_cgc_earned || 0), 0) || 0,
      discrepancies,
      needsSync: discrepancies.length > 0
    })

  } catch (error) {
    console.error('Error getting sync status:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get status' },
      { status: 500 }
    )
  }
}
