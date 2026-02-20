'use client';

import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Check,
  Copy,
  ExternalLink,
  Droplets,
  TrendingUp,
  Twitter,
  MessageCircle,
  Users,
  Zap,
  Target,
  Clock,
  DollarSign,
  Bot,
  AlertCircle,
  CheckCircle2,
  Circle,
  ArrowRight,
  Sparkles,
  Globe,
  Shield,
  Rocket,
  BarChart3,
  Calendar,
  FileText,
  Download,
  Settings,
  Lightbulb,
  Hash,
  Send
} from 'lucide-react';

// Import Post Ideas Data
import {
  twitterWeeklyContent,
  discordContent,
  farcasterContent,
  contentStats,
  type PostIdea,
  type DayContent
} from './PostIdeasData';

// ===== TIPOS =====
interface RoadmapStep {
  phase: string;
  title: string;
  duration: string;
  tasks: {
    task: string;
    automatable: 'full' | 'partial' | 'manual';
    priority: 'critical' | 'high' | 'medium' | 'low';
    details?: string;
  }[];
  metrics: string[];
  resources?: string;
}

interface StrategySection {
  id: string;
  title: string;
  titleEs: string;
  icon: React.ReactNode;
  color: string;
  currentState: { es: string; en: string };
  targetState: { es: string; en: string };
  roadmap: RoadmapStep[];
  scripts?: { name: string; code: string; description: string }[];
  templates?: { name: string; content: string; contentEn: string }[];
  resources: { name: string; url: string; type: string }[];
}

