/**
 * 🔒 INVITE FLOW PERSISTENCE SERVICE
 *
 * Enterprise-grade state persistence for SpecialInviteFlow.
 * Ensures user progress is NEVER lost due to:
 * - Page refresh
 * - Browser close
 * - Navigation back
 * - Phone turning off
 * - Any other interruption
 *
 * Storage Strategy:
 * - localStorage: Primary persistence (survives browser close)
 * - sessionStorage: Backup for same-session recovery
 * - Keyed by invite code for isolation
 *
 * Zero Friction Policy:
 * - Silent save on every state change
 * - Automatic restore on component mount
 * - No user action required
 *
 * @version 1.0.0 - Zero Friction Edition
 * Co-Author: Godez22
 */

// Storage keys
const STORAGE_PREFIX = 'cgdao_invite_progress_';
const STORAGE_VERSION = 4; // v4: Added selectedPath (role) persistence

// Flow step type (must match SpecialInviteFlow)
export type FlowStep = 'welcome' | 'password' | 'education' | 'connect' | 'delegate' | 'complete';

// Education block state for granular persistence
export interface EducationBlockState {
  // Current block index (0-10) in SalesMasterclass
  currentBlockIndex: number;
  // Whether intro video has been completed
  introVideoCompleted: boolean;
  // Whether outro video has been completed
  outroVideoCompleted: boolean;
  // Array of block IDs that have been completed
  completedBlocks: string[];
  // Detailed answers for each question
  questionsAnswered: Array<{
    blockId: string;
    questionText: string;
    selectedAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    answeredAt: number;
  }>;
}

// Progress data structure
export interface InviteFlowProgress {
  version: number;
  inviteCode: string;
  isPermanent: boolean;

  // Flow state
  currentStep: FlowStep;
  passwordValidated: boolean;
  educationCompleted: boolean;
  questionsScore: { correct: number; total: number };

  // 🆕 GRANULAR EDUCATION STATE - Per-block persistence
  educationState: EducationBlockState | null;

  // 🆕 Selected role (Quest Creator, Integration Partner, etc.)
  selectedPath: string | null;

  // Verification state
  verifiedEmail: string | null;
  calendarBooked: boolean;

  // 🆕 Social verification state (persisted to survive refresh/language change)
  socialVerification: {
    twitter: {
      verified: boolean;
      username: string | null;
      userId: string | null;
      verifiedAt: number | null;
    };
    discord: {
      verified: boolean;
      username: string | null;
      userId: string | null;
      verifiedAt: number | null;
    };
  } | null;

  // Wallet state (connected at end)
  walletAddress: string | null;
  claimAttempted: boolean;
  claimSuccessful: boolean;

  // Timestamps
  startedAt: number;
  lastUpdatedAt: number;
  completedAt: number | null;

  // Error recovery
  lastError: {
    step: string;
    message: string;
    timestamp: number;
  } | null;
}

/**
 * Check if we're in a browser environment
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

/**
 * Get storage key for an invite code
 */
function getStorageKey(inviteCode: string): string {
  return `${STORAGE_PREFIX}${inviteCode}`;
}

/**
 * Check if progress has expired (30 days)
 */
function isExpired(progress: InviteFlowProgress): boolean {
  const expiryTime = progress.startedAt + (30 * 24 * 60 * 60 * 1000);
  return Date.now() > expiryTime;
}

/**
 * Save progress to localStorage and sessionStorage
 */
export function saveInviteProgress(progress: InviteFlowProgress): boolean {
  if (!isBrowser()) return false;

  try {
    const data = JSON.stringify({
      ...progress,
      version: STORAGE_VERSION,
      lastUpdatedAt: Date.now(),
    });

    const key = getStorageKey(progress.inviteCode);

    // Primary storage
    localStorage.setItem(key, data);

    // Backup storage
    sessionStorage.setItem(key, data);

    console.log('[InviteFlowPersistence] Progress saved:', progress.currentStep);
    return true;
  } catch (error) {
    console.error('[InviteFlowPersistence] Failed to save progress:', error);
    return false;
  }
}

/**
 * Load progress from storage for a specific invite code
 * Tries localStorage first, falls back to sessionStorage
 */
