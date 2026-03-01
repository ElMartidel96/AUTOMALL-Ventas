'use client'

import React, { useState, useCallback, useMemo } from 'react'
import Map, { Marker, Popup, NavigationControl, GeolocateControl } from 'react-map-gl/mapbox'
import { useTheme } from 'next-themes'
import {
  MAPBOX_TOKEN,
  MAPBOX_STYLE_LIGHT,
  MAPBOX_STYLE_DARK,
  MAP_INITIAL_VIEW,
} from '@/lib/config/mapbox'
import { MapMarker } from './MapMarker'
import { MapPopup } from './MapPopup'
import { ServiceAreaCircle } from './ServiceAreaCircle'
import type { NearbySellerResult } from '@/lib/geo/types'

import 'mapbox-gl/dist/mapbox-gl.css'

interface DealerMapProps {
  sellers: NearbySellerResult[]
  selectedSellerId?: string | null
  onSellerSelect?: (seller: NearbySellerResult | null) => void
  showServiceArea?: boolean
  height?: string
  className?: string
  initialCenter?: { latitude: number; longitude: number }
  initialZoom?: number
}

export default function DealerMap({
  sellers,
  selectedSellerId,
  onSellerSelect,
  showServiceArea = false,
  height = '500px',
  className = '',
  initialCenter,
  initialZoom,
}: DealerMapProps) {
  const { resolvedTheme } = useTheme()
  const [popupSeller, setPopupSeller] = useState<NearbySellerResult | null>(null)

  const mapStyle = resolvedTheme === 'dark' ? MAPBOX_STYLE_DARK : MAPBOX_STYLE_LIGHT

  const initialViewState = useMemo(() => ({
    longitude: initialCenter?.longitude ?? MAP_INITIAL_VIEW.longitude,
    latitude: initialCenter?.latitude ?? MAP_INITIAL_VIEW.latitude,
    zoom: initialZoom ?? MAP_INITIAL_VIEW.zoom,
  }), [initialCenter, initialZoom])

  const handleMarkerClick = useCallback((seller: NearbySellerResult) => {
    setPopupSeller(seller)
    onSellerSelect?.(seller)
  }, [onSellerSelect])

  const handlePopupClose = useCallback(() => {
    setPopupSeller(null)
    onSellerSelect?.(null)
  }, [onSellerSelect])

  const selectedSeller = useMemo(() =>
    sellers.find(s => s.id === selectedSellerId),
    [sellers, selectedSellerId]
  )

  if (!MAPBOX_TOKEN) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-xl ${className}`} style={{ height }}>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Map not configured. Set NEXT_PUBLIC_MAPBOX_TOKEN.
        </p>
      </div>
    )
  }

  return (
    <div className={`rounded-xl overflow-hidden ${className}`} style={{ height }}>
      <Map
        initialViewState={initialViewState}
        mapStyle={mapStyle}
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
      >
        <NavigationControl position="top-right" />
        <GeolocateControl position="top-right" trackUserLocation />

        {/* Service area circle for selected seller */}
        {showServiceArea && selectedSeller && (
          <ServiceAreaCircle
            center={[selectedSeller.longitude, selectedSeller.latitude]}
            radiusKm={selectedSeller.service_radius_km}
          />
        )}

        {/* Seller markers */}
        {sellers.map(seller => (
          <Marker
            key={seller.id}
            longitude={seller.longitude}
            latitude={seller.latitude}
            anchor="bottom"
          >
            <MapMarker
              logoUrl={seller.logo_url}
              isSelected={seller.id === (popupSeller?.id || selectedSellerId)}
              onClick={() => handleMarkerClick(seller)}
            />
          </Marker>
        ))}

        {/* Popup */}
        {popupSeller && (
          <Popup
            longitude={popupSeller.longitude}
            latitude={popupSeller.latitude}
            anchor="bottom"
            offset={50}
            closeOnClick={false}
            onClose={handlePopupClose}
            closeButton={false}
            className="!p-0 [&_.mapboxgl-popup-content]:!p-0 [&_.mapboxgl-popup-content]:!bg-transparent [&_.mapboxgl-popup-content]:!shadow-none [&_.mapboxgl-popup-tip]:!border-t-white/80 dark:[&_.mapboxgl-popup-tip]:!border-t-gray-800/80"
          >
            <MapPopup seller={popupSeller} onClose={handlePopupClose} />
          </Popup>
        )}
      </Map>
    </div>
  )
}
