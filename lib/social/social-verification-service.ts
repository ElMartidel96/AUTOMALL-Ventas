/**
 * 🔐 Social Verification Service
 *
 * Handles OAuth verification for Twitter/X, Discord, and Telegram
 * Provides secure, non-invasive social account verification
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// ============================================
// TYPES
// ============================================

export type SocialPlatform = 'twitter' | 'discord' | 'telegram';

export interface OAuthState {
  walletAddress: string;
  platform: SocialPlatform;
  nonce: string;
  expiresAt: number;
  codeVerifier?: string; // For PKCE
  returnToVerify?: boolean; // If true, redirect back to /social/verify after OAuth
}

export interface TwitterTokenResponse {
  token_type: string;
  expires_in: number;
  access_token: string;
  scope: string;
  refresh_token?: string;
}

export interface TwitterUser {
  id: string;
  name: string;
  username: string;
  profile_image_url?: string;
}

export interface DiscordTokenResponse {
  token_type: string;
  access_token: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  global_name?: string;
  avatar?: string;
}

export interface TelegramAuthData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

export interface VerificationResult {
  success: boolean;
  platform: SocialPlatform;
  platformId: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  error?: string;
}

// ============================================
// CONFIGURATION
// ============================================

const getSupabaseClient = () => {
  // Support both standard and DAO-specific env var naming conventions
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_DAO_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_DAO_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('[SocialVerification] Missing Supabase credentials:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
      checkedVars: ['NEXT_PUBLIC_SUPABASE_DAO_URL', 'NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_DAO_SERVICE_KEY', 'SUPABASE_SERVICE_ROLE_KEY']
    });
    throw new Error('Supabase credentials not configured');
  }

  return createClient(supabaseUrl, supabaseKey);
};

// OAuth endpoints
const OAUTH_ENDPOINTS = {
  twitter: {
    authorize: 'https://twitter.com/i/oauth2/authorize',
    token: 'https://api.twitter.com/2/oauth2/token',
    userInfo: 'https://api.twitter.com/2/users/me',
  },
  discord: {
    authorize: 'https://discord.com/api/oauth2/authorize',
    token: 'https://discord.com/api/oauth2/token',
    userInfo: 'https://discord.com/api/users/@me',
  },
};

// ============================================
// PKCE UTILITIES (for Twitter OAuth 2.0)
// ============================================

/**
 * Generate a cryptographically secure code verifier for PKCE
 */
export function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Generate code challenge from code verifier using SHA256
 */
export function generateCodeChallenge(verifier: string): string {
  return crypto
    .createHash('sha256')
    .update(verifier)
    .digest('base64url');
}

/**
 * Generate a secure random state parameter
 */
export function generateState(): string {
  return crypto.randomBytes(16).toString('hex');
}

// ============================================
// STATE MANAGEMENT
// ============================================

// In-memory state store (in production, use Redis or database)
const stateStore = new Map<string, OAuthState>();

/**
 * Store OAuth state for verification
 */
export function storeOAuthState(state: string, data: OAuthState): void {
  stateStore.set(state, data);

  // Auto-cleanup after expiration
  setTimeout(() => {
    stateStore.delete(state);
  }, data.expiresAt - Date.now());
}

/**
 * Retrieve and validate OAuth state
 */
export function getOAuthState(state: string): OAuthState | null {
  const data = stateStore.get(state);

  if (!data) {
    return null;
  }

  if (Date.now() > data.expiresAt) {
    stateStore.delete(state);
    return null;
  }

  return data;
}

/**
 * Remove OAuth state after use
 */
export function removeOAuthState(state: string): void {
  stateStore.delete(state);
}

// ============================================
// TWITTER/X OAUTH 2.0 WITH PKCE
// ============================================

/**
 * Generate Twitter OAuth 2.0 authorization URL
 */
