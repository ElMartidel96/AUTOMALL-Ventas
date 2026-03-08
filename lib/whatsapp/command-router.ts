/**
 * WhatsApp Command Router — Slash commands + keyword matching
 *
 * Design: Simple deterministic matching. NO AI for command parsing.
 * GPT-4o is only used for vehicle photo extraction.
 *
 * Flow:
 *   1. Active sub-flow? → continue sub-flow
 *   2. Button action? (cmd_*) → execute
 *   3. Slash command? (/listar, /leads) → execute
 *   4. Keyword match? ("mis autos", "clientes") → execute
 *   5. Number after list? → select item
 *   6. Nothing matched → return null (caller shows menu)
 */

import type { WAPhoneLink, WAButton, CommandContext } from './types';
import * as handlers from './action-handlers';
import * as ct from './command-templates';

type Lang = 'en' | 'es';

export interface RouteResult {
  text: string;
  buttons?: WAButton[];
  newContext?: CommandContext | null;
}

// ─────────────────────────────────────────────
// Command Definitions
// ─────────────────────────────────────────────

interface CommandDef {
  id: string;
  slash: string[];
  keywords_es: string[];
  keywords_en: string[];
}

const COMMANDS: CommandDef[] = [
  {
    id: 'menu',
    slash: ['/menu', '/ayuda', '/help'],
    keywords_es: ['menu', 'ayuda', 'opciones'],
    keywords_en: ['menu', 'help', 'options'],
  },
  {
    id: 'inventory',
    slash: ['/mis_autos', '/inventario', '/inventory', '/vehicles'],
    keywords_es: ['mis autos', 'inventario', 'mis vehiculos', 'mis carros'],
    keywords_en: ['my vehicles', 'inventory', 'my cars', 'my listings'],
  },
  {
    id: 'leads',
    slash: ['/leads', '/clientes', '/clients'],
    keywords_es: ['leads', 'clientes', 'contactos'],
    keywords_en: ['leads', 'clients', 'contacts'],
  },
  {
    id: 'new_lead',
    slash: ['/nuevo_lead', '/new_lead', '/nuevo_cliente'],
    keywords_es: ['nuevo cliente', 'agregar lead', 'nuevo lead', 'agregar cliente'],
    keywords_en: ['new client', 'add lead', 'new lead', 'add client'],
  },
  {
    id: 'stats',
    slash: ['/stats', '/resumen', '/summary', '/estadisticas'],
    keywords_es: ['estadisticas', 'resumen', 'numeros', 'stats'],
    keywords_en: ['stats', 'summary', 'numbers', 'statistics'],
  },
  {
    id: 'facebook',
    slash: ['/fb', '/facebook'],
    keywords_es: ['facebook', 'estado fb'],
    keywords_en: ['facebook', 'fb status'],
  },
  {
    id: 'referrals',
    slash: ['/referidos', '/codigo', '/referrals', '/code'],
    keywords_es: ['referidos', 'codigo', 'mi enlace', 'mi codigo'],
    keywords_en: ['referrals', 'code', 'my link', 'my code'],
  },
  {
    id: 'profile',
    slash: ['/perfil', '/profile'],
    keywords_es: ['mi perfil', 'mis datos', 'perfil'],
    keywords_en: ['my profile', 'my info', 'profile'],
  },
  {
    id: 'support',
    slash: ['/soporte', '/support', '/problema'],
    keywords_es: ['soporte', 'problema', 'error', 'ayuda tecnica'],
    keywords_en: ['support', 'problem', 'error', 'technical help'],
  },
];

// ─────────────────────────────────────────────
// Main Router
// ─────────────────────────────────────────────

/**
 * Route a text message to the appropriate handler.
 * Returns null if no command matched (caller should show menu or process differently).
 */
export async function routeCommand(
  text: string,
  lang: Lang,
  link: WAPhoneLink,
  currentContext: CommandContext | null,
  buttonActionId: string | null
): Promise<RouteResult | null> {
  const lower = text.toLowerCase().trim();

  // ── 1. Button actions (cmd_*) ──
  if (buttonActionId) {
    return handleButtonAction(buttonActionId, lang, link, currentContext);
  }

  // ── 2. Cancel sub-flow ──
  if (currentContext && ['cancelar', 'cancel', 'menu', '/menu'].includes(lower)) {
    const { text: menuText, buttons } = ct.mainMenu(lang);
    return { text: ct.subFlowCancelled(lang) + '\n\n' + menuText, buttons, newContext: null };
  }

  // ── 3. Active sub-flow → continue ──
  if (currentContext) {
    const result = await handleSubFlow(currentContext, text, lang, link);
    if (result) return result;
  }

  // ── 4. Slash commands ──
  const slashMatch = matchSlashCommand(lower);
  if (slashMatch) {
    return executeCommand(slashMatch, lang, link);
  }

  // ── 5. Keyword matching ──
  const keywordMatch = matchKeyword(lower, lang);
  if (keywordMatch) {
    return executeCommand(keywordMatch, lang, link);
  }

  // ── 6. Number selection (after list) ──
  if (currentContext && /^\d+$/.test(lower)) {
    const num = parseInt(lower);
    const result = await handleNumberSelection(num, currentContext, lang, link);
    if (result) return result;
  }

  // ── No match ──
  return null;
}

