'use client';

import { useTranslations } from 'next-intl';
import { ArrowLeft, Pencil, Trash2, User, Car, DollarSign, CreditCard, Settings } from 'lucide-react';
import { useDeal, useUpdateDeal, useDeleteDeal, useRecordPayment } from '@/hooks/useDeals';
import { PaymentSchedule } from './PaymentSchedule';
import type { CRMDeal, CRMPayment, DealStatus } from '@/lib/crm/types';

interface Props {
  dealId: string;
  walletAddress: string;
  onBack: () => void;
  onEdit: (deal: CRMDeal) => void;
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

export function DealDetail({ dealId, walletAddress, onBack, onEdit }: Props) {
  const t = useTranslations('deals');
  const { data, isLoading } = useDeal(walletAddress, dealId);
  const updateDeal = useUpdateDeal(walletAddress);
  const deleteDeal = useDeleteDeal(walletAddress);
  const recordPayment = useRecordPayment(walletAddress);

  if (isLoading || !data) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl" />
      </div>
    );
  }

  const { deal, payments } = data;

  const handleStatusChange = async (newStatus: DealStatus) => {
    if (newStatus === 'cancelled' && !confirm(t('confirmCancel'))) return;
    await updateDeal.mutateAsync({ id: deal.id, data: { deal_status: newStatus } });
  };

  const handleDelete = async () => {
    if (!confirm(t('confirmDelete'))) return;
    await deleteDeal.mutateAsync(deal.id);
    onBack();
  };

  const handleRecordPayment = async (payment: CRMPayment) => {
    await recordPayment.mutateAsync({
      dealId: deal.id,
      paymentId: payment.id,
      data: { status: 'paid' },
    });
  };

  const progressPercent = deal.financing_type !== 'cash' && Number(deal.financed_amount) > 0
    ? Math.min((Number(deal.total_collected) / Number(deal.financed_amount)) * 100, 100)
    : deal.financing_type === 'cash' ? 100 : 0;

  const finTypeLabel: Record<string, string> = {
    cash: t('financing.cash'),
    in_house: t('financing.in_house'),
    external: t('financing.external'),
  };

  const freqLabel: Record<string, string> = {
    weekly: t('frequency.weekly'),
    biweekly: t('frequency.biweekly'),
    monthly: t('frequency.monthly'),
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">{t('back')}</span>
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(deal)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Pencil className="w-4 h-4 text-gray-500" />
          </button>
          <button
            onClick={handleDelete}
            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </button>
        </div>
      </div>

      {/* Status + Title */}
      <div className="glass-panel p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{deal.client_name}</h1>
            <p className="text-gray-500 dark:text-gray-400">
              {deal.vehicle_year} {deal.vehicle_brand} {deal.vehicle_model}
              {deal.vehicle_color && ` • ${deal.vehicle_color}`}
            </p>
          </div>
          <span className={`text-sm font-medium px-3 py-1 rounded-full ${STATUS_STYLES[deal.deal_status] || ''}`}>
            {t(`status.${deal.deal_status}`)}
          </span>
        </div>

        {/* Status controls */}
        <div className="flex flex-wrap gap-2">
          {deal.deal_status === 'active' && (
            <>
              <button
                onClick={() => handleStatusChange('completed')}
                className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 transition-colors"
              >
                {t('markCompleted')}
              </button>
              <button
                onClick={() => handleStatusChange('default')}
                className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 transition-colors"
              >
                {t('markDefault')}
              </button>
              <button
                onClick={() => handleStatusChange('cancelled')}
                className="text-xs px-3 py-1.5 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 transition-colors"
              >
                {t('markCancelled')}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Client Info */}
        <div className="glass-crystal-enhanced rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3 text-gray-700 dark:text-gray-300">
            <User className="w-4 h-4" />
            <h3 className="font-medium text-sm">{t('clientInfo')}</h3>
          </div>
          <dl className="space-y-2 text-sm">
            {deal.client_phone && <div><dt className="text-gray-400 text-xs">{t('form.phone')}</dt><dd className="text-gray-900 dark:text-white">{deal.client_phone}</dd></div>}
            {deal.client_email && <div><dt className="text-gray-400 text-xs">{t('form.email')}</dt><dd className="text-gray-900 dark:text-white">{deal.client_email}</dd></div>}
            {deal.client_whatsapp && <div><dt className="text-gray-400 text-xs">WhatsApp</dt><dd className="text-gray-900 dark:text-white">{deal.client_whatsapp}</dd></div>}
            {deal.referred_by && <div><dt className="text-gray-400 text-xs">{t('form.referredBy')}</dt><dd className="text-gray-900 dark:text-white">{deal.referred_by}</dd></div>}
          </dl>
        </div>

        {/* Vehicle Info */}
        <div className="glass-crystal-enhanced rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3 text-gray-700 dark:text-gray-300">
            <Car className="w-4 h-4" />
            <h3 className="font-medium text-sm">{t('vehicleInfo')}</h3>
          </div>
          <dl className="space-y-2 text-sm">
            <div><dt className="text-gray-400 text-xs">{t('form.vehicle')}</dt><dd className="text-gray-900 dark:text-white">{deal.vehicle_year} {deal.vehicle_brand} {deal.vehicle_model}</dd></div>
            {deal.vehicle_color && <div><dt className="text-gray-400 text-xs">{t('form.color')}</dt><dd className="text-gray-900 dark:text-white">{deal.vehicle_color}</dd></div>}
            {deal.vehicle_vin && <div><dt className="text-gray-400 text-xs">VIN</dt><dd className="text-gray-900 dark:text-white font-mono text-xs">{deal.vehicle_vin}</dd></div>}
            {deal.vehicle_mileage && <div><dt className="text-gray-400 text-xs">{t('form.mileage')}</dt><dd className="text-gray-900 dark:text-white">{deal.vehicle_mileage.toLocaleString()} mi</dd></div>}
          </dl>
        </div>

        {/* Financial Info */}
        <div className="glass-crystal-enhanced rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3 text-gray-700 dark:text-gray-300">
            <DollarSign className="w-4 h-4" />
            <h3 className="font-medium text-sm">{t('financialInfo')}</h3>
          </div>
          <dl className="space-y-2 text-sm">
            <div><dt className="text-gray-400 text-xs">{t('form.salePrice')}</dt><dd className="text-gray-900 dark:text-white font-bold">{formatCurrency(Number(deal.sale_price))}</dd></div>
            <div><dt className="text-gray-400 text-xs">{t('form.downPayment')}</dt><dd className="text-gray-900 dark:text-white">{formatCurrency(Number(deal.down_payment))}</dd></div>
            {deal.financing_type !== 'cash' && (
              <div><dt className="text-gray-400 text-xs">{t('form.financedAmount')}</dt><dd className="text-gray-900 dark:text-white">{formatCurrency(Number(deal.financed_amount))}</dd></div>
            )}
            <div><dt className="text-gray-400 text-xs">{t('form.financingType')}</dt><dd className="text-gray-900 dark:text-white">{finTypeLabel[deal.financing_type]}</dd></div>
            {deal.sale_date && <div><dt className="text-gray-400 text-xs">{t('form.saleDate')}</dt><dd className="text-gray-900 dark:text-white">{new Date(deal.sale_date + 'T12:00:00').toLocaleDateString()}</dd></div>}
          </dl>
        </div>

        {/* Financing Details (only for financed) */}
        {deal.financing_type !== 'cash' && (
          <div className="glass-crystal-enhanced rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3 text-gray-700 dark:text-gray-300">
              <CreditCard className="w-4 h-4" />
              <h3 className="font-medium text-sm">{t('financingDetails')}</h3>
            </div>
            <dl className="space-y-2 text-sm">
              <div><dt className="text-gray-400 text-xs">{t('form.installments')}</dt><dd className="text-gray-900 dark:text-white">{deal.num_installments}</dd></div>
              {deal.installment_amount && <div><dt className="text-gray-400 text-xs">{t('form.installmentAmount')}</dt><dd className="text-gray-900 dark:text-white">{formatCurrency(Number(deal.installment_amount))}</dd></div>}
              <div><dt className="text-gray-400 text-xs">{t('form.frequency')}</dt><dd className="text-gray-900 dark:text-white">{freqLabel[deal.payment_frequency]}</dd></div>
              {deal.finance_company && <div><dt className="text-gray-400 text-xs">{t('form.financeCompany')}</dt><dd className="text-gray-900 dark:text-white">{deal.finance_company}</dd></div>}
            </dl>
            {/* Progress */}
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">{t('collected')}: {formatCurrency(Number(deal.total_collected))}</span>
                <span className="text-gray-400">{t('outstanding')}: {formatCurrency(Number(deal.outstanding_balance))}</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-am-green rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Extras */}
      {(deal.gps_installed || deal.commission || deal.notes) && (
        <div className="glass-crystal-enhanced rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3 text-gray-700 dark:text-gray-300">
            <Settings className="w-4 h-4" />
            <h3 className="font-medium text-sm">{t('extras')}</h3>
          </div>
          <dl className="space-y-2 text-sm">
            {deal.gps_installed && <div><dt className="text-gray-400 text-xs">GPS</dt><dd className="text-gray-900 dark:text-white">{t('gpsInstalled')}</dd></div>}
            {Number(deal.commission) > 0 && <div><dt className="text-gray-400 text-xs">{t('form.commission')}</dt><dd className="text-gray-900 dark:text-white">{formatCurrency(Number(deal.commission))}</dd></div>}
            {deal.notes && <div><dt className="text-gray-400 text-xs">{t('form.notes')}</dt><dd className="text-gray-900 dark:text-white whitespace-pre-wrap">{deal.notes}</dd></div>}
          </dl>
        </div>
      )}

      {/* Payment Schedule */}
      {deal.financing_type !== 'cash' && payments.length > 0 && (
        <div className="glass-panel p-4">
          <h3 className="font-medium text-gray-900 dark:text-white mb-3">{t('paymentScheduleTitle')}</h3>
          <PaymentSchedule
            payments={payments}
            onRecordPayment={handleRecordPayment}
            isRecording={recordPayment.isPending}
          />
        </div>
      )}
    </div>
  );
}
