'use client'

import { useState, useEffect, useCallback } from 'react'
import type { GeoCoordinates } from '@/lib/geo/types'

type GeoStatus = 'idle' | 'loading' | 'success' | 'denied' | 'error'

interface UseGeolocationResult {
  coordinates: GeoCoordinates | null
  status: GeoStatus
  error: string | null
  requestLocation: () => void
}

export function useGeolocation(): UseGeolocationResult {
  const [coordinates, setCoordinates] = useState<GeoCoordinates | null>(null)
  const [status, setStatus] = useState<GeoStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus('error')
      setError('Geolocation is not supported')
      return
    }

    setStatus('loading')
    setError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
        setStatus('success')
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setStatus('denied')
          setError('Permission denied')
        } else {
          setStatus('error')
          setError(err.message)
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes cache
      },
    )
  }, [])

  return { coordinates, status, error, requestLocation }
}
