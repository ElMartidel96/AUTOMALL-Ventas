/**
 * Ad Copy Generator — Facebook CTWA Ad Copy
 *
 * Generates optimized Facebook ad copy for Click-to-WhatsApp campaigns.
 * Bilingual (EN/ES) with automotive-specific formatting.
 *
 * Best practices applied:
 * - Lead with one clear benefit
 * - Include social proof signals
 * - Strong CTA with WhatsApp cues
 * - Mobile-first formatting (short lines)
 * - Monthly payments > total price
 * - Location + urgency elements
 */

import type { CaptionLanguage } from './campaign-types';

interface VehicleForAd {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  monthly_payment?: number;
  image_url?: string;
}

interface SellerForAd {
  business_name: string;
  city: string;
  state: string;
  whatsapp: string;
  handle: string;
}

interface AdCopyConfig {
  vehicles: VehicleForAd[];
  seller: SellerForAd;
  campaign_type: string;
  language: CaptionLanguage;
  custom_headline?: string;
  custom_body?: string;
  include_price: boolean;
  include_monthly: boolean;
  include_hashtags: boolean;
}

// ─────────────────────────────────────────────
// Price Formatting
// ─────────────────────────────────────────────

function fmtPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price);
}

function fmtMileage(mi: number): string {
  return new Intl.NumberFormat('en-US').format(mi);
}

