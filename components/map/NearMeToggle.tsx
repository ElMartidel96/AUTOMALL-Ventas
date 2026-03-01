'use client'

import React from 'react'
import { useTranslations } from 'next-intl'
import { Navigation, Loader2 } from 'lucide-react'

interface NearMeToggleProps {
  enabled: boolean
  onToggle: (enabled: boolean) => void
  radius: number
  onRadiusChange: (radius: number) => void
  isLocating?: boolean
  locationDenied?: boolean
}

export function NearMeToggle({
  enabled,
  onToggle,
  radius,
  onRadiusChange,
  isLocating,
  locationDenied,
}: NearMeToggleProps) {
  const t = useTranslations('map')

  return (
    <div className="space-y-2">
      {/* Toggle */}
      <button
        onClick={() => onToggle(!enabled)}
        disabled={isLocating}
        className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium transition-all ${
          enabled
            ? 'bg-am-orange/10 text-am-orange border border-am-orange/30'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-am-orange/30'
        }`}
      >
        {isLocating ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Navigation className={`w-4 h-4 ${enabled ? 'text-am-orange' : ''}`} />
        )}
        {t('nearMe')}
        {enabled && (
          <span className="ml-auto text-xs opacity-70">{radius} km</span>
        )}
      </button>

      {/* Radius slider (only when enabled) */}
      {enabled && (
        <div className="px-1">
          <input
            type="range"
            min={10}
            max={200}
            step={10}
            value={radius}
            onChange={(e) => onRadiusChange(Number(e.target.value))}
            className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-am-orange"
          />
          <div className="flex justify-between text-[10px] text-gray-400">
            <span>10 km</span>
            <span>200 km</span>
          </div>
        </div>
      )}

      {/* Location denied hint */}
      {locationDenied && (
        <p className="text-[10px] text-am-orange">
          {t('permissionDenied')}
        </p>
      )}

      {enabled && (
        <p className="text-[10px] text-gray-500 dark:text-gray-400">
          {t('nearMeHint')}
        </p>
      )}
    </div>
  )
}
