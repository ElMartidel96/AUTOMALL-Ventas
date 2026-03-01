'use client'

import React, { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { MapPin, Save, Loader2, Check, Radio } from 'lucide-react'
import type { Seller } from '@/lib/types/seller'
import type { CatalogDisplayMode } from '@/lib/geo/types'
import {
  MIN_SERVICE_RADIUS_KM,
  MAX_SERVICE_RADIUS_KM,
} from '@/lib/geo/types'

const DealerMap = dynamic(() => import('@/components/map/DealerMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[250px] bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
  ),
})

interface ServiceAreaSettingsProps {
  seller: Seller
  onSave: (updates: { service_radius_km?: number; catalog_display_mode?: CatalogDisplayMode }) => Promise<void>
}

const DISPLAY_MODES: { value: CatalogDisplayMode; labelKey: string; descKey: string }[] = [
  { value: 'service_area', labelKey: 'modeServiceArea', descKey: 'modeServiceAreaDesc' },
  { value: 'full_catalog', labelKey: 'modeFullCatalog', descKey: 'modeFullCatalogDesc' },
  { value: 'personal_only', labelKey: 'modePersonalOnly', descKey: 'modePersonalOnlyDesc' },
]

export function ServiceAreaSettings({ seller, onSave }: ServiceAreaSettingsProps) {
  const t = useTranslations('map')
  const [radius, setRadius] = useState(seller.service_radius_km || 40)
  const [displayMode, setDisplayMode] = useState<CatalogDisplayMode>(seller.catalog_display_mode || 'service_area')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const hasLocation = seller.latitude != null && seller.longitude != null

  const handleSave = useCallback(async () => {
    setSaving(true)
    setSaved(false)
    try {
      await onSave({
        service_radius_km: radius,
        catalog_display_mode: displayMode,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setSaving(false)
    }
  }, [radius, displayMode, onSave])

  const sellerAsNearby = hasLocation ? [{
    id: seller.id,
    handle: seller.handle,
    business_name: seller.business_name,
    latitude: seller.latitude!,
    longitude: seller.longitude!,
    service_radius_km: radius,
    logo_url: seller.logo_url || null,
    phone: seller.phone || null,
    distance_km: 0,
  }] : []

  return (
    <div className="glass-crystal-enhanced rounded-2xl p-5">
      <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <MapPin className="w-5 h-5 text-am-orange" />
        {t('serviceAreaSettings')}
      </h3>

      {!hasLocation && (
        <div className="mb-4 p-3 bg-am-orange/10 dark:bg-am-orange/5 border border-am-orange/20 rounded-lg">
          <p className="text-sm text-am-orange">
            {t('addressNotFound')} — Save your address first to enable the map.
          </p>
        </div>
      )}

      {/* Mini map preview */}
      {hasLocation && (
        <div className="mb-4">
          <DealerMap
            sellers={sellerAsNearby}
            selectedSellerId={seller.id}
            showServiceArea
            height="250px"
            initialCenter={{ latitude: seller.latitude!, longitude: seller.longitude! }}
            initialZoom={10}
          />
        </div>
      )}

      {/* Radius slider */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('serviceAreaRadius')}: <span className="text-am-orange font-bold">{radius} km</span>
        </label>
        <input
          type="range"
          min={MIN_SERVICE_RADIUS_KM}
          max={MAX_SERVICE_RADIUS_KM}
          step={5}
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-am-orange"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{MIN_SERVICE_RADIUS_KM} km</span>
          <span>{MAX_SERVICE_RADIUS_KM} km</span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          {t('serviceAreaHint')}
        </p>
      </div>

      {/* Display mode */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          {t('catalogDisplayMode')}
        </label>
        <div className="space-y-2">
          {DISPLAY_MODES.map((mode) => (
            <label
              key={mode.value}
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                displayMode === mode.value
                  ? 'border-am-orange bg-am-orange/5 dark:bg-am-orange/10'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="displayMode"
                value={mode.value}
                checked={displayMode === mode.value}
                onChange={(e) => setDisplayMode(e.target.value as CatalogDisplayMode)}
                className="mt-0.5 accent-am-orange"
              />
              <div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {t(mode.labelKey)}
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {t(mode.descKey)}
                </p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-am-blue text-white font-medium rounded-lg hover:bg-am-blue-light transition-colors disabled:opacity-50"
      >
        {saving ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : saved ? (
          <Check className="w-4 h-4" />
        ) : (
          <Save className="w-4 h-4" />
        )}
        {saved ? t('saved') : saving ? '...' : 'Save'}
      </button>
    </div>
  )
}
