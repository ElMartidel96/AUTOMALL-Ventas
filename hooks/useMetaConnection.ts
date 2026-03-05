/**
 * Meta Connection Hooks
 *
 * React Query hooks for Facebook/WhatsApp Meta integration state.
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface MetaConnectionData {
  fb_page_name: string;
  auto_publish_on_active: boolean;
  auto_publish_on_sold: boolean;
  include_price: boolean;
  include_hashtags: boolean;
  caption_language: 'en' | 'es' | 'both';
  connected_at: string;
}

interface MetaPublication {
  id: string;
  vehicle_id: string;
  post_type: string;
  fb_post_id: string | null;
  status: string;
  error_message: string | null;
  caption: string;
  created_at: string;
}

interface MetaConnectionResponse {
  connected: boolean;
  connection: MetaConnectionData | null;
  feedUrl: string | null;
  recentPublications: MetaPublication[];
  publishedVehicles: Record<string, string>;
}

interface MetaSettings {
  auto_publish_on_active?: boolean;
  auto_publish_on_sold?: boolean;
  include_price?: boolean;
  include_hashtags?: boolean;
  caption_language?: 'en' | 'es' | 'both';
}

interface PendingPage {
  id: string;
  name: string;
  category?: string;
}

// ─────────────────────────────────────────────
// Connection Status
// ─────────────────────────────────────────────

export function useMetaConnection(walletAddress: string | undefined) {
  return useQuery<MetaConnectionResponse>({
    queryKey: ['meta-connection', walletAddress],
    queryFn: async () => {
      const res = await fetch('/api/meta/connection', {
        headers: { 'x-wallet-address': walletAddress! },
      });
      if (!res.ok) throw new Error('Failed to fetch Meta connection');
      return res.json();
    },
    enabled: !!walletAddress,
    staleTime: 30_000,
  });
}

// ─────────────────────────────────────────────
// Update Settings
// ─────────────────────────────────────────────

export function useMetaSettings(walletAddress: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: MetaSettings) => {
      const res = await fetch('/api/meta/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': walletAddress!,
        },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error('Failed to update settings');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meta-connection', walletAddress] });
    },
  });
}

// ─────────────────────────────────────────────
// Disconnect
// ─────────────────────────────────────────────

export function useMetaDisconnect(walletAddress: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/meta/disconnect', {
        method: 'DELETE',
        headers: { 'x-wallet-address': walletAddress! },
      });
      if (!res.ok) throw new Error('Failed to disconnect');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meta-connection', walletAddress] });
    },
  });
}

// ─────────────────────────────────────────────
// Page Selection (multi-page flow)
// ─────────────────────────────────────────────

export function useMetaPages() {
  return useQuery<{ pages: PendingPage[] }>({
    queryKey: ['meta-pages'],
    queryFn: async () => {
      const res = await fetch('/api/meta/pages');
      if (!res.ok) throw new Error('No pending pages');
      return res.json();
    },
    enabled: false, // Only fetch on demand
    retry: false,
  });
}

export function useMetaSelectPage(walletAddress: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pageId: string) => {
      const res = await fetch('/api/meta/pages/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId }),
      });
      if (!res.ok) throw new Error('Failed to select page');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meta-connection', walletAddress] });
    },
  });
}
