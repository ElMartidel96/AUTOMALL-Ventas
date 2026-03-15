'use client'

/**
 * AgentChatWidget — apeX AI Chat for AutoMALL
 *
 * Full chat widget (bottom-right FAB) with two modes:
 *   - chat (default): AI conversation with tool calling + image upload
 *   - settings: MCP URLs, Cursor deep link, connection status
 *
 * Image support uses the EXACT same pipeline as WhatsApp:
 *   Client compression → staging upload → GPT-4o Vision extraction → vehicle creation
 */

import React, { useState, useRef, useEffect, useCallback, type KeyboardEvent } from 'react'
import { useTranslations } from 'next-intl'
import {
  ChevronDown,
  Settings2,
  Loader2,
  Zap,
  Copy,
  Check,
  Send,
  Trash2,
  ArrowLeft,
  Search,
  Car,
  BarChart3,
  Sparkles,
  DollarSign,
  PlusCircle,
  Users,
  Link2,
  Calculator,
  ScanLine,
  Megaphone,
  MapPin,
  Paperclip,
  X,
  ImageIcon,
  FileText,
} from 'lucide-react'
import { useAccount } from '@/lib/thirdweb'
import { useApexChat } from '@/hooks/useApexChat'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import { compressImageSmart } from '@/lib/inventory/image-utils'

// ===================================================
// TYPES
// ===================================================

interface StagedFileInfo {
  public_url: string
  storage_path: string
  file_size: number
  mime_type: string
  preview_url: string // Local blob URL for image thumbnails, empty for documents
  file_name: string // Original file name for display
  is_document: boolean // true for PDF/TXT/CSV, false for images
}

// ===================================================
// WRAPPER — Guards auth
// ===================================================

export function AgentChatWidget() {
  const { address, isConnected } = useAccount()

  if (!isConnected || !address) {
    return null
  }

  return <ApexChatInner address={address} />
}

// ===================================================
// INNER — Chat + Settings
// ===================================================

type WidgetMode = 'chat' | 'settings'

type UserRole = 'buyer' | 'seller' | 'birddog' | 'admin'

