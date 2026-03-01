'use client'

import React, { useState, useCallback } from 'react'
import Map, { Marker, NavigationControl } from 'react-map-gl/mapbox'
import { useTheme } from 'next-themes'
import {
  MAPBOX_TOKEN,
  MAPBOX_STYLE_LIGHT,
  MAPBOX_STYLE_DARK,
} from '@/lib/config/mapbox'

import 'mapbox-gl/dist/mapbox-gl.css'

interface MiniMapPickerProps {
  latitude: number
  longitude: number
  onMove?: (lat: number, lng: number) => void
  hasCoords: boolean
}

export default function MiniMapPicker({
  latitude,
  longitude,
  onMove,
  hasCoords,
}: MiniMapPickerProps) {
  const { resolvedTheme } = useTheme()
  const [markerPos, setMarkerPos] = useState({ latitude, longitude })
  const mapStyle = resolvedTheme === 'dark' ? MAPBOX_STYLE_DARK : MAPBOX_STYLE_LIGHT

  const handleMarkerDragEnd = useCallback((e: { lngLat: { lng: number; lat: number } }) => {
    const { lng, lat } = e.lngLat
    setMarkerPos({ latitude: lat, longitude: lng })
    onMove?.(lat, lng)
  }, [onMove])

  if (!MAPBOX_TOKEN) {
    return (
      <div className="w-full h-[200px] bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
        <p className="text-gray-500 text-xs">Map not configured</p>
      </div>
    )
  }

  return (
    <div className="w-full h-[200px] rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      <Map
        initialViewState={{
          longitude: markerPos.longitude,
          latitude: markerPos.latitude,
          zoom: hasCoords ? 14 : 10,
        }}
        mapStyle={mapStyle}
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
      >
        <NavigationControl position="top-right" showCompass={false} />
        <Marker
          longitude={markerPos.longitude}
          latitude={markerPos.latitude}
          draggable
          onDragEnd={handleMarkerDragEnd}
          anchor="bottom"
        >
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 bg-am-orange rounded-full border-2 border-white shadow-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
              </svg>
            </div>
          </div>
        </Marker>
      </Map>
    </div>
  )
}
