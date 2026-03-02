'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Navigation, ChevronDown } from 'lucide-react'
import {
  getNavigationApps,
  getDirectionsUrl,
  type NavigationApp,
} from '@/lib/geo/directions'

type Variant = 'primary' | 'compact' | 'popup'

interface GetDirectionsButtonProps {
  destLat: number
  destLng: number
  originLat?: number
  originLng?: number
  label?: string
  variant?: Variant
  className?: string
}

const NAV_ICONS: Record<string, React.ReactNode> = {
  google: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
    </svg>
  ),
  apple: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  ),
  waze: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.54 6.63c-1.83-3.39-6.08-5.23-9.81-4.26C7.19 3.35 4.27 6.52 4.03 10.14c-.14 2.2.66 4.11 1.87 5.67-.42.9-.93 1.73-1.57 2.47-.25.28-.01.74.37.65 1.42-.33 2.74-.93 3.89-1.75 1.17.45 2.42.67 3.73.6 3.53-.19 6.63-2.53 7.82-5.89.66-1.88.66-3.68-.6-5.26zM8.5 12c-.83 0-1.5-.67-1.5-1.5S7.67 9 8.5 9s1.5.67 1.5 1.5S9.33 12 8.5 12zm4 0c-.83 0-1.5-.67-1.5-1.5S11.67 9 12.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4 0c-.83 0-1.5-.67-1.5-1.5S15.67 9 16.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
    </svg>
  ),
}

export function GetDirectionsButton({
  destLat,
  destLng,
  originLat,
  originLng,
  label,
  variant = 'primary',
  className = '',
}: GetDirectionsButtonProps) {
  const t = useTranslations('map')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const apps = getNavigationApps()

  const handleAppClick = (appId: NavigationApp) => {
    const url = getDirectionsUrl(appId, {
      destLat,
      destLng,
      originLat,
      originLng,
      label,
    })
    window.open(url, '_blank', 'noopener,noreferrer')
    setOpen(false)
  }

  const buttonLabel = label || t('directions.getDirections')

  // Variant styles
  const buttonStyles: Record<Variant, string> = {
    primary:
      'flex items-center justify-center gap-2 w-full px-5 py-3 bg-gradient-to-r from-am-orange to-am-orange-light text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5',
    compact:
      'flex items-center justify-center gap-2 flex-1 px-5 py-3 bg-gradient-to-r from-am-blue to-am-blue-light text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5',
    popup:
      'flex items-center justify-center gap-1 flex-1 px-3 py-2 bg-am-blue text-white text-xs font-medium rounded-lg hover:bg-am-blue-light transition-colors',
  }

  const dropdownAlign = variant === 'popup' ? 'right-0' : 'left-0'

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        onClick={() => setOpen(!open)}
        className={buttonStyles[variant]}
      >
        <Navigation className={variant === 'popup' ? 'w-3 h-3' : 'w-4 h-4'} />
        {variant === 'popup' ? t('vehiclePopup.getDirections') : buttonLabel}
        <ChevronDown className={`${variant === 'popup' ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'} transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className={`absolute ${dropdownAlign} bottom-full mb-1 z-50 min-w-[180px] py-1 rounded-xl shadow-xl border glass-card border-gray-200 dark:border-gray-700`}>
          <p className="px-3 py-1.5 text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            {t('directions.openIn')}
          </p>
          {apps.map((app) => (
            <button
              key={app.id}
              onClick={() => handleAppClick(app.id)}
              className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
            >
              <span className="text-am-orange">{NAV_ICONS[app.icon]}</span>
              {app.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
