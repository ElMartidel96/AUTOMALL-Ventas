/**
 * Dynamic Client Registration — RFC 7591
 * POST /api/oauth/register
 *
 * MCP clients register themselves dynamically before initiating OAuth.
 * This is called automatically by ChatGPT, Claude Desktop, etc.
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateClientId } from '@/lib/agent/oauth/oauth-utils'
import { createClient, getClient } from '@/lib/agent/oauth/oauth-store'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: 'invalid_client_metadata', error_description: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  const { client_name, redirect_uris, grant_types, token_endpoint_auth_method } = body

  // Validate redirect_uris
  if (!redirect_uris || !Array.isArray(redirect_uris) || redirect_uris.length === 0) {
    return NextResponse.json(
      { error: 'invalid_client_metadata', error_description: 'redirect_uris is required' },
      { status: 400 }
    )
  }

  // Generate client_id
  const clientId = generateClientId()

  const client = await createClient({
    client_id: clientId,
    client_name: client_name || null,
    redirect_uris,
    grant_types: grant_types || ['authorization_code', 'refresh_token'],
    token_endpoint_auth_method: token_endpoint_auth_method || 'none',
  })

  if (!client) {
    return NextResponse.json(
      { error: 'server_error', error_description: 'Failed to register client' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    client_id: clientId,
    client_id_issued_at: Math.floor(Date.now() / 1000),
    redirect_uris: client.redirect_uris,
    grant_types: client.grant_types,
    response_types: ['code'],
    token_endpoint_auth_method: client.token_endpoint_auth_method,
    client_name: client.client_name,
  }, {
    status: 201,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store',
    },
  })
}

// GET — Lookup client info (used by consent page)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const clientId = searchParams.get('client_id')

  if (!clientId) {
    return NextResponse.json({ error: 'Missing client_id' }, { status: 400 })
  }

  const client = await getClient(clientId)
  if (!client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  }

  return NextResponse.json({
    client_id: client.client_id,
    client_name: client.client_name,
  })
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, MCP-Protocol-Version',
    },
  })
}
