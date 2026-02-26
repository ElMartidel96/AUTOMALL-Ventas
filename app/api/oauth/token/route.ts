/**
 * OAuth Token Endpoint — RFC 6749 Section 3.2
 * POST /api/oauth/token
 *
 * Exchanges authorization codes for access tokens.
 * Also handles refresh_token grant type.
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  generateToken,
  hashToken,
  verifyPKCE,
  TOKEN_PREFIX,
  TOKEN_LIFETIME,
  expiresIn,
} from '@/lib/agent/oauth/oauth-utils'
import {
  consumeAuthCode,
  storeToken,
  validateOAuthToken,
} from '@/lib/agent/oauth/oauth-store'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  // OAuth token requests use application/x-www-form-urlencoded
  let params: URLSearchParams
  const contentType = req.headers.get('content-type') || ''

  if (contentType.includes('application/x-www-form-urlencoded')) {
    const body = await req.text()
    params = new URLSearchParams(body)
  } else if (contentType.includes('application/json')) {
    // Some clients send JSON — be flexible
    const body = await req.json()
    params = new URLSearchParams(body as Record<string, string>)
  } else {
    return tokenError('invalid_request', 'Unsupported content type')
  }

  const grantType = params.get('grant_type')

  switch (grantType) {
    case 'authorization_code':
      return handleAuthorizationCode(params)
    case 'refresh_token':
      return handleRefreshToken(params)
    default:
      return tokenError('unsupported_grant_type', `Unsupported grant_type: ${grantType}`)
  }
}

// ===================================================
// Authorization Code → Access Token
// ===================================================

async function handleAuthorizationCode(params: URLSearchParams) {
  const code = params.get('code')
  const redirectUri = params.get('redirect_uri')
  const clientId = params.get('client_id')
  const codeVerifier = params.get('code_verifier')

  if (!code || !redirectUri || !clientId || !codeVerifier) {
    return tokenError('invalid_request', 'Missing required parameters: code, redirect_uri, client_id, code_verifier')
  }

  // Look up the authorization code
  const codeHash = hashToken(code)
  const storedCode = await consumeAuthCode(codeHash)

  if (!storedCode) {
    return tokenError('invalid_grant', 'Invalid, expired, or already used authorization code')
  }

  // Verify client_id matches
  if (storedCode.client_id !== clientId) {
    return tokenError('invalid_grant', 'client_id mismatch')
  }

  // Verify redirect_uri matches
  if (storedCode.redirect_uri !== redirectUri) {
    return tokenError('invalid_grant', 'redirect_uri mismatch')
  }

  // Verify PKCE
  if (!verifyPKCE(codeVerifier, storedCode.code_challenge)) {
    return tokenError('invalid_grant', 'PKCE verification failed')
  }

  // Generate access + refresh tokens
  const accessToken = generateToken(TOKEN_PREFIX.ACCESS)
  const refreshToken = generateToken(TOKEN_PREFIX.REFRESH)

  const scope = storedCode.scope
  const walletAddress = storedCode.wallet_address

  // Store both tokens
  const [accessStored, refreshStored] = await Promise.all([
    storeToken({
      token_hash: accessToken.hash,
      token_type: 'access',
      client_id: clientId,
      wallet_address: walletAddress,
      scope,
      expires_at: expiresIn(TOKEN_LIFETIME.ACCESS),
    }),
    storeToken({
      token_hash: refreshToken.hash,
      token_type: 'refresh',
      client_id: clientId,
      wallet_address: walletAddress,
      scope,
      expires_at: expiresIn(TOKEN_LIFETIME.REFRESH),
    }),
  ])

  if (!accessStored || !refreshStored) {
    return tokenError('server_error', 'Failed to generate tokens')
  }

  return NextResponse.json({
    access_token: accessToken.raw,
    token_type: 'Bearer',
    expires_in: TOKEN_LIFETIME.ACCESS,
    refresh_token: refreshToken.raw,
    scope,
  }, {
    headers: {
      'Cache-Control': 'no-store',
      'Pragma': 'no-cache',
      'Access-Control-Allow-Origin': '*',
    },
  })
}

// ===================================================
// Refresh Token → New Access Token
// ===================================================

async function handleRefreshToken(params: URLSearchParams) {
  const refreshTokenRaw = params.get('refresh_token')
  const clientId = params.get('client_id')

  if (!refreshTokenRaw || !clientId) {
    return tokenError('invalid_request', 'Missing required parameters: refresh_token, client_id')
  }

  // Validate refresh token
  const tokenHash = hashToken(refreshTokenRaw)
  const storedRefresh = await validateOAuthToken(tokenHash)

  if (!storedRefresh || storedRefresh.token_type !== 'refresh') {
    return tokenError('invalid_grant', 'Invalid or expired refresh token')
  }

  if (storedRefresh.client_id !== clientId) {
    return tokenError('invalid_grant', 'client_id mismatch')
  }

  // Generate new access token
  const newAccessToken = generateToken(TOKEN_PREFIX.ACCESS)

  const stored = await storeToken({
    token_hash: newAccessToken.hash,
    token_type: 'access',
    client_id: clientId,
    wallet_address: storedRefresh.wallet_address,
    scope: storedRefresh.scope,
    expires_at: expiresIn(TOKEN_LIFETIME.ACCESS),
  })

  if (!stored) {
    return tokenError('server_error', 'Failed to generate new access token')
  }

  return NextResponse.json({
    access_token: newAccessToken.raw,
    token_type: 'Bearer',
    expires_in: TOKEN_LIFETIME.ACCESS,
    scope: storedRefresh.scope,
  }, {
    headers: {
      'Cache-Control': 'no-store',
      'Pragma': 'no-cache',
      'Access-Control-Allow-Origin': '*',
    },
  })
}

// ===================================================
// HELPERS
// ===================================================

function tokenError(error: string, description: string) {
  return NextResponse.json(
    { error, error_description: description },
    {
      status: 400,
      headers: {
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*',
      },
    }
  )
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, MCP-Protocol-Version',
    },
  })
}
