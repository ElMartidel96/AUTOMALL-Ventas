/**
 * 🎁 SIGNUP BONUS API
 *
 * POST - Distribute signup bonus to new user and referrer commissions
 * GET - Check bonus status for a wallet
 *
 * @endpoint /api/referrals/bonus
 *
 * SECURITY: POST requires wallet authentication via x-wallet-address header
 * and verifies the authenticated wallet matches the request body wallet.
 */

import { NextRequest, NextResponse } from 'next/server';
import { authHelpers, type AuthContext } from '@/lib/auth/middleware';
import {
  distributeSignupBonus,
  getSignupBonusStatus,
  checkTreasuryStatus,
  getReferrerCommissionSummary,
  SIGNUP_BONUS_AMOUNT,
  SIGNUP_COMMISSIONS,
  MAX_DISTRIBUTION_PER_SIGNUP,
} from '@/lib/referrals/signup-bonus-service';

// GET /api/referrals/bonus?wallet=0x...
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');
    const type = searchParams.get('type') || 'status';

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

    // Different query types
    if (type === 'treasury') {
      // Check treasury status (admin only in production)
      const treasury = await checkTreasuryStatus();
      return NextResponse.json({
        success: true,
        data: treasury,
      });
    }

    if (type === 'commissions') {
      // Get referrer commission summary
      const summary = await getReferrerCommissionSummary(wallet);
      return NextResponse.json({
        success: true,
        data: summary,
      });
    }

    // Default: Get signup bonus status
    const status = await getSignupBonusStatus(wallet);

    return NextResponse.json({
      success: true,
      data: {
        ...status,
        bonusAmount: SIGNUP_BONUS_AMOUNT,
        commissionRates: {
          level1: SIGNUP_COMMISSIONS.level1,
          level2: SIGNUP_COMMISSIONS.level2,
          level3: SIGNUP_COMMISSIONS.level3,
        },
        maxDistribution: MAX_DISTRIBUTION_PER_SIGNUP,
      },
    });
  } catch (error) {
    console.error('Error checking bonus status:', error);
    return NextResponse.json(
      { error: 'Failed to check bonus status' },
      { status: 500 }
    );
  }
}

// POST /api/referrals/bonus - Distribute signup bonus
// SECURITY: Requires wallet authentication and ownership verification
export const POST = authHelpers.protected(async (request: NextRequest, context: AuthContext) => {
  try {
    const body = await request.json();
    const { wallet, referralCode } = body;

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    if (!referralCode) {
      return NextResponse.json(
        { error: 'Referral code is required' },
        { status: 400 }
      );
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }

    // SECURITY: Verify the authenticated wallet matches the request wallet
    // This prevents attackers from claiming bonus for other wallets
    const authenticatedWallet = context.address?.toLowerCase();
    const requestedWallet = wallet.toLowerCase();

    if (authenticatedWallet !== requestedWallet) {
      console.warn(`[BonusAPI] SECURITY: Wallet mismatch - Auth: ${authenticatedWallet}, Request: ${requestedWallet}`);
      return NextResponse.json(
        { error: 'Unauthorized: You can only claim bonus for your own wallet' },
        { status: 403 }
      );
    }

    // Check if bonus was already distributed
    const existingStatus = await getSignupBonusStatus(wallet);
    if (existingStatus.received) {
      return NextResponse.json({
        success: true,
        data: {
          alreadyReceived: true,
          txHash: existingStatus.txHash,
          receivedAt: existingStatus.receivedAt,
          amount: existingStatus.amount,
        },
      });
    }

    // Check if user is eligible (came from referral)
    if (!existingStatus.eligible) {
      return NextResponse.json({
        success: false,
        error: 'User is not eligible for signup bonus (no referral found)',
      }, { status: 400 });
    }

    // Distribute the bonus
    console.log(`[BonusAPI] Distributing bonus to ${wallet} via code ${referralCode}`);
    const result = await distributeSignupBonus(wallet, referralCode);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        errors: result.errors,
        partialResult: {
          newUserBonus: result.newUserBonus,
          referrerCommissions: result.referrerCommissions,
          totalDistributed: result.totalDistributed,
        },
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        newUserBonus: result.newUserBonus,
        referrerCommissions: result.referrerCommissions,
        totalDistributed: result.totalDistributed,
        message: `Successfully distributed ${result.totalDistributed} CGC`,
      },
    });

  } catch (error) {
    console.error('Error distributing bonus:', error);
    return NextResponse.json(
      { error: 'Failed to distribute bonus' },
      { status: 500 }
    );
  }
});
