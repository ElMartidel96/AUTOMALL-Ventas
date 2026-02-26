/**
 * Platform Chat Endpoint — /api/agent/chat
 *
 * Vercel AI SDK v5 streaming chat with AutoMALL tool registry.
 * This is the in-app chat for authenticated users.
 *
 * Auth: Reads wallet from `x-wallet-address` header OR `walletAddress` body field.
 * The widget sends both for robustness.
 *
 * NOT to be confused with /api/agent/route.ts (CryptoGift legacy).
 */

import { NextRequest, NextResponse } from 'next/server'
import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { toolRegistry } from '@/lib/agent/tools/tool-registry'
import { generateSystemPrompt } from '@/lib/agent/prompts/automall-system-prompt'
import { canExecuteTool } from '@/lib/agent/security/permission-engine'
import { executeToolWithAudit } from '@/lib/agent/security/audit-logger'
import { resolveUserRole } from '@/lib/agent/security/permission-engine'
import type { ToolContext } from '@/lib/agent/types/connector-types'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    // Parse body first (needed for wallet fallback)
    const body = await req.json()

    // Extract wallet: header first, body fallback
    const walletAddress =
      req.headers.get('x-wallet-address') ||
      body?.walletAddress ||
      null
    if (!walletAddress || typeof walletAddress !== 'string') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // AI SDK v5 TextStreamChatTransport sends { messages, ...bodyFields }
    // Messages may use `parts` (v5 format) or `content` (classic format).
    // We pass them directly to streamText which handles both.
    const messages = body?.messages
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: messages array is required' },
        { status: 400 }
      )
    }

    // Resolve user role
    const role = await resolveUserRole(walletAddress)

    // Build tool context
    const context: ToolContext = {
      walletAddress,
      role,
      connectionMode: 'platform',
      aiProvider: 'openai',
    }

    // Get tools for this user's role and convert to AI SDK format
    const availableTools = toolRegistry.getToolsForRole(role)
    const aiTools: Record<string, any> = {}

    for (const agentTool of availableTools) {
      const toolName = agentTool.name
      aiTools[toolName] = {
        description: agentTool.description,
        parameters: agentTool.inputSchema,
        execute: async (input: any) => {
          // Permission check
          const check = canExecuteTool(role, toolName, ['read', 'write'])
          if (!check.allowed) {
            return { error: check.reason }
          }

          // Execute with audit logging
          const result = await executeToolWithAudit(
            toolName,
            agentTool.handler,
            input,
            context,
            req.headers.get('x-forwarded-for') || undefined
          )

          return result.success ? result.data : { error: result.error }
        },
      }
    }

    // Generate system prompt
    const systemPrompt = generateSystemPrompt({
      role,
      walletAddress,
      locale: req.headers.get('accept-language')?.startsWith('es') ? 'es' : 'en',
    })

    // Stream response — pass messages as-is (AI SDK v5 handles format)
    const result = streamText({
      model: openai('gpt-4o'),
      system: systemPrompt,
      messages,
      tools: aiTools,
    })

    return result.toTextStreamResponse()
  } catch (err: any) {
    console.error('[AgentChat] Error:', err.message)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'AutoMALL AI Agent Chat',
    status: 'active',
    tools: toolRegistry.size,
  })
}
