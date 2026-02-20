'use client';

/**
 * MyWalletsPanel - NFT Wallets section for Profile page
 *
 * Displays user's NFT wallets from cryptogift-wallets platform.
 * Shows wallet cards with thumbnails, balances, and links to manage.
 *
 * Made by mbxarts.com The Moon in a Box property
 *
 * Co-Author: Godez22
 */

import { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useUserWallets } from '@/hooks/useUserWallets';
import type { UserNFTWallet } from '@/lib/integrations/wallets-service';
import {
  Wallet,
  ExternalLink,
  ChevronRight,
  Loader2,
  AlertCircle,
  Gift,
  TrendingUp,
  ArrowUpRight,
} from 'lucide-react';

// Wallets service URL
const WALLETS_APP_URL = process.env.NEXT_PUBLIC_WALLETS_APP_URL || 'https://gifts.mbxarts.com';

interface MyWalletsPanelProps {
  walletAddress: string;
}

export function MyWalletsPanel({ walletAddress }: MyWalletsPanelProps) {
  const t = useTranslations('profile');
  const { wallets, walletsFound, isLoading, isError, hasWallets, refetch } = useUserWallets(walletAddress);
  const [hoveredWallet, setHoveredWallet] = useState<string | null>(null);

  // Don't render anything if user has no wallets and not loading
  if (!isLoading && !hasWallets && !isError) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="glass-crystal rounded-xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-slate-900 dark:text-white">My NFT Wallets</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading your wallets...</p>
          </div>
        </div>
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="glass-crystal rounded-xl p-6 mb-6 border border-red-500/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-red-500/20">
            <AlertCircle className="w-5 h-5 text-red-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-slate-900 dark:text-white">My NFT Wallets</h3>
            <p className="text-sm text-red-500">Failed to load wallets</p>
          </div>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Calculate total balance
  const totalBalance = wallets.reduce((acc, wallet) => {
    const balance = parseFloat(wallet.balance?.total || '0');
    return acc + (isNaN(balance) ? 0 : balance);
  }, 0);

  return (
    <div className="glass-crystal rounded-xl p-6 mb-6 hover:scale-[1.005] transition-all duration-300">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/25">
          <Gift className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold">
            <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
              My NFT Wallets
            </span>
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {walletsFound} gift wallet{walletsFound !== 1 ? 's' : ''} on CryptoGift
          </p>
        </div>
        {totalBalance > 0 && (
          <div className="text-right">
            <p className="text-xs text-slate-500 dark:text-slate-400">Total Value</p>
            <p className="text-lg font-bold bg-gradient-to-r from-emerald-500 to-green-500 bg-clip-text text-transparent">
              ${totalBalance.toFixed(2)}
            </p>
          </div>
        )}
      </div>

      {/* Wallet Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        {wallets.slice(0, 6).map((wallet) => (
          <WalletCard
            key={wallet.id}
            wallet={wallet}
            isHovered={hoveredWallet === wallet.id}
            onMouseEnter={() => setHoveredWallet(wallet.id)}
            onMouseLeave={() => setHoveredWallet(null)}
          />
        ))}
      </div>

      {/* View All / Manage Button */}
      <a
        href={`${WALLETS_APP_URL}/my-wallets`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl font-medium
          bg-gradient-to-r from-purple-500/10 to-pink-500/10
          hover:from-purple-500/20 hover:to-pink-500/20
          text-purple-600 dark:text-purple-400
          border border-purple-500/20 hover:border-purple-500/40
          transition-all hover:scale-[1.02] group"
      >
        <span>
          {walletsFound > 6 ? `View all ${walletsFound} wallets` : 'Manage my wallets'}
        </span>
        <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
      </a>
    </div>
  );
}

// Individual Wallet Card
function WalletCard({
  wallet,
  isHovered,
  onMouseEnter,
  onMouseLeave,
}: {
  wallet: UserNFTWallet;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const balance = parseFloat(wallet.balance?.total || '0');
  const hasBalance = !isNaN(balance) && balance > 0;

  return (
    <a
      href={`${WALLETS_APP_URL}/wallet/${wallet.tbaAddress || wallet.address}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`
        block p-4 rounded-xl glass-crystal
        border border-transparent
        transition-all duration-200 cursor-pointer
        ${isHovered ? 'scale-[1.03] shadow-lg border-purple-500/30' : 'hover:scale-[1.02]'}
      `}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="flex items-center gap-3">
        {/* Wallet Image */}
        <div className="relative flex-shrink-0">
          {wallet.image ? (
            <div className="w-14 h-14 rounded-xl overflow-hidden shadow-md">
              <Image
                src={wallet.image}
                alt={wallet.name || 'NFT Wallet'}
                width={56}
                height={56}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-md">
              <Wallet className="w-7 h-7 text-white" />
            </div>
          )}
          {wallet.isActive && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-slate-800" />
          )}
        </div>

        {/* Wallet Info */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-slate-900 dark:text-white truncate">
            {wallet.name || `Wallet #${wallet.tokenId}`}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">
            {wallet.tbaAddress
              ? `${wallet.tbaAddress.slice(0, 6)}...${wallet.tbaAddress.slice(-4)}`
              : `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`}
          </p>
          {hasBalance && (
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3 text-emerald-500" />
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                ${balance.toFixed(2)}
              </span>
            </div>
          )}
        </div>

        {/* Arrow */}
        <ChevronRight
          className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform ${
            isHovered ? 'translate-x-0.5' : ''
          }`}
        />
      </div>
    </a>
  );
}

export default MyWalletsPanel;
