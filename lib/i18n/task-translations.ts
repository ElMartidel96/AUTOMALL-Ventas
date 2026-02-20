/**
 * 🌐 Task Translation Utilities
 *
 * Helper functions to translate task content from Supabase
 * based on the current locale using static translations.
 *
 * ROBUST SOLUTION: Uses a direct mapping from task internal IDs
 * to translation keys, independent of the actual title language.
 */

import { useTranslations } from 'next-intl'

/**
 * Mapping of internal task identifiers to translation keys.
 * These identifiers match those used in init-tasks/route.ts
 *
 * Format: 'internal-id' => 'translation_key_in_taskData'
 */
const TASK_TRANSLATION_MAP: Record<string, string> = {
  // Security & Auditing
  'smart-contract-audit': 'smart_contract_security_audit',
  'security-monitoring': 'monitoring_and_alerts',
  'bug-bounty-program': 'improved_error_handling',

  // Frontend & UI
  'ui-ux-redesign': 'design_main_dashboard_uiux',
  'component-library': 'dark_mode_implementation',

  // Backend & Infrastructure
  'backend-microservices': 'setup_cicd_pipeline',
  'backup-recovery': 'backup_and_recovery',

  // Mobile
  'mobile-app-development': 'mobile_responsive_design',

  // AI & Automation
  'ai-task-matching': 'automated_testing',
  'code-review-automation': 'automated_testing',
  'workflow-automation': 'notification_system',

  // DeFi & Blockchain
  'defi-integration': 'tokenomics_analysis',
  'cross-chain-bridge': 'crosschain_integration',
  'blockchain-indexing': 'database_optimization',
  'smart-contract-upgrade': 'smart_contract_security_audit',

  // Governance
  'governance-voting': 'implement_voting_system',
  'dispute-resolution': 'community_guidelines',
  'treasury-management': 'multisignature_wallet_integration',

  // Analytics & Documentation
  'analytics-dashboard': 'analytics_and_metrics',
  'api-documentation': 'api_documentation',
  'knowledge-base': 'create_technical_documentation',

  // Social & Community
  'social-features': 'social_media_integration',
  'notification-system': 'notification_system',
  'marketplace-integration': 'zealy_integration',

  // NFT & Gamification
  'nft-rewards-system': 'nft_rewards_system',
  'gamification-system': 'interactive_tutorial',

  // Performance & Testing
  'performance-optimization': 'performance_optimization',
  'automated-testing': 'automated_testing',
  'integration-testing': 'load_testing',

  // Localization & Search
  'localization-i18n': 'internationalization_i18n',
  'advanced-search': 'user_feedback_system',

  // Compliance & Legal
  'compliance-reporting': 'legal_compliance_review',
  'reputation-algorithm': 'performance_dashboard'
}

/**
 * Mapping of English title patterns to translation keys.
 * Used as fallback when task_id mapping is not available.
 */
const ENGLISH_TITLE_TO_KEY: Record<string, string> = {
  'smart contract security audit': 'smart_contract_security_audit',
  'complete ui/ux dashboard redesign': 'design_main_dashboard_uiux',
  'microservices backend architecture': 'setup_cicd_pipeline',
  'react native mobile app': 'mobile_responsive_design',
  'ai-powered task matching system': 'automated_testing',
  'defi yield farming integration': 'tokenomics_analysis',
  'advanced governance voting system': 'implement_voting_system',
  'advanced analytics dashboard': 'analytics_and_metrics',
  'comprehensive api documentation': 'api_documentation',
  'cross-chain bridge implementation': 'crosschain_integration',
  'real-time security monitoring': 'monitoring_and_alerts',
  'nft achievement system': 'nft_rewards_system',
  'full-stack performance optimization': 'performance_optimization',
  'comprehensive test suite': 'automated_testing',
  'internationalization & localization': 'internationalization_i18n',
  'social features & community building': 'social_media_integration',
  'multi-channel notification system': 'notification_system',
  'advanced treasury management': 'multisignature_wallet_integration',
  'decentralized dispute resolution': 'community_guidelines',
  'freelance marketplace integration': 'zealy_integration',
  'automated code review system': 'automated_testing',
  'interactive knowledge base': 'create_technical_documentation',
  'advanced reputation algorithm': 'performance_dashboard',
  'regulatory compliance system': 'legal_compliance_review',
  'disaster recovery system': 'backup_and_recovery',
  'third-party integration testing': 'load_testing',
  'advanced workflow automation': 'notification_system',
  'upgradeable smart contract system': 'smart_contract_security_audit',
  'advanced gamification system': 'interactive_tutorial',
  'ai-powered search engine': 'user_feedback_system',
  'custom blockchain indexer': 'database_optimization',
  'automated bug bounty system': 'improved_error_handling',
  'reusable component library': 'dark_mode_implementation',
  // Common task variations
  'create web3 authentication system': 'create_web3_authentication_system',
  'design main dashboard ui/ux': 'design_main_dashboard_uiux',
  'integrate ethereum attestation service': 'integrate_ethereum_attestation_service',
  'configure discord bot': 'configure_discord_bot',
  'create technical documentation': 'create_technical_documentation',
  'implement voting system': 'implement_voting_system',
  'setup ci/cd pipeline': 'setup_cicd_pipeline',
  'create landing page': 'create_landing_page',
  'zealy integration': 'zealy_integration',
  'automated testing': 'automated_testing',
  'performance optimization': 'performance_optimization',
  'notification system': 'notification_system',
  'mobile responsive design': 'mobile_responsive_design',
  'analytics and metrics': 'analytics_and_metrics',
  'internationalization (i18n)': 'internationalization_i18n',
  'api rate limiting': 'api_rate_limiting',
  'backup and recovery': 'backup_and_recovery',
  'social media integration': 'social_media_integration',
  'improved error handling': 'improved_error_handling',
  'interactive tutorial': 'interactive_tutorial',
  'api documentation': 'api_documentation',
  'dark mode implementation': 'dark_mode_implementation',
  'load testing': 'load_testing',
  'multi-signature wallet integration': 'multisignature_wallet_integration',
  'community guidelines': 'community_guidelines',
  'nft rewards system': 'nft_rewards_system',
  'database optimization': 'database_optimization',
  'legal compliance review': 'legal_compliance_review',
  'tokenomics analysis': 'tokenomics_analysis',
  'monitoring and alerts': 'monitoring_and_alerts',
  'cross-chain integration': 'crosschain_integration',
  'user feedback system': 'user_feedback_system',
  'performance dashboard': 'performance_dashboard'
}

