/**
 * USER PERMANENT INVITES API
 *
 * GET /api/referrals/permanent-invite/user?wallet=xxx - Get all permanent invites for a user
 * PATCH /api/referrals/permanent-invite/user - Pause/Resume a permanent invite
 * DELETE /api/referrals/permanent-invite/user - Delete a permanent invite
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

/**
 * GET - Fetch all permanent invites for a wallet address
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');

    if (!wallet || !/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
      return NextResponse.json(
        { error: 'Valid wallet address is required', success: false },
        { status: 400 }
      );
    }

    const db = getSupabase();
    const normalizedWallet = wallet.toLowerCase();

    // Fetch all permanent invites for this wallet, ordered by creation date (newest first)
    const { data: invites, error } = await db
      .from('permanent_special_invites')
      .select('*')
      .eq('referrer_wallet', normalizedWallet)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user permanent invites:', error);
      return NextResponse.json(
        { error: 'Failed to fetch invites', success: false },
        { status: 500 }
      );
    }

    // Transform invites for frontend consumption
    const transformedInvites = (invites || []).map((invite: any) => ({
      id: invite.id,
      inviteCode: invite.invite_code,
      customTitle: invite.custom_title,
      customMessage: invite.custom_message,
      imageUrl: invite.image_url,
      hasPassword: !!invite.password_hash,
      status: invite.status,
      createdAt: invite.created_at,
      expiresAt: invite.expires_at,
      neverExpires: invite.never_expires,
      maxClaims: invite.max_claims,
      totalClicks: invite.total_clicks,
      totalClaims: invite.total_claims,
      totalCompleted: invite.total_completed,
      conversionRate: invite.conversion_rate,
      lastClaimedAt: invite.last_claimed_at,
    }));

    console.log(`📋 Fetched ${transformedInvites.length} permanent invites for wallet ${normalizedWallet.slice(0, 6)}...`);

    return NextResponse.json({
      success: true,
      invites: transformedInvites,
      count: transformedInvites.length,
    });
  } catch (error) {
    console.error('Error in GET /api/referrals/permanent-invite/user:', error);
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Pause/Resume a permanent invite (change status)
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { inviteCode, wallet, action } = body;

    if (!inviteCode) {
      return NextResponse.json(
        { error: 'Invite code is required', success: false },
        { status: 400 }
      );
    }

    if (!wallet || !/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
      return NextResponse.json(
        { error: 'Valid wallet address is required', success: false },
        { status: 400 }
      );
    }

    if (!action || !['pause', 'resume'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be "pause" or "resume"', success: false },
        { status: 400 }
      );
    }

    const db = getSupabase();
    const normalizedWallet = wallet.toLowerCase();
    const newStatus = action === 'pause' ? 'paused' : 'active';

    // Update the invite status (only if owned by this wallet)
    const { data, error } = await db
      .from('permanent_special_invites')
      .update({ status: newStatus })
      .eq('invite_code', inviteCode.toUpperCase())
      .eq('referrer_wallet', normalizedWallet)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Invite not found or not owned by this wallet', success: false },
          { status: 404 }
        );
      }
      console.error('Error updating invite:', error);
      return NextResponse.json(
        { error: 'Failed to update invite', success: false },
        { status: 500 }
      );
    }

    console.log(`${action === 'pause' ? '⏸️' : '▶️'} ${action === 'pause' ? 'Paused' : 'Resumed'} invite ${inviteCode} for wallet ${normalizedWallet.slice(0, 6)}...`);

    return NextResponse.json({
      success: true,
      message: `Invite ${action === 'pause' ? 'paused' : 'resumed'} successfully`,
      invite: {
        inviteCode: data.invite_code,
        status: data.status,
      },
    });
  } catch (error) {
    console.error('Error in PATCH /api/referrals/permanent-invite/user:', error);
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete a permanent invite permanently
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { inviteCode, wallet } = body;

    if (!inviteCode) {
      return NextResponse.json(
        { error: 'Invite code is required', success: false },
        { status: 400 }
      );
    }

    if (!wallet || !/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
      return NextResponse.json(
        { error: 'Valid wallet address is required', success: false },
        { status: 400 }
      );
    }

    const db = getSupabase();
    const normalizedWallet = wallet.toLowerCase();

    // Delete the invite and all its claims (cascade should handle this)
    const { data, error } = await db
      .from('permanent_special_invites')
      .delete()
      .eq('invite_code', inviteCode.toUpperCase())
      .eq('referrer_wallet', normalizedWallet)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Invite not found or not owned by this wallet', success: false },
          { status: 404 }
        );
      }
      console.error('Error deleting permanent invite:', error);
      return NextResponse.json(
        { error: 'Failed to delete invite', success: false },
        { status: 500 }
      );
    }

    console.log(`🗑️ Deleted permanent invite ${inviteCode} for wallet ${normalizedWallet.slice(0, 6)}...`);

    return NextResponse.json({
      success: true,
      message: 'Permanent invite deleted successfully',
      deletedInvite: {
        inviteCode: data.invite_code,
        createdAt: data.created_at,
      },
    });
  } catch (error) {
    console.error('Error in DELETE /api/referrals/permanent-invite/user:', error);
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    );
  }
}
