/**
 * 👤 USER PROFILE API
 *
 * GET - Get profile by wallet address
 * POST - Create/get profile (auto-create if not exists)
 * PATCH - Update profile information
 *
 * @endpoint /api/profile
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getOrCreateProfile,
  getProfileByWallet,
  getPublicProfile,
  updateProfile,
  updateProfileSettings,
  calculateTier,
  getTierColor,
} from '@/lib/profiles/profile-service';
import type { ProfileUpdateRequest, ProfileSettings } from '@/lib/supabase/types';

// GET /api/profile?wallet=0x...&public=true
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');
    const isPublicRequest = searchParams.get('public') === 'true';

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Validate wallet format
    if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }

    // Return public profile if requested
    if (isPublicRequest) {
      const publicProfile = await getPublicProfile(wallet);

      if (!publicProfile) {
        return NextResponse.json(
          { error: 'Profile not found or is private' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: publicProfile,
      });
    }

    // Return full profile for owner
    let profile;
    try {
      profile = await getProfileByWallet(wallet);
    } catch (dbError) {
      console.warn('Supabase unavailable for GET:', dbError instanceof Error ? dbError.message : dbError);
      return NextResponse.json(
        { error: 'Profile not found', dbUnavailable: true },
        { status: 404 }
      );
    }

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    const tier = calculateTier(profile.reputation_score);

    return NextResponse.json({
      success: true,
      data: {
        ...profile,
        tier,
        tier_color: getTierColor(tier),
        // Hide sensitive fields
        password_hash: undefined,
        email_verification_token: undefined,
        password_reset_token: undefined,
      },
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// POST /api/profile - Create or get profile
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { wallet } = body;

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Validate wallet format
    if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }

    let profile;
    try {
      profile = await getOrCreateProfile(wallet);
    } catch (dbError) {
      console.warn('Supabase unavailable, returning mock profile:', dbError instanceof Error ? dbError.message : dbError);
      // Return mock profile when Supabase is not configured
      const mockProfile = {
        wallet_address: wallet.toLowerCase(),
        username: null,
        display_name: null,
        bio: null,
        email: null,
        email_verified: false,
        avatar_url: null,
        reputation_score: 0,
        total_tasks_completed: 0,
        total_cgc_earned: 0,
        total_referrals: 0,
        login_count: 1,
        last_login_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        twitter_handle: null,
        discord_handle: null,
        telegram_handle: null,
        website_url: null,
        twitter_verified: false,
        discord_verified: false,
        telegram_verified: false,
      };
      return NextResponse.json({
        success: true,
        mock: true,
        data: {
          ...mockProfile,
          tier: 'Starter' as const,
          tier_color: '#94a3b8',
        },
      });
    }

    const tier = calculateTier(profile.reputation_score);

    return NextResponse.json({
      success: true,
      data: {
        ...profile,
        tier,
        tier_color: getTierColor(tier),
        password_hash: undefined,
        email_verification_token: undefined,
        password_reset_token: undefined,
      },
    });
  } catch (error) {
    console.error('Error creating profile:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create profile' },
      { status: 500 }
    );
  }
}

// PATCH /api/profile - Update profile
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { wallet, ...updates } = body as { wallet: string } & ProfileUpdateRequest;

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Validate wallet format
    if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }

    // Extract settings if present
    const { settings, ...profileUpdates } = updates;

    // Update profile info
    let profile;
    try {
      profile = await updateProfile(wallet, profileUpdates);

      // Update settings if provided
      if (settings) {
        profile = await updateProfileSettings(wallet, settings as Partial<ProfileSettings>);
      }
    } catch (dbError) {
      console.warn('Supabase unavailable for PATCH:', dbError instanceof Error ? dbError.message : dbError);
      // Return mock success to prevent client-side infinite retry loops
      return NextResponse.json({
        success: true,
        mock: true,
        data: {
          wallet_address: wallet.toLowerCase(),
          ...profileUpdates,
          tier: 'Starter' as const,
          tier_color: '#94a3b8',
        },
      });
    }

    const tier = calculateTier(profile.reputation_score);

    return NextResponse.json({
      success: true,
      data: {
        ...profile,
        tier,
        tier_color: getTierColor(tier),
        password_hash: undefined,
        email_verification_token: undefined,
        password_reset_token: undefined,
      },
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update profile' },
      { status: 500 }
    );
  }
}
