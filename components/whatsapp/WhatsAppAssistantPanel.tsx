'use client';

/**
 * WhatsApp AI Assistant Panel — Profile Tab
 *
 * Shows WhatsApp Business number, phone linking, instructions, and session history.
 */

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  MessageCircle,
  Phone,
  CheckCircle,
  AlertCircle,
  Camera,
  FileText,
  Sparkles,
  ExternalLink,
  Loader2,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { usePhoneLink } from '@/hooks/useWhatsAppAssistant';
import { ConversationHistory } from './ConversationHistory';

interface Props {
  walletAddress: string;
}

export function WhatsAppAssistantPanel({ walletAddress }: Props) {
  const t = useTranslations('whatsapp');
  const { phoneLink, isLoading, error, linkPhone } = usePhoneLink(walletAddress);
  const [phoneInput, setPhoneInput] = useState('');
  const [autoActivate, setAutoActivate] = useState(true);
  const [language, setLanguage] = useState<'en' | 'es'>('es');
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  const handleLinkPhone = async () => {
    if (!phoneInput.trim()) return;
    setLinking(true);
    setLinkError(null);

    // Ensure E.164 format
    let phone = phoneInput.trim();
    if (!phone.startsWith('+')) {
      phone = '+1' + phone.replace(/\D/g, '');
    }

    const success = await linkPhone(phone, autoActivate, language);
    if (!success) {
      setLinkError(error || t('linkError'));
    } else {
      setPhoneInput('');
    }
    setLinking(false);
  };

  const WA_BUSINESS_NUMBER = process.env.NEXT_PUBLIC_WA_BUSINESS_NUMBER || '+1 (XXX) XXX-XXXX';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-crystal-enhanced rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {t('title')}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('subtitle')}
            </p>
          </div>
        </div>

        {/* Business Number */}
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
          <p className="text-sm font-medium text-green-800 dark:text-green-300 mb-1">
            {t('businessNumber')}
          </p>
          <p className="text-lg font-bold text-green-900 dark:text-green-200 font-mono">
            {WA_BUSINESS_NUMBER}
          </p>
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
            {t('sendPhotosHere')}
          </p>
        </div>
      </div>

      {/* How It Works */}
      <div className="glass-crystal-enhanced rounded-2xl p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          {t('howItWorks')}
        </h3>
        <div className="grid gap-4">
          {[
            { icon: Camera, color: 'from-blue-500 to-blue-600', step: t('step1') },
            { icon: FileText, color: 'from-purple-500 to-purple-600', step: t('step2') },
            { icon: Sparkles, color: 'from-amber-500 to-amber-600', step: t('step3') },
            { icon: ExternalLink, color: 'from-green-500 to-green-600', step: t('step4') },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                <item.icon className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  <span className="text-gray-400 dark:text-gray-500 mr-2">{i + 1}.</span>
                  {item.step}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Phone Linking */}
      <div className="glass-crystal-enhanced rounded-2xl p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          {t('linkPhone')}
        </h3>

        {phoneLink ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-300">
                  {t('phoneLinked')}
                </p>
                <p className="text-lg font-bold text-green-900 dark:text-green-200 font-mono">
                  {phoneLink.phone_number}
                </p>
              </div>
            </div>

            {/* Auto-activate toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('autoActivate')}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('autoActivateDesc')}
                </p>
              </div>
              <button
                onClick={async () => {
                  const newVal = !phoneLink.auto_activate;
                  await linkPhone(phoneLink.phone_number, newVal, phoneLink.language);
                }}
                className="text-green-600 dark:text-green-400"
              >
                {phoneLink.auto_activate
                  ? <ToggleRight className="w-8 h-8" />
                  : <ToggleLeft className="w-8 h-8 text-gray-400" />
                }
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder={t('phonePlaceholder')}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={handleLinkPhone}
                disabled={linking || !phoneInput.trim()}
                className="px-4 py-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-bold text-sm hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {linking ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {t('linkBtn')}
              </button>
            </div>

            {/* Language selector */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500 dark:text-gray-400">{t('language')}:</span>
              <div className="flex gap-2">
                {(['es', 'en'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                      language === lang
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {lang === 'es' ? 'Espanol' : 'English'}
                  </button>
                ))}
              </div>
            </div>

            {/* Auto-activate toggle for new link */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('autoActivate')}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('autoActivateDesc')}
                </p>
              </div>
              <button
                onClick={() => setAutoActivate(!autoActivate)}
                className={autoActivate ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}
              >
                {autoActivate ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
              </button>
            </div>

            {linkError && (
              <div className="flex items-center gap-2 text-red-500 text-sm">
                <AlertCircle className="w-4 h-4" />
                {linkError}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Conversation History */}
      <ConversationHistory walletAddress={walletAddress} />
    </div>
  );
}
