/**
 * Campaign Ad Copy Generator — Bilingual EN/ES
 *
 * Optimized for Facebook organic reach (March 2026):
 * - NO URLs in body text (links kill organic reach — Meta penalizes them)
 * - Max 3 hashtags (more than 5 drops engagement 68%)
 * - Hook within first 125 chars (Facebook truncates with "See more")
 * - TILA/Reg Z compliant financing disclaimers
 * - Single language per post (bilingual = shorter compact version)
 * - Phone number as plain text (not a link — safe for reach)
 */

import type { CampaignType, CaptionLanguage } from './types';
import type { SellerForFeed } from '@/lib/meta/types';
import { getTemplate } from './campaign-templates';

const FB_HEADLINE_MAX = 70;
const FB_BODY_MAX = 2200;

// ─────────────────────────────────────────────
// Vehicle info for copy generation
// ─────────────────────────────────────────────

export interface VehicleForCopy {
  id: string;
  year: number;
  brand: string;
  model: string;
  trim?: string | null;
  price: number;
  mileage?: number | null;
  condition?: string | null;
  image_url?: string | null;
}

interface AdCopyOptions {
  campaignType: CampaignType;
  vehicles: VehicleForCopy[];
  seller: SellerForFeed;
  lang: CaptionLanguage;
  slug: string;
  customHeadlineEn?: string | null;
  customHeadlineEs?: string | null;
}

interface GeneratedCopy {
  headline_en: string;
  headline_es: string;
  body_en: string;
  body_es: string;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price);
}

function formatMileage(mileage: number): string {
  return new Intl.NumberFormat('en-US').format(mileage);
}

export function estimateMonthly(price: number, rate = 0.069, termMonths = 60): number {
  if (price <= 0 || termMonths <= 0) return 0;
  if (rate <= 0) return Math.round(price / termMonths);
  const monthlyRate = rate / 12;
  const payment = price * (monthlyRate * Math.pow(1 + monthlyRate, termMonths))
    / (Math.pow(1 + monthlyRate, termMonths) - 1);
  return Math.round(payment);
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 3) + '...';
}

/**
 * Generate max 3 hashtags — research shows more than 3 hurts engagement.
 * Priority: #AutosMALL (brand) + #BrandModel (specific) + #CityState (local)
 */
function generateHashtags(vehicles: VehicleForCopy[], seller: SellerForFeed): string {
  const city = (seller.city || 'Houston').replace(/\s+/g, '');
  const state = (seller.state || 'TX').replace(/\s+/g, '');
  const tags: string[] = [];

  tags.push('#AutosMALL');

  if (vehicles.length > 0) {
    const v = vehicles[0];
    tags.push(`#${v.brand.replace(/\s+/g, '')}${v.model.replace(/\s+/g, '')}`);
  }

  tags.push(`#${city}${state}`);

  return tags.join(' ');
}

export function buildWhatsAppURL(phone: string, message?: string): string {
  const clean = phone.replace(/\D/g, '');
  const url = `https://wa.me/${clean}`;
  if (message) return `${url}?text=${encodeURIComponent(message)}`;
  return url;
}

export function buildLandingURL(slug: string): string {
  const domain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'autosmall.org';
  return `https://${domain}/w/${slug}`;
}

// ─────────────────────────────────────────────
// Vehicle line for ad body
// ─────────────────────────────────────────────

function vehicleLineEN(v: VehicleForCopy): string {
  let line = `${v.year} ${v.brand} ${v.model}`;
  if (v.trim) line += ` ${v.trim}`;
  line += ` — ${formatPrice(v.price)}`;
  if (v.price > 0) {
    const monthly = estimateMonthly(v.price);
    line += ` | ~$${monthly}/mo*`;
  }
  if (v.mileage && v.mileage > 0) {
    line += ` | ${formatMileage(v.mileage)} mi`;
  }
  return line;
}

function vehicleLineES(v: VehicleForCopy): string {
  let line = `${v.year} ${v.brand} ${v.model}`;
  if (v.trim) line += ` ${v.trim}`;
  line += ` — ${formatPrice(v.price)}`;
  if (v.price > 0) {
    const monthly = estimateMonthly(v.price);
    line += ` | ~$${monthly}/mes*`;
  }
  if (v.mileage && v.mileage > 0) {
    line += ` | ${formatMileage(v.mileage)} mi`;
  }
  return line;
}

// ─────────────────────────────────────────────
// TILA/Reg Z compliant financing disclaimer
// ─────────────────────────────────────────────

const DISCLAIMER_EN = '*Est. payment: $0 down, 60 mo, 6.9% APR. Subject to credit approval (OAC). Taxes & fees not included.';
const DISCLAIMER_ES = '*Pago est.: $0 enganche, 60 meses, 6.9% APR. Sujeto a aprobacion de credito (OAC). Impuestos no incluidos.';

