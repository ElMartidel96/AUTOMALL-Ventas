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

export interface TenantContext {
  seller: Seller | null;
  isSubdomain: boolean;
  handle: string | null;
}
