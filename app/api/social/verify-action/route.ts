/**
 * 🔐 Social Action Verification API
 *
 * POST /api/social/verify-action - Verify if user completed a social action
 *
 * Actions:
 * - discord_join: Check if user is a member of the DAO Discord server
 * - twitter_follow: Check if user follows @cryptogiftdao
 */

import { NextRequest, NextResponse } from 'next/server';

// Discord Bot Token and Guild ID from env
const DISCORD_BOT_TOKEN = process.env.DISCORD_DAO_TOKEN;
const DISCORD_GUILD_ID = process.env.DISCORD_DAO_GUILD_ID || '1440971032818090006';

// Twitter Account ID for @cryptogiftdao (we'll fetch this once)
const TWITTER_CRYPTOGIFT_USERNAME = 'cryptogiftdao';

// ============================================
// DISCORD VERIFICATION
// ============================================

/**
 * Check if a Discord user is a member of the DAO guild
 * Uses Bot token to query guild members
 */
async function checkDiscordMembership(discordUserId: string): Promise<{
  isMember: boolean;
  username?: string;
  error?: string;
}> {
  if (!DISCORD_BOT_TOKEN) {
    return { isMember: false, error: 'Discord bot not configured' };
  }

  try {
    // Try to get the member from the guild
    const response = await fetch(
      `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${discordUserId}`,
      {
        headers: {
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
        },
      }
    );

    if (response.status === 200) {
      const member = await response.json();
      return {
        isMember: true,
        username: member.user?.username || member.user?.global_name,
      };
    }

    if (response.status === 404) {
      // User is not a member
      return { isMember: false };
    }

    // Other error
    const errorText = await response.text();
    console.error('[Discord] API error:', response.status, errorText);
    return { isMember: false, error: `Discord API error: ${response.status}` };
  } catch (error) {
    console.error('[Discord] Fetch error:', error);
    return { isMember: false, error: 'Failed to check Discord membership' };
  }
}

// ============================================
// TWITTER VERIFICATION
// ============================================

/**
 * Get user ID for a Twitter username using App-Only Auth
 */
async function getTwitterUserId(username: string, bearerToken: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://api.twitter.com/2/users/by/username/${username}`,
      {
        headers: {
          Authorization: `Bearer ${bearerToken}`,
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      return data.data?.id || null;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Check if a user follows @cryptogiftdao using Twitter API v2
 * Uses OAuth 2.0 User Access Token (from user's authorization)
 */
async function checkTwitterFollow(
  userAccessToken: string,
  userId: string
): Promise<{
  isFollowing: boolean;
  error?: string;
}> {
  try {
    // First get the ID of @cryptogiftdao
    const targetResponse = await fetch(
      `https://api.twitter.com/2/users/by/username/${TWITTER_CRYPTOGIFT_USERNAME}`,
      {
        headers: {
          Authorization: `Bearer ${userAccessToken}`,
        },
      }
    );

    if (!targetResponse.ok) {
      return { isFollowing: false, error: 'Could not find @cryptogiftdao account' };
    }

    const targetData = await targetResponse.json();
    const targetUserId = targetData.data?.id;

    if (!targetUserId) {
      return { isFollowing: false, error: 'Could not get @cryptogiftdao ID' };
    }

    // Check if user follows the target
    // GET /2/users/:id/following - requires follows.read scope
    const response = await fetch(
      `https://api.twitter.com/2/users/${userId}/following?user.fields=id&max_results=1000`,
      {
        headers: {
          Authorization: `Bearer ${userAccessToken}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('[Twitter] API error checking follow:', error);

      // Check if it's a scope/permission issue
      if (response.status === 403) {
        return { isFollowing: false, error: 'Need follows.read permission' };
      }

      return { isFollowing: false, error: 'Twitter API error' };
    }

    const data = await response.json();
    const following = data.data || [];

    // Check if @cryptogiftdao is in the following list
    const isFollowing = following.some((user: { id: string }) => user.id === targetUserId);

    return { isFollowing };
  } catch (error) {
    console.error('[Twitter] Check follow error:', error);
    return { isFollowing: false, error: 'Failed to check Twitter follow' };
  }
}

/**
 * Alternative: Check if user follows using the relationship lookup endpoint
 * This is more efficient as it checks a single relationship
 */
async function checkTwitterFollowDirect(
  userAccessToken: string,
  sourceUserId: string,
  targetUsername: string = TWITTER_CRYPTOGIFT_USERNAME
): Promise<{
  isFollowing: boolean;
  error?: string;
}> {
  try {
    // Get target user ID
    const targetResponse = await fetch(
      `https://api.twitter.com/2/users/by/username/${targetUsername}`,
      {
        headers: {
          Authorization: `Bearer ${userAccessToken}`,
        },
      }
    );

    if (!targetResponse.ok) {
      return { isFollowing: false, error: `Could not find @${targetUsername}` };
    }

    const targetData = await targetResponse.json();
    const targetUserId = targetData.data?.id;

    if (!targetUserId) {
      return { isFollowing: false, error: `Could not get @${targetUsername} ID` };
    }

    // Use the source user lookup to check connections
    // This endpoint returns connection_status
    const response = await fetch(
      `https://api.twitter.com/2/users?ids=${targetUserId}&user.fields=connection_status`,
      {
        headers: {
          Authorization: `Bearer ${userAccessToken}`,
        },
      }
    );

    if (!response.ok) {
      // Fallback to checking following list
      return checkTwitterFollow(userAccessToken, sourceUserId);
    }

    const data = await response.json();
    const connections = data.data?.[0]?.connection_status || [];

    // Check if 'following' is in the connection status
    const isFollowing = connections.includes('following');

    return { isFollowing };
  } catch (error) {
    console.error('[Twitter] Direct follow check error:', error);
    return { isFollowing: false, error: 'Failed to check follow status' };
  }
}

// ============================================
// API HANDLER
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, discordUserId, twitterUserId, twitterAccessToken } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Action required (discord_join or twitter_follow)' },
        { status: 400 }
      );
    }

    // Handle Discord membership check
    if (action === 'discord_join') {
      if (!discordUserId) {
        return NextResponse.json(
          { error: 'Discord user ID required', needsAuth: true },
          { status: 400 }
        );
      }

      const result = await checkDiscordMembership(discordUserId);

      return NextResponse.json({
        success: true,
        verified: result.isMember,
        platform: 'discord',
        username: result.username,
        error: result.error,
        // If not a member, provide the invite link
        inviteUrl: !result.isMember ? 'https://discord.gg/XzmKkrvhHc' : undefined,
      });
    }

    // Handle Twitter follow check
    if (action === 'twitter_follow') {
      if (!twitterUserId || !twitterAccessToken) {
        return NextResponse.json(
          { error: 'Twitter credentials required', needsAuth: true },
          { status: 400 }
        );
      }

      const result = await checkTwitterFollowDirect(
        twitterAccessToken,
        twitterUserId,
        TWITTER_CRYPTOGIFT_USERNAME
      );

      return NextResponse.json({
        success: true,
        verified: result.isFollowing,
        platform: 'twitter',
        error: result.error,
        // If not following, provide the follow URL
        followUrl: !result.isFollowing
          ? `https://twitter.com/intent/follow?screen_name=${TWITTER_CRYPTOGIFT_USERNAME}`
          : undefined,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[SocialVerify] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
