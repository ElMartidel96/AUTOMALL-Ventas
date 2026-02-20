/**
 * USER SPECIAL INVITES API
 *
 * GET /api/referrals/special-invite/user?wallet=xxx - Get all invites for a user
 * DELETE /api/referrals/special-invite/user - Delete a specific invite
 *
 * Made by mbxarts.com The Moon in a Box property
 * Co-Author: Godez22
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Database record type for special_invites table
interface SpecialInviteRecord {
  id: number;
  invite_code: string;
  referrer_wallet: string;
  custom_message: string | null;
  image_url: string | null;
  password_hash: string | null;
  status: string;
  created_at: string;
  expires_at: string;
  claimed_by: string | null;
  claimed_at: string | null;
  education_completed: boolean;
  wallet_connected: boolean;
}

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
 * GET - Fetch all special invites for a wallet address
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

    // Fetch all invites for this wallet, ordered by creation date (newest first)
    const { data: invites, error } = await db
      .from('special_invites')
      .select('*')
      .eq('referrer_wallet', normalizedWallet)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user invites:', error);
      return NextResponse.json(
        { error: 'Failed to fetch invites', success: false },
        { status: 500 }
      );
    }

    // Transform invites for frontend consumption
    const transformedInvites = (invites || []).map((invite: SpecialInviteRecord) => ({
      id: invite.id,
      inviteCode: invite.invite_code,
      customMessage: invite.custom_message,
      imageUrl: invite.image_url,
      hasPassword: !!invite.password_hash,
      status: invite.status,
      createdAt: invite.created_at,
      expiresAt: invite.expires_at,
      claimedBy: invite.claimed_by,
      claimedAt: invite.claimed_at,
      educationCompleted: invite.education_completed,
      walletConnected: invite.wallet_connected,
    }));

    console.log(`📋 Fetched ${transformedInvites.length} invites for wallet ${normalizedWallet.slice(0, 6)}...`);

    return NextResponse.json({
      success: true,
      invites: transformedInvites,
      count: transformedInvites.length,
    });
  } catch (error) {
    console.error('Error in GET /api/referrals/special-invite/user:', error);
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete a specific special invite
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

    // Delete the invite (only if owned by this wallet)
    const { data, error } = await db
      .from('special_invites')
      .delete()
      .eq('invite_code', inviteCode.toUpperCase())
      .eq('referrer_wallet', normalizedWallet)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - invite not found or not owned by this wallet
        return NextResponse.json(
          { error: 'Invite not found or not owned by this wallet', success: false },
          { status: 404 }
        );
      }
      console.error('Error deleting invite:', error);
      return NextResponse.json(
        { error: 'Failed to delete invite', success: false },
        { status: 500 }
      );
    }

    console.log(`🗑️ Deleted invite ${inviteCode} for wallet ${normalizedWallet.slice(0, 6)}...`);

    return NextResponse.json({
      success: true,
      message: 'Invite deleted successfully',
      deletedInvite: {
        inviteCode: data.invite_code,
        createdAt: data.created_at,
      },
    });
  } catch (error) {
    console.error('Error in DELETE /api/referrals/special-invite/user:', error);
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    );
  }
}
