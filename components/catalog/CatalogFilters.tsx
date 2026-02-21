'use client';

/**
 * Catalog filter panel — sidebar on desktop, drawer on mobile.
 */

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { SlidersHorizontal, X, RotateCcw } from 'lucide-react';
import { POPULAR_BRANDS, BODY_TYPES } from '@/lib/inventory/vin-fields';

export interface CatalogFilterValues {
  brand: string;
  minPrice: string;
  maxPrice: string;
  minYear: string;
  maxYear: string;
  body_type: string;
  fuel_type: string;
  transmission: string;
  condition: string;
  sort: string;
  search: string;
}

interface Props {
  filters: CatalogFilterValues;
  onChange: (filters: CatalogFilterValues) => void;
  availableBrands?: string[];
}

const FUEL_TYPES = ['gasoline', 'diesel', 'electric', 'hybrid', 'plugin_hybrid'] as const;
const TRANSMISSIONS = ['automatic', 'manual', 'cvt'] as const;
const CONDITIONS = ['new', 'like_new', 'excellent', 'good', 'fair'] as const;
const SORT_OPTIONS = ['newest', 'price_asc', 'price_desc', 'year_desc', 'mileage_asc'] as const;

const EMPTY_FILTERS: CatalogFilterValues = {
  brand: '', minPrice: '', maxPrice: '', minYear: '', maxYear: '',
  body_type: '', fuel_type: '', transmission: '', condition: '',
  sort: 'newest', search: '',
};

export default function CatalogFilters({ filters, onChange, availableBrands }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const t = useTranslations('catalog');

  const brands = availableBrands && availableBrands.length > 0
    ? availableBrands
    : [...POPULAR_BRANDS];

  const set = (key: keyof CatalogFilterValues, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  const clearAll = () => onChange({ ...EMPTY_FILTERS });

  const hasActiveFilters = Object.entries(filters).some(
    ([key, val]) => key !== 'sort' && key !== 'search' && val !== ''
  );

  const selectClass =
    'w-full px-3 py-2.5 rounded-xl bg-white dark:bg-am-dark/80 border border-gray-200 dark:border-am-blue/30 text-gray-700 dark:text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-am-orange/50 focus:border-am-orange transition-all';

  const FilterContent = () => (
    <div className="space-y-5">
      {/* Sort */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
          {t('filters.sort')}
        </label>
        <select value={filters.sort} onChange={(e) => set('sort', e.target.value)} className={selectClass}>
          {SORT_OPTIONS.map((s) => (
            <option key={s} value={s}>{t(`sort.${s}`)}</option>
          ))}
        </select>
      </div>

      {/* Brand */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
          {t('filters.brand')}
        </label>
        <select value={filters.brand} onChange={(e) => set('brand', e.target.value)} className={selectClass}>
          <option value="">{t('filters.allBrands')}</option>
          {brands.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>

      {/* Price Range */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
          {t('filters.priceRange')}
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.minPrice}
            onChange={(e) => set('minPrice', e.target.value)}
            className={selectClass}
          />
          <input
            type="number"
            placeholder="Max"
            value={filters.maxPrice}
            onChange={(e) => set('maxPrice', e.target.value)}
            className={selectClass}
          />
        </div>
      </div>

      {/* Year Range */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
          {t('filters.yearRange')}
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.minYear}
            onChange={(e) => set('minYear', e.target.value)}
            className={selectClass}
          />
          <input
            type="number"
            placeholder="Max"
            value={filters.maxYear}
            onChange={(e) => set('maxYear', e.target.value)}
            className={selectClass}
          />
        </div>
      </div>

      {/* Body Type */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
          {t('filters.bodyType')}
        </label>
        <select value={filters.body_type} onChange={(e) => set('body_type', e.target.value)} className={selectClass}>
          <option value="">{t('filters.allTypes')}</option>
          {BODY_TYPES.map((bt) => (
            <option key={bt} value={bt}>{bt}</option>
          ))}
        </select>
      </div>

      {/* Fuel Type */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
          {t('filters.fuelType')}
        </label>
        <select value={filters.fuel_type} onChange={(e) => set('fuel_type', e.target.value)} className={selectClass}>
          <option value="">{t('filters.allFuels')}</option>
          {FUEL_TYPES.map((ft) => (
            <option key={ft} value={ft}>{t(`filters.fuel.${ft}`)}</option>
          ))}
        </select>
      </div>

      {/* Transmission */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
          {t('filters.transmission')}
        </label>
        <select value={filters.transmission} onChange={(e) => set('transmission', e.target.value)} className={selectClass}>
          <option value="">{t('filters.allTransmissions')}</option>
          {TRANSMISSIONS.map((tr) => (
            <option key={tr} value={tr}>{t(`filters.trans.${tr}`)}</option>
          ))}
        </select>
      </div>

      {/* Condition */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
          {t('filters.condition')}
        </label>
        <select value={filters.condition} onChange={(e) => set('condition', e.target.value)} className={selectClass}>
          <option value="">{t('filters.allConditions')}</option>
          {CONDITIONS.map((c) => (
            <option key={c} value={c}>{t(`condition.${c}`)}</option>
          ))}
        </select>
      </div>

      {/* Clear All */}
      {hasActiveFilters && (
        <button
          onClick={clearAll}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-am-blue/30 text-gray-600 dark:text-gray-300 hover:border-am-orange hover:text-am-orange transition-all text-sm font-medium"
        >
          <RotateCcw className="w-4 h-4" />
          {t('filters.clearAll')}
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile trigger */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="lg:hidden flex items-center gap-2 px-4 py-2.5 rounded-xl glass-crystal text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        <SlidersHorizontal className="w-4 h-4" />
        {t('filters.title')}
        {hasActiveFilters && (
          <span className="w-2 h-2 rounded-full bg-am-orange" />
        )}
      </button>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-72 flex-shrink-0">
        <div className="glass-crystal rounded-2xl p-5 sticky top-24">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4" />
            {t('filters.title')}
          </h3>
          <FilterContent />
        </div>
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[10002] lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDrawerOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white dark:bg-am-dark overflow-y-auto">
            <div className="p-5">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4" />
                  {t('filters.title')}
                </h3>
                <button onClick={() => setDrawerOpen(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-am-blue/20 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <FilterContent />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
