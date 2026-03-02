'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import dynamic from 'next/dynamic'
import { MapPin, Navigation, Store, Loader2, Check, AlertCircle, Search } from 'lucide-react'
import { HOUSTON_CENTER } from '@/lib/geo/types'
import { MAPBOX_TOKEN, MAPBOX_GEOCODING_URL } from '@/lib/config/mapbox'

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
type AddressStatus = 'idle' | 'searching' | 'found' | 'not_found'

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
  const [addressQuery, setAddressQuery] = useState('')
  const [addressStatus, setAddressStatus] = useState<AddressStatus>('idle')
  const [addressResult, setAddressResult] = useState<string | null>(null)
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
      setAddressResult(null)
    }
  }, [hasDealerCoords, dealerLatitude, dealerLongitude, onChange])

  const handleUseMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoStatus('error')
      setTimeout(() => setGeoStatus('idle'), 4000)
      return
    }

    setGeoStatus('detecting')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: lat, longitude: lng } = position.coords
        onChange(lat, lng, 'geolocated')
        setGeoStatus('detected')
        setAddressResult(null)
        setTimeout(() => setGeoStatus('idle'), 2000)
      },
      (err) => {
        console.warn('[VehicleLocationPicker] Geolocation error:', err.code, err.message)
        if (err.code === err.PERMISSION_DENIED) {
          setGeoStatus('denied')
        } else {
          setGeoStatus('error')
        }
        setTimeout(() => setGeoStatus('idle'), 4000)
      },
      {
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 120000, // 2 minutes cache
      }
    )
  }, [onChange])

  // Geocode address via Mapbox client-side
  const geocodeAddress = useCallback(async (query: string) => {
    if (!MAPBOX_TOKEN || query.trim().length < 3) return

    setAddressStatus('searching')

    try {
      const params = new URLSearchParams({
        q: query,
        access_token: MAPBOX_TOKEN,
        limit: '1',
        language: 'en',
        country: 'US',
        proximity: '-95.3698,29.7604', // Bias Houston
      })

      const res = await fetch(`${MAPBOX_GEOCODING_URL}?${params}`)
      if (!res.ok) {
        setAddressStatus('not_found')
        setTimeout(() => setAddressStatus('idle'), 3000)
        return
      }

      const data = await res.json()
      const feature = data.features?.[0]

      if (!feature) {
        setAddressStatus('not_found')
        setTimeout(() => setAddressStatus('idle'), 3000)
        return
      }

      const [lng, lat] = feature.geometry.coordinates
      const formatted = feature.properties?.full_address
        || feature.properties?.place_formatted
        || query

      onChange(lat, lng, 'manual')
      setAddressResult(formatted)
      setAddressStatus('found')
      setTimeout(() => setAddressStatus('idle'), 3000)
    } catch {
      setAddressStatus('not_found')
      setTimeout(() => setAddressStatus('idle'), 3000)
    }
  }, [onChange])

  // Debounced address search on Enter or button click
  const handleAddressSearch = useCallback(() => {
    if (addressQuery.trim().length >= 3) {
      geocodeAddress(addressQuery)
    }
  }, [addressQuery, geocodeAddress])

  const handleAddressKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddressSearch()
    }
  }, [handleAddressSearch])

  const handleMapMove = useCallback((lat: number, lng: number) => {
    onChange(lat, lng, 'manual')
    setAddressResult(null)
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

      {/* Address input */}
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
          {t('form.locationAddress')}
        </label>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              value={addressQuery}
              onChange={(e) => setAddressQuery(e.target.value)}
              onKeyDown={handleAddressKeyDown}
              placeholder={t('form.locationAddressPlaceholder')}
              className="w-full pl-8 pr-3 py-2 bg-white/50 dark:bg-am-dark/50 border border-gray-200 dark:border-am-blue/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-am-orange/50 placeholder:text-gray-400"
            />
          </div>
          <button
            type="button"
            onClick={handleAddressSearch}
            disabled={addressStatus === 'searching' || addressQuery.trim().length < 3}
            className="px-3 py-2 bg-am-orange hover:bg-am-orange-light text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            {addressStatus === 'searching' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Search className="w-3.5 h-3.5" />
            )}
            {t('form.locationSearch')}
          </button>
        </div>
        {/* Address search feedback */}
        {addressStatus === 'found' && addressResult && (
          <div className="flex items-center gap-1.5 text-xs text-am-green">
            <Check className="w-3 h-3" />
            <span className="truncate">{addressResult}</span>
          </div>
        )}
        {addressStatus === 'not_found' && (
          <div className="flex items-center gap-1.5 text-xs text-red-500">
            <AlertCircle className="w-3 h-3" />
            {t('form.locationAddressNotFound')}
          </div>
        )}
      </div>

      {/* Quick action buttons */}
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
