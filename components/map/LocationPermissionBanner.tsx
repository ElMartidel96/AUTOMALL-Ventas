'use client'

/**
 * LocationPermissionBanner — friendly prompt to request geolocation
 * Shows before the browser's native permission dialog.
 * Explains WHY we need location + offers manual address as fallback.
 */

import React from 'react'
import { useTranslations } from 'next-intl'
import { MapPin, Navigation, Loader2, Shield } from 'lucide-react'

type GeoStatus = 'idle' | 'loading' | 'success' | 'denied' | 'error'

interface LocationPermissionBannerProps {
  status: GeoStatus
  onRequestLocation: () => void
  onManualSearch: () => void
}

export function LocationPermissionBanner({
  status,
  onRequestLocation,
  onManualSearch,
}: LocationPermissionBannerProps) {
  const t = useTranslations('map')

  // Don't show if already have location
  if (status === 'success') return null

  return (
    <div className="glass-crystal-enhanced rounded-2xl p-5 md:p-6 border border-am-blue/10 dark:border-am-blue/20">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Icon */}
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-am-blue to-am-blue-light flex items-center justify-center">
          <MapPin className="w-6 h-6 text-white" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            {t('locationBanner.title')}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {t('locationBanner.description')}
          </p>
          {/* Trust badge */}
          <div className="flex items-center gap-1.5 mt-1.5">
            <Shield className="w-3 h-3 text-am-green" />
            <span className="text-xs text-am-green font-medium">
              {t('locationBanner.privacy')}
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button
            onClick={onRequestLocation}
            disabled={status === 'loading'}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-am-orange to-am-orange-light text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {status === 'loading' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Navigation className="w-4 h-4" />
            )}
            {status === 'loading' ? t('loading') : t('locationBanner.enable')}
          </button>

          <button
            onClick={onManualSearch}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
          >
            {t('locationBanner.searchManually')}
          </button>
        </div>
      </div>

      {/* Denied / error feedback */}
      {status === 'denied' && (
        <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-am-orange/10 border border-am-orange/20">
          <MapPin className="w-4 h-4 text-am-orange flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
              {t('locationBanner.deniedTitle')}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {t('locationBanner.deniedHint')}
            </p>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30">
          <MapPin className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600 dark:text-red-400">
            {t('locationBanner.errorHint')}
          </p>
        </div>
      )}
    </div>
  )
}
