/**
 * apeX Chat Endpoint — /api/agent/chat
 *
 * Streaming AI endpoint with tool calling for the apeX chat widget.
 * Uses the same tool registry, permission engine, and audit logger
 * as the MCP Gateway — same capabilities, different interface.
 *
 * Auth: x-wallet-address header (platform chat, same-origin).
 *
 * CRITICAL: stopWhen must be > stepCountIs(1) to allow the model to process tool results.
 * With stepCountIs(1) (default), tool results never reach the model → model avoids tools.
 */

import { NextRequest } from 'next/server'
import { streamText, stepCountIs, convertToModelMessages } from 'ai'
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
export const maxDuration = 120

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
 * Detect staging file URLs in a raw UIMessage.
 * Pattern: https://{host}/vehicle-images/{seller}/staging/{filename}
 */
const STAGING_URL_REGEX = /https:\/\/[^\s]+\/vehicle-images\/[^\s]+\/staging\/[^\s]+\.\w+/g

/** Separate staging URLs into images vs documents */
const DOC_EXTENSIONS = /\.(pdf|txt|csv)$/i
function classifyStagingUrls(urls: string[]): { imageUrls: string[]; docUrls: string[] } {
  const imageUrls: string[] = []
  const docUrls: string[] = []
  for (const url of urls) {
    if (DOC_EXTENSIONS.test(url)) {
      docUrls.push(url)
    } else {
      imageUrls.push(url)
    }
  }
  return { imageUrls, docUrls }
}

/**
 * Extract text content from a raw UIMessage (handles both parts and content formats).
 */
function extractTextFromRawMessage(msg: any): string {
  if (typeof msg.content === 'string') return msg.content
  if (Array.isArray(msg.parts)) {
    return msg.parts
      .filter((p: any) => p.type === 'text')
      .map((p: any) => p.text || '')
      .join('')
  }
  return ''
}

/**
 * Detect staging image URLs from the last user message in raw messages.
 */
