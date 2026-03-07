'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';

interface Props {
  onSubmit: (data: LeadFormData) => void;
  onCancel: () => void;
  initialData?: Partial<LeadFormData>;
  isLoading?: boolean;
}

export interface LeadFormData {
  name: string;
  phone: string;
  email: string;
  whatsapp: string;
  source: string;
  interest_level: string;
  notes: string;
  budget_min: number | undefined;
  budget_max: number | undefined;
}

export function LeadForm({ onSubmit, onCancel, initialData, isLoading }: Props) {
  const t = useTranslations('crm');

  const [form, setForm] = useState<LeadFormData>({
    name: initialData?.name || '',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    whatsapp: initialData?.whatsapp || '',
    source: initialData?.source || 'manual',
    interest_level: initialData?.interest_level || 'warm',
    notes: initialData?.notes || '',
    budget_min: initialData?.budget_min,
    budget_max: initialData?.budget_max,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSubmit(form);
  };

  const inputClass = 'w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-am-green/50';
  const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

  return (
    <div className="glass-crystal-enhanced rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900 dark:text-white">
          {initialData ? t('editLead') : t('newLead')}
        </h3>
        <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>{t('form.name')} *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={inputClass}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>{t('form.phone')}</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className={inputClass}
              placeholder="+1 (555) 000-0000"
            />
          </div>
          <div>
            <label className={labelClass}>{t('form.email')}</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>{t('form.whatsapp')}</label>
          <input
            type="tel"
            value={form.whatsapp}
            onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
            className={inputClass}
            placeholder="+1 (555) 000-0000"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>{t('form.source')}</label>
            <select
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
              className={inputClass}
            >
              <option value="manual">{t('source.manual')}</option>
              <option value="facebook">{t('source.facebook')}</option>
              <option value="whatsapp">{t('source.whatsapp')}</option>
              <option value="website">{t('source.website')}</option>
              <option value="referral">{t('source.referral')}</option>
              <option value="phone">{t('source.phone')}</option>
              <option value="walk_in">{t('source.walk_in')}</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>{t('form.interestLevel')}</label>
            <select
              value={form.interest_level}
              onChange={(e) => setForm({ ...form, interest_level: e.target.value })}
              className={inputClass}
            >
              <option value="hot">{t('interest.hot')}</option>
              <option value="warm">{t('interest.warm')}</option>
              <option value="cold">{t('interest.cold')}</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>{t('form.budgetMin')}</label>
            <input
              type="number"
              value={form.budget_min ?? ''}
              onChange={(e) => setForm({ ...form, budget_min: e.target.value ? Number(e.target.value) : undefined })}
              className={inputClass}
              placeholder="$5,000"
            />
          </div>
          <div>
            <label className={labelClass}>{t('form.budgetMax')}</label>
            <input
              type="number"
              value={form.budget_max ?? ''}
              onChange={(e) => setForm({ ...form, budget_max: e.target.value ? Number(e.target.value) : undefined })}
              className={inputClass}
              placeholder="$25,000"
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>{t('form.notes')}</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className={`${inputClass} resize-none`}
            rows={3}
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {t('form.cancel')}
          </button>
          <button
            type="submit"
            disabled={isLoading || !form.name.trim()}
            className="px-4 py-2 rounded-lg bg-am-green hover:bg-am-green/80 text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {isLoading ? t('form.saving') : t('form.save')}
          </button>
        </div>
      </form>
    </div>
  );
}
