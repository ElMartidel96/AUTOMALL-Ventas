/**
 * Engagement Hooks
 *
 * React Query hooks for Facebook engagement tracking.
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface EngagementMetrics {
  likes: number;
  comments: number;
  shares: number;
  reactions: number;
}

interface VehicleEngagementResponse {
  publications: {
    id: string;
    fb_post_id: string;
    post_type: string;
    status: string;
    permalink_url: string | null;
    created_at: string;
  }[];
  engagement: Record<string, EngagementMetrics & {
    impressions: number | null;
    reach: number | null;
    clicks: number | null;
    engaged_users: number | null;
    fetched_at: string;
  }>;
}

interface SyncResponse {
  synced: number;
  cached?: boolean;
  metrics: Record<string, EngagementMetrics>;
}

export function useVehicleEngagement(walletAddress: string | undefined, vehicleId: string | undefined) {
  return useQuery<VehicleEngagementResponse>({
    queryKey: ['vehicle-engagement', walletAddress, vehicleId],
    queryFn: async () => {
      const res = await fetch(`/api/meta/engagement/${vehicleId}`, {
        headers: { 'x-wallet-address': walletAddress! },
      });
      if (!res.ok) throw new Error('Failed to fetch engagement');
      return res.json();
    },
    enabled: !!walletAddress && !!vehicleId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useSyncEngagement(walletAddress: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation<SyncResponse, Error, { vehicleId?: string }>({
    mutationFn: async ({ vehicleId }) => {
      const res = await fetch('/api/meta/engagement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': walletAddress!,
        },
        body: JSON.stringify({ vehicleId }),
      });
      if (!res.ok) throw new Error('Failed to sync engagement');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meta-connection', walletAddress] });
      queryClient.invalidateQueries({ queryKey: ['vehicle-engagement', walletAddress] });
    },
  });
}
