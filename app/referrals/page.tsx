/**
 * 🤝 REFERRALS PAGE
 * Multi-level referral system for CryptoGift DAO
 * Protected with CGC token-based access control
 * 🌐 i18n: Full translation support for EN/ES
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Navbar, NavbarSpacer } from '@/components/layout/Navbar';
import { PermanentReferralCard } from '@/components/referrals/PermanentReferralCard';
import { QRCodeModal } from '@/components/referrals/QRCodeModal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAccount } from '@/lib/thirdweb';
import {
  useReferralDashboard,
  useReferralLeaderboard,
  useReferralNetwork,
  useActivateReferral,
  type ReferralStats as HookReferralStats,
  type LeaderboardEntry as HookLeaderboardEntry,
  type ReferralNetworkMember,
} from '@/hooks/useReferrals';
import Link from 'next/link';
import {
  Users,
  Copy,
  Check,
  ExternalLink,
  Gift,
  TrendingUp,
  Award,
  Share2,
  QrCode,
  ChevronRight,
  Sparkles,
  UserPlus,
  Coins,
  Trophy,
  Link as LinkIcon,
  Twitter,
  Send,
  MessageCircle,
  Download,
  Activity,
  Target,
  Zap,
  Network,
  Star,
  RefreshCw,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  History,
  Wallet,
  Eye,
} from 'lucide-react';

// ===== TYPES =====
interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  pendingRewards: number;
  totalEarned: number;
  level1Count: number;
  level2Count: number;
  level3Count: number;
  conversionRate: number;
}

interface Referral {
  id: string;
  address: string;
  level: 1 | 2 | 3;
  joinedAt: Date;
  tasksCompleted: number;
  cgcEarned: number;
  status: 'active' | 'inactive' | 'pending';
}

interface LeaderboardEntry {
  rank: number;
  address: string;
  referrals: number;
  earned: number;
}

// ===== HELPER FUNCTIONS =====
const generateReferralCode = (address: string): string => {
  if (!address) return 'CGDAO';
  const shortened = address.slice(2, 8).toUpperCase();
  return `CG-${shortened}`;
};

// Default stats when API is loading
const defaultStats: ReferralStats = {
  totalReferrals: 0,
  activeReferrals: 0,
  pendingRewards: 0,
  totalEarned: 0,
  level1Count: 0,
  level2Count: 0,
  level3Count: 0,
  conversionRate: 0
};

// ===== MAIN COMPONENT =====
export default function ReferralsPage() {
  const t = useTranslations('referrals');

  return (
    <>
      <Navbar />
      <NavbarSpacer />

      {/* Open access - no token gating for viewing */}
      <div className="min-h-screen theme-gradient-bg">
        {/* Background effects */}
        <div className="fixed inset-0 opacity-30 dark:opacity-20 pointer-events-none overflow-hidden">
          <div className="absolute top-20 left-20 w-72 h-72 bg-blue-400 dark:bg-blue-600 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl animate-pulse"></div>
          <div className="absolute top-40 right-20 w-72 h-72 bg-purple-400 dark:bg-purple-600 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl animate-pulse"></div>
          <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-cyan-400 dark:bg-cyan-600 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl animate-pulse"></div>
        </div>

        {/* Header */}
        <div className="relative z-10 border-b border-gray-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{t('subtitle')}</span>
                </div>
              </div>
              <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                <Activity className="h-3 w-3 mr-1" />
                Active
              </Badge>
            </div>
          </div>
        </div>

        <div className="relative z-10 container mx-auto px-4 py-8">
          <ReferralsDashboard />
        </div>
      </div>
    </>
  );
}

