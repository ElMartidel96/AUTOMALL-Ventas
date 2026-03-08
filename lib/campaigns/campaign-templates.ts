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
    description_en: 'Show off your best vehicles to attract buyers',
    description_es: 'Muestra tus mejores vehiculos para atraer compradores',
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
    description_en: 'Limited-time seasonal offers and discounts',
    description_es: 'Ofertas y descuentos por tiempo limitado',
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
    description_en: 'Clear out inventory with aggressive pricing',
    description_es: 'Liquida inventario con precios agresivos',
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
    description_en: 'Highlight financing options and monthly payments',
    description_es: 'Destaca opciones de financiamiento y pagos mensuales',
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
    description_en: 'Encourage trade-ins to expand inventory and attract buyers',
    description_es: 'Incentiva intercambios para expandir inventario y atraer compradores',
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
  description_en: 'Create a fully custom campaign',
  description_es: 'Crea una campana completamente personalizada',
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
