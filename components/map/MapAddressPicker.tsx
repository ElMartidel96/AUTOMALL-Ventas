'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { MapPin, Check, AlertCircle, Loader2 } from 'lucide-react'

const MiniMap = dynamic(() => import('./MiniMapPicker'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[200px] bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
  ),
})

interface MapAddressPickerProps {
  value: string
  onChange: (address: string) => void
  onCoordinatesChange?: (lat: number, lng: number) => void
  latitude?: number | null
  longitude?: number | null
  geocodeStatus?: string
}

export function MapAddressPicker({
  value,
  onChange,
  onCoordinatesChange,
  latitude,
  longitude,
  geocodeStatus,
}: MapAddressPickerProps) {
  const t = useTranslations('map')
  const [showMap, setShowMap] = useState(false)

  const hasCoords = latitude != null && longitude != null
  const isVerified = geocodeStatus === 'success' || geocodeStatus === 'manual'
  const isFailed = geocodeStatus === 'failed'

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {t('addressPlaceholder')}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2">
          <MapPin size={18} className="text-gray-400" />
        </span>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t('addressPlaceholder')}
          className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-am-blue/50 focus:border-am-blue transition-all"
        />
        {/* Status indicator */}
        <span className="absolute right-3 top-1/2 -translate-y-1/2">
          {isVerified && <Check className="w-4 h-4 text-am-green" />}
          {isFailed && <AlertCircle className="w-4 h-4 text-red-500" />}
        </span>
      </div>

      {/* Status text */}
      {isVerified && (
        <p className="text-xs text-am-green mt-1 flex items-center gap-1">
          <Check className="w-3 h-3" />
          {t('addressVerified')}
        </p>
      )}
      {isFailed && (
        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {t('addressNotFound')}
        </p>
      )}

      {/* Toggle map */}
      <button
        type="button"
        onClick={() => setShowMap(!showMap)}
        className="mt-2 text-xs text-am-blue hover:text-am-blue-light font-medium"
      >
        {showMap ? 'Hide map' : t('viewOnMap')}
      </button>

      {/* Mini map preview */}
      {showMap && (
        <div className="mt-2">
          <MiniMap
            latitude={latitude || 29.7604}
            longitude={longitude || -95.3698}
            onMove={(lat, lng) => {
              onCoordinatesChange?.(lat, lng)
            }}
            hasCoords={hasCoords}
          />
          {!hasCoords && (
            <p className="text-xs text-gray-500 mt-1">{t('dragPin')}</p>
          )}
        </div>
      )}
    </div>
  )
}
