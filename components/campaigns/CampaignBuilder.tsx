'use client';

/**
 * CampaignBuilder — Create & configure Facebook CTWA campaigns
 *
 * Step-by-step wizard:
 * 1. Choose campaign template
 * 2. Select vehicles
 * 3. Customize copy (headline, body, icebreakers)
 * 4. Set budget & schedule
 * 5. Preview & launch
 *
 * i18n: useTranslations('campaigns')
 */

import React, { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  Car,
  CreditCard,
  Tag,
  Calendar,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  MessageCircle,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Target,
  DollarSign,
  Eye,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { CAMPAIGN_TEMPLATES } from '@/lib/campaigns/campaign-templates';
import type { CampaignTemplate, CampaignType, AdFormat } from '@/lib/campaigns/campaign-types';

// ─────────────────────────────────────────────
// Icon Map
// ─────────────────────────────────────────────

const ICON_MAP: Record<string, React.ReactNode> = {
  Car: <Car className="w-6 h-6" />,
  Calendar: <Calendar className="w-6 h-6" />,
  Tag: <Tag className="w-6 h-6" />,
  CreditCard: <CreditCard className="w-6 h-6" />,
  RefreshCw: <RefreshCw className="w-6 h-6" />,
};

// ─────────────────────────────────────────────
// Props & State
// ─────────────────────────────────────────────

interface Props {
  walletAddress: string;
  sellerWhatsapp: string;
  sellerPhone: string;
  sellerHandle: string;
  sellerBusinessName: string;
  vehicles: {
    id: string;
    brand: string;
    model: string;
    year: number;
    price: number;
    image_url?: string;
  }[];
  lang: 'en' | 'es';
  onCampaignCreated?: (campaignId: string) => void;
}

type Step = 'template' | 'vehicles' | 'copy' | 'budget' | 'preview';

const STEPS: Step[] = ['template', 'vehicles', 'copy', 'budget', 'preview'];

export function CampaignBuilder({
  walletAddress,
  sellerWhatsapp,
  sellerPhone,
  sellerHandle,
  sellerBusinessName,
  vehicles,
  lang,
  onCampaignCreated,
}: Props) {
  const t = useTranslations('campaigns');

  // Wizard state
  const [step, setStep] = useState<Step>('template');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Campaign data
  const [selectedTemplate, setSelectedTemplate] = useState<CampaignTemplate | null>(null);
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [campaignName, setCampaignName] = useState('');
  const [headlineEn, setHeadlineEn] = useState('');
  const [headlineEs, setHeadlineEs] = useState('');
  const [bodyEn, setBodyEn] = useState('');
  const [bodyEs, setBodyEs] = useState('');
  const [ctaText, setCtaText] = useState('Chat on WhatsApp');
  const [adFormat, setAdFormat] = useState<AdFormat>('carousel');
  const [dailyBudget, setDailyBudget] = useState(25);
  const [durationDays, setDurationDays] = useState(14);
  const [captionLang, setCaptionLang] = useState<'en' | 'es' | 'both'>('both');

  const stepIdx = STEPS.indexOf(step);

  const copy = useCallback((text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }, []);

  // ── Template Selection ──
  const handleTemplateSelect = (template: CampaignTemplate) => {
    setSelectedTemplate(template);
    setCampaignName(lang === 'es' ? template.name_es : template.name_en);
    setHeadlineEn(template.headline_en);
    setHeadlineEs(template.headline_es);
    setBodyEn(template.body_en);
    setBodyEs(template.body_es);
    setCtaText(template.cta_text);
    setAdFormat(template.recommended_format);
    setDailyBudget(template.recommended_budget_min);
    setDurationDays(template.recommended_duration_days);
    setStep('vehicles');
  };

  // ── Vehicle Toggle ──
  const toggleVehicle = (id: string) => {
    setSelectedVehicles((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  // ── Save Campaign ──
  const handleSave = async () => {
    if (!selectedTemplate) return;
    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: walletAddress,
          name: campaignName,
          type: selectedTemplate.type as CampaignType,
          ad_format: adFormat,
          headline_en: headlineEn,
          headline_es: headlineEs,
          body_en: bodyEn,
          body_es: bodyEs,
          cta_text: ctaText,
          caption_language: captionLang,
          vehicle_ids: selectedVehicles,
          whatsapp_number: sellerWhatsapp || sellerPhone,
          welcome_message_en: selectedTemplate.welcome_message_en,
          welcome_message_es: selectedTemplate.welcome_message_es,
          icebreakers_en: selectedTemplate.icebreakers_en,
          icebreakers_es: selectedTemplate.icebreakers_es,
          daily_budget_usd: dailyBudget,
          landing_enabled: true,
          start_date: new Date().toISOString().split('T')[0],
          end_date: durationDays > 0
            ? new Date(Date.now() + durationDays * 86400000).toISOString().split('T')[0]
            : null,
        }),
      });

      if (!res.ok) throw new Error('Failed to create campaign');

      const { campaign } = await res.json();
      setSuccess(campaign.id);
      onCampaignCreated?.(campaign.id);
    } catch (err) {
      setError(lang === 'es' ? 'Error al crear la campaña' : 'Failed to create campaign');
    } finally {
      setSaving(false);
    }
  };

  // ── Success State ──
  if (success) {
    const domain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'autosmall.org';
    const landingUrl = `https://${domain}/w/${success}`;

    return (
      <div className="space-y-6">
        <div className="glass-crystal-enhanced rounded-2xl p-8 text-center">
          <CheckCircle2 className="w-16 h-16 text-am-green mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {t('created')}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {t('createdDesc')}
          </p>

          {/* Landing Page URL */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 mb-4">
            <p className="text-xs text-gray-500 mb-2">{t('landingUrl')}</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm text-am-blue dark:text-am-blue-light font-mono truncate">
                {landingUrl}
              </code>
              <button
                onClick={() => copy(landingUrl, 'landing')}
                className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                {copiedField === 'landing' ? (
                  <Check className="w-4 h-4 text-am-green" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-500" />
                )}
              </button>
              <a
                href={landingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                <ExternalLink className="w-4 h-4 text-gray-500" />
              </a>
            </div>
          </div>

          {/* Facebook Ad Setup Guide */}
          <div className="text-left bg-am-blue/5 dark:bg-am-blue/10 rounded-xl p-4">
            <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Target className="w-5 h-5 text-am-blue" />
              {t('nextSteps')}
            </h3>
            <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li className="flex gap-2">
                <span className="font-bold text-am-blue">1.</span>
                {t('step1')}
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-am-blue">2.</span>
                {t('step2')}
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-am-blue">3.</span>
                {t('step3')}
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-am-blue">4.</span>
                {t('step4')}
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-am-blue">5.</span>
                {t('step5')}
              </li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <button
              onClick={() => i <= stepIdx && setStep(s)}
              disabled={i > stepIdx}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                i === stepIdx
                  ? 'bg-am-blue text-white'
                  : i < stepIdx
                    ? 'bg-am-green/20 text-am-green cursor-pointer'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
              }`}
            >
              {i < stepIdx ? <Check className="w-3 h-3" /> : null}
              {t(`step_${s}`)}
            </button>
            {i < STEPS.length - 1 && (
              <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600" />
            )}
          </React.Fragment>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
        </div>
      )}

      {/* ═══════ STEP 1: Template Selection ═══════ */}
      {step === 'template' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              {t('chooseTemplate')}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('chooseTemplateDesc')}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {CAMPAIGN_TEMPLATES.map((template) => (
              <button
                key={template.id}
                onClick={() => handleTemplateSelect(template)}
                className="glass-crystal-enhanced rounded-2xl p-5 text-left hover:ring-2 hover:ring-am-orange transition-all group"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-${template.color}/20 flex items-center justify-center text-${template.color} group-hover:scale-110 transition-transform`}>
                    {ICON_MAP[template.icon] || <Sparkles className="w-6 h-6" />}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 dark:text-white">
                      {lang === 'es' ? template.name_es : template.name_en}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {lang === 'es' ? template.description_es : template.description_en}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    ${template.recommended_budget_min}-${template.recommended_budget_max}/{lang === 'es' ? 'día' : 'day'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {template.recommended_duration_days} {lang === 'es' ? 'días' : 'days'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ═══════ STEP 2: Vehicle Selection ═══════ */}
      {step === 'vehicles' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              {t('selectVehicles')}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('selectVehiclesDesc')}
            </p>
          </div>

          {vehicles.length === 0 ? (
            <div className="glass-crystal-enhanced rounded-2xl p-8 text-center">
              <Car className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">{t('noVehicles')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {vehicles.map((v) => {
                const selected = selectedVehicles.includes(v.id);
                return (
                  <button
                    key={v.id}
                    onClick={() => toggleVehicle(v.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                      selected
                        ? 'border-am-orange bg-am-orange/5 dark:bg-am-orange/10'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 ${
                      selected ? 'bg-am-orange text-white' : 'bg-gray-200 dark:bg-gray-700'
                    }`}>
                      {selected && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                        {v.year} {v.brand} {v.model}
                      </p>
                      <p className="text-xs text-gray-500">
                        {v.price > 0 ? `$${v.price.toLocaleString()}` : ''}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex justify-between pt-4">
            <button
              onClick={() => setStep('template')}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> {t('back')}
            </button>
            <button
              onClick={() => setStep('copy')}
              className="flex items-center gap-1 bg-am-blue hover:bg-am-blue-dark text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
            >
              {t('next')} <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ═══════ STEP 3: Copy Customization ═══════ */}
      {step === 'copy' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              {t('customizeCopy')}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('customizeCopyDesc')}</p>
          </div>

          <div className="glass-crystal-enhanced rounded-2xl p-5 space-y-4">
            {/* Campaign Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('campaignName')}
              </label>
              <input
                type="text"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              />
            </div>

            {/* Language */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('language')}
              </label>
              <select
                value={captionLang}
                onChange={(e) => setCaptionLang(e.target.value as 'en' | 'es' | 'both')}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              >
                <option value="both">{t('langBoth')}</option>
                <option value="en">{t('langEn')}</option>
                <option value="es">{t('langEs')}</option>
              </select>
            </div>

            {/* Headline EN */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('headlineEn')}
              </label>
              <input
                type="text"
                value={headlineEn}
                onChange={(e) => setHeadlineEn(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                maxLength={100}
              />
            </div>

            {/* Headline ES */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('headlineEs')}
              </label>
              <input
                type="text"
                value={headlineEs}
                onChange={(e) => setHeadlineEs(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                maxLength={100}
              />
            </div>

            {/* Body EN */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('bodyEn')}
              </label>
              <textarea
                value={bodyEn}
                onChange={(e) => setBodyEn(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm resize-none"
              />
            </div>

            {/* Body ES */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('bodyEs')}
              </label>
              <textarea
                value={bodyEs}
                onChange={(e) => setBodyEs(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm resize-none"
              />
            </div>

            {/* Ad Format */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('adFormat')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['carousel', 'single_image', 'video'] as AdFormat[]).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setAdFormat(fmt)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      adFormat === fmt
                        ? 'border-am-blue bg-am-blue/10 text-am-blue dark:text-am-blue-light'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {t(`format_${fmt}`)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <button
              onClick={() => setStep('vehicles')}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> {t('back')}
            </button>
            <button
              onClick={() => setStep('budget')}
              className="flex items-center gap-1 bg-am-blue hover:bg-am-blue-dark text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
            >
              {t('next')} <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ═══════ STEP 4: Budget & Schedule ═══════ */}
      {step === 'budget' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              {t('budgetTitle')}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('budgetDesc')}</p>
          </div>

          <div className="glass-crystal-enhanced rounded-2xl p-5 space-y-5">
            {/* Daily Budget */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('dailyBudget')}: ${dailyBudget}/{lang === 'es' ? 'día' : 'day'}
              </label>
              <input
                type="range"
                min={5}
                max={200}
                step={5}
                value={dailyBudget}
                onChange={(e) => setDailyBudget(Number(e.target.value))}
                className="w-full accent-am-orange"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>$5</span>
                <span>$200</span>
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('duration')}: {durationDays} {lang === 'es' ? 'días' : 'days'}
              </label>
              <input
                type="range"
                min={7}
                max={90}
                step={1}
                value={durationDays}
                onChange={(e) => setDurationDays(Number(e.target.value))}
                className="w-full accent-am-orange"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>7 {lang === 'es' ? 'días' : 'days'}</span>
                <span>90 {lang === 'es' ? 'días' : 'days'}</span>
              </div>
            </div>

            {/* Total Budget Estimate */}
            <div className="bg-am-orange/10 rounded-xl p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('totalEstimate')}
                </span>
                <span className="text-lg font-bold text-am-orange">
                  ${(dailyBudget * durationDays).toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{t('budgetNote')}</p>
            </div>

            {/* Tips */}
            {selectedTemplate && (
              <div className="bg-am-blue/5 dark:bg-am-blue/10 rounded-xl p-4">
                <p className="text-xs font-semibold text-am-blue dark:text-am-blue-light mb-2">
                  {t('tips')}
                </p>
                <ul className="space-y-1">
                  {(lang === 'es' ? selectedTemplate.tips_es : selectedTemplate.tips_en)
                    .slice(0, 3)
                    .map((tip, i) => (
                      <li key={i} className="text-xs text-gray-600 dark:text-gray-400 flex gap-1.5">
                        <span className="text-am-blue flex-shrink-0">•</span>
                        {tip}
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </div>

          <div className="flex justify-between pt-4">
            <button
              onClick={() => setStep('copy')}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> {t('back')}
            </button>
            <button
              onClick={() => setStep('preview')}
              className="flex items-center gap-1 bg-am-blue hover:bg-am-blue-dark text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
            >
              <Eye className="w-4 h-4" /> {t('preview')}
            </button>
          </div>
        </div>
      )}

      {/* ═══════ STEP 5: Preview & Launch ═══════ */}
      {step === 'preview' && selectedTemplate && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              {t('reviewTitle')}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('reviewDesc')}</p>
          </div>

          {/* Summary Card */}
          <div className="glass-crystal-enhanced rounded-2xl p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 text-xs">{t('campaignName')}</p>
                <p className="font-semibold text-gray-900 dark:text-white">{campaignName}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">{t('templateLabel')}</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {lang === 'es' ? selectedTemplate.name_es : selectedTemplate.name_en}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">{t('vehiclesCount')}</p>
                <p className="font-semibold text-gray-900 dark:text-white">{selectedVehicles.length}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">{t('adFormat')}</p>
                <p className="font-semibold text-gray-900 dark:text-white">{t(`format_${adFormat}`)}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">{t('dailyBudget')}</p>
                <p className="font-semibold text-am-orange">${dailyBudget}/{lang === 'es' ? 'día' : 'day'}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">{t('totalEstimate')}</p>
                <p className="font-semibold text-am-orange">${(dailyBudget * durationDays).toLocaleString()}</p>
              </div>
            </div>

            {/* Ad Preview */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-white dark:bg-gray-900">
              <p className="text-xs text-gray-400 mb-2">{t('adPreview')}</p>
              <p className="font-bold text-gray-900 dark:text-white text-sm mb-2">
                {captionLang === 'es' ? headlineEs : headlineEn}
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-xs whitespace-pre-line">
                {captionLang === 'es' ? bodyEs : bodyEn}
              </p>
              <div className="mt-3 flex items-center gap-2 text-[#25D366] text-sm font-bold">
                <MessageCircle className="w-4 h-4" />
                {ctaText}
              </div>
            </div>

            {/* WhatsApp Number */}
            <div className="flex items-center gap-2 text-sm">
              <MessageCircle className="w-4 h-4 text-[#25D366]" />
              <span className="text-gray-500">WhatsApp:</span>
              <span className="font-mono text-gray-900 dark:text-white">
                {sellerWhatsapp || sellerPhone || t('noWhatsapp')}
              </span>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <button
              onClick={() => setStep('budget')}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> {t('back')}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-am-orange hover:bg-am-orange-dark text-white font-bold text-sm px-6 py-3 rounded-xl transition-colors shadow-lg shadow-am-orange/20 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {t('createCampaign')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
