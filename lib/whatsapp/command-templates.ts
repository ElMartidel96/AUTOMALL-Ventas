/**
 * WhatsApp Command Templates — Bilingual EN/ES
 *
 * All user-facing messages for the command router system.
 * Covers: menu, inventory, CRM, stats, Facebook, referrals, profile, support.
 */

import type { WAButton } from './types';

type Lang = 'en' | 'es';

const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || 'autosmall.org';
const SUPPORT_WA = 'https://wa.me/12814680109';
const SUPPORT_NAME = 'Rafael Gonzalez';

// ─────────────────────────────────────────────
// Ad Error Diagnosis — classifies FB API errors
// ─────────────────────────────────────────────

function _diagnoseAdError(errorMsg: string, lang: Lang): { diagnosis: string; isSystemError: boolean } {
  const lower = errorMsg.toLowerCase();

  // Token / permission errors — user can fix
  if (lower.includes('oauthexception') || lower.includes('access token') || lower.includes('token has expired')) {
    return {
      diagnosis: lang === 'es'
        ? '🔑 Tu token de Facebook expiro o no tiene permisos.\n\n👉 Ve a tu perfil web > Facebook & WhatsApp > Desconecta y reconecta.'
        : '🔑 Your Facebook token expired or lacks permissions.\n\n👉 Go to your web profile > Facebook & WhatsApp > Disconnect and reconnect.',
      isSystemError: false,
    };
  }

  // Ad account disabled/restricted
  if (lower.includes('ad account') && (lower.includes('disabled') || lower.includes('unsettled') || lower.includes('restricted'))) {
    return {
      diagnosis: lang === 'es'
        ? '🚫 Tu cuenta de anuncios de Facebook esta deshabilitada o restringida.\n\n👉 Ve a business.facebook.com > Configuracion > Cuentas de anuncios para revisar el estado.'
        : '🚫 Your Facebook ad account is disabled or restricted.\n\n👉 Go to business.facebook.com > Settings > Ad accounts to check its status.',
      isSystemError: false,
    };
  }

  // Payment method missing
  if (lower.includes('payment') || lower.includes('billing') || lower.includes('funding')) {
    return {
      diagnosis: lang === 'es'
        ? '💳 Tu cuenta de anuncios no tiene metodo de pago.\n\n👉 Ve a Facebook Ads Manager > Configuracion de pago > Agrega tarjeta o PayPal.'
        : '💳 Your ad account has no payment method.\n\n👉 Go to Facebook Ads Manager > Payment settings > Add a card or PayPal.',
      isSystemError: false,
    };
  }

  // Daily budget too low
  if (lower.includes('budget') || lower.includes('minimum') || lower.includes('daily_budget')) {
    return {
      diagnosis: lang === 'es'
        ? '💰 El presupuesto diario es menor al minimo de Facebook ($1 USD).\n\n👉 Crea la campana con un presupuesto mas alto.'
        : '💰 The daily budget is below Facebook minimum ($1 USD).\n\n👉 Create the campaign with a higher budget.',
      isSystemError: false,
    };
  }

  // Page not published or not eligible
  if (lower.includes('page') && (lower.includes('not published') || lower.includes('not eligible') || lower.includes('unpublished'))) {
    return {
      diagnosis: lang === 'es'
        ? '📄 Tu pagina de Facebook no esta publicada o no es elegible para anuncios.\n\n👉 Ve a Facebook > Tu pagina > Configuracion > Asegurate de que este publicada.'
        : '📄 Your Facebook page is not published or not eligible for ads.\n\n👉 Go to Facebook > Your page > Settings > Make sure it is published.',
      isSystemError: false,
    };
  }

  // Targeting too narrow or invalid
  if (lower.includes('targeting') || lower.includes('audience') || lower.includes('reach')) {
    return {
      diagnosis: lang === 'es'
        ? '🎯 El area de targeting es demasiado especifica o hay un error en la configuracion de audiencia.\n\n👉 Contacta soporte para ajustar la configuracion.'
        : '🎯 The targeting area is too narrow or there is an audience configuration error.\n\n👉 Contact support to adjust the configuration.',
      isSystemError: true,
    };
  }

  // Rate limit
  if (lower.includes('rate limit') || lower.includes('too many') || lower.includes('throttl')) {
    return {
      diagnosis: lang === 'es'
        ? '⏳ Facebook tiene un limite de solicitudes. Espera unos minutos e intenta de nuevo.'
        : '⏳ Facebook has a rate limit. Wait a few minutes and try again.',
      isSystemError: false,
    };
  }

  // Object story ID / creative issues — system error
  if (lower.includes('object_story_id') || lower.includes('creative') || lower.includes('story')) {
    return {
      diagnosis: lang === 'es'
        ? '⚙️ Error interno al vincular el post organico con el anuncio pagado (object_story_id).\nEsto es un error del sistema.'
        : '⚙️ Internal error linking organic post with paid ad (object_story_id).\nThis is a system error.',
      isSystemError: true,
    };
  }

  // WhatsApp number not verified
  if (lower.includes('whatsapp') || lower.includes('phone_number')) {
    return {
      diagnosis: lang === 'es'
        ? '📱 El numero de WhatsApp no esta verificado en tu cuenta de anuncios de Facebook.\n\n👉 Ve a Facebook Business > WhatsApp accounts para verificar tu numero.'
        : '📱 The WhatsApp number is not verified in your Facebook ad account.\n\n👉 Go to Facebook Business > WhatsApp accounts to verify your number.',
      isSystemError: false,
    };
  }

  // Unknown / generic — system error, send to support
  return {
    diagnosis: lang === 'es'
      ? `⚙️ Error desconocido de Facebook:\n"${errorMsg.slice(0, 200)}"\n\nEsto puede ser un error temporal o un problema de configuracion.`
      : `⚙️ Unknown Facebook error:\n"${errorMsg.slice(0, 200)}"\n\nThis may be a temporary error or a configuration issue.`,
    isSystemError: true,
  };
}

// ─────────────────────────────────────────────
// Main Menu
// ─────────────────────────────────────────────

export function mainMenu(lang: Lang): { text: string; buttons: WAButton[] } {
  const text = lang === 'es'
    ? `*Autos MALL* — Menu Principal:\n\n📷 *Nuevo vehiculo* — Envia fotos + detalles\n🚗 *Mis autos* — Ver tu inventario\n📢 *Campanas* — Campanas de Facebook\n👥 *Leads* — Gestionar clientes\n📊 *Stats* — Resumen de tu negocio\n\nMas: /referidos, /perfil, /fb, /soporte`
    : `*Autos MALL* — Main Menu:\n\n📷 *New vehicle* — Send photos + details\n🚗 *My vehicles* — View your inventory\n📢 *Campaigns* — Facebook campaigns\n👥 *Leads* — Manage clients\n📊 *Stats* — Business summary\n\nMore: /referrals, /profile, /fb, /support`;

  const buttons: WAButton[] = [
    { type: 'reply', reply: { id: 'cmd_inventory', title: lang === 'es' ? 'Mis autos' : 'My vehicles' } },
    { type: 'reply', reply: { id: 'cmd_campaigns', title: lang === 'es' ? 'Campanas' : 'Campaigns' } },
    { type: 'reply', reply: { id: 'cmd_leads', title: 'Leads' } },
  ];

  return { text, buttons };
}

// ─────────────────────────────────────────────
// Inventory
// ─────────────────────────────────────────────

interface VehicleListItem {
  id: string;
  year: number | null;
  brand: string | null;
  model: string | null;
  trim: string | null;
  price: number | null;
  status: string;
}

export function vehicleList(
  lang: Lang,
  vehicles: VehicleListItem[],
  total: number,
  page: number,
  hasMore: boolean,
  statusFilter: string
): { text: string; buttons: WAButton[] } {
  if (vehicles.length === 0) {
    const text = lang === 'es'
      ? `🚗 No tienes vehiculos ${statusFilter !== 'all' ? `con estado "${statusFilter}"` : ''}.\n\nEnvia fotos para crear tu primer listado!`
      : `🚗 You have no vehicles ${statusFilter !== 'all' ? `with status "${statusFilter}"` : ''}.\n\nSend photos to create your first listing!`;
    return {
      text,
      buttons: [
        { type: 'reply', reply: { id: 'cmd_menu', title: lang === 'es' ? 'Menu' : 'Menu' } },
      ],
    };
  }

  const statusEmoji: Record<string, string> = {
    active: '✅', draft: '📝', sold: '💰', archived: '📦',
  };

  let text = lang === 'es'
    ? `🚗 Tu inventario (${total} total):\n\n`
    : `🚗 Your inventory (${total} total):\n\n`;

  vehicles.forEach((v, i) => {
    const num = (page - 1) * 5 + i + 1;
    const title = `${v.year || '?'} ${v.brand || '?'} ${v.model || '?'}${v.trim ? ' ' + v.trim : ''}`;
    const price = v.price ? `$${v.price.toLocaleString('en-US')}` : '';
    const emoji = statusEmoji[v.status] || '';
    text += `${num}. ${emoji} ${title} — ${price}\n`;
  });

  text += lang === 'es'
    ? `\nEnvia el numero para ver detalles.`
    : `\nSend the number to view details.`;

  const buttons: WAButton[] = [];
  if (hasMore) {
    buttons.push({ type: 'reply', reply: { id: 'cmd_inventory_next', title: lang === 'es' ? 'Mas ▶' : 'More ▶' } });
  }
  buttons.push({ type: 'reply', reply: { id: 'cmd_menu', title: lang === 'es' ? 'Menu' : 'Menu' } });

  return { text, buttons };
}

