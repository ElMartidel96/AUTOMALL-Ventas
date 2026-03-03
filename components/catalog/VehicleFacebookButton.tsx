'use client';

/**
 * VehicleFacebookButton — Publish a vehicle to Facebook from the catalog detail page.
 *
 * Only visible when:
 * 1. FEATURE_META_INTEGRATION is enabled
 * 2. The logged-in user is the seller who owns this vehicle
 * 3. The seller has an active Meta connection
 * 4. The vehicle status is 'active'
 *
 * Made by mbxarts.com The Moon in a Box property
 * Co-Author: Godez22
 */

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Globe, Loader2, Check, AlertCircle } from 'lucide-react';
import { FEATURE_META_INTEGRATION } from '@/lib/config/features';
import { useAccount } from '@/lib/thirdweb';
import { useSellerProfile } from '@/hooks/useSellerProfile';
import { useMetaConnection } from '@/hooks/useMetaConnection';
import { useMetaPublish } from '@/hooks/useMetaPublish';

interface Props {
  vehicleId: string;
  vehicleSellerHandle: string | null;
  className?: string;
}

export default function VehicleFacebookButton({ vehicleId, vehicleSellerHandle, className = '' }: Props) {
  const t = useTranslations('catalog.publish');
  const { address } = useAccount();
  const { seller } = useSellerProfile();
  const { data: metaData } = useMetaConnection(
    FEATURE_META_INTEGRATION && address ? address : undefined
  );
  const metaPublish = useMetaPublish(address);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [publishError, setPublishError] = useState(false);

  // Ownership check: seller's handle must match the vehicle's seller_handle
  const isOwner = !!seller?.handle && !!vehicleSellerHandle && seller.handle === vehicleSellerHandle;

  const handlePublish = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (metaPublish.isPending || publishSuccess) return;

    setPublishError(false);
    metaPublish.mutate(vehicleId, {
      onSuccess: () => {
        setPublishSuccess(true);
        setTimeout(() => setPublishSuccess(false), 3000);
      },
      onError: () => {
        setPublishError(true);
        setTimeout(() => setPublishError(false), 3000);
      },
    });
  }, [vehicleId, metaPublish, publishSuccess]);

  // Don't render if conditions aren't met
  if (!FEATURE_META_INTEGRATION || !isOwner || !metaData?.connected) {
    return null;
  }

  return (
    <button
      onClick={handlePublish}
      disabled={metaPublish.isPending}
      className={`relative inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all
        ${publishSuccess
          ? 'bg-am-green/10 dark:bg-am-green/20 text-am-green border border-am-green/30'
          : publishError
            ? 'bg-red-50 dark:bg-red-900/20 text-red-500 border border-red-200/50 dark:border-red-500/20'
            : 'bg-am-blue/5 dark:bg-am-blue/10 hover:bg-am-blue/15 dark:hover:bg-am-blue/20 text-am-blue dark:text-am-blue-light border border-am-blue/20 dark:border-am-blue/30'
        }
        disabled:opacity-50
        ${className}`}
      title={t('facebook')}
    >
      {metaPublish.isPending ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span className="hidden sm:inline">{t('publishing')}</span>
        </>
      ) : publishSuccess ? (
        <>
          <Check className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t('success')}</span>
        </>
      ) : publishError ? (
        <>
          <AlertCircle className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t('error')}</span>
        </>
      ) : (
        <>
          <Globe className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t('facebook')}</span>
        </>
      )}
    </button>
  );
}
