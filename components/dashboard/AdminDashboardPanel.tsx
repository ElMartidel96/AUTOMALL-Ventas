/**
 * ⚙️ Admin Dashboard Panel - Admin-Only Controls
 *
 * Restricted to actual DAO admins (Gnosis Safe signers).
 * Uses programmatic verification from on-chain data.
 *
 * Features:
 * - Task validation
 * - System status monitoring
 * - Safe multisig access
 * - Treasury overview
 *
 * @version 1.0.0
 * @updated December 2025
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useAccount } from '@/lib/thirdweb';
import { useDashboardStats } from '@/lib/web3/hooks';
import { AdminGate, SuperAdminGate, usePermissions } from '@/components/auth/RoleGate';
import {
  Settings,
  Shield,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Loader2,
  AlertTriangle,
  Lock,
  Activity,
  Database,
  Wallet,
  Crown,
} from 'lucide-react';

// ============================================================================
// CONSTANTS
// ============================================================================

const SAFE_OWNER_URL = 'https://app.safe.global/base:0x11323672b5f9bB899Fa332D5d464CC4e66637b42';
const SAFE_GUARDIAN_URL = 'https://app.safe.global/base:0xe9411DD1f2AF42186b2bCE828B6e7d0dd0D7a6bc';
const DAO_ARAGON_URL = 'https://app.aragon.org/dao/base-mainnet/0x3244DFBf9E5374DF2f106E89Cf7972E5D4C9ac31';
const BASESCAN_DAO_URL = 'https://basescan.org/address/0x3244DFBf9E5374DF2f106E89Cf7972E5D4C9ac31';

// ============================================================================
// ADMIN DASHBOARD PANEL - Wrapped with AdminGate
// ============================================================================

export function AdminDashboardPanel() {
  // Only render for admins - returns null for non-admins (no fallback message)
  return (
    <AdminGate>
      <AdminDashboardContent />
    </AdminGate>
  );
}

// ============================================================================
// ADMIN DASHBOARD CONTENT
// ============================================================================

function AdminDashboardContent() {
  const t = useTranslations('dashboard');
  useAccount(); // Hook required for wallet connection state
  const { permissions } = usePermissions();
  const {
    systemLimits,
    systemUsage,
    treasuryBalance,
    escrowBalance,
  } = useDashboardStats();

  const [pendingValidations, setPendingValidations] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch pending validations count
  useEffect(() => {
    async function fetchPendingValidations() {
      try {
        const response = await fetch('/api/dashboard/stats');
        const data = await response.json();
        if (data.success) {
          setPendingValidations(data.data.tasksSubmitted || 0);
        }
      } catch (error) {
        console.error('Error fetching pending validations:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPendingValidations();
  }, []);

  const safeRoles = permissions?.roleInfo.safeRoles;
  const isOwnerSigner = safeRoles?.isOwnerSigner || false;
  const isGuardianSigner = safeRoles?.isGuardianSigner || false;

  // Format numbers for display
  const formatNumber = (num: string | number) => {
    const n = typeof num === 'string' ? parseFloat(num) : num;
    if (n >= 1000000) return `${(n / 1000000).toFixed(2)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(2)}K`;
    return n.toFixed(2);
  };

  return (
    <div className="glass-panel p-6 spring-in border border-amber-500/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 glass-bubble bg-amber-500/20">
            <Settings className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-glass">
              {t('panels.admin.title')}
            </h3>
            <p className="text-glass-secondary text-sm">
              {t('panels.admin.adminControls')}
            </p>
          </div>
        </div>

        {/* Admin Badge */}
        <div className="flex items-center gap-2">
          {isOwnerSigner && (
            <span className="text-xs px-3 py-1 rounded-full bg-red-500/20 text-red-400 font-medium flex items-center gap-1">
              <Crown className="w-3 h-3" />
              Owner Safe
            </span>
          )}
          {isGuardianSigner && !isOwnerSigner && (
            <span className="text-xs px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 font-medium flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Guardian Safe
            </span>
          )}
        </div>
      </div>

      {/* System Status - Production mode */}
      <div className="glass-card p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-green-400 pulse-glow" />
            <span className="text-glass text-sm">
              {t('panels.admin.systemStatus')}
            </span>
          </div>
          <span className="text-sm text-green-500">
            {t('panels.admin.active')}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <p className="text-glass-secondary text-xs">{t('panels.admin.dailyUsage')}</p>
            <p className="text-glass font-medium">
              {formatNumber(systemUsage.daily)} / {formatNumber(systemLimits.daily)} CGC
            </p>
          </div>
          <div>
            <p className="text-glass-secondary text-xs">{t('panels.admin.monthlyUsage')}</p>
            <p className="text-glass font-medium">
              {formatNumber(systemUsage.monthly)} / {formatNumber(systemLimits.monthly)} CGC
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* Pending Validations */}
        <div className="glass-card p-4 text-center">
          <CheckCircle2 className="w-5 h-5 text-purple-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-glass">
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : pendingValidations}
          </p>
          <p className="text-xs text-glass-secondary">{t('panels.admin.pendingValidations')}</p>
        </div>

        {/* Treasury */}
        <div className="glass-card p-4 text-center">
          <Wallet className="w-5 h-5 text-amber-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-glass">{formatNumber(treasuryBalance)}</p>
          <p className="text-xs text-glass-secondary">{t('panels.admin.treasury')}</p>
        </div>

        {/* Escrow */}
        <div className="glass-card p-4 text-center">
          <Lock className="w-5 h-5 text-red-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-glass">{formatNumber(escrowBalance)}</p>
          <p className="text-xs text-glass-secondary">{t('panels.admin.escrow')}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {/* Validate Tasks - Primary Admin Action */}
        {pendingValidations > 0 && (
          <Link
            href="/admin/validate"
            className="glass-button w-full flex items-center justify-between group pulse-glow"
          >
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {t('panels.admin.validateTasks')}
              <span className="bg-purple-500/20 text-purple-500 text-xs px-2 py-0.5 rounded-full">
                {pendingValidations}
              </span>
            </span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        )}

        {/* Open Owner Safe - Only for Owner signers */}
        {isOwnerSigner && (
          <a
            href={SAFE_OWNER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="glass-button w-full flex items-center justify-between group"
          >
            <span className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-red-400" />
              {t('panels.admin.ownerSafe')} (3/5)
            </span>
            <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
        )}

        {/* Open Guardian Safe - For all admins */}
        <a
          href={SAFE_GUARDIAN_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="glass-button w-full flex items-center justify-between group"
        >
          <span className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-400" />
            {t('panels.admin.guardianSafe')} (2/3)
          </span>
          <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </a>

        {/* Aragon DAO */}
        <a
          href={DAO_ARAGON_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="glass-button w-full flex items-center justify-between group"
        >
          <span className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            {t('panels.admin.aragonDao')}
          </span>
          <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </a>

        {/* BaseScan */}
        <a
          href={BASESCAN_DAO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="glass-button w-full flex items-center justify-between group opacity-75"
        >
          <span className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            {t('panels.admin.viewOnBasescan')}
          </span>
          <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </a>
      </div>

      {/* Super Admin Section - Only for Owner Safe signers */}
      <SuperAdminGate>
        <div className="mt-6 p-4 glass-card border border-red-500/20">
          <div className="flex items-center gap-2 mb-3">
            <Crown className="w-4 h-4 text-red-500" />
            <span className="text-red-400 text-sm font-medium">
              {t('panels.admin.superAdminControls')}
            </span>
          </div>

          <div className="space-y-2">
            {/* Treasury management via Gnosis Safe Owner */}
            <a
              href={SAFE_OWNER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-button w-full flex items-center justify-between group text-sm"
            >
              <span>{t('panels.admin.manageTreasury')}</span>
              <ExternalLink className="w-4 h-4" />
            </a>

            {/* System settings via DAO Aragon */}
            <a
              href={DAO_ARAGON_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-button w-full flex items-center justify-between group text-sm"
            >
              <span>{t('panels.admin.systemSettings')}</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </SuperAdminGate>

      {/* Admin Info Footer */}
      <div className="mt-6 p-3 glass-card bg-amber-500/5 border border-amber-500/10">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5" />
          <p className="text-xs text-glass-secondary">
            {t('panels.admin.adminNote')}
          </p>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboardPanel;
