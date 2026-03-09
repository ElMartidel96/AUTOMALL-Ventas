/**
 * Campaign System — Type Definitions
 *
 * Types for Facebook Click-to-WhatsApp (CTWA) campaigns.
 * Shared between web API, WhatsApp agent, and frontend.
 */

// ─────────────────────────────────────────────
// Enums
// ─────────────────────────────────────────────

export type CampaignType =
  | 'inventory_showcase'
  | 'seasonal_promo'
  | 'clearance'
  | 'financing'
  | 'trade_in'
  | 'custom';

export type CampaignStatus =
  | 'draft'
  | 'active'
  | 'paused'
  | 'completed'
  | 'archived';

export type FBPublishStatus =
  | 'unpublished'
  | 'publishing'
  | 'published'
  | 'failed';

export type CaptionLanguage = 'en' | 'es' | 'both';

export type FBAdStatus = 'none' | 'creating' | 'paused' | 'active' | 'completed' | 'error';

export type CampaignEventType =
  | 'page_view'
  | 'vehicle_view'
  | 'whatsapp_click'
  | 'phone_click'
  | 'scroll_50'
  | 'scroll_100';

export type CampaignLeadStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'negotiating'
  | 'sold'
  | 'lost';

// ─────────────────────────────────────────────
// Campaign
// ─────────────────────────────────────────────

export interface Campaign {
  id: string;
  seller_id: string;
  wallet_address: string;
  name: string;
  type: CampaignType;
  status: CampaignStatus;
  vehicle_ids: string[];
  headline_en: string | null;
  headline_es: string | null;
  body_en: string | null;
  body_es: string | null;
  cta_text_en: string;
  cta_text_es: string;
  landing_slug: string | null;
  daily_budget_usd: number | null;
  total_budget_usd: number | null;
  start_date: string | null;
  end_date: string | null;
  caption_language: CaptionLanguage;
  target_audience_notes: string | null;
  fb_post_ids: string[];
  fb_published_at: string | null;
  fb_publish_status: FBPublishStatus;
  fb_permalink_url: string | null;
  fb_campaign_id: string | null;
  fb_adset_id: string | null;
  fb_ad_id: string | null;
  fb_creative_id: string | null;
  fb_ad_status: FBAdStatus;
  created_at: string;
  updated_at: string;
}

export interface CampaignInsert {
  seller_id: string;
  wallet_address: string;
  name: string;
  type: CampaignType;
  vehicle_ids: string[];
  headline_en?: string | null;
  headline_es?: string | null;
  body_en?: string | null;
  body_es?: string | null;
  cta_text_en?: string;
  cta_text_es?: string;
  landing_slug?: string | null;
  daily_budget_usd?: number | null;
  total_budget_usd?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  caption_language?: CaptionLanguage;
  target_audience_notes?: string | null;
}

export interface CampaignUpdate {
  name?: string;
  type?: CampaignType;
  status?: CampaignStatus;
  vehicle_ids?: string[];
  headline_en?: string | null;
  headline_es?: string | null;
  body_en?: string | null;
  body_es?: string | null;
  cta_text_en?: string;
  cta_text_es?: string;
  daily_budget_usd?: number | null;
  total_budget_usd?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  caption_language?: CaptionLanguage;
  target_audience_notes?: string | null;
  fb_campaign_id?: string | null;
  fb_adset_id?: string | null;
  fb_ad_id?: string | null;
  fb_creative_id?: string | null;
  fb_ad_status?: FBAdStatus;
}

// ─────────────────────────────────────────────
// Campaign Leads
// ─────────────────────────────────────────────

export interface CampaignLead {
  id: string;
  campaign_id: string | null;
  seller_id: string;
  name: string | null;
  phone: string;
  whatsapp: string | null;
  email: string | null;
  vehicle_interest_id: string | null;
  status: CampaignLeadStatus;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  first_message_at: string;
  created_at: string;
  updated_at: string;
}

// ─────────────────────────────────────────────
// Campaign Events (landing page analytics)
// ─────────────────────────────────────────────

export interface CampaignEvent {
  id: string;
  campaign_id: string;
  event_type: CampaignEventType;
  vehicle_id: string | null;
  session_id: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  ip_hash: string | null;
  created_at: string;
}

export interface CampaignEventInsert {
  campaign_id: string;
  event_type: CampaignEventType;
  vehicle_id?: string | null;
  session_id?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  ip_hash?: string | null;
}

// ─────────────────────────────────────────────
// Campaign Metrics (aggregated)
// ─────────────────────────────────────────────

export interface CampaignMetrics {
  page_views: number;
  vehicle_views: number;
  whatsapp_clicks: number;
  phone_clicks: number;
  total_leads: number;
}

// ─────────────────────────────────────────────
// Public Campaign Data (for landing page — no secrets)
// ─────────────────────────────────────────────

export interface PublicCampaignData {
  id: string;
  name: string;
  type: CampaignType;
  headline_en: string | null;
  headline_es: string | null;
  body_en: string | null;
  body_es: string | null;
  cta_text_en: string;
  cta_text_es: string;
  landing_slug: string;
  vehicles: PublicVehicle[];
  seller: PublicSeller;
}

export interface PublicVehicle {
  id: string;
  year: number;
  brand: string;
  model: string;
  trim: string | null;
  price: number;
  mileage: number | null;
  exterior_color: string | null;
  transmission: string | null;
  condition: string | null;
  image_url: string | null;
}

export interface PublicSeller {
  handle: string;
  business_name: string;
  phone: string | null;
  whatsapp: string | null;
  city: string | null;
  state: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
}

// ─────────────────────────────────────────────
// Campaign Template Definition
// ─────────────────────────────────────────────

export interface CampaignTemplate {
  type: CampaignType;
  name_en: string;
  name_es: string;
  emoji: string;
  description_en: string;
  description_es: string;
  cta_en?: string;
  cta_es?: string;
  suggested_daily_budget: { min: number; max: number };
  suggested_duration_days: number;
  default_headline_en: string;
  default_headline_es: string;
  color: string; // Tailwind class e.g. 'bg-am-blue'
}
