/**
 * WhatsApp AI Assistant — Type Definitions
 */

// ─────────────────────────────────────────────
// Webhook Payload (from Meta)
// ─────────────────────────────────────────────

export interface WAWebhookPayload {
  object: 'whatsapp_business_account';
  entry: WAEntry[];
}

export interface WAEntry {
  id: string;
  changes: WAChange[];
}

export interface WAChange {
  value: WAChangeValue;
  field: string;
}

export interface WAChangeValue {
  messaging_product: 'whatsapp';
  metadata: {
    display_phone_number: string;
    phone_number_id: string;
  };
  contacts?: WAContact[];
  messages?: WAMessage[];
  statuses?: WAStatus[];
}

export interface WAContact {
  profile: { name: string };
  wa_id: string;
}

export interface WAMessage {
  from: string;
  id: string;
  timestamp: string;
  type: 'text' | 'image' | 'video' | 'document' | 'audio' | 'location' | 'contacts' | 'interactive' | 'button' | 'reaction';
  text?: { body: string };
  image?: { id: string; mime_type: string; sha256: string; caption?: string };
  interactive?: {
    type: 'button_reply' | 'list_reply';
    button_reply?: { id: string; title: string };
    list_reply?: { id: string; title: string; description?: string };
  };
  button?: { payload: string; text: string };
  context?: { from: string; id: string };
}

export interface WAStatus {
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  recipient_id: string;
  errors?: Array<{ code: number; title: string }>;
}

// ─────────────────────────────────────────────
// Session State Machine
// ─────────────────────────────────────────────

export type WASessionState =
  | 'idle'
  | 'collecting'
  | 'extracting'
  | 'confirming'
  | 'creating'
  | 'complete'
  | 'error';

export interface WASession {
  id: string;
  seller_id: string;
  wallet_address: string;
  phone_number: string;
  wa_phone_number_id: string | null;
  state: WASessionState;
  image_media_ids: string[];
  image_urls: string[];
  raw_text_messages: string[];
  extracted_vehicle: ExtractedVehicle | null;
  missing_fields: string[];
  vehicle_id: string | null;
  command_context: CommandContext | null;
  language: 'en' | 'es';
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface WAPhoneLink {
  id: string;
  seller_id: string;
  wallet_address: string;
  phone_number: string;
  verified: boolean;
  auto_activate: boolean;
  language: 'en' | 'es';
  created_at: string;
  updated_at: string;
}

// ─────────────────────────────────────────────
// Command Router Context (sub-flows)
// ─────────────────────────────────────────────

export interface CommandContext {
  flow: string;           // 'list_vehicles' | 'vehicle_detail' | 'change_price' | 'sell_vehicle' | 'publish_fb' | 'list_leads' | 'lead_detail' | 'create_lead' | 'edit_profile' | etc.
  step: number;           // Current step in multi-step flow
  data: Record<string, unknown>;  // Accumulated data (items, page, selected_id, etc.)
}

// ─────────────────────────────────────────────
// AI Extraction Result
// ─────────────────────────────────────────────

export interface ExtractedVehicle {
  brand: string | null;
  model: string | null;
  year: number | null;
  price: number | null;
  mileage: number | null;
  condition: 'new' | 'like_new' | 'excellent' | 'good' | 'fair' | null;
  exterior_color: string | null;
  interior_color: string | null;
  body_type: string | null;
  transmission: 'automatic' | 'manual' | 'cvt' | null;
  fuel_type: 'gasoline' | 'diesel' | 'electric' | 'hybrid' | 'plugin_hybrid' | null;
  drivetrain: 'fwd' | 'rwd' | 'awd' | '4wd' | null;
  engine: string | null;
  trim: string | null;
  doors: number | null;
  vin: string | null;
  features: string[];
  description: string | null;
  confidence: Record<string, number>;
}

// ─────────────────────────────────────────────
// WhatsApp API Response Types
// ─────────────────────────────────────────────

export interface WAMessageResponse {
  messaging_product: 'whatsapp';
  contacts: Array<{ input: string; wa_id: string }>;
  messages: Array<{ id: string }>;
}

export interface WAButton {
  type: 'reply';
  reply: {
    id: string;
    title: string;
  };
}

export interface WAMediaResponse {
  url: string;
  mime_type: string;
  sha256: string;
  file_size: number;
  id: string;
  messaging_product: 'whatsapp';
}

// ─────────────────────────────────────────────
// Message Log
// ─────────────────────────────────────────────

export interface WAMessageLog {
  id: string;
  session_id: string | null;
  wa_message_id: string | null;
  direction: 'inbound' | 'outbound';
  message_type: string;
  phone_number: string;
  content: string | null;
  media_id: string | null;
  raw_payload: unknown;
  created_at: string;
}
