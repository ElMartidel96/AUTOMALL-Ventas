/**
 * 📊 USER ACTIVITY API
 *
 * GET - Get recent activity for a user (tasks, rewards, referrals, logins)
 *
 * @endpoint /api/profile/activity?wallet=0x...
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Activity types
type ActivityType = 'task_completed' | 'reward_received' | 'referral_signup' | 'login' | 'profile_update';

interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  amount?: number;
  timestamp: string;
  metadata?: Record<string, any>;
}

// Lazy Supabase initialization
let supabase: ReturnType<typeof createClient> | null = null;

function getSupabase() {
  if (supabase) return supabase;

  const url = process.env.NEXT_PUBLIC_SUPABASE_DAO_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_DAO_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Supabase environment variables not configured');
  }

  supabase = createClient(url, key);
  return supabase;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet address is required', success: false },
        { status: 400 }
      );
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
      return NextResponse.json(
        { error: 'Invalid wallet address', success: false },
        { status: 400 }
      );
    }

    const db = getSupabase();
    const normalizedWallet = wallet.toLowerCase();
    const activities: ActivityItem[] = [];

    // 1. Fetch completed tasks
    const { data: tasks } = await db
      .from('task_assignments')
      .select(`
        id,
        completed_at,
        task_id,
        tasks:task_id (
          title,
          reward_amount
        )
      `)
      .eq('assignee', normalizedWallet)
      .eq('status', 'completed')
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(limit);

    if (tasks) {
      for (const task of tasks) {
        const taskInfo = task.tasks as any;
        activities.push({
          id: `task-${task.id}`,
          type: 'task_completed',
          title: 'Task Completed',
          description: taskInfo?.title || 'Unknown task',
          amount: taskInfo?.reward_amount || 0,
          timestamp: task.completed_at,
          metadata: { taskId: task.task_id },
        });
      }
    }

    // 2. Fetch rewards received
    const { data: rewards } = await db
      .from('referral_rewards')
      .select('id, reward_type, amount, paid_at, referred_address')
      .or(`referrer_address.eq.${normalizedWallet},referred_address.eq.${normalizedWallet}`)
      .eq('status', 'paid')
      .not('paid_at', 'is', null)
      .order('paid_at', { ascending: false })
      .limit(limit);

    if (rewards) {
      for (const reward of rewards) {
        const isRecipient = reward.referred_address === normalizedWallet && reward.reward_type === 'signup_bonus';
        activities.push({
          id: `reward-${reward.id}`,
          type: 'reward_received',
          title: isRecipient ? 'Signup Bonus Received' : 'Referral Commission',
          description: getRewardDescription(reward.reward_type),
          amount: Number(reward.amount),
          timestamp: reward.paid_at,
          metadata: { rewardType: reward.reward_type },
        });
      }
    }

    // 3. Fetch referral signups (as referrer)
    const { data: referrals } = await db
      .from('referrals')
      .select('id, referred_address, created_at, level')
      .eq('referrer_address', normalizedWallet)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (referrals) {
      for (const ref of referrals) {
        activities.push({
          id: `referral-${ref.id}`,
          type: 'referral_signup',
          title: `Level ${ref.level} Referral`,
          description: `New user signed up: ${ref.referred_address.slice(0, 6)}...${ref.referred_address.slice(-4)}`,
          timestamp: ref.created_at,
          metadata: { level: ref.level, referredAddress: ref.referred_address },
        });
      }
    }

    // 4. Fetch login history from profile
    const { data: profile } = await db
      .from('user_profiles')
      .select('last_login_at, login_count, updated_at')
      .eq('wallet_address', normalizedWallet)
      .single();

    if (profile?.last_login_at) {
      activities.push({
        id: `login-${profile.last_login_at}`,
        type: 'login',
        title: 'Profile Accessed',
        description: `Total logins: ${profile.login_count || 1}`,
        timestamp: profile.last_login_at,
      });
    }

    // Sort all activities by timestamp (most recent first)
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Limit to requested amount
    const limitedActivities = activities.slice(0, limit);

    return NextResponse.json({
      success: true,
      data: {
        activities: limitedActivities,
        total: limitedActivities.length,
        hasMore: activities.length > limit,
      },
    });
  } catch (error) {
    console.error('Error fetching activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity', success: false },
      { status: 500 }
    );
  }
}

function getRewardDescription(rewardType: string): string {
  switch (rewardType) {
    case 'signup_bonus':
      return 'Welcome bonus for joining CryptoGift DAO';
    case 'signup_commission_l1':
      return 'Level 1 referral commission (10%)';
    case 'signup_commission_l2':
      return 'Level 2 referral commission (5%)';
    case 'signup_commission_l3':
      return 'Level 3 referral commission (2.5%)';
    case 'task_reward':
      return 'Task completion reward';
    case 'milestone_bonus':
      return 'Milestone achievement bonus';
    default:
      return 'Reward received';
  }
}
