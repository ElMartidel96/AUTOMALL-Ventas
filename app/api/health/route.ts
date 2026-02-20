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

  // Check Supabase configuration
  diagnostics.env_check.supabase = {
    has_url: Boolean(process.env.NEXT_PUBLIC_SUPABASE_DAO_URL || process.env.SUPABASE_DAO_URL),
    has_anon_key: Boolean(process.env.NEXT_PUBLIC_SUPABASE_DAO_ANON_KEY || process.env.SUPABASE_DAO_ANON_KEY),
    has_service_key: Boolean(process.env.SUPABASE_DAO_SERVICE_KEY),
    public_client_initialized: Boolean(supabase),
    admin_client_initialized: Boolean(supabaseAdmin),
  }

  // Check Redis configuration
  diagnostics.env_check.redis = {
    has_url: Boolean(process.env.UPSTASH_REDIS_REST_URL),
    has_token: Boolean(process.env.UPSTASH_REDIS_REST_TOKEN),
  }

  // Test Supabase connection
  if (supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from('tasks')
        .select('count')
        .limit(1)

      if (error) {
        diagnostics.services.supabase = {
          status: 'error',
          error: error.message,
          code: error.code,
        }
      } else {
        // Get actual count
        const { count, error: countError } = await supabaseAdmin
          .from('tasks')
          .select('*', { count: 'exact', head: true })

        diagnostics.services.supabase = {
          status: 'connected',
          tasks_count: countError ? 'unknown' : count,
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
