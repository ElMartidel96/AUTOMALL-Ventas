/**
 * Meta Integration Types
 *
 * Types for WhatsApp Catalog Product Feed + Facebook Auto-Publishing.
 * Graph API v22.0
 */

// ─────────────────────────────────────────────
// Product Feed (Meta Automotive Inventory)
// ─────────────────────────────────────────────

export interface MetaVehicleFeedItem {
  vehicle_id: string;
  url: string;
  title: string;
  description: string;
  image_url: string;
  additional_image_urls: string[];
  price: number;
  currency: string;
  availability: 'in stock' | 'out of stock';
  condition: 'new' | 'used' | 'refurbished';
  make: string;
  model: string;
  year: number;
  mileage_value: number;
  mileage_unit: 'MI' | 'KM';
  body_style: string;
  transmission: string;
  fuel_type: string;
  drivetrain: string;
  exterior_color: string;
  vin: string;
  state_of_vehicle: 'new' | 'used' | 'refurbished';
  latitude: number;
  longitude: number;
  address: string;
  seller_name: string;
  seller_phone?: string;
  seller_whatsapp?: string;
}

// ─────────────────────────────────────────────
// Facebook OAuth / Connection
// ─────────────────────────────────────────────

export interface MetaConnection {
  id: string;
  seller_id: string;
  wallet_address: string;
  fb_user_id: string;
  fb_page_id: string;
  fb_page_name: string;
  fb_page_access_token: string;
  fb_user_access_token: string | null;
  waba_id: string | null;
  catalog_id: string | null;
  ad_account_id: string | null;
  permissions: string[];
  auto_publish_on_active: boolean;
  auto_publish_on_sold: boolean;
  include_price: boolean;
  include_hashtags: boolean;
  caption_language: 'en' | 'es' | 'both';
  is_active: boolean;
  connected_at: string;
  updated_at: string;
}

export interface MetaConnectionInsert {
  seller_id: string;
  wallet_address: string;
  fb_user_id: string;
  fb_page_id: string;
  fb_page_name: string;
  fb_page_access_token: string;
  permissions: string[];
}

export interface MetaConnectionSettings {
  auto_publish_on_active?: boolean;
  auto_publish_on_sold?: boolean;
  include_price?: boolean;
  include_hashtags?: boolean;
  caption_language?: 'en' | 'es' | 'both';
}

// ─────────────────────────────────────────────
// Publication Log
// ─────────────────────────────────────────────

export type PublicationPostType = 'new_listing' | 'sold' | 'repost' | 'manual';
export type PublicationStatus = 'pending' | 'published' | 'failed';

export interface MetaPublicationLog {
  id: string;
  vehicle_id: string;
  seller_id: string;
  connection_id: string;
  post_type: PublicationPostType;
  fb_post_id: string | null;
  status: PublicationStatus;
  error_message: string | null;
  caption: string;
  image_urls: string[];
  created_at: string;
}

// ─────────────────────────────────────────────
// Facebook Graph API Responses
// ─────────────────────────────────────────────

export interface FBTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
}

export interface FBPage {
  id: string;
  name: string;
  access_token: string;
  category?: string;
}

export interface FBPagesResponse {
  data: FBPage[];
}

export interface FBPostResponse {
  id: string;
  post_id?: string;
}

export interface FBPhotoResponse {
  id: string;
}

export interface FBErrorResponse {
  error: {
    message: string;
    type: string;
    code: number;
    fbtrace_id: string;
  };
}

// ─────────────────────────────────────────────
// Engagement Tracking
// ─────────────────────────────────────────────

export interface FBEngagementData {
  likes_count: number;
  comments_count: number;
  shares_count: number;
  reactions_count: number;
  impressions?: number;
  reach?: number;
  clicks?: number;
  engaged_users?: number;
  permalink_url?: string;
}

export interface FBEngagementSnapshot {
  id: string;
  publication_id: string;
  fb_post_id: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  reactions_count: number;
  impressions: number | null;
  reach: number | null;
  clicks: number | null;
  engaged_users: number | null;
  fetched_at: string;
}

export interface EngagementSummary {
  total_likes: number;
  total_comments: number;
  total_shares: number;
  total_reactions: number;
  total_posts: number;
  best_post: {
    fb_post_id: string;
    vehicle_id: string;
    likes: number;
    comments: number;
    shares: number;
  } | null;
}

export interface MetaPublicationWithEngagement extends MetaPublicationLog {
  permalink_url?: string;
  engagement?: FBEngagementData;
}

// ─────────────────────────────────────────────
// OAuth State
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// Marketing API Responses
// ─────────────────────────────────────────────

export interface FBCampaignResponse { id: string; }
export interface FBAdSetResponse { id: string; }
export interface FBAdCreativeResponse { id: string; }
export interface FBAdResponse { id: string; }
export interface FBAdAccount {
  id: string;
  name: string;
  account_status: number;
  /** 1001=ADMIN, 1002=ADVERTISER, 1003=ANALYST, 1004=SALES */
  user_role?: number;
  /** Capabilities: e.g. MANAGE, ANALYZE */
  capabilities?: string[];
}
export interface FBAdInsightsData {
  impressions: string;
  reach: string;
  clicks: string;
  spend: string;
  actions?: Array<{ action_type: string; value: string }>;
  cost_per_action_type?: Array<{ action_type: string; value: string }>;
}

export interface MetaOAuthState {
  wallet_address: string;
  seller_id: string;
  timestamp: number;
  nonce: string;
}

// ─────────────────────────────────────────────
// Vehicle (from Supabase vehicles table)
// ─────────────────────────────────────────────

export interface VehicleForFeed {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  condition: string;
  transmission: string;
  fuel_type: string;
  drivetrain: string;
  body_type: string;
  exterior_color: string;
  vin: string;
  description: string;
  status: string;
  seller_address: string;
  images?: VehicleImage[];
}

export interface VehicleImage {
  id: string;
  public_url: string;
  display_order: number;
}

export interface SellerForFeed {
  id: string;
  handle: string;
  business_name: string;
  phone: string | null;
  whatsapp: string | null;
  city: string | null;
  state: string | null;
  address: string | null;
  wallet_address: string;
}
