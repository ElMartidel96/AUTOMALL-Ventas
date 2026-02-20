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
    const profile = await getProfileByWallet(wallet);

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

    const profile = await getOrCreateProfile(wallet);
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
    let profile = await updateProfile(wallet, profileUpdates);

    // Update settings if provided
    if (settings) {
      profile = await updateProfileSettings(wallet, settings as Partial<ProfileSettings>);
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
