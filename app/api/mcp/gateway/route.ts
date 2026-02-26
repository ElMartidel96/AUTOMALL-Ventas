/**
 * MCP Gateway Server — /api/mcp/gateway
 *
 * Implements MCP Streamable HTTP Transport (spec 2025-06-18).
 * Allows external AI apps (Claude Desktop, ChatGPT, Gemini, Cursor) to connect.
 *
 * Authentication methods (auto-detected by token prefix):
 *   1. OAuth 2.1 Bearer token (prefix "oat_") — automatic via OAuth flow
 *   2. API key Bearer token (prefix "aml_") — manual for power users
 *
 * When no token is provided, returns 401 with WWW-Authenticate header
 * pointing to the OAuth discovery endpoint (RFC 9728).
 *
 * NOT to be confused with /api/mcp-docs (CryptoGift legacy MCP server).
 */

import { NextRequest, NextResponse } from 'next/server'
import { createHash, randomUUID } from 'crypto'
import { zodToJsonSchema } from 'zod-to-json-schema'
import { toolRegistry } from '@/lib/agent/tools/tool-registry'
import { canExecuteTool, checkRateLimit, validateApiKey, resolveUserRole } from '@/lib/agent/security/permission-engine'
import { executeToolWithAudit } from '@/lib/agent/security/audit-logger'
import { FEATURE_AI_AGENT_CONNECTOR, APP_DOMAIN } from '@/lib/config/features'
import { isOAuthToken, hashToken, mcpScopesToInternal } from '@/lib/agent/oauth/oauth-utils'
import { validateOAuthToken } from '@/lib/agent/oauth/oauth-store'
import type { JsonRpcRequest, JsonRpcResponse, ToolContext, McpSession } from '@/lib/agent/types/connector-types'

export const runtime = 'nodejs'
export const maxDuration = 60

// Supported MCP protocol versions (newest first)
const SUPPORTED_PROTOCOL_VERSIONS = ['2025-06-18', '2025-03-26', '2024-11-05']
const DEFAULT_PROTOCOL_VERSION = '2024-11-05'

// In-memory session store (sufficient for serverless — sessions re-created per cold start)
const sessions = new Map<string, McpSession & { protocolVersion?: string }>()

// Resolved credentials from either auth method
interface ResolvedAuth {
  id: string
  wallet_address: string
  scopes: string[]
  rate_limit: number
  name: string
}

// ===================================================
// AUTHENTICATE — Supports both OAuth tokens and API keys
// ===================================================

