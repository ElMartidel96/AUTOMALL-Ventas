/**
 * Campaign Tools — Facebook ad campaign management for AI agents
 *
 * Available to seller + admin roles via MCP Gateway and platform chat.
 * Uses campaign-service.ts for all DB/FB operations.
 */

import { z } from 'zod'
import type { AgentTool, ToolContext, UserRole, ToolPermission } from '../types/connector-types'

// ===================================================
// SCHEMAS
// ===================================================

const ListCampaignsInput = z.object({})

const GetCampaignDetailsInput = z.object({
  campaign_id: z.string().uuid().describe('Campaign UUID'),
})

const GetCampaignStatsInput = z.object({
  campaign_id: z.string().uuid().describe('Campaign UUID'),
})

const PauseCampaignInput = z.object({
  campaign_id: z.string().uuid().describe('Campaign UUID to pause'),
})

const ResumeCampaignInput = z.object({
  campaign_id: z.string().uuid().describe('Campaign UUID to resume'),
})

const DeleteCampaignInput = z.object({
  campaign_id: z.string().uuid().describe('Campaign UUID to delete'),
  delete_fb_posts: z.boolean().optional().describe('Also delete Facebook posts (default true)'),
})

const PublishCampaignInput = z.object({
  campaign_id: z.string().uuid().describe('Campaign UUID to publish to Facebook'),
})

const CreateCampaignInput = z.object({
  name: z.string().describe('Campaign name (e.g. "Summer Sale 2026")'),
  type: z.enum(['inventory_showcase', 'seasonal_promo', 'clearance', 'financing', 'trade_in', 'custom'])
    .describe('Campaign template type'),
  vehicle_ids: z.array(z.string().uuid()).min(1).describe('Array of vehicle UUIDs to include in the campaign'),
  daily_budget_usd: z.number().min(1).optional().describe('Daily budget in USD for the paid Facebook ad (optional)'),
  caption_language: z.enum(['en', 'es', 'both']).optional().describe('Language for ad copy (default: both)'),
  publish_to_facebook: z.boolean().optional().describe('Immediately publish to Facebook after creation (default: false)'),
})

const SwitchAdObjectiveInput = z.object({
  campaign_id: z.string().uuid().describe('Campaign UUID'),
  new_objective: z.enum(['awareness', 'whatsapp_clicks']).describe('New Facebook ad objective'),
})

const PauseAllCampaignsInput = z.object({})

const ResumeAllCampaignsInput = z.object({})

// ===================================================
// HELPERS
// ===================================================

async function getWalletAddress(ctx: ToolContext): Promise<string> {
  return ctx.walletAddress.toLowerCase()
}

// ===================================================
// HANDLERS
// ===================================================

async function handleListCampaigns(_input: z.infer<typeof ListCampaignsInput>, ctx: ToolContext) {
  const wallet = await getWalletAddress(ctx)
  const { getCampaigns, getCampaignQuickStats } = await import('@/lib/campaigns/campaign-service')

  const [campaigns, stats] = await Promise.all([
    getCampaigns(wallet),
    getCampaignQuickStats(wallet),
  ])

  return {
    campaigns: campaigns.map(c => ({
      id: c.id,
      name: c.name,
      type: c.type,
      status: c.status,
      vehicle_count: c.vehicle_ids.length,
      fb_publish_status: c.fb_publish_status,
      fb_ad_status: c.fb_ad_status,
      daily_budget_usd: c.daily_budget_usd,
    })),
    total: campaigns.length,
    quick_stats: stats,
  }
}

async function handleGetCampaignDetails(input: z.infer<typeof GetCampaignDetailsInput>, ctx: ToolContext) {
  const wallet = await getWalletAddress(ctx)
  const { getCampaignById, getCampaignMetrics } = await import('@/lib/campaigns/campaign-service')

  const campaign = await getCampaignById(input.campaign_id, wallet)
  if (!campaign) throw new Error('Campaign not found')

  const metrics = await getCampaignMetrics(input.campaign_id)

  return {
    id: campaign.id,
    name: campaign.name,
    type: campaign.type,
    status: campaign.status,
    vehicle_count: campaign.vehicle_ids.length,
    daily_budget_usd: campaign.daily_budget_usd,
    fb_publish_status: campaign.fb_publish_status,
    fb_permalink_url: campaign.fb_permalink_url,
    fb_ad_status: campaign.fb_ad_status,
    fb_ad_objective: campaign.fb_ad_objective,
    landing_slug: campaign.landing_slug,
    metrics: {
      page_views: metrics.page_views,
      whatsapp_clicks: metrics.whatsapp_clicks,
      total_leads: metrics.total_leads,
    },
    created_at: campaign.created_at,
  }
}

