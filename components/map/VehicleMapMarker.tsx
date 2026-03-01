'use client'

import React from 'react'
import { Car } from 'lucide-react'

interface VehicleMapMarkerProps {
  imageUrl?: string | null
  isSelected?: boolean
  onClick?: () => void
}

export function VehicleMapMarker({ imageUrl, isSelected, onClick }: VehicleMapMarkerProps) {
  return (
    <button
      onClick={onClick}
      className={`
        relative flex items-center justify-center
        w-9 h-9 rounded-lg border-2 shadow-md
        transition-all duration-200 cursor-pointer
        ${isSelected
          ? 'border-am-orange bg-am-orange scale-125 z-10'
          : 'border-am-orange/60 bg-white dark:bg-gray-800 hover:scale-110'
        }
      `}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          className="w-6 h-6 rounded object-cover"
        />
      ) : (
        <Car className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-am-orange'}`} />
      )}
      {/* Pin tail */}
      <div className={`
        absolute -bottom-1.5 left-1/2 -translate-x-1/2
        w-0 h-0 border-l-[5px] border-r-[5px] border-t-[6px]
        border-l-transparent border-r-transparent
        ${isSelected ? 'border-t-am-orange' : 'border-t-am-orange/60'}
      `} />
    </button>
  )
}