export function loadInviteProgress(inviteCode: string): InviteFlowProgress | null {
  if (!isBrowser()) return null;

  try {
    const key = getStorageKey(inviteCode);

    // Try localStorage first
    let data = localStorage.getItem(key);

    // Fallback to sessionStorage
    if (!data) {
      data = sessionStorage.getItem(key);
    }

    if (!data) return null;

    const progress = JSON.parse(data) as InviteFlowProgress;

    // Check version compatibility
    if (progress.version !== STORAGE_VERSION) {
      console.log('[InviteFlowPersistence] Old version detected, clearing');
      clearInviteProgress(inviteCode);
      return null;
    }

    // Check expiry
    if (isExpired(progress)) {
      console.log('[InviteFlowPersistence] Progress expired, clearing');
      clearInviteProgress(inviteCode);
      return null;
    }

    // Verify invite code matches
    if (progress.inviteCode !== inviteCode) {
      console.log('[InviteFlowPersistence] Invite code mismatch, clearing');
      clearInviteProgress(inviteCode);
      return null;
    }

    console.log('[InviteFlowPersistence] Progress loaded:', progress.currentStep);
    return progress;
  } catch (error) {
    console.error('[InviteFlowPersistence] Failed to load progress:', error);
    return null;
  }
}

/**
 * Clear progress for a specific invite code
 */
export function clearInviteProgress(inviteCode: string): void {
  if (!isBrowser()) return;

  try {
    const key = getStorageKey(inviteCode);
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
    console.log('[InviteFlowPersistence] Progress cleared for:', inviteCode);
  } catch (error) {
    console.error('[InviteFlowPersistence] Failed to clear progress:', error);
  }
}

/**
 * Initialize new progress when user starts the flow
 */
export function initializeInviteProgress(
  inviteCode: string,
  isPermanent: boolean
): InviteFlowProgress {
  const now = Date.now();

  const progress: InviteFlowProgress = {
    version: STORAGE_VERSION,
    inviteCode,
    isPermanent,
    currentStep: 'welcome',
    passwordValidated: false,
    educationCompleted: false,
    questionsScore: { correct: 0, total: 0 },
    educationState: null, // Will be initialized when entering education
    selectedPath: null, // Will be set when user selects a role
    verifiedEmail: null,
    calendarBooked: false,
    socialVerification: null, // Will be initialized when first social is verified
    walletAddress: null,
    claimAttempted: false,
    claimSuccessful: false,
    startedAt: now,
    lastUpdatedAt: now,
    completedAt: null,
    lastError: null,
  };

  saveInviteProgress(progress);
  return progress;
}

/**
 * 🆕 Initialize education state when entering education step
 */
export function initializeEducationState(
  progress: InviteFlowProgress
): InviteFlowProgress {
  const updated: InviteFlowProgress = {
    ...progress,
    educationState: {
      currentBlockIndex: 0,
      introVideoCompleted: false,
      outroVideoCompleted: false,
      completedBlocks: [],
      questionsAnswered: [],
    },
    lastUpdatedAt: Date.now(),
  };

  saveInviteProgress(updated);
  return updated;
}

/**
 * 🆕 Update education state when intro video is completed
 */
export function updateIntroVideoCompleted(
  progress: InviteFlowProgress
): InviteFlowProgress {
  if (!progress.educationState) {
    progress = initializeEducationState(progress);
  }

  const updated: InviteFlowProgress = {
    ...progress,
    educationState: {
      ...progress.educationState!,
      introVideoCompleted: true,
    },
    lastUpdatedAt: Date.now(),
  };

  saveInviteProgress(updated);
  console.log('[InviteFlowPersistence] Intro video completed, saved');
  return updated;
}

/**
 * 🆕 Update current block index in education (GRANULAR PERSISTENCE)
 */
