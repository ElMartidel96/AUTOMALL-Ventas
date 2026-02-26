'use client'

/**
 * AgentConnectionHub — apeX Floating Connection Widget for AutoMALL
 *
 * Bottom-right FAB with apeX avatar that expands into a connection panel.
 * This is NOT a chatbot — the platform uses a "connect-your-own-AI" model.
 * Users connect their preferred AI (Claude, ChatGPT, Gemini) via MCP Gateway.
 *
 * States:
 *   1. Not connected (no API keys) → Welcome + setup CTA
 *   2. Connected (has API keys) → Status dashboard + quick actions
 *   3. Loading → Spinner while checking keys
 */

import React, { useState, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { ChevronDown, Settings2, Loader2, Zap, CheckCircle2, Key, ExternalLink } from 'lucide-react'
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
  // null = loading, false = no keys, true = has keys
  const [aiConnected, setAiConnected] = useState<boolean | null>(null)
  const [keyCount, setKeyCount] = useState(0)
  const panelRef = useRef<HTMLDivElement>(null)

  // Check API keys every time widget opens
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
        setKeyCount(activeKeys.length)
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

          {/* ─── STATE: Not connected — Setup CTA ─── */}
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

          {/* ─── STATE: Connected — Status Dashboard ─── */}
          {aiConnected === true && (
            <div className="p-5 space-y-4">
              {/* Connection status */}
              <div className="flex items-center gap-3 p-3 bg-am-green/10 rounded-xl border border-am-green/20">
                <CheckCircle2 className="w-5 h-5 text-am-green shrink-0" />
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{t('hub.connected')}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('hub.keysActive', { count: keyCount })}
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
                  <p className="text-xs text-gray-400 dark:text-gray-500 pl-3.5">
                    {t('hub.andMore')}
                  </p>
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
                  <Key className="w-3.5 h-3.5" />
                  {t('hub.manageKeys')}
                </Link>
                <Link
                  href="/profile?tab=agent"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-gradient-to-r from-am-blue to-am-blue-light text-sm font-semibold text-white hover:shadow-lg transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  {t('hub.guides')}
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
