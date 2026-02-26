/**
 * OAuth 2.1 Store — Supabase operations for clients, codes, tokens
 */

import { supabaseAdmin } from '@/lib/supabase/client'

// ===================================================
// CLIENTS (Dynamic Client Registration)
// ===================================================

export interface OAuthClient {
  client_id: string
  client_name: string | null
  redirect_uris: string[]
  grant_types: string[]
  token_endpoint_auth_method: string
}

export async function createClient(params: {
  client_id: string
  client_name?: string
  redirect_uris: string[]
  grant_types?: string[]
  token_endpoint_auth_method?: string
}): Promise<OAuthClient | null> {
  if (!supabaseAdmin) return null

  const { data, error } = await supabaseAdmin
    .from('agent_oauth_clients')
    .insert({
      client_id: params.client_id,
      client_name: params.client_name || null,
      redirect_uris: params.redirect_uris,
      grant_types: params.grant_types || ['authorization_code', 'refresh_token'],
      token_endpoint_auth_method: params.token_endpoint_auth_method || 'none',
    })
    .select()
    .single()

  if (error) {
    console.error('[OAuthStore] Failed to create client:', error.message)
    return null
  }

  return data as OAuthClient
}

export async function getClient(clientId: string): Promise<OAuthClient | null> {
  if (!supabaseAdmin) return null

  const { data, error } = await supabaseAdmin
    .from('agent_oauth_clients')
    .select('client_id, client_name, redirect_uris, grant_types, token_endpoint_auth_method')
    .eq('client_id', clientId)
    .single()

  if (error || !data) return null
  return data as OAuthClient
}

// ===================================================
// AUTHORIZATION CODES
// ===================================================

export async function storeAuthCode(params: {
  code_hash: string
  client_id: string
  wallet_address: string
  redirect_uri: string
  scope: string
  code_challenge: string
  code_challenge_method: string
  expires_at: string
}): Promise<boolean> {
  if (!supabaseAdmin) return false

  const { error } = await supabaseAdmin
    .from('agent_oauth_codes')
    .insert(params)

  if (error) {
    console.error('[OAuthStore] Failed to store auth code:', error.message)
    return false
  }
  return true
}

export interface StoredAuthCode {
  code_hash: string
  client_id: string
  wallet_address: string
  redirect_uri: string
  scope: string
  code_challenge: string
  code_challenge_method: string
  expires_at: string
  used: boolean
}

export async function consumeAuthCode(codeHash: string): Promise<StoredAuthCode | null> {
  if (!supabaseAdmin) return null

  const { data, error } = await supabaseAdmin
    .from('agent_oauth_codes')
    .select('*')
    .eq('code_hash', codeHash)
    .eq('used', false)
    .single()

  if (error || !data) return null

  // Check expiration
  if (new Date(data.expires_at) < new Date()) return null

  // Mark as used (fire & forget)
  supabaseAdmin
    .from('agent_oauth_codes')
    .update({ used: true })
    .eq('code_hash', codeHash)
    .then(() => {})

  return data as StoredAuthCode
}

// ===================================================
// TOKENS (Access + Refresh)
// ===================================================

export async function storeToken(params: {
  token_hash: string
  token_type: 'access' | 'refresh'
  client_id: string
  wallet_address: string
  scope: string
  expires_at: string
}): Promise<boolean> {
  if (!supabaseAdmin) return false

  const { error } = await supabaseAdmin
    .from('agent_oauth_tokens')
    .insert(params)

  if (error) {
    console.error('[OAuthStore] Failed to store token:', error.message)
    return false
  }
  return true
}

export interface StoredToken {
  token_hash: string
  token_type: string
  client_id: string
  wallet_address: string
  scope: string
  expires_at: string
  revoked: boolean
}

export async function validateOAuthToken(tokenHash: string): Promise<StoredToken | null> {
  if (!supabaseAdmin) return null

  const { data, error } = await supabaseAdmin
    .from('agent_oauth_tokens')
    .select('*')
    .eq('token_hash', tokenHash)
    .eq('revoked', false)
    .single()

  if (error || !data) return null

  // Check expiration
  if (new Date(data.expires_at) < new Date()) return null

  return data as StoredToken
}

export async function revokeTokensByClient(clientId: string, walletAddress: string): Promise<void> {
  if (!supabaseAdmin) return

  await supabaseAdmin
    .from('agent_oauth_tokens')
    .update({ revoked: true })
    .eq('client_id', clientId)
    .eq('wallet_address', walletAddress)
}

export async function getActiveTokenCount(walletAddress: string): Promise<number> {
  if (!supabaseAdmin) return 0

  const { count } = await supabaseAdmin
    .from('agent_oauth_tokens')
    .select('id', { count: 'exact', head: true })
    .eq('wallet_address', walletAddress)
    .eq('token_type', 'access')
    .eq('revoked', false)
    .gt('expires_at', new Date().toISOString())

  return count ?? 0
}