/**
 * Mapping of Spanish title patterns to translation keys.
 * Used when the task title is in Spanish.
 */
const SPANISH_TITLE_TO_KEY: Record<string, string> = {
  'crear sistema de autenticación web3': 'create_web3_authentication_system',
  'diseñar ui/ux del dashboard principal': 'design_main_dashboard_uiux',
  'integrar ethereum attestation service': 'integrate_ethereum_attestation_service',
  'configurar bot de discord': 'configure_discord_bot',
  'crear documentación técnica': 'create_technical_documentation',
  'implementar sistema de votación': 'implement_voting_system',
  'auditoría de contratos inteligentes': 'smart_contract_security_audit',
  'configurar pipeline ci/cd': 'setup_cicd_pipeline',
  'crear landing page': 'create_landing_page',
  'integración con zealy': 'zealy_integration',
  'testing automatizado': 'automated_testing',
  'optimización de rendimiento': 'performance_optimization',
  'sistema de notificaciones': 'notification_system',
  'diseño responsive móvil': 'mobile_responsive_design',
  'analíticas y métricas': 'analytics_and_metrics',
  'internacionalización (i18n)': 'internationalization_i18n',
  'rate limiting de api': 'api_rate_limiting',
  'backup y recuperación': 'backup_and_recovery',
  'integración con redes sociales': 'social_media_integration',
  'manejo de errores mejorado': 'improved_error_handling',
  'tutorial interactivo': 'interactive_tutorial',
  'documentación de api': 'api_documentation',
  'implementación de modo oscuro': 'dark_mode_implementation',
  'pruebas de carga': 'load_testing',
  'integración wallet multifirma': 'multisignature_wallet_integration',
  'guías de la comunidad': 'community_guidelines',
  'sistema de recompensas nft': 'nft_rewards_system',
  'optimización de base de datos': 'database_optimization',
  'revisión de cumplimiento legal': 'legal_compliance_review',
  'análisis de tokenomics': 'tokenomics_analysis',
  'monitoreo y alertas': 'monitoring_and_alerts',
  'integración cross-chain': 'crosschain_integration',
  'sistema de feedback de usuarios': 'user_feedback_system',
  'dashboard de rendimiento': 'performance_dashboard'
}

/**
 * Convert a task title to a translation key
 * Example: "RC-1155 Tokenbone Protocol & Reference" -> "rc_1155_tokenbone_protocol_reference"
 */
export function titleToKey(title: string): string {
  return title
    .toLowerCase()
    .replace(/[&+→]/g, '') // Remove special chars
    .replace(/[^a-z0-9\s]/g, '') // Keep only alphanumeric and spaces
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/_+/g, '_') // Replace multiple underscores with single
    .replace(/^_|_$/g, '') // Remove leading/trailing underscores
}

/**
 * Normalize a title for lookup by removing emojis and extra whitespace
 */
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    // Remove emojis (common patterns)
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
    .replace(/[\u{2600}-\u{26FF}]/gu, '')
    .replace(/[\u{2700}-\u{27BF}]/gu, '')
    // Clean up
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Find translation key from title using multiple strategies
 */
