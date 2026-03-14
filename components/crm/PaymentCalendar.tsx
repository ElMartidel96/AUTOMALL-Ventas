'use client';

/**
 * PaymentCalendar — Pick Payment tracking subsection
 *
 * Shows all pending payments grouped by urgency:
 *   1. OVERDUE (red) — past due date
 *   2. TODAY (orange) — due today
 *   3. UPCOMING (green) — future dates
 *
 * Quick-mark buttons to record payments inline.
 * Integrates with deal-service via useRecordPayment hook.
 */

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Phone,
  Car,
  ChevronDown,
  ChevronUp,
  Loader2,
  RefreshCw,
} from 'lucide-react';

interface CalendarPayment {
  id: string;
  deal_id: string;
  payment_number: number;
  due_date: string;
  amount: number;
  paid_amount: number;
  paid_date: string | null;
  status: string;
  payment_method: string | null;
  client_name: string;
  client_phone: string | null;
  client_whatsapp: string | null;
  vehicle_brand: string;
  vehicle_model: string;
  vehicle_year: number;
  deal_status: string;
  installment_amount: number | null;
}

interface PaymentGroup {
  payments: CalendarPayment[];
  total: number;
  count: number;
}

interface CalendarData {
  date: string;
  view: string;
  overdue: PaymentGroup;
  today: PaymentGroup;
  upcoming: PaymentGroup;
  summary: {
    total_due_today: number;
    total_overdue: number;
    total_upcoming: number;
    overdue_count: number;
    today_count: number;
    upcoming_count: number;
  };
}

interface Props {
  data: CalendarData | undefined;
  isLoading: boolean;
  onRecordPayment: (payment: CalendarPayment) => void;
  isRecording: boolean;
  recordingPaymentId: string | null;
  onRefresh: () => void;
  onDealClick: (dealId: string) => void;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function daysOverdue(dueDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate + 'T12:00:00');
  due.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
}

