/**
 * 🎯 Social Engagement Service
 *
 * Handles social engagement rewards for following on Twitter and joining Discord
 * Implements trust-based reward system with anti-abuse measures
 */

import { createClient } from '@supabase/supabase-js';
import {
  SocialEngagementPlatform,
  SocialEngagementAction,
  SocialEngagementStatus,
  SocialEngagementReward,
  SOCIAL_ENGAGEMENT_CONFIG,
} from '@/lib/supabase/types';

// ============================================
// TYPES
// ============================================

export interface EngagementStatus {
  twitter: {
    eligible: boolean;
    claimed: boolean;
    claimedAt: string | null;
    rewardAmount: number;
  };
  discord: {
    eligible: boolean;
    claimed: boolean;
    claimedAt: string | null;
    rewardAmount: number;
  };
}

export interface ClaimResult {
  success: boolean;
  platform: SocialEngagementPlatform;
  rewardAmount: number;
  error?: string;
  alreadyClaimed?: boolean;
}

// ============================================
// CONFIGURATION
// ============================================

const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials not configured');
  }

  return createClient(supabaseUrl, supabaseKey);
};

// ============================================
// ENGAGEMENT STATUS
// ============================================

/**
 * Get social engagement status for a wallet
 * Shows which rewards are available and which have been claimed
 */
export async function getEngagementStatus(walletAddress: string): Promise<EngagementStatus> {
  const supabase = getSupabaseClient();
  const normalizedAddress = walletAddress.toLowerCase();

  // Check existing claims
  const { data: claims } = await supabase
    .from('social_engagement_rewards')
    .select('*')
    .eq('wallet_address', normalizedAddress);

  // Check if user has verified social accounts
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('twitter_verified, discord_verified')
    .eq('wallet_address', normalizedAddress)
    .single();

  const twitterClaim = claims?.find((c: SocialEngagementReward) => c.platform === 'twitter');
  const discordClaim = claims?.find((c: SocialEngagementReward) => c.platform === 'discord');

  return {
    twitter: {
      eligible: profile?.twitter_verified === true,
      claimed: twitterClaim?.status === 'claimed' || twitterClaim?.status === 'verified',
      claimedAt: twitterClaim?.claimed_at || null,
      rewardAmount: SOCIAL_ENGAGEMENT_CONFIG.twitter.rewardAmount,
    },
    discord: {
      eligible: profile?.discord_verified === true,
      claimed: discordClaim?.status === 'claimed' || discordClaim?.status === 'verified',
      claimedAt: discordClaim?.claimed_at || null,
      rewardAmount: SOCIAL_ENGAGEMENT_CONFIG.discord.rewardAmount,
    },
  };
}

// ============================================
// RECORD CLICK
// ============================================

/**
 * Record when user clicks the follow/join button
 * This helps track engagement funnel
 */
