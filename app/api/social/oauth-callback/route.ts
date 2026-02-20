/**
 * 🔐 OAuth Callback for Social Verification
 *
 * GET /api/social/oauth-callback - Handle OAuth callbacks for Twitter/Discord
 *
 * This callback:
 * 1. Exchanges auth code for tokens
 * 2. Gets user info
 * 3. Verifies the action (follow/join)
 * 4. Returns result to popup window
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getOAuthState,
  removeOAuthState,
  exchangeTwitterCode,
  getTwitterUser,
  exchangeDiscordCode,
  getDiscordUser,
} from '@/lib/social/social-verification-service';

// Discord Bot Token for guild membership check
const DISCORD_BOT_TOKEN = process.env.DISCORD_DAO_TOKEN;
const DISCORD_GUILD_ID = process.env.DISCORD_DAO_GUILD_ID || '1440971032818090006';
const TWITTER_CRYPTOGIFT_USERNAME = 'cryptogiftdao';

/**
 * Check if user is a member of the Discord guild using Bot token
 */
async function checkDiscordMembership(discordUserId: string): Promise<boolean> {
  if (!DISCORD_BOT_TOKEN) return false;

  try {
    const response = await fetch(
      `https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${discordUserId}`,
      {
        headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` },
      }
    );
    return response.status === 200;
  } catch {
    return false;
  }
}

/**
 * Check if user follows @cryptogiftdao using their access token
 */
async function checkTwitterFollow(accessToken: string, userId: string): Promise<boolean> {
  try {
    // Get @cryptogiftdao user ID
    const targetResponse = await fetch(
      `https://api.twitter.com/2/users/by/username/${TWITTER_CRYPTOGIFT_USERNAME}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!targetResponse.ok) return false;
    const targetData = await targetResponse.json();
    const targetUserId = targetData.data?.id;
    if (!targetUserId) return false;

    // Check following list (paginated, check first 1000)
    let nextToken: string | undefined;
    let isFollowing = false;

    do {
      const url = new URL(`https://api.twitter.com/2/users/${userId}/following`);
      url.searchParams.set('max_results', '1000');
      if (nextToken) url.searchParams.set('pagination_token', nextToken);

      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) break;
      const data = await response.json();

      if (data.data?.some((user: { id: string }) => user.id === targetUserId)) {
        isFollowing = true;
        break;
      }

      nextToken = data.meta?.next_token;
    } while (nextToken);

    return isFollowing;
  } catch (error) {
    console.error('[Twitter] Follow check error:', error);
    return false;
  }
}

/**
 * Generate HTML response that posts message to parent window and closes popup
 */
function generateCallbackHtml(result: {
  success: boolean;
  platform: 'twitter' | 'discord';
  verified: boolean;
  userId?: string;
  username?: string;
  error?: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>Verificando...</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .container {
      text-align: center;
      padding: 2rem;
    }
    .spinner {
      border: 3px solid rgba(255,255,255,0.3);
      border-top: 3px solid white;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .success { color: #4ade80; }
    .error { color: #f87171; }
  </style>
</head>
<body>
  <div class="container">
    <div class="spinner" id="spinner"></div>
    <p id="message">Verificando...</p>
  </div>
  <script>
    const result = ${JSON.stringify(result)};

    // Post message to parent window
    if (window.opener) {
      window.opener.postMessage({
        type: 'SOCIAL_OAUTH_CALLBACK',
        ...result
      }, '*');
    }

    // Update UI
    document.getElementById('spinner').style.display = 'none';
    const messageEl = document.getElementById('message');

    if (result.success && result.verified) {
      messageEl.innerHTML = '✅ ${result.platform === 'twitter' ? 'Twitter follow' : 'Discord membership'} verified!<br><small>Closing...</small>';
      messageEl.className = 'success';
    } else if (result.success && !result.verified) {
      messageEl.innerHTML = '⚠️ Please ${result.platform === 'twitter' ? 'follow @cryptogiftdao' : 'join our Discord server'} first<br><small>Closing...</small>';
      messageEl.className = 'error';
    } else {
      messageEl.innerHTML = '❌ ' + (result.error || 'Verification failed') + '<br><small>Closing...</small>';
      messageEl.className = 'error';
    }

    // Close popup after 2 seconds
    setTimeout(() => {
      window.close();
    }, 2000);
  </script>
</body>
</html>
`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Get base URL - MUST match exactly what's registered in Twitter/Discord Developer Portal
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mbxarts.com';
  console.log(`[OAuth Callback] Request host: ${request.headers.get('host')}, baseUrl: ${baseUrl}`);

  // Helper to redirect to verify page (for returnToVerify flow)
  const redirectToVerify = (
    platform: string,
    success: boolean,
    verified: boolean,
    errorMsg?: string,
    accessToken?: string,
    userId?: string,
    username?: string // NEW: Store username for DB save and postMessage
  ) => {
    console.log(`[OAuth Callback] redirectToVerify called: platform=${platform}, success=${success}, verified=${verified}, hasToken=${!!accessToken}, hasUserId=${!!userId}, username=${username}`);

    const params = new URLSearchParams({
      platform,
      oauth: 'complete',
      verified: verified.toString(),
    });
    if (errorMsg) params.set('error', errorMsg);

    const response = NextResponse.redirect(`${baseUrl}/social/verify?${params.toString()}`);

    // Store access token AND userId in cookies for later verification
    // Use domain to ensure cookies work across www and non-www
    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: 'lax' as const,
      maxAge: 60 * 60, // 1 hour
      path: '/',
    };

    if (accessToken) {
      console.log(`[OAuth Callback] Setting ${platform}_oauth_token cookie`);
      response.cookies.set(`${platform}_oauth_token`, accessToken, cookieOptions);
    }
    if (userId) {
      console.log(`[OAuth Callback] Setting ${platform}_oauth_user_id cookie: ${userId}`);
      response.cookies.set(`${platform}_oauth_user_id`, userId, cookieOptions);
    }

    // Store username in non-httpOnly cookie so frontend can read it for postMessage
    if (username) {
      const usernameCookieOptions = {
        httpOnly: false, // Not httpOnly so frontend can read it
        secure: true,
        sameSite: 'lax' as const,
        maxAge: 60 * 60, // 1 hour
        path: '/',
      };
      console.log(`[OAuth Callback] Setting ${platform}_oauth_username cookie: ${username}`);
      response.cookies.set(`${platform}_oauth_username`, username, usernameCookieOptions);
    }

    return response;
  };

  // Handle OAuth errors
  if (error) {
    // Check if we should redirect to verify page
    const oauthState = state ? getOAuthState(state) : null;
    if (oauthState?.returnToVerify) {
      return redirectToVerify(oauthState.platform, false, false, `OAuth error: ${error}`);
    }

    return new NextResponse(
      generateCallbackHtml({
        success: false,
        platform: 'twitter',
        verified: false,
        error: `OAuth error: ${error}`,
      }),
      { headers: { 'Content-Type': 'text/html' } }
    );
  }

  if (!code || !state) {
    return new NextResponse(
      generateCallbackHtml({
        success: false,
        platform: 'twitter',
        verified: false,
        error: 'Missing code or state',
      }),
      { headers: { 'Content-Type': 'text/html' } }
    );
  }

  // Get OAuth state
  const oauthState = getOAuthState(state);
  if (!oauthState) {
    return new NextResponse(
      generateCallbackHtml({
        success: false,
        platform: 'twitter',
        verified: false,
        error: 'Invalid or expired state',
      }),
      { headers: { 'Content-Type': 'text/html' } }
    );
  }

  const { platform, codeVerifier, returnToVerify } = oauthState;
  const redirectUri = `${baseUrl}/api/social/oauth-callback`;

  try {
    if (platform === 'twitter') {
      console.log('[OAuth Callback] Twitter flow started');

      // Exchange code for tokens
      console.log('[OAuth Callback] Exchanging Twitter code for tokens...');
      const tokens = await exchangeTwitterCode(code, redirectUri, codeVerifier!);
      console.log('[OAuth Callback] Twitter tokens received');

      console.log('[OAuth Callback] Getting Twitter user info...');
      const user = await getTwitterUser(tokens.access_token);
      console.log(`[OAuth Callback] Twitter user: ${user.username} (${user.id})`);

      // Check if user follows @cryptogiftdao
      console.log('[OAuth Callback] Checking Twitter follow status...');
      const isFollowing = await checkTwitterFollow(tokens.access_token, user.id);
      console.log(`[OAuth Callback] Twitter follow status: ${isFollowing}`);

      removeOAuthState(state);

      // If returnToVerify, redirect back to verify page with credentials stored
      if (returnToVerify) {
        console.log('[OAuth Callback] Redirecting to verify page with credentials');
        // Don't pass error message if not following - the action step will handle it
        // Only pass error for actual errors (OAuth failures, etc.)
        return redirectToVerify('twitter', true, isFollowing,
          undefined, // Don't pass 'not following' as error - it's expected state
          tokens.access_token,
          user.id,  // Store userId for later verification
          user.username // Store username for DB save and postMessage
        );
      }

      return new NextResponse(
        generateCallbackHtml({
          success: true,
          platform: 'twitter',
          verified: isFollowing,
          userId: user.id,
          username: user.username,
          error: isFollowing ? undefined : 'Please follow @cryptogiftdao first',
        }),
        { headers: { 'Content-Type': 'text/html' } }
      );
    }

    if (platform === 'discord') {
      // Exchange code for tokens
      const tokens = await exchangeDiscordCode(code, redirectUri);
      const user = await getDiscordUser(tokens.access_token);

      // Format username (Discord removed discriminators for most users)
      const discordUsername = user.discriminator === '0'
        ? user.username
        : `${user.username}#${user.discriminator}`;

      // Check if user is a member of the guild
      const isMember = await checkDiscordMembership(user.id);

      removeOAuthState(state);

      // If returnToVerify, redirect back to verify page with credentials stored
      if (returnToVerify) {
        console.log('[OAuth Callback] Redirecting to verify page with Discord credentials');
        // Don't pass error message if not member - the action step will handle it
        return redirectToVerify('discord', true, isMember,
          undefined, // Don't pass 'not member' as error - it's expected state
          tokens.access_token,
          user.id,  // Store userId for later verification
          discordUsername // Store username for DB save and postMessage
        );
      }

      return new NextResponse(
        generateCallbackHtml({
          success: true,
          platform: 'discord',
          verified: isMember,
          userId: user.id,
          username: discordUsername,
          error: isMember ? undefined : 'Please join our Discord server first',
        }),
        { headers: { 'Content-Type': 'text/html' } }
      );
    }

    return new NextResponse(
      generateCallbackHtml({
        success: false,
        platform: 'twitter',
        verified: false,
        error: 'Unknown platform',
      }),
      { headers: { 'Content-Type': 'text/html' } }
    );
  } catch (error) {
    console.error('[OAuth Callback] Error:', error);

    // If returnToVerify, redirect with error
    if (returnToVerify) {
      return redirectToVerify(platform, false, false,
        error instanceof Error ? error.message : 'Verification failed'
      );
    }

    return new NextResponse(
      generateCallbackHtml({
        success: false,
        platform: platform as 'twitter' | 'discord',
        verified: false,
        error: error instanceof Error ? error.message : 'Verification failed',
      }),
      { headers: { 'Content-Type': 'text/html' } }
    );
  }
}
