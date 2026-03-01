'use client'

/**
 * Map Page — Dealers + Vehicles on an interactive Mapbox map
 *
 * Features:
 * - Friendly location permission banner with explanation
 * - Manual address/city/zip search as fallback
 * - Dealer markers with service area circles
 * - Vehicle markers linked to sellers
 * - Toggle between dealers / vehicles / both
 * - Radius filter + stats
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { MapPin, Car, Store, Loader2, Navigation, Check } from 'lucide-react'
import { Navbar, NavbarSpacer } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { LocationPermissionBanner } from '@/components/map/LocationPermissionBanner'
import { AddressSearchInput } from '@/components/map/AddressSearchInput'
import { useGeolocation } from '@/hooks/useGeolocation'
import { useNearbyDealers } from '@/hooks/useNearbyDealers'
import { useMapVehicles } from '@/hooks/useMapVehicles'
import { HOUSTON_CENTER, DEFAULT_SEARCH_RADIUS_KM } from '@/lib/geo/types'
import type { NearbySellerResult } from '@/lib/geo/types'
import type { MapVehicle } from '@/components/map/VehicleMapPopup'
import { FEATURE_NEAR_ME } from '@/lib/config/features'

const DealerVehicleMap = dynamic(() => import('@/components/map/DealerVehicleMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
    </div>
  ),
})

type ViewMode = 'all' | 'dealers' | 'vehicles'

export default function MapPage() {
  const t = useTranslations('map')
  const { coordinates, status: geoStatus, requestLocation } = useGeolocation()
  const [radius, setRadius] = useState(DEFAULT_SEARCH_RADIUS_KM)
  const [viewMode, setViewMode] = useState<ViewMode>('all')
  const [selectedSeller, setSelectedSeller] = useState<NearbySellerResult | null>(null)
  const [selectedVehicle, setSelectedVehicle] = useState<MapVehicle | null>(null)
  const [showManualSearch, setShowManualSearch] = useState(false)
  const [manualCenter, setManualCenter] = useState<{ latitude: number; longitude: number } | null>(null)
  const [manualLabel, setManualLabel] = useState<string | null>(null)

  // Use user's location > manual search > Houston center
  const center = coordinates || manualCenter || HOUSTON_CENTER
  const hasLocation = !!(coordinates || manualCenter)

  const { data: dealerData, isLoading: dealersLoading } = useNearbyDealers({
    latitude: center.latitude,
    longitude: center.longitude,
    radius,
    enabled: true,
  })

  const { data: vehicleData, isLoading: vehiclesLoading } = useMapVehicles()

  const sellers = dealerData?.data || []
  const vehicles = vehicleData?.data || []

  const isLoading = dealersLoading || vehiclesLoading

  // Auto-request location on mount (only once)
  useEffect(() => {
    if (geoStatus === 'idle') {
      requestLocation()
    }
  }, [geoStatus, requestLocation])

  // When geo is denied, show manual search automatically
  useEffect(() => {
    if (geoStatus === 'denied' || geoStatus === 'error') {
      setShowManualSearch(true)
    }
  }, [geoStatus])

  const handleManualLocation = useCallback((lat: number, lng: number, label: string) => {
    setManualCenter({ latitude: lat, longitude: lng })
    setManualLabel(label)
  }, [])

  const handleShowManualSearch = useCallback(() => {
    setShowManualSearch(true)
  }, [])

  // View mode options
  const viewModes: { key: ViewMode; icon: React.ElementType; label: string; count: number }[] = useMemo(() => [
    { key: 'all', icon: MapPin, label: t('viewMode.all'), count: sellers.length + vehicles.length },
    { key: 'dealers', icon: Store, label: t('viewMode.dealers'), count: sellers.length },
    { key: 'vehicles', icon: Car, label: t('viewMode.vehicles'), count: vehicles.length },
  ], [sellers.length, vehicles.length, t])

  if (!FEATURE_NEAR_ME) return null

  return (
    <div className="min-h-screen theme-gradient-bg">
      <Navbar />
      <NavbarSpacer />

      <div className="max-w-7xl mx-auto px-4 pt-6 pb-8 space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <MapPin className="w-6 h-6 text-am-orange" />
              {t('title')}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
              {t('subtitle')}
            </p>
          </div>

          {/* Radius control */}
          <div className="flex items-center gap-3">
            {hasLocation && (
              <div className="flex items-center gap-1.5 text-xs text-am-green font-medium">
                <Check className="w-3.5 h-3.5" />
                {manualLabel ? manualLabel : t('locationBanner.located')}
              </div>
            )}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-500 dark:text-gray-400">
                {t('radius')}:
              </label>
              <select
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value={10}>10 mi</option>
                <option value={25}>25 mi</option>
                <option value={50}>50 mi</option>
                <option value={100}>100 mi</option>
                <option value={200}>200 mi</option>
              </select>
            </div>
          </div>
        </div>

        {/* Location permission banner (shown until location is obtained) */}
        {!hasLocation && (
          <LocationPermissionBanner
            status={geoStatus}
            onRequestLocation={requestLocation}
            onManualSearch={handleShowManualSearch}
          />
        )}

        {/* Manual address search */}
        {showManualSearch && !coordinates && (
          <AddressSearchInput
            onLocationFound={handleManualLocation}
            className="max-w-lg"
          />
        )}

        {/* View mode toggle + stats */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-1.5">
            {viewModes.map(({ key, icon: Icon, label, count }) => (
              <button
                key={key}
                onClick={() => setViewMode(key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  viewMode === key
                    ? 'bg-am-blue text-white shadow-sm'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
                <span className={`text-[10px] ${viewMode === key ? 'text-white/70' : 'text-gray-400'}`}>
                  ({count})
                </span>
              </button>
            ))}
          </div>

          <div className="text-sm text-gray-500 dark:text-gray-400">
            {isLoading ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {t('loading')}
              </span>
            ) : (
              <span>
                {t('showingDealersNearby', { count: sellers.length })}
                {vehicles.length > 0 && ` · ${t('vehicles', { count: vehicles.length })}`}
              </span>
            )}
          </div>
        </div>

        {/* Map */}
        <DealerVehicleMap
          sellers={viewMode !== 'vehicles' ? sellers : []}
          vehicles={viewMode !== 'dealers' ? vehicles : []}
          selectedSellerId={selectedSeller?.id}
          selectedVehicleId={selectedVehicle?.id}
          onSellerSelect={setSelectedSeller}
          onVehicleSelect={setSelectedVehicle}
          showServiceArea
          height="calc(100vh - 340px)"
          initialCenter={center}
          className="shadow-xl"
        />

        {/* Empty state */}
        {!isLoading && sellers.length === 0 && vehicles.length === 0 && (
          <div className="glass-crystal-enhanced rounded-2xl p-8 text-center">
            <MapPin className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              {t('noDealersFound')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {t('emptyState.hint')}
            </p>
            {!showManualSearch && (
              <button
                onClick={handleShowManualSearch}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-am-orange text-white text-sm font-bold rounded-xl hover:bg-am-orange-light transition-all"
              >
                <Navigation className="w-4 h-4" />
                {t('emptyState.trySearch')}
              </button>
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
