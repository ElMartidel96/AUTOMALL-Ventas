'use client';

import { useTranslations } from 'next-intl';
import { Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import type { CRMLead } from '@/hooks/useCRM';
import { LeadCard } from './LeadCard';

interface Props {
  leads: CRMLead[];
  total: number;
  page: number;
  totalPages: number;
  search: string;
  statusFilter: string;
  sourceFilter: string;
  onSearchChange: (search: string) => void;
  onStatusFilter: (status: string) => void;
  onSourceFilter: (source: string) => void;
  onPageChange: (page: number) => void;
  onLeadClick: (lead: CRMLead) => void;
  isLoading?: boolean;
}

export function LeadList({
  leads,
  total,
  page,
  totalPages,
  search,
  statusFilter,
  sourceFilter,
  onSearchChange,
  onStatusFilter,
  onSourceFilter,
  onPageChange,
  onLeadClick,
  isLoading,
}: Props) {
  const t = useTranslations('crm');

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="glass-crystal-enhanced rounded-xl p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-am-green/50"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => onStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
          >
            <option value="">{t('allStatuses')}</option>
            <option value="new">{t('status.new')}</option>
            <option value="contacted">{t('status.contacted')}</option>
            <option value="qualified">{t('status.qualified')}</option>
            <option value="negotiating">{t('status.negotiating')}</option>
            <option value="won">{t('status.won')}</option>
            <option value="lost">{t('status.lost')}</option>
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => onSourceFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
          >
            <option value="">{t('allSources')}</option>
            <option value="manual">{t('source.manual')}</option>
            <option value="facebook">{t('source.facebook')}</option>
            <option value="whatsapp">{t('source.whatsapp')}</option>
            <option value="website">{t('source.website')}</option>
            <option value="referral">{t('source.referral')}</option>
            <option value="phone">{t('source.phone')}</option>
            <option value="walk_in">{t('source.walk_in')}</option>
          </select>

          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Filter className="w-3.5 h-3.5" />
            {total} {t('results')}
          </div>
        </div>
      </div>

      {/* Lead Cards */}
      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          ))}
        </div>
      ) : leads.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 dark:text-gray-500">{t('noLeads')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onClick={() => onLeadClick(lead)} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4 text-gray-500" />
          </button>
          <span className="text-sm text-gray-500">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      )}
    </div>
  );
}
