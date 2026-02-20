/**
 * ⛓️ Blockchain Configuration
 *
 * CryptoGift Wallets DAO operates exclusively on Base Mainnet
 * NO TESTNETS - Production-only deployment
 */

import { base } from 'thirdweb/chains'

/**
 * Primary blockchain for all operations
 * Chain ID: 8453 (Base Mainnet)
 */
export const SUPPORTED_CHAINS = [base]

/**
 * Default chain for the application
 */
export const DEFAULT_CHAIN = base

/**
 * Chain metadata for UI display
 */
export const CHAIN_INFO = {
  [base.id]: {
    name: 'Base',
    shortName: 'Base',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrl: 'https://mainnet.base.org',
    blockExplorer: 'https://basescan.org',
    chainId: 8453,
  },
}
