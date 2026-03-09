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
  Car,
  MessageCircle,
  Megaphone,
} from 'lucide-react';
import { FEATURE_WEB3_VISIBLE, FEATURE_CGC_TOKEN, FEATURE_NEAR_ME, FEATURE_CAMPAIGNS } from '@/lib/config/features';
import { MapPin } from 'lucide-react';
import { useTenant } from '@/lib/tenant/TenantProvider';
import { DEFAULT_LOGO_NAV } from '@/lib/config/defaults';
import { useUser } from '@/hooks/useUser';
import { useProfile } from '@/hooks/useProfile';
import { useReferralCode, useReferralLink } from '@/hooks/useReferrals';
import { ProfileCard } from '@/components/profile/ProfileCard';

export const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { address, isConnected } = useAccount();
  const { seller, isSubdomain } = useTenant();
  const { isDealer } = useUser();

  const t = useTranslations('navigation');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Contact info from tenant or support default
  const contactWhatsApp = (isSubdomain && seller?.whatsapp) || '12814680109';
  const displayPhone = (isSubdomain && seller?.phone) || '(281) 468-0109';

  return (
    <header className="fixed top-0 left-0 right-0 z-[10000] px-3 sm:px-4 lg:px-6 pt-2 space-y-1.5">
      {/* Main navigation — glass panel */}
      <nav className="bg-white/60 dark:bg-white/10 backdrop-blur-xl border border-gray-200/40 dark:border-white/20 rounded-2xl shadow-lg dark:shadow-none transition-colors duration-300">
        <div className="px-3 sm:px-4">
          <div className="flex justify-between items-center py-3">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-2">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src={isSubdomain && seller?.logo_url ? seller.logo_url : DEFAULT_LOGO_NAV}
                alt={isSubdomain && seller ? seller.business_name : 'Autos MALL'}
                width={180}
                height={100}
                className="h-16 w-auto drop-shadow-md"
                priority
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
              {isSubdomain && seller && !seller.logo_url && (
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  {seller.business_name}
                </span>
              )}
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            <Link
              href="/catalog"
              className="text-gray-600 dark:text-gray-300 hover:text-am-orange dark:hover:text-am-orange-light transition-colors text-sm font-bold flex items-center gap-1 px-2"
            >
              <Car className="w-3.5 h-3.5" />
              {t('catalog')}
            </Link>

            {FEATURE_NEAR_ME && (
              <Link
                href="/map"
                className="text-gray-600 dark:text-gray-300 hover:text-am-orange dark:hover:text-am-orange-light transition-colors text-sm font-bold flex items-center gap-1 px-2"
              >
                <MapPin className="w-3.5 h-3.5" />
                {t('map')}
              </Link>
            )}

            {!isSubdomain && isDealer && (
              <Link
                href="/dashboard"
                className="text-gray-600 dark:text-gray-300 hover:text-am-orange dark:hover:text-am-orange-light transition-colors text-sm font-bold px-2"
              >
                {t('dashboard')}
              </Link>
            )}

            <Link
              href="/referrals"
              className="text-gray-600 dark:text-gray-300 hover:text-am-orange dark:hover:text-am-orange-light transition-colors text-sm font-bold flex items-center gap-1 px-2"
            >
              {t('referrals')}
              <Users className="w-3 h-3" />
            </Link>

            {FEATURE_CAMPAIGNS && !isSubdomain && isDealer && (
              <Link
                href="/campaigns"
                className="text-gray-600 dark:text-gray-300 hover:text-am-orange dark:hover:text-am-orange-light transition-colors text-sm font-bold flex items-center gap-1 px-2"
              >
                <Megaphone className="w-3.5 h-3.5" />
                {t('campaigns')}
              </Link>
            )}

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
          <div className="md:hidden border-t border-gray-200/30 dark:border-white/15 py-4 max-h-[calc(100vh-160px)] overflow-y-auto">
            <div className="space-y-4">
              <Link
                href="/catalog"
                className="block text-gray-600 dark:text-gray-300 hover:text-am-orange dark:hover:text-am-orange-light transition-colors px-4 py-3 font-bold text-base flex items-center gap-2"
                onClick={() => setIsMenuOpen(false)}
              >
                <Car className="w-4 h-4" />
                {t('catalog')}
              </Link>

              {FEATURE_NEAR_ME && (
                <Link
                  href="/map"
                  className="block text-gray-600 dark:text-gray-300 hover:text-am-orange dark:hover:text-am-orange-light transition-colors px-4 py-3 font-bold text-base flex items-center gap-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <MapPin className="w-4 h-4" />
                  {t('map')}
                </Link>
              )}

              {!isSubdomain && isDealer && (
                <>
                  <div className="mx-4 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-am-blue/30 to-transparent opacity-30"></div>

                  <Link
                    href="/dashboard"
                    className="block text-gray-600 dark:text-gray-300 hover:text-am-orange dark:hover:text-am-orange-light transition-colors px-4 py-3 font-bold text-base flex items-center gap-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    {t('dashboard')}
                  </Link>
                </>
              )}

              <div className="mx-4 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-am-blue/30 to-transparent opacity-30"></div>

              <Link
                href="/referrals"
                className="block text-gray-600 dark:text-gray-300 hover:text-am-orange dark:hover:text-am-orange-light transition-colors px-4 py-3 font-bold text-base flex items-center gap-2"
                onClick={() => setIsMenuOpen(false)}
              >
                <Users className="w-4 h-4" />
                {t('referrals')}
              </Link>

              {FEATURE_CAMPAIGNS && !isSubdomain && isDealer && (
                <Link
                  href="/campaigns"
                  className="block text-gray-600 dark:text-gray-300 hover:text-am-orange dark:hover:text-am-orange-light transition-colors px-4 py-3 font-bold text-base flex items-center gap-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Megaphone className="w-4 h-4" />
                  {t('campaigns')}
                </Link>
              )}

              <div className="mx-4 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-am-blue/30 to-transparent opacity-30"></div>

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

      {/* Contact bar — WhatsApp pill (below navbar) */}
      <div className="w-fit bg-am-dark/90 dark:bg-white/10 backdrop-blur-md border border-white/5 dark:border-white/20 rounded-xl px-4 py-1.5 shadow-sm">
        <a
          href={`https://wa.me/${contactWhatsApp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-white hover:text-green-300 transition-colors"
          aria-label="WhatsApp"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span className="font-medium">{displayPhone}</span>
        </a>
      </div>
    </header>
  );
};

export const NavbarSpacer: React.FC = () => {
  const { isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Base navbar height + 1.8cm (≈68px) global page margin increase
  const heightClass = mounted && isConnected
    ? 'h-[172px] md:h-[164px]'
    : 'h-[152px]';

  return (
    <div
      className={heightClass}
      aria-hidden="true"
    />
  );
};

function MobileUserBadge({ address: _address }: { address: string }) {
  return (
    <div onClick={(e) => e.stopPropagation()}>
      <ProfileCard size="sm" />
    </div>
  );
}

function UserDropdown({ fullWidth = false }: { fullWidth?: boolean }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedWallet, setCopiedWallet] = useState(false);
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const wallet = useActiveWallet();
  const { user, role } = useUser();
  const { profile } = useProfile(address);
  const { code: referralCode } = useReferralCode(address);
  const { generateLink } = useReferralLink(referralCode);

  const tCommon = useTranslations('common');
  const tRoles = useTranslations('roles');

  if (!isConnected || !address) return null;

  const displayAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
  const displayName = user?.display_name || profile?.display_name || displayAddress;

  const handleCopyReferral = async () => {
    const link = generateLink() || `${window.location.origin}/ref/${referralCode || ''}`;
    if (link) {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyWallet = async () => {
    await navigator.clipboard.writeText(address);
    setCopiedWallet(true);
    setTimeout(() => setCopiedWallet(false), 2000);
  };

  return (
    <div className={`relative ${fullWidth ? 'w-full' : ''}`}>
      <div
        className={`flex items-center space-x-2 bg-white dark:bg-am-dark rounded-lg border border-gray-200 dark:border-am-blue/30 px-3 py-2
                 hover:border-am-orange dark:hover:border-am-orange/50 transition-all duration-300 ${fullWidth ? 'w-full' : ''}`}
      >
        {/* Profile Card L1 — Avatar with L1→L2→L4 system */}
        <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <ProfileCard size="sm" />
        </div>

        <div className="flex items-center space-x-2 flex-1">
          <div className="flex-1 text-left">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCopyReferral();
              }}
              className="font-medium text-gray-900 dark:text-white text-xs hover:text-am-orange dark:hover:text-am-orange-light transition-colors flex items-center gap-1"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-am-green" />
                  <span className="text-am-green">{tCommon('referralCopied')}</span>
                </>
              ) : (
                <span className="truncate max-w-[120px]">{displayName}</span>
              )}
            </button>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {role ? tRoles(`${role}.label`) : ''}
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
                <div className="flex items-center space-x-3">
                  <div onClick={(e) => e.stopPropagation()}>
                    <ProfileCard size="sm" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{displayName}</div>
                    <div className="text-xs text-am-green font-medium">{tCommon('connected')}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Link
                  href="/profile"
                  className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-am-orange/10 dark:hover:bg-am-orange/10 transition-colors text-left"
                  onClick={() => setShowDropdown(false)}
                >
                  <User className="w-4 h-4 text-am-blue flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{tCommon('myProfile')}</span>
                </Link>

                <button
                  onClick={handleCopyReferral}
                  className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-am-blue/10 transition-colors text-left"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-am-green" />
                  ) : (
                    <Users className="w-4 h-4 text-am-orange" />
                  )}
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {copied ? tCommon('referralCopied') : tCommon('copyReferralLink')}
                  </span>
                </button>

                <button
                  onClick={handleCopyWallet}
                  className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-am-blue/10 transition-colors text-left"
                >
                  {copiedWallet ? (
                    <Check className="w-4 h-4 text-am-green" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-400" />
                  )}
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {copiedWallet ? tCommon('copied') : tCommon('copyAddress')}
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
                  <span className="text-sm font-medium">{tCommon('signOut')}</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