function ApexChatInner({ address }: { address: string }) {
  const t = useTranslations('agent')
  const [isOpen, setIsOpen] = useState(false)
  const [showTooltip, setShowTooltip] = useState(true)
  const [mode, setMode] = useState<WidgetMode>('chat')
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [userRole, setUserRole] = useState<UserRole>('buyer')
  const panelRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // File upload state (images + documents)
  const [stagedFiles, setStagedFiles] = useState<StagedFileInfo[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    clearChat,
    appendMessage,
  } = useApexChat({ walletAddress: address })

  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://autosmall.org'
  const mcpUrl = `${appUrl}/api/mcp/gateway`

  // Fetch user role on mount
  useEffect(() => {
    fetch('/api/agent/chat', { headers: { 'x-wallet-address': address } })
      .then(r => r.json())
      .then(d => { if (d.role) setUserRole(d.role) })
      .catch(() => {})
  }, [address])

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus textarea when chat opens
  useEffect(() => {
    if (isOpen && mode === 'chat') {
      setTimeout(() => textareaRef.current?.focus(), 300)
    }
  }, [isOpen, mode])

  // Auto-hide tooltip
  useEffect(() => {
    const timer = setTimeout(() => setShowTooltip(false), 5000)
    return () => clearTimeout(timer)
  }, [])

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('[data-apex-bubble]')) return
      if (panelRef.current && !panelRef.current.contains(target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      stagedFiles.forEach(f => { if (f.preview_url) URL.revokeObjectURL(f.preview_url) })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const copyUrl = () => {
    navigator.clipboard.writeText(mcpUrl)
    setCopiedUrl(true)
    setTimeout(() => setCopiedUrl(false), 2000)
  }

  const cursorConfig = btoa(JSON.stringify({ url: mcpUrl }))
  const cursorDeepLink = `cursor://anysphere.cursor-deeplink/mcp/install?name=AutoMALL&config=${cursorConfig}`

  // ===================================================
  // FILE UPLOAD — Images (compressed) + Documents (raw)
  // ===================================================

  const DOC_MIME_TYPES = ['application/pdf', 'text/plain', 'text/csv']

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    // Reset file input so same files can be selected again
    if (fileInputRef.current) fileInputRef.current.value = ''

    const remaining = 10 - stagedFiles.length
    if (remaining <= 0) {
      setUploadError(t('chat.maxImages'))
      return
    }

    const filesToProcess = files.slice(0, remaining)
    setIsUploading(true)
    setUploadError(null)

    try {
      // Separate images (need compression) from documents (upload raw)
      const imageFiles = filesToProcess.filter(f => !DOC_MIME_TYPES.includes(f.type))
      const docFiles = filesToProcess.filter(f => DOC_MIME_TYPES.includes(f.type))

      // Phase 1: Compress images (same compressImageSmart as WhatsApp)
      const prepared: { blob: Blob; preview: string; name: string; isDoc: boolean }[] = []

      for (const file of imageFiles) {
        const { blob } = await compressImageSmart(file)
        const preview = URL.createObjectURL(blob)
        prepared.push({ blob, preview, name: file.name, isDoc: false })
      }

      // Documents: no compression, no preview thumbnail
      for (const file of docFiles) {
        prepared.push({ blob: file, preview: '', name: file.name, isDoc: true })
      }

      // Phase 2: Upload in chunks of 3 to stay under Vercel's 4.5MB body limit.
      // Each compressed image is ~1-1.5MB, so 3 per batch = ~3-4.5MB (safe).
      const CHUNK_SIZE = 3
      const allStaged: StagedFileInfo[] = []
      let preparedIdx = 0

      for (let c = 0; c < prepared.length; c += CHUNK_SIZE) {
        const chunk = prepared.slice(c, c + CHUNK_SIZE)
        const formData = new FormData()
        for (const { blob, name, isDoc } of chunk) {
          formData.append(isDoc ? 'files' : 'images', blob, name)
        }

        const res = await fetch('/api/agent/chat/upload', {
          method: 'POST',
          headers: { 'x-wallet-address': address },
          body: formData,
        })

        if (!res.ok) {
          const errData = await res.json().catch(() => ({ error: 'Upload failed' }))
          throw new Error(errData.error || `Upload failed (batch ${Math.floor(c / CHUNK_SIZE) + 1})`)
        }

        const data = await res.json()

        for (let i = 0; i < data.images.length; i++) {
          const item = data.images[i]
          const isDoc = DOC_MIME_TYPES.includes(item.mime_type)
          allStaged.push({
            ...item,
            preview_url: isDoc ? '' : (prepared[preparedIdx]?.preview || item.public_url),
            file_name: prepared[preparedIdx]?.name || 'file',
            is_document: isDoc,
          })
          preparedIdx++
        }
      }

      setStagedFiles(prev => [...prev, ...allStaged])
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }, [address, stagedFiles.length, t])

  const removeFile = useCallback((index: number) => {
    setStagedFiles(prev => {
      const removed = prev[index]
      if (removed?.preview_url) URL.revokeObjectURL(removed.preview_url)
      return prev.filter((_, i) => i !== index)
    })
  }, [])

  const clearFiles = useCallback(() => {
    stagedFiles.forEach(f => { if (f.preview_url) URL.revokeObjectURL(f.preview_url) })
    setStagedFiles([])
    setUploadError(null)
  }, [stagedFiles])

  // ===================================================
  // MESSAGE SUBMISSION — Includes file URLs when present
  // ===================================================

  const handleSendWithFiles = useCallback((e?: React.FormEvent) => {
    e?.preventDefault?.()

    if (stagedFiles.length > 0) {
      // Build message with file URLs for AI to detect and process
      const fileUrls = stagedFiles.map(f => f.public_url)
      const urlList = fileUrls.join('\n')

      const numFiles = stagedFiles.length
      const hasImages = stagedFiles.some(f => !f.is_document)
      const hasDocs = stagedFiles.some(f => f.is_document)
      const label = hasImages && hasDocs
        ? `${numFiles} archivo${numFiles > 1 ? 's' : ''}`
        : hasDocs
          ? `${numFiles} documento${numFiles > 1 ? 's' : ''}`
          : `${numFiles} ${numFiles === 1 ? 'imagen' : 'imágenes'}`

      const userText = input.trim()
      const fileMsg = userText
        ? `${userText}\n\n[${label}]\n${urlList}`
        : `[${label}]\n${urlList}`

      // Clear files after sending
      stagedFiles.forEach(f => { if (f.preview_url) URL.revokeObjectURL(f.preview_url) })
      setStagedFiles([])
      appendMessage(fileMsg)
    } else {
      handleSubmit(e as any)
    }
  }, [input, stagedFiles, handleSubmit, appendMessage])

  // Handle Enter to send, Shift+Enter for newline
  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if ((input.trim() || stagedFiles.length > 0) && !isLoading) {
        handleSendWithFiles()
      }
    }
  }, [input, isLoading, stagedFiles.length, handleSendWithFiles])

  // Quick suggestion — pre-fills the textarea with editable prompt text
  const prefillSuggestion = (promptText: string) => {
    // Set the input value and trigger resize
    const fakeEvent = { target: { value: promptText } } as React.ChangeEvent<HTMLTextAreaElement>
    handleInputChange(fakeEvent)
    // Focus the textarea
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.value = promptText
        textareaRef.current.style.height = 'auto'
        textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px'
        textareaRef.current.focus()
      }
    }, 50)
  }

  // Auto-resize textarea
  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    handleInputChange(e)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }, [handleInputChange])

  const getSuggestions = (role: UserRole) => {
    if (role === 'seller' || role === 'admin') {
      return [
        { key: 'suggestInventory', promptKey: 'promptInventory', icon: Car, color: 'text-am-orange' },
        { key: 'suggestLeads', promptKey: 'promptLeads', icon: Users, color: 'text-sky-500' },
        { key: 'suggestDashboard', promptKey: 'promptDashboard', icon: BarChart3, color: 'text-purple-500' },
        { key: 'suggestPayments', promptKey: 'promptPayments', icon: DollarSign, color: 'text-am-green' },
        { key: 'suggestAddVehicle', promptKey: 'promptAddVehicle', icon: PlusCircle, color: 'text-am-orange' },
        { key: 'suggestCreateDeal', promptKey: 'promptCreateDeal', icon: DollarSign, color: 'text-emerald-500' },
        { key: 'suggestCampaigns', promptKey: 'promptCampaigns', icon: Megaphone, color: 'text-pink-500' },
        { key: 'suggestReferralCode', promptKey: 'promptReferralCode', icon: Link2, color: 'text-am-blue' },
      ]
    }
    if (role === 'birddog') {
      return [
        { key: 'suggestReferralCode', promptKey: 'promptReferralCode', icon: Link2, color: 'text-am-blue' },
        { key: 'suggestDashboard', promptKey: 'promptDashboard', icon: BarChart3, color: 'text-purple-500' },
        { key: 'suggestSearch', promptKey: undefined, icon: Search, color: 'text-am-blue' },
        { key: 'suggestNearbyDealers', promptKey: undefined, icon: MapPin, color: 'text-am-green' },
        { key: 'suggestCalculator', promptKey: undefined, icon: Calculator, color: 'text-amber-500' },
        { key: 'suggestVIN', promptKey: undefined, icon: ScanLine, color: 'text-gray-500' },
      ]
    }
    // buyer
    return [
      { key: 'suggestSearch', promptKey: undefined, icon: Search, color: 'text-am-blue' },
      { key: 'suggestNearbyDealers', promptKey: undefined, icon: MapPin, color: 'text-am-green' },
      { key: 'suggestFeatured', promptKey: undefined, icon: Sparkles, color: 'text-am-orange' },
      { key: 'suggestCalculator', promptKey: undefined, icon: Calculator, color: 'text-amber-500' },
      { key: 'suggestCompare', promptKey: undefined, icon: Car, color: 'text-purple-500' },
      { key: 'suggestVIN', promptKey: undefined, icon: ScanLine, color: 'text-gray-500' },
    ]
  }

  // Check if role supports file upload (only sellers/admin)
  const canUploadFiles = userRole === 'seller' || userRole === 'admin'

  return (
    <div className="fixed bottom-6 right-6" style={{ zIndex: 10001 }}>

      {/* Panel */}
      {isOpen && (
        <div
          ref={panelRef}
          className="absolute bottom-20 right-0 w-80 sm:w-[420px] rounded-2xl shadow-2xl overflow-hidden border border-gray-200/50 dark:border-gray-700/50 bg-white dark:bg-gray-900 animate-in slide-in-from-bottom-4 duration-300 flex flex-col"
          style={{ maxHeight: 'calc(100dvh - 200px)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-am-blue to-am-blue-light text-white shrink-0">
            <div className="flex items-center gap-2.5">
              {mode === 'settings' && (
                <button
                  onClick={() => setMode('chat')}
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white/30 shadow-md shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/apeX-bubble-flip.png" alt="apeX" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="font-bold text-sm leading-tight">apeX</p>
                <p className="text-[11px] text-white/70">
                  {mode === 'settings' ? t('chat.connectAI') : t('chat.subtitle')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {mode === 'chat' && messages.length > 0 && (
                <button
                  onClick={clearChat}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                  title={t('chat.clearChat')}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              {mode === 'chat' && (
                <button
                  onClick={() => setMode('settings')}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                  title={t('chat.settings')}
                >
                  <Settings2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ─── CHAT MODE ─── */}
          {mode === 'chat' && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]">
                {/* Welcome */}
                {messages.length === 0 && (
                  <div className="text-center py-6">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-am-blue/20 shadow-md mx-auto mb-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/apeX-bubble-flip.png" alt="apeX" className="w-full h-full object-cover" />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 max-w-[280px] mx-auto">
                      {t('chat.welcomeMessage')}
                    </p>

                    {/* Quick suggestions — role-based */}
                    <div className="grid grid-cols-2 gap-1.5">
                      {getSuggestions(userRole).map(({ key, promptKey, icon: Icon, color }) => (
                        <button
                          key={key}
                          onClick={() => prefillSuggestion(t(`chat.${promptKey || key}`))}
                          className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-300 hover:bg-am-blue/10 dark:hover:bg-am-blue/20 transition-colors text-left"
                        >
                          <Icon className={`w-3.5 h-3.5 ${color} shrink-0`} />
                          <span className="line-clamp-2">{t(`chat.${key}`)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Message bubbles */}
                {messages.map((msg) => {
                  const text = msg.parts
                    ?.filter((p: any) => p.type === 'text')
                    .map((p: any) => p.text)
                    .join('') || ''
                  if (!text && msg.role === 'assistant') return null

                  // Extract image URLs from user messages for thumbnail display
                  const imageUrlsInMsg = msg.role === 'user'
                    ? (text.match(/https:\/\/[^\s]+\/vehicle-images\/[^\s]+/g) || [])
                    : []
                  // Text without image URLs for cleaner display
                  const displayText = msg.role === 'user'
                    ? text.replace(/https:\/\/[^\s]+\/vehicle-images\/[^\s]+/g, '').replace(/\n{2,}/g, '\n').trim()
                    : text

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-am-blue text-white rounded-br-md'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md'
                        }`}
                      >
                        {/* Image thumbnails in user messages */}
                        {imageUrlsInMsg.length > 0 && (
                          <div className="flex gap-1 mb-2 flex-wrap">
                            {imageUrlsInMsg.map((url: string, i: number) => (
                              <div key={i} className="w-12 h-12 rounded-lg overflow-hidden bg-white/20 shrink-0">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                              </div>
                            ))}
                          </div>
                        )}
                        {msg.role === 'assistant' ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:m-0 [&>ul]:my-1 [&>ol]:my-1 [&>p+p]:mt-2">
                            <ReactMarkdown>{displayText}</ReactMarkdown>
                          </div>
                        ) : (
                          <span>{displayText || `${imageUrlsInMsg.length} imagen(es)`}</span>
                        )}
                      </div>
                    </div>
                  )
                })}

                {/* Streaming indicator */}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 dark:bg-gray-800 px-3.5 py-2.5 rounded-2xl rounded-bl-md flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-am-blue" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">{t('chat.thinking')}</span>
                    </div>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="flex justify-center">
                    <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-3 py-2 rounded-xl text-xs text-center">
                      {error.message?.includes('429')
                        ? t('chat.errorRateLimit')
                        : t('chat.errorGeneric')}
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input area */}
              <div className="shrink-0 border-t border-gray-200/50 dark:border-gray-700/50 p-3">
                {/* File thumbnails strip */}
                {stagedFiles.length > 0 && (
                  <div className="flex items-center gap-1.5 mb-2 overflow-x-auto pb-1">
                    {stagedFiles.map((file, i) => (
                      <div key={i} className="relative shrink-0 w-14 h-14 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 group">
                        {file.is_document ? (
                          <div className="w-full h-full bg-red-50 dark:bg-red-900/30 flex flex-col items-center justify-center">
                            <FileText className="w-5 h-5 text-red-500" />
                            <span className="text-[8px] text-red-600 dark:text-red-400 font-bold mt-0.5 uppercase">
                              {file.mime_type.includes('pdf') ? 'PDF' : file.mime_type.includes('csv') ? 'CSV' : 'TXT'}
                            </span>
                          </div>
                        ) : (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={file.preview_url} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
                        )}
                        <button
                          onClick={() => removeFile(i)}
                          className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}
                    {stagedFiles.length > 1 && (
                      <button
                        onClick={clearFiles}
                        className="shrink-0 text-[10px] text-red-500 hover:text-red-700 px-1"
                      >
                        {t('chat.clearAll')}
                      </button>
                    )}
                  </div>
                )}

                {/* Upload error */}
                {uploadError && (
                  <p className="text-[11px] text-red-500 mb-1.5">{uploadError}</p>
                )}

                {/* Uploading indicator */}
                {isUploading && (
                  <div className="flex items-center gap-1.5 mb-2 text-xs text-gray-500">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>{t('chat.uploading')}</span>
                  </div>
                )}

                <form onSubmit={handleSendWithFiles} className="flex items-end gap-2">
                  {/* Hidden file input — accepts images + documents */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/heic,application/pdf,text/plain,text/csv,.pdf,.txt,.csv"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {/* File upload button — only for sellers/admin */}
                  {canUploadFiles && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading || isLoading || stagedFiles.length >= 10}
                      className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-am-blue hover:border-am-blue/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      title={t('chat.attachImages')}
                    >
                      {stagedFiles.length > 0 ? (
                        <div className="relative">
                          {stagedFiles.some(f => f.is_document) ? <FileText className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-am-blue text-white text-[8px] font-bold flex items-center justify-center">
                            {stagedFiles.length}
                          </span>
                        </div>
                      ) : (
                        <Paperclip className="w-4 h-4" />
                      )}
                    </button>
                  )}

                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={handleTextareaChange}
                    onKeyDown={handleKeyDown}
                    placeholder={stagedFiles.length > 0 ? t('chat.placeholderWithImages') : t('chat.placeholder')}
                    rows={1}
                    className="flex-1 resize-none bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-am-blue/30 focus:border-am-blue/50 transition-colors"
                    style={{ maxHeight: '120px' }}
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={(!input.trim() && stagedFiles.length === 0) || isLoading || isUploading}
                    className="shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-am-blue text-white hover:bg-am-blue-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center mt-1.5">
                  {t('chat.poweredBy')}
                </p>
              </div>
            </>
          )}

          {/* ─── SETTINGS MODE ─── */}
          {mode === 'settings' && (
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* MCP URL */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">
                  {t('widget.serverUrl')}
                </p>
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono flex-1 truncate text-am-blue">
                    {mcpUrl}
                  </code>
                  <button
                    onClick={copyUrl}
                    className="shrink-0 p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
                  >
                    {copiedUrl ? <Check className="w-3.5 h-3.5 text-am-green" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
                  </button>
                </div>
              </div>

              {/* Quick action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => window.open(cursorDeepLink, '_self')}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-purple-400 text-white text-xs font-bold hover:shadow-lg transition-all"
                >
                  <Zap className="w-3.5 h-3.5" />
                  Cursor
                </button>
                <Link
                  href="/profile?tab=agent"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-gradient-to-r from-am-orange to-am-orange-light text-white text-xs font-bold hover:shadow-lg transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {t('widget.allPlatforms')}
                </Link>
              </div>

              {/* What AI can do */}
              <div>
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  {t('hub.capabilities')}
                </p>
                <div className="space-y-1.5">
                  {['hub.capSearch', 'hub.capInventory', 'hub.capReferrals', 'hub.capProfile'].map(key => (
                    <div key={key} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-am-blue shrink-0" />
                      {t(key)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tooltip */}
      {showTooltip && !isOpen && (
        <div className="absolute bottom-[72px] right-0 animate-in fade-in slide-in-from-right-2 duration-300 pointer-events-none">
          <div className="glass-panel px-4 py-2 rounded-xl shadow-lg border border-white/20 dark:border-gray-700/50 whitespace-nowrap">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {t('chat.tooltip')}
            </span>
          </div>
          <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-white/80 dark:bg-gray-800/80 rotate-45 border-r border-b border-white/20 dark:border-gray-700/50" />
        </div>
      )}

      {/* FAB — apeX Bubble */}
      <button
        data-apex-bubble
        onClick={() => {
          setIsOpen(!isOpen)
          setShowTooltip(false)
        }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => {
          if (!isOpen) setTimeout(() => setShowTooltip(false), 2000)
        }}
        className={`relative w-14 h-14 rounded-full overflow-hidden transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-110 active:scale-105 ${
          isOpen ? 'ring-2 ring-am-blue/50 ring-offset-2 ring-offset-transparent' : ''
        }`}
        aria-label={t('chat.open')}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/apeX-bubble.png" alt="apeX Assistant" className="w-full h-full object-cover" />

        {isOpen && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <ChevronDown className="w-5 h-5 text-white drop-shadow-lg" />
          </div>
        )}

        {!isOpen && (
          <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white dark:border-gray-900 bg-green-500" />
        )}
      </button>
    </div>
  )
}
