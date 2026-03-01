/**
 * SELLERS API
 *
 * GET    /api/sellers?handle=juanperez  — Public lookup by handle
 * POST   /api/sellers                   — Create new seller (requires wallet)
 * PATCH  /api/sellers                   — Update seller (requires wallet = owner)
 *
 * @endpoint /api/sellers
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { isValidHandle, isHandleReserved } from '@/lib/tenant/reserved-handles';
import { geocodeAddress } from '@/lib/geo/geocode';
import type { Seller } from '@/lib/types/seller';

function getDb() {
  if (!supabaseAdmin) {
    throw new Error('Database not configured');
  }
  return supabaseAdmin;
}

// GET /api/sellers?handle=juanperez
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const handle = searchParams.get('handle');
    const wallet = searchParams.get('wallet');

    if (!handle && !wallet) {
      return NextResponse.json(
        { error: 'Handle or wallet is required' },
        { status: 400 }
      );
    }

    const db = getDb();

    let query = db.from('sellers').select('*');

    if (handle) {
      query = query.eq('handle', handle.toLowerCase());
    } else if (wallet) {
      query = query.eq('wallet_address', wallet.toLowerCase());
    }

    const { data, error } = await query.single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Seller not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data as Seller,
    });
  } catch (error) {
    console.error('Error fetching seller:', error);
    return NextResponse.json(
      { error: 'Failed to fetch seller' },
      { status: 500 }
    );
  }
}

// POST /api/sellers — Create new seller
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { wallet, handle, business_name, ...rest } = body;

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    if (!handle) {
      return NextResponse.json(
        { error: 'Handle is required' },
        { status: 400 }
      );
    }

    if (!business_name) {
      return NextResponse.json(
        { error: 'Business name is required' },
        { status: 400 }
      );
    }

    const normalizedHandle = handle.toLowerCase().trim();

    // Validate handle format
    if (!isValidHandle(normalizedHandle)) {
      return NextResponse.json(
        { error: 'Invalid handle format. Use 3-30 lowercase letters, numbers, or hyphens.' },
        { status: 400 }
      );
    }

    // Check reserved handles
    if (isHandleReserved(normalizedHandle)) {
      return NextResponse.json(
        { error: 'This handle is reserved and cannot be used' },
        { status: 400 }
      );
    }

    const db = getDb();

    // Check if wallet already has a seller profile
    const { data: existing } = await db
      .from('sellers')
      .select('id')
      .eq('wallet_address', wallet.toLowerCase())
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'A seller profile already exists for this wallet' },
        { status: 409 }
      );
    }

    // Check if handle is taken
    const { data: handleTaken } = await db
      .from('sellers')
      .select('id')
      .eq('handle', normalizedHandle)
      .single();

    if (handleTaken) {
      return NextResponse.json(
        { error: 'This handle is already taken' },
        { status: 409 }
      );
    }

    // Create seller
    const { data, error } = await db
      .from('sellers')
      .insert({
        wallet_address: wallet.toLowerCase(),
        handle: normalizedHandle,
        business_name,
        ...rest,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating seller:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to create seller' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data as Seller,
    });
  } catch (error) {
    console.error('Error creating seller:', error);
    return NextResponse.json(
      { error: 'Failed to create seller' },
      { status: 500 }
    );
  }
}

// PATCH /api/sellers — Update seller
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

    // Remove fields that shouldn't be updated directly
    delete updates.id;
    delete updates.wallet_address;
    delete updates.handle;
    delete updates.created_at;

    const db = getDb();

    // If address changed, auto-geocode (fire-and-forget style — save first, geocode after)
    const addressChanged = updates.address !== undefined;

    const { data, error } = await db
      .from('sellers')
      .update(updates)
      .eq('wallet_address', wallet.toLowerCase())
      .select()
      .single();

    if (error) {
      console.error('Error updating seller:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to update seller' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Seller not found' },
        { status: 404 }
      );
    }

    // Auto-geocode when address changes (non-blocking)
    if (addressChanged && data.address) {
      geocodeAddress(data.address, data.city, data.state)
        .then(async (result) => {
          if (result) {
            await db
              .from('sellers')
              .update({
                latitude: result.latitude,
                longitude: result.longitude,
                geocode_status: 'success',
              })
              .eq('wallet_address', wallet.toLowerCase());
          } else {
            await db
              .from('sellers')
              .update({ geocode_status: 'failed' })
              .eq('wallet_address', wallet.toLowerCase());
          }
        })
        .catch((err) => {
          console.error('[Sellers PATCH] Geocode error:', err);
        });
    }

    return NextResponse.json({
      success: true,
      data: data as Seller,
    });
  } catch (error) {
    console.error('Error updating seller:', error);
    return NextResponse.json(
      { error: 'Failed to update seller' },
      { status: 500 }
    );
  }
}
