/**
 * 🗄️ Supabase Client for CryptoGift DAO
 * 
 * Manages database connections for tasks, collaborators, and proposals
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'
import type { TypedSupabaseClient } from './client-types'

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_DAO_URL || process.env.SUPABASE_DAO_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_DAO_ANON_KEY || process.env.SUPABASE_DAO_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_DAO_SERVICE_KEY

// During build time, Supabase might not be configured yet
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase environment variables not configured. Some features will be disabled.')
}

// Public client for client-side operations
export const supabase: TypedSupabaseClient | null = supabaseUrl && supabaseAnonKey
  ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      db: {
        schema: 'public',
      },
      global: {
        headers: {
          'x-application': 'cryptogift-dao',
        },
      },
    })
  : null

// Admin client for server-side operations
export const supabaseAdmin: TypedSupabaseClient | null = (supabaseUrl && supabaseServiceKey)
  ? createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      db: {
        schema: 'public',
      },
    })
  : null

// Helper functions
export async function getServerClient(): Promise<TypedSupabaseClient> {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not properly configured')
  }
  return supabaseAdmin
}

// Validate service key role at startup
function validateServiceKey(): void {
  if (!supabaseServiceKey) return
  try {
    const parts = supabaseServiceKey.split('.')
    if (parts.length === 3) {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
      if (payload.role !== 'service_role') {
        console.error(
          `[Supabase] CRITICAL: SUPABASE_DAO_SERVICE_KEY has role "${payload.role}" — expected "service_role". ` +
          `You likely set the anon key instead of the service_role key. ` +
          `Go to Supabase Dashboard → Settings → API → Service Role Key (secret).`
        )
      }
    }
  } catch {
    // Not a JWT or malformed — will fail on first query
  }
}
validateServiceKey()

// Type-safe client getter for task operations
export function getTypedClient(): TypedSupabaseClient {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not initialized. Please configure SUPABASE_DAO environment variables.')
  }
  return supabaseAdmin
}

// Error handling wrapper
export async function supabaseQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>
): Promise<T> {
  // Check if we have real credentials
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase client not properly configured')
  }
  
  const { data, error } = await queryFn()
  
  if (error) {
    console.error('Supabase query error:', error)
    throw new Error(error.message || 'Database query failed')
  }
  
  if (!data) {
    throw new Error('No data returned from query')
  }
  
  return data
}

// Real-time subscriptions helper
export function subscribeToTable<T>(
  table: string,
  callback: (payload: T) => void,
  filter?: string
) {
  if (!supabaseUrl || !supabaseAnonKey || !supabase) {
    console.warn('Supabase client not properly configured. Subscriptions disabled.')
    return () => {} // Return no-op unsubscribe function
  }
  
  const channel = supabase
    .channel(`${table}_changes`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table,
        filter,
      },
      (payload) => {
        callback(payload.new as T)
      }
    )
    .subscribe()

  return () => {
    if (supabase) {
      supabase.removeChannel(channel)
    }
  }
}

// Batch operations helper
export async function batchInsert<T extends Record<string, any>>(
  table: string,
  records: T[],
  chunkSize = 100
): Promise<T[]> {
  if (!supabase) {
    throw new Error('Supabase client not initialized. Please configure SUPABASE_DAO environment variables.')
  }
  
  const chunks: T[][] = []
  for (let i = 0; i < records.length; i += chunkSize) {
    chunks.push(records.slice(i, i + chunkSize))
  }

  const results: T[] = []
  for (const chunk of chunks) {
    const { data, error } = await supabase.from(table).insert(chunk as any).select()
    if (error) throw error
    results.push(...(data as T[] || []))
  }

  return results
}

// Cache helper with TTL
const cache = new Map<string, { data: any; expires: number }>()

export async function cachedQuery<T>(
  key: string,
  queryFn: () => Promise<T>,
  ttlSeconds = 60
): Promise<T> {
  const cached = cache.get(key)
  
  if (cached && cached.expires > Date.now()) {
    return cached.data
  }

  const data = await queryFn()
  cache.set(key, {
    data,
    expires: Date.now() + ttlSeconds * 1000,
  })

  return data
}

// Clear cache utility
export function clearCache(pattern?: string) {
  if (pattern) {
    for (const key of cache.keys()) {
      if (key.includes(pattern)) {
        cache.delete(key)
      }
    }
  } else {
    cache.clear()
  }
}