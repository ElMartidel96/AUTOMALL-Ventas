/**
 * Agent Info Endpoint — /api/agent/chat
 *
 * Informational endpoint for the AI Agent Connector system.
 * The platform does NOT run its own AI model — users connect
 * THEIR preferred AI (Claude, ChatGPT, Gemini) via the MCP Gateway.
 *
 * - MCP Gateway: /api/mcp/gateway (JSON-RPC 2.0)
 * - API Keys: /api/agent/keys (CRUD)
 * - Setup UI: /profile?tab=agent
 *
 * NOT to be confused with /api/agent/route.ts (CryptoGift legacy).
 */

import { NextResponse } from 'next/server'
import { toolRegistry } from '@/lib/agent/tools/tool-registry'

export const runtime = 'nodejs'

export async function POST() {
  return NextResponse.json({
    error: 'Direct chat is not available',
    message: 'AutoMALL uses a connect-your-own-AI model. Set up your API key at /profile → AI Assistant tab, then connect your preferred AI (Claude, ChatGPT, Gemini) via the MCP Gateway.',
    setup: '/profile?tab=agent',
    mcp_gateway: '/api/mcp/gateway',
    api_keys: '/api/agent/keys',
  }, { status: 400 })
}

export async function GET() {
  return NextResponse.json({
    service: 'AutoMALL AI Agent Connector',
    architecture: 'connect-your-own-AI',
    mcp_gateway: '/api/mcp/gateway',
    api_keys: '/api/agent/keys',
    setup: '/profile?tab=agent',
    tools: toolRegistry.size,
    status: 'active',
  })
}
