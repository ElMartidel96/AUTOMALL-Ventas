/**
 * Server-side Geocoding — Mapbox Geocoding API v6
 *
 * Converts address strings to lat/lng coordinates.
 * Used in /api/sellers PATCH when address changes.
 */

import { MAPBOX_GEOCODING_URL } from '@/lib/config/mapbox'
import type { GeocodeResult } from './types'

const MAPBOX_TOKEN = process.env.MAPBOX_SECRET_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

interface MapboxFeature {
  geometry: { coordinates: [number, number] }
  properties: {
    full_address?: string
    name?: string
    place_formatted?: string
  }
}

interface MapboxResponse {
  features: MapboxFeature[]
}

/**
 * Geocode an address to coordinates using Mapbox Geocoding API v6
 *
 * @param address - Street address
 * @param city - City (default: Houston)
 * @param state - State (default: TX)
 * @returns GeocodeResult or null if geocoding fails
 */
export async function geocodeAddress(
  address: string,
  city = 'Houston',
  state = 'TX',
): Promise<GeocodeResult | null> {
  if (!MAPBOX_TOKEN) {
    console.warn('[Geocode] No Mapbox token configured')
    return null
  }

  const fullAddress = [address, city, state].filter(Boolean).join(', ')
  if (!fullAddress.trim()) return null

  try {
    const params = new URLSearchParams({
      q: fullAddress,
      access_token: MAPBOX_TOKEN,
      limit: '1',
      language: 'en',
      country: 'US',
      // Bias towards Houston, TX area
      proximity: '-95.3698,29.7604',
    })

    const response = await fetch(`${MAPBOX_GEOCODING_URL}?${params}`)
    if (!response.ok) {
      console.error(`[Geocode] API error: ${response.status}`)
      return null
    }

    const data: MapboxResponse = await response.json()
    const feature = data.features?.[0]

    if (!feature) {
      console.warn(`[Geocode] No results for: ${fullAddress}`)
      return null
    }

    const [longitude, latitude] = feature.geometry.coordinates
    const formatted = feature.properties.full_address
      || feature.properties.place_formatted
      || fullAddress

    return {
      latitude,
      longitude,
      formatted_address: formatted,
      geocode_status: 'success',
    }
  } catch (error) {
    console.error('[Geocode] Failed:', error)
    return null
  }
}
