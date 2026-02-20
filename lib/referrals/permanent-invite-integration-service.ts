/**
 * 🔗 PERMANENT INVITE INTEGRATION SERVICE
 *
 * Integrates permanent invites with the existing referral and signup bonus systems.
 *
 * Features:
 * - Tracks permanent invite usage in referrals table
 * - Triggers signup bonus distribution for permanent invites
 * - Updates permanent invite claim records with bonus info
 * - Maintains compatibility with existing referral system
 *
 * @version 1.0.0
 * @author CryptoGift DAO
 */

import { getTypedClient } from '@/lib/supabase/client';
import { distributeSignupBonus, SIGNUP_BONUS_AMOUNT } from './signup-bonus-service';
import { registerReferral } from './referral-service';
import type {
  PermanentSpecialInviteClaimUpdate,
  ReferralInsert,
} from '@/lib/supabase/types';

// =====================================================
// 🎯 TYPES
// =====================================================

export interface PermanentInviteSignupResult {
  success: boolean;
  permanentInviteCode: string;
  walletAddress: string;
  referralCreated: boolean;
  bonusDistributed: boolean;
  bonusAmount?: number;
  bonusTxHashes?: string[];
  errors: string[];
}

// =====================================================
// 🔗 INTEGRATION FUNCTIONS
// =====================================================

/**
 * Complete signup flow for a user coming from a permanent invite
 *
 * This function:
 * 1. Creates referral relationship (if referrer exists)
 * 2. Distributes signup bonus (200 CGC + commissions)
 * 3. Updates permanent invite claim record with bonus info
 * 4. Tracks source in referrals table
 */
export async function completePermanentInviteSignup(
  permanentInviteCode: string,
  walletAddress: string
): Promise<PermanentInviteSignupResult> {
  const errors: string[] = [];
  let referralCreated = false;
  let bonusDistributed = false;
  let bonusAmount = 0;
  const bonusTxHashes: string[] = [];

  try {
    const db = getTypedClient();
    const normalizedWallet = walletAddress.toLowerCase();
    const normalizedCode = permanentInviteCode.toUpperCase();

    // =====================================================
    // STEP 1: Get permanent invite details
    // =====================================================

    const { data: invite, error: inviteError } = await db
      .from('permanent_special_invites')
      .select('referrer_wallet, referrer_code')
      .eq('invite_code', normalizedCode)
      .single();

    if (inviteError || !invite) {
      errors.push('Permanent invite not found');
      return {
        success: false,
        permanentInviteCode: normalizedCode,
        walletAddress: normalizedWallet,
        referralCreated: false,
        bonusDistributed: false,
        errors,
      };
    }

    // =====================================================
    // STEP 2: Create referral relationship (if referrer exists)
    // =====================================================

    if (invite.referrer_wallet && invite.referrer_code) {
      try {
        // 🔧 FIX: Lookup canonical code from referral_codes table
        // This is needed because the database trigger uses the 'code' column,
        // not 'custom_code'. If the user has a custom code, we need the canonical one.
        const { data: referrerCodeEntry } = await db
          .from('referral_codes')
          .select('code, custom_code')
          .or(`code.eq.${invite.referrer_code},custom_code.eq.${invite.referrer_code}`)
          .single();

        // Use canonical code for database trigger compatibility
        const canonicalCode = referrerCodeEntry?.code || invite.referrer_code;

        console.log('📌 Using canonical referral code:', {
          provided: invite.referrer_code,
          canonical: canonicalCode,
          hasCustomCode: !!referrerCodeEntry?.custom_code,
        });

        const referralData: ReferralInsert = {
          referrer_address: invite.referrer_wallet,
          referred_address: normalizedWallet,
          referral_code: canonicalCode, // Use canonical code for trigger compatibility
          level: 1,
          status: 'active',
          source: 'permanent_invite',
          campaign: normalizedCode,
          source_permanent_invite: normalizedCode, // Track permanent invite code
          tasks_completed: 0,
          cgc_earned: 0,
          referrer_earnings: 0,
        };

        const { error: referralError } = await db
          .from('referrals')
          .insert(referralData);

        if (referralError) {
          console.warn('Failed to create referral:', referralError);
          errors.push('Failed to create referral relationship');
        } else {
          referralCreated = true;
          console.log('✅ Referral created for permanent invite:', {
            code: normalizedCode,
            canonicalCode,
            referrer: invite.referrer_wallet.slice(0, 6) + '...',
            referred: normalizedWallet.slice(0, 6) + '...',
          });
        }
      } catch (error) {
        console.error('Error creating referral:', error);
        errors.push('Error creating referral relationship');
      }
    }

    // =====================================================
    // STEP 3: Distribute signup bonus
    // =====================================================

    if (invite.referrer_code) {
      try {
        const bonusResult = await distributeSignupBonus(
          normalizedWallet,
          invite.referrer_code
        );

        if (bonusResult.success) {
          bonusDistributed = true;
          bonusAmount = bonusResult.totalDistributed;

          // Collect all transaction hashes
          if (bonusResult.newUserBonus?.txHash) {
            bonusTxHashes.push(bonusResult.newUserBonus.txHash);
          }
          bonusResult.referrerCommissions.forEach(comm => {
            if (comm.txHash) bonusTxHashes.push(comm.txHash);
          });

          console.log('✅ Signup bonus distributed via permanent invite:', {
            code: normalizedCode,
            wallet: normalizedWallet.slice(0, 6) + '...',
            amount: bonusAmount,
            txCount: bonusTxHashes.length,
          });
        } else {
          errors.push(...bonusResult.errors);
          console.warn('Signup bonus distribution had errors:', bonusResult.errors);
        }
      } catch (error) {
        console.error('Error distributing signup bonus:', error);
        errors.push('Failed to distribute signup bonus');
      }
    }

    // =====================================================
    // STEP 4: Update permanent invite claim record
    // =====================================================

    try {
      const claimUpdate: PermanentSpecialInviteClaimUpdate = {
        completed_at: new Date().toISOString(),
        signup_bonus_claimed: bonusDistributed,
        bonus_amount: bonusAmount,
        bonus_tx_hash: bonusTxHashes.join(','), // Store all tx hashes
        bonus_claimed_at: bonusDistributed ? new Date().toISOString() : null,
        profile_created: true,
      };

      const { error: updateError } = await db
        .from('permanent_special_invite_claims')
        .update(claimUpdate)
        .eq('invite_code', normalizedCode)
        .eq('claimed_by_wallet', normalizedWallet);

      if (updateError) {
        console.warn('Failed to update claim record:', updateError);
        errors.push('Failed to update claim record');
      }
    } catch (error) {
      console.error('Error updating claim record:', error);
      errors.push('Error updating claim record');
    }

    // =====================================================
    // STEP 5: Increment total_completed on permanent invite
    // =====================================================

    try {
      const { data: currentInvite } = await db
        .from('permanent_special_invites')
        .select('total_completed, total_claims')
        .eq('invite_code', normalizedCode)
        .single();

      if (currentInvite) {
        const newCompleted = (currentInvite.total_completed || 0) + 1;
        const totalClaims = currentInvite.total_claims || 1;
        const conversionRate = totalClaims > 0 ? (newCompleted / totalClaims) * 100 : 0;

        await db
          .from('permanent_special_invites')
          .update({
            total_completed: newCompleted,
            conversion_rate: Math.round(conversionRate * 100) / 100, // 2 decimal places
          })
          .eq('invite_code', normalizedCode);

        console.log('✅ Incremented total_completed for', normalizedCode, '- Conversion:', conversionRate.toFixed(1) + '%');
      }
    } catch (error) {
      console.error('Error incrementing total_completed:', error);
      errors.push('Error updating completion count');
    }

    // =====================================================
    // RETURN RESULT
    // =====================================================

    return {
      success: errors.length === 0 || (referralCreated && bonusDistributed),
      permanentInviteCode: normalizedCode,
      walletAddress: normalizedWallet,
      referralCreated,
      bonusDistributed,
      bonusAmount: bonusDistributed ? bonusAmount : undefined,
      bonusTxHashes: bonusTxHashes.length > 0 ? bonusTxHashes : undefined,
      errors,
    };
  } catch (error) {
    console.error('Error in completePermanentInviteSignup:', error);
    return {
      success: false,
      permanentInviteCode: permanentInviteCode.toUpperCase(),
      walletAddress: walletAddress.toLowerCase(),
      referralCreated,
      bonusDistributed,
      errors: [...errors, 'Unexpected error during signup process'],
    };
  }
}

