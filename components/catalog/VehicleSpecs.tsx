'use client';

/**
 * Categorized vehicle specifications table.
 */

import { useTranslations } from 'next-intl';
import type { CatalogVehicle } from '@/hooks/useCatalog';

interface Props {
  vehicle: CatalogVehicle;
}

interface SpecRow {
  label: string;
  value: string | number | null | undefined;
}

export default function VehicleSpecs({ vehicle }: Props) {
  const t = useTranslations('catalog');

  const vehicleInfo: SpecRow[] = [
    { label: t('specs.year'), value: vehicle.year },
    { label: t('specs.brand'), value: vehicle.brand },
    { label: t('specs.model'), value: vehicle.model },
    { label: t('specs.trim'), value: vehicle.trim },
    { label: t('specs.bodyType'), value: vehicle.body_type },
    { label: t('specs.doors'), value: vehicle.doors },
    { label: t('specs.condition'), value: vehicle.condition ? t(`condition.${vehicle.condition}`) : null },
    { label: t('specs.vin'), value: vehicle.vin },
  ];

  const performance: SpecRow[] = [
    { label: t('specs.engine'), value: vehicle.engine },
    { label: t('specs.transmission'), value: vehicle.transmission },
    { label: t('specs.fuelType'), value: vehicle.fuel_type?.replace('_', ' ') },
    { label: t('specs.drivetrain'), value: vehicle.drivetrain?.toUpperCase() },
    { label: t('specs.mileage'), value: vehicle.mileage ? `${vehicle.mileage.toLocaleString()} mi` : null },
  ];

  const exterior: SpecRow[] = [
    { label: t('specs.exteriorColor'), value: vehicle.exterior_color },
  ];

  const interior: SpecRow[] = [
    { label: t('specs.interiorColor'), value: vehicle.interior_color },
  ];

  const categories = [
    { title: t('specs.vehicleInfo'), rows: vehicleInfo },
    { title: t('specs.performance'), rows: performance },
    { title: t('specs.exterior'), rows: exterior },
    { title: t('specs.interior'), rows: interior },
  ];

  return (
    <div className="space-y-6">
      {categories.map((cat) => {
        const visibleRows = cat.rows.filter((r) => r.value != null && r.value !== '');
        if (visibleRows.length === 0) return null;

        return (
          <div key={cat.title}>
            <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3 uppercase tracking-wider">
              {cat.title}
            </h4>
            <div className="glass-crystal rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  {visibleRows.map((row, i) => (
                    <tr
                      key={row.label}
                      className={i % 2 === 0 ? 'bg-white/30 dark:bg-white/5' : ''}
                    >
                      <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400 font-medium w-1/3">
                        {row.label}
                      </td>
                      <td className="px-4 py-2.5 text-gray-900 dark:text-white capitalize">
                        {row.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
