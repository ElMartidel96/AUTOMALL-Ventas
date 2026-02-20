/**
 * 👤 USERNAME CHECK API
 *
 * GET - Check if username is available
 *
 * @endpoint /api/profile/username
 */

import { NextRequest, NextResponse } from 'next/server';
import { isUsernameAvailable } from '@/lib/profiles/profile-service';

// GET /api/profile/username?username=test&wallet=0x...
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    const wallet = searchParams.get('wallet'); // Optional: exclude own wallet

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    // Validate username format
    if (!/^[a-zA-Z0-9_]{3,50}$/.test(username)) {
      return NextResponse.json({
        success: true,
        data: {
          available: false,
          reason: 'Invalid format. Use 3-50 alphanumeric characters or underscores.',
        },
      });
    }

    const available = await isUsernameAvailable(username, wallet || undefined);

    return NextResponse.json({
      success: true,
      data: {
        available,
        username: username.toLowerCase(),
        reason: available ? null : 'Username already taken',
      },
    });
  } catch (error) {
    console.error('Error checking username:', error);
    return NextResponse.json(
      { error: 'Failed to check username availability' },
      { status: 500 }
    );
  }
}
