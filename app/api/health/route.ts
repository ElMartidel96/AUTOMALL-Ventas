/**
 * 🏥 Health Check API
 *
 * Diagnostic endpoint to verify system status
 */

import { NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase/client'
import { getDAORedis } from '@/lib/redis-dao'

export const dynamic = 'force-dynamic'

export async function GET() {
  const diagnostics: Record<string, any> = {
    timestamp: new Date().toISOString(),
    status: 'checking',
    services: {},
    env_check: {},
  }

  // Check Supabase configuration + service key role
  let serviceKeyRole = 'unknown'
  try {
    const sk = process.env.SUPABASE_DAO_SERVICE_KEY
    if (sk) {
      const parts = sk.split('.')
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
        serviceKeyRole = payload.role || 'missing_role'
      }
    }
  } catch { serviceKeyRole = 'parse_error' }

  diagnostics.env_check.supabase = {
    has_url: Boolean(process.env.NEXT_PUBLIC_SUPABASE_DAO_URL || process.env.SUPABASE_DAO_URL),
    has_anon_key: Boolean(process.env.NEXT_PUBLIC_SUPABASE_DAO_ANON_KEY || process.env.SUPABASE_DAO_ANON_KEY),
    has_service_key: Boolean(process.env.SUPABASE_DAO_SERVICE_KEY),
    service_key_role: serviceKeyRole,
    service_key_ok: serviceKeyRole === 'service_role',
    public_client_initialized: Boolean(supabase),
    admin_client_initialized: Boolean(supabaseAdmin),
  }

  // Check Redis configuration
  diagnostics.env_check.redis = {
    has_url: Boolean(process.env.UPSTASH_REDIS_REST_URL),
    has_token: Boolean(process.env.UPSTASH_REDIS_REST_TOKEN),
  }

  // Test Supabase connection — read + write on vehicles table
  if (supabaseAdmin) {
    try {
      // Test 1: Read (SELECT)
      const { count, error: readError } = await supabaseAdmin
        .from('vehicles')
        .select('*', { count: 'exact', head: true })

      if (readError) {
        diagnostics.services.supabase = {
          status: 'error',
          test: 'read_failed',
          error: readError.message,
          code: readError.code,
        }
      } else {
        diagnostics.services.supabase = {
          status: 'connected',
          vehicles_count: count,
          read: 'ok',
          write: 'untested',
        }

        // Test 2: Write (INSERT + DELETE) — only if service_role key
        if (serviceKeyRole === 'service_role') {
          const { data: testRow, error: writeError } = await supabaseAdmin
            .from('vehicles')
            .insert({
              seller_address: '0x0000000000000000000000000000000000000000',
              brand: '__health_check__',
              model: '__test__',
              year: 2000,
              price: 1,
              mileage: 0,
              status: 'archived',
            })
            .select('id')
            .single()

          if (writeError) {
            diagnostics.services.supabase.write = 'failed'
            diagnostics.services.supabase.write_error = writeError.message
            diagnostics.services.supabase.write_code = writeError.code
            if (writeError.code === '42501') {
              diagnostics.services.supabase.write_hint =
                'RLS blocking writes — SUPABASE_DAO_SERVICE_KEY is NOT the service_role key. Check Supabase Dashboard → Settings → API → Service Role Key.'
            }
          } else {
            // Clean up test row
            await supabaseAdmin.from('vehicles').delete().eq('id', testRow.id)
            diagnostics.services.supabase.write = 'ok'
          }
        }
      }
    } catch (err) {
      diagnostics.services.supabase = {
        status: 'error',
        error: err instanceof Error ? err.message : 'Unknown error',
      }
    }
  } else {
    diagnostics.services.supabase = {
      status: 'not_configured',
      error: 'Admin client not initialized',
    }
  }

  // Test Redis connection
  const redis = getDAORedis()
  try {
    const pingResult = await redis.ping()
    diagnostics.services.redis = {
      status: pingResult ? 'connected' : 'not_configured',
    }
  } catch (err) {
    diagnostics.services.redis = {
      status: 'error',
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }

  // Determine overall status
  const supabaseOk = diagnostics.services.supabase?.status === 'connected'
  const redisOk = diagnostics.services.redis?.status === 'connected' ||
                  diagnostics.services.redis?.status === 'not_configured'

  diagnostics.status = supabaseOk ? 'healthy' : 'degraded'
  diagnostics.critical_services = {
    supabase: supabaseOk ? 'ok' : 'failing',
    redis: redisOk ? 'ok' : 'optional_failing',
  }

  return NextResponse.json(diagnostics, {
    status: supabaseOk ? 200 : 503,
  })
}
