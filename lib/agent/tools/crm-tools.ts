/**
 * CRM Tools — Deal & Payment management for AI agents
 *
 * Available to seller + admin roles via MCP Gateway.
 * Uses deal-service.ts for all DB operations.
 */

import { z } from 'zod'
import type { AgentTool, ToolContext, UserRole, ToolPermission } from '../types/connector-types'

// ===================================================
// SCHEMAS
// ===================================================

const GetLeadsInput = z.object({
  search: z.string().optional().describe('Search by name, phone, or email'),
  status: z.enum(['new', 'contacted', 'qualified', 'negotiating', 'won', 'lost']).optional().describe('Lead status filter'),
  limit: z.number().int().min(1).max(50).optional().describe('Max results (default 20)'),
  page: z.number().int().min(1).optional().describe('Page number (default 1)'),
})

const GetDealsInput = z.object({
  search: z.string().optional().describe('Search by client name, brand, or model'),
  deal_status: z.enum(['active', 'completed', 'default', 'cancelled']).optional().describe('Deal status filter'),
  financing_type: z.enum(['cash', 'in_house', 'external']).optional().describe('Financing type filter'),
  date_from: z.string().optional().describe('Filter deals from date (YYYY-MM-DD)'),
  date_to: z.string().optional().describe('Filter deals to date (YYYY-MM-DD)'),
  limit: z.number().int().min(1).max(50).optional().describe('Max results (default 20)'),
  page: z.number().int().min(1).optional().describe('Page number (default 1)'),
})

const GetDealDetailsInput = z.object({
  deal_id: z.string().uuid().describe('Deal UUID'),
})

const CreateDealInput = z.object({
  client_name: z.string().describe('Client full name'),
  vehicle_brand: z.string().describe('Vehicle brand (e.g. Toyota)'),
  vehicle_model: z.string().describe('Vehicle model (e.g. Camry)'),
  vehicle_year: z.number().int().min(1990).max(2030).describe('Vehicle year'),
  sale_price: z.number().min(1).describe('Sale price in USD'),
  client_phone: z.string().optional().describe('Client phone number'),
  client_email: z.string().optional().describe('Client email'),
  client_whatsapp: z.string().optional().describe('Client WhatsApp number'),
  referred_by: z.string().optional().describe('Referral source'),
  lead_id: z.string().uuid().optional().describe('Existing lead ID to convert'),
  vehicle_id: z.string().uuid().optional().describe('Existing vehicle ID from inventory'),
  vehicle_color: z.string().optional().describe('Vehicle color'),
  vehicle_vin: z.string().optional().describe('Vehicle VIN (17 characters)'),
  vehicle_mileage: z.number().int().optional().describe('Vehicle mileage'),
  sale_date: z.string().optional().describe('Sale date (YYYY-MM-DD, default today)'),
  down_payment: z.number().min(0).optional().describe('Down payment in USD (default 0)'),
  financing_type: z.enum(['cash', 'in_house', 'external']).optional().describe('Financing type (default cash)'),
  finance_company: z.string().optional().describe('Finance company name (for external financing)'),
  num_installments: z.number().int().min(0).optional().describe('Number of installments (0 for cash)'),
  first_payment_date: z.string().optional().describe('First payment date (YYYY-MM-DD)'),
  payment_frequency: z.enum(['weekly', 'biweekly', 'monthly']).optional().describe('Payment frequency'),
  installment_amount: z.number().min(0).optional().describe('Amount per installment'),
  gps_installed: z.boolean().optional().describe('Whether GPS tracker is installed'),
  commission: z.number().min(0).optional().describe('Commission amount in USD'),
  notes: z.string().optional().describe('Additional notes'),
})

const UpdateDealInput = z.object({
  deal_id: z.string().uuid().describe('Deal UUID to update'),
  deal_status: z.enum(['active', 'completed', 'default', 'cancelled']).optional().describe('New deal status'),
  client_name: z.string().optional().describe('Updated client name'),
  client_phone: z.string().optional().describe('Updated phone'),
  notes: z.string().optional().describe('Updated notes'),
  gps_installed: z.boolean().optional().describe('GPS tracker status'),
  commission: z.number().min(0).optional().describe('Commission amount'),
})

