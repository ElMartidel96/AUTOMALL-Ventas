'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface Props {
  onSubmit: (data: { type: string; direction: string; summary: string; details?: string }) => void;
  isLoading?: boolean;
}

export function AddInteractionForm({ onSubmit, isLoading }: Props) {
  const t = useTranslations('crm');
  const [type, setType] = useState('note');
  const [direction, setDirection] = useState('internal');
  const [summary, setSummary] = useState('');
  const [details, setDetails] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary.trim()) return;
    onSubmit({ type, direction, summary: summary.trim(), details: details.trim() || undefined });
    setSummary('');
    setDetails('');
  };

  const inputClass = 'w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-am-green/50';

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/30">
      <div className="grid grid-cols-2 gap-3">
        <select value={type} onChange={(e) => setType(e.target.value)} className={inputClass}>
          <option value="call">{t('interactionType.call')}</option>
          <option value="whatsapp">{t('interactionType.whatsapp')}</option>
          <option value="email">{t('interactionType.email')}</option>
          <option value="sms">{t('interactionType.sms')}</option>
          <option value="facebook_message">{t('interactionType.facebook_message')}</option>
          <option value="test_drive">{t('interactionType.test_drive')}</option>
          <option value="walk_in">{t('interactionType.walk_in')}</option>
          <option value="note">{t('interactionType.note')}</option>
        </select>
        <select value={direction} onChange={(e) => setDirection(e.target.value)} className={inputClass}>
          <option value="internal">{t('direction.internal')}</option>
          <option value="inbound">{t('direction.inbound')}</option>
          <option value="outbound">{t('direction.outbound')}</option>
        </select>
      </div>

      <input
        type="text"
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        placeholder={t('form.interactionSummary')}
        className={inputClass}
        required
      />

      <textarea
        value={details}
        onChange={(e) => setDetails(e.target.value)}
        placeholder={t('form.interactionDetails')}
        className={`${inputClass} resize-none`}
        rows={2}
      />

      <button
        type="submit"
        disabled={isLoading || !summary.trim()}
        className="w-full px-4 py-2 rounded-lg bg-am-green hover:bg-am-green/80 text-white text-sm font-medium transition-colors disabled:opacity-50"
      >
        {isLoading ? t('form.saving') : t('form.addInteraction')}
      </button>
    </form>
  );
}