interface VehicleDetail {
  id: string;
  year: number | null;
  brand: string | null;
  model: string | null;
  trim: string | null;
  price: number | null;
  mileage: number | null;
  exterior_color: string | null;
  transmission: string | null;
  condition: string | null;
  status: string;
  views_count: number;
  inquiries_count: number;
  seller_handle: string;
  has_fb_posts?: boolean;
}

export function vehicleDetailCard(lang: Lang, v: VehicleDetail): { text: string; buttons: WAButton[] } {
  const title = `${v.year || '?'} ${v.brand || '?'} ${v.model || '?'}${v.trim ? ' ' + v.trim : ''}`;
  const price = v.price ? `$${v.price.toLocaleString('en-US')}` : 'N/A';
  const miles = v.mileage ? `${v.mileage.toLocaleString('en-US')} mi` : 'N/A';
  const color = v.exterior_color || '—';
  const trans = v.transmission || '—';
  const statusEmoji: Record<string, string> = {
    active: '✅ Activo', draft: '📝 Borrador', sold: '💰 Vendido', archived: '📦 Archivado',
  };
  const statusText = statusEmoji[v.status] || v.status;

  const text = lang === 'es'
    ? `*${title}*\n${price} | ${miles} | ${color} | ${trans}\nEstado: ${statusText}\n📊 Vistas: ${v.views_count || 0} | Consultas: ${v.inquiries_count || 0}\n🔗 ${v.seller_handle}.${APP_DOMAIN}/catalog/${v.id}`
    : `*${title}*\n${price} | ${miles} | ${color} | ${trans}\nStatus: ${statusText}\n📊 Views: ${v.views_count || 0} | Inquiries: ${v.inquiries_count || 0}\n🔗 ${v.seller_handle}.${APP_DOMAIN}/catalog/${v.id}`;

  const buttons: WAButton[] = [];
  if (v.status === 'active') {
    buttons.push({ type: 'reply', reply: { id: `cmd_price_${v.id}`, title: lang === 'es' ? 'Cambiar precio' : 'Change price' } });
    buttons.push({ type: 'reply', reply: { id: `cmd_sell_${v.id}`, title: lang === 'es' ? 'Vendido' : 'Sold' } });
    // Show "Eliminar FB" if has posts, otherwise "Facebook" to publish
    if (v.has_fb_posts) {
      buttons.push({ type: 'reply', reply: { id: `cmd_fb_del_${v.id}`, title: lang === 'es' ? 'Eliminar FB' : 'Delete FB' } });
    } else {
      buttons.push({ type: 'reply', reply: { id: `cmd_fb_pub_${v.id}`, title: 'Facebook' } });
    }
  } else if (v.status === 'draft') {
    buttons.push({ type: 'reply', reply: { id: `cmd_activate_${v.id}`, title: lang === 'es' ? 'Activar' : 'Activate' } });
    buttons.push({ type: 'reply', reply: { id: `cmd_menu`, title: lang === 'es' ? 'Menu' : 'Menu' } });
  } else {
    buttons.push({ type: 'reply', reply: { id: 'cmd_inventory', title: lang === 'es' ? 'Mis autos' : 'My vehicles' } });
    buttons.push({ type: 'reply', reply: { id: 'cmd_menu', title: lang === 'es' ? 'Menu' : 'Menu' } });
  }

  return { text, buttons };
}

export function changePricePrompt(lang: Lang, vehicleTitle: string, currentPrice: number | null): string {
  const cur = currentPrice ? `$${currentPrice.toLocaleString('en-US')}` : 'N/A';
  return lang === 'es'
    ? `💲 *${vehicleTitle}*\nPrecio actual: ${cur}\n\nEscribe el nuevo precio (solo numero):\nEj: 15000`
    : `💲 *${vehicleTitle}*\nCurrent price: ${cur}\n\nType the new price (number only):\nEx: 15000`;
}

export function priceUpdated(lang: Lang, vehicleTitle: string, newPrice: number): string {
  const formatted = `$${newPrice.toLocaleString('en-US')}`;
  return lang === 'es'
    ? `✅ Precio actualizado!\n*${vehicleTitle}* → ${formatted}`
    : `✅ Price updated!\n*${vehicleTitle}* → ${formatted}`;
}

export function vehicleSold(lang: Lang, vehicleTitle: string, fbPublished: boolean): string {
  const fbNote = fbPublished
    ? (lang === 'es' ? '\n📱 Publicado como vendido en Facebook.' : '\n📱 Posted as sold on Facebook.')
    : '';
  return lang === 'es'
    ? `💰 Marcado como vendido!\n*${vehicleTitle}*${fbNote}\n\nFelicidades por la venta!`
    : `💰 Marked as sold!\n*${vehicleTitle}*${fbNote}\n\nCongratulations on the sale!`;
}

export function vehicleActivated(lang: Lang, vehicleTitle: string): string {
  return lang === 'es'
    ? `✅ Vehiculo activado!\n*${vehicleTitle}* ahora esta visible en tu catalogo.`
    : `✅ Vehicle activated!\n*${vehicleTitle}* is now visible in your catalog.`;
}

export function fbPublishResult(lang: Lang, vehicleTitle: string, success: boolean): string {
  if (success) {
    return lang === 'es'
      ? `📱 *${vehicleTitle}* publicado en Facebook!`
      : `📱 *${vehicleTitle}* published to Facebook!`;
  }
  return lang === 'es'
    ? `No se pudo publicar en Facebook. Verifica tu conexion en tu perfil web.\nSoporte: ${SUPPORT_WA} (${SUPPORT_NAME})`
    : `Couldn't publish to Facebook. Check your connection in your web profile.\nSupport: ${SUPPORT_WA} (${SUPPORT_NAME})`;
}

// ─────────────────────────────────────────────
// CRM / Leads
// ─────────────────────────────────────────────

interface LeadListItem {
  id: string;
  name: string;
  phone: string | null;
  source: string | null;
  interest_level: string | null;
  status: string | null;
}

export function leadList(
  lang: Lang,
  leads: LeadListItem[],
  total: number,
  page: number,
  hasMore: boolean
): { text: string; buttons: WAButton[] } {
  if (leads.length === 0) {
    const text = lang === 'es'
      ? `👥 No tienes leads registrados.\n\nUsa /nuevo_lead para agregar un cliente.`
      : `👥 You have no leads registered.\n\nUse /new_lead to add a client.`;
    return {
      text,
      buttons: [
        { type: 'reply', reply: { id: 'cmd_new_lead', title: lang === 'es' ? 'Nuevo lead' : 'New lead' } },
        { type: 'reply', reply: { id: 'cmd_menu', title: lang === 'es' ? 'Menu' : 'Menu' } },
      ],
    };
  }

  const interestEmoji: Record<string, string> = {
    hot: '🔴', warm: '🟡', cold: '🔵',
  };

  let text = lang === 'es'
    ? `👥 Tus leads (${total} total):\n\n`
    : `👥 Your leads (${total} total):\n\n`;

  leads.forEach((l, i) => {
    const num = (page - 1) * 5 + i + 1;
    const emoji = interestEmoji[l.interest_level || ''] || '⚪';
    const contact = l.phone || l.source || '';
    const statusTag = l.status === 'new' ? ' 🆕' : '';
    text += `${num}. ${emoji} ${l.name}${statusTag}${contact ? ' — ' + contact : ''}\n`;
  });

  text += lang === 'es'
    ? `\nEnvia el numero para ver detalles.`
    : `\nSend the number to view details.`;

  const buttons: WAButton[] = [];
  if (hasMore) {
    buttons.push({ type: 'reply', reply: { id: 'cmd_leads_next', title: lang === 'es' ? 'Mas ▶' : 'More ▶' } });
  }
  buttons.push({ type: 'reply', reply: { id: 'cmd_new_lead', title: lang === 'es' ? 'Nuevo lead' : 'New lead' } });
  buttons.push({ type: 'reply', reply: { id: 'cmd_menu', title: lang === 'es' ? 'Menu' : 'Menu' } });

  return { text, buttons };
}

