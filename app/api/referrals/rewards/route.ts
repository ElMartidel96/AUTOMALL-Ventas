/**
 * 💰 REFERRAL REWARDS API
 *
 * GET - Get reward history for a wallet
 * POST - Claim pending rewards (initiates blockchain payment)
 *
 * @endpoint /api/referrals/rewards
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getRewardHistory,
  getPendingRewards,
  processReward,
  batchProcessRewards,
  COMMISSION_RATES,
  MILESTONE_BONUSES,
} from '@/lib/referrals/referral-service';
import type { ReferralRewardType } from '@/lib/supabase/types';

// Helper to format reward type for display
function formatRewardType(type: ReferralRewardType): string {
  const typeLabels: Record<ReferralRewardType, string> = {
    direct_bonus: 'Level 1 Commission (10%)',
    level2_bonus: 'Level 2 Commission (5%)',
    level3_bonus: 'Level 3 Commission (2.5%)',
    milestone_5: 'Milestone Bonus: 5 Referrals',
    milestone_10: 'Milestone Bonus: 10 Referrals',
    milestone_25: 'Milestone Bonus: 25 Referrals',
    milestone_50: 'Milestone Bonus: 50 Referrals',
    milestone_100: 'Milestone Bonus: 100 Referrals',
    activation_bonus: 'Activation Bonus',
    special_bonus: 'Special Bonus',
    // Signup bonus system rewards
    signup_bonus: 'Signup Welcome Bonus (200 CGC)',
    signup_commission_l1: 'Signup Commission L1 (20 CGC)',
    signup_commission_l2: 'Signup Commission L2 (10 CGC)',
    signup_commission_l3: 'Signup Commission L3 (5 CGC)',
  };
  return typeLabels[type] || type;
}

// GET /api/referrals/rewards?wallet=0x...&status=pending&type=direct_bonus&limit=50&offset=0
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');
    const status = searchParams.get('status');
    const type = searchParams.get('type') as ReferralRewardType | null;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }

    const validLimit = Math.min(Math.max(1, limit), 100);

    const { rewards, total } = await getRewardHistory(wallet, {
      status: status || undefined,
      type: type || undefined,
      limit: validLimit,
      offset: Math.max(0, offset),
    });

    // Calculate summary statistics
    const summary = {
      totalRewards: total,
      totalAmount: rewards.reduce((sum, r) => sum + Number(r.amount), 0),
      byStatus: {
        pending: rewards.filter(r => r.status === 'pending').length,
        processing: rewards.filter(r => r.status === 'processing').length,
        paid: rewards.filter(r => r.status === 'paid').length,
        failed: rewards.filter(r => r.status === 'failed').length,
      },
      byType: {
        commission: rewards.filter(r =>
          ['direct_bonus', 'level2_bonus', 'level3_bonus'].includes(r.reward_type)
        ).length,
        milestone: rewards.filter(r => r.reward_type.startsWith('milestone_')).length,
        other: rewards.filter(r =>
          ['activation_bonus', 'special_bonus'].includes(r.reward_type)
        ).length,
      },
      pendingAmount: rewards
        .filter(r => r.status === 'pending')
        .reduce((sum, r) => sum + Number(r.amount), 0),
    };

    // Format rewards for response
    const formattedRewards = rewards.map(reward => ({
      id: reward.id,
      type: reward.reward_type,
      typeLabel: formatRewardType(reward.reward_type),
      amount: Number(reward.amount),
      status: reward.status,
      referredAddress: reward.referred_address,
      referredAddressShort: `${reward.referred_address.slice(0, 6)}...${reward.referred_address.slice(-4)}`,
      taskId: reward.task_id,
      milestoneReached: reward.milestone_reached,
      txHash: reward.tx_hash,
      paidAt: reward.paid_at,
      createdAt: reward.created_at,
    }));

    return NextResponse.json({
      success: true,
      data: {
        rewards: formattedRewards,
        summary,
        pagination: {
          total,
          limit: validLimit,
          offset,
          hasMore: offset + validLimit < total,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching reward history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reward history' },
      { status: 500 }
    );
  }
}

// POST /api/referrals/rewards - Request reward payout
// This is typically called by the admin or a cron job
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, rewardIds, txHash, blockNumber, wallet } = body;

    // Admin authentication would go here
    // For now, this endpoint is protected by API key or admin wallet signature

    switch (action) {
      case 'get_pending': {
        // Get all pending rewards for processing
        const { rewards, total, totalAmount } = await getPendingRewards({
          limit: 100,
        });

        return NextResponse.json({
          success: true,
          data: {
            rewards: rewards.map(r => ({
              id: r.id,
              referrer: r.referrer_address,
              amount: Number(r.amount),
              type: r.reward_type,
            })),
            total,
            totalAmount,
          },
        });
      }

      case 'process_single': {
        // Mark a single reward as paid
        if (!rewardIds || !rewardIds[0] || !txHash || !blockNumber) {
          return NextResponse.json(
            { error: 'rewardIds[0], txHash, and blockNumber are required' },
            { status: 400 }
          );
        }

        const processed = await processReward(rewardIds[0], txHash, blockNumber);

        if (!processed) {
          return NextResponse.json(
            { error: 'Failed to process reward' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          data: {
            processed: 1,
            reward: {
              id: processed.id,
              amount: Number(processed.amount),
              status: processed.status,
            },
          },
        });
      }

      case 'process_batch': {
        // Mark multiple rewards as paid (batch payment)
        if (!rewardIds || !Array.isArray(rewardIds) || !txHash || !blockNumber) {
          return NextResponse.json(
            { error: 'rewardIds array, txHash, and blockNumber are required' },
            { status: 400 }
          );
        }

        const processedCount = await batchProcessRewards(
          rewardIds,
          txHash,
          blockNumber
        );

        return NextResponse.json({
          success: true,
          data: {
            processed: processedCount,
            txHash,
          },
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: get_pending, process_single, or process_batch' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error processing rewards:', error);
    return NextResponse.json(
      { error: 'Failed to process rewards' },
      { status: 500 }
    );
  }
}
