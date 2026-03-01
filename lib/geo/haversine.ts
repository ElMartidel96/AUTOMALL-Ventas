/**
 * Haversine Distance — Client-side utility
 *
 * Calculates the great-circle distance between two points on Earth.
 * Used for preview/UI calculations. Server-side uses the SQL function.
 */

const EARTH_RADIUS_KM = 6371.0

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

/**
 * Calculate distance in km between two coordinates
 */
export function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const dlat = toRad(lat2 - lat1)
  const dlon = toRad(lon2 - lon1)
  const a =
    Math.sin(dlat / 2) * Math.sin(dlat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dlon / 2) * Math.sin(dlon / 2)
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/**
 * Convert km to miles
 */
export function kmToMiles(km: number): number {
  return km * 0.621371
}

/**
 * Format distance for display
 */
export function formatDistance(km: number, unit: 'km' | 'mi' = 'mi'): string {
  const value = unit === 'mi' ? kmToMiles(km) : km
  if (value < 1) return `< 1 ${unit}`
  return `${Math.round(value)} ${unit}`
}