// ── Payment Card ──
function PaymentCard({
  payment,
  variant,
  onRecord,
  isRecording,
  isThisRecording,
  onDealClick,
  t,
}: {
  payment: CalendarPayment;
  variant: 'overdue' | 'today' | 'upcoming';
  onRecord: (p: CalendarPayment) => void;
  isRecording: boolean;
  isThisRecording: boolean;
  onDealClick: (dealId: string) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const borderColors = {
    overdue: 'border-l-red-500',
    today: 'border-l-am-orange',
    upcoming: 'border-l-am-green',
  };

  const days = variant === 'overdue' ? daysOverdue(payment.due_date) : 0;

  return (
    <div
      className={`glass-card p-4 border-l-4 ${borderColors[variant]} hover:shadow-md transition-shadow`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: Client + Vehicle info */}
        <div className="flex-1 min-w-0">
          <button
            onClick={() => onDealClick(payment.deal_id)}
            className="text-left group"
          >
            <h4 className="font-semibold text-gray-900 dark:text-white truncate group-hover:text-am-blue-light transition-colors">
              {payment.client_name}
            </h4>
          </button>
          <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 dark:text-gray-400">
            <Car className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">
              {payment.vehicle_brand} {payment.vehicle_model} {payment.vehicle_year}
            </span>
          </div>
          {payment.client_phone && (
            <div className="flex items-center gap-2 mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              <Phone className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{payment.client_phone}</span>
            </div>
          )}
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
            <Calendar className="w-3 h-3" />
            <span>
              {t('calendar.paymentNum', { num: payment.payment_number })} · {formatDate(payment.due_date)}
            </span>
            {variant === 'overdue' && days > 0 && (
              <span className="text-red-500 font-medium">
                ({days} {t('calendar.daysLate')})
              </span>
            )}
          </div>
        </div>

        {/* Right: Amount + Action */}
        <div className="flex flex-col items-end gap-2">
          <span className="text-lg font-bold text-gray-900 dark:text-white">
            {formatCurrency(Number(payment.amount))}
          </span>
          {(payment.status === 'pending' || payment.status === 'overdue') && (
            <button
              onClick={() => onRecord(payment)}
              disabled={isRecording}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isThisRecording
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-wait'
                  : 'bg-am-green hover:bg-am-green/80 text-white shadow-sm hover:shadow'
              }`}
            >
              {isThisRecording ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle className="w-3.5 h-3.5" />
              )}
              {t('calendar.markPaid')}
            </button>
          )}
          {payment.status === 'paid' && (
            <span className="flex items-center gap-1 text-xs font-medium text-am-green">
              <CheckCircle className="w-3.5 h-3.5" />
              {t('calendar.paid')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Section ──
function PaymentSection({
  title,
  icon,
  payments,
  total,
  variant,
  defaultOpen,
  onRecord,
  isRecording,
  recordingPaymentId,
  onDealClick,
  t,
}: {
  title: string;
  icon: React.ReactNode;
  payments: CalendarPayment[];
  total: number;
  variant: 'overdue' | 'today' | 'upcoming';
  defaultOpen: boolean;
  onRecord: (p: CalendarPayment) => void;
  isRecording: boolean;
  recordingPaymentId: string | null;
  onDealClick: (dealId: string) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const [open, setOpen] = useState(defaultOpen);

  if (payments.length === 0) return null;

  const bgColors = {
    overdue: 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800',
    today: 'bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800',
    upcoming: 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800',
  };

  return (
    <div className={`rounded-xl border ${bgColors[variant]} overflow-hidden`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          {icon}
          <div className="text-left">
            <span className="font-semibold text-gray-900 dark:text-white">
              {title}
            </span>
            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
              ({payments.length})
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-bold text-gray-900 dark:text-white">
            {formatCurrency(total)}
          </span>
          {open ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          {payments.map((p) => (
            <PaymentCard
              key={p.id}
              payment={p}
              variant={variant}
              onRecord={onRecord}
              isRecording={isRecording}
              isThisRecording={recordingPaymentId === p.id}
              onDealClick={onDealClick}
              t={t}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Component ──
export function PaymentCalendar({
  data,
  isLoading,
  onRecordPayment,
  isRecording,
  recordingPaymentId,
  onRefresh,
  onDealClick,
}: Props) {
  const t = useTranslations('deals');

  if (isLoading) {
    return (
      <div className="glass-panel p-12 text-center">
        <Loader2 className="w-8 h-8 mx-auto text-am-green animate-spin mb-3" />
        <p className="text-gray-500 dark:text-gray-400">{t('calendar.loading')}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="glass-panel p-12 text-center">
        <Calendar className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
        <p className="text-gray-500 dark:text-gray-400">{t('calendar.noData')}</p>
      </div>
    );
  }

  const { summary } = data;
  const totalDue = summary.total_overdue + summary.total_due_today;
  const hasPayments = summary.overdue_count + summary.today_count + summary.upcoming_count > 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card p-4 text-center">
          <AlertTriangle className="w-6 h-6 mx-auto text-red-500 mb-1" />
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{summary.overdue_count}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('calendar.overdue')}</p>
          <p className="text-sm font-semibold text-red-600 dark:text-red-400 mt-1">
            {formatCurrency(summary.total_overdue)}
          </p>
        </div>
        <div className="glass-card p-4 text-center">
          <Clock className="w-6 h-6 mx-auto text-am-orange mb-1" />
          <p className="text-2xl font-bold text-am-orange">{summary.today_count}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('calendar.dueToday')}</p>
          <p className="text-sm font-semibold text-am-orange mt-1">
            {formatCurrency(summary.total_due_today)}
          </p>
        </div>
        <div className="glass-card p-4 text-center">
          <Calendar className="w-6 h-6 mx-auto text-am-green mb-1" />
          <p className="text-2xl font-bold text-am-green">{summary.upcoming_count}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('calendar.upcoming')}</p>
          <p className="text-sm font-semibold text-am-green mt-1">
            {formatCurrency(summary.total_upcoming)}
          </p>
        </div>
        <div className="glass-card p-4 text-center">
          <DollarSign className="w-6 h-6 mx-auto text-am-blue-light mb-1" />
          <p className="text-2xl font-bold text-am-blue dark:text-am-blue-light">
            {formatCurrency(totalDue)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('calendar.totalDue')}</p>
          <button
            onClick={onRefresh}
            className="mt-1 text-xs text-am-blue-light hover:underline flex items-center gap-1 mx-auto"
          >
            <RefreshCw className="w-3 h-3" />
            {t('calendar.refresh')}
          </button>
        </div>
      </div>

      {/* Payment Sections */}
      {!hasPayments ? (
        <div className="glass-panel p-12 text-center">
          <CheckCircle className="w-12 h-12 mx-auto text-am-green mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            {t('calendar.allClear')}
          </h3>
          <p className="text-gray-500 dark:text-gray-400">{t('calendar.allClearDesc')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          <PaymentSection
            title={t('calendar.overdueTitle')}
            icon={<AlertTriangle className="w-5 h-5 text-red-500" />}
            payments={data.overdue.payments}
            total={data.overdue.total}
            variant="overdue"
            defaultOpen={true}
            onRecord={onRecordPayment}
            isRecording={isRecording}
            recordingPaymentId={recordingPaymentId}
            onDealClick={onDealClick}
            t={t}
          />
          <PaymentSection
            title={t('calendar.todayTitle')}
            icon={<Clock className="w-5 h-5 text-am-orange" />}
            payments={data.today.payments}
            total={data.today.total}
            variant="today"
            defaultOpen={true}
            onRecord={onRecordPayment}
            isRecording={isRecording}
            recordingPaymentId={recordingPaymentId}
            onDealClick={onDealClick}
            t={t}
          />
          <PaymentSection
            title={t('calendar.upcomingTitle')}
            icon={<Calendar className="w-5 h-5 text-am-green" />}
            payments={data.upcoming.payments}
            total={data.upcoming.total}
            variant="upcoming"
            defaultOpen={data.overdue.count === 0 && data.today.count === 0}
            onRecord={onRecordPayment}
            isRecording={isRecording}
            recordingPaymentId={recordingPaymentId}
            onDealClick={onDealClick}
            t={t}
          />
        </div>
      )}
    </div>
  );
}