export function getTwitterAuthUrl(
  walletAddress: string,
  redirectUri: string,
  options?: { returnToVerify?: boolean }
): {
  url: string;
  state: string;
  codeVerifier: string;
} {
  const clientId = process.env.TWITTER_CLIENT_ID;

  if (!clientId) {
    throw new Error('Twitter Client ID not configured');
  }

  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);

  // Store state for callback verification
  storeOAuthState(state, {
    walletAddress,
    platform: 'twitter',
    nonce: state,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    codeVerifier,
    returnToVerify: options?.returnToVerify,
  });

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    // Added follows.read to verify if user follows @cryptogiftdao
    scope: 'tweet.read users.read follows.read',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  return {
    url: `${OAUTH_ENDPOINTS.twitter.authorize}?${params.toString()}`,
    state,
    codeVerifier,
  };
}

/**
 * Exchange Twitter authorization code for tokens
 */
export async function exchangeTwitterCode(
  code: string,
  redirectUri: string,
  codeVerifier: string
): Promise<TwitterTokenResponse> {
  const clientId = process.env.TWITTER_CLIENT_ID;
  const clientSecret = process.env.TWITTER_CLIENT_SECRET;

  if (!clientId) {
    throw new Error('Twitter credentials not configured');
  }

  const params = new URLSearchParams({
    code,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
    client_id: clientId,
  });

  const headers: HeadersInit = {
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  // Add Basic auth if client secret is available (confidential client)
  if (clientSecret) {
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    headers['Authorization'] = `Basic ${credentials}`;
  }

  const response = await fetch(OAUTH_ENDPOINTS.twitter.token, {
    method: 'POST',
    headers,
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Twitter token exchange failed: ${error}`);
  }

  return response.json();
}

/**
 * Get Twitter user info using access token
 */
export async function getTwitterUser(accessToken: string): Promise<TwitterUser> {
  const response = await fetch(
    `${OAUTH_ENDPOINTS.twitter.userInfo}?user.fields=profile_image_url`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get Twitter user: ${error}`);
  }

  const data = await response.json();
  return data.data;
}

// ============================================
// DISCORD OAUTH 2.0
// ============================================

/**
 * Generate Discord OAuth 2.0 authorization URL
 */
export function getDiscordAuthUrl(
  walletAddress: string,
  redirectUri: string,
  options?: { returnToVerify?: boolean }
): {
  url: string;
  state: string;
} {
  // Support both DISCORD_CLIENT_ID and DISCORD_DAO_CLIENT_ID
  const clientId = process.env.DISCORD_DAO_CLIENT_ID || process.env.DISCORD_CLIENT_ID;

  if (!clientId) {
    throw new Error('Discord Client ID not configured (set DISCORD_DAO_CLIENT_ID)');
  }

  const state = generateState();

  // Store state for callback verification
  storeOAuthState(state, {
    walletAddress,
    platform: 'discord',
    nonce: state,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    returnToVerify: options?.returnToVerify,
  });

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    // Added guilds.members.read to verify guild membership
    scope: 'identify guilds.members.read',
    state,
  });

  return {
    url: `${OAUTH_ENDPOINTS.discord.authorize}?${params.toString()}`,
    state,
  };
}

/**
 * Exchange Discord authorization code for tokens
 */
export async function exchangeDiscordCode(
  code: string,
  redirectUri: string
): Promise<DiscordTokenResponse> {
  // Support both variable naming conventions
  const clientId = process.env.DISCORD_DAO_CLIENT_ID || process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_DAO_CLIENT_SECRET || process.env.DISCORD_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Discord credentials not configured (set DISCORD_DAO_CLIENT_ID and DISCORD_DAO_CLIENT_SECRET)');
  }

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
  });

  const response = await fetch(OAUTH_ENDPOINTS.discord.token, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Discord token exchange failed: ${error}`);
  }

  return response.json();
}

/**
 * Get Discord user info using access token
 */
export async function getDiscordUser(accessToken: string): Promise<DiscordUser> {
  const response = await fetch(OAUTH_ENDPOINTS.discord.userInfo, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get Discord user: ${error}`);
  }

  return response.json();
}

// ============================================
// TELEGRAM LOGIN WIDGET VERIFICATION
// ============================================

/**
 * Verify Telegram Login Widget data
 * Uses HMAC-SHA256 to validate the hash
 */
