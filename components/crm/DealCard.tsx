'use client';

import { useTranslations } from 'next-intl';
import { Car, DollarSign, Calendar } from 'lucide-react';
import type { CRMDeal } from '@/lib/crm/types';

interface Props {
  deal: CRMDeal;
  onClick: () => void;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  default: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  cancelled: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

const FINANCING_LABELS: Record<string, string> = {
  cash: 'Cash',
  in_house: 'In-House',
  external: 'External',
};

export function DealCard({ deal, onClick }: Props) {
  const t = useTranslations('deals');

  const paidCount = deal.financing_type === 'cash' ? deal.num_installments : undefined;
  const progressPercent = deal.financing_type !== 'cash' && deal.financed_amount > 0
    ? Math.min((Number(deal.total_collected) / Number(deal.financed_amount)) * 100, 100)
    : deal.financing_type === 'cash' ? 100 : 0;

  return (
    <button
      onClick={onClick}
      className="w-full text-left glass-crystal-enhanced rounded-xl p-4 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Client + Status */}
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
              {deal.client_name}
            </h3>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${STATUS_STYLES[deal.deal_status] || ''}`}>
              {t(`status.${deal.deal_status}`)}
            </span>
          </div>

          {/* Vehicle */}
          <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 mb-2">
            <Car className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">
              {deal.vehicle_year} {deal.vehicle_brand} {deal.vehicle_model}
            </span>
          </div>

          {/* Price + Financing */}
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1 text-gray-900 dark:text-white font-medium">
              <DollarSign className="w-3.5 h-3.5" />
              {formatCurrency(Number(deal.sale_price))}
            </div>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {FINANCING_LABELS[deal.financing_type] || deal.financing_type}
            </span>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Calendar className="w-3 h-3" />
              {new Date(deal.sale_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
          </div>

          {/* Payment progress bar (only for financed) */}
          {deal.financing_type !== 'cash' && deal.num_installments > 0 && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                <span>{formatCurrency(Number(deal.total_collected))} / {formatCurrency(Number(deal.financed_amount))}</span>
                <span>{Math.round(progressPercent)}%</span>
              </div>
              <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-am-green rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right: type indicator for non-cash */}
        {deal.financing_type !== 'cash' && paidCount === undefined && (
          <div className="text-right text-xs text-gray-400 whitespace-nowrap">
            {deal.num_installments} {t('payments')}
          </div>
        )}
      </div>
    </button>
  );
}
