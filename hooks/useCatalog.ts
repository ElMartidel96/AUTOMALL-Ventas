/**
 * Public Catalog Hooks
 *
 * React Query hooks for the public catalog API (no auth required).
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import type { Vehicle, VehicleImage } from '@/lib/supabase/types';
import type { SellerContact } from '@/lib/types/seller';

// Catalog vehicle excludes seller_address, optionally includes seller_contact
export type CatalogVehicle = Omit<Vehicle, 'seller_address'> & {
  seller_contact?: SellerContact;
};

export interface CatalogVehicleWithImages extends CatalogVehicle {
  images: VehicleImage[];
  related: CatalogVehicle[];
}

interface CatalogFilters {
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  body_type?: string;
  fuel_type?: string;
  transmission?: string;
  drivetrain?: string;
  minMileage?: number;
  maxMileage?: number;
  condition?: string;
  search?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

interface CatalogResponse {
  success: boolean;
  data: CatalogVehicle[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    brands: string[];
    bodyTypes: string[];
    priceRange: [number, number];
  };
}

async function catalogFetch<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || `API error: ${res.status}`);
  }
  return json as T;
}

export function useCatalogVehicles(filters: CatalogFilters = {}) {
  return useQuery({
    queryKey: ['catalog', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== null) {
          params.set(key, String(value));
        }
      });
      return catalogFetch<CatalogResponse>(`/api/catalog?${params.toString()}`);
    },
    staleTime: 60_000,
  });
}

export function useCatalogVehicle(id: string | undefined) {
  return useQuery({
    queryKey: ['catalog-vehicle', id],
    queryFn: async () => {
      if (!id) throw new Error('No id');
      const res = await catalogFetch<{ success: boolean; data: CatalogVehicleWithImages }>(
        `/api/catalog/${id}`
      );
      return res.data;
    },
    enabled: !!id,
    staleTime: 60_000,
  });
}

export function useFeaturedVehicles() {
  return useCatalogVehicles({ sort: 'newest', limit: 12 });
}