export function verifyTelegramAuth(authData: TelegramAuthData): boolean {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    throw new Error('Telegram Bot Token not configured');
  }

  // Check auth_date is not too old (within 24 hours)
  const authTimestamp = authData.auth_date * 1000;
  if (Date.now() - authTimestamp > 24 * 60 * 60 * 1000) {
    return false;
  }

  // Create data check string
  const { hash, ...data } = authData;
  const dataCheckString = Object.keys(data)
    .sort()
    .map((key) => `${key}=${data[key as keyof typeof data]}`)
    .join('\n');

  // Create secret key from bot token
  const secretKey = crypto
    .createHash('sha256')
    .update(botToken)
    .digest();

  // Calculate expected hash
  const expectedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  return hash === expectedHash;
}

// ============================================
// DATABASE OPERATIONS
// ============================================

/**
 * Update user profile with verified social account
 */
export async function updateVerifiedSocial(
  walletAddress: string,
  platform: SocialPlatform,
  data: {
    platformId: string;
    username: string;
  }
): Promise<void> {
  const supabase = getSupabaseClient();
  const normalizedAddress = walletAddress.toLowerCase();

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  switch (platform) {
    case 'twitter':
      updateData.twitter_handle = data.username;
      updateData.twitter_verified = true;
      updateData.twitter_verified_at = new Date().toISOString();
      updateData.twitter_id = data.platformId;
      break;
    case 'discord':
      updateData.discord_handle = data.username;
      updateData.discord_verified = true;
      updateData.discord_verified_at = new Date().toISOString();
      updateData.discord_id = data.platformId;
      break;
    case 'telegram':
      updateData.telegram_handle = data.username;
      updateData.telegram_verified = true;
      updateData.telegram_verified_at = new Date().toISOString();
      updateData.telegram_id = data.platformId;
      break;
  }

  const { error } = await supabase
    .from('user_profiles')
    .update(updateData)
    .eq('wallet_address', normalizedAddress);

  if (error) {
    throw new Error(`Failed to update verified social: ${error.message}`);
  }
}

/**
 * Revoke social verification
 */
export async function revokeVerification(
  walletAddress: string,
  platform: SocialPlatform
): Promise<void> {
  const supabase = getSupabaseClient();
  const normalizedAddress = walletAddress.toLowerCase();

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  switch (platform) {
    case 'twitter':
      updateData.twitter_verified = false;
      updateData.twitter_verified_at = null;
      updateData.twitter_id = null;
      // Keep the handle so user doesn't lose it
      break;
    case 'discord':
      updateData.discord_verified = false;
      updateData.discord_verified_at = null;
      updateData.discord_id = null;
      break;
    case 'telegram':
      updateData.telegram_verified = false;
      updateData.telegram_verified_at = null;
      updateData.telegram_id = null;
      break;
  }

  const { error } = await supabase
    .from('user_profiles')
    .update(updateData)
    .eq('wallet_address', normalizedAddress);

  if (error) {
    throw new Error(`Failed to revoke verification: ${error.message}`);
  }
}

/**
 * Get verification status for a user
 */
export async function getVerificationStatus(walletAddress: string): Promise<{
  twitter: { verified: boolean; username: string | null; verifiedAt: string | null };
  discord: { verified: boolean; username: string | null; verifiedAt: string | null };
  telegram: { verified: boolean; username: string | null; verifiedAt: string | null };
}> {
  const supabase = getSupabaseClient();
  const normalizedAddress = walletAddress.toLowerCase();

  const { data, error } = await supabase
    .from('user_profiles')
    .select(`
      twitter_handle,
      twitter_verified,
      twitter_verified_at,
      discord_handle,
      discord_verified,
      discord_verified_at,
      telegram_handle,
      telegram_verified,
      telegram_verified_at
    `)
    .eq('wallet_address', normalizedAddress)
    .single();

  if (error || !data) {
    return {
      twitter: { verified: false, username: null, verifiedAt: null },
      discord: { verified: false, username: null, verifiedAt: null },
      telegram: { verified: false, username: null, verifiedAt: null },
    };
  }

  return {
    twitter: {
      verified: data.twitter_verified || false,
      username: data.twitter_handle,
      verifiedAt: data.twitter_verified_at,
    },
    discord: {
      verified: data.discord_verified || false,
      username: data.discord_handle,
      verifiedAt: data.discord_verified_at,
    },
    telegram: {
      verified: data.telegram_verified || false,
      username: data.telegram_handle,
      verifiedAt: data.telegram_verified_at,
    },
  };
}

