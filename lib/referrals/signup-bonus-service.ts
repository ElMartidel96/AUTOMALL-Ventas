/**
 * 🎁 Signup Bonus Distribution Service
 *
 * Handles automatic USD reward distribution when new buyers register via referral links.
 *
 * Distribution Structure:
 * - New Buyer: $200 USD (signup_bonus)
 * - Level 1 Referrer: $20 USD (10% of 200)
 * - Level 2 Referrer: $10 USD (5% of 200)
 * - Level 3 Referrer: $5 USD (2.5% of 200)
 *
 * Maximum Total Distribution: $235 USD per referral signup
 *
 * @version 1.1.0
 * @author AutoMALL
 */

import { getTypedClient } from '@/lib/supabase/client';
// Web3 token transfers preserved but disabled for USD rewards
// import { transferCGC, batchTransferCGC, getDeployerCGCBalance, getDeployerETHBalance } from '@/lib/web3/token-transfer-service';
import { COMMISSION_RATES, createReward, getReferralCodeByCode } from './referral-service';
import type { ReferralRewardInsert } from '@/lib/supabase/types';

// =====================================================
// 📊 CONSTANTS & CONFIGURATION
// =====================================================

/** Base signup bonus for new buyers ($200 USD) */
export const SIGNUP_BONUS_AMOUNT = 200;

/** Minimum USD balance required to distribute bonuses */
export const MIN_TREASURY_BALANCE = 235;

/** Commission amounts based on SIGNUP_BONUS_AMOUNT */
export const SIGNUP_COMMISSIONS = {
  level1: SIGNUP_BONUS_AMOUNT * COMMISSION_RATES[1], // $20 USD
  level2: SIGNUP_BONUS_AMOUNT * COMMISSION_RATES[2], // $10 USD
  level3: SIGNUP_BONUS_AMOUNT * COMMISSION_RATES[3], // $5 USD
} as const;

/** Maximum total USD per referral signup */
export const MAX_DISTRIBUTION_PER_SIGNUP = SIGNUP_BONUS_AMOUNT +
  SIGNUP_COMMISSIONS.level1 +
  SIGNUP_COMMISSIONS.level2 +
  SIGNUP_COMMISSIONS.level3; // $235 USD

// =====================================================
// 🎯 TYPES
// =====================================================

export interface SignupBonusResult {
  success: boolean;
  newUserBonus?: {
    amount: number;
    txHash?: string;
    error?: string;
  };
  referrerCommissions: Array<{
    level: 1 | 2 | 3;
    address: string;
    amount: number;
    txHash?: string;
    error?: string;
  }>;
  totalDistributed: number;
  errors: string[];
}

export interface TreasuryStatus {
  cgcBalance: string;
  ethBalance: string;
  hasEnoughCGC: boolean;
  hasEnoughETH: boolean;
  estimatedSignupsAvailable: number;
}

// =====================================================
// 💰 CORE DISTRIBUTION FUNCTIONS
// =====================================================

/**
 * Check treasury status before distribution
 * USD rewards: blockchain balance checks disabled, always passes
 */
export async function checkTreasuryStatus(): Promise<TreasuryStatus> {
  // Web3 balance checks disabled for USD rewards
  // const [cgcStatus, ethStatus] = await Promise.all([
  //   getDeployerCGCBalance(),
  //   getDeployerETHBalance(),
  // ]);
  return { cgcBalance: 'N/A', ethBalance: 'N/A', hasEnoughCGC: true, hasEnoughETH: true, estimatedSignupsAvailable: 999 };
}

/**
 * Distribute signup bonus and referral commissions
 *
 * This function:
 * 1. Awards $200 USD to the new buyer
 * 2. Awards commissions to up to 3 levels of referrers
 * 3. Records all rewards in the database
 * 4. Updates referral statistics
 *
 * @param newUserAddress - The wallet address of the new user
 * @param referralCode - The referral code used during signup
 */
