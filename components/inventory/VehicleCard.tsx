'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import type { Vehicle } from '@/lib/supabase/types';
import { VehicleStatusBadge } from './VehicleStatusBadge';
import { Car, Gauge, Edit2, Trash2, CheckCircle, Globe, Loader2, Check } from 'lucide-react';
import { FEATURE_META_INTEGRATION } from '@/lib/config/features';
import { useMetaConnection } from '@/hooks/useMetaConnection';
import { useMetaPublish } from '@/hooks/useMetaPublish';

interface VehicleCardProps {
  vehicle: Vehicle;
  sellerAddress: string;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onMarkSold: (id: string) => void;
}

export function VehicleCard({ vehicle, sellerAddress, onEdit, onDelete, onMarkSold }: VehicleCardProps) {
  const t = useTranslations('inventory');
  const { data: metaData } = useMetaConnection(FEATURE_META_INTEGRATION ? sellerAddress : undefined);
  const metaPublish = useMetaPublish(sellerAddress);
  const [publishSuccess, setPublishSuccess] = useState(false);

  const showFbButton = FEATURE_META_INTEGRATION && metaData?.connected && vehicle.status === 'active';

  const handlePublishFb = () => {
    metaPublish.mutate(vehicle.id, {
      onSuccess: () => {
        setPublishSuccess(true);
        setTimeout(() => setPublishSuccess(false), 2000);
      },
    });
  };

  const title = `${vehicle.year} ${vehicle.brand} ${vehicle.model}${vehicle.trim ? ` ${vehicle.trim}` : ''}`;
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(vehicle.price);
  const formattedMileage = new Intl.NumberFormat('en-US').format(vehicle.mileage);

  return (
    <div className="glass-crystal rounded-xl overflow-hidden hover:scale-[1.02] transition-all duration-200 group">
      {/* Image */}
      <div className="relative aspect-[16/10] bg-gray-100 dark:bg-gray-800">
        {vehicle.primary_image_url ? (
          <Image
            src={vehicle.primary_image_url}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Car className="w-12 h-12 text-gray-300 dark:text-gray-600" />
          </div>
        )}
        {/* Status badge */}
        <div className="absolute top-2 left-2">
          <VehicleStatusBadge status={vehicle.status} />
        </div>
        {/* Image count */}
        {vehicle.image_count > 0 && (
          <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/60 text-white text-xs rounded-full">
            {vehicle.image_count} {t('images.photos')}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-1">
          {title}
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-am-orange">{formattedPrice}</span>
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <Gauge className="w-3.5 h-3.5" />
            <span>{formattedMileage} mi</span>
          </div>
        </div>

        {/* Specs row */}
        <div className="flex flex-wrap gap-1.5">
          {vehicle.transmission && (
            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs rounded-full">
              {t(`specs.transmission.${vehicle.transmission}`)}
            </span>
          )}
          {vehicle.fuel_type && (
            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs rounded-full">
              {t(`specs.fuel.${vehicle.fuel_type}`)}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-700/50">
          <button
            onClick={() => onEdit(vehicle.id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-am-blue hover:bg-am-blue/5 dark:text-am-blue-light dark:hover:bg-am-blue/10 rounded-lg transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
            {t('actions.edit')}
          </button>
          {vehicle.status === 'active' && (
            <button
              onClick={() => onMarkSold(vehicle.id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-am-green hover:bg-am-green/5 rounded-lg transition-colors"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              {t('actions.markSold')}
            </button>
          )}
          {showFbButton && (
            <button
              onClick={handlePublishFb}
              disabled={metaPublish.isPending}
              className="flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-medium text-am-blue hover:bg-am-blue/5 dark:text-am-blue-light dark:hover:bg-am-blue/10 rounded-lg transition-colors disabled:opacity-50"
              title={t('actions.publishFacebook')}
            >
              {metaPublish.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : publishSuccess ? (
                <Check className="w-3.5 h-3.5 text-am-green" />
              ) : (
                <Globe className="w-3.5 h-3.5" />
              )}
            </button>
          )}
          <button
            onClick={() => onDelete(vehicle.id)}
            className="flex items-center justify-center p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
