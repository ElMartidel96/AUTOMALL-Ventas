'use client'

/**
 * AgentConnectorPanel — One-Click AI Connection
 *
 * Profile tab that lets users connect their AI with minimal friction:
 *   - Cursor: TRUE one-click via cursor:// deep link
 *   - Claude Desktop: Copy URL → paste in Settings > Connectors → auto OAuth
 *   - ChatGPT: Copy URL → paste in Settings > Connectors → auto OAuth
 *   - Advanced: Manual API keys (collapsed by default)
 *
 * OAuth 2.1 eliminates the need for manual API key + JSON config copying.
 * When the AI connects, it auto-discovers OAuth and opens a login popup.
 */

import React, { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import {
  Bot, Copy, Check, ChevronDown, ChevronRight,
  Zap, Shield, ExternalLink, Key, Plus, Trash2, Activity,
  Globe, Sparkles, Link2,
} from 'lucide-react'
import type { AgentApiKey } from '@/lib/agent/types/connector-types'

interface Props {
  walletAddress: string
}

export function AgentConnectorPanel({ walletAddress }: Props) {
  const t = useTranslations('agent')
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [connectedCount, setConnectedCount] = useState(0)

  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://autosmall.org'
  const mcpUrl = `${appUrl}/api/mcp/gateway`

  // Check active OAuth connections
  useEffect(() => {
    fetch('/api/agent/keys', {
      headers: { 'x-wallet-address': walletAddress },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const active = data?.keys?.filter((k: any) => k.is_active)?.length ?? 0
        setConnectedCount(active)
      })
      .catch(() => {})
  }, [walletAddress])

  const copy = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  // Cursor deep link: cursor://anysphere.cursor-deeplink/mcp/install?name=NAME&config=BASE64
  const cursorConfig = btoa(JSON.stringify({ url: mcpUrl }))
  const cursorDeepLink = `cursor://anysphere.cursor-deeplink/mcp/install?name=AutoMALL&config=${cursorConfig}`

  return (
    <div className="space-y-6">

      {/* ─── Header ─── */}
      <div className="glass-crystal-enhanced rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-am-green to-emerald-500 flex items-center justify-center shadow-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {t('connector.title')}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('connector.subtitle')}
            </p>
          </div>
        </div>
        <div className="p-3 bg-am-green/10 dark:bg-am-green/5 rounded-xl mt-3">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {t('connector.howItWorks')}
          </p>
        </div>
      </div>

      {/* ─── MCP Server URL (the key piece) ─── */}
      <div className="glass-crystal-enhanced rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Globe className="w-4 h-4 text-am-blue" />
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">
            {t('connector.serverUrl')}
          </h3>
        </div>
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-xl p-3">
          <code className="text-sm font-mono flex-1 truncate text-am-blue dark:text-am-blue-light">
            {mcpUrl}
          </code>
          <button
            onClick={() => copy(mcpUrl, 'url')}
            className="shrink-0 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            {copiedField === 'url' ? (
              <Check className="w-4 h-4 text-am-green" />
            ) : (
              <Copy className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
          {t('connector.urlExplainer')}
        </p>
      </div>

      {/* ─── Connection Cards ─── */}
      <div className="space-y-3">

        {/* Cursor — TRUE one-click */}
        <ConnectionCard
          name="Cursor"
          icon="⚡"
          gradient="from-purple-600 to-purple-400"
          description={t('connector.cursorDesc')}
          oneClick
          actionLabel={t('connector.addToCursor')}
          onAction={() => { window.open(cursorDeepLink, '_self') }}
          t={t}
        />

        {/* Claude Desktop */}
        <ConnectionCard
          name="Claude Desktop"
          icon="🤖"
          gradient="from-am-orange to-am-orange-light"
          description={t('connector.claudeDesc')}
          steps={[t('connector.claudeStep1'), t('connector.claudeStep2')]}
          copyUrl={mcpUrl}
          onCopy={() => copy(mcpUrl, 'claude')}
          copied={copiedField === 'claude'}
          t={t}
        />

        {/* ChatGPT */}
        <ConnectionCard
          name="ChatGPT"
          icon="💬"
          gradient="from-emerald-600 to-emerald-400"
          description={t('connector.chatgptDesc')}
          steps={[t('connector.chatgptStep1'), t('connector.chatgptStep2')]}
          copyUrl={mcpUrl}
          onCopy={() => copy(mcpUrl, 'chatgpt')}
          copied={copiedField === 'chatgpt'}
          t={t}
        />

        {/* Gemini */}
        <ConnectionCard
          name="Gemini"
          icon="✨"
          gradient="from-blue-500 to-cyan-400"
          description={t('connector.geminiDesc')}
          steps={[t('connector.geminiStep1'), t('connector.geminiStep2')]}
          copyUrl={mcpUrl}
          onCopy={() => copy(mcpUrl, 'gemini')}
          copied={copiedField === 'gemini'}
          t={t}
        />
      </div>

      {/* ─── What your AI can do ─── */}
      <div className="glass-crystal-enhanced rounded-2xl p-5">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-am-orange" />
          {t('connector.capabilities')}
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {['connector.capSearch', 'connector.capInventory', 'connector.capReferrals', 'connector.capProfile'].map(key => (
            <div key={key} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="w-1.5 h-1.5 rounded-full bg-am-green shrink-0" />
              {t(key)}
            </div>
          ))}
        </div>
      </div>

      {/* ─── Security note ─── */}
      <div className="glass-crystal-enhanced rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-am-blue mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">
              {t('connector.securityTitle')}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('connector.securityDesc')}
            </p>
          </div>
        </div>
      </div>

      {/* ─── Advanced: API Keys (collapsed) ─── */}
      <div className="glass-crystal-enhanced rounded-2xl overflow-hidden">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
              {t('connector.advancedKeys')}
            </span>
          </div>
          {showAdvanced ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
        </button>

        {showAdvanced && (
          <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-400 mt-3 mb-4">{t('connector.advancedExplainer')}</p>
            <ApiKeyManager walletAddress={walletAddress} t={t} />
          </div>
        )}
      </div>
    </div>
  )
}

// ===================================================
// Connection Card
// ===================================================

function ConnectionCard({
  name,
  icon,
  gradient,
  description,
  oneClick,
  actionLabel,
  onAction,
  steps,
  copyUrl,
  onCopy,
  copied,
  t,
}: {
  name: string
  icon: string
  gradient: string
  description: string
  oneClick?: boolean
  actionLabel?: string
  onAction?: () => void
  steps?: string[]
  copyUrl?: string
  onCopy?: () => void
  copied?: boolean
  t: any
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="glass-crystal-enhanced rounded-2xl overflow-hidden">
      <button
        onClick={() => oneClick ? onAction?.() : setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors text-left"
      >
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-lg shadow-md shrink-0`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-gray-900 dark:text-white">{name}</p>
            {oneClick && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-am-green/10 text-am-green rounded-md">
                One-Click
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{description}</p>
        </div>
        {oneClick ? (
          <div className="shrink-0 px-3 py-1.5 rounded-lg bg-gradient-to-r from-am-green to-emerald-500 text-white text-xs font-bold">
            {actionLabel}
          </div>
        ) : (
          expanded ? <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
        )}
      </button>

      {expanded && steps && (
        <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-800">
          <ol className="mt-3 space-y-2">
            {steps.map((step, i) => (
              <li key={i} className="flex gap-2">
                <span className="w-5 h-5 rounded-full bg-am-blue text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-sm text-gray-700 dark:text-gray-300">{step}</span>
              </li>
            ))}
          </ol>
          {copyUrl && onCopy && (
            <button
              onClick={(e) => { e.stopPropagation(); onCopy() }}
              className="mt-3 w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-am-blue/10 dark:bg-am-blue/5 text-am-blue dark:text-am-blue-light text-sm font-semibold hover:bg-am-blue/20 transition-colors"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? t('connector.copied') : t('connector.copyUrl')}
            </button>
          )}
          <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
            <Shield className="w-3 h-3" />
            {t('connector.autoAuth')}
          </p>
        </div>
      )}
    </div>
  )
}

// ===================================================
// API Key Manager (Advanced section)
// ===================================================

function ApiKeyManager({ walletAddress, t }: { walletAddress: string; t: any }) {
  const [keys, setKeys] = useState<AgentApiKey[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newKeyName, setNewKeyName] = useState('')
  const [createdKey, setCreatedKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const fetchKeys = useCallback(async () => {
    try {
      const res = await fetch('/api/agent/keys', {
        headers: { 'x-wallet-address': walletAddress },
      })
      if (res.ok) {
        const data = await res.json()
        setKeys(data.keys)
      }
    } catch {
      // silently fail
    } finally {
      setIsLoading(false)
    }
  }, [walletAddress])

  useEffect(() => { fetchKeys() }, [fetchKeys])

  const createKey = async () => {
    if (!newKeyName.trim() || isCreating) return
    setIsCreating(true)
    try {
      const res = await fetch('/api/agent/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-wallet-address': walletAddress },
        body: JSON.stringify({ name: newKeyName.trim(), scopes: ['read', 'write'] }),
      })
      if (res.ok) {
        const data = await res.json()
        setCreatedKey(data.key)
        setNewKeyName('')
        fetchKeys()
      }
    } catch {} finally { setIsCreating(false) }
  }

  const revokeKey = async (keyId: string) => {
    try {
      await fetch(`/api/agent/keys?id=${keyId}`, {
        method: 'DELETE',
        headers: { 'x-wallet-address': walletAddress },
      })
      fetchKeys()
    } catch {}
  }

  return (
    <div className="space-y-3">
      {createdKey && (
        <div className="p-3 rounded-xl border border-am-orange bg-am-orange/5">
          <p className="text-xs font-bold text-am-orange mb-1">{t('keyCreated')}</p>
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-2">
            <code className="text-xs font-mono flex-1 truncate">{createdKey}</code>
            <button
              onClick={() => { navigator.clipboard.writeText(createdKey); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            >
              {copied ? <Check className="w-3 h-3 text-am-green" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
          <button onClick={() => setCreatedKey(null)} className="mt-1 text-[10px] text-gray-400 hover:text-gray-600">
            {t('dismissKeyAlert')}
          </button>
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={newKeyName}
          onChange={e => setNewKeyName(e.target.value)}
          placeholder={t('keyNamePlaceholder')}
          className="flex-1 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm border border-gray-200 dark:border-gray-700 focus:border-am-blue focus:outline-none"
          maxLength={100}
          onKeyDown={e => e.key === 'Enter' && createKey()}
        />
        <button
          onClick={createKey}
          disabled={!newKeyName.trim() || isCreating}
          className="px-3 py-2 rounded-lg bg-gradient-to-r from-am-orange to-am-orange-light text-white font-bold text-sm disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {isLoading ? (
        <div className="animate-pulse h-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      ) : keys.filter(k => k.is_active).length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-2">{t('noKeys')}</p>
      ) : (
        <div className="space-y-1.5">
          {keys.filter(k => k.is_active).map(key => (
            <div key={key.id} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <Key className="w-3 h-3 text-am-blue shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{key.name}</p>
                <p className="text-[10px] text-gray-400 font-mono">{key.key_prefix}...</p>
              </div>
              <span className="text-[10px] text-gray-400">{key.usage_count}</span>
              <button
                onClick={() => revokeKey(key.id)}
                className="p-1 text-red-400 hover:text-red-600 rounded"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