// ============================================
// COMPLETE VERIFICATION FLOW
// ============================================

/**
 * Complete Twitter OAuth verification
 */
export async function completeTwitterVerification(
  code: string,
  state: string,
  redirectUri: string
): Promise<VerificationResult> {
  const oauthState = getOAuthState(state);

  if (!oauthState || oauthState.platform !== 'twitter') {
    return {
      success: false,
      platform: 'twitter',
      platformId: '',
      username: '',
      error: 'Invalid or expired state',
    };
  }

  try {
    // Exchange code for tokens
    const tokens = await exchangeTwitterCode(
      code,
      redirectUri,
      oauthState.codeVerifier!
    );

    // Get user info
    const user = await getTwitterUser(tokens.access_token);

    // Update database
    await updateVerifiedSocial(oauthState.walletAddress, 'twitter', {
      platformId: user.id,
      username: user.username,
    });

    // Clean up state
    removeOAuthState(state);

    return {
      success: true,
      platform: 'twitter',
      platformId: user.id,
      username: user.username,
      displayName: user.name,
      avatarUrl: user.profile_image_url,
    };
  } catch (error) {
    return {
      success: false,
      platform: 'twitter',
      platformId: '',
      username: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Complete Discord OAuth verification
 */
export async function completeDiscordVerification(
  code: string,
  state: string,
  redirectUri: string
): Promise<VerificationResult> {
  const oauthState = getOAuthState(state);

  if (!oauthState || oauthState.platform !== 'discord') {
    return {
      success: false,
      platform: 'discord',
      platformId: '',
      username: '',
      error: 'Invalid or expired state',
    };
  }

  try {
    // Exchange code for tokens
    const tokens = await exchangeDiscordCode(code, redirectUri);

    // Get user info
    const user = await getDiscordUser(tokens.access_token);

    // Format username (Discord removed discriminators for most users)
    const username = user.discriminator === '0'
      ? user.username
      : `${user.username}#${user.discriminator}`;

    // Update database
    await updateVerifiedSocial(oauthState.walletAddress, 'discord', {
      platformId: user.id,
      username,
    });

    // Clean up state
    removeOAuthState(state);

    // Build avatar URL
    const avatarUrl = user.avatar
      ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
      : `https://cdn.discordapp.com/embed/avatars/${parseInt(user.discriminator) % 5}.png`;

    return {
      success: true,
      platform: 'discord',
      platformId: user.id,
      username,
      displayName: user.global_name || user.username,
      avatarUrl,
    };
  } catch (error) {
    return {
      success: false,
      platform: 'discord',
      platformId: '',
      username: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Complete Telegram verification
 */
export async function completeTelegramVerification(
  walletAddress: string,
  authData: TelegramAuthData
): Promise<VerificationResult> {
  try {
    // Verify the hash
    if (!verifyTelegramAuth(authData)) {
      return {
        success: false,
        platform: 'telegram',
        platformId: '',
        username: '',
        error: 'Invalid Telegram authentication',
      };
    }

    const username = authData.username || `user_${authData.id}`;

    // Update database
    await updateVerifiedSocial(walletAddress, 'telegram', {
      platformId: authData.id.toString(),
      username,
    });

    return {
      success: true,
      platform: 'telegram',
      platformId: authData.id.toString(),
      username,
      displayName: authData.first_name + (authData.last_name ? ` ${authData.last_name}` : ''),
      avatarUrl: authData.photo_url,
    };
  } catch (error) {
    return {
      success: false,
      platform: 'telegram',
      platformId: '',
      username: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
