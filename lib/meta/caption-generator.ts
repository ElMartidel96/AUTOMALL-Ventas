/**
 * Facebook Post Caption Generator
 *
 * Generates bilingual (EN/ES) captions with specs, emojis, and hashtags.
 */

import type { VehicleForFeed, SellerForFeed } from './types';
import type { MetaConnection } from './types';

const DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || 'autosmall.org';

interface CaptionOptions {
  postType: 'new_listing' | 'sold';
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

function generateHashtags(vehicle: VehicleForFeed): string {
  const tags = [
    `#${vehicle.brand.replace(/\s+/g, '')}${vehicle.model.replace(/\s+/g, '')}`,
    `#${vehicle.brand.replace(/\s+/g, '')}`,
    '#AutosHouston',
    '#CarsForSale',
    '#HoustonCars',
    `#${vehicle.brand.replace(/\s+/g, '')}ForSale`,
    `#${vehicle.year}${vehicle.brand.replace(/\s+/g, '')}`,
  ];
  return tags.join(' ');
}

function buildEnglishCaption(opts: CaptionOptions): string {
  const { postType, vehicle, seller, connection } = opts;
  const lines: string[] = [];

  if (postType === 'new_listing') {
    lines.push('🚗 NEW LISTING');
  } else {
    lines.push('🎉 SOLD!');
  }

  lines.push('');
  lines.push(`${vehicle.year} ${vehicle.brand} ${vehicle.model}`);
  lines.push(`📍 ${seller.city || 'Houston'}, ${seller.state || 'TX'}`);

  if (connection.include_price && vehicle.price > 0) {
    if (postType === 'sold') {
      lines.push(`💰 Was ${formatPrice(vehicle.price)}`);
    } else {
      lines.push(`💰 ${formatPrice(vehicle.price)}`);
    }
  }

  if (vehicle.mileage > 0) {
    lines.push(`📏 ${formatMileage(vehicle.mileage)} miles`);
  }

  const specs = [vehicle.transmission, vehicle.fuel_type, vehicle.drivetrain].filter(Boolean).join(' | ');
  if (specs) {
    lines.push(`⚙️ ${specs}`);
  }

  if (postType === 'new_listing') {
    lines.push('');
    if (seller.phone) lines.push(`📞 ${seller.phone}`);
    if (seller.whatsapp) lines.push(`💬 wa.me/${seller.whatsapp.replace(/\D/g, '')}`);
    lines.push(`🌐 ${seller.handle}.${DOMAIN}/catalog/${vehicle.id}`);
  }

  if (connection.include_hashtags) {
    lines.push('');
    lines.push(generateHashtags(vehicle));
  }

  return lines.join('\n');
}

function buildSpanishCaption(opts: CaptionOptions): string {
  const { postType, vehicle, seller, connection } = opts;
  const lines: string[] = [];

  if (postType === 'new_listing') {
    lines.push('🚗 NUEVO EN INVENTARIO');
  } else {
    lines.push('🎉 ¡VENDIDO!');
  }

  lines.push('');
  lines.push(`${vehicle.year} ${vehicle.brand} ${vehicle.model}`);
  lines.push(`📍 ${seller.city || 'Houston'}, ${seller.state || 'TX'}`);

  if (connection.include_price && vehicle.price > 0) {
    if (postType === 'sold') {
      lines.push(`💰 Precio: ${formatPrice(vehicle.price)}`);
    } else {
      lines.push(`💰 ${formatPrice(vehicle.price)}`);
    }
  }

  if (vehicle.mileage > 0) {
    lines.push(`📏 ${formatMileage(vehicle.mileage)} millas`);
  }

  const specs = [vehicle.transmission, vehicle.fuel_type, vehicle.drivetrain].filter(Boolean).join(' | ');
  if (specs) {
    lines.push(`⚙️ ${specs}`);
  }

  if (postType === 'new_listing') {
    lines.push('');
    if (seller.phone) lines.push(`📞 ${seller.phone}`);
    if (seller.whatsapp) lines.push(`💬 wa.me/${seller.whatsapp.replace(/\D/g, '')}`);
    lines.push(`🌐 ${seller.handle}.${DOMAIN}/catalog/${vehicle.id}`);
  }

  if (connection.include_hashtags) {
    lines.push('');
    lines.push(generateHashtags(vehicle));
  }

  return lines.join('\n');
}

function buildBilingualCaption(opts: CaptionOptions): string {
  const { postType, vehicle, seller, connection } = opts;
  const lines: string[] = [];

  if (postType === 'new_listing') {
    lines.push('🚗 NEW | NUEVO');
  } else {
    lines.push('🎉 SOLD | ¡VENDIDO!');
  }

  lines.push('');
  lines.push(`${vehicle.year} ${vehicle.brand} ${vehicle.model}`);
  lines.push(`📍 ${seller.city || 'Houston'}, ${seller.state || 'TX'}`);

  if (connection.include_price && vehicle.price > 0) {
    lines.push(`💰 ${formatPrice(vehicle.price)}`);
  }

  if (vehicle.mileage > 0) {
    lines.push(`📏 ${formatMileage(vehicle.mileage)} miles / millas`);
  }

  const specs = [vehicle.transmission, vehicle.fuel_type, vehicle.drivetrain].filter(Boolean).join(' | ');
  if (specs) {
    lines.push(`⚙️ ${specs}`);
  }

  if (postType === 'new_listing') {
    lines.push('');
    if (seller.phone) lines.push(`📞 ${seller.phone}`);
    if (seller.whatsapp) lines.push(`💬 wa.me/${seller.whatsapp.replace(/\D/g, '')}`);
    lines.push(`🌐 ${seller.handle}.${DOMAIN}/catalog/${vehicle.id}`);
  }

  if (connection.include_hashtags) {
    lines.push('');
    lines.push(generateHashtags(vehicle));
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
