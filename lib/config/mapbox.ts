/**
 * Mapbox Configuration — Near Me System
 */

export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''
export const MAPBOX_SECRET_TOKEN = process.env.MAPBOX_SECRET_TOKEN || ''

/** Map styles for dark/light mode */
export const MAPBOX_STYLE_LIGHT = 'mapbox://styles/mapbox/light-v11'
export const MAPBOX_STYLE_DARK = 'mapbox://styles/mapbox/dark-v11'

/** Houston, TX center */
export const MAP_DEFAULT_CENTER = {
  longitude: -95.3698,
  latitude: 29.7604,
}

/** Zoom levels */
export const MAP_ZOOM = {
  city: 10,
  area: 12,
  neighborhood: 14,
  street: 16,
} as const

/** Default initial view state */
export const MAP_INITIAL_VIEW = {
  ...MAP_DEFAULT_CENTER,
  zoom: MAP_ZOOM.city,
}

/** Mapbox Geocoding API base URL */
export const MAPBOX_GEOCODING_URL = 'https://api.mapbox.com/search/geocode/v6/forward'
