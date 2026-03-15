/**
 * Tool Registry — Central registry for all AI Agent tools
 *
 * Single source of truth for tool definitions.
 * Consumed by Platform Chat, MCP Gateway, and OpenAPI endpoints.
 */

import { z } from 'zod'
import type { AgentTool, ToolContext, UserRole, ToolPermission } from '../types/connector-types'
import { catalogTools } from './catalog-tools'
import { inventoryTools } from './inventory-tools'
import { profileTools } from './profile-tools'
import { referralTools } from './referral-tools'
import { geoTools } from './geo-tools'
import { crmTools } from './crm-tools'
import { campaignTools } from './campaign-tools'
import { metaTools } from './meta-tools'
import { visionTools } from './vision-tools'
import { documentTools } from './document-tools'

// ===================================================
// UTILITY TOOLS (inline — no DB needed)
// ===================================================

const utilityTools: AgentTool[] = [
  {
    name: 'get_platform_info',
    description: 'Get information about the AutoMALL platform (name, location, features).',
    category: 'Utility',
    inputSchema: z.object({}),
    permission: 'read' as ToolPermission,
    roles: ['buyer', 'seller', 'birddog', 'admin'] as UserRole[],
    handler: async () => ({
      name: 'Autos MALL',
      description: 'AI-powered car sales platform for independent sellers',
      location: 'Houston, Texas',
      website: 'https://autosmall.org',
      features: ['Vehicle catalog', 'Inventory management', 'Referral network', 'AI assistant'],
    }),
  },
  {
    name: 'get_current_time',
    description: 'Get the current date and time in Houston, TX timezone.',
    category: 'Utility',
    inputSchema: z.object({}),
    permission: 'read' as ToolPermission,
    roles: ['buyer', 'seller', 'birddog', 'admin'] as UserRole[],
    handler: async () => {
      const now = new Date()
      return {
        iso: now.toISOString(),
        houston: now.toLocaleString('en-US', { timeZone: 'America/Chicago' }),
        timezone: 'America/Chicago (CST/CDT)',
      }
    },
  },
  {
    name: 'format_price',
    description: 'Format a number as USD price (e.g. 25000 → $25,000).',
    category: 'Utility',
    inputSchema: z.object({
      amount: z.number().describe('Amount in USD'),
    }),
    permission: 'read' as ToolPermission,
    roles: ['buyer', 'seller', 'birddog', 'admin'] as UserRole[],
    handler: async (input: { amount: number }) => ({
      formatted: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(input.amount),
      raw: input.amount,
    }),
  },
  {
    name: 'get_inventory_stats',
    description: 'Get summary statistics of your vehicle inventory (total, by status, average price).',
    category: 'Analytics',
    inputSchema: z.object({}),
    permission: 'read' as ToolPermission,
    roles: ['seller', 'admin'] as UserRole[],
    handler: async (_input: any, ctx: ToolContext) => {
      const { supabaseAdmin } = await import('@/lib/supabase/client')
      if (!supabaseAdmin) throw new Error('Database not configured')

      const { data, error } = await supabaseAdmin
        .from('vehicles')
        .select('status, price')
        .eq('seller_address', ctx.walletAddress)

      if (error) throw new Error(`Failed to get stats: ${error.message}`)

      const vehicles = data ?? []
      const byStatus: Record<string, number> = {}
      let totalPrice = 0

      for (const v of vehicles) {
        byStatus[v.status] = (byStatus[v.status] || 0) + 1
        totalPrice += v.price || 0
      }

      return {
        total: vehicles.length,
        by_status: byStatus,
        average_price: vehicles.length > 0 ? Math.round(totalPrice / vehicles.length) : 0,
        total_value: totalPrice,
      }
    },
  },
]

// ===================================================
// REGISTRY
// ===================================================

class ToolRegistry {
  private tools: Map<string, AgentTool> = new Map()

  constructor() {
    const allTools = [
      ...catalogTools,
      ...inventoryTools,
      ...profileTools,
      ...referralTools,
      ...geoTools,
      ...crmTools,
      ...campaignTools,
      ...metaTools,
      ...visionTools,
      ...documentTools,
      ...utilityTools,
    ]

    for (const tool of allTools) {
      this.tools.set(tool.name, tool)
    }
  }

  /** Get a tool by name */
  getTool(name: string): AgentTool | undefined {
    return this.tools.get(name)
  }

  /** Get all tools */
  getAllTools(): AgentTool[] {
    return Array.from(this.tools.values())
  }

  /** Get tools accessible by a specific role */
  getToolsForRole(role: UserRole): AgentTool[] {
    return this.getAllTools().filter(tool => tool.roles.includes(role))
  }

  /** Get tools matching specific scopes */
  getToolsForScopes(role: UserRole, scopes: string[]): AgentTool[] {
    return this.getToolsForRole(role).filter(tool => {
      if (scopes.includes('admin')) return true
      if (scopes.includes('write') && (tool.permission === 'read' || tool.permission === 'write')) return true
      if (scopes.includes('read') && tool.permission === 'read') return true
      return false
    })
  }

  /** Get tool count */
  get size(): number {
    return this.tools.size
  }
}

// Singleton instance
export const toolRegistry = new ToolRegistry()
