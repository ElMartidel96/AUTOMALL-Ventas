/**
 * PARTIAL ACTIVATION TRACKING API
 *
 * Tracks users who started the invite flow but haven't connected their wallet yet.
 * This allows referrers to see "partial activations" - users who:
 * - Selected a role
 * - Verified their email
 * - Connected social accounts
 * - But haven't completed wallet connection
 *
 * Data is stored in the metadata field as a temporary record.
 * When user later connects wallet, this is upgraded to a full claim.
 *
 * @endpoint POST /api/referrals/permanent-invite/partial-activation
 * @endpoint GET /api/referrals/permanent-invite/partial-activation?code=PI-XXX
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

// Generate a temporary ID for partial activations (will be replaced by wallet address)
function generatePartialId(): string {
  return `PARTIAL-${Date.now()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
}

/**
 * POST: Create or update a partial activation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      code,
      sessionId, // Optional: client-generated session ID to identify the user
      email,
      selectedRole,
      twitter,
      discord,
      educationProgress,
      ipHash,
      userAgent,
    } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'Invite code is required', success: false },
        { status: 400 }
      );
    }

    const db = getSupabase();
    const normalizedCode = code.toUpperCase();

    // Verify invite exists
    const { data: invite, error: inviteError } = await db
      .from('permanent_special_invites')
      .select('referrer_wallet, referrer_code')
      .eq('invite_code', normalizedCode)
      .single();

    if (inviteError || !invite) {
      return NextResponse.json(
        { error: 'Invite not found', success: false },
        { status: 404 }
      );
    }

    // Use session ID or generate a new partial ID
    const partialId = sessionId || generatePartialId();

    // Check if we already have a partial activation for this session
    const { data: existingPartial } = await db
      .from('permanent_special_invite_claims')
      .select('id, metadata')
      .eq('invite_code', normalizedCode)
      .eq('claimed_by_wallet', partialId)
      .single();

    // Build metadata for partial activation
    const metadata: Record<string, unknown> = {
      isPartialActivation: true,
      partialSessionId: partialId,
      partialCreatedAt: existingPartial?.metadata?.partialCreatedAt || new Date().toISOString(),
      partialUpdatedAt: new Date().toISOString(),
    };

    if (email) {
      metadata.email = email;
    }
    if (selectedRole) {
      metadata.selectedRole = selectedRole;
    }
    if (twitter) {
      metadata.twitter = twitter;
    }
    if (discord) {
      metadata.discord = discord;
    }
    if (educationProgress) {
      metadata.educationProgress = educationProgress;
    }

    if (existingPartial) {
      // Update existing partial activation
      const { error: updateError } = await db
        .from('permanent_special_invite_claims')
        .update({
          metadata: {
            ...existingPartial.metadata,
            ...metadata,
          },
        })
        .eq('id', existingPartial.id);

      if (updateError) {
        console.error('Error updating partial activation:', updateError);
        return NextResponse.json(
          { error: 'Failed to update partial activation', success: false },
          { status: 500 }
        );
      }

      console.log('[PartialActivation] Updated:', {
        code: normalizedCode,
        partialId,
        email: email ? 'yes' : 'no',
        role: selectedRole || 'none',
      });

      return NextResponse.json({
        success: true,
        updated: true,
        partialId,
        message: 'Partial activation updated',
      });
    } else {
      // Create new partial activation record
      const { error: insertError } = await db
        .from('permanent_special_invite_claims')
        .insert({
          invite_code: normalizedCode,
          claimed_by_wallet: partialId, // Temporary ID until wallet connects
          referrer_wallet: invite.referrer_wallet || null,
          referrer_code: invite.referrer_code || null,
          education_completed: false,
          wallet_connected: false, // Key indicator this is partial
          profile_created: !!(email || selectedRole),
          signup_bonus_claimed: false,
          ip_hash: ipHash || null,
          user_agent: userAgent || null,
          claimed_at: new Date().toISOString(),
          metadata,
        });

      if (insertError) {
        console.error('Error creating partial activation:', insertError);
        return NextResponse.json(
          { error: 'Failed to create partial activation', success: false },
          { status: 500 }
        );
      }

      console.log('[PartialActivation] Created:', {
        code: normalizedCode,
        partialId,
        email: email ? 'yes' : 'no',
        role: selectedRole || 'none',
      });

      return NextResponse.json({
        success: true,
        created: true,
        partialId,
        message: 'Partial activation recorded',
      });
    }
  } catch (error) {
    console.error('Error in POST /api/referrals/permanent-invite/partial-activation:', error);
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    );
  }
}

/**
 * GET: Get all partial activations for an invite code
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const walletAddress = searchParams.get('wallet'); // Optional: filter by referrer wallet

    if (!code && !walletAddress) {
      return NextResponse.json(
        { error: 'Invite code or wallet address is required', success: false },
        { status: 400 }
      );
    }

    const db = getSupabase();

    let query = db
      .from('permanent_special_invite_claims')
      .select('*')
      .eq('wallet_connected', false); // Only get partial activations

    if (code) {
      query = query.eq('invite_code', code.toUpperCase());
    }

    if (walletAddress) {
      query = query.eq('referrer_wallet', walletAddress.toLowerCase());
    }

    const { data: partials, error } = await query
      .order('claimed_at', { ascending: false });

    if (error) {
      console.error('Error fetching partial activations:', error);
      return NextResponse.json(
        { error: 'Failed to fetch partial activations', success: false },
        { status: 500 }
      );
    }

    // Format partial activations for response
    const formattedPartials = partials?.map((partial: any) => {
      const metadata = partial.metadata || {};
      return {
        partialId: partial.claimed_by_wallet,
        inviteCode: partial.invite_code,
        referrerWallet: partial.referrer_wallet,
        createdAt: metadata.partialCreatedAt || partial.claimed_at,
        updatedAt: metadata.partialUpdatedAt || partial.claimed_at,
        // User data collected
        email: metadata.email || null,
        selectedRole: metadata.selectedRole || null,
        twitter: metadata.twitter || null,
        discord: metadata.discord || null,
        educationProgress: metadata.educationProgress || null,
        // Status indicators
        hasEmail: !!metadata.email,
        hasRole: !!metadata.selectedRole,
        hasTwitter: !!metadata.twitter?.verified,
        hasDiscord: !!metadata.discord?.verified,
        profileCreated: partial.profile_created,
      };
    }) || [];

    // Calculate summary stats
    const summary = {
      total: formattedPartials.length,
      withEmail: formattedPartials.filter((p: any) => p.hasEmail).length,
      withRole: formattedPartials.filter((p: any) => p.hasRole).length,
      withTwitter: formattedPartials.filter((p: any) => p.hasTwitter).length,
      withDiscord: formattedPartials.filter((p: any) => p.hasDiscord).length,
    };

    return NextResponse.json({
      success: true,
      partialActivations: formattedPartials,
      summary,
    });
  } catch (error) {
    console.error('Error in GET /api/referrals/permanent-invite/partial-activation:', error);
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    );
  }
}
