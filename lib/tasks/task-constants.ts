/**
 * Task System Constants v2.0
 * ===========================
 * Centralized constants for task taxonomy, domains, categories, and types.
 * Used across the entire task system for consistent labeling and filtering.
 *
 * @author CryptoGift Wallets DAO
 * @version 2.0.0
 * @date December 2025
 */

// =====================================================
// 🏷️ TYPE DEFINITIONS
// =====================================================

export type TaskDomain =
  | 'development'
  | 'documentation'
  | 'design'
  | 'community'
  | 'governance'
  | 'operations'

export type TaskCategory =
  // Development domain
  | 'frontend'
  | 'backend'
  | 'mobile'
  | 'blockchain'
  | 'ai'
  | 'defi'
  | 'nft'
  | 'performance'
  | 'testing'
  | 'infrastructure'
  // Documentation domain
  | 'documentation'
  | 'localization'
  | 'academy'
  // Design domain
  | 'design'
  | 'branding'
  | 'multimedia'
  // Community domain
  | 'social'
  | 'notifications'
  | 'gamification'
  | 'support'
  // Governance domain
  | 'governance'
  | 'treasury'
  | 'compliance'
  | 'analytics'
  // Operations domain
  | 'integration'
  | 'automation'
  | 'algorithm'
  | 'search'
  | 'security'

export type TaskType =
  | 'feature'
  | 'bugfix'
  | 'refactor'
  | 'research'
  | 'design'
  | 'content'
  | 'review'
  | 'setup'
  | 'migration'
  | 'integration'

export type TaskComplexityLevel =
  | 'trivial'    // 1-2
  | 'simple'     // 3-4
  | 'medium'     // 5-6
  | 'high'       // 7-8
  | 'critical'   // 9-10
  | 'epic'       // 10+

// =====================================================
// 💻 DOMAINS CONFIGURATION (6 Domains)
// =====================================================

export interface DomainConfig {
  emoji: string
  label: string
  labelEs: string
  color: string
  description: string
  descriptionEs: string
  categories: TaskCategory[]
}

export const TASK_DOMAINS: Record<TaskDomain, DomainConfig> = {
  development: {
    emoji: '💻',
    label: 'Development',
    labelEs: 'Desarrollo',
    color: '#3B82F6', // blue-500
    description: 'All code and technical development',
    descriptionEs: 'Todo el código y desarrollo técnico',
    categories: ['frontend', 'backend', 'mobile', 'blockchain', 'ai', 'defi', 'nft', 'performance', 'testing', 'infrastructure'],
  },
  documentation: {
    emoji: '📚',
    label: 'Documentation',
    labelEs: 'Documentación',
    color: '#10B981', // emerald-500
    description: 'Written content and educational materials',
    descriptionEs: 'Contenido escrito y materiales educativos',
    categories: ['documentation', 'localization', 'academy'],
  },
  design: {
    emoji: '🎨',
    label: 'Design',
    labelEs: 'Diseño',
    color: '#F59E0B', // amber-500
    description: 'UI/UX, branding, and multimedia',
    descriptionEs: 'UI/UX, branding y multimedia',
    categories: ['design', 'branding', 'multimedia'],
  },
  community: {
    emoji: '👥',
    label: 'Community',
    labelEs: 'Comunidad',
    color: '#EC4899', // pink-500
    description: 'Engagement and community growth',
    descriptionEs: 'Engagement y crecimiento de la comunidad',
    categories: ['social', 'notifications', 'gamification', 'support'],
  },
  governance: {
    emoji: '🏛️',
    label: 'Governance',
    labelEs: 'Gobernanza',
    color: '#8B5CF6', // violet-500
    description: 'DAO and operational decisions',
    descriptionEs: 'DAO y decisiones operacionales',
    categories: ['governance', 'treasury', 'compliance', 'analytics'],
  },
  operations: {
    emoji: '🔧',
    label: 'Operations',
    labelEs: 'Operaciones',
    color: '#6366F1', // indigo-500
    description: 'Integrations and automation',
    descriptionEs: 'Integraciones y automatización',
    categories: ['integration', 'automation', 'algorithm', 'search', 'security'],
  },
} as const

