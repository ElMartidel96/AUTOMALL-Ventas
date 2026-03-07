'use client';

/**
 * CampaignDashboard — List & manage campaigns
 *
 * Shows all campaigns for the authenticated seller with:
 * - Status badges (draft, active, paused, completed)
 * - Lead counts
 * - Quick actions (copy landing URL, open, pause)
 * - Campaign builder trigger
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  Plus,
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
  Users,
  BarChart3,
  Pause,
  Play,
  Trash2,
  Calendar,
  DollarSign,
  Loader2,
  Megaphone,
  Facebook,
  ThumbsUp,
  MessageSquare,
  Share2,
  Eye,
} from 'lucide-react';

interface CampaignSummary {
  id: string;
  name: string;
  type: string;
  status: string;
  headline_en: string;
  headline_es: string;
  daily_budget_usd: number;
  start_date: string;
  end_date: string | null;
  landing_slug: string;
  vehicle_ids: string[];
  lead_count: number;
  created_at: string;
  fb_publish_status?: string | null;
  fb_published_at?: string | null;
  fb_post_ids?: string[];
}

interface FBMetrics {
  likes: number;
  comments: number;
  shares: number;
  page_views: number;
  whatsapp_clicks: number;
}

interface Props {
  walletAddress: string;
  lang: 'en' | 'es';
  onCreateNew: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 dark:bg-gray-800 text-gray-500',
  active: 'bg-green-100 dark:bg-green-900/30 text-am-green',
  paused: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600',
  completed: 'bg-blue-100 dark:bg-blue-900/30 text-am-blue',
  archived: 'bg-gray-100 dark:bg-gray-800 text-gray-400',
};

const TYPE_LABELS: Record<string, { en: string; es: string }> = {
  inventory_showcase: { en: 'Inventory', es: 'Inventario' },
  seasonal_promo: { en: 'Seasonal', es: 'Temporal' },
  clearance: { en: 'Clearance', es: 'Liquidacion' },
  financing: { en: 'Financing', es: 'Financiamiento' },
  trade_in: { en: 'Trade-In', es: 'Intercambio' },
  custom: { en: 'Custom', es: 'Personalizado' },
};

export function CampaignDashboard({ walletAddress, lang, onCreateNew }: Props) {
  const t = useTranslations('campaigns');
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [metricsMap, setMetricsMap] = useState<Record<string, FBMetrics>>({});

  const domain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'autosmall.org';

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/campaigns?wallet=${walletAddress}`);
        if (res.ok) {
          const data = await res.json();
          setCampaigns(data.campaigns || []);
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [walletAddress]);

  const copyUrl = useCallback(
    (slug: string, id: string) => {
      navigator.clipboard.writeText(`https://${domain}/w/${slug}`);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    },
    [domain]
  );

  const updateStatus = async (campaignId: string, newStatus: string) => {
    try {
      await fetch(`/api/campaigns/${campaignId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: walletAddress, status: newStatus }),
      });
      setCampaigns((prev) =>
        prev.map((c) => (c.id === campaignId ? { ...c, status: newStatus } : c))
      );
    } catch {
      // Silently fail
    }
  };

  const deleteCampaign = async (campaignId: string) => {
    try {
      await fetch(`/api/campaigns/${campaignId}?wallet=${walletAddress}`, {
        method: 'DELETE',
      });
      setCampaigns((prev) => prev.filter((c) => c.id !== campaignId));
    } catch {
      // Silently fail
    }
  };

  const publishToFacebook = async (campaignId: string) => {
    setPublishingId(campaignId);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: walletAddress }),
      });
      if (res.ok) {
        setCampaigns((prev) =>
          prev.map((c) =>
            c.id === campaignId
              ? { ...c, fb_publish_status: 'published', fb_published_at: new Date().toISOString() }
              : c
          )
        );
        // Load metrics for this campaign
        loadCampaignMetrics(campaignId);
      }
    } catch {
      // Silently fail
    } finally {
      setPublishingId(null);
    }
  };

  const loadCampaignMetrics = async (campaignId: string) => {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/publications?wallet=${walletAddress}`);
      if (res.ok) {
        const data = await res.json();
        const pubs = data.publications || [];
        const events = data.events || {};

        let totalLikes = 0, totalComments = 0, totalShares = 0;
        for (const pub of pubs) {
          if (pub.engagement) {
            totalLikes += pub.engagement.likes || 0;
            totalComments += pub.engagement.comments || 0;
            totalShares += pub.engagement.shares || 0;
          }
        }

        setMetricsMap((prev) => ({
          ...prev,
          [campaignId]: {
            likes: totalLikes,
            comments: totalComments,
            shares: totalShares,
            page_views: events.page_view || 0,
            whatsapp_clicks: events.whatsapp_click || 0,
          },
        }));
      }
    } catch {
      // Silently fail
    }
  };

  // Load metrics for published campaigns
  useEffect(() => {
    for (const c of campaigns) {
      if (c.fb_publish_status === 'published') {
        loadCampaignMetrics(c.id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaigns.length]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-am-orange animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-am-orange" />
            {t('dashboardTitle')}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboardDesc')}</p>
        </div>
        <button
          onClick={onCreateNew}
          className="flex items-center gap-2 bg-am-orange hover:bg-am-orange-dark text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('newCampaign')}
        </button>
      </div>

      {/* Empty State */}
      {campaigns.length === 0 && (
        <div className="glass-crystal-enhanced rounded-2xl p-12 text-center">
          <Megaphone className="w-16 h-16 text-am-orange/50 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            {t('noCampaigns')}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
            {t('noCampaignsDesc')}
          </p>
          <button
            onClick={onCreateNew}
            className="inline-flex items-center gap-2 bg-am-orange hover:bg-am-orange-dark text-white font-bold px-6 py-3 rounded-xl transition-colors"
          >
            <Plus className="w-5 h-5" />
            {t('createFirst')}
          </button>
        </div>
      )}

      {/* Campaign List */}
      <div className="space-y-3">
        {campaigns.map((campaign) => (
          <div
            key={campaign.id}
            className="glass-crystal-enhanced rounded-2xl p-5 hover:ring-1 hover:ring-gray-200 dark:hover:ring-gray-700 transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-gray-900 dark:text-white truncate">
                    {campaign.name}
                  </h3>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[campaign.status] || STATUS_COLORS.draft}`}
                  >
                    {t(`status_${campaign.status}`)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 flex items-center gap-3">
                  <span>
                    {TYPE_LABELS[campaign.type]?.[lang] || campaign.type}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(campaign.created_at).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />${campaign.daily_budget_usd}/{lang === 'es' ? 'día' : 'day'}
                  </span>
                </p>
              </div>

              {/* Lead Count Badge */}
              <div className="flex items-center gap-1.5 bg-am-green/10 text-am-green px-3 py-1.5 rounded-full">
                <Users className="w-4 h-4" />
                <span className="text-sm font-bold">{campaign.lead_count}</span>
                <span className="text-xs">{lang === 'es' ? 'leads' : 'leads'}</span>
              </div>
            </div>

            {/* Landing URL */}
            {campaign.landing_slug && (
              <div className="flex items-center gap-2 mb-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg px-3 py-2">
                <MessageCircle className="w-4 h-4 text-[#25D366] flex-shrink-0" />
                <code className="text-xs text-gray-600 dark:text-gray-400 font-mono truncate flex-1">
                  {domain}/w/{campaign.landing_slug}
                </code>
                <button
                  onClick={() => copyUrl(campaign.landing_slug, campaign.id)}
                  className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  {copiedId === campaign.id ? (
                    <Check className="w-3.5 h-3.5 text-am-green" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-gray-400" />
                  )}
                </button>
                <a
                  href={`/w/${campaign.landing_slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                </a>
              </div>
            )}

            {/* FB Metrics Row */}
            {metricsMap[campaign.id] && (
              <div className="flex items-center gap-4 mb-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" /> {metricsMap[campaign.id].page_views}
                  <span className="hidden sm:inline">{lang === 'es' ? 'visitas' : 'views'}</span>
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" /> {metricsMap[campaign.id].whatsapp_clicks}
                  <span className="hidden sm:inline">WhatsApp</span>
                </span>
                {metricsMap[campaign.id].likes > 0 && (
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="w-3.5 h-3.5 text-[#1877F2]" /> {metricsMap[campaign.id].likes}
                  </span>
                )}
                {metricsMap[campaign.id].comments > 0 && (
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5 text-[#1877F2]" /> {metricsMap[campaign.id].comments}
                  </span>
                )}
                {metricsMap[campaign.id].shares > 0 && (
                  <span className="flex items-center gap-1">
                    <Share2 className="w-3.5 h-3.5 text-[#1877F2]" /> {metricsMap[campaign.id].shares}
                  </span>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              {campaign.status === 'draft' && (
                <button
                  onClick={() => updateStatus(campaign.id, 'active')}
                  className="flex items-center gap-1 text-xs text-am-green hover:bg-green-50 dark:hover:bg-green-900/20 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Play className="w-3.5 h-3.5" /> {t('activate')}
                </button>
              )}
              {campaign.status === 'active' && (
                <button
                  onClick={() => updateStatus(campaign.id, 'paused')}
                  className="flex items-center gap-1 text-xs text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Pause className="w-3.5 h-3.5" /> {t('pause')}
                </button>
              )}
              {campaign.status === 'paused' && (
                <button
                  onClick={() => updateStatus(campaign.id, 'active')}
                  className="flex items-center gap-1 text-xs text-am-green hover:bg-green-50 dark:hover:bg-green-900/20 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Play className="w-3.5 h-3.5" /> {t('resume')}
                </button>
              )}

              {/* Publish to Facebook button */}
              {!campaign.fb_publish_status && campaign.status !== 'draft' && (
                <button
                  onClick={() => publishToFacebook(campaign.id)}
                  disabled={publishingId === campaign.id}
                  className="flex items-center gap-1 text-xs text-[#1877F2] hover:bg-blue-50 dark:hover:bg-blue-900/20 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                >
                  {publishingId === campaign.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Facebook className="w-3.5 h-3.5" />
                  )}
                  {lang === 'es' ? 'Publicar en FB' : 'Post to FB'}
                </button>
              )}
              {campaign.fb_publish_status === 'published' && (
                <span className="flex items-center gap-1 text-xs text-[#1877F2] bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg">
                  <Facebook className="w-3.5 h-3.5" />
                  <Check className="w-3 h-3" />
                  {lang === 'es' ? 'Publicado' : 'Published'}
                </span>
              )}
              {campaign.fb_publish_status === 'failed' && (
                <button
                  onClick={() => publishToFacebook(campaign.id)}
                  disabled={publishingId === campaign.id}
                  className="flex items-center gap-1 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Facebook className="w-3.5 h-3.5" />
                  {lang === 'es' ? 'Reintentar FB' : 'Retry FB'}
                </button>
              )}

              {campaign.status === 'draft' && (
                <button
                  onClick={() => deleteCampaign(campaign.id)}
                  className="flex items-center gap-1 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> {t('delete')}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
