/**
 * 📋 Seed Grant Applications Data
 *
 * Inserta registros de grants completados y pendientes
 * Ejecutar: npx ts-node scripts/seed-grant-applications.ts
 */

import { createClient } from '@supabase/supabase-js'

// Variables de entorno para Supabase DAO
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_DAO_URL || process.env.SUPABASE_DAO_URL || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_DAO_SERVICE_KEY || ''

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Variables de entorno no configuradas')
  console.error('   Necesitas: NEXT_PUBLIC_SUPABASE_DAO_URL y SUPABASE_DAO_SERVICE_KEY')
  process.exit(1)
}

const DEPLOYER_WALLET = '0xc655BF2Bd9AfA997c757Bef290A9Bb6ca41c5dE6'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

interface GrantRecord {
  platform_name: string
  program_name?: string
  application_url: string
  project_url?: string
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'funded' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'critical'
  submitted_at?: string
  description?: string
  requested_amount?: number
  requested_currency?: string
  tags?: string[]
  category?: string
  notes?: {
    summary?: string
    actions_taken?: string[]
    next_steps?: string[]
  }
  created_by: string
}

const grantApplications: GrantRecord[] = [
  // ========================================
  // ✅ COMPLETADOS - ACTIVOS RECIBIENDO DONACIONES
  // ========================================
  {
    platform_name: 'Giveth',
    program_name: 'Giveth Donations',
    application_url: 'https://giveth.io/project/cryptogift-wallets-dao',
    project_url: 'https://giveth.io/project/cryptogift-wallets-dao',
    status: 'funded',
    priority: 'high',
    submitted_at: '2025-12-01T00:00:00Z',
    description: 'Plataforma de donaciones sin comisiones. Proyecto publicado y activo.',
    tags: ['donations', 'crowdfunding', 'zero-fees'],
    category: 'Crowdfunding',
    notes: {
      summary: 'Proyecto activo en Giveth - recibiendo donaciones sin fees',
      actions_taken: ['Perfil creado', 'Descripción completa', 'Logo actualizado', 'Links verificados'],
      next_steps: ['Promocionar en redes', 'Solicitar a comunidad que done']
    },
    created_by: DEPLOYER_WALLET
  },
  {
    platform_name: 'Juicebox',
    program_name: 'Juicebox v5 - Optimism',
    application_url: 'https://juicebox.money/v5/op:66',
    project_url: 'https://juicebox.money/v5/op:66',
    status: 'funded',
    priority: 'high',
    submitted_at: '2025-12-20T00:00:00Z',
    description: 'Proyecto #66 en Optimism. Treasury activo para donaciones.',
    tags: ['treasury', 'optimism', 'l2'],
    category: 'Crowdfunding',
    notes: {
      summary: 'Treasury multi-chain configurado - Optimism Project #66',
      actions_taken: ['Proyecto creado', 'Configuración completa', 'NFTs habilitados'],
      next_steps: ['Conectar con Discord para alerts', 'Marketing para contributors']
    },
    created_by: DEPLOYER_WALLET
  },
  {
    platform_name: 'Juicebox',
    program_name: 'Juicebox v5 - Base',
    application_url: 'https://juicebox.money/v5/base:126',
    project_url: 'https://juicebox.money/v5/base:126',
    status: 'funded',
    priority: 'high',
    submitted_at: '2025-12-20T00:00:00Z',
    description: 'Proyecto #126 en Base. Treasury principal en nuestra red core.',
    tags: ['treasury', 'base', 'l2', 'main'],
    category: 'Crowdfunding',
    notes: {
      summary: 'Treasury principal en Base - Project #126',
      actions_taken: ['Proyecto creado', 'Configuración completa', 'Links actualizados en docs'],
      next_steps: ['Priorizar este treasury para donaciones en Base']
    },
    created_by: DEPLOYER_WALLET
  },
  {
    platform_name: 'Juicebox',
    program_name: 'Juicebox v5 - Ethereum',
    application_url: 'https://juicebox.money/v5/eth:61',
    project_url: 'https://juicebox.money/v5/eth:61',
    status: 'funded',
    priority: 'medium',
    submitted_at: '2025-12-20T00:00:00Z',
    description: 'Proyecto #61 en Ethereum Mainnet. Para donantes en L1.',
    tags: ['treasury', 'ethereum', 'mainnet'],
    category: 'Crowdfunding',
    notes: {
      summary: 'Treasury en Ethereum L1 - Project #61',
      actions_taken: ['Proyecto creado', 'Configuración completa'],
      next_steps: ['Secundario - priorizar Base y Optimism']
    },
    created_by: DEPLOYER_WALLET
  },
  {
    platform_name: 'Juicebox',
    program_name: 'Juicebox v5 - Arbitrum',
    application_url: 'https://juicebox.money/v5/arb:67',
    project_url: 'https://juicebox.money/v5/arb:67',
    status: 'funded',
    priority: 'medium',
    submitted_at: '2025-12-20T00:00:00Z',
    description: 'Proyecto #67 en Arbitrum. Cobertura multi-chain completa.',
    tags: ['treasury', 'arbitrum', 'l2'],
    category: 'Crowdfunding',
    notes: {
      summary: 'Treasury en Arbitrum - Project #67',
      actions_taken: ['Proyecto creado', 'Configuración completa'],
      next_steps: ['Secundario - complementa red multi-chain']
    },
    created_by: DEPLOYER_WALLET
  },

  // ========================================
  // 📤 ENVIADOS - ESPERANDO RESPUESTA
  // ========================================
  {
    platform_name: 'Base',
    program_name: 'Base Builder Grants',
    application_url: 'https://paragraph.com/@grants.base.eth/calling-based-builders',
    project_url: 'https://mbxarts.com',
    status: 'submitted',
    priority: 'critical',
    submitted_at: '2025-12-15T00:00:00Z',
    requested_amount: 3,
    requested_currency: 'ETH',
    description: 'Grant retroactivo 1-5 ETH para builders en Base. Alta probabilidad.',
    tags: ['base', 'builder', 'retroactive', 'high-priority'],
    category: 'Ecosystem Grant',
    notes: {
      summary: 'Aplicación enviada a Base Builder Grants - esperando respuesta (1-4 semanas típico)',
      actions_taken: [
        'Formulario completado',
        'GitHub link incluido',
        'Todos los contratos verificados en BaseScan',
        'Demo URL proporcionado'
      ],
      next_steps: ['Esperar respuesta', 'Preparar call de seguimiento si contactan', 'Monitorear email']
    },
    created_by: DEPLOYER_WALLET
  },

  // ========================================
  // 🔄 DRAFT - REQUIERE ACCIÓN MANUAL URGENTE
  // ========================================
  {
    platform_name: 'Talent Protocol',
    program_name: 'Builder Score Weekly Rewards',
    application_url: 'https://www.builderscore.xyz/',
    project_url: 'https://www.talentprotocol.com/builder-score',
    status: 'draft',
    priority: 'critical',
    requested_amount: 2,
    requested_currency: 'ETH',
    description: '2 ETH semanales para top builders. REQUIERE: Basename + Farcaster + Score 100+',
    tags: ['weekly', 'recurring', 'builder-score', 'urgent-setup'],
    category: 'Weekly Rewards',
    notes: {
      summary: '🚨 ACCIÓN MANUAL URGENTE - Setup de credenciales para Weekly Rewards',
      actions_taken: [],
      next_steps: [
        '1. Registrar Basename en base.org/names',
        '2. Crear cuenta Farcaster y verificar',
        '3. Conectar wallet en talentprotocol.com/builder-score',
        '4. Mint Passport Onchain (+15-20 pts)',
        '5. Conectar GitHub (+20-30 pts)',
        '6. Alcanzar Score 100+ para elegibilidad'
      ]
    },
    created_by: DEPLOYER_WALLET
  },
  {
    platform_name: 'Optimism',
    program_name: 'Optimism RetroPGF / Atlas',
    application_url: 'https://atlas.optimism.io/',
    project_url: 'https://retrofunding.optimism.io/',
    status: 'draft',
    priority: 'high',
    requested_amount: 50000,
    requested_currency: 'USD',
    description: 'Retroactive Public Goods Funding $10K-$500K+. Registrar proyecto en Atlas.',
    tags: ['retropgf', 'superchain', 'high-value', 'public-goods'],
    category: 'Retroactive Funding',
    notes: {
      summary: '🔴 ACCIÓN MANUAL - Crear perfil en Optimism Atlas',
      actions_taken: [],
      next_steps: [
        '1. Crear cuenta en atlas.optimism.io',
        '2. Registrar proyecto CryptoGift Wallets DAO',
        '3. Documentar impacto en Superchain (Base es parte)',
        '4. Conectar GitHub contributions',
        '5. Preparar para próxima ronda RetroPGF'
      ]
    },
    created_by: DEPLOYER_WALLET
  },
  {
    platform_name: 'Coinbase',
    program_name: 'Gasless Campaign (CDP)',
    application_url: 'https://docs.google.com/forms/d/1yPnBFW0bVUNLUN_w3ctCqYM9sjdIQO3Typ53KXlsS5g/',
    project_url: 'https://www.coinbase.com/developer-platform',
    status: 'draft',
    priority: 'high',
    requested_amount: 15000,
    requested_currency: 'USD',
    description: 'Créditos gasless $10K-$16K. Requiere integrar Base Account + CDP Paymaster.',
    tags: ['gasless', 'coinbase', 'paymaster', 'integration-required'],
    category: 'Infrastructure Credits',
    notes: {
      summary: '🟡 ACCIÓN TÉCNICA - Integrar Coinbase Smart Wallet para aplicar',
      actions_taken: [],
      next_steps: [
        '1. Registrar en coinbase.com/developer-platform',
        '2. Integrar Base Account (Coinbase Smart Wallet) en app',
        '3. Configurar CDP Paymaster',
        '4. Completar formulario de aplicación',
        '5. Créditos llegan en ~1 semana después de aprobación'
      ]
    },
    created_by: DEPLOYER_WALLET
  },
  {
    platform_name: 'Gitcoin',
    program_name: 'Gitcoin Grants GG25',
    application_url: 'https://grants.gitcoin.co/',
    status: 'draft',
    priority: 'medium',
    requested_amount: 10000,
    requested_currency: 'USD',
    description: 'Quadratic Funding Q1 2026. Preparar perfil ahora, aplicar cuando abra ronda.',
    tags: ['quadratic-funding', 'community', 'q1-2026'],
    category: 'Community Grants',
    notes: {
      summary: '⏰ PREPARAR AHORA - Crear perfil para próxima ronda GG25 (Q1 2026)',
      actions_taken: [],
      next_steps: [
        '1. Crear cuenta en grants.gitcoin.co',
        '2. Configurar perfil de proyecto',
        '3. Conectar GitHub y redes sociales',
        '4. Esperar anuncio de GG25',
        '5. Aplicar a categoría Education/Infrastructure/Base'
      ]
    },
    created_by: DEPLOYER_WALLET
  },
  {
    platform_name: 'Base',
    program_name: 'Base Batches 003',
    application_url: 'https://www.basebatches.xyz/',
    status: 'draft',
    priority: 'medium',
    description: 'Aceleradora Base con mentorship + funding. Próximo cohort H1 2026.',
    tags: ['accelerator', 'mentorship', 'h1-2026'],
    category: 'Accelerator',
    notes: {
      summary: '⏰ PREPARAR - Base Batches 003 abre H1 2026',
      actions_taken: [],
      next_steps: [
        '1. Preparar pitch deck de 10-15 slides',
        '2. Crear video demo de 2 minutos',
        '3. Documentar métricas de tracción',
        '4. Esperar apertura de aplicaciones',
        '5. Aplicar temprano cuando abra'
      ]
    },
    created_by: DEPLOYER_WALLET
  }
]