// =====================================================
// 📂 CATEGORIES CONFIGURATION (25 Categories)
// =====================================================

export interface CategoryConfig {
  domain: TaskDomain
  emoji: string
  label: string
  labelEs: string
  description: string
  descriptionEs: string
}

export const TASK_CATEGORIES: Record<TaskCategory, CategoryConfig> = {
  // Development domain (10 categories)
  frontend: {
    domain: 'development',
    emoji: '🖥️',
    label: 'Frontend',
    labelEs: 'Frontend',
    description: 'UI Components, Pages, Styling',
    descriptionEs: 'Componentes UI, Páginas, Estilos',
  },
  backend: {
    domain: 'development',
    emoji: '⚙️',
    label: 'Backend',
    labelEs: 'Backend',
    description: 'APIs, Services, Database',
    descriptionEs: 'APIs, Servicios, Base de Datos',
  },
  mobile: {
    domain: 'development',
    emoji: '📱',
    label: 'Mobile',
    labelEs: 'Móvil',
    description: 'React Native, PWA, Mobile Apps',
    descriptionEs: 'React Native, PWA, Apps Móviles',
  },
  blockchain: {
    domain: 'development',
    emoji: '⛓️',
    label: 'Blockchain',
    labelEs: 'Blockchain',
    description: 'Smart Contracts, Web3 Integration',
    descriptionEs: 'Contratos Inteligentes, Integración Web3',
  },
  ai: {
    domain: 'development',
    emoji: '🤖',
    label: 'AI',
    labelEs: 'IA',
    description: 'ML Models, Agents, RAG Systems',
    descriptionEs: 'Modelos ML, Agentes, Sistemas RAG',
  },
  defi: {
    domain: 'development',
    emoji: '💰',
    label: 'DeFi',
    labelEs: 'DeFi',
    description: 'Swaps, Pools, Vaults, Yield',
    descriptionEs: 'Swaps, Pools, Vaults, Yield',
  },
  nft: {
    domain: 'development',
    emoji: '🎨',
    label: 'NFT',
    labelEs: 'NFT',
    description: 'ERC-721, ERC-1155, Metadata',
    descriptionEs: 'ERC-721, ERC-1155, Metadata',
  },
  performance: {
    domain: 'development',
    emoji: '⚡',
    label: 'Performance',
    labelEs: 'Rendimiento',
    description: 'Optimization, Caching, Speed',
    descriptionEs: 'Optimización, Caché, Velocidad',
  },
  testing: {
    domain: 'development',
    emoji: '🧪',
    label: 'Testing',
    labelEs: 'Testing',
    description: 'Unit, E2E, Security Tests',
    descriptionEs: 'Tests Unitarios, E2E, Seguridad',
  },
  infrastructure: {
    domain: 'development',
    emoji: '🏗️',
    label: 'Infrastructure',
    labelEs: 'Infraestructura',
    description: 'DevOps, CI/CD, Monitoring',
    descriptionEs: 'DevOps, CI/CD, Monitoreo',
  },

  // Documentation domain (3 categories)
  documentation: {
    domain: 'documentation',
    emoji: '📝',
    label: 'Documentation',
    labelEs: 'Documentación',
    description: 'Technical Docs, API Refs',
    descriptionEs: 'Docs Técnicos, Refs API',
  },
  localization: {
    domain: 'documentation',
    emoji: '🌍',
    label: 'Localization',
    labelEs: 'Localización',
    description: 'i18n, Translations',
    descriptionEs: 'i18n, Traducciones',
  },
  academy: {
    domain: 'documentation',
    emoji: '🎓',
    label: 'Academy',
    labelEs: 'Academia',
    description: 'Courses, Tutorials, Guides',
    descriptionEs: 'Cursos, Tutoriales, Guías',
  },

  // Design domain (3 categories)
  design: {
    domain: 'design',
    emoji: '🎨',
    label: 'Design',
    labelEs: 'Diseño',
    description: 'UI/UX, Mockups, Prototypes',
    descriptionEs: 'UI/UX, Mockups, Prototipos',
  },
  branding: {
    domain: 'design',
    emoji: '🏷️',
    label: 'Branding',
    labelEs: 'Branding',
    description: 'Logos, Brand Assets',
    descriptionEs: 'Logos, Activos de Marca',
  },
  multimedia: {
    domain: 'design',
    emoji: '🎬',
    label: 'Multimedia',
    labelEs: 'Multimedia',
    description: 'Videos, Animations, Graphics',
    descriptionEs: 'Videos, Animaciones, Gráficos',
  },

  // Community domain (4 categories)
  social: {
    domain: 'community',
    emoji: '📢',
    label: 'Social',
    labelEs: 'Social',
    description: 'Twitter, Discord, Content',
    descriptionEs: 'Twitter, Discord, Contenido',
  },
  notifications: {
    domain: 'community',
    emoji: '🔔',
    label: 'Notifications',
    labelEs: 'Notificaciones',
    description: 'Emails, Push, Webhooks',
    descriptionEs: 'Emails, Push, Webhooks',
  },
  gamification: {
    domain: 'community',
    emoji: '🎮',
    label: 'Gamification',
    labelEs: 'Gamificación',
    description: 'Badges, Leaderboards, Quests',
    descriptionEs: 'Insignias, Clasificaciones, Misiones',
  },
  support: {
    domain: 'community',
    emoji: '🆘',
    label: 'Support',
    labelEs: 'Soporte',
    description: 'Help Desk, FAQ, Troubleshooting',
    descriptionEs: 'Mesa de Ayuda, FAQ, Solución de Problemas',
  },

  // Governance domain (4 categories)
  governance: {
    domain: 'governance',
    emoji: '🗳️',
    label: 'Governance',
    labelEs: 'Gobernanza',
    description: 'Proposals, Voting, DAO',
    descriptionEs: 'Propuestas, Votación, DAO',
  },
  treasury: {
    domain: 'governance',
    emoji: '💎',
    label: 'Treasury',
    labelEs: 'Tesorería',
    description: 'Budgets, Allocations, Reports',
    descriptionEs: 'Presupuestos, Asignaciones, Reportes',
  },
  compliance: {
    domain: 'governance',
    emoji: '⚖️',
    label: 'Compliance',
    labelEs: 'Cumplimiento',
    description: 'Legal, Audit, KYC',
    descriptionEs: 'Legal, Auditoría, KYC',
  },
  analytics: {
    domain: 'governance',
    emoji: '📊',
    label: 'Analytics',
    labelEs: 'Analíticas',
    description: 'Dashboards, Metrics, Reports',
    descriptionEs: 'Dashboards, Métricas, Reportes',
  },

  // Operations domain (5 categories)
  integration: {
    domain: 'operations',
    emoji: '🔌',
    label: 'Integration',
    labelEs: 'Integración',
    description: 'Third-party, APIs, Plugins',
    descriptionEs: 'Terceros, APIs, Plugins',
  },
  automation: {
    domain: 'operations',
    emoji: '🤖',
    label: 'Automation',
    labelEs: 'Automatización',
    description: 'Bots, Scripts, Cron Jobs',
    descriptionEs: 'Bots, Scripts, Cron Jobs',
  },
  algorithm: {
    domain: 'operations',
    emoji: '🧮',
    label: 'Algorithm',
    labelEs: 'Algoritmo',
    description: 'Reward Calc, Matching, ML',
    descriptionEs: 'Cálculo de Rewards, Matching, ML',
  },
  search: {
    domain: 'operations',
    emoji: '🔍',
    label: 'Search',
    labelEs: 'Búsqueda',
    description: 'Indexing, Elastic, Vector',
    descriptionEs: 'Indexación, Elastic, Vector',
  },
  security: {
    domain: 'operations',
    emoji: '🔐',
    label: 'Security',
    labelEs: 'Seguridad',
    description: 'Audits, Penetration, Access',
    descriptionEs: 'Auditorías, Penetración, Acceso',
  },
} as const

