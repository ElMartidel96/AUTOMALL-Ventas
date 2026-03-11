/**
 * CRM Deal & Payment Types
 *
 * Shared types for deals (ventas), payments, and financial stats.
 * Used by API routes, service layer, WhatsApp agent, and MCP tools.
 */

// ─────────────────────────────────────────────
// Enums
// ─────────────────────────────────────────────

export type DealStatus = 'active' | 'completed' | 'default' | 'cancelled';
export type FinancingType = 'cash' | 'in_house' | 'external';
export type PaymentFrequency = 'weekly' | 'biweekly' | 'monthly';
export type PaymentStatus = 'paid' | 'pending' | 'overdue' | 'partial' | 'cancelled';

// ─────────────────────────────────────────────
// Database Row Types
// ─────────────────────────────────────────────

export interface CRMDeal {
  id: string;
  seller_id: string;
  lead_id: string | null;

  // Client
  client_name: string;
  client_phone: string | null;
  client_email: string | null;
  client_whatsapp: string | null;
  referred_by: string | null;

  // Vehicle
  vehicle_id: string | null;
  vehicle_brand: string;
  vehicle_model: string;
  vehicle_year: number;
  vehicle_color: string | null;
  vehicle_vin: string | null;
  vehicle_mileage: number | null;
  vehicle_trim: string | null;

  // Sale
  sale_date: string;
  sale_price: number;
  down_payment: number;
  financed_amount: number;

  // Financing
  financing_type: FinancingType;
  finance_company: string | null;
  num_installments: number;
  first_payment_date: string | null;
  payment_day: number | null;
  payment_frequency: PaymentFrequency;
  installment_amount: number | null;

  // Financial tracking
  total_collected: number;
  outstanding_balance: number;

  // Management
  deal_status: DealStatus;
  gps_installed: boolean;
  commission: number;
  notes: string | null;

  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface CRMPayment {
  id: string;
  deal_id: string;
  seller_id: string;
  payment_number: number;
  due_date: string;
  amount: number;
  paid_amount: number;
  paid_date: string | null;
  status: PaymentStatus;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ─────────────────────────────────────────────
// Input Types
// ─────────────────────────────────────────────

export interface DealInsert {
  // Required
  client_name: string;
  vehicle_brand: string;
  vehicle_model: string;
  vehicle_year: number;
  sale_price: number;

  // Optional client
  lead_id?: string;
  client_phone?: string;
  client_email?: string;
  client_whatsapp?: string;
  referred_by?: string;

  // Optional vehicle
  vehicle_id?: string;
  vehicle_color?: string;
  vehicle_vin?: string;
  vehicle_mileage?: number;
  vehicle_trim?: string;

  // Optional sale
  sale_date?: string;
  down_payment?: number;

  // Optional financing
  financing_type?: FinancingType;
  finance_company?: string;
  num_installments?: number;
  first_payment_date?: string;
  payment_day?: number;
  payment_frequency?: PaymentFrequency;
  installment_amount?: number;

  // Optional management
  gps_installed?: boolean;
  commission?: number;
  notes?: string;
}

export interface DealUpdate {
  client_name?: string;
  client_phone?: string;
  client_email?: string;
  client_whatsapp?: string;
  referred_by?: string;

  vehicle_brand?: string;
  vehicle_model?: string;
  vehicle_year?: number;
  vehicle_color?: string;
  vehicle_vin?: string;
  vehicle_mileage?: number;
  vehicle_trim?: string;

  sale_date?: string;
  sale_price?: number;
  down_payment?: number;

  financing_type?: FinancingType;
  finance_company?: string;
  num_installments?: number;
  first_payment_date?: string;
  payment_day?: number;
  payment_frequency?: PaymentFrequency;
  installment_amount?: number;

  deal_status?: DealStatus;
  gps_installed?: boolean;
  commission?: number;
  notes?: string;
}

export interface PaymentUpdate {
  paid_amount?: number;
  paid_date?: string;
  status?: PaymentStatus;
  payment_method?: string;
  notes?: string;
}

// ─────────────────────────────────────────────
// Stats
// ─────────────────────────────────────────────

export interface DealStats {
  total_deals: number;
  active_deals: number;
  completed_deals: number;
  defaulted_deals: number;
  total_revenue: number;
  total_collected: number;
  total_outstanding: number;
  avg_sale_price: number;
  deals_this_month: number;
  overdue_payments: number;
}

// ─────────────────────────────────────────────
// Filters
// ─────────────────────────────────────────────

export interface DealFilters {
  deal_status?: DealStatus;
  financing_type?: FinancingType;
  search?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}
