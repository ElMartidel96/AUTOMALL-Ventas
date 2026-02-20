/**
 * 📋 Grant Applications Tracker API
 *
 * CRUD operations for tracking grant applications
 * Access restricted to deployer wallet and authorized admins
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import {
  GrantApplication,
  GrantApplicationInsert,
  GrantApplicationUpdate,
  GRANT_TRACKER_AUTHORIZED_WALLETS
} from '@/lib/supabase/types'

// Verify if wallet is authorized
function isAuthorized(walletAddress: string | null): boolean {
  if (!walletAddress) return false
  return GRANT_TRACKER_AUTHORIZED_WALLETS.includes(walletAddress.toLowerCase())
}

// GET - Fetch all grant applications
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get('wallet')
    const status = searchParams.get('status')
    const platform = searchParams.get('platform')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Check authorization
    if (!isAuthorized(walletAddress)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized access' },
        { status: 403 }
      )
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Database service unavailable' },
        { status: 503 }
      )
    }

    let query = supabaseAdmin
      .from('grant_applications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }
    if (platform) {
      query = query.eq('platform_name', platform)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching grant applications:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    // Calculate stats
    const stats = {
      total: data?.length || 0,
      byStatus: {} as Record<string, number>,
      byPlatform: {} as Record<string, number>,
      totalRequested: 0,
      totalApproved: 0
    }

    if (data) {
      for (const app of data as GrantApplication[]) {
        stats.byStatus[app.status] = (stats.byStatus[app.status] || 0) + 1
        stats.byPlatform[app.platform_name] = (stats.byPlatform[app.platform_name] || 0) + 1
        if (app.requested_amount) stats.totalRequested += app.requested_amount
        if (app.approved_amount) stats.totalApproved += app.approved_amount
      }
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      stats
    })
  } catch (error) {
    console.error('Error in grants GET:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Operation failed' },
      { status: 500 }
    )
  }
}

// POST - Create new grant application
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { wallet, ...applicationData } = body as { wallet: string } & GrantApplicationInsert

    // Check authorization
    if (!isAuthorized(wallet)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized access' },
        { status: 403 }
      )
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Database service unavailable' },
        { status: 503 }
      )
    }

    // Validate required fields
    if (!applicationData.platform_name || !applicationData.application_url) {
      return NextResponse.json(
        { success: false, error: 'Platform name and application URL are required' },
        { status: 400 }
      )
    }

    const insertData: GrantApplicationInsert = {
      ...applicationData,
      created_by: wallet
    }

    const { data, error } = await supabaseAdmin
      .from('grant_applications')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Error creating grant application:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Grant application created successfully'
    })
  } catch (error) {
    console.error('Error in grants POST:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Operation failed' },
      { status: 500 }
    )
  }
}

// PUT - Update grant application
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { wallet, id, ...updateData } = body as { wallet: string; id: string } & GrantApplicationUpdate

    // Check authorization
    if (!isAuthorized(wallet)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized access' },
        { status: 403 }
      )
    }

    if (!id) {
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

    const finalUpdateData: GrantApplicationUpdate = {
      ...updateData,
      updated_by: wallet
    }

    const { data, error } = await supabaseAdmin
      .from('grant_applications')
      .update(finalUpdateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating grant application:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Grant application updated successfully'
    })
  } catch (error) {
    console.error('Error in grants PUT:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Operation failed' },
      { status: 500 }
    )
  }
}

// DELETE - Delete grant application
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const wallet = searchParams.get('wallet')
    const id = searchParams.get('id')

    // Check authorization
    if (!isAuthorized(wallet)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized access' },
        { status: 403 }
      )
    }

    if (!id) {
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

    const { error } = await supabaseAdmin
      .from('grant_applications')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting grant application:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Grant application deleted successfully'
    })
  } catch (error) {
    console.error('Error in grants DELETE:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Operation failed' },
      { status: 500 }
    )
  }
}
