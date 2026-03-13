/**
 * Meta Tools — Facebook connection status & vehicle publishing
 *
 * Available to seller + admin roles via MCP Gateway and platform chat.
 */

import { z } from 'zod'
import type { AgentTool, ToolContext, UserRole, ToolPermission } from '../types/connector-types'

// ===================================================
// SCHEMAS
// ===================================================

const GetFacebookStatusInput = z.object({})

const PublishVehicleFacebookInput = z.object({
  vehicle_id: z.string().uuid().describe('Vehicle UUID to publish to Facebook page'),
})

const DeleteVehicleFBPostsInput = z.object({
  vehicle_id: z.string().uuid().describe('Vehicle UUID whose Facebook posts should be deleted'),
})

// ===================================================
// HANDLERS
// ===================================================

async function handleGetFacebookStatus(_input: z.infer<typeof GetFacebookStatusInput>, ctx: ToolContext) {
  const { getTypedClient } = await import('@/lib/supabase/client')
  const supabase = getTypedClient()
  const wallet = ctx.walletAddress.toLowerCase()

  const { data: conn } = await supabase
    .from('seller_meta_connections')
    .select('id, fb_page_name, auto_publish_on_active, is_active')
    .eq('wallet_address', wallet)
    .eq('is_active', true)
    .single()

  if (!conn) {
    return {
      connected: false,
      page_name: null,
      auto_publish: false,
      recent_posts: [],
      message: 'Facebook not connected. Go to Profile > Facebook & WhatsApp to connect.',
    }
  }

  const mc = conn as { id: string; fb_page_name: string; auto_publish_on_active: boolean }

  // Get recent published posts
  const { data: pubs } = await supabase
    .from('meta_publication_log')
    .select('id, vehicle_id, fb_post_id')
    .eq('connection_id', mc.id)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(5)

  const recentPosts: Array<{ vehicle_title: string; likes: number; comments: number }> = []

  for (const pub of (pubs || []) as { id: string; vehicle_id: string; fb_post_id: string | null }[]) {
    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('year, brand, model')
      .eq('id', pub.vehicle_id)
      .single()

    let likes = 0, comments = 0
    if (pub.fb_post_id) {
      // Try live fetch from Facebook first, fall back to cached data
      try {
        const { fetchPostEngagement } = await import('@/lib/meta/facebook-api')
        const { data: metaConn } = await supabase
          .from('seller_meta_connections')
          .select('fb_page_access_token')
          .eq('wallet_address', wallet)
          .eq('is_active', true)
          .single()

        if (metaConn) {
          const eng = await fetchPostEngagement(pub.fb_post_id, (metaConn as { fb_page_access_token: string }).fb_page_access_token)
          likes = eng.likes
          comments = eng.comments
        }
      } catch {
        // Fall back to cached engagement data
        const { data: eng } = await supabase
          .from('fb_post_engagement')
          .select('likes_count, comments_count')
          .eq('publication_id', pub.id)
          .order('fetched_at', { ascending: false })
          .limit(1)

        if (eng && eng.length > 0) {
          const e = eng[0] as { likes_count: number; comments_count: number }
          likes = e.likes_count
          comments = e.comments_count
        }
      }
    }

    const v = vehicle as { year: number; brand: string; model: string } | null
    recentPosts.push({
      vehicle_title: v ? `${v.year} ${v.brand} ${v.model}` : 'Unknown',
      likes,
      comments,
    })
  }

  return {
    connected: true,
    page_name: mc.fb_page_name,
    auto_publish: mc.auto_publish_on_active,
    recent_posts: recentPosts,
  }
}

async function handlePublishVehicleFacebook(input: z.infer<typeof PublishVehicleFacebookInput>, ctx: ToolContext) {
  const { getTypedClient } = await import('@/lib/supabase/client')
  const supabase = getTypedClient()
  const wallet = ctx.walletAddress.toLowerCase()

  // Check FB connection
  const { data: connection } = await supabase
    .from('seller_meta_connections')
    .select('id, is_active')
    .eq('wallet_address', wallet)
    .eq('is_active', true)
    .single()

  if (!connection) {
    throw new Error('Facebook not connected. Go to Profile > Facebook & WhatsApp to connect.')
  }

  // Get vehicle info for response
  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('year, brand, model')
    .eq('id', input.vehicle_id)
    .eq('seller_address', wallet)
    .single()

  if (!vehicle) {
    throw new Error('Vehicle not found or does not belong to you.')
  }

  const v = vehicle as { year: number; brand: string; model: string }

  const { handleStatusChange } = await import('@/lib/meta/auto-publisher')
  await handleStatusChange({
    vehicleId: input.vehicle_id,
    sellerAddress: ctx.walletAddress,
    oldStatus: 'draft',
    newStatus: 'active',
    forcePublish: true,
  })

  return {
    success: true,
    vehicle_title: `${v.year} ${v.brand} ${v.model}`,
    message: `Published ${v.year} ${v.brand} ${v.model} to your Facebook page.`,
  }
}

async function handleDeleteVehicleFBPosts(input: z.infer<typeof DeleteVehicleFBPostsInput>, ctx: ToolContext) {
  const { getTypedClient } = await import('@/lib/supabase/client')
  const supabase = getTypedClient()
  const wallet = ctx.walletAddress.toLowerCase()

  // Verify vehicle ownership
  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('year, brand, model')
    .eq('id', input.vehicle_id)
    .eq('seller_address', wallet)
    .single()

  if (!vehicle) {
    throw new Error('Vehicle not found or does not belong to you.')
  }

  const v = vehicle as { year: number; brand: string; model: string }
  const { deleteVehicleFBPosts } = await import('@/lib/campaigns/campaign-service')
  const result = await deleteVehicleFBPosts(input.vehicle_id, ctx.walletAddress)

  return {
    success: true,
    vehicle_title: `${v.year} ${v.brand} ${v.model}`,
    deleted_posts_count: result.deletedPostsCount,
    message: result.deletedPostsCount > 0
      ? `Deleted ${result.deletedPostsCount} Facebook post(s) for ${v.year} ${v.brand} ${v.model}.`
      : `No Facebook posts found for ${v.year} ${v.brand} ${v.model}.`,
  }
}

// ===================================================
// TOOL DEFINITIONS
// ===================================================

export const metaTools: AgentTool[] = [
  {
    name: 'get_facebook_status',
    description: 'Check your Facebook connection status, page name, auto-publish setting, and recent posts with engagement metrics.',
    category: 'Meta',
    inputSchema: GetFacebookStatusInput,
    permission: 'read' as ToolPermission,
    roles: ['seller', 'admin'] as UserRole[],
    handler: handleGetFacebookStatus,
  },
  {
    name: 'publish_vehicle_facebook',
    description: 'Publish a vehicle listing to your connected Facebook page. Requires an active Facebook connection.',
    category: 'Meta',
    inputSchema: PublishVehicleFacebookInput,
    permission: 'write' as ToolPermission,
    roles: ['seller', 'admin'] as UserRole[],
    handler: handlePublishVehicleFacebook,
  },
  {
    name: 'delete_vehicle_fb_posts',
    description: 'Delete all Facebook posts for a specific vehicle. Removes the posts from your Facebook page.',
    category: 'Meta',
    inputSchema: DeleteVehicleFBPostsInput,
    permission: 'write' as ToolPermission,
    roles: ['seller', 'admin'] as UserRole[],
    handler: handleDeleteVehicleFBPosts,
  },
]