const RecordPaymentInput = z.object({
  deal_id: z.string().uuid().describe('Deal UUID'),
  payment_id: z.string().uuid().optional().describe('Specific payment UUID (if known). If not provided, records the next pending payment.'),
  status: z.enum(['paid', 'partial']).optional().describe('Payment status (default: paid)'),
  paid_amount: z.number().min(0).optional().describe('Amount paid (required for partial payments)'),
  payment_method: z.string().optional().describe('Payment method (cash, card, transfer, etc.)'),
})

const GetDealStatsInput = z.object({})

const ExportDealsUrlInput = z.object({})

// ===================================================
// HELPERS
// ===================================================

async function getSellerId(walletAddress: string): Promise<string> {
  const { getTypedClient } = await import('@/lib/supabase/client')
  const supabase = getTypedClient()
  const { data } = await supabase
    .from('sellers')
    .select('id')
    .eq('wallet_address', walletAddress.toLowerCase())
    .eq('is_active', true)
    .single()
  if (!data?.id) throw new Error('Seller account not found')
  return data.id
}

// ===================================================
// HANDLERS
// ===================================================

async function handleGetLeads(input: z.infer<typeof GetLeadsInput>, ctx: ToolContext) {
  const sellerId = await getSellerId(ctx.walletAddress)
  const { getTypedClient } = await import('@/lib/supabase/client')
  const supabase = getTypedClient()

  const page = input.page || 1
  const limit = input.limit || 20
  const offset = (page - 1) * limit

  let query = supabase
    .from('crm_leads')
    .select('id, name, phone, email, whatsapp, source, interest_level, status, notes, created_at', { count: 'exact' })
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false })

  if (input.status) query = query.eq('status', input.status)
  if (input.search) {
    const safe = input.search.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
    query = query.or(`name.ilike.%${safe}%,phone.ilike.%${safe}%,email.ilike.%${safe}%`);
  }

  query = query.range(offset, offset + limit - 1)
  const { data, count, error } = await query
  if (error) throw new Error(`Failed to get leads: ${error.message}`)

  return { leads: data ?? [], total: count ?? 0, page, limit }
}

async function handleGetDeals(input: z.infer<typeof GetDealsInput>, ctx: ToolContext) {
  const sellerId = await getSellerId(ctx.walletAddress)
  const { listDeals } = await import('@/lib/crm/deal-service')
  return listDeals(sellerId, input)
}

async function handleGetDealDetails(input: z.infer<typeof GetDealDetailsInput>, ctx: ToolContext) {
  const sellerId = await getSellerId(ctx.walletAddress)
  const { getDealById } = await import('@/lib/crm/deal-service')
  const result = await getDealById(input.deal_id, sellerId)
  if (!result) throw new Error('Deal not found')
  return result
}

async function handleCreateDeal(input: z.infer<typeof CreateDealInput>, ctx: ToolContext) {
  const sellerId = await getSellerId(ctx.walletAddress)
  const { createDeal, convertLeadToDeal } = await import('@/lib/crm/deal-service')

  if (input.lead_id) {
    return convertLeadToDeal(input.lead_id, sellerId, input)
  }
  return createDeal(sellerId, input)
}

async function handleUpdateDeal(input: z.infer<typeof UpdateDealInput>, ctx: ToolContext) {
  const sellerId = await getSellerId(ctx.walletAddress)
  const { updateDeal } = await import('@/lib/crm/deal-service')
  const { deal_id, ...updates } = input
  return updateDeal(deal_id, sellerId, updates)
}

async function handleRecordPayment(input: z.infer<typeof RecordPaymentInput>, ctx: ToolContext) {
  const sellerId = await getSellerId(ctx.walletAddress)
  const { recordPayment, getDealById } = await import('@/lib/crm/deal-service')

  let paymentId = input.payment_id

  // If no specific payment_id, find the next pending payment
  if (!paymentId) {
    const result = await getDealById(input.deal_id, sellerId)
    if (!result) throw new Error('Deal not found')
    const nextPayment = result.payments.find(p => p.status === 'pending' || p.status === 'overdue')
    if (!nextPayment) throw new Error('No pending payments found for this deal')
    paymentId = nextPayment.id
  }

  const payment = await recordPayment(paymentId, sellerId, {
    status: input.status || 'paid',
    paid_amount: input.paid_amount,
    payment_method: input.payment_method,
  })

  // Return updated deal info
  const updated = await getDealById(input.deal_id, sellerId)
  return {
    payment,
    deal_summary: updated ? {
      total_collected: updated.deal.total_collected,
      outstanding_balance: updated.deal.outstanding_balance,
      payments_paid: updated.payments.filter(p => p.status === 'paid').length,
      payments_total: updated.payments.length,
    } : null,
  }
}

