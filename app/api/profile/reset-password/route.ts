/**
 * 🔑 PASSWORD RESET API
 *
 * POST - Request password reset
 * PUT - Reset password with token
 *
 * @endpoint /api/profile/reset-password
 */

import { NextRequest, NextResponse } from 'next/server';
import { requestPasswordReset, resetPassword } from '@/lib/profiles/profile-service';

// POST /api/profile/reset-password - Request reset
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const result = await requestPasswordReset(email);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error requesting credential reset:', error);
    // Always return success to prevent email enumeration
    return NextResponse.json({
      success: true,
      data: { message: 'If email exists, reset instructions will be sent' },
    });
  }
}

// PUT /api/profile/reset-password - Reset with token
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and new password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    const result = await resetPassword(token, password);

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        message: 'Password reset successfully',
      },
    });
  } catch (error) {
    console.error('Error resetting credentials:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to reset password' },
      { status: 400 }
    );
  }
}