async function authenticateRequest(req: NextRequest): Promise<{ auth: ResolvedAuth | null; error?: NextResponse }> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${APP_DOMAIN}`
  const authHeader = req.headers.get('authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    // Return 401 with WWW-Authenticate for OAuth discovery (RFC 9728)
    const errorResp = jsonRpcError(null, -32000, 'Authentication required')
    errorResp.headers.set(
      'WWW-Authenticate',
      `Bearer resource_metadata="${baseUrl}/.well-known/oauth-protected-resource"`
    )
    return { auth: null, error: errorResp }
  }

  const token = authHeader.slice(7)

  // Determine auth method by token prefix
  if (isOAuthToken(token)) {
    // OAuth 2.1 access token
    const tokenHash = hashToken(token)
    const stored = await validateOAuthToken(tokenHash)

    if (!stored) {
      const errorResp = jsonRpcError(null, -32000, 'Invalid or expired OAuth token')
      errorResp.headers.set(
        'WWW-Authenticate',
        `Bearer error="invalid_token", resource_metadata="${baseUrl}/.well-known/oauth-protected-resource"`
      )
      return { auth: null, error: errorResp }
    }

    const internalScopes = mcpScopesToInternal(stored.scope)

    return {
      auth: {
        id: `oauth:${stored.client_id}`,
        wallet_address: stored.wallet_address,
        scopes: internalScopes,
        rate_limit: 100, // Default rate limit for OAuth
        name: `OAuth (${stored.client_id.slice(0, 8)})`,
      },
    }
  }

  // API key (aml_ prefix or fallback)
  const keyHash = createHash('sha256').update(token).digest('hex')
  const validatedKey = await validateApiKey(keyHash)

  if (!validatedKey) {
    return { auth: null, error: jsonRpcError(null, -32000, 'Invalid or expired API key') }
  }

  return { auth: validatedKey }
}

// ===================================================
// POST — JSON-RPC 2.0 requests
// ===================================================

export async function POST(req: NextRequest) {
  if (!FEATURE_AI_AGENT_CONNECTOR) {
    return jsonRpcError(null, -32000, 'MCP Gateway not enabled')
  }

  // Authenticate (OAuth or API key)
  const { auth, error: authError } = await authenticateRequest(req)
  if (!auth) return authError!

  // Rate limit check (skip for OAuth — TODO: add token-based rate limiting)
  if (!auth.id.startsWith('oauth:')) {
    const rlCheck = await checkRateLimit(auth.id, auth.rate_limit)
    if (!rlCheck.allowed) {
      return NextResponse.json(
        { jsonrpc: '2.0', error: { code: -32000, message: rlCheck.reason } },
        { status: 429 }
      )
    }
  }

  // Parse JSON-RPC request
  let rpcReq: JsonRpcRequest
  try {
    rpcReq = await req.json()
  } catch {
    return jsonRpcError(null, -32700, 'Parse error')
  }

  if (rpcReq.jsonrpc !== '2.0' || !rpcReq.method) {
    return jsonRpcError(rpcReq.id, -32600, 'Invalid Request')
  }

  // Resolve user role
  const role = await resolveUserRole(auth.wallet_address)

  // Resolve session protocol version from Mcp-Session-Id header (post-initialize)
  const sessionId = req.headers.get('mcp-session-id')
  const session = sessionId ? sessions.get(sessionId) : undefined
  const protocolVersion = session?.protocolVersion || DEFAULT_PROTOCOL_VERSION

  // Route JSON-RPC methods
  switch (rpcReq.method) {
    case 'initialize':
      return handleInitialize(rpcReq, auth, role)

    case 'tools/list':
      return handleToolsList(rpcReq, auth, role, protocolVersion)

    case 'tools/call':
      return handleToolsCall(rpcReq, auth, role, req, protocolVersion)

    case 'ping':
      return jsonRpcSuccess(rpcReq.id, {}, protocolVersion)

    default:
      return jsonRpcError(rpcReq.id, -32601, `Method not found: ${rpcReq.method}`)
  }
}

// ===================================================
// GET — Health check + OAuth discovery hint
// ===================================================

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${APP_DOMAIN}`

  return NextResponse.json({
    service: 'AutoMALL MCP Gateway',
    protocol: 'MCP Streamable HTTP',
    mcp_version: DEFAULT_PROTOCOL_VERSION,
    supported_versions: SUPPORTED_PROTOCOL_VERSIONS,
    status: FEATURE_AI_AGENT_CONNECTOR ? 'active' : 'disabled',
    tools: toolRegistry.size,
    authentication: 'OAuth 2.1',
    oauth_metadata: `${baseUrl}/.well-known/oauth-protected-resource`,
  }, {
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  })
}

// ===================================================
// DELETE — Session termination
// ===================================================

export async function DELETE(req: NextRequest) {
  const sessionId = req.headers.get('mcp-session-id')
  if (sessionId) {
    sessions.delete(sessionId)
  }
  return new NextResponse(null, { status: 204 })
}

// ===================================================
// OPTIONS — CORS preflight
// ===================================================

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Mcp-Session-Id, MCP-Protocol-Version',
    },
  })
}

// ===================================================
// JSON-RPC HANDLERS
// ===================================================

