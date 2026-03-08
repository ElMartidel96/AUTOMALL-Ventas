/**
 * Facebook Post Caption Generator
 *
 * Generates bilingual (EN/ES) captions for individual vehicle posts.
 *
 * Optimized for Facebook organic reach (March 2026):
 * - NO URLs in body text (wa.me links and website URLs kill organic reach)
 * - Max 3 hashtags (more than 5 drops engagement 68%)
 * - Hook within first 125 chars (Facebook truncates with "See more")
 * - Phone number as plain text (safe for reach, not a clickable link)
 * - Contact info discoverable via Facebook page CTA button
 */

import type { VehicleForFeed, SellerForFeed } from './types';
import type { MetaConnection } from './types';

interface CaptionOptions {
  postType: 'new_listing' | 'sold' | 'manual' | 'repost';
  vehicle: VehicleForFeed;
  seller: SellerForFeed;
  connection: MetaConnection;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price);
}

function formatMileage(mileage: number): string {
  return new Intl.NumberFormat('en-US').format(mileage);
}

/**
 * Max 3 hashtags — research shows more hurts engagement.
 * Priority: #AutosMALL (brand) + #BrandModel (specific) + #CityState (local)
 */
function generateHashtags(vehicle: VehicleForFeed, seller: SellerForFeed): string {
  const city = (seller.city || 'Houston').replace(/\s+/g, '');
  const state = (seller.state || 'TX').replace(/\s+/g, '');
  const tags: string[] = [];

  tags.push('#AutosMALL');
  tags.push(`#${vehicle.brand.replace(/\s+/g, '')}${vehicle.model.replace(/\s+/g, '')}`);
  tags.push(`#${city}${state}`);

  return tags.join(' ');
}

function buildEnglishCaption(opts: CaptionOptions): string {
  const { postType, vehicle, seller, connection } = opts;
  const lines: string[] = [];

  // Hook — within first 125 chars
  if (postType === 'sold') {
    lines.push(`SOLD! ${vehicle.year} ${vehicle.brand} ${vehicle.model}`);
  } else {
    lines.push(`${vehicle.year} ${vehicle.brand} ${vehicle.model} — Now Available!`);
  }

  lines.push(`${seller.business_name} | ${seller.city || 'Houston'}, ${seller.state || 'TX'}`);
  lines.push('');

  if (connection.include_price && vehicle.price > 0) {
    if (postType === 'sold') {
      lines.push(`Was ${formatPrice(vehicle.price)}`);
    } else {
      lines.push(`${formatPrice(vehicle.price)}`);
    }
  }

  if (vehicle.mileage > 0) {
    lines.push(`${formatMileage(vehicle.mileage)} miles`);
  }

  const specs = [vehicle.transmission, vehicle.fuel_type, vehicle.drivetrain].filter(Boolean).join(' | ');
  if (specs) {
    lines.push(specs);
  }

  // Contact — plain text, NO links
  if (postType !== 'sold') {
    lines.push('');
    if (seller.phone) lines.push(`Call or text: ${seller.phone}`);
    if (seller.address) lines.push(seller.address);
  }

  if (connection.include_hashtags) {
    lines.push('');
    lines.push(generateHashtags(vehicle, seller));
  }

  return lines.join('\n');
}

function buildSpanishCaption(opts: CaptionOptions): string {
  const { postType, vehicle, seller, connection } = opts;
  const lines: string[] = [];

  // Hook — within first 125 chars
  if (postType === 'sold') {
    lines.push(`VENDIDO! ${vehicle.year} ${vehicle.brand} ${vehicle.model}`);
  } else {
    lines.push(`${vehicle.year} ${vehicle.brand} ${vehicle.model} — Disponible!`);
  }

  lines.push(`${seller.business_name} | ${seller.city || 'Houston'}, ${seller.state || 'TX'}`);
  lines.push('');

  if (connection.include_price && vehicle.price > 0) {
    if (postType === 'sold') {
      lines.push(`Precio: ${formatPrice(vehicle.price)}`);
    } else {
      lines.push(`${formatPrice(vehicle.price)}`);
    }
  }

  if (vehicle.mileage > 0) {
    lines.push(`${formatMileage(vehicle.mileage)} millas`);
  }

  const specs = [vehicle.transmission, vehicle.fuel_type, vehicle.drivetrain].filter(Boolean).join(' | ');
  if (specs) {
    lines.push(specs);
  }

  // Contact — plain text, NO links
  if (postType !== 'sold') {
    lines.push('');
    if (seller.phone) lines.push(`Llama o escribe: ${seller.phone}`);
    if (seller.address) lines.push(seller.address);
  }

  if (connection.include_hashtags) {
    lines.push('');
    lines.push(generateHashtags(vehicle, seller));
  }

  return lines.join('\n');
}

function buildBilingualCaption(opts: CaptionOptions): string {
  const { postType, vehicle, seller, connection } = opts;
  const lines: string[] = [];

  // Bilingual hook — compact, not duplicated
  if (postType === 'sold') {
    lines.push(`SOLD / VENDIDO! ${vehicle.year} ${vehicle.brand} ${vehicle.model}`);
  } else {
    lines.push(`${vehicle.year} ${vehicle.brand} ${vehicle.model} — Available / Disponible!`);
  }

  lines.push(`${seller.business_name} | ${seller.city || 'Houston'}, ${seller.state || 'TX'}`);
  lines.push('');

  if (connection.include_price && vehicle.price > 0) {
    lines.push(`${formatPrice(vehicle.price)}`);
  }

  if (vehicle.mileage > 0) {
    lines.push(`${formatMileage(vehicle.mileage)} miles / millas`);
  }

  const specs = [vehicle.transmission, vehicle.fuel_type, vehicle.drivetrain].filter(Boolean).join(' | ');
  if (specs) {
    lines.push(specs);
  }

  // Contact — plain text, NO links
  if (postType !== 'sold') {
    lines.push('');
    if (seller.phone) lines.push(`Call / Llama: ${seller.phone}`);
    if (seller.address) lines.push(seller.address);
  }

  if (connection.include_hashtags) {
    lines.push('');
    lines.push(generateHashtags(vehicle, seller));
  }

  return lines.join('\n');
}

export function generateCaption(opts: CaptionOptions): string {
  switch (opts.connection.caption_language) {
    case 'en':
      return buildEnglishCaption(opts);
    case 'es':
      return buildSpanishCaption(opts);
    case 'both':
    default:
      return buildBilingualCaption(opts);
  }
}