// =====================================================
// 🏷️ TASK TYPES CONFIGURATION (10 Types)
// =====================================================

export interface TaskTypeConfig {
  emoji: string
  label: string
  labelEs: string
  description: string
  descriptionEs: string
  typicalDays: { min: number; max: number }
}

export const TASK_TYPES: Record<TaskType, TaskTypeConfig> = {
  feature: {
    emoji: '✨',
    label: 'New Feature',
    labelEs: 'Nueva Función',
    description: 'Add new functionality',
    descriptionEs: 'Agregar nueva funcionalidad',
    typicalDays: { min: 3, max: 14 },
  },
  bugfix: {
    emoji: '🐛',
    label: 'Bug Fix',
    labelEs: 'Corrección de Bug',
    description: 'Fix errors and issues',
    descriptionEs: 'Corregir errores y problemas',
    typicalDays: { min: 1, max: 3 },
  },
  refactor: {
    emoji: '♻️',
    label: 'Refactor',
    labelEs: 'Refactorización',
    description: 'Improve existing code',
    descriptionEs: 'Mejorar código existente',
    typicalDays: { min: 2, max: 7 },
  },
  research: {
    emoji: '🔬',
    label: 'Research',
    labelEs: 'Investigación',
    description: 'Research and POC',
    descriptionEs: 'Investigación y POC',
    typicalDays: { min: 1, max: 5 },
  },
  design: {
    emoji: '🎨',
    label: 'Design',
    labelEs: 'Diseño',
    description: 'UI/UX design work',
    descriptionEs: 'Trabajo de diseño UI/UX',
    typicalDays: { min: 2, max: 5 },
  },
  content: {
    emoji: '📝',
    label: 'Content',
    labelEs: 'Contenido',
    description: 'Create content and docs',
    descriptionEs: 'Crear contenido y docs',
    typicalDays: { min: 1, max: 3 },
  },
  review: {
    emoji: '👀',
    label: 'Review',
    labelEs: 'Revisión',
    description: 'Review and audit',
    descriptionEs: 'Revisión y auditoría',
    typicalDays: { min: 1, max: 2 },
  },
  setup: {
    emoji: '⚙️',
    label: 'Setup',
    labelEs: 'Configuración',
    description: 'Configuration and setup',
    descriptionEs: 'Configuración e instalación',
    typicalDays: { min: 0.5, max: 2 },
  },
  migration: {
    emoji: '📦',
    label: 'Migration',
    labelEs: 'Migración',
    description: 'Data or code migration',
    descriptionEs: 'Migración de datos o código',
    typicalDays: { min: 2, max: 7 },
  },
  integration: {
    emoji: '🔌',
    label: 'Integration',
    labelEs: 'Integración',
    description: 'System integration',
    descriptionEs: 'Integración de sistemas',
    typicalDays: { min: 3, max: 10 },
  },
} as const

