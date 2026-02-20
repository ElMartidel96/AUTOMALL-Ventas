/**
 * VIDEO CONFIGURATION - Centralized video management (ENGLISH VERSION)
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
 * CENTRALIZED VIDEO CONFIGURATION - ENGLISH VERSION
 * To replace any video, just update the muxPlaybackId here
 * The lessonId should be changed when you want to force all users to see the new video
 */
export const VIDEO_CONFIG: Record<string, VideoConfig> = {
  // Sales Masterclass intro video (English)
  salesMasterclass: {
    lessonId: "sales-masterclass-en-v4",
    muxPlaybackId: "3lWAgyukmAHnff02tpTAzYD00DeftIi005YWLmk5AYFs00Y",
    title: "CryptoGift Project",
    description: "Learn about our vision. Starts with a brief video with audio, get comfortable to enjoy it\n\nEstimated time: 10 minutes",
  },

  // Presentation CGC - Gallery video after role selection (English)
  // Updated: 2025-01-01 - New gallery video EN
  presentationCGC: {
    lessonId: "presentation-cgc-en-v2",
    muxPlaybackId: "ntscvAUpAGeSDLi00Yc383JpC028dAT5o5OqeBohx01sMI",
    title: "CryptoGift DAO Gallery",
    description: "Discover the exclusive opportunities awaiting you as a CryptoGift Club member",
  },

  // Example for future lessons
  walletBasics: {
    lessonId: "wallet-basics-v1",
    muxPlaybackId: "YOUR_MUX_PLAYBACK_ID_HERE",
    title: "Crypto Wallet Fundamentals",
    description: "Learn the basic concepts of digital wallets",
  },

  gasOptimization: {
    lessonId: "gas-optimization-v1",
    muxPlaybackId: "YOUR_MUX_PLAYBACK_ID_HERE",
    title: "Gas Optimization",
    description: "Strategies to minimize transaction costs",
  },

  nftIntro: {
    lessonId: "nft-intro-v1",
    muxPlaybackId: "YOUR_MUX_PLAYBACK_ID_HERE",
    title: "Introduction to NFTs",
    description: "Everything you need to know about NFTs",
  },

  defiBasics: {
    lessonId: "defi-basics-v1",
    muxPlaybackId: "YOUR_MUX_PLAYBACK_ID_HERE",
    title: "DeFi for Beginners",
    description: "Discover the power of decentralized finance",
  },

  // =============================================================================
  // SALES MASTERCLASS V2 - VIDEO FUNNEL (NEUROMARKETING APPROACH)
  // 3 videos: TOFU (emotion) → MOFU (logic) → BOFU (trust/action)
  // =============================================================================

  // Video 1: THE GIFT (TOFU - Top of Funnel) - ~1:05
  // Psychology: Emotion + Desire
  // Updated: 2025-01-01 - CryptoGift DAO 1 (same for EN until ES version ready)
  salesMasterclassV2_TheGift: {
    lessonId: "sales-masterclass-v2-gift-v2",
    muxPlaybackId: "Y02PN1hp8Wu2bq7MOBR3YZlyQ7uoF02Bm01lnFVE5y018i4",
    title: "The Gift",
    description: "The first step toward real trust.\n\nHow many times did you want to share the future of Web3 with someone you love?",
  },

  // Video 2: THE SOLUTION (MOFU - Middle of Funnel) - ~2:15
  // Psychology: Logic + Proof
  // Updated: 2026-01-15 - CryptoGift DAO 2 (new version)
  salesMasterclassV2_TheSolution: {
    lessonId: "sales-masterclass-v2-solution-v4",
    muxPlaybackId: "sCdMXnMSw00F6ZOvbN6Zr4A8YUbINEHslDGaWACdaxr8",
    title: "The Solution",
    description: "The technology behind the magic.\n\n5 verified contracts. 717+ on-chain transactions. 85.7% claim rate.",
  },

  // Video 3: THE OPPORTUNITY (BOFU - Bottom of Funnel) - ~3:00
  // Psychology: Trust + Action
  // Updated: 2026-01-15 - CryptoGift DAO 3 (new version)
  salesMasterclassV2_TheOpportunity: {
    lessonId: "sales-masterclass-v2-opportunity-v3",
    muxPlaybackId: "Jq01802JfkUoWINtzf5e00UmPD53RLFvtfsCiXvv00t1HFE",
    title: "The Opportunity",
    description: "Your invitation to the future.\n\nWe're early. The infrastructure is ready. The community is forming.",
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
 *    - Example: "sales-masterclass-en-v1" → "sales-masterclass-en-v2"
 * 5. Deploy changes
 *
 * That's it! The video will be automatically updated everywhere it's used.
 */

export default VIDEO_CONFIG;
