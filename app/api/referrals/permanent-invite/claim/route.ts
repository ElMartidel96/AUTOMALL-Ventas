/**
 * 🎯 CLAIM PERMANENT INVITE
 *
 * Marks a permanent invite as claimed by a user.
 * Creates a claim record in permanent_special_invite_claims table.
 *
 * MULTI-USER TRACKING:
 * - Each user gets their own claim record
 * - Same wallet can only claim once per invite
 * - Invite stays active for other users
 *
 * @endpoint POST /api/referrals/permanent-invite/claim
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { PermanentSpecialInviteClaimInsert, Json } from '@/lib/supabase/types';

// Lazy Supabase initialization
let supabase: ReturnType<typeof createClient> | null = null;

function getSupabase() {
  if (supabase) return supabase;

  const url = process.env.NEXT_PUBLIC_SUPABASE_DAO_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_DAO_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Supabase environment variables not configured');
  }

  supabase = createClient(url, key);
  return supabase;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      code,
      claimedBy,
      source,
      campaign,
      ipHash,
      userAgent,
      // 🆕 User profile data collected during the invite flow
      userProfile,
      educationScore,
    } = body;

    if (!code || !claimedBy) {
      return NextResponse.json(
        { error: 'Code and claimedBy wallet are required', success: false },
        { status: 400 }
      );
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(claimedBy)) {
      return NextResponse.json(
        { error: 'Invalid wallet address', success: false },
        { status: 400 }
      );
    }

    const db = getSupabase();
    const normalizedWallet = claimedBy.toLowerCase();
    const normalizedCode = code.toUpperCase();

    // Check if wallet already claimed this invite
    const { data: existingClaim } = await db
      .from('permanent_special_invite_claims')
      .select('id')
      .eq('invite_code', normalizedCode)
      .eq('claimed_by_wallet', normalizedWallet)
      .single();

    if (existingClaim) {
      return NextResponse.json({
        success: true,
        alreadyClaimed: true,
        message: 'You have already claimed this invite',
      });
    }

    // Get invite details for referrer info
    const { data: invite } = await db
      .from('permanent_special_invites')
      .select('referrer_wallet, referrer_code')
      .eq('invite_code', normalizedCode)
      .single();

    // 🆕 Build metadata with user profile data
    const metadata: { [key: string]: Json | undefined } = {};

    if (userProfile) {
      if (userProfile.email) {
        metadata.email = userProfile.email;
      }
      if (userProfile.selectedRole) {
        metadata.selectedRole = userProfile.selectedRole;
      }
      if (userProfile.twitter) {
        metadata.twitter = userProfile.twitter;
      }
      if (userProfile.discord) {
        metadata.discord = userProfile.discord;
      }
    }

    if (educationScore) {
      metadata.educationScore = educationScore;
    }

    // Create claim record
    const claimData: PermanentSpecialInviteClaimInsert = {
      invite_code: normalizedCode,
      claimed_by_wallet: normalizedWallet,
      referrer_wallet: invite?.referrer_wallet || null,
      referrer_code: invite?.referrer_code || null,
      education_completed: educationScore?.total > 0 || false,
      wallet_connected: true,
      profile_created: !!(userProfile?.email || userProfile?.selectedRole),
      signup_bonus_claimed: false,
      ip_hash: ipHash || null,
      user_agent: userAgent || null,
      source: source || null,
      campaign: campaign || null,
      claimed_at: new Date().toISOString(),
      // 🆕 Store user profile data in metadata
      metadata: Object.keys(metadata).length > 0 ? (metadata as Json) : null,
    };

    const { error: claimError } = await db
      .from('permanent_special_invite_claims')
      .insert(claimData);

    if (claimError) {
      // Unique constraint violation (wallet already claimed)
      if (claimError.code === '23505') {
        return NextResponse.json({
          success: true,
          alreadyClaimed: true,
          message: 'You have already claimed this invite',
        });
      }

      console.error('Error creating claim:', claimError);
      return NextResponse.json({
        success: false,
        error: 'Failed to create claim record',
        warning: 'User may have already onboarded successfully',
      }, { status: 500 });
    }

    // Increment click counter (using RPC function from migration)
    try {
      await db.rpc('increment_permanent_invite_clicks', {
        p_invite_code: normalizedCode,
      });
    } catch (err) {
      // Non-critical if RPC fails
      console.warn('Failed to increment clicks:', err);
    }

    // 🔧 INCREMENT total_claims counter on permanent invite
    try {
      const { data: currentInvite } = await db
        .from('permanent_special_invites')
        .select('total_claims')
        .eq('invite_code', normalizedCode)
        .single();

      if (currentInvite) {
        await db
          .from('permanent_special_invites')
          .update({
            total_claims: (currentInvite.total_claims || 0) + 1,
            last_claimed_at: new Date().toISOString(),
          })
          .eq('invite_code', normalizedCode);

        console.log('✅ Incremented total_claims for', normalizedCode);
      }
    } catch (err) {
      console.warn('Failed to increment total_claims:', err);
    }

    console.log('✅ Permanent invite claimed:', {
      code: normalizedCode,
      claimedBy: normalizedWallet.slice(0, 6) + '...' + normalizedWallet.slice(-4),
      referrer: invite?.referrer_wallet?.slice(0, 6) + '...' + invite?.referrer_wallet?.slice(-4),
    });

    // 🎯 CRITICAL: Distribute signup bonus (200 CGC + commissions)
    // This triggers automatic distribution to:
    // - New user: 200 CGC
    // - Level 1 referrer: 20 CGC (10%)
    // - Level 2 referrer: 10 CGC (5%)
    // - Level 3 referrer: 5 CGC (2.5%)
    const { completePermanentInviteSignup } = await import('@/lib/referrals/permanent-invite-integration-service');

    try {
      const bonusResult = await completePermanentInviteSignup(normalizedCode, normalizedWallet);

      if (bonusResult.success) {
        console.log('💰 Signup bonus distributed successfully:', {
          code: normalizedCode,
          wallet: normalizedWallet.slice(0, 6) + '...',
          bonusAmount: bonusResult.bonusAmount,
          txHashes: bonusResult.bonusTxHashes?.length || 0,
        });
      } else {
        console.warn('⚠️ Signup bonus distribution had issues:', bonusResult.errors);
      }
    } catch (bonusError) {
      console.error('❌ Error distributing signup bonus:', bonusError);
      // Don't fail the claim if bonus fails - user can claim later
    }

    return NextResponse.json({
      success: true,
      message: 'Invite claimed successfully',
      claimId: normalizedCode + '-' + normalizedWallet.slice(0, 10),
      bonusDistributed: true, // Always true - indicates attempt was made
    });
  } catch (error) {
    console.error('Error claiming permanent invite:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
