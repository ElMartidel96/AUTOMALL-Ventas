'use client'

import React from 'react'

interface MapMarkerProps {
  logoUrl?: string | null
  isSelected?: boolean
  onClick?: () => void
}

export function MapMarker({ logoUrl, isSelected, onClick }: MapMarkerProps) {
  return (
    <button
      onClick={onClick}
      className={`
        relative flex items-center justify-center
        w-10 h-10 rounded-full border-2 shadow-lg
        transition-all duration-200 cursor-pointer
        ${isSelected
          ? 'border-am-orange bg-am-orange scale-125 z-10'
          : 'border-am-blue bg-white dark:bg-gray-800 hover:scale-110'
        }
      `}
    >
      {logoUrl ? (
        <img
          src={logoUrl}
          alt=""
          className="w-7 h-7 rounded-full object-cover"
        />
      ) : (
        <svg className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-am-blue'}`} fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l7-3.5L19 21z" />
        </svg>
      )}
      {/* Pin tail */}
      <div className={`
        absolute -bottom-2 left-1/2 -translate-x-1/2
        w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px]
        border-l-transparent border-r-transparent
        ${isSelected ? 'border-t-am-orange' : 'border-t-am-blue'}
      `} />
    </button>
  )
}
