/**
 * CRM Hooks
 *
 * React Query hooks for CRM leads, interactions, and stats.
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface CRMLead {
  id: string;
  seller_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  whatsapp: string | null;
  source: string;
  source_detail: string | null;
  vehicle_id: string | null;
  interest_level: string;
  status: string;
  notes: string | null;
  budget_min: number | null;
  budget_max: number | null;
  created_at: string;
  updated_at: string;
  last_contacted_at: string | null;
  converted_at: string | null;
}

export interface CRMInteraction {
  id: string;
  lead_id: string;
  seller_id: string;
  type: string;
  direction: string;
  summary: string;
  details: string | null;
  vehicle_id: string | null;
  fb_post_id: string | null;
  created_at: string;
  interaction_at: string;
}

export interface CRMStats {
  total: number;
  pipeline: Record<string, number>;
  bySource: Record<string, number>;
  byInterest: Record<string, number>;
  conversionRate: number;
  newThisWeek: number;
}

interface LeadsResponse {
  leads: CRMLead[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface LeadCreateInput {
  name: string;
  phone?: string;
  email?: string;
  whatsapp?: string;
  source?: string;
  source_detail?: string;
  vehicle_id?: string;
  interest_level?: string;
  status?: string;
  notes?: string;
  budget_min?: number;
  budget_max?: number;
}

interface LeadUpdateInput {
  name?: string;
  phone?: string;
  email?: string;
  whatsapp?: string;
  source?: string;
  source_detail?: string;
  vehicle_id?: string;
  interest_level?: string;
  status?: string;
  notes?: string;
  budget_min?: number;
  budget_max?: number;
  last_contacted_at?: string;
}

interface InteractionInput {
  type: string;
  direction?: string;
  summary: string;
  details?: string;
  vehicle_id?: string;
  fb_post_id?: string;
}

// ─────────────────────────────────────────────
// Leads
// ─────────────────────────────────────────────

export function useLeads(
  walletAddress: string | undefined,
  filters?: { status?: string; source?: string; interest_level?: string; search?: string; page?: number }
) {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.source) params.set('source', filters.source);
  if (filters?.interest_level) params.set('interest_level', filters.interest_level);
  if (filters?.search) params.set('search', filters.search);
  if (filters?.page) params.set('page', String(filters.page));

  return useQuery<LeadsResponse>({
    queryKey: ['crm-leads', walletAddress, filters],
    queryFn: async () => {
      const res = await fetch(`/api/crm/leads?${params.toString()}`, {
        headers: { 'x-wallet-address': walletAddress! },
      });
      if (!res.ok) throw new Error('Failed to fetch leads');
      return res.json();
    },
    enabled: !!walletAddress,
    staleTime: 30_000,
  });
}

export function useLead(walletAddress: string | undefined, leadId: string | undefined) {
  return useQuery<{ lead: CRMLead }>({
    queryKey: ['crm-lead', walletAddress, leadId],
    queryFn: async () => {
      const res = await fetch(`/api/crm/leads/${leadId}`, {
        headers: { 'x-wallet-address': walletAddress! },
      });
      if (!res.ok) throw new Error('Failed to fetch lead');
      return res.json();
    },
    enabled: !!walletAddress && !!leadId,
    staleTime: 30_000,
  });
}

export function useCreateLead(walletAddress: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation<{ lead: CRMLead }, Error, LeadCreateInput>({
    mutationFn: async (input) => {
      const res = await fetch('/api/crm/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': walletAddress!,
        },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create lead');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-leads', walletAddress] });
      queryClient.invalidateQueries({ queryKey: ['crm-stats', walletAddress] });
    },
  });
}

export function useUpdateLead(walletAddress: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation<{ lead: CRMLead }, Error, { id: string; data: LeadUpdateInput }>({
    mutationFn: async ({ id, data }) => {
      const res = await fetch(`/api/crm/leads/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': walletAddress!,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update lead');
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['crm-leads', walletAddress] });
      queryClient.invalidateQueries({ queryKey: ['crm-lead', walletAddress, variables.id] });
      queryClient.invalidateQueries({ queryKey: ['crm-stats', walletAddress] });
    },
  });
}

export function useDeleteLead(walletAddress: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: async (id) => {
      const res = await fetch(`/api/crm/leads/${id}`, {
        method: 'DELETE',
        headers: { 'x-wallet-address': walletAddress! },
      });
      if (!res.ok) throw new Error('Failed to delete lead');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-leads', walletAddress] });
      queryClient.invalidateQueries({ queryKey: ['crm-stats', walletAddress] });
    },
  });
}

// ─────────────────────────────────────────────
// Interactions
// ─────────────────────────────────────────────

export function useInteractions(walletAddress: string | undefined, leadId: string | undefined) {
  return useQuery<{ interactions: CRMInteraction[] }>({
    queryKey: ['crm-interactions', walletAddress, leadId],
    queryFn: async () => {
      const res = await fetch(`/api/crm/leads/${leadId}/interactions`, {
        headers: { 'x-wallet-address': walletAddress! },
      });
      if (!res.ok) throw new Error('Failed to fetch interactions');
      return res.json();
    },
    enabled: !!walletAddress && !!leadId,
    staleTime: 30_000,
  });
}

export function useAddInteraction(walletAddress: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation<{ interaction: CRMInteraction }, Error, { leadId: string; data: InteractionInput }>({
    mutationFn: async ({ leadId, data }) => {
      const res = await fetch(`/api/crm/leads/${leadId}/interactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': walletAddress!,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to add interaction');
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['crm-interactions', walletAddress, variables.leadId] });
      queryClient.invalidateQueries({ queryKey: ['crm-leads', walletAddress] });
    },
  });
}

// ─────────────────────────────────────────────
// Stats
// ─────────────────────────────────────────────

export function useCRMStats(walletAddress: string | undefined) {
  return useQuery<CRMStats>({
    queryKey: ['crm-stats', walletAddress],
    queryFn: async () => {
      const res = await fetch('/api/crm/stats', {
        headers: { 'x-wallet-address': walletAddress! },
      });
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    },
    enabled: !!walletAddress,
    staleTime: 60_000,
  });
}