// ===== DATOS DEL PLAN =====
const strategySections: StrategySection[] = [
  // ===== 1. LIQUIDEZ =====
  {
    id: 'liquidity',
    title: 'Liquidity Strategy',
    titleEs: 'Estrategia de Liquidez',
    icon: <Droplets className="w-5 h-5" />,
    color: 'blue',
    currentState: {
      es: 'Pool Aerodrome: ~$100 (4,200 CGC + 0.03 WETH). Sin volumen de trading.',
      en: 'Aerodrome Pool: ~$100 (4,200 CGC + 0.03 WETH). No trading volume.'
    },
    targetState: {
      es: 'Liquidez mínima $10,000+ en múltiples pools. Volumen diario >$1,000. Market depth saludable.',
      en: 'Minimum $10,000+ liquidity across multiple pools. Daily volume >$1,000. Healthy market depth.'
    },
    roadmap: [
      {
        phase: 'Fase 1',
        title: 'Fundación de Liquidez',
        duration: '1-3 días',
        tasks: [
          { task: 'Auditar liquidez actual en Aerodrome', automatable: 'full', priority: 'critical', details: 'Revisar pool CGC/WETH existente' },
          { task: 'Calcular liquidez necesaria para CoinGecko ($5,000-10,000)', automatable: 'full', priority: 'critical' },
          { task: 'Preparar ETH adicional para añadir liquidez', automatable: 'manual', priority: 'critical' },
          { task: 'Añadir liquidez al pool Aerodrome existente', automatable: 'manual', priority: 'critical' },
          { task: 'Verificar que el pool aparece en GeckoTerminal', automatable: 'full', priority: 'high' }
        ],
        metrics: ['TVL del pool', 'Spread bid/ask', 'Profundidad de mercado'],
        resources: '$2,000-5,000 ETH equivalente'
      },
      {
        phase: 'Fase 2',
        title: 'Diversificación de Pools',
        duration: '1-2 semanas',
        tasks: [
          { task: 'Crear pool CGC/USDC en Aerodrome', automatable: 'partial', priority: 'high' },
          { task: 'Evaluar Uniswap V3 en Base para pool adicional', automatable: 'full', priority: 'medium' },
          { task: 'Configurar concentrated liquidity para mejor eficiencia', automatable: 'partial', priority: 'medium' },
          { task: 'Documentar todas las direcciones de pools', automatable: 'full', priority: 'high' }
        ],
        metrics: ['Número de pools activos', 'TVL total combinado', 'Volumen 24h agregado'],
        resources: '$3,000-5,000 adicionales'
      },
      {
        phase: 'Fase 3',
        title: 'Incentivos y Sostenibilidad',
        duration: '2-4 semanas',
        tasks: [
          { task: 'Explorar veAERO voting para dirigir emisiones al pool', automatable: 'partial', priority: 'medium' },
          { task: 'Considerar programa de LP rewards con CGC tokens', automatable: 'partial', priority: 'medium' },
          { task: 'Contactar liquidity providers potenciales de la comunidad', automatable: 'manual', priority: 'high' },
          { task: 'Implementar LP locking para mostrar compromiso (mín 6 meses)', automatable: 'manual', priority: 'high' }
        ],
        metrics: ['APR del pool', 'Retención de LPs', 'Volumen orgánico'],
        resources: 'CGC tokens para incentivos'
      },
      {
        phase: 'Fase 4',
        title: 'Escala y Optimización',
        duration: '1-3 meses',
        tasks: [
          { task: 'Implementar automated liquidity management (Mellow Protocol)', automatable: 'partial', priority: 'low' },
          { task: 'Explorar market makers profesionales', automatable: 'manual', priority: 'low' },
          { task: 'Considerar listing en CEX tier 3-4', automatable: 'manual', priority: 'low' },
          { task: 'Monitorear y rebalancear posiciones regularmente', automatable: 'partial', priority: 'medium' }
        ],
        metrics: ['Profundidad 2% spread', 'Slippage en trades grandes', 'Consistencia de volumen'],
        resources: 'Variable según crecimiento'
      }
    ],
    resources: [
      { name: 'Aerodrome Finance', url: 'https://aerodrome.finance', type: 'DEX' },
      { name: 'GeckoTerminal', url: 'https://www.geckoterminal.com/base/pools', type: 'Analytics' },
      { name: 'DeFiLlama', url: 'https://defillama.com/chain/Base', type: 'Analytics' },
      { name: 'Mellow Protocol', url: 'https://mellow.finance', type: 'Automated LP' }
    ]
  },

  // ===== 2. TWITTER/X =====
  {
    id: 'twitter',
    title: 'X/Twitter Strategy',
    titleEs: 'Estrategia X/Twitter',
    icon: <Twitter className="w-5 h-5" />,
    color: 'sky',
    currentState: {
      es: 'Cuenta @cryptogiftdao existe pero inactiva. Sin engagement. Sin contenido regular.',
      en: 'Account @cryptogiftdao exists but inactive. No engagement. No regular content.'
    },
    targetState: {
      es: '1,000+ seguidores orgánicos. Posts diarios. Engagement rate 3-5%. Comunidad activa.',
      en: '1,000+ organic followers. Daily posts. 3-5% engagement rate. Active community.'
    },
    roadmap: [
      {
        phase: 'Fase 1',
        title: 'Optimización de Perfil',
        duration: '1 día',
        tasks: [
          { task: 'Actualizar foto de perfil con logo CGC oficial', automatable: 'manual', priority: 'critical' },
          { task: 'Escribir bio optimizada (160 chars, propuesta de valor clara)', automatable: 'full', priority: 'critical' },
          { task: 'Añadir link a website (mbxarts.com)', automatable: 'manual', priority: 'critical' },
          { task: 'Configurar header/banner con branding', automatable: 'manual', priority: 'high' },
          { task: 'Pinned tweet con explicación del proyecto', automatable: 'full', priority: 'high' }
        ],
        metrics: ['Perfil completado 100%', 'Bio clara y atractiva'],
        resources: 'Assets de diseño existentes'
      },
      {
        phase: 'Fase 2',
        title: 'Estrategia de Contenido',
        duration: '1-2 semanas',
        tasks: [
          { task: 'Crear calendario de contenido (80% valor, 20% promo)', automatable: 'full', priority: 'critical' },
          { task: 'Escribir 30 tweets para primera semana', automatable: 'full', priority: 'critical' },
          { task: 'Preparar threads educativos sobre ERC-6551', automatable: 'full', priority: 'high' },
          { task: 'Crear templates de posts para diferentes categorías', automatable: 'full', priority: 'high' },
          { task: 'Configurar herramienta de scheduling (Buffer/Hypefury)', automatable: 'partial', priority: 'high' }
        ],
        metrics: ['Posts programados', 'Variedad de contenido'],
        resources: 'Herramienta de scheduling ~$20/mes'
      },
      {
        phase: 'Fase 3',
        title: 'Engagement Activo',
        duration: 'Continuo',
        tasks: [
          { task: 'Identificar 50 cuentas crypto relevantes para engagement', automatable: 'full', priority: 'critical' },
          { task: 'Responder a tweets relevantes diariamente (replies valen 27x más)', automatable: 'partial', priority: 'critical' },
          { task: 'Participar en Crypto Twitter spaces', automatable: 'manual', priority: 'high' },
          { task: 'Comentar en anuncios de Base/Coinbase/Optimism', automatable: 'partial', priority: 'high' },
          { task: 'Crear polls y contenido interactivo', automatable: 'full', priority: 'medium' }
        ],
        metrics: ['Replies por día', 'Menciones recibidas', 'Engagement rate'],
        resources: '1-2 horas diarias de engagement'
      },
      {
        phase: 'Fase 4',
        title: 'Crecimiento y Viralidad',
        duration: '1-3 meses',
        tasks: [
          { task: 'Colaboraciones con micro-influencers (5K-50K followers)', automatable: 'manual', priority: 'high' },
          { task: 'Giveaways de CGC tokens con engagement requirements', automatable: 'partial', priority: 'medium' },
          { task: 'Crear memes y contenido viral sobre Web3 education', automatable: 'full', priority: 'medium' },
          { task: 'Documentar building in public (desarrollo del proyecto)', automatable: 'full', priority: 'high' },
          { task: 'Implementar Twitter API bot para stats automáticas', automatable: 'full', priority: 'low' }
        ],
        metrics: ['Follower growth rate', 'Viral tweets', 'Brand mentions'],
        resources: 'Budget para influencers $500-2,000'
      }
    ],
    templates: [
      {
        name: 'Tweet de Bienvenida (Pinned)',
        content: `🎁 Bienvenido a CryptoGift Wallets DAO

Estamos construyendo el futuro de la educación Web3:

✅ Aprende blockchain desde cero
✅ Gana tokens CGC por completar quests
✅ Gobierna el protocolo con tu comunidad

Tu wallet NFT te espera 👇
https://mbxarts.com`,
        contentEn: `🎁 Welcome to CryptoGift Wallets DAO

We're building the future of Web3 education:

✅ Learn blockchain from scratch
✅ Earn CGC tokens by completing quests
✅ Govern the protocol with your community

Your NFT wallet awaits 👇
https://mbxarts.com`
      },
      {
        name: 'Thread Educativo ERC-6551',
        content: `🧵 ¿Qué es ERC-6551 y por qué cambia todo?

Un hilo sobre la tecnología que usamos en @cryptogiftdao:

1/7 ERC-6551 convierte CUALQUIER NFT en una wallet completa.

Imagina: tu NFT puede tener tokens, otros NFTs, y ejecutar transacciones.

🔽`,
        contentEn: `🧵 What is ERC-6551 and why does it change everything?

A thread about the technology we use at @cryptogiftdao:

1/7 ERC-6551 turns ANY NFT into a complete wallet.

Imagine: your NFT can hold tokens, other NFTs, and execute transactions.

🔽`
      },
      {
        name: 'Anuncio de Milestone',
        content: `🎉 MILESTONE COMPLETADO

[DESCRIPCIÓN DEL LOGRO]

Gracias a nuestra increíble comunidad por hacer esto posible.

Próximo objetivo: [SIGUIENTE META]

$CGC #Base #Web3 #DAO`,
        contentEn: `🎉 MILESTONE COMPLETED

[ACHIEVEMENT DESCRIPTION]

Thanks to our amazing community for making this possible.

Next goal: [NEXT TARGET]

$CGC #Base #Web3 #DAO`
      },
      {
        name: 'Daily Update',
        content: `📊 Update diario de @cryptogiftdao

🔹 [Desarrollo/noticia del día]
🔹 [Estadística relevante]
🔹 [Call to action]

¿Qué te gustaría ver mañana? 👇`,
        contentEn: `📊 Daily update from @cryptogiftdao

🔹 [Development/news of the day]
🔹 [Relevant stat]
🔹 [Call to action]

What would you like to see tomorrow? 👇`
      }
    ],
    resources: [
      { name: 'Twitter Developer Portal', url: 'https://developer.twitter.com', type: 'API' },
      { name: 'Buffer', url: 'https://buffer.com', type: 'Scheduling' },
      { name: 'Hypefury', url: 'https://hypefury.com', type: 'Scheduling' },
      { name: 'TweetDeck', url: 'https://tweetdeck.twitter.com', type: 'Management' }
    ]
  },

  // ===== 3. FARCASTER =====
  {
    id: 'farcaster',
    title: 'Farcaster Strategy',
    titleEs: 'Estrategia Farcaster',
    icon: <Globe className="w-5 h-5" />,
    color: 'purple',
    currentState: {
      es: 'Sin presencia en Farcaster/Warpcast. Oportunidad sin explotar en ecosistema Base.',
      en: 'No presence on Farcaster/Warpcast. Untapped opportunity in Base ecosystem.'
    },
    targetState: {
      es: 'Cuenta verificada en Warpcast. Frames interactivos. Comunidad activa. Integración con onchain.',
      en: 'Verified Warpcast account. Interactive Frames. Active community. Onchain integration.'
    },
    roadmap: [
      {
        phase: 'Fase 1',
        title: 'Establecer Presencia',
        duration: '1-2 días',
        tasks: [
          { task: 'Crear cuenta en Warpcast', automatable: 'manual', priority: 'critical' },
          { task: 'Verificar cuenta con onchain identity', automatable: 'manual', priority: 'high' },
          { task: 'Optimizar perfil con bio, links y avatar', automatable: 'partial', priority: 'critical' },
          { task: 'Unirse a canales relevantes: /base, /dao, /education, /defi', automatable: 'manual', priority: 'high' },
          { task: 'Primer cast presentando el proyecto', automatable: 'full', priority: 'high' }
        ],
        metrics: ['Cuenta creada y verificada', 'Canales unidos'],
        resources: 'Warps para storage (~$5-10)'
      },
      {
        phase: 'Fase 2',
        title: 'Estrategia de Contenido',
        duration: '1-2 semanas',
        tasks: [
          { task: 'Crear calendario de casts (1-3 diarios)', automatable: 'full', priority: 'high' },
          { task: 'Adaptar contenido de Twitter para Farcaster', automatable: 'full', priority: 'high' },
          { task: 'Participar activamente en /base channel', automatable: 'partial', priority: 'critical' },
          { task: 'Conectar con builders del ecosistema Base', automatable: 'manual', priority: 'high' },
          { task: 'Documentar desarrollo en /build', automatable: 'full', priority: 'medium' }
        ],
        metrics: ['Casts por día', 'Engagement (recasts, likes)', 'Followers'],
        resources: 'Tiempo de engagement diario'
      },
      {
        phase: 'Fase 3',
        title: 'Frames Interactivos',
        duration: '2-4 semanas',
        tasks: [
          { task: 'Desarrollar Frame básico de información del proyecto', automatable: 'full', priority: 'high' },
          { task: 'Crear Frame para verificar balance de CGC tokens', automatable: 'full', priority: 'high' },
          { task: 'Implementar Frame de quiz educativo con rewards', automatable: 'full', priority: 'medium' },
          { task: 'Frame de referidos integrado con sistema existente', automatable: 'full', priority: 'high' },
          { task: 'Explorar Frames v2 / Mini Apps cuando estén disponibles', automatable: 'partial', priority: 'low' }
        ],
        metrics: ['Frames deployados', 'Interacciones con Frames', 'Conversiones'],
        resources: 'Neynar API ($29/mes plan básico)'
      },
      {
        phase: 'Fase 4',
        title: 'Comunidad y Crecimiento',
        duration: '1-3 meses',
        tasks: [
          { task: 'Crear canal propio /cryptogift cuando sea posible', automatable: 'manual', priority: 'medium' },
          { task: 'Organizar AMAs y eventos en Farcaster', automatable: 'partial', priority: 'medium' },
          { task: 'Colaboraciones con otros proyectos Base', automatable: 'manual', priority: 'high' },
          { task: 'Implementar bot de posting automático vía Neynar', automatable: 'full', priority: 'medium' },
          { task: 'Airdrop exclusivo para usuarios de Farcaster', automatable: 'partial', priority: 'medium' }
        ],
        metrics: ['Followers', 'Channel members', 'Frame usage'],
        resources: 'CGC tokens para airdrops'
      }
    ],
    templates: [
      {
        name: 'Primer Cast (Introducción)',
        content: `gm /base 👋

Somos CryptoGift Wallets DAO - educación Web3 gamificada en Base.

🎁 NFT wallets con ERC-6551
🏛️ Gobernanza con Aragon OSx
🎯 Quests para aprender y ganar

Construyendo el onboarding más simple a crypto.

¿Preguntas? 👇`,
        contentEn: `gm /base 👋

We're CryptoGift Wallets DAO - gamified Web3 education on Base.

🎁 NFT wallets with ERC-6551
🏛️ Governance with Aragon OSx
🎯 Quests to learn and earn

Building the simplest crypto onboarding.

Questions? 👇`
      },
      {
        name: 'Building in Public',
        content: `🛠️ Build log #[NÚMERO]

Esta semana en @cryptogiftdao:

✅ [Logro 1]
✅ [Logro 2]
🔄 [En progreso]

Próxima semana: [Preview]

/base /build`,
        contentEn: `🛠️ Build log #[NUMBER]

This week at @cryptogiftdao:

✅ [Achievement 1]
✅ [Achievement 2]
🔄 [In progress]

Next week: [Preview]

/base /build`
      }
    ],
    resources: [
      { name: 'Warpcast', url: 'https://warpcast.com', type: 'Client' },
      { name: 'Neynar API', url: 'https://neynar.com', type: 'API' },
      { name: 'Farcaster Docs', url: 'https://docs.farcaster.xyz', type: 'Documentation' },
      { name: 'Frames Docs', url: 'https://docs.farcaster.xyz/reference/frames', type: 'Documentation' }
    ]
  },

  // ===== 4. DISCORD =====
  {
    id: 'discord',
    title: 'Discord Strategy',
    titleEs: 'Estrategia Discord',
    icon: <MessageCircle className="w-5 h-5" />,
    color: 'indigo',
    currentState: {
      es: 'Servidor configurado con estructura completa. Collab.Land instalado. Pocos miembros activos.',
      en: 'Server configured with complete structure. Collab.Land installed. Few active members.'
    },
    targetState: {
      es: '500+ miembros verificados. Comunidad activa diaria. Token gating funcionando. Engagement alto.',
      en: '500+ verified members. Daily active community. Token gating working. High engagement.'
    },
    roadmap: [
      {
        phase: 'Fase 1',
        title: 'Optimización del Servidor',
        duration: '1-2 días',
        tasks: [
          { task: 'Verificar que Collab.Land está correctamente configurado', automatable: 'partial', priority: 'critical' },
          { task: 'Configurar Token Gating Rules para roles de holder', automatable: 'partial', priority: 'critical' },
          { task: 'Añadir bots esenciales: MEE6, Carl-bot, Wick', automatable: 'partial', priority: 'high' },
          { task: 'Crear sistema de onboarding automatizado', automatable: 'full', priority: 'high' },
          { task: 'Configurar auto-roles y reaction roles', automatable: 'full', priority: 'high' }
        ],
        metrics: ['Bots configurados', 'Flujo de onboarding funcionando'],
        resources: 'Bots gratuitos + MEE6 Premium opcional'
      },
      {
        phase: 'Fase 2',
        title: 'Contenido y Engagement',
        duration: '1-2 semanas',
        tasks: [
          { task: 'Programar anuncios automáticos vía webhooks', automatable: 'full', priority: 'high' },
          { task: 'Crear sistema de daily GM/check-in con rewards', automatable: 'full', priority: 'medium' },
          { task: 'Implementar Zealy/Galxe para quests de Discord', automatable: 'partial', priority: 'high' },
          { task: 'Configurar Dead Chat Reviver para mantener actividad', automatable: 'full', priority: 'medium' },
          { task: 'Crear FAQs y recursos en canales dedicados', automatable: 'full', priority: 'high' }
        ],
        metrics: ['Mensajes por día', 'Usuarios activos diarios', 'Quest completions'],
        resources: 'Zealy gratuito, CGC para rewards'
      },
      {
        phase: 'Fase 3',
        title: 'Crecimiento de Comunidad',
        duration: '2-4 semanas',
        tasks: [
          { task: 'Campaña de invitación con rewards', automatable: 'partial', priority: 'high' },
          { task: 'Colaboraciones con otros servers de DAOs/Base', automatable: 'manual', priority: 'high' },
          { task: 'Hosting de eventos: AMAs, Town Halls, Game Nights', automatable: 'partial', priority: 'medium' },
          { task: 'Sistema de niveles y XP para engagement', automatable: 'full', priority: 'medium' },
          { task: 'Crear embajadores/moderadores de la comunidad', automatable: 'manual', priority: 'high' }
        ],
        metrics: ['Member growth rate', 'Retention', 'Event attendance'],
        resources: 'CGC tokens para incentivos'
      },
      {
        phase: 'Fase 4',
        title: 'Gobernanza y DAO',
        duration: '1-3 meses',
        tasks: [
          { task: 'Integrar Snapshot para votaciones desde Discord', automatable: 'partial', priority: 'medium' },
          { task: 'Canal de propuestas y discusión de governance', automatable: 'full', priority: 'medium' },
          { task: 'Bot de notificaciones para propuestas de Aragon', automatable: 'full', priority: 'high' },
          { task: 'Sistema de coordinapes/tips para contribuidores', automatable: 'partial', priority: 'low' },
          { task: 'Automatizar distribución de rewards por actividad', automatable: 'full', priority: 'medium' }
        ],
        metrics: ['Voting participation', 'Proposals submitted', 'Contributor rewards'],
        resources: 'Snapshot gratuito, bots custom'
      }
    ],
    scripts: [
      {
        name: 'Webhook de Anuncios',
        description: 'Script para enviar anuncios automáticos al canal de announcements',
        code: `// Discord Webhook - Enviar Anuncio
const WEBHOOK_URL = process.env.DISCORD_ANNOUNCEMENTS_WEBHOOK;

async function sendAnnouncement(title, description, color = 0x00FF00) {
  const embed = {
    title: title,
    description: description,
    color: color,
    timestamp: new Date().toISOString(),
    footer: { text: 'CryptoGift Wallets DAO' }
  };

  await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ embeds: [embed] })
  });
}

// Ejemplo de uso:
// sendAnnouncement('🎉 Nuevo Milestone', 'Hemos alcanzado 100 miembros!');`
      },
      {
        name: 'Daily Stats Bot',
        description: 'Publica estadísticas diarias del proyecto automáticamente',
        code: `// Daily Stats - Discord Webhook
const STATS_WEBHOOK = process.env.DISCORD_STATS_WEBHOOK;

async function postDailyStats() {
  const stats = await fetchProjectStats(); // Tu función de stats

  const embed = {
    title: '📊 Estadísticas Diarias',
    fields: [
      { name: 'Holders CGC', value: stats.holders, inline: true },
      { name: 'TVL Pools', value: stats.tvl, inline: true },
      { name: 'Miembros Discord', value: stats.members, inline: true }
    ],
    color: 0x5865F2,
    timestamp: new Date().toISOString()
  };

  await fetch(STATS_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ embeds: [embed] })
  });
}`
      }
    ],
    resources: [
      { name: 'Discord Developer Portal', url: 'https://discord.com/developers', type: 'API' },
      { name: 'Collab.Land', url: 'https://collab.land', type: 'Token Gating' },
      { name: 'Guild.xyz', url: 'https://guild.xyz', type: 'Token Gating' },
      { name: 'Zealy', url: 'https://zealy.io', type: 'Quests' },
      { name: 'MEE6', url: 'https://mee6.xyz', type: 'Bot' }
    ]
  },

  // ===== 5. TRADING VOLUME =====
  {
    id: 'volume',
    title: 'Trading Volume Strategy',
    titleEs: 'Estrategia de Volumen',
    icon: <TrendingUp className="w-5 h-5" />,
    color: 'green',
    currentState: {
      es: 'Volumen 24h: $0. Sin actividad de trading. Pool sin uso.',
      en: '24h Volume: $0. No trading activity. Unused pool.'
    },
    targetState: {
      es: 'Volumen diario consistente >$1,000. Trades orgánicos regulares. Spread saludable <1%.',
      en: 'Consistent daily volume >$1,000. Regular organic trades. Healthy spread <1%.'
    },
    roadmap: [
      {
        phase: 'Fase 1',
        title: 'Activación Inicial',
        duration: '1-3 días',
        tasks: [
          { task: 'Realizar primeros trades para activar el pool', automatable: 'manual', priority: 'critical' },
          { task: 'Documentar proceso de compra/venta para nuevos usuarios', automatable: 'full', priority: 'high' },
          { task: 'Crear tutorial de cómo comprar CGC en Aerodrome', automatable: 'full', priority: 'high' },
          { task: 'Verificar que el pool aparece en agregadores (1inch, etc)', automatable: 'full', priority: 'high' }
        ],
        metrics: ['Primer volumen registrado', 'Aparición en agregadores'],
        resources: 'ETH para trades iniciales'
      },
      {
        phase: 'Fase 2',
        title: 'Incentivos de Trading',
        duration: '1-2 semanas',
        tasks: [
          { task: 'Programa de trading rewards (bonus CGC por volumen)', automatable: 'partial', priority: 'high' },
          { task: 'Campaña "First 100 Traders" con rewards', automatable: 'partial', priority: 'high' },
          { task: 'Integrar widget de swap en website', automatable: 'full', priority: 'medium' },
          { task: 'Crear leaderboard de traders con rewards semanales', automatable: 'full', priority: 'medium' }
        ],
        metrics: ['Número de traders únicos', 'Volumen semanal', 'Spread promedio'],
        resources: 'CGC tokens para rewards'
      },
      {
        phase: 'Fase 3',
        title: 'Utilidad y Demanda',
        duration: '2-4 semanas',
        tasks: [
          { task: 'Lanzar sistema de staking de CGC', automatable: 'full', priority: 'high' },
          { task: 'Implementar rewards por participación en governance', automatable: 'full', priority: 'high' },
          { task: 'Crear NFTs exclusivos comprables con CGC', automatable: 'partial', priority: 'medium' },
          { task: 'Partnerships con otros proyectos para utilidad cruzada', automatable: 'manual', priority: 'medium' }
        ],
        metrics: ['Tokens staked', 'Velocidad de tokens', 'Demanda orgánica'],
        resources: 'Desarrollo de contratos adicionales'
      },
      {
        phase: 'Fase 4',
        title: 'Sostenibilidad',
        duration: '1-3 meses',
        tasks: [
          { task: 'Evaluar necesidad de market maker', automatable: 'manual', priority: 'low' },
          { task: 'Explorar listing en CEX pequeños para volumen adicional', automatable: 'manual', priority: 'low' },
          { task: 'Implementar métricas on-chain para tracking', automatable: 'full', priority: 'medium' },
          { task: 'Dashboard público de stats del token', automatable: 'full', priority: 'medium' }
        ],
        metrics: ['Volumen sostenido', 'Número de holders creciente', 'Distribución saludable'],
        resources: 'Variable según necesidad'
      }
    ],
    resources: [
      { name: 'DEX Screener', url: 'https://dexscreener.com', type: 'Analytics' },
      { name: 'GeckoTerminal', url: 'https://geckoterminal.com', type: 'Analytics' },
      { name: 'Defined.fi', url: 'https://defined.fi', type: 'Analytics' },
      { name: '1inch', url: 'https://1inch.io', type: 'Aggregator' }
    ]
  },

  // ===== 6. COINGECKO REAPPLICATION =====
  {
    id: 'coingecko',
    title: 'CoinGecko Reapplication',
    titleEs: 'Re-aplicación CoinGecko',
    icon: <Target className="w-5 h-5" />,
    color: 'yellow',
    currentState: {
      es: 'Rechazado por falta de liquidez, volumen y atención orgánica. Puede re-aplicar en 14 días.',
      en: 'Rejected due to lack of liquidity, volume, and organic attention. Can reapply in 14 days.'
    },
    targetState: {
      es: 'Listado en CoinGecko con market cap verificado, logo, y datos completos.',
      en: 'Listed on CoinGecko with verified market cap, logo, and complete data.'
    },
    roadmap: [
      {
        phase: 'Pre-requisitos',
        title: 'Cumplir Requisitos Mínimos',
        duration: '14 días',
        tasks: [
          { task: 'Alcanzar liquidez mínima $5,000-10,000 en pools', automatable: 'manual', priority: 'critical' },
          { task: 'Generar volumen diario consistente >$1,000', automatable: 'partial', priority: 'critical' },
          { task: 'Crecer comunidad: Twitter 500+, Discord 200+', automatable: 'partial', priority: 'critical' },
          { task: 'Verificar que pool aparece en GeckoTerminal correctamente', automatable: 'full', priority: 'critical' },
          { task: 'Asegurar spread <1% en el pool principal', automatable: 'manual', priority: 'high' }
        ],
        metrics: ['Todos los requisitos mínimos cumplidos'],
        resources: 'Inversión en liquidez + tiempo de crecimiento'
      },
      {
        phase: 'Preparación',
        title: 'Documentación Completa',
        duration: '1-2 días',
        tasks: [
          { task: 'Actualizar whitepaper con últimos datos', automatable: 'full', priority: 'high' },
          { task: 'Verificar todos los links funcionando', automatable: 'full', priority: 'high' },
          { task: 'Preparar logos en todos los tamaños requeridos', automatable: 'manual', priority: 'high' },
          { task: 'Actualizar APIs de supply con datos correctos', automatable: 'full', priority: 'high' },
          { task: 'Documentar proof of affiliation con el proyecto', automatable: 'manual', priority: 'critical' }
        ],
        metrics: ['Documentación 100% lista'],
        resources: 'Assets existentes actualizados'
      },
      {
        phase: 'Aplicación',
        title: 'Enviar Nueva Solicitud',
        duration: '1 día',
        tasks: [
          { task: 'Completar formulario de CoinGecko con todos los datos', automatable: 'partial', priority: 'critical' },
          { task: 'Adjuntar evidencia de comunidad activa (screenshots)', automatable: 'manual', priority: 'high' },
          { task: 'Incluir links a GeckoTerminal mostrando actividad', automatable: 'full', priority: 'high' },
          { task: 'Enviar desde email oficial del proyecto', automatable: 'manual', priority: 'critical' }
        ],
        metrics: ['Solicitud enviada correctamente'],
        resources: 'Ninguno adicional'
      },
      {
        phase: 'Post-aplicación',
        title: 'Mantener Actividad',
        duration: '2-6 semanas',
        tasks: [
          { task: 'Mantener volumen y liquidez durante revisión', automatable: 'partial', priority: 'critical' },
          { task: 'Continuar crecimiento de comunidad', automatable: 'partial', priority: 'high' },
          { task: 'No enviar solicitudes duplicadas (spam)', automatable: 'manual', priority: 'critical' },
          { task: 'Preparar para posibles preguntas del equipo CoinGecko', automatable: 'full', priority: 'medium' }
        ],
        metrics: ['Métricas sostenidas o mejorando', 'Sin spam'],
        resources: 'Mantenimiento continuo'
      }
    ],
    resources: [
      { name: 'CoinGecko Request Form', url: 'https://www.coingecko.com/request', type: 'Application' },
      { name: 'CoinGecko Methodology', url: 'https://www.coingecko.com/en/methodology', type: 'Documentation' },
      { name: 'GeckoTerminal', url: 'https://geckoterminal.com', type: 'Verification' },
      { name: 'Listing Requirements', url: 'https://listing.help/coingecko-listing-requirements/', type: 'Guide' }
    ]
  }
];

