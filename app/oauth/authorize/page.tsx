'use client'

/**
 * OAuth Consent Page — /oauth/authorize
 *
 * When an AI client (ChatGPT, Claude, Cursor) initiates OAuth,
 * the user lands here to authorize access.
 *
 * Flow:
 *   1. User arrives with ?client_id=...&redirect_uri=...&code_challenge=...&state=...
 *   2. If not logged in → Thirdweb connect button
 *   3. If logged in → consent screen
 *   4. User approves → generates auth code → redirects back to AI
 */

import React, { useState, useEffect, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useAccount } from '@/lib/thirdweb'
import { ConnectButtonDAO } from '@/components/thirdweb/ConnectButtonDAO'
import { Shield, Check, X, Loader2, Bot } from 'lucide-react'

function OAuthAuthorizeContent() {
  const t = useTranslations('agent')
  const { address, isConnected } = useAccount()
  const searchParams = useSearchParams()

  const params = useMemo(() => ({
    clientId: searchParams.get('client_id') || '',
    redirectUri: searchParams.get('redirect_uri') || '',
    codeChallenge: searchParams.get('code_challenge') || '',
    codeChallengeMethod: searchParams.get('code_challenge_method') || 'S256',
    scope: searchParams.get('scope') || 'mcp:read mcp:write',
    state: searchParams.get('state') || '',
    responseType: searchParams.get('response_type') || 'code',
  }), [searchParams])

  const [clientName, setClientName] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch client name
  useEffect(() => {
    if (!params.clientId) return
    fetch(`/api/oauth/register?client_id=${params.clientId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => setClientName(data?.client_name || params.clientId))
      .catch(() => setClientName(params.clientId))
  }, [params.clientId])

  // Validate params
  if (!params.clientId || !params.redirectUri || !params.codeChallenge) {
    return (
      <div className="min-h-screen theme-gradient-bg flex items-center justify-center p-4">
        <div className="glass-crystal-enhanced rounded-2xl p-8 max-w-md w-full text-center">
          <X className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {t('oauth.invalidRequest')}
          </h1>
          <p className="text-sm text-gray-500">{t('oauth.missingParams')}</p>
        </div>
      </div>
    )
  }

  const handleApprove = async () => {
    if (!address) return
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/oauth/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: address,
          client_id: params.clientId,
          redirect_uri: params.redirectUri,
          code_challenge: params.codeChallenge,
          code_challenge_method: params.codeChallengeMethod,
          scope: params.scope,
          state: params.state,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Authorization failed')
        return
      }

      // Redirect back to the AI client with the auth code
      window.location.href = data.redirect_url
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeny = () => {
    const redirectUrl = new URL(params.redirectUri)
    redirectUrl.searchParams.set('error', 'access_denied')
    redirectUrl.searchParams.set('error_description', 'User denied the request')
    if (params.state) redirectUrl.searchParams.set('state', params.state)
    window.location.href = redirectUrl.toString()
  }

  // Parse scopes for display
  const scopeList = params.scope.split(' ').map(s => {
    if (s === 'mcp:read') return t('oauth.scopeRead')
    if (s === 'mcp:write') return t('oauth.scopeWrite')
    return s
  })

  return (
    <div className="min-h-screen theme-gradient-bg flex items-center justify-center p-4">
      <div className="glass-crystal-enhanced rounded-2xl p-8 max-w-md w-full">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-am-blue to-am-blue-light flex items-center justify-center shadow-lg">
            <Bot className="w-8 h-8 text-white" />
          </div>
        </div>

        <h1 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-2">
          {t('oauth.title')}
        </h1>

        {/* Not connected — show login */}
        {!isConnected && (
          <div className="text-center mt-6">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              {t('oauth.loginFirst')}
            </p>
            <div className="flex justify-center">
              <ConnectButtonDAO />
            </div>
          </div>
        )}

        {/* Connected — show consent */}
        {isConnected && address && (
          <div className="mt-4">
            <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-6">
              <span className="font-semibold text-gray-700 dark:text-gray-200">
                {clientName || params.clientId}
              </span>{' '}
              {t('oauth.wantsAccess')}
            </p>

            {/* Permissions */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 mb-6">
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                {t('oauth.permissions')}
              </p>
              <div className="space-y-2">
                {scopeList.map((scope, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-am-green shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{scope}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Account info */}
            <div className="flex items-center gap-2 p-3 bg-am-blue/5 dark:bg-am-blue/10 rounded-xl mb-6">
              <div className="w-2 h-2 rounded-full bg-am-green" />
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {t('oauth.connectedAs')}: <span className="font-mono">{address.slice(0, 6)}...{address.slice(-4)}</span>
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl mb-4 text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleDeny}
                disabled={isLoading}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {t('oauth.deny')}
              </button>
              <button
                onClick={handleApprove}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-am-green to-emerald-500 text-white font-bold text-sm hover:shadow-lg transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                {t('oauth.approve')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function OAuthAuthorizePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen theme-gradient-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-am-blue" />
      </div>
    }>
      <OAuthAuthorizeContent />
    </Suspense>
  )
}