// ─────────────────────────────────────────────
// Command Matching
// ─────────────────────────────────────────────

function matchSlashCommand(text: string): string | null {
  // Exact match on slash command (ignore args after space)
  const cmd = text.split(' ')[0];
  for (const def of COMMANDS) {
    if (def.slash.includes(cmd)) return def.id;
  }
  return null;
}

function matchKeyword(text: string, lang: Lang): string | null {
  // Sort by longest keyword first for greedy matching
  const allMatches: Array<{ id: string; length: number }> = [];

  for (const def of COMMANDS) {
    const keywords = lang === 'es'
      ? [...def.keywords_es, ...def.keywords_en]
      : [...def.keywords_en, ...def.keywords_es];

    for (const kw of keywords) {
      if (text.includes(kw)) {
        allMatches.push({ id: def.id, length: kw.length });
      }
    }
  }

  if (allMatches.length === 0) return null;

  // Return the longest match (most specific)
  allMatches.sort((a, b) => b.length - a.length);
  return allMatches[0].id;
}

// ─────────────────────────────────────────────
// Command Execution
// ─────────────────────────────────────────────

async function executeCommand(commandId: string, lang: Lang, link: WAPhoneLink): Promise<RouteResult> {
  console.log(`[WA-CMD] Executing: ${commandId}`);

  switch (commandId) {
    case 'menu':
      return handlers.handleMenu(lang);

    case 'inventory':
      return handlers.handleListVehicles(lang, link);

    case 'leads':
      return handlers.handleListLeads(lang, link);

    case 'new_lead':
      return handlers.handleCreateLeadStep(lang, link, 0, {}, '');

    case 'stats':
      return handlers.handleStats(lang, link);

    case 'facebook':
      return handlers.handleFacebookStatus(lang, link);

    case 'referrals':
      return handlers.handleReferrals(lang, link);

    case 'profile':
      return handlers.handleProfile(lang, link);

    case 'support':
      return handlers.handleSupport(lang, link);

    default:
      return handlers.handleMenu(lang);
  }
}

// ─────────────────────────────────────────────
// Button Actions (interactive reply IDs)
// ─────────────────────────────────────────────

async function handleButtonAction(
  actionId: string,
  lang: Lang,
  link: WAPhoneLink,
  context: CommandContext | null
): Promise<RouteResult | null> {
  console.log(`[WA-CMD] Button action: ${actionId}`);

  // Direct command buttons
  if (actionId === 'cmd_menu') return handlers.handleMenu(lang);
  if (actionId === 'cmd_inventory') return handlers.handleListVehicles(lang, link);
  if (actionId === 'cmd_leads') return handlers.handleListLeads(lang, link);
  if (actionId === 'cmd_stats') return handlers.handleStats(lang, link);
  if (actionId === 'cmd_new_lead') return handlers.handleCreateLeadStep(lang, link, 0, {}, '');

  // Pagination
  if (actionId === 'cmd_inventory_next' && context?.flow === 'list_vehicles') {
    const nextPage = ((context.data.page as number) || 1) + 1;
    const statusFilter = (context.data.statusFilter as string) || 'all';
    return handlers.handleListVehicles(lang, link, nextPage, statusFilter);
  }
  if (actionId === 'cmd_leads_next' && context?.flow === 'list_leads') {
    const nextPage = ((context.data.page as number) || 1) + 1;
    return handlers.handleListLeads(lang, link, nextPage);
  }

  // Vehicle actions (cmd_price_UUID, cmd_sell_UUID, etc.)
  if (actionId.startsWith('cmd_price_')) {
    const vehicleId = actionId.replace('cmd_price_', '');
    const title = (context?.data?.vehicleTitle as string) || '';
    // Need to get current price
    const { getTypedClient } = await import('@/lib/supabase/client');
    const supabase = getTypedClient();
    const { data } = await supabase.from('vehicles').select('price, year, brand, model').eq('id', vehicleId).single();
    const v = data as { price: number | null; year: number; brand: string; model: string } | null;
    const vehicleTitle = title || (v ? `${v.year} ${v.brand} ${v.model}` : 'Vehicle');
    return handlers.handleChangePriceStart(lang, vehicleId, vehicleTitle, v?.price || null);
  }

  if (actionId.startsWith('cmd_sell_')) {
    const vehicleId = actionId.replace('cmd_sell_', '');
    const title = (context?.data?.vehicleTitle as string) || '';
    const vehicleTitle = title || 'Vehicle';
    return handlers.handleSellVehicle(lang, link, vehicleId, vehicleTitle);
  }

  if (actionId.startsWith('cmd_activate_')) {
    const vehicleId = actionId.replace('cmd_activate_', '');
    const title = (context?.data?.vehicleTitle as string) || '';
    const vehicleTitle = title || 'Vehicle';
    return handlers.handleActivateVehicle(lang, link, vehicleId, vehicleTitle);
  }

  if (actionId.startsWith('cmd_fb_pub_')) {
    const vehicleId = actionId.replace('cmd_fb_pub_', '');
    const title = (context?.data?.vehicleTitle as string) || '';
    const vehicleTitle = title || 'Vehicle';
    return handlers.handlePublishFB(lang, link, vehicleId, vehicleTitle);
  }

  // Edit profile buttons
  if (actionId === 'cmd_edit_phone') return handlers.handleEditProfileStart(lang, 'phone');
  if (actionId === 'cmd_edit_location') return handlers.handleEditProfileStart(lang, 'location');

  // Create lead source buttons
  if (actionId.startsWith('source_') && context?.flow === 'create_lead') {
    return handlers.handleCreateLeadStep(lang, link, 3, context.data, actionId);
  }

  return null;
}

