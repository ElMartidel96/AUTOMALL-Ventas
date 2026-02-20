/**
 * 📊 PERMANENT INVITE HISTORY API
 *
 * Get complete history of all users who claimed a permanent invite.
 * Includes analytics and statistics.
 *
 * @endpoint GET /api/referrals/permanent-invite/history?code=PI-XXX
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!code) {
      return NextResponse.json(
        { error: 'Invite code is required', success: false },
        { status: 400 }
      );
    }

    const db = getSupabase();
    const normalizedCode = code.toUpperCase();

    // Get invite details
    const { data: invite, error: inviteError } = await db
      .from('permanent_special_invites')
      .select('*')
      .eq('invite_code', normalizedCode)
      .single();

    if (inviteError || !invite) {
      return NextResponse.json(
        { error: 'Invite not found', success: false },
        { status: 404 }
      );
    }

    // Get all claims for this invite
    const { data: claims, error: claimsError } = await db
      .from('permanent_special_invite_claims')
      .select('*')
      .eq('invite_code', normalizedCode)
      .order('claimed_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (claimsError) {
      console.error('Error fetching claims:', claimsError);
      return NextResponse.json(
        { error: 'Failed to fetch claim history', success: false },
        { status: 500 }
      );
    }

    // Calculate analytics
    const totalClaims = claims?.length || 0;
    const completedClaims = claims?.filter((c: any) => c.completed_at !== null).length || 0;
    const bonusClaimedCount = claims?.filter((c: any) => c.signup_bonus_claimed).length || 0;
    const totalBonusDistributed = claims?.reduce((sum: number, c: any) => sum + (c.bonus_amount || 0), 0) || 0;

    // Get source breakdown
    const sourceBreakdown = claims?.reduce((acc: Record<string, number>, claim: any) => {
      const source = claim.source || 'direct';
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {}) || {};

    // Format claims for response
    const formattedClaims = claims?.map((claim: any) => {
      // 🆕 Extract user profile data from metadata
      const metadata = claim.metadata || {};

      return {
        wallet: claim.claimed_by_wallet,
        claimedAt: claim.claimed_at,
        completedAt: claim.completed_at,
        completed: !!claim.completed_at,
        educationCompleted: claim.education_completed,
        walletConnected: claim.wallet_connected,
        profileCreated: claim.profile_created,
        signupBonusClaimed: claim.signup_bonus_claimed,
        bonusAmount: claim.bonus_amount,
        bonusTxHash: claim.bonus_tx_hash,
        source: claim.source,
        campaign: claim.campaign,
        // 🆕 User profile data from metadata
        userProfile: {
          email: metadata.email || null,
          selectedRole: metadata.selectedRole || null,
          twitter: metadata.twitter || null,
          discord: metadata.discord || null,
          educationScore: metadata.educationScore || null,
        },
      };
    }) || [];

    return NextResponse.json({
      success: true,
      invite: {
        code: invite.invite_code,
        referrerWallet: invite.referrer_wallet,
        referrerCode: invite.referrer_code,
        customTitle: invite.custom_title,
        customMessage: invite.custom_message,
        createdAt: invite.created_at,
        status: invite.status,
        neverExpires: invite.never_expires,
        expiresAt: invite.expires_at,
        maxClaims: invite.max_claims,
      },
      analytics: {
        totalClicks: invite.total_clicks,
        totalClaims: invite.total_claims,
        totalCompleted: invite.total_completed,
        conversionRate: invite.conversion_rate,
        bonusClaimedCount,
        totalBonusDistributed,
        sourceBreakdown,
        lastClaimedAt: invite.last_claimed_at,
      },
      claims: formattedClaims,
      pagination: {
        limit,
        offset,
        hasMore: (claims?.length || 0) === limit,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/referrals/permanent-invite/history:', error);
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    );
  }
}
