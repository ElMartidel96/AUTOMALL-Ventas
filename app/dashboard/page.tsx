'use client';

/**
 * Autos MALL - Seller Dashboard
 *
 * Main dashboard for independent car sellers.
 * Shows sales stats, inventory overview, clients, and referrals.
 * Web3 panels hidden via feature flags.
 *
 * i18n pattern: useTranslations('dashboard')
 */

import { useTranslations } from 'next-intl';
import { Navbar, NavbarSpacer } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useAccount } from '@/lib/thirdweb';
import { useUser } from '@/hooks/useUser';
import { FEATURE_WEB3_VISIBLE } from '@/lib/config/features';
import {
  Car,
  Users,
  TrendingUp,
  DollarSign,
  Package,
  MessageSquare,
  Star,
  BarChart3,
  Plus,
  ArrowUpRight,
  Clock,
  Eye,
} from 'lucide-react';
import Link from 'next/link';

export default function SellerDashboard() {
  const { isConnected, address } = useAccount();
  const { isDealer, isBuyer, isLoading: userLoading } = useUser();
  const tDashboard = useTranslations('dashboard');

  return (
    <div className="min-h-screen theme-gradient-bg">
      <Navbar />
      <NavbarSpacer />

      {/* Background decorative elements */}
      <div className="fixed inset-0 opacity-20 dark:opacity-10 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-am-blue rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-am-orange rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-am-green rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl animate-pulse delay-2000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Welcome Header */}
        <div className="glass-panel p-6 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {tDashboard('welcome')}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                {tDashboard('welcomeSubtitle')}
              </p>
            </div>
            {isConnected && isDealer && (
              <div className="flex gap-3">
                <Link
                  href="/inventory"
                  className="flex items-center gap-2 bg-am-orange hover:bg-am-orange-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  {tDashboard('addVehicle')}
                </Link>
              </div>
            )}
          </div>
        </div>

        {!isConnected ? (
          /* Not connected state */
          <div className="glass-panel p-12 text-center">
            <Car className="w-16 h-16 mx-auto text-am-orange mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {tDashboard('connectPrompt')}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              {tDashboard('connectDescription')}
            </p>
          </div>
        ) : !userLoading && isBuyer ? (
          /* Buyer role — redirect to catalog */
          <div className="glass-panel p-12 text-center">
            <Car className="w-16 h-16 mx-auto text-am-blue mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {tDashboard('title')}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
              {tDashboard('connectDescription')}
            </p>
            <Link
              href="/catalog"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-am-orange to-am-orange-light text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all"
            >
              <Car className="w-5 h-5" />
              {tDashboard('stats.activeListings')}
            </Link>
          </div>
        ) : (
          <>
            {/* Main Stats Grid */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                title={tDashboard('stats.activeListings')}
                value="0"
                icon={<Car className="w-5 h-5 text-am-blue-light" />}
                trend="+0"
                delay="0.1s"
              />
              <StatCard
                title={tDashboard('stats.totalClients')}
                value="0"
                icon={<Users className="w-5 h-5 text-am-green" />}
                trend="+0"
                delay="0.2s"
              />
              <StatCard
                title={tDashboard('stats.monthlyViews')}
                value="0"
                icon={<Eye className="w-5 h-5 text-am-orange" />}
                trend="+0"
                delay="0.3s"
              />
              <StatCard
                title={tDashboard('stats.salesThisMonth')}
                value="$0"
                icon={<DollarSign className="w-5 h-5 text-emerald-500" />}
                trend="+0"
                delay="0.4s"
              />
            </section>

            {/* Dashboard Panels */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* My Inventory */}
              <DashboardPanel
                title={tDashboard('panels.inventory.title')}
                subtitle={tDashboard('panels.inventory.subtitle')}
                icon={<Package className="w-5 h-5 text-am-blue-light" />}
                actionLabel={tDashboard('panels.inventory.action')}
                actionHref="/inventory"
                delay="0.5s"
              >
                <div className="text-center py-8">
                  <Car className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {tDashboard('panels.inventory.empty')}
                  </p>
                </div>
              </DashboardPanel>

              {/* My Clients */}
              <DashboardPanel
                title={tDashboard('panels.clients.title')}
                subtitle={tDashboard('panels.clients.subtitle')}
                icon={<Users className="w-5 h-5 text-am-green" />}
                actionLabel={tDashboard('panels.clients.action')}
                actionHref="/clients"
                delay="0.6s"
              >
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {tDashboard('panels.clients.empty')}
                  </p>
                </div>
              </DashboardPanel>

              {/* Recent Activity */}
              <DashboardPanel
                title={tDashboard('panels.activity.title')}
                subtitle={tDashboard('panels.activity.subtitle')}
                icon={<Clock className="w-5 h-5 text-am-orange" />}
                delay="0.7s"
              >
                <div className="text-center py-8">
                  <BarChart3 className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {tDashboard('panels.activity.empty')}
                  </p>
                </div>
              </DashboardPanel>

              {/* My Referrals */}
              <DashboardPanel
                title={tDashboard('panels.referrals.title')}
                subtitle={tDashboard('panels.referrals.subtitle')}
                icon={<Star className="w-5 h-5 text-yellow-500" />}
                actionLabel={tDashboard('panels.referrals.action')}
                actionHref="/referrals"
                delay="0.8s"
              >
                <div className="text-center py-8">
                  <TrendingUp className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {tDashboard('panels.referrals.empty')}
                  </p>
                </div>
              </DashboardPanel>
            </section>

            {/* System Status */}
            <footer className="glass-panel p-4">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-am-green pulse-glow"></div>
                  <span className="text-gray-500 dark:text-gray-400 text-sm">
                    {tDashboard('system.active')}
                  </span>
                  <span className="text-xs text-am-green bg-am-green/10 px-2 py-0.5 rounded-full">
                    {tDashboard('system.operational')}
                  </span>
                </div>
              </div>
            </footer>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  trend,
  delay = '0s',
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: string;
  delay?: string;
}) {
  return (
    <div className="glass-card p-4 spring-in" style={{ animationDelay: delay }}>
      <div className="flex items-center justify-between mb-2">
        <div className="p-2 glass-bubble">{icon}</div>
        {trend && (
          <span className="text-xs text-am-green font-medium flex items-center gap-0.5">
            <ArrowUpRight className="w-3 h-3" />
            {trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{title}</p>
    </div>
  );
}

function DashboardPanel({
  title,
  subtitle,
  icon,
  actionLabel,
  actionHref,
  delay = '0s',
  children,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  actionLabel?: string;
  actionHref?: string;
  delay?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="glass-panel p-6 spring-in" style={{ animationDelay: delay }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 glass-bubble">{icon}</div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
          </div>
        </div>
        {actionLabel && actionHref && (
          <Link
            href={actionHref}
            className="text-am-orange hover:text-am-orange-dark text-sm font-medium flex items-center gap-1 transition-colors"
          >
            {actionLabel}
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}
