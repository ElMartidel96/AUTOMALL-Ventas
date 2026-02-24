'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import {
  User as UserIcon, Mail, Phone, Calendar,
  Users, MousePointerClick, TrendingUp, DollarSign, Link2,
  Check, CheckCircle, AlertCircle, Loader2,
} from 'lucide-react';
import type { User } from '@/lib/types/user';
import type { ReferralStats } from '@/hooks/useReferrals';
import { InstagramIcon, FacebookIcon, TikTokIcon } from '@/components/icons/SocialIcons';
import { CopyPanel } from './CopyPanel';

interface MyProfileSectionProps {
  user: User | null;
  address: string;
  referralCode?: string;
  referralLink?: string;
  referralStats?: ReferralStats;
  isLoadingReferrals: boolean;
  refetchUser?: () => void;
}

export function MyProfileSection({
  user,
  address,
  referralCode,
  referralLink,
  referralStats,
  isLoadingReferrals,
  refetchUser,
}: MyProfileSectionProps) {
  const t = useTranslations('profile');

  const stats = [
    {
      label: t('totalReferrals'),
      value: referralStats?.totalReferrals ?? 0,
      icon: Users,
      color: 'text-am-blue',
    },
    {
      label: t('clicks'),
      value: referralStats?.engagement?.clickCount ?? 0,
      icon: MousePointerClick,
      color: 'text-am-orange',
    },
    {
      label: t('conversionRate'),
      value: `${Math.round(referralStats?.engagement?.conversionRate ?? 0)}%`,
      icon: TrendingUp,
      color: 'text-am-green',
    },
    {
      label: t('totalEarned'),
      value: `$${referralStats?.totalEarned ?? 0}`,
      icon: DollarSign,
      color: 'text-am-orange-light',
    },
  ];

  return (
    <section className="space-y-6">
      {/* Personal Information */}
      <div className="glass-crystal-enhanced rounded-2xl p-5">
        <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <UserIcon className="w-5 h-5 text-am-blue" />
          {t('personalInfo')}
        </h3>

        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden ring-2 ring-gray-200 dark:ring-gray-700 flex-shrink-0">
            {user?.avatar_url ? (
              <Image
                src={user.avatar_url}
                alt={user.display_name || t('noName')}
                width={64}
                height={64}
                className="w-full h-full object-cover"
                unoptimized
              />
            ) : (
              <UserIcon className="w-7 h-7 text-gray-400" />
            )}
          </div>

          {/* Info grid */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InfoRow
              icon={<UserIcon className="w-4 h-4 text-gray-400" />}
              label={t('nameLabel')}
              value={user?.display_name || t('noName')}
            />
            <InfoRow
              icon={<Mail className="w-4 h-4 text-gray-400" />}
              label={t('emailLabel')}
              value={user?.email}
              placeholder={t('noData')}
            />
            <InfoRow
              icon={<Phone className="w-4 h-4 text-gray-400" />}
              label={t('phoneLabel')}
              value={user?.phone}
              placeholder={t('noData')}
            />
            <InfoRow
              icon={<Calendar className="w-4 h-4 text-gray-400" />}
              label={t('memberSinceLabel')}
              value={user?.created_at ? new Date(user.created_at).toLocaleDateString() : undefined}
              placeholder={t('noData')}
            />
          </div>
        </div>
      </div>

      {/* Referral Activity */}
      <div className="glass-crystal-enhanced rounded-2xl p-5">
        <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-am-orange" />
          {t('referralActivity')}
        </h3>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-white/50 dark:bg-white/5 rounded-xl p-3 text-center border border-gray-100 dark:border-gray-700/50"
            >
              <stat.icon className={`w-4 h-4 mx-auto mb-1 ${stat.color}`} />
              <p className={`text-lg font-bold text-gray-900 dark:text-white ${
                isLoadingReferrals ? 'animate-pulse' : ''
              }`}>
                {stat.value}
              </p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Referral Link CopyPanel */}
        <CopyPanel
          label={t('myReferralLink')}
          value={referralCode ? `autosmall.org?ref=${referralCode}` : t('generating')}
          fullUrl={referralLink || ''}
          icon={<Link2 className="w-4 h-4" />}
          disabled={!referralLink}
        />
      </div>

      {/* Personal Social Media */}
      <PersonalSocialForm user={user} address={address} refetchUser={refetchUser} />
    </section>
  );
}

