/**
 * 📋 Grant Applications History API
 *
 * Get history of status changes for a specific grant application
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { GRANT_TRACKER_AUTHORIZED_WALLETS } from '@/lib/supabase/types'

// Verify if wallet is authorized
function isAuthorized(walletAddress: string | null): boolean {
  if (!walletAddress) return false
  return GRANT_TRACKER_AUTHORIZED_WALLETS.includes(walletAddress.toLowerCase())
}

// GET - Fetch history for a grant application
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get('wallet')
    const applicationId = searchParams.get('id')

    // Check authorization
    if (!isAuthorized(walletAddress)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized access' },
        { status: 403 }
      )
    }

    if (!applicationId) {
      return NextResponse.json(
        { success: false, error: 'Application ID is required' },
        { status: 400 }
      )
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Database service unavailable' },
        { status: 503 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('grant_application_history')
      .select('*')
      .eq('application_id', applicationId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching grant history:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data || []
    })
  } catch (error) {
    console.error('Error in grants history GET:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Operation failed' },
      { status: 500 }
    )
  }
}