export function createLeadStep(lang: Lang, step: number, data: Record<string, unknown>): string {
  switch (step) {
    case 1:
      return lang === 'es'
        ? `👥 Nuevo lead — Paso 1/3\n\nEscribe el *nombre* del cliente:`
        : `👥 New lead — Step 1/3\n\nType the client's *name*:`;
    case 2:
      return lang === 'es'
        ? `👥 Nuevo lead — Paso 2/3\nCliente: *${data.name}*\n\nEscribe el *telefono* (o "saltar"):`
        : `👥 New lead — Step 2/3\nClient: *${data.name}*\n\nType their *phone* (or "skip"):`;
    case 3: {
      const phone = data.phone ? `📞 ${data.phone}` : '(sin telefono)';
      return lang === 'es'
        ? `👥 Nuevo lead — Paso 3/3\nCliente: *${data.name}*\n${phone}\n\nDe donde vino?`
        : `👥 New lead — Step 3/3\nClient: *${data.name}*\n${phone}\n\nWhere did they come from?`;
    }
    default:
      return '';
  }
}

export function createLeadSourceButtons(lang: Lang): WAButton[] {
  return [
    { type: 'reply', reply: { id: 'source_whatsapp', title: 'WhatsApp' } },
    { type: 'reply', reply: { id: 'source_facebook', title: 'Facebook' } },
    { type: 'reply', reply: { id: 'source_manual', title: lang === 'es' ? 'Manual' : 'Manual' } },
  ];
}

export function leadCreated(lang: Lang, name: string): string {
  return lang === 'es'
    ? `✅ Lead creado: *${name}*\n\nUsa /leads para ver todos tus clientes.`
    : `✅ Lead created: *${name}*\n\nUse /leads to see all your clients.`;
}

// ─────────────────────────────────────────────
// Statistics
// ─────────────────────────────────────────────

interface StatsData {
  inventory: { active: number; sold: number; draft: number; archived: number; total: number };
  leads: { total: number; hot: number; warm: number; cold: number };
  fb: { posts: number; totalLikes: number; totalComments: number } | null;
  referrals: { total: number; code: string | null };
}

export function statsMessage(lang: Lang, stats: StatsData): { text: string; buttons: WAButton[] } {
  const inv = stats.inventory;
  const ld = stats.leads;

  let text = lang === 'es'
    ? `📊 Resumen de tu negocio:\n\n`
    : `📊 Your business summary:\n\n`;

  text += lang === 'es'
    ? `🚗 Inventario: ${inv.active} activos | ${inv.sold} vendidos | ${inv.draft} borradores\n`
    : `🚗 Inventory: ${inv.active} active | ${inv.sold} sold | ${inv.draft} drafts\n`;

  text += lang === 'es'
    ? `👥 Leads: ${ld.total} total (${ld.hot} 🔴 hot, ${ld.warm} 🟡 warm)\n`
    : `👥 Leads: ${ld.total} total (${ld.hot} 🔴 hot, ${ld.warm} 🟡 warm)\n`;

  if (stats.fb) {
    text += lang === 'es'
      ? `📱 Facebook: ${stats.fb.posts} posts | ${stats.fb.totalLikes} likes\n`
      : `📱 Facebook: ${stats.fb.posts} posts | ${stats.fb.totalLikes} likes\n`;
  }

  if (stats.referrals.total > 0 || stats.referrals.code) {
    text += lang === 'es'
      ? `🤝 Referidos: ${stats.referrals.total} referidos\n`
      : `🤝 Referrals: ${stats.referrals.total} referrals\n`;
  }

  const buttons: WAButton[] = [
    { type: 'reply', reply: { id: 'cmd_inventory', title: lang === 'es' ? 'Mis autos' : 'My vehicles' } },
    { type: 'reply', reply: { id: 'cmd_leads', title: 'Leads' } },
    { type: 'reply', reply: { id: 'cmd_menu', title: lang === 'es' ? 'Menu' : 'Menu' } },
  ];

  return { text, buttons };
}

// ─────────────────────────────────────────────
// Facebook
// ─────────────────────────────────────────────

interface FbStatusData {
  connected: boolean;
  pageName: string | null;
  autoPublish: boolean;
  recentPosts: Array<{ vehicleTitle: string; likes: number; comments: number }>;
}

export function facebookStatus(lang: Lang, fb: FbStatusData): { text: string; buttons: WAButton[] } {
  if (!fb.connected) {
    const text = lang === 'es'
      ? `📱 Facebook:\n\nNo conectado. Ve a tu perfil web para conectar tu pagina de Facebook.\n🔗 Tu perfil en Autos MALL > Facebook & WhatsApp`
      : `📱 Facebook:\n\nNot connected. Go to your web profile to connect your Facebook page.\n🔗 Your Autos MALL profile > Facebook & WhatsApp`;
    return {
      text,
      buttons: [{ type: 'reply', reply: { id: 'cmd_menu', title: lang === 'es' ? 'Menu' : 'Menu' } }],
    };
  }

  let text = lang === 'es'
    ? `📱 Facebook:\n\nPagina: *${fb.pageName}* ✅\nAuto-publicar: ${fb.autoPublish ? '✅ Activado' : '❌ Desactivado'}\n`
    : `📱 Facebook:\n\nPage: *${fb.pageName}* ✅\nAuto-publish: ${fb.autoPublish ? '✅ Enabled' : '❌ Disabled'}\n`;

  if (fb.recentPosts.length > 0) {
    text += lang === 'es' ? '\nUltimos posts:\n' : '\nRecent posts:\n';
    fb.recentPosts.forEach((p, i) => {
      text += `${i + 1}. ${p.vehicleTitle} — ${p.likes} likes, ${p.comments} comments\n`;
    });
  }

  const buttons: WAButton[] = [
    { type: 'reply', reply: { id: 'cmd_inventory', title: lang === 'es' ? 'Publicar auto' : 'Publish vehicle' } },
    { type: 'reply', reply: { id: 'cmd_menu', title: lang === 'es' ? 'Menu' : 'Menu' } },
  ];

  return { text, buttons };
}

// ─────────────────────────────────────────────
// Referrals
// ─────────────────────────────────────────────

interface ReferralData {
  code: string | null;
  totalReferrals: number;
  link: string | null;
}

export function referralsMessage(lang: Lang, data: ReferralData): { text: string; buttons: WAButton[] } {
  if (!data.code) {
    const text = lang === 'es'
      ? `🤝 Referidos:\n\nNo tienes codigo de referido aun. Ve a tu perfil web para generar uno.`
      : `🤝 Referrals:\n\nYou don't have a referral code yet. Go to your web profile to generate one.`;
    return {
      text,
      buttons: [{ type: 'reply', reply: { id: 'cmd_menu', title: lang === 'es' ? 'Menu' : 'Menu' } }],
    };
  }

  const text = lang === 'es'
    ? `🤝 Referidos:\n\nTu codigo: *${data.code}*\n🔗 ${data.link || APP_DOMAIN + '/ref/' + data.code}\nReferidos: ${data.totalReferrals}\n\nComparte tu enlace para ganar comisiones!`
    : `🤝 Referrals:\n\nYour code: *${data.code}*\n🔗 ${data.link || APP_DOMAIN + '/ref/' + data.code}\nReferrals: ${data.totalReferrals}\n\nShare your link to earn commissions!`;

  const buttons: WAButton[] = [
    { type: 'reply', reply: { id: 'cmd_menu', title: lang === 'es' ? 'Menu' : 'Menu' } },
  ];

  return { text, buttons };
}

// ─────────────────────────────────────────────
// Profile
// ─────────────────────────────────────────────

interface ProfileData {
  businessName: string | null;
  handle: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
}

export function profileMessage(lang: Lang, p: ProfileData): { text: string; buttons: WAButton[] } {
  const name = p.businessName || '(sin nombre)';
  const handle = p.handle || '?';
  const phone = p.phone || '—';
  const location = (p.city && p.state) ? `${p.city}, ${p.state}` : '—';

  const text = lang === 'es'
    ? `👤 Tu perfil:\n\nNegocio: *${name}*\nHandle: ${handle}\n📞 ${phone}\n📍 ${location}\n🌐 ${handle}.${APP_DOMAIN}`
    : `👤 Your profile:\n\nBusiness: *${name}*\nHandle: ${handle}\n📞 ${phone}\n📍 ${location}\n🌐 ${handle}.${APP_DOMAIN}`;

  const buttons: WAButton[] = [
    { type: 'reply', reply: { id: 'cmd_edit_phone', title: lang === 'es' ? 'Editar telefono' : 'Edit phone' } },
    { type: 'reply', reply: { id: 'cmd_edit_location', title: lang === 'es' ? 'Editar ubicacion' : 'Edit location' } },
    { type: 'reply', reply: { id: 'cmd_menu', title: lang === 'es' ? 'Menu' : 'Menu' } },
  ];

  return { text, buttons };
}

export function editPhonePrompt(lang: Lang): string {
  return lang === 'es'
    ? `📞 Escribe tu nuevo numero de telefono:\nEj: (281) 555-0109`
    : `📞 Type your new phone number:\nEx: (281) 555-0109`;
}

