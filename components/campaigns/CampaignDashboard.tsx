'use client';

/**
 * Campaign Dashboard — List + Stats + Actions
 *
 * Shows all campaigns with status, metrics, and quick actions.
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useAccount } from '@/lib/thirdweb';
import type { Campaign, CampaignStatus } from '@/lib/campaigns/types';

const STATUS_FILTERS: Array<{ value: CampaignStatus | 'all'; labelKey: string }> = [
  { value: 'all', labelKey: 'filterAll' },
  { value: 'active', labelKey: 'filterActive' },
  { value: 'draft', labelKey: 'filterDraft' },
  { value: 'paused', labelKey: 'filterPaused' },
  { value: 'completed', labelKey: 'filterCompleted' },
];

const STATUS_EMOJI: Record<string, string> = {
  draft: '📝', active: '✅', paused: '⏸', completed: '🏁', archived: '📦',
};

const FB_STATUS_EMOJI: Record<string, string> = {
  published: '📱', unpublished: '', publishing: '⏳', failed: '❌',
};

interface Props {
  onCreateNew: () => void;
}

export function CampaignDashboard({ onCreateNew }: Props) {
  const t = useTranslations('campaigns');
  const { address } = useAccount();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<CampaignStatus | 'all'>('all');
  const [publishing, setPublishing] = useState<string | null>(null);

  const fetchCampaigns = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    try {
      const res = await fetch('/api/campaigns', {
        headers: { 'x-wallet-address': address },
      });
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns || []);
      }
    } catch (err) {
      console.error('Failed to fetch campaigns:', err);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const handlePublish = async (campaignId: string) => {
    if (!address || publishing) return;
    setPublishing(campaignId);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/publish`, {
        method: 'POST',
        headers: { 'x-wallet-address': address },
      });
      if (res.ok) {
        await fetchCampaigns();
      } else {
        const data = await res.json();
        alert(data.error || 'Publish failed');
      }
    } catch {
      alert('Network error');
    } finally {
      setPublishing(null);
    }
  };

  const handleToggleStatus = async (campaignId: string, newStatus: CampaignStatus) => {
    if (!address) return;
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': address,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        await fetchCampaigns();
      }
    } catch (err) {
      console.error('Status toggle failed:', err);
    }
  };

  const filtered = filter === 'all'
    ? campaigns
    : campaigns.filter(c => c.status === filter);

  const stats = {
    total: campaigns.length,
    active: campaigns.filter(c => c.status === 'active').length,
    published: campaigns.filter(c => c.fb_publish_status === 'published').length,
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-am-orange border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: t('statTotal'), value: stats.total, color: 'text-am-blue' },
          { label: t('statActive'), value: stats.active, color: 'text-am-green' },
          { label: t('statPublished'), value: stats.published, color: 'text-am-orange' },
        ].map((stat, i) => (
          <div key={i} className="glass-card p-4 text-center">
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUS_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === f.value
                ? 'bg-am-orange text-white'
                : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20'
            }`}
          >
            {t(f.labelKey)}
          </button>
        ))}
      </div>

      {/* Campaign List */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {campaigns.length === 0 ? t('noCampaigns') : t('noFilterMatch')}
          </p>
          {campaigns.length === 0 && (
            <button
              onClick={onCreateNew}
              className="px-6 py-2 bg-am-orange hover:bg-am-orange-light text-white rounded-xl font-medium transition-colors"
            >
              {t('createFirst')}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(campaign => (
            <div
              key={campaign.id}
              className="glass-card p-4 hover:border-am-orange/30 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span>{STATUS_EMOJI[campaign.status] || ''}</span>
                    <span>{FB_STATUS_EMOJI[campaign.fb_publish_status] || ''}</span>
                    <h3 className="font-bold text-gray-900 dark:text-white truncate">
                      {campaign.name}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {campaign.vehicle_ids.length} {t('vehicles')} •{' '}
                    {campaign.daily_budget_usd ? `$${campaign.daily_budget_usd}/${t('day')}` : t('noBudget')}
                  </p>
                  {campaign.landing_slug && (
                    <a
                      href={`/w/${campaign.landing_slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-am-blue dark:text-am-blue-light hover:underline mt-1 inline-block"
                    >
                      🔗 /w/{campaign.landing_slug}
                    </a>
                  )}
                </div>

                <div className="flex gap-2 ml-3 flex-shrink-0">
                  {campaign.fb_publish_status !== 'published' && campaign.status !== 'archived' && (
                    <button
                      onClick={() => handlePublish(campaign.id)}
                      disabled={publishing === campaign.id}
                      className="px-3 py-1.5 bg-[#1877F2] hover:bg-[#166FE5] text-white text-xs rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      {publishing === campaign.id ? '...' : 'FB'}
                    </button>
                  )}
                  {campaign.status === 'active' && (
                    <button
                      onClick={() => handleToggleStatus(campaign.id, 'paused')}
                      className="px-3 py-1.5 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 text-xs rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                    >
                      {t('pause')}
                    </button>
                  )}
                  {campaign.status === 'paused' && (
                    <button
                      onClick={() => handleToggleStatus(campaign.id, 'active')}
                      className="px-3 py-1.5 bg-am-green/20 text-am-green text-xs rounded-lg font-medium hover:bg-am-green/30 transition-colors"
                    >
                      {t('resume')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
