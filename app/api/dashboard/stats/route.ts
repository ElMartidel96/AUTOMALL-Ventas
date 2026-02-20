import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';

// In-memory cache to prevent excessive database calls
interface CachedStats {
  data: DashboardDBStats;
  timestamp: number;
}
let cachedStats: CachedStats | null = null;
const CACHE_TTL_MS = 30 * 1000; // 30 seconds cache

// Type definitions for Supabase query results
interface ProposalRow {
  status: string;
}

interface TaskRow {
  status: string;
  reward_cgc: number | null;
}

interface CollaboratorRow {
  is_active: boolean;
  tasks_completed: number;
}

interface CompletedTaskRow {
  reward_cgc: number | null;
}

export interface DashboardDBStats {
  // Proposals
  proposalsActive: number;
  proposalsPending: number;
  proposalsApproved: number;
  proposalsRejected: number;
  proposalsTotal: number;

  // Tasks
  tasksCompleted: number;
  tasksActive: number;  // claimed + in_progress
  tasksAvailable: number;
  tasksSubmitted: number;
  tasksTotal: number;

  // Rewards distributed
  totalCGCDistributed: number;

  // Collaborators
  activeCollaborators: number;
  totalCollaborators: number;
}

export async function GET() {
  try {
    // Check cache first
    const now = Date.now();
    if (cachedStats && (now - cachedStats.timestamp) < CACHE_TTL_MS) {
      return NextResponse.json({
        success: true,
        data: cachedStats.data,
        cached: true,
        updatedAt: new Date(cachedStats.timestamp).toISOString(),
      });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Database not configured',
      }, { status: 500 });
    }

    // Fetch all stats in parallel
    const [
      proposalsResult,
      tasksResult,
      collaboratorsResult,
      rewardsResult,
    ] = await Promise.all([
      // Proposals stats
      supabaseAdmin
        .from('task_proposals')
        .select('status', { count: 'exact' }),

      // Tasks stats
      supabaseAdmin
        .from('tasks')
        .select('status, reward_cgc', { count: 'exact' }),

      // Collaborators stats
      supabaseAdmin
        .from('collaborators')
        .select('is_active, tasks_completed', { count: 'exact' }),

      // Completed task rewards
      supabaseAdmin
        .from('tasks')
        .select('reward_cgc')
        .eq('status', 'completed'),
    ]);

    // Calculate proposal stats
    const proposals = (proposalsResult.data || []) as ProposalRow[];
    const proposalsPending = proposals.filter((p: ProposalRow) => p.status === 'pending').length;
    const proposalsReviewing = proposals.filter((p: ProposalRow) => p.status === 'reviewing').length;
    const proposalsApproved = proposals.filter((p: ProposalRow) => p.status === 'approved').length;
    const proposalsRejected = proposals.filter((p: ProposalRow) => p.status === 'rejected').length;

    // Calculate task stats
    const tasks = (tasksResult.data || []) as TaskRow[];
    const tasksCompleted = tasks.filter((t: TaskRow) => t.status === 'completed').length;
    const tasksValidated = tasks.filter((t: TaskRow) => t.status === 'validated').length;
    const tasksClaimed = tasks.filter((t: TaskRow) => t.status === 'claimed').length;
    const tasksInProgress = tasks.filter((t: TaskRow) => t.status === 'in_progress').length;
    const tasksSubmitted = tasks.filter((t: TaskRow) => t.status === 'submitted').length;
    const tasksAvailable = tasks.filter((t: TaskRow) => t.status === 'available').length;

    // Calculate collaborator stats
    const collaborators = (collaboratorsResult.data || []) as CollaboratorRow[];
    const activeCollaborators = collaborators.filter((c: CollaboratorRow) => c.is_active).length;

    // Calculate total CGC distributed
    const completedTasks = (rewardsResult.data || []) as CompletedTaskRow[];
    const totalCGCDistributed = completedTasks.reduce((sum: number, t: CompletedTaskRow) => sum + (t.reward_cgc || 0), 0);

    const stats: DashboardDBStats = {
      // Proposals
      proposalsActive: proposalsPending + proposalsReviewing,
      proposalsPending,
      proposalsApproved,
      proposalsRejected,
      proposalsTotal: proposals.length,

      // Tasks
      tasksCompleted: tasksCompleted + tasksValidated, // Both count as completed for display
      tasksActive: tasksClaimed + tasksInProgress,
      tasksAvailable,
      tasksSubmitted,
      tasksTotal: tasks.length,

      // Rewards
      totalCGCDistributed,

      // Collaborators
      activeCollaborators,
      totalCollaborators: collaborators.length,
    };

    // Update cache
    cachedStats = { data: stats, timestamp: now };

    return NextResponse.json({
      success: true,
      data: stats,
      cached: false,
      updatedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Dashboard Stats API] Error:', error);

    // Return cached data if available
    if (cachedStats) {
      return NextResponse.json({
        success: true,
        data: cachedStats.data,
        cached: true,
        stale: true,
        updatedAt: new Date(cachedStats.timestamp).toISOString(),
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to fetch dashboard stats',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
