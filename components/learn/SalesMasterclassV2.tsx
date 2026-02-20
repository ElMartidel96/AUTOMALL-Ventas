/**
 * SALES MASTERCLASS INTERACTIVE MODULE V2.0
 * The Revolutionary 7-Minute Pitch Experience
 * With Real CryptoGift Content & Interactive Questions
 * 
 * Made by mbxarts.com The Moon in a Box property
 * Co-Author: Godez22
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
// Removed useRouter import to avoid App Router/Pages Router conflicts
// Using window.location.href for navigation instead
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';

// Lazy load MUX Player to avoid SSR issues and prevent download triggering
const MuxPlayer = dynamic(
  () => import('@mux/mux-player-react').then(mod => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="relative aspect-video w-full flex items-center justify-center
        bg-gradient-to-br from-gray-900/95 to-black/95 rounded-3xl">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent
            rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/80 text-lg">Cargando video...</p>
        </div>
      </div>
    )
  }
);
import { useTranslations } from 'next-intl';
import { TeamSection } from '@/components/apex';
import { RotatePhoneHintCompact } from '@/components/ui/RotatePhoneHint';
import StaticGalleryVideoPlayer from '@/components/video/StaticGalleryVideoPlayer';
import { QRCodeSVG } from 'qrcode.react';
import { ConnectButton, useActiveAccount } from 'thirdweb/react';
import { client } from '@/lib/thirdweb/client';
import { 
  CheckCircle, 
  Sparkles, 
  Flame,
  BarChart3,
  Lock,
  Rocket,
  Banknote,
  Globe,
  Trophy,
  Clock,
  Heart,
  Gift,
  Shield,
  TrendingUp,
  Users,
  Zap,
  ArrowRight,
  ArrowLeft,
  Lightbulb,
  AlertCircle,
  Target,
  DollarSign,
  Award,
  Star,
  MessageCircle,
  Play,
  ChevronRight,
  X,
  Check,
  Circle,
  Square,
  Triangle,
  Hexagon,
  Palette,
  Building2,
  ShoppingBag,
  RefreshCw,
  PartyPopper,
  Mail,
  Gamepad2,
  Briefcase,
  UserCheck,
  TrendingDown,
  CheckSquare,
  XCircle,
  CircleDot,
  Hash,
  AtSign,
  Code,
  BookOpen,
  Calendar,
  Twitter,
  MessageSquare
} from 'lucide-react';
import { Gem, Wrench, AlertTriangle, Handshake, Swords, Eye, EyeOff, Link as LinkIcon, Bot, Loader2, Brain, ArrowLeftRight } from 'lucide-react';
import { EmailVerificationModal } from '@/components/email/EmailVerificationModal';
import { CalendarBookingModal } from '@/components/calendar/CalendarBookingModal';
import IntroVideoGate from '@/components/video/IntroVideoGate';
import { useSocialOAuth } from '@/hooks/useSocialOAuth';
import { VIDEO_CONFIG } from '@/config/videoConfig';

// =============================================================================
// MODERN ICON SYSTEM - Lucide React icons with gradient styling
// =============================================================================
type IconKey = 'star' | 'target' | 'wrench' | 'building' | 'gem' | 'rocket' | 'trophy' | 'check' | 'sparkles' | 'flame' | 'lock' | 'warning' | 'mail' | 'gift' | 'users' | 'gamepad' | 'handshake' | 'swords' | 'globe' | 'lightbulb' | 'party' | 'bot' | 'calendar' | 'chart' | 'loader';

const ICON_MAP: Record<IconKey, React.ComponentType<{ className?: string }>> = {
  star: Star,
  target: Target,
  wrench: Wrench,
  building: Building2,
  gem: Gem,
  rocket: Rocket,
  trophy: Trophy,
  check: CheckCircle,
  sparkles: Sparkles,
  flame: Flame,
  lock: Lock,
  warning: AlertTriangle,
  mail: Mail,
  gift: Gift,
  users: Users,
  gamepad: Gamepad2,
  handshake: Handshake,
  swords: Swords,
  globe: Globe,
  lightbulb: Lightbulb,
  party: PartyPopper,
  bot: Bot,
  calendar: Calendar,
  chart: BarChart3,
  loader: Loader2,
};

const ICON_COLORS: Record<IconKey, string> = {
  star: 'text-yellow-500',
  target: 'text-orange-500',
  wrench: 'text-slate-400',
  building: 'text-blue-500',
  gem: 'text-purple-500',
  rocket: 'text-cyan-500',
  trophy: 'text-amber-500',
  check: 'text-emerald-500',
  sparkles: 'text-pink-500',
  flame: 'text-red-500',
  lock: 'text-blue-400',
  warning: 'text-amber-500',
  mail: 'text-blue-500',
  gift: 'text-pink-500',
  users: 'text-blue-500',
  gamepad: 'text-purple-500',
  handshake: 'text-green-500',
  swords: 'text-red-500',
  globe: 'text-cyan-500',
  lightbulb: 'text-yellow-500',
  party: 'text-pink-500',
  bot: 'text-cyan-500',
  calendar: 'text-blue-500',
  chart: 'text-emerald-500',
  loader: 'text-blue-500',
};

// Styled icon component with modern gradient effects
interface StyledIconProps {
  icon: IconKey;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  withGlow?: boolean;
  asMedal?: boolean;
}

const StyledIcon: React.FC<StyledIconProps> = ({ icon, size = 'md', className = '', withGlow = false, asMedal = false }) => {
  const IconComponent = ICON_MAP[icon];
  const colorClass = ICON_COLORS[icon];
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
  };

  // Medal container sizes (slightly larger than icon)
  const medalSizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
    xl: 'w-14 h-14',
  };

  if (asMedal) {
    return (
      <span
        className={`
          inline-flex items-center justify-center rounded-full
          ${medalSizeClasses[size]}
          bg-gradient-to-br from-gray-100 via-white to-gray-200
          dark:from-gray-800 dark:via-gray-900 dark:to-gray-800
          border-2 border-gray-300/80 dark:border-gray-500/60
          shadow-[inset_0_2px_8px_rgba(0,0,0,0.15),0_1px_3px_rgba(0,0,0,0.1)]
          dark:shadow-[inset_0_2px_12px_rgba(255,255,255,0.1),0_1px_3px_rgba(0,0,0,0.3)]
          ring-1 ring-gray-400/30 dark:ring-gray-400/20
          ${className}
        `}
      >
        <span className={`${withGlow ? 'drop-shadow-[0_0_6px_currentColor]' : ''}`}>
          <IconComponent className={`${sizeClasses[size]} ${colorClass}`} />
        </span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center justify-center ${withGlow ? 'drop-shadow-[0_0_8px_currentColor]' : ''} ${className}`}>
      <IconComponent className={`${sizeClasses[size]} ${colorClass}`} />
    </span>
  );
};

// Enhanced confetti function matching KnowledgeLessonModal implementation
function triggerConfetti(options?: ConfettiOptions) {
  // Visual confetti effect using CSS animation
  const duration = 3000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  const interval = setInterval(function() {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);
    
    // Create confetti elements
    for (let i = 0; i < particleCount; i++) {
      const confettiEl = document.createElement('div');
      confettiEl.style.position = 'fixed';
      confettiEl.style.width = '10px';
      confettiEl.style.height = '10px';
      confettiEl.style.backgroundColor = ['#FFD700', '#FFA500', '#FF6347', '#FF69B4', '#00CED1', '#32CD32'][Math.floor(Math.random() * 6)];
      confettiEl.style.left = Math.random() * 100 + '%';
      confettiEl.style.top = '-10px';
      confettiEl.style.opacity = '1';
      confettiEl.style.transform = `rotate(${Math.random() * 360}deg)`;
      confettiEl.style.zIndex = '10000';
      confettiEl.className = 'confetti-particle';
      
      document.body.appendChild(confettiEl);
      
      // Animate falling
      confettiEl.animate([
        { 
          transform: `translateY(0) rotate(0deg)`,
          opacity: 1 
        },
        { 
          transform: `translateY(${window.innerHeight + 100}px) rotate(${Math.random() * 720}deg)`,
          opacity: 0
        }
      ], {
        duration: randomInRange(2000, 4000),
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      }).onfinish = () => confettiEl.remove();
    }
  }, 100);
  
  console.log('🎉 Enhanced confetti effect triggered!', options);
}

// Backward compatibility
function confetti(options: ConfettiOptions) {
  triggerConfetti(options);
}
// Types
interface ConfettiOptions {
  startVelocity?: number;
  spread?: number;
  ticks?: number;
  zIndex?: number;
}

// AUDIT FIX #8: Comprehensive typing to eliminate any types - Updated to match actual usage
interface BrechaItem {
  title: string;
  description: string;
  impact?: string; // Optional porque no siempre se usa
}

interface FeatureItem {
  icon?: React.ComponentType<{ className?: string }>; // Componente React para lucide-react
  text?: string; // Para features simples que solo tienen texto
  title?: string; // Para features más complejas
  description?: string;
  benefit?: string;
}

interface ComparisonItem {
  aspect?: string; // Opcional para permitir objetos simples
  traditional?: string; // Usado en el código
  competitor?: string;
  cryptogift?: string; // Opcional para flexibilidad
  advantage?: string; // Opcional para flexibilidad
}

interface MetricItem {
  label?: string; // Opcional para flexibilidad
  number?: string; // Usado en el código 
  value?: string; // Opcional
  improvement?: string; // Opcional
}

interface StreamItem {
  name: string;
  model?: string; // Usado en el código
  description?: string; // Opcional
  potential?: string; // Opcional
  icon?: React.ComponentType<{ className?: string }>; // Componente React para lucide-react
}

interface PhaseItem {
  phase?: string; // Opcional
  name?: string; // Usado en el código
  timeline?: string; // Opcional
  description?: string; // Opcional
  milestones?: string[]; // Opcional
  goal?: string; // Objetivo de la fase
  features?: string; // Características de la fase
}

interface PathItem {
  name?: string; // Nombre del path/rol
  nameEs?: string; // Nombre en español
  title?: string; // Título alternativo
  description: string;
  difficulty?: string; // Opcional
  timeline?: string; // Opcional
  spots?: number | string; // Número de spots disponibles - permite tanto number como string
  benefit?: string; // Beneficio específico del path
  icon?: string; // Emoji icon for the role
  popular?: boolean; // Mark as popular/recommended
}

interface BenefitItem {
  icon: React.ComponentType<{ className?: string }>; // Componente React para lucide-react
  text: string; // Texto del beneficio
  title?: string; // Opcional para compatibilidad
  description?: string; // Opcional para compatibilidad
}

interface SalesBlockContent {
  title?: string;
  description?: string;
  urgency?: string;
  headline?: string; // Usado en el código
  instruction?: string; // Usado en el código
  story?: string; // Usado para el contenido narrativo del opening
  stat?: string; // Usado para mostrar estadísticas importantes
  steps?: string[]; // Lista de pasos del proceso
  goal?: string; // Objetivo o meta específica
  inspiration?: string; // Texto inspiracional del cierre
  emphasis?: string; // Texto de énfasis adicional
  hook?: string; // Gancho final para engagement
  paths?: PathItem[]; // Rutas de participación disponibles
  stats?: Record<string, string>; // Estadísticas del final
  vision?: string; // Visión del proyecto
  message?: string; // Mensaje específico
  breakthrough?: string; // Mensaje de breakthrough tecnológico
  callToAction?: string; // Call to action específico
  tagline?: string; // Línea descriptiva adicional
  testimonial?: string; // Testimonio o quote
  final?: string; // Mensaje final
  finalMessage?: string; // Mensaje final alternativo
  brechas?: BrechaItem[];
  features?: FeatureItem[];
  comparisons?: ComparisonItem[];
  metrics?: MetricItem[];
  streams?: StreamItem[];
  phases?: PhaseItem[];
  benefits?: BenefitItem[];
}

// V2 Block Types: Video-first funnel approach (no quizzes)
type SalesBlockType =
  // V2 new types
  | 'video'       // NEW: Video content block (uses IntroVideoGate)
  | 'checkpoint'  // NEW: Simple emotional engagement (yes/no, not quiz)
  | 'social'      // NEW: Social verification (Twitter/Discord)
  // Reused from legacy
  | 'demo'        // REUSED: QR code experience
  | 'capture'     // REUSED: Role selection
  | 'success'     // REUSED: Celebration screen
  // Legacy types (for backwards compatibility)
  | 'opening'
  | 'problem'
  | 'solution'
  | 'comparison'
  | 'cases'
  | 'business'
  | 'roadmap'
  | 'close';

interface SalesBlock {
  id: string;
  title: string;
  duration: number;
  type: SalesBlockType;
  content: SalesBlockContent;
  // V2: Video config key for video blocks
  videoConfigKey?: string;
  // V2: Checkpoint question for engagement (not graded)
  checkpointQuestion?: string;
  // Legacy: Quiz question (kept for backwards compatibility but not used in V2)
  question?: {
    text: string;
    options: Array<{
      text: string;
      isCorrect: boolean;
    }>;
  };
  triggers: string[];
  // FASE 2: Next pointer para state machine declarativa
  nextBlock?: string;
}

interface LeadData {
  path: 'quest' | 'integration' | 'whitelabel' | 'investor' | 'community';
  availability: string;
  contact: string;
  interests: string[];
  nps?: number;
  claimedGift?: boolean;
  questionsCorrect?: number;
  totalQuestions?: number;
  questionsScore?: {
    correct: number;
    total: number;
  };
}

interface Metrics {
  startTime: number;
  blockTimes: Record<string, number>;
  interactions: number;
  claimSuccess: boolean;
  leadSubmitted: boolean;
  wowMoments: number;
  questionsAnswered: number;
  correctAnswers: number;
}

// FASE 2: Detailed answer tracking interface
interface QuestionAnswer {
  questionId: string;
  questionText: string;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  timeSpent: number; // seconds
}

// Constants
const GIFT_CLAIM_URL = process.env.NEXT_PUBLIC_SITE_URL 
  ? `${process.env.NEXT_PUBLIC_SITE_URL}/gift/claim/demo-`
  : 'https://cryptogift-wallets.vercel.app/gift/claim/demo-';

/**
 * SALES MASTERCLASS V2 - VIDEO FUNNEL BLOCKS
 * Neuromarketing approach: 3 videos + streamlined flow
 * Total duration: ~6 minutes (vs ~15 min legacy)
 *
 * UPDATED FLOW: video1 → video2 → demo → video3 → capture → success
 * NOTE: Checkpoint removed for streamlined experience
 * NOTE: video1 is now also shown in the invite page (InviteImageCard)
 */
const SALES_BLOCKS: SalesBlock[] = [
  // =============================================================================
  // VIDEO 1: THE GIFT (TOFU - Top of Funnel) - ~1:05
  // Psychology: Emotion + Desire
  // NOTE: This video is now shown in the invite page (InviteImageCard)
  // When user gets here, they may have already watched it
  // =============================================================================
  {
    id: 'video1',
    title: 'El Regalo',
    duration: 65, // 1:05 video
    type: 'video',
    videoConfigKey: 'salesMasterclassV2_TheGift',
    content: {
      title: 'El Regalo',
      description: 'El primer paso hacia la confianza real',
      message: 'Completa este video-funnel y recibe 200 CGC'
    },
    triggers: ['emotional_connection', 'curiosity'],
    // 🔄 FLOW UPDATE: Skip checkpoint, go directly to video2
    // The checkpoint was removed from the flow to streamline the experience
    nextBlock: 'video2'
  },

  // =============================================================================
  // CHECKPOINT: HIDDEN - Emotional Engagement
  // NOTE: This block is kept for backwards compatibility but is now skipped
  // The flow goes directly from video1 → video2
  // =============================================================================
  {
    id: 'checkpoint',
    title: '¿Resuena Contigo?',
    duration: 15,
    type: 'checkpoint',
    checkpointQuestion: '¿Alguna vez quisiste compartir el futuro de Web3 con alguien que aprecias?',
    content: {
      title: '¿Resuena Contigo?',
      description: 'Un momento para reflexionar antes de continuar',
      emphasis: 'No hay respuesta incorrecta - es solo para ti'
    },
    triggers: ['engagement', 'reflection'],
    nextBlock: 'video2'
  },

  // =============================================================================
  // VIDEO 2: THE SOLUTION (MOFU - Middle of Funnel) - ~2:15
  // Psychology: Logic + Proof
  // =============================================================================
  {
    id: 'video2',
    title: 'La Solución',
    duration: 135, // 2:15 video
    type: 'video',
    videoConfigKey: 'salesMasterclassV2_TheSolution',
    content: {
      title: 'La Solución',
      description: 'La tecnología detrás de la magia',
      emphasis: '2M CGC distribuidos • 6+ contratos en Base Mainnet • 85.7% claim rate'
    },
    triggers: ['logic', 'proof', 'credibility'],
    nextBlock: 'demo'
  },

  // =============================================================================
  // DEMO: Live QR Experience (REUSED from legacy)
  // The moment of truth - user scans and claims
  // =============================================================================
  {
    id: 'demo',
    title: 'Vívelo Ahora Mismo',
    duration: 60,
    type: 'demo',
    content: {
      instruction: 'Así de simple es para tu amigo:',
      steps: [
        '1. Escanea el QR o abre el link',
        '2. Entiende los fundamentos crypto',
        '3. Reclama el NFT — ES su wallet',
        '4. Listo: de novato a holder'
      ],
      emphasis: 'Sin seed phrases • Sin gas • Sin confusión'
    },
    triggers: ['live_demo', 'endowment_effect'],
    nextBlock: 'video3'
  },

  // =============================================================================
  // VIDEO 3: THE OPPORTUNITY (BOFU - Bottom of Funnel) - ~3:00
  // Psychology: Trust + Action
  // =============================================================================
  {
    id: 'video3',
    title: 'La Oportunidad',
    duration: 180, // 3:00 video
    type: 'video',
    videoConfigKey: 'salesMasterclassV2_TheOpportunity',
    content: {
      title: 'La Oportunidad',
      description: 'Tu invitación al futuro',
      emphasis: 'Estamos temprano. La infraestructura está lista. La comunidad se está formando.'
    },
    triggers: ['trust', 'action', 'fomo_ethical'],
    nextBlock: 'capture'
  },

  // =============================================================================
  // CAPTURE: Role Selection (REUSED from legacy)
  // Multiple CTAs based on user profile
  // =============================================================================
  {
    id: 'capture',
    title: 'Elige tu Rol',
    duration: 30,
    type: 'capture',
    content: {
      title: 'Elige tu rol en CryptoGift',
      paths: [
        {
          name: 'Community',
          nameEs: 'Comunidad',
          description: 'Embajador de la adopción',
          spots: 'Ilimitado',
          benefit: 'Tokens CGC + Poder de voto real',
          icon: 'star' as IconKey,
          popular: true
        },
        {
          name: 'Quest Creator',
          nameEs: 'Creador de Quests',
          description: 'Crea experiencias gamificadas',
          spots: 33,
          benefit: '30% revenue share',
          icon: 'target' as IconKey
        },
        {
          name: 'Integration Partner',
          nameEs: 'Socio de Integración',
          description: 'Integra nuestro widget',
          spots: 19,
          benefit: '1M transacciones gratis',
          icon: 'wrench' as IconKey
        },
        {
          name: 'White-Label',
          nameEs: 'Marca Blanca',
          description: 'Tu propia plataforma',
          spots: 6,
          benefit: 'SLA 99.99%',
          icon: 'building' as IconKey
        },
        {
          name: 'Investor',
          nameEs: 'Inversor',
          description: 'Invierte en el futuro',
          spots: 'Limitado',
          benefit: 'Mín $50k',
          icon: 'gem' as IconKey
        }
      ],
      urgency: 'Bonus 20% lifetime para los primeros 100'
    },
    triggers: ['urgency', 'scarcity'],
    // NOTE: Social verification is now integrated in CaptureBlock, so we skip directly to success
    nextBlock: 'success'
  },

  // =============================================================================
  // SOCIAL: DEPRECATED - Twitter/Discord verification now integrated in CaptureBlock
  // Kept for backwards compatibility with saved user states
  // =============================================================================
  {
    id: 'social',
    title: 'Síguenos',
    duration: 30,
    type: 'social',
    content: {
      title: '¡Únete a nuestra comunidad!',
      description: 'Conecta con otros early adopters',
      emphasis: 'Donde la magia sucede todos los días'
    },
    triggers: ['community', 'engagement'],
    nextBlock: 'success'
  },

  // =============================================================================
  // SUCCESS: Celebration (REUSED from legacy)
  // Confetti, benefits, next steps
  // =============================================================================
  {
    id: 'success',
    title: '¡Bienvenido!',
    duration: 30,
    type: 'success',
    content: {
      title: '¡Ya eres parte de CryptoGift!',
      message: 'Gracias por completar el Video Funnel',
      stats: {
        duration: '7 minutos',
        knowledge: '100% blockchain ready',
        status: 'Early Adopter Verificado'
      },
      benefits: [
        { icon: Mail, text: 'Recibirás información exclusiva' },
        { icon: Gift, text: 'NFT de fundador próximamente' },
        { icon: DollarSign, text: 'Acceso prioritario a nuevas features' },
        { icon: Rocket, text: 'Invitación a eventos privados' }
      ],
      finalMessage: 'El futuro de los pagos digitales comienza contigo.'
    },
    triggers: ['celebration', 'achievement']
  }
];

