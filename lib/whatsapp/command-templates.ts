/**
 * WhatsApp Command Templates — Bilingual EN/ES
 *
 * All user-facing messages for the command router system.
 * Covers: menu, inventory, CRM, stats, Facebook, referrals, profile, support.
 */

import type { WAButton } from './types';

type Lang = 'en' | 'es';

const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || 'autosmall.org';

// ─────────────────────────────────────────────
// Main Menu
// ─────────────────────────────────────────────

export function mainMenu(lang: Lang): { text: string; buttons: WAButton[] } {
  const text = lang === 'es'
    ? `*Autos MALL* — Menu Principal:\n\n📷 *Nuevo vehiculo* — Envia fotos + detalles\n🚗 *Mis autos* — Ver tu inventario\n👥 *Leads* — Gestionar clientes\n📊 *Stats* — Resumen de tu negocio\n\nMas: /referidos, /perfil, /fb, /soporte`
    : `*Autos MALL* — Main Menu:\n\n📷 *New vehicle* — Send photos + details\n🚗 *My vehicles* — View your inventory\n👥 *Leads* — Manage clients\n📊 *Stats* — Business summary\n\nMore: /referrals, /profile, /fb, /support`;

  const buttons: WAButton[] = [
    { type: 'reply', reply: { id: 'cmd_inventory', title: lang === 'es' ? 'Mis autos' : 'My vehicles' } },
    { type: 'reply', reply: { id: 'cmd_leads', title: 'Leads' } },
    { type: 'reply', reply: { id: 'cmd_stats', title: 'Stats' } },
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
    buttons.push({ type: 'reply', reply: { id: `cmd_fb_pub_${v.id}`, title: 'Facebook' } });
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
    ? `No se pudo publicar en Facebook. Verifica tu conexion en tu perfil web.\nSoporte: support@autosmall.org`
    : `Couldn't publish to Facebook. Check your connection in your web profile.\nSupport: support@autosmall.org`;
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
    ? `📞 Soporte Autos MALL:\n\n• Escribe "reiniciar" para limpiar la sesion\n• Ve a ${webUrl} para gestion web\n• Contacta: support@autosmall.org\n\nSi detectaste un error, describe que paso.\nRef: ERR-${ts}`
    : `📞 Autos MALL Support:\n\n• Type "restart" to clear the session\n• Go to ${webUrl} for web management\n• Contact: support@autosmall.org\n\nIf you found a bug, describe what happened.\nRef: ERR-${ts}`;
}

// ─────────────────────────────────────────────
// Error Handling
// ─────────────────────────────────────────────

export function commandError(lang: Lang, action: string): string {
  return lang === 'es'
    ? `Error al ejecutar "${action}". Intenta de nuevo o escribe /soporte.\nSoporte: support@autosmall.org`
    : `Error executing "${action}". Try again or type /support.\nSupport: support@autosmall.org`;
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
