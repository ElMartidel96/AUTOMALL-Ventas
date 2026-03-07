/**
 * WhatsApp Campaign Commands
 *
 * Handles campaign-related text commands from WhatsApp sellers.
 * Commands are detected in the 'idle' state when the message doesn't start a vehicle flow.
 *
 * Supported commands:
 *   "mis campañas" / "my campaigns"       → List campaigns with summary
 *   "campaña <name>" / "campaign <name>"  → Campaign detail + metrics
 *   "pausar campaña <name>"               → Pause a campaign
 *   "activar campaña <name>"              → Activate a campaign
 *   "publicar campaña <name>"             → Publish campaign to Facebook
 */

import { getTypedClient } from '@/lib/supabase/client';

type Lang = 'en' | 'es';

interface CampaignRow {
  id: string;
  name: string;
  status: string;
  objective: string | null;
  vehicle_ids: string[] | null;
  fb_publish_status: string | null;
  fb_published_at: string | null;
  created_at: string;
}

interface CampaignCommand {
  action: 'list' | 'detail' | 'pause' | 'activate' | 'publish';
  campaignName?: string;
}

// ─────────────────────────────────────────────
// Command Detection
// ─────────────────────────────────────────────

export function detectCampaignCommand(text: string): CampaignCommand | null {
  const lower = text.toLowerCase().trim();

  // List campaigns
  if (
    lower === 'mis campañas' ||
    lower === 'mis campanias' ||
    lower === 'my campaigns' ||
    lower === 'campañas' ||
    lower === 'campanias' ||
    lower === 'campaigns'
  ) {
    return { action: 'list' };
  }

  // Pause campaign
  const pauseMatch = lower.match(
    /^(?:pausar|pause|detener|stop)\s+(?:campaña|campania|campaign)\s+(.+)$/
  );
  if (pauseMatch) {
    return { action: 'pause', campaignName: pauseMatch[1].trim() };
  }

  // Activate campaign
  const activateMatch = lower.match(
    /^(?:activar|activate|reanudar|resume|iniciar|start)\s+(?:campaña|campania|campaign)\s+(.+)$/
  );
  if (activateMatch) {
    return { action: 'activate', campaignName: activateMatch[1].trim() };
  }

  // Publish campaign to FB
  const publishMatch = lower.match(
    /^(?:publicar|publish|postear|post)\s+(?:campaña|campania|campaign)\s+(.+)$/
  );
  if (publishMatch) {
    return { action: 'publish', campaignName: publishMatch[1].trim() };
  }

  // Campaign detail (must be checked last — most general pattern)
  const detailMatch = lower.match(
    /^(?:campaña|campania|campaign)\s+(.+)$/
  );
  if (detailMatch) {
    return { action: 'detail', campaignName: detailMatch[1].trim() };
  }

  return null;
}

// ─────────────────────────────────────────────
// Command Handlers
// ─────────────────────────────────────────────

export async function handleCampaignCommand(
  command: CampaignCommand,
  walletAddress: string,
  lang: Lang
): Promise<string> {
  switch (command.action) {
    case 'list':
      return listCampaigns(walletAddress, lang);
    case 'detail':
      return campaignDetail(walletAddress, command.campaignName || '', lang);
    case 'pause':
      return updateCampaignStatus(walletAddress, command.campaignName || '', 'paused', lang);
    case 'activate':
      return updateCampaignStatus(walletAddress, command.campaignName || '', 'active', lang);
    case 'publish':
      return publishCampaignToFb(walletAddress, command.campaignName || '', lang);
  }
}

// ─────────────────────────────────────────────
// List Campaigns
// ─────────────────────────────────────────────

