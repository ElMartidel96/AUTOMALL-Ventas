/**
 * 🏆 REFERRAL LEADERBOARD API
 *
 * GET - Get global referral leaderboard
 *
 * @endpoint /api/referrals/leaderboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { getLeaderboard, getReferralStats } from '@/lib/referrals/referral-service';

// GET /api/referrals/leaderboard?sortBy=earnings&limit=50&offset=0&wallet=0x...
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sortBy = (searchParams.get('sortBy') || 'earnings') as 'earnings' | 'referrals';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const wallet = searchParams.get('wallet'); // Optional: highlight user's position

    const validLimit = Math.min(Math.max(1, limit), 100);

    const { entries, total } = await getLeaderboard({
      sortBy,
      limit: validLimit,
      offset: Math.max(0, offset),
    });

    // Format entries for display
    const formattedEntries = entries.map(entry => ({
      rank: entry.rank,
      address: entry.address,
      addressShort: `${entry.address.slice(0, 6)}...${entry.address.slice(-4)}`,
      code: entry.code,
      totalReferrals: entry.totalReferrals,
      totalEarnings: entry.totalEarnings,
      network: {
        level1: entry.level1Count,
        level2: entry.level2Count,
        level3: entry.level3Count,
        total: entry.level1Count + entry.level2Count + entry.level3Count,
      },
      // Tier based on referrals
      tier: getTier(entry.totalReferrals),
    }));

    // Get current user's stats if wallet provided
    let userPosition = null;
    if (wallet && /^0x[a-fA-F0-9]{40}$/.test(wallet)) {
      try {
        const userStats = await getReferralStats(wallet);
        userPosition = {
          rank: userStats.rank,
          totalReferrals: userStats.totalReferrals,
          totalEarnings: userStats.totalEarned,
          code: userStats.code,
          isInTop: userStats.rank > 0 && userStats.rank <= validLimit,
        };
      } catch {
        // User might not have referral code yet
      }
    }

    // Calculate leaderboard statistics
    const leaderboardStats = {
      totalParticipants: total,
      totalReferrals: entries.reduce((sum, e) => sum + e.totalReferrals, 0),
      totalDistributed: entries.reduce((sum, e) => sum + e.totalEarnings, 0),
      topReferrer: entries[0] || null,
      averageReferrals: entries.length > 0
        ? Math.round(entries.reduce((sum, e) => sum + e.totalReferrals, 0) / entries.length)
        : 0,
    };

    return NextResponse.json({
      success: true,
      data: {
        leaderboard: formattedEntries,
        stats: leaderboardStats,
        userPosition,
        pagination: {
          total,
          limit: validLimit,
          offset,
          hasMore: offset + validLimit < total,
        },
        sortBy,
      },
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}

// Helper function to determine tier based on referrals
function getTier(referrals: number): {
  name: string;
  color: string;
  icon: string;
  minReferrals: number;
} {
  if (referrals >= 100) {
    return {
      name: 'Diamond',
      color: '#B9F2FF',
      icon: '💎',
      minReferrals: 100,
    };
  }
  if (referrals >= 50) {
    return {
      name: 'Platinum',
      color: '#E5E4E2',
      icon: '🏆',
      minReferrals: 50,
    };
  }
  if (referrals >= 25) {
    return {
      name: 'Gold',
      color: '#FFD700',
      icon: '🥇',
      minReferrals: 25,
    };
  }
  if (referrals >= 10) {
    return {
      name: 'Silver',
      color: '#C0C0C0',
      icon: '🥈',
      minReferrals: 10,
    };
  }
  if (referrals >= 5) {
    return {
      name: 'Bronze',
      color: '#CD7F32',
      icon: '🥉',
      minReferrals: 5,
    };
  }
  return {
    name: 'Starter',
    color: '#808080',
    icon: '⭐',
    minReferrals: 0,
  };
}
