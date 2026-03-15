/**
 * File Upload Endpoint — /api/agent/chat/upload
 *
 * Stages images AND documents (PDF, TXT, CSV) in Supabase Storage for AI analysis.
 * Images use the same bucket/path structure as the WhatsApp pipeline.
 * Documents go to the same staging path for text extraction by extract_document_text.
 *
 * Auth: x-wallet-address header (platform chat, same-origin).
 */

import { NextRequest, NextResponse } from 'next/server'
import { getTypedClient } from '@/lib/supabase/client'
import { resolveUserRole } from '@/lib/agent/security/permission-engine'

export const runtime = 'nodejs'
export const maxDuration = 30

const BUCKET = 'vehicle-images'
const MAX_FILES = 10
const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB per image (client compresses to ~1.5MB, this is safety net matching inventory endpoint)
const MAX_DOC_SIZE = 10 * 1024 * 1024 // 10MB per document
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const DOC_TYPES = ['application/pdf', 'text/plain', 'text/csv']
const ALLOWED_TYPES = [...IMAGE_TYPES, ...DOC_TYPES]

let bucketChecked = false

async function ensureBucket() {
  if (bucketChecked) return
  const db = getTypedClient()
  const { data: buckets } = await db.storage.listBuckets()
  if (!buckets?.some(b => b.name === BUCKET)) {
    await db.storage.createBucket(BUCKET, {
      public: true,
      // Allow both images and documents
      allowedMimeTypes: [...ALLOWED_TYPES],
    })
  }
  bucketChecked = true
}

export async function POST(req: NextRequest) {
  try {
    // Auth
    const walletAddress = req.headers.get('x-wallet-address')
    if (!walletAddress) {
      return NextResponse.json({ error: 'Missing x-wallet-address header' }, { status: 401 })
    }

    // Only sellers/admins can upload vehicle images
    const role = await resolveUserRole(walletAddress)
    if (role !== 'seller' && role !== 'admin') {
      return NextResponse.json({ error: 'Only sellers can upload vehicle images' }, { status: 403 })
    }

    const formData = await req.formData()
    // Accept files from both 'images' (legacy) and 'files' (new) fields
    const files = [
      ...formData.getAll('images') as File[],
      ...formData.getAll('files') as File[],
    ]

    if (!files.length) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json({ error: `Maximum ${MAX_FILES} files allowed` }, { status: 400 })
    }

    // Validate files
    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `Invalid file type: ${file.type}. Allowed: JPEG, PNG, WebP, PDF, TXT, CSV` },
          { status: 400 },
        )
      }
      const maxSize = DOC_TYPES.includes(file.type) ? MAX_DOC_SIZE : MAX_IMAGE_SIZE
      if (file.size > maxSize) {
        return NextResponse.json(
          { error: `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max: ${DOC_TYPES.includes(file.type) ? '10MB' : '5MB'}` },
          { status: 400 },
        )
      }
    }

    await ensureBucket()
    const db = getTypedClient()
    const sellerAddr = walletAddress.toLowerCase()

    const staged: Array<{
      public_url: string
      storage_path: string
      file_size: number
      mime_type: string
    }> = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const buffer = Buffer.from(await file.arrayBuffer())

      const ext = file.type === 'application/pdf' ? 'pdf'
        : file.type === 'text/csv' ? 'csv'
        : file.type === 'text/plain' ? 'txt'
        : file.type.includes('png') ? 'png'
        : file.type.includes('webp') ? 'webp'
        : 'jpg'
      const storagePath = `${sellerAddr}/staging/${i}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

      const { error: uploadError } = await db.storage
        .from(BUCKET)
        .upload(storagePath, buffer, { contentType: file.type, upsert: false })

      if (uploadError) {
        console.error(`[Chat Upload] Failed to upload image ${i}:`, uploadError.message)
        continue
      }

      const { data: { publicUrl } } = db.storage.from(BUCKET).getPublicUrl(storagePath)

      staged.push({
        public_url: publicUrl,
        storage_path: storagePath,
        file_size: buffer.length,
        mime_type: file.type,
      })
    }

    if (staged.length === 0) {
      return NextResponse.json({ error: 'Failed to upload any images' }, { status: 500 })
    }

    return NextResponse.json({ images: staged, count: staged.length })
  } catch (error) {
    console.error('[Chat Upload] Error:', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
