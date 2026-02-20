/**
 * 🔄 Sync Verified Social Accounts API
 *
 * POST /api/social/sync-verified
 *
 * This endpoint is called AFTER wallet connection to sync any social verifications
 * that were completed before the wallet was connected.
 *
 * Flow:
 * 1. User verifies Twitter/Discord during education step (no wallet yet)
 * 2. OAuth cookies are stored with username/userId
 * 3. User connects wallet
 * 4. Frontend calls this API with wallet address
 * 5. API reads cookies and saves to user_profiles
 *
 * This ensures social verifications are persisted even when done before wallet connection.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { updateVerifiedSocial, SocialPlatform } from '@/lib/social/social-verification-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress } = body;

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address required', synced: false },
        { status: 400 }
      );
    }

    console.log(`[SyncVerified] Starting sync for wallet: ${walletAddress}`);

    const cookieStore = await cookies();
    const results: { platform: string; synced: boolean; username?: string; error?: string }[] = [];

    // Check Twitter verification cookies
    const twitterUsername = cookieStore.get('twitter_oauth_username')?.value;
    const twitterUserId = cookieStore.get('twitter_oauth_user_id')?.value;

    if (twitterUsername && twitterUserId) {
      try {
        console.log(`[SyncVerified] Found Twitter verification: @${twitterUsername} (${twitterUserId})`);
        await updateVerifiedSocial(walletAddress, 'twitter' as SocialPlatform, {
          platformId: twitterUserId,
          username: twitterUsername,
        });
        console.log(`[SyncVerified] ✅ Twitter synced to DB for ${walletAddress}`);
        results.push({ platform: 'twitter', synced: true, username: twitterUsername });
      } catch (error) {
        console.error('[SyncVerified] Twitter sync error:', error);
        results.push({
          platform: 'twitter',
          synced: false,
          username: twitterUsername,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    } else {
      console.log('[SyncVerified] No Twitter verification cookies found');
      results.push({ platform: 'twitter', synced: false, error: 'No verification found' });
    }

    // Check Discord verification cookies
    const discordUsername = cookieStore.get('discord_oauth_username')?.value;
    const discordUserId = cookieStore.get('discord_oauth_user_id')?.value;

    if (discordUsername && discordUserId) {
      try {
        console.log(`[SyncVerified] Found Discord verification: ${discordUsername} (${discordUserId})`);
        await updateVerifiedSocial(walletAddress, 'discord' as SocialPlatform, {
          platformId: discordUserId,
          username: discordUsername,
        });
        console.log(`[SyncVerified] ✅ Discord synced to DB for ${walletAddress}`);
        results.push({ platform: 'discord', synced: true, username: discordUsername });
      } catch (error) {
        console.error('[SyncVerified] Discord sync error:', error);
        results.push({
          platform: 'discord',
          synced: false,
          username: discordUsername,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    } else {
      console.log('[SyncVerified] No Discord verification cookies found');
      results.push({ platform: 'discord', synced: false, error: 'No verification found' });
    }

    const anySuccess = results.some(r => r.synced);

    console.log(`[SyncVerified] Sync complete. Results:`, JSON.stringify(results));

    return NextResponse.json({
      success: true,
      synced: anySuccess,
      results,
      walletAddress,
    });
  } catch (error) {
    console.error('[SyncVerified] Error:', error);
    return NextResponse.json(
      { error: 'Sync failed', synced: false },
      { status: 500 }
    );
  }
}
