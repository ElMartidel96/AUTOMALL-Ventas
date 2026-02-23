'use client';

/**
 * Hook to detect and manage the current user's seller profile.
 * Used for onboarding detection, setup banners, and completion tracking.
 */

import { useQuery } from '@tanstack/react-query';
import { useAccount } from '@/lib/thirdweb';
import type { Seller } from '@/lib/types/seller';

interface SellerProfileResult {
  seller: Seller | null;
  isLoading: boolean;
  isOnboarded: boolean;
  hasPhone: boolean;
  completionPercentage: number;
  missingFields: string[];
  refetch: () => void;
}

/** Weighted fields for completion calculation */
const FIELD_WEIGHTS: Record<string, number> = {
  handle: 15,
  business_name: 15,
  phone: 20,
  whatsapp: 5,
  email: 5,
  logo_url: 10,
  tagline: 5,
  address: 5,
  hero_image_url: 5,
  social_instagram: 5,
  social_facebook: 5,
  social_tiktok: 5,
};

const TOTAL_WEIGHT = Object.values(FIELD_WEIGHTS).reduce((a, b) => a + b, 0);

function calculateCompletion(seller: Seller): { percentage: number; missing: string[] } {
  let earned = 0;
  const missing: string[] = [];

  for (const [field, weight] of Object.entries(FIELD_WEIGHTS)) {
    const value = seller[field as keyof Seller];
    if (value && String(value).trim()) {
      earned += weight;
    } else {
      missing.push(field);
    }
  }

  return {
    percentage: Math.round((earned / TOTAL_WEIGHT) * 100),
    missing,
  };
}

export function useSellerProfile(): SellerProfileResult {
  const { address, isConnected } = useAccount();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['seller-profile', address],
    queryFn: async () => {
      if (!address) return null;
      const res = await fetch(`/api/sellers?wallet=${encodeURIComponent(address)}`);
      if (res.status === 404) return null;
      const json = await res.json();
      if (!json.success) return null;
      return json.data as Seller;
    },
    enabled: isConnected && !!address,
    staleTime: 5 * 60_000,
  });

  const seller = data ?? null;
  const isOnboarded = seller?.onboarding_completed === true;
  const hasPhone = !!seller?.phone?.trim();
  const { percentage, missing } = seller
    ? calculateCompletion(seller)
    : { percentage: 0, missing: Object.keys(FIELD_WEIGHTS) };

  return {
    seller,
    isLoading,
    isOnboarded,
    hasPhone,
    completionPercentage: percentage,
    missingFields: missing,
    refetch,
  };
}