// ─────────────────────────────────────────────
// Body generators — optimized for organic reach
//
// Structure (within 125 chars before "See more"):
// Line 1: CTA hook (template-specific, attention-grabbing)
// Line 2: Business name + location
// --- below the fold ---
// Vehicle list
// Disclaimer
// Phone number (plain text, not a link)
// Hashtags (max 3)
//
// NO wa.me links — they kill organic reach
// NO website URLs — same penalty
// Phone and WhatsApp are discoverable via the page CTA button
// ─────────────────────────────────────────────

function buildBodyEN(opts: AdCopyOptions): string {
  const { campaignType, vehicles, seller } = opts;
  const template = getTemplate(campaignType);
  const lines: string[] = [];

  // Hook — must be within first 125 chars (before "See more")
  lines.push(`${template.cta_en || 'Great deals available!'}`);
  lines.push(`${seller.business_name} — ${seller.city || 'Houston'}, ${seller.state || 'TX'}`);
  lines.push('');

  // Vehicle list
  for (const v of vehicles) {
    lines.push(`${vehicleLineEN(v)}`);
  }

  // TILA/Reg Z disclaimer
  if (vehicles.some(v => v.price > 0)) {
    lines.push('');
    lines.push(DISCLAIMER_EN);
  }

  // Contact — plain text only, NO links
  lines.push('');
  if (seller.phone) {
    lines.push(`Call or text: ${seller.phone}`);
  }

  // Address if available
  if (seller.address) {
    lines.push(`${seller.address}`);
  }

  // Hashtags — max 3
  lines.push('');
  lines.push(generateHashtags(vehicles, seller));

  return truncate(lines.join('\n'), FB_BODY_MAX);
}

function buildBodyES(opts: AdCopyOptions): string {
  const { campaignType, vehicles, seller } = opts;
  const template = getTemplate(campaignType);
  const lines: string[] = [];

  // Hook — must be within first 125 chars
  lines.push(`${template.cta_es || 'Grandes ofertas disponibles!'}`);
  lines.push(`${seller.business_name} — ${seller.city || 'Houston'}, ${seller.state || 'TX'}`);
  lines.push('');

  // Vehicle list
  for (const v of vehicles) {
    lines.push(`${vehicleLineES(v)}`);
  }

  // TILA/Reg Z disclaimer
  if (vehicles.some(v => v.price > 0)) {
    lines.push('');
    lines.push(DISCLAIMER_ES);
  }

  // Contact — plain text only, NO links
  lines.push('');
  if (seller.phone) {
    lines.push(`Llama o escribe: ${seller.phone}`);
  }

  // Address if available
  if (seller.address) {
    lines.push(`${seller.address}`);
  }

  // Hashtags — max 3
  lines.push('');
  lines.push(generateHashtags(vehicles, seller));

  return truncate(lines.join('\n'), FB_BODY_MAX);
}

/**
 * Bilingual body — compact version, NOT duplicated content.
 * Research: mixing full EN+ES in one post confuses the algorithm.
 * Solution: vehicle info is language-neutral (numbers, brands), add minimal bilingual labels.
 */
function buildBodyBilingual(opts: AdCopyOptions): string {
  const { campaignType, vehicles, seller } = opts;
  const template = getTemplate(campaignType);
  const lines: string[] = [];

  // Bilingual hook
  const ctaEn = template.cta_en || 'Great deals!';
  const ctaEs = template.cta_es || 'Grandes ofertas!';
  lines.push(`${ctaEn}`);
  lines.push(`${ctaEs}`);
  lines.push(`${seller.business_name} — ${seller.city || 'Houston'}, ${seller.state || 'TX'}`);
  lines.push('');

  // Vehicle list — numbers are universal
  for (const v of vehicles) {
    lines.push(`${vehicleLineEN(v)}`);
  }

  // Bilingual disclaimer
  if (vehicles.some(v => v.price > 0)) {
    lines.push('');
    lines.push(DISCLAIMER_EN);
  }

  // Contact
  lines.push('');
  if (seller.phone) {
    lines.push(`Call / Llama: ${seller.phone}`);
  }

  if (seller.address) {
    lines.push(`${seller.address}`);
  }

  lines.push('');
  lines.push(generateHashtags(vehicles, seller));

  return truncate(lines.join('\n'), FB_BODY_MAX);
}

// ─────────────────────────────────────────────
// Main generator
// ─────────────────────────────────────────────

export function generateAdCopy(opts: AdCopyOptions): GeneratedCopy {
  const template = getTemplate(opts.campaignType);

  const headline_en = truncate(
    opts.customHeadlineEn || template.default_headline_en,
    FB_HEADLINE_MAX,
  );
  const headline_es = truncate(
    opts.customHeadlineEs || template.default_headline_es,
    FB_HEADLINE_MAX,
  );

  const body_en = buildBodyEN(opts);
  const body_es = buildBodyES(opts);

  return { headline_en, headline_es, body_en, body_es };
}

