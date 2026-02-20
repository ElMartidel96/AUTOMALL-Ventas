/**
 * 🔐 PROFILE RECOVERY API
 *
 * POST - Setup recovery (email + password)
 * PUT - Login with credentials (for recovery)
 *
 * @endpoint /api/profile/recovery
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  setupRecovery,
  loginWithCredentials,
  calculateTier,
  getTierColor,
} from '@/lib/profiles/profile-service';

// POST /api/profile/recovery - Setup recovery credentials
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { wallet, email, password } = body;

    if (!wallet || !email || !password) {
      return NextResponse.json(
        { error: 'Wallet, email and password are required' },
        { status: 400 }
      );
    }

    // Validate wallet format
    if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }

    // Validate email format
    if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    const result = await setupRecovery(wallet, email, password);

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        message: 'Recovery credentials configured. Please verify your email.',
      },
    });
  } catch (error) {
    console.error('Error setting up recovery:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to setup recovery' },
      { status: 500 }
    );
  }
}

// PUT /api/profile/recovery - Login with email/password
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const result = await loginWithCredentials(email, password);
    const tier = calculateTier(result.profile.reputation_score);

    return NextResponse.json({
      success: true,
      data: {
        wallet: result.wallet,
        profile: {
          ...result.profile,
          tier,
          tier_color: getTierColor(tier),
          password_hash: undefined,
          email_verification_token: undefined,
          password_reset_token: undefined,
        },
      },
    });
  } catch (error) {
    console.error('Error logging in:', error);
    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );
  }
}
