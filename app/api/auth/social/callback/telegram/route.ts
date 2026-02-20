/**
 * 📱 Telegram Verification Handler
 *
 * POST /api/auth/social/callback/telegram
 * Handles Telegram Login Widget verification
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  completeTelegramVerification,
  TelegramAuthData,
} from '@/lib/social/social-verification-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, authData } = body as {
      walletAddress: string;
      authData: TelegramAuthData;
    };

    if (!walletAddress || !authData) {
      return NextResponse.json(
        { error: 'Wallet address and auth data are required' },
        { status: 400 }
      );
    }

    // Validate required Telegram auth fields
    if (!authData.id || !authData.auth_date || !authData.hash) {
      return NextResponse.json(
        { error: 'Invalid Telegram auth data' },
        { status: 400 }
      );
    }

    const result = await completeTelegramVerification(walletAddress, authData);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Verification failed' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        platform: 'telegram',
        username: result.username,
        displayName: result.displayName,
        avatarUrl: result.avatarUrl,
      },
    });
  } catch (error) {
    console.error('Telegram verification error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Verification failed' },
      { status: 500 }
    );
  }
}