function findTranslationKey(title: string): string | null {
  const normalized = normalizeTitle(title)

  // Strategy 1: Direct match in English titles
  if (ENGLISH_TITLE_TO_KEY[normalized]) {
    return ENGLISH_TITLE_TO_KEY[normalized]
  }

  // Strategy 2: Direct match in Spanish titles
  if (SPANISH_TITLE_TO_KEY[normalized]) {
    return SPANISH_TITLE_TO_KEY[normalized]
  }

  // Strategy 3: Partial match in English titles (for slight variations)
  for (const [pattern, key] of Object.entries(ENGLISH_TITLE_TO_KEY)) {
    if (normalized.includes(pattern) || pattern.includes(normalized)) {
      return key
    }
  }

  // Strategy 4: Partial match in Spanish titles
  for (const [pattern, key] of Object.entries(SPANISH_TITLE_TO_KEY)) {
    if (normalized.includes(pattern) || pattern.includes(normalized)) {
      return key
    }
  }

  // Strategy 5: Fall back to titleToKey conversion
  return null
}

/**
 * Hook to get translated task content
 * Returns a function that takes a task and returns translated title/description
 */
export function useTaskTranslation() {
  const t = useTranslations('taskData')

  /**
   * Try to get translation using a key
   */
  const tryTranslate = (key: string, field: 'title' | 'description'): string | null => {
    try {
      const translated = t(`${key}.${field}`)
      // Check if translation exists (next-intl returns key path if not found)
      if (translated && !translated.includes(`.${field}`)) {
        return translated
      }
    } catch {
      // Translation not found
    }
    return null
  }

  return {
    /**
     * Get translated title for a task
     * Falls back to original title if no translation found
     */
    getTitle: (originalTitle: string): string => {
      // First, try to find a known translation key
      const knownKey = findTranslationKey(originalTitle)
      if (knownKey) {
        const translated = tryTranslate(knownKey, 'title')
        if (translated) return translated
      }

      // Fall back to titleToKey conversion
      const generatedKey = titleToKey(originalTitle)
      const translated = tryTranslate(generatedKey, 'title')
      if (translated) return translated

      return originalTitle
    },

    /**
     * Get translated description for a task
     * Falls back to original description if no translation found
     */
    getDescription: (originalTitle: string, originalDescription: string | null): string | null => {
      if (!originalDescription) return null

      // First, try to find a known translation key
      const knownKey = findTranslationKey(originalTitle)
      if (knownKey) {
        const translated = tryTranslate(knownKey, 'description')
        if (translated) return translated
      }

      // Fall back to titleToKey conversion
      const generatedKey = titleToKey(originalTitle)
      const translated = tryTranslate(generatedKey, 'description')
      if (translated) return translated

      return originalDescription
    },

    /**
     * Get both title and description translated
     */
    translate: (originalTitle: string, originalDescription: string | null): { title: string; description: string | null } => {
      // Find the best translation key
      const knownKey = findTranslationKey(originalTitle)
      const generatedKey = titleToKey(originalTitle)

      let title = originalTitle
      let description = originalDescription

      // Try known key first, then generated key
      const keyToUse = knownKey || generatedKey

      const translatedTitle = tryTranslate(keyToUse, 'title')
      if (translatedTitle) {
        title = translatedTitle
      } else if (knownKey !== generatedKey) {
        // Try the other key as fallback
        const fallbackTitle = tryTranslate(generatedKey, 'title')
        if (fallbackTitle) title = fallbackTitle
      }

      const translatedDesc = tryTranslate(keyToUse, 'description')
      if (translatedDesc) {
        description = translatedDesc
      } else if (knownKey !== generatedKey) {
        const fallbackDesc = tryTranslate(generatedKey, 'description')
        if (fallbackDesc) description = fallbackDesc
      }

      return { title, description }
    },

    /**
     * Get translation key from internal task ID
     * Used when task_id internal identifier is available
     */
    getKeyFromInternalId: (internalId: string): string | null => {
      return TASK_TRANSLATION_MAP[internalId] || null
    }
  }
}

/**
 * Non-hook version for server-side usage
 * Takes the translations object directly
 */
export function translateTask(
  t: (key: string) => string,
  originalTitle: string,
  originalDescription: string | null
): { title: string; description: string | null } {
  const tryTranslate = (key: string, field: 'title' | 'description'): string | null => {
    try {
      const translated = t(`${key}.${field}`)
      if (translated && !translated.includes(`.${field}`)) {
        return translated
      }
    } catch {
      // Translation not found
    }
    return null
  }

  const knownKey = findTranslationKey(originalTitle)
  const generatedKey = titleToKey(originalTitle)
  const keyToUse = knownKey || generatedKey

  let title = originalTitle
  let description = originalDescription

  const translatedTitle = tryTranslate(keyToUse, 'title')
  if (translatedTitle) {
    title = translatedTitle
  }

  const translatedDesc = tryTranslate(keyToUse, 'description')
  if (translatedDesc) {
    description = translatedDesc
  }

  return { title, description }
}

// Export the maps for potential use in other modules
export { TASK_TRANSLATION_MAP, ENGLISH_TITLE_TO_KEY, SPANISH_TITLE_TO_KEY }