async function handleGetCampaignStats(input: z.infer<typeof GetCampaignStatsInput>, ctx: ToolContext) {
  const wallet = await getWalletAddress(ctx)
  const { getCampaignFullStats, getCampaignById } = await import('@/lib/campaigns/campaign-service')

  const campaign = await getCampaignById(input.campaign_id, wallet)
  if (!campaign) throw new Error('Campaign not found')

  const stats = await getCampaignFullStats(input.campaign_id, wallet)

  return {
    campaign_name: campaign.name,
    landing: stats.landing,
    fb: stats.fb,
    ad: stats.ad,
    published_at: stats.publishedAt,
  }
}

async function handlePauseCampaign(input: z.infer<typeof PauseCampaignInput>, ctx: ToolContext) {
  const wallet = await getWalletAddress(ctx)
  const { updateCampaign, getCampaignById, pauseFBAd } = await import('@/lib/campaigns/campaign-service')

  const campaign = await getCampaignById(input.campaign_id, wallet)
  if (!campaign) throw new Error('Campaign not found')

  await updateCampaign(input.campaign_id, wallet, { status: 'paused' })

  // Also pause the paid ad if it exists
  if (campaign.fb_ad_id && campaign.fb_ad_status && campaign.fb_ad_status !== 'none' && campaign.fb_ad_status !== 'error') {
    try {
      await pauseFBAd(input.campaign_id, wallet)
    } catch {
      // Non-critical
    }
  }

  return { success: true, campaign_name: campaign.name, new_status: 'paused' }
}

async function handleResumeCampaign(input: z.infer<typeof ResumeCampaignInput>, ctx: ToolContext) {
  const wallet = await getWalletAddress(ctx)
  const { updateCampaign, getCampaignById, resumeFBAd } = await import('@/lib/campaigns/campaign-service')

  const campaign = await getCampaignById(input.campaign_id, wallet)
  if (!campaign) throw new Error('Campaign not found')

  await updateCampaign(input.campaign_id, wallet, { status: 'active' })

  // Also resume the paid ad if it exists
  if (campaign.fb_ad_id && campaign.fb_ad_status && campaign.fb_ad_status !== 'none' && campaign.fb_ad_status !== 'error') {
    try {
      await resumeFBAd(input.campaign_id, wallet)
    } catch {
      // Non-critical
    }
  }

  return { success: true, campaign_name: campaign.name, new_status: 'active' }
}

async function handleDeleteCampaign(input: z.infer<typeof DeleteCampaignInput>, ctx: ToolContext) {
  const wallet = await getWalletAddress(ctx)
  const { deleteCampaign, getCampaignById } = await import('@/lib/campaigns/campaign-service')

  const campaign = await getCampaignById(input.campaign_id, wallet)
  if (!campaign) throw new Error('Campaign not found')

  const deleteFBPosts = input.delete_fb_posts !== false
  const result = await deleteCampaign(input.campaign_id, wallet, deleteFBPosts)

  return {
    success: true,
    campaign_name: campaign.name,
    deleted_fb_posts: result.deletedPostsCount,
  }
}

async function handlePublishCampaign(input: z.infer<typeof PublishCampaignInput>, ctx: ToolContext) {
  const wallet = await getWalletAddress(ctx)
  const { publishToFacebook, getCampaignById } = await import('@/lib/campaigns/campaign-service')

  const campaign = await getCampaignById(input.campaign_id, wallet)
  if (!campaign) throw new Error('Campaign not found')

  const result = await publishToFacebook(input.campaign_id, wallet)

  return {
    success: true,
    campaign_name: campaign.name,
    permalink: result.permalink,
    ad_status: result.adStatus,
    landing_slug: campaign.landing_slug,
  }
}

