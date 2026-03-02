/**
 * Navigation Directions — Deep link URLs for Google Maps, Apple Maps, Waze
 * Pure functions, zero dependencies.
 */

export type NavigationApp = 'google_maps' | 'apple_maps' | 'waze'
export type Platform = 'ios' | 'android' | 'desktop'

interface DirectionsOptions {
  destLat: number
  destLng: number
  originLat?: number
  originLng?: number
  label?: string
}

/** Google Maps directions URL */
export function getGoogleMapsUrl(opts: DirectionsOptions): string {
  const dest = `${opts.destLat},${opts.destLng}`
  const params = new URLSearchParams({
    api: '1',
    destination: dest,
    travelmode: 'driving',
  })
  if (opts.originLat !== undefined && opts.originLng !== undefined) {
    params.set('origin', `${opts.originLat},${opts.originLng}`)
  }
  return `https://www.google.com/maps/dir/?${params.toString()}`
}

/** Apple Maps directions URL */
export function getAppleMapsUrl(opts: DirectionsOptions): string {
  const params = new URLSearchParams({
    daddr: `${opts.destLat},${opts.destLng}`,
    dirflg: 'd', // driving
  })
  if (opts.originLat !== undefined && opts.originLng !== undefined) {
    params.set('saddr', `${opts.originLat},${opts.originLng}`)
  }
  return `https://maps.apple.com/?${params.toString()}`
}

/** Waze directions URL */
export function getWazeUrl(opts: DirectionsOptions): string {
  return `https://waze.com/ul?ll=${opts.destLat},${opts.destLng}&navigate=yes`
}

/** Detect user platform */
export function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return 'desktop'
  const ua = navigator.userAgent
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios'
  if (/Android/.test(ua)) return 'android'
  return 'desktop'
}

interface NavigationAppInfo {
  id: NavigationApp
  label: string
  icon: 'google' | 'apple' | 'waze'
}

/** Get navigation apps ordered by platform preference */
export function getNavigationApps(platform?: Platform): NavigationAppInfo[] {
  const p = platform ?? detectPlatform()
  const google: NavigationAppInfo = { id: 'google_maps', label: 'Google Maps', icon: 'google' }
  const apple: NavigationAppInfo = { id: 'apple_maps', label: 'Apple Maps', icon: 'apple' }
  const waze: NavigationAppInfo = { id: 'waze', label: 'Waze', icon: 'waze' }

  if (p === 'ios') return [apple, google, waze]
  return [google, apple, waze]
}

/** Get directions URL for a specific app */
export function getDirectionsUrl(app: NavigationApp, opts: DirectionsOptions): string {
  switch (app) {
    case 'google_maps': return getGoogleMapsUrl(opts)
    case 'apple_maps': return getAppleMapsUrl(opts)
    case 'waze': return getWazeUrl(opts)
  }
}

interface DriveTimeEstimate {
  minutes: number
  display: string
}

/** Estimate drive time from distance — variable speed by distance */
export function estimateDriveTime(distanceKm: number): DriveTimeEstimate {
  // Urban: <10km → ~30 km/h, Suburban: <50km → ~45 km/h, Highway: >50km → ~70 km/h
  let speedKmh: number
  if (distanceKm < 10) speedKmh = 30
  else if (distanceKm < 50) speedKmh = 45
  else speedKmh = 70

  const minutes = Math.round((distanceKm / speedKmh) * 60)

  let display: string
  if (minutes < 60) {
    display = `${minutes} min`
  } else {
    const hours = Math.floor(minutes / 60)
    const remainingMin = minutes % 60
    display = remainingMin > 0 ? `${hours}h ${remainingMin}m` : `${hours}h`
  }

  return { minutes, display }
}