async function listCampaigns(walletAddress: string, lang: Lang): Promise<string> {
  const supabase = getTypedClient();

  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('id, name, status, objective, vehicle_ids, fb_publish_status, created_at')
    .eq('wallet_address', walletAddress)
    .order('created_at', { ascending: false })
    .limit(10);

  if (!campaigns || campaigns.length === 0) {
    return lang === 'es'
      ? `No tienes campañas creadas.\n\nPuedes crear una desde tu panel en Autos MALL (seccion "Campañas").`
      : `You don't have any campaigns.\n\nYou can create one from your Autos MALL dashboard ("Campaigns" section).`;
  }

  // Get lead counts for all campaigns
  const campaignIds = (campaigns as CampaignRow[]).map(c => c.id);
  const { data: leads } = await supabase
    .from('campaign_leads')
    .select('campaign_id')
    .in('campaign_id', campaignIds);

  const leadCounts: Record<string, number> = {};
  for (const l of (leads || []) as { campaign_id: string }[]) {
    leadCounts[l.campaign_id] = (leadCounts[l.campaign_id] || 0) + 1;
  }

  const header = lang === 'es' ? `*Tus Campañas* (${campaigns.length})\n\n` : `*Your Campaigns* (${campaigns.length})\n\n`;

  const statusEmoji: Record<string, string> = {
    active: '🟢',
    paused: '⏸️',
    draft: '📝',
    completed: '✅',
    archived: '📦',
  };

  const lines = (campaigns as CampaignRow[]).map((c, i) => {
    const emoji = statusEmoji[c.status] || '⚪';
    const vehicleCount = (c.vehicle_ids || []).length;
    const leadCount = leadCounts[c.id] || 0;
    const fbStatus = c.fb_publish_status === 'published' ? ' | FB ✅' : '';

    return lang === 'es'
      ? `${i + 1}. ${emoji} *${c.name}*\n   ${vehicleCount} vehiculos | ${leadCount} leads${fbStatus}`
      : `${i + 1}. ${emoji} *${c.name}*\n   ${vehicleCount} vehicles | ${leadCount} leads${fbStatus}`;
  });

  const footer = lang === 'es'
    ? `\n\nEscribe "campaña [nombre]" para ver detalles.\nEscribe "pausar campaña [nombre]" o "activar campaña [nombre]" para cambiar estado.`
    : `\n\nType "campaign [name]" for details.\nType "pause campaign [name]" or "activate campaign [name]" to change status.`;

  return header + lines.join('\n\n') + footer;
}

// ─────────────────────────────────────────────
// Campaign Detail
// ─────────────────────────────────────────────

