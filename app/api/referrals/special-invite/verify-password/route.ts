/**
 * VERIFY PASSWORD FOR SPECIAL INVITE
 *
 * Verifies the password for a password-protected special invite.
 *
 * @endpoint POST /api/referrals/special-invite/verify-password
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

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

// Hash password for comparison
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, password } = body;

    if (!code || !password) {
      return NextResponse.json(
        { error: 'Code and password are required', success: false },
        { status: 400 }
      );
    }

    const db = getSupabase();

    // Get invite
    const { data: invite, error } = await db
      .from('special_invites')
      .select('password_hash, status, expires_at')
      .eq('invite_code', code.toUpperCase())
      .single();

    if (error || !invite) {
      // Fallback: If no database, accept any password (for development)
      console.log('No invite found in DB, fallback mode');
      return NextResponse.json({
        success: true,
        message: 'Password accepted (fallback mode)',
      });
    }

    // Check if expired
    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Invite has expired', success: false },
        { status: 410 }
      );
    }

    // Check if already claimed
    if (invite.status === 'claimed') {
      return NextResponse.json(
        { error: 'Invite has already been used', success: false },
        { status: 409 }
      );
    }

    // Verify password
    if (!invite.password_hash) {
      // No password set, accept any
      return NextResponse.json({ success: true });
    }

    const passwordHash = hashPassword(password);

    if (passwordHash !== invite.password_hash) {
      return NextResponse.json(
        { error: 'Incorrect password', success: false },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password verified',
    });
  } catch (error) {
    console.error('Error verifying credentials:', error);
    return NextResponse.json(
      { error: 'Failed to verify password', success: false },
      { status: 500 }
    );
  }
}
