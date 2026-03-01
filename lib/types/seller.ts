/**
 * Multi-Tenant Seller Types
 */

export interface Seller {
  id: string;
  wallet_address: string;
  handle: string;
  business_name: string;
  tagline?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  logo_url?: string;
  hero_image_url?: string;
  address?: string;
  city: string;
  state: string;
  latitude?: number | null;
  longitude?: number | null;
  service_radius_km: number;
  geocode_status: 'pending' | 'success' | 'failed' | 'manual';
  catalog_display_mode: 'service_area' | 'full_catalog' | 'personal_only';
  social_instagram?: string;
  social_facebook?: string;
  social_tiktok?: string;
  theme_primary_color: string;
  theme_accent_color: string;
  is_active: boolean;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

/** Public-safe seller contact info returned with catalog vehicles */
export interface SellerContact {
  business_name: string;
  phone: string | null;
  whatsapp: string | null;
  logo_url: string | null;
}

export interface TenantContext {
  seller: Seller | null;
  isSubdomain: boolean;
  handle: string | null;
}
