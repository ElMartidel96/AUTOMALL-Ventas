/**
 * 🔐 Social OAuth Initiation API
 *
 * POST /api/auth/social
 * Initiates OAuth flow for social verification
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getTwitterAuthUrl,
  getDiscordAuthUrl,
  SocialPlatform,
} from '@/lib/social/social-verification-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { platform, walletAddress } = body as {
      platform: SocialPlatform;
      walletAddress: string;
    };

    if (!platform || !walletAddress) {
      return NextResponse.json(
        { error: 'Platform and wallet address are required' },
        { status: 400 }
      );
    }

    // Validate platform
    if (!['twitter', 'discord', 'telegram'].includes(platform)) {
      return NextResponse.json(
        { error: 'Invalid platform' },
        { status: 400 }
      );
    }

    // Get base URL for redirect - sanitize to prevent double protocol
    let baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    // Remove trailing slash and ensure no double protocol
    baseUrl = baseUrl.replace(/\/+$/, '').replace(/^https?:\/\/https?:\/\//, 'https://');
    // Ensure it has a protocol
    if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      baseUrl = `https://${baseUrl}`;
    }
    const redirectUri = `${baseUrl}/api/auth/social/callback/${platform}`;
    console.log('[Social OAuth] Redirect URI:', redirectUri); // Debug log

    let authUrl: string;
    let state: string;

    switch (platform) {
      case 'twitter':
        const twitterAuth = getTwitterAuthUrl(walletAddress, redirectUri);
        authUrl = twitterAuth.url;
        state = twitterAuth.state;
        break;

      case 'discord':
        const discordAuth = getDiscordAuthUrl(walletAddress, redirectUri);
        authUrl = discordAuth.url;
        state = discordAuth.state;
        break;

      case 'telegram':
        // Telegram uses a different flow (Login Widget)
        // Return the bot username for the widget
        const botUsername = process.env.TELEGRAM_BOT_USERNAME;
        if (!botUsername) {
          return NextResponse.json(
            { error: 'Telegram bot not configured' },
            { status: 500 }
          );
        }
        return NextResponse.json({
          success: true,
          platform: 'telegram',
          type: 'widget',
          botUsername,
        });

      default:
        return NextResponse.json(
          { error: 'Unsupported platform' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      platform,
      type: 'redirect',
      authUrl,
      state,
    });
  } catch (error) {
    console.error('Social auth initiation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to initiate OAuth' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/social
 * Get verification status for a wallet
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet');

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    const { getVerificationStatus } = await import('@/lib/social/social-verification-service');
    const status = await getVerificationStatus(walletAddress);

    return NextResponse.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('Get verification status error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get status' },
      { status: 500 }
    );
  }
}