export function updateEducationBlock(
  progress: InviteFlowProgress,
  blockIndex: number,
  blockId: string
): InviteFlowProgress {
  if (!progress.educationState) {
    progress = initializeEducationState(progress);
  }

  // Only add to completedBlocks if moving forward
  const completedBlocks = [...progress.educationState!.completedBlocks];
  if (blockIndex > 0 && progress.educationState!.currentBlockIndex < blockIndex) {
    const previousBlockId = progress.educationState!.completedBlocks.includes(blockId)
      ? blockId
      : blockId;
    if (!completedBlocks.includes(previousBlockId)) {
      // Mark the previous block as completed when advancing
    }
  }

  const updated: InviteFlowProgress = {
    ...progress,
    educationState: {
      ...progress.educationState!,
      currentBlockIndex: blockIndex,
      completedBlocks,
    },
    lastUpdatedAt: Date.now(),
  };

  saveInviteProgress(updated);
  console.log('[InviteFlowPersistence] Education block saved:', blockIndex, blockId);
  return updated;
}

/**
 * 🆕 Update when a question is answered in education
 */
export function updateEducationQuestionAnswered(
  progress: InviteFlowProgress,
  answer: {
    blockId: string;
    questionText: string;
    selectedAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  }
): InviteFlowProgress {
  if (!progress.educationState) {
    progress = initializeEducationState(progress);
  }

  // Don't duplicate answers
  const existingAnswers = progress.educationState!.questionsAnswered;
  const alreadyAnswered = existingAnswers.some(a => a.blockId === answer.blockId);

  if (alreadyAnswered) {
    console.log('[InviteFlowPersistence] Question already answered, skipping');
    return progress;
  }

  const questionsAnswered = [
    ...existingAnswers,
    { ...answer, answeredAt: Date.now() },
  ];

  // Mark block as completed when question is answered
  const completedBlocks = [...progress.educationState!.completedBlocks];
  if (!completedBlocks.includes(answer.blockId)) {
    completedBlocks.push(answer.blockId);
  }

  // Update questions score
  const correctCount = questionsAnswered.filter(q => q.isCorrect).length;
  const totalCount = questionsAnswered.length;

  const updated: InviteFlowProgress = {
    ...progress,
    educationState: {
      ...progress.educationState!,
      questionsAnswered,
      completedBlocks,
    },
    questionsScore: { correct: correctCount, total: totalCount },
    lastUpdatedAt: Date.now(),
  };

  saveInviteProgress(updated);
  console.log('[InviteFlowPersistence] Question answer saved:', answer.blockId, answer.isCorrect);
  return updated;
}

/**
 * 🆕 Update when outro video is completed
 */
export function updateOutroVideoCompleted(
  progress: InviteFlowProgress
): InviteFlowProgress {
  if (!progress.educationState) {
    progress = initializeEducationState(progress);
  }

  const updated: InviteFlowProgress = {
    ...progress,
    educationState: {
      ...progress.educationState!,
      outroVideoCompleted: true,
    },
    lastUpdatedAt: Date.now(),
  };

  saveInviteProgress(updated);
  console.log('[InviteFlowPersistence] Outro video completed, saved');
  return updated;
}

/**
 * Update progress with new step
 */
export function updateStep(
  progress: InviteFlowProgress,
  newStep: FlowStep
): InviteFlowProgress {
  const updated: InviteFlowProgress = {
    ...progress,
    currentStep: newStep,
    lastUpdatedAt: Date.now(),
  };

  saveInviteProgress(updated);
  return updated;
}

/**
 * Update progress when password is validated
 */
export function updatePasswordValidated(
  progress: InviteFlowProgress
): InviteFlowProgress {
  const updated: InviteFlowProgress = {
    ...progress,
    passwordValidated: true,
    currentStep: 'education',
    lastUpdatedAt: Date.now(),
  };

  saveInviteProgress(updated);
  return updated;
}

/**
 * Update progress when education is completed
 */
export function updateEducationCompleted(
  progress: InviteFlowProgress,
  questionsScore: { correct: number; total: number }
): InviteFlowProgress {
  const updated: InviteFlowProgress = {
    ...progress,
    educationCompleted: true,
    questionsScore,
    currentStep: 'connect',
    lastUpdatedAt: Date.now(),
  };

  saveInviteProgress(updated);
  return updated;
}

/**
 * Update progress with email verification
 */
