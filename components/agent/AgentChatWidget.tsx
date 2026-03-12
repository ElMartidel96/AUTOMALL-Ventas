'use client'

/**
 * AgentChatWidget — apeX AI Chat for AutoMALL
 *
 * Full chat widget (bottom-right FAB) with two modes:
 *   - chat (default): AI conversation with tool calling
 *   - settings: MCP URLs, Cursor deep link, connection status
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
  UserCircle,
  Sparkles,
} from 'lucide-react'
import { useAccount } from '@/lib/thirdweb'
import { useApexChat } from '@/hooks/useApexChat'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'

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

function ApexChatInner({ address }: { address: string }) {
  const t = useTranslations('agent')
  const [isOpen, setIsOpen] = useState(false)
  const [showTooltip, setShowTooltip] = useState(true)
  const [mode, setMode] = useState<WidgetMode>('chat')
  const [copiedUrl, setCopiedUrl] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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

  const copyUrl = () => {
    navigator.clipboard.writeText(mcpUrl)
    setCopiedUrl(true)
    setTimeout(() => setCopiedUrl(false), 2000)
  }

  const cursorConfig = btoa(JSON.stringify({ url: mcpUrl }))
  const cursorDeepLink = `cursor://anysphere.cursor-deeplink/mcp/install?name=AutoMALL&config=${cursorConfig}`

  // Handle Enter to send, Shift+Enter for newline
  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (input.trim() && !isLoading) {
        handleSubmit(e as any)
      }
    }
  }, [input, isLoading, handleSubmit])

  // Quick suggestion
  const sendSuggestion = (text: string) => {
    appendMessage(text)
  }

  // Auto-resize textarea
  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    handleInputChange(e)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }, [handleInputChange])

  return (
    <div className="fixed bottom-6 right-6 z-50" style={{ zIndex: 9999 }}>

      {/* Panel */}
      {isOpen && (
        <div
          ref={panelRef}
          className="absolute bottom-20 right-0 w-80 sm:w-[420px] rounded-2xl shadow-2xl overflow-hidden border border-gray-200/50 dark:border-gray-700/50 bg-white dark:bg-gray-900 animate-in slide-in-from-bottom-4 duration-300 flex flex-col"
          style={{ maxHeight: 'min(600px, 80vh)' }}
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
                <img src="/apeX11.png" alt="apeX" className="w-full h-full object-cover" />
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
                      <img src="/apeX11.png" alt="apeX" className="w-full h-full object-cover" />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 max-w-[280px] mx-auto">
                      {t('chat.welcomeMessage')}
                    </p>

                    {/* Quick suggestions */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => sendSuggestion(t('chat.suggestSearch'))}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-300 hover:bg-am-blue/10 dark:hover:bg-am-blue/20 transition-colors text-left"
                      >
                        <Search className="w-3.5 h-3.5 text-am-blue shrink-0" />
                        <span className="line-clamp-2">{t('chat.suggestSearch')}</span>
                      </button>
                      <button
                        onClick={() => sendSuggestion(t('chat.suggestInventory'))}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-300 hover:bg-am-blue/10 dark:hover:bg-am-blue/20 transition-colors text-left"
                      >
                        <Car className="w-3.5 h-3.5 text-am-orange shrink-0" />
                        <span className="line-clamp-2">{t('chat.suggestInventory')}</span>
                      </button>
                      <button
                        onClick={() => sendSuggestion(t('chat.suggestDeals'))}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-300 hover:bg-am-blue/10 dark:hover:bg-am-blue/20 transition-colors text-left"
                      >
                        <BarChart3 className="w-3.5 h-3.5 text-am-green shrink-0" />
                        <span className="line-clamp-2">{t('chat.suggestDeals')}</span>
                      </button>
                      <button
                        onClick={() => sendSuggestion(t('chat.suggestStats'))}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-300 hover:bg-am-blue/10 dark:hover:bg-am-blue/20 transition-colors text-left"
                      >
                        <UserCircle className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                        <span className="line-clamp-2">{t('chat.suggestStats')}</span>
                      </button>
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
                        {msg.role === 'assistant' ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:m-0 [&>ul]:my-1 [&>ol]:my-1 [&>p+p]:mt-2">
                            <ReactMarkdown>{text}</ReactMarkdown>
                          </div>
                        ) : (
                          <span>{text}</span>
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
                <form onSubmit={handleSubmit} className="flex items-end gap-2">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={handleTextareaChange}
                    onKeyDown={handleKeyDown}
                    placeholder={t('chat.placeholder')}
                    rows={1}
                    className="flex-1 resize-none bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-am-blue/30 focus:border-am-blue/50 transition-colors"
                    style={{ maxHeight: '120px' }}
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
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
        <img src="/apeX22.PNG" alt="apeX Assistant" className="w-full h-full object-cover" />

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
