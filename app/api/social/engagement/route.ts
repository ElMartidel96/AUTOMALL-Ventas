/**
 * 🎯 Social Engagement API
 *
 * GET /api/social/engagement - Get engagement status for wallet
 * POST /api/social/engagement - Claim engagement reward
 */

import { NextRequest, NextResponse } from 'next/server';
import { authHelpers, type AuthContext } from '@/lib/auth/middleware';
import {
  getEngagementStatus,
  claimEngagementReward,
  recordEngagementClick,
  getEngagementUrl,
} from '@/lib/social/social-engagement-service';
import { SocialEngagementPlatform, SOCIAL_ENGAGEMENT_CONFIG } from '@/lib/supabase/types';

// ============================================
// GET - Get engagement status
// ============================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const walletAddress = searchParams.get('wallet');

  if (!walletAddress) {
    return NextResponse.json(
      { error: 'Wallet address required' },
      { status: 400 }
    );
  }

  try {
    const status = await getEngagementStatus(walletAddress);

    return NextResponse.json({
      success: true,
      data: {
        ...status,
        urls: {
          twitter: SOCIAL_ENGAGEMENT_CONFIG.twitter.followUrl,
          discord: SOCIAL_ENGAGEMENT_CONFIG.discord.joinUrl,
        },
      },
    });
  } catch (error) {
    console.error('Error getting engagement status:', error);
    return NextResponse.json(
      { error: 'Failed to get engagement status' },
      { status: 500 }
    );
  }
}

// ============================================
// POST - Claim reward or record click
// SECURITY: Requires wallet authentication and ownership verification
// ============================================

export const POST = authHelpers.protected(async (request: NextRequest, context: AuthContext) => {
  try {
    const body = await request.json();
    const { walletAddress, platform, action } = body;

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address required' },
        { status: 400 }
      );
    }

    if (!platform || !['twitter', 'discord'].includes(platform)) {
      return NextResponse.json(
        { error: 'Valid platform required (twitter or discord)' },
        { status: 400 }
      );
    }

    // SECURITY: Verify the authenticated wallet matches the request wallet
    // This prevents attackers from claiming rewards for other wallets
    const authenticatedWallet = context.address?.toLowerCase();
    const requestedWallet = walletAddress.toLowerCase();

    if (authenticatedWallet !== requestedWallet) {
      console.warn(`[EngagementAPI] SECURITY: Wallet mismatch - Auth: ${authenticatedWallet}, Request: ${requestedWallet}`);
      return NextResponse.json(
        { error: 'Unauthorized: You can only claim rewards for your own wallet' },
        { status: 403 }
      );
    }

    const platformType = platform as SocialEngagementPlatform;

    // Handle different actions
    if (action === 'click') {
      // Record that user clicked the follow/join button
      await recordEngagementClick(walletAddress, platformType);
      return NextResponse.json({
        success: true,
        url: getEngagementUrl(platformType),
        message: `Opening ${platform === 'twitter' ? 'Twitter/X' : 'Discord'}...`,
      });
    }

    if (action === 'claim') {
      // Claim the reward
      console.log(`[EngagementAPI] Processing claim for ${walletAddress} on ${platform}`);
      const result = await claimEngagementReward(walletAddress, platformType);

      if (!result.success) {
        return NextResponse.json(
          {
            success: false,
            error: result.error,
            alreadyClaimed: result.alreadyClaimed,
          },
          { status: result.alreadyClaimed ? 409 : 400 }
        );
      }

      return NextResponse.json({
        success: true,
        platform: result.platform,
        rewardAmount: result.rewardAmount,
        message: `Congratulations! You earned ${result.rewardAmount} CGC for ${platform === 'twitter' ? 'following us on Twitter/X' : 'joining our Discord'}!`,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action (use "click" or "claim")' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error processing engagement action:', error);
    return NextResponse.json(
      { error: 'Failed to process engagement action' },
      { status: 500 }
    );
  }
});
