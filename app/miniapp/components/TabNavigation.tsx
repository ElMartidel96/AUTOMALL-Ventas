'use client';

/**
 * Tab Navigation Component
 *
 * Bottom navigation bar for the 3 main tabs.
 * Optimized for mobile with large touch targets.
 *
 * Made by mbxarts.com The Moon in a Box property
 * Co-Author: Godez22
 */

import React from 'react';
import { LayoutDashboard, ListTodo, Users } from 'lucide-react';
import type { MiniAppTab } from '@/lib/farcaster/types';
import { useMiniApp } from './MiniAppProvider';
import { useTranslations } from 'next-intl';

interface TabItem {
  id: MiniAppTab;
  labelKey: string;
  icon: typeof LayoutDashboard;
}

const TABS: TabItem[] = [
  { id: 'dashboard', labelKey: 'dashboard', icon: LayoutDashboard },
  { id: 'tasks', labelKey: 'tasks', icon: ListTodo },
  { id: 'referrals', labelKey: 'referrals', icon: Users },
];

export function TabNavigation() {
  const { activeTab, setActiveTab, context } = useMiniApp();
  const t = useTranslations('miniapp.tabs');

  // Apply safe area insets for devices with notches/home indicators
  const paddingBottom = context.safeAreaInsets.bottom || 0;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 z-50"
      style={{ paddingBottom: paddingBottom + 8 }}
    >
      <div className="flex items-center justify-around max-w-md mx-auto px-2 py-1">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex flex-col items-center justify-center
                min-w-[72px] min-h-[56px] px-3 py-2
                rounded-xl transition-all duration-200
                ${
                  isActive
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }
              `}
              aria-label={t(tab.labelKey)}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon
                className={`w-6 h-6 mb-0.5 transition-transform ${
                  isActive ? 'scale-110' : ''
                }`}
              />
              <span className="text-[10px] font-medium tracking-wide">
                {t(tab.labelKey)}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default TabNavigation;