// 🔒 PERSISTENCE: Import type for saved education state
import type { EducationBlockState } from '@/lib/invites/invite-flow-persistence';

interface SalesMasterclassProps {
  educationalMode?: boolean;
  giftId?: string; // CRITICAL FIX: Add giftId for appointment tracking
  tokenId?: string; // CRITICAL FIX: Add tokenId for appointment tracking
  onEducationComplete?: (data?: {
    email?: string;
    questionsScore?: { correct: number; total: number };
    questionsAnswered?: QuestionAnswer[]; // FASE 2: Detailed answers array
  }) => void;
  onShowEmailVerification?: () => Promise<void>;
  onShowCalendar?: () => Promise<void>;
  onShowTwitterFollow?: () => Promise<void>; // NEW: For social engagement
  onShowDiscordJoin?: () => Promise<void>; // NEW: For community engagement
  verifiedEmail?: string;
  // 🔒 PERSISTENCE: Granular state persistence
  savedEducationState?: EducationBlockState | null;
  onEducationStateChange?: (state: {
    blockIndex: number;
    blockId: string;
    introVideoCompleted: boolean;
    questionAnswered?: {
      blockId: string;
      questionText: string;
      selectedAnswer: string;
      correctAnswer: string;
      isCorrect: boolean;
    };
  }) => void;
  // 🔙 NAVIGATION: Callback to go back to Welcome step
  onBackToWelcome?: () => void;
  // 🆕 PERSISTENCE: Social verification state (restored from localStorage)
  savedSocialVerification?: {
    twitter: { verified: boolean; username: string | null; userId: string | null } | null;
    discord: { verified: boolean; username: string | null; userId: string | null } | null;
  } | null;
  onSocialVerified?: (platform: 'twitter' | 'discord', data: { username: string; userId: string }) => void;
  // 🆕 PERSISTENCE: Selected role/path state (restored from localStorage)
  savedSelectedPath?: string | null;
  onPathSelected?: (path: string) => void;
}

