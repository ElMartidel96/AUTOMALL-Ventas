/**
 * 🔄 RECALCULATE PERMANENT INVITE STATS
 *
 * POST /api/referrals/permanent-invite/recalculate
 *
 * Recalculates all stats (clicks, claims, completed, conversion_rate)
 * based on actual claim records in permanent_special_invite_claims table.
 *
 * This fixes existing data that wasn't properly counted.
 *
 * Made by mbxarts.com The Moon in a Box property
 * Co-Author: Godez22
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

interface RecalculateResult {
  inviteCode: string;
  before: {
    totalClicks: number;
    totalClaims: number;
    totalCompleted: number;
    conversionRate: number;
  };
  after: {
    totalClicks: number;
    totalClaims: number;
    totalCompleted: number;
    conversionRate: number;
  };
  updated: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { wallet, inviteCode } = body;

    const db = getSupabase();
    const results: RecalculateResult[] = [];

    // Build query for permanent invites
    let query = db.from('permanent_special_invites').select('*');

    if (wallet) {
      query = query.eq('referrer_wallet', wallet.toLowerCase());
    }

    if (inviteCode) {
      query = query.eq('invite_code', inviteCode.toUpperCase());
    }

    const { data: invites, error: invitesError } = await query;

    if (invitesError) {
      console.error('Error fetching invites:', invitesError);
      return NextResponse.json(
        { error: 'Failed to fetch invites', success: false },
        { status: 500 }
      );
    }

    if (!invites || invites.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No invites found to recalculate',
        results: [],
      });
    }

    console.log(`🔄 Recalculating stats for ${invites.length} permanent invite(s)...`);

    for (const invite of invites) {
      const code = invite.invite_code;

      // Get actual claim counts from claims table
      const { data: claims, error: claimsError } = await db
        .from('permanent_special_invite_claims')
        .select('claimed_at, completed_at, signup_bonus_claimed')
        .eq('invite_code', code);

      if (claimsError) {
        console.warn(`Error fetching claims for ${code}:`, claimsError);
        continue;
      }

      // Calculate actual counts
      const actualClaims = claims?.length || 0;
      const actualCompleted = claims?.filter((c: any) => c.completed_at || c.signup_bonus_claimed)?.length || 0;

      // Keep clicks as-is (they track visits, not claims)
      const actualClicks = Math.max(invite.total_clicks || 0, actualClaims);

      // Calculate conversion rate
      const conversionRate = actualClaims > 0
        ? Math.round((actualCompleted / actualClaims) * 10000) / 100 // 2 decimal places
        : 0;

      const before = {
        totalClicks: invite.total_clicks || 0,
        totalClaims: invite.total_claims || 0,
        totalCompleted: invite.total_completed || 0,
        conversionRate: invite.conversion_rate || 0,
      };

      const after = {
        totalClicks: actualClicks,
        totalClaims: actualClaims,
        totalCompleted: actualCompleted,
        conversionRate,
      };

      // Check if update is needed
      const needsUpdate =
        before.totalClaims !== after.totalClaims ||
        before.totalCompleted !== after.totalCompleted ||
        before.conversionRate !== after.conversionRate ||
        before.totalClicks !== after.totalClicks;

      if (needsUpdate) {
        const { error: updateError } = await db
          .from('permanent_special_invites')
          .update({
            total_clicks: after.totalClicks,
            total_claims: after.totalClaims,
            total_completed: after.totalCompleted,
            conversion_rate: after.conversionRate,
          })
          .eq('invite_code', code);

        if (updateError) {
          console.error(`Failed to update ${code}:`, updateError);
        } else {
          console.log(`✅ Updated ${code}: claims=${after.totalClaims}, completed=${after.totalCompleted}, conversion=${after.conversionRate}%`);
        }

        results.push({
          inviteCode: code,
          before,
          after,
          updated: !updateError,
        });
      } else {
        results.push({
          inviteCode: code,
          before,
          after,
          updated: false,
        });
      }
    }

    const updatedCount = results.filter(r => r.updated).length;

    return NextResponse.json({
      success: true,
      message: `Recalculated ${invites.length} invite(s), updated ${updatedCount}`,
      results,
    });
  } catch (error) {
    console.error('Error in recalculate:', error);
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    );
  }
}
