/**
 * 🌐 REFERRAL NETWORK API
 *
 * GET - Get referral network tree for a wallet
 *
 * @endpoint /api/referrals/network
 */

import { NextRequest, NextResponse } from 'next/server';
import { getReferralNetwork } from '@/lib/referrals/referral-service';
import type { ReferralStatus } from '@/lib/supabase/types';

// GET /api/referrals/network?wallet=0x...&level=1&status=active&limit=50&offset=0
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');
    const level = searchParams.get('level');
    const status = searchParams.get('status') as ReferralStatus | null;
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

    // Validate limit
    const validLimit = Math.min(Math.max(1, limit), 100);

    const network = await getReferralNetwork(wallet, {
      level: level ? parseInt(level) : undefined,
      status: status || undefined,
      limit: validLimit,
      offset: Math.max(0, offset),
    });

    // Format addresses for privacy
    const formattedReferrals = network.referrals.map(ref => ({
      ...ref,
      addressShort: `${ref.address.slice(0, 6)}...${ref.address.slice(-4)}`,
    }));

    // Calculate network statistics
    const stats = {
      total: network.total,
      byLevel: {
        level1: network.referrals.filter(r => r.level === 1).length,
        level2: network.referrals.filter(r => r.level === 2).length,
        level3: network.referrals.filter(r => r.level === 3).length,
      },
      byStatus: {
        active: network.referrals.filter(r => r.status === 'active').length,
        pending: network.referrals.filter(r => r.status === 'pending').length,
        inactive: network.referrals.filter(r => r.status === 'inactive').length,
      },
      totalEarningsFromNetwork: network.referrals.reduce(
        (sum, r) => sum + r.referrerEarnings,
        0
      ),
    };

    return NextResponse.json({
      success: true,
      data: {
        referrals: formattedReferrals,
        stats,
        pagination: {
          total: network.total,
          limit: validLimit,
          offset,
          hasMore: offset + validLimit < network.total,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching referral network:', error);
    return NextResponse.json(
      { error: 'Failed to fetch referral network' },
      { status: 500 }
    );
  }
}