async function handleGetDealStats(_input: z.infer<typeof GetDealStatsInput>, ctx: ToolContext) {
  const sellerId = await getSellerId(ctx.walletAddress)
  const { getDealStats } = await import('@/lib/crm/deal-service')
  return getDealStats(sellerId)
}

async function handleExportDealsUrl(_input: z.infer<typeof ExportDealsUrlInput>, ctx: ToolContext) {
  // Verify seller exists
  await getSellerId(ctx.walletAddress)
  const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || 'autosmall.org'
  return {
    url: `https://${APP_DOMAIN}/api/crm/export`,
    note: 'Send a GET request with header x-wallet-address to download the XLSX file.',
    format: 'XLSX (Excel)',
  }
}

// ===================================================
// TOOL DEFINITIONS
// ===================================================

export const crmTools: AgentTool[] = [
  {
    name: 'get_leads',
    description: 'Search and list CRM leads (potential clients). Filter by status, search by name/phone/email.',
    category: 'CRM',
    inputSchema: GetLeadsInput,
    permission: 'read' as ToolPermission,
    roles: ['seller', 'admin'] as UserRole[],
    handler: handleGetLeads,
  },
  {
    name: 'get_deals',
    description: 'Search and list deals (sales). Filter by status, financing type, date range. Returns paginated results.',
    category: 'CRM',
    inputSchema: GetDealsInput,
    permission: 'read' as ToolPermission,
    roles: ['seller', 'admin'] as UserRole[],
    handler: handleGetDeals,
  },
  {
    name: 'get_deal_details',
    description: 'Get full details of a specific deal including payment schedule, financial summary, and client/vehicle info.',
    category: 'CRM',
    inputSchema: GetDealDetailsInput,
    permission: 'read' as ToolPermission,
    roles: ['seller', 'admin'] as UserRole[],
    handler: handleGetDealDetails,
  },
  {
    name: 'create_deal',
    description: 'Create a new deal (sale). Requires client name, vehicle info (brand, model, year), and sale price. Optionally specify financing terms, down payment, and payment schedule.',
    category: 'CRM',
    inputSchema: CreateDealInput,
    permission: 'write' as ToolPermission,
    roles: ['seller', 'admin'] as UserRole[],
    handler: handleCreateDeal,
  },
  {
    name: 'update_deal',
    description: 'Update an existing deal. Can change status (active, completed, default, cancelled), client info, notes, GPS status, and commission.',
    category: 'CRM',
    inputSchema: UpdateDealInput,
    permission: 'write' as ToolPermission,
    roles: ['seller', 'admin'] as UserRole[],
    handler: handleUpdateDeal,
  },
  {
    name: 'record_payment',
    description: 'Record a payment on a deal. If no specific payment_id is provided, automatically records the next pending payment. Supports full and partial payments.',
    category: 'CRM',
    inputSchema: RecordPaymentInput,
    permission: 'write' as ToolPermission,
    roles: ['seller', 'admin'] as UserRole[],
    handler: handleRecordPayment,
  },
  {
    name: 'get_deal_stats',
    description: 'Get financial dashboard statistics: total deals, active deals, revenue, collected, outstanding balance, overdue payments.',
    category: 'CRM',
    inputSchema: GetDealStatsInput,
    permission: 'read' as ToolPermission,
    roles: ['seller', 'admin'] as UserRole[],
    handler: handleGetDealStats,
  },
  {
    name: 'export_deals_url',
    description: 'Get the URL to download an Excel export of all deals and payments. The file matches the AUTOMALL Control de Ventas template.',
    category: 'CRM',
    inputSchema: ExportDealsUrlInput,
    permission: 'read' as ToolPermission,
    roles: ['seller', 'admin'] as UserRole[],
    handler: handleExportDealsUrl,
  },
]
