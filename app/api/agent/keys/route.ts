/**
 * API Key Management — /api/agent/keys
 *
 * CRUD for AI Agent API keys.
 * Keys are hashed (SHA-256) before storage — the raw key is shown ONCE at creation.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createHash, randomBytes } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase/client'
import { CreateApiKeySchema } from '@/lib/agent/types/connector-types'

export const runtime = 'nodejs'

const KEY_PREFIX = 'aml_'
const MAX_KEYS_PER_USER = 5

// ===================================================
// POST — Create a new API key
// ===================================================

export async function POST(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const walletAddress = req.headers.get('x-wallet-address')
  if (!walletAddress) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  // Parse request
  const body = await req.json()
  const parsed = CreateApiKeySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  // Check key limit
  const { count } = await supabaseAdmin
    .from('agent_api_keys')
    .select('id', { count: 'exact', head: true })
    .eq('wallet_address', walletAddress)
    .eq('is_active', true)

  if ((count ?? 0) >= MAX_KEYS_PER_USER) {
    return NextResponse.json(
      { error: `Maximum ${MAX_KEYS_PER_USER} active keys allowed. Revoke an existing key first.` },
      { status: 400 }
    )
  }

  // Generate key
  const rawKey = KEY_PREFIX + randomBytes(16).toString('hex')
  const keyHash = createHash('sha256').update(rawKey).digest('hex')
  const keyPrefix = rawKey.slice(0, 12) // "aml_" + 8 chars

  // Calculate expiration
  let expiresAt: string | null = null
  if (parsed.data.expires_in_days) {
    const d = new Date()
    d.setDate(d.getDate() + parsed.data.expires_in_days)
    expiresAt = d.toISOString()
  }

  // Insert
  const { data, error } = await supabaseAdmin
    .from('agent_api_keys')
    .insert({
      wallet_address: walletAddress,
      key_hash: keyHash,
      key_prefix: keyPrefix,
      name: parsed.data.name,
      scopes: parsed.data.scopes,
      rate_limit: parsed.data.rate_limit,
      expires_at: expiresAt,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to create key' }, { status: 500 })
  }

  // Return the raw key ONCE — it won't be retrievable again
  return NextResponse.json({
    key: rawKey,
    api_key: {
      id: data.id,
      key_prefix: keyPrefix,
      name: data.name,
      scopes: data.scopes,
      rate_limit: data.rate_limit,
      is_active: data.is_active,
      expires_at: data.expires_at,
      created_at: data.created_at,
    },
  }, { status: 201 })
}

// ===================================================
// GET — List API keys (no raw keys exposed)
// ===================================================

export async function GET(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const walletAddress = req.headers.get('x-wallet-address')
  if (!walletAddress) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const { data, error } = await supabaseAdmin
    .from('agent_api_keys')
    .select('id, key_prefix, name, scopes, is_active, last_used_at, usage_count, rate_limit, expires_at, created_at')
    .eq('wallet_address', walletAddress)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Failed to list keys' }, { status: 500 })
  }

  return NextResponse.json({ keys: data ?? [] })
}

// ===================================================
// DELETE — Revoke an API key
// ===================================================

export async function DELETE(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const walletAddress = req.headers.get('x-wallet-address')
  if (!walletAddress) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const keyId = searchParams.get('id')
  if (!keyId) {
    return NextResponse.json({ error: 'Missing key id parameter' }, { status: 400 })
  }

  // Soft delete: deactivate instead of removing
  const { error } = await supabaseAdmin
    .from('agent_api_keys')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', keyId)
    .eq('wallet_address', walletAddress)

  if (error) {
    return NextResponse.json({ error: 'Failed to revoke key' }, { status: 500 })
  }

  return NextResponse.json({ message: 'Key revoked successfully' })
}
