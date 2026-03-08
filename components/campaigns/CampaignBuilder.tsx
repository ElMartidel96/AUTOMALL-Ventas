'use client';

/**
 * Campaign Builder — 5-step wizard
 *
 * 1. Campaign type (template selection)
 * 2. Vehicle selection (from active inventory)
 * 3. Ad copy (auto-generated, editable)
 * 4. Budget + duration
 * 5. Review + create/publish
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useAccount } from '@/lib/thirdweb';
import { getAllTemplates } from '@/lib/campaigns/campaign-templates';
import type { CampaignType, CampaignTemplate } from '@/lib/campaigns/types';

const templates = getAllTemplates();
const STEPS = 5;

interface VehicleOption {
  id: string;
  year: number;
  brand: string;
  model: string;
  trim: string | null;
  price: number;
  status: string;
}

interface Props {
  onCreated: () => void;
  onCancel: () => void;
}

export function CampaignBuilder({ onCreated, onCancel }: Props) {
  const t = useTranslations('campaigns');
  const { address } = useAccount();

  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<CampaignType | null>(null);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<string[]>([]);
  const [headlineEn, setHeadlineEn] = useState('');
  const [headlineEs, setHeadlineEs] = useState('');
  const [bodyEn, setBodyEn] = useState('');
  const [bodyEs, setBodyEs] = useState('');
  const [dailyBudget, setDailyBudget] = useState<string>('');
  const [duration, setDuration] = useState<string>('14');
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [loadingVehicles, setLoadingVehicles] = useState(false);

  const selectedTemplate = templates.find(t => t.type === selectedType) || null;

  // Load vehicles when entering step 2
  const loadVehicles = useCallback(async () => {
    if (!address) return;
    setLoadingVehicles(true);
    try {
      const res = await fetch(`/api/inventory?seller=${address}&status=active`);
      if (res.ok) {
        const data = await res.json();
        setVehicles((data.vehicles || []).map((v: VehicleOption) => ({
          id: v.id,
          year: v.year,
          brand: v.brand,
          model: v.model,
          trim: v.trim,
          price: v.price,
          status: v.status,
        })));
      }
    } catch (err) {
      console.error('Failed to load vehicles:', err);
    } finally {
      setLoadingVehicles(false);
    }
  }, [address]);

  useEffect(() => {
    if (step === 2) loadVehicles();
  }, [step, loadVehicles]);

  // Auto-generate copy when entering step 3
  useEffect(() => {
    if (step === 3 && selectedTemplate) {
      setHeadlineEn(selectedTemplate.default_headline_en);
      setHeadlineEs(selectedTemplate.default_headline_es);

      const selectedVNames = vehicles
        .filter(v => selectedVehicleIds.includes(v.id))
        .map(v => `${v.year} ${v.brand} ${v.model} — $${v.price.toLocaleString('en-US')}`)
        .join('\n');

      setBodyEn(`Check out these deals!\n\n${selectedVNames}\n\nMessage us on WhatsApp for details!`);
      setBodyEs(`Mira estas ofertas!\n\n${selectedVNames}\n\nEscribenos por WhatsApp para mas informacion!`);
    }
  }, [step, selectedTemplate, selectedVehicleIds, vehicles]);

  // Set default duration from template
  useEffect(() => {
    if (selectedTemplate) {
      setDuration(String(selectedTemplate.suggested_duration_days));
    }
  }, [selectedTemplate]);

  const toggleVehicle = (id: string) => {
    setSelectedVehicleIds(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : prev.length < 10
          ? [...prev, id]
          : prev
    );
  };

  const selectAll = () => {
    setSelectedVehicleIds(vehicles.slice(0, 10).map(v => v.id));
  };

  const handleCreate = async (publishFB: boolean) => {
    if (!address || !selectedType) return;
    setLoading(true);
    setPublishing(publishFB);

    try {
      // 1. Create campaign
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': address,
        },
        body: JSON.stringify({
          name: selectedTemplate?.name_en || 'Campaign',
          type: selectedType,
          vehicle_ids: selectedVehicleIds,
          headline_en: headlineEn,
          headline_es: headlineEs,
          body_en: bodyEn,
          body_es: bodyEs,
          daily_budget_usd: dailyBudget ? parseFloat(dailyBudget) : null,
          caption_language: 'both',
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to create campaign');
        return;
      }

      const { campaign } = await res.json();

      // 2. Optionally publish to FB
      if (publishFB && campaign.id) {
        try {
          const pubRes = await fetch(`/api/campaigns/${campaign.id}/publish`, {
            method: 'POST',
            headers: { 'x-wallet-address': address },
          });
          if (!pubRes.ok) {
            const pubData = await pubRes.json();
            alert(pubData.error || t('fbPublishFailed'));
          }
        } catch (pubErr) {
          console.error('FB publish failed:', pubErr);
          alert(t('fbPublishFailed'));
        }
      }

      onCreated();
    } catch (err) {
      console.error('Campaign creation failed:', err);
      alert('Failed to create campaign');
    } finally {
      setLoading(false);
      setPublishing(false);
    }
  };

  const canGoNext = (): boolean => {
    switch (step) {
      case 1: return selectedType !== null;
      case 2: return selectedVehicleIds.length > 0;
      case 3: return headlineEn.length > 0;
      case 4: return true;
      default: return false;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="flex items-center gap-2">
        {Array.from({ length: STEPS }, (_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i < step ? 'bg-am-orange' : 'bg-gray-200 dark:bg-white/10'
            }`}
          />
        ))}
        <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
          {step}/{STEPS}
        </span>
      </div>

      {/* Step 1: Campaign Type */}
      {step === 1 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            {t('step1Title')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {templates.map(tpl => (
              <button
                key={tpl.type}
                onClick={() => setSelectedType(tpl.type)}
                className={`p-4 rounded-xl text-left transition-all border ${
                  selectedType === tpl.type
                    ? 'border-am-orange bg-am-orange/10'
                    : 'border-gray-200 dark:border-white/10 hover:border-am-orange/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{tpl.emoji}</span>
                  <div>
                    <div className="font-bold text-gray-900 dark:text-white">{tpl.name_en}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{tpl.description_en}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Vehicle Selection */}
      {step === 2 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {t('step2Title')}
            </h2>
            <button
              onClick={selectAll}
              className="text-sm text-am-orange hover:underline"
            >
              {t('selectAll')}
            </button>
          </div>

          {loadingVehicles ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-am-orange border-t-transparent" />
            </div>
          ) : vehicles.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 py-8 text-center">
              {t('noActiveVehicles')}
            </p>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {vehicles.map(v => (
                <button
                  key={v.id}
                  onClick={() => toggleVehicle(v.id)}
                  className={`w-full p-3 rounded-xl text-left transition-all border flex items-center gap-3 ${
                    selectedVehicleIds.includes(v.id)
                      ? 'border-am-orange bg-am-orange/10'
                      : 'border-gray-200 dark:border-white/10 hover:border-am-orange/50'
                  }`}
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                    selectedVehicleIds.includes(v.id)
                      ? 'border-am-orange bg-am-orange'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    {selectedVehicleIds.includes(v.id) && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {v.year} {v.brand} {v.model}{v.trim ? ` ${v.trim}` : ''}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      ${v.price.toLocaleString('en-US')}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {selectedVehicleIds.length}/10 {t('selected')}
          </p>
        </div>
      )}

      {/* Step 3: Ad Copy */}
      {step === 3 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            {t('step3Title')}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Headline (EN)
              </label>
              <input
                type="text"
                value={headlineEn}
                onChange={e => setHeadlineEn(e.target.value.slice(0, 70))}
                maxLength={70}
                className="w-full px-3 py-2 bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-lg text-gray-900 dark:text-white"
              />
              <span className="text-xs text-gray-400">{headlineEn.length}/70</span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Headline (ES)
              </label>
              <input
                type="text"
                value={headlineEs}
                onChange={e => setHeadlineEs(e.target.value.slice(0, 70))}
                maxLength={70}
                className="w-full px-3 py-2 bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-lg text-gray-900 dark:text-white"
              />
              <span className="text-xs text-gray-400">{headlineEs.length}/70</span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Body (EN)
              </label>
              <textarea
                value={bodyEn}
                onChange={e => setBodyEn(e.target.value.slice(0, 2200))}
                rows={4}
                className="w-full px-3 py-2 bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-lg text-gray-900 dark:text-white resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Body (ES)
              </label>
              <textarea
                value={bodyEs}
                onChange={e => setBodyEs(e.target.value.slice(0, 2200))}
                rows={4}
                className="w-full px-3 py-2 bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-lg text-gray-900 dark:text-white resize-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Budget */}
      {step === 4 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            {t('step4Title')}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('dailyBudget')} (USD)
              </label>
              <input
                type="number"
                value={dailyBudget}
                onChange={e => setDailyBudget(e.target.value)}
                placeholder={selectedTemplate
                  ? `${t('recommended')}: $${selectedTemplate.suggested_daily_budget.min}-$${selectedTemplate.suggested_daily_budget.max}`
                  : '$15-25'}
                className="w-full px-3 py-2 bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-lg text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('duration')} ({t('days')})
              </label>
              <input
                type="number"
                value={duration}
                onChange={e => setDuration(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-lg text-gray-900 dark:text-white"
              />
            </div>
            {dailyBudget && duration && (
              <div className="glass-card p-3 text-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">{t('totalEstimate')}: </span>
                <span className="font-bold text-am-orange">
                  ${(parseFloat(dailyBudget) * parseInt(duration)).toLocaleString('en-US')}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 5: Review */}
      {step === 5 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            {t('step5Title')}
          </h2>
          <div className="glass-card p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{selectedTemplate?.emoji}</span>
              <span className="font-bold text-gray-900 dark:text-white">
                {selectedTemplate?.name_en}
              </span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              🚗 {selectedVehicleIds.length} {t('vehicles')} •{' '}
              💰 {dailyBudget ? `$${dailyBudget}/${t('day')}` : t('noBudget')} •{' '}
              📅 {duration} {t('days')}
            </div>
            <div className="border-t border-gray-200 dark:border-white/10 pt-3">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Preview:</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                {headlineEn}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        {step > 1 && (
          <button
            onClick={() => setStep(s => s - 1)}
            className="px-4 py-2 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
          >
            {t('back')}
          </button>
        )}

        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-medium transition-colors"
        >
          {t('cancel')}
        </button>

        <div className="flex-1" />

        {step < STEPS ? (
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={!canGoNext()}
            className="px-6 py-2 bg-am-orange hover:bg-am-orange-light text-white rounded-xl font-medium transition-colors disabled:opacity-40"
          >
            {t('next')}
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => handleCreate(false)}
              disabled={loading}
              className="px-4 py-2 bg-am-green hover:bg-am-green/80 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              {loading && !publishing ? '...' : t('create')}
            </button>
            <button
              onClick={() => handleCreate(true)}
              disabled={loading}
              className="px-4 py-2 bg-[#1877F2] hover:bg-[#166FE5] text-white rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              {publishing ? '...' : t('createAndPublish')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
