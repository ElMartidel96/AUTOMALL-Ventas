/**
 * 🏛️ My Governance Panel - Personal Governance Status
 *
 * Shows user's governance capabilities based on on-chain data:
 * - Voting power (from CGC token)
 * - Delegation status
 * - Proposer eligibility (1000+ CGC voting power)
 * - Links to Aragon governance
 *
 * All data fetched programmatically from blockchain.
 *
 * @version 1.0.0
 * @updated December 2025
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAccount } from '@/lib/thirdweb';
import { usePermissions } from '@/components/auth/RoleGate';
import {
  Vote,
  Users,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Loader2,
  Crown,
  Shield,
  Info,
} from 'lucide-react';

// ============================================================================
// CONSTANTS
// ============================================================================

const ARAGON_DAO_URL = 'https://app.aragon.org/dao/base-mainnet/0x3244DFBf9E5374DF2f106E89Cf7972E5D4C9ac31';
const MIN_PROPOSER_POWER = 1000; // Minimum voting power to create proposals

// ============================================================================
// COMPONENT
// ============================================================================

export function MyGovernancePanel() {
  const t = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const { address, isConnected } = useAccount();
  const { permissions, isLoading, error } = usePermissions();

  // Format numbers for display
  const formatNumber = (num: string | number) => {
    const n = typeof num === 'string' ? parseFloat(num) : num;
    if (n >= 1000000) return `${(n / 1000000).toFixed(2)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(2)}K`;
    return n.toFixed(2);
  };

  // Calculate proposer progress percentage
  const getProposerProgress = () => {
    if (!permissions?.roleInfo) return 0;
    const votingPower = parseFloat(permissions.roleInfo.votingPowerFormatted);
    return Math.min((votingPower / MIN_PROPOSER_POWER) * 100, 100);
  };

  // Not connected state
  if (!isConnected || !address) {
    return (
      <div className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 glass-bubble">
            <Vote className="w-6 h-6 text-purple-500" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-glass">
              {t('panels.governance.title')}
            </h3>
            <p className="text-glass-secondary text-sm">
              {t('panels.governance.description')}
            </p>
          </div>
        </div>

        <div className="text-center py-8 text-glass-secondary">
          <Vote className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>{t('panels.governance.connectToView')}</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 glass-bubble">
            <Vote className="w-6 h-6 text-purple-500" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-glass">
              {t('panels.governance.title')}
            </h3>
          </div>
        </div>

        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        </div>
      </div>
    );
  }

  const roleInfo = permissions?.roleInfo;
  const votingPower = roleInfo?.votingPowerFormatted || '0';
  const balance = roleInfo?.balanceFormatted || '0';
  const canPropose = roleInfo?.canCreateProposals || false;
  const delegate = roleInfo?.delegate;
  const isVoter = roleInfo?.isVoter || false;
  const isHolder = roleInfo?.isHolder || false;

  return (
    <div className="glass-panel p-6 spring-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 glass-bubble">
            <Vote className="w-6 h-6 text-purple-500" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-glass">
              {t('panels.governance.title')}
            </h3>
            <p className="text-glass-secondary text-sm">
              {t('panels.governance.yourGovernanceStatus')}
            </p>
          </div>
        </div>

        {/* Role Badge */}
        <RoleBadge role={permissions?.role || 'visitor'} />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Voting Power */}
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="w-4 h-4 text-amber-500" />
            <span className="text-glass-secondary text-sm">
              {t('panels.governance.votingPower')}
            </span>
          </div>
          <p className="text-2xl font-bold text-glass">
            {formatNumber(votingPower)}
          </p>
          <p className="text-xs text-glass-secondary">CGC</p>
        </div>

        {/* Token Balance */}
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-blue-500" />
            <span className="text-glass-secondary text-sm">
              {t('panels.governance.tokenBalance')}
            </span>
          </div>
          <p className="text-2xl font-bold text-glass">
            {formatNumber(balance)}
          </p>
          <p className="text-xs text-glass-secondary">CGC</p>
        </div>
      </div>

      {/* Delegation Status */}
      <div className="glass-card p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-500" />
            <span className="text-glass-secondary text-sm">
              {t('panels.governance.delegation')}
            </span>
          </div>
          {delegate ? (
            <div className="flex items-center gap-2">
              <span className="text-glass text-sm font-mono">
                {delegate.slice(0, 6)}...{delegate.slice(-4)}
              </span>
              <span className="text-xs text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                {t('panels.governance.delegated')}
              </span>
            </div>
          ) : (
            <span className="text-xs text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
              {t('panels.governance.selfDelegated')}
            </span>
          )}
        </div>
      </div>

      {/* Proposer Status */}
      <div className="glass-card p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-glass-secondary text-sm">
              {t('panels.governance.proposerStatus')}
            </span>
          </div>
          {canPropose ? (
            <div className="flex items-center gap-1 text-green-500">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm">{t('panels.governance.canPropose')}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-amber-500">
              <XCircle className="w-4 h-4" />
              <span className="text-sm">{t('panels.governance.cannotPropose')}</span>
            </div>
          )}
        </div>

        {/* Progress bar to proposer threshold */}
        {!canPropose && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-glass-secondary mb-1">
              <span>{formatNumber(votingPower)} CGC</span>
              <span>{MIN_PROPOSER_POWER} CGC</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500"
                style={{ width: `${getProposerProgress()}%` }}
              />
            </div>
            <p className="text-xs text-glass-secondary mt-2 flex items-center gap-1">
              <Info className="w-3 h-3" />
              {t('panels.governance.needMoreVotingPower', {
                amount: (MIN_PROPOSER_POWER - parseFloat(votingPower)).toFixed(0)
              })}
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {/* View Proposals - Link to Aragon */}
        <a
          href={ARAGON_DAO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="glass-button w-full flex items-center justify-between group"
        >
          <span>{t('panels.governance.viewProposals')}</span>
          <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </a>

        {/* Delegate Voting Power - Opens Aragon DAO */}
        <a
          href={`${ARAGON_DAO_URL}/governance`}
          target="_blank"
          rel="noopener noreferrer"
          className="glass-button w-full flex items-center justify-between group"
        >
          <span>{t('panels.governance.delegateVoting')}</span>
          <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </a>

        {/* Create Proposal - Only if can propose */}
        {canPropose && (
          <a
            href={`${ARAGON_DAO_URL}/governance/new-proposal`}
            target="_blank"
            rel="noopener noreferrer"
            className="glass-button w-full flex items-center justify-between group pulse-glow"
          >
            <span>{t('panels.governance.createProposal')}</span>
            <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// ROLE BADGE COMPONENT
// ============================================================================

function RoleBadge({ role }: { role: string }) {
  const roleConfig = {
    visitor: { color: 'bg-gray-500/20 text-gray-400', label: 'Visitor' },
    holder: { color: 'bg-blue-500/20 text-blue-400', label: 'Holder' },
    voter: { color: 'bg-green-500/20 text-green-400', label: 'Voter' },
    proposer: { color: 'bg-purple-500/20 text-purple-400', label: 'Proposer' },
    admin: { color: 'bg-amber-500/20 text-amber-400', label: 'Admin' },
    superadmin: { color: 'bg-red-500/20 text-red-400', label: 'Super Admin' },
  };

  const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.visitor;

  return (
    <span className={`text-xs px-3 py-1 rounded-full font-medium ${config.color}`}>
      {config.label}
    </span>
  );
}

export default MyGovernancePanel;
