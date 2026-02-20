/**
 * 🎯 REFERRAL ACTIVATION API
 *
 * Activates a referral when they qualify for AutoMALL rewards.
 * Auto-activates referrals for USD reward tracking.
 *
 * POST - Activate a referral (auto-activation for USD rewards)
 *
 * @endpoint /api/referrals/activate
 */

import { NextRequest, NextResponse } from 'next/server';
// Blockchain activation preserved but disabled for USD rewards
// import { createPublicClient, http, formatEther } from 'viem';
// import { base } from 'viem/chains';
import { getTypedClient, clearCache } from '@/lib/supabase/client';

// Blockchain activation preserved but disabled for USD rewards
// const CGC_TOKEN_ADDRESS = '0x5e3a61b550328f3D8C44f60b3e10a49D3d806175';

// Minimum balance check disabled - auto-activate for USD rewards
// const MIN_ACTIVATION_BALANCE = BigInt(1);

// Blockchain activation preserved but disabled for USD rewards
// const ERC20_ABI = [
//   {
//     name: 'balanceOf',
//     type: 'function',
//     stateMutability: 'view',
//     inputs: [{ name: 'account', type: 'address' }],
//     outputs: [{ name: '', type: 'uint256' }],
//   },
// ] as const;

// Blockchain activation preserved but disabled for USD rewards
// const publicClient = createPublicClient({
//   chain: base,
//   transport: http('https://mainnet.base.org'),
// });

// Blockchain activation preserved but disabled for USD rewards
// async function getCGCBalance(address: string): Promise<bigint> {
//   try {
//     const balance = await publicClient.readContract({
//       address: CGC_TOKEN_ADDRESS,
//       abi: ERC20_ABI,
//       functionName: 'balanceOf',
//       args: [address as `0x${string}`],
//     });
//     return balance;
//   } catch (error) {
//     console.error('Error checking CGC balance:', error);
//     return BigInt(0);
//   }
// }

/**
 * POST /api/referrals/activate
 *
 * Auto-activates a referral for AutoMALL USD rewards.
 * Can be called by:
 * - The system upon referral signup
 * - A cron job to periodically check pending referrals
 *
 * Body: { wallet: string } - The wallet address to check and activate
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { wallet } = body;

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet address is required', success: false },
        { status: 400 }
      );
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
      return NextResponse.json(
        { error: 'Invalid wallet address format', success: false },
        { status: 400 }
      );
    }

    const normalizedWallet = wallet.toLowerCase();
    const supabase = getTypedClient();

    // Check if this wallet is a pending referral
    const { data: referrals, error: fetchError } = await supabase
      .from('referrals')
      .select('*')
      .eq('referred_address', normalizedWallet)
      .eq('status', 'pending');

    if (fetchError) {
      console.error('Error fetching referrals:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch referral data', success: false },
        { status: 500 }
      );
    }

    if (!referrals || referrals.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          activated: false,
          reason: 'No pending referrals found for this wallet',
        },
      });
    }

    // Auto-activate for AutoMALL USD rewards
    const hasMinBalance = true; // Auto-activate for AutoMALL USD rewards

    if (!hasMinBalance) {
      return NextResponse.json({
        success: true,
        data: {
          activated: false,
          reason: 'Referral not yet activated',
        },
      });
    }

    // Activate all referral relationships for this user
    const activationTime = new Date().toISOString();
    const { data: updated, error: updateError } = await supabase
      .from('referrals')
      .update({
        status: 'active',
        activated_at: activationTime,
        last_activity: activationTime,
        cgc_earned: 0, // USD rewards tracked separately
      })
      .eq('referred_address', normalizedWallet)
      .eq('status', 'pending')
      .select();

    if (updateError) {
      console.error('Error activating referrals:', updateError);
      return NextResponse.json(
        { error: 'Failed to activate referral', success: false },
        { status: 500 }
      );
    }

    // Update the referral code stats (increment active count)
    if (updated && updated.length > 0) {
      const level1Referral = updated.find((r: { level: number }) => r.level === 1);
      if (level1Referral) {
        // Increment total_referrals on the referrer's code if this is the first activation
        await supabase.rpc('increment_referral_count', {
          p_wallet: level1Referral.referrer_address,
        }).catch(() => {
          // RPC might not exist, ignore
        });

        // Note: total_referrals increment is handled by the RPC function above
        // If RPC doesn't exist, the increment will be skipped (acceptable fallback)
      }
    }

    // Clear cache to reflect new stats
    clearCache('referral_stats');

    console.log('✅ Referral activated:', {
      wallet: normalizedWallet.slice(0, 6) + '...' + normalizedWallet.slice(-4),
      referralsActivated: updated?.length || 0,
    });

    return NextResponse.json({
      success: true,
      data: {
        activated: true,
        wallet: normalizedWallet,
        referralsActivated: updated?.length || 0,
        activatedAt: activationTime,
      },
    });
  } catch (error) {
    console.error('❌ Referral activation failed:', error);
    return NextResponse.json(
      { error: 'Failed to activate referral', success: false },
      { status: 500 }
    );
  }
}

/**
 * GET /api/referrals/activate
 *
 * Check activation status for a wallet
 * Query: ?wallet=0x...
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet address is required', success: false },
        { status: 400 }
      );
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
      return NextResponse.json(
        { error: 'Invalid wallet address format', success: false },
        { status: 400 }
      );
    }

    const normalizedWallet = wallet.toLowerCase();
    const supabase = getTypedClient();

    // Get referral status for this wallet
    const { data: referrals, error } = await supabase
      .from('referrals')
      .select('id, referrer_address, level, status, activated_at, joined_at')
      .eq('referred_address', normalizedWallet)
      .eq('level', 1) // Only get direct referral
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching referral status:', error);
      return NextResponse.json(
        { error: 'Failed to fetch referral status', success: false },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        hasReferrer: !!referrals,
        isActive: referrals?.status === 'active',
        status: referrals?.status || null,
        activatedAt: referrals?.activated_at || null,
        joinedAt: referrals?.joined_at || null,
      },
    });
  } catch (error) {
    console.error('❌ Activation status check failed:', error);
    return NextResponse.json(
      { error: 'Failed to check activation status', success: false },
      { status: 500 }
    );
  }
}
