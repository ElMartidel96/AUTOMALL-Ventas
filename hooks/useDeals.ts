/**
 * Deal Hooks
 *
 * React Query hooks for CRM deals, payments, stats, and export.
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CRMDeal, CRMPayment, DealInsert, DealUpdate, PaymentUpdate, DealStats, DealFilters } from '@/lib/crm/types';

// ─────────────────────────────────────────────
// Response Types
// ─────────────────────────────────────────────

interface DealsResponse {
  deals: CRMDeal[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface DealDetailResponse {
  deal: CRMDeal;
  payments: CRMPayment[];
}

// ─────────────────────────────────────────────
// Deals List
// ─────────────────────────────────────────────

export function useDeals(walletAddress: string | undefined, filters?: DealFilters) {
  const params = new URLSearchParams();
  if (filters?.deal_status) params.set('deal_status', filters.deal_status);
  if (filters?.financing_type) params.set('financing_type', filters.financing_type);
  if (filters?.search) params.set('search', filters.search);
  if (filters?.date_from) params.set('date_from', filters.date_from);
  if (filters?.date_to) params.set('date_to', filters.date_to);
  if (filters?.page) params.set('page', String(filters.page));
  if (filters?.limit) params.set('limit', String(filters.limit));

  return useQuery<DealsResponse>({
    queryKey: ['deals', walletAddress, filters],
    queryFn: async () => {
      const res = await fetch(`/api/crm/deals?${params.toString()}`, {
        headers: { 'x-wallet-address': walletAddress! },
      });
      if (!res.ok) throw new Error('Failed to fetch deals');
      return res.json();
    },
    enabled: !!walletAddress,
    staleTime: 30_000,
  });
}

// ─────────────────────────────────────────────
// Single Deal + Payments
// ─────────────────────────────────────────────

export function useDeal(walletAddress: string | undefined, dealId: string | undefined) {
  return useQuery<DealDetailResponse>({
    queryKey: ['deal', walletAddress, dealId],
    queryFn: async () => {
      const res = await fetch(`/api/crm/deals/${dealId}`, {
        headers: { 'x-wallet-address': walletAddress! },
      });
      if (!res.ok) throw new Error('Failed to fetch deal');
      return res.json();
    },
    enabled: !!walletAddress && !!dealId,
    staleTime: 30_000,
  });
}

// ─────────────────────────────────────────────
// Create Deal
// ─────────────────────────────────────────────

export function useCreateDeal(walletAddress: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation<{ deal: CRMDeal }, Error, DealInsert>({
    mutationFn: async (input) => {
      const res = await fetch('/api/crm/deals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': walletAddress!,
        },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create deal');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals', walletAddress] });
      queryClient.invalidateQueries({ queryKey: ['deal-stats', walletAddress] });
    },
  });
}

// ─────────────────────────────────────────────
// Update Deal
// ─────────────────────────────────────────────

export function useUpdateDeal(walletAddress: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation<{ deal: CRMDeal }, Error, { id: string; data: DealUpdate }>({
    mutationFn: async ({ id, data }) => {
      const res = await fetch(`/api/crm/deals/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': walletAddress!,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update deal');
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['deals', walletAddress] });
      queryClient.invalidateQueries({ queryKey: ['deal', walletAddress, variables.id] });
      queryClient.invalidateQueries({ queryKey: ['deal-stats', walletAddress] });
    },
  });
}

// ─────────────────────────────────────────────
// Delete Deal
// ─────────────────────────────────────────────

export function useDeleteDeal(walletAddress: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: async (id) => {
      const res = await fetch(`/api/crm/deals/${id}`, {
        method: 'DELETE',
        headers: { 'x-wallet-address': walletAddress! },
      });
      if (!res.ok) throw new Error('Failed to delete deal');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals', walletAddress] });
      queryClient.invalidateQueries({ queryKey: ['deal-stats', walletAddress] });
    },
  });
}

// ─────────────────────────────────────────────
// Record Payment
// ─────────────────────────────────────────────

export function useRecordPayment(walletAddress: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation<{ payment: CRMPayment }, Error, { dealId: string; paymentId: string; data: PaymentUpdate }>({
    mutationFn: async ({ dealId, paymentId, data }) => {
      const res = await fetch(`/api/crm/deals/${dealId}/payments`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': walletAddress!,
        },
        body: JSON.stringify({ payment_id: paymentId, ...data }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to record payment');
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['deals', walletAddress] });
      queryClient.invalidateQueries({ queryKey: ['deal', walletAddress, variables.dealId] });
      queryClient.invalidateQueries({ queryKey: ['deal-stats', walletAddress] });
    },
  });
}

// ─────────────────────────────────────────────
// Deal Stats
// ─────────────────────────────────────────────

export function useDealStats(walletAddress: string | undefined) {
  return useQuery<DealStats>({
    queryKey: ['deal-stats', walletAddress],
    queryFn: async () => {
      const res = await fetch('/api/crm/deals/stats', {
        headers: { 'x-wallet-address': walletAddress! },
      });
      if (!res.ok) throw new Error('Failed to fetch deal stats');
      return res.json();
    },
    enabled: !!walletAddress,
    staleTime: 60_000,
  });
}

// ─────────────────────────────────────────────
// Export to Excel
// ─────────────────────────────────────────────

export function useExportDeals(walletAddress: string | undefined) {
  return useMutation<void, Error>({
    mutationFn: async () => {
      const res = await fetch('/api/crm/export', {
        headers: { 'x-wallet-address': walletAddress! },
      });
      if (!res.ok) throw new Error('Failed to export deals');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `AUTOMALL_Control_Ventas_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
  });
}