export function editLocationPrompt(lang: Lang): string {
  return lang === 'es'
    ? `📍 Escribe tu ciudad y estado:\nEj: Houston, TX`
    : `📍 Type your city and state:\nEx: Houston, TX`;
}

export function profileUpdated(lang: Lang, field: string): string {
  return lang === 'es'
    ? `✅ ${field} actualizado!`
    : `✅ ${field} updated!`;
}

// ─────────────────────────────────────────────
// Support
// ─────────────────────────────────────────────

export function supportMessage(lang: Lang, sellerHandle: string | null): string {
  const ts = Date.now().toString(36).toUpperCase();
  const webUrl = sellerHandle ? `${sellerHandle}.${APP_DOMAIN}` : APP_DOMAIN;
  return lang === 'es'
    ? `📞 Soporte Autos MALL:\n\n• Escribe "reiniciar" para limpiar la sesion\n• Ve a ${webUrl} para gestion web\n• Soporte: ${SUPPORT_WA}\n  ${SUPPORT_NAME} (WhatsApp)\n\nSi detectaste un error, describe que paso.\nRef: ERR-${ts}`
    : `📞 Autos MALL Support:\n\n• Type "restart" to clear the session\n• Go to ${webUrl} for web management\n• Support: ${SUPPORT_WA}\n  ${SUPPORT_NAME} (WhatsApp)\n\nIf you found a bug, describe what happened.\nRef: ERR-${ts}`;
}

// ─────────────────────────────────────────────
// Error Handling
// ─────────────────────────────────────────────

export function commandError(lang: Lang, action: string): string {
  return lang === 'es'
    ? `Error al ejecutar "${action}". Intenta de nuevo o escribe /soporte.\nSoporte: ${SUPPORT_WA} (${SUPPORT_NAME})`
    : `Error executing "${action}". Try again or type /support.\nSupport: ${SUPPORT_WA} (${SUPPORT_NAME})`;
}

export function invalidNumber(lang: Lang): string {
  return lang === 'es'
    ? `Numero no valido. Escribe un numero de la lista.`
    : `Invalid number. Type a number from the list.`;
}

export function subFlowCancelled(lang: Lang): string {
  return lang === 'es'
    ? `Operacion cancelada.`
    : `Operation cancelled.`;
}

// ─────────────────────────────────────────────
// Campaigns
// ─────────────────────────────────────────────

interface CampaignQuickStats {
  active: number;
  total: number;
  leadsThisMonth: number;
}

export function campaignMenu(lang: Lang, stats: CampaignQuickStats): { text: string; buttons: WAButton[] } {
  const text = lang === 'es'
    ? `📢 *Campanas Facebook*\nActivas: ${stats.active} | Leads este mes: ${stats.leadsThisMonth}\n\nCrea campanas para atraer compradores por WhatsApp.`
    : `📢 *Facebook Campaigns*\nActive: ${stats.active} | Leads this month: ${stats.leadsThisMonth}\n\nCreate campaigns to attract buyers via WhatsApp.`;

  const buttons: WAButton[] = [
    { type: 'reply', reply: { id: 'cmd_new_campaign', title: lang === 'es' ? 'Nueva campana' : 'New campaign' } },
    { type: 'reply', reply: { id: 'cmd_campaigns_list', title: lang === 'es' ? 'Mis campanas' : 'My campaigns' } },
    { type: 'reply', reply: { id: 'cmd_menu', title: 'Menu' } },
  ];

  return { text, buttons };
}

interface CampaignListItem {
  id: string;
  name: string;
  type: string;
  status: string;
  vehicle_count: number;
  fb_publish_status: string;
}

export function campaignList(
  lang: Lang,
  campaigns: CampaignListItem[],
  total: number,
  page: number,
  hasMore: boolean
): { text: string; buttons: WAButton[] } {
  if (campaigns.length === 0) {
    const text = lang === 'es'
      ? `📢 No tienes campanas. Crea una con /campanas`
      : `📢 You have no campaigns. Create one with /campaigns`;
    return {
      text,
      buttons: [
        { type: 'reply', reply: { id: 'cmd_new_campaign', title: lang === 'es' ? 'Nueva campana' : 'New campaign' } },
        { type: 'reply', reply: { id: 'cmd_menu', title: 'Menu' } },
      ],
    };
  }

  const statusEmoji: Record<string, string> = {
    draft: '📝', active: '✅', paused: '⏸', completed: '🏁', archived: '📦',
  };
  const fbEmoji: Record<string, string> = {
    published: '📱', unpublished: '', publishing: '⏳', failed: '❌',
  };

  let text = lang === 'es'
    ? `📢 Tus campanas (${total} total):\n\n`
    : `📢 Your campaigns (${total} total):\n\n`;

  campaigns.forEach((c, i) => {
    const num = (page - 1) * 5 + i + 1;
    const se = statusEmoji[c.status] || '';
    const fe = fbEmoji[c.fb_publish_status] || '';
    text += `${num}. ${se}${fe} ${c.name} (${c.vehicle_count} veh)\n`;
  });

  text += lang === 'es'
    ? `\nEnvia el numero para ver detalles.`
    : `\nSend the number to view details.`;

  const buttons: WAButton[] = [];
  if (hasMore) {
    buttons.push({ type: 'reply', reply: { id: 'cmd_campaigns_next', title: lang === 'es' ? 'Mas ▶' : 'More ▶' } });
  }
  buttons.push({ type: 'reply', reply: { id: 'cmd_new_campaign', title: lang === 'es' ? 'Nueva campana' : 'New campaign' } });
  buttons.push({ type: 'reply', reply: { id: 'cmd_menu', title: 'Menu' } });

  return { text, buttons };
}

interface CampaignDetailData {
  id: string;
  name: string;
  type: string;
  status: string;
  vehicle_count: number;
  daily_budget: number | null;
  fb_publish_status: string;
  fb_permalink_url: string | null;
  fb_ad_status?: string;
  fb_ad_objective?: string;
  landing_slug: string | null;
  metrics: { page_views: number; whatsapp_clicks: number; total_leads: number };
}

export function campaignDetail(lang: Lang, c: CampaignDetailData): { text: string; buttons: WAButton[] } {
  const statusEmoji: Record<string, string> = {
    draft: '📝 Borrador', active: '✅ Activa', paused: '⏸ Pausada',
    completed: '🏁 Completada', archived: '📦 Archivada',
  };
  const statusEmojiEN: Record<string, string> = {
    draft: '📝 Draft', active: '✅ Active', paused: '⏸ Paused',
    completed: '🏁 Completed', archived: '📦 Archived',
  };

  const statusText = lang === 'es' ? (statusEmoji[c.status] || c.status) : (statusEmojiEN[c.status] || c.status);
  const budget = c.daily_budget ? `$${c.daily_budget}/dia` : '—';
  const landingUrl = c.landing_slug ? `autosmall.org/w/${c.landing_slug}` : '—';

  // Ad status indicator
  const adIndicators: Record<string, string> = {
    active: '💰 Ad activo',
    paused: '⏸ Ad pausado',
    creating: '⏳ Ad creando',
    error: '⚠️ Ad error',
    completed: '🏁 Ad completado',
  };
  const adIndicatorsEN: Record<string, string> = {
    active: '💰 Ad active',
    paused: '⏸ Ad paused',
    creating: '⏳ Ad creating',
    error: '⚠️ Ad error',
    completed: '🏁 Ad completed',
  };
  const adLine = c.fb_ad_status && c.fb_ad_status !== 'none'
    ? '\n' + (lang === 'es' ? (adIndicators[c.fb_ad_status] || '') : (adIndicatorsEN[c.fb_ad_status] || ''))
    : '';

  // Objective indicator (only when paid ad exists)
  const hasPaidAd = c.fb_ad_status && c.fb_ad_status !== 'none' && c.fb_ad_status !== 'error';
  const objLabels: Record<string, string> = { awareness: '📡 Alcance', whatsapp_clicks: '💬 WhatsApp Clicks' };
  const objLabelsEN: Record<string, string> = { awareness: '📡 Reach', whatsapp_clicks: '💬 WhatsApp Clicks' };
  const objLine = hasPaidAd && c.fb_ad_objective
    ? '\n🎯 ' + (lang === 'es' ? (objLabels[c.fb_ad_objective] || c.fb_ad_objective) : (objLabelsEN[c.fb_ad_objective] || c.fb_ad_objective))
    : '';

  const text = lang === 'es'
    ? `📢 *${c.name}*\n${statusText} | ${c.vehicle_count} vehiculos | ${budget}${adLine}${objLine}\n\n📊 Vistas: ${c.metrics.page_views} | WA clicks: ${c.metrics.whatsapp_clicks} | Leads: ${c.metrics.total_leads}\n🔗 ${landingUrl}${c.fb_permalink_url ? '\n📱 ' + c.fb_permalink_url : ''}`
    : `📢 *${c.name}*\n${statusText} | ${c.vehicle_count} vehicles | ${budget}${adLine}${objLine}\n\n📊 Views: ${c.metrics.page_views} | WA clicks: ${c.metrics.whatsapp_clicks} | Leads: ${c.metrics.total_leads}\n🔗 ${landingUrl}${c.fb_permalink_url ? '\n📱 ' + c.fb_permalink_url : ''}`;

  // Strategy: 3 buttons max
  // When paid ad exists: [Pause/Resume] [Switch Obj] [Stats]
  // When no paid ad:     [Publish FB]   [Stats]      [Delete]
  const buttons: WAButton[] = [];

  if (c.status === 'archived') {
    buttons.push({ type: 'reply', reply: { id: 'cmd_campaigns', title: lang === 'es' ? 'Campanas' : 'Campaigns' } });
  } else if (hasPaidAd) {
    // Button 1: Pause/Resume
    if (c.status === 'active') {
      buttons.push({ type: 'reply', reply: { id: `cmd_camp_pause_${c.id}`, title: lang === 'es' ? 'Pausar' : 'Pause' } });
    } else if (c.status === 'paused') {
      buttons.push({ type: 'reply', reply: { id: `cmd_camp_resume_${c.id}`, title: lang === 'es' ? 'Reactivar' : 'Resume' } });
    }
    // Button 2: Switch objective
    buttons.push({ type: 'reply', reply: { id: `cmd_camp_switch_${c.id}`, title: lang === 'es' ? 'Cambiar Obj.' : 'Switch Obj.' } });
    // Button 3: Stats
    buttons.push({ type: 'reply', reply: { id: `cmd_camp_stats_${c.id}`, title: 'Stats' } });
  } else {
    // No paid ad — standard layout
    if (c.fb_publish_status !== 'published') {
      buttons.push({ type: 'reply', reply: { id: `cmd_camp_pub_${c.id}`, title: lang === 'es' ? 'Publicar FB' : 'Publish FB' } });
    }
    buttons.push({ type: 'reply', reply: { id: `cmd_camp_stats_${c.id}`, title: 'Stats' } });
    buttons.push({ type: 'reply', reply: { id: `cmd_camp_del_${c.id}`, title: lang === 'es' ? 'Eliminar' : 'Delete' } });
  }

  return { text, buttons };
}

