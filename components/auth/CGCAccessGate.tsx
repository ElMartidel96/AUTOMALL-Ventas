/**
 * 🔐 CGC Access Gate
 *
 * Simple access control component that restricts access based on CGC token balance
 * Uses Thirdweb v5 hooks for wallet connection and balance checking
 *
 * Features beautiful gradient background with blur effects when blocking access
 */

'use client'

import React from 'react'
import { useAccount, useNetwork, useCGCBalance } from '@/lib/thirdweb'
import { ConnectButtonDAO } from '@/components/thirdweb/ConnectButtonDAO'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Lock, AlertCircle, ExternalLink, Coins } from 'lucide-react'

/**
 * Beautiful gradient background wrapper for access gates
 */
function GateBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen theme-gradient-bg">
      {/* Animated blur circles - Theme Aware */}
      <div className="fixed inset-0 opacity-30 dark:opacity-20 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-400 dark:bg-blue-600 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-purple-400 dark:bg-purple-600 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-cyan-400 dark:bg-cyan-600 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl animate-pulse"></div>
      </div>

      {/* Content with proper z-index */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        {children}
      </div>
    </div>
  )
}

/**
 * apeX Avatar component for the gate
 */
function ApexAvatar({ className = "h-16 w-16" }: { className?: string }) {
  return (
    <div className={`${className} rounded-full overflow-hidden border-2 border-purple-500/30 shadow-lg shadow-purple-500/20`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/apeX11.png"
        alt="apeX"
        className="w-full h-full object-cover"
      />
    </div>
  )
}

interface CGCAccessGateProps {
  children: React.ReactNode
  requiredBalance?: string // Minimum CGC balance required (default: "0.01")
  title?: string
  description?: string
  // Custom not connected state (optional) - shows BEFORE wallet connection
  notConnectedContent?: React.ReactNode // Custom content to show when wallet not connected
  // Custom insufficient balance state (optional) - shows AFTER wallet connection
  insufficientTitle?: string
  insufficientDescription?: string
  insufficientContent?: React.ReactNode // Custom content to show below the description
}

/**
 * Minimum CGC balance required for access (0.01 CGC)
 */
const MIN_CGC_BALANCE = 0.01

export function CGCAccessGate({
  children,
  requiredBalance = "0.01",
  title = "CGC Token Required",
  description = "This feature is exclusive to CGC token holders. Connect your wallet and hold at least 0.01 CGC tokens to continue.",
  notConnectedContent,
  insufficientTitle,
  insufficientDescription,
  insufficientContent
}: CGCAccessGateProps) {
  const { address, isConnected } = useAccount()
  const { chainId } = useNetwork()
  const { formatted, isLoading: isBalanceLoading } = useCGCBalance()

  const isCorrectNetwork = chainId === 8453 // Base Mainnet
  const cgcBalanceNum = parseFloat(formatted || '0')
  const requiredBalanceNum = parseFloat(requiredBalance)
  const hasRequiredBalance = cgcBalanceNum >= requiredBalanceNum
  const isConnecting = false // Thirdweb handles this internally

  // Loading state
  if (isConnecting || (isConnected && isBalanceLoading)) {
    return (
      <GateBackground>
        <Card className="w-full max-w-md glass-panel border-white/20 dark:border-slate-700/50">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <ApexAvatar />
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500 dark:text-blue-400" />
              <p className="text-gray-600 dark:text-gray-400">
                {isConnecting ? 'Connecting wallet...' : 'Checking CGC balance...'}
              </p>
            </div>
          </CardContent>
        </Card>
      </GateBackground>
    )
  }

  // Not connected
  if (!isConnected || !address) {
    // Use larger card width if custom content is provided
    const cardWidth = notConnectedContent ? 'max-w-lg' : 'max-w-md'

    return (
      <GateBackground>
        <Card className={`w-full ${cardWidth} glass-panel border-white/20 dark:border-slate-700/50`}>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <ApexAvatar className="h-20 w-20" />
            </div>
            <CardTitle className="flex items-center justify-center space-x-2 text-gray-900 dark:text-white">
              <Lock className="h-5 w-5" />
              <span>{title}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400 text-sm text-center">{description}</p>

            {/* Custom content section - shows BEFORE connect button */}
            {notConnectedContent && (
              <div className="pt-2">
                {notConnectedContent}
              </div>
            )}

            {/* Connect wallet button at the bottom */}
            <div className="pt-2">
              <ConnectButtonDAO fullWidth />
            </div>
          </CardContent>
        </Card>
      </GateBackground>
    )
  }

  // Wrong network
  if (!isCorrectNetwork) {
    return (
      <GateBackground>
        <Card className="w-full max-w-md glass-panel border-white/20 dark:border-slate-700/50">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <ApexAvatar className="h-20 w-20" />
            </div>
            <CardTitle className="flex items-center justify-center space-x-2 text-gray-900 dark:text-white">
              <AlertCircle className="h-5 w-5 text-orange-500 dark:text-orange-400" />
              <span>Wrong Network</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-orange-200 dark:border-orange-800/50 bg-orange-50/50 dark:bg-orange-900/20">
              <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <AlertDescription className="text-orange-800 dark:text-orange-300">
                Please switch to Base Network to access CGC token features.
              </AlertDescription>
            </Alert>
            <ConnectButtonDAO fullWidth />
          </CardContent>
        </Card>
      </GateBackground>
    )
  }


  // Insufficient balance
  if (!hasRequiredBalance) {
    const cgcTokenUrl = `https://basescan.org/address/0x5e3a61b550328f3D8C44f60b3e10a49D3d806175`

    return (
      <GateBackground>
        <Card className="w-full max-w-lg glass-panel border-white/20 dark:border-slate-700/50">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <ApexAvatar className="h-20 w-20" />
            </div>
            <CardTitle className="flex items-center justify-center space-x-2 text-gray-900 dark:text-white">
              <Coins className="h-5 w-5 text-amber-500 dark:text-amber-400" />
              <span>{insufficientTitle || 'Insufficient CGC Balance'}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-3">
              <div className="p-4 bg-amber-50/80 dark:bg-amber-900/20 rounded-lg border border-amber-200/50 dark:border-amber-700/30">
                <p className="text-sm text-amber-800 dark:text-amber-300 mb-2">
                  <strong>Current Balance:</strong> {formatted} CGC
                </p>
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  <strong>Required:</strong> {requiredBalance} CGC
                </p>
              </div>

              {insufficientDescription ? (
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {insufficientDescription}
                </p>
              ) : (
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  You need to hold at least {requiredBalance} CGC tokens to access this feature.
                </p>
              )}

              {/* Custom content section */}
              {insufficientContent && (
                <div className="pt-2">
                  {insufficientContent}
                </div>
              )}

              {/* Default content if no custom content provided */}
              {!insufficientContent && (
                <div className="space-y-2">
                  <a
                    href={cgcTokenUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm"
                  >
                    <span>View CGC Token Contract</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    Get CGC tokens through DAO participation or token swaps
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </GateBackground>
    )
  }

  // Access granted - show protected content directly (no badge needed, info shown in wallet dropdown)
  return <>{children}</>
}

/**
 * Higher-order component to protect routes/components
 */
export function withCGCAccess<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    requiredBalance?: string
    title?: string
    description?: string
  }
) {
  return function ProtectedComponent(props: P) {
    return (
      <CGCAccessGate {...options}>
        <Component {...props} />
      </CGCAccessGate>
    )
  }
}