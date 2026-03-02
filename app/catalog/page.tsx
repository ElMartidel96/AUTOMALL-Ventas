'use client';

/**
 * Public Vehicle Catalog Page
 * No authentication required. Displays active vehicles with filters.
 * Includes map view toggle to see vehicles on an interactive map.
 */

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { Search, LayoutGrid, MapPin, Loader2 } from 'lucide-react';
import { Navbar, NavbarSpacer } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import CatalogFilters, { type CatalogFilterValues } from '@/components/catalog/CatalogFilters';
import CatalogGrid from '@/components/catalog/CatalogGrid';
import { NearMeToggle } from '@/components/map/NearMeToggle';
import { LocationPermissionBanner } from '@/components/map/LocationPermissionBanner';
import { useCatalogVehicles } from '@/hooks/useCatalog';
import { useMapVehicles } from '@/hooks/useMapVehicles';
import { useGeolocation } from '@/hooks/useGeolocation';
import { haversineDistance } from '@/lib/geo/haversine';
import { HOUSTON_CENTER } from '@/lib/geo/types';
import { FEATURE_NEAR_ME } from '@/lib/config/features';
import type { MapVehicle } from '@/components/map/VehicleMapPopup';

const DealerVehicleMap = dynamic(() => import('@/components/map/DealerVehicleMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
    </div>
  ),
});

type CatalogView = 'grid' | 'map';

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
  const [view, setView] = useState<CatalogView>('grid');
  const [selectedVehicle, setSelectedVehicle] = useState<MapVehicle | null>(null);

  // Geo state for Near Me
  const [nearMeEnabled, setNearMeEnabled] = useState(false);
  const [nearMeRadius, setNearMeRadius] = useState(50);
  const { coordinates: userCoords, status: geoStatus, requestLocation } = useGeolocation();

  // Build API query from filters
  const apiFilters: Record<string, string | number> = { page, limit: 24 };
  Object.entries(filters).forEach(([key, val]) => {
    if (val !== '') apiFilters[key] = val;
  });
  // Add geo filters when Near Me is active
  if (nearMeEnabled && userCoords) {
    apiFilters.lat = userCoords.latitude;
    apiFilters.lng = userCoords.longitude;
    apiFilters.radius = nearMeRadius;
  }

  const { data, isLoading } = useCatalogVehicles(apiFilters);
  const { data: mapData } = useMapVehicles({ enabled: view === 'map' });

  const rawMapVehicles = mapData?.data || [];

  // Enrich map vehicles with distance when user location available
  const mapVehicles = useMemo(() => {
    if (!userCoords) return rawMapVehicles;
    return rawMapVehicles.map(v => ({
      ...v,
      distance_km: haversineDistance(userCoords.latitude, userCoords.longitude, v.latitude, v.longitude),
    }));
  }, [rawMapVehicles, userCoords]);

  // Sync filters to URL
  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== '' && !(key === 'sort' && val === 'newest')) {
        params.set(key, val);
      }
    });
    if (page > 1) params.set('page', String(page));
    if (view === 'map') params.set('view', 'map');
    const qs = params.toString();
    router.replace(qs ? `/catalog?${qs}` : '/catalog', { scroll: false });
  }, [filters, page, view, router]);

  // Initialize view from URL
  useEffect(() => {
    if (searchParams.get('view') === 'map') setView('map');
  }, [searchParams]);

  const handleFiltersChange = (newFilters: CatalogFilterValues) => {
    setFilters(newFilters);
    setPage(1);
  };

  // Request location when Near Me is toggled on
  const handleNearMeToggle = (enabled: boolean) => {
    setNearMeEnabled(enabled);
    if (enabled && geoStatus !== 'success') {
      requestLocation();
    }
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
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                {t('title')}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                {t('subtitle')}
              </p>
            </div>

            {/* View toggle + Near Me */}
            <div className="flex items-center gap-2">
              {FEATURE_NEAR_ME && view === 'map' && (
                <div className="w-40">
                  <NearMeToggle
                    enabled={nearMeEnabled}
                    onToggle={handleNearMeToggle}
                    radius={nearMeRadius}
                    onRadiusChange={setNearMeRadius}
                    isLocating={geoStatus === 'loading'}
                    locationDenied={geoStatus === 'denied'}
                  />
                </div>
              )}
              <div className="flex items-center gap-1 p-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setView('grid')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    view === 'grid'
                      ? 'bg-am-blue text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  {t('viewGrid')}
                </button>
                <button
                  onClick={() => setView('map')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    view === 'map'
                      ? 'bg-am-blue text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  {t('viewMap')}
                </button>
              </div>
            </div>
          </div>

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

      {/* Content */}
      <section className="py-6 px-4">
        <div className="container mx-auto max-w-7xl">
          {view === 'map' ? (
            /* Map view */
            <div className="space-y-4">
              {/* Location permission banner — shown when Near Me active but no location */}
              {FEATURE_NEAR_ME && nearMeEnabled && geoStatus !== 'success' && (
                <LocationPermissionBanner
                  status={geoStatus}
                  onRequestLocation={requestLocation}
                  onManualSearch={() => setNearMeEnabled(false)}
                />
              )}
              <DealerVehicleMap
                sellers={[]}
                vehicles={mapVehicles}
                selectedVehicleId={selectedVehicle?.id}
                onVehicleSelect={setSelectedVehicle}
                height="calc(100vh - 320px)"
                initialCenter={userCoords || HOUSTON_CENTER}
                className="shadow-xl"
              />
              {mapVehicles.length === 0 && !isLoading && (
                <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">
                  {t('noVehiclesOnMap')}
                </p>
              )}
            </div>
          ) : (
            /* Grid view */
            <>
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
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