// ─────────────────────────────────────────────
// Sub-flow Continuations
// ─────────────────────────────────────────────

async function handleSubFlow(
  context: CommandContext,
  text: string,
  lang: Lang,
  link: WAPhoneLink
): Promise<RouteResult | null> {
  const { flow, step, data } = context;

  switch (flow) {
    case 'change_price': {
      if (step === 1) {
        return handlers.handleChangePriceExecute(
          lang, link,
          data.vehicleId as string,
          data.vehicleTitle as string,
          text
        );
      }
      break;
    }

    case 'create_lead': {
      return handlers.handleCreateLeadStep(lang, link, step, data, text);
    }

    case 'edit_profile': {
      if (step === 1) {
        return handlers.handleEditProfileExecute(lang, link, data.field as string, text);
      }
      break;
    }

    // list_vehicles / list_leads — number selection handled separately
    case 'list_vehicles':
    case 'list_leads':
      // Only handle if input is a number
      if (/^\d+$/.test(text.trim())) {
        return handleNumberSelection(parseInt(text.trim()), context, lang, link);
      }
      break;
  }

  return null;
}

// ─────────────────────────────────────────────
// Number Selection (item from list)
// ─────────────────────────────────────────────

async function handleNumberSelection(
  num: number,
  context: CommandContext,
  lang: Lang,
  link: WAPhoneLink
): Promise<RouteResult | null> {
  const page = (context.data.page as number) || 1;
  const items = (context.data.items as string[]) || [];
  const index = num - ((page - 1) * 5) - 1; // Convert display number to array index

  if (index < 0 || index >= items.length) {
    return { text: ct.invalidNumber(lang), newContext: context };
  }

  const selectedId = items[index];

  if (context.flow === 'list_vehicles') {
    return handlers.handleVehicleDetail(lang, link, selectedId);
  }

  if (context.flow === 'list_leads') {
    // For leads, show a simple detail (can be expanded later)
    const { getTypedClient } = await import('@/lib/supabase/client');
    const supabase = getTypedClient();
    const { data } = await supabase
      .from('crm_leads')
      .select('*')
      .eq('id', selectedId)
      .single();

    if (!data) {
      return { text: lang === 'es' ? 'Lead no encontrado.' : 'Lead not found.', newContext: null };
    }

    const l = data as {
      id: string; name: string; phone: string | null; email: string | null;
      whatsapp: string | null; source: string | null; interest_level: string | null;
      status: string | null; notes: string | null; created_at: string;
    };

    const interestEmoji: Record<string, string> = { hot: '🔴 Hot', warm: '🟡 Warm', cold: '🔵 Cold' };
    const interest = interestEmoji[l.interest_level || ''] || l.interest_level || '—';
    const phone = l.phone ? `📞 ${l.phone}` : '';
    const email = l.email ? `📧 ${l.email}` : '';
    const wa = l.whatsapp ? `📱 WA: ${l.whatsapp}` : '';
    const contacts = [phone, email, wa].filter(Boolean).join('\n');
    const date = new Date(l.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    const text = lang === 'es'
      ? `👤 *${l.name}*\n${interest} | ${l.source || 'Manual'} | ${date}\n${contacts || '(sin contacto)'}\n${l.notes ? '\n📝 ' + l.notes : ''}`
      : `👤 *${l.name}*\n${interest} | ${l.source || 'Manual'} | ${date}\n${contacts || '(no contact info)'}\n${l.notes ? '\n📝 ' + l.notes : ''}`;

    const buttons: WAButton[] = [
      { type: 'reply', reply: { id: 'cmd_leads', title: lang === 'es' ? 'Ver leads' : 'View leads' } },
      { type: 'reply', reply: { id: 'cmd_menu', title: lang === 'es' ? 'Menu' : 'Menu' } },
    ];

    return { text, buttons, newContext: null };
  }

  return null;
}
