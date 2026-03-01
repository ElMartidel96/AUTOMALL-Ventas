'use client'

import { useQuery } from '@tanstack/react-query'
import type { NearbySellerResult } from '@/lib/geo/types'

interface UseNearbyDealersParams {
  latitude?: number | null
  longitude?: number | null
  radius?: number
  enabled?: boolean
}

interface NearbyDealersResponse {
  success: boolean
  data: NearbySellerResult[]
  total: number
}

export function useNearbyDealers({
  latitude,
  longitude,
  radius = 50,
  enabled = true,
}: UseNearbyDealersParams) {
  return useQuery<NearbyDealersResponse>({
    queryKey: ['nearbyDealers', latitude, longitude, radius],
    queryFn: async () => {
      const params = new URLSearchParams({
        lat: String(latitude),
        lng: String(longitude),
        radius: String(radius),
      })
      const res = await fetch(`/api/sellers/nearby?${params}`)
      if (!res.ok) throw new Error('Failed to fetch nearby dealers')
      return res.json()
    },
    enabled: enabled && latitude != null && longitude != null,
    staleTime: 60_000,
  })
}