function handleInitialize(
  rpcReq: JsonRpcRequest,
  auth: ResolvedAuth,
  role: string
): NextResponse {
  const sessionId = randomUUID()

  // Negotiate protocol version — use client's version if we support it, otherwise our default
  const clientVersion = rpcReq.params?.protocolVersion as string | undefined
  const negotiatedVersion = clientVersion && SUPPORTED_PROTOCOL_VERSIONS.includes(clientVersion)
    ? clientVersion
    : DEFAULT_PROTOCOL_VERSION

  sessions.set(sessionId, {
    id: sessionId,
    walletAddress: auth.wallet_address,
    role: role as any,
    apiKeyId: auth.id,
    createdAt: Date.now(),
    lastAccessedAt: Date.now(),
    protocolVersion: negotiatedVersion,
  })

  const response = jsonRpcSuccess(rpcReq.id, {
    protocolVersion: negotiatedVersion,
    capabilities: {
      tools: { listChanged: false },
    },
    serverInfo: {
      name: 'AutoMALL AI Agent',
      version: '1.0.0',
    },
  })

  response.headers.set('Mcp-Session-Id', sessionId)
  response.headers.set('Mcp-Protocol-Version', negotiatedVersion)
  return response
}

function handleToolsList(
  rpcReq: JsonRpcRequest,
  auth: ResolvedAuth,
  role: string,
  protocolVersion: string
): NextResponse {
  const tools = toolRegistry.getToolsForScopes(role as any, auth.scopes)

  const mcpTools = tools.map(t => {
    // MCP spec requires JSON Schema (not OpenAPI 3.0) without $schema meta property
    const schema = zodToJsonSchema(t.inputSchema, { target: 'jsonSchema7' }) as Record<string, unknown>
    delete schema.$schema
    return {
      name: t.name,
      description: t.description,
      inputSchema: schema,
    }
  })

  return jsonRpcSuccess(rpcReq.id, { tools: mcpTools }, protocolVersion)
}

async function handleToolsCall(
  rpcReq: JsonRpcRequest,
  auth: ResolvedAuth,
  role: string,
  req: NextRequest,
  protocolVersion: string,
): Promise<NextResponse> {
  const { name, arguments: args } = rpcReq.params || {}

  if (!name) {
    return jsonRpcError(rpcReq.id, -32602, 'Missing tool name in params.name')
  }

  const theTool = toolRegistry.getTool(name)
  if (!theTool) {
    return jsonRpcError(rpcReq.id, -32602, `Tool not found: ${name}`)
  }

  // Permission check
  const permCheck = canExecuteTool(role as any, name, auth.scopes)
  if (!permCheck.allowed) {
    return jsonRpcError(rpcReq.id, -32000, permCheck.reason || 'Permission denied')
  }

  // Validate input
  const inputResult = theTool.inputSchema.safeParse(args || {})
  if (!inputResult.success) {
    return jsonRpcError(rpcReq.id, -32602, `Invalid parameters: ${inputResult.error.message}`)
  }

  // Build context
  const context: ToolContext = {
    walletAddress: auth.wallet_address,
    role: role as any,
    apiKeyId: auth.id,
    connectionMode: 'mcp',
  }

  // Execute with audit
  const result = await executeToolWithAudit(
    name,
    theTool.handler,
    inputResult.data,
    context,
    req.headers.get('x-forwarded-for') || undefined
  )

  if (result.success) {
    return jsonRpcSuccess(rpcReq.id, {
      content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }],
    }, protocolVersion)
  }

  return jsonRpcSuccess(rpcReq.id, {
    content: [{ type: 'text', text: `Error: ${result.error}` }],
    isError: true,
  }, protocolVersion)
}

// ===================================================
// HELPERS
// ===================================================

function jsonRpcSuccess(id: string | number | undefined, result: any, protocolVersion?: string): NextResponse {
  const body: JsonRpcResponse = { jsonrpc: '2.0', id, result }
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  }
  if (protocolVersion) {
    headers['Mcp-Protocol-Version'] = protocolVersion
  }
  return NextResponse.json(body, { headers })
}

function jsonRpcError(id: string | number | undefined | null, code: number, message: string): NextResponse {
  const body: JsonRpcResponse = {
    jsonrpc: '2.0',
    id: id ?? undefined,
    error: { code, message },
  }
  const status = code === -32000 ? (message.includes('Authentication') ? 401 : 403) : 400
  return NextResponse.json(body, {
    status,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  })
}
