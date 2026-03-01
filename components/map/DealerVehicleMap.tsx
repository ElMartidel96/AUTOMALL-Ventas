'use client'

/**
 * DealerVehicleMap — combined map showing dealers + vehicles
 * Extends the original DealerMap with vehicle markers and popups.
 */

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
import { VehicleMapMarker } from './VehicleMapMarker'
import { VehicleMapPopup, type MapVehicle } from './VehicleMapPopup'
import { ServiceAreaCircle } from './ServiceAreaCircle'
import type { NearbySellerResult } from '@/lib/geo/types'

import 'mapbox-gl/dist/mapbox-gl.css'

interface DealerVehicleMapProps {
  sellers: NearbySellerResult[]
  vehicles: MapVehicle[]
  selectedSellerId?: string | null
  selectedVehicleId?: string | null
  onSellerSelect?: (seller: NearbySellerResult | null) => void
  onVehicleSelect?: (vehicle: MapVehicle | null) => void
  showServiceArea?: boolean
  height?: string
  className?: string
  initialCenter?: { latitude: number; longitude: number }
  initialZoom?: number
}

export default function DealerVehicleMap({
  sellers,
  vehicles,
  selectedSellerId,
  selectedVehicleId,
  onSellerSelect,
  onVehicleSelect,
  showServiceArea = false,
  height = '500px',
  className = '',
  initialCenter,
  initialZoom,
}: DealerVehicleMapProps) {
  const { resolvedTheme } = useTheme()
  const [popupSeller, setPopupSeller] = useState<NearbySellerResult | null>(null)
  const [popupVehicle, setPopupVehicle] = useState<MapVehicle | null>(null)

  const mapStyle = resolvedTheme === 'dark' ? MAPBOX_STYLE_DARK : MAPBOX_STYLE_LIGHT

  const initialViewState = useMemo(() => ({
    longitude: initialCenter?.longitude ?? MAP_INITIAL_VIEW.longitude,
    latitude: initialCenter?.latitude ?? MAP_INITIAL_VIEW.latitude,
    zoom: initialZoom ?? MAP_INITIAL_VIEW.zoom,
  }), [initialCenter, initialZoom])

  const handleSellerClick = useCallback((seller: NearbySellerResult) => {
    setPopupSeller(seller)
    setPopupVehicle(null)
    onSellerSelect?.(seller)
    onVehicleSelect?.(null)
  }, [onSellerSelect, onVehicleSelect])

  const handleVehicleClick = useCallback((vehicle: MapVehicle) => {
    setPopupVehicle(vehicle)
    setPopupSeller(null)
    onVehicleSelect?.(vehicle)
    onSellerSelect?.(null)
  }, [onSellerSelect, onVehicleSelect])

  const handlePopupClose = useCallback(() => {
    setPopupSeller(null)
    setPopupVehicle(null)
    onSellerSelect?.(null)
    onVehicleSelect?.(null)
  }, [onSellerSelect, onVehicleSelect])

  const selectedSeller = useMemo(() =>
    sellers.find(s => s.id === selectedSellerId),
    [sellers, selectedSellerId]
  )

  if (!MAPBOX_TOKEN) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-2xl ${className}`} style={{ height }}>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Map not configured. Set NEXT_PUBLIC_MAPBOX_TOKEN.
        </p>
      </div>
    )
  }

  return (
    <div className={`rounded-2xl overflow-hidden ${className}`} style={{ height }}>
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

        {/* Vehicle markers (render first = below dealers) */}
        {vehicles.map(vehicle => (
          <Marker
            key={`v-${vehicle.id}`}
            longitude={vehicle.longitude}
            latitude={vehicle.latitude}
            anchor="bottom"
          >
            <VehicleMapMarker
              imageUrl={vehicle.primary_image_url}
              isSelected={vehicle.id === (popupVehicle?.id || selectedVehicleId)}
              onClick={() => handleVehicleClick(vehicle)}
            />
          </Marker>
        ))}

        {/* Seller markers (render second = on top) */}
        {sellers.map(seller => (
          <Marker
            key={`s-${seller.id}`}
            longitude={seller.longitude}
            latitude={seller.latitude}
            anchor="bottom"
          >
            <MapMarker
              logoUrl={seller.logo_url}
              isSelected={seller.id === (popupSeller?.id || selectedSellerId)}
              onClick={() => handleSellerClick(seller)}
            />
          </Marker>
        ))}

        {/* Seller popup */}
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

        {/* Vehicle popup */}
        {popupVehicle && (
          <Popup
            longitude={popupVehicle.longitude}
            latitude={popupVehicle.latitude}
            anchor="bottom"
            offset={40}
            closeOnClick={false}
            onClose={handlePopupClose}
            closeButton={false}
            className="!p-0 [&_.mapboxgl-popup-content]:!p-0 [&_.mapboxgl-popup-content]:!bg-transparent [&_.mapboxgl-popup-content]:!shadow-none [&_.mapboxgl-popup-tip]:!border-t-white/80 dark:[&_.mapboxgl-popup-tip]:!border-t-gray-800/80"
          >
            <VehicleMapPopup vehicle={popupVehicle} onClose={handlePopupClose} />
          </Popup>
        )}
      </Map>
    </div>
  )
}