function detectStagingImagesFromRaw(rawMessages: any[]): string[] {
  const lastUserMsg = [...rawMessages].reverse().find((m: any) => m.role === 'user')
  if (!lastUserMsg) return []
  const text = extractTextFromRawMessage(lastUserMsg)
  return text.match(STAGING_URL_REGEX) || []
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

    // Convert UIMessages → ModelMessages (preserves tool calls + results across turns).
    // CRITICAL: The old convertMessages() only extracted text parts, DISCARDING all tool
    // call/result data. This meant the model lost all context between turns — it couldn't
    // reference campaign IDs, deal details, or any data from previous tool calls.
    // convertToModelMessages() preserves the full conversation including tool interactions.
    let messages: any[]
    try {
      messages = convertToModelMessages(body.messages, { ignoreIncompleteToolCalls: true })
    } catch (convErr) {
      log.warn(`convertToModelMessages failed: ${convErr instanceof Error ? convErr.message : 'unknown'}, falling back to raw`)
      // Fallback: pass raw messages (streamText can often handle UIMessages directly)
      messages = body.messages
    }
    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'No valid messages found' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Resolve role
    const role = await resolveUserRole(walletAddress)
    const scopes = ['read', 'write'] // Platform chat gets full access

    log.info(`wallet=${walletAddress} role=${role} msgs=${messages.length}`)

    // Resolve display name
    let displayName: string | undefined
    if (supabaseAdmin) {
      try {
        const { data } = await supabaseAdmin
          .from('sellers')
          .select('display_name, business_name')
          .eq('wallet_address', walletAddress.toLowerCase())
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
    let system = generateSystemPrompt({ role, displayName, walletAddress, locale })

    // Build Vercel AI SDK v5 tools from registry
    // CRITICAL: AI SDK v5 uses `inputSchema` (NOT `parameters`) as the property name.
    // Using the wrong name causes asSchema(undefined) → missing `type` field → OpenAI rejects.
    const registryTools = toolRegistry.getToolsForScopes(role, scopes)
    const aiTools: Record<string, any> = {}

    for (const regTool of registryTools) {
      aiTools[regTool.name] = {
        description: regTool.description,
        inputSchema: regTool.inputSchema,
        execute: async (input: any) => {
          log.info(`TOOL CALL: ${regTool.name}`)

          // Permission check
          const perm = canExecuteTool(role, regTool.name, scopes)
          if (!perm.allowed) {
            log.warn(`TOOL DENIED: ${regTool.name} — ${perm.reason}`)
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
            regTool.name,
            regTool.handler,
            input,
            ctx,
          )

          if (result.success) {
            log.info(`TOOL OK: ${regTool.name} (${result.duration_ms}ms)`)
          } else {
            log.error(`TOOL FAIL: ${regTool.name} — ${result.error}`)
          }

          return result.success ? result.data : { error: result.error }
        },
      }
    }

    log.info(`tools=${registryTools.length} role=${role}`)

    // ─── FILE DETECTION — Context-aware routing (images + documents) ───
    const detectedAllUrls = detectStagingImagesFromRaw(body.messages)
    const { imageUrls: detectedImageUrls, docUrls: detectedDocUrls } = classifyStagingUrls(detectedAllUrls)
    const hasNewImages = detectedImageUrls.length > 0
    const hasNewDocs = detectedDocUrls.length > 0

    if (hasNewImages || hasNewDocs) {
      log.info(`FILES DETECTED: ${detectedImageUrls.length} images, ${detectedDocUrls.length} documents`)

      // Extract user's text (everything NOT a URL)
      const lastUserRaw = [...body.messages].reverse().find((m: any) => m.role === 'user')
      const userText = extractTextFromRawMessage(lastUserRaw || {})
        .replace(STAGING_URL_REGEX, '')
        .replace(/\[?\d+ (?:im[aá]gen(?:es)?|archivo[s]?|documento[s]?|file[s]?)\]?/gi, '')
        .trim() || ''

      // Build file-aware routing instructions
      let fileInstruction = '\n\n## ARCHIVOS DETECTADOS — ANALIZAR SEGÚN CONTEXTO\n\n'

      if (hasNewDocs) {
        fileInstruction += `El usuario ha enviado ${detectedDocUrls.length} documento(s) (PDF/texto). URLs: ${JSON.stringify(detectedDocUrls)}
${userText ? `Texto del usuario: "${userText}"` : 'El usuario no incluyó texto descriptivo.'}

**PARA DOCUMENTOS (PDF, TXT, CSV):**
→ Usa \`extract_document_text\` con las document_urls${userText ? ` y context="${userText}"` : ''}
→ Luego usa el texto extraído para la acción que el usuario pidió (crear deal, lead, etc.)
→ Para **Pick Payment / contratos de venta**: extrae TODOS los campos financieros y del cliente del texto, y luego ejecuta \`create_deal\` con financing_type="in_house" y TODOS los campos requeridos.
→ SIEMPRE extrae: nombre del cliente, teléfono, email, vehículo, precio, enganche, cuotas, frecuencia de pago, fecha primer pago.
`
      }

      if (hasNewImages) {
        fileInstruction += `\n${hasNewDocs ? 'Además, e' : 'E'}l usuario ha enviado ${detectedImageUrls.length} imagen(es). URLs: ${JSON.stringify(detectedImageUrls)}
${!hasNewDocs && userText ? `Texto del usuario: "${userText}"` : ''}

**PARA IMÁGENES — DECIDE por CONTEXTO:**
1. Inventario / listar carro / fotos de vehículo → \`extract_vehicle_from_images\`
2. CRM / leads / clientes / screenshots / WhatsApp → \`analyze_image\`
3. Si no está claro → pregunta al usuario
`
      }

      fileInstruction += '\nIMPORTANTE: NUNCA asumas que toda imagen es un vehículo. Lee el historial de la conversación para determinar la intención.'

      system += fileInstruction
    }

    // toolChoice always auto — let the model decide based on context
    const toolChoiceValue = 'auto' as const

    // Stream — use .chat() to force Chat Completions API (Responses API rejects flexible Zod schemas)
    const modelId = process.env.AI_MODEL || 'gpt-4o'
    const result = await streamText({
      model: openai.chat(modelId),
      system,
      messages,
      tools: aiTools,
      toolChoice: toolChoiceValue,
      // CRITICAL: stopWhen controls how many steps the model can take.
      // Default is stepCountIs(1) — model makes ONE call, never processes tool results.
      // stepCountIs(15) allows batch operations: e.g. 1 extract_document_text (8 PDFs)
      // + 8 create_deal calls + summary = ~10 steps. 15 gives headroom for retries.
      stopWhen: stepCountIs(15),
      maxOutputTokens: 2000,
      providerOptions: {
        openai: { structuredOutputs: false },
      },
      onStepFinish: ({ toolCalls, finishReason }) => {
        if (toolCalls && toolCalls.length > 0) {
          const names = toolCalls.map((tc: any) => tc.toolName || tc.name || 'unknown').join(', ')
          log.info(`STEP (${finishReason}): tools=[${names}]`)
        }
      },
      onFinish: ({ usage, steps }) => {
        log.info(`wallet=${walletAddress} tokens=${usage?.totalTokens ?? '?'} steps=${steps?.length ?? '?'}`)
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

export async function GET(req: NextRequest) {
  const walletAddress = req.headers.get('x-wallet-address')

  let role: string | undefined
  if (walletAddress) {
    try {
      role = await resolveUserRole(walletAddress)
    } catch {
      role = 'buyer'
    }
  }

  return new Response(JSON.stringify({
    service: 'apeX Chat — AutoMALL Platform AI',
    tools: toolRegistry.size,
    model: process.env.AI_MODEL || 'gpt-4o',
    openaiConfigured: !!process.env.OPENAI_API_KEY,
    status: 'active',
    ...(role ? { role } : {}),
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
