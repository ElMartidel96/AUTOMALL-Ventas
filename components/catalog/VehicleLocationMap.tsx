'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import { MapPin } from 'lucide-react'

const MiniMapPicker = dynamic(() => import('@/components/map/MiniMapPicker'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[200px] bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center animate-pulse">
      <MapPin className="w-6 h-6 text-gray-400" />
    </div>
  ),
})

interface VehicleLocationMapProps {
  latitude: number
  longitude: number
  className?: string
}

export default function VehicleLocationMap({
  latitude,
  longitude,
  className = '',
}: VehicleLocationMapProps) {
  return (
    <div className={className}>
      <MiniMapPicker
        latitude={latitude}
        longitude={longitude}
        hasCoords={true}
      />
    </div>
  )
}
