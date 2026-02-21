'use client';

/**
 * Responsive grid for catalog vehicles with loading/empty states.
 */

import { useTranslations } from 'next-intl';
import { Car } from 'lucide-react';
import CatalogVehicleCard from './CatalogVehicleCard';
import type { CatalogVehicle } from '@/hooks/useCatalog';

interface Props {
  vehicles: CatalogVehicle[];
  isLoading: boolean;
}

function SkeletonCard() {
  return (
    <div className="glass-crystal rounded-2xl overflow-hidden animate-pulse">
      <div className="aspect-[16/10] bg-gray-200 dark:bg-am-dark/50" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
      </div>
    </div>
  );
}

export default function CatalogGrid({ vehicles, isLoading }: Props) {
  const t = useTranslations('catalog');

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (vehicles.length === 0) {
    return (
      <div className="glass-crystal rounded-2xl p-12 text-center">
        <Car className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          {t('noResults')}
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          {t('empty')}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {vehicles.map((vehicle) => (
        <CatalogVehicleCard key={vehicle.id} vehicle={vehicle} />
      ))}
    </div>
  );
}
