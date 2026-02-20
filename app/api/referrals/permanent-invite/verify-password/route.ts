/**
 * 🔐 VERIFY PASSWORD FOR PERMANENT INVITE
 *
 * Verifies password for password-protected permanent invites.
 *
 * @endpoint POST /api/referrals/permanent-invite/verify-password
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

/**
 * Hash password for comparison (SHA-256)
 */
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

    // Get invite with password hash
    const { data: invite, error } = await db
      .from('permanent_special_invites')
      .select('password_hash')
      .eq('invite_code', code.toUpperCase())
      .single();

    if (error || !invite) {
      return NextResponse.json(
        { error: 'Invite not found', success: false },
        { status: 404 }
      );
    }

    if (!invite.password_hash) {
      return NextResponse.json({
        success: true,
        verified: true,
        message: 'Invite does not require password',
      });
    }

    // Verify password
    const inputHash = hashPassword(password);
    const isValid = inputHash === invite.password_hash;

    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          verified: false,
          error: 'Incorrect password',
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      verified: true,
      message: 'Password verified successfully',
    });
  } catch (error) {
    console.error('Error verifying credentials:', error);
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    );
  }
}