async function campaignDetail(walletAddress: string, name: string, lang: Lang): Promise<string> {
  const campaign = await findCampaignByName(walletAddress, name);

  if (!campaign) {
    return lang === 'es'
      ? `No encontre una campaña con ese nombre. Escribe "mis campañas" para ver la lista.`
      : `I couldn't find a campaign with that name. Type "my campaigns" to see the list.`;
  }

  const supabase = getTypedClient();

  // Get lead count
  const { count: leadCount } = await supabase
    .from('campaign_leads')
    .select('id', { count: 'exact', head: true })
    .eq('campaign_id', campaign.id);

  // Get event counts
  const { data: events } = await supabase
    .from('campaign_events')
    .select('event_type')
    .eq('campaign_id', campaign.id);

  const eventSummary: Record<string, number> = {};
  for (const e of (events || []) as { event_type: string }[]) {
    eventSummary[e.event_type] = (eventSummary[e.event_type] || 0) + 1;
  }

  // Get engagement if published
  let engagementText = '';
  if (campaign.fb_publish_status === 'published') {
    const { data: pubs } = await supabase
      .from('meta_publication_log')
      .select('id')
      .eq('campaign_id', campaign.id)
      .eq('status', 'published');

    if (pubs && pubs.length > 0) {
      const pubIds = (pubs as { id: string }[]).map(p => p.id);
      const { data: engagement } = await supabase
        .from('fb_post_engagement')
        .select('likes_count, comments_count, shares_count')
        .in('publication_id', pubIds)
        .order('fetched_at', { ascending: false })
        .limit(pubIds.length);

      let totalLikes = 0, totalComments = 0, totalShares = 0;
      const seen = new Set<string>();
      for (const e of (engagement || []) as { likes_count: number; comments_count: number; shares_count: number; publication_id?: string }[]) {
        const pid = (e as Record<string, unknown>).publication_id as string;
        if (pid && !seen.has(pid)) {
          seen.add(pid);
          totalLikes += e.likes_count || 0;
          totalComments += e.comments_count || 0;
          totalShares += e.shares_count || 0;
        }
      }

      engagementText = lang === 'es'
        ? `\n\n*Facebook*\n👍 ${totalLikes} likes | 💬 ${totalComments} comentarios | 🔄 ${totalShares} compartidos`
        : `\n\n*Facebook*\n👍 ${totalLikes} likes | 💬 ${totalComments} comments | 🔄 ${totalShares} shares`;
    }
  }

  const statusLabel: Record<string, Record<Lang, string>> = {
    active: { es: 'Activa', en: 'Active' },
    paused: { es: 'Pausada', en: 'Paused' },
    draft: { es: 'Borrador', en: 'Draft' },
    completed: { es: 'Completada', en: 'Completed' },
  };

  const vehicleCount = (campaign.vehicle_ids || []).length;
  const pageViews = eventSummary['page_view'] || 0;
  const waClicks = eventSummary['whatsapp_click'] || 0;

  const fbLine = campaign.fb_publish_status === 'published'
    ? (lang === 'es' ? '✅ Publicada en Facebook' : '✅ Published on Facebook')
    : (lang === 'es' ? '⬜ No publicada en Facebook' : '⬜ Not published on Facebook');

  return lang === 'es'
    ? `*${campaign.name}*\n\nEstado: ${statusLabel[campaign.status]?.es || campaign.status}\nObjetivo: ${campaign.objective || 'General'}\nVehiculos: ${vehicleCount}\nLeads: ${leadCount || 0}\nVisitas: ${pageViews}\nClicks WhatsApp: ${waClicks}\n${fbLine}${engagementText}\n\nComandos:\n• "pausar campaña ${campaign.name}" — pausar\n• "activar campaña ${campaign.name}" — reactivar\n• "publicar campaña ${campaign.name}" — publicar en FB`
    : `*${campaign.name}*\n\nStatus: ${statusLabel[campaign.status]?.en || campaign.status}\nObjective: ${campaign.objective || 'General'}\nVehicles: ${vehicleCount}\nLeads: ${leadCount || 0}\nPage Views: ${pageViews}\nWhatsApp Clicks: ${waClicks}\n${fbLine}${engagementText}\n\nCommands:\n• "pause campaign ${campaign.name}" — pause\n• "activate campaign ${campaign.name}" — reactivate\n• "publish campaign ${campaign.name}" — publish to FB`;
}

// ─────────────────────────────────────────────
// Update Campaign Status
// ─────────────────────────────────────────────

async function updateCampaignStatus(
  walletAddress: string,
  name: string,
  newStatus: 'active' | 'paused',
  lang: Lang
): Promise<string> {
  const campaign = await findCampaignByName(walletAddress, name);

  if (!campaign) {
    return lang === 'es'
      ? `No encontre una campaña con ese nombre. Escribe "mis campañas" para ver la lista.`
      : `I couldn't find a campaign with that name. Type "my campaigns" to see the list.`;
  }

  if (campaign.status === newStatus) {
    const label = newStatus === 'active'
      ? (lang === 'es' ? 'activa' : 'active')
      : (lang === 'es' ? 'pausada' : 'paused');
    return lang === 'es'
      ? `La campaña "${campaign.name}" ya esta ${label}.`
      : `Campaign "${campaign.name}" is already ${label}.`;
  }

  const supabase = getTypedClient();
  const { error } = await supabase
    .from('campaigns')
    .update({ status: newStatus })
    .eq('id', campaign.id)
    .eq('wallet_address', walletAddress);

  if (error) {
    return lang === 'es'
      ? `Error al actualizar la campaña: ${error.message}`
      : `Error updating campaign: ${error.message}`;
  }

  if (newStatus === 'active') {
    return lang === 'es'
      ? `✅ Campaña "${campaign.name}" activada.\n\nTu landing page esta activa y recibiendo visitas.`
      : `✅ Campaign "${campaign.name}" activated.\n\nYour landing page is active and receiving visits.`;
  }

  return lang === 'es'
    ? `⏸️ Campaña "${campaign.name}" pausada.\n\nLa landing page seguira visible pero dejara de recibir trafico nuevo.`
    : `⏸️ Campaign "${campaign.name}" paused.\n\nThe landing page will remain visible but won't receive new traffic.`;
}

