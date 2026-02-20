'use client';

/**
 * Mini App Main Page
 *
 * Entry point for the Farcaster Mini App.
 * Renders 3 tabs: Dashboard, Tasks, Referrals.
 *
 * Made by mbxarts.com The Moon in a Box property
 * Co-Author: Godez22
 */

import React from 'react';
import {
  useMiniApp,
  TabNavigation,
  DashboardTab,
  TasksTab,
  ReferralsTab,
} from './components';
import { Loader2 } from 'lucide-react';

export default function MiniAppPage() {
  const { isLoading, activeTab, context } = useMiniApp();

  // Apply safe area insets for header
  const paddingTop = context.safeAreaInsets.top || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Loading CryptoGift DAO...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen pb-20"
      style={{ paddingTop: paddingTop + 8 }}
    >
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-center h-12 px-4">
          <div className="flex items-center gap-2">
            <img
              src="/cgc-logo-150.png"
              alt="CGC"
              className="w-6 h-6 rounded-full"
            />
            <span className="font-semibold text-gray-900 dark:text-white">
              CryptoGift DAO
            </span>
          </div>
        </div>
      </header>

      {/* Tab Content */}
      <div className="relative">
        {activeTab === 'dashboard' && <DashboardTab />}
        {activeTab === 'tasks' && <TasksTab />}
        {activeTab === 'referrals' && <ReferralsTab />}
      </div>

      {/* Bottom Navigation */}
      <TabNavigation />
    </div>
  );
}
