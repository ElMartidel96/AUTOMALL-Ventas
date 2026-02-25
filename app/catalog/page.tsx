'use client';

/**
 * Public Vehicle Catalog Page
 * No authentication required. Displays active vehicles with filters.
 */

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Search } from 'lucide-react';
import { Navbar, NavbarSpacer } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import CatalogFilters, { type CatalogFilterValues } from '@/components/catalog/CatalogFilters';
import CatalogGrid from '@/components/catalog/CatalogGrid';
import { useCatalogVehicles } from '@/hooks/useCatalog';

const EMPTY_FILTERS: CatalogFilterValues = {
  brand: '', minPrice: '', maxPrice: '', minYear: '', maxYear: '',
  body_type: '', fuel_type: '', transmission: '', condition: '',
  sort: 'newest', search: '',
};

export default function CatalogPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations('catalog');

  // Initialize filters from URL params
  const [filters, setFilters] = useState<CatalogFilterValues>(() => ({
    brand: searchParams.get('brand') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    minYear: searchParams.get('minYear') || '',
    maxYear: searchParams.get('maxYear') || '',
    body_type: searchParams.get('body_type') || '',
    fuel_type: searchParams.get('fuel_type') || '',
    transmission: searchParams.get('transmission') || '',
    condition: searchParams.get('condition') || '',
    sort: searchParams.get('sort') || 'newest',
    search: searchParams.get('search') || '',
  }));

  const [page, setPage] = useState(1);

  // Build API query from filters
  const apiFilters: Record<string, string | number> = { page, limit: 24 };
  Object.entries(filters).forEach(([key, val]) => {
    if (val !== '') apiFilters[key] = val;
  });

  const { data, isLoading } = useCatalogVehicles(apiFilters);

  // Sync filters to URL
  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== '' && !(key === 'sort' && val === 'newest')) {
        params.set(key, val);
      }
    });
    if (page > 1) params.set('page', String(page));
    const qs = params.toString();
    router.replace(qs ? `/catalog?${qs}` : '/catalog', { scroll: false });
  }, [filters, page, router]);

  const handleFiltersChange = (newFilters: CatalogFilterValues) => {
    setFilters(newFilters);
    setPage(1);
  };

  const vehicles = data?.data || [];
  const pagination = data?.pagination;
  const availableBrands = data?.filters?.brands;

  return (
    <div className="min-h-screen theme-gradient-bg">
      <Navbar />
      <NavbarSpacer />

      {/* Header */}
      <section className="pt-8 pb-4 px-4 -mt-[19px]">
        <div className="container mx-auto max-w-7xl">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
            {t('title')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {t('subtitle')}
          </p>

          {/* Search bar */}
          <div className="mt-4 max-w-lg relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFiltersChange({ ...filters, search: e.target.value })}
              placeholder={t('searchPlaceholder')}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-am-dark/80 border border-gray-200 dark:border-am-blue/30 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-am-orange/50 focus:border-am-orange transition-all text-sm"
            />
          </div>
        </div>
      </section>

      {/* Content: filters sidebar + grid */}
      <section className="py-6 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="flex items-start gap-2 mb-4 lg:hidden">
            <CatalogFilters
              filters={filters}
              onChange={handleFiltersChange}
              availableBrands={availableBrands}
            />
            {pagination && (
              <span className="text-sm text-gray-500 dark:text-gray-400 py-2.5">
                {pagination.total} {t('pagination.results')}
              </span>
            )}
          </div>

          <div className="flex gap-6">
            {/* Desktop sidebar */}
            <CatalogFilters
              filters={filters}
              onChange={handleFiltersChange}
              availableBrands={availableBrands}
            />

            {/* Grid + pagination */}
            <div className="flex-1 min-w-0">
              {/* Result count - desktop */}
              {pagination && (
                <p className="hidden lg:block text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {pagination.total} {t('pagination.results')}
                </p>
              )}

              <CatalogGrid vehicles={vehicles} isLoading={isLoading} />

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="px-4 py-2 rounded-xl glass-crystal text-sm font-medium disabled:opacity-40"
                  >
                    {t('pagination.prev')}
                  </button>
                  <span className="text-sm text-gray-600 dark:text-gray-300 px-3">
                    {page} / {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={page >= pagination.totalPages}
                    className="px-4 py-2 rounded-xl glass-crystal text-sm font-medium disabled:opacity-40"
                  >
                    {t('pagination.next')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
