/**
 * 🔗 PERMANENT SPECIAL INVITE API
 *
 * Enterprise-grade permanent multi-use referral invite system.
 *
 * Features:
 * - Never expires (unless manually disabled)
 * - Unlimited claims (or custom max_claims)
 * - Full analytics and tracking
 * - Integration with signup bonus system
 *
 * @endpoint POST /api/referrals/permanent-invite - Create new permanent invite
 * @endpoint GET /api/referrals/permanent-invite?code=xxx - Get invite details
 *
 * Created: 2025-12-05
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import type {
  PermanentSpecialInviteInsert,
  PermanentSpecialInvite,
  MasterclassType,
} from '@/lib/supabase/types';

// =====================================================
// CONFIGURATION
// =====================================================

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

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Generate unique permanent invite code
 * Format: PI-TIMESTAMP-RANDOM
 * PI = Permanent Invite
 */
function generatePermanentInviteCode(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomPart = crypto.randomBytes(8).toString('hex').toUpperCase();
  return `PI-${timestamp}-${randomPart}`;
}

/**
 * Hash password for storage (SHA-256)
 */
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Validate wallet address format
 */
function isValidWallet(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

// =====================================================
// POST - Create Permanent Invite
// =====================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      referrerWallet,
      referrerCode,
      password,
      customMessage,
      customMessageEs, // Spanish version for i18n
      customTitle,
      image,
      maxClaims,
      neverExpires = true,
      masterclassType = 'v2', // Default to V2 (new neuromarketing funnel)
    } = body as {
      referrerWallet: string;
      referrerCode?: string;
      password?: string;
      customMessage?: string;
      customMessageEs?: string;
      customTitle?: string;
      image?: string;
      maxClaims?: number;
      neverExpires?: boolean;
      masterclassType?: MasterclassType;
    };

    // Validation
    if (!referrerWallet || !isValidWallet(referrerWallet)) {
      return NextResponse.json(
        { error: 'Valid referrer wallet is required', success: false },
        { status: 400 }
      );
    }

    const db = getSupabase();
    const inviteCode = generatePermanentInviteCode();
    const normalizedWallet = referrerWallet.toLowerCase();

    // Create permanent invite record
    const inviteData: PermanentSpecialInviteInsert = {
      invite_code: inviteCode,
      referrer_wallet: normalizedWallet,
      referrer_code: referrerCode || null,
      password_hash: password ? hashPassword(password) : null,
      custom_message: customMessage || null,
      custom_message_es: customMessageEs || null, // Spanish version for i18n
      custom_title: customTitle || null,
      image_url: image || null,
      status: 'active',
      never_expires: neverExpires,
      expires_at: neverExpires ? null : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year default
      max_claims: maxClaims || null,
      total_clicks: 0,
      total_claims: 0,
      total_completed: 0,
      conversion_rate: 0,
      masterclass_type: masterclassType, // Which Sales Masterclass version invitees will see
    };

    const { data: createdInvite, error: insertError } = await db
      .from('permanent_special_invites')
      .insert(inviteData)
      .select()
      .single();

    if (insertError) {
      console.error('Error creating permanent invite:', insertError);

      // If table doesn't exist, provide helpful error
      if (insertError.code === '42P01') {
        return NextResponse.json(
          {
            error: 'Database table not found. Please run the migration first.',
            success: false,
            migration: 'scripts/supabase/create-permanent-invites-system.sql',
          },
          { status: 503 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to create permanent invite', success: false },
        { status: 500 }
      );
    }

    console.log('✅ Permanent invite created:', {
      code: inviteCode,
      referrer: normalizedWallet.slice(0, 6) + '...' + normalizedWallet.slice(-4),
      hasPassword: !!password,
      hasImage: !!image,
      neverExpires,
      maxClaims: maxClaims || 'unlimited',
      masterclassType, // V2 (video funnel), legacy (quiz), or none
    });

    return NextResponse.json({
      success: true,
      inviteCode,
      invite: createdInvite,
      url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/permanent-invite/${inviteCode}`,
    });
  } catch (error) {
    console.error('Error in POST /api/referrals/permanent-invite:', error);
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    );
  }
}

// =====================================================
// GET - Get Permanent Invite Details
// =====================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const checkWallet = searchParams.get('wallet'); // Optional: check if wallet already claimed

    if (!code) {
      return NextResponse.json(
        { error: 'Invite code is required', success: false },
        { status: 400 }
      );
    }

    const db = getSupabase();

    // Get invite details
    const { data: invite, error } = await db
      .from('permanent_special_invites')
      .select('*')
      .eq('invite_code', code.toUpperCase())
      .single();

    if (error || !invite) {
      return NextResponse.json(
        { error: 'Invite not found', success: false },
        { status: 404 }
      );
    }

    // Check if invite is active
    if (invite.status !== 'active') {
      return NextResponse.json(
        {
          error: `Invite is ${invite.status}`,
          success: false,
          status: invite.status,
        },
        { status: 410 }
      );
    }

    // Check if expired (only if not never_expires)
    if (!invite.never_expires && invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Invite has expired', success: false, expired: true },
        { status: 410 }
      );
    }

    // Check if max claims reached
    if (invite.max_claims !== null && invite.total_claims >= invite.max_claims) {
      return NextResponse.json(
        {
          error: 'Invite has reached maximum claims',
          success: false,
          maxReached: true,
          maxClaims: invite.max_claims,
          totalClaims: invite.total_claims,
        },
        { status: 410 }
      );
    }

    // Optional: Check if specific wallet already claimed
    let alreadyClaimed = false;
    if (checkWallet && isValidWallet(checkWallet)) {
      const { data: existingClaim } = await db
        .from('permanent_special_invite_claims')
        .select('id')
        .eq('invite_code', code.toUpperCase())
        .eq('claimed_by_wallet', checkWallet.toLowerCase())
        .single();

      alreadyClaimed = !!existingClaim;
    }

    // Get recent claims for analytics
    const { data: recentClaims } = await db
      .from('permanent_special_invite_claims')
      .select('claimed_by_wallet, claimed_at, completed_at')
      .eq('invite_code', code.toUpperCase())
      .order('claimed_at', { ascending: false })
      .limit(5);

    return NextResponse.json({
      success: true,
      invite: {
        code: invite.invite_code,
        referrerCode: invite.referrer_code,
        customMessage: invite.custom_message,
        customMessageEs: invite.custom_message_es, // Spanish version for i18n
        customTitle: invite.custom_title,
        hasPassword: !!invite.password_hash,
        createdAt: invite.created_at,
        expiresAt: invite.expires_at,
        neverExpires: invite.never_expires,
        image: invite.image_url,
        maxClaims: invite.max_claims,
        totalClaims: invite.total_claims,
        totalCompleted: invite.total_completed,
        conversionRate: invite.conversion_rate,
        status: invite.status,
        masterclassType: invite.masterclass_type || 'v2', // Which Sales Masterclass version to show
      },
      alreadyClaimed,
      recentClaims: recentClaims || [],
    });
  } catch (error) {
    console.error('Error in GET /api/referrals/permanent-invite:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invite', success: false },
      { status: 500 }
    );
  }
}
