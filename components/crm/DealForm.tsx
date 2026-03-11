'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import type { DealInsert, FinancingType, PaymentFrequency } from '@/lib/crm/types';

export type DealFormData = DealInsert;

interface Props {
  onSubmit: (data: DealFormData) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<DealFormData>;
  isLoading?: boolean;
}

export function DealForm({ onSubmit, onCancel, initialData, isLoading }: Props) {
  const t = useTranslations('deals');

  const [clientName, setClientName] = useState(initialData?.client_name || '');
  const [clientPhone, setClientPhone] = useState(initialData?.client_phone || '');
  const [clientEmail, setClientEmail] = useState(initialData?.client_email || '');
  const [clientWhatsapp, setClientWhatsapp] = useState(initialData?.client_whatsapp || '');
  const [referredBy, setReferredBy] = useState(initialData?.referred_by || '');

  const [vehicleBrand, setVehicleBrand] = useState(initialData?.vehicle_brand || '');
  const [vehicleModel, setVehicleModel] = useState(initialData?.vehicle_model || '');
  const [vehicleYear, setVehicleYear] = useState(initialData?.vehicle_year?.toString() || '');
  const [vehicleColor, setVehicleColor] = useState(initialData?.vehicle_color || '');
  const [vehicleVin, setVehicleVin] = useState(initialData?.vehicle_vin || '');
  const [vehicleMileage, setVehicleMileage] = useState(initialData?.vehicle_mileage?.toString() || '');

  const [saleDate, setSaleDate] = useState(initialData?.sale_date || new Date().toISOString().split('T')[0]);
  const [salePrice, setSalePrice] = useState(initialData?.sale_price?.toString() || '');
  const [downPayment, setDownPayment] = useState(initialData?.down_payment?.toString() || '0');

  const [financingType, setFinancingType] = useState<FinancingType>(initialData?.financing_type || 'cash');
  const [financeCompany, setFinanceCompany] = useState(initialData?.finance_company || '');
  const [numInstallments, setNumInstallments] = useState(initialData?.num_installments?.toString() || '');
  const [firstPaymentDate, setFirstPaymentDate] = useState(initialData?.first_payment_date || '');
  const [paymentFrequency, setPaymentFrequency] = useState<PaymentFrequency>(initialData?.payment_frequency || 'weekly');
  const [installmentAmount, setInstallmentAmount] = useState(initialData?.installment_amount?.toString() || '');

  const [gpsInstalled, setGpsInstalled] = useState(initialData?.gps_installed || false);
  const [commission, setCommission] = useState(initialData?.commission?.toString() || '');
  const [notes, setNotes] = useState(initialData?.notes || '');

  // Auto-calculate installment amount
  const calcInstallment = () => {
    const sp = parseFloat(salePrice) || 0;
    const dp = parseFloat(downPayment) || 0;
    const n = parseInt(numInstallments) || 0;
    if (n > 0 && sp > dp) {
      const amount = Math.round(((sp - dp) / n) * 100) / 100;
      setInstallmentAmount(amount.toString());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !vehicleBrand || !vehicleModel || !vehicleYear || !salePrice) return;

    const data: DealFormData = {
      client_name: clientName,
      vehicle_brand: vehicleBrand,
      vehicle_model: vehicleModel,
      vehicle_year: parseInt(vehicleYear),
      sale_price: parseFloat(salePrice),
      client_phone: clientPhone || undefined,
      client_email: clientEmail || undefined,
      client_whatsapp: clientWhatsapp || undefined,
      referred_by: referredBy || undefined,
      vehicle_color: vehicleColor || undefined,
      vehicle_vin: vehicleVin || undefined,
      vehicle_mileage: vehicleMileage ? parseInt(vehicleMileage) : undefined,
      sale_date: saleDate,
      down_payment: parseFloat(downPayment) || 0,
      financing_type: financingType,
      finance_company: financingType !== 'cash' ? (financeCompany || undefined) : undefined,
      num_installments: financingType !== 'cash' ? (parseInt(numInstallments) || 0) : 0,
      first_payment_date: financingType !== 'cash' ? (firstPaymentDate || undefined) : undefined,
      payment_frequency: financingType !== 'cash' ? paymentFrequency : undefined,
      installment_amount: financingType !== 'cash' ? (parseFloat(installmentAmount) || undefined) : undefined,
      gps_installed: gpsInstalled,
      commission: commission ? parseFloat(commission) : undefined,
      notes: notes || undefined,
    };

    await onSubmit(data);
  };

  const inputCls = 'w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-am-green/50';
  const labelCls = 'block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button type="button" onClick={onCancel} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">{t('back')}</span>
        </button>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          {initialData ? t('editDeal') : t('newDeal')}
        </h2>
      </div>

      {/* Section 1: Client */}
      <div className="glass-crystal-enhanced rounded-xl p-4">
        <h3 className="font-medium text-gray-900 dark:text-white mb-3">{t('clientInfo')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className={labelCls}>{t('form.clientName')} *</label>
            <input type="text" required value={clientName} onChange={(e) => setClientName(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>{t('form.phone')}</label>
            <input type="tel" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>{t('form.email')}</label>
            <input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>WhatsApp</label>
            <input type="tel" value={clientWhatsapp} onChange={(e) => setClientWhatsapp(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>{t('form.referredBy')}</label>
            <input type="text" value={referredBy} onChange={(e) => setReferredBy(e.target.value)} className={inputCls} />
          </div>
        </div>
      </div>

      {/* Section 2: Vehicle */}
      <div className="glass-crystal-enhanced rounded-xl p-4">
        <h3 className="font-medium text-gray-900 dark:text-white mb-3">{t('vehicleInfo')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>{t('form.brand')} *</label>
            <input type="text" required value={vehicleBrand} onChange={(e) => setVehicleBrand(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>{t('form.model')} *</label>
            <input type="text" required value={vehicleModel} onChange={(e) => setVehicleModel(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>{t('form.year')} *</label>
            <input type="number" required min="1990" max="2030" value={vehicleYear} onChange={(e) => setVehicleYear(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>{t('form.color')}</label>
            <input type="text" value={vehicleColor} onChange={(e) => setVehicleColor(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>VIN</label>
            <input type="text" maxLength={17} value={vehicleVin} onChange={(e) => setVehicleVin(e.target.value)} className={inputCls + ' font-mono'} />
          </div>
          <div>
            <label className={labelCls}>{t('form.mileage')}</label>
            <input type="number" value={vehicleMileage} onChange={(e) => setVehicleMileage(e.target.value)} className={inputCls} />
          </div>
        </div>
      </div>

      {/* Section 3: Sale */}
      <div className="glass-crystal-enhanced rounded-xl p-4">
        <h3 className="font-medium text-gray-900 dark:text-white mb-3">{t('saleInfo')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>{t('form.saleDate')}</label>
            <input type="date" value={saleDate} onChange={(e) => setSaleDate(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>{t('form.salePrice')} *</label>
            <input type="number" required min="1" step="0.01" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>{t('form.downPayment')}</label>
            <input type="number" min="0" step="0.01" value={downPayment} onChange={(e) => setDownPayment(e.target.value)} className={inputCls} />
          </div>
        </div>
      </div>

      {/* Section 4: Financing */}
      <div className="glass-crystal-enhanced rounded-xl p-4">
        <h3 className="font-medium text-gray-900 dark:text-white mb-3">{t('financingDetails')}</h3>
        <div className="mb-3">
          <label className={labelCls}>{t('form.financingType')}</label>
          <select
            value={financingType}
            onChange={(e) => setFinancingType(e.target.value as FinancingType)}
            className={inputCls}
          >
            <option value="cash">{t('financing.cash')}</option>
            <option value="in_house">{t('financing.in_house')}</option>
            <option value="external">{t('financing.external')}</option>
          </select>
        </div>

        {financingType !== 'cash' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {financingType === 'external' && (
              <div className="sm:col-span-2 lg:col-span-3">
                <label className={labelCls}>{t('form.financeCompany')}</label>
                <input type="text" value={financeCompany} onChange={(e) => setFinanceCompany(e.target.value)} className={inputCls} />
              </div>
            )}
            <div>
              <label className={labelCls}>{t('form.installments')}</label>
              <input type="number" min="1" value={numInstallments} onChange={(e) => setNumInstallments(e.target.value)} onBlur={calcInstallment} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>{t('form.firstPaymentDate')}</label>
              <input type="date" value={firstPaymentDate} onChange={(e) => setFirstPaymentDate(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>{t('form.frequency')}</label>
              <select value={paymentFrequency} onChange={(e) => setPaymentFrequency(e.target.value as PaymentFrequency)} className={inputCls}>
                <option value="weekly">{t('frequency.weekly')}</option>
                <option value="biweekly">{t('frequency.biweekly')}</option>
                <option value="monthly">{t('frequency.monthly')}</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>{t('form.installmentAmount')}</label>
              <input type="number" min="1" step="0.01" value={installmentAmount} onChange={(e) => setInstallmentAmount(e.target.value)} className={inputCls} />
            </div>
          </div>
        )}
      </div>

      {/* Section 5: Extras */}
      <div className="glass-crystal-enhanced rounded-xl p-4">
        <h3 className="font-medium text-gray-900 dark:text-white mb-3">{t('extras')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <input type="checkbox" id="gps" checked={gpsInstalled} onChange={(e) => setGpsInstalled(e.target.checked)} className="rounded border-gray-300" />
            <label htmlFor="gps" className="text-sm text-gray-700 dark:text-gray-300">{t('form.gpsInstalled')}</label>
          </div>
          <div>
            <label className={labelCls}>{t('form.commission')}</label>
            <input type="number" min="0" step="0.01" value={commission} onChange={(e) => setCommission(e.target.value)} className={inputCls} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>{t('form.notes')}</label>
            <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className={inputCls} />
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
          {t('cancel')}
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-2 bg-am-green hover:bg-am-green/80 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {initialData ? t('saveDeal') : t('createDeal')}
        </button>
      </div>
    </form>
  );
}