const SalesMasterclass: React.FC<SalesMasterclassProps> = ({
  educationalMode = false,
  giftId, // CRITICAL FIX: Receive giftId from parent
  tokenId, // CRITICAL FIX: Receive tokenId from parent
  onEducationComplete,
  onShowEmailVerification,
  onShowCalendar,
  onShowTwitterFollow, // NEW: For social engagement
  onShowDiscordJoin, // NEW: For community engagement
  verifiedEmail,
  // 🔒 PERSISTENCE: Receive saved state and change callback
  savedEducationState,
  onEducationStateChange,
  // 🔙 NAVIGATION: Callback to go back to Welcome step
  onBackToWelcome,
  // 🆕 PERSISTENCE: Social verification state (restored from localStorage)
  savedSocialVerification,
  onSocialVerified,
  // 🆕 PERSISTENCE: Selected role/path state (restored from localStorage)
  savedSelectedPath,
  onPathSelected
}) => {
  // Video configs from Spanish config file
  const introVideoConfig = VIDEO_CONFIG.salesMasterclass;
  const outroVideoConfig = VIDEO_CONFIG.presentationCGC;

  // i18n translations for Top Contributors section
  const t = useTranslations('landing');

  console.log('🚀 SALES MASTERCLASS INIT:', {
    educationalMode,
    hasOnEducationComplete: !!onEducationComplete,
    giftId,
    tokenId,
    introVideoId: introVideoConfig.lessonId,
    outroVideoId: outroVideoConfig.lessonId
  });
  
  // Defensive initialization - ensure all state variables are properly initialized
  const [isComponentInitialized, setIsComponentInitialized] = useState(false);
  useEffect(() => {
    setIsComponentInitialized(true);
    console.log('✅ SalesMasterclass component fully initialized');

    // Enhanced scroll to top logic
    const scrollToTop = () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;

      // Remove any transform or translate styles that might affect positioning
      document.body.style.transform = '';
      document.body.style.position = '';
    };

    // Immediate scroll
    scrollToTop();

    // Delayed scroll to ensure DOM is ready
    const timer = setTimeout(scrollToTop, 100);

    return () => clearTimeout(timer);
  }, []);
  
  // Hooks
  const account = useActiveAccount();
  
  // State
  // 🔒 V2 UPDATE: video1 ("El Regalo") is now shown in the invite page
  // The masterclass now starts directly at video2 ("La Solución")
  // Index mapping: 0=video1(skipped), 1=checkpoint(skipped), 2=video2(START HERE)
  const VIDEO2_START_INDEX = 2; // video2 "La Solución" is at index 2

  const [showIntroVideo, setShowIntroVideo] = useState(() => {
    // V2 NEVER shows the old intro video - video1 is in the invite page now
    console.log('[SalesMasterclassV2] 🎬 V2 mode: video1 is in invite page, starting at video2');
    return false;
  });
  const [currentBlock, setCurrentBlock] = useState(() => {
    // Restore from saved state if available
    if (savedEducationState?.currentBlockIndex !== undefined) {
      const savedIndex = savedEducationState.currentBlockIndex;
      // CRITICAL FIX: Bounds validation - V2 has fewer blocks than legacy (8 vs 11)
      // If user had legacy progress, their saved index may be out of bounds for V2
      if (savedIndex >= 0 && savedIndex < SALES_BLOCKS.length) {
        // If saved at video1 or checkpoint, skip to video2
        if (savedIndex < VIDEO2_START_INDEX) {
          console.log('[SalesMasterclassV2] 🔒 Saved index was', savedIndex, '- skipping to video2 at index', VIDEO2_START_INDEX);
          return VIDEO2_START_INDEX;
        }
        console.log('[SalesMasterclassV2] 🔒 Restored: currentBlockIndex =', savedIndex);
        return savedIndex;
      } else {
        console.warn('[SalesMasterclassV2] ⚠️ Invalid saved index:', savedIndex,
          '(max:', SALES_BLOCKS.length - 1, ') - starting at video2');
        return VIDEO2_START_INDEX;
      }
    }
    // Default: Start at video2 (index 2) since video1 is now in invite page
    return VIDEO2_START_INDEX;
  });
  const [timeLeft, setTimeLeft] = useState(() => {
    // Use saved block's duration if restoring
    if (savedEducationState?.currentBlockIndex !== undefined) {
      const savedIndex = savedEducationState.currentBlockIndex;
      if (savedIndex >= VIDEO2_START_INDEX && savedIndex < SALES_BLOCKS.length) {
        return SALES_BLOCKS[savedIndex]?.duration || SALES_BLOCKS[VIDEO2_START_INDEX].duration;
      }
    }
    return SALES_BLOCKS[VIDEO2_START_INDEX].duration;
  });
  const [isPaused, setIsPaused] = useState(false);

  // 🔒 PERSISTENCE: Compute score from saved state if available
  const [leadData, setLeadData] = useState<Partial<LeadData>>(() => {
    if (savedEducationState?.questionsAnswered && savedEducationState.questionsAnswered.length > 0) {
      const correctCount = savedEducationState.questionsAnswered.filter(q => q.isCorrect).length;
      const totalCount = savedEducationState.questionsAnswered.length;
      console.log('[SalesMasterclass] 🔒 Restored score:', correctCount, '/', totalCount);
      return {
        questionsCorrect: correctCount,
        totalQuestions: totalCount
      };
    }
    return {
      questionsCorrect: 0,
      totalQuestions: 0
    };
  });

  // 🔒 PERSISTENCE: Restore metrics from saved state
  const [metrics, setMetrics] = useState<Metrics>(() => {
    const baseMetrics: Metrics = {
      startTime: Date.now(),
      blockTimes: {},
      interactions: 0,
      claimSuccess: false,
      leadSubmitted: false,
      wowMoments: 0,
      questionsAnswered: 0,
      correctAnswers: 0
    };

    if (savedEducationState?.questionsAnswered && savedEducationState.questionsAnswered.length > 0) {
      const correctCount = savedEducationState.questionsAnswered.filter(q => q.isCorrect).length;
      baseMetrics.questionsAnswered = savedEducationState.questionsAnswered.length;
      baseMetrics.correctAnswers = correctCount;
      console.log('[SalesMasterclass] 🔒 Restored metrics:', correctCount, '/', savedEducationState.questionsAnswered.length);
    }

    return baseMetrics;
  });
  const [showQR, setShowQR] = useState(false);
  const [claimStatus, setClaimStatus] = useState<'waiting' | 'claiming' | 'success'>('waiting');
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showQuestionFeedback, setShowQuestionFeedback] = useState(false);
  const [canProceed, setCanProceed] = useState(false);
  const [showEducationalValidation, setShowEducationalValidation] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState<boolean>(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [questionsAnswered, setQuestionsAnswered] = useState<QuestionAnswer[]>([]); // FASE 2: Detailed answer tracking
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now()); // FASE 2: Track time per question

  // Removed router dependency to avoid App Router/Pages Router conflicts
  const timerRef = useRef<NodeJS.Timeout>();

  // Educational Mode Initialization - Only on mount or mode change
  useEffect(() => {
    if (educationalMode) {
      console.log('🎓 EDUCATIONAL MODE ACTIVATED - Setting optimized flow');
      // In educational mode, reduce timers and enable smoother progression
      setCanProceed(true); // Allow immediate progression if needed
      
      // Reduce block duration for educational mode (faster pace)
      const currentBlockDuration = SALES_BLOCKS[0].duration; // Use initial block
      const educationalDuration = Math.min(currentBlockDuration, 15); // Max 15 seconds per block
      setTimeLeft(educationalDuration);
      
      console.log('⏱️ Educational mode timing:', {
        originalDuration: currentBlockDuration,
        educationalDuration,
        currentBlock: SALES_BLOCKS[0].id
      });
    }
  }, [educationalMode]); // Remove currentBlock dependency to avoid loops

  // Scroll to top on state changes
  useEffect(() => {
    // Enhanced scroll handling for state changes
    const scrollToTop = () => {
      // Temporarily disable smooth scrolling
      const originalScrollBehavior = document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior = 'auto';

      // Reset all scroll positions
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;

      // Remove any transform or translate styles
      document.body.style.transform = '';
      document.body.style.position = '';

      // Find and reset the lesson modal content container
      const lessonContainer = document.getElementById('lesson-content-scroll-container');
      if (lessonContainer) {
        lessonContainer.scrollTop = 0;
      }

      // Ensure we're not stuck in a fixed position
      const wrapper = document.querySelector('.sales-masterclass-wrapper');
      if (wrapper) {
        wrapper.scrollTop = 0;
      }

      // Restore scroll behavior
      setTimeout(() => {
        document.documentElement.style.scrollBehavior = originalScrollBehavior;
      }, 50);
    };

    // Immediate scroll
    scrollToTop();

    // Delayed scroll for safety
    const timer = setTimeout(scrollToTop, 100);

    return () => clearTimeout(timer);
  }, [showIntroVideo, currentBlock]); // Re-run on key state changes

  // QR Generation
  const generateDemoGiftUrl = useCallback(() => {
    const demoId = Math.random().toString(36).substring(7);
    return `${GIFT_CLAIM_URL}${demoId}`;
  }, []);

  // Simple celebration - NO confetti for individual questions
  const celebrate = useCallback(() => {
    // Just console log for individual questions - no visual confetti
    console.log('🎯 Question answered correctly!');
    
    setMetrics(prev => ({
      ...prev,
      wowMoments: prev.wowMoments + 1
    }));
  }, []);

  // Timer Management
  useEffect(() => {
    if (!isPaused && timeLeft > 0 && !showQuestionFeedback) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      // ✅ FIX #3: Timer NO auto-avanza, solo oculta el botón
      // Cuando el timer se agota, simplemente mantener canProceed = false
      // El usuario debe esperar o hacer algo para proceder manualmente
      console.log('⏰ TIME UP - Button hidden, waiting for user action:', {
        currentBlock,
        timeLeft: 0,
        canProceed: false,
        educationalMode
      });
      // No llamamos handleNextBlock() automáticamente
      setCanProceed(false); // Ocultar botón cuando se acaba el tiempo
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeLeft, isPaused, currentBlock, showQuestionFeedback, educationalMode]);

  // Answer Handler
  const handleAnswerSelect = useCallback((optionIndex: number) => {
    setSelectedAnswer(optionIndex);
    setShowQuestionFeedback(true);

    const block = SALES_BLOCKS[currentBlock];
    const isCorrect = block.question?.options[optionIndex].isCorrect || false;

    setMetrics(prev => ({
      ...prev,
      questionsAnswered: prev.questionsAnswered + 1,
      correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0)
    }));

    setLeadData(prev => ({
      ...prev,
      totalQuestions: (prev.totalQuestions || 0) + 1,
      questionsCorrect: (prev.questionsCorrect || 0) + (isCorrect ? 1 : 0)
    }));

    // FASE 2: Save detailed answer tracking
    if (block.question) {
      const timeSpent = Math.round((Date.now() - questionStartTime) / 1000); // seconds
      const questionId = `q${currentBlock}_${block.id}`;
      const selectedOption = block.question.options[optionIndex];
      const correctOption = block.question.options.find(opt => opt.isCorrect);

      const answerDetail: QuestionAnswer = {
        questionId,
        questionText: block.question.text,
        selectedAnswer: selectedOption.text,
        correctAnswer: correctOption?.text || '',
        isCorrect,
        timeSpent
      };

      setQuestionsAnswered(prev => [...prev, answerDetail]);
      console.log('📝 Answer recorded:', answerDetail);

      // 🔒 PERSISTENCE: Save question answer to localStorage
      if (onEducationStateChange) {
        onEducationStateChange({
          blockIndex: currentBlock,
          blockId: block.id,
          introVideoCompleted: true, // If answering questions, intro is done
          questionAnswered: {
            blockId: block.id,
            questionText: block.question.text,
            selectedAnswer: selectedOption.text,
            correctAnswer: correctOption?.text || '',
            isCorrect
          }
        });
        console.log('[SalesMasterclass] 🔒 Persisted: question answer for block', block.id);
      }

      // Reset timer for next question
      setQuestionStartTime(Date.now());
    }

    if (isCorrect) {
      celebrate();
    }

    // Allow proceeding after answering
    setTimeout(() => {
      setCanProceed(true);
    }, 1500);
  }, [currentBlock, celebrate, questionStartTime, onEducationStateChange]);

  // FASE 2: State machine declarativa con next pointers
  const getNextBlock = useCallback((currentBlockIndex: number): number | null => {
    const currentBlockData = SALES_BLOCKS[currentBlockIndex];
    
    if (!currentBlockData || !currentBlockData.nextBlock) {
      console.log('🏁 End of flow reached, no next block defined');
      return null;
    }
    
    // Find next block by ID using the next pointer
    const nextBlockIndex = SALES_BLOCKS.findIndex(block => block.id === currentBlockData.nextBlock);
    
    if (nextBlockIndex === -1) {
      console.error('❌ Next block not found:', currentBlockData.nextBlock);
      return null;
    }
    
    console.log('🔄 State machine navigation:', {
      currentBlock: currentBlockData.id,
      nextBlock: currentBlockData.nextBlock,
      nextBlockIndex
    });
    
    return nextBlockIndex;
  }, []);

  // Block Navigation
  const handleNextBlock = useCallback(() => {
    // Use state machine with next pointers instead of sequential navigation
    const nextBlockIndex = getNextBlock(currentBlock);
    
    console.log('🎬 BLOCK NAVIGATION (State Machine):', {
      currentBlock,
      currentBlockId: SALES_BLOCKS[currentBlock].id,
      nextBlockIndex,
      nextBlockId: nextBlockIndex !== null ? SALES_BLOCKS[nextBlockIndex].id : 'END',
      educationalMode
    });
    
    if (nextBlockIndex !== null) {
      setCurrentBlock(nextBlockIndex);

      // 🔒 PERSISTENCE: Save the new block index
      if (onEducationStateChange) {
        onEducationStateChange({
          blockIndex: nextBlockIndex,
          blockId: SALES_BLOCKS[nextBlockIndex].id,
          introVideoCompleted: true, // We're past the intro if navigating blocks
        });
        console.log('[SalesMasterclass] 🔒 Saved: blockIndex =', nextBlockIndex, SALES_BLOCKS[nextBlockIndex].id);
      }

      // Force scroll to top when changing blocks
      setTimeout(() => {
        // Temporarily disable smooth scrolling
        const originalScrollBehavior = document.documentElement.style.scrollBehavior;
        document.documentElement.style.scrollBehavior = 'auto';

        // Reset all possible scroll containers
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;

        // Try to find and reset the lesson modal content container
        const lessonContainer = document.getElementById('lesson-content-scroll-container');
        if (lessonContainer) {
          lessonContainer.scrollTop = 0;
        }

        // Also try educational mode wrapper
        const mainContainer = document.querySelector('.educational-mode-wrapper');
        if (mainContainer) {
          mainContainer.scrollTop = 0;
        }

        // Restore scroll behavior
        setTimeout(() => {
          document.documentElement.style.scrollBehavior = originalScrollBehavior;
        }, 50);
      }, 100);

      // Set appropriate duration for educational vs normal mode
      const blockDuration = educationalMode
        ? Math.min(SALES_BLOCKS[nextBlockIndex].duration, 15) // Max 15s in educational mode
        : SALES_BLOCKS[nextBlockIndex].duration; // Full duration in normal mode

      setTimeLeft(blockDuration);
      setSelectedAnswer(null);
      setShowQuestionFeedback(false);

      // In educational mode, keep canProceed true for smooth flow
      setCanProceed(educationalMode);

      console.log('⏱️ Next block timing:', {
        blockId: SALES_BLOCKS[nextBlockIndex].id,
        originalDuration: SALES_BLOCKS[nextBlockIndex].duration,
        actualDuration: blockDuration,
        educationalMode
      });

      // Track metrics
      setMetrics(prev => ({
        ...prev,
        blockTimes: {
          ...prev.blockTimes,
          [SALES_BLOCKS[currentBlock].id]: Date.now() - prev.startTime
        }
      }));

      // Special actions per block
      if (SALES_BLOCKS[nextBlockIndex].type === 'demo') {
        setShowQR(true);
        startClaimMonitoring();
      }
    }
  }, [currentBlock, educationalMode, getNextBlock, onEducationStateChange]);

  // 🔙 BACK BUTTON: Navigate to previous block
  // V2: When at VIDEO2_START_INDEX, go back to previous PAGE (not previous block)
  // V2 NEVER allows going to blocks 0 or 1 (video1 and checkpoint are obsolete)
  const handlePreviousBlock = useCallback(() => {
    // If at first V2 block or below, go back to previous page instead of previous block
    if (currentBlock <= VIDEO2_START_INDEX) {
      console.log('🔙 At first V2 block - navigating back to previous page');
      // Prefer onBackToWelcome callback over browser history
      if (onBackToWelcome) {
        onBackToWelcome();
        return;
      }
      // Fallback: Use browser history to go back to the presentation/invite page
      if (typeof window !== 'undefined') {
        window.history.back();
      }
      return;
    }

    // 🔒 V2 SAFETY: Never go below VIDEO2_START_INDEX
    const previousBlockIndex = Math.max(currentBlock - 1, VIDEO2_START_INDEX);

    console.log('🔙 BACK NAVIGATION:', {
      currentBlock,
      currentBlockId: SALES_BLOCKS[currentBlock].id,
      previousBlockIndex,
      previousBlockId: SALES_BLOCKS[previousBlockIndex].id
    });

    setCurrentBlock(previousBlockIndex);

    // 🔒 PERSISTENCE: Save the new block index (going back)
    if (onEducationStateChange) {
      onEducationStateChange({
        blockIndex: previousBlockIndex,
        blockId: SALES_BLOCKS[previousBlockIndex].id,
        introVideoCompleted: true,
      });
      console.log('[SalesMasterclass] 🔒 Saved (back): blockIndex =', previousBlockIndex);
    }

    // Force scroll to top
    setTimeout(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      const lessonContainer = document.getElementById('lesson-content-scroll-container');
      if (lessonContainer) lessonContainer.scrollTop = 0;
    }, 100);

    // Set duration for the previous block
    const blockDuration = educationalMode
      ? Math.min(SALES_BLOCKS[previousBlockIndex].duration, 15)
      : SALES_BLOCKS[previousBlockIndex].duration;

    setTimeLeft(blockDuration);
    setSelectedAnswer(null);
    setShowQuestionFeedback(false);
    setCanProceed(educationalMode);
  }, [currentBlock, educationalMode, onEducationStateChange, onBackToWelcome]);

  // 🔙 Handler to go back to intro video from OpeningBlock (block 0)
  const handleBackToVideo = useCallback(() => {
    console.log('🔙 BACK TO VIDEO: Returning to intro video from OpeningBlock');
    setShowIntroVideo(true);

    // 🔒 PERSISTENCE: Reset intro video state so it shows again
    if (onEducationStateChange) {
      onEducationStateChange({
        blockIndex: 0,
        blockId: SALES_BLOCKS[0].id,
        introVideoCompleted: false,
      });
      console.log('[SalesMasterclass] 🔒 Reset: introVideoCompleted = false');
    }

    // Force scroll to top
    setTimeout(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      const lessonContainer = document.getElementById('lesson-content-scroll-container');
      if (lessonContainer) lessonContainer.scrollTop = 0;
    }, 100);
  }, [onEducationStateChange]);

  // Claim Monitoring
  const startClaimMonitoring = useCallback(() => {
    // Simulate claim detection with error handling
    try {
      setTimeout(() => {
        setClaimStatus('claiming');
        setTimeout(() => {
          try {
            setClaimStatus('success');
            celebrate();
            setMetrics(prev => ({ ...prev, claimSuccess: true }));
            setCanProceed(true);
          } catch (error) {
            console.error('Error during claim success:', error);
            // Still set success even if confetti fails
            setClaimStatus('success');
            setCanProceed(true);
          }
        }, 3000);
      }, 5000);
    } catch (error) {
      console.error('Error starting claim monitoring:', error);
      // Fallback to immediate success
      setTimeout(() => {
        setClaimStatus('success');
        setCanProceed(true);
      }, 1000);
    }
  }, [celebrate]);

  // Lead Submission
  const handleLeadSubmit = useCallback(async (data: {
    name: string;
    email: string;
    company: string;
    role: string;
    interest: string;
    path?: string;
    contact?: string;
    questionsScore?: {
      correct: number;
      total: number;
    };
  }) => {
    console.log('📝 LEAD SUBMIT:', { data, educationalMode, hasOnEducationComplete: !!onEducationComplete });
    
    // Store lead data including selected path
    setLeadData(prev => ({
      ...prev,
      path: (data.path as 'quest' | 'integration' | 'whitelabel' | 'investor' | 'community') || prev.path,
      contact: data.contact || prev.contact,
      questionsCorrect: data.questionsScore?.correct || prev.questionsCorrect,
      totalQuestions: data.questionsScore?.total || prev.totalQuestions
    }));
    
    // In educational mode, show validation page before completing
    if (educationalMode) {
      console.log('🎓 EDUCATIONAL MODE - Showing validation page');
      setMetrics(prev => ({ ...prev, leadSubmitted: true }));
      
      // FIX: Proceder directamente al bloque de success
      // El usuario ya completó los checkboxes, ahora debe ver "¡Ya eres parte de CryptoGift!"
      console.log('🎆 Educational capture complete - moving to success block');
      handleNextBlock();
      
      // NO llamar onEducationComplete aquí - debe ser después del botón "IR AL CLAIM"
      
      return;
    }
    
    // Normal lead capture flow for non-educational mode
    const finalData = {
      ...leadData,
      ...data,
      metrics,
      timestamp: Date.now()
    };
    
    console.log('Submitting lead:', finalData);
    
    try {
      const response = await fetch('/api/leads/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalData)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Lead captured successfully:', result);
        
        // Show success message
        if (result.message) {
          alert(result.message); // In production, use a proper toast notification
        }
        
        setMetrics(prev => ({ ...prev, leadSubmitted: true }));
        celebrate();
        
        // Send completion event for educational mode
        if (window.parent !== window) {
          window.parent.postMessage({ type: 'MASTERCLASS_COMPLETE' }, '*');
        }
        
        // Move to final success state after a delay
        setTimeout(() => {
          handleNextBlock();
        }, 3000);
      } else {
        console.error('Failed to submit lead');
        alert('Error al enviar el formulario. Por favor intenta de nuevo.');
      }
    } catch (error) {
      console.error('Error submitting lead:', error);
      alert('Error de conexión. Por favor verifica tu internet e intenta de nuevo.');
    }
  }, [leadData, metrics, celebrate, handleNextBlock, educationalMode, onEducationComplete]);

  // Email verification handler
  const handleEmailVerified = useCallback(async (email: string) => {
    // verifiedEmail is now managed by parent LessonModalWrapper
    setShowEmailVerification(false);

    // CRITICAL FIX: In educational mode, use parent's calendar modal (with giftId/tokenId)
    if (educationalMode && onShowCalendar) {
      await onShowCalendar();
    } else {
      setShowCalendar(true);
    }
  }, [setShowEmailVerification, setShowCalendar, educationalMode, onShowCalendar]);

  // Calendar booking success handler
  const handleBookingSuccess = useCallback(() => {
    setShowCalendar(false);
    console.log('📅 Calendar booking completed successfully');
  }, []);

  // ✅ FIX #2: ELIMINAR EL PADDING BOTTOM QUE CAUSA EL ESPACIO VACÍO
  useEffect(() => {
    if (educationalMode) {
      const styleElement = document.createElement('style');
      styleElement.id = 'educational-fix-padding';
      styleElement.textContent = `
        .educational-mode-wrapper > div {
          padding-bottom: 0 !important;
        }
        .educational-mode-wrapper .NavigationArea {
          flex: 1 !important;
        }
      `;
      document.head.appendChild(styleElement);
      
      return () => {
        const existingStyle = document.getElementById('educational-fix-padding');
        if (existingStyle) {
          existingStyle.remove();
        }
      };
    }
  }, [educationalMode]);


  // Render Block Content
  const renderBlockContent = () => {
    // Safety check - ensure component is fully initialized
    if (!isComponentInitialized) {
      return <div className="py-12 text-center">Inicializando...</div>;
    }
    
    // Show educational validation page if flag is set
    if (showEducationalValidation && educationalMode) {
      return (
        <div className="py-12 text-center">
          <motion.h2 
            className="text-5xl font-bold mb-8 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-center gap-3">
              <span>¡Felicidades!</span>
              <PartyPopper className="w-12 h-12 text-blue-600 dark:text-blue-400" />
            </div>
          </motion.h2>
          
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="inline-block bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl backdrop-saturate-150 border border-gray-200/50 dark:border-gray-700/50 px-8 py-6 rounded-2xl shadow-xl hover:shadow-2xl hover:bg-white/90 dark:hover:bg-gray-800/90 transition-all duration-300 hover:scale-[1.02]">
              <p className="text-3xl mb-4">
                Tu puntuación: <span className="font-bold text-blue-500 dark:text-blue-400">
                  {leadData.questionsCorrect}/{leadData.totalQuestions}
                </span> respuestas correctas
              </p>
              {leadData.questionsCorrect && leadData.questionsCorrect >= 7 && (
                <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-green-400 font-bold text-xl">
                  <span>¡EXCELENTE! Has aprendido sobre CryptoGift</span>
                  <Trophy className="w-6 h-6" />
                </div>
              )}
            </div>
          </motion.div>
          
          <motion.p
            className="text-xl text-gray-700 dark:text-gray-300 mb-8 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Has completado exitosamente el módulo educativo &quot;Proyecto CryptoGift&quot;.
            {leadData.path && (
              <span className="block mt-2 text-yellow-600 dark:text-yellow-400">
                Tu rol seleccionado: <strong>{leadData.path}</strong>
              </span>
            )}
          </motion.p>

          <motion.div
            className="mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
              Generando tu certificación EIP-712...
            </p>
            <div className="animate-spin w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full mx-auto" />
          </motion.div>
          
          <motion.div
            className="flex items-center justify-center gap-2 text-2xl font-bold text-emerald-600 dark:text-green-400"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 }}
          >
            <span>EDUCACIÓN COMPLETADA</span>
            <CheckCircle className="w-8 h-8" />
          </motion.div>
        </div>
      );
    }
    
    // 🔒 V2 SAFETY: NEVER render blocks before VIDEO2_START_INDEX (video1 and checkpoint are obsolete)
    // This is a safeguard in case currentBlock somehow becomes 0 or 1
    const safeBlockIndex = Math.max(currentBlock, VIDEO2_START_INDEX);
    if (safeBlockIndex !== currentBlock) {
      console.warn('⚠️ [V2 SAFETY] currentBlock was', currentBlock, '- auto-correcting to', safeBlockIndex);
      // Auto-correct the state
      setCurrentBlock(safeBlockIndex);
      return <div className="py-12 text-center">Cargando...</div>;
    }

    const block = SALES_BLOCKS[safeBlockIndex];

    console.log('🎬 RENDERING BLOCK:', {
      currentBlock: safeBlockIndex,
      blockId: block.id,
      blockType: block.type,
      educationalMode,
      totalBlocks: SALES_BLOCKS.length
    });

    switch (block.type) {
      case 'opening':
        return <OpeningBlock
          content={block.content}
          question={block.question}
          onAnswer={handleAnswerSelect}
          selectedAnswer={selectedAnswer}
          showFeedback={showQuestionFeedback}
          onNext={handleNextBlock}
          onPrevious={currentBlock === 0 ? handleBackToVideo : handlePreviousBlock}
          canProceed={canProceed}
          canGoBack={true}
          timeLeft={timeLeft}
        />;
      case 'problem':
        return <ProblemBlock
          content={block.content}
          question={block.question}
          onAnswer={handleAnswerSelect}
          selectedAnswer={selectedAnswer}
          showFeedback={showQuestionFeedback}
          onNext={handleNextBlock}
          onPrevious={handlePreviousBlock}
          canProceed={canProceed}
          canGoBack={currentBlock > 0}
          timeLeft={timeLeft}
        />;
      case 'solution':
        return <SolutionBlock
          content={block.content}
          question={block.question}
          onAnswer={handleAnswerSelect}
          selectedAnswer={selectedAnswer}
          showFeedback={showQuestionFeedback}
          onNext={handleNextBlock}
          onPrevious={handlePreviousBlock}
          canProceed={canProceed}
          canGoBack={currentBlock > 0}
          timeLeft={timeLeft}
        />;
      case 'demo':
        return <DemoBlock
          content={block.content}
          question={block.question}
          showQR={showQR}
          giftUrl={generateDemoGiftUrl()}
          claimStatus={claimStatus}
          onAnswer={handleAnswerSelect}
          selectedAnswer={selectedAnswer}
          showFeedback={showQuestionFeedback}
          onNext={handleNextBlock}
          onPrevious={handlePreviousBlock}
          canProceed={canProceed}
          canGoBack={currentBlock > 0}
          timeLeft={timeLeft}
        />;
      case 'comparison':
        return <ComparisonBlock
          content={block.content}
          question={block.question}
          onAnswer={handleAnswerSelect}
          selectedAnswer={selectedAnswer}
          showFeedback={showQuestionFeedback}
          onNext={handleNextBlock}
          onPrevious={handlePreviousBlock}
          canProceed={canProceed}
          canGoBack={currentBlock > 0}
          timeLeft={timeLeft}
        />;
      case 'cases':
        return <CasesBlock
          content={block.content}
          question={block.question}
          onAnswer={handleAnswerSelect}
          selectedAnswer={selectedAnswer}
          showFeedback={showQuestionFeedback}
          onNext={handleNextBlock}
          onPrevious={handlePreviousBlock}
          canProceed={canProceed}
          canGoBack={currentBlock > 0}
          timeLeft={timeLeft}
        />;
      case 'business':
        return <BusinessBlock
          content={block.content}
          question={block.question}
          onAnswer={handleAnswerSelect}
          selectedAnswer={selectedAnswer}
          showFeedback={showQuestionFeedback}
          onNext={handleNextBlock}
          onPrevious={handlePreviousBlock}
          canProceed={canProceed}
          canGoBack={currentBlock > 0}
          timeLeft={timeLeft}
        />;
      case 'roadmap':
        return <RoadmapBlock
          content={block.content}
          question={block.question}
          onAnswer={handleAnswerSelect}
          selectedAnswer={selectedAnswer}
          showFeedback={showQuestionFeedback}
          onNext={handleNextBlock}
          onPrevious={handlePreviousBlock}
          canProceed={canProceed}
          canGoBack={currentBlock > 0}
          timeLeft={timeLeft}
        />;
      case 'close':
        return <CloseBlock
          content={block.content}
          question={block.question}
          onAnswer={handleAnswerSelect}
          selectedAnswer={selectedAnswer}
          showFeedback={showQuestionFeedback}
          onNext={handleNextBlock}
          onPrevious={handlePreviousBlock}
          canProceed={canProceed}
          canGoBack={currentBlock > 0}
          timeLeft={timeLeft}
        />;
      case 'capture':
        return <CaptureBlock
          content={block.content}
          onSubmit={handleLeadSubmit}
          questionsScore={{
            correct: leadData.questionsCorrect || 0,
            total: leadData.totalQuestions || 0
          }}
          educationalMode={educationalMode}
          // Email verification props - Use parent's callbacks in educational mode
          onShowEmailVerification={educationalMode && onShowEmailVerification ? onShowEmailVerification : () => setShowEmailVerification(true)}
          onShowCalendar={educationalMode && onShowCalendar ? onShowCalendar : () => setShowCalendar(true)}
          // Social engagement props - NEW for role-specific actions
          onShowTwitterFollow={educationalMode && onShowTwitterFollow ? onShowTwitterFollow : undefined}
          onShowDiscordJoin={educationalMode && onShowDiscordJoin ? onShowDiscordJoin : undefined}
          verifiedEmail={verifiedEmail}
          // Navigation props for back button
          onPrevious={handlePreviousBlock}
          canGoBack={currentBlock > 0}
          // 🆕 PERSISTENCE: Social verification state (restored from localStorage)
          savedSocialVerification={savedSocialVerification}
          onSocialVerified={onSocialVerified}
          // 🆕 PERSISTENCE: Selected role/path state (restored from localStorage)
          savedSelectedPath={savedSelectedPath}
          onPathSelected={onPathSelected}
        />;

      // ==========================================================================
      // V2 VIDEO FUNNEL BLOCKS
      // ==========================================================================

      case 'video': {
        // V2: Video block using IntroVideoGate
        // Requires videoConfigKey in block definition
        const videoConfigForBlock = block.videoConfigKey ? VIDEO_CONFIG[block.videoConfigKey] : null;
        if (!videoConfigForBlock) {
          console.error(`❌ Missing videoConfigKey for video block: ${block.id}`);
          return null;
        }
        // V2: First V2 block is video2 (index 2), not video1 (index 0)
        // video1 is now shown in the invite page, so "first block" = VIDEO2_START_INDEX
        // Back button ALWAYS works - handlePreviousBlock uses history.back() at first block
        const isFirstV2Block = currentBlock === VIDEO2_START_INDEX;
        const backHandler = isFirstV2Block
          ? (onBackToWelcome || handlePreviousBlock)  // Use onBackToWelcome if available, fallback to handlePreviousBlock (which uses history.back())
          : handlePreviousBlock;
        const canNavigateBack = true; // Always allow going back

        return <VideoBlock
          videoConfig={videoConfigForBlock}
          blockTitle={block.title}
          blockDescription={block.content?.description}
          onComplete={handleNextBlock}
          onPrevious={backHandler}
          canGoBack={canNavigateBack}
        />;
      }

      case 'checkpoint':
        // V2: Simple emotional engagement (NOT a quiz)
        // Requires checkpointQuestion in block definition
        // NOTE: In V2, checkpoint is skipped but kept for backwards compatibility
        return <CheckpointBlock
          question={block.checkpointQuestion || '¿Esto resuena contigo?'}
          title={block.title}
          description={block.content?.description}
          onContinue={handleNextBlock}
          onPrevious={handlePreviousBlock}
          canGoBack={true}
        />;

      case 'social':
        // V2: Twitter/Discord verification step
        return <SocialBlock
          content={block.content || { title: 'Síguenos', description: 'Únete a la comunidad' }}
          onComplete={handleNextBlock}
          onPrevious={handlePreviousBlock}
          canGoBack={true}
          savedSocialVerification={savedSocialVerification}
          onSocialVerified={onSocialVerified}
        />;

      case 'success':
        return <SuccessBlock
          content={block.content}
          leadData={leadData}
          metrics={metrics}
          educationalMode={educationalMode}
          onEducationComplete={onEducationComplete}
          verifiedEmail={verifiedEmail}
          galleryVideoConfig={{
            muxPlaybackId: outroVideoConfig.muxPlaybackId,
            title: outroVideoConfig.title,
            description: outroVideoConfig.description || '',
          }}
        />;
      default:
        return null;
    }
  };

  // Prevent rendering before component is fully initialized
  if (!isComponentInitialized) {
    return <div className="py-12 text-center">Inicializando...</div>;
  }

  // Wrapper styles - simplified in educational mode to prevent overflow
  const wrapperStyle = educationalMode
    ? {} // No transform/scale in educational mode - let container handle it
    : {
        transform: 'scale(0.85)',
        transformOrigin: 'top center',
        width: '117.65%',
        marginLeft: '-8.82%'
      };

  return (
    <div
      className={`sales-masterclass-wrapper ${educationalMode ? 'w-full overflow-hidden' : ''}`}
      style={wrapperStyle}
    >
      <div className={`sales-masterclass ${educationalMode ? 'min-h-0' : 'min-h-screen'}
        bg-gradient-to-br from-slate-50 to-blue-50
        dark:from-gray-900 dark:to-gray-800
        text-gray-900 dark:text-white transition-colors duration-300 relative z-10
        ${educationalMode ? 'pb-24' : ''}`}>
        {/* Header - Hidden in educational mode */}
        {!educationalMode && (
          <div className="fixed top-0 left-0 right-0 z-50 
            bg-white/95 dark:bg-gray-800/95 
            backdrop-blur-xl backdrop-saturate-150 
            border-b border-gray-200/50 dark:border-gray-700/50 
            shadow-xl">
          <div className="max-w-5xl mx-auto px-3 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r 
              from-blue-600 to-purple-600 
              dark:from-blue-400 dark:to-purple-400 
              bg-clip-text text-transparent">
              CryptoGift Masterclass
            </h1>
            <div className="flex gap-2">
              {/* V2: Only show blocks starting from video2 (skip video1 and checkpoint) */}
              {SALES_BLOCKS.slice(VIDEO2_START_INDEX).map((block, idx) => {
                const actualIndex = idx + VIDEO2_START_INDEX;
                return (
                  <div
                    key={block.id}
                    className={`w-2 h-2 rounded-full transition-all ${
                      actualIndex === currentBlock
                        ? 'bg-blue-500 dark:bg-blue-400 w-8'
                        : actualIndex < currentBlock
                          ? 'bg-purple-500 dark:bg-purple-400'
                          : 'bg-gray-300 dark:bg-gray-700'
                    }`}
                  />
                );
              })}
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="font-mono text-lg">
                {metrics.correctAnswers}/{metrics.questionsAnswered}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="font-mono text-lg">
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </span>
            </div>
            
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="px-4 py-2 
                bg-white/50 hover:bg-white/70 
                dark:bg-gray-800/50 dark:hover:bg-gray-800/70 
                backdrop-blur-xl 
                border border-gray-200/30 dark:border-gray-700/30 
                rounded-lg transition-all 
                text-gray-700 dark:text-gray-300 
                shadow-sm hover:shadow-md"
            >
              {isPaused ? 'Resume' : 'Pause'}
            </button>
          </div>
        </div>
      </div>
    )}

      {/* Intro Video Gate - Shows before main content using Mux Player (i18n supported) */}
      {showIntroVideo && (
        <IntroVideoGate
          lessonId={introVideoConfig.lessonId}
          muxPlaybackId={introVideoConfig.muxPlaybackId}
          title={introVideoConfig.title}
          description={introVideoConfig.description}
          onBack={onBackToWelcome}
          onFinish={() => {
            console.log('📹 Intro video completed');
            setShowIntroVideo(false);

            // 🔒 PERSISTENCE: Save intro video completion
            if (onEducationStateChange) {
              onEducationStateChange({
                blockIndex: 0,
                blockId: SALES_BLOCKS[0].id,
                introVideoCompleted: true,
              });
              console.log('[SalesMasterclass] 🔒 Saved: introVideoCompleted = true');
            }

            // Force scroll to top when video finishes
            setTimeout(() => {
              const originalScrollBehavior = document.documentElement.style.scrollBehavior;
              document.documentElement.style.scrollBehavior = 'auto';

              window.scrollTo(0, 0);
              document.documentElement.scrollTop = 0;
              document.body.scrollTop = 0;

              const lessonContainer = document.getElementById('lesson-content-scroll-container');
              if (lessonContainer) {
                lessonContainer.scrollTop = 0;
              }

              setTimeout(() => {
                document.documentElement.style.scrollBehavior = originalScrollBehavior;
              }, 50);
            }, 100);
            // Start the masterclass timer when video finishes
            setTimeLeft(SALES_BLOCKS[0].duration);
          }}
          forceShow={true}
        />
      )}

      {/* Main Content - Only shows after intro video */}
      {!showIntroVideo && (
        <div className={educationalMode ? "h-full flex flex-col px-3" : "pt-20 pb-10 px-3"}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentBlock}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.5 }}
              className={`max-w-4xl mx-auto ${educationalMode ? 'flex-1 flex flex-col' : ''}`}
            >
              <div className={educationalMode ? 'h-full flex flex-col educational-mode-wrapper' : ''}>
                {renderBlockContent()}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* Metrics Overlay (Debug/Admin) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl backdrop-saturate-150 border border-gray-200/50 dark:border-gray-700/50 p-4 rounded-lg text-xs font-mono text-gray-700 dark:text-gray-300 shadow-xl">
          <div>Block: {SALES_BLOCKS[currentBlock].id}</div>
          <div>Questions: {metrics.correctAnswers}/{metrics.questionsAnswered}</div>
          <div>Wow Moments: {metrics.wowMoments}</div>
          <div>Claim: {claimStatus}</div>
          <div className="flex items-center gap-1">Lead: {metrics.leadSubmitted ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}</div>
        </div>
      )}

      {/* EMAIL VERIFICATION MODAL - Only in knowledge mode, educational mode uses parent's modal */}
      {!educationalMode && (
        <EmailVerificationModal
          isOpen={showEmailVerification}
          onClose={() => setShowEmailVerification(false)}
          onVerified={async (email) => {
            // verifiedEmail is now managed by parent LessonModalWrapper
            setShowEmailVerification(false);
            console.log('✅ Email verified for masterclass:', email);

            // CRITICAL FIX: In educational mode, use parent's calendar modal (with giftId/tokenId)
            if (educationalMode && onShowCalendar) {
              await onShowCalendar();
            } else {
              setShowCalendar(true);
            }
          }}
          source="masterclass"
          title="¡Necesitamos tu Email!"
          subtitle="Para enviarte información exclusiva y próximos pasos"
        />
      )}

      {/* CALENDAR BOOKING MODAL - Only in knowledge mode, educational mode uses parent's modal */}
      {!educationalMode && (
        <CalendarBookingModal
          isOpen={showCalendar}
          onClose={() => setShowCalendar(false)}
          giftId={giftId} // CRITICAL FIX: Pass giftId for appointment tracking
          tokenId={tokenId} // CRITICAL FIX: Pass tokenId for appointment tracking
          userEmail={verifiedEmail || undefined}
          userName={leadData.contact || undefined}
          source="masterclass"
        />
      )}
      </div>
    </div>
  );
};

