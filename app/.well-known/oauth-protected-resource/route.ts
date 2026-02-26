/**
 * Protected Resource Metadata — RFC 9728
 * GET /.well-known/oauth-protected-resource
 *
 * MCP clients (ChatGPT, Claude, Gemini) discover this endpoint first
 * to learn where the OAuth authorization server lives.
 */

import { NextResponse } from 'next/server'
import { APP_DOMAIN } from '@/lib/config/features'

export const runtime = 'nodejs'

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${APP_DOMAIN}`

  return NextResponse.json({
    resource: `${baseUrl}/api/mcp/gateway`,
    authorization_servers: [baseUrl],
    scopes_supported: ['mcp:read', 'mcp:write'],
    bearer_methods_supported: ['header'],
    resource_documentation: `${baseUrl}/docs/mcp`,
  }, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'MCP-Protocol-Version',
    },
  })
}
