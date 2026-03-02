'use client'

import React, { useState, useCallback, useMemo, useRef } from 'react'
import Map, { Marker, Source, Layer, NavigationControl } from 'react-map-gl/mapbox'
import type { MapRef } from 'react-map-gl/mapbox'
import { useTheme } from 'next-themes'
import { useTranslations } from 'next-intl'
import { MapPin, Navigation, Loader2, Info } from 'lucide-react'
import {
  MAPBOX_TOKEN,
  MAPBOX_STYLE_LIGHT,
  MAPBOX_STYLE_DARK,
} from '@/lib/config/mapbox'
import { haversineDistance, formatDistance } from '@/lib/geo/haversine'
import { estimateDriveTime } from '@/lib/geo/directions'
import { GetDirectionsButton } from '@/components/map/GetDirectionsButton'
import { useGeolocation } from '@/hooks/useGeolocation'

import 'mapbox-gl/dist/mapbox-gl.css'

interface VehicleLocationMapProps {
  latitude: number
  longitude: number
  vehicleTitle?: string
  address?: string
  className?: string
}

export default function VehicleLocationMap({
  latitude,
  longitude,
  vehicleTitle,
  address,
  className = '',
}: VehicleLocationMapProps) {
  const { resolvedTheme } = useTheme()
  const t = useTranslations('map')
  const mapRef = useRef<MapRef>(null)
  const { coordinates: userCoords, status: geoStatus, requestLocation } = useGeolocation()
  const [showUser, setShowUser] = useState(false)

  const mapStyle = resolvedTheme === 'dark' ? MAPBOX_STYLE_DARK : MAPBOX_STYLE_LIGHT

  // Calculate distance and route info when both points available
  const routeInfo = useMemo(() => {
    if (!showUser || !userCoords) return null
    const km = haversineDistance(userCoords.latitude, userCoords.longitude, latitude, longitude)
    const time = estimateDriveTime(km)
    return { km, distance: formatDistance(km), time: time.display }
  }, [showUser, userCoords, latitude, longitude])

  // GeoJSON line between vehicle and user
  const routeLine = useMemo((): GeoJSON.Feature<GeoJSON.LineString> | null => {
    if (!showUser || !userCoords) return null
    return {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: [
          [longitude, latitude],
          [userCoords.longitude, userCoords.latitude],
        ],
      },
    }
  }, [showUser, userCoords, latitude, longitude])

  // Handle "Show My Location" button
  const handleLocateMe = useCallback(() => {
    if (geoStatus === 'success' && userCoords) {
      setShowUser(true)
      // Fit bounds to include both points
      mapRef.current?.fitBounds(
        [
          [
            Math.min(longitude, userCoords.longitude) - 0.02,
            Math.min(latitude, userCoords.latitude) - 0.02,
          ],
          [
            Math.max(longitude, userCoords.longitude) + 0.02,
            Math.max(latitude, userCoords.latitude) + 0.02,
          ],
        ],
        { padding: 60, duration: 800 },
      )
    } else {
      requestLocation()
    }
  }, [geoStatus, userCoords, requestLocation, latitude, longitude])

  // When geolocation succeeds, show user and fit bounds
  React.useEffect(() => {
    if (geoStatus === 'success' && userCoords && !showUser) {
      setShowUser(true)
      mapRef.current?.fitBounds(
        [
          [
            Math.min(longitude, userCoords.longitude) - 0.02,
            Math.min(latitude, userCoords.latitude) - 0.02,
          ],
          [
            Math.max(longitude, userCoords.longitude) + 0.02,
            Math.max(latitude, userCoords.latitude) + 0.02,
          ],
        ],
        { padding: 60, duration: 800 },
      )
    }
  }, [geoStatus, userCoords, showUser, latitude, longitude])

  if (!MAPBOX_TOKEN) {
    return (
      <div className="w-full h-[300px] bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
        <p className="text-gray-500 text-xs">Map not configured</p>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Map */}
      <div className="w-full h-[300px] md:h-[350px] relative">
        <Map
          ref={mapRef}
          initialViewState={{
            longitude,
            latitude,
            zoom: 14,
          }}
          mapStyle={mapStyle}
          mapboxAccessToken={MAPBOX_TOKEN}
          style={{ width: '100%', height: '100%' }}
          attributionControl={false}
        >
          <NavigationControl position="top-right" showCompass={false} />

          {/* Route line */}
          {routeLine && (
            <Source type="geojson" data={routeLine}>
              <Layer
                id="route-line"
                type="line"
                paint={{
                  'line-color': '#E8832A',
                  'line-width': 2.5,
                  'line-opacity': 0.7,
                  'line-dasharray': [4, 3],
                }}
              />
            </Source>
          )}

          {/* Vehicle marker */}
          <Marker longitude={longitude} latitude={latitude} anchor="bottom">
            <div className="flex flex-col items-center">
              <div className="w-9 h-9 bg-gradient-to-br from-am-orange to-am-orange-light rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                <svg className="w-4.5 h-4.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
                </svg>
              </div>
              <div className="w-2 h-2 bg-am-orange rounded-full -mt-1 shadow" />
            </div>
          </Marker>

          {/* User location marker */}
          {showUser && userCoords && (
            <Marker
              longitude={userCoords.longitude}
              latitude={userCoords.latitude}
              anchor="center"
            >
              <div className="relative">
                <div className="w-5 h-5 bg-am-blue rounded-full border-2 border-white shadow-lg" />
                <div className="absolute inset-0 w-5 h-5 bg-am-blue rounded-full animate-ping opacity-30" />
              </div>
            </Marker>
          )}
        </Map>

        {/* Locate Me button overlay — top-left inside map */}
        {!showUser && (
          <button
            onClick={handleLocateMe}
            disabled={geoStatus === 'loading'}
            className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-xs font-medium rounded-lg shadow-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all disabled:opacity-60"
          >
            {geoStatus === 'loading' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Navigation className="w-3.5 h-3.5 text-am-blue" />
            )}
            {geoStatus === 'loading' ? t('directions.locating') : t('directions.locateMe')}
          </button>
        )}
      </div>

      {/* Route info panel — below map */}
      {routeInfo && (
        <div className="px-4 py-3 border-t border-gray-200/50 dark:border-gray-700/50">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Distance + time */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {t('directions.routeInfo', { distance: routeInfo.distance, time: routeInfo.time })}
              </p>
              <p className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                <Info className="w-3 h-3 flex-shrink-0" />
                {t('directions.straightLineNote')}
              </p>
            </div>

            {/* Get Directions */}
            <GetDirectionsButton
              destLat={latitude}
              destLng={longitude}
              originLat={userCoords?.latitude}
              originLng={userCoords?.longitude}
              label={vehicleTitle}
              variant="primary"
              className="sm:w-auto"
            />
          </div>
        </div>
      )}

      {/* Directions button (no user location) — show if user hasn't shared location yet */}
      {!routeInfo && (
        <div className="px-4 py-3 border-t border-gray-200/50 dark:border-gray-700/50">
          <GetDirectionsButton
            destLat={latitude}
            destLng={longitude}
            label={vehicleTitle}
            variant="primary"
          />
        </div>
      )}
    </div>
  )
}