function estimateMonthly(price: number, months: number = 60, rate: number = 0.069): number {
  const r = rate / 12;
  const payment = (price * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
  return Math.round(payment);
}

// ─────────────────────────────────────────────
// Carousel Card Copy
// ─────────────────────────────────────────────

export interface CarouselCard {
  headline: string;
  description: string;
  image_url: string;
  vehicle_id: string;
}

function vehicleToCard(v: VehicleForAd, lang: CaptionLanguage, includePrice: boolean, includeMonthly: boolean): CarouselCard {
  const title = `${v.year} ${v.brand} ${v.model}`;
  const monthly = v.monthly_payment || estimateMonthly(v.price);
  const lines: string[] = [];

  if (includeMonthly && v.price > 0) {
    lines.push(lang === 'es' ? `Desde $${monthly}/mes` : `From $${monthly}/mo`);
  } else if (includePrice && v.price > 0) {
    lines.push(fmtPrice(v.price));
  }

  if (v.mileage > 0) {
    lines.push(`${fmtMileage(v.mileage)} ${lang === 'es' ? 'mi' : 'mi'}`);
  }

  return {
    headline: title,
    description: lines.join(' · '),
    image_url: v.image_url || '',
    vehicle_id: v.id,
  };
}

export function generateCarouselCards(config: AdCopyConfig): CarouselCard[] {
  return config.vehicles.map((v) =>
    vehicleToCard(v, config.language, config.include_price, config.include_monthly)
  );
}

// ─────────────────────────────────────────────
// Primary Ad Text (Caption)
// ─────────────────────────────────────────────

export function generateAdCaption(config: AdCopyConfig): string {
  if (config.custom_body) return config.custom_body;

  const { seller, vehicles, language } = config;
  const lines: string[] = [];
  const firstVehicle = vehicles[0];

  if (language === 'en' || language === 'both') {
    lines.push(generateEnCaption(config, seller, firstVehicle, vehicles.length));
  }

  if (language === 'both') {
    lines.push('\n---\n');
  }

  if (language === 'es' || language === 'both') {
    lines.push(generateEsCaption(config, seller, firstVehicle, vehicles.length));
  }

  return lines.join('\n');
}

function generateEnCaption(
  config: AdCopyConfig,
  seller: SellerForAd,
  firstVehicle: VehicleForAd | undefined,
  vehicleCount: number
): string {
  const lines: string[] = [];

  switch (config.campaign_type) {
    case 'inventory_showcase':
      lines.push('🚗 Check Out Our Latest Inventory!');
      lines.push('');
      if (firstVehicle && config.include_price) {
        const monthly = firstVehicle.monthly_payment || estimateMonthly(firstVehicle.price);
        lines.push(`Starting from $${monthly}/month`);
      }
      if (vehicleCount > 1) lines.push(`${vehicleCount} vehicles available`);
      break;

    case 'seasonal_promo':
      lines.push('🔥 LIMITED TIME OFFER!');
      lines.push('');
      lines.push('$0 Down Payment Options Available');
      lines.push('Same-Day Approval');
      break;

    case 'clearance':
      lines.push('⚡ CLEARANCE PRICES — Act Now!');
      lines.push('');
      lines.push('Prices reduced on select vehicles');
      lines.push('Save up to $5,000');
      break;

    case 'financing':
      lines.push('🏦 Drive Today, Pay Over Time!');
      lines.push('');
      lines.push('All Credit Welcome');
      lines.push('Payments from $199/month');
      lines.push('30-Minute Approval');
      break;

    case 'trade_in':
      lines.push('🔄 Your Car Is Worth More Than You Think!');
      lines.push('');
      lines.push('Free Instant Valuation');
      lines.push('Top Dollar for Your Trade');
      break;

    default:
      lines.push('🚗 Quality Vehicles at Great Prices!');
      break;
  }

  lines.push('');
  lines.push(`✅ Inspected & Certified`);
  lines.push(`📍 ${seller.city}, ${seller.state}`);
  lines.push('');
  lines.push('💬 Tap below to chat on WhatsApp!');

  if (config.include_hashtags) {
    lines.push('');
    lines.push('#HoustonCars #CarsForSale #AutosHouston #UsedCars');
  }

  return lines.join('\n');
}

function generateEsCaption(
  config: AdCopyConfig,
  seller: SellerForAd,
  firstVehicle: VehicleForAd | undefined,
  vehicleCount: number
): string {
  const lines: string[] = [];

  switch (config.campaign_type) {
    case 'inventory_showcase':
      lines.push('🚗 ¡Mira Nuestro Inventario!');
      lines.push('');
      if (firstVehicle && config.include_price) {
        const monthly = firstVehicle.monthly_payment || estimateMonthly(firstVehicle.price);
        lines.push(`Desde $${monthly}/mes`);
      }
      if (vehicleCount > 1) lines.push(`${vehicleCount} vehiculos disponibles`);
      break;

    case 'seasonal_promo':
      lines.push('🔥 ¡OFERTA POR TIEMPO LIMITADO!');
      lines.push('');
      lines.push('$0 de Enganche Disponible');
      lines.push('Aprobacion el Mismo Dia');
      break;

    case 'clearance':
      lines.push('⚡ ¡PRECIOS DE LIQUIDACION!');
      lines.push('');
      lines.push('Precios reducidos en vehiculos selectos');
      lines.push('Ahorra hasta $5,000');
      break;

    case 'financing':
      lines.push('🏦 ¡Maneja Hoy, Paga a Tu Ritmo!');
      lines.push('');
      lines.push('Todo Tipo de Credito');
      lines.push('Pagos desde $199/mes');
      lines.push('Aprobacion en 30 Minutos');
      break;

    case 'trade_in':
      lines.push('🔄 ¡Tu Auto Vale Mas de Lo Que Piensas!');
      lines.push('');
      lines.push('Valuacion Instantanea Gratis');
      lines.push('El Mejor Precio por Tu Auto');
      break;

    default:
      lines.push('🚗 ¡Vehiculos de Calidad a Buenos Precios!');
      break;
  }

  lines.push('');
  lines.push(`✅ Inspeccionados y Certificados`);
  lines.push(`📍 ${seller.city}, ${seller.state}`);
  lines.push('');
  lines.push('💬 ¡Toca abajo para chatear en WhatsApp!');

  if (config.include_hashtags) {
    lines.push('');
    lines.push('#AutosHouston #Carros #VentaDeAutos #Houston');
  }

  return lines.join('\n');
}

// ─────────────────────────────────────────────
// Ad Headline (Short)
// ─────────────────────────────────────────────

export function generateAdHeadline(config: AdCopyConfig): { en: string; es: string } {
  if (config.custom_headline) {
    return { en: config.custom_headline, es: config.custom_headline };
  }

  const { seller, campaign_type } = config;

  const headlines: Record<string, { en: string; es: string }> = {
    inventory_showcase: {
      en: `${seller.business_name} — Quality Cars in ${seller.city}`,
      es: `${seller.business_name} — Autos de Calidad en ${seller.city}`,
    },
    seasonal_promo: {
      en: `${seller.business_name} — Special Offer This Week!`,
      es: `${seller.business_name} — ¡Oferta Especial Esta Semana!`,
    },
    clearance: {
      en: `${seller.business_name} — Clearance Event!`,
      es: `${seller.business_name} — ¡Evento de Liquidacion!`,
    },
    financing: {
      en: `Drive Today — Payments from $199/mo`,
      es: `Maneja Hoy — Pagos desde $199/mes`,
    },
    trade_in: {
      en: `Trade In & Upgrade at ${seller.business_name}`,
      es: `Intercambia y Mejora en ${seller.business_name}`,
    },
  };

  return headlines[campaign_type] || {
    en: `${seller.business_name} — Cars in ${seller.city}`,
    es: `${seller.business_name} — Autos en ${seller.city}`,
  };
}

// ─────────────────────────────────────────────
// WhatsApp Pre-filled Message
// ─────────────────────────────────────────────

export function generateWhatsAppMessage(
  vehicleTitle: string | null,
  campaignName: string,
  lang: CaptionLanguage
): string {
  if (lang === 'es') {
    return vehicleTitle
      ? `Hola! Vi el ${vehicleTitle} en su anuncio de Facebook y me gustaria mas informacion.`
      : `Hola! Vi su anuncio de ${campaignName} en Facebook y me gustaria mas informacion.`;
  }

  return vehicleTitle
    ? `Hi! I saw the ${vehicleTitle} on your Facebook ad and I'd like more information.`
    : `Hi! I saw your ${campaignName} ad on Facebook and I'd like more information.`;
}

// ─────────────────────────────────────────────
// UTM Builder
// ─────────────────────────────────────────────

export function buildUTMParams(campaignSlug: string, source: string = 'facebook'): Record<string, string> {
  return {
    utm_source: source,
    utm_medium: 'ctwa',
    utm_campaign: campaignSlug,
  };
}

export function buildWhatsAppURL(
  phone: string,
  message: string,
  utm?: Record<string, string>
): string {
  const cleanPhone = phone.replace(/\D/g, '');
  const encoded = encodeURIComponent(message);
  let url = `https://wa.me/${cleanPhone}?text=${encoded}`;

  // UTM params are tracked on our side (landing page), not passed to WhatsApp
  // but we store them for attribution
  return url;
}

export function buildLandingURL(
  domain: string,
  campaignSlug: string,
  vehicleId?: string,
  utm?: Record<string, string>
): string {
  let url = `https://${domain}/w/${campaignSlug}`;
  const params = new URLSearchParams();

  if (vehicleId) params.set('v', vehicleId);
  if (utm) {
    Object.entries(utm).forEach(([k, v]) => params.set(k, v));
  }

  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}
