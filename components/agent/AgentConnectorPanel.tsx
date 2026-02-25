'use client'

/**
 * AgentConnectorPanel — AI Assistant configuration panel
 *
 * Lives in the Profile page as a tab. Allows users to:
 * 1. Generate/manage API keys
 * 2. See connection instructions for Claude Desktop / ChatGPT / Gemini
 * 3. View usage stats
 */

import React, { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import {
  Key, Plus, Trash2, Copy, Check, Eye, EyeOff,
  Bot, ExternalLink, Shield, Activity,
} from 'lucide-react'
import type { AgentApiKey } from '@/lib/agent/types/connector-types'

interface Props {
  walletAddress: string
}

export function AgentConnectorPanel({ walletAddress }: Props) {
  const t = useTranslations('agent')
  const [keys, setKeys] = useState<AgentApiKey[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newKeyName, setNewKeyName] = useState('')
  const [createdKey, setCreatedKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [activeTab, setActiveTab] = useState<'keys' | 'claude' | 'chatgpt' | 'gemini'>('keys')

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
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': walletAddress,
        },
        body: JSON.stringify({ name: newKeyName.trim(), scopes: ['read', 'write'] }),
      })
      if (res.ok) {
        const data = await res.json()
        setCreatedKey(data.key)
        setNewKeyName('')
        fetchKeys()
      }
    } catch {
      // silently fail
    } finally {
      setIsCreating(false)
    }
  }

  const revokeKey = async (keyId: string) => {
    try {
      await fetch(`/api/agent/keys?id=${keyId}`, {
        method: 'DELETE',
        headers: { 'x-wallet-address': walletAddress },
      })
      fetchKeys()
    } catch {
      // silently fail
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://autosmall.org'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-crystal-enhanced rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-am-blue to-am-blue-light flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('title')}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(['keys', 'claude', 'chatgpt', 'gemini'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
              activeTab === tab
                ? 'bg-gradient-to-r from-am-blue to-am-blue-light text-white shadow-lg'
                : 'glass-crystal-enhanced text-gray-600 dark:text-gray-300 hover:text-am-blue'
            }`}
          >
            {tab === 'keys' && t('tabs.apiKeys')}
            {tab === 'claude' && 'Claude'}
            {tab === 'chatgpt' && 'ChatGPT'}
            {tab === 'gemini' && 'Gemini'}
          </button>
        ))}
      </div>

      {/* API Keys tab */}
      {activeTab === 'keys' && (
        <div className="space-y-4">
          {/* Created key alert */}
          {createdKey && (
            <div className="glass-crystal-enhanced rounded-2xl p-4 border-2 border-am-orange">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-am-orange mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-am-orange mb-1">{t('keyCreated')}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{t('keyCreatedWarning')}</p>
                  <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-2">
                    <code className="text-xs font-mono flex-1 truncate">{createdKey}</code>
                    <button
                      onClick={() => copyToClipboard(createdKey)}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                    >
                      {copied ? <Check className="w-4 h-4 text-am-green" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setCreatedKey(null)}
                className="mt-3 w-full text-center text-xs text-gray-400 hover:text-gray-600"
              >
                {t('dismissKeyAlert')}
              </button>
            </div>
          )}

          {/* Create new key */}
          <div className="glass-crystal-enhanced rounded-2xl p-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Key className="w-4 h-4" />
              {t('createNewKey')}
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={newKeyName}
                onChange={e => setNewKeyName(e.target.value)}
                placeholder={t('keyNamePlaceholder')}
                className="flex-1 px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm border border-gray-200 dark:border-gray-700 focus:border-am-blue focus:outline-none"
                maxLength={100}
                onKeyDown={e => e.key === 'Enter' && createKey()}
              />
              <button
                onClick={createKey}
                disabled={!newKeyName.trim() || isCreating}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-am-orange to-am-orange-light text-white font-bold text-sm hover:shadow-lg transition-all disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Key list */}
          <div className="glass-crystal-enhanced rounded-2xl p-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              {t('yourKeys')} ({keys.filter(k => k.is_active).length})
            </h3>
            {isLoading ? (
              <div className="animate-pulse space-y-2">
                <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl" />
              </div>
            ) : keys.filter(k => k.is_active).length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">{t('noKeys')}</p>
            ) : (
              <div className="space-y-2">
                {keys.filter(k => k.is_active).map(key => (
                  <div key={key.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                    <Key className="w-4 h-4 text-am-blue shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{key.name}</p>
                      <p className="text-xs text-gray-400 font-mono">{key.key_prefix}...</p>
                    </div>
                    <span className="text-xs text-gray-400">{key.usage_count} {t('calls')}</span>
                    <button
                      onClick={() => revokeKey(key.id)}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title={t('revokeKey')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Claude Desktop tab */}
      {activeTab === 'claude' && (
        <ConnectionGuide
          title="Claude Desktop"
          steps={[
            t('guide.claude.step1'),
            t('guide.claude.step2'),
            t('guide.claude.step3'),
          ]}
          config={JSON.stringify({
            mcpServers: {
              automall: {
                url: `${appUrl}/api/mcp/gateway`,
                transport: 'streamable-http',
                headers: {
                  Authorization: 'Bearer YOUR_API_KEY',
                },
              },
            },
          }, null, 2)}
          t={t}
        />
      )}

      {/* ChatGPT tab */}
      {activeTab === 'chatgpt' && (
        <ConnectionGuide
          title="ChatGPT"
          steps={[
            t('guide.chatgpt.step1'),
            t('guide.chatgpt.step2'),
            t('guide.chatgpt.step3'),
          ]}
          config={JSON.stringify({
            url: `${appUrl}/api/mcp/gateway`,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer YOUR_API_KEY',
            },
          }, null, 2)}
          t={t}
        />
      )}

      {/* Gemini tab */}
      {activeTab === 'gemini' && (
        <ConnectionGuide
          title="Gemini"
          steps={[
            t('guide.gemini.step1'),
            t('guide.gemini.step2'),
            t('guide.gemini.step3'),
          ]}
          config={JSON.stringify({
            endpoint: `${appUrl}/api/mcp/gateway`,
            authentication: {
              type: 'bearer',
              token: 'YOUR_API_KEY',
            },
          }, null, 2)}
          t={t}
        />
      )}
    </div>
  )
}

// ===================================================
// Sub-components
// ===================================================

function ConnectionGuide({
  title,
  steps,
  config,
  t,
}: {
  title: string
  steps: string[]
  config: string
  t: any
}) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(config)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      <div className="glass-crystal-enhanced rounded-2xl p-5">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <ExternalLink className="w-5 h-5 text-am-blue" />
          {t('guide.connectWith')} {title}
        </h3>
        <ol className="space-y-3">
          {steps.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-am-blue text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </span>
              <span className="text-sm text-gray-700 dark:text-gray-300">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="glass-crystal-enhanced rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-bold text-gray-900 dark:text-white">{t('guide.configuration')}</h4>
          <button
            onClick={copy}
            className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            {copied ? <Check className="w-3 h-3 text-am-green" /> : <Copy className="w-3 h-3" />}
            {copied ? t('guide.copied') : t('guide.copy')}
          </button>
        </div>
        <pre className="bg-gray-900 text-green-400 rounded-xl p-4 text-xs font-mono overflow-x-auto whitespace-pre">
          {config}
        </pre>
        <p className="mt-2 text-xs text-gray-400">{t('guide.replaceKey')}</p>
      </div>
    </div>
  )
}