// =====================================================
// 🎚️ COMPLEXITY LEVELS CONFIGURATION (10 Levels)
// =====================================================

export interface ComplexityConfig {
  level: TaskComplexityLevel
  range: { min: number; max: number }
  cgcRange: { min: number; max: number }
  daysRange: { min: number; max: number }
  label: string
  labelEs: string
  description: string
  color: string
}

export const COMPLEXITY_LEVELS: ComplexityConfig[] = [
  {
    level: 'trivial',
    range: { min: 1, max: 2 },
    cgcRange: { min: 200, max: 400 },
    daysRange: { min: 0.5, max: 1 },
    label: 'Trivial',
    labelEs: 'Trivial',
    description: 'Config changes, typos, simple updates',
    color: '#22C55E', // green-500
  },
  {
    level: 'simple',
    range: { min: 3, max: 4 },
    cgcRange: { min: 400, max: 900 },
    daysRange: { min: 1, max: 3 },
    label: 'Simple',
    labelEs: 'Simple',
    description: 'Single component, basic features',
    color: '#84CC16', // lime-500
  },
  {
    level: 'medium',
    range: { min: 5, max: 6 },
    cgcRange: { min: 900, max: 1750 },
    daysRange: { min: 3, max: 7 },
    label: 'Medium',
    labelEs: 'Medio',
    description: 'Multi-component, moderate logic',
    color: '#EAB308', // yellow-500
  },
  {
    level: 'high',
    range: { min: 7, max: 8 },
    cgcRange: { min: 1750, max: 3750 },
    daysRange: { min: 7, max: 14 },
    label: 'High',
    labelEs: 'Alto',
    description: 'System-level, complex integration',
    color: '#F97316', // orange-500
  },
  {
    level: 'critical',
    range: { min: 9, max: 10 },
    cgcRange: { min: 3750, max: 7500 },
    daysRange: { min: 14, max: 28 },
    label: 'Critical',
    labelEs: 'Crítico',
    description: 'Cross-system, security-critical',
    color: '#EF4444', // red-500
  },
  {
    level: 'epic',
    range: { min: 10, max: 12 },
    cgcRange: { min: 7500, max: 12500 },
    daysRange: { min: 28, max: 42 },
    label: 'Epic',
    labelEs: 'Épico',
    description: 'Protocol-level, architectural',
    color: '#A855F7', // purple-500
  },
]

