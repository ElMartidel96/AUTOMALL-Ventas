/**
 * Campaign Types — Facebook Click-to-WhatsApp (CTWA) Campaign System
 *
 * Type definitions for the entire campaign lifecycle:
 * - Campaign creation & configuration
 * - Ad copy variants (EN/ES bilingual)
 * - WhatsApp conversation flows
 * - Lead capture & tracking
 * - UTM attribution
 * - Performance metrics
 */

// ─────────────────────────────────────────────
// Campaign Core
// ─────────────────────────────────────────────

export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived';
export type CampaignObjective = 'conversations' | 'leads' | 'traffic';
export type CampaignType = 'inventory_showcase' | 'seasonal_promo' | 'clearance' | 'financing' | 'trade_in' | 'custom';
export type AdFormat = 'single_image' | 'carousel' | 'video' | 'collection';
export type CaptionLanguage = 'en' | 'es' | 'both';

export interface Campaign {
  id: string;
  seller_id: string;
  wallet_address: string;
  name: string;
  type: CampaignType;
  status: CampaignStatus;
  objective: CampaignObjective;
  ad_format: AdFormat;
  // Targeting
  target_location: string;
  target_radius_miles: number;
  target_languages: string[];
  target_audience_notes: string;
  // Creative
  headline_en: string;
  headline_es: string;
  body_en: string;
  body_es: string;
  cta_text: string;
  caption_language: CaptionLanguage;
  // Vehicles
  vehicle_ids: string[];
  // WhatsApp flow
  whatsapp_number: string;
  welcome_message_en: string;
  welcome_message_es: string;
  icebreakers_en: string[];
  icebreakers_es: string[];
  // Budget
  daily_budget_usd: number;
  total_budget_usd: number | null;
  start_date: string;
  end_date: string | null;
  // Landing page
  landing_slug: string;
  landing_enabled: boolean;
  // Tracking
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface CampaignInsert {
  seller_id: string;
  wallet_address: string;
  name: string;
  type: CampaignType;
  objective?: CampaignObjective;
  ad_format?: AdFormat;
  target_location?: string;
  target_radius_miles?: number;
  target_languages?: string[];
  headline_en: string;
  headline_es: string;
  body_en: string;
  body_es: string;
  cta_text?: string;
  caption_language?: CaptionLanguage;
  vehicle_ids: string[];
  whatsapp_number: string;
  welcome_message_en?: string;
  welcome_message_es?: string;
  icebreakers_en?: string[];
  icebreakers_es?: string[];
  daily_budget_usd?: number;
  total_budget_usd?: number | null;
  start_date?: string;
  end_date?: string | null;
  landing_slug?: string;
  landing_enabled?: boolean;
}

// ─────────────────────────────────────────────
// Campaign Templates
// ─────────────────────────────────────────────

export interface CampaignTemplate {
  id: string;
  type: CampaignType;
  name_en: string;
  name_es: string;
  description_en: string;
  description_es: string;
  icon: string;
  color: string;
  headline_en: string;
  headline_es: string;
  body_en: string;
  body_es: string;
  cta_text: string;
  welcome_message_en: string;
  welcome_message_es: string;
  icebreakers_en: string[];
  icebreakers_es: string[];
  recommended_format: AdFormat;
  recommended_budget_min: number;
  recommended_budget_max: number;
  recommended_duration_days: number;
  tips_en: string[];
  tips_es: string[];
}

// ─────────────────────────────────────────────
// Leads
// ─────────────────────────────────────────────

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'test_drive' | 'negotiating' | 'sold' | 'lost';
export type LeadSource = 'ctwa_ad' | 'landing_page' | 'organic_whatsapp' | 'referral' | 'direct';

export interface CampaignLead {
  id: string;
  campaign_id: string | null;
  seller_id: string;
  vehicle_id: string | null;
  // Contact
  name: string | null;
  phone: string;
  whatsapp_verified: boolean;
  // Source
  source: LeadSource;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  // Qualification
  status: LeadStatus;
  budget_range: string | null;
  preferred_brands: string[];
  preferred_type: string | null;
  timeline: string | null;
  has_trade_in: boolean;
  needs_financing: boolean;
  notes: string | null;
  // Engagement
  first_message_at: string;
  last_message_at: string | null;
  response_time_seconds: number | null;
  message_count: number;
  // Timestamps
  created_at: string;
  updated_at: string;
}

// ─────────────────────────────────────────────
// Campaign Analytics
// ─────────────────────────────────────────────

export interface CampaignMetrics {
  campaign_id: string;
  // Reach
  impressions: number;
  reach: number;
  frequency: number;
  // Engagement
  clicks: number;
  ctr: number;
  conversations_started: number;
  // Conversion
  leads_captured: number;
  leads_qualified: number;
  test_drives_booked: number;
  sales_closed: number;
  // Cost
  total_spent: number;
  cost_per_click: number;
  cost_per_conversation: number;
  cost_per_lead: number;
  cost_per_sale: number;
  // Performance
  conversion_rate: number;
  roas: number;
}

// ─────────────────────────────────────────────
// WhatsApp Flow
// ─────────────────────────────────────────────

export interface WhatsAppFlowStep {
  id: string;
  type: 'greeting' | 'icebreaker' | 'question' | 'info' | 'handoff';
  message_en: string;
  message_es: string;
  options?: { label_en: string; label_es: string; next_step: string }[];
}

// ─────────────────────────────────────────────
// Landing Page Config
// ─────────────────────────────────────────────

export interface CampaignLandingConfig {
  campaign_id: string;
  slug: string;
  seller_name: string;
  seller_phone: string;
  seller_whatsapp: string;
  seller_logo_url: string | null;
  headline_en: string;
  headline_es: string;
  subheadline_en: string;
  subheadline_es: string;
  vehicles: LandingVehicle[];
  show_financing: boolean;
  show_trade_in: boolean;
  theme_color: string;
  whatsapp_prefilled_message_en: string;
  whatsapp_prefilled_message_es: string;
}

export interface LandingVehicle {
  id: string;
  title: string;
  price: number;
  monthly_payment: number | null;
  image_url: string;
  mileage: number;
  year: number;
  brand: string;
  model: string;
}

// ─────────────────────────────────────────────
// UTM Builder
// ─────────────────────────────────────────────

export interface UTMParams {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content?: string;
  utm_term?: string;
}
