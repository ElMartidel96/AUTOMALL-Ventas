'use client'

import { useQuery } from '@tanstack/react-query'
import type { MapVehicle } from '@/components/map/VehicleMapPopup'

interface MapVehiclesResponse {
  success: boolean
  data: MapVehicle[]
  total: number
}

export function useMapVehicles({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery<MapVehiclesResponse>({
    queryKey: ['mapVehicles'],
    queryFn: async () => {
      const res = await fetch('/api/catalog/map?limit=200')
      if (!res.ok) throw new Error('Failed to fetch map vehicles')
      return res.json()
    },
    enabled,
    staleTime: 60_000,
  })
}
