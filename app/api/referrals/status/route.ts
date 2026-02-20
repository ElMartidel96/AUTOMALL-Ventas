/**
 * 📊 REFERRAL STATUS API
 *
 * Check if a wallet address is already registered as a referral.
 * Used by the frontend to verify status on page load and prevent
 * duplicate registration attempts.
 *
 * @endpoint GET /api/referrals/status?wallet=0x...
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTypedClient } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');

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

    const supabase = getTypedClient();
    const normalizedWallet = wallet.toLowerCase();

    // Check if user is already referred (has a referrer)
    const { data: referral, error } = await supabase
      .from('referrals')
      .select('id, referrer_address, referral_code, level, status, created_at')
      .eq('referred_address', normalizedWallet)
      .eq('level', 1) // Only check direct referral (level 1)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned (not found), which is fine
      console.error('Error checking referral status:', error);
      return NextResponse.json(
        { error: 'Failed to check referral status' },
        { status: 500 }
      );
    }

    // Check if user has their own referral code
    const { data: ownCode } = await supabase
      .from('referral_codes')
      .select('code, custom_code, is_active')
      .eq('wallet_address', normalizedWallet)
      .single();

    // Check if user has received any referral rewards
    const { data: rewards } = await supabase
      .from('referral_rewards')
      .select('id, amount, reward_type, is_paid, created_at')
      .eq('wallet_address', normalizedWallet)
      .order('created_at', { ascending: false })
      .limit(5);

    return NextResponse.json({
      success: true,
      data: {
        // Whether this wallet was referred by someone
        isReferred: !!referral,
        referral: referral ? {
          referrerAddress: referral.referrer_address,
          referralCode: referral.referral_code,
          status: referral.status,
          registeredAt: referral.created_at,
        } : null,

        // User's own referral code
        hasOwnCode: !!ownCode,
        ownCode: ownCode ? {
          code: ownCode.custom_code || ownCode.code,
          isActive: ownCode.is_active,
        } : null,

        // Recent rewards received
        recentRewards: rewards || [],
      },
    });
  } catch (error) {
    console.error('Error in referral status API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