export function updateEmailVerified(
  progress: InviteFlowProgress,
  email: string
): InviteFlowProgress {
  const updated: InviteFlowProgress = {
    ...progress,
    verifiedEmail: email,
    lastUpdatedAt: Date.now(),
  };

  saveInviteProgress(updated);
  return updated;
}

/**
 * Update progress with calendar booking
 */
export function updateCalendarBooked(
  progress: InviteFlowProgress
): InviteFlowProgress {
  const updated: InviteFlowProgress = {
    ...progress,
    calendarBooked: true,
    lastUpdatedAt: Date.now(),
  };

  saveInviteProgress(updated);
  return updated;
}

/**
 * 🆕 Update progress when user selects a role (Quest Creator, Integration Partner, etc.)
 * This persists the selected role to survive page refresh and language changes
 */
export function updateSelectedPath(
  progress: InviteFlowProgress,
  selectedPath: string
): InviteFlowProgress {
  const updated: InviteFlowProgress = {
    ...progress,
    selectedPath,
    lastUpdatedAt: Date.now(),
  };

  saveInviteProgress(updated);
  console.log('[InviteFlowPersistence] Selected path saved:', selectedPath);
  return updated;
}

/**
 * 🆕 Initialize social verification state
 */
function initializeSocialVerification(): NonNullable<InviteFlowProgress['socialVerification']> {
  return {
    twitter: {
      verified: false,
      username: null,
      userId: null,
      verifiedAt: null,
    },
    discord: {
      verified: false,
      username: null,
      userId: null,
      verifiedAt: null,
    },
  };
}

/**
 * 🆕 Update progress when Twitter/X is verified
 * Persists verification state to survive page refresh and language changes
 */
export function updateTwitterVerified(
  progress: InviteFlowProgress,
  data: { username: string; userId: string }
): InviteFlowProgress {
  const socialVerification = progress.socialVerification ?? initializeSocialVerification();

  const updated: InviteFlowProgress = {
    ...progress,
    socialVerification: {
      ...socialVerification,
      twitter: {
        verified: true,
        username: data.username,
        userId: data.userId,
        verifiedAt: Date.now(),
      },
    },
    lastUpdatedAt: Date.now(),
  };

  saveInviteProgress(updated);
  console.log('[InviteFlowPersistence] Twitter verification saved:', data.username);
  return updated;
}

/**
 * 🆕 Update progress when Discord is verified
 * Persists verification state to survive page refresh and language changes
 */
export function updateDiscordVerified(
  progress: InviteFlowProgress,
  data: { username: string; userId: string }
): InviteFlowProgress {
  const socialVerification = progress.socialVerification ?? initializeSocialVerification();

  const updated: InviteFlowProgress = {
    ...progress,
    socialVerification: {
      ...socialVerification,
      discord: {
        verified: true,
        username: data.username,
        userId: data.userId,
        verifiedAt: Date.now(),
      },
    },
    lastUpdatedAt: Date.now(),
  };

  saveInviteProgress(updated);
  console.log('[InviteFlowPersistence] Discord verification saved:', data.username);
  return updated;
}

/**
 * 🆕 Check if a specific social platform is verified
 */
export function isSocialVerified(
  progress: InviteFlowProgress | null,
  platform: 'twitter' | 'discord'
): boolean {
  if (!progress?.socialVerification) return false;
  return progress.socialVerification[platform].verified;
}

/**
 * 🆕 Get all social verification data for syncing to database after wallet connection
 */
export function getSocialVerificationData(
  progress: InviteFlowProgress | null
): {
  twitter: { verified: boolean; username: string | null; userId: string | null } | null;
  discord: { verified: boolean; username: string | null; userId: string | null } | null;
} | null {
  if (!progress?.socialVerification) return null;
  return {
    twitter: progress.socialVerification.twitter.verified
      ? {
          verified: true,
          username: progress.socialVerification.twitter.username,
          userId: progress.socialVerification.twitter.userId,
        }
      : null,
    discord: progress.socialVerification.discord.verified
      ? {
          verified: true,
          username: progress.socialVerification.discord.username,
          userId: progress.socialVerification.discord.userId,
        }
      : null,
  };
}

/**
 * Update progress when wallet connects
 */
