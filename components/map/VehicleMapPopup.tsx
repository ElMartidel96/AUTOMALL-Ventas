'use client'

import React from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Gauge, Calendar, ExternalLink } from 'lucide-react'

export interface MapVehicle {
  id: string
  brand: string
  model: string
  year: number
  price: number
  mileage: number
  primary_image_url: string | null
  seller_handle: string | null
  seller_name: string | null
  latitude: number
  longitude: number
}

interface VehicleMapPopupProps {
  vehicle: MapVehicle
  onClose: () => void
}

export function VehicleMapPopup({ vehicle, onClose }: VehicleMapPopupProps) {
  const t = useTranslations('map')
  const title = `${vehicle.year} ${vehicle.brand} ${vehicle.model}`

  return (
    <div className="glass-card rounded-xl overflow-hidden min-w-[220px] max-w-[260px] shadow-xl">
      {/* Image */}
      {vehicle.primary_image_url && (
        <div className="w-full h-28 bg-gray-100 dark:bg-gray-800">
          <img
            src={vehicle.primary_image_url}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="p-3">
        {/* Title + price */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-0.5 flex-shrink-0"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-base font-bold text-am-orange mt-1">
          ${Number(vehicle.price).toLocaleString()}
        </p>

        {/* Quick specs */}
        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <Gauge className="w-3 h-3" />
            {Number(vehicle.mileage).toLocaleString()} mi
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {vehicle.year}
          </span>
        </div>

        {/* Seller name */}
        {vehicle.seller_name && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate">
            {vehicle.seller_name}
          </p>
        )}

        {/* CTA */}
        <Link
          href={`/catalog/${vehicle.id}`}
          className="flex items-center justify-center gap-1.5 w-full mt-2.5 px-3 py-2 bg-gradient-to-r from-am-orange to-am-orange-light text-white text-xs font-bold rounded-lg hover:shadow-md transition-all"
        >
          <ExternalLink className="w-3 h-3" />
          {t('vehiclePopup.viewDetails')}
        </Link>
      </div>
    </div>
  )
}