async function seedGrantApplications() {
  console.log('🚀 Iniciando seed de Grant Applications...\n')

  // Primero eliminar registros existentes para evitar duplicados
  const { error: deleteError } = await supabase
    .from('grant_applications')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000') // Elimina todos

  if (deleteError) {
    console.log('⚠️  No se pudieron eliminar registros existentes (puede que no existan):', deleteError.message)
  } else {
    console.log('✅ Registros anteriores limpiados\n')
  }

  // Insertar nuevos registros
  for (const grant of grantApplications) {
    const { data, error } = await supabase
      .from('grant_applications')
      .insert(grant)
      .select()
      .single()

    if (error) {
      console.log(`❌ Error insertando ${grant.platform_name} - ${grant.program_name}:`, error.message)
    } else {
      const statusEmoji = {
        'funded': '✅',
        'submitted': '📤',
        'draft': '🔄',
        'under_review': '👀',
        'approved': '🎉',
        'rejected': '❌',
        'completed': '🏆',
        'cancelled': '🚫'
      }
      console.log(`${statusEmoji[grant.status] || '📋'} ${grant.platform_name} - ${grant.program_name}: ${grant.status.toUpperCase()}`)
    }
  }

  console.log('\n✨ Seed completado!')
  console.log(`📊 Total registros: ${grantApplications.length}`)
  console.log(`   - Funded/Activos: ${grantApplications.filter(g => g.status === 'funded').length}`)
  console.log(`   - Submitted: ${grantApplications.filter(g => g.status === 'submitted').length}`)
  console.log(`   - Draft (pendientes): ${grantApplications.filter(g => g.status === 'draft').length}`)
}

seedGrantApplications()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error fatal:', err)
    process.exit(1)
  })
