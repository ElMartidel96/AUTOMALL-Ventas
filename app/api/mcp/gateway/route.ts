/**
 * MCP Gateway Server — /api/mcp/gateway
 *
 * Implements MCP Streamable HTTP Transport (spec 2025-06-18).
 * Allows external AI apps (Claude Desktop, ChatGPT, Gemini) to connect
 * via API key authentication and call AutoMALL tools.
 *
 * NOT to be confused with /api/mcp-docs (CryptoGift legacy MCP server).
 */

import { NextRequest, NextResponse } from 'next/server'
import { createHash, randomUUID } from 'crypto'
import { zodToJsonSchema } from 'zod-to-json-schema'
import { toolRegistry } from '@/lib/agent/tools/tool-registry'
import { canExecuteTool, checkRateLimit, validateApiKey, resolveUserRole } from '@/lib/agent/security/permission-engine'
import { executeToolWithAudit } from '@/lib/agent/security/audit-logger'
import { FEATURE_AI_AGENT_CONNECTOR } from '@/lib/config/features'
import type { JsonRpcRequest, JsonRpcResponse, ToolContext, McpSession } from '@/lib/agent/types/connector-types'

export const runtime = 'nodejs'
export const maxDuration = 60

// In-memory session store (sufficient for serverless — sessions re-created per cold start)
const sessions = new Map<string, McpSession>()

// ===================================================
// POST — JSON-RPC 2.0 requests
// ===================================================

export async function POST(req: NextRequest) {
  if (!FEATURE_AI_AGENT_CONNECTOR) {
    return jsonRpcError(null, -32000, 'MCP Gateway not enabled')
  }

  // Auth: extract API key from Bearer token
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return jsonRpcError(null, -32000, 'Missing or invalid Authorization header. Use: Bearer <api_key>')
  }

  const apiKey = authHeader.slice(7)
  const keyHash = createHash('sha256').update(apiKey).digest('hex')
  const validatedKey = await validateApiKey(keyHash)

  if (!validatedKey) {
    return jsonRpcError(null, -32000, 'Invalid or expired API key')
  }

  // Rate limit check
  const rlCheck = await checkRateLimit(validatedKey.id, validatedKey.rate_limit)
  if (!rlCheck.allowed) {
    return NextResponse.json(
      { jsonrpc: '2.0', error: { code: -32000, message: rlCheck.reason } },
      { status: 429 }
    )
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
  const role = await resolveUserRole(validatedKey.wallet_address)

  // Session management
  let sessionId = req.headers.get('mcp-session-id') || undefined

  // Route JSON-RPC methods
  switch (rpcReq.method) {
    case 'initialize':
      return handleInitialize(rpcReq, validatedKey, role)

    case 'tools/list':
      return handleToolsList(rpcReq, validatedKey, role)

    case 'tools/call':
      return handleToolsCall(rpcReq, validatedKey, role, req, sessionId)

    case 'ping':
      return jsonRpcSuccess(rpcReq.id, {})

    default:
      return jsonRpcError(rpcReq.id, -32601, `Method not found: ${rpcReq.method}`)
  }
}

// ===================================================
// GET — Health check / SSE (future)
// ===================================================

export async function GET() {
  return NextResponse.json({
    service: 'AutoMALL MCP Gateway',
    protocol: 'MCP Streamable HTTP',
    version: '2025-06-18',
    status: FEATURE_AI_AGENT_CONNECTOR ? 'active' : 'disabled',
    tools: toolRegistry.size,
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
// JSON-RPC HANDLERS
// ===================================================

function handleInitialize(
  rpcReq: JsonRpcRequest,
  key: { id: string; wallet_address: string; scopes: string[] },
  role: string
): NextResponse {
  const sessionId = randomUUID()

  sessions.set(sessionId, {
    id: sessionId,
    walletAddress: key.wallet_address,
    role: role as any,
    apiKeyId: key.id,
    createdAt: Date.now(),
    lastAccessedAt: Date.now(),
  })

  const response = jsonRpcSuccess(rpcReq.id, {
    protocolVersion: '2025-06-18',
    capabilities: {
      tools: { listChanged: false },
    },
    serverInfo: {
      name: 'AutoMALL AI Agent',
      version: '1.0.0',
    },
  })

  response.headers.set('Mcp-Session-Id', sessionId)
  return response
}

function handleToolsList(
  rpcReq: JsonRpcRequest,
  key: { id: string; wallet_address: string; scopes: string[] },
  role: string
): NextResponse {
  const tools = toolRegistry.getToolsForScopes(role as any, key.scopes)

  const mcpTools = tools.map(t => ({
    name: t.name,
    description: t.description,
    inputSchema: zodToJsonSchema(t.inputSchema, { target: 'openApi3' }),
  }))

  return jsonRpcSuccess(rpcReq.id, { tools: mcpTools })
}

async function handleToolsCall(
  rpcReq: JsonRpcRequest,
  key: { id: string; wallet_address: string; scopes: string[]; rate_limit: number; name: string },
  role: string,
  req: NextRequest,
  sessionId?: string
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
  const permCheck = canExecuteTool(role as any, name, key.scopes)
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
    walletAddress: key.wallet_address,
    role: role as any,
    apiKeyId: key.id,
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
    })
  }

  return jsonRpcSuccess(rpcReq.id, {
    content: [{ type: 'text', text: `Error: ${result.error}` }],
    isError: true,
  })
}

// ===================================================
// HELPERS
// ===================================================

function jsonRpcSuccess(id: string | number | undefined, result: any): NextResponse {
  const body: JsonRpcResponse = { jsonrpc: '2.0', id, result }
  return NextResponse.json(body, {
    headers: { 'Content-Type': 'application/json' },
  })
}

function jsonRpcError(id: string | number | undefined | null, code: number, message: string): NextResponse {
  const body: JsonRpcResponse = {
    jsonrpc: '2.0',
    id: id ?? undefined,
    error: { code, message },
  }
  const status = code === -32000 ? 403 : 400
  return NextResponse.json(body, { status })
}
