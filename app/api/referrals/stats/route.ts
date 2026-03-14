/**
 * 📊 REFERRAL STATS API
 *
 * GET - Get comprehensive referral statistics for a wallet
 *
 * @endpoint /api/referrals/stats
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getReferralStats,
  getClickAnalytics,
  COMMISSION_RATES,
  MILESTONE_BONUSES,
} from '@/lib/referrals/referral-service';

// GET /api/referrals/stats?wallet=0x...
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');
    const includeAnalytics = searchParams.get('analytics') === 'true';
    const analyticsDays = parseInt(searchParams.get('days') || '30');

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

    // Get main stats
    const stats = await getReferralStats(wallet);

    // Calculate next milestone
    const milestones = Object.entries(MILESTONE_BONUSES)
      .map(([count, bonus]) => ({
        count: parseInt(count),
        bonus,
        reached: stats.totalReferrals >= parseInt(count),
      }))
      .sort((a, b) => a.count - b.count);

    const nextMilestone = milestones.find(m => !m.reached);
    const reachedMilestones = milestones.filter(m => m.reached);

    // Build response
    const response: any = {
      success: true,
      data: {
        // Core stats
        referralCode: stats.code,
        totalReferrals: stats.totalReferrals,
        activeReferrals: stats.activeReferrals,
        pendingRewards: stats.pendingRewards,
        totalEarned: stats.totalEarned,

        // Network breakdown
        network: {
          level1: stats.level1Count,
          level2: stats.level2Count,
          level3: stats.level3Count,
          total: stats.level1Count + stats.level2Count + stats.level3Count,
        },

        // Commission structure
        commissionRates: {
          level1: COMMISSION_RATES[1] * 100,
          level2: COMMISSION_RATES[2] * 100,
          level3: COMMISSION_RATES[3] * 100,
        },

        // Milestones
        milestones: {
          reached: reachedMilestones,
          next: nextMilestone || null,
          progress: nextMilestone
            ? Math.round((stats.totalReferrals / nextMilestone.count) * 100)
            : 100,
        },

        // Engagement
        engagement: {
          clickCount: stats.clickCount,
          conversionRate: stats.conversionRate,
        },

        // Ranking
        rank: stats.rank,
      },
    };

    // Include analytics if requested
    if (includeAnalytics) {
      const analytics = await getClickAnalytics(wallet, { days: analyticsDays });
      response.data.analytics = {
        totalClicks: analytics.totalClicks,
        uniqueVisitors: analytics.uniqueVisitors,
        conversions: analytics.conversions,
        conversionRate: analytics.conversionRate,
        bySource: analytics.bySource,
        byDevice: analytics.byDevice,
        byCountry: analytics.byCountry,
        dailyTrend: analytics.dailyClicks,
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);

    // Handle missing table gracefully (referral system not yet configured in Supabase)
    if (errMsg.includes('schema cache') || errMsg.includes('referral_codes') || errMsg.includes('referrals') || errMsg.includes('42P01')) {
      return NextResponse.json({
        success: true,
        data: {
          referralCode: null,
          totalReferrals: 0,
          activeReferrals: 0,
          pendingRewards: 0,
          totalEarned: 0,
          network: { level1: 0, level2: 0, level3: 0, total: 0 },
          commissionRates: { level1: 10, level2: 5, level3: 2.5 },
          milestones: { reached: [], next: null, progress: 0 },
          engagement: { clickCount: 0, conversionRate: 0 },
          rank: null,
          system_status: 'not_configured',
          message: 'Referral system is being set up. This feature will be available soon.',
        },
      });
    }

    console.error('Error fetching referral stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch referral statistics' },
      { status: 500 }
    );
  }
}