interface CampaignTemplateInfo {
  type: string;
  emoji: string;
  name: string;
  description: string;
}

export function campaignCreateTypeStep(lang: Lang, templates: CampaignTemplateInfo[]): { text: string; buttons: WAButton[] } {
  let text = lang === 'es'
    ? `📢 Paso 1/4 — Tipo de campana\nQue tipo de campana quieres crear?\n\n`
    : `📢 Step 1/4 — Campaign type\nWhat type of campaign do you want to create?\n\n`;

  for (const t of templates) {
    text += `${t.emoji} *${t.name}* — ${t.description}\n`;
  }

  text += lang === 'es'
    ? `\n💡 Recomendacion: *Promo de Temporada* es la mas popular para atraer compradores por WhatsApp.`
    : `\n💡 Tip: *Seasonal Promo* is the most popular to attract buyers via WhatsApp.`;

  // WhatsApp allows max 3 buttons, show top 3 templates
  const buttons: WAButton[] = templates.slice(0, 3).map(t => ({
    type: 'reply' as const,
    reply: { id: `tpl_${t.type}`, title: `${t.emoji} ${t.name}`.slice(0, 20) },
  }));

  return { text, buttons };
}

interface VehicleOption {
  num: number;
  year: number | null;
  brand: string | null;
  model: string | null;
  price: number | null;
}

export function campaignCreateVehiclesStep(
  lang: Lang,
  vehicles: VehicleOption[],
  typeName: string
): string {
  let text = lang === 'es'
    ? `📢 Paso 2/4 — Vehiculos\nCampana: *${typeName}*\n\nTu inventario activo:\n`
    : `📢 Step 2/4 — Vehicles\nCampaign: *${typeName}*\n\nYour active inventory:\n`;

  for (const v of vehicles) {
    const price = v.price ? `$${v.price.toLocaleString('en-US')}` : '';
    text += `${v.num}. ${v.year || '?'} ${v.brand || '?'} ${v.model || '?'} — ${price}\n`;
  }

  text += lang === 'es'
    ? `\nEnvia numeros separados por coma (ej: 1,3)\nO escribe "todos".`
    : `\nSend numbers separated by comma (e.g. 1,3)\nOr type "all".`;

  return text;
}

export function campaignCreateBudgetStep(
  lang: Lang,
  vehiclesSummary: string,
  suggestedMin: number,
  suggestedMax: number
): string {
  return lang === 'es'
    ? `📢 Paso 3/4 — Presupuesto\nVehiculos: ${vehiclesSummary}\n\nPresupuesto diario? (Recomendado: $${suggestedMin}-$${suggestedMax}/dia)\nEscribe numero o "saltar"`
    : `📢 Step 3/4 — Budget\nVehicles: ${vehiclesSummary}\n\nDaily budget? (Recommended: $${suggestedMin}-$${suggestedMax}/day)\nType number or "skip"`;
}

interface CampaignPreview {
  typeName: string;
  vehicleCount: number;
  budget: number | null;
  bodyPreview: string;
  landingUrl: string;
}

export function campaignCreateConfirmStep(lang: Lang, preview: CampaignPreview): { text: string; buttons: WAButton[] } {
  const budget = preview.budget ? `$${preview.budget}/dia` : '—';

  const text = lang === 'es'
    ? `📢 Paso 4/4 — Confirmar\n\n📋 *${preview.typeName}*\n🚗 ${preview.vehicleCount} vehiculos | 💰 ${budget}\n\n📝 Preview:\n"${preview.bodyPreview.slice(0, 300)}..."\n\n🔗 ${preview.landingUrl}`
    : `📢 Step 4/4 — Confirm\n\n📋 *${preview.typeName}*\n🚗 ${preview.vehicleCount} vehicles | 💰 ${budget}\n\n📝 Preview:\n"${preview.bodyPreview.slice(0, 300)}..."\n\n🔗 ${preview.landingUrl}`;

  const buttons: WAButton[] = [
    { type: 'reply', reply: { id: 'cmd_camp_create', title: lang === 'es' ? 'Crear' : 'Create' } },
    { type: 'reply', reply: { id: 'cmd_camp_create_pub', title: lang === 'es' ? 'Crear + Ad FB' : 'Create + FB Ad' } },
    { type: 'reply', reply: { id: 'cmd_menu', title: lang === 'es' ? 'Cancelar' : 'Cancel' } },
  ];

  return { text, buttons };
}

export function campaignCreated(lang: Lang, name: string, landingSlug: string): string {
  const landingUrl = `autosmall.org/w/${landingSlug}`;
  return lang === 'es'
    ? `✅ Campana creada: *${name}*\n🔗 ${landingUrl}\n\nUsa /campanas para publicar en Facebook.`
    : `✅ Campaign created: *${name}*\n🔗 ${landingUrl}\n\nUse /campaigns to publish to Facebook.`;
}