/**
 * Check if a wallet has completed signup via a permanent invite
 */
export async function getPermanentInviteSignupStatus(
  permanentInviteCode: string,
  walletAddress: string
): Promise<{
  exists: boolean;
  completed: boolean;
  bonusClaimed: boolean;
  bonusAmount?: number;
}> {
  try {
    const db = getTypedClient();

    const { data: claim } = await db
      .from('permanent_special_invite_claims')
      .select('completed_at, signup_bonus_claimed, bonus_amount')
      .eq('invite_code', permanentInviteCode.toUpperCase())
      .eq('claimed_by_wallet', walletAddress.toLowerCase())
      .single();

    if (!claim) {
      return {
        exists: false,
        completed: false,
        bonusClaimed: false,
      };
    }

    return {
      exists: true,
      completed: !!claim.completed_at,
      bonusClaimed: claim.signup_bonus_claimed,
      bonusAmount: claim.bonus_amount || undefined,
    };
  } catch (error) {
    console.error('Error checking permanent invite signup status:', error);
    return {
      exists: false,
      completed: false,
      bonusClaimed: false,
    };
  }
}

/**
 * Get all users who signed up via a specific permanent invite
 */
export async function getPermanentInviteReferrals(
  permanentInviteCode: string
): Promise<Array<{
  wallet: string;
  claimedAt: string;
  completedAt: string | null;
  bonusClaimed: boolean;
  bonusAmount: number;
}>> {
  try {
    const db = getTypedClient();

    const { data: claims } = await db
      .from('permanent_special_invite_claims')
      .select('claimed_by_wallet, claimed_at, completed_at, signup_bonus_claimed, bonus_amount')
      .eq('invite_code', permanentInviteCode.toUpperCase())
      .order('claimed_at', { ascending: false });

    if (!claims) return [];

    return claims.map((claim: any) => ({
      wallet: claim.claimed_by_wallet,
      claimedAt: claim.claimed_at,
      completedAt: claim.completed_at,
      bonusClaimed: claim.signup_bonus_claimed,
      bonusAmount: claim.bonus_amount || 0,
    }));
  } catch (error) {
    console.error('Error getting permanent invite referrals:', error);
    return [];
  }
}
