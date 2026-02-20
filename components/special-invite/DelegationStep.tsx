/**
 * 🗳️ DelegationStep Component
 *
 * Step in the special invite flow that prompts users to activate
 * their voting power immediately after receiving their CGC tokens.
 *
 * This ensures new users automatically have governance participation
 * enabled without needing to visit a separate page.
 *
 * Made by mbxarts.com The Moon in a Box property
 * Co-Author: Godez22
 */

'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
  Vote,
  Loader2,
  CheckCircle2,
  ExternalLink,
  Zap,
  AlertCircle,
  ChevronRight,
  Shield,
} from 'lucide-react';
import { useVotingPower } from '@/hooks/useVotingPower';

interface DelegationStepProps {
  /** Called when delegation is complete or skipped */
  onComplete: () => void;
  /** Whether to allow skipping */
  allowSkip?: boolean;
}

/**
 * Component that handles the voting power activation step
 */
export function DelegationStep({ onComplete, allowSkip = true }: DelegationStepProps) {
  const t = useTranslations('specialInvite');
  const [hasAttempted, setHasAttempted] = useState(false);

  const {
    status,
    isLoading,
    error,
    activateVotingPower,
    isPending,
    isSuccess,
    txHash,
    refetch,
  } = useVotingPower();

  // Auto-advance when delegation is successful
  useEffect(() => {
    if (isSuccess) {
      // Wait a moment to show success state, then advance
      const timeout = setTimeout(() => {
        onComplete();
      }, 2500);
      return () => clearTimeout(timeout);
    }
  }, [isSuccess, onComplete]);

  // Check if already delegated on mount
  useEffect(() => {
    if (status?.isActivated && !hasAttempted) {
      // Already has voting power, skip this step
      onComplete();
    }
  }, [status?.isActivated, hasAttempted, onComplete]);

  const handleActivate = () => {
    setHasAttempted(true);
    activateVotingPower();
  };

  const handleSkip = () => {
    onComplete();
  };

  // Loading state
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center min-h-[300px]"
      >
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-4">
          <Vote className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {t('delegation.title')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {t('delegation.subtitle')}
        </p>
      </div>

      {/* Benefits Card */}
      <div className="bg-gradient-to-r from-purple-50 to-cyan-50 dark:from-purple-900/20 dark:to-cyan-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-700">
        <h3 className="font-semibold text-purple-800 dark:text-purple-300 mb-3 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          {t('delegation.benefitsTitle')}
        </h3>
        <ul className="space-y-2 text-sm text-purple-700 dark:text-purple-400">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-500" />
            {t('delegation.benefit1')}
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-500" />
            {t('delegation.benefit2')}
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-500" />
            {t('delegation.benefit3')}
          </li>
        </ul>
      </div>

      {/* Error display */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-700">
          <div className="flex items-start gap-2 text-red-700 dark:text-red-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">{t('delegation.error')}</p>
              <p className="text-sm mt-1">{error.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Success display */}
      {isSuccess && txHash && (
        <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-xl border border-green-200 dark:border-green-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <CheckCircle2 className="w-6 h-6" />
              <span className="font-semibold">{t('delegation.success')}</span>
            </div>
            <a
              href={`https://basescan.org/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-green-600 dark:text-green-500 hover:underline text-sm"
            >
              BaseScan <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <p className="mt-2 text-sm text-green-600 dark:text-green-500">
            {t('delegation.successDesc')}
          </p>
        </div>
      )}

      {/* Action buttons */}
      {!isSuccess && (
        <div className="space-y-3">
          {/* Main activation button */}
          <button
            onClick={handleActivate}
            disabled={isPending}
            className={`w-full py-4 px-6 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
              isPending
                ? 'bg-purple-400 text-white cursor-wait'
                : 'bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
            }`}
          >
            {isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {t('delegation.activating')}
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                {t('delegation.activateButton')}
              </>
            )}
          </button>

          {/* Skip button */}
          {allowSkip && (
            <button
              onClick={handleSkip}
              className="w-full py-2 px-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors text-sm flex items-center justify-center gap-1"
            >
              {t('delegation.skipButton')} <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {/* Gasless/Free signing notice */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-3 text-center">
            <p className="text-sm font-medium text-green-700 dark:text-green-400">
              {t('delegation.gasNote')}
            </p>
            <p className="text-xs text-green-600 dark:text-green-500 mt-1">
              {t('delegation.signatureNote')}
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default DelegationStep;