export function campaignPublished(
  lang: Lang,
  name: string,
  permalink: string | null,
  landingSlug: string,
  adStatus?: 'active' | 'organic_only' | 'error' | 'missing_requirements',
  dailyBudget?: number | null,
  adMessage?: string | null
): string {
  const landingUrl = `autosmall.org/w/${landingSlug}`;
  const fbLink = permalink || 'Facebook';

  let adNote = '';
  if (adStatus === 'active') {
    const budgetStr = dailyBudget ? `$${dailyBudget}` : '$?';
    adNote = lang === 'es'
      ? `\n\n💰 *ANUNCIO PAGADO ACTIVO*\n${budgetStr}/dia — Houston area\nRevisa en Facebook Ads Manager.`
      : `\n\n💰 *PAID AD ACTIVE*\n${budgetStr}/day — Houston area\nCheck in Facebook Ads Manager.`;
  } else if (adStatus === 'organic_only') {
    // No budget set — just organic, not an error
    adNote = lang === 'es'
      ? '\n\n📋 Post organico publicado (sin presupuesto asignado)'
      : '\n\n📋 Organic post published (no budget assigned)';
  } else if (adStatus === 'error') {
    // FB API failed — diagnose the cause and give actionable steps
    const errorMsg = adMessage?.replace('FB_API_ERROR: ', '') || '';
    const { diagnosis, isSystemError } = _diagnoseAdError(errorMsg, lang);

    if (isSystemError) {
      // System/internal error — pre-build support message with report
      const reportText = encodeURIComponent(
        `Error con anuncio pagado en campana "${name}".\n\nError: ${errorMsg}\n\nCampana: ${landingUrl}\nPresupuesto: $${dailyBudget || '?'}/dia`
      );
      const supportLink = `https://wa.me/12814680109?text=${reportText}`;

      adNote = lang === 'es'
        ? `\n\n❌ *ANUNCIO PAGADO FALLO*\n${diagnosis}\n\n📞 Reporta este error a soporte (mensaje pre-armado):\n${supportLink}`
        : `\n\n❌ *PAID AD FAILED*\n${diagnosis}\n\n📞 Report this error to support (pre-filled message):\n${supportLink}`;
    } else {
      // User-fixable error — give clear instructions
      adNote = lang === 'es'
        ? `\n\n❌ *ANUNCIO PAGADO FALLO*\n${diagnosis}\n\n🔄 Corrige el problema y vuelve a publicar.`
        : `\n\n❌ *PAID AD FAILED*\n${diagnosis}\n\n🔄 Fix the issue and publish again.`;
    }
  } else if (adStatus === 'missing_requirements') {
    // Prerequisites missing — tell user EXACTLY what to fix
    const fixes: string[] = [];
    if (adMessage?.includes('NO_AD_ACCOUNT')) {
      fixes.push(lang === 'es'
        ? '1️⃣ Ve a tu perfil web > Facebook & WhatsApp\n2️⃣ Desconecta y vuelve a conectar Facebook\n3️⃣ Aprueba TODOS los permisos incluyendo "Gestion de anuncios"\n4️⃣ Tu cuenta de Facebook debe tener una cuenta de anuncios activa'
        : '1️⃣ Go to your web profile > Facebook & WhatsApp\n2️⃣ Disconnect and reconnect Facebook\n3️⃣ Approve ALL permissions including "Ads management"\n4️⃣ Your Facebook account must have an active ad account');
    }
    if (adMessage?.includes('NO_ADS_PERMISSION')) {
      fixes.push(lang === 'es'
        ? '1️⃣ Ve a tu perfil web > Facebook & WhatsApp\n2️⃣ Desconecta y vuelve a conectar\n3️⃣ Cuando Facebook pida permisos, asegurate de aprobar "Gestion de anuncios (ads_management)"'
        : '1️⃣ Go to your web profile > Facebook & WhatsApp\n2️⃣ Disconnect and reconnect\n3️⃣ When Facebook asks for permissions, make sure to approve "Ads management (ads_management)"');
    }
    if (adMessage?.includes('NO_PHONE')) {
      fixes.push(lang === 'es'
        ? '1️⃣ Escribe /perfil\n2️⃣ Edita tu telefono/WhatsApp\n3️⃣ Los anuncios Click-to-WhatsApp necesitan un numero para recibir mensajes'
        : '1️⃣ Type /profile\n2️⃣ Edit your phone/WhatsApp\n3️⃣ Click-to-WhatsApp ads need a number to receive messages');
    }
    if (adMessage?.includes('NO_POST')) {
      fixes.push(lang === 'es'
        ? '🔄 El post organico no se creo. Intenta publicar de nuevo.'
        : '🔄 The organic post was not created. Try publishing again.');
    }
    const fixList = fixes.join('\n\n');

    adNote = lang === 'es'
      ? `\n\n❌ *ANUNCIO PAGADO NO CREADO*\nTienes presupuesto de $${dailyBudget}/dia pero faltan requisitos:\n\n${fixList}`
      : `\n\n❌ *PAID AD NOT CREATED*\nYou have a $${dailyBudget}/day budget but requirements are missing:\n\n${fixList}`;
  }

  return lang === 'es'
    ? `✅ Campana publicada!\n📢 *${name}*\n📱 FB: ${fbLink}\n🔗 Landing: ${landingUrl}${adNote}`
    : `✅ Campaign published!\n📢 *${name}*\n📱 FB: ${fbLink}\n🔗 Landing: ${landingUrl}${adNote}`;
}

export function campaignStatusChanged(lang: Lang, name: string, newStatus: string): string {
  const statusText: Record<string, { es: string; en: string }> = {
    active: { es: 'activada', en: 'activated' },
    paused: { es: 'pausada', en: 'paused' },
  };
  const s = statusText[newStatus] || { es: newStatus, en: newStatus };
  return lang === 'es'
    ? `✅ Campana *${name}* ${s.es}.`
    : `✅ Campaign *${name}* ${s.en}.`;
}

export function campaignNoActiveVehicles(lang: Lang): string {
  return lang === 'es'
    ? `No tienes vehiculos activos. Envia fotos primero para crear tu inventario.`
    : `You have no active vehicles. Send photos first to create your inventory.`;
}

// ─────────────────────────────────────────────
// Campaign Delete
// ─────────────────────────────────────────────

export function campaignDeleteConfirm(
  lang: Lang,
  data: { name: string; fbPostCount: number }
): { text: string; buttons: WAButton[] } {
  const fbWarning = data.fbPostCount > 0
    ? (lang === 'es'
      ? `\n\n⚠️ Esto eliminara ${data.fbPostCount} post(s) de Facebook.`
      : `\n\n⚠️ This will delete ${data.fbPostCount} post(s) from Facebook.`)
    : '';

  const text = lang === 'es'
    ? `🗑️ Eliminar campana *${data.name}*?${fbWarning}\n\nEsta accion no se puede deshacer.`
    : `🗑️ Delete campaign *${data.name}*?${fbWarning}\n\nThis action cannot be undone.`;

  const buttons: WAButton[] = [
    { type: 'reply', reply: { id: `cmd_camp_del_yes_${data.name}`, title: lang === 'es' ? 'Si, eliminar' : 'Yes, delete' } },
    { type: 'reply', reply: { id: 'cmd_campaigns', title: lang === 'es' ? 'Cancelar' : 'Cancel' } },
  ];

  return { text, buttons };
}

export function campaignDeleted(lang: Lang, name: string, fbCount: number): string {
  const fbNote = fbCount > 0
    ? (lang === 'es'
      ? `\n📱 ${fbCount} post(s) eliminados de Facebook.`
      : `\n📱 ${fbCount} post(s) deleted from Facebook.`)
    : '';

  return lang === 'es'
    ? `🗑️ Campana *${name}* eliminada.${fbNote}`
    : `🗑️ Campaign *${name}* deleted.${fbNote}`;
}

// ─────────────────────────────────────────────
// Campaign Full Stats
// ─────────────────────────────────────────────

interface CampaignFullStatsData {
  id: string;
  name: string;
  landing: { page_views: number; whatsapp_clicks: number; total_leads: number };
  fb: {
    published: boolean;
    impressions: number;
    reach: number;
    likes: number;
    comments: number;
    shares: number;
    clicks: number;
  };
  ad?: {
    status: string;
    spend: number;
    impressions: number;
    reach: number;
    clicks: number;
    conversations: number;
    costPerConversation: number;
  } | null;
  publishedAt: string | null;
}