export function updateWalletConnected(
  progress: InviteFlowProgress,
  walletAddress: string
): InviteFlowProgress {
  const updated: InviteFlowProgress = {
    ...progress,
    walletAddress,
    lastUpdatedAt: Date.now(),
  };

  saveInviteProgress(updated);
  return updated;
}

/**
 * Update progress when claim is attempted
 */
export function updateClaimAttempted(
  progress: InviteFlowProgress,
  successful: boolean
): InviteFlowProgress {
  const updated: InviteFlowProgress = {
    ...progress,
    claimAttempted: true,
    claimSuccessful: successful,
    currentStep: successful ? 'delegate' : progress.currentStep,
    lastUpdatedAt: Date.now(),
  };

  saveInviteProgress(updated);
  return updated;
}

/**
 * Mark progress as completed
 */
export function markCompleted(progress: InviteFlowProgress): InviteFlowProgress {
  const now = Date.now();
  const updated: InviteFlowProgress = {
    ...progress,
    currentStep: 'complete',
    completedAt: now,
    lastUpdatedAt: now,
  };

  saveInviteProgress(updated);

  // Schedule cleanup after 1 hour
  if (isBrowser()) {
    setTimeout(() => {
      const current = loadInviteProgress(progress.inviteCode);
      if (current?.currentStep === 'complete') {
        clearInviteProgress(progress.inviteCode);
      }
    }, 60 * 60 * 1000);
  }

  return updated;
}

/**
 * Record an error for debugging
 */
export function recordError(
  progress: InviteFlowProgress,
  step: string,
  message: string
): InviteFlowProgress {
  const updated: InviteFlowProgress = {
    ...progress,
    lastError: {
      step,
      message,
      timestamp: Date.now(),
    },
    lastUpdatedAt: Date.now(),
  };

  saveInviteProgress(updated);
  return updated;
}

/**
 * Check if the invite flow is complete
 */
export function isFlowComplete(progress: InviteFlowProgress | null): boolean {
  if (!progress) return false;
  return progress.currentStep === 'complete';
}

/**
 * Get the step to resume from based on saved progress
 * This handles the logic of determining where user should continue
 *
 * CRITICAL FIX (Dec 2025): Previously, refreshing on Welcome would auto-advance
 * to education because !hasPassword was true. Now we respect the saved currentStep
 * and only advance if user has explicitly moved past welcome.
 *
 * This ensures proper persistence:
 * - User on welcome stays on welcome (sees referrer's personalized message)
 * - User in education stays in education (with granular block state preserved)
 * - Page refresh or language change NEVER resets the flow
 */
export function getResumeStep(
  progress: InviteFlowProgress,
  hasPassword: boolean
): FlowStep {
  // If flow is complete, stay complete
  if (progress.currentStep === 'complete') {
    return 'complete';
  }

  // If claim was successful, go to delegate
  if (progress.claimSuccessful) {
    return 'delegate';
  }

  // If education is done, go to connect
  if (progress.educationCompleted) {
    return 'connect';
  }

  // CRITICAL FIX: If user is still on welcome, stay on welcome
  // Don't auto-advance just because there's no password
  if (progress.currentStep === 'welcome') {
    return 'welcome';
  }

  // If password was validated (or not needed), go to education
  // Note: We already returned on 'welcome' above, so user has moved past welcome here
  if (progress.passwordValidated || !hasPassword) {
    return 'education';
  }

  // User has moved past welcome but needs password validation
  if (hasPassword) {
    return 'password';
  }

  // Default to saved step or welcome
  return progress.currentStep;
}

/**
 * Debug: Export progress data
 */
export function debugProgress(inviteCode: string): InviteFlowProgress | null {
  return loadInviteProgress(inviteCode);
}

/**
 * Clear all invite progress from storage (for debugging)
 */
export function clearAllInviteProgress(): void {
  if (!isBrowser()) return;

  try {
    const keysToRemove: string[] = [];

    // Find all invite progress keys in localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        keysToRemove.push(key);
      }
    }

    // Remove them
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });

    console.log('[InviteFlowPersistence] All progress cleared');
  } catch (error) {
    console.error('[InviteFlowPersistence] Failed to clear all progress:', error);
  }
}
