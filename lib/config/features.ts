/**
 * Feature Flags - Autos MALL Platform
 *
 * Controls visibility of features across the platform.
 * Web3/blockchain features are hidden from public view but preserved in codebase.
 * Toggle these flags to enable/disable features without code changes.
 *
 * IMPORTANT: These flags control UI visibility only.
 * The underlying infrastructure (thirdweb, wagmi, supabase) remains active.
 */

// ---------------------------------------------------------------------------
// Read from environment or use defaults
// ---------------------------------------------------------------------------

function envBool(key: string, fallback: boolean): boolean {
  const val = typeof window !== 'undefined'
    ? (process.env[key] as string | undefined)
    : process.env[key]
  if (val === undefined) return fallback
  return val === 'true' || val === '1'
}

// ---------------------------------------------------------------------------
// Web3 & Blockchain (hidden by default for AutosMall)
// ---------------------------------------------------------------------------

/** Show blockchain/Web3 UI elements (token balances, explorer links, etc.) */
export const FEATURE_WEB3_VISIBLE = envBool('NEXT_PUBLIC_FEATURE_WEB3_VISIBLE', false)

/** Show wallet-based login options (MetaMask, Coinbase, etc.) */
export const FEATURE_WALLET_LOGIN = envBool('NEXT_PUBLIC_FEATURE_WALLET_LOGIN', false)

/** Show DAO governance UI (proposals, voting, delegation) */
export const FEATURE_DAO_GOVERNANCE = envBool('NEXT_PUBLIC_FEATURE_DAO_GOVERNANCE', false)

/** Show CGC token references (balances, rewards, token info) */
export const FEATURE_CGC_TOKEN = envBool('NEXT_PUBLIC_FEATURE_CGC_TOKEN', false)

// ---------------------------------------------------------------------------
// AutosMall Features (enable as developed)
// ---------------------------------------------------------------------------

/** Enable seller subdomain routing (vendedor.autosmall.org) */
export const FEATURE_SELLER_SUBDOMAINS = envBool('NEXT_PUBLIC_FEATURE_SELLER_SUBDOMAINS', true)

/** Enable AI Sales Agent (Alfred) */
export const FEATURE_AI_SALES_AGENT = envBool('NEXT_PUBLIC_FEATURE_AI_SALES_AGENT', false)

/** Enable vehicle inventory management */
export const FEATURE_INVENTORY = envBool('NEXT_PUBLIC_FEATURE_INVENTORY', true)

/** Enable CRM / client management */
export const FEATURE_CRM = envBool('NEXT_PUBLIC_FEATURE_CRM', false)

/** Enable WhatsApp Business integration */
export const FEATURE_WHATSAPP = envBool('NEXT_PUBLIC_FEATURE_WHATSAPP', false)

/** Enable public vehicle catalog */
export const FEATURE_CATALOG = envBool('NEXT_PUBLIC_FEATURE_CATALOG', true)

/** Enable AI Agent Connector (MCP Gateway + Platform Chat + API Keys) */
export const FEATURE_AI_AGENT_CONNECTOR = envBool('NEXT_PUBLIC_FEATURE_AI_AGENT_CONNECTOR', true)

/** Enable Meta integration (WhatsApp Catalog Feed + Facebook Auto-Publishing) */
export const FEATURE_META_INTEGRATION = envBool('NEXT_PUBLIC_FEATURE_META_INTEGRATION', true)

/** Enable Near Me map system (dealer locations, service areas, geo-filtering) */
export const FEATURE_NEAR_ME = envBool('NEXT_PUBLIC_FEATURE_NEAR_ME', true)

// ---------------------------------------------------------------------------
// App Identity
// ---------------------------------------------------------------------------

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Autos MALL'
export const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || 'autosmall.org'
export const APP_DESCRIPTION = 'Tu Plataforma de Venta de Autos con IA'
export const APP_TAGLINE = 'Tu negocio de autos, potenciado por IA'
export const APP_LOCATION = 'Houston, Texas'
export const APP_CONTACT_EMAIL = 'contacto@autosmall.com'
