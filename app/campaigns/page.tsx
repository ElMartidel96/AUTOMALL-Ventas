'use client';

/**
 * Campaigns Page — Seller dashboard for Facebook CTWA campaigns
 *
 * Auth-gated: requires connected wallet + dealer role.
 * Feature-gated: FEATURE_CAMPAIGNS.
 * Tabs: Dashboard | Create
 */

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAccount } from '@/lib/thirdweb';
import { useUser } from '@/hooks/useUser';
import { FEATURE_CAMPAIGNS } from '@/lib/config/features';
import { ConnectButtonDAO } from '@/components/thirdweb/ConnectButtonDAO';
import { Navbar, NavbarSpacer } from '@/components/layout/Navbar';
import { CampaignDashboard } from '@/components/campaigns/CampaignDashboard';
import { CampaignBuilder } from '@/components/campaigns/CampaignBuilder';

type Tab = 'dashboard' | 'create';

export default function CampaignsPage() {
  const { isConnected } = useAccount();
  const { isDealer, isLoading: userLoading } = useUser();
  const t = useTranslations('campaigns');
  const [tab, setTab] = useState<Tab>('dashboard');

  if (!FEATURE_CAMPAIGNS) {
    return null;
  }

  return (
    <>
      <Navbar />
      <NavbarSpacer />
      <main className="max-w-4xl mx-auto px-4 py-8">
        {!isConnected ? (
          <div className="text-center py-16">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {t('title')}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {t('connectToManage')}
            </p>
            <ConnectButtonDAO />
          </div>
        ) : !userLoading && !isDealer ? (
          <div className="text-center py-16">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {t('dealerOnly')}
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              {t('dealerOnlyDescription')}
            </p>
          </div>
        ) : (
          <>
            {/* Header + Tabs */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('title')}
              </h1>
              <div className="flex bg-gray-100 dark:bg-white/10 rounded-xl p-1">
                <button
                  onClick={() => setTab('dashboard')}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    tab === 'dashboard'
                      ? 'bg-white dark:bg-am-dark text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  {t('tabDashboard')}
                </button>
                <button
                  onClick={() => setTab('create')}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    tab === 'create'
                      ? 'bg-white dark:bg-am-dark text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  {t('tabCreate')}
                </button>
              </div>
            </div>

            {tab === 'dashboard' ? (
              <CampaignDashboard onCreateNew={() => setTab('create')} />
            ) : (
              <CampaignBuilder
                onCreated={() => setTab('dashboard')}
                onCancel={() => setTab('dashboard')}
              />
            )}
          </>
        )}
      </main>
    </>
  );
}
