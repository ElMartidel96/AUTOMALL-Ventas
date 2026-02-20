'use client';

/**
 * Autos MALL - Navigation Bar
 *
 * Branded navbar with social-login authentication.
 * Web3-specific UI hidden via feature flags.
 * i18n pattern: useTranslations('navigation')
 */

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useAccount, useNetwork } from '@/lib/thirdweb';
import { useDisconnect, useActiveWallet } from 'thirdweb/react';
import { ConnectButtonDAO } from '@/components/thirdweb/ConnectButtonDAO';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import {
  ChevronDown,
  Copy,
  Check,
  LogOut,
  User,
  LayoutDashboard,
  Users,
} from 'lucide-react';
import { FEATURE_WEB3_VISIBLE, FEATURE_CGC_TOKEN } from '@/lib/config/features';

export const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { address, isConnected } = useAccount();

  const t = useTranslations('navigation');

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <nav className="bg-white/80 dark:bg-am-dark/80 backdrop-blur-md shadow-lg fixed top-0 left-0 right-0 z-[10000] transition-colors duration-300 border-b border-gray-200/50 dark:border-am-blue/30">
      <div className="container mx-auto px-2">
        <div className="flex justify-between items-center py-3">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-2">
            <Link href="/" className="flex items-center">
              <Image
                src="/logo-automall-nav.png"
                alt="Autos MALL"
                width={120}
                height={66}
                className="h-11 w-auto drop-shadow-md"
                priority
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            <Link
              href="/dashboard"
              className="text-gray-600 dark:text-gray-300 hover:text-am-orange dark:hover:text-am-orange-light transition-colors text-sm font-bold px-2"
            >
              {t('dashboard')}
            </Link>

            <Link
              href="/referrals"
              className="text-gray-600 dark:text-gray-300 hover:text-am-orange dark:hover:text-am-orange-light transition-colors text-sm font-bold flex items-center gap-1 px-2"
            >
              {t('referrals')}
              <Users className="w-3 h-3" />
            </Link>

            {/* /docs route reserved for future lab collaboration - not part of dealer UI */}

            {/* Separator */}
            <div className="w-px h-6 bg-gradient-to-b from-transparent via-gray-300 dark:via-am-blue-light/30 to-transparent opacity-40 mx-2"></div>

            {/* Language Toggle */}
            <LanguageToggle />

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Auth Section */}
            {mounted && (
              isConnected && address ? (
                <UserDropdown />
              ) : (
                <ConnectButtonDAO />
              )
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-3">
            {mounted && isConnected && address && (
              <MobileUserBadge address={address} />
            )}

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white focus:outline-none transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-am-blue/30 py-4 bg-white dark:bg-am-dark relative z-[10001] max-h-[calc(100vh-73px)] overflow-y-auto">
            <div className="space-y-4">
              <Link
                href="/dashboard"
                className="block text-gray-600 dark:text-gray-300 hover:text-am-orange dark:hover:text-am-orange-light transition-colors px-4 py-3 font-bold text-base flex items-center gap-2"
                onClick={() => setIsMenuOpen(false)}
              >
                <LayoutDashboard className="w-4 h-4" />
                {t('dashboard')}
              </Link>

              <div className="mx-4 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-am-blue/30 to-transparent opacity-30"></div>

              <Link
                href="/referrals"
                className="block text-gray-600 dark:text-gray-300 hover:text-am-orange dark:hover:text-am-orange-light transition-colors px-4 py-3 font-bold text-base flex items-center gap-2"
                onClick={() => setIsMenuOpen(false)}
              >
                <Users className="w-4 h-4" />
                {t('referrals')}
              </Link>

              <div className="mx-4 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-am-blue/30 to-transparent opacity-30"></div>

              {/* /docs route reserved for future lab collaboration - not part of dealer UI */}

              {/* Mobile Language and Theme Toggles */}
              <div className="px-4 py-3 flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">{t('settings')}</span>
                <div className="flex items-center gap-2">
                  <LanguageToggle />
                  <ThemeToggle />
                </div>
              </div>

              {/* Mobile Auth */}
              <div className="pt-4 px-4">
                {isConnected && address ? (
                  <UserDropdown fullWidth />
                ) : (
                  <ConnectButtonDAO fullWidth />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export const NavbarSpacer: React.FC = () => {
  const { isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const heightClass = mounted && isConnected
    ? 'h-[94px] md:h-[86px]'
    : 'h-[74px]';

  return (
    <div
      className={heightClass}
      aria-hidden="true"
    />
  );
};

function MobileUserBadge({ address }: { address: string }) {
  return (
    <div className="flex items-center space-x-2 bg-am-blue/10 dark:bg-am-blue/20 px-2 py-1 rounded-lg">
      <div className="w-2 h-2 bg-am-green rounded-full"></div>
      <span className="text-xs text-am-blue dark:text-am-blue-light font-medium">
        {address.slice(0, 4)}...{address.slice(-3)}
      </span>
    </div>
  );
}

function UserDropdown({ fullWidth = false }: { fullWidth?: boolean }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const wallet = useActiveWallet();

  const tCommon = useTranslations('common');
  const tWallet = useTranslations('wallet');

  if (!isConnected || !address) return null;

  const displayAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`relative ${fullWidth ? 'w-full' : ''}`}>
      <div
        className={`flex items-center space-x-2 bg-white dark:bg-am-dark rounded-lg border border-gray-200 dark:border-am-blue/30 px-3 py-2
                 hover:border-am-orange dark:hover:border-am-orange/50 transition-all duration-300 ${fullWidth ? 'w-full' : ''}`}
      >
        {/* User avatar placeholder */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-am-blue to-am-orange flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>

        <div className="flex items-center space-x-2 flex-1">
          <div className="flex-1 text-left">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCopy();
              }}
              className="font-medium text-gray-900 dark:text-white text-xs hover:text-am-orange dark:hover:text-am-orange-light transition-colors flex items-center gap-1"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-am-green" />
                  <span className="text-am-green">{tCommon('copied')}</span>
                </>
              ) : (
                displayAddress
              )}
            </button>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Vendedor
            </div>
          </div>

          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-am-blue/20 rounded transition-colors"
          >
            <ChevronDown
              className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-300 ${showDropdown ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
      </div>

      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-[9999]"
            onClick={() => setShowDropdown(false)}
          />

          <div className={`${fullWidth ? 'relative' : 'absolute top-full right-0 min-w-[280px]'} mt-2 bg-white dark:bg-am-dark rounded-lg shadow-xl border border-gray-200 dark:border-am-blue/30 z-[10001]`}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-am-blue to-am-orange flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{displayAddress}</div>
                    <div className="text-xs text-am-green font-medium">Conectado</div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Link
                  href="/profile"
                  className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-am-orange/10 dark:hover:bg-am-orange/10 transition-colors text-left"
                  onClick={() => setShowDropdown(false)}
                >
                  <div className="w-4 h-4 rounded-full bg-gradient-to-br from-am-blue to-am-orange flex items-center justify-center flex-shrink-0">
                    <User className="w-2.5 h-2.5 text-white" />
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Mi Perfil</span>
                </Link>

                <button
                  onClick={handleCopy}
                  className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-am-blue/10 transition-colors text-left"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-am-green" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-400" />
                  )}
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {copied ? tCommon('copied') : tCommon('copyAddress')}
                  </span>
                </button>

                <div className="border-t border-gray-200 dark:border-am-blue/20 my-2"></div>

                <button
                  onClick={() => {
                    if (wallet) disconnect(wallet);
                    setShowDropdown(false);
                  }}
                  className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left text-red-600 dark:text-red-400"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-medium">Cerrar Sesion</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
