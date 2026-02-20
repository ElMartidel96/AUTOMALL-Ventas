/**
 * 📦 Thirdweb Module Exports
 *
 * Central export file for all Thirdweb v5 functionality
 */

// Client
export { getClient, getClientSafe, client, thirdwebClient } from './client'

// Chains
export { SUPPORTED_CHAINS, DEFAULT_CHAIN, CHAIN_INFO } from './chains'

// Hooks
export {
  useAccount,
  useNetwork,
  useSwitchChain,
  useAutoSwitchToBase,
  useBalance,
  useCGCBalance,
  useWallet,
  CGC_TOKEN_ADDRESS,
} from './hooks'

// Provider
export { Web3Provider } from './provider'
