/**
 * Server-side seller resolution.
 * Called from layout.tsx to fetch seller data based on x-seller-handle header.
 */

import { supabaseAdmin } from '@/lib/supabase/client';
import type { Seller } from '@/lib/types/seller';

export async function resolveSellerByHandle(handle: string): Promise<Seller | null> {
  if (!supabaseAdmin) return null;

  const { data, error } = await supabaseAdmin
    .from('sellers')
    .select('*')
    .eq('handle', handle.toLowerCase())
    .eq('is_active', true)
    .single();

  if (error || !data) return null;

  return data as Seller;
}
