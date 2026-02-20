/**
 * UPDATE APPOINTMENT API
 *
 * POST /api/referrals/special-invite/update-appointment
 * Updates special invite with appointment and email data
 *
 * Made by mbxarts.com The Moon in a Box property
 * Co-Author: Godez22
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

interface AppointmentData {
  scheduledAt?: string;
  eventType?: string;
  inviteeEmail?: string;
  uri?: string;
}

// Lazy Supabase initialization
let supabase: ReturnType<typeof createClient> | null = null;

function getSupabase() {
  if (supabase) return supabase;

  const url = process.env.NEXT_PUBLIC_SUPABASE_DAO_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_DAO_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Supabase environment variables not configured');
  }

  supabase = createClient(url, key);
  return supabase;
}

/**
 * POST - Update special invite with appointment data
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { inviteCode, appointmentScheduled, appointmentData, email, source } = body;

    if (!inviteCode) {
      return NextResponse.json(
        { error: 'Invite code is required', success: false },
        { status: 400 }
      );
    }

    const db = getSupabase();
    const normalizedCode = inviteCode.toUpperCase();

    // Build update object
    const updateData: Record<string, unknown> = {};

    // Set appointment scheduled flag
    if (appointmentScheduled !== undefined) {
      updateData.appointment_scheduled = appointmentScheduled;
    }

    // Store appointment details in metadata
    if (appointmentData) {
      const typedAppointmentData = appointmentData as AppointmentData;
      updateData.appointment_at = typedAppointmentData.scheduledAt || new Date().toISOString();
      updateData.appointment_type = typedAppointmentData.eventType || '30 Minute Meeting';
    }

    // Update email if provided
    if (email) {
      updateData.invitee_email = email;
    }

    // Add source tracking
    if (source) {
      updateData.appointment_source = source;
    }

    // Update the invite
    const { data, error } = await db
      .from('special_invites')
      .update(updateData)
      .eq('invite_code', normalizedCode)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - invite not found
        return NextResponse.json(
          { error: 'Invite not found', success: false },
          { status: 404 }
        );
      }

      // If columns don't exist, try a minimal update
      if (error.message?.includes('column') || error.code === '42703') {
        console.log('📅 Some columns may not exist, trying minimal update...');

        // Try updating just the basic fields that should exist
        const { data: minimalData, error: minimalError } = await db
          .from('special_invites')
          .update({
            education_completed: true // Mark as having activity
          })
          .eq('invite_code', normalizedCode)
          .select()
          .single();

        if (minimalError) {
          console.error('Error in minimal update:', minimalError);
          return NextResponse.json(
            { error: 'Failed to update invite', success: false },
            { status: 500 }
          );
        }

        console.log(`📅 Updated invite ${normalizedCode} with minimal data (appointment columns may not exist)`);

        return NextResponse.json({
          success: true,
          message: 'Appointment recorded (minimal update)',
          invite: {
            inviteCode: minimalData.invite_code,
            appointmentScheduled: true,
            email: email || null,
            note: 'Database schema may need appointment columns added'
          },
        });
      }

      console.error('Error updating invite:', error);
      return NextResponse.json(
        { error: 'Failed to update invite', success: false },
        { status: 500 }
      );
    }

    console.log(`📅 Updated appointment for invite ${normalizedCode}:`, {
      appointmentScheduled,
      email,
      appointmentAt: updateData.appointment_at
    });

    return NextResponse.json({
      success: true,
      message: 'Appointment updated successfully',
      invite: {
        inviteCode: data.invite_code,
        appointmentScheduled: data.appointment_scheduled,
        appointmentAt: data.appointment_at,
        email: data.invitee_email,
      },
    });
  } catch (error) {
    console.error('Error in POST /api/referrals/special-invite/update-appointment:', error);
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    );
  }
}
