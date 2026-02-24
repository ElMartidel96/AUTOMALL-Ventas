'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { ExternalLink, Link2 } from 'lucide-react';
import type { Seller } from '@/lib/types/seller';
import type { UserRole } from '@/lib/types/user';
import { isDealerRole } from '@/lib/types/user';
import { APP_DOMAIN } from '@/lib/config/features';
import { CopyPanel } from './CopyPanel';
import { DealerPreviewCard } from './DealerPreviewCard';
import { SellerForm } from './SellerForm';
import { RoleChanger } from './RoleChanger';

interface MyDealershipSectionProps {
  seller: Seller;
  address: string;
  role: UserRole | null;
  completionPercentage: number;
  refetch: () => void;
  referralLink?: string;
  updateRole: (newRole: UserRole) => Promise<{ needs_onboarding: boolean }>;
}

export function MyDealershipSection({
  seller,
  address,
  role,
  completionPercentage,
  refetch,
  referralLink,
  updateRole,
}: MyDealershipSectionProps) {
  const t = useTranslations('profile');
  const router = useRouter();

  const hasHandle = !!seller.handle?.trim();
  const sellerUrl = hasHandle ? `https://${seller.handle}.${APP_DOMAIN}` : '';
  const sellerUrlDisplay = hasHandle ? `${seller.handle}.${APP_DOMAIN}` : t('generating');

  return (
    <section className="space-y-6">
      {/* CopyPanels: URL + Referral Link */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <CopyPanel
          label={t('yourExclusiveUrl')}
          value={sellerUrlDisplay}
          fullUrl={sellerUrl}
          icon={<ExternalLink className="w-4 h-4" />}
          navigable={hasHandle}
          disabled={!hasHandle}
        />
        <CopyPanel
          label={t('referralLinkPanel')}
          value={referralLink ? referralLink.replace(/^https?:\/\//, '') : t('generating')}
          fullUrl={referralLink || ''}
          icon={<Link2 className="w-4 h-4" />}
          disabled={!referralLink}
        />
      </div>

      {/* Page preview — contact + social links */}
      <DealerPreviewCard seller={seller} />

      {/* Completion bar */}
      <div className="glass-crystal-enhanced rounded-2xl p-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            {t('completion')}
          </p>
          <span className="text-sm font-bold text-gray-900 dark:text-white">{completionPercentage}%</span>
        </div>
        <div className="h-2.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-am-orange to-am-orange-light transition-all duration-500"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
        {completionPercentage < 100 && (
          <p className="text-xs text-gray-400 mt-2">{t('completionHint')}</p>
        )}
      </div>

      {/* Seller form */}
      <SellerForm seller={seller} address={address} refetch={refetch} />

      {/* Role changer — LAST */}
      <RoleChanger
        currentRole={role}
        onChangeRole={async (newRole) => {
          const { needs_onboarding } = await updateRole(newRole);
          if (isDealerRole(newRole) && needs_onboarding) {
            router.push('/onboarding');
          }
        }}
      />
    </section>
  );
}
