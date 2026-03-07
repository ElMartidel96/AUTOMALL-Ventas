'use client';

/**
 * MetaConnectionPanel — Facebook & WhatsApp Integration
 *
 * Profile tab for connecting Facebook Page + WhatsApp Catalog.
 * - Connect/disconnect Facebook page via OAuth
 * - Auto-publish settings (new listings, sold)
 * - Product Feed URL for WhatsApp Catalog
 * - Recent publication log with engagement metrics
 * - Engagement summary card
 */

import React, { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import {
  Facebook,
  Check,
  X,
  Copy,
  ExternalLink,
  Settings,
  Rss,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Link2Off,
  MessageCircle,
} from 'lucide-react';
import {
  useMetaConnection,
  useMetaSettings,
  useMetaDisconnect,
  useMetaPages,
  useMetaSelectPage,
} from '@/hooks/useMetaConnection';
import { useSyncEngagement } from '@/hooks/useEngagement';
import { EngagementMetrics, EngagementSummaryCard } from './EngagementMetrics';

interface Props {
  walletAddress: string;
}

export function MetaConnectionPanel({ walletAddress }: Props) {
  const t = useTranslations('meta');
  const searchParams = useSearchParams();
  const status = searchParams.get('status');

  const { data, isLoading } = useMetaConnection(walletAddress);
  const settingsMutation = useMetaSettings(walletAddress);
  const disconnectMutation = useMetaDisconnect(walletAddress);
  const { data: pagesData, refetch: fetchPages } = useMetaPages();
  const selectPageMutation = useMetaSelectPage(walletAddress);
  const syncEngagement = useSyncEngagement(walletAddress);

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

  const copy = useCallback((text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }, []);

  const handleConnect = () => {
    window.location.href = `/api/meta/oauth/init?wallet=${walletAddress}`;
  };

  const handleDisconnect = async () => {
    await disconnectMutation.mutateAsync();
    setShowDisconnectConfirm(false);
  };

  const handleSettingToggle = (key: string, value: boolean | string) => {
    settingsMutation.mutate({ [key]: value });
  };

  const handlePageSelection = async () => {
    await fetchPages();
  };

  const selectPage = async (pageId: string) => {
    await selectPageMutation.mutateAsync(pageId);
  };

  const handleSyncEngagement = () => {
    syncEngagement.mutate({});
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="glass-crystal-enhanced rounded-2xl h-32" />
        <div className="glass-crystal-enhanced rounded-2xl h-48" />
      </div>
    );
  }

  const connected = data?.connected ?? false;
  const conn = data?.connection;
  const feedUrl = data?.feedUrl;
  const publications = data?.recentPublications ?? [];
  const engagementSummary = data?.engagementSummary ?? null;

  // Post type label helper
  const getPostTypeLabel = (postType: string) => {
    switch (postType) {
      case 'new_listing': return t('postTypeNew');
      case 'sold': return t('postTypeSold');
      case 'manual': return t('postTypeManual');
      case 'repost': return t('postTypeRepost');
      default: return postType;
    }
  };

  // Page selection mode
  if (status === 'select_page') {
    return (
      <div className="space-y-6">
        <div className="glass-crystal-enhanced rounded-2xl p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            {t('selectPage')}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('selectPageDesc')}</p>

          {!pagesData?.pages?.length && (
            <button
              onClick={handlePageSelection}
              className="px-4 py-2 rounded-xl bg-[#1877F2] text-white font-bold hover:bg-[#1665D8] transition-colors"
            >
              {t('loadPages')}
            </button>
          )}

          {pagesData?.pages?.map((page) => (
            <button
              key={page.id}
              onClick={() => selectPage(page.id)}
              disabled={selectPageMutation.isPending}
              className="w-full flex items-center gap-3 p-4 rounded-xl glass-card hover:bg-gray-50 dark:hover:bg-white/5 transition-colors mb-2"
            >
              <Facebook className="w-5 h-5 text-[#1877F2]" />
              <div className="text-left">
                <p className="font-semibold text-gray-900 dark:text-white">{page.name}</p>
                {page.category && (
                  <p className="text-xs text-gray-500">{page.category}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status banner for OAuth callback results */}
      {status === 'success' && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <CheckCircle2 className="w-5 h-5 text-am-green" />
          <span className="text-sm font-medium text-green-700 dark:text-green-300">{t('connectSuccess')}</span>
        </div>
      )}
      {status === 'denied' && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
          <AlertCircle className="w-5 h-5 text-yellow-500" />
          <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">{t('connectDenied')}</span>
        </div>
      )}
      {status === 'error' && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <XCircle className="w-5 h-5 text-red-500" />
          <span className="text-sm font-medium text-red-700 dark:text-red-300">{t('connectError')}</span>
        </div>
      )}

      {/* ── Connection Status Card ── */}
      <div className="glass-crystal-enhanced rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              connected
                ? 'bg-gradient-to-br from-[#1877F2] to-[#0E5FC7]'
                : 'bg-gray-200 dark:bg-gray-700'
            }`}>
              <Facebook className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">{t('title')}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('subtitle')}</p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-bold ${
            connected
              ? 'bg-green-100 dark:bg-green-900/30 text-am-green'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
          }`}>
            {connected ? t('connected') : t('notConnected')}
          </div>
        </div>

        {connected && conn ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Facebook className="w-4 h-4 text-[#1877F2]" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{conn.fb_page_name}</span>
              <span className="text-xs text-gray-400">
                {t('connectedSince', { date: new Date(conn.connected_at).toLocaleDateString() })}
              </span>
            </div>
            {showDisconnectConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-500">{t('confirmDisconnect')}</span>
                <button
                  onClick={handleDisconnect}
                  disabled={disconnectMutation.isPending}
                  className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-500 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowDisconnectConfirm(false)}
                  className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowDisconnectConfirm(true)}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                <Link2Off className="w-3.5 h-3.5" />
                {t('disconnect')}
              </button>
            )}
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('connectDesc')}</p>
            <button
              onClick={handleConnect}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1877F2] text-white font-bold hover:bg-[#1665D8] transition-colors shadow-lg shadow-[#1877F2]/20"
            >
              <Facebook className="w-4 h-4" />
              {t('connectButton')}
            </button>
          </div>
        )}
      </div>

      {/* ── Engagement Summary Card ── */}
      {connected && engagementSummary && engagementSummary.total_posts > 0 && (
        <EngagementSummaryCard
          totalLikes={engagementSummary.total_likes}
          totalComments={engagementSummary.total_comments}
          totalShares={engagementSummary.total_shares}
          totalReactions={engagementSummary.total_reactions}
          totalPosts={engagementSummary.total_posts}
          onSync={handleSyncEngagement}
          isSyncing={syncEngagement.isPending}
        />
      )}

      {/* ── Settings Card (only when connected) ── */}
      {connected && conn && (
        <div className="glass-crystal-enhanced rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-[#1877F2]" />
            <h3 className="font-bold text-gray-900 dark:text-white">{t('settingsTitle')}</h3>
          </div>

          <div className="space-y-4">
            <ToggleSetting
              label={t('autoPublishActive')}
              description={t('autoPublishActiveDesc')}
              checked={conn.auto_publish_on_active}
              onChange={(v) => handleSettingToggle('auto_publish_on_active', v)}
              disabled={settingsMutation.isPending}
            />
            <ToggleSetting
              label={t('autoPublishSold')}
              description={t('autoPublishSoldDesc')}
              checked={conn.auto_publish_on_sold}
              onChange={(v) => handleSettingToggle('auto_publish_on_sold', v)}
              disabled={settingsMutation.isPending}
            />
            <ToggleSetting
              label={t('includePrice')}
              description={t('includePriceDesc')}
              checked={conn.include_price}
              onChange={(v) => handleSettingToggle('include_price', v)}
              disabled={settingsMutation.isPending}
            />
            <ToggleSetting
              label={t('includeHashtags')}
              description={t('includeHashtagsDesc')}
              checked={conn.include_hashtags}
              onChange={(v) => handleSettingToggle('include_hashtags', v)}
              disabled={settingsMutation.isPending}
            />
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{t('captionLanguage')}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('captionLanguageDesc')}</p>
              </div>
              <select
                value={conn.caption_language}
                onChange={(e) => handleSettingToggle('caption_language', e.target.value)}
                disabled={settingsMutation.isPending}
                className="text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-1.5"
              >
                <option value="both">{t('langBoth')}</option>
                <option value="en">{t('langEn')}</option>
                <option value="es">{t('langEs')}</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ── Product Feed URL Card ── */}
      {feedUrl && (
        <div className="glass-crystal-enhanced rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Rss className="w-5 h-5 text-am-orange" />
            <h3 className="font-bold text-gray-900 dark:text-white">{t('feedTitle')}</h3>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{t('feedDesc')}</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 font-mono text-xs text-gray-600 dark:text-gray-400 truncate">
              {feedUrl}
            </div>
            <button
              onClick={() => copy(feedUrl, 'feed')}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              {copiedField === 'feed' ? (
                <Check className="w-4 h-4 text-am-green" />
              ) : (
                <Copy className="w-4 h-4 text-gray-500" />
              )}
            </button>
            <a
              href={feedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-gray-500" />
            </a>
          </div>
          <div className="mt-3 flex items-start gap-2">
            <MessageCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('feedWhatsappHint')}</p>
          </div>
        </div>
      )}

      {/* ── Recent Publications Log ── */}
      {connected && publications.length > 0 && (
        <div className="glass-crystal-enhanced rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-gray-400" />
            <h3 className="font-bold text-gray-900 dark:text-white">{t('recentTitle')}</h3>
          </div>

          <div className="space-y-2">
            {publications.map((pub) => (
              <div
                key={pub.id}
                className="flex flex-col gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/30"
              >
                <div className="flex items-center gap-3">
                  {pub.status === 'published' ? (
                    <CheckCircle2 className="w-4 h-4 text-am-green flex-shrink-0" />
                  ) : pub.status === 'failed' ? (
                    <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  ) : (
                    <Clock className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {pub.caption.split('\n').slice(0, 2).join(' ')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {getPostTypeLabel(pub.post_type)}
                      {' · '}
                      {new Date(pub.created_at).toLocaleDateString()}
                    </p>
                    {pub.error_message && (
                      <p className="text-xs text-red-400 mt-0.5">{pub.error_message}</p>
                    )}
                  </div>
                  {pub.fb_post_id && (
                    <a
                      href={`https://facebook.com/${pub.fb_post_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                    </a>
                  )}
                </div>
                {/* Inline engagement for published posts */}
                {pub.status === 'published' && pub.fb_post_id && (
                  <div className="pl-7">
                    <EngagementMetrics
                      likes={0}
                      comments={0}
                      shares={0}
                      reactions={0}
                      compact
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Toggle Component
// ─────────────────────────────────────────────

function ToggleSetting({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        disabled={disabled}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          checked ? 'bg-[#1877F2]' : 'bg-gray-300 dark:bg-gray-600'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