async function handleCreateCampaign(input: z.infer<typeof CreateCampaignInput>, ctx: ToolContext) {
  const wallet = await getWalletAddress(ctx)
  const { createCampaign, publishToFacebook } = await import('@/lib/campaigns/campaign-service')

  const campaign = await createCampaign(wallet, {
    name: input.name,
    type: input.type,
    vehicle_ids: input.vehicle_ids,
    daily_budget_usd: input.daily_budget_usd || null,
    caption_language: input.caption_language || 'both',
  })

  let fbResult = null
  if (input.publish_to_facebook) {
    try {
      fbResult = await publishToFacebook(campaign.id, wallet)
    } catch (fbErr) {
      // Campaign created OK, FB publish failed
      return {
        success: true,
        campaign_id: campaign.id,
        campaign_name: campaign.name,
        landing_slug: campaign.landing_slug,
        status: campaign.status,
        fb_publish_error: fbErr instanceof Error ? fbErr.message : 'Facebook publish failed',
      }
    }
  }

  return {
    success: true,
    campaign_id: campaign.id,
    campaign_name: campaign.name,
    landing_slug: campaign.landing_slug,
    status: campaign.status,
    ...(fbResult ? {
      fb_permalink: fbResult.permalink,
      fb_ad_status: fbResult.adStatus,
    } : {}),
  }
}

async function handleSwitchAdObjective(input: z.infer<typeof SwitchAdObjectiveInput>, ctx: ToolContext) {
  const wallet = await getWalletAddress(ctx)
  const { switchAdObjective, getCampaignById } = await import('@/lib/campaigns/campaign-service')

  const campaign = await getCampaignById(input.campaign_id, wallet)
  if (!campaign) throw new Error('Campaign not found')

  const result = await switchAdObjective(input.campaign_id, wallet, input.new_objective)

  return {
    success: true,
    campaign_name: campaign.name,
    previous_objective: campaign.fb_ad_objective,
    new_objective: input.new_objective,
    ad_status: result.adStatus,
  }
}

async function handlePauseAllCampaigns(_input: z.infer<typeof PauseAllCampaignsInput>, ctx: ToolContext) {
  const wallet = await getWalletAddress(ctx)
  const { getCampaigns, updateCampaign, pauseFBAd } = await import('@/lib/campaigns/campaign-service')

  const campaigns = await getCampaigns(wallet)
  const activeCampaigns = campaigns.filter(c => c.status === 'active')

  if (activeCampaigns.length === 0) {
    return { success: true, paused_count: 0, message: 'No active campaigns to pause' }
  }

  const results: Array<{ id: string; name: string; paused: boolean; error?: string }> = []

  for (const campaign of activeCampaigns) {
    try {
      await updateCampaign(campaign.id, wallet, { status: 'paused' })
      if (campaign.fb_ad_id && campaign.fb_ad_status !== 'none' && campaign.fb_ad_status !== 'error') {
        try { await pauseFBAd(campaign.id, wallet) } catch { /* non-critical */ }
      }
      results.push({ id: campaign.id, name: campaign.name, paused: true })
    } catch (err) {
      results.push({ id: campaign.id, name: campaign.name, paused: false, error: err instanceof Error ? err.message : 'Unknown error' })
    }
  }

  return {
    success: true,
    paused_count: results.filter(r => r.paused).length,
    total_active: activeCampaigns.length,
    results,
  }
}

async function handleResumeAllCampaigns(_input: z.infer<typeof ResumeAllCampaignsInput>, ctx: ToolContext) {
  const wallet = await getWalletAddress(ctx)
  const { getCampaigns, updateCampaign, resumeFBAd } = await import('@/lib/campaigns/campaign-service')

  const campaigns = await getCampaigns(wallet)
  const pausedCampaigns = campaigns.filter(c => c.status === 'paused')

  if (pausedCampaigns.length === 0) {
    return { success: true, resumed_count: 0, message: 'No paused campaigns to resume' }
  }

  const results: Array<{ id: string; name: string; resumed: boolean; error?: string }> = []

  for (const campaign of pausedCampaigns) {
    try {
      await updateCampaign(campaign.id, wallet, { status: 'active' })
      if (campaign.fb_ad_id && campaign.fb_ad_status !== 'none' && campaign.fb_ad_status !== 'error') {
        try { await resumeFBAd(campaign.id, wallet) } catch { /* non-critical */ }
      }
      results.push({ id: campaign.id, name: campaign.name, resumed: true })
    } catch (err) {
      results.push({ id: campaign.id, name: campaign.name, resumed: false, error: err instanceof Error ? err.message : 'Unknown error' })
    }
  }

  return {
    success: true,
    resumed_count: results.filter(r => r.resumed).length,
    total_paused: pausedCampaigns.length,
    results,
  }
}

