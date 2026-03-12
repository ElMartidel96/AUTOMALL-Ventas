/**
 * Permission Engine — Authorization for AI Agent tool execution
 *
 * Validates role × scopes × rate limits before tool execution.
 */

import { supabaseAdmin } from '@/lib/supabase/client'
import type { UserRole, ToolPermission } from '../types/connector-types'
import { toolRegistry } from '../tools/tool-registry'

// ===================================================
// PERMISSION CHECK
// ===================================================

interface PermissionCheckResult {
  allowed: boolean
  reason?: string
}

/**
 * Check if a user can execute a specific tool.
 */
export function canExecuteTool(
  role: UserRole,
  toolName: string,
  scopes: string[]
): PermissionCheckResult {
  const tool = toolRegistry.getTool(toolName)

  if (!tool) {
    return { allowed: false, reason: `Tool "${toolName}" not found` }
  }

  // Check role access
  if (!tool.roles.includes(role)) {
    return { allowed: false, reason: `Role "${role}" cannot access tool "${toolName}"` }
  }

  // Check scope level
  if (!scopeCovers(scopes, tool.permission)) {
    return { allowed: false, reason: `Insufficient scope. Tool requires "${tool.permission}" but key has [${scopes.join(', ')}]` }
  }

  return { allowed: true }
}

/**
 * Check if the given scopes cover the required permission level.
 */
function scopeCovers(scopes: string[], required: ToolPermission): boolean {
  if (scopes.includes('admin')) return true
  if (required === 'read') return scopes.includes('read') || scopes.includes('write')
  if (required === 'write') return scopes.includes('write')
  if (required === 'admin') return scopes.includes('admin')
  return false
}

// ===================================================
// RATE LIMITING
// ===================================================

/**
 * Check if an API key has exceeded its rate limit.
 * Uses a simple hourly window count from the audit log.
 */
export async function checkRateLimit(apiKeyId: string, rateLimit: number): Promise<PermissionCheckResult> {
  if (!supabaseAdmin) {
    return { allowed: true } // Skip if DB not configured
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

  const { count, error } = await supabaseAdmin
    .from('agent_audit_log')
    .select('id', { count: 'exact', head: true })
    .eq('api_key_id', apiKeyId)
    .gte('created_at', oneHourAgo)

  if (error) {
    console.error('[PermissionEngine] Rate limit check failed:', error.message)
    return { allowed: true } // Fail open on DB errors
  }

  if ((count ?? 0) >= rateLimit) {
    return {
      allowed: false,
      reason: `Rate limit exceeded: ${count}/${rateLimit} requests/hour`,
    }
  }

  return { allowed: true }
}

// ===================================================
// API KEY VALIDATION
// ===================================================

interface ValidatedApiKey {
  id: string
  wallet_address: string
  scopes: string[]
  rate_limit: number
  name: string
}

/**
 * Validate an API key from a bearer token.
 * Returns the key metadata if valid, null otherwise.
 */
export async function validateApiKey(keyHash: string): Promise<ValidatedApiKey | null> {
  if (!supabaseAdmin) return null

  const { data, error } = await supabaseAdmin
    .from('agent_api_keys')
    .select('id, wallet_address, scopes, rate_limit, name, is_active, expires_at, usage_count')
    .eq('key_hash', keyHash)
    .single()

  if (error || !data) return null

  // Check if active
  if (!data.is_active) return null

  // Check expiration
  if (data.expires_at && new Date(data.expires_at) < new Date()) return null

  // Update last_used_at and usage_count (fire & forget)
  supabaseAdmin
    .from('agent_api_keys')
    .update({
      last_used_at: new Date().toISOString(),
      usage_count: (data.usage_count ?? 0) + 1,
    })
    .eq('id', data.id)
    .then(() => {})

  return {
    id: data.id,
    wallet_address: data.wallet_address,
    scopes: data.scopes,
    rate_limit: data.rate_limit,
    name: data.name,
  }
}

// ===================================================
// ROLE RESOLUTION
// ===================================================

/**
 * Resolve a user's role from the database.
 *
 * Resolution order:
 *   1. Check `users` table for explicit role
 *   2. Check `sellers` table — if wallet exists as active seller → 'seller'
 *   3. Default to 'buyer'
 */
export async function resolveUserRole(walletAddress: string): Promise<UserRole> {
  if (!supabaseAdmin) return 'buyer'

  const validRoles: UserRole[] = ['buyer', 'seller', 'birddog', 'admin']
  const wallet = walletAddress.toLowerCase()

  // 1. Check users table for explicit role
  try {
    const { data } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('wallet_address', walletAddress)
      .single()

    if (data?.role && validRoles.includes(data.role as UserRole)) {
      return data.role as UserRole
    }
  } catch {
    // Table may not exist or user not found — continue
  }

  // 2. Check sellers table — active seller record means seller role
  try {
    const { data: seller } = await supabaseAdmin
      .from('sellers')
      .select('id')
      .eq('wallet_address', wallet)
      .eq('is_active', true)
      .single()

    if (seller?.id) {
      return 'seller'
    }
  } catch {
    // Table may not exist or seller not found — continue
  }

  // 3. Default
  return 'buyer'
}