// Question Component
interface QuestionType {
  text: string;
  options: Array<{ text: string; isCorrect: boolean; }>;
}

const QuestionSection: React.FC<{
  question?: QuestionType;
  onAnswer: (index: number) => void;
  selectedAnswer: number | null;
  showFeedback: boolean;
}> = ({ question, onAnswer, selectedAnswer, showFeedback }) => {
  if (!question) return null;

  return (
    <div className="mt-8 p-6 
      bg-green-50/30 dark:bg-green-950/20 
      backdrop-blur-2xl 
      rounded-2xl 
      border border-green-200/15 dark:border-green-800/15 
      shadow-lg hover:shadow-green-500/5">
      <h3 className="text-2xl font-bold mb-4 flex items-center gap-3 
        text-green-800 dark:text-green-200">
        <Lightbulb className="w-7 h-7 text-green-600 dark:text-green-400" />
        <span>Pregunta Rápida:</span>
      </h3>
      <p className="text-xl mb-6 text-green-800 dark:text-green-200">{question.text}</p>
      
      <div className="space-y-3">
        {question.options.map((option: any, idx: number) => (
          <motion.button
            key={idx}
            onClick={() => !showFeedback && onAnswer(idx)}
            disabled={showFeedback}
            className={`w-full p-4 rounded-xl text-left transition-all ${
              showFeedback
                ? selectedAnswer === idx
                  ? option.isCorrect
                    ? 'bg-emerald-100 dark:bg-green-500/30 border-2 border-emerald-500 dark:border-green-500'
                    : 'bg-red-100 dark:bg-red-500/30 border-2 border-red-500'
                  : option.isCorrect
                    ? 'bg-emerald-50 dark:bg-green-500/20 border-2 border-emerald-400/50 dark:border-green-500/50'
                    : 'bg-gray-100 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-600'
                : 'bg-white/50 dark:bg-gray-800/30 backdrop-blur-xl border border-gray-200/30 dark:border-gray-700/30 hover:bg-white/70 dark:hover:bg-gray-800/50 hover:border-blue-400/50 dark:hover:border-blue-500/30 cursor-pointer shadow-sm hover:shadow-md'
            }`}
            whileHover={!showFeedback ? { scale: 1.02 } : {}}
            whileTap={!showFeedback ? { scale: 0.98 } : {}}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">
                {showFeedback
                  ? option.isCorrect
                    ? <CheckCircle className="w-6 h-6 text-emerald-500 dark:text-green-400" />
                    : selectedAnswer === idx
                      ? <XCircle className="w-6 h-6 text-red-500" />
                      : <Circle className="w-6 h-6 text-gray-400" />
                  : [<Hash key="hash" className="w-6 h-6 text-amber-600 dark:text-yellow-400" />,
                     <AtSign key="at" className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
                     <Code key="code" className="w-6 h-6 text-purple-600 dark:text-purple-400" />][idx]}
              </span>
              <span className="text-lg">{option.text}</span>
            </div>
          </motion.button>
        ))}
      </div>
      
      {showFeedback && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 text-center"
        >
          {question.options[selectedAnswer!].isCorrect ? (
            <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-green-400 text-xl font-bold">
              <span>¡Correcto!</span>
              <PartyPopper className="w-6 h-6" />
              <span>Excelente respuesta</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 text-amber-600 dark:text-yellow-400 text-xl">
              <span>Casi... pero la respuesta correcta te sorprenderá</span>
              <AlertCircle className="w-6 h-6" />
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

// ✅ FIX #1: Componente de navegación unificado con espacio fijo + BACK BUTTON
const NavigationArea: React.FC<{
  onNext: () => void;
  onPrevious?: () => void;
  canProceed: boolean;
  canGoBack?: boolean;
  timeLeft: number;
  buttonText?: string;
  buttonIcon?: React.ReactNode;
  buttonColor?: string;
}> = ({
  onNext,
  onPrevious,
  canProceed,
  canGoBack = false,
  timeLeft,
  buttonText = "CONTINUAR",
  buttonIcon = <Rocket className="w-6 h-6" />,
  buttonColor = "from-yellow-500 to-orange-500 text-black"
}) => (
  <div className="NavigationArea text-center mt-8 flex-1 flex flex-col justify-center">
    {canProceed && timeLeft > 0 ? (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* 🔙 BACK + CONTINUE BUTTONS */}
        <div className="flex items-center justify-center gap-4">
          {/* Back Button - Only show if canGoBack */}
          {canGoBack && onPrevious && (
            <motion.button
              onClick={onPrevious}
              className="inline-flex items-center gap-2 px-6 py-4
                         bg-gradient-to-r from-gray-400 to-gray-500 dark:from-gray-600 dark:to-gray-700
                         backdrop-blur-xl
                         font-bold text-lg rounded-xl
                         hover:scale-105 transition-all duration-300
                         shadow-lg hover:shadow-xl
                         border border-white/10
                         cursor-pointer text-white"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-5 h-5" />
              ATRÁS
            </motion.button>
          )}

          {/* Continue Button */}
          <motion.button
            onClick={onNext}
            className={`inline-flex items-center gap-3 px-8 py-4
                       bg-gradient-to-r ${buttonColor}
                       backdrop-blur-xl
                       font-bold text-xl rounded-xl
                       hover:scale-105 transition-all duration-300
                       shadow-lg hover:shadow-xl
                       border border-white/10
                       cursor-pointer`}
            style={{
              animation: 'pulse 1.43s cubic-bezier(0.4, 0, 0.6, 1) infinite'
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {buttonIcon}
            {buttonText}
            <ArrowRight className="w-6 h-6" />
          </motion.button>
        </div>
      </motion.div>
    ) : timeLeft === 0 ? (
      <motion.div
        className="text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* 🔙 BACK + CONTINUE BUTTONS (timeout state) */}
        <div className="flex items-center justify-center gap-4">
          {canGoBack && onPrevious && (
            <motion.button
              onClick={onPrevious}
              className="inline-flex items-center gap-2 px-6 py-4
                         bg-gradient-to-r from-gray-400 to-gray-500 dark:from-gray-600 dark:to-gray-700
                         backdrop-blur-xl
                         font-bold text-lg rounded-xl
                         hover:scale-105 transition-all duration-300
                         shadow-lg hover:shadow-xl
                         border border-white/10
                         cursor-pointer text-white"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-5 h-5" />
              ATRÁS
            </motion.button>
          )}

          <motion.button
            onClick={onNext}
            className={`inline-flex items-center gap-3 px-8 py-4
                       bg-gradient-to-r ${buttonColor}
                       backdrop-blur-xl
                       font-bold text-xl rounded-xl
                       hover:scale-105 transition-all duration-300
                       shadow-lg hover:shadow-xl
                       border border-white/10
                       cursor-pointer`}
            style={{
              animation: 'pulse 1.43s cubic-bezier(0.4, 0, 0.6, 1) infinite'
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {buttonIcon}
            {buttonText}
            <ArrowRight className="w-6 h-6" />
          </motion.button>
        </div>
      </motion.div>
    ) : (
      <motion.div
        className="text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 text-lg">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Procesando respuesta...</span>
        </div>
      </motion.div>
    )}
  </div>
);

// Block Components with Questions
const OpeningBlock: React.FC<{
  content: SalesBlockContent;
  question?: QuestionType;
  onAnswer: (idx: number) => void;
  selectedAnswer: number | null;
  showFeedback: boolean;
  onNext: () => void;
  onPrevious?: () => void;
  canProceed: boolean;
  canGoBack?: boolean;
  timeLeft: number;
}> = ({ content, question, onAnswer, selectedAnswer, showFeedback, onNext, onPrevious, canProceed, canGoBack = false, timeLeft }) => (
  <div className="py-12">
    <motion.div
      className="text-center mb-8"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <h1 className="text-6xl font-black mb-6 bg-gradient-to-r
        from-blue-600 via-purple-600 to-emerald-600
        dark:from-blue-400 dark:via-purple-400 dark:to-emerald-400
        bg-clip-text text-transparent
        drop-shadow-2xl">
        {content.headline}
      </h1>

      <div className="max-w-3xl mx-auto">
        <p className="text-xl text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
          {content.story}
        </p>

        <div className="bg-blue-50/60 dark:bg-blue-950/30
          backdrop-blur-xl backdrop-saturate-150
          p-6 rounded-2xl
          border border-blue-200/40 dark:border-blue-800/40
          shadow-xl hover:shadow-2xl hover:shadow-blue-500/10 hover:bg-blue-50/80 dark:hover:bg-blue-950/40 transition-all duration-300 hover:scale-[1.02] mb-6">
          <p className="text-lg text-blue-800 dark:text-blue-200 font-medium">
            {content.emphasis}
          </p>
        </div>

        {/* CGC Reward Message - Dynamic from content */}
        {content.message && (
          <motion.div
            className="bg-gradient-to-r from-emerald-50/70 to-green-50/70 dark:from-emerald-950/40 dark:to-green-950/40
              backdrop-blur-xl backdrop-saturate-150
              p-4 rounded-2xl
              border border-emerald-300/50 dark:border-emerald-700/50
              shadow-lg mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-lg text-emerald-700 dark:text-emerald-300 font-semibold">
              {content.message}
            </p>
          </motion.div>
        )}

        <p className="text-2xl text-gray-900 dark:text-white font-bold">
          {content.hook}
        </p>
      </div>
    </motion.div>

    <QuestionSection
      question={question}
      onAnswer={onAnswer}
      selectedAnswer={selectedAnswer}
      showFeedback={showFeedback}
    />

    <NavigationArea
      onNext={onNext}
      onPrevious={onPrevious}
      canProceed={canProceed}
      canGoBack={canGoBack}
      timeLeft={timeLeft}
      buttonText="CONTINUAR"
      buttonIcon={<Rocket className="w-6 h-6" />}
      buttonColor="from-blue-500 to-purple-500 text-white"
    />
  </div>
);

const ProblemBlock: React.FC<{
  content: any;
  question: any;
  onAnswer: (idx: number) => void;
  selectedAnswer: number | null;
  showFeedback: boolean;
  onNext: () => void;
  onPrevious?: () => void;
  canProceed: boolean;
  canGoBack?: boolean;
  timeLeft: number;
}> = ({ content, question, onAnswer, selectedAnswer, showFeedback, onNext, onPrevious, canProceed, canGoBack = false, timeLeft }) => (
  <div className="py-12">
    <h2 className="text-5xl font-bold text-center mb-12 flex items-center justify-center gap-3">
      <span className="bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-300 dark:to-gray-100 bg-clip-text text-transparent">Las 3 Brechas del Mercado</span>
      <AlertCircle className="w-10 h-10 text-gray-600 dark:text-gray-400" />
    </h2>
    
    <div className="grid md:grid-cols-3 gap-6 mb-8">
      {content.brechas.map((brecha: any, idx: number) => (
        <motion.div
          key={idx}
          className="bg-amber-50/50 dark:bg-amber-950/25 
            backdrop-blur-xl backdrop-saturate-150 
            border border-amber-200/30 dark:border-amber-800/30 
            rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:shadow-amber-500/10 hover:bg-amber-50/70 dark:hover:bg-amber-950/35 transition-all duration-300 hover:scale-[1.02]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.2 }}
        >
          <h3 className="text-2xl font-bold text-amber-800 dark:text-amber-200 mb-3">
            {brecha.title}
          </h3>
          <p className="text-amber-700 dark:text-amber-300">
            {brecha.description}
          </p>
        </motion.div>
      ))}
    </div>

    <div className="text-center mb-8">
      <div className="inline-block 
        bg-purple-50/50 dark:bg-purple-950/25 
        backdrop-blur-xl backdrop-saturate-150 
        border border-purple-200/30 dark:border-purple-800/30 
        px-8 py-4 rounded-full shadow-xl hover:shadow-2xl hover:shadow-purple-500/10 hover:bg-purple-50/70 dark:hover:bg-purple-950/35 transition-all duration-300 hover:scale-[1.02]">
        <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 dark:from-purple-400 dark:to-purple-300 bg-clip-text text-transparent">
          {content.stat}
        </p>
      </div>
    </div>

    <QuestionSection
      question={question}
      onAnswer={onAnswer}
      selectedAnswer={selectedAnswer}
      showFeedback={showFeedback}
    />

    <NavigationArea
      onNext={onNext}
      onPrevious={onPrevious}
      canProceed={canProceed}
      canGoBack={canGoBack}
      timeLeft={timeLeft}
      buttonText="CONTINUAR A VER SOLUCIÓN"
      buttonIcon={<Shield className="w-6 h-6" />}
      buttonColor="from-gray-600 to-gray-800 text-white"
    />
  </div>
);

const SolutionBlock: React.FC<{
  content: any;
  question: any;
  onAnswer: (idx: number) => void;
  selectedAnswer: number | null;
  showFeedback: boolean;
  onNext: () => void;
  onPrevious?: () => void;
  canProceed: boolean;
  canGoBack?: boolean;
  timeLeft: number;
}> = ({ content, question, onAnswer, selectedAnswer, showFeedback, onNext, onPrevious, canProceed, canGoBack = false, timeLeft }) => (
  <div className="py-12">
    <h2 className="text-5xl font-bold text-center mb-8 flex items-center justify-center gap-3">
      <span className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">NFT-Wallets: La Revolución</span>
      <Rocket className="w-10 h-10 text-blue-600 dark:text-blue-400" />
    </h2>
    
    <div className="text-center mb-8">
      <div className="inline-block 
        bg-emerald-50/55 dark:bg-emerald-950/30 
        backdrop-blur-xl backdrop-saturate-150 
        border border-emerald-200/35 dark:border-emerald-800/35 
        px-8 py-4 rounded-2xl shadow-xl hover:shadow-2xl hover:shadow-emerald-500/10 hover:bg-emerald-50/75 dark:hover:bg-emerald-950/40 transition-all duration-300 hover:scale-[1.02]">
        <p className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-800 dark:from-emerald-400 dark:to-emerald-300 bg-clip-text text-transparent">
          {content.breakthrough}
        </p>
      </div>
    </div>

    <div className="grid md:grid-cols-2 gap-4 mb-8 max-w-4xl mx-auto">
      {content.features.map((feature: any, idx: number) => (
        <motion.div
          key={idx}
          className="bg-emerald-50/45 dark:bg-emerald-950/25 
            backdrop-blur-xl backdrop-saturate-150 
            border border-emerald-200/30 dark:border-emerald-800/30 
            rounded-xl p-6 flex items-center gap-4 shadow-xl hover:shadow-2xl hover:shadow-emerald-500/10 hover:bg-emerald-50/65 dark:hover:bg-emerald-950/35 transition-all duration-300 hover:scale-[1.02]"
          initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.1 }}
        >
          <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 dark:from-emerald-500/30 dark:to-emerald-600/30">
            {React.createElement(feature.icon, { className: "w-6 h-6 text-emerald-600 dark:text-emerald-400" })}
          </div>
          <span className="text-lg text-emerald-800 dark:text-emerald-200">{feature.text}</span>
        </motion.div>
      ))}
    </div>

    <div className="text-center mb-8">
      <p className="text-2xl text-amber-600 dark:text-yellow-400 font-bold">
        {content.tagline}
      </p>
    </div>

    {question && (
      <QuestionSection
        question={question}
        onAnswer={onAnswer}
        selectedAnswer={selectedAnswer}
        showFeedback={showFeedback}
      />
    )}

    <NavigationArea
      onNext={onNext}
      onPrevious={onPrevious}
      canProceed={canProceed}
      canGoBack={canGoBack}
      timeLeft={timeLeft}
      buttonText="CONTINUAR A VER DEMO EN VIVO"
      buttonIcon={<Zap className="w-6 h-6" />}
      buttonColor="from-green-500 to-blue-500 text-white"
    />
  </div>
);

const DemoBlock: React.FC<{
  content: any;
  question: any;
  showQR: boolean;
  giftUrl: string;
  claimStatus: string;
  onAnswer: (idx: number) => void;
  selectedAnswer: number | null;
  showFeedback: boolean;
  onNext: () => void;
  onPrevious?: () => void;
  canProceed: boolean;
  canGoBack?: boolean;
  timeLeft: number;
}> = ({ content, question, showQR, giftUrl, claimStatus, onAnswer, selectedAnswer, showFeedback, onNext, onPrevious, canProceed, canGoBack = false, timeLeft }) => (
  <div className="text-center py-12">
    <h2 className="text-5xl font-bold mb-8">{content.instruction}</h2>
    
    <div className="grid md:grid-cols-2 gap-8 items-center max-w-5xl mx-auto mb-8">
      <div>
        {showQR && claimStatus === 'waiting' && (
          <motion.div 
            className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl backdrop-saturate-150 border border-gray-200/50 dark:border-gray-700/50 p-8 rounded-2xl inline-block shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring" }}
          >
            <QRCodeSVG value={giftUrl} size={200} level="H" />
            <p className="text-gray-800 dark:text-gray-200 mt-4 font-semibold">Escanea con tu móvil</p>
          </motion.div>
        )}
        
        {claimStatus === 'claiming' && (
          <div className="py-20">
            <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-yellow-400 mx-auto" />
            <p className="mt-8 text-2xl">Procesando tu claim...</p>
          </div>
        )}
        
        {claimStatus === 'success' && (
          <motion.div 
            className="py-20"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            <CheckCircle className="w-32 h-32 text-green-400 mx-auto mb-8" />
            <h3 className="text-4xl font-bold mb-4 text-gray-800 dark:text-white flex items-center justify-center gap-3">¡LO TIENES! <PartyPopper className="w-10 h-10 text-pink-500" /></h3>
          </motion.div>
        )}
      </div>
      
      <div className="text-left">
        <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">Pasos Simples:</h3>
        {content.steps.map((step: string, idx: number) => (
          <motion.div
            key={idx}
            className="mb-3 text-lg text-gray-700 dark:text-gray-300"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.2 }}
          >
            {step}
          </motion.div>
        ))}
        
        <div className="mt-6 p-4 bg-blue-50/60 dark:bg-blue-950/30 backdrop-blur-xl backdrop-saturate-150 border border-blue-200/40 dark:border-blue-800/40 rounded-xl shadow-xl hover:shadow-2xl hover:shadow-blue-500/10 hover:bg-blue-50/80 dark:hover:bg-blue-950/40 transition-all duration-300 hover:scale-[1.02]">
          <p className="bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-400 dark:to-blue-300 bg-clip-text text-transparent font-bold">{content.emphasis}</p>
        </div>
      </div>
    </div>

    <QuestionSection
      question={question}
      onAnswer={onAnswer}
      selectedAnswer={selectedAnswer}
      showFeedback={showFeedback}
    />

    <NavigationArea
      onNext={onNext}
      onPrevious={onPrevious}
      canProceed={canProceed}
      canGoBack={canGoBack}
      timeLeft={timeLeft}
      buttonText="CONTINUAR A VER COMPARACIÓN"
      buttonIcon={<BarChart3 className="w-6 h-6" />}
      buttonColor="from-blue-500 to-purple-500 text-white"
    />
  </div>
);

const ComparisonBlock: React.FC<{
  content: any;
  question: any;
  onAnswer: (idx: number) => void;
  selectedAnswer: number | null;
  showFeedback: boolean;
  onNext: () => void;
  onPrevious?: () => void;
  canProceed: boolean;
  canGoBack?: boolean;
  timeLeft: number;
}> = ({ content, question, onAnswer, selectedAnswer, showFeedback, onNext, onPrevious, canProceed, canGoBack = false, timeLeft }) => (
  <div className="py-12">
    <h2 className="text-5xl font-bold text-center mb-12 flex items-center justify-center gap-3">{content.title} <Swords className="w-10 h-10 text-red-500" /></h2>
    
    <div className="max-w-4xl mx-auto">
      {content.comparisons.map((comp: any, idx: number) => (
        <motion.div
          key={idx}
          className="grid md:grid-cols-2 gap-4 mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
        >
          <div className="bg-amber-50/45 dark:bg-amber-950/25 backdrop-blur-xl backdrop-saturate-150 border border-amber-200/30 dark:border-amber-800/30 rounded-xl p-4 shadow-xl hover:shadow-2xl hover:shadow-amber-500/10 hover:bg-amber-50/65 dark:hover:bg-amber-950/35 transition-all duration-300 hover:scale-[1.02]">
            <p className="text-lg text-amber-800 dark:text-amber-200">{comp.traditional}</p>
          </div>
          <div className="bg-emerald-50/45 dark:bg-emerald-950/25 backdrop-blur-xl backdrop-saturate-150 border border-emerald-200/30 dark:border-emerald-800/30 rounded-xl p-4 shadow-xl hover:shadow-2xl hover:shadow-emerald-500/10 hover:bg-emerald-50/65 dark:hover:bg-emerald-950/35 transition-all duration-300 hover:scale-[1.02]">
            <p className="text-lg text-emerald-800 dark:text-emerald-200">{comp.cryptogift}</p>
          </div>
        </motion.div>
      ))}
    </div>

    <QuestionSection
      question={question}
      onAnswer={onAnswer}
      selectedAnswer={selectedAnswer}
      showFeedback={showFeedback}
    />

    <NavigationArea
      onNext={onNext}
      onPrevious={onPrevious}
      canProceed={canProceed}
      canGoBack={canGoBack}
      timeLeft={timeLeft}
      buttonText="CONTINUAR A VER RESULTADOS"
      buttonIcon={<TrendingUp className="w-6 h-6" />}
      buttonColor="from-orange-500 to-red-500 text-white"
    />
  </div>
);

const CasesBlock: React.FC<{
  content: any;
  question: any;
  onAnswer: (idx: number) => void;
  selectedAnswer: number | null;
  showFeedback: boolean;
  onNext: () => void;
  onPrevious?: () => void;
  canProceed: boolean;
  canGoBack?: boolean;
  timeLeft: number;
}> = ({ content, question, onAnswer, selectedAnswer, showFeedback, onNext, onPrevious, canProceed, canGoBack = false, timeLeft }) => (
  <div className="py-12">
    <h2 className="text-5xl font-bold text-center mb-12 flex items-center justify-center gap-3">Resultados Reales <StyledIcon icon="chart" size="xl" /></h2>
    
    <div className="grid md:grid-cols-4 gap-4 mb-8">
      {content.metrics.map((metric: any, idx: number) => (
        <motion.div
          key={idx}
          className="bg-purple-50/50 dark:bg-purple-950/25 backdrop-blur-xl backdrop-saturate-150 border border-purple-200/30 dark:border-purple-800/30 rounded-xl p-6 text-center shadow-xl hover:shadow-2xl hover:shadow-purple-500/10 hover:bg-purple-50/70 dark:hover:bg-purple-950/35 transition-all duration-300 hover:scale-[1.02]"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: idx * 0.1 }}
        >
          <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">{metric.number}</div>
          <div className="text-sm text-purple-700 dark:text-purple-300">{metric.label}</div>
        </motion.div>
      ))}
    </div>

    <div className="text-center mb-8">
      <p className="text-xl text-gray-700 dark:text-gray-300 italic">
        {content.testimonial}
      </p>
    </div>

    <QuestionSection
      question={question}
      onAnswer={onAnswer}
      selectedAnswer={selectedAnswer}
      showFeedback={showFeedback}
    />

    <NavigationArea
      onNext={onNext}
      onPrevious={onPrevious}
      canProceed={canProceed}
      canGoBack={canGoBack}
      timeLeft={timeLeft}
      buttonText="CONTINUAR A VER MODELO DE NEGOCIO"
      buttonIcon={<Banknote className="w-6 h-6" />}
      buttonColor="from-purple-500 to-indigo-500 text-white"
    />
  </div>
);

