/**
 * CLAIM SPECIAL INVITE
 *
 * Marks a special invite as claimed after user completes onboarding.
 *
 * @endpoint POST /api/referrals/special-invite/claim
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, claimedBy } = body;

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

    // Update invite status
    const { error: updateError } = await db
      .from('special_invites')
      .update({
        status: 'claimed',
        claimed_by: normalizedWallet,
        claimed_at: new Date().toISOString(),
        education_completed: true,
        wallet_connected: true,
      })
      .eq('invite_code', code.toUpperCase())
      .eq('status', 'active');

    if (updateError) {
      console.error('Error updating invite:', updateError);
      // Don't fail - the user has already onboarded
      return NextResponse.json({
        success: true,
        message: 'Invite claimed (with warning)',
        warning: 'Database update may have failed',
      });
    }

    console.log('Special invite claimed:', {
      code: code.toUpperCase(),
      claimedBy: normalizedWallet.slice(0, 6) + '...' + normalizedWallet.slice(-4),
    });

    return NextResponse.json({
      success: true,
      message: 'Invite claimed successfully',
    });
  } catch (error) {
    console.error('Error claiming invite:', error);
    // Don't fail - the user has already onboarded
    return NextResponse.json({
      success: true,
      message: 'Invite claim processed',
    });
  }
}