// ===== DASHBOARD =====
function ReferralsDashboard() {
  const t = useTranslations('referrals');
  const { address } = useAccount();
  const [activeTab, setActiveTab] = useState<'overview' | 'network' | 'rewards' | 'leaderboard' | 'history'>('overview');
  const [copied, setCopied] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);

  // Use real data from hooks
  const { code, stats: apiStats, links, isLoading, refetchAll } = useReferralDashboard(address);

  // Map API stats to local format
  const stats: ReferralStats = apiStats.stats ? {
    totalReferrals: apiStats.stats.totalReferrals,
    activeReferrals: apiStats.stats.activeReferrals,
    pendingRewards: apiStats.stats.pendingRewards,
    totalEarned: apiStats.stats.totalEarned,
    level1Count: apiStats.stats.network?.level1 || 0,
    level2Count: apiStats.stats.network?.level2 || 0,
    level3Count: apiStats.stats.network?.level3 || 0,
    conversionRate: apiStats.stats.engagement?.conversionRate || 0,
  } : defaultStats;

  // Use API-generated code or fallback to generated code
  const referralCode = code.code || generateReferralCode(address || '');
  const referralLink = links.links?.default || (typeof window !== 'undefined'
    ? `${window.location.origin}?ref=${referralCode}`
    : `https://cryptogift-dao.com?ref=${referralCode}`);

  const handleCopy = useCallback(async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const tabs = [
    { id: 'overview', label: t('tabs.overview'), icon: Target },
    { id: 'network', label: t('tabs.network'), icon: Network },
    { id: 'history', label: t('tabs.history'), icon: History },
    { id: 'rewards', label: t('tabs.rewards'), icon: Gift },
    { id: 'leaderboard', label: t('tabs.leaderboard'), icon: Trophy },
  ] as const;

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('stats.totalReferrals')}
          value={stats.totalReferrals.toString()}
          icon={<Users className="h-5 w-5 text-blue-500" />}
          trend="+0 this week"
        />
        <StatCard
          title={t('stats.activeReferrals')}
          value={stats.activeReferrals.toString()}
          icon={<Activity className="h-5 w-5 text-green-500" />}
          trend="Active now"
        />
        <StatCard
          title={t('stats.pendingRewards')}
          value={`${stats.pendingRewards} CGC`}
          icon={<Coins className="h-5 w-5 text-amber-500" />}
          trend="Claimable"
        />
        <StatCard
          title={t('stats.totalEarned')}
          value={`${stats.totalEarned} CGC`}
          icon={<TrendingUp className="h-5 w-5 text-purple-500" />}
          trend={t('stats.allTime')}
        />
      </div>

      {/* Referral Code Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 glass-panel">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
              <LinkIcon className="h-5 w-5 text-blue-500" />
              <span>{t('code.title')}</span>
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              {t('code.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Code Display */}
            <div className="flex items-center space-x-3">
              <div className="flex-1 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-900/30 dark:to-purple-900/30 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Your Referral Code</p>
                    <p className="text-2xl font-bold font-mono text-gray-900 dark:text-white">{referralCode}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(referralCode)}
                    className="dark:border-slate-600"
                  >
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    <span className="ml-2">{copied ? t('code.copied') : t('code.copyCode')}</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Link Display */}
            <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Your Referral Link</p>
              <div className="flex items-center space-x-2">
                <code className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">
                  {referralLink}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(referralLink)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Share Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="dark:border-slate-600">
                <Twitter className="h-4 w-4 mr-2" />
                {t('share.twitter')}
              </Button>
              <Button variant="outline" size="sm" className="dark:border-slate-600">
                <Send className="h-4 w-4 mr-2" />
                {t('share.telegram')}
              </Button>
              <Button variant="outline" size="sm" className="dark:border-slate-600">
                <MessageCircle className="h-4 w-4 mr-2" />
                {t('share.discord')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="dark:border-slate-600"
                onClick={() => setShowQRModal(true)}
              >
                <QrCode className="h-4 w-4 mr-2" />
                {t('share.qrCode')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* QR Code Modal */}
        <QRCodeModal
          isOpen={showQRModal}
          onClose={() => setShowQRModal(false)}
          referralLink={referralLink}
          referralCode={referralCode}
        />

        {/* Network Overview */}
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
              <Network className="h-5 w-5 text-purple-500" />
              <span>{t('network.title')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <NetworkLevelCard level={1} count={stats.level1Count} percentage={10} />
            <NetworkLevelCard level={2} count={stats.level2Count} percentage={5} />
            <NetworkLevelCard level={3} count={stats.level3Count} percentage={2.5} />
            <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('network.totalNetwork')}
                </span>
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  {stats.level1Count + stats.level2Count + stats.level3Count}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Permanent Referral Link Section (FEATURED - Multi-use, never expires) */}
      <PermanentReferralCard referralCode={referralCode} walletAddress={address} />

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-gray-200 dark:border-slate-700 pb-2 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-t-lg font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-b-2 border-blue-500'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'network' && <NetworkTab stats={stats} />}
      {activeTab === 'history' && <DirectReferralsHistoryTab />}
      {activeTab === 'rewards' && <RewardsTab />}
      {activeTab === 'leaderboard' && <LeaderboardTabWithData />}
    </div>
  );
}