// =====================================================
// 🔧 UTILITY FUNCTIONS
// =====================================================

/**
 * Get domain for a given category
 */
export function getDomainForCategory(category: TaskCategory): TaskDomain {
  return TASK_CATEGORIES[category]?.domain || 'development'
}

/**
 * Get all categories for a domain
 */
export function getCategoriesForDomain(domain: TaskDomain): TaskCategory[] {
  return TASK_DOMAINS[domain]?.categories || []
}

/**
 * Get complexity config for a complexity level
 */
export function getComplexityConfig(complexity: number): ComplexityConfig {
  return (
    COMPLEXITY_LEVELS.find(
      (c) => complexity >= c.range.min && complexity <= c.range.max
    ) || COMPLEXITY_LEVELS[0]
  )
}

/**
 * Get domain display info
 */
export function getDomainDisplay(domain: TaskDomain, locale: 'en' | 'es' = 'en') {
  const config = TASK_DOMAINS[domain]
  return {
    emoji: config.emoji,
    label: locale === 'es' ? config.labelEs : config.label,
    color: config.color,
  }
}

/**
 * Get category display info
 */
export function getCategoryDisplay(category: TaskCategory, locale: 'en' | 'es' = 'en') {
  const config = TASK_CATEGORIES[category]
  return {
    emoji: config.emoji,
    label: locale === 'es' ? config.labelEs : config.label,
    domain: config.domain,
  }
}

/**
 * Get task type display info
 */
export function getTaskTypeDisplay(type: TaskType, locale: 'en' | 'es' = 'en') {
  const config = TASK_TYPES[type]
  return {
    emoji: config.emoji,
    label: locale === 'es' ? config.labelEs : config.label,
  }
}

/**
 * Calculate CGC reward based on complexity
 */
export function calculateCgcReward(complexity: number): number {
  const config = getComplexityConfig(complexity)
  const range = config.cgcRange
  // Linear interpolation within the range
  const normalizedComplexity = (complexity - config.range.min) / (config.range.max - config.range.min)
  return Math.round(range.min + normalizedComplexity * (range.max - range.min))
}

/**
 * Get all domains as array for iteration
 */
export function getAllDomains(): { key: TaskDomain; config: DomainConfig }[] {
  return Object.entries(TASK_DOMAINS).map(([key, config]) => ({
    key: key as TaskDomain,
    config,
  }))
}

/**
 * Get all categories as array for iteration
 */
export function getAllCategories(): { key: TaskCategory; config: CategoryConfig }[] {
  return Object.entries(TASK_CATEGORIES).map(([key, config]) => ({
    key: key as TaskCategory,
    config,
  }))
}

/**
 * Get all task types as array for iteration
 */
export function getAllTaskTypes(): { key: TaskType; config: TaskTypeConfig }[] {
  return Object.entries(TASK_TYPES).map(([key, config]) => ({
    key: key as TaskType,
    config,
  }))
}

// =====================================================
// 📤 EXPORTS
// =====================================================

export default {
  TASK_DOMAINS,
  TASK_CATEGORIES,
  TASK_TYPES,
  COMPLEXITY_LEVELS,
  getDomainForCategory,
  getCategoriesForDomain,
  getComplexityConfig,
  getDomainDisplay,
  getCategoryDisplay,
  getTaskTypeDisplay,
  calculateCgcReward,
  getAllDomains,
  getAllCategories,
  getAllTaskTypes,
}
