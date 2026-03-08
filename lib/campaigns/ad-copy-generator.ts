/**
 * Campaign Ad Copy Generator — Bilingual EN/ES
 *
 * Generates Facebook CTWA ad copy with:
 * - Proper bilingual handling (en, es, both)
 * - Facebook character limits (headline ≤70, body ≤2200)
 * - Dynamic hashtags based on seller city
 * - Monthly payment estimates
 * - WhatsApp deep links
 * - Landing page URLs
 */

import type { CampaignType, CaptionLanguage } from './types';
import type { SellerForFeed } from '@/lib/meta/types';
import { getTemplate } from './campaign-templates';

const DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || 'autosmall.org';

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

function generateHashtags(vehicles: VehicleForCopy[], seller: SellerForFeed): string {
  const city = (seller.city || 'Houston').replace(/\s+/g, '');
  const state = (seller.state || 'TX').replace(/\s+/g, '');
  const tags = new Set<string>();

  tags.add(`#Autos${city}`);
  tags.add(`#CarsForSale${city}`);
  tags.add(`#${city}Cars`);
  tags.add(`#UsedCars${city}`);

  for (const v of vehicles.slice(0, 3)) {
    tags.add(`#${v.brand.replace(/\s+/g, '')}${v.model.replace(/\s+/g, '')}`);
    tags.add(`#${v.brand.replace(/\s+/g, '')}`);
  }

  tags.add(`#AutosMALL`);
  tags.add(`#${city}${state}`);

  return [...tags].join(' ');
}

export function buildWhatsAppURL(phone: string, message?: string): string {
  const clean = phone.replace(/\D/g, '');
  const url = `https://wa.me/${clean}`;
  if (message) return `${url}?text=${encodeURIComponent(message)}`;
  return url;
}

export function buildLandingURL(slug: string): string {
  return `https://${DOMAIN}/w/${slug}`;
}

// ─────────────────────────────────────────────
// Vehicle line for ad body
// ─────────────────────────────────────────────

function vehicleLineEN(v: VehicleForCopy): string {
  let line = `${v.year} ${v.brand} ${v.model}`;
  if (v.trim) line += ` ${v.trim}`;
  line += ` — ${formatPrice(v.price)}`;
  // Always show monthly estimate — research shows it boosts engagement significantly
  if (v.price > 0) {
    const monthly = estimateMonthly(v.price);
    line += ` | From $${monthly}/mo*`;
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
  // Always show monthly estimate — research shows it boosts engagement significantly
  if (v.price > 0) {
    const monthly = estimateMonthly(v.price);
    line += ` | Desde $${monthly}/mes*`;
  }
  if (v.mileage && v.mileage > 0) {
    line += ` | ${formatMileage(v.mileage)} mi`;
  }
  return line;
}

// ─────────────────────────────────────────────
// Body generators
// ─────────────────────────────────────────────

function buildBodyEN(opts: AdCopyOptions): string {
  const { campaignType, vehicles, seller, slug } = opts;
  const template = getTemplate(campaignType);
  const lines: string[] = [];

  lines.push(`🚗 ${template.name_en} at ${seller.business_name}`);
  lines.push(`📍 ${seller.city || 'Houston'}, ${seller.state || 'TX'} — Local Dealer`);
  lines.push('');

  for (const v of vehicles) {
    lines.push(`✅ ${vehicleLineEN(v)}`);
  }

  // Always show financing disclaimer when monthly estimates are displayed
  if (vehicles.some(v => v.price > 0)) {
    lines.push('');
    lines.push('*Estimated payment. Subject to credit approval.');
  }

  lines.push('');
  lines.push('💬 Message us on WhatsApp for details!');

  if (seller.whatsapp) {
    lines.push(`📱 ${buildWhatsAppURL(seller.whatsapp)}`);
  }
  if (seller.phone) {
    lines.push(`📞 ${seller.phone}`);
  }

  lines.push(`🔗 ${buildLandingURL(slug)}`);
  lines.push('');
  lines.push(generateHashtags(vehicles, seller));

  return truncate(lines.join('\n'), FB_BODY_MAX);
}

function buildBodyES(opts: AdCopyOptions): string {
  const { campaignType, vehicles, seller, slug } = opts;
  const template = getTemplate(campaignType);
  const lines: string[] = [];

  lines.push(`🚗 ${template.name_es} en ${seller.business_name}`);
  lines.push(`📍 ${seller.city || 'Houston'}, ${seller.state || 'TX'} — Dealer Local`);
  lines.push('');

  for (const v of vehicles) {
    lines.push(`✅ ${vehicleLineES(v)}`);
  }

  // Always show financing disclaimer when monthly estimates are displayed
  if (vehicles.some(v => v.price > 0)) {
    lines.push('');
    lines.push('*Pago estimado. Sujeto a aprobacion de credito.');
  }

  lines.push('');
  lines.push('💬 Escribenos por WhatsApp para mas informacion!');

  if (seller.whatsapp) {
    lines.push(`📱 ${buildWhatsAppURL(seller.whatsapp)}`);
  }
  if (seller.phone) {
    lines.push(`📞 ${seller.phone}`);
  }

  lines.push(`🔗 ${buildLandingURL(slug)}`);
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

/**
 * Build the Facebook caption for a campaign publish.
 * Respects lang preference: 'en' → English only, 'es' → Spanish only, 'both' → bilingual.
 */
export function buildFBCaption(opts: AdCopyOptions): string {
  const copy = generateAdCopy(opts);

  switch (opts.lang) {
    case 'en':
      return copy.body_en;
    case 'es':
      return copy.body_es;
    case 'both':
    default: {
      // Bilingual: English first, then Spanish
      const separator = '\n\n— — — — —\n\n';
      return truncate(copy.body_en + separator + copy.body_es, FB_BODY_MAX);
    }
  }
}