// ===== TAB COMPONENTS =====

function OverviewTab() {
  const t = useTranslations('referrals');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* How It Works */}
      <Card className="glass-panel">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <span>{t('how.title')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <StepCard
            step={1}
            title={t('how.step1.title')}
            description={t('how.step1.desc')}
            icon={<LinkIcon className="h-5 w-5" />}
          />
          <StepCard
            step={2}
            title={t('how.step2.title')}
            description={t('how.step2.desc')}
            icon={<Share2 className="h-5 w-5" />}
          />
          <StepCard
            step={3}
            title={t('how.step3.title')}
            description={t('how.step3.desc')}
            icon={<UserPlus className="h-5 w-5" />}
          />
          <StepCard
            step={4}
            title={t('how.step4.title')}
            description={t('how.step4.desc')}
            icon={<Coins className="h-5 w-5" />}
          />
        </CardContent>
      </Card>

      {/* Reward Structure Preview */}
      <Card className="glass-panel">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
            <Gift className="h-5 w-5 text-green-500" />
            <span>{t('rewards.title')}</span>
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            {t('rewards.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RewardTierCard
            level={1}
            title={t('rewards.level1Title')}
            description={t('rewards.level1Desc')}
            percentage={10}
            color="blue"
          />
          <RewardTierCard
            level={2}
            title={t('rewards.level2Title')}
            description={t('rewards.level2Desc')}
            percentage={5}
            color="purple"
          />
          <RewardTierCard
            level={3}
            title={t('rewards.level3Title')}
            description={t('rewards.level3Desc')}
            percentage={2.5}
            color="cyan"
          />
        </CardContent>
      </Card>
    </div>
  );
}

function NetworkTab({ stats }: { stats: ReferralStats }) {
  const t = useTranslations('referrals');
  const { address } = useAccount();
  const { referrals, isLoading, refetch } = useReferralNetwork(address, { limit: 50 });
  const { activate, isActivating } = useActivateReferral();
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [activatingWallet, setActivatingWallet] = useState<string | null>(null);

  const hasReferrals = stats.totalReferrals > 0;

  const handleCopyAddress = async (addr: string) => {
    await navigator.clipboard.writeText(addr);
    setCopiedAddress(addr);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const handleActivate = async (wallet: string) => {
    setActivatingWallet(wallet);
    try {
      await activate(wallet);
      refetch();
    } catch (error) {
      console.error('Activation failed:', error);
    } finally {
      setActivatingWallet(null);
    }
  };

  // Group referrals by level
  const level1Referrals = referrals.filter((r) => r.level === 1);
  const level2Referrals = referrals.filter((r) => r.level === 2);
  const level3Referrals = referrals.filter((r) => r.level === 3);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
          <Network className="h-5 w-5 text-purple-500" />
          <span>{t('network.title')}</span>
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400">
          {t('network.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          </div>
        ) : hasReferrals ? (
          <div className="space-y-6">
            {/* Network Tree Visualization */}
            <div className="relative">
              {/* Your Position (Root) */}
              <div className="flex justify-center mb-8">
                <div className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold shadow-lg">
                  {t('network.you')}
                </div>
              </div>

              {/* Connection Lines */}
              <div className="absolute top-12 left-1/2 w-px h-8 bg-gradient-to-b from-amber-500 to-blue-500" />

              {/* Level 1 - Direct Referrals */}
              {level1Referrals.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold">
                      1
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {t('network.level1')} ({level1Referrals.length})
                    </h3>
                    <span className="text-sm text-blue-600 dark:text-blue-400">10% commission</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {level1Referrals.map((ref) => (
                      <ReferralCard
                        key={ref.id}
                        referral={ref}
                        level={1}
                        onCopy={handleCopyAddress}
                        onActivate={handleActivate}
                        copiedAddress={copiedAddress}
                        isActivating={activatingWallet === ref.address}
                        formatDate={formatDate}
                        t={t}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Level 2 - Secondary Referrals */}
              {level2Referrals.length > 0 && (
                <div className="mb-8 pl-8 border-l-2 border-purple-300 dark:border-purple-700">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                      2
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {t('network.level2')} ({level2Referrals.length})
                    </h3>
                    <span className="text-sm text-purple-600 dark:text-purple-400">5% commission</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {level2Referrals.map((ref) => (
                      <ReferralCard
                        key={ref.id}
                        referral={ref}
                        level={2}
                        onCopy={handleCopyAddress}
                        onActivate={handleActivate}
                        copiedAddress={copiedAddress}
                        isActivating={activatingWallet === ref.address}
                        formatDate={formatDate}
                        t={t}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Level 3 - Third Level Referrals */}
              {level3Referrals.length > 0 && (
                <div className="pl-16 border-l-2 border-cyan-300 dark:border-cyan-700">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-cyan-600 flex items-center justify-center text-white text-sm font-bold">
                      3
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {t('network.level3')} ({level3Referrals.length})
                    </h3>
                    <span className="text-sm text-cyan-600 dark:text-cyan-400">2.5% commission</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {level3Referrals.map((ref) => (
                      <ReferralCard
                        key={ref.id}
                        referral={ref}
                        level={3}
                        onCopy={handleCopyAddress}
                        onActivate={handleActivate}
                        copiedAddress={copiedAddress}
                        isActivating={activatingWallet === ref.address}
                        formatDate={formatDate}
                        t={t}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">{t('network.noReferrals')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Referral Card Component for Network View
function ReferralCard({
  referral,
  level,
  onCopy,
  onActivate,
  copiedAddress,
  isActivating,
  formatDate,
  t,
}: {
  referral: ReferralNetworkMember;
  level: number;
  onCopy: (address: string) => void;
  onActivate: (wallet: string) => void;
  copiedAddress: string | null;
  isActivating: boolean;
  formatDate: (date: string) => string;
  t: ReturnType<typeof useTranslations>;
}) {
  const levelColors = {
    1: 'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/20',
    2: 'border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/20',
    3: 'border-cyan-200 dark:border-cyan-800 bg-cyan-50/50 dark:bg-cyan-900/20',
  };

  const statusColors = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    banned: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <div className={`p-4 rounded-xl border ${levelColors[level as keyof typeof levelColors]} transition-all hover:shadow-md`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white font-bold text-sm">
            {(referral.displayName || referral.username) ? (referral.displayName || referral.username)!.slice(0, 2).toUpperCase() : referral.address.slice(2, 4).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              {referral.displayName || referral.username || referral.addressShort}
            </p>
            <Badge className={statusColors[referral.status as keyof typeof statusColors]} variant="secondary">
              {referral.status === 'active' && <CheckCircle className="w-3 h-3 mr-1" />}
              {referral.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
              {referral.status}
            </Badge>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onCopy(referral.address)}
          className="h-8 w-8 p-0"
        >
          {copiedAddress === referral.address ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>

      <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span>{formatDate(referral.joinedAt)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Coins className="w-4 h-4" />
          <span>{referral.cgcEarned} CGC {t('network.earned')}</span>
        </div>
      </div>

      {/* View Profile Link */}
      <Link
        href={`/user/${referral.address}`}
        className="w-full mt-3 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
      >
        <Eye className="w-4 h-4" />
        {t('network.viewProfile')}
      </Link>

      {referral.status === 'pending' && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onActivate(referral.address)}
          disabled={isActivating}
          className="w-full mt-3 border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-900/30"
        >
          {isActivating ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Zap className="w-4 h-4 mr-2" />
          )}
          {t('network.checkActivation')}
        </Button>
      )}
    </div>
  );
}

// Direct Referrals History Tab
function DirectReferralsHistoryTab() {
  const t = useTranslations('referrals');
  const { address } = useAccount();
  const { referrals, isLoading, refetch } = useReferralNetwork(address, { level: 1, limit: 100 });
  const { activate, isActivating } = useActivateReferral();
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [activatingWallet, setActivatingWallet] = useState<string | null>(null);

  const handleCopyAddress = async (addr: string) => {
    await navigator.clipboard.writeText(addr);
    setCopiedAddress(addr);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const handleActivate = async (wallet: string) => {
    setActivatingWallet(wallet);
    try {
      await activate(wallet);
      refetch();
    } catch (error) {
      console.error('Activation failed:', error);
    } finally {
      setActivatingWallet(null);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(undefined, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      time: date.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  };

  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
          <History className="h-5 w-5 text-blue-500" />
          <span>{t('history.title')}</span>
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400">
          {t('history.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : referrals.length > 0 ? (
          <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-100 dark:border-blue-800">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{referrals.length}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('history.totalDirect')}</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {referrals.filter((r) => r.status === 'active').length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('history.active')}</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {referrals.filter((r) => r.status === 'pending').length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('history.pending')}</p>
              </div>
            </div>

            {/* Referral List */}
            <div className="space-y-3">
              {referrals.map((referral) => {
                const { date, time } = formatDateTime(referral.joinedAt);
                const activatedAt = referral.lastActivity ? formatDateTime(referral.lastActivity) : null;

                return (
                  <div
                    key={referral.id}
                    className="p-4 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      {/* User Info */}
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                          {(referral.displayName || referral.username) ? (referral.displayName || referral.username)!.slice(0, 2).toUpperCase() : referral.address.slice(2, 4).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {referral.displayName || referral.username || t('history.anonymous')}
                            </p>
                            <Badge
                              className={
                                referral.status === 'active'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                              }
                              variant="secondary"
                            >
                              {referral.status === 'active' ? (
                                <CheckCircle className="w-3 h-3 mr-1" />
                              ) : (
                                <Clock className="w-3 h-3 mr-1" />
                              )}
                              {referral.status === 'active' ? t('history.activated') : t('history.pending')}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="text-sm font-mono text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                              {referral.address}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyAddress(referral.address)}
                              className="h-6 w-6 p-0"
                            >
                              {copiedAddress === referral.address ? (
                                <Check className="h-3 w-3 text-green-500" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/user/${referral.address}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          {t('network.viewProfile')}
                        </Link>
                        {referral.status === 'pending' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleActivate(referral.address)}
                            disabled={activatingWallet === referral.address}
                            className="border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400"
                          >
                            {activatingWallet === referral.address ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <Zap className="w-4 h-4 mr-1" />
                                {t('history.checkCGC')}
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <Wallet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="text-gray-500 dark:text-gray-400">{t('history.connected')}</p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {date} {time}
                            </p>
                          </div>
                        </div>

                        {referral.status === 'active' && activatedAt && (
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                              <p className="text-gray-500 dark:text-gray-400">{t('history.activatedAt')}</p>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {activatedAt.date} {activatedAt.time}
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                            <Coins className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          </div>
                          <div>
                            <p className="text-gray-500 dark:text-gray-400">{t('history.cgcEarned')}</p>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {referral.cgcEarned} CGC
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">{t('history.noReferrals')}</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              {t('history.shareLink')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RewardsTab() {
  const t = useTranslations('referrals');
  const tBonus = useTranslations('referrals.signupBonus');
  const { address } = useAccount();
  const [bonusStatus, setBonusStatus] = useState<{
    eligible: boolean;
    received: boolean;
    amount: number;
    txHash?: string;
  } | null>(null);
  const [commissions, setCommissions] = useState<{
    totalSignupCommissions: number;
    level1Earnings: number;
    level2Earnings: number;
    level3Earnings: number;
  } | null>(null);
  const [isLoadingBonus, setIsLoadingBonus] = useState(false);

  // Fetch signup bonus status
  useEffect(() => {
    if (!address) return;

    const fetchBonusData = async () => {
      setIsLoadingBonus(true);
      try {
        // Fetch bonus status
        const statusRes = await fetch(`/api/referrals/bonus?wallet=${address}`);
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          if (statusData.success) {
            setBonusStatus({
              eligible: statusData.data.eligible,
              received: statusData.data.received,
              amount: statusData.data.bonusAmount || 200,
              txHash: statusData.data.txHash,
            });
          }
        }

        // Fetch commission summary
        const commRes = await fetch(`/api/referrals/bonus?wallet=${address}&type=commissions`);
        if (commRes.ok) {
          const commData = await commRes.json();
          if (commData.success) {
            setCommissions(commData.data);
          }
        }
      } catch (error) {
        console.error('Error fetching bonus data:', error);
      } finally {
        setIsLoadingBonus(false);
      }
    };

    fetchBonusData();
  }, [address]);

  return (
    <div className="space-y-6">
      {/* Signup Bonus Section */}
      <Card className="glass-panel border-2 border-green-200 dark:border-green-800">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
            <Sparkles className="h-5 w-5 text-green-500" />
            <span>{tBonus('title')}</span>
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
              NEW
            </Badge>
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            {tBonus('description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* New User Bonus Info */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                <Gift className="h-6 w-6 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">{tBonus('newUserBonus')}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{tBonus('newUserBonusDesc')}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">200 CGC</p>
              </div>
            </div>

            {/* User's Bonus Status */}
            {isLoadingBonus ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading status...
              </div>
            ) : bonusStatus && (
              <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-700">
                <div className="flex items-center gap-2">
                  {bonusStatus.received ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-sm font-medium text-green-700 dark:text-green-300">
                        {tBonus('bonusReceived')}
                      </span>
                      {bonusStatus.txHash && (
                        <a
                          href={`https://basescan.org/tx/${bonusStatus.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-auto text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                        >
                          {tBonus('viewOnExplorer')}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </>
                  ) : bonusStatus.eligible ? (
                    <>
                      <Clock className="h-5 w-5 text-amber-500" />
                      <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                        {tBonus('bonusPending')}
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-gray-400" />
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {tBonus('bonusNotEligible')}
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Referrer Commissions */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              {tBonus('commissions')}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{tBonus('commissionsDesc')}</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center">1</div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{tBonus('level1Commission')}</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">{tBonus('level1Desc')}</p>
                {commissions && (
                  <p className="mt-2 text-lg font-bold text-blue-600 dark:text-blue-400">
                    {commissions.level1Earnings} CGC
                  </p>
                )}
              </div>

              <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full bg-purple-500 text-white text-xs font-bold flex items-center justify-center">2</div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{tBonus('level2Commission')}</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">{tBonus('level2Desc')}</p>
                {commissions && (
                  <p className="mt-2 text-lg font-bold text-purple-600 dark:text-purple-400">
                    {commissions.level2Earnings} CGC
                  </p>
                )}
              </div>

              <div className="p-3 rounded-lg bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full bg-cyan-500 text-white text-xs font-bold flex items-center justify-center">3</div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{tBonus('level3Commission')}</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">{tBonus('level3Desc')}</p>
                {commissions && (
                  <p className="mt-2 text-lg font-bold text-cyan-600 dark:text-cyan-400">
                    {commissions.level3Earnings} CGC
                  </p>
                )}
              </div>
            </div>

            {/* Total Commissions */}
            {commissions && commissions.totalSignupCommissions > 0 && (
              <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Coins className="h-5 w-5 text-amber-500" />
                    <span className="font-medium text-gray-900 dark:text-white">{tBonus('totalEarned')}</span>
                  </div>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                    {commissions.totalSignupCommissions} CGC
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Total Distribution Info */}
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">{tBonus('totalDistribution')}</span>
              <span className="font-medium text-gray-900 dark:text-white">235 CGC max</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{tBonus('totalDistributionDesc')}</p>
          </div>
        </CardContent>
      </Card>

      {/* Reward Structure */}
      <Card className="glass-panel">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
            <Gift className="h-5 w-5 text-green-500" />
            <span>{t('rewards.title')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <RewardTierCard
              level={1}
              title={t('rewards.level1Title')}
              description={t('rewards.level1Desc')}
              percentage={10}
              color="blue"
            />
            <RewardTierCard
              level={2}
              title={t('rewards.level2Title')}
              description={t('rewards.level2Desc')}
              percentage={5}
              color="purple"
            />
            <RewardTierCard
              level={3}
              title={t('rewards.level3Title')}
              description={t('rewards.level3Desc')}
              percentage={2.5}
              color="cyan"
            />
          </div>
        </CardContent>
      </Card>

      {/* Milestone Bonuses */}
      <Card className="glass-panel">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
            <Award className="h-5 w-5 text-amber-500" />
            <span>{t('rewards.bonusTitle')}</span>
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            {t('rewards.bonusDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <MilestoneCard milestone={5} bonus={50} />
            <MilestoneCard milestone={10} bonus={150} />
            <MilestoneCard milestone={25} bonus={500} />
            <MilestoneCard milestone={50} bonus={1500} />
            <MilestoneCard milestone={100} bonus={5000} />
          </div>
        </CardContent>
      </Card>

      {/* Reward History */}
      <Card className="glass-panel">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            <span>{t('history.title')}</span>
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            {t('history.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {t('history.noHistory')}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Wrapper component that fetches leaderboard data from API
function LeaderboardTabWithData() {
  const { address } = useAccount();
  const { leaderboard, isLoading, userPosition, refetch } = useReferralLeaderboard({
    wallet: address,
    limit: 20,
  });

  // Convert API data to local format
  const formattedLeaderboard: LeaderboardEntry[] = leaderboard.map(entry => ({
    rank: entry.rank,
    address: entry.addressShort,
    referrals: entry.totalReferrals,
    earned: entry.totalEarnings,
  }));

  if (isLoading) {
    return (
      <Card className="glass-panel">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </CardContent>
      </Card>
    );
  }

  return <LeaderboardTab leaderboard={formattedLeaderboard} userPosition={userPosition} />;
}

function LeaderboardTab({ leaderboard, userPosition }: { leaderboard: LeaderboardEntry[]; userPosition?: any }) {
  const t = useTranslations('referrals');

  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
          <Trophy className="h-5 w-5 text-amber-500" />
          <span>{t('leaderboard.title')}</span>
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400">
          {t('leaderboard.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* User Position Banner */}
        {userPosition && userPosition.rank > 0 && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700 dark:text-blue-300">
                Your Position: #{userPosition.rank}
              </span>
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                {userPosition.totalEarnings} CGC earned
              </span>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-slate-700">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                  {t('leaderboard.rank')}
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                  {t('leaderboard.referrer')}
                </th>
                <th className="text-center py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                  {t('leaderboard.referrals')}
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                  {t('leaderboard.earned')}
                </th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.length > 0 ? (
                leaderboard.map((entry) => (
                  <tr
                    key={entry.rank}
                    className="border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        {entry.rank <= 3 && (
                          <span className={`text-lg ${
                            entry.rank === 1 ? 'text-amber-500' :
                            entry.rank === 2 ? 'text-gray-400' :
                            'text-amber-700'
                          }`}>
                            {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
                          </span>
                        )}
                        <span className="font-medium text-gray-900 dark:text-white">
                          #{entry.rank}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-sm text-gray-700 dark:text-gray-300">
                        {entry.address}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                        {entry.referrals}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {entry.earned} CGC
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-500 dark:text-gray-400">
                    No referrers yet. Be the first to start building your network!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ===== HELPER COMPONENTS =====

function StatCard({
  title,
  value,
  icon,
  trend
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend: string;
}) {
  return (
    <Card className="glass-panel">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="p-2 rounded-lg bg-gray-100 dark:bg-slate-800">
            {icon}
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">{trend}</span>
        </div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
      </CardContent>
    </Card>
  );
}

function NetworkLevelCard({
  level,
  count,
  percentage
}: {
  level: number;
  count: number;
  percentage: number;
}) {
  const colors = {
    1: 'from-blue-500 to-blue-600',
    2: 'from-purple-500 to-purple-600',
    3: 'from-cyan-500 to-cyan-600',
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-slate-800">
      <div className="flex items-center space-x-3">
        <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${colors[level as keyof typeof colors]} flex items-center justify-center text-white text-sm font-bold`}>
          {level}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">Level {level}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{percentage}% commission</p>
        </div>
      </div>
      <span className="text-lg font-bold text-gray-900 dark:text-white">{count}</span>
    </div>
  );
}

function StepCard({
  step,
  title,
  description,
  icon
}: {
  step: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-start space-x-4 p-3 rounded-lg bg-gray-50 dark:bg-slate-800">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
        {step}
      </div>
      <div className="flex-1">
        <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
          {icon}
          {title}
        </h4>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
      </div>
    </div>
  );
}

function RewardTierCard({
  level,
  title,
  description,
  percentage,
  color
}: {
  level: number;
  title: string;
  description: string;
  percentage: number;
  color: 'blue' | 'purple' | 'cyan';
}) {
  const colors = {
    blue: 'from-blue-500 to-blue-600 border-blue-200 dark:border-blue-800',
    purple: 'from-purple-500 to-purple-600 border-purple-200 dark:border-purple-800',
    cyan: 'from-cyan-500 to-cyan-600 border-cyan-200 dark:border-cyan-800',
  };

  return (
    <div className={`p-4 rounded-xl border ${colors[color]} bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900`}>
      <div className="flex items-center justify-between mb-2">
        <Badge className={`bg-gradient-to-r ${colors[color]} text-white border-0`}>
          Level {level}
        </Badge>
        <span className="text-2xl font-bold text-gray-900 dark:text-white">{percentage}%</span>
      </div>
      <h4 className="font-medium text-gray-900 dark:text-white">{title}</h4>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
    </div>
  );
}

function MilestoneCard({
  milestone,
  bonus
}: {
  milestone: number;
  bonus: number;
}) {
  return (
    <div className="text-center p-4 rounded-xl border border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-900/10">
      <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 flex items-center justify-center">
        <Star className="h-6 w-6 text-white" />
      </div>
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{milestone} Referrals</p>
      <p className="text-lg font-bold text-amber-600 dark:text-amber-400">+{bonus} CGC</p>
    </div>
  );
}
