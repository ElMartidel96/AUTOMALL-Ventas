/**
 * VIDEO CONFIGURATION - Centralized video management (SPANISH VERSION)
 * This file makes it extremely easy to replace videos by just changing the IDs
 *
 * Made by mbxarts.com The Moon in a Box property
 * Co-Author: Godez22
 */

export interface VideoConfig {
  lessonId: string;        // Unique ID for localStorage persistence
  muxPlaybackId: string;   // Mux Playback ID
  title: string;
  description?: string;
  poster?: string;         // Optional poster image
  captionsVtt?: string;    // Optional captions file
}

/**
 * CENTRALIZED VIDEO CONFIGURATION - SPANISH VERSION
 * To replace any video, just update the muxPlaybackId here
 * The lessonId should be changed when you want to force all users to see the new video
 */
export const VIDEO_CONFIG: Record<string, VideoConfig> = {
  // Sales Masterclass intro video (Spanish)
  salesMasterclass: {
    lessonId: "sales-masterclass-es-v3",
    muxPlaybackId: "3W6iaGGBJN2AyMh37o5Qg3kdNDEFi2JP4UIBRK00QJhE",
    title: "Presentación Completa",
    description: "Descubre cómo regalar activos digitales de valor real con CryptoGift\n\nTiempo estimado: 10 minutos",
  },

  // Presentation CGC - Gallery video after role selection (Spanish)
  // Updated: 2025-01-01 - New gallery video
  presentationCGC: {
    lessonId: "presentation-cgc-es-v3",
    muxPlaybackId: "lsT00V7M302d9EIrKr9vUaVTnxvee3q15yF1OUKZYFpMc",
    title: "CryptoGift DAO Gallery",
    description: "Descubre las oportunidades exclusivas que te esperan como miembro del CryptoGift Club",
  },

  // Example for future lessons
  walletBasics: {
    lessonId: "wallet-basics-v1",
    muxPlaybackId: "YOUR_MUX_PLAYBACK_ID_HERE",
    title: "Fundamentos de Wallets",
    description: "Aprende los conceptos básicos de las billeteras digitales",
  },

  gasOptimization: {
    lessonId: "gas-optimization-v1",
    muxPlaybackId: "YOUR_MUX_PLAYBACK_ID_HERE",
    title: "Optimización de Gas",
    description: "Estrategias para minimizar costos de transacción",
  },

  nftIntro: {
    lessonId: "nft-intro-v1",
    muxPlaybackId: "YOUR_MUX_PLAYBACK_ID_HERE",
    title: "Introducción a NFTs",
    description: "Todo lo que necesitas saber sobre NFTs",
  },

  defiBasics: {
    lessonId: "defi-basics-v1",
    muxPlaybackId: "YOUR_MUX_PLAYBACK_ID_HERE",
    title: "DeFi para Principiantes",
    description: "Descubre el poder de las finanzas descentralizadas",
  },

  // =============================================================================
  // SALES MASTERCLASS V2 - VIDEO FUNNEL (NEUROMARKETING APPROACH)
  // 3 videos: TOFU (emotion) → MOFU (logic) → BOFU (trust/action)
  // =============================================================================

  // Video 1: THE GIFT (TOFU - Top of Funnel) - ~1:05
  // Psychology: Emotion + Desire
  // Updated: 2025-01-05 - New Spanish version
  salesMasterclassV2_TheGift: {
    lessonId: "sales-masterclass-v2-gift-v3",
    muxPlaybackId: "02Sx72OAZtSl1ai3NTVTT3Cnd1LN6Xo2QpwNlRCQBAYI",
    title: "El Regalo",
    description: "El primer paso hacia la confianza real.\n\n¿Cuántas veces quisiste compartir el futuro de Web3 con alguien que amas?",
  },

  // Video 2: THE SOLUTION (MOFU - Middle of Funnel) - ~2:15
  // Psychology: Logic + Proof
  // Updated: 2026-01-15 - New Spanish version
  salesMasterclassV2_TheSolution: {
    lessonId: "sales-masterclass-v2-solution-v5",
    muxPlaybackId: "w4Vc301lPESPjSzw4RropH7EtQ5wUt4ETlLZTd01ipcd4",
    title: "La Solución",
    description: "La tecnología detrás de la magia.\n\n5 contratos verificados. 717+ transacciones on-chain. 85.7% claim rate.",
  },

  // Video 3: THE OPPORTUNITY (BOFU - Bottom of Funnel) - ~3:00
  // Psychology: Trust + Action
  // Updated: 2026-01-15 - New Spanish version
  salesMasterclassV2_TheOpportunity: {
    lessonId: "sales-masterclass-v2-opportunity-v4",
    muxPlaybackId: "kW3Qjf32XNK1XnNQBtTVT68SDJrIk2m502MUrrJwzoyE",
    title: "La Oportunidad",
    description: "Tu invitación al futuro.\n\nEstamos temprano. La infraestructura está lista. La comunidad se está formando.",
  },
};

/**
 * Helper function to get video config
 * @param key - The key from VIDEO_CONFIG object
 * @returns VideoConfig object or undefined if not found
 */
export function getVideoConfig(key: keyof typeof VIDEO_CONFIG): VideoConfig | undefined {
  return VIDEO_CONFIG[key];
}

/**
 * Helper function to update video version (forces re-watch)
 * @param key - The key from VIDEO_CONFIG object
 * @param version - New version number or string
 */
export function updateVideoVersion(key: keyof typeof VIDEO_CONFIG, version: string | number) {
  const config = VIDEO_CONFIG[key];
  if (config) {
    // Extract base lesson ID without version
    const baseId = config.lessonId.replace(/-v\d+$/, '');
    config.lessonId = `${baseId}-v${version}`;
  }
  return config;
}

/**
 * HOW TO REPLACE A VIDEO:
 *
 * 1. Upload new video to Mux
 * 2. Get the new Playback ID from Mux dashboard
 * 3. Update the muxPlaybackId in VIDEO_CONFIG above
 * 4. If you want to force all users to watch the new video, change the lessonId version:
 *    - Example: "sales-masterclass-es-v1" → "sales-masterclass-es-v2"
 * 5. Deploy changes
 *
 * That's it! The video will be automatically updated everywhere it's used.
 */

export default VIDEO_CONFIG;
