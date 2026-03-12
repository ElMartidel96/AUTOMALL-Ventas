/**
 * apeX Chat Endpoint — /api/agent/chat
 *
 * Streaming AI endpoint with tool calling for the apeX chat widget.
 * Uses the same tool registry, permission engine, and audit logger
 * as the MCP Gateway — same capabilities, different interface.
 *
 * Auth: x-wallet-address header (platform chat, same-origin).
 */

import { NextRequest } from 'next/server'
import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { toolRegistry } from '@/lib/agent/tools/tool-registry'
import { resolveUserRole, canExecuteTool } from '@/lib/agent/security/permission-engine'
import { executeToolWithAudit } from '@/lib/agent/security/audit-logger'
import { generateSystemPrompt } from '@/lib/agent/prompts/automall-system-prompt'
import { supabaseAdmin } from '@/lib/supabase/client'
import type { ToolContext } from '@/lib/agent/types/connector-types'

export const runtime = 'nodejs'
export const maxDuration = 60

// ===================================================
// RATE LIMITING
// ===================================================

const createRateLimiter = () => {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  return new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(20, '1m'),
    prefix: 'automall:chat:rl',
  })
}

const rateLimiter = createRateLimiter()

// ===================================================
// REQUEST VALIDATION
// ===================================================

const ChatRequestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string().min(1).max(8000),
  })).min(1).max(50),
})

// ===================================================
// POST — Streaming AI Chat
// ===================================================

export async function POST(req: NextRequest) {
  try {
    // Auth
    const walletAddress = req.headers.get('x-wallet-address')
    if (!walletAddress) {
      return new Response(JSON.stringify({ error: 'Missing x-wallet-address header' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Rate limit
    if (rateLimiter) {
      const { success } = await rateLimiter.limit(walletAddress)
      if (!success) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please wait a moment.' }), {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        })
      }
    }

    // Parse body
    const body = await req.json()
    const { messages } = ChatRequestSchema.parse(body)

    // Resolve role
    const role = await resolveUserRole(walletAddress)
    const scopes = ['read', 'write'] // Platform chat gets full access

    // Resolve display name
    let displayName: string | undefined
    if (supabaseAdmin) {
      const { data } = await supabaseAdmin
        .from('sellers')
        .select('display_name, business_name')
        .eq('wallet_address', walletAddress)
        .single()
      displayName = data?.display_name || data?.business_name || undefined
    }

    // Detect locale
    const acceptLang = req.headers.get('accept-language') || ''
    const locale: 'en' | 'es' = acceptLang.startsWith('es') ? 'es' : 'en'

    // System prompt
    const system = generateSystemPrompt({ role, displayName, walletAddress, locale })

    // Build Vercel AI SDK tools from registry
    const registryTools = toolRegistry.getToolsForScopes(role, scopes)
    const aiTools: Record<string, any> = {}

    for (const tool of registryTools) {
      aiTools[tool.name] = {
        description: tool.description,
        parameters: tool.inputSchema,
        execute: async (input: any) => {
          // Permission check
          const perm = canExecuteTool(role, tool.name, scopes)
          if (!perm.allowed) {
            return { error: perm.reason }
          }

          // Execute with audit
          const ctx: ToolContext = {
            walletAddress,
            role,
            connectionMode: 'platform',
            aiProvider: 'openai',
          }

          const result = await executeToolWithAudit(
            tool.name,
            tool.handler,
            input,
            ctx,
          )

          return result.success ? result.data : { error: result.error }
        },
      }
    }

    // Stream
    const modelId = process.env.AI_MODEL || 'gpt-4o'
    const result = await streamText({
      model: openai(modelId),
      system,
      messages,
      tools: aiTools,
      toolChoice: 'auto',
      maxOutputTokens: 2000,
      onFinish: ({ usage }) => {
        console.log(`[apeX Chat] wallet=${walletAddress} tokens=${usage?.totalTokens}`)
      },
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error('[apeX Chat] Error:', error)

    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ error: 'Invalid request', details: error.errors }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // OpenAI key not configured
    if (error instanceof Error && error.message.includes('API key')) {
      return new Response(JSON.stringify({ error: 'AI service not configured' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

// ===================================================
// GET — Health check
// ===================================================

export async function GET() {
  return new Response(JSON.stringify({
    service: 'apeX Chat — AutoMALL Platform AI',
    tools: toolRegistry.size,
    model: process.env.AI_MODEL || 'gpt-4o',
    status: 'active',
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
