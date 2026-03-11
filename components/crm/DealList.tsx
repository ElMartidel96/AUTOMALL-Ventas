'use client';

import { useTranslations } from 'next-intl';
import { Search, Filter, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import type { CRMDeal, DealStatus, FinancingType } from '@/lib/crm/types';
import { DealCard } from './DealCard';

interface Props {
  deals: CRMDeal[];
  total: number;
  page: number;
  totalPages: number;
  search: string;
  statusFilter: string;
  financingFilter: string;
  onSearchChange: (search: string) => void;
  onStatusFilter: (status: string) => void;
  onFinancingFilter: (financing: string) => void;
  onPageChange: (page: number) => void;
  onDealClick: (deal: CRMDeal) => void;
  onExport: () => void;
  isExporting?: boolean;
  isLoading?: boolean;
}

export function DealList({
  deals,
  total,
  page,
  totalPages,
  search,
  statusFilter,
  financingFilter,
  onSearchChange,
  onStatusFilter,
  onFinancingFilter,
  onPageChange,
  onDealClick,
  onExport,
  isExporting,
  isLoading,
}: Props) {
  const t = useTranslations('deals');

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
            <option value="active">{t('status.active')}</option>
            <option value="completed">{t('status.completed')}</option>
            <option value="default">{t('status.default')}</option>
            <option value="cancelled">{t('status.cancelled')}</option>
          </select>

          <select
            value={financingFilter}
            onChange={(e) => onFinancingFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
          >
            <option value="">{t('allFinancing')}</option>
            <option value="cash">{t('financing.cash')}</option>
            <option value="in_house">{t('financing.in_house')}</option>
            <option value="external">{t('financing.external')}</option>
          </select>

          <button
            onClick={onExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            title={t('exportExcel')}
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Excel</span>
          </button>

          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Filter className="w-3.5 h-3.5" />
            {total} {t('results')}
          </div>
        </div>
      </div>

      {/* Deal Cards */}
      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          ))}
        </div>
      ) : deals.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 dark:text-gray-500">{t('noDeals')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} onClick={() => onDealClick(deal)} />
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