function PersonalSocialForm({
  user,
  address,
  refetchUser,
}: {
  user: User | null;
  address: string;
  refetchUser?: () => void;
}) {
  const t = useTranslations('profile');

  const [form, setForm] = useState({
    social_instagram: user?.social_instagram || '',
    social_facebook: user?.social_facebook || '',
    social_tiktok: user?.social_tiktok || '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    setForm({
      social_instagram: user?.social_instagram || '',
      social_facebook: user?.social_facebook || '',
      social_tiktok: user?.social_tiktok || '',
    });
  }, [user]);

  const handleSave = async () => {
    setIsSaving(true);
    setStatus('idle');
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: address, ...form }),
      });
      if (!res.ok) throw new Error('Failed');
      setStatus('success');
      refetchUser?.();
      setTimeout(() => setStatus('idle'), 3000);
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setStatus('idle');
  };

  return (
    <div className="glass-crystal-enhanced rounded-2xl p-5">
      <h3 className="font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
        <span className="text-am-blue">@</span>
        {t('personalSocial')}
      </h3>
      <p className="text-xs text-gray-400 mb-4">{t('personalSocialHint')}</p>

      <div className="space-y-3">
        <SocialInput
          label={t('instagram')}
          icon={<InstagramIcon className="w-4 h-4 text-pink-500" />}
          value={form.social_instagram}
          onChange={(v) => handleChange('social_instagram', v)}
          placeholder={t('personalInstagramPlaceholder')}
        />
        <SocialInput
          label={t('facebook')}
          icon={<FacebookIcon className="w-4 h-4 text-blue-600" />}
          value={form.social_facebook}
          onChange={(v) => handleChange('social_facebook', v)}
          placeholder={t('personalFacebookPlaceholder')}
        />
        <SocialInput
          label={t('tiktok')}
          icon={<TikTokIcon className="w-4 h-4 text-gray-900 dark:text-white" />}
          value={form.social_tiktok}
          onChange={(v) => handleChange('social_tiktok', v)}
          placeholder={t('personalTiktokPlaceholder')}
        />
      </div>

      <div className="mt-4 flex flex-col items-center gap-2">
        {status === 'success' && (
          <p className="text-xs text-am-green flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />{t('socialSaved')}
          </p>
        )}
        {status === 'error' && (
          <p className="text-xs text-red-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />{t('socialSaveError')}
          </p>
        )}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`w-full max-w-xs py-2.5 px-5 rounded-xl font-bold text-white text-sm transition-all flex items-center justify-center gap-2 ${
            status === 'success'
              ? 'bg-am-green'
              : 'bg-gradient-to-r from-am-blue to-am-blue-light hover:shadow-lg hover:-translate-y-0.5'
          } disabled:opacity-50`}
        >
          {isSaving ? (
            <><Loader2 className="w-4 h-4 animate-spin" />{t('saving')}</>
          ) : status === 'success' ? (
            <><Check className="w-4 h-4" />{t('saved')}</>
          ) : (
            t('saveSocial')
          )}
        </button>
      </div>
    </div>
  );
}

function SocialInput({
  label,
  icon,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2">{icon}</span>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-am-blue/50 focus:border-am-blue outline-none transition-all"
        />
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  placeholder,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
  placeholder?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <div className="min-w-0">
        <p className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</p>
        <p className={`text-sm font-medium truncate ${
          value ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'
        }`}>
          {value || placeholder || ''}
        </p>
      </div>
    </div>
  );
}
