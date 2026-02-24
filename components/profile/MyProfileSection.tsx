'use client';

import React from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { User as UserIcon, Mail, Phone, Calendar, Users, MousePointerClick, TrendingUp, DollarSign, Link2 } from 'lucide-react';
import type { User } from '@/lib/types/user';
import type { ReferralStats } from '@/hooks/useReferrals';
import { CopyPanel } from './CopyPanel';

interface MyProfileSectionProps {
  user: User | null;
  address: string;
  referralCode?: string;
  referralLink?: string;
  referralStats?: ReferralStats;
  isLoadingReferrals: boolean;
}

export function MyProfileSection({
  user,
  address,
  referralCode,
  referralLink,
  referralStats,
  isLoadingReferrals,
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
    </section>
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