export async function distributeSignupBonus(
  newUserAddress: string,
  referralCode: string
): Promise<SignupBonusResult> {
  console.log(`[SignupBonus] Starting distribution for ${newUserAddress} via code ${referralCode}`);

  const result: SignupBonusResult = {
    success: false,
    referrerCommissions: [],
    totalDistributed: 0,
    errors: [],
  };

  const supabase = getTypedClient();
  const normalizedAddress = newUserAddress.toLowerCase();

  try {
    // 1. Verify referral code exists
    const codeInfo = await getReferralCodeByCode(referralCode);
    if (!codeInfo) {
      result.errors.push(`Invalid referral code: ${referralCode}`);
      return result;
    }

    // 2. Check if bonus was already distributed
    const { data: existingBonus } = await supabase
      .from('referral_rewards')
      .select('id')
      .eq('referred_address', normalizedAddress)
      .eq('reward_type', 'signup_bonus')
      .single();

    if (existingBonus) {
      result.errors.push('Signup bonus already distributed for this user');
      return result;
    }

    // 3. Check treasury has enough balance (USD rewards: always passes)
    const treasury = await checkTreasuryStatus();
    if (!treasury.hasEnoughCGC) {
      result.errors.push(`Insufficient USD in treasury. Available: ${treasury.cgcBalance}`);
      return result;
    }
    if (!treasury.hasEnoughETH) {
      result.errors.push(`Insufficient funds for processing. Available: ${treasury.ethBalance}`);
      return result;
    }

    // 4. Get referrer chain (up to 3 levels)
    const { data: referrers } = await supabase
      .from('referrals')
      .select('referrer_address, level')
      .eq('referred_address', normalizedAddress)
      .in('level', [1, 2, 3])
      .order('level', { ascending: true });

    // 5. Prepare all transfers
    const transfers: { recipient: string; amount: number; reason: string }[] = [];

    // New user bonus
    transfers.push({
      recipient: normalizedAddress,
      amount: SIGNUP_BONUS_AMOUNT,
      reason: `signup_bonus_${normalizedAddress.slice(0, 8)}`,
    });

    // Referrer commissions
    const referrerMap = new Map<number, string>();
    if (referrers) {
      for (const ref of referrers) {
        referrerMap.set(ref.level, ref.referrer_address);
        const level = ref.level as 1 | 2 | 3;
        const amount = SIGNUP_COMMISSIONS[`level${level}` as keyof typeof SIGNUP_COMMISSIONS];
        transfers.push({
          recipient: ref.referrer_address,
          amount,
          reason: `referral_commission_L${level}_${normalizedAddress.slice(0, 8)}`,
        });
      }
    }

    // 6. Execute all transfers (USD rewards: mocked pending real payment processing)
    console.log(`[SignupBonus] Executing ${transfers.length} USD reward transfers...`);
    // Web3 batchTransferCGC disabled for USD rewards
    // const batchResult = await batchTransferCGC(transfers);
    const batchResult = { results: transfers.map(t => ({ success: true, txHash: 'pending-usd-' + Date.now(), error: undefined })) };

    // 7. Process results and create reward records
    for (let i = 0; i < batchResult.results.length; i++) {
      const txResult = batchResult.results[i];
      const transfer = transfers[i];

      if (i === 0) {
        // New user bonus
        result.newUserBonus = {
          amount: transfer.amount,
          txHash: txResult.txHash,
          error: txResult.error,
        };

        if (txResult.txHash) {
          // Record in database
          const rewardData: ReferralRewardInsert = {
            referrer_address: normalizedAddress, // Self-reward for signup
            referred_address: normalizedAddress,
            reward_type: 'signup_bonus',
            amount: transfer.amount,
            status: 'paid',
            tx_hash: txResult.txHash,
            paid_at: new Date().toISOString(),
          };
          await createReward(rewardData);
          result.totalDistributed += transfer.amount;
        } else if (txResult.error) {
          result.errors.push(`New user bonus failed: ${txResult.error}`);
        }
      } else {
        // Referrer commission
        const level = (i) as 1 | 2 | 3;
        result.referrerCommissions.push({
          level,
          address: transfer.recipient,
          amount: transfer.amount,
          txHash: txResult.txHash,
          error: txResult.error,
        });

        if (txResult.txHash) {
          // Record in database
          const rewardType = level === 1 ? 'signup_commission_l1' :
                            level === 2 ? 'signup_commission_l2' : 'signup_commission_l3';

          const rewardData: ReferralRewardInsert = {
            referrer_address: transfer.recipient,
            referred_address: normalizedAddress,
            reward_type: rewardType as ReferralRewardInsert['reward_type'],
            amount: transfer.amount,
            status: 'paid',
            tx_hash: txResult.txHash,
            paid_at: new Date().toISOString(),
          };
          await createReward(rewardData);
          result.totalDistributed += transfer.amount;

          // 🔧 FIX: Update referrer's total earnings (properly increment)
          // Note: The broken RPC-inside-update was replaced with proper increment logic
          try {
            const { data: currentCode } = await supabase
              .from('referral_codes')
              .select('total_earnings')
              .eq('wallet_address', transfer.recipient)
              .single();

            if (currentCode) {
              const newEarnings = (Number(currentCode.total_earnings) || 0) + transfer.amount;
              await supabase
                .from('referral_codes')
                .update({ total_earnings: newEarnings })
                .eq('wallet_address', transfer.recipient);
            }
          } catch (updateErr) {
            console.warn(`[SignupBonus] Failed to update total_earnings for ${transfer.recipient}:`, updateErr);
            // Non-blocking - rewards are still tracked in referral_rewards table
          }

          // 🔧 FIX: Also update referrer_earnings in the referrals table
          try {
            await supabase
              .from('referrals')
              .update({
                referrer_earnings: transfer.amount,
                last_activity: new Date().toISOString(),
              })
              .eq('referred_address', normalizedAddress)
              .eq('referrer_address', transfer.recipient);
          } catch (updateErr) {
            console.warn(`[SignupBonus] Failed to update referrals table:`, updateErr);
          }

        } else if (txResult.error) {
          result.errors.push(`Level ${level} commission failed: ${txResult.error}`);
        }
      }
    }

    // 8. Update referral stats
    await updateReferralStatsAfterSignup(normalizedAddress, codeInfo.wallet_address);

    result.success = result.errors.length === 0;
    console.log(`[SignupBonus] Distribution complete. Total: $${result.totalDistributed} USD, Errors: ${result.errors.length}`);

    return result;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[SignupBonus] Fatal error: ${errorMessage}`);
    result.errors.push(`Fatal error: ${errorMessage}`);
    return result;
  }
}

/**
 * Update referral statistics after signup bonus distribution
 */
async function updateReferralStatsAfterSignup(
  newUserAddress: string,
  directReferrerAddress: string
): Promise<void> {
  const supabase = getTypedClient();

  // Update referral code total_referrals count
  await supabase.rpc('increment_referral_count', {
    p_wallet: directReferrerAddress,
  });

  // Mark all referral relationships as having received signup bonus
  await supabase
    .from('referrals')
    .update({
      metadata: {
        signup_bonus_distributed: true,
        signup_bonus_at: new Date().toISOString(),
      },
    })
    .eq('referred_address', newUserAddress.toLowerCase());
}

/**
 * Check if a user has already received their signup bonus
 */
export async function hasReceivedSignupBonus(walletAddress: string): Promise<boolean> {
  const supabase = getTypedClient();

  const { data } = await supabase
    .from('referral_rewards')
    .select('id')
    .eq('referred_address', walletAddress.toLowerCase())
    .eq('reward_type', 'signup_bonus')
    .eq('status', 'paid')
    .single();

  return !!data;
}

/**
 * Get signup bonus status for a user
 */
export async function getSignupBonusStatus(walletAddress: string): Promise<{
  eligible: boolean;
  received: boolean;
  amount: number;
  txHash?: string;
  receivedAt?: string;
}> {
  const supabase = getTypedClient();
  const normalizedAddress = walletAddress.toLowerCase();

  // Check if user came from referral
  const { data: referral } = await supabase
    .from('referrals')
    .select('referrer_address')
    .eq('referred_address', normalizedAddress)
    .eq('level', 1)
    .single();

  const eligible = !!referral;

  // Check if already received
  const { data: reward } = await supabase
    .from('referral_rewards')
    .select('amount, tx_hash, paid_at')
    .eq('referred_address', normalizedAddress)
    .eq('reward_type', 'signup_bonus')
    .eq('status', 'paid')
    .single();

  return {
    eligible,
    received: !!reward,
    amount: SIGNUP_BONUS_AMOUNT,
    txHash: reward?.tx_hash || undefined,
    receivedAt: reward?.paid_at || undefined,
  };
}

/**
 * Get commission earnings summary for a referrer
 */
export async function getReferrerCommissionSummary(walletAddress: string): Promise<{
  totalSignupCommissions: number;
  level1Earnings: number;
  level2Earnings: number;
  level3Earnings: number;
  referralsWithBonus: number;
}> {
  const supabase = getTypedClient();
  const normalizedAddress = walletAddress.toLowerCase();

  const { data: rewards } = await supabase
    .from('referral_rewards')
    .select('reward_type, amount')
    .eq('referrer_address', normalizedAddress)
    .in('reward_type', ['signup_commission_l1', 'signup_commission_l2', 'signup_commission_l3'])
    .eq('status', 'paid');

  let level1 = 0, level2 = 0, level3 = 0;
  const uniqueReferrals = new Set<string>();

  if (rewards) {
    for (const r of rewards) {
      const amount = Number(r.amount);
      if (r.reward_type === 'signup_commission_l1') {
        level1 += amount;
      } else if (r.reward_type === 'signup_commission_l2') {
        level2 += amount;
      } else if (r.reward_type === 'signup_commission_l3') {
        level3 += amount;
      }
    }
  }

  return {
    totalSignupCommissions: level1 + level2 + level3,
    level1Earnings: level1,
    level2Earnings: level2,
    level3Earnings: level3,
    referralsWithBonus: uniqueReferrals.size,
  };
}

/**
 * Retry failed bonus distribution
 * Used for manual retry of failed transactions
 */
export async function retryFailedBonus(
  rewardId: string
): Promise<{
  success: boolean;
  txHash?: string;
  error?: string;
}> {
  const supabase = getTypedClient();

  // Get the failed reward
  const { data: reward, error: fetchError } = await supabase
    .from('referral_rewards')
    .select('*')
    .eq('id', rewardId)
    .eq('status', 'failed')
    .single();

  if (fetchError || !reward) {
    return { success: false, error: 'Reward not found or not in failed status' };
  }

  // Retry the transfer (USD rewards: mocked pending real payment processing)
  // Web3 transferCGC disabled for USD rewards
  // const transferResult = await transferCGC(
  //   reward.referrer_address,
  //   Number(reward.amount),
  //   `retry_${reward.reward_type}_${rewardId.slice(0, 8)}`
  // );
  const transferResult = { success: true, txHash: 'pending-usd-retry-' + Date.now(), error: undefined };

  if (transferResult.success && transferResult.txHash) {
    // Update reward status
    await supabase
      .from('referral_rewards')
      .update({
        status: 'paid',
        tx_hash: transferResult.txHash,
        paid_at: new Date().toISOString(),
        notes: `Retried at ${new Date().toISOString()}`,
      })
      .eq('id', rewardId);

    return { success: true, txHash: transferResult.txHash };
  }

  // Mark as failed with new error
  await supabase
    .from('referral_rewards')
    .update({
      status: 'failed',
      notes: `Retry failed: ${transferResult.error}`,
    })
    .eq('id', rewardId);

  return { success: false, error: transferResult.error };
}

// =====================================================
// 📤 EXPORTS
// =====================================================

export {
  SIGNUP_BONUS_AMOUNT as BONUS_AMOUNT,
  SIGNUP_COMMISSIONS as COMMISSIONS,
  MAX_DISTRIBUTION_PER_SIGNUP as MAX_DISTRIBUTION,
};
