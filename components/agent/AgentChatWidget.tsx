'use client'

/**
 * AgentConnectionHub — apeX Floating Connection Widget for AutoMALL
 *
 * Bottom-right FAB with apeX avatar that expands into a connection panel.
 * This is NOT a chatbot — the platform uses a "connect-your-own-AI" model.
 * Users connect their preferred AI (Claude, ChatGPT, Gemini, Cursor) via
 * OAuth 2.1 on the MCP Gateway. Zero API key management needed.
 *
 * States:
 *   1. Not connected (no active sessions) → Welcome + one-click setup CTA
 *   2. Connected (has active sessions) → Status dashboard + quick actions
 *   3. Loading → Spinner while checking status
 */

import React, { useState, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { ChevronDown, Settings2, Loader2, Zap, CheckCircle2, Sparkles, Copy, Check } from 'lucide-react'
import { useAccount } from '@/lib/thirdweb'
import Link from 'next/link'

// ===================================================
// WRAPPER — Guards address availability
// ===================================================

export function AgentChatWidget() {
  const { address, isConnected } = useAccount()

  if (!isConnected || !address) {
    return null
  }

  return <AgentConnectionHubInner address={address} />
}

// ===================================================
// INNER — Connection Hub (NOT a chat)
// ===================================================

function AgentConnectionHubInner({ address }: { address: string }) {
  const t = useTranslations('agent')
  const [isOpen, setIsOpen] = useState(false)
  const [showTooltip, setShowTooltip] = useState(true)
  // null = loading, false = no connections, true = has connections (OAuth or API keys)
  const [aiConnected, setAiConnected] = useState<boolean | null>(null)
  const [connectionCount, setConnectionCount] = useState(0)
  const [copiedUrl, setCopiedUrl] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://autosmall.org'
  const mcpUrl = `${appUrl}/api/mcp/gateway`

  // Check connection status (OAuth + API keys) when widget opens
  useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    fetch('/api/agent/connections', {
      headers: { 'x-wallet-address': address },
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (cancelled) return
        setAiConnected(data?.connected ?? false)
        setConnectionCount(data?.total ?? 0)
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

  // Cursor deep link
  const cursorConfig = btoa(JSON.stringify({ url: mcpUrl }))
  const cursorDeepLink = `cursor://anysphere.cursor-deeplink/mcp/install?name=AutoMALL&config=${cursorConfig}`

  return (
    <div className="fixed bottom-6 right-6 z-50" style={{ zIndex: 9999 }}>

      {/* Connection Panel */}
      {isOpen && (
        <div
          ref={panelRef}
          className="absolute bottom-20 right-0 w-80 sm:w-96 rounded-2xl shadow-2xl overflow-hidden border border-gray-200/50 dark:border-gray-700/50 bg-white dark:bg-gray-900 animate-in slide-in-from-bottom-4 duration-300"
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
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ─── STATE: Loading ─── */}
          {aiConnected === null && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-am-blue" />
            </div>
          )}

          {/* ─── STATE: Not connected — Quick Setup ─── */}
          {aiConnected === false && (
            <div className="p-5 space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-am-blue/20 shadow-md mx-auto mb-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/apeX11.png" alt="apeX" className="w-full h-full object-cover" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 max-w-[260px] mx-auto">
                  {t('chat.welcomeSetup')}
                </p>
              </div>

              {/* Quick copy URL */}
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
            </div>
          )}

          {/* ─── STATE: Connected — Status Dashboard ─── */}
          {aiConnected === true && (
            <div className="p-5 space-y-4">
              {/* Connection status */}
              <div className="flex items-center gap-3 p-3 bg-am-green/10 rounded-xl border border-am-green/20">
                <CheckCircle2 className="w-5 h-5 text-am-green shrink-0" />
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{t('hub.connected')}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('hub.keysActive', { count: connectionCount })}
                  </p>
                </div>
              </div>

              {/* What your AI can do */}
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

              {/* How to use */}
              <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {t('hub.howToUse')}
                </p>
              </div>

              {/* Quick actions */}
              <div className="flex gap-2">
                <Link
                  href="/profile?tab=agent"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  {t('hub.manageKeys')}
                </Link>
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
          <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white dark:border-gray-900 ${
            aiConnected ? 'bg-green-500' : 'bg-yellow-500'
          }`} />
        )}
      </button>
    </div>
  )
}
