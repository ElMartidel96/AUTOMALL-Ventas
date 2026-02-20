/**
 * 🔗 REFERRAL CODE API
 *
 * GET - Get or create referral code for a wallet
 * POST - Set custom referral code (for influencers/VIPs)
 *
 * @endpoint /api/referrals/code
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getOrCreateReferralCode,
  setCustomCode,
  getReferralCodeByCode,
} from '@/lib/referrals/referral-service';

// GET /api/referrals/code?wallet=0x... or ?code=CG-XXXXXX
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');
    const code = searchParams.get('code');

    if (!wallet && !code) {
      return NextResponse.json(
        { error: 'Either wallet address or code is required' },
        { status: 400 }
      );
    }

    let referralCode;

    if (code) {
      // Lookup by code
      referralCode = await getReferralCodeByCode(code);
      if (!referralCode) {
        return NextResponse.json(
          { error: 'Referral code not found' },
          { status: 404 }
        );
      }
    } else if (wallet) {
      // Get or create for wallet
      if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
        return NextResponse.json(
          { error: 'Invalid wallet address format' },
          { status: 400 }
        );
      }
      referralCode = await getOrCreateReferralCode(wallet);
    }

    return NextResponse.json({
      success: true,
      data: {
        code: referralCode!.custom_code || referralCode!.code,
        canonicalCode: referralCode!.code,
        customCode: referralCode!.custom_code,
        walletAddress: referralCode!.wallet_address,
        isActive: referralCode!.is_active,
        totalReferrals: referralCode!.total_referrals,
        totalEarnings: Number(referralCode!.total_earnings),
        clickCount: referralCode!.click_count,
        createdAt: referralCode!.created_at,
      },
    });
  } catch (error) {
    console.error('Error in referral code API:', error);
    return NextResponse.json(
      { error: 'Failed to process referral code request' },
      { status: 500 }
    );
  }
}

// POST /api/referrals/code - Set custom code
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { wallet, customCode } = body;

    if (!wallet || !customCode) {
      return NextResponse.json(
        { error: 'Wallet address and custom code are required' },
        { status: 400 }
      );
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }

    if (!/^[A-Za-z0-9]{4,20}$/.test(customCode)) {
      return NextResponse.json(
        { error: 'Custom code must be 4-20 alphanumeric characters' },
        { status: 400 }
      );
    }

    const referralCode = await setCustomCode(wallet, customCode);

    return NextResponse.json({
      success: true,
      data: {
        code: referralCode.custom_code || referralCode.code,
        customCode: referralCode.custom_code,
        message: 'Custom code set successfully',
      },
    });
  } catch (error: any) {
    console.error('Error setting custom code:', error);

    if (error.message?.includes('already taken')) {
      return NextResponse.json(
        { error: 'Custom code is already taken' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to set custom code' },
      { status: 500 }
    );
  }
}
