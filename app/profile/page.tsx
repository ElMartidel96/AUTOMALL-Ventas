'use client';

/**
 * Profile Page — Orchestrator with Tabs
 *
 * Tab 1: "Mi Perfil" — visible for ALL roles (buyer, seller, birddog)
 * Tab 2: "Mi Concesionaria" — visible only for seller/birddog
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Navbar, NavbarSpacer } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useAccount } from '@/lib/thirdweb';
import { useSellerProfile } from '@/hooks/useSellerProfile';
import { useUser } from '@/hooks/useUser';
import { useReferralDashboard } from '@/hooks/useReferrals';
import { MyProfileSection } from '@/components/profile/MyProfileSection';
import { MyDealershipSection } from '@/components/profile/MyDealershipSection';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Store, User as UserIcon } from 'lucide-react';

export default function ProfilePage() {
  const t = useTranslations('profile');
  const tCommon = useTranslations('common');
  const { address, isConnected } = useAccount();
  const { seller, isLoading, completionPercentage, refetch } = useSellerProfile();
  const { user, role, isDealer, isLoading: userLoading, updateRole, refetch: refetchUser } = useUser();
  const { code, stats, links, isLoading: refLoading } = useReferralDashboard(address);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Loading state
  if (!mounted || isLoading || userLoading) {
    return <ProfileSkeleton />;
  }

  // Not connected
  if (!isConnected || !address) {
    return (
      <>
        <Navbar />
        <NavbarSpacer />
        <div className="min-h-screen theme-gradient-bg flex items-center justify-center p-4">
          <div className="glass-crystal-enhanced rounded-2xl p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-am-orange to-am-orange-light flex items-center justify-center">
              <Store className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {tCommon('pleaseConnectWallet')}
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              {t('connectPrompt')}
            </p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  // Dealer without seller profile → onboarding
  if (isDealer && !seller) {
    return (
      <>
        <Navbar />
        <NavbarSpacer />
        <div className="min-h-screen theme-gradient-bg flex items-center justify-center p-4">
          <div className="glass-crystal-enhanced rounded-2xl p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-am-blue to-am-blue-light flex items-center justify-center">
              <Store className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {t('noProfile')}
            </h2>
            <Link
              href="/onboarding"
              className="mt-4 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-am-orange to-am-orange-light text-white font-bold hover:shadow-lg transition-all"
            >
              {t('setupCta')}
            </Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const showDealerTab = isDealer && !!seller;

  return (
    <>
      <Navbar />
      <NavbarSpacer />
      <div className="min-h-screen theme-gradient-bg">
        <div className="container mx-auto px-4 pb-8 pt-8 max-w-4xl">
          {/* Page header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t('pageTitle')}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">{t('pageSubtitle')}</p>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="profile" className="w-full">
            <TabsList
              className={`glass-crystal-enhanced w-full h-14 rounded-2xl p-1.5 mb-8 grid ${
                showDealerTab ? 'grid-cols-2' : 'grid-cols-1'
              }`}
            >
              <TabsTrigger
                value="profile"
                className="rounded-xl h-full text-sm font-bold transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-am-blue data-[state=active]:to-am-blue-light data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=inactive]:text-gray-500 dark:data-[state=inactive]:text-gray-400 flex items-center justify-center gap-2"
              >
                <UserIcon className="w-4 h-4" />
                {t('tabMyProfile')}
              </TabsTrigger>
              {showDealerTab && (
                <TabsTrigger
                  value="dealership"
                  className="rounded-xl h-full text-sm font-bold transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-am-orange data-[state=active]:to-am-orange-light data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=inactive]:text-gray-500 dark:data-[state=inactive]:text-gray-400 flex items-center justify-center gap-2"
                >
                  <Store className="w-4 h-4" />
                  {t('tabMyDealership')}
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="profile" className="mt-0 focus-visible:ring-0 focus-visible:ring-offset-0">
              <MyProfileSection
                user={user}
                address={address}
                referralCode={code.code}
                referralLink={links.links?.default}
                referralStats={stats.stats}
                isLoadingReferrals={refLoading}
                refetchUser={refetchUser}
              />
            </TabsContent>

            {showDealerTab && (
              <TabsContent value="dealership" className="mt-0 focus-visible:ring-0 focus-visible:ring-offset-0">
                <MyDealershipSection
                  seller={seller}
                  address={address}
                  role={role}
                  completionPercentage={completionPercentage}
                  refetch={refetch}
                  referralLink={links.links?.default}
                  updateRole={updateRole}
                />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
      <Footer />
    </>
  );
}

/* ─────────────────────────────────────────────
   Skeleton Loader
   ───────────────────────────────────────────── */

function ProfileSkeleton() {
  return (
    <>
      <Navbar />
      <NavbarSpacer />
      <div className="min-h-screen theme-gradient-bg">
        <div className="container mx-auto px-4 pb-8 pt-[calc(2rem+2.5cm)] max-w-4xl animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-xl w-48 mb-2" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-64 mb-8" />
          {/* Tab placeholder */}
          <div className="glass-crystal-enhanced rounded-2xl h-14 mb-8" />
          {/* Content placeholders */}
          <div className="glass-crystal-enhanced rounded-2xl h-40 mb-6" />
          <div className="glass-crystal-enhanced rounded-2xl h-48 mb-6" />
          <div className="glass-crystal-enhanced rounded-2xl h-28" />
        </div>
      </div>
      <Footer />
    </>
  );
}