const BusinessBlock: React.FC<{
  content: any;
  question: any;
  onAnswer: (idx: number) => void;
  selectedAnswer: number | null;
  showFeedback: boolean;
  onNext: () => void;
  onPrevious?: () => void;
  canProceed: boolean;
  canGoBack?: boolean;
  timeLeft: number;
}> = ({ content, question, onAnswer, selectedAnswer, showFeedback, onNext, onPrevious, canProceed, canGoBack = false, timeLeft }) => (
  <div className="py-12">
    <h2 className="text-5xl font-bold text-center mb-12 flex items-center justify-center gap-3">
      <span className="bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent">{content.title}</span>
      <Briefcase className="w-10 h-10 text-purple-600 dark:text-purple-400" />
    </h2>
    
    <div className="grid md:grid-cols-2 gap-6 mb-8 max-w-5xl mx-auto">
      {content.streams.map((stream: any, idx: number) => (
        <motion.div
          key={idx}
          className="bg-purple-50/50 dark:bg-purple-950/25 backdrop-blur-xl backdrop-saturate-150 border border-purple-200/30 dark:border-purple-800/30 rounded-xl p-6 shadow-xl hover:shadow-2xl hover:shadow-purple-500/10 hover:bg-purple-50/70 dark:hover:bg-purple-950/35 transition-all duration-300 hover:scale-[1.02]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-600/20 dark:from-purple-500/30 dark:to-purple-600/30">
              {React.createElement(stream.icon, { className: "w-6 h-6 text-purple-600 dark:text-purple-400" })}
            </div>
            <h3 className="text-xl font-bold text-purple-800 dark:text-purple-200">{stream.name}</h3>
          </div>
          <p className="text-purple-700 dark:text-purple-300">
            {stream.model}
          </p>
        </motion.div>
      ))}
    </div>

    <div className="text-center mb-8">
      <div className="inline-block bg-purple-50/50 dark:bg-purple-950/25 backdrop-blur-xl backdrop-saturate-150 border border-purple-200/30 dark:border-purple-800/30 px-8 py-4 rounded-full shadow-xl hover:shadow-2xl hover:shadow-purple-500/10 hover:bg-purple-50/70 dark:hover:bg-purple-950/35 transition-all duration-300 hover:scale-[1.02]">
        <p className="text-xl bg-gradient-to-r from-purple-600 to-purple-800 dark:from-purple-400 dark:to-purple-300 bg-clip-text text-transparent font-bold">
          {content.emphasis}
        </p>
      </div>
    </div>

    <QuestionSection
      question={question}
      onAnswer={onAnswer}
      selectedAnswer={selectedAnswer}
      showFeedback={showFeedback}
    />

    <NavigationArea
      onNext={onNext}
      onPrevious={onPrevious}
      canProceed={canProceed}
      canGoBack={canGoBack}
      timeLeft={timeLeft}
      buttonText="CONTINUAR A VER ROADMAP"
      buttonIcon={<Globe className="w-6 h-6" />}
      buttonColor="from-blue-500 to-purple-500 text-white"
    />
  </div>
);

