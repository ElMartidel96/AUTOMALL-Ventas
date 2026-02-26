/**
 * Connection Status — /api/agent/connections
 *
 * Returns the combined connection status from BOTH auth methods:
 *   1. OAuth 2.1 tokens (agent_oauth_tokens) — active, non-expired, non-revoked
 *   2. API keys (agent_api_keys) — active
 *
 * Used by the apeX widget and connector panel to show real connection state.
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const walletAddress = req.headers.get('x-wallet-address')
  if (!walletAddress) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  // Query both sources in parallel
  const [oauthResult, apiKeysResult] = await Promise.all([
    // OAuth tokens: active (not revoked) and not expired
    supabaseAdmin
      .from('agent_oauth_tokens')
      .select('id', { count: 'exact', head: true })
      .eq('wallet_address', walletAddress)
      .eq('revoked', false)
      .gt('expires_at', new Date().toISOString()),

    // API keys: active
    supabaseAdmin
      .from('agent_api_keys')
      .select('id', { count: 'exact', head: true })
      .eq('wallet_address', walletAddress)
      .eq('is_active', true),
  ])

  const oauthConnections = oauthResult.count ?? 0
  const apiKeys = apiKeysResult.count ?? 0
  const total = oauthConnections + apiKeys

  return NextResponse.json({
    connected: total > 0,
    oauth_connections: oauthConnections,
    api_keys: apiKeys,
    total,
  })
}
