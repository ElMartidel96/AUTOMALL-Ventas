/**
 * Cross-Platform Profile API
 *
 * Public API endpoint for fetching user profiles from other platforms.
 * Enables unified identity across DAO and Wallets platforms.
 *
 * Made by mbxarts.com The Moon in a Box property
 *
 * Co-Author: Godez22
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getPublicProfile,
  getOrCreateProfile,
  calculateTier,
  getTierColor,
} from '@/lib/profiles/profile-service';

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'https://gifts.mbxarts.com',
  'https://cryptogift-wallets.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
];

/**
 * Add CORS headers to response
 */
function corsHeaders(origin: string | null) {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400',
  };

  // Only set Allow-Origin if origin is in allowed list
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';
  }

  return headers;
}

/**
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}

/**
 * GET /api/cross-platform/profile?wallet=0x...
 *
 * Fetch public profile for cross-platform display.
 * Returns profile data safe for display on external platforms.
 */
export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);

  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');

    if (!wallet) {
      return NextResponse.json(
        { success: false, error: 'Wallet address is required' },
        { status: 400, headers }
      );
    }

    // Validate wallet format
    if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
      return NextResponse.json(
        { success: false, error: 'Invalid wallet address format' },
        { status: 400, headers }
      );
    }

    // Try to get public profile first
    let profile = await getPublicProfile(wallet);

    // If no public profile, return minimal info indicating no profile exists
    if (!profile) {
      return NextResponse.json(
        {
          success: true,
          data: null,
          message: 'No public profile found for this wallet',
        },
        { headers }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          wallet_address: profile.wallet_address,
          username: profile.username,
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
          bio: profile.bio,
          tier: profile.tier,
          tier_color: profile.tier_color,
          total_cgc_earned: profile.total_cgc_earned,
          total_tasks_completed: profile.total_tasks_completed,
          reputation_score: profile.reputation_score,
          twitter_handle: profile.twitter_handle,
          discord_handle: profile.discord_handle,
        },
      },
      { headers }
    );
  } catch (error) {
    console.error('Error fetching cross-platform profile:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch profile' },
      { status: 500, headers }
    );
  }
}

/**
 * POST /api/cross-platform/profile
 *
 * Auto-create profile for new users from Wallets platform.
 * Creates a basic profile that can be expanded later.
 */
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  const headers = corsHeaders(origin);

  try {
    const body = await request.json();
    const { wallet } = body;

    if (!wallet) {
      return NextResponse.json(
        { success: false, error: 'Wallet address is required' },
        { status: 400, headers }
      );
    }

    // Validate wallet format
    if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
      return NextResponse.json(
        { success: false, error: 'Invalid wallet address format' },
        { status: 400, headers }
      );
    }

    // Create or get profile
    const profile = await getOrCreateProfile(wallet);
    const tier = calculateTier(profile.reputation_score);

    return NextResponse.json(
      {
        success: true,
        data: {
          wallet_address: profile.wallet_address,
          username: profile.username,
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
          bio: profile.bio,
          tier,
          tier_color: getTierColor(tier),
          total_cgc_earned: profile.show_balance ? profile.total_cgc_earned : 0,
          total_tasks_completed: profile.total_tasks_completed,
          reputation_score: profile.reputation_score,
          is_new: profile.created_at === profile.updated_at,
        },
      },
      { headers }
    );
  } catch (error) {
    console.error('Error creating cross-platform profile:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create profile' },
      { status: 500, headers }
    );
  }
}
