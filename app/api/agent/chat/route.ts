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
// SAFE LOGGER — Never pass complex objects to console
// Vercel's Node.js inspect crashes on AI SDK error objects
// ===================================================

const log = {
  info: (msg: string) => console.log(`[apeX Chat] ${msg}`),
  error: (msg: string) => console.error(`[apeX Chat] ${msg}`),
  warn: (msg: string) => console.warn(`[apeX Chat] ${msg}`),
}

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
// HELPERS
// ===================================================

/**
 * Convert UIMessages (AI SDK v5 format with `parts`) to CoreMessages
 * (with `content` string) that streamText() expects.
 *
 * TextStreamChatTransport sends: { parts: [{ type: 'text', text: '...' }] }
 * streamText expects:            { content: '...' }
 */
type ChatRole = 'user' | 'assistant' | 'system'
const VALID_ROLES: ChatRole[] = ['user', 'assistant', 'system']

function convertMessages(rawMessages: any[]): { role: ChatRole; content: string }[] {
  return rawMessages
    .map((msg: any) => {
      const role = msg.role as string
      // Accept both formats: UIMessage (parts) and CoreMessage (content)
      let content: string = typeof msg.content === 'string' ? msg.content : ''
      if (!content && Array.isArray(msg.parts)) {
        content = msg.parts
          .filter((p: any) => p.type === 'text')
          .map((p: any) => p.text || '')
          .join('')
      }
      return { role: role as ChatRole, content }
    })
    .filter((msg) => msg.content && VALID_ROLES.includes(msg.role))
}

// ===================================================
// POST — Streaming AI Chat
// ===================================================

export async function POST(req: NextRequest) {
  try {
    // Check AI service availability early
    if (!process.env.OPENAI_API_KEY) {
      log.error('OPENAI_API_KEY not configured')
      return new Response(JSON.stringify({ error: 'AI service not configured. Contact support.' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      })
    }

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
      try {
        const { success } = await rateLimiter.limit(walletAddress)
        if (!success) {
          return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please wait a moment.' }), {
            status: 429,
            headers: { 'Content-Type': 'application/json' },
          })
        }
      } catch (rlErr) {
        log.warn(`Rate limit check failed: ${rlErr instanceof Error ? rlErr.message : 'unknown'}`)
        // Fail open
      }
    }

    // Parse body
    let body: any
    try {
      body = await req.json()
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (!Array.isArray(body?.messages) || body.messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Messages array required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Convert UIMessages → CoreMessages
    const messages = convertMessages(body.messages)
    if (messages.length === 0) {
      return new Response(JSON.stringify({ error: 'No valid messages found' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    log.info(`wallet=${walletAddress} msgs=${messages.length}`)

    // Resolve role
    const role = await resolveUserRole(walletAddress)
    const scopes = ['read', 'write'] // Platform chat gets full access

    // Resolve display name
    let displayName: string | undefined
    if (supabaseAdmin) {
      try {
        const { data } = await supabaseAdmin
          .from('sellers')
          .select('display_name, business_name')
          .eq('wallet_address', walletAddress)
          .single()
        displayName = data?.display_name || data?.business_name || undefined
      } catch {
        // Seller not found — fine, use default
      }
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

    // Stream — use .chat() to force Chat Completions API (Responses API rejects flexible Zod schemas)
    const modelId = process.env.AI_MODEL || 'gpt-4o'
    const result = await streamText({
      model: openai.chat(modelId),
      system,
      messages,
      tools: aiTools,
      toolChoice: 'auto',
      maxOutputTokens: 2000,
      onFinish: ({ usage }) => {
        log.info(`wallet=${walletAddress} tokens=${usage?.totalTokens ?? 'unknown'}`)
      },
    })

    return result.toTextStreamResponse()
  } catch (error) {
    // SAFE logging — never pass complex AI SDK objects to console
    const errMsg = error instanceof Error ? error.message : String(error)
    const errName = error instanceof Error ? error.constructor.name : 'Unknown'
    log.error(`${errName}: ${errMsg}`)

    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ error: 'Invalid request format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (errMsg.includes('API key') || errMsg.includes('apiKey') || errMsg.includes('Incorrect API')) {
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
    openaiConfigured: !!process.env.OPENAI_API_KEY,
    status: 'active',
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
