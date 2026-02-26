/**
 * OAuth Authorization — Code Generation
 * POST /api/oauth/authorize
 *
 * Called by the consent page after user approves.
 * Generates an authorization code and returns the redirect URL.
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateToken, TOKEN_PREFIX, TOKEN_LIFETIME, expiresIn } from '@/lib/agent/oauth/oauth-utils'
import { storeAuthCode, getClient } from '@/lib/agent/oauth/oauth-store'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const {
    wallet_address,
    client_id,
    redirect_uri,
    code_challenge,
    code_challenge_method,
    scope,
    state,
  } = body

  // Validate required fields
  if (!wallet_address || !client_id || !redirect_uri || !code_challenge) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    )
  }

  // Validate PKCE method
  if (code_challenge_method && code_challenge_method !== 'S256') {
    return NextResponse.json(
      { error: 'Only S256 code_challenge_method is supported' },
      { status: 400 }
    )
  }

  // Validate client exists and redirect_uri matches
  const client = await getClient(client_id)
  if (!client) {
    return NextResponse.json(
      { error: 'Unknown client_id' },
      { status: 400 }
    )
  }

  if (!client.redirect_uris.includes(redirect_uri)) {
    return NextResponse.json(
      { error: 'redirect_uri not registered for this client' },
      { status: 400 }
    )
  }

  // Generate authorization code
  const { raw: code, hash: codeHash } = generateToken(TOKEN_PREFIX.CODE)

  const stored = await storeAuthCode({
    code_hash: codeHash,
    client_id,
    wallet_address,
    redirect_uri,
    scope: scope || 'mcp:read mcp:write',
    code_challenge,
    code_challenge_method: code_challenge_method || 'S256',
    expires_at: expiresIn(TOKEN_LIFETIME.CODE),
  })

  if (!stored) {
    return NextResponse.json(
      { error: 'Failed to generate authorization code' },
      { status: 500 }
    )
  }

  // Build redirect URL
  const redirectUrl = new URL(redirect_uri)
  redirectUrl.searchParams.set('code', code)
  if (state) redirectUrl.searchParams.set('state', state)

  return NextResponse.json({
    redirect_url: redirectUrl.toString(),
  })
}