export async function recordEngagementClick(
  walletAddress: string,
  platform: SocialEngagementPlatform,
  platformUserId?: string,
  platformUsername?: string
): Promise<void> {
  const supabase = getSupabaseClient();
  const normalizedAddress = walletAddress.toLowerCase();

  // Check if record already exists
  const { data: existing } = await supabase
    .from('social_engagement_rewards')
    .select('id')
    .eq('wallet_address', normalizedAddress)
    .eq('platform', platform)
    .single();

  if (existing) {
    // Update existing record with click timestamp
    await supabase
      .from('social_engagement_rewards')
      .update({
        clicked_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
  } else {
    // Create new record with pending status
    const action: SocialEngagementAction = platform === 'twitter' ? 'follow' : 'join';
    await supabase.from('social_engagement_rewards').insert({
      wallet_address: normalizedAddress,
      platform,
      action,
      reward_amount: SOCIAL_ENGAGEMENT_CONFIG[platform].rewardAmount,
      status: 'pending' as SocialEngagementStatus,
      platform_user_id: platformUserId || null,
      platform_username: platformUsername || null,
      clicked_at: new Date().toISOString(),
    });
  }
}

// ============================================
// CLAIM REWARD
// ============================================

/**
 * Claim social engagement reward
 * Trust-based system - awards CGC when user confirms they followed/joined
 */
export async function claimEngagementReward(
  walletAddress: string,
  platform: SocialEngagementPlatform
): Promise<ClaimResult> {
  const supabase = getSupabaseClient();
  const normalizedAddress = walletAddress.toLowerCase();

  // 1. Check if user has verified their social account
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('twitter_verified, discord_verified, twitter_id, discord_id, twitter_handle, discord_handle')
    .eq('wallet_address', normalizedAddress)
    .single();

  if (!profile) {
    return {
      success: false,
      platform,
      rewardAmount: 0,
      error: 'Profile not found',
    };
  }

  // Check platform-specific verification
  const isVerified = platform === 'twitter' ? profile.twitter_verified : profile.discord_verified;
  if (!isVerified) {
    return {
      success: false,
      platform,
      rewardAmount: 0,
      error: `Please verify your ${platform === 'twitter' ? 'Twitter/X' : 'Discord'} account first`,
    };
  }

  // 2. Check if already claimed
  const { data: existingClaim } = await supabase
    .from('social_engagement_rewards')
    .select('*')
    .eq('wallet_address', normalizedAddress)
    .eq('platform', platform)
    .single();

  if (existingClaim && (existingClaim.status === 'claimed' || existingClaim.status === 'verified')) {
    return {
      success: false,
      platform,
      rewardAmount: 0,
      error: 'Reward already claimed',
      alreadyClaimed: true,
    };
  }

  // 3. Create or update claim record
  const rewardAmount = SOCIAL_ENGAGEMENT_CONFIG[platform].rewardAmount;
  const action: SocialEngagementAction = platform === 'twitter' ? 'follow' : 'join';
  const platformUserId = platform === 'twitter' ? profile.twitter_id : profile.discord_id;
  const platformUsername = platform === 'twitter' ? profile.twitter_handle : profile.discord_handle;

  if (existingClaim) {
    // Update existing pending record to claimed
    const { error } = await supabase
      .from('social_engagement_rewards')
      .update({
        status: 'claimed' as SocialEngagementStatus,
        claimed_at: new Date().toISOString(),
        platform_user_id: platformUserId,
        platform_username: platformUsername,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingClaim.id);

    if (error) {
      return {
        success: false,
        platform,
        rewardAmount: 0,
        error: 'Failed to update claim: ' + error.message,
      };
    }
  } else {
    // Create new claimed record
    const { error } = await supabase.from('social_engagement_rewards').insert({
      wallet_address: normalizedAddress,
      platform,
      action,
      reward_amount: rewardAmount,
      status: 'claimed' as SocialEngagementStatus,
      platform_user_id: platformUserId,
      platform_username: platformUsername,
      claimed_at: new Date().toISOString(),
    });

    if (error) {
      // Check for unique constraint violation (already claimed)
      if (error.code === '23505') {
        return {
          success: false,
          platform,
          rewardAmount: 0,
          error: 'Reward already claimed',
          alreadyClaimed: true,
        };
      }
      return {
        success: false,
        platform,
        rewardAmount: 0,
        error: 'Failed to create claim: ' + error.message,
      };
    }
  }

  // 4. Add CGC reward to user profile
  const { error: updateError } = await supabase
    .from('user_profiles')
    .update({
      total_cgc_earned: (profile as { total_cgc_earned?: number }).total_cgc_earned
        ? (profile as { total_cgc_earned: number }).total_cgc_earned + rewardAmount
        : rewardAmount,
      updated_at: new Date().toISOString(),
    })
    .eq('wallet_address', normalizedAddress);

  if (updateError) {
    console.error('Failed to update CGC balance:', updateError);
    // Don't fail the claim, just log the error
  }

  return {
    success: true,
    platform,
    rewardAmount,
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get intent/invite URL for a platform
 */
export function getEngagementUrl(platform: SocialEngagementPlatform): string {
  return platform === 'twitter'
    ? SOCIAL_ENGAGEMENT_CONFIG.twitter.followUrl
    : SOCIAL_ENGAGEMENT_CONFIG.discord.joinUrl;
}

/**
 * Check if user should see engagement modal after OAuth
 * Returns true if user has verified but not claimed reward
 */
export async function shouldShowEngagementModal(
  walletAddress: string,
  platform: SocialEngagementPlatform
): Promise<boolean> {
  const status = await getEngagementStatus(walletAddress);
  const platformStatus = status[platform];
  return platformStatus.eligible && !platformStatus.claimed;
}