// ─────────────────────────────────────────────
// Publish Campaign to Facebook
// ─────────────────────────────────────────────

async function publishCampaignToFb(
  walletAddress: string,
  name: string,
  lang: Lang
): Promise<string> {
  const campaign = await findCampaignByName(walletAddress, name);

  if (!campaign) {
    return lang === 'es'
      ? `No encontre una campaña con ese nombre. Escribe "mis campañas" para ver la lista.`
      : `I couldn't find a campaign with that name. Type "my campaigns" to see the list.`;
  }

  if (campaign.fb_publish_status === 'published') {
    return lang === 'es'
      ? `La campaña "${campaign.name}" ya fue publicada en Facebook.`
      : `Campaign "${campaign.name}" has already been published on Facebook.`;
  }

  if (campaign.status !== 'active') {
    return lang === 'es'
      ? `La campaña debe estar activa para publicar en Facebook. Escribe "activar campaña ${campaign.name}" primero.`
      : `Campaign must be active to publish on Facebook. Type "activate campaign ${campaign.name}" first.`;
  }

  // Call the publish API
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${process.env.NEXT_PUBLIC_APP_DOMAIN || 'autosmall.org'}`;
    const res = await fetch(`${baseUrl}/api/campaigns/${campaign.id}/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet_address: walletAddress }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const errMsg = (data as Record<string, string>).error || 'Unknown error';

      if (errMsg.includes('Meta connection')) {
        return lang === 'es'
          ? `No se pudo publicar: no tienes conexion con Facebook.\n\nConecta tu pagina de Facebook en tu perfil de Autos MALL.`
          : `Couldn't publish: no Facebook connection found.\n\nConnect your Facebook page in your Autos MALL profile.`;
      }

      return lang === 'es'
        ? `Error al publicar en Facebook: ${errMsg}`
        : `Error publishing to Facebook: ${errMsg}`;
    }

    return lang === 'es'
      ? `✅ Campaña "${campaign.name}" publicada en Facebook!\n\nTus vehiculos estan visibles en tu pagina de Facebook con enlace a la landing page.`
      : `✅ Campaign "${campaign.name}" published on Facebook!\n\nYour vehicles are visible on your Facebook page with a link to the landing page.`;
  } catch (err) {
    console.error('[WA-Campaign] Publish error:', err);
    return lang === 'es'
      ? `Error de conexion al intentar publicar. Intenta de nuevo en unos minutos.`
      : `Connection error while publishing. Try again in a few minutes.`;
  }
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

async function findCampaignByName(
  walletAddress: string,
  name: string
): Promise<CampaignRow | null> {
  const supabase = getTypedClient();

  // Try exact match first (case-insensitive via ilike)
  const { data: exact } = await supabase
    .from('campaigns')
    .select('id, name, status, objective, vehicle_ids, fb_publish_status, fb_published_at, created_at')
    .eq('wallet_address', walletAddress)
    .ilike('name', name)
    .limit(1);

  if (exact && exact.length > 0) {
    return exact[0] as unknown as CampaignRow;
  }

  // Try partial match
  const { data: partial } = await supabase
    .from('campaigns')
    .select('id, name, status, objective, vehicle_ids, fb_publish_status, fb_published_at, created_at')
    .eq('wallet_address', walletAddress)
    .ilike('name', `%${name}%`)
    .limit(1);

  if (partial && partial.length > 0) {
    return partial[0] as unknown as CampaignRow;
  }

  return null;
}
