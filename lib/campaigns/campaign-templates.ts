/**
 * Campaign Templates — Predefined configurations for each campaign type
 *
 * 5 named templates + 1 custom. Used by both WhatsApp wizard and web CampaignBuilder.
 */

import type { CampaignType, CampaignTemplate } from './types';

const TEMPLATES: CampaignTemplate[] = [
  {
    type: 'inventory_showcase',
    name_en: 'Inventory Showcase',
    name_es: 'Exhibicion de Inventario',
    emoji: '🚗',
    description_en: 'Visual gallery of your inventory — ideal for VIEWS and brand awareness',
    description_es: 'Galeria de tu inventario — ideal para VISUALIZACIONES y que conozcan tus autos',
    cta_en: 'Browse our inventory — message us on WhatsApp!',
    cta_es: 'Mira nuestro inventario — escribenos por WhatsApp!',
    suggested_daily_budget: { min: 15, max: 25 },
    suggested_duration_days: 14,
    default_headline_en: 'Check out these deals!',
    default_headline_es: 'Mira estas ofertas!',
    color: 'bg-am-blue',
  },
  {
    type: 'seasonal_promo',
    name_en: 'Seasonal Promo',
    name_es: 'Promo de Temporada',
    emoji: '💰',
    description_en: 'Urgency + discount — generates WhatsApp LEADS fast. Most effective for sales',
    description_es: 'Urgencia + descuento — genera LEADS por WhatsApp rapido. La mas efectiva para ventas',
    cta_en: 'Limited time only! Message us NOW on WhatsApp',
    cta_es: 'Oferta por tiempo limitado! Escribenos AHORA por WhatsApp',
    suggested_daily_budget: { min: 20, max: 40 },
    suggested_duration_days: 7,
    default_headline_en: 'Limited-time offers!',
    default_headline_es: 'Ofertas por tiempo limitado!',
    color: 'bg-am-orange',
  },
  {
    type: 'clearance',
    name_en: 'Clearance Sale',
    name_es: 'Liquidacion',
    emoji: '🏷️',
    description_en: 'Liquidation prices — MAXIMUM reach. Ideal to move inventory fast',
    description_es: 'Precios de liquidacion — MAXIMO alcance. Ideal para mover inventario rapido',
    cta_en: "Prices won't last! Message us on WhatsApp today",
    cta_es: 'Estos precios no duran! Escribenos por WhatsApp hoy',
    suggested_daily_budget: { min: 25, max: 50 },
    suggested_duration_days: 10,
    default_headline_en: 'Everything must go!',
    default_headline_es: 'Todo debe irse!',
    color: 'bg-red-600',
  },
  {
    type: 'financing',
    name_en: 'Financing Available',
    name_es: 'Financiamiento Disponible',
    emoji: '🏦',
    description_en: 'Affordable monthly payments — attracts buyers looking for FINANCING options',
    description_es: 'Pagos mensuales accesibles — atrae compradores que buscan FINANCIAMIENTO',
    cta_en: 'Check your monthly payment — message us on WhatsApp',
    cta_es: 'Consulta tu pago mensual — escribenos por WhatsApp',
    suggested_daily_budget: { min: 15, max: 30 },
    suggested_duration_days: 21,
    default_headline_en: 'Easy financing available!',
    default_headline_es: 'Financiamiento facil disponible!',
    color: 'bg-am-green',
  },
  {
    type: 'trade_in',
    name_en: 'Trade-In Welcome',
    name_es: 'Aceptamos Tu Auto',
    emoji: '🔄',
    description_en: 'Attract owners looking to TRADE IN their car. Long-term campaign',
    description_es: 'Atrae duenos que quieren INTERCAMBIAR su auto. Campana a largo plazo',
    cta_en: 'Want to trade in? Message us on WhatsApp for a quote',
    cta_es: 'Quieres intercambiar tu auto? Escribenos por WhatsApp',
    suggested_daily_budget: { min: 10, max: 20 },
    suggested_duration_days: 30,
    default_headline_en: 'We accept trade-ins!',
    default_headline_es: 'Aceptamos tu auto como parte de pago!',
    color: 'bg-purple-600',
  },
];

const CUSTOM_TEMPLATE: CampaignTemplate = {
  type: 'custom',
  name_en: 'Custom Campaign',
  name_es: 'Campana Personalizada',
  emoji: '✏️',
  description_en: 'You design everything: text, vehicles, budget. Full control',
  description_es: 'Tu disenas todo: texto, vehiculos, presupuesto. Control total',
  cta_en: 'Message us on WhatsApp for details!',
  cta_es: 'Escribenos por WhatsApp para mas informacion!',
  suggested_daily_budget: { min: 10, max: 50 },
  suggested_duration_days: 14,
  default_headline_en: 'Great deals available!',
  default_headline_es: 'Grandes ofertas disponibles!',
  color: 'bg-gray-600',
};

export function getTemplate(type: CampaignType): CampaignTemplate {
  return TEMPLATES.find(t => t.type === type) || CUSTOM_TEMPLATE;
}

export function getAllTemplates(): CampaignTemplate[] {
  return [...TEMPLATES, CUSTOM_TEMPLATE];
}

export function getTemplatesForWhatsApp(): CampaignTemplate[] {
  // WhatsApp buttons max 3, so return the 3 most common types
  // The full list is available via "more options"
  return TEMPLATES.slice(0, 3);
}
