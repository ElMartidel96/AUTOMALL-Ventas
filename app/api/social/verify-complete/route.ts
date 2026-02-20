/**
 * 🔐 Complete Verification API (Server-Side)
 *
 * POST /api/social/verify-complete
 *
 * Reads OAuth credentials from httpOnly cookies (stored during OAuth callback)
 * and performs verification server-side.
 *
 * This endpoint exists because:
 * 1. Frontend cannot read httpOnly cookies
 * 2. We need to verify after user follows/joins (not during initial OAuth)
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { updateVerifiedSocial, SocialPlatform } from '@/lib/social/social-verification-service';

// Discord Bot Token for guild membership check
const DISCORD_BOT_TOKEN = process.env.DISCORD_DAO_TOKEN;
const DISCORD_GUILD_ID = process.env.DISCORD_DAO_GUILD_ID || '1440971032818090006';
const TWITTER_CRYPTOGIFT_USERNAME = 'cryptogiftdao';

/**
 * Check if user is a member of the Discord guild using Bot token
 */
async function checkDiscordMembership(discordUserId: string): Promise<boolean> {
  if (!DISCORD_BOT_TOKEN) {
    console.error('[Discord] Bot token not configured');
    return false;
  }

  try {
    const response = await fetch(
      `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${discordUserId}`,
      {
        headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` },
      }
    );
    console.log(`[Discord] Membership check for ${discordUserId}: status ${response.status}`);
    return response.status === 200;
  } catch (error) {
    console.error('[Discord] Membership check error:', error);
    return false;
  }
}

/**
 * Check if user follows @cryptogiftdao using their access token
 * Returns { isFollowing: boolean, error?: string, details?: string }
 */
async function checkTwitterFollow(accessToken: string, userId: string): Promise<{ isFollowing: boolean; error?: string; details?: string }> {
  try {
    console.log(`[Twitter] Starting follow check for user ${userId}`);
    console.log(`[Twitter] Token preview: ${accessToken.substring(0, 20)}...`);

    // Get @cryptogiftdao user ID
    const targetResponse = await fetch(
      `https://api.twitter.com/2/users/by/username/${TWITTER_CRYPTOGIFT_USERNAME}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!targetResponse.ok) {
      const errorText = await targetResponse.text();
      console.error('[Twitter] Failed to get target user:', targetResponse.status, errorText);
      return {
        isFollowing: false,
        error: `Twitter API error (${targetResponse.status})`,
        details: `Could not find @${TWITTER_CRYPTOGIFT_USERNAME}: ${errorText}`
      };
    }

    const targetData = await targetResponse.json();
    const targetUserId = targetData.data?.id;
    if (!targetUserId) {
      console.error('[Twitter] No user ID in response:', targetData);
      return {
        isFollowing: false,
        error: 'Could not find @cryptogiftdao account',
        details: JSON.stringify(targetData)
      };
    }

    console.log(`[Twitter] Target user @${TWITTER_CRYPTOGIFT_USERNAME} ID: ${targetUserId}`);
    console.log(`[Twitter] Checking if ${userId} follows ${targetUserId}`);

    // Check following list (paginated)
    let nextToken: string | undefined;
    let isFollowing = false;
    let pagesChecked = 0;
    let totalUsersChecked = 0;

    do {
      const url = new URL(`https://api.twitter.com/2/users/${userId}/following`);
      url.searchParams.set('max_results', '1000');
      if (nextToken) url.searchParams.set('pagination_token', nextToken);

      console.log(`[Twitter] Fetching following page ${pagesChecked + 1}...`);

      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Twitter] Following list failed:', response.status, errorText);
        return {
          isFollowing: false,
          error: `Failed to get following list (${response.status})`,
          details: errorText
        };
      }

      const data = await response.json();
      pagesChecked++;

      const usersInPage = data.data?.length || 0;
      totalUsersChecked += usersInPage;

      console.log(`[Twitter] Page ${pagesChecked}: ${usersInPage} users (total: ${totalUsersChecked})`);

      if (data.data?.some((user: { id: string }) => user.id === targetUserId)) {
        isFollowing = true;
        console.log(`[Twitter] ✅ Found! User IS following @${TWITTER_CRYPTOGIFT_USERNAME}`);
        break;
      }

      nextToken = data.meta?.next_token;
    } while (nextToken && pagesChecked < 10); // Limit to 10 pages (10,000 users max)

    console.log(`[Twitter] Final result: isFollowing=${isFollowing}, checked ${totalUsersChecked} users in ${pagesChecked} pages`);

    if (!isFollowing) {
      return {
        isFollowing: false,
        error: `Not following @${TWITTER_CRYPTOGIFT_USERNAME}`,
        details: `Checked ${totalUsersChecked} accounts in ${pagesChecked} pages`
      };
    }

    return { isFollowing: true };
  } catch (error) {
    console.error('[Twitter] Follow check exception:', error);
    return {
      isFollowing: false,
      error: 'Exception during verification',
      details: error instanceof Error ? error.message : String(error)
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { platform, walletAddress, bypassSave } = body;

    if (!platform || !['twitter', 'discord'].includes(platform)) {
      return NextResponse.json(
        { error: 'Valid platform required (twitter or discord)', verified: false },
        { status: 400 }
      );
    }

    // Read credentials from httpOnly cookies (set during OAuth callback)
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get(`${platform}_oauth_token`);
    const userIdCookie = cookieStore.get(`${platform}_oauth_user_id`);
    const usernameCookie = cookieStore.get(`${platform}_oauth_username`);

    if (!tokenCookie?.value || !userIdCookie?.value) {
      return NextResponse.json({
        success: false,
        verified: false,
        error: 'No authorization found. Please authorize first.',
        needsAuth: true,
      });
    }

    const accessToken = tokenCookie.value;
    const userId = userIdCookie.value;
    const username = usernameCookie?.value || '';

    console.log(`[VerifyComplete] Verifying ${platform} for user ${userId} (${username}), wallet: ${walletAddress || 'none'}`);

    let verified = false;
    let error: string | undefined;
    let details: string | undefined;

    // If bypassSave is true (Twitter bypass), skip verification and just save
    if (bypassSave) {
      console.log('[VerifyComplete] Bypass mode - skipping verification, just saving to DB');
      verified = true;
    } else if (platform === 'twitter') {
      const result = await checkTwitterFollow(accessToken, userId);
      verified = result.isFollowing;
      if (!verified) {
        error = result.error || 'Please follow @cryptogiftdao first';
        details = result.details;
        console.log('[VerifyComplete] Twitter verification failed:', result);
      }
    } else if (platform === 'discord') {
      verified = await checkDiscordMembership(userId);
      if (!verified) {
        error = 'Please join our Discord server first';
      }
    }

    // Save to database if verified and we have wallet + username
    if (verified && walletAddress && username) {
      try {
        console.log(`[VerifyComplete] Saving ${platform} verification to DB: wallet=${walletAddress}, username=${username}`);
        await updateVerifiedSocial(walletAddress, platform as SocialPlatform, {
          platformId: userId,
          username: username,
        });
        console.log(`[VerifyComplete] Successfully saved ${platform} verification to DB`);
      } catch (dbError) {
        // Log error but don't fail the verification
        console.error('[VerifyComplete] Failed to save to DB (non-blocking):', dbError);
      }
    } else if (verified) {
      console.log(`[VerifyComplete] Skipping DB save: walletAddress=${!!walletAddress}, username=${!!username}`);
    }

    console.log(`[VerifyComplete] Result: platform=${platform}, verified=${verified}, error=${error}`);

    return NextResponse.json({
      success: true,
      verified,
      platform,
      error,
      details,
      userId,
      username, // Include username in response
    });
  } catch (error) {
    console.error('[VerifyComplete] Error:', error);
    return NextResponse.json(
      { error: 'Verification failed', verified: false },
      { status: 500 }
    );
  }
}
