/**
 * 💰 My Wallet Panel - Personal Wallet & Token Information
 *
 * Shows user's wallet details:
 * - CGC token balance
 * - Total earnings from tasks
 * - Quick actions (view on explorer, add to wallet)
 *
 * Uses existing hooks for real blockchain data.
 *
 * @version 1.0.0
 * @updated December 2025
 */

'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAccount, useCGCBalance } from '@/lib/thirdweb';
import { useDashboardStats } from '@/lib/web3/hooks';
import { HolderGate } from '@/components/auth/RoleGate';
import {
  Wallet,
  Eye,
  EyeOff,
  ExternalLink,
  Copy,
  Check,
  TrendingUp,
  Gift,
  ArrowUpRight,
  Loader2,
  Coins,
  Plus,
} from 'lucide-react';

// ============================================================================
// TYPE DECLARATIONS
// ============================================================================

// Extend Window interface for Web3 wallet providers
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown }) => Promise<unknown>;
    };
  }
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CGC_TOKEN_ADDRESS = '0x5e3a61b550328f3D8C44f60b3e10a49D3d806175';
const BASESCAN_TOKEN_URL = `https://basescan.org/token/${CGC_TOKEN_ADDRESS}`;
const AERODROME_SWAP_URL = 'https://aerodrome.finance/swap?from=eth&to=' + CGC_TOKEN_ADDRESS;

// ============================================================================
// COMPONENT
// ============================================================================

export function MyWalletPanel() {
  const t = useTranslations('dashboard');
  const tWallet = useTranslations('wallet');
  const { address, isConnected } = useAccount();
  const { formatted: cgcBalance, isLoading: isBalanceLoading } = useCGCBalance();
  const { userBalance, userEarnings } = useDashboardStats();

  const [balanceVisible, setBalanceVisible] = useState(true);
  const [copied, setCopied] = useState(false);

  // Format numbers for display
  const formatNumber = (num: string | number) => {
    const n = typeof num === 'string' ? parseFloat(num) : num;
    if (n >= 1000000) return `${(n / 1000000).toFixed(2)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(2)}K`;
    return n.toFixed(2);
  };

  // Copy address to clipboard
  const copyAddress = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Add CGC token to MetaMask/wallet
  const addTokenToWallet = async () => {
    if (typeof window === 'undefined' || !window.ethereum) return;

    try {
      await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: CGC_TOKEN_ADDRESS,
            symbol: 'CGC',
            decimals: 18,
            image: 'https://raw.githubusercontent.com/CryptoGiftWallets/CGC-Token/main/cgc-logo.png',
          },
        },
      });
    } catch (error) {
      console.error('Error adding token to wallet:', error);
    }
  };

  // Not connected state
  if (!isConnected || !address) {
    return (
      <div className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 glass-bubble">
            <Wallet className="w-6 h-6 text-green-500" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-glass">
              {t('panels.wallet.title')}
            </h3>
            <p className="text-glass-secondary text-sm">
              {t('panels.wallet.description')}
            </p>
          </div>
        </div>

        <div className="text-center py-8 text-glass-secondary">
          <Wallet className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>{tWallet('connect')}</p>
        </div>
      </div>
    );
  }

  const displayBalance = cgcBalance || userBalance || '0';

  return (
    <div className="glass-panel p-6 spring-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 glass-bubble">
            <Wallet className="w-6 h-6 text-green-500" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-glass">
              {t('panels.wallet.title')}
            </h3>
            <p className="text-glass-secondary text-sm">
              {t('panels.wallet.yourWallet')}
            </p>
          </div>
        </div>

        {/* Balance visibility toggle */}
        <button
          onClick={() => setBalanceVisible(!balanceVisible)}
          className="p-2 glass-bubble hover:bg-white/20 transition-colors"
        >
          {balanceVisible ? (
            <Eye className="w-5 h-5 text-glass-secondary" />
          ) : (
            <EyeOff className="w-5 h-5 text-glass-secondary" />
          )}
        </button>
      </div>

      {/* Wallet Address */}
      <div className="glass-card p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-glass-secondary text-xs mb-1">
              {tWallet('address')}
            </p>
            <p className="text-glass font-mono text-sm">
              {address.slice(0, 10)}...{address.slice(-8)}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={copyAddress}
              className="p-2 glass-bubble hover:bg-white/20 transition-colors"
              title={tWallet('copy')}
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4 text-glass-secondary" />
              )}
            </button>
            <a
              href={`https://basescan.org/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 glass-bubble hover:bg-white/20 transition-colors"
              title={tWallet('viewOnExplorer')}
            >
              <ExternalLink className="w-4 h-4 text-glass-secondary" />
            </a>
          </div>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* CGC Balance */}
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Coins className="w-4 h-4 text-amber-500" />
            <span className="text-glass-secondary text-sm">
              {tWallet('cgcBalance')}
            </span>
          </div>
          {isBalanceLoading ? (
            <Loader2 className="w-6 h-6 animate-spin text-glass-secondary" />
          ) : (
            <p className="text-2xl font-bold text-glass">
              {balanceVisible ? formatNumber(displayBalance) : '••••••'}
            </p>
          )}
          <p className="text-xs text-glass-secondary">CGC</p>
        </div>

        {/* Total Earnings */}
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-glass-secondary text-sm">
              {t('panels.wallet.totalEarnings')}
            </span>
          </div>
          <p className="text-2xl font-bold text-green-500">
            {balanceVisible ? `+${formatNumber(userEarnings)}` : '••••••'}
          </p>
          <p className="text-xs text-glass-secondary">CGC</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        {/* Add Token to Wallet */}
        <button
          onClick={addTokenToWallet}
          className="glass-button w-full flex items-center justify-between group"
        >
          <span className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            {t('panels.wallet.addToWallet')}
          </span>
          <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
        </button>

        {/* View on BaseScan */}
        <a
          href={BASESCAN_TOKEN_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="glass-button w-full flex items-center justify-between group"
        >
          <span>{t('panels.wallet.viewOnBasescan')}</span>
          <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </a>

        {/* Swap on Aerodrome */}
        <a
          href={AERODROME_SWAP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="glass-button w-full flex items-center justify-between group"
        >
          <span>{t('panels.wallet.swapOnAerodrome')}</span>
          <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </a>
      </div>

      {/* Holder Benefits - Only show for token holders */}
      <HolderGate>
        <div className="mt-6 p-4 glass-card border border-green-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Gift className="w-4 h-4 text-green-500" />
            <span className="text-green-500 text-sm font-medium">
              {t('panels.wallet.holderBenefits')}
            </span>
          </div>
          <p className="text-glass-secondary text-xs">
            {t('panels.wallet.holderBenefitsDescription')}
          </p>
        </div>
      </HolderGate>
    </div>
  );
}

export default MyWalletPanel;
