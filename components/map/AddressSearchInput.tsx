'use client'

/**
 * AddressSearchInput — manual address/city/zip search
 * Geocodes the address using Mapbox and sets the map center.
 * Used as fallback when geolocation is denied or unavailable.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Search, Loader2, MapPin, X } from 'lucide-react'
import { MAPBOX_TOKEN } from '@/lib/config/mapbox'

interface AddressSearchInputProps {
  onLocationFound: (lat: number, lng: number, label: string) => void
  placeholder?: string
  className?: string
}

interface Suggestion {
  id: string
  name: string
  full_address: string
  latitude: number
  longitude: number
}

export function AddressSearchInput({
  onLocationFound,
  placeholder,
  className = '',
}: AddressSearchInputProps) {
  const t = useTranslations('map')
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close suggestions on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const searchAddress = useCallback(async (q: string) => {
    if (!MAPBOX_TOKEN || q.length < 3) {
      setSuggestions([])
      return
    }

    setIsSearching(true)
    try {
      const params = new URLSearchParams({
        q,
        access_token: MAPBOX_TOKEN,
        limit: '5',
        language: 'en,es',
        country: 'US',
        proximity: '-95.3698,29.7604', // Houston bias
        types: 'place,postcode,address,locality,neighborhood',
      })

      const res = await fetch(`https://api.mapbox.com/search/geocode/v6/forward?${params}`)
      if (!res.ok) throw new Error('Geocode failed')

      const data = await res.json()
      const results: Suggestion[] = (data.features || []).map((f: {
        id: string
        properties: { name: string; full_address?: string; place_formatted?: string }
        geometry: { coordinates: [number, number] }
      }) => ({
        id: f.id,
        name: f.properties.name,
        full_address: f.properties.full_address || f.properties.place_formatted || f.properties.name,
        latitude: f.geometry.coordinates[1],
        longitude: f.geometry.coordinates[0],
      }))

      setSuggestions(results)
      setShowSuggestions(results.length > 0)
    } catch {
      setSuggestions([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  const handleInputChange = (value: string) => {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => searchAddress(value), 300)
  }

  const handleSelect = (suggestion: Suggestion) => {
    setQuery(suggestion.full_address)
    setShowSuggestions(false)
    setSuggestions([])
    onLocationFound(suggestion.latitude, suggestion.longitude, suggestion.full_address)
  }

  const handleClear = () => {
    setQuery('')
    setSuggestions([])
    setShowSuggestions(false)
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder || t('addressSearch.placeholder')}
          className="w-full pl-9 pr-9 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-am-orange/50 focus:border-am-orange transition-all"
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
        )}
        {!isSearching && query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden">
          {suggestions.map((s) => (
            <button
              key={s.id}
              onClick={() => handleSelect(s)}
              className="w-full flex items-start gap-2.5 px-3 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <MapPin className="w-4 h-4 text-am-orange flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {s.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {s.full_address}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
