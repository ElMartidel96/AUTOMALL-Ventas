'use client'

/**
 * AgentChatWidget — apeX Floating Chat Widget for AutoMALL
 *
 * Bottom-right FAB with apeX avatar that expands into a chat panel.
 * Uses the AutoMALL agent backend (/api/agent/chat) via Vercel AI SDK v5.
 *
 * Architecture:
 *   Wrapper → Inner pattern ensures useChat hook only initializes
 *   when wallet address is guaranteed (prevents 401 from missing headers).
 *
 * UX Flow:
 *   1. User opens widget → checks if they have API keys (/api/agent/keys)
 *   2. No keys → shows welcome + "Connect your AI" CTA (no input field)
 *   3. Has keys → shows full chat with input field
 */

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { useChat } from '@ai-sdk/react'
import { TextStreamChatTransport } from 'ai'
import { Send, User, Trash2, ChevronDown, Settings2, Loader2, Zap } from 'lucide-react'
import { useAccount } from '@/lib/thirdweb'
import Link from 'next/link'

// ===================================================
// WRAPPER — Guards address availability before hooks
// ===================================================

export function AgentChatWidget() {
  const { address, isConnected } = useAccount()

  // Only mount the inner component when address is guaranteed
  if (!isConnected || !address) {
    return null
  }

  return <AgentChatWidgetInner address={address} />
}

// ===================================================
// INNER — All hooks called with guaranteed address
// ===================================================

function AgentChatWidgetInner({ address }: { address: string }) {
  const t = useTranslations('agent')
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [showTooltip, setShowTooltip] = useState(true)
  // null = loading check, false = no API keys, true = has active keys
  const [aiConnected, setAiConnected] = useState<boolean | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const chatRef = useRef<HTMLDivElement>(null)

  // useChat with BOTH header and body for robustness
  const { messages, sendMessage, status, error, setMessages } = useChat({
    transport: new TextStreamChatTransport({
      api: '/api/agent/chat',
      headers: { 'x-wallet-address': address },
      body: { walletAddress: address },
    }),
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  // Check if user has API keys every time widget opens
  useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    fetch('/api/agent/keys', {
      headers: { 'x-wallet-address': address },
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (cancelled) return
        const activeKeys = data?.keys?.filter((k: any) => k.is_active) ?? []
        setAiConnected(activeKeys.length > 0)
      })
      .catch(() => {
        if (!cancelled) setAiConnected(false)
      })
    return () => { cancelled = true }
  }, [address, isOpen])

  // Auto-hide tooltip after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowTooltip(false), 5000)
    return () => clearTimeout(timer)
  }, [])

  // Auto-scroll on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  // Focus input when chat opens (only if connected)
  useEffect(() => {
    if (isOpen && aiConnected && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen, aiConnected])

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('[data-apex-bubble]')) return
      if (chatRef.current && !chatRef.current.contains(target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const handleSend = useCallback(() => {
    const text = inputValue.trim()
    if (!text || isLoading) return
    setInputValue('')
    sendMessage({ text })
  }, [inputValue, isLoading, sendMessage])

  const handleClear = useCallback(() => {
    setMessages([])
  }, [setMessages])

  return (
    <div className="fixed bottom-6 right-6 z-50" style={{ zIndex: 9999 }}>

      {/* Chat Panel */}
      {isOpen && (
        <div
          ref={chatRef}
          className="absolute bottom-20 right-0 w-80 sm:w-96 rounded-2xl shadow-2xl overflow-hidden border border-gray-200/50 dark:border-gray-700/50 bg-white dark:bg-gray-900 animate-in slide-in-from-bottom-4 duration-300"
          style={{ maxHeight: '520px' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-am-blue to-am-blue-light text-white">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white/30 shadow-md shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/apeX11.png" alt="apeX" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="font-bold text-sm leading-tight">apeX</p>
                <div className="flex items-center gap-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${aiConnected ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`} />
                  <p className="text-[11px] text-white/70">{t('chat.subtitle')}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Link
                href="/profile?tab=agent"
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                title={t('chat.connectAI')}
              >
                <Settings2 className="w-4 h-4" />
              </Link>
              {aiConnected && (
                <button
                  onClick={handleClear}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                  title={t('chat.clear')}
                >
                  <Trash2 className="w-4 h-4" />
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

          {/* ─── STATE: Loading check ─── */}
          {aiConnected === null && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-am-blue" />
            </div>
          )}

          {/* ─── STATE: Not connected — CTA only, no input ─── */}
          {aiConnected === false && (
            <div className="p-6 text-center">
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-am-blue/20 shadow-md mx-auto mb-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/apeX11.png" alt="apeX" className="w-full h-full object-cover" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 max-w-[260px] mx-auto mb-6">
                {t('chat.welcomeSetup')}
              </p>
              <Link
                href="/profile?tab=agent"
                onClick={() => setIsOpen(false)}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-am-orange to-am-orange-light text-white font-bold text-sm hover:shadow-lg transition-all"
              >
                <Zap className="w-4 h-4" />
                {t('chat.connectBanner')}
              </Link>
            </div>
          )}

          {/* ─── STATE: Connected — full chat ─── */}
          {aiConnected === true && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: '380px' }}>
                {/* Welcome state (no messages yet) */}
                {messages.length === 0 && (
                  <div className="text-center py-6">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-am-blue/20 shadow-md mx-auto mb-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/apeX11.png" alt="apeX" className="w-full h-full object-cover" />
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-[260px] mx-auto">
                      {t('chat.welcome')}
                    </p>
                  </div>
                )}

                {/* Message list */}
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-7 h-7 rounded-full overflow-hidden border border-am-blue/30 shrink-0 mt-0.5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/apeX11.png" alt="apeX" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-am-blue to-am-blue-light text-white rounded-br-md'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">
                        {msg.parts?.filter(p => p.type === 'text').map((part, i) => (
                          <span key={i}>{part.type === 'text' ? part.text : ''}</span>
                        ))}
                      </p>
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-7 h-7 rounded-full bg-am-orange flex items-center justify-center shrink-0 mt-0.5">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                ))}

                {/* Streaming indicator */}
                {isLoading && (
                  <div className="flex gap-2 items-center">
                    <div className="w-7 h-7 rounded-full overflow-hidden border border-am-blue/30 shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/apeX11.png" alt="apeX" className="w-full h-full object-cover" />
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-md px-4 py-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-am-blue animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 rounded-full bg-am-blue animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 rounded-full bg-am-blue animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="text-center py-2">
                    <p className="text-xs text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-lg inline-block">
                      {t('chat.error')}
                    </p>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="px-3 py-3 border-t border-gray-200/50 dark:border-gray-700/50 bg-white dark:bg-gray-900">
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    placeholder={t('chat.placeholder')}
                    className="flex-1 px-3 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm border border-gray-200 dark:border-gray-700 focus:border-am-blue focus:outline-none transition-colors"
                    disabled={isLoading}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!inputValue.trim() || isLoading}
                    className="p-2.5 rounded-xl bg-gradient-to-r from-am-orange to-am-orange-light text-white hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
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
          <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
        )}

        {messages.length > 0 && !isOpen && (
          <div className="absolute inset-0 rounded-full border-2 border-am-blue/50 animate-ping pointer-events-none" />
        )}
      </button>
    </div>
  )
}
