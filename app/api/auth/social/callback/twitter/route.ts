/**
 * 🐦 Twitter OAuth Callback Handler
 *
 * GET /api/auth/social/callback/twitter
 * Handles Twitter OAuth 2.0 callback with PKCE
 */

import { NextRequest, NextResponse } from 'next/server';
import { completeTwitterVerification } from '@/lib/social/social-verification-service';

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
    console.error('Twitter OAuth error:', error, errorDescription);
    return NextResponse.redirect(
      `${redirectUrl}&verification=error&platform=twitter&message=${encodeURIComponent(errorDescription)}`
    );
  }

  // Validate required parameters
  if (!code || !state) {
    return NextResponse.redirect(
      `${redirectUrl}&verification=error&platform=twitter&message=${encodeURIComponent('Missing authorization code or state')}`
    );
  }

  try {
    const redirectUri = `${baseUrl}/api/auth/social/callback/twitter`;
    const result = await completeTwitterVerification(code, state, redirectUri);

    if (!result.success) {
      return NextResponse.redirect(
        `${redirectUrl}&verification=error&platform=twitter&message=${encodeURIComponent(result.error || 'Verification failed')}`
      );
    }

    // Success! Redirect with success parameters and engagement trigger
    return NextResponse.redirect(
      `${redirectUrl}&verification=success&platform=twitter&username=${encodeURIComponent(result.username)}&showEngagement=true`
    );
  } catch (err) {
    console.error('Twitter callback error:', err);
    return NextResponse.redirect(
      `${redirectUrl}&verification=error&platform=twitter&message=${encodeURIComponent('Internal server error')}`
    );
  }
}
