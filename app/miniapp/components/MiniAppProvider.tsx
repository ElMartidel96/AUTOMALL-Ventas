'use client';

/**
 * Mini App Context Provider
 *
 * Provides Farcaster context, auth state, and SDK functions
 * to all Mini App components.
 *
 * Made by mbxarts.com The Moon in a Box property
 * Co-Author: Godez22
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { MiniAppContext, MiniAppTab, VerifiedSession } from '@/lib/farcaster/types';
import {
  signalReady,
  getContext,
  isInFarcasterClient,
  shareAchievement,
  shareReferralLink,
} from '@/lib/farcaster/sdk';
import {
  requestAuth,
  getSession,
  clearSession,
  getVerifiedWallet,
} from '@/lib/farcaster/auth';

interface MiniAppState {
  // Context
  context: MiniAppContext;
  isLoading: boolean;
  error: string | null;

  // Auth
  session: VerifiedSession | null;
  isAuthenticated: boolean;
  verifiedWallet: string | null;

  // Navigation
  activeTab: MiniAppTab;
  setActiveTab: (tab: MiniAppTab) => void;

  // Actions
  authenticate: () => Promise<boolean>;
  logout: () => void;
  shareTaskCompletion: (taskName: string, rewardCGC: number) => Promise<boolean>;
  shareReferral: (code: string, url: string) => Promise<boolean>;
}

const MiniAppContext = createContext<MiniAppState | null>(null);

export function useMiniApp(): MiniAppState {
  const context = useContext(MiniAppContext);
  if (!context) {
    throw new Error('useMiniApp must be used within MiniAppProvider');
  }
  return context;
}

interface MiniAppProviderProps {
  children: ReactNode;
}

export function MiniAppProvider({ children }: MiniAppProviderProps) {
  const [context, setContext] = useState<MiniAppContext>({
    user: null,
    isReady: false,
    isInFarcasterClient: false,
    safeAreaInsets: { top: 0, bottom: 0, left: 0, right: 0 },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<VerifiedSession | null>(null);
  const [activeTab, setActiveTab] = useState<MiniAppTab>('dashboard');

  // Initialize SDK and context on mount
  useEffect(() => {
    async function initialize() {
      try {
        setIsLoading(true);
        setError(null);

        // Check if in Farcaster client
        const inFarcaster = isInFarcasterClient();

        if (inFarcaster) {
          // Get Farcaster context
          const ctx = await getContext();
          setContext(ctx);

          // Signal that app is ready (CRITICAL)
          await signalReady();
        }

        // Check for existing session
        const existingSession = getSession();
        if (existingSession) {
          setSession(existingSession);
        }
      } catch (err) {
        console.error('[MiniAppProvider] Initialization error:', err);
        setError('Failed to initialize Mini App');
      } finally {
        setIsLoading(false);
      }
    }

    initialize();
  }, []);

  // Authentication handler
  const authenticate = useCallback(async (): Promise<boolean> => {
    try {
      const result = await requestAuth();

      if (result.success) {
        const newSession = getSession();
        setSession(newSession);
        return true;
      }

      setError(result.message || 'Authentication failed');
      return false;
    } catch (err) {
      console.error('[MiniAppProvider] Auth error:', err);
      setError('Authentication error');
      return false;
    }
  }, []);

  // Logout handler
  const logout = useCallback(() => {
    clearSession();
    setSession(null);
  }, []);

  // Share task completion
  const shareTaskCompletion = useCallback(
    async (taskName: string, rewardCGC: number): Promise<boolean> => {
      const miniAppUrl = 'https://mbxarts.com/miniapp';
      return shareAchievement(taskName, rewardCGC, miniAppUrl);
    },
    []
  );

  // Share referral
  const shareReferral = useCallback(
    async (code: string, url: string): Promise<boolean> => {
      return shareReferralLink(code, url);
    },
    []
  );

  const value: MiniAppState = {
    context,
    isLoading,
    error,
    session,
    isAuthenticated: session !== null,
    verifiedWallet: session ? getVerifiedWallet() : null,
    activeTab,
    setActiveTab,
    authenticate,
    logout,
    shareTaskCompletion,
    shareReferral,
  };

  return (
    <MiniAppContext.Provider value={value}>
      {children}
    </MiniAppContext.Provider>
  );
}

export default MiniAppProvider;