// ===================================================
// TOOL DEFINITIONS
// ===================================================

export const campaignTools: AgentTool[] = [
  {
    name: 'list_campaigns',
    description: 'List all your Facebook ad campaigns with quick stats (total, active, paused, published).',
    category: 'Campaigns',
    inputSchema: ListCampaignsInput,
    permission: 'read' as ToolPermission,
    roles: ['seller', 'admin'] as UserRole[],
    handler: handleListCampaigns,
  },
  {
    name: 'get_campaign_details',
    description: 'Get full details of a specific campaign including metrics (page views, WhatsApp clicks, leads).',
    category: 'Campaigns',
    inputSchema: GetCampaignDetailsInput,
    permission: 'read' as ToolPermission,
    roles: ['seller', 'admin'] as UserRole[],
    handler: handleGetCampaignDetails,
  },
  {
    name: 'get_campaign_stats',
    description: 'Get comprehensive statistics for a campaign: landing page views, Facebook engagement, ad performance.',
    category: 'Campaigns',
    inputSchema: GetCampaignStatsInput,
    permission: 'read' as ToolPermission,
    roles: ['seller', 'admin'] as UserRole[],
    handler: handleGetCampaignStats,
  },
  {
    name: 'pause_campaign',
    description: 'Pause an active campaign. Also pauses the Facebook paid ad if one exists.',
    category: 'Campaigns',
    inputSchema: PauseCampaignInput,
    permission: 'write' as ToolPermission,
    roles: ['seller', 'admin'] as UserRole[],
    handler: handlePauseCampaign,
  },
  {
    name: 'resume_campaign',
    description: 'Resume a paused campaign. Also resumes the Facebook paid ad if one exists.',
    category: 'Campaigns',
    inputSchema: ResumeCampaignInput,
    permission: 'write' as ToolPermission,
    roles: ['seller', 'admin'] as UserRole[],
    handler: handleResumeCampaign,
  },
  {
    name: 'delete_campaign',
    description: 'Delete a campaign permanently. By default also deletes associated Facebook posts.',
    category: 'Campaigns',
    inputSchema: DeleteCampaignInput,
    permission: 'write' as ToolPermission,
    roles: ['seller', 'admin'] as UserRole[],
    handler: handleDeleteCampaign,
  },
  {
    name: 'publish_campaign',
    description: 'Publish a campaign to Facebook. Creates the FB post and optionally starts the paid ad.',
    category: 'Campaigns',
    inputSchema: PublishCampaignInput,
    permission: 'write' as ToolPermission,
    roles: ['seller', 'admin'] as UserRole[],
    handler: handlePublishCampaign,
  },
  {
    name: 'create_campaign',
    description: 'Create a new Facebook ad campaign. Select a template type (inventory_showcase, seasonal_promo, clearance, financing, trade_in, custom), assign vehicles, set budget, and optionally publish to Facebook immediately.',
    category: 'Campaigns',
    inputSchema: CreateCampaignInput,
    permission: 'write' as ToolPermission,
    roles: ['seller', 'admin'] as UserRole[],
    handler: handleCreateCampaign,
  },
  {
    name: 'switch_ad_objective',
    description: 'Switch the Facebook ad objective between "awareness" (reach more people) and "whatsapp_clicks" (drive WhatsApp messages). Deletes the old ad and creates a new one with the new objective.',
    category: 'Campaigns',
    inputSchema: SwitchAdObjectiveInput,
    permission: 'write' as ToolPermission,
    roles: ['seller', 'admin'] as UserRole[],
    handler: handleSwitchAdObjective,
  },
  {
    name: 'pause_all_campaigns',
    description: 'Pause ALL active campaigns at once. Also pauses their Facebook paid ads. Use when the seller wants to stop all advertising.',
    category: 'Campaigns',
    inputSchema: PauseAllCampaignsInput,
    permission: 'write' as ToolPermission,
    roles: ['seller', 'admin'] as UserRole[],
    handler: handlePauseAllCampaigns,
  },
  {
    name: 'resume_all_campaigns',
    description: 'Resume ALL paused campaigns at once. Also resumes their Facebook paid ads.',
    category: 'Campaigns',
    inputSchema: ResumeAllCampaignsInput,
    permission: 'write' as ToolPermission,
    roles: ['seller', 'admin'] as UserRole[],
    handler: handleResumeAllCampaigns,
  },
]