const RoadmapBlock: React.FC<{
  content: any;
  question: any;
  onAnswer: (idx: number) => void;
  selectedAnswer: number | null;
  showFeedback: boolean;
  onNext: () => void;
  onPrevious?: () => void;
  canProceed: boolean;
  canGoBack?: boolean;
  timeLeft: number;
}> = ({ content, question, onAnswer, selectedAnswer, showFeedback, onNext, onPrevious, canProceed, canGoBack = false, timeLeft }) => (
  <div className="py-12">
    <h2 className="text-5xl font-bold text-center mb-12 flex items-center justify-center gap-3">El Futuro es Exponencial <Rocket className="w-10 h-10 text-cyan-500" /></h2>
    
    <div className="space-y-6 max-w-4xl mx-auto mb-8">
      {content.phases.map((phase: any, idx: number) => (
        <motion.div
          key={idx}
          className="bg-indigo-50/50 dark:bg-indigo-950/25 backdrop-blur-xl backdrop-saturate-150 border border-indigo-200/30 dark:border-indigo-800/30 rounded-xl p-6 shadow-xl hover:shadow-2xl hover:shadow-indigo-500/10 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/35 transition-all duration-300 hover:scale-[1.02]"
          initial={{ opacity: 0, x: idx % 2 === 0 ? -50 : 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.2 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">{phase.name}</h3>
            <span className="text-amber-600 dark:text-amber-400 font-bold">{phase.goal}</span>
          </div>
          <p className="text-indigo-800 dark:text-indigo-200">{phase.features}</p>
        </motion.div>
      ))}
    </div>

    <QuestionSection
      question={question}
      onAnswer={onAnswer}
      selectedAnswer={selectedAnswer}
      showFeedback={showFeedback}
    />

    <NavigationArea
      onNext={onNext}
      onPrevious={onPrevious}
      canProceed={canProceed}
      canGoBack={canGoBack}
      timeLeft={timeLeft}
      buttonText="CONTINUAR A MOMENTO INSPIRACIONAL"
      buttonIcon={<Heart className="w-6 h-6" />}
      buttonColor="from-indigo-500 to-purple-500 text-white"
    />
  </div>
);

const CloseBlock: React.FC<{
  content: any;
  question: any;
  onAnswer: (idx: number) => void;
  selectedAnswer: number | null;
  showFeedback: boolean;
  onNext: () => void;
  onPrevious?: () => void;
  canProceed: boolean;
  canGoBack?: boolean;
  timeLeft: number;
}> = ({ content, question, onAnswer, selectedAnswer, showFeedback, onNext, onPrevious, canProceed, canGoBack = false, timeLeft }) => (
  <div className="py-12">
    <div className="max-w-4xl mx-auto text-center">
      <motion.h2 
        className="text-6xl font-black mb-8 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        La Puerta al Futuro
      </motion.h2>
      
      <motion.div
        className="space-y-6 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <p className="text-2xl text-gray-700 dark:text-gray-300 leading-relaxed">
          {content.inspiration}
        </p>
        
        <div className="bg-emerald-50/55 dark:bg-emerald-950/30 backdrop-blur-xl backdrop-saturate-150 border border-emerald-200/35 dark:border-emerald-800/35 rounded-2xl p-8 shadow-xl hover:shadow-2xl hover:shadow-emerald-500/10 hover:bg-emerald-50/75 dark:hover:bg-emerald-950/40 transition-all duration-300 hover:scale-[1.02]">
          <p className="text-xl text-emerald-800 dark:text-emerald-200 leading-relaxed">
            {content.vision}
          </p>
        </div>
        
        <p className="text-2xl bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent font-bold">
          {content.callToAction}
        </p>
        
        <p className="text-3xl text-gray-800 dark:text-white font-black">
          {content.final}
        </p>
      </motion.div>

      <motion.div
        className="mb-8"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Gift className="w-20 h-20 mx-auto text-yellow-400" />
      </motion.div>
    </div>

    <QuestionSection
      question={question}
      onAnswer={onAnswer}
      selectedAnswer={selectedAnswer}
      showFeedback={showFeedback}
    />

    <NavigationArea
      onNext={onNext}
      onPrevious={onPrevious}
      canProceed={canProceed}
      canGoBack={canGoBack}
      timeLeft={timeLeft}
      buttonText="CONTINUAR A ¡QUIERO SER PARTE!"
      buttonIcon={<Rocket className="w-8 h-8" />}
      buttonColor="from-blue-600 to-purple-600 text-white"
    />
  </div>
);

const CaptureBlock: React.FC<{
  content: any;
  onSubmit: (data: any) => void;
  questionsScore: { correct: number; total: number };
  educationalMode?: boolean;
  onShowEmailVerification?: () => void;
  onShowCalendar?: () => void;
  onShowTwitterFollow?: () => void; // NEW: For social engagement
  onShowDiscordJoin?: () => void; // NEW: For community engagement
  verifiedEmail?: string | null;
  onPrevious?: () => void;
  canGoBack?: boolean;
  // 🆕 PERSISTENCE: Social verification state from localStorage
  savedSocialVerification?: {
    twitter: { verified: boolean; username: string | null; userId: string | null } | null;
    discord: { verified: boolean; username: string | null; userId: string | null } | null;
  } | null;
  onSocialVerified?: (platform: 'twitter' | 'discord', data: { username: string; userId: string }) => void;
  // 🆕 PERSISTENCE: Selected role/path state from localStorage
  savedSelectedPath?: string | null;
  onPathSelected?: (path: string) => void;
}> = ({ content, onSubmit, questionsScore, educationalMode = false, onShowEmailVerification, onShowCalendar, onShowTwitterFollow, onShowDiscordJoin, verifiedEmail, onPrevious, canGoBack = false, savedSocialVerification, onSocialVerified, savedSelectedPath, onPathSelected }) => {
  const account = useActiveAccount();
  // 🆕 PERSISTENCE: Initialize with saved path from localStorage, or empty string
  const [selectedPath, setSelectedPath] = useState<string>(savedSelectedPath || '');
  const [formData, setFormData] = useState({
    availability: '',
    contact: ''
  });
  const [showValidation, setShowValidation] = useState(false);
  
  // FASE 1: Estado para checkboxes inline
  const [emailChecked, setEmailChecked] = useState(false);
  const [calendarChecked, setCalendarChecked] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [calendarScheduled, setCalendarScheduled] = useState(false);
  const [processingEmail, setProcessingEmail] = useState(false);
  const [processingCalendar, setProcessingCalendar] = useState(false);

  // NEW: OAuth-based social verification (automatic verification via API)
  // Uses popup OAuth flow to verify user actually followed Twitter / joined Discord
  // 🆕 PERSISTENCE: Restore verification state from localStorage to survive page refresh
  const {
    twitterVerified: twitterFollowed,
    discordVerified: discordJoined,
    isTwitterLoading: processingTwitter,
    isDiscordLoading: processingDiscord,
    verifyTwitter,
    verifyDiscord,
    error: socialOAuthError,
  } = useSocialOAuth({
    walletAddress: account?.address || '',
    // 🆕 PERSISTENCE: Initial values from localStorage (survives page refresh/language change)
    initialTwitterVerified: savedSocialVerification?.twitter?.verified ?? false,
    initialTwitterUsername: savedSocialVerification?.twitter?.username ?? null,
    initialDiscordVerified: savedSocialVerification?.discord?.verified ?? false,
    initialDiscordUsername: savedSocialVerification?.discord?.username ?? null,
    onVerified: (platform, data) => {
      console.log(`✅ ${platform} verification completed: @${data.username}`);
      // 🆕 PERSISTENCE: Save to localStorage via callback to parent
      // CRITICAL FIX: Always call callback - generate temp userId if not provided
      if (onSocialVerified) {
        const userId = data.userId || `temp_${platform}_${Date.now()}`;
        onSocialVerified(platform, { username: data.username, userId });
        console.log(`[SalesMasterclass] 💾 Saved ${platform} verification to persistence`);
      }
    },
    onError: (error) => {
      console.error('❌ Social verification error:', error);
    },
  });

  // State for checkbox visual feedback (processing indicator)
  // 🆕 PERSISTENCE: Initialize from saved state if available
  const [twitterChecked, setTwitterChecked] = useState(savedSocialVerification?.twitter?.verified ?? false);
  const [discordChecked, setDiscordChecked] = useState(savedSocialVerification?.discord?.verified ?? false);

  // Track if verification is in progress (for loading state)
  const [twitterVerifying, setTwitterVerifying] = useState(false);
  const [discordVerifying, setDiscordVerifying] = useState(false);

  // Reset verifying states when verification completes (via postMessage from popup)
  useEffect(() => {
    if (twitterFollowed) {
      setTwitterVerifying(false);
      setTwitterChecked(true);
    }
  }, [twitterFollowed]);

  useEffect(() => {
    if (discordJoined) {
      setDiscordVerifying(false);
      setDiscordChecked(true);
    }
  }, [discordJoined]);

  // 🔄 SYNC: Update checkbox states when savedSocialVerification prop changes
  // These may arrive after first render due to async localStorage loading
  useEffect(() => {
    if (savedSocialVerification?.twitter?.verified && !twitterChecked) {
      console.log('[CaptureBlock] 🔄 Syncing Twitter checked from persistence');
      setTwitterChecked(true);
    }
  }, [savedSocialVerification?.twitter?.verified, twitterChecked]);

  useEffect(() => {
    if (savedSocialVerification?.discord?.verified && !discordChecked) {
      console.log('[CaptureBlock] 🔄 Syncing Discord checked from persistence');
      setDiscordChecked(true);
    }
  }, [savedSocialVerification?.discord?.verified, discordChecked]);

  // 🔄 SYNC: Update emailVerified state when verifiedEmail prop changes
  // This is crucial because useState ignores initial value after first render
  // The prop may arrive after initial render due to async localStorage loading
  useEffect(() => {
    if (verifiedEmail && !emailVerified) {
      console.log('[CaptureBlock] 🔄 Syncing email verified from persistence:', verifiedEmail);
      setEmailVerified(true);
      setEmailChecked(true);
    }
  }, [verifiedEmail, emailVerified]);

  // Roles que requieren Calendly (Investor y White-Label)
  const CALENDLY_ROLES = ['Investor', 'White-Label'];
  // Determinar si el rol seleccionado requiere Calendly o social engagement
  const requiresCalendly = CALENDLY_ROLES.includes(selectedPath);
  const requiresSocialEngagement = selectedPath && !CALENDLY_ROLES.includes(selectedPath);

  // FASE 1: Manejadores para checkboxes inline
  // IMPORTANT: The parent component (SpecialInviteFlow) provides promise-based callbacks
  // The Promise resolves ONLY when the user actually completes verification/booking
  // If the user closes the modal without completing, the promise never resolves
  const handleEmailCheckbox = async () => {
    if (emailVerified || processingEmail) return;

    setProcessingEmail(true);
    setEmailChecked(true); // Show checkbox as "in progress"
    console.log('📧 Email checkbox clicked - opening verification modal');

    if (onShowEmailVerification) {
      try {
        // This Promise resolves when the user completes email verification
        await onShowEmailVerification();
        // Only mark as verified AFTER the Promise resolves (user completed verification)
        setEmailVerified(true);
        console.log('✅ Email verification completed successfully');
      } catch (error) {
        console.error('❌ Email verification error or cancelled:', error);
        setEmailChecked(false);
        setEmailVerified(false);
      }
    } else {
      // If no callback provided (non-educational mode), mark as verified immediately
      // The parent component should handle opening modals in this case
      console.log('⚠️ No onShowEmailVerification callback - marking as verified');
      setEmailVerified(true);
    }
    setProcessingEmail(false);
  };

  const handleCalendarCheckbox = async () => {
    if (calendarScheduled || processingCalendar) return;

    setProcessingCalendar(true);
    setCalendarChecked(true); // Show checkbox as "in progress"
    console.log('📅 Calendar checkbox clicked - opening booking modal');

    if (onShowCalendar) {
      try {
        // This Promise resolves when the user completes calendar booking
        await onShowCalendar();
        // Only mark as scheduled AFTER the Promise resolves (user completed booking)
        setCalendarScheduled(true);
        console.log('✅ Calendar booking completed successfully');
      } catch (error) {
        console.error('❌ Calendar booking error or cancelled:', error);
        setCalendarChecked(false);
        setCalendarScheduled(false);
      }
    } else {
      // If no callback provided (non-educational mode), mark as scheduled immediately
      // The parent component should handle opening modals in this case
      console.log('⚠️ No onShowCalendar callback - marking as scheduled');
      setCalendarScheduled(true);
    }
    setProcessingCalendar(false);
  };

  // 🚀 ALL-IN-ONE POPUP FLOW: Twitter Follow
  // Opens our verification page that handles: OAuth → Follow → Verify → Close
  const handleTwitterCheckbox = async () => {
    if (twitterFollowed || twitterVerifying) return;

    console.log('🐦 Opening Twitter verification flow (all-in-one popup)');
    setTwitterVerifying(true);
    setTwitterChecked(true);

    // Open our verification page that handles everything
    const width = 500;
    const height = 650;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    // Pass wallet address if available for DB persistence
    const walletParam = account?.address ? `&wallet=${encodeURIComponent(account.address)}` : '';
    window.open(
      `/social/verify?platform=twitter${walletParam}`,
      'twitterVerify',
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
    );

    // The useSocialOAuth hook listens for postMessage from the popup
    // When verified, it updates twitterFollowed automatically
  };

  // 🚀 ALL-IN-ONE POPUP FLOW: Discord Join
  // Opens our verification page that handles: OAuth → Join → Verify → Close
  const handleDiscordCheckbox = async () => {
    if (discordJoined || discordVerifying) return;

    console.log('💬 Opening Discord verification flow (all-in-one popup)');
    setDiscordVerifying(true);
    setDiscordChecked(true);

    // Open our verification page that handles everything
    const width = 500;
    const height = 650;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    // Pass wallet address if available for DB persistence
    const walletParam = account?.address ? `&wallet=${encodeURIComponent(account.address)}` : '';
    window.open(
      `/social/verify?platform=discord${walletParam}`,
      'discordVerify',
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
    );

    // The useSocialOAuth hook listens for postMessage from the popup
    // When verified, it updates discordJoined automatically
  };

  // Verificar si los checkboxes requeridos están completos (role-specific)
  // Para Investor y White-Label: Email + Calendar
  // Para otros roles: Email + Twitter + Discord
  const canProceed = emailVerified && (
    requiresCalendly
      ? calendarScheduled
      : (twitterFollowed && discordJoined)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // FASE 1: En modo educacional, verificar checkboxes
    if (educationalMode) {
      if (!canProceed) {
        console.log('⚠️ Cannot proceed - checkboxes not completed');
        return;
      }
      
      console.log('✅ All requirements met, proceeding to success block');
      setShowValidation(true);
      
      // Wait a moment to show the validation message
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      onSubmit({
        path: selectedPath,
        email: verifiedEmail,
        calendarBooked: requiresCalendly ? calendarScheduled : false,
        twitterFollowed: requiresSocialEngagement ? twitterFollowed : false,
        discordJoined: requiresSocialEngagement ? discordJoined : false,
        questionsScore,
        educationalMode: true
      });
      return;
    }
    
    // Modo knowledge - proceder directamente
    if (selectedPath) {
      console.log('🎯 Knowledge mode - proceeding without checkboxes');
      
      // En modo knowledge, mostrar modal de email si está disponible
      if (onShowEmailVerification) {
        onShowEmailVerification();
        return;
      }
      
      onSubmit({
        path: selectedPath,
        ...formData,
        questionsScore
      });
    }
  };

  // 🚀 ARQUITECTURA UNIFICADA: Misma UI para ambos modos (Knowledge y Educational)
  // La página de selección de rol es CRÍTICA para capturar leads antes de completar
  
  // Si ya mostramos validación en modo educacional
  if (showValidation && educationalMode) {
    return (
      <div className="py-12 text-center">
        <motion.h2 
          className="text-5xl font-bold mb-8 bg-gradient-to-r from-yellow-400 to-green-400 bg-clip-text text-transparent"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="flex items-center justify-center gap-3">¡Excelente Elección! <Target className="w-10 h-10 text-orange-500" /></span>
        </motion.h2>
        
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <p className="text-2xl text-gray-700 dark:text-gray-300 mb-4">
            Has elegido: <span className="font-bold text-blue-600 dark:text-blue-400">{selectedPath}</span>
          </p>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Preparando tu acceso al regalo...
          </p>
        </motion.div>
        
        <div className="animate-spin w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full mx-auto" />
      </div>
    );
  }

  // UI principal unificada para ambos modos
  return (
    <div className="pt-12 pb-6">
      {/* Back Button */}
      {canGoBack && onPrevious && (
        <div className="flex justify-start mb-6">
          <motion.button
            onClick={onPrevious}
            className="group flex items-center gap-2 px-4 py-2
              bg-white/10 dark:bg-gray-800/40
              backdrop-blur-xl backdrop-saturate-150
              border border-white/20 dark:border-gray-700/50
              rounded-xl text-gray-700 dark:text-gray-300
              hover:bg-white/20 dark:hover:bg-gray-700/50
              transition-all duration-300"
            whileHover={{ x: -3 }}
            whileTap={{ scale: 0.97 }}
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Volver</span>
          </motion.button>
        </div>
      )}

      <h2 className="text-4xl md:text-5xl font-bold text-center mb-8 bg-gradient-to-r from-purple-600 via-blue-500 to-cyan-500 bg-clip-text text-transparent drop-shadow-sm leading-normal pb-1 flex items-center justify-center gap-3">
        {content.title} <Rocket className="w-10 h-10 text-cyan-500" />
      </h2>

      {/* Score Display - Glass Crystal Style - Only show if quiz was completed */}
      {questionsScore.total > 0 && (
        <div className="text-center mb-10">
          <div className="inline-block glass-crystal px-8 py-5 rounded-2xl shadow-xl">
            <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-100">
              Tu puntuación: <span className="font-bold bg-gradient-to-r from-amber-600 to-yellow-600 dark:from-amber-500 dark:to-yellow-500 bg-clip-text text-transparent">
                {questionsScore.correct}/{questionsScore.total}
              </span> respuestas correctas
            </p>
            {/* Show PERFECTO only for 8/9 or 9/9 (high scores) */}
            {questionsScore.correct >= 8 ? (
              <p className="text-emerald-400 font-bold mt-3 flex items-center justify-center gap-2">¡PERFECTO! Eres un experto <Trophy className="w-5 h-5 text-amber-500" /></p>
            ) : (
              <p className="text-blue-400 font-medium mt-3 max-w-lg mx-auto leading-relaxed flex items-center justify-center gap-2">
                <PartyPopper className="w-5 h-5 text-pink-500" /> ¡Felicidades por llegar hasta aquí! Estás a solo un par de pasos de ser parte importante de esta comunidad.
            </p>
          )}
        </div>
      </div>
      )}

      {/* Role Cards - Mobile: column layout with inline description, Desktop: grid */}
      <div className="flex flex-col gap-4 mb-12 max-w-6xl mx-auto pt-4 overflow-visible md:grid md:grid-cols-2 lg:grid-cols-3">
        {content.paths.map((path: any) => (
          <React.Fragment key={path.name}>
            <motion.button
              onClick={() => {
                setSelectedPath(path.name);
                // 🆕 PERSISTENCE: Save selected path to localStorage immediately
                if (onPathSelected) {
                  onPathSelected(path.name);
                }
              }}
              className={`relative p-6 rounded-2xl transition-all text-left backdrop-blur-xl overflow-visible ${
                selectedPath === path.name
                  ? 'bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border-2 border-amber-400/60 dark:border-amber-400/50 scale-[1.03] shadow-xl shadow-amber-500/20'
                  : 'glass-crystal border border-gray-200/50 dark:border-white/10 hover:border-purple-400/50 dark:hover:border-purple-400/30 hover:shadow-lg hover:shadow-purple-500/10'
              }`}
              whileHover={{ scale: selectedPath === path.name ? 1.03 : 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Popular Badge */}
              {path.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <span className="px-3 py-1 text-xs font-bold bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-full shadow-lg whitespace-nowrap flex items-center gap-1">
                    <Star className="w-3 h-3" /> MÁS POPULAR
                  </span>
                </div>
              )}

              {/* Icon & Title Row */}
              <div className="flex items-center gap-3 mb-3">
                <StyledIcon icon={path.icon as IconKey} size="xl" withGlow asMedal />
                <h3 className="font-bold text-xl text-gray-900 dark:text-white">{path.nameEs || path.name}</h3>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">{path.description}</p>

              {/* Spots Badge */}
              <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-amber-500/20 mb-3">
                <span className="text-amber-600 dark:text-amber-300 font-semibold text-sm flex items-center gap-1.5">
                  {typeof path.spots === 'number' ? (
                    <><Flame className="w-4 h-4" /> Solo {path.spots} lugares</>
                  ) : (
                    <><Sparkles className="w-4 h-4" /> {path.spots}</>
                  )}
                </span>
              </div>

              {/* Benefit */}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4" /> {path.benefit}
                </span>
              </div>
            </motion.button>

            {/* MOBILE ONLY: Role Description appears DIRECTLY below the selected card */}
            {selectedPath === path.name && educationalMode && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="md:hidden bg-gradient-to-r from-purple-500/10 to-blue-500/10
                  backdrop-blur-xl backdrop-saturate-150
                  border border-purple-500/30 rounded-2xl p-5
                  shadow-xl shadow-purple-500/10"
              >
                <p className="text-base text-gray-700 dark:text-gray-200 mb-2 font-semibold">
                  Has seleccionado: <span className="bg-gradient-to-r from-blue-500 to-purple-500 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">{path.nameEs || path.name}</span>
                </p>
                <p className="text-sm text-gray-600/90 dark:text-gray-300/90 leading-relaxed">
                  {path.name === 'Quest Creator' && (
                    <><Target className="w-4 h-4 inline-block mr-1.5 text-orange-500" />Como <strong className="text-purple-600 dark:text-purple-300">Quest Creator</strong>, serás arquitecto de experiencias que transforman vidas. Tu creatividad construirá el puente entre el mundo tradicional y Web3, y por cada misión que diseñes recibirás <strong className="text-yellow-600 dark:text-yellow-400">tokens CGC de gobernanza</strong> que reconocen tu aporte al ecosistema.</>
                  )}
                  {path.name === 'Integration Partner' && (
                    <><Wrench className="w-4 h-4 inline-block mr-1.5 text-slate-400" />Como <strong className="text-purple-600 dark:text-purple-300">Integration Partner</strong>, llevarás la tecnología CryptoGift a nuevas fronteras. Cada integración que desarrolles no solo expandirá el ecosistema, sino que te posicionará como pionero y serás recompensado con <strong className="text-yellow-600 dark:text-yellow-400">tokens CGC de gobernanza</strong> proporcionales a tu impacto.</>
                  )}
                  {path.name === 'Community' && (
                    <><Star className="w-4 h-4 inline-block mr-1.5 text-yellow-500" />Como <strong className="text-purple-600 dark:text-purple-300">Community Member</strong>, eres el corazón de CryptoGift. Tu participación activa, feedback y apoyo son invaluables. Por tu compromiso recibirás <strong className="text-yellow-600 dark:text-yellow-400">tokens CGC de gobernanza</strong> que te dan voz y voto en el futuro de la plataforma.</>
                  )}
                  {path.name === 'Investor' && (
                    <><Gem className="w-4 h-4 inline-block mr-1.5 text-purple-500" />Como <strong className="text-purple-600 dark:text-purple-300">Inversor</strong>, tienes visión de futuro. Tu participación nos permite escalar y transformar la industria. Recibirás <strong className="text-yellow-600 dark:text-yellow-400">tokens CGC de gobernanza</strong> que reflejan tu confianza y te dan participación en las decisiones estratégicas.</>
                  )}
                  {path.name === 'White-Label' && (
                    <><Building2 className="w-4 h-4 inline-block mr-1.5 text-blue-500" />Como <strong className="text-purple-600 dark:text-purple-300">White-Label Partner</strong>, llevarás el poder de CryptoGift a tu propia marca. Esta alianza estratégica incluye <strong className="text-yellow-600 dark:text-yellow-400">tokens CGC de gobernanza</strong> preferentes que reconocen tu rol como embajador de la tecnología.</>
                  )}
                </p>
              </motion.div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* DESKTOP ONLY: Role Description - Shows below the grid on larger screens */}
      {selectedPath && educationalMode && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="hidden md:block max-w-2xl mx-auto mb-6 bg-gradient-to-r from-purple-500/10 to-blue-500/10
            backdrop-blur-xl backdrop-saturate-150
            border border-purple-500/30 rounded-2xl p-6
            shadow-xl shadow-purple-500/10"
        >
          <p className="text-lg text-gray-700 dark:text-gray-200 mb-3">
            Has seleccionado: <span className="font-bold bg-gradient-to-r from-blue-500 to-purple-500 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">{selectedPath}</span>
          </p>
          <p className="text-sm text-gray-600/90 dark:text-gray-300/90 leading-relaxed">
            {selectedPath === 'Quest Creator' && (
              <><Target className="w-4 h-4 inline-block mr-1.5 text-orange-500" />Como <strong className="text-purple-600 dark:text-purple-300">Quest Creator</strong>, serás arquitecto de experiencias que transforman vidas. Tu creatividad construirá el puente entre el mundo tradicional y Web3, y por cada misión que diseñes recibirás <strong className="text-yellow-600 dark:text-yellow-400">tokens CGC de gobernanza</strong> que reconocen tu aporte al ecosistema.</>
            )}
            {selectedPath === 'Integration Partner' && (
              <><Wrench className="w-4 h-4 inline-block mr-1.5 text-slate-400" />Como <strong className="text-purple-600 dark:text-purple-300">Integration Partner</strong>, llevarás la tecnología CryptoGift a nuevas fronteras. Cada integración que desarrolles no solo expandirá el ecosistema, sino que te posicionará como pionero y serás recompensado con <strong className="text-yellow-600 dark:text-yellow-400">tokens CGC de gobernanza</strong> proporcionales a tu impacto.</>
            )}
            {selectedPath === 'Community' && (
              <><Star className="w-4 h-4 inline-block mr-1.5 text-yellow-500" />Como <strong className="text-purple-600 dark:text-purple-300">Community Member</strong>, eres el corazón de CryptoGift. Tu participación activa, feedback y apoyo son invaluables. Por tu compromiso recibirás <strong className="text-yellow-600 dark:text-yellow-400">tokens CGC de gobernanza</strong> que te dan voz y voto en el futuro de la plataforma.</>
            )}
            {selectedPath === 'Investor' && (
              <><Gem className="w-4 h-4 inline-block mr-1.5 text-purple-500" />Como <strong className="text-purple-600 dark:text-purple-300">Inversor</strong>, tienes visión de futuro. Tu participación nos permite escalar y transformar la industria. Recibirás <strong className="text-yellow-600 dark:text-yellow-400">tokens CGC de gobernanza</strong> que reflejan tu confianza y te dan participación en las decisiones estratégicas.</>
            )}
            {selectedPath === 'White-Label' && (
              <><Building2 className="w-4 h-4 inline-block mr-1.5 text-blue-500" />Como <strong className="text-purple-600 dark:text-purple-300">White-Label Partner</strong>, llevarás el poder de CryptoGift a tu propia marca. Esta alianza estratégica incluye <strong className="text-yellow-600 dark:text-yellow-400">tokens CGC de gobernanza</strong> preferentes que reconocen tu rol como embajador de la tecnología.</>
            )}
          </p>
        </motion.div>
      )}

      {selectedPath && (
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="max-w-md mx-auto space-y-4"
        >
          {/* En modo educacional, mostrar checkboxes */}
          {educationalMode ? (
            <>
              {/* FASE 1: CHECKBOXES INLINE - GLASS MORPHISM PREMIUM */}
              <div className="bg-white/60 dark:bg-gray-800/60 
                backdrop-blur-xl backdrop-saturate-150 
                rounded-2xl p-6 
                border border-white/20 dark:border-gray-700/50 
                shadow-2xl shadow-blue-500/10 
                space-y-4">
                <h3 className="text-xl font-bold mb-2 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center gap-3">
                  <span className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center backdrop-blur-xl border border-blue-500/30 overflow-hidden">
                    <img src="/apeX.png" alt="apeX" className="w-8 h-8 object-contain" />
                  </span>
                  Únete a Nuestra Comunidad
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 ml-13 leading-relaxed">
                  Al completar estos pasos, te conviertes en <strong className="text-purple-600 dark:text-purple-400">miembro activo</strong> de CryptoGift.
                  Recibirás <strong className="text-yellow-600 dark:text-yellow-400">200 CGC</strong> como bienvenida —tus primeros tokens de gobernanza que te dan
                  voz en las decisiones del ecosistema. Esta comunidad es de todos los que la integramos, y tu presencia la fortalece.
                </p>

                {/* Privacy notice - no data collection */}
                {requiresSocialEngagement && (
                  <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-start gap-2">
                    <Lock className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-blue-300/80">
                      <strong>Solo verificamos que sigas/te unas</strong> — no recopilamos ni almacenamos ningún dato personal de tus cuentas.
                    </p>
                  </div>
                )}

                {/* Error display for OAuth */}
                {socialOAuthError && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <p className="text-sm text-red-400">{socialOAuthError}</p>
                  </div>
                )}
                
                {/* Email Verification Checkbox - GLASS STYLE */}
                <div className="group flex items-start p-4 rounded-xl 
                  bg-gradient-to-r from-blue-500/5 to-indigo-500/5
                  hover:from-blue-500/10 hover:to-indigo-500/10
                  border border-transparent hover:border-blue-500/20
                  transition-all duration-300">
                  <input
                    type="checkbox"
                    id="email-checkbox"
                    checked={emailChecked}
                    onChange={handleEmailCheckbox}
                    disabled={emailVerified || processingEmail}
                    className="mt-1 mr-3 w-5 h-5 rounded border-2 border-blue-400/50 text-blue-600 
                      focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 cursor-pointer
                      checked:bg-gradient-to-r checked:from-blue-500 checked:to-indigo-500"
                  />
                  <label htmlFor="email-checkbox" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500/20 to-indigo-500/20
                        rounded-lg flex items-center justify-center backdrop-blur-xl
                        border border-blue-500/30 group-hover:scale-110 transition-transform">
                        <Mail className="w-5 h-5 text-blue-500" />
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        Verificar tu email
                      </span>
                      {emailVerified && (
                        <span className="px-2 py-1 bg-green-500/20 text-green-600 dark:text-green-400 text-xs rounded-full
                          border border-green-500/30 backdrop-blur-xl">
                          ✓ Verificado
                        </span>
                      )}
                      {processingEmail && (
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs rounded-full
                          border border-blue-500/30 backdrop-blur-xl animate-pulse">
                          Procesando...
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 ml-11">
                      Te enviaremos información exclusiva sobre el ecosistema cripto
                    </p>
                    {verifiedEmail && emailVerified && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1 ml-11 font-mono flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {verifiedEmail}
                      </p>
                    )}
                  </label>
                </div>
                
                {/* ROLE-SPECIFIC ACTIONS */}
                {requiresCalendly ? (
                  /* Calendar Booking Checkbox - For Investor and White-Label */
                  <div className="group flex items-start p-4 rounded-xl
                    bg-gradient-to-r from-purple-500/5 to-pink-500/5
                    hover:from-purple-500/10 hover:to-pink-500/10
                    border border-transparent hover:border-purple-500/20
                    transition-all duration-300">
                    <input
                      type="checkbox"
                      id="calendar-checkbox"
                      checked={calendarChecked}
                      onChange={handleCalendarCheckbox}
                      disabled={calendarScheduled || processingCalendar}
                      className="mt-1 mr-3 w-5 h-5 rounded border-2 border-purple-400/50 text-purple-600
                        focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50 cursor-pointer
                        checked:bg-gradient-to-r checked:from-purple-500 checked:to-pink-500"
                    />
                    <label htmlFor="calendar-checkbox" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500/20 to-pink-500/20
                          rounded-lg flex items-center justify-center backdrop-blur-xl
                          border border-purple-500/30 group-hover:scale-110 transition-transform">
                          <StyledIcon icon="calendar" />
                        </div>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          Agendar una sesión gratuita
                        </span>
                        {calendarScheduled && (
                          <span className="px-2 py-1 bg-green-500/20 text-green-600 dark:text-green-400 text-xs rounded-full
                            border border-green-500/30 backdrop-blur-xl">
                            ✓ Agendado
                          </span>
                        )}
                        {processingCalendar && (
                          <span className="px-2 py-1 bg-purple-500/20 text-purple-600 dark:text-purple-400 text-xs rounded-full
                            border border-purple-500/30 backdrop-blur-xl animate-pulse">
                            Procesando...
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 ml-11">
                        {selectedPath === 'Investor'
                          ? 'Agenda una llamada para discutir oportunidades de inversión y conocer nuestros números'
                          : 'Agenda una demo personalizada para explorar opciones de White-Label para tu negocio'
                        }
                      </p>
                    </label>
                  </div>
                ) : (
                  /* Social Engagement Checkboxes - For Quest Creator, Integration Partner, Community */
                  <>
                    {/* Twitter Follow - One-Click Automatic Flow */}
                    <div className="group flex items-start p-4 rounded-xl
                      bg-gradient-to-r from-sky-500/5 to-blue-500/5
                      hover:from-sky-500/10 hover:to-blue-500/10
                      border border-transparent hover:border-sky-500/20
                      transition-all duration-300">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-sky-500/20 to-blue-500/20
                            rounded-lg flex items-center justify-center backdrop-blur-xl
                            border border-sky-500/30">
                            <Twitter className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                          </div>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            Seguir en X (Twitter)
                          </span>
                          {twitterFollowed && (
                            <span className="px-2 py-1 bg-green-500/20 text-green-600 dark:text-green-400 text-xs rounded-full
                              border border-green-500/30 backdrop-blur-xl">
                              ✓ Verificado
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 ml-11">
                          {selectedPath === 'Quest Creator'
                            ? 'Síguenos para ver ejemplos de quests exitosas'
                            : selectedPath === 'Integration Partner'
                            ? 'Mantente al día con actualizaciones del SDK'
                            : 'Únete a la conversación de la comunidad cripto'
                          }
                        </p>

                        {/* One-click automatic button */}
                        {!twitterFollowed && (
                          <div className="flex gap-2 ml-11">
                            <button
                              type="button"
                              onClick={handleTwitterCheckbox}
                              disabled={twitterVerifying || processingTwitter}
                              className={`px-4 py-2 text-white text-sm font-semibold rounded-lg transition-all flex items-center gap-2 disabled:opacity-70
                                ${twitterVerifying || processingTwitter
                                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500 cursor-wait'
                                  : 'bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600'
                                }`}
                            >
                              {twitterVerifying || processingTwitter ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Verificando...
                                </>
                              ) : (
                                <>
                                  <Twitter className="w-4 h-4" />
                                  Seguir @cryptogiftdao
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Discord Join - One-Click Automatic Flow */}
                    <div className="group flex items-start p-4 rounded-xl
                      bg-gradient-to-r from-indigo-500/5 to-purple-500/5
                      hover:from-indigo-500/10 hover:to-purple-500/10
                      border border-transparent hover:border-indigo-500/20
                      transition-all duration-300">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500/20 to-purple-500/20
                            rounded-lg flex items-center justify-center backdrop-blur-xl
                            border border-indigo-500/30">
                            <MessageSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            Unirse a Discord
                          </span>
                          {discordJoined && (
                            <span className="px-2 py-1 bg-green-500/20 text-green-600 dark:text-green-400 text-xs rounded-full
                              border border-green-500/30 backdrop-blur-xl">
                              ✓ Verificado
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 ml-11">
                          {selectedPath === 'Quest Creator'
                            ? 'Accede al canal exclusivo de creators'
                            : selectedPath === 'Integration Partner'
                            ? 'Soporte técnico directo del equipo'
                            : 'Conecta con la comunidad y participa en eventos'
                          }
                        </p>

                        {/* One-click automatic button */}
                        {!discordJoined && (
                          <div className="flex gap-2 ml-11">
                            <button
                              type="button"
                              onClick={handleDiscordCheckbox}
                              disabled={discordVerifying || processingDiscord}
                              className={`px-4 py-2 text-white text-sm font-semibold rounded-lg transition-all flex items-center gap-2 disabled:opacity-70
                                ${discordVerifying || processingDiscord
                                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500 cursor-wait'
                                  : 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600'
                                }`}
                            >
                              {discordVerifying || processingDiscord ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Verificando...
                                </>
                              ) : (
                                <>
                                  <MessageSquare className="w-4 h-4" />
                                  Unirse al Discord
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Progress indicator - GLASS STYLE */}
                <div className="mt-6 pt-4 border-t border-white/10 dark:border-gray-700/30">
                  <div className="flex items-center justify-between p-3 rounded-xl
                    bg-gradient-to-r from-green-500/5 to-emerald-500/5
                    backdrop-blur-xl">
                    <span className="text-sm flex items-center gap-2">
                      {canProceed ? (
                        <>
                          <span className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                          </span>
                          <span className="text-green-400 font-semibold">
                            Todo listo para continuar
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="w-6 h-6 bg-yellow-500/20 rounded-full flex items-center justify-center">
                            <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />
                          </span>
                          <span className="text-gray-600 dark:text-gray-300">
                            {requiresCalendly
                              ? 'Completa ambos requisitos para continuar'
                              : 'Completa los 3 requisitos para continuar'
                            }
                          </span>
                        </>
                      )}
                    </span>
                    <span className="px-3 py-1 bg-gradient-to-r from-blue-500/10 to-purple-500/10
                      rounded-full text-xs text-blue-400 font-mono
                      border border-blue-500/20 backdrop-blur-xl">
                      {requiresCalendly
                        ? `${(emailVerified ? 1 : 0) + (calendarScheduled ? 1 : 0)} / 2`
                        : `${(emailVerified ? 1 : 0) + (twitterFollowed ? 1 : 0) + (discordJoined ? 1 : 0)} / 3`
                      }
                    </span>
                  </div>
                </div>
              </div>
              
              {/* REMOVED: Wallet connection check - now handled in LessonModalWrapper after completion */}
              {/* Connect wallet flow moved to "¡Felicidades!" screen as requested */}
              <motion.button
                type="submit"
                disabled={!canProceed}
                className={`w-full py-5 font-black text-xl rounded-2xl transition-all 
                  backdrop-blur-xl backdrop-saturate-150 ${
                  canProceed 
                    ? 'bg-gradient-to-r from-yellow-500/80 to-green-500/80 text-white hover:from-yellow-500 hover:to-green-500 shadow-2xl shadow-green-500/30 border border-yellow-500/30' 
                    : 'bg-gray-700/50 text-gray-400 cursor-not-allowed opacity-50 border border-gray-600/30'
                }`}
                whileHover={canProceed ? { scale: 1.05 } : {}}
                whileTap={canProceed ? { scale: 0.98 } : {}}
                style={canProceed ? {
                  animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                } : {}}
              >
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-xl">
                    <Trophy className="w-6 h-6 text-yellow-300" />
                  </div>
                  <span className="bg-gradient-to-r from-yellow-200 to-green-200 bg-clip-text text-transparent font-black">
                    {canProceed ? 'CONTINUAR AL REGALO' : 'COMPLETA LOS REQUISITOS'}
                  </span>
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-xl">
                    <Gift className="w-6 h-6 text-green-300" />
                  </div>
                </div>
              </motion.button>
            </>
          ) : (
            /* Modo normal - formulario completo */
            <>
              <input
                type="text"
                placeholder="¿Cuándo podemos hablar? (ej: Mañana 3pm)"
                value={formData.availability}
                onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:border-yellow-400 focus:outline-none text-white"
                required
              />
              
              <input
                type="text"
                placeholder="Tu mejor contacto (email/telegram/whatsapp)"
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:border-yellow-400 focus:outline-none text-white"
                required
              />
              
              <motion.button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold text-xl rounded-lg flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Rocket className="w-6 h-6" /> CONFIRMAR Y UNIRME
              </motion.button>

              <div className="text-center text-yellow-400 text-sm flex items-center justify-center gap-1">
                <Clock className="w-4 h-4" /> {content.urgency}
              </div>
            </>
          )}
        </motion.form>
      )}
      
      {/* Email Verification Modal - Temporarily disabled for TypeScript compilation */}
      {/* TODO: Re-enable when modal scope issue is resolved */}
      
      {/* Calendar Booking Modal - Temporarily disabled for TypeScript compilation */}
      {/* TODO: Re-enable when modal scope issue is resolved */}
    </div>
  );
};

// =============================================================================
// V2 COMPONENTS: Video-First Funnel (Neuromarketing Approach)
// Created for Sales Masterclass 2.0 - 3 videos + emotional checkpoints
// Made by mbxarts.com The Moon in a Box property | Co-Author: Godez22
// =============================================================================

/**
 * VideoBlock V2 - Wraps IntroVideoGate for seamless video playback
 * Psychology: Each video targets specific emotional/logical response
 */
const VideoBlock: React.FC<{
  videoConfig: {
    lessonId: string;
    muxPlaybackId: string;
    title: string;
    description?: string;
  };
  blockTitle: string;
  blockDescription?: string;
  onComplete: () => void;
  onPrevious?: () => void;
  canGoBack?: boolean;
}> = ({ videoConfig, blockTitle, blockDescription, onComplete, onPrevious, canGoBack = false }) => (
  <div className="py-8">
    {/* Block Header */}
    <motion.div
      className="text-center mb-6"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-600 dark:from-blue-400 dark:via-purple-400 dark:to-emerald-400 bg-clip-text text-transparent">
        {blockTitle}
      </h2>
      {blockDescription && (
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          {blockDescription}
        </p>
      )}
    </motion.div>

    {/* Video Player - Full Width */}
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 }}
      className="max-w-4xl mx-auto"
    >
      <IntroVideoGate
        lessonId={videoConfig.lessonId}
        muxPlaybackId={videoConfig.muxPlaybackId}
        title={videoConfig.title}
        description={videoConfig.description}
        onFinish={onComplete}
        forceShow={true}
        onBack={canGoBack && onPrevious ? onPrevious : undefined}
      />
    </motion.div>

    {/* Rotate Phone Hint - Mobile Only */}
    <RotatePhoneHintCompact locale="es" />

    {/* Progress Hint */}
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="text-center mt-6"
    >
      <p className="text-sm text-gray-500 dark:text-gray-500 flex items-center justify-center gap-2">
        <Play className="w-4 h-4" />
        <span>Completa el video para continuar</span>
      </p>
    </motion.div>
  </div>
);

/**
 * CheckpointBlock V2 - Simple emotional engagement (NOT a quiz)
 * Psychology: Builds commitment through reflection, not testing
 */
const CheckpointBlock: React.FC<{
  question: string;
  title: string;
  description?: string;
  onContinue: () => void;
  onPrevious?: () => void;
  canGoBack?: boolean;
}> = ({ question, title, description, onContinue, onPrevious, canGoBack = false }) => {
  const [hasReflected, setHasReflected] = useState(false);

  return (
    <div className="py-12 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-3xl mx-auto"
      >
        {/* Decorative Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className="mb-8"
        >
          <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 dark:from-purple-500/30 dark:to-blue-500/30 flex items-center justify-center border border-purple-300/30 dark:border-purple-600/30">
            <Heart className="w-12 h-12 text-purple-600 dark:text-purple-400" />
          </div>
        </motion.div>

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent"
        >
          {title}
        </motion.h2>

        {/* Description */}
        {description && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-lg text-gray-600 dark:text-gray-400 mb-8"
          >
            {description}
          </motion.p>
        )}

        {/* The Question - Emotional Hook */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-8 mb-8 shadow-xl"
        >
          <p className="text-2xl md:text-3xl text-gray-800 dark:text-gray-100 font-medium leading-relaxed">
            &ldquo;{question}&rdquo;
          </p>
        </motion.div>

        {/* Engagement Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          {!hasReflected ? (
            <>
              <motion.button
                onClick={() => setHasReflected(true)}
                className="px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold text-xl rounded-xl hover:scale-105 transition-all shadow-lg hover:shadow-xl border border-white/20"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-3">
                  <span>Sí, me identifico</span>
                  <Heart className="w-6 h-6" />
                </div>
              </motion.button>

              <motion.button
                onClick={() => setHasReflected(true)}
                className="px-6 py-3 bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:scale-105 transition-all shadow-md border border-gray-200/50 dark:border-gray-700/50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <span>Aún no, pero quiero aprender</span>
              </motion.button>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 text-xl font-bold">
                <CheckCircle className="w-8 h-8" />
                <span>Gracias por reflexionar</span>
              </div>

              <div className="flex gap-4 justify-center">
                {canGoBack && onPrevious && (
                  <motion.button
                    onClick={onPrevious}
                    className="px-6 py-4 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-lg rounded-xl hover:scale-105 transition-all shadow-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-2">
                      <ArrowLeft className="w-5 h-5" />
                      <span>ATRÁS</span>
                    </div>
                  </motion.button>
                )}

                <motion.button
                  onClick={onContinue}
                  className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-bold text-xl rounded-xl hover:scale-105 transition-all shadow-lg hover:shadow-xl border border-white/20"
                  style={{ animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-3">
                    <Rocket className="w-6 h-6" />
                    <span>CONTINUAR</span>
                    <ArrowRight className="w-6 h-6" />
                  </div>
                </motion.button>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Back Button - Always visible when canGoBack */}
        {canGoBack && onPrevious && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            onClick={onPrevious}
            className="mt-8 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Atrás
          </motion.button>
        )}

        {/* Trust Indicator */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-8 text-sm text-gray-500 dark:text-gray-500 flex items-center justify-center gap-2"
        >
          <Shield className="w-4 h-4" />
          <span>No hay respuesta incorrecta - es solo para ti</span>
        </motion.p>
      </motion.div>
    </div>
  );
};

/**
 * SocialBlock V2 - Twitter & Discord verification step
 * Psychology: Community commitment before success celebration
 */
const SocialBlock: React.FC<{
  content: SalesBlockContent;
  onComplete: () => void;
  onPrevious?: () => void;
  canGoBack?: boolean;
  savedSocialVerification?: {
    twitter: { verified: boolean; username: string | null; userId: string | null } | null;
    discord: { verified: boolean; username: string | null; userId: string | null } | null;
  } | null;
  onSocialVerified?: (platform: 'twitter' | 'discord', data: { username: string; userId: string }) => void;
}> = ({ content, onComplete, onPrevious, canGoBack = false, savedSocialVerification, onSocialVerified }) => {
  const account = useActiveAccount();

  // Social verification state
  const {
    twitterVerified,
    discordVerified,
    isTwitterLoading,
    isDiscordLoading,
  } = useSocialOAuth({
    walletAddress: account?.address || '',
    initialTwitterVerified: savedSocialVerification?.twitter?.verified ?? false,
    initialTwitterUsername: savedSocialVerification?.twitter?.username ?? null,
    initialDiscordVerified: savedSocialVerification?.discord?.verified ?? false,
    initialDiscordUsername: savedSocialVerification?.discord?.username ?? null,
    onVerified: (platform, data) => {
      console.log(`✅ ${platform} verified in SocialBlock: @${data.username}`);
      if (onSocialVerified) {
        const userId = data.userId || `temp_${platform}_${Date.now()}`;
        onSocialVerified(platform, { username: data.username, userId });
      }
    },
    onError: (error) => console.error('❌ Social error:', error),
  });

  const [twitterVerifying, setTwitterVerifying] = useState(false);
  const [discordVerifying, setDiscordVerifying] = useState(false);

  // Reset verifying states when verification completes
  useEffect(() => {
    if (twitterVerified) setTwitterVerifying(false);
  }, [twitterVerified]);

  useEffect(() => {
    if (discordVerified) setDiscordVerifying(false);
  }, [discordVerified]);

  const handleTwitterVerify = () => {
    if (twitterVerified || twitterVerifying) return;
    setTwitterVerifying(true);

    const width = 500, height = 650;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    const walletParam = account?.address ? `&wallet=${encodeURIComponent(account.address)}` : '';

    window.open(
      `/social/verify?platform=twitter${walletParam}`,
      'twitterVerify',
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
    );
  };

  const handleDiscordVerify = () => {
    if (discordVerified || discordVerifying) return;
    setDiscordVerifying(true);

    const width = 500, height = 650;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    const walletParam = account?.address ? `&wallet=${encodeURIComponent(account.address)}` : '';

    window.open(
      `/social/verify?platform=discord${walletParam}`,
      'discordVerify',
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
    );
  };

  const canProceed = twitterVerified && discordVerified;

  return (
    <div className="py-12 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-blue-300/30">
            <Users className="w-10 h-10 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
            {content.title || 'Únete a la Comunidad'}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {content.description || 'Conecta con nuestra comunidad para completar tu registro'}
          </p>
        </motion.div>

        {/* Social Verification Cards */}
        <div className="space-y-4 mb-8">
          {/* Twitter Card */}
          <motion.button
            onClick={handleTwitterVerify}
            disabled={twitterVerified || twitterVerifying}
            className={`w-full p-6 rounded-2xl border transition-all duration-300 ${
              twitterVerified
                ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700'
                : 'bg-white/60 dark:bg-gray-800/60 border-gray-200/50 dark:border-gray-700/50 hover:bg-blue-50/60 dark:hover:bg-blue-950/30 hover:border-blue-300/50 cursor-pointer'
            }`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={!twitterVerified ? { scale: 1.02 } : {}}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                  twitterVerified ? 'bg-emerald-500' : 'bg-blue-500'
                }`}>
                  {twitterVerified ? (
                    <CheckCircle className="w-8 h-8 text-white" />
                  ) : twitterVerifying ? (
                    <RefreshCw className="w-8 h-8 text-white animate-spin" />
                  ) : (
                    <Twitter className="w-8 h-8 text-white" />
                  )}
                </div>
                <div className="text-left">
                  <p className="text-xl font-bold text-gray-800 dark:text-white">
                    {twitterVerified ? '¡Siguiendo en X!' : 'Síguenos en X (Twitter)'}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">@cryptogiftdao</p>
                </div>
              </div>
              {!twitterVerified && (
                <ArrowRight className="w-6 h-6 text-gray-400" />
              )}
            </div>
          </motion.button>

          {/* Discord Card */}
          <motion.button
            onClick={handleDiscordVerify}
            disabled={discordVerified || discordVerifying}
            className={`w-full p-6 rounded-2xl border transition-all duration-300 ${
              discordVerified
                ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700'
                : 'bg-white/60 dark:bg-gray-800/60 border-gray-200/50 dark:border-gray-700/50 hover:bg-purple-50/60 dark:hover:bg-purple-950/30 hover:border-purple-300/50 cursor-pointer'
            }`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={!discordVerified ? { scale: 1.02 } : {}}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                  discordVerified ? 'bg-emerald-500' : 'bg-purple-600'
                }`}>
                  {discordVerified ? (
                    <CheckCircle className="w-8 h-8 text-white" />
                  ) : discordVerifying ? (
                    <RefreshCw className="w-8 h-8 text-white animate-spin" />
                  ) : (
                    <MessageSquare className="w-8 h-8 text-white" />
                  )}
                </div>
                <div className="text-left">
                  <p className="text-xl font-bold text-gray-800 dark:text-white">
                    {discordVerified ? '¡En Discord!' : 'Únete a Discord'}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">CryptoGift DAO Community</p>
                </div>
              </div>
              {!discordVerified && (
                <ArrowRight className="w-6 h-6 text-gray-400" />
              )}
            </div>
          </motion.button>
        </div>

        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex gap-4 justify-center"
        >
          {canGoBack && onPrevious && (
            <motion.button
              onClick={onPrevious}
              className="px-6 py-4 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-lg rounded-xl hover:scale-105 transition-all shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-2">
                <ArrowLeft className="w-5 h-5" />
                <span>ATRÁS</span>
              </div>
            </motion.button>
          )}

          <motion.button
            onClick={onComplete}
            disabled={!canProceed}
            className={`px-8 py-4 font-bold text-xl rounded-xl transition-all shadow-lg border border-white/20 ${
              canProceed
                ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white hover:scale-105 hover:shadow-xl cursor-pointer'
                : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }`}
            style={canProceed ? { animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite' } : {}}
            whileHover={canProceed ? { scale: 1.05 } : {}}
            whileTap={canProceed ? { scale: 0.98 } : {}}
          >
            <div className="flex items-center gap-3">
              <Trophy className="w-6 h-6" />
              <span>{canProceed ? '¡COMPLETAR!' : 'Verifica ambas redes'}</span>
              {canProceed && <ArrowRight className="w-6 h-6" />}
            </div>
          </motion.button>
        </motion.div>

        {/* Progress Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-8 flex items-center justify-center gap-4 text-sm text-gray-500"
        >
          <div className={`flex items-center gap-1 ${twitterVerified ? 'text-emerald-500' : ''}`}>
            {twitterVerified ? <CheckCircle className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
            <span>X/Twitter</span>
          </div>
          <div className={`flex items-center gap-1 ${discordVerified ? 'text-emerald-500' : ''}`}>
            {discordVerified ? <CheckCircle className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
            <span>Discord</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

// =============================================================================
// END V2 COMPONENTS
// =============================================================================

const SuccessBlock: React.FC<{
  content: any;
  leadData: any;
  metrics: any;
  educationalMode?: boolean;
  onEducationComplete?: (data?: {
    email?: string;
    questionsScore?: { correct: number; total: number };
    questionsAnswered?: any[];
  }) => void;
  verifiedEmail?: string;
  galleryVideoConfig?: {
    muxPlaybackId: string;
    title: string;
    description: string;
  };
}> = ({ content, leadData, metrics, educationalMode = false, onEducationComplete, verifiedEmail, galleryVideoConfig }) => {
  // Removed router dependency to avoid App Router/Pages Router conflicts

  // i18n translations for TeamSection
  const t = useTranslations('landing');

  // Animation phase: 'celebration' -> 'transition' -> 'settled'
  const [animationPhase, setAnimationPhase] = useState<'celebration' | 'transition' | 'settled'>('celebration');

  // Video playback now handled by GalleryVideoPlayer component

  // Start transition after celebration phase (2 seconds)
  useEffect(() => {
    const celebrationTimer = setTimeout(() => {
      setAnimationPhase('transition');
    }, 2000);

    const settledTimer = setTimeout(() => {
      setAnimationPhase('settled');
    }, 3000);

    return () => {
      clearTimeout(celebrationTimer);
      clearTimeout(settledTimer);
    };
  }, []);

  // Header animation variants - less shrinkage to keep prominence
  const headerVariants = {
    celebration: {
      scale: 1,
      y: 0,
      opacity: 1,
    },
    transition: {
      scale: 0.85,
      y: -20,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 20,
        bounce: 0.4,
      }
    },
    settled: {
      scale: 0.85,
      y: -20,
      opacity: 1,
    }
  };

  // Video container animation variants
  const videoVariants = {
    celebration: {
      y: 100,
      opacity: 0,
      scale: 0.9,
    },
    transition: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 200,
        damping: 25,
        delay: 0.2,
      }
    },
    settled: {
      y: 0,
      opacity: 1,
      scale: 1,
    }
  };

  return (
    <div className="py-12 text-center relative overflow-hidden">
      {/* Animated Header Section - Bounces and shrinks to top */}
      <motion.div
        className="relative z-10"
        variants={headerVariants}
        initial="celebration"
        animate={animationPhase}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.5 }}
        >
          <Trophy className={`mx-auto mb-4 text-yellow-400 transition-all duration-500 ${
            animationPhase === 'celebration' ? 'w-32 h-32 mb-8' : 'w-20 h-20 md:w-24 md:h-24 mb-3'
          }`} />
        </motion.div>

        <motion.h1
          className={`font-black bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent transition-all duration-500 ${
            animationPhase === 'celebration' ? 'text-5xl md:text-6xl mb-6' : 'text-3xl md:text-4xl lg:text-5xl mb-3'
          }`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {content.title}
        </motion.h1>

        <motion.p
          className={`text-gray-600 dark:text-gray-300 transition-all duration-500 ${
            animationPhase === 'celebration' ? 'text-xl md:text-2xl mb-8' : 'text-lg md:text-xl mb-4'
          }`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {content.message}
        </motion.p>
      </motion.div>

      {/* Gallery Video Section - Full Width with Floating Title */}
      <motion.div
        className="relative z-20 w-full"
        variants={videoVariants}
        initial="celebration"
        animate={animationPhase}
      >
        {galleryVideoConfig && (
          <div className="relative">
            {/* Floating Title - CRYPTOGIFT DAO GALLERY */}
            <motion.div
              className="text-center mb-6"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2
                className="text-3xl md:text-4xl lg:text-5xl font-black tracking-wider
                bg-gradient-to-r from-purple-400 via-pink-500 to-cyan-400 bg-clip-text text-transparent
                drop-shadow-[0_0_30px_rgba(168,85,247,0.5)]"
                style={{ animation: 'float 4s ease-in-out infinite' }}
              >
                CRYPTOGIFT DAO GALLERY
              </h2>
            </motion.div>

            {/* Static glow background - like IntroVideoGate */}
            <div
              className="absolute inset-0 -z-10 pointer-events-none"
              style={{
                background: `
                  radial-gradient(ellipse 120% 100% at 50% 0%, rgba(6, 182, 212, 0.25) 0%, transparent 60%),
                  radial-gradient(ellipse 100% 120% at 0% 50%, rgba(139, 92, 246, 0.35) 0%, transparent 55%),
                  radial-gradient(ellipse 100% 120% at 100% 50%, rgba(168, 85, 247, 0.3) 0%, transparent 55%),
                  radial-gradient(ellipse 120% 100% at 50% 100%, rgba(139, 92, 246, 0.35) 0%, transparent 60%)
                `,
                filter: 'blur(80px)',
                opacity: 0.5,
                transform: 'scale(1.18)',
              }}
            />

            {/* Static Video Player - no portal, works inside Framer Motion containers */}
            <StaticGalleryVideoPlayer
              muxPlaybackId={galleryVideoConfig.muxPlaybackId}
              title={galleryVideoConfig.title}
            />
          </div>
        )}
      </motion.div>

      {/* Rest of content appears after video is settled */}
      <AnimatePresence>
        {animationPhase === 'settled' && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-12 space-y-8"
          >
            {/* Stats */}
            <motion.div
              className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              {Object.entries(content.stats).map(([key, value], idx) => (
                <div
                  key={key}
                  className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-xl p-6"
                >
                  <div className="text-3xl font-bold text-blue-500 dark:text-blue-400 mb-2">{String(value)}</div>
                  <div className="text-gray-400 capitalize">{key.replace('_', ' ')}</div>
                </div>
              ))}
            </motion.div>

            {/* Benefits */}
            <motion.div
              className="max-w-2xl mx-auto mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              <h3 className="text-2xl font-bold mb-6">Tus Beneficios Exclusivos:</h3>
              <div className="space-y-3">
                {content.benefits.map((benefit: any, idx: number) => {
                  const IconComponent = benefit.icon;
                  return (
                    <motion.div
                      key={idx}
                      className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl backdrop-saturate-150 border border-gray-200/50 dark:border-gray-700/50 rounded-lg p-4 text-lg shadow-xl hover:shadow-2xl hover:bg-white/90 dark:hover:bg-gray-800/90 transition-all duration-300 hover:scale-[1.02] flex items-center gap-3"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1 + idx * 0.1 }}
                    >
                      <IconComponent className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      <span className="text-gray-800 dark:text-gray-200">{benefit.text}</span>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* Top Contributors Section */}
            <TeamSection
              badge={t('team.badge')}
              title={t('team.title')}
              subtitle={t('team.subtitle')}
            />

          {/* Features Showcase */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.4 }}
            className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto"
          >
            {/* CG Wallet Utilities */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl backdrop-saturate-150 border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
              <div className="flex items-center gap-4 mb-4">
                <img 
                  src="/cg-wallet-logo.png" 
                  alt="CG Wallet" 
                  className="w-12 h-12 rounded-xl shadow-md"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">CG Wallet</h3>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-3">Decenas de utilidades que transformarán tu experiencia crypto:</p>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li className="flex items-center gap-2">• <Lock className="w-4 h-4 text-blue-400 inline" /> Seguridad multi-capa con backup automático</li>
                <li className="flex items-center gap-2">• <ArrowLeftRight className="w-4 h-4 text-green-500 inline" /> Intercambios sin comisiones entre usuarios</li>
                <li className="flex items-center gap-2">• <Gift className="w-4 h-4 text-pink-500 inline" /> Portador de vida con funcionalidades integradas</li>
                <li className="flex items-center gap-2">• <BarChart3 className="w-4 h-4 text-purple-500 inline" /> Analytics avanzados de tu portafolio</li>
                <li className="flex items-center gap-2">• <Globe className="w-4 h-4 text-cyan-500 inline" /> Cross-chain compatibility</li>
              </ul>
            </div>

            {/* Art & Personalization */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl backdrop-saturate-150 border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
              <div className="flex items-center gap-4 mb-4">
                <img 
                  src="/Arte-IA-Personalizado.png" 
                  alt="Arte Personalizado" 
                  className="w-12 h-12 rounded-xl shadow-md"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <h3 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 dark:from-pink-400 dark:to-purple-400 bg-clip-text text-transparent">Arte IA</h3>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-3">Crear valor a través del arte personalizado:</p>
              <div className="flex items-center gap-3 mb-2">
                <img 
                  src="/wallet-regalo.png" 
                  alt="Wallet Regalo" 
                  className="w-8 h-8 rounded-lg shadow-sm"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <p className="text-sm text-gray-600 dark:text-gray-400">Una imagen dice más que mil palabras - la integración de la wallet le da la posibilidad de ser portador de vida</p>
              </div>
            </div>
          </motion.div>

          {/* Knowledge Center - Neural Hub */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.8 }}
            className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 dark:from-purple-500/10 dark:to-blue-500/10 border border-purple-500/30 rounded-3xl p-8 shadow-2xl max-w-4xl mx-auto"
          >
            <div className="text-center mb-6">
              <img 
                src="/knowledge-logo.png" 
                alt="Knowledge Center" 
                className="w-16 h-16 mx-auto mb-4 rounded-2xl shadow-lg"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <h3 className="text-3xl font-black mb-4 bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent flex items-center justify-center gap-3">
                <Brain className="w-8 h-8 text-purple-500" /> Knowledge: Centro Neurálgico del Futuro
              </h3>
              <p className="text-lg text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
                La sección Knowledge se convertirá en el epicentro donde confluyen creadores de contenido y consumidores, 
                maestros y estudiantes, con integración de las academias crypto más prestigiosas del ecosistema.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-4 text-center text-sm text-gray-600 dark:text-gray-400">
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-4">
                <h4 className="font-bold text-orange-600 dark:text-orange-400 mb-2 flex items-center justify-center gap-2"><Trophy className="w-5 h-5 text-amber-500" /> Academias Elite</h4>
                <p>Integración con Binance Academy, Coin Bureau, DeFi Pulse y más</p>
              </div>
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-4">
                <h4 className="font-bold text-green-600 dark:text-green-400 mb-2 flex items-center justify-center gap-2"><StyledIcon icon="gamepad" /> Gamificación</h4>
                <p>Sistema de logros, NFT badges y rewards por aprendizaje</p>
              </div>
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-4">
                <h4 className="font-bold text-blue-600 dark:text-blue-400 mb-2 flex items-center justify-center gap-2"><StyledIcon icon="handshake" /> DAO Community</h4>
                <p>Governance participativa y decisiones comunitarias</p>
              </div>
            </div>
          </motion.div>

          {/* Final CTA with Confetti */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 3.2 }}
            className="text-center"
            onAnimationComplete={() => {
              // Trigger confetti for all modes
              setTimeout(() => {
                triggerConfetti();
              }, 500);
            }}
          >
            <p className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 dark:from-yellow-400 dark:to-orange-400 bg-clip-text text-transparent mb-6 flex items-center justify-center gap-2">
              <StyledIcon icon="party" size="lg" withGlow /> ¡El futuro de los pagos digitales comienza contigo! <StyledIcon icon="party" size="lg" withGlow />
            </p>
            
            {/* FASE 3: Condicionar CTAs - ocultar en modo educacional */}
            {!educationalMode && (
              <div className="flex justify-center gap-4 flex-wrap">
                <button
                  onClick={() => window.location.href = '/knowledge'}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:scale-105 transition-all shadow-xl hover:shadow-2xl border border-white/20"
                  data-testid="explorar-knowledge-button"
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    <span>Explorar Knowledge</span>
                  </div>
                </button>
                
                <button
                  onClick={() => window.location.href = '/'}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-bold rounded-xl hover:scale-105 transition-all shadow-xl hover:shadow-2xl border border-white/20"
                  data-testid="crear-primer-regalo-button"
                >
                  <div className="flex items-center gap-2">
                    <Gift className="w-5 h-5" />
                    <span>Crear mi Primer Regalo</span>
                  </div>
                </button>
              </div>
            )}
          </motion.div>
          {/* FASE 3: Educational mode - Fixed IR AL CLAIM button */}
          {educationalMode && onEducationComplete && (
            <div className="flex justify-center">
              <button
                onClick={() => {
                  console.log('🎯 IR AL CLAIM clicked - completing education directly');

                  // Complete education directly without outro video
                  onEducationComplete({
                    email: undefined,
                    questionsScore: {
                      correct: 0,
                      total: 0
                    },
                    questionsAnswered: []
                  });
                }}
                className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl hover:scale-105 transition-all shadow-xl hover:shadow-2xl border border-white/20 text-lg"
                data-testid="ir-al-claim-button"
              >
                <div className="flex items-center gap-3">
                  <Trophy className="w-6 h-6" />
                  <span>IR AL CLAIM</span>
                  <ArrowRight className="w-5 h-5" />
                </div>
              </button>
            </div>
          )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export { SalesMasterclass };
export default SalesMasterclass;