/**
 * Document Tools — Extract text from PDFs and text documents
 *
 * Handles PDF text extraction (via pdf-parse) with a fallback to GPT-4o Vision
 * for scanned/image-only PDFs. Also handles plain text and CSV files directly.
 *
 * This complements analyze_image (vision) and extract_vehicle_from_images (vehicle-specific).
 * The apeX chat route decides which tool to call based on conversation context.
 */

import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import type { AgentTool, ToolContext, UserRole, ToolPermission } from '../types/connector-types'

const EXTRACTION_TIMEOUT_MS = 30_000
const MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024 // 10MB

// ===================================================
// SCHEMA
// ===================================================

const ExtractDocumentTextInput = z.object({
  document_urls: z.array(z.string().url()).min(1).max(3)
    .describe('Public URLs of documents to extract text from (PDF, TXT, CSV)'),
  context: z.string().optional()
    .describe('What the user wants to extract or do with the document (e.g. "extract pick payment deal info", "read this contract")'),
})

// ===================================================
// PDF TEXT EXTRACTION
// ===================================================

async function extractPdfText(buffer: Buffer): Promise<string> {
  // Dynamic import to avoid bundling issues on Vercel (same pattern as exceljs)
  // pdf-parse v1.1.1 uses default export
  const pdfParse = (await import('pdf-parse' as any)) as any
  const parse = pdfParse.default || pdfParse
  const result = await parse(buffer, {
    // Limit to first 20 pages to avoid memory issues
    max: 20,
  })
  return result.text?.trim() || ''
}

// ===================================================
// FALLBACK: GPT-4o Vision for scanned PDFs
// ===================================================

async function extractTextViaVision(buffer: Buffer, context?: string): Promise<string> {
  const base64 = buffer.toString('base64')
  const contextInstruction = context
    ? `\nThe user specifically wants: ${context}`
    : ''

  const { text } = await generateText({
    model: openai('gpt-4o'),
    system: `You are a document text extraction expert for Autos MALL, a car sales platform.
Extract ALL text content from this document image. Focus on:
- Client information: full name, phone number, email, address
- Vehicle details: brand, model, year, color, VIN, mileage
- Financial data: sale price, down payment, installment amounts, payment dates, payment frequency
- Dates, signatures, contract numbers

Return the extracted text in a structured, readable format. Be precise with numbers, dates, and phone numbers.
If the document is a Pick Payment / installment contract, extract EVERY financial field.`,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          image: `data:application/pdf;base64,${base64}`,
        },
        {
          type: 'text',
          text: `Extract ALL text from this document.${contextInstruction}`,
        },
      ],
    }],
    maxOutputTokens: 2000,
  })

  return text
}

// ===================================================
// HANDLER
// ===================================================

async function handleExtractDocumentText(
  input: z.infer<typeof ExtractDocumentTextInput>,
  _ctx: ToolContext,
) {
  const { document_urls, context } = input
  const results: Array<{
    url: string
    text: string
    method: 'pdf_parse' | 'vision_fallback' | 'direct_read'
    pages?: number
    error?: string
  }> = []

  for (const url of document_urls) {
    try {
      // Download the document
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), EXTRACTION_TIMEOUT_MS)

      let res: Response
      try {
        res = await fetch(url, { signal: controller.signal })
      } finally {
        clearTimeout(timeout)
      }

      if (!res.ok) {
        results.push({ url, text: '', method: 'direct_read', error: `Download failed: HTTP ${res.status}` })
        continue
      }

      const contentType = res.headers.get('content-type') || ''
      const buffer = Buffer.from(await res.arrayBuffer())

      if (buffer.length > MAX_PDF_SIZE_BYTES) {
        results.push({ url, text: '', method: 'direct_read', error: `File too large: ${(buffer.length / 1024 / 1024).toFixed(1)}MB (max 10MB)` })
        continue
      }

      // Determine file type from URL extension or content-type
      const urlLower = url.toLowerCase()
      const isPdf = urlLower.endsWith('.pdf') || contentType.includes('pdf')
      const isText = urlLower.endsWith('.txt') || urlLower.endsWith('.csv') || contentType.includes('text/')

      if (isPdf) {
        // Try pdf-parse first
        let extractedText = ''
        let method: 'pdf_parse' | 'vision_fallback' = 'pdf_parse'

        try {
          extractedText = await extractPdfText(buffer)
        } catch (parseErr) {
          // pdf-parse failed (corrupted, encrypted, etc.)
          console.warn(`[Document Tools] pdf-parse failed: ${parseErr instanceof Error ? parseErr.message : 'unknown'}`)
        }

        // If text is too short, it's likely a scanned/image PDF → fallback to Vision
        if (extractedText.length < 50) {
          try {
            extractedText = await extractTextViaVision(buffer, context)
            method = 'vision_fallback'
          } catch (visionErr) {
            if (!extractedText) {
              results.push({
                url, text: '', method,
                error: `Could not extract text. PDF may be password-protected or corrupted. Error: ${visionErr instanceof Error ? visionErr.message : 'unknown'}`,
              })
              continue
            }
          }
        }

        results.push({ url, text: extractedText, method })
      } else if (isText) {
        // Plain text / CSV — read directly
        const text = buffer.toString('utf-8').trim()
        results.push({ url, text, method: 'direct_read' })
      } else {
        // Unknown type — try as text, fallback to Vision
        const textAttempt = buffer.toString('utf-8').trim()
        // Check if it looks like valid text (no binary garbage)
        const binaryRatio = (textAttempt.match(/[\x00-\x08\x0E-\x1F]/g) || []).length / Math.max(textAttempt.length, 1)
        if (binaryRatio < 0.05 && textAttempt.length > 10) {
          results.push({ url, text: textAttempt, method: 'direct_read' })
        } else {
          results.push({ url, text: '', method: 'direct_read', error: 'Unsupported file format. Send as PDF, TXT, or CSV.' })
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        results.push({ url, text: '', method: 'direct_read', error: 'Document download timed out (30s)' })
      } else {
        results.push({ url, text: '', method: 'direct_read', error: `Error: ${err instanceof Error ? err.message : 'unknown'}` })
      }
    }
  }

  // Combine all extracted text
  const allText = results
    .filter(r => r.text)
    .map(r => r.text)
    .join('\n\n---\n\n')

  const errors = results.filter(r => r.error)

  return {
    extracted_text: allText || '(No text could be extracted from the document)',
    documents_processed: results.length,
    documents_with_text: results.filter(r => r.text).length,
    extraction_methods: results.map(r => ({ url: r.url, method: r.method, has_text: !!r.text })),
    ...(errors.length > 0 ? { errors: errors.map(e => ({ url: e.url, error: e.error })) } : {}),
  }
}

// ===================================================
// TOOL DEFINITION
// ===================================================

export const documentTools: AgentTool[] = [
  {
    name: 'extract_document_text',
    description: 'Extract text from PDF documents, text files, or CSV files. Use this when the user sends a PDF (e.g. Pick Payment contract, invoice, vehicle title, buyer agreement) and you need to read its contents. Returns the full extracted text which you can then use to create deals, leads, or other CRM actions.',
    category: 'Document',
    inputSchema: ExtractDocumentTextInput,
    permission: 'read' as ToolPermission,
    roles: ['seller', 'admin'] as UserRole[],
    handler: handleExtractDocumentText,
  },
]
