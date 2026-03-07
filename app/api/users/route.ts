/**
 * USERS API
 *
 * GET    /api/users?wallet=0x...  — Lookup user by wallet
 * POST   /api/users               — Create new user (default role=buyer)
 * PATCH  /api/users               — Update user (role, display_name, etc.)
 *
 * @endpoint /api/users
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import type { User, UserRole } from '@/lib/types/user';
import { isDealerRole } from '@/lib/types/user';

const VALID_ROLES: UserRole[] = ['buyer', 'seller', 'birddog'];

function getDb() {
  if (!supabaseAdmin) {
    throw new Error('Database not configured');
  }
  return supabaseAdmin;
}

// GET /api/users?wallet=0x...
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    const db = getDb();

    const { data, error } = await db
      .from('users')
      .select('*')
      .eq('wallet_address', wallet.toLowerCase())
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data as User,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// POST /api/users — Create new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { wallet, role = 'buyer', display_name, email, phone, avatar_url } = body;

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be buyer, seller, or birddog' },
        { status: 400 }
      );
    }

    const db = getDb();

    // Check if wallet already has a user
    const { data: existing } = await db
      .from('users')
      .select('id')
      .eq('wallet_address', wallet.toLowerCase())
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'A user already exists for this wallet' },
        { status: 409 }
      );
    }

    const { data, error } = await db
      .from('users')
      .insert({
        wallet_address: wallet.toLowerCase(),
        role,
        display_name: display_name || null,
        ...(email ? { email } : {}),
        ...(phone ? { phone } : {}),
        ...(avatar_url ? { avatar_url } : {}),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to create user' },
        { status: 500 }
      );
    }

    // If dealer role, check if they already have a seller record
    let needs_onboarding = false;
    if (isDealerRole(role)) {
      const { data: sellerRecord } = await db
        .from('sellers')
        .select('id')
        .eq('wallet_address', wallet.toLowerCase())
        .single();
      needs_onboarding = !sellerRecord;
    }

    return NextResponse.json({
      success: true,
      data: data as User,
      needs_onboarding,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

// PATCH /api/users — Update user
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { wallet, ...updates } = body;

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Protect immutable fields
    delete updates.id;
    delete updates.wallet_address;
    delete updates.created_at;

    // Validate role if being updated
    if (updates.role && !VALID_ROLES.includes(updates.role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be buyer, seller, or birddog' },
        { status: 400 }
      );
    }

    const db = getDb();

    const { data, error } = await db
      .from('users')
      .update(updates)
      .eq('wallet_address', wallet.toLowerCase())
      .select()
      .single();

    if (error) {
      console.error('Error updating user:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to update user' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // If role changed to dealer, check if they need onboarding
    let needs_onboarding = false;
    if (updates.role && isDealerRole(updates.role)) {
      const { data: sellerRecord } = await db
        .from('sellers')
        .select('id')
        .eq('wallet_address', wallet.toLowerCase())
        .single();
      needs_onboarding = !sellerRecord;
    }

    return NextResponse.json({
      success: true,
      data: data as User,
      needs_onboarding,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}
