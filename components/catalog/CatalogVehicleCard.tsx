'use client';

/**
 * Public catalog vehicle card.
 * Entire card is a Link to /catalog/[id]. No seller actions.
 */

import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Car, Camera, Gauge } from 'lucide-react';
import type { CatalogVehicle } from '@/hooks/useCatalog';

interface Props {
  vehicle: CatalogVehicle;
}

export default function CatalogVehicleCard({ vehicle }: Props) {
  const t = useTranslations('catalog');

  const title = `${vehicle.year} ${vehicle.brand} ${vehicle.model}`;
  const conditionLabel = vehicle.condition ? t(`condition.${vehicle.condition}`) : null;

  return (
    <Link
      href={`/catalog/${vehicle.id}`}
      className="glass-crystal rounded-2xl overflow-hidden hover:scale-[1.02] hover:shadow-xl transition-all duration-300 group block"
    >
      {/* Image */}
      <div className="relative aspect-[16/10] bg-gray-100 dark:bg-am-dark/50">
        {vehicle.primary_image_url ? (
          <Image
            src={vehicle.primary_image_url}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Car className="w-16 h-16 text-gray-300 dark:text-gray-600" />
          </div>
        )}

        {/* Condition badge */}
        {conditionLabel && (
          <span className="absolute top-3 left-3 px-2 py-1 text-xs font-semibold rounded-lg bg-white/90 dark:bg-am-dark/90 text-gray-700 dark:text-gray-200 backdrop-blur-sm">
            {conditionLabel}
          </span>
        )}

        {/* Image count */}
        {vehicle.image_count > 0 && (
          <span className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg bg-black/60 text-white backdrop-blur-sm">
            <Camera className="w-3 h-3" />
            {vehicle.image_count}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-1 group-hover:text-am-orange transition-colors">
          {title}
        </h3>

        <p className="text-xl font-bold text-am-orange mt-1">
          ${Number(vehicle.price).toLocaleString()}
          {vehicle.price_negotiable && (
            <span className="text-xs font-normal text-gray-400 ml-1">{t('negotiable')}</span>
          )}
        </p>

        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <Gauge className="w-3.5 h-3.5" />
            {Number(vehicle.mileage).toLocaleString()} mi
          </span>
          {vehicle.transmission && (
            <span className="capitalize">{vehicle.transmission}</span>
          )}
          {vehicle.fuel_type && (
            <span className="capitalize">{vehicle.fuel_type.replace('_', ' ')}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
