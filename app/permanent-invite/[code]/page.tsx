/**
 * 🔗 PERMANENT INVITE PAGE
 *
 * Landing page for permanent multi-use referral invites.
 * Uses the same flow as SpecialInviteFlow but with permanent invite logic.
 *
 * Key Differences from Special Invites:
 * - Never expires (unless manually disabled)
 * - Supports unlimited users (or custom max_claims)
 * - Tracks ALL users who claim (not just first one)
 * - Integrates with signup bonus system
 *
 * @route /permanent-invite/[code]
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  GraduationCap,
  Loader2,
  AlertCircle,
  Star,
  Infinity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SpecialInviteFlow } from '@/components/special-invite/SpecialInviteFlow';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { useTranslations } from 'next-intl';

import type { MasterclassType } from '@/lib/supabase/types';

interface PermanentInviteData {
  code: string;
  referrerCode?: string;
  customMessage?: string;
  customTitle?: string;
  hasPassword: boolean;
  createdAt?: string;
  expiresAt?: string | null;
  neverExpires?: boolean;
  image?: string;
  maxClaims?: number | null;
  totalClaims?: number;
  totalCompleted?: number;
  conversionRate?: number;
  status?: string;
  alreadyClaimed?: boolean;
  masterclassType?: MasterclassType; // Which Sales Masterclass version to show
}

type PageState = 'loading' | 'ready' | 'error' | 'already_claimed' | 'max_reached';

export default function PermanentInvitePage() {
  const params = useParams();
  const router = useRouter();
  const inviteCode = params.code as string;
  const t = useTranslations('invite');

  // State
  const [pageState, setPageState] = useState<PageState>('loading');
  const [inviteData, setInviteData] = useState<PermanentInviteData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load permanent invite data
  useEffect(() => {
    async function loadPermanentInvite() {
      if (!inviteCode) return;

      try {
        const response = await fetch(`/api/referrals/permanent-invite?code=${inviteCode}`);
        const data = await response.json();

        if (!data.success) {
          setError(data.error || 'Invalid permanent invite link');

          // Check specific error states
          if (data.maxReached) {
            setPageState('max_reached');
          } else {
            setPageState('error');
          }
          return;
        }

        const invite = data.invite;
        setInviteData({
          code: invite.code,
          referrerCode: invite.referrerCode,
          customMessage: invite.customMessage,
          customTitle: invite.customTitle,
          hasPassword: invite.hasPassword,
          createdAt: invite.createdAt,
          expiresAt: invite.expiresAt,
          neverExpires: invite.neverExpires,
          image: invite.image || undefined,
          maxClaims: invite.maxClaims,
          totalClaims: invite.totalClaims,
          totalCompleted: invite.totalCompleted,
          conversionRate: invite.conversionRate,
          status: invite.status,
          alreadyClaimed: data.alreadyClaimed,
          masterclassType: invite.masterclassType || 'v2', // Default to V2 if not set
        });

        // Check if already claimed
        if (data.alreadyClaimed) {
          setPageState('already_claimed');
        } else {
          setPageState('ready');
        }
      } catch (err) {
        console.error('Error loading permanent invite:', err);
        setError('Failed to load permanent invite');
        setPageState('error');
      }
    }

    loadPermanentInvite();
  }, [inviteCode]);

  // Handle claim completion
  const handleClaimComplete = useCallback((walletAddress: string) => {
    console.log('Permanent invite claimed by:', walletAddress);
    // The SpecialInviteFlow handles the success screen
  }, []);

  // Render based on page state
  const renderContent = () => {
    switch (pageState) {
      case 'loading':
        return (
          <Card className="max-w-3xl mx-auto bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-xl">
            <CardContent className="p-8">
              <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="h-12 w-12 text-purple-500 animate-spin mb-4" />
                <p className="text-gray-600 dark:text-gray-400">{t('loading')}</p>
              </div>
            </CardContent>
          </Card>
        );

      case 'already_claimed':
        return (
          <Card className="max-w-3xl mx-auto bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-xl">
            <CardContent className="p-8">
              <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                <div className="p-4 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
                  <Star className="h-12 w-12 text-blue-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {t('alreadyClaimed.title')}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-2 max-w-md">
                  {t('alreadyClaimed.desc')}
                </p>
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mb-6">
                  <p className="text-sm text-purple-700 dark:text-purple-300 flex items-center gap-2">
                    <Infinity className="h-4 w-4" />
                    {t('alreadyClaimed.shareTip')}
                  </p>
                </div>
                <Button onClick={() => router.push('/dashboard')}>
                  {t('alreadyClaimed.goToDashboard')}
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'max_reached':
        return (
          <Card className="max-w-3xl mx-auto bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-xl">
            <CardContent className="p-8">
              <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                <div className="p-4 rounded-full bg-orange-100 dark:bg-orange-900/30 mb-4">
                  <AlertCircle className="h-12 w-12 text-orange-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {t('maxReached.title')}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
                  {t('maxReached.desc', { max: inviteData?.maxClaims ?? 0 })}
                </p>
                <Button onClick={() => router.push('/')}>
                  {t('maxReached.goHome')}
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'error':
        return (
          <Card className="max-w-3xl mx-auto bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-xl">
            <CardContent className="p-8">
              <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                <div className="p-4 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                  <AlertCircle className="h-12 w-12 text-red-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {t('invalid.title')}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
                  {error || t('invalid.desc')}
                </p>
                <Button onClick={() => router.push('/')}>
                  {t('invalid.goHome')}
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  // When showing SpecialInviteFlow in 'ready' state, render without header/footer wrapper
  // We reuse SpecialInviteFlow component as it has the same flow
  if (pageState === 'ready' && inviteData) {
    return (
      <SpecialInviteFlow
        inviteData={{
          code: inviteData.code,
          referrerCode: inviteData.referrerCode,
          customMessage: inviteData.customMessage,
          hasPassword: inviteData.hasPassword,
          createdAt: inviteData.createdAt,
          expiresAt: inviteData.expiresAt || undefined,
          image: inviteData.image,
          masterclassType: inviteData.masterclassType, // Which Sales Masterclass version to show
        }}
        onClaimComplete={handleClaimComplete}
        isPermanent={true} // Flag to use permanent invite API instead
      />
    );
  }

  // For loading/error/already_claimed states, show with header and footer
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-cyan-50 dark:from-slate-900 dark:via-purple-950 dark:to-cyan-950 flex flex-col">
      {/* Background effects */}
      <div className="fixed inset-0 opacity-30 dark:opacity-20 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-400 dark:bg-purple-600 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl animate-pulse" />
        <div className="absolute top-40 right-20 w-72 h-72 bg-cyan-400 dark:bg-cyan-600 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl animate-pulse" />
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-400 dark:bg-pink-600 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl animate-pulse" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-gray-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-600 overflow-hidden">
                <img src="/apeX.png" alt="CryptoGift DAO" className="h-6 w-6 object-contain" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  CryptoGift DAO
                </h1>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Invitacion Permanente
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <ThemeToggle />
              <LanguageToggle />
              <Badge variant="secondary" className="bg-gradient-to-r from-purple-100 to-cyan-100 dark:from-purple-900/30 dark:to-cyan-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800">
                <Infinity className="h-3 w-3 mr-1" />
                Permanent Link
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 container mx-auto px-4 py-8 flex-1 flex items-center justify-center">
        {renderContent()}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm py-4">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Made by mbxarts.com The Moon in a Box property</p>
        </div>
      </footer>
    </div>
  );
}
