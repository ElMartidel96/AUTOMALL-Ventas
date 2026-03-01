/**
 * Vehicle Inventory Hooks
 *
 * React Query hooks for all vehicle CRUD, image, and VIN operations.
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Vehicle, VehicleInsert, VehicleUpdate, VehicleImage } from '@/lib/supabase/types';

// =====================================================
// Types
// =====================================================

export interface VehicleWithImages extends Vehicle {
  images: VehicleImage[];
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface VehicleFilters {
  status?: string;
  brand?: string;
  search?: string;
  page?: number;
  limit?: number;
}

interface DecodedVINData {
  brand: string | null;
  model: string | null;
  year: number | null;
  trim: string | null;
  body_type: string | null;
  doors: number | null;
  transmission: string | null;
  fuel_type: string | null;
  drivetrain: string | null;
  engine: string | null;
}

// =====================================================
// API Helpers
// =====================================================

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  const json = await res.json();
  if (!res.ok || !json.success) {
    const msg = json.error || `API error: ${res.status}`;
    if (json.details) {
      console.error('[API] Validation details:', JSON.stringify(json.details));
    }
    throw new Error(msg);
  }
  return json as T;
}

// =====================================================
// Query Hooks
// =====================================================

export function useVehicles(seller: string | undefined, filters: VehicleFilters = {}) {
  return useQuery({
    queryKey: ['vehicles', seller, filters],
    queryFn: async () => {
      if (!seller) throw new Error('No seller');
      const params = new URLSearchParams({ seller: seller.toLowerCase() });
      if (filters.status) params.set('status', filters.status);
      if (filters.brand) params.set('brand', filters.brand);
      if (filters.search) params.set('search', filters.search);
      if (filters.page) params.set('page', String(filters.page));
      if (filters.limit) params.set('limit', String(filters.limit));

      const res = await apiFetch<PaginatedResponse<Vehicle>>(
        `/api/inventory?${params.toString()}`
      );
      return res;
    },
    enabled: !!seller,
  });
}

export function useVehicle(id: string | undefined) {
  return useQuery({
    queryKey: ['vehicle', id],
    queryFn: async () => {
      if (!id) throw new Error('No id');
      const res = await apiFetch<{ success: boolean; data: VehicleWithImages }>(
        `/api/inventory/${id}`
      );
      return res.data;
    },
    enabled: !!id,
  });
}

// =====================================================
// Mutation Hooks
// =====================================================

export function useCreateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<VehicleInsert, 'id' | 'created_at' | 'updated_at'>) => {
      const res = await apiFetch<{ success: boolean; data: { id: string } }>(
        '/api/inventory',
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }
      );
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });
}

export function useUpdateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: VehicleUpdate & { id: string; seller_address: string }) => {
      const res = await apiFetch<{ success: boolean; data: Vehicle }>(
        `/api/inventory/${id}`,
        { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }
      );
      return res.data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['vehicles'] });
      qc.invalidateQueries({ queryKey: ['vehicle', vars.id] });
    },
  });
}

export function useDeleteVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, seller }: { id: string; seller: string }) => {
      await apiFetch<{ success: boolean }>(
        `/api/inventory/${id}?seller=${seller}`,
        { method: 'DELETE' }
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });
}

export function useUpdateVehicleStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, seller, status }: { id: string; seller: string; status: string }) => {
      const res = await apiFetch<{ success: boolean; data: Vehicle }>(
        `/api/inventory/${id}/status`,
        { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ seller, status }) }
      );
      return res.data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['vehicles'] });
      qc.invalidateQueries({ queryKey: ['vehicle', vars.id] });
    },
  });
}

// =====================================================
// Image Hooks
// =====================================================

export function useUploadImages() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ vehicleId, seller, files }: { vehicleId: string; seller: string; files: Blob[] }) => {
      const formData = new FormData();
      formData.append('seller', seller);
      files.forEach((f) => formData.append('images', f));

      const res = await apiFetch<{
        success: boolean;
        data: { uploaded: Array<{ id: string; public_url: string; display_order: number }>; errors: string[] };
      }>(`/api/inventory/${vehicleId}/images`, { method: 'POST', body: formData });
      return res.data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['vehicle', vars.vehicleId] });
      qc.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });
}

export function useDeleteImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ vehicleId, imageId, seller }: { vehicleId: string; imageId: string; seller: string }) => {
      await apiFetch<{ success: boolean }>(
        `/api/inventory/${vehicleId}/images?imageId=${imageId}&seller=${seller}`,
        { method: 'DELETE' }
      );
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['vehicle', vars.vehicleId] });
      qc.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });
}

export function useReorderImages() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ vehicleId, seller, imageIds }: { vehicleId: string; seller: string; imageIds: string[] }) => {
      await apiFetch<{ success: boolean }>(
        `/api/inventory/${vehicleId}/images/reorder`,
        { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ seller, imageIds }) }
      );
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['vehicle', vars.vehicleId] });
    },
  });
}

// =====================================================
// VIN Decoder
// =====================================================

export function useDecodeVIN() {
  return useMutation({
    mutationFn: async (vin: string) => {
      const res = await apiFetch<{ success: boolean; data: DecodedVINData }>(
        `/api/inventory/vin/${vin}`
      );
      return res.data;
    },
  });
}
