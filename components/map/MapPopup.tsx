'use client'

import React from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { MapPin, Phone, ExternalLink } from 'lucide-react'
import { formatDistance } from '@/lib/geo/haversine'
import type { NearbySellerResult } from '@/lib/geo/types'

interface MapPopupProps {
  seller: NearbySellerResult
  onClose: () => void
}

export function MapPopup({ seller, onClose }: MapPopupProps) {
  const t = useTranslations('map')

  return (
    <div className="glass-card rounded-xl p-4 min-w-[240px] max-w-[280px] shadow-xl">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        {seller.logo_url ? (
          <img
            src={seller.logo_url}
            alt={seller.business_name}
            className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-am-blue/10 dark:bg-am-blue/20 flex items-center justify-center flex-shrink-0">
            <MapPin className="w-5 h-5 text-am-blue" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
            {seller.business_name}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t('distance', { distance: formatDistance(seller.distance_km) })}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Info */}
      <div className="space-y-1.5 mb-3">
        {seller.phone && (
          <a
            href={`tel:${seller.phone}`}
            className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 hover:text-am-blue"
          >
            <Phone className="w-3.5 h-3.5" />
            {seller.phone}
          </a>
        )}
        {seller.vehicle_count !== undefined && (
          <p className="text-xs text-am-orange font-medium">
            {t('vehicles', { count: seller.vehicle_count })}
          </p>
        )}
      </div>

      {/* CTA */}
      <Link
        href={`https://${seller.handle}.autosmall.org`}
        target="_blank"
        className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-am-blue text-white text-xs font-medium rounded-lg hover:bg-am-blue-light transition-colors"
      >
        <ExternalLink className="w-3.5 h-3.5" />
        {t('viewCatalog')}
      </Link>
    </div>
  )
}
