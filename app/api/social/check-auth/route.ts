/**
 * 🔐 Check Auth Status API
 *
 * POST /api/social/check-auth
 *
 * Checks if user has existing OAuth authorization stored in cookies.
 * For verification to work, we need BOTH the token AND the userId.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { platform } = body;

    if (!platform || !['twitter', 'discord'].includes(platform)) {
      return NextResponse.json({ hasAuth: false });
    }

    // Check for stored tokens AND userId in cookies (both required for verification)
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get(`${platform}_oauth_token`);
    const userIdCookie = cookieStore.get(`${platform}_oauth_user_id`);

    // Need both token and userId for verification to work
    if (tokenCookie?.value && userIdCookie?.value) {
      console.log(`[Check Auth] ${platform} has valid auth - token and userId present`);
      return NextResponse.json({ hasAuth: true });
    }

    console.log(`[Check Auth] ${platform} missing auth - token: ${!!tokenCookie?.value}, userId: ${!!userIdCookie?.value}`);
    return NextResponse.json({ hasAuth: false });
  } catch (error) {
    console.error('[Check Auth] Error:', error);
    return NextResponse.json({ hasAuth: false });
  }
}
