'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import dynamic from 'next/dynamic'
import { MapPin, Navigation, Store, Loader2, Check, AlertCircle } from 'lucide-react'
import { HOUSTON_CENTER } from '@/lib/geo/types'

const MiniMapPicker = dynamic(() => import('@/components/map/MiniMapPicker'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[200px] bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center animate-pulse">
      <MapPin className="w-6 h-6 text-gray-400" />
    </div>
  ),
})

type LocationSource = 'dealer' | 'manual' | 'geolocated'

interface VehicleLocationPickerProps {
  latitude: number | null
  longitude: number | null
  locationSource: LocationSource | null
  dealerLatitude: number | null
  dealerLongitude: number | null
  onChange: (lat: number | null, lng: number | null, source: LocationSource) => void
}

type GeoStatus = 'idle' | 'detecting' | 'detected' | 'denied' | 'error'

export function VehicleLocationPicker({
  latitude,
  longitude,
  locationSource,
  dealerLatitude,
  dealerLongitude,
  onChange,
}: VehicleLocationPickerProps) {
  const t = useTranslations('inventory')
  const [geoStatus, setGeoStatus] = useState<GeoStatus>('idle')

  const hasCoords = latitude != null && longitude != null
  const hasDealerCoords = dealerLatitude != null && dealerLongitude != null

  // Auto-set dealer location on mount if no coords and dealer has coords
  useEffect(() => {
    if (!hasCoords && hasDealerCoords) {
      onChange(dealerLatitude, dealerLongitude, 'dealer')
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleUseDealer = useCallback(() => {
    if (hasDealerCoords) {
      onChange(dealerLatitude, dealerLongitude, 'dealer')
    }
  }, [hasDealerCoords, dealerLatitude, dealerLongitude, onChange])

  const handleUseMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoStatus('error')
      return
    }

    setGeoStatus('detecting')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: lat, longitude: lng } = position.coords
        onChange(lat, lng, 'geolocated')
        setGeoStatus('detected')
        // Reset status after feedback
        setTimeout(() => setGeoStatus('idle'), 2000)
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setGeoStatus('denied')
        } else {
          setGeoStatus('error')
        }
        // Reset status after feedback
        setTimeout(() => setGeoStatus('idle'), 4000)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    )
  }, [onChange])

  const handleMapMove = useCallback((lat: number, lng: number) => {
    onChange(lat, lng, 'manual')
  }, [onChange])

  const displayLat = latitude ?? HOUSTON_CENTER.latitude
  const displayLng = longitude ?? HOUSTON_CENTER.longitude

  const sourceLabel = locationSource === 'dealer'
    ? t('form.locationFromDealer')
    : locationSource === 'geolocated'
    ? t('form.locationGeolocated')
    : locationSource === 'manual'
    ? t('form.locationManual')
    : null

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <MapPin className="w-4 h-4 text-am-orange" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          {t('form.locationSection')}
        </h3>
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-500">
        {t('form.locationHint')}
      </p>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        {hasDealerCoords && (
          <button
            type="button"
            onClick={handleUseDealer}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              locationSource === 'dealer'
                ? 'bg-am-blue text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-am-blue/10 dark:hover:bg-am-blue/20'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            {t('form.locationUseDealer')}
          </button>
        )}

        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={geoStatus === 'detecting'}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            locationSource === 'geolocated'
              ? 'bg-am-green text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-am-green/10 dark:hover:bg-am-green/20'
          } disabled:opacity-50`}
        >
          {geoStatus === 'detecting' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : geoStatus === 'detected' ? (
            <Check className="w-3.5 h-3.5" />
          ) : (
            <Navigation className="w-3.5 h-3.5" />
          )}
          {geoStatus === 'detecting'
            ? t('form.locationDetecting')
            : geoStatus === 'detected'
            ? t('form.locationDetected')
            : t('form.locationUseMyLocation')
          }
        </button>
      </div>

      {/* Geolocation error/denied feedback */}
      {(geoStatus === 'denied' || geoStatus === 'error') && (
        <div className="flex items-center gap-2 text-xs text-red-500 dark:text-red-400">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{geoStatus === 'denied' ? t('form.locationDenied') : t('form.locationError')}</span>
        </div>
      )}

      {/* Map */}
      <MiniMapPicker
        latitude={displayLat}
        longitude={displayLng}
        hasCoords={hasCoords}
        onMove={handleMapMove}
      />

      {/* Status indicator */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {t('form.locationDragHint')}
        </p>
        {sourceLabel && hasCoords && (
          <span className="inline-flex items-center gap-1 text-xs text-am-blue dark:text-am-blue-light font-medium">
            <Check className="w-3 h-3" />
            {sourceLabel}
          </span>
        )}
      </div>
    </div>
  )
}
