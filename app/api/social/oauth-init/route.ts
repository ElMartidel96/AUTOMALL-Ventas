/**
 * 🔐 OAuth Initiation API
 *
 * POST /api/social/oauth-init - Generate OAuth URL for Twitter/Discord verification
 *
 * Returns the OAuth authorization URL that should be opened in a popup
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getTwitterAuthUrl,
  getDiscordAuthUrl,
} from '@/lib/social/social-verification-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { platform, walletAddress, returnToVerify } = body;

    if (!platform || !['twitter', 'discord'].includes(platform)) {
      return NextResponse.json(
        { error: 'Valid platform required (twitter or discord)' },
        { status: 400 }
      );
    }

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address required' },
        { status: 400 }
      );
    }

    // Get base URL - MUST match exactly what's registered in Twitter/Discord Developer Portal
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mbxarts.com';
    const redirectUri = `${baseUrl}/api/social/oauth-callback`;
    console.log(`[OAuth Init] platform=${platform}, redirectUri=${redirectUri}`);

    if (platform === 'twitter') {
      const { url, state } = getTwitterAuthUrl(walletAddress, redirectUri, {
        returnToVerify: !!returnToVerify,
      });
      return NextResponse.json({
        success: true,
        platform: 'twitter',
        authUrl: url,
        state,
      });
    }

    if (platform === 'discord') {
      const { url, state } = getDiscordAuthUrl(walletAddress, redirectUri, {
        returnToVerify: !!returnToVerify,
      });
      return NextResponse.json({
        success: true,
        platform: 'discord',
        authUrl: url,
        state,
      });
    }

    return NextResponse.json(
      { error: 'Invalid platform' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[OAuth Init] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate OAuth URL' },
      { status: 500 }
    );
  }
}
