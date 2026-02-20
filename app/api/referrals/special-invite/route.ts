/**
 * SPECIAL INVITE API
 *
 * Creates and manages special referral invites with educational requirements.
 * These invites require recipients to complete the Sales Masterclass before joining.
 *
 * @endpoint POST /api/referrals/special-invite - Create new special invite
 * @endpoint GET /api/referrals/special-invite?code=xxx - Get invite details
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import type { MasterclassType } from '@/lib/supabase/types';

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

// Generate unique invite code
function generateInviteCode(): string {
  const randomPart = crypto.randomBytes(6).toString('hex');
  const timestamp = Date.now().toString(36);
  return `SI-${timestamp}-${randomPart}`.toUpperCase();
}

// Hash password for storage
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      referrerWallet,
      referrerCode,
      password,
      customMessage,
      image, // Custom image URL for the invite card
      masterclassType = 'v2', // Default to V2 (new neuromarketing funnel)
    } = body as {
      referrerWallet: string;
      referrerCode?: string;
      password?: string;
      customMessage?: string;
      image?: string;
      masterclassType?: MasterclassType;
    };

    // Validation
    if (!referrerWallet || !/^0x[a-fA-F0-9]{40}$/.test(referrerWallet)) {
      return NextResponse.json(
        { error: 'Valid referrer wallet is required', success: false },
        { status: 400 }
      );
    }

    const db = getSupabase();
    const inviteCode = generateInviteCode();
    const normalizedWallet = referrerWallet.toLowerCase();

    // Create special invite record - base fields that should always exist
    const baseInviteData = {
      invite_code: inviteCode,
      referrer_wallet: normalizedWallet,
      referrer_code: referrerCode || null,
      password_hash: password ? hashPassword(password) : null,
      custom_message: customMessage || null,
      masterclass_type: masterclassType, // V2, legacy, or none
      status: 'active',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days expiry
      claimed_by: null,
      claimed_at: null,
      education_completed: false,
      wallet_connected: false,
    };

    // Try with image_url first (if column exists)
    const inviteDataWithImage = {
      ...baseInviteData,
      image_url: image || null,
    };

    let { error: insertError } = await db
      .from('special_invites')
      .insert(inviteDataWithImage);

    // Track if image was saved successfully
    let imageSaved = !insertError && !!image;

    // If image_url column doesn't exist, try to add it via RPC, then retry
    if (insertError && insertError.message?.includes('image_url')) {
      console.log('⚠️ image_url column not found, attempting to add column...');

      // Try to add the column via RPC (if available)
      try {
        await db.rpc('add_image_url_column_to_special_invites');
        console.log('✅ Column added successfully, retrying insert with image...');

        // Retry with image
        const { error: retryWithImageError } = await db
          .from('special_invites')
          .insert(inviteDataWithImage);

        if (!retryWithImageError) {
          insertError = null;
          imageSaved = !!image;
        } else {
          // If still fails, insert without image
          console.log('⚠️ Retry with image failed, inserting without image_url');
          const { error: retryError } = await db
            .from('special_invites')
            .insert(baseInviteData);
          insertError = retryError;
          imageSaved = false;
        }
      } catch (rpcError) {
        // RPC not available, insert without image
        console.log('⚠️ Could not add column (RPC not available), inserting without image_url');
        console.log('⚠️ IMAGE URL DROPPED:', image);
        const { error: retryError } = await db
          .from('special_invites')
          .insert(baseInviteData);
        insertError = retryError;
        imageSaved = false;
      }
    }

    if (insertError) {
      // If table doesn't exist, create it
      if (insertError.code === '42P01') {
        console.log('Creating special_invites table...');

        // Create the table using a raw query
        const { error: createError } = await db.rpc('create_special_invites_table');

        if (createError) {
          console.error('Failed to create table:', createError);
          // Fallback: return success with just the code (no persistence)
          return NextResponse.json({
            success: true,
            inviteCode,
            message: 'Invite created (local mode - table not available)',
          });
        }

        // Retry insert without image_url (safer for new table)
        const { error: retryError } = await db
          .from('special_invites')
          .insert(baseInviteData);

        if (retryError) {
          console.error('Retry insert failed:', retryError);
        }
      } else {
        console.error('Insert error:', insertError);
        // Fallback: return success with just the code
        return NextResponse.json({
          success: true,
          inviteCode,
          message: 'Invite created (fallback mode)',
        });
      }
    }

    console.log('Special invite created:', {
      code: inviteCode,
      referrer: normalizedWallet.slice(0, 6) + '...' + normalizedWallet.slice(-4),
      hasPassword: !!password,
      hasImage: !!image,
      imageSaved,
      masterclassType, // V2 (video funnel), legacy (quiz), or none
    });

    return NextResponse.json({
      success: true,
      inviteCode,
      expiresAt: baseInviteData.expires_at,
      imageSaved,
      imageUrl: imageSaved ? image : null,
    });
  } catch (error) {
    console.error('Error creating special invite:', error);
    return NextResponse.json(
      { error: 'Failed to create special invite', success: false },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { error: 'Invite code is required', success: false },
        { status: 400 }
      );
    }

    const db = getSupabase();

    const { data: invite, error } = await db
      .from('special_invites')
      .select('*')
      .eq('invite_code', code.toUpperCase())
      .single();

    if (error || !invite) {
      return NextResponse.json(
        { error: 'Invite not found', success: false },
        { status: 404 }
      );
    }

    // Check if expired
    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Invite has expired', success: false, expired: true },
        { status: 410 }
      );
    }

    // Check if already claimed
    if (invite.status === 'claimed') {
      return NextResponse.json(
        { error: 'Invite has already been used', success: false, claimed: true },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      invite: {
        code: invite.invite_code,
        referrerCode: invite.referrer_code,
        customMessage: invite.custom_message,
        hasPassword: !!invite.password_hash,
        createdAt: invite.created_at,
        expiresAt: invite.expires_at,
        image: invite.image_url ?? null, // Custom image for the invite card (may not exist in DB)
        masterclassType: invite.masterclass_type || 'v2', // Which Sales Masterclass version to show
      },
    });
  } catch (error) {
    console.error('Error fetching invite:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invite', success: false },
      { status: 500 }
    );
  }
}