// ===== COMPONENTE DE ANÁLISIS DE AUTOMATIZACIÓN =====
const AutomationAnalysis = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-xl p-6 mb-8 border border-purple-500/30">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <Bot className="w-6 h-6 text-purple-400" />
          <h3 className="text-xl font-bold text-white">
            🤖 Análisis de Automatización con Claude
          </h3>
        </div>
        {expanded ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
      </button>

      {expanded && (
        <div className="mt-6 space-y-6">
          {/* Lo que Claude PUEDE hacer */}
          <div className="bg-green-900/20 rounded-lg p-4 border border-green-500/30">
            <h4 className="text-green-400 font-semibold flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5" />
              Lo que Claude PUEDE automatizar (con configuración)
            </h4>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-green-300 font-medium mb-2">✅ Generación de Contenido</p>
                <ul className="text-gray-300 space-y-1 ml-4">
                  <li>• Escribir tweets, casts, posts de Discord</li>
                  <li>• Crear threads educativos</li>
                  <li>• Generar calendarios de contenido</li>
                  <li>• Adaptar contenido entre plataformas</li>
                </ul>
              </div>
              <div>
                <p className="text-green-300 font-medium mb-2">✅ Código y Scripts</p>
                <ul className="text-gray-300 space-y-1 ml-4">
                  <li>• Crear scripts de webhooks Discord</li>
                  <li>• Desarrollar Farcaster Frames</li>
                  <li>• Configurar bots de Twitter</li>
                  <li>• Implementar APIs de automatización</li>
                </ul>
              </div>
              <div>
                <p className="text-green-300 font-medium mb-2">✅ Análisis y Planificación</p>
                <ul className="text-gray-300 space-y-1 ml-4">
                  <li>• Investigar mejores prácticas</li>
                  <li>• Crear roadmaps detallados</li>
                  <li>• Analizar métricas y estrategias</li>
                  <li>• Documentar procesos</li>
                </ul>
              </div>
              <div>
                <p className="text-green-300 font-medium mb-2">✅ Desarrollo Frontend</p>
                <ul className="text-gray-300 space-y-1 ml-4">
                  <li>• Crear componentes React</li>
                  <li>• Implementar dashboards</li>
                  <li>• Integrar APIs</li>
                  <li>• Desarrollar páginas web</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Lo que Claude NO puede hacer */}
          <div className="bg-red-900/20 rounded-lg p-4 border border-red-500/30">
            <h4 className="text-red-400 font-semibold flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5" />
              Lo que Claude NO puede hacer (requiere acción manual)
            </h4>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-red-300 font-medium mb-2">❌ Acciones con Wallet</p>
                <ul className="text-gray-300 space-y-1 ml-4">
                  <li>• Firmar transacciones blockchain</li>
                  <li>• Añadir liquidez a pools</li>
                  <li>• Ejecutar trades</li>
                  <li>• Transferir tokens</li>
                </ul>
              </div>
              <div>
                <p className="text-red-300 font-medium mb-2">❌ Cuentas de Terceros</p>
                <ul className="text-gray-300 space-y-1 ml-4">
                  <li>• Crear cuentas (Twitter, Farcaster)</li>
                  <li>• Obtener API keys</li>
                  <li>• Verificar identidades</li>
                  <li>• Aplicar a listings manualmente</li>
                </ul>
              </div>
              <div>
                <p className="text-red-300 font-medium mb-2">❌ Ejecución Persistente</p>
                <ul className="text-gray-300 space-y-1 ml-4">
                  <li>• Correr bots 24/7 (necesita servidor)</li>
                  <li>• Cron jobs automáticos</li>
                  <li>• Monitoreo en tiempo real</li>
                  <li>• Respuestas automáticas live</li>
                </ul>
              </div>
              <div>
                <p className="text-red-300 font-medium mb-2">❌ Decisiones Financieras</p>
                <ul className="text-gray-300 space-y-1 ml-4">
                  <li>• Mover fondos</li>
                  <li>• Aprobar gastos</li>
                  <li>• Contratar servicios</li>
                  <li>• Negociar con terceros</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Configuración necesaria */}
          <div className="bg-yellow-900/20 rounded-lg p-4 border border-yellow-500/30">
            <h4 className="text-yellow-400 font-semibold flex items-center gap-2 mb-4">
              <Settings className="w-5 h-5" />
              Configuración Necesaria para Automatización
            </h4>
            <div className="text-sm space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-yellow-400">1.</span>
                <div>
                  <p className="text-white font-medium">Twitter/X Developer Account</p>
                  <p className="text-gray-400">Obtener API keys en developer.twitter.com (~$100/mes para Basic)</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-yellow-400">2.</span>
                <div>
                  <p className="text-white font-medium">Neynar API Key</p>
                  <p className="text-gray-400">Para posting automático en Farcaster (~$29/mes)</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-yellow-400">3.</span>
                <div>
                  <p className="text-white font-medium">Discord Webhook URLs</p>
                  <p className="text-gray-400">Gratis - crear en Server Settings → Integrations</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-yellow-400">4.</span>
                <div>
                  <p className="text-white font-medium">Hosting para Bots</p>
                  <p className="text-gray-400">Vercel (gratis), Railway (~$5/mes), o Render (~$7/mes)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ===== COMPONENTE POST IDEAS =====
const PostIdeasSection = ({ showEnglish }: { showEnglish: boolean }) => {
  const [activeTab, setActiveTab] = useState<'twitter' | 'discord' | 'farcaster'>('twitter');
  const [expandedDays, setExpandedDays] = useState<Record<number, boolean>>({ 1: true });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleDay = (day: number) => {
    setExpandedDays(prev => ({ ...prev, [day]: !prev[day] }));
  };

  const getCategoryBadge = (category: string) => {
    const badges: Record<string, { bg: string; text: string; label: string; labelEn: string }> = {
      educational: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Educativo', labelEn: 'Educational' },
      emotional: { bg: 'bg-pink-500/20', text: 'text-pink-400', label: 'Emocional', labelEn: 'Emotional' },
      technical: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'Técnico', labelEn: 'Technical' },
      community: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Comunidad', labelEn: 'Community' },
      viral: { bg: 'bg-orange-500/20', text: 'text-orange-400', label: 'Viral', labelEn: 'Viral' },
      cta: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'CTA', labelEn: 'CTA' }
    };
    return badges[category] || badges.educational;
  };

  const getTypeBadge = (type: string) => {
    const badges: Record<string, { icon: string; label: string }> = {
      tweet: { icon: '🐦', label: 'Tweet' },
      thread: { icon: '🧵', label: 'Thread' },
      poll: { icon: '📊', label: 'Poll' },
      quote: { icon: '💬', label: 'Quote' },
      announcement: { icon: '📢', label: 'Announcement' }
    };
    return badges[type] || badges.tweet;
  };

  return (
    <div className="bg-gradient-to-r from-pink-900/30 to-orange-900/30 rounded-xl p-6 border border-pink-500/30">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-3">
          <Lightbulb className="w-6 h-6 text-yellow-400" />
          {showEnglish ? '💡 Post Ideas - Ready to Copy' : '💡 Ideas de Posts - Listos para Copiar'}
        </h3>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>{contentStats.totalTwitterPosts} tweets</span>
          <span>•</span>
          <span>{contentStats.totalDiscordPosts} Discord</span>
          <span>•</span>
          <span>{contentStats.totalFarcasterPosts} Farcaster</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('twitter')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'twitter'
              ? 'bg-sky-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          <Twitter className="w-4 h-4" />
          Twitter/X ({contentStats.totalTwitterPosts})
        </button>
        <button
          onClick={() => setActiveTab('discord')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'discord'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          Discord ({contentStats.totalDiscordPosts})
        </button>
        <button
          onClick={() => setActiveTab('farcaster')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'farcaster'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          <Globe className="w-4 h-4" />
          Farcaster ({contentStats.totalFarcasterPosts})
        </button>
      </div>

      {/* Twitter Content */}
      {activeTab === 'twitter' && (
        <div className="space-y-4">
          {twitterWeeklyContent.map((dayContent: DayContent) => (
            <div key={dayContent.day} className="bg-black/30 rounded-lg overflow-hidden">
              {/* Day Header */}
              <button
                onClick={() => toggleDay(dayContent.day)}
                className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className="w-10 h-10 rounded-full bg-sky-600 flex items-center justify-center font-bold text-white">
                    D{dayContent.day}
                  </span>
                  <div className="text-left">
                    <h4 className="font-semibold text-white">
                      {showEnglish ? dayContent.themeEn : dayContent.theme}
                    </h4>
                    <p className="text-sm text-gray-400">
                      {dayContent.posts.length} posts • {showEnglish ? 'Day' : 'Día'} {dayContent.day}
                    </p>
                  </div>
                </div>
                {expandedDays[dayContent.day] ? (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                )}
              </button>

              {/* Day Content */}
              {expandedDays[dayContent.day] && (
                <div className="px-4 pb-4 space-y-3">
                  {dayContent.posts.map((post: PostIdea, postIndex: number) => {
                    const catBadge = getCategoryBadge(post.category);
                    const typeBadge = getTypeBadge(post.type);
                    const postContent = showEnglish ? post.contentEn : post.content;

                    return (
                      <div key={post.id} className="bg-black/40 rounded-lg p-4 border border-gray-700/50">
                        {/* Post Header */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm">{typeBadge.icon} {typeBadge.label}</span>
                            <span className={`px-2 py-0.5 rounded text-xs ${catBadge.bg} ${catBadge.text}`}>
                              {showEnglish ? catBadge.labelEn : catBadge.label}
                            </span>
                            {post.bestTime && (
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {post.bestTime}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => copyToClipboard(postContent, post.id)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium transition-colors"
                          >
                            {copiedId === post.id ? (
                              <><Check className="w-4 h-4" /> {showEnglish ? 'Copied!' : '¡Copiado!'}</>
                            ) : (
                              <><Copy className="w-4 h-4" /> {showEnglish ? 'Copy' : 'Copiar'}</>
                            )}
                          </button>
                        </div>

                        {/* Post Content */}
                        <pre className="text-sm text-gray-200 whitespace-pre-wrap font-sans leading-relaxed">
                          {postContent}
                        </pre>

                        {/* Hashtags */}
                        {post.hashtags && post.hashtags.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1">
                            {post.hashtags.map((tag, i) => (
                              <span key={i} className="text-xs text-sky-400">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Discord Content */}
      {activeTab === 'discord' && (
        <div className="space-y-6">
          {discordContent.map((category, catIndex) => (
            <div key={catIndex} className="bg-black/30 rounded-lg p-4">
              <h4 className="font-semibold text-indigo-400 mb-4 flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                {showEnglish ? category.categoryEn : category.category}
              </h4>
              <div className="space-y-4">
                {category.posts.map((post, postIndex) => {
                  const postId = `discord-${catIndex}-${postIndex}`;
                  const postContent = showEnglish ? post.contentEn : post.content;

                  return (
                    <div key={postIndex} className="bg-black/40 rounded-lg p-4 border border-indigo-500/20">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">
                            {showEnglish ? post.titleEn : post.title}
                          </span>
                          <span className="text-xs text-gray-500 bg-gray-700 px-2 py-0.5 rounded">
                            {post.channel}
                          </span>
                        </div>
                        <button
                          onClick={() => copyToClipboard(postContent, postId)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
                        >
                          {copiedId === postId ? (
                            <><Check className="w-4 h-4" /> {showEnglish ? 'Copied!' : '¡Copiado!'}</>
                          ) : (
                            <><Copy className="w-4 h-4" /> {showEnglish ? 'Copy' : 'Copiar'}</>
                          )}
                        </button>
                      </div>
                      <pre className="text-sm text-gray-200 whitespace-pre-wrap font-sans leading-relaxed bg-black/30 rounded p-3 max-h-60 overflow-y-auto">
                        {postContent}
                      </pre>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Farcaster Content */}
      {activeTab === 'farcaster' && (
        <div className="space-y-4">
          {farcasterContent.map((cast, index) => {
            const castId = `farcaster-${index}`;
            const castContent = showEnglish ? cast.contentEn : cast.content;

            return (
              <div key={index} className="bg-black/30 rounded-lg p-4 border border-purple-500/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-purple-400 font-medium">
                      {cast.type === 'thread' ? '🧵 Thread' : cast.type === 'frame' ? '🖼️ Frame' : '💬 Cast'}
                    </span>
                    {cast.channel && (
                      <span className="text-xs text-gray-500 bg-gray-700 px-2 py-0.5 rounded">
                        {cast.channel}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => copyToClipboard(castContent, castId)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors"
                  >
                    {copiedId === castId ? (
                      <><Check className="w-4 h-4" /> {showEnglish ? 'Copied!' : '¡Copiado!'}</>
                    ) : (
                      <><Copy className="w-4 h-4" /> {showEnglish ? 'Copy' : 'Copiar'}</>
                    )}
                  </button>
                </div>
                <pre className="text-sm text-gray-200 whitespace-pre-wrap font-sans leading-relaxed">
                  {castContent}
                </pre>
              </div>
            );
          })}
        </div>
      )}

      {/* Stats Footer */}
      <div className="mt-6 pt-6 border-t border-gray-700">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="bg-black/30 rounded-lg p-3">
            <p className="text-2xl font-bold text-sky-400">{contentStats.daysOfContent}</p>
            <p className="text-xs text-gray-400">{showEnglish ? 'Days of Content' : 'Días de Contenido'}</p>
          </div>
          <div className="bg-black/30 rounded-lg p-3">
            <p className="text-2xl font-bold text-green-400">{contentStats.categories.length}</p>
            <p className="text-xs text-gray-400">{showEnglish ? 'Categories' : 'Categorías'}</p>
          </div>
          <div className="bg-black/30 rounded-lg p-3">
            <p className="text-2xl font-bold text-purple-400">{contentStats.platforms.length}</p>
            <p className="text-xs text-gray-400">{showEnglish ? 'Platforms' : 'Plataformas'}</p>
          </div>
          <div className="bg-black/30 rounded-lg p-3">
            <p className="text-lg font-bold text-yellow-400">10K+</p>
            <p className="text-xs text-gray-400">{showEnglish ? 'Potential Reach/Week' : 'Alcance Potencial/Sem'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ===== COMPONENTE PRINCIPAL =====
export function GrowthStrategy() {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showEnglish, setShowEnglish] = useState(false);

  const toggleSection = (id: string) => {
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; border: string; text: string }> = {
      blue: { bg: 'bg-blue-900/20', border: 'border-blue-500/30', text: 'text-blue-400' },
      sky: { bg: 'bg-sky-900/20', border: 'border-sky-500/30', text: 'text-sky-400' },
      purple: { bg: 'bg-purple-900/20', border: 'border-purple-500/30', text: 'text-purple-400' },
      indigo: { bg: 'bg-indigo-900/20', border: 'border-indigo-500/30', text: 'text-indigo-400' },
      green: { bg: 'bg-green-900/20', border: 'border-green-500/30', text: 'text-green-400' },
      yellow: { bg: 'bg-yellow-900/20', border: 'border-yellow-500/30', text: 'text-yellow-400' }
    };
    return colors[color] || colors.blue;
  };

  const getPriorityBadge = (priority: string) => {
    const badges: Record<string, string> = {
      critical: 'bg-red-500/20 text-red-400 border-red-500/30',
      high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      low: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    };
    return badges[priority] || badges.medium;
  };

  const getAutomatableBadge = (automatable: string) => {
    const badges: Record<string, { class: string; text: string }> = {
      full: { class: 'bg-green-500/20 text-green-400', text: '🤖 Auto' },
      partial: { class: 'bg-yellow-500/20 text-yellow-400', text: '⚡ Semi' },
      manual: { class: 'bg-red-500/20 text-red-400', text: '👤 Manual' }
    };
    return badges[automatable] || badges.manual;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-900/30 to-blue-900/30 rounded-xl p-6 border border-green-500/30">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Rocket className="w-7 h-7 text-green-400" />
            {showEnglish ? 'Growth & Traction Strategy' : 'Estrategia de Crecimiento y Tracción'}
          </h2>
          <button
            onClick={() => setShowEnglish(!showEnglish)}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
          >
            {showEnglish ? '🇪🇸 Español' : '🇺🇸 English'}
          </button>
        </div>
        <p className="text-gray-300 mb-4">
          {showEnglish
            ? 'Complete action plan to achieve CoinGecko listing and maximize project potential across all platforms.'
            : 'Plan de acción completo para lograr el listing en CoinGecko y maximizar el potencial del proyecto en todas las plataformas.'}
        </p>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-black/30 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-blue-400">6</p>
            <p className="text-xs text-gray-400">{showEnglish ? 'Strategy Areas' : 'Áreas de Estrategia'}</p>
          </div>
          <div className="bg-black/30 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-green-400">24</p>
            <p className="text-xs text-gray-400">{showEnglish ? 'Roadmap Phases' : 'Fases de Roadmap'}</p>
          </div>
          <div className="bg-black/30 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-purple-400">14</p>
            <p className="text-xs text-gray-400">{showEnglish ? 'Days to Reapply' : 'Días para Re-aplicar'}</p>
          </div>
          <div className="bg-black/30 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-yellow-400">60%</p>
            <p className="text-xs text-gray-400">{showEnglish ? 'Automatable' : 'Automatizable'}</p>
          </div>
        </div>
      </div>

      {/* Automation Analysis */}
      <AutomationAnalysis />

      {/* Timeline Overview */}
      <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-400" />
          {showEnglish ? 'Critical Timeline (14 Days)' : 'Timeline Crítico (14 Días)'}
        </h3>
        <div className="flex flex-wrap gap-2">
          {[
            { day: '1-3', task: showEnglish ? 'Add Liquidity' : 'Añadir Liquidez', color: 'blue' },
            { day: '1-7', task: showEnglish ? 'Activate Socials' : 'Activar Redes', color: 'sky' },
            { day: '1-14', task: showEnglish ? 'Grow Community' : 'Crecer Comunidad', color: 'purple' },
            { day: '7-14', task: showEnglish ? 'Generate Volume' : 'Generar Volumen', color: 'green' },
            { day: '15', task: showEnglish ? 'Reapply CoinGecko' : 'Re-aplicar CoinGecko', color: 'yellow' }
          ].map((item, i) => (
            <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-${item.color}-900/20 border border-${item.color}-500/30`}>
              <span className="text-white font-mono text-sm">D{item.day}</span>
              <ArrowRight className="w-3 h-3 text-gray-500" />
              <span className="text-gray-300 text-sm">{item.task}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Strategy Sections */}
      {strategySections.map((section) => {
        const colors = getColorClasses(section.color);
        const isExpanded = expandedSections[section.id];

        return (
          <div key={section.id} className={`${colors.bg} rounded-xl border ${colors.border} overflow-hidden`}>
            {/* Section Header */}
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${colors.bg} ${colors.text}`}>
                  {section.icon}
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-bold text-white">
                    {showEnglish ? section.title : section.titleEs}
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    {showEnglish ? section.currentState.en : section.currentState.es}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs ${colors.bg} ${colors.text} border ${colors.border}`}>
                  {section.roadmap.length} {showEnglish ? 'phases' : 'fases'}
                </span>
                {isExpanded ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
              </div>
            </button>

            {/* Section Content */}
            {isExpanded && (
              <div className="px-6 pb-6 space-y-6">
                {/* Target State */}
                <div className="bg-black/30 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-1">{showEnglish ? 'Target State:' : 'Estado Objetivo:'}</p>
                  <p className="text-green-400 font-medium">
                    {showEnglish ? section.targetState.en : section.targetState.es}
                  </p>
                </div>

                {/* Roadmap Phases */}
                <div className="space-y-4">
                  {section.roadmap.map((phase, phaseIndex) => (
                    <div key={phaseIndex} className="bg-black/20 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-sm font-bold ${colors.bg} ${colors.text}`}>
                            {phase.phase}
                          </span>
                          <h4 className="font-semibold text-white">{phase.title}</h4>
                        </div>
                        <span className="text-sm text-gray-400 flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {phase.duration}
                        </span>
                      </div>

                      {/* Tasks */}
                      <div className="space-y-2 mb-4">
                        {phase.tasks.map((task, taskIndex) => {
                          const autoInfo = getAutomatableBadge(task.automatable);
                          return (
                            <div key={taskIndex} className="flex items-start gap-3 p-2 rounded bg-black/20">
                              <Circle className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <p className="text-sm text-gray-200">{task.task}</p>
                                {task.details && (
                                  <p className="text-xs text-gray-500 mt-1">{task.details}</p>
                                )}
                              </div>
                              <div className="flex gap-2 flex-shrink-0">
                                <span className={`px-2 py-0.5 rounded text-xs ${autoInfo.class}`}>
                                  {autoInfo.text}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-xs border ${getPriorityBadge(task.priority)}`}>
                                  {task.priority}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Metrics & Resources */}
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-blue-400" />
                          <span className="text-gray-400">Métricas:</span>
                          <span className="text-gray-300">{phase.metrics.join(', ')}</span>
                        </div>
                        {phase.resources && (
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-green-400" />
                            <span className="text-gray-400">Recursos:</span>
                            <span className="text-gray-300">{phase.resources}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Templates */}
                {section.templates && section.templates.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-white flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      {showEnglish ? 'Content Templates' : 'Templates de Contenido'}
                    </h4>
                    {section.templates.map((template, i) => (
                      <div key={i} className="bg-black/30 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-300">{template.name}</span>
                          <button
                            onClick={() => copyToClipboard(
                              showEnglish ? template.contentEn : template.content,
                              `template-${section.id}-${i}`
                            )}
                            className="flex items-center gap-1 px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-xs transition-colors"
                          >
                            {copiedId === `template-${section.id}-${i}` ? (
                              <><Check className="w-3 h-3 text-green-400" /> Copiado</>
                            ) : (
                              <><Copy className="w-3 h-3" /> Copiar</>
                            )}
                          </button>
                        </div>
                        <pre className="text-sm text-gray-400 whitespace-pre-wrap font-mono bg-black/30 rounded p-3">
                          {showEnglish ? template.contentEn : template.content}
                        </pre>
                      </div>
                    ))}
                  </div>
                )}

                {/* Scripts */}
                {section.scripts && section.scripts.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-white flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      {showEnglish ? 'Automation Scripts' : 'Scripts de Automatización'}
                    </h4>
                    {section.scripts.map((script, i) => (
                      <div key={i} className="bg-black/30 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="text-sm font-medium text-gray-300">{script.name}</span>
                            <p className="text-xs text-gray-500">{script.description}</p>
                          </div>
                          <button
                            onClick={() => copyToClipboard(script.code, `script-${section.id}-${i}`)}
                            className="flex items-center gap-1 px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-xs transition-colors"
                          >
                            {copiedId === `script-${section.id}-${i}` ? (
                              <><Check className="w-3 h-3 text-green-400" /> Copiado</>
                            ) : (
                              <><Copy className="w-3 h-3" /> Copiar</>
                            )}
                          </button>
                        </div>
                        <pre className="text-xs text-gray-400 whitespace-pre-wrap font-mono bg-black/50 rounded p-3 overflow-x-auto">
                          {script.code}
                        </pre>
                      </div>
                    ))}
                  </div>
                )}

                {/* Resources */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-white flex items-center gap-2">
                    <ExternalLink className="w-4 h-4" />
                    {showEnglish ? 'Resources' : 'Recursos'}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {section.resources.map((resource, i) => (
                      <a
                        key={i}
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/30 hover:bg-black/50 transition-colors text-sm"
                      >
                        <span className="text-gray-300">{resource.name}</span>
                        <span className="text-xs text-gray-500">({resource.type})</span>
                        <ExternalLink className="w-3 h-3 text-gray-500" />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Post Ideas Section */}
      <PostIdeasSection showEnglish={showEnglish} />

      {/* Final CTA */}
      <div className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 rounded-xl p-6 border border-yellow-500/30 text-center">
        <h3 className="text-xl font-bold text-white mb-2">
          {showEnglish ? '🎯 Ready to Execute?' : '🎯 ¿Listo para Ejecutar?'}
        </h3>
        <p className="text-gray-300 mb-4">
          {showEnglish
            ? 'Start with Phase 1 of each strategy. Focus on critical tasks first.'
            : 'Comienza con la Fase 1 de cada estrategia. Enfócate en las tareas críticas primero.'}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <a
            href="https://aerodrome.finance/liquidity"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-medium flex items-center gap-2 transition-colors"
          >
            <Droplets className="w-4 h-4" />
            {showEnglish ? 'Add Liquidity' : 'Añadir Liquidez'}
          </a>
          <a
            href="https://x.com/cryptogiftdao"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 rounded-lg text-white font-medium flex items-center gap-2 transition-colors"
          >
            <Twitter className="w-4 h-4" />
            {showEnglish ? 'Activate Twitter' : 'Activar Twitter'}
          </a>
          <a
            href="https://warpcast.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white font-medium flex items-center gap-2 transition-colors"
          >
            <Globe className="w-4 h-4" />
            {showEnglish ? 'Join Farcaster' : 'Unirse a Farcaster'}
          </a>
        </div>
      </div>
    </div>
  );
}
