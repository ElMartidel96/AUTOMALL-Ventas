/**
 * Meta Automotive Product Feed Generator
 *
 * Generates XML RSS 2.0 feed compliant with Meta Automotive Inventory spec.
 * Used by WhatsApp Business Catalog + Facebook Shop.
 *
 * Spec: https://developers.facebook.com/docs/commerce-platform/catalog/automotive-inventory
 */

import type { MetaVehicleFeedItem, VehicleForFeed, SellerForFeed, VehicleImage } from './types';

const HOUSTON_LAT = 29.7604;
const HOUSTON_LNG = -95.3698;
const DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || 'autosmall.org';

// ─────────────────────────────────────────────
// Map DB vehicle to Meta feed item
// ─────────────────────────────────────────────

function mapCondition(condition: string): 'new' | 'used' | 'refurbished' {
  const lower = condition?.toLowerCase() || '';
  if (lower === 'new') return 'new';
  if (lower === 'cpo' || lower === 'certified') return 'refurbished';
  return 'used';
}

function mapBodyStyle(bodyType: string): string {
  const mapping: Record<string, string> = {
    sedan: 'SEDAN',
    suv: 'SUV',
    truck: 'TRUCK',
    coupe: 'COUPE',
    convertible: 'CONVERTIBLE',
    van: 'VAN',
    wagon: 'WAGON',
    hatchback: 'HATCHBACK',
    minivan: 'MINIVAN',
    crossover: 'CROSSOVER',
  };
  return mapping[bodyType?.toLowerCase()] || 'OTHER';
}

export function vehicleToFeedItem(
  vehicle: VehicleForFeed,
  seller: SellerForFeed,
  images: VehicleImage[]
): MetaVehicleFeedItem {
  const sortedImages = [...images].sort((a, b) => a.position - b.position);
  const primaryImage = sortedImages[0]?.url || '';
  const additionalImages = sortedImages.slice(1).map((img) => img.url);
  const condition = mapCondition(vehicle.condition);

  return {
    vehicle_id: vehicle.id,
    url: `https://${seller.handle}.${DOMAIN}/catalog/${vehicle.id}`,
    title: `${vehicle.year} ${vehicle.brand} ${vehicle.model}`,
    description: vehicle.description || `${vehicle.year} ${vehicle.brand} ${vehicle.model} - ${condition}`,
    image_url: primaryImage,
    additional_image_urls: additionalImages,
    price: vehicle.price || 0,
    currency: 'USD',
    availability: 'in stock',
    condition,
    make: vehicle.brand,
    model: vehicle.model,
    year: vehicle.year,
    mileage_value: vehicle.mileage || 0,
    mileage_unit: 'MI',
    body_style: mapBodyStyle(vehicle.body_type),
    transmission: vehicle.transmission || 'Automatic',
    fuel_type: vehicle.fuel_type || 'Gasoline',
    drivetrain: vehicle.drivetrain || 'FWD',
    exterior_color: vehicle.exterior_color || '',
    vin: vehicle.vin || '',
    state_of_vehicle: condition,
    latitude: HOUSTON_LAT,
    longitude: HOUSTON_LNG,
    address: `${seller.city || 'Houston'}, ${seller.state || 'TX'}`,
    seller_name: seller.business_name,
    seller_phone: seller.phone || undefined,
    seller_whatsapp: seller.whatsapp || undefined,
  };
}

// ─────────────────────────────────────────────
// XML Generator
// ─────────────────────────────────────────────

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function optionalTag(tag: string, value: string | undefined): string {
  if (!value) return '';
  return `      <g:${tag}>${escapeXml(value)}</g:${tag}>\n`;
}

function itemToXml(item: MetaVehicleFeedItem): string {
  const additionalImages = item.additional_image_urls
    .filter((url) => url)
    .map((url) => `      <g:additional_image_link>${escapeXml(url)}</g:additional_image_link>`)
    .join('\n');

  let xml = `    <item>\n`;
  xml += `      <g:id>${escapeXml(item.vehicle_id)}</g:id>\n`;
  xml += `      <g:title>${escapeXml(item.title)}</g:title>\n`;
  xml += `      <g:description>${escapeXml(item.description)}</g:description>\n`;
  xml += `      <g:link>${escapeXml(item.url)}</g:link>\n`;
  xml += `      <g:image_link>${escapeXml(item.image_url)}</g:image_link>\n`;
  if (additionalImages) xml += additionalImages + '\n';
  xml += `      <g:price>${item.price.toFixed(2)} ${item.currency}</g:price>\n`;
  xml += `      <g:availability>${item.availability}</g:availability>\n`;
  xml += `      <g:condition>${item.condition}</g:condition>\n`;
  xml += `      <g:brand>${escapeXml(item.make)}</g:brand>\n`;
  xml += `      <g:vehicle_id>${escapeXml(item.vehicle_id)}</g:vehicle_id>\n`;
  xml += `      <g:make>${escapeXml(item.make)}</g:make>\n`;
  xml += `      <g:model>${escapeXml(item.model)}</g:model>\n`;
  xml += `      <g:year>${item.year}</g:year>\n`;
  xml += `      <g:mileage>${item.mileage_value} ${item.mileage_unit}</g:mileage>\n`;
  xml += `      <g:body_style>${escapeXml(item.body_style)}</g:body_style>\n`;
  xml += optionalTag('transmission', item.transmission);
  xml += optionalTag('fuel_type', item.fuel_type);
  xml += optionalTag('drivetrain', item.drivetrain);
  xml += optionalTag('exterior_color', item.exterior_color);
  xml += optionalTag('vin', item.vin);
  xml += `      <g:state_of_vehicle>${item.state_of_vehicle}</g:state_of_vehicle>\n`;
  xml += `      <g:latitude>${item.latitude}</g:latitude>\n`;
  xml += `      <g:longitude>${item.longitude}</g:longitude>\n`;
  xml += `      <g:address>${escapeXml(item.address)}</g:address>\n`;
  xml += `    </item>`;
  return xml;
}

export function generateFeedXml(
  items: MetaVehicleFeedItem[],
  seller: SellerForFeed
): string {
  const now = new Date().toUTCString();
  const itemsXml = items.map(itemToXml).join('\n');

  const feedUrl = `https://${DOMAIN}/api/feed/meta/${seller.handle}`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(seller.business_name)} - Vehicle Inventory</title>
    <link>https://${seller.handle}.${DOMAIN}</link>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml"/>
    <description>Vehicle inventory for ${escapeXml(seller.business_name)}</description>
    <lastBuildDate>${now}</lastBuildDate>
${itemsXml}
  </channel>
</rss>`;
}
