'use client'

import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { MapPin, Navigation, Loader2 } from 'lucide-react'
import { useGeolocation } from '@/hooks/useGeolocation'
import { useNearbyDealers } from '@/hooks/useNearbyDealers'
import { HOUSTON_CENTER, DEFAULT_SEARCH_RADIUS_KM } from '@/lib/geo/types'
import type { NearbySellerResult } from '@/lib/geo/types'
import { FEATURE_NEAR_ME } from '@/lib/config/features'

const DealerMap = dynamic(() => import('@/components/map/DealerMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
    </div>
  ),
})

export default function MapPage() {
  const t = useTranslations('map')
  const { coordinates, status, requestLocation } = useGeolocation()
  const [radius, setRadius] = useState(DEFAULT_SEARCH_RADIUS_KM)
  const [selectedSeller, setSelectedSeller] = useState<NearbySellerResult | null>(null)

  // Use user's location or Houston center
  const center = coordinates || HOUSTON_CENTER

  const { data, isLoading } = useNearbyDealers({
    latitude: center.latitude,
    longitude: center.longitude,
    radius,
    enabled: true,
  })

  const sellers = data?.data || []

  // Auto-request location on mount
  useEffect(() => {
    if (status === 'idle') {
      requestLocation()
    }
  }, [status, requestLocation])

  if (!FEATURE_NEAR_ME) return null

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-am-dark">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 pt-6 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <MapPin className="w-6 h-6 text-am-orange" />
              {t('title')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              {t('subtitle')}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Radius control */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 dark:text-gray-400">
                {t('radius')}:
              </label>
              <select
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value={10}>10 km</option>
                <option value={25}>25 km</option>
                <option value={50}>50 km</option>
                <option value={100}>100 km</option>
                <option value={200}>200 km</option>
              </select>
            </div>

            {/* Location button */}
            {status !== 'success' && (
              <button
                onClick={requestLocation}
                disabled={status === 'loading'}
                className="flex items-center gap-2 px-4 py-2 bg-am-blue text-white text-sm font-medium rounded-lg hover:bg-am-blue-light transition-colors disabled:opacity-50"
              >
                {status === 'loading' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Navigation className="w-4 h-4" />
                )}
                {status === 'loading' ? t('loading') : t('nearMe')}
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-3 flex items-center gap-4 text-sm">
          {isLoading ? (
            <span className="text-gray-500">{t('loading')}</span>
          ) : (
            <span className="text-gray-600 dark:text-gray-400">
              {t('showingDealersNearby', { count: sellers.length })}
            </span>
          )}
          {status === 'denied' && (
            <span className="text-am-orange text-xs">
              {t('permissionDenied')}
            </span>
          )}
        </div>
      </div>

      {/* Map */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        <DealerMap
          sellers={sellers}
          selectedSellerId={selectedSeller?.id}
          onSellerSelect={setSelectedSeller}
          showServiceArea
          height="calc(100vh - 220px)"
          className="shadow-xl"
          initialCenter={center}
        />
      </div>
    </div>
  )
}
