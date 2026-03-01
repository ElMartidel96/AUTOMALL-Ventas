/**
 * Geographic Types — Near Me System
 */

export interface GeoCoordinates {
  latitude: number
  longitude: number
}

export type GeocodeStatus = 'pending' | 'success' | 'failed' | 'manual'

export type CatalogDisplayMode = 'service_area' | 'full_catalog' | 'personal_only'

export interface ServiceAreaConfig {
  latitude: number | null
  longitude: number | null
  service_radius_km: number
  catalog_display_mode: CatalogDisplayMode
  geocode_status: GeocodeStatus
}

export interface NearbySellerResult {
  id: string
  handle: string
  business_name: string
  latitude: number
  longitude: number
  service_radius_km: number
  logo_url: string | null
  phone: string | null
  distance_km: number
  vehicle_count?: number
}

export interface GeocodeResult {
  latitude: number
  longitude: number
  formatted_address: string
  geocode_status: GeocodeStatus
}

/** Houston, TX center coordinates */
export const HOUSTON_CENTER: GeoCoordinates = {
  latitude: 29.7604,
  longitude: -95.3698,
}

export const DEFAULT_SERVICE_RADIUS_KM = 40
export const MIN_SERVICE_RADIUS_KM = 5
export const MAX_SERVICE_RADIUS_KM = 500
export const DEFAULT_SEARCH_RADIUS_KM = 50
