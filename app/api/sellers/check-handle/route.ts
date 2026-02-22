/**
 * CHECK HANDLE AVAILABILITY
 *
 * GET /api/sellers/check-handle?handle=juanperez
 *
 * Returns { available: true/false, reason?: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { isValidHandle, isHandleReserved } from '@/lib/tenant/reserved-handles';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const handle = searchParams.get('handle');

    if (!handle) {
      return NextResponse.json(
        { available: false, reason: 'Handle is required' },
        { status: 400 }
      );
    }

    const normalized = handle.toLowerCase().trim();

    // Check format
    if (!isValidHandle(normalized)) {
      return NextResponse.json({
        available: false,
        reason: 'Invalid format. Use 3-30 lowercase letters, numbers, or hyphens.',
      });
    }

    // Check reserved
    if (isHandleReserved(normalized)) {
      return NextResponse.json({
        available: false,
        reason: 'This handle is reserved.',
      });
    }

    // Check database
    if (supabaseAdmin) {
      const { data } = await supabaseAdmin
        .from('sellers')
        .select('id')
        .eq('handle', normalized)
        .single();

      if (data) {
        return NextResponse.json({
          available: false,
          reason: 'This handle is already taken.',
        });
      }
    }

    return NextResponse.json({
      available: true,
    });
  } catch (error) {
    console.error('Error checking handle:', error);
    return NextResponse.json(
      { available: false, reason: 'Error checking availability' },
      { status: 500 }
    );
  }
}