export function campaignFullStats(lang: Lang, data: CampaignFullStatsData): { text: string; buttons: WAButton[] } {
  let text = lang === 'es'
    ? `📊 *Stats — ${data.name}*\n\n`
    : `📊 *Stats — ${data.name}*\n\n`;

  // Landing page stats
  text += lang === 'es'
    ? `🔗 *Landing Page:*\n👁️ Vistas: ${data.landing.page_views}\n📱 WA clicks: ${data.landing.whatsapp_clicks}\n👥 Leads: ${data.landing.total_leads}\n\n`
    : `🔗 *Landing Page:*\n👁️ Views: ${data.landing.page_views}\n📱 WA clicks: ${data.landing.whatsapp_clicks}\n👥 Leads: ${data.landing.total_leads}\n\n`;

  // Facebook stats
  if (data.fb.published) {
    const pubDate = data.publishedAt
      ? new Date(data.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : '—';

    text += lang === 'es'
      ? `📱 *Facebook* (pub: ${pubDate}):\n👁️ Impresiones: ${data.fb.impressions.toLocaleString()}\n👥 Alcance: ${data.fb.reach.toLocaleString()}\n❤️ Reacciones: ${data.fb.likes}\n💬 Comentarios: ${data.fb.comments}\n🔄 Compartidos: ${data.fb.shares}\n🔗 Clicks: ${data.fb.clicks}`
      : `📱 *Facebook* (pub: ${pubDate}):\n👁️ Impressions: ${data.fb.impressions.toLocaleString()}\n👥 Reach: ${data.fb.reach.toLocaleString()}\n❤️ Reactions: ${data.fb.likes}\n💬 Comments: ${data.fb.comments}\n🔄 Shares: ${data.fb.shares}\n🔗 Clicks: ${data.fb.clicks}`;
  } else {
    text += lang === 'es'
      ? `📱 *Facebook:* No publicada`
      : `📱 *Facebook:* Not published`;
  }

  // Paid ad stats
  if (data.ad && data.ad.status !== 'none') {
    const statusLabels: Record<string, { es: string; en: string }> = {
      active: { es: '💰 ACTIVO', en: '💰 ACTIVE' },
      paused: { es: '⏸ PAUSADO', en: '⏸ PAUSED' },
      error: { es: '⚠️ ERROR', en: '⚠️ ERROR' },
      completed: { es: '🏁 COMPLETADO', en: '🏁 COMPLETED' },
      creating: { es: '⏳ CREANDO', en: '⏳ CREATING' },
    };
    const sl = statusLabels[data.ad.status] || { es: data.ad.status, en: data.ad.status };

    text += lang === 'es'
      ? `\n\n💰 *Anuncio Pagado* (${sl.es}):\n💵 Gasto: $${data.ad.spend.toFixed(2)}\n👁️ Impresiones: ${data.ad.impressions.toLocaleString()}\n👥 Alcance: ${data.ad.reach.toLocaleString()}\n🔗 Clicks: ${data.ad.clicks}\n💬 Conversaciones WA: ${data.ad.conversations}${data.ad.costPerConversation > 0 ? `\n💲 Costo/conv: $${data.ad.costPerConversation.toFixed(2)}` : ''}`
      : `\n\n💰 *Paid Ad* (${sl.en}):\n💵 Spend: $${data.ad.spend.toFixed(2)}\n👁️ Impressions: ${data.ad.impressions.toLocaleString()}\n👥 Reach: ${data.ad.reach.toLocaleString()}\n🔗 Clicks: ${data.ad.clicks}\n💬 WA Conversations: ${data.ad.conversations}${data.ad.costPerConversation > 0 ? `\n💲 Cost/conv: $${data.ad.costPerConversation.toFixed(2)}` : ''}`;
  }

  const buttons: WAButton[] = [
    { type: 'reply', reply: { id: 'cmd_campaigns_list', title: lang === 'es' ? 'Mis campanas' : 'My campaigns' } },
    { type: 'reply', reply: { id: `cmd_camp_del_${data.id}`, title: lang === 'es' ? 'Eliminar' : 'Delete' } },
    { type: 'reply', reply: { id: 'cmd_menu', title: 'Menu' } },
  ];

  return { text, buttons };
}

export function campaignSwitchConfirm(
  lang: Lang,
  data: { id: string; name: string; currentObjective: string; newObjective: string }
): { text: string; buttons: WAButton[] } {
  const objLabels: Record<string, { es: string; en: string }> = {
    awareness: { es: '📡 Alcance (Awareness)', en: '📡 Reach (Awareness)' },
    whatsapp_clicks: { es: '💬 WhatsApp Clicks', en: '💬 WhatsApp Clicks' },
  };

  const currentLabel = lang === 'es'
    ? (objLabels[data.currentObjective]?.es || data.currentObjective)
    : (objLabels[data.currentObjective]?.en || data.currentObjective);
  const newLabel = lang === 'es'
    ? (objLabels[data.newObjective]?.es || data.newObjective)
    : (objLabels[data.newObjective]?.en || data.newObjective);

  const text = lang === 'es'
    ? `🎯 *Cambiar objetivo — ${data.name}*\n\nActual: ${currentLabel}\nCambiar a: ${newLabel}\n\n⚠️ Esto eliminara el anuncio actual y creara uno nuevo con el objetivo ${newLabel}.\nEl post organico NO se afecta. El presupuesto se mantiene.\n\nContinuar?`
    : `🎯 *Switch objective — ${data.name}*\n\nCurrent: ${currentLabel}\nSwitch to: ${newLabel}\n\n⚠️ This will delete the current ad and create a new one with ${newLabel} objective.\nThe organic post is NOT affected. Budget remains the same.\n\nContinue?`;

  const buttons: WAButton[] = [
    { type: 'reply', reply: { id: `cmd_camp_sw_yes_${data.id}`, title: lang === 'es' ? 'Si, cambiar' : 'Yes, switch' } },
    { type: 'reply', reply: { id: `cmd_camp_stats_${data.id}`, title: lang === 'es' ? 'Cancelar' : 'Cancel' } },
  ];

  return { text, buttons };
}

// ─────────────────────────────────────────────
// Vehicle FB Delete
// ─────────────────────────────────────────────

export function vehicleFBDeleteConfirm(
  lang: Lang,
  title: string,
  vehicleId: string,
  count: number
): { text: string; buttons: WAButton[] } {
  const text = lang === 'es'
    ? `🗑️ Eliminar ${count} post(s) de Facebook para *${title}*?\n\nEl vehiculo seguira en tu inventario.`
    : `🗑️ Delete ${count} post(s) from Facebook for *${title}*?\n\nThe vehicle will remain in your inventory.`;

  const buttons: WAButton[] = [
    { type: 'reply', reply: { id: `cmd_fb_del_yes_${vehicleId}`, title: lang === 'es' ? 'Si, eliminar' : 'Yes, delete' } },
    { type: 'reply', reply: { id: 'cmd_inventory', title: lang === 'es' ? 'Cancelar' : 'Cancel' } },
  ];

  return { text, buttons };
}

export function vehicleFBDeleted(lang: Lang, title: string, count: number): string {
  return lang === 'es'
    ? `🗑️ ${count} post(s) de Facebook eliminados para *${title}*.`
    : `🗑️ ${count} Facebook post(s) deleted for *${title}*.`;
}

export function vehicleFBDeleteError(lang: Lang, title: string, reason: string): string {
  return lang === 'es'
    ? `❌ No se pudieron eliminar los posts de *${title}*: ${reason}\nSoporte: ${SUPPORT_WA} (${SUPPORT_NAME})`
    : `❌ Couldn't delete posts for *${title}*: ${reason}\nSupport: ${SUPPORT_WA} (${SUPPORT_NAME})`;
}

// ─────────────────────────────────────────────
// DEALS / VENTAS
// ─────────────────────────────────────────────

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

const dealStatusEmoji: Record<string, string> = {
  active: '✅', completed: '🏁', default: '🔴', cancelled: '⚫',
};

export function dealList(
  lang: Lang,
  deals: Array<{ id: string; client_name: string; vehicle_year: number; vehicle_brand: string; vehicle_model: string; sale_price: number; deal_status: string }>,
  total: number,
  page: number,
  hasMore: boolean
): { text: string; buttons: WAButton[] } {
  if (deals.length === 0) {
    const text = lang === 'es'
      ? '📋 No tienes ventas registradas.\n\nEscribe /nueva_venta para registrar una.'
      : '📋 No deals registered yet.\n\nType /new_deal to create one.';
    const buttons: WAButton[] = [
      { type: 'reply', reply: { id: 'cmd_new_deal', title: lang === 'es' ? 'Nueva Venta' : 'New Deal' } },
      { type: 'reply', reply: { id: 'cmd_menu', title: 'Menu' } },
    ];
    return { text, buttons };
  }

  const header = lang === 'es'
    ? `📋 *Mis Ventas* (${total} total)\n`
    : `📋 *My Deals* (${total} total)\n`;

  const offset = (page - 1) * 5;
  const lines = deals.map((d, i) => {
    const emoji = dealStatusEmoji[d.deal_status] || '❓';
    return `${offset + i + 1}. ${emoji} *${d.client_name}* — ${d.vehicle_year} ${d.vehicle_brand} ${d.vehicle_model} | ${formatCurrency(Number(d.sale_price))}`;
  });

  const footer = lang === 'es'
    ? '\n📌 Envía el número para ver detalle'
    : '\n📌 Send the number to see details';

  const text = header + lines.join('\n') + footer;
  const buttons: WAButton[] = [];
  if (hasMore) buttons.push({ type: 'reply', reply: { id: 'cmd_deals_next', title: lang === 'es' ? 'Más ▶' : 'More ▶' } });
  buttons.push({ type: 'reply', reply: { id: 'cmd_new_deal', title: lang === 'es' ? 'Nueva Venta' : 'New Deal' } });
  buttons.push({ type: 'reply', reply: { id: 'cmd_menu', title: 'Menu' } });

  return { text, buttons };
}

export function dealDetail(
  lang: Lang,
  deal: { client_name: string; client_phone: string | null; vehicle_year: number; vehicle_brand: string; vehicle_model: string; vehicle_color: string | null; sale_price: number; down_payment: number; financed_amount: number; financing_type: string; num_installments: number; total_collected: number; outstanding_balance: number; deal_status: string; sale_date: string },
  payments: Array<{ payment_number: number; due_date: string; amount: number; status: string; paid_date: string | null }>
): { text: string; buttons: WAButton[] } {
  const emoji = dealStatusEmoji[deal.deal_status] || '❓';
  const finLabels: Record<string, string> = { cash: lang === 'es' ? 'Efectivo' : 'Cash', in_house: 'In-House', external: lang === 'es' ? 'Externo' : 'External' };

  let text = lang === 'es'
    ? `${emoji} *${deal.client_name}*\n🚗 ${deal.vehicle_year} ${deal.vehicle_brand} ${deal.vehicle_model}${deal.vehicle_color ? ' ' + deal.vehicle_color : ''}\n📅 ${deal.sale_date}\n\n💰 *Precio:* ${formatCurrency(Number(deal.sale_price))}\n💵 *Enganche:* ${formatCurrency(Number(deal.down_payment))}\n🏦 *Financiamiento:* ${finLabels[deal.financing_type] || deal.financing_type}`
    : `${emoji} *${deal.client_name}*\n🚗 ${deal.vehicle_year} ${deal.vehicle_brand} ${deal.vehicle_model}${deal.vehicle_color ? ' ' + deal.vehicle_color : ''}\n📅 ${deal.sale_date}\n\n💰 *Price:* ${formatCurrency(Number(deal.sale_price))}\n💵 *Down Payment:* ${formatCurrency(Number(deal.down_payment))}\n🏦 *Financing:* ${finLabels[deal.financing_type] || deal.financing_type}`;

  if (deal.financing_type !== 'cash' && deal.num_installments > 0) {
    const paidCount = payments.filter(p => p.status === 'paid').length;
    const overdueCount = payments.filter(p => p.status === 'overdue' || (p.status === 'pending' && p.due_date < new Date().toISOString().split('T')[0])).length;

    text += lang === 'es'
      ? `\n📊 *Pagos:* ${paidCount}/${deal.num_installments} | *Cobrado:* ${formatCurrency(Number(deal.total_collected))} | *Saldo:* ${formatCurrency(Number(deal.outstanding_balance))}${overdueCount > 0 ? `\n⚠️ ${overdueCount} pago(s) atrasado(s)` : ''}`
      : `\n📊 *Payments:* ${paidCount}/${deal.num_installments} | *Collected:* ${formatCurrency(Number(deal.total_collected))} | *Balance:* ${formatCurrency(Number(deal.outstanding_balance))}${overdueCount > 0 ? `\n⚠️ ${overdueCount} overdue payment(s)` : ''}`;
  }

  if (deal.client_phone) text += `\n📞 ${deal.client_phone}`;

  const buttons: WAButton[] = [
    { type: 'reply', reply: { id: 'cmd_deals', title: lang === 'es' ? 'Mis Ventas' : 'My Deals' } },
    { type: 'reply', reply: { id: 'cmd_menu', title: 'Menu' } },
  ];

  return { text, buttons };
}

export function dealCreated(
  lang: Lang,
  deal: { client_name: string; vehicle_year: number; vehicle_brand: string; vehicle_model: string; sale_price: number; financing_type: string }
): { text: string; buttons: WAButton[] } {
  const finLabels: Record<string, string> = { cash: lang === 'es' ? 'Efectivo' : 'Cash', in_house: 'In-House', external: lang === 'es' ? 'Externo' : 'External' };

  const text = lang === 'es'
    ? `✅ *Venta registrada!*\n\n👤 ${deal.client_name}\n🚗 ${deal.vehicle_year} ${deal.vehicle_brand} ${deal.vehicle_model}\n💰 ${formatCurrency(Number(deal.sale_price))}\n🏦 ${finLabels[deal.financing_type] || deal.financing_type}`
    : `✅ *Deal created!*\n\n👤 ${deal.client_name}\n🚗 ${deal.vehicle_year} ${deal.vehicle_brand} ${deal.vehicle_model}\n💰 ${formatCurrency(Number(deal.sale_price))}\n🏦 ${finLabels[deal.financing_type] || deal.financing_type}`;

  const buttons: WAButton[] = [
    { type: 'reply', reply: { id: 'cmd_deals', title: lang === 'es' ? 'Ver Ventas' : 'View Deals' } },
    { type: 'reply', reply: { id: 'cmd_new_deal', title: lang === 'es' ? 'Otra Venta' : 'Another Deal' } },
    { type: 'reply', reply: { id: 'cmd_menu', title: 'Menu' } },
  ];

  return { text, buttons };
}

export function createDealStep(
  lang: Lang,
  step: number,
  _data: Record<string, unknown>,
  missing: string[]
): { text: string; buttons: WAButton[] } {
  let text = '';
  const buttons: WAButton[] = [
    { type: 'reply', reply: { id: 'cmd_menu', title: lang === 'es' ? 'Cancelar' : 'Cancel' } },
  ];

  switch (step) {
    case 1:
      text = lang === 'es'
        ? '👤 *Nombre del cliente?*\n\nEjemplo: María García'
        : '👤 *Client name?*\n\nExample: Maria Garcia';
      break;
    case 2:
      text = lang === 'es'
        ? '🚗 *Vehículo?* (Año Marca Modelo)\n\nEjemplo: 2022 Toyota Camry'
        : '🚗 *Vehicle?* (Year Brand Model)\n\nExample: 2022 Toyota Camry';
      break;
    case 3:
      text = lang === 'es'
        ? '💰 *Precio de venta?*\n\nEjemplo: $18,500'
        : '💰 *Sale price?*\n\nExample: $18,500';
      break;
    case 4:
      text = lang === 'es'
        ? '💵 *Enganche?*\n\nEscribe el monto (ej: $3,000) o "efectivo" para venta cash'
        : '💵 *Down payment?*\n\nEnter amount (e.g. $3,000) or "cash" for cash sale';
      break;
    default:
      text = lang === 'es'
        ? `Faltan campos: ${missing.join(', ')}`
        : `Missing fields: ${missing.join(', ')}`;
  }

  return { text, buttons };
}

export function paymentSelectDeal(
  lang: Lang,
  deals: Array<{ id: string; client_name: string; vehicle_year: number; vehicle_brand: string; vehicle_model: string; outstanding_balance: number }>
): { text: string; buttons: WAButton[] } {
  const header = lang === 'es'
    ? '💳 *Registrar Pago*\n\nSelecciona la venta:\n'
    : '💳 *Record Payment*\n\nSelect the deal:\n';

  const lines = deals.map((d, i) =>
    `${i + 1}. ${d.client_name} — ${d.vehicle_year} ${d.vehicle_brand} ${d.vehicle_model} (${formatCurrency(Number(d.outstanding_balance))})`
  );

  return {
    text: header + lines.join('\n'),
    buttons: [{ type: 'reply', reply: { id: 'cmd_menu', title: lang === 'es' ? 'Cancelar' : 'Cancel' } }],
  };
}

export function paymentConfirm(
  lang: Lang,
  deal: { client_name: string; vehicle_year: number; vehicle_brand: string; vehicle_model: string },
  payment: { payment_number: number; due_date: string; amount: number }
): { text: string; buttons: WAButton[] } {
  const text = lang === 'es'
    ? `💳 *Confirmar pago:*\n\n👤 ${deal.client_name}\n🚗 ${deal.vehicle_year} ${deal.vehicle_brand} ${deal.vehicle_model}\n\n📌 Pago #${payment.payment_number}\n📅 Fecha: ${payment.due_date}\n💰 Monto: ${formatCurrency(Number(payment.amount))}\n\n¿Registrar como pagado?`
    : `💳 *Confirm payment:*\n\n👤 ${deal.client_name}\n🚗 ${deal.vehicle_year} ${deal.vehicle_brand} ${deal.vehicle_model}\n\n📌 Payment #${payment.payment_number}\n📅 Due: ${payment.due_date}\n💰 Amount: ${formatCurrency(Number(payment.amount))}\n\nRecord as paid?`;

  const buttons: WAButton[] = [
    { type: 'reply', reply: { id: 'cmd_deal_pay_confirm', title: lang === 'es' ? 'Sí, pagado' : 'Yes, paid' } },
    { type: 'reply', reply: { id: 'cmd_menu', title: lang === 'es' ? 'Cancelar' : 'Cancel' } },
  ];

  return { text, buttons };
}

export function paymentRecorded(
  lang: Lang,
  deal: { client_name: string; total_collected: number; outstanding_balance: number } | null,
  payment: { payment_number: number; amount: number }
): { text: string; buttons: WAButton[] } {
  const text = lang === 'es'
    ? `✅ *Pago #${payment.payment_number} registrado!*\n💰 ${formatCurrency(Number(payment.amount))}${deal ? `\n\n📊 Cobrado: ${formatCurrency(Number(deal.total_collected))} | Saldo: ${formatCurrency(Number(deal.outstanding_balance))}` : ''}`
    : `✅ *Payment #${payment.payment_number} recorded!*\n💰 ${formatCurrency(Number(payment.amount))}${deal ? `\n\n📊 Collected: ${formatCurrency(Number(deal.total_collected))} | Balance: ${formatCurrency(Number(deal.outstanding_balance))}` : ''}`;

  const buttons: WAButton[] = [
    { type: 'reply', reply: { id: 'cmd_deals', title: lang === 'es' ? 'Mis Ventas' : 'My Deals' } },
    { type: 'reply', reply: { id: 'cmd_menu', title: 'Menu' } },
  ];

  return { text, buttons };
}

export function noSellerFound(lang: Lang): string {
  return lang === 'es'
    ? '❌ No se encontró tu cuenta de vendedor. Contacta soporte.'
    : '❌ Seller account not found. Contact support.';
}
