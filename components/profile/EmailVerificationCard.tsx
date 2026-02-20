/**
 * EMAIL VERIFICATION CARD COMPONENT
 *
 * Prompts user to add and verify their recovery email.
 * Shows prominent alert when email is not configured.
 *
 * @version 1.0.0
 */

'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Mail,
  Shield,
  Check,
  AlertTriangle,
  Loader2,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';

interface EmailVerificationCardProps {
  wallet: string;
  currentEmail?: string | null;
  isEmailVerified?: boolean;
  onEmailVerified?: (email: string) => void;
  compact?: boolean;
}

type Step = 'input' | 'verify' | 'success';

export function EmailVerificationCard({
  wallet,
  currentEmail,
  isEmailVerified,
  onEmailVerified,
  compact = false,
}: EmailVerificationCardProps) {
  const t = useTranslations('profile');
  const [step, setStep] = useState<Step>(currentEmail && isEmailVerified ? 'success' : 'input');
  const [email, setEmail] = useState(currentEmail || '');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // If already verified, show success state
  if (currentEmail && isEmailVerified) {
    return (
      <div className={`bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl ${compact ? 'p-4' : 'p-6'}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="font-medium text-green-800 dark:text-green-300">
              {t('email.verified')}
            </p>
            <p className="text-sm text-green-600 dark:text-green-400">{currentEmail}</p>
          </div>
        </div>
      </div>
    );
  }

  const handleSendCode = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(t('email.invalidEmail'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/email/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, wallet }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send verification code');
      }

      setStep('verify');
      setSuccessMessage(t('email.codeSent'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!/^\d{6}$/.test(code)) {
      setError(t('email.invalidCode'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/email/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, wallet }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify code');
      }

      setStep('success');
      setSuccessMessage(t('email.verifiedSuccess'));
      onEmailVerified?.(email);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = () => {
    setCode('');
    setError(null);
    handleSendCode();
  };

  // Alert card for users without email
  if (step === 'input') {
    return (
      <div className={`bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-xl ${compact ? 'p-4' : 'p-6'}`}>
        {/* Warning Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/50 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h3 className="font-bold text-amber-900 dark:text-amber-200">
              {t('email.secureAccount')}
            </h3>
            <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
              {t('email.secureAccountDesc')}
            </p>
          </div>
        </div>

        {/* Benefits */}
        {!compact && (
          <div className="bg-white/50 dark:bg-slate-800/50 rounded-lg p-3 mb-4 text-sm space-y-2">
            <div className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
              <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <span>{t('email.benefit1')}</span>
            </div>
            <div className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
              <Mail className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <span>{t('email.benefit2')}</span>
            </div>
            <div className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
              <Check className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <span>{t('email.benefit3')}</span>
            </div>
          </div>
        )}

        {/* Email Input */}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              {t('email.label')}
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                placeholder={t('email.placeholder')}
                className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
              <button
                onClick={handleSendCode}
                disabled={isLoading || !email}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    {t('email.sendCode')}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
        </div>
      </div>
    );
  }

  // Verify code step
  if (step === 'verify') {
    return (
      <div className={`bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl ${compact ? 'p-4' : 'p-6'}`}>
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center flex-shrink-0">
            <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-bold text-blue-900 dark:text-blue-200">
              {t('email.verifyTitle')}
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
              {t('email.codeSentTo')} <strong>{email}</strong>
            </p>
          </div>
        </div>

        {successMessage && (
          <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm rounded-lg p-3 mb-4">
            {successMessage}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              {t('email.enterCode')}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setCode(value);
                  setError(null);
                }}
                placeholder="000000"
                maxLength={6}
                className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-xl tracking-widest font-mono"
              />
              <button
                onClick={handleVerifyCode}
                disabled={isLoading || code.length !== 6}
                className="px-4 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    {t('email.verify')}
                    <Check className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          <div className="flex items-center justify-between text-sm">
            <button
              onClick={() => setStep('input')}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              {t('email.changeEmail')}
            </button>
            <button
              onClick={handleResendCode}
              disabled={isLoading}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              {t('email.resendCode')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Success step
  return (
    <div className={`bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl ${compact ? 'p-4' : 'p-6'}`}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <p className="font-medium text-green-800 dark:text-green-300">
            {successMessage || t('email.verifiedSuccess')}
          </p>
          <p className="text-sm text-green-600 dark:text-green-400">{email}</p>
        </div>
      </div>
    </div>
  );
}
