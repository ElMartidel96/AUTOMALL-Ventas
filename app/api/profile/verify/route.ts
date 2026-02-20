/**
 * ✉️ EMAIL VERIFICATION API
 *
 * POST - Verify email with token
 *
 * @endpoint /api/profile/verify
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyEmail } from '@/lib/profiles/profile-service';

// POST /api/profile/verify - Verify email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    const result = await verifyEmail(token);

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        message: 'Email verified successfully',
      },
    });
  } catch (error) {
    console.error('Error verifying email:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to verify email' },
      { status: 400 }
    );
  }
}
