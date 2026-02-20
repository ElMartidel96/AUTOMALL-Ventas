/**
 * 🗳️ VotingPowerCard Component
 *
 * Displays voting power status and allows users to activate their voting
 * power by delegating to themselves. This is required for ERC20Votes tokens
 * like CGC where balance != voting power until delegation.
 *
 * Made by mbxarts.com The Moon in a Box property
 * Co-Author: Godez22
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { formatUnits } from 'viem';
import {
  Vote,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Zap,
  ExternalLink,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useVotingPower } from '@/hooks/useVotingPower';

interface VotingPowerCardProps {
  /** Wallet address to display voting power for */
  wallet: string;
  /** Callback when voting power is activated */
  onActivated?: () => void;
}

/**
 * Card component that shows voting power status and activation button
 */
export function VotingPowerCard({ wallet, onActivated }: VotingPowerCardProps) {
  const t = useTranslations('profile');
  const [showDetails, setShowDetails] = useState(false);

  const {
    status,
    isLoading,
    error,
    activateVotingPower,
    isPending,
    isSuccess,
    txHash,
  } = useVotingPower();

  // Notify parent when activation is successful
  useEffect(() => {
    if (isSuccess && onActivated) {
      onActivated();
    }
  }, [isSuccess, onActivated]);

  // Format balance/votes for display
  const formatCGC = (value: bigint | undefined): string => {
    if (!value) return '0';
    return parseFloat(formatUnits(value, 18)).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-600" />
          <div className="flex-1">
            <div className="h-4 bg-slate-200 dark:bg-slate-600 rounded w-32 mb-2" />
            <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded w-48" />
          </div>
        </div>
      </div>
    );
  }

  // No tokens - don't show the card
  if (!status || status.balance === 0n) {
    return null;
  }

  // Already activated - show success state
  if (status.isActivated && !status.needsActivation) {
    return (
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-green-800 dark:text-green-300 flex items-center gap-2">
              <Vote className="w-4 h-4" />
              {t('votingPower.activated')}
            </h4>
            <p className="text-sm text-green-700 dark:text-green-400 mt-1">
              {t('votingPower.activatedDesc')}
            </p>

            {/* Collapsible Details */}
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-1 text-xs text-green-600 dark:text-green-500 mt-2 hover:underline"
            >
              {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {t('votingPower.showDetails')}
            </button>

            {showDetails && (
              <div className="mt-3 p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-green-700 dark:text-green-400">{t('votingPower.balance')}:</span>
                  <span className="font-mono font-medium text-green-800 dark:text-green-300">
                    {formatCGC(status.balance)} CGC
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700 dark:text-green-400">{t('votingPower.power')}:</span>
                  <span className="font-mono font-medium text-green-800 dark:text-green-300">
                    {formatCGC(status.votingPower)} CGC
                  </span>
                </div>
                {status.delegatee && (
                  <div className="flex justify-between items-center">
                    <span className="text-green-700 dark:text-green-400">{t('votingPower.delegatedTo')}:</span>
                    <span className="font-mono text-xs text-green-600 dark:text-green-500">
                      {status.delegatee === wallet.toLowerCase()
                        ? t('votingPower.self')
                        : `${status.delegatee.slice(0, 6)}...${status.delegatee.slice(-4)}`}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Needs activation - show warning and button
  return (
    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-xl p-4 border-2 border-amber-300 dark:border-amber-700">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0 animate-pulse">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-2">
            <Vote className="w-4 h-4" />
            {t('votingPower.notActivated')}
          </h4>
          <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
            {t('votingPower.notActivatedDesc')}
          </p>

          {/* Balance info */}
          <div className="mt-3 p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-amber-700 dark:text-amber-400">{t('votingPower.yourBalance')}:</span>
              <span className="font-mono font-bold text-amber-800 dark:text-amber-300">
                {formatCGC(status.balance)} CGC
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-amber-700 dark:text-amber-400">{t('votingPower.currentPower')}:</span>
              <span className="font-mono font-bold text-red-600 dark:text-red-400">
                0 CGC
              </span>
            </div>
          </div>

          {/* Info tooltip */}
          <div className="mt-3 flex items-start gap-2 text-xs text-amber-600 dark:text-amber-500">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{t('votingPower.explanation')}</span>
          </div>

          {/* Error display */}
          {error && (
            <div className="mt-3 p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-sm text-red-700 dark:text-red-400">
              {error.message}
            </div>
          )}

          {/* Success message */}
          {isSuccess && txHash && (
            <div className="mt-3 p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-sm text-green-700 dark:text-green-400 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                {t('votingPower.success')}
              </span>
              <a
                href={`https://basescan.org/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:underline"
              >
                View TX <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {/* Activation button */}
          <button
            onClick={activateVotingPower}
            disabled={isPending || isSuccess}
            className={`mt-4 w-full py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              isPending
                ? 'bg-amber-400 text-white cursor-wait'
                : isSuccess
                ? 'bg-green-500 text-white cursor-default'
                : 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
            }`}
          >
            {isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {t('votingPower.activating')}
              </>
            ) : isSuccess ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                {t('votingPower.activated')}
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                {t('votingPower.activateButton')}
              </>
            )}
          </button>

          <p className="mt-2 text-xs text-center text-amber-600 dark:text-amber-500">
            {t('votingPower.gasNote')}
          </p>
        </div>
      </div>
    </div>
  );
}

export default VotingPowerCard;
