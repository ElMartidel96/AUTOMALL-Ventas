/**
 * SPECIAL INVITE PAGE
 *
 * Premium preclaim flow for special referral invites.
 * Uses the PreClaimFlow-style two-panel layout from cryptogift-wallets.
 *
 * Steps: Welcome -> Password (optional) -> Education (DAOMasterclass) -> Wallet Connection -> Success
 *
 * @route /special-invite/[code]
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SpecialInviteFlow } from '@/components/special-invite/SpecialInviteFlow';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { useTranslations } from 'next-intl';

import type { MasterclassType } from '@/lib/supabase/types';

interface InviteData {
  code: string;
  referrerCode?: string;
  customMessage?: string;
  hasPassword: boolean;
  createdAt?: string;
  expiresAt?: string;
  image?: string;
  masterclassType?: MasterclassType; // Which Sales Masterclass version to show
}

type PageState = 'loading' | 'ready' | 'error';

export default function SpecialInvitePage() {
  const params = useParams();
  const router = useRouter();
  const inviteCode = params.code as string;
  const t = useTranslations('invite');

  // State
  const [pageState, setPageState] = useState<PageState>('loading');
  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load invite data
  useEffect(() => {
    async function loadInvite() {
      if (!inviteCode) return;

      try {
        const response = await fetch(`/api/referrals/special-invite?code=${inviteCode}`);
        const data = await response.json();

        if (!data.success) {
          setError(data.error || 'Invalid invite link');
          setPageState('error');
          return;
        }

        setInviteData({
          code: data.invite.code,
          referrerCode: data.invite.referrerCode,
          customMessage: data.invite.customMessage,
          hasPassword: data.invite.hasPassword,
          createdAt: data.invite.createdAt,
          expiresAt: data.invite.expiresAt,
          image: data.invite.image || undefined,
          masterclassType: data.invite.masterclassType || 'v2', // Default to V2 if not set
        });
        setPageState('ready');
      } catch (err) {
        console.error('Error loading invite:', err);
        setError('Failed to load invite');
        setPageState('error');
      }
    }

    loadInvite();
  }, [inviteCode]);

  // Handle claim completion
  const handleClaimComplete = useCallback((walletAddress: string) => {
    console.log('Invite claimed by:', walletAddress);
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
  if (pageState === 'ready' && inviteData) {
    return (
      <SpecialInviteFlow
        inviteData={inviteData}
        onClaimComplete={handleClaimComplete}
      />
    );
  }

  // For loading/error states, show with header and footer
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
              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-600">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  CryptoGift DAO
                </h1>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {t('special.title')}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <ThemeToggle />
              <LanguageToggle />
              <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                <Star className="h-3 w-3 mr-1" />
                Premium Invite
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
