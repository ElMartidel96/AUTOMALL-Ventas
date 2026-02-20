/**
 * Autos MALL - Sign In Button
 *
 * Social-only authentication via Thirdweb v5 inAppWallet.
 * Shows Google, Apple, email, and passkey login options.
 * Wallet-based login is hidden but infrastructure remains.
 */

'use client'

import React from 'react'
import { ConnectButton } from 'thirdweb/react'
import { getClient } from '@/lib/thirdweb/client'
import { base } from 'thirdweb/chains'
import { inAppWallet } from 'thirdweb/wallets'
import { FEATURE_WALLET_LOGIN, FEATURE_CGC_TOKEN } from '@/lib/config/features'

/**
 * Wallet configuration:
 * - Social-only by default (FEATURE_WALLET_LOGIN = false)
 * - Can re-enable wallet providers via feature flag
 */
function getWallets() {
  const socialWallet = inAppWallet({
    auth: {
      options: ['google', 'apple', 'email', 'passkey'],
    },
  })

  if (FEATURE_WALLET_LOGIN) {
    // When wallet login is enabled, include crypto wallets
    const { createWallet } = require('thirdweb/wallets')
    return [
      createWallet('io.metamask'),
      createWallet('com.coinbase.wallet'),
      socialWallet,
    ]
  }

  return [socialWallet]
}

const wallets = getWallets()

interface ConnectButtonDAOProps {
  fullWidth?: boolean
  label?: string
  className?: string
}

/**
 * Autos MALL Sign In Button
 *
 * Uses thirdweb inAppWallet for social authentication.
 * Branded with Autos MALL colors and messaging.
 */
export function ConnectButtonDAO({
  fullWidth = false,
  label = 'Iniciar Sesion',
  className = '',
}: ConnectButtonDAOProps) {
  const client = getClient()

  if (!client) {
    return (
      <button
        disabled
        className={`flex items-center justify-center space-x-2 bg-gray-400 text-white px-4 py-2.5 rounded-lg
                   font-medium text-sm shadow-md cursor-not-allowed ${fullWidth ? 'w-full' : ''} ${className}`}
      >
        <span>Cargando...</span>
      </button>
    )
  }

  return (
    <ConnectButton
      client={client}
      wallets={wallets}
      chain={base}
      connectButton={{
        label: label,
        className: `flex items-center justify-center space-x-2 bg-gradient-to-r from-am-blue to-am-blue-light
                   hover:from-am-blue-dark hover:to-am-blue text-white px-4 py-2.5 rounded-lg
                   transition-all duration-300 font-medium text-sm shadow-md hover:shadow-lg
                   disabled:opacity-50 disabled:cursor-not-allowed ${fullWidth ? 'w-full' : ''} ${className}`,
      }}
      connectModal={{
        size: 'compact',
        title: 'Bienvenido a Autos MALL',
        titleIcon: '/logo-automall.png',
        welcomeScreen: {
          title: 'Autos MALL',
          subtitle: 'Inicia sesion para acceder a tu panel de vendedor',
          img: {
            src: '/logo-automall.png',
            width: 200,
            height: 100,
          },
        },
        showThirdwebBranding: false,
      }}
      {...(FEATURE_CGC_TOKEN ? {
        detailsButton: {
          displayBalanceToken: {
            [base.id]: '0x5e3a61b550328f3D8C44f60b3e10a49D3d806175',
          },
        },
        supportedTokens: {
          [base.id]: [
            {
              address: '0x5e3a61b550328f3D8C44f60b3e10a49D3d806175',
              name: 'AutoMALL Token',
              symbol: 'AML',
              icon: '/logo-automall.png',
            },
          ],
        },
      } : {})}
      switchButton={{
        label: 'Red Incorrecta',
        className:
          'bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors',
      }}
      theme="dark"
    />
  )
}
