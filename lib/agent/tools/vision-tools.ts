/**
 * Vision Tools — General-purpose image analysis for AI agents
 *
 * Uses GPT-4o Vision to analyze screenshots, documents, contact cards,
 * WhatsApp conversations, and any non-vehicle image content.
 *
 * This complements extract_vehicle_from_images (which is vehicle-specific).
 * The apeX chat route decides which tool to call based on conversation context.
 */

import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import type { AgentTool, ToolContext, UserRole, ToolPermission } from '../types/connector-types'

const ANALYSIS_TIMEOUT_MS = 30_000
const MAX_ANALYSIS_IMAGES = 3

// ===================================================
// SCHEMA
// ===================================================

const AnalyzeImageInput = z.object({
  image_urls: z.array(z.string().url()).min(1).max(5)
    .describe('Public URLs of images to analyze'),
  context: z.string().optional()
    .describe('What the user wants to extract or understand from the image (e.g. "extract client contact info", "read the document text")'),
})

// ===================================================
// HANDLER
// ===================================================

async function handleAnalyzeImage(
  input: z.infer<typeof AnalyzeImageInput>,
  _ctx: ToolContext,
) {
  const { image_urls, context } = input

  // Download images as buffers (same pattern as vehicle-extractor)
  const urls = image_urls.slice(0, MAX_ANALYSIS_IMAGES)
  const buffers: (Buffer | undefined)[] = await Promise.all(
    urls.map(async (url) => {
      try {
        const res = await fetch(url)
        if (!res.ok) return undefined
        return Buffer.from(await res.arrayBuffer())
      } catch {
        return undefined
      }
    })
  )

  // Build content array for GPT-4o Vision
  const content: Array<{ type: 'text'; text: string } | { type: 'image'; image: Buffer | string; mimeType?: string }> = []

  for (let i = 0; i < urls.length; i++) {
    if (buffers[i]) {
      content.push({ type: 'image', image: buffers[i]!, mimeType: 'image/jpeg' })
    } else {
      content.push({ type: 'image', image: urls[i] })
    }
  }

  const contextInstruction = context
    ? `\nThe user specifically wants: ${context}`
    : ''

  content.push({
    type: 'text',
    text: `Analyze this image thoroughly and extract ALL useful information.${contextInstruction}`,
  })

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), ANALYSIS_TIMEOUT_MS)

  try {
    const { text } = await generateText({
      model: openai('gpt-4o'),
      system: `You are an expert image analyst for Autos MALL, a car sales platform. Your job is to extract ALL useful information from images that are NOT vehicle photos.

Common image types you'll see:
- **WhatsApp screenshots**: Extract contact name, phone number, last message, conversation context
- **Contact cards / profile photos**: Extract visible name, phone, business info
- **Documents**: Read all text, dates, amounts, names
- **Business cards**: Extract name, phone, email, company, role
- **Receipts / invoices**: Extract amounts, dates, items, vendor info
- **Text messages / chat screenshots**: Extract sender name, phone number, key messages, dates

## OUTPUT FORMAT

Return a structured summary with:
1. **Image type**: What kind of image this is
2. **Extracted data**: All data points found, clearly labeled
3. **Key fields** (if applicable): name, phone, email, address, amounts, dates

Be precise with phone numbers — include country code if visible.
Extract EVERYTHING readable. The user will use this data for CRM actions (creating leads, follow-ups, deals).

Respond in the same language as the user's context (Spanish if context is in Spanish, English otherwise).`,
      messages: [{
        role: 'user',
        content,
      }],
      abortSignal: controller.signal,
      maxOutputTokens: 1000,
    })

    return {
      analysis: text,
      image_count: urls.length,
      images_analyzed: buffers.filter(Boolean).length,
    }
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Image analysis timed out. Please try with fewer images.')
    }
    throw err
  } finally {
    clearTimeout(timeout)
  }
}

// ===================================================
// TOOL DEFINITION
// ===================================================

export const visionTools: AgentTool[] = [
  {
    name: 'analyze_image',
    description: 'Analyze a non-vehicle image using AI vision: read text from screenshots, extract contact info from WhatsApp/phone screenshots, read documents, receipts, or any image content. Use this for CRM-related images (client contacts, chat screenshots, documents) instead of extract_vehicle_from_images.',
    category: 'Vision',
    inputSchema: AnalyzeImageInput,
    permission: 'read' as ToolPermission,
    roles: ['seller', 'admin'] as UserRole[],
    handler: handleAnalyzeImage,
  },
]
