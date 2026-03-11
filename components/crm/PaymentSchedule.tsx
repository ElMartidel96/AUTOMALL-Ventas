'use client';

import { useTranslations } from 'next-intl';
import { CheckCircle, Clock, AlertTriangle, XCircle } from 'lucide-react';
import type { CRMPayment } from '@/lib/crm/types';

interface Props {
  payments: CRMPayment[];
  onRecordPayment: (payment: CRMPayment) => void;
  isRecording?: boolean;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; style: string }> = {
  paid: {
    icon: <CheckCircle className="w-4 h-4" />,
    style: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  },
  pending: {
    icon: <Clock className="w-4 h-4" />,
    style: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  overdue: {
    icon: <AlertTriangle className="w-4 h-4" />,
    style: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
  partial: {
    icon: <Clock className="w-4 h-4" />,
    style: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  },
  cancelled: {
    icon: <XCircle className="w-4 h-4" />,
    style: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
  },
};

export function PaymentSchedule({ payments, onRecordPayment, isRecording }: Props) {
  const t = useTranslations('deals');

  if (payments.length === 0) {
    return (
      <div className="text-center py-6 text-gray-400 text-sm">
        {t('noPayments')}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">#</th>
            <th className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">{t('dueDate')}</th>
            <th className="text-right py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">{t('amount')}</th>
            <th className="text-center py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">{t('paymentStatus')}</th>
            <th className="text-left py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">{t('paidDate')}</th>
            <th className="text-center py-2 px-3 text-gray-500 dark:text-gray-400 font-medium">{t('action')}</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => {
            const config = STATUS_CONFIG[payment.status] || STATUS_CONFIG.pending;
            const isPayable = payment.status === 'pending' || payment.status === 'overdue';

            return (
              <tr
                key={payment.id}
                className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/30"
              >
                <td className="py-2.5 px-3 text-gray-600 dark:text-gray-300">
                  {payment.payment_number}
                </td>
                <td className="py-2.5 px-3 text-gray-600 dark:text-gray-300">
                  {new Date(payment.due_date + 'T12:00:00').toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </td>
                <td className="py-2.5 px-3 text-right font-medium text-gray-900 dark:text-white">
                  {formatCurrency(Number(payment.amount))}
                </td>
                <td className="py-2.5 px-3">
                  <div className="flex items-center justify-center">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${config.style}`}>
                      {config.icon}
                      {t(`paymentStatusLabel.${payment.status}`)}
                    </span>
                  </div>
                </td>
                <td className="py-2.5 px-3 text-gray-500 dark:text-gray-400">
                  {payment.paid_date
                    ? new Date(payment.paid_date + 'T12:00:00').toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })
                    : '—'
                  }
                </td>
                <td className="py-2.5 px-3 text-center">
                  {isPayable && (
                    <button
                      onClick={() => onRecordPayment(payment)}
                      disabled={isRecording}
                      className="text-xs font-medium text-am-green hover:text-am-green/80 disabled:opacity-50 transition-colors"
                    >
                      {t('recordPayment')}
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