// ─────────────────────────────────────────────
// Paid Link Ad Copy — optimized for CTA clicks
//
// Different from organic: shorter, more urgent,
// includes wa.me link + CTA button.
// ─────────────────────────────────────────────

export interface PaidAdCopy {
  message: string;
  headline: string;
  description: string;
  whatsappUrl: string;
}

interface PaidAdCopyOptions {
  campaignType: CampaignType;
  vehicles: VehicleForCopy[];
  seller: SellerForFeed;
  lang: CaptionLanguage;
  discountAmount?: number;
}

export function generatePaidAdCopy(opts: PaidAdCopyOptions): PaidAdCopy {
  const { vehicles, seller, lang, discountAmount } = opts;
  const discount = discountAmount || 1500;
  const discountStr = formatPrice(discount);
  const phone = seller.whatsapp || seller.phone || '';
  const businessName = seller.business_name || 'Autos MALL LLC';
  const city = seller.city || 'Houston';
  const state = seller.state || 'TX';

  // Build WhatsApp prefill message (Spanish default for Houston market)
  let prefillMsg: string;
  if (vehicles.length > 0) {
    const v = vehicles[0];
    if (lang === 'en') {
      prefillMsg = `Hi! I saw your ad on Facebook. I'm interested in the ${v.year} ${v.brand} ${v.model}. Is the ${discountStr} discount still available?`;
    } else {
      prefillMsg = `Hola! Vi su anuncio en Facebook. Me interesa el ${v.year} ${v.brand} ${v.model}. Aun esta disponible el descuento de ${discountStr}?`;
    }
  } else {
    if (lang === 'en') {
      prefillMsg = `Hi! I saw your ad on Facebook. Is the ${discountStr} discount still available?`;
    } else {
      prefillMsg = `Hola! Vi su anuncio en Facebook. Aun esta disponible el descuento de ${discountStr}?`;
    }
  }

  const whatsappUrl = buildWhatsAppURL(phone, prefillMsg);

  // Truncate prefill if URL is too long (wa.me limit ~1500 chars)
  const finalUrl = whatsappUrl.length > 1500
    ? buildWhatsAppURL(phone, lang === 'en'
      ? `Hi! I saw your ad on Facebook. Is the ${discountStr} discount available?`
      : `Hola! Vi su anuncio en Facebook. Tiene el descuento de ${discountStr}?`)
    : whatsappUrl;

  // Build message (text above the image)
  const lines: string[] = [];

  if (lang === 'both') {
    lines.push(`🔥 Limited time only! Message us NOW on WhatsApp`);
    lines.push(`🔥 Oferta por tiempo limitado! Escribenos AHORA por WhatsApp`);
  } else if (lang === 'en') {
    lines.push(`🔥 Limited time only! Message us NOW on WhatsApp`);
  } else {
    lines.push(`🔥 Oferta por tiempo limitado! Escribenos AHORA por WhatsApp`);
  }

  lines.push(`${businessName} — ${city}, ${state}`);
  lines.push('');

  // Vehicle list
  for (const v of vehicles) {
    lines.push(`${v.year} ${v.brand} ${v.model} — ${formatPrice(v.price)}`);
  }

  lines.push('');

  if (lang === 'both') {
    lines.push(`${discountStr} OFF all vehicles! Limited spots / Cupos limitados`);
    lines.push(`👇 Tap below to message us / Toca abajo para escribirnos`);
  } else if (lang === 'en') {
    lines.push(`${discountStr} OFF all vehicles! Limited spots available`);
    lines.push(`👇 Tap below to message us on WhatsApp`);
  } else {
    lines.push(`${discountStr} de descuento! Cupos limitados`);
    lines.push(`👇 Toca abajo para escribirnos por WhatsApp`);
  }

  const message = truncate(lines.join('\n'), FB_BODY_MAX);

  // Headline (bold below image — max ~40 chars)
  const headline = truncate(`${discountStr} OFF — Message Us!`, 40);

  // Description (below headline)
  const description = truncate(`${businessName} — ${city}, ${state}`, 30);

  return { message, headline, description, whatsappUrl: finalUrl };
}

/**
 * Build the Facebook caption for a campaign publish.
 * Respects lang preference: 'en' | 'es' | 'both'.
 * 'both' generates a compact bilingual version (NOT duplicated content).
 */
export function buildFBCaption(opts: AdCopyOptions): string {
  const copy = generateAdCopy(opts);

  switch (opts.lang) {
    case 'en':
      return copy.body_en;
    case 'es':
      return copy.body_es;
    case 'both':
    default:
      return buildBodyBilingual(opts);
  }
}
