/**
 * 💬 Discord OAuth Callback Handler
 *
 * GET /api/auth/social/callback/discord
 * Handles Discord OAuth 2.0 callback
 */

import { NextRequest, NextResponse } from 'next/server';
import { completeDiscordVerification } from '@/lib/social/social-verification-service';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Base URL for redirects - sanitize to prevent double protocol
  let baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  baseUrl = baseUrl.replace(/\/+$/, '').replace(/^https?:\/\/https?:\/\//, 'https://');
  if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    baseUrl = `https://${baseUrl}`;
  }
  const redirectUrl = `${baseUrl}/profile?tab=social`;

  // Handle OAuth errors
  if (error) {
    const errorDescription = searchParams.get('error_description') || 'Unknown error';
    console.error('Discord OAuth error:', error, errorDescription);
    return NextResponse.redirect(
      `${redirectUrl}&verification=error&platform=discord&message=${encodeURIComponent(errorDescription)}`
    );
  }

  // Validate required parameters
  if (!code || !state) {
    return NextResponse.redirect(
      `${redirectUrl}&verification=error&platform=discord&message=${encodeURIComponent('Missing authorization code or state')}`
    );
  }

  try {
    const redirectUri = `${baseUrl}/api/auth/social/callback/discord`;
    const result = await completeDiscordVerification(code, state, redirectUri);

    if (!result.success) {
      return NextResponse.redirect(
        `${redirectUrl}&verification=error&platform=discord&message=${encodeURIComponent(result.error || 'Verification failed')}`
      );
    }

    // Success! Redirect with success parameters and engagement trigger
    return NextResponse.redirect(
      `${redirectUrl}&verification=success&platform=discord&username=${encodeURIComponent(result.username)}&showEngagement=true`
    );
  } catch (err) {
    console.error('Discord callback error:', err);
    return NextResponse.redirect(
      `${redirectUrl}&verification=error&platform=discord&message=${encodeURIComponent('Internal server error')}`
    );
  }
}
