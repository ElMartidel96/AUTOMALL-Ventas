/**
 * Campaign Templates — Pre-built CTWA Campaign Configurations
 *
 * Ready-to-deploy Facebook Click-to-WhatsApp campaign templates
 * optimized for independent auto dealers in Houston, TX.
 *
 * Based on 2025-2026 Meta best practices:
 * - Engagement objective → optimize for Conversations
 * - Bilingual EN/ES for Houston market
 * - Mobile-first creative with strong CTAs
 * - WhatsApp icebreakers for instant qualification
 * - Free 72-hour conversation window leverage
 */

import type { CampaignTemplate } from './campaign-types';

export const CAMPAIGN_TEMPLATES: CampaignTemplate[] = [
  // ─────────────────────────────────────────
  // 1. Inventory Showcase (Most Popular)
  // ─────────────────────────────────────────
  {
    id: 'inventory_showcase',
    type: 'inventory_showcase',
    name_en: 'Inventory Showcase',
    name_es: 'Vitrina de Inventario',
    description_en: 'Show your best vehicles to active car buyers. Carousel format highlights multiple cars with prices and key specs.',
    description_es: 'Muestra tus mejores vehiculos a compradores activos. Formato carrusel destaca multiples autos con precios y specs.',
    icon: 'Car',
    color: 'am-blue',
    headline_en: 'Quality Pre-Owned Vehicles in Houston',
    headline_es: 'Vehiculos Seminuevos de Calidad en Houston',
    body_en: '🚗 Browse our latest inventory!\n\n✅ Inspected & Certified\n💰 Financing Available\n📍 Houston, TX\n\nTap "Chat on WhatsApp" to get pricing and schedule your test drive today!',
    body_es: '🚗 ¡Explora nuestro inventario!\n\n✅ Inspeccionados y Certificados\n💰 Financiamiento Disponible\n📍 Houston, TX\n\n¡Toca "Chat en WhatsApp" para precios y agendar tu test drive hoy!',
    cta_text: 'Chat on WhatsApp',
    welcome_message_en: '👋 Welcome! Thanks for your interest in our vehicles. I\'m here to help you find your perfect car. What are you looking for?',
    welcome_message_es: '👋 ¡Bienvenido! Gracias por tu interes en nuestros vehiculos. Estoy aqui para ayudarte a encontrar tu auto perfecto. ¿Que buscas?',
    icebreakers_en: [
      '🚗 I want to see available vehicles',
      '💰 I need financing information',
      '🔑 I want to schedule a test drive',
      '🔄 I have a car for trade-in',
    ],
    icebreakers_es: [
      '🚗 Quiero ver vehiculos disponibles',
      '💰 Necesito informacion de financiamiento',
      '🔑 Quiero agendar un test drive',
      '🔄 Tengo un auto para intercambio',
    ],
    recommended_format: 'carousel',
    recommended_budget_min: 15,
    recommended_budget_max: 50,
    recommended_duration_days: 14,
    tips_en: [
      'Use real photos of your vehicles, never stock images',
      'Include price or monthly payment in each carousel card',
      'Show 4-6 of your best vehicles with diverse price points',
      'Best times to run: Tuesday-Thursday, 6PM-9PM',
      'Target: 25-mile radius, in-market auto buyers',
    ],
    tips_es: [
      'Usa fotos reales de tus vehiculos, nunca imagenes de stock',
      'Incluye precio o pago mensual en cada tarjeta del carrusel',
      'Muestra 4-6 de tus mejores vehiculos con precios variados',
      'Mejores horarios: Martes-Jueves, 6PM-9PM',
      'Target: Radio de 25 millas, compradores activos de autos',
    ],
  },

  // ─────────────────────────────────────────
  // 2. Seasonal Promo
  // ─────────────────────────────────────────
  {
    id: 'seasonal_promo',
    type: 'seasonal_promo',
    name_en: 'Seasonal Promotion',
    name_es: 'Promocion de Temporada',
    description_en: 'Time-limited offers that create urgency. Perfect for end-of-month pushes, holidays, or tax season.',
    description_es: 'Ofertas por tiempo limitado que crean urgencia. Perfecto para fin de mes, feriados o temporada de taxes.',
    icon: 'Calendar',
    color: 'am-orange',
    headline_en: 'Limited Time: Houston\'s Best Auto Deals!',
    headline_es: '¡Tiempo Limitado: Las Mejores Ofertas de Autos en Houston!',
    body_en: '🔥 THIS WEEK ONLY!\n\n💵 $0 Down Payment Options\n📉 Lowest Payments in Houston\n✅ Same-Day Approval\n⏰ Offer ends Sunday!\n\nDon\'t miss out — chat with us now!',
    body_es: '🔥 ¡SOLO ESTA SEMANA!\n\n💵 Opciones de $0 de Enganche\n📉 Los Pagos Mas Bajos de Houston\n✅ Aprobacion el Mismo Dia\n⏰ ¡La oferta termina el domingo!\n\n¡No te lo pierdas — chatea con nosotros ahora!',
    cta_text: 'Get This Deal',
    welcome_message_en: '🔥 You\'re just in time! Our special promotion is still available. Let me help you take advantage of these deals before they\'re gone!',
    welcome_message_es: '🔥 ¡Llegaste a tiempo! Nuestra promocion especial aun esta disponible. ¡Dejame ayudarte a aprovechar estas ofertas antes de que se acaben!',
    icebreakers_en: [
      '💰 Tell me about the $0 down deal',
      '📋 What vehicles are on special?',
      '🏦 Check if I qualify for financing',
      '📅 When does the promotion end?',
    ],
    icebreakers_es: [
      '💰 Cuentame sobre la oferta de $0 enganche',
      '📋 ¿Que vehiculos estan en oferta?',
      '🏦 Verificar si califico para financiamiento',
      '📅 ¿Cuando termina la promocion?',
    ],
    recommended_format: 'single_image',
    recommended_budget_min: 25,
    recommended_budget_max: 75,
    recommended_duration_days: 7,
    tips_en: [
      'Create genuine urgency with real deadlines',
      'Use bold colors and large text in creative',
      'Include specific dollar amounts ($0 Down, From $199/mo)',
      'Run during last week of month for maximum impact',
      'Increase budget 50% on Friday-Sunday for weekend shoppers',
    ],
    tips_es: [
      'Crea urgencia genuina con plazos reales',
      'Usa colores fuertes y texto grande en el creativo',
      'Incluye montos especificos ($0 Enganche, Desde $199/mes)',
      'Corre la ultima semana del mes para maximo impacto',
      'Aumenta presupuesto 50% Viernes-Domingo para compradores de fin de semana',
    ],
  },

  // ─────────────────────────────────────────
  // 3. Clearance Sale
  // ─────────────────────────────────────────
  {
    id: 'clearance',
    type: 'clearance',
    name_en: 'Clearance Event',
    name_es: 'Evento de Liquidacion',
    description_en: 'Move aged inventory fast with aggressive pricing. Video walkaround format shows real vehicle condition.',
    description_es: 'Mueve inventario antiguo rapido con precios agresivos. Video walkaround muestra condicion real del vehiculo.',
    icon: 'Tag',
    color: 'am-green',
    headline_en: 'Clearance: Prices Slashed on Select Vehicles!',
    headline_es: '¡Liquidacion: Precios Rebajados en Vehiculos Selectos!',
    body_en: '⚡ CLEARANCE EVENT ⚡\n\nPrices reduced on select vehicles!\n\n🏷️ Save up to $5,000\n📸 Real photos, no surprises\n🔧 Fully inspected\n📍 Houston, TX\n\nThese won\'t last — message us for the best deal!',
    body_es: '⚡ EVENTO DE LIQUIDACION ⚡\n\n¡Precios reducidos en vehiculos selectos!\n\n🏷️ Ahorra hasta $5,000\n📸 Fotos reales, sin sorpresas\n🔧 Completamente inspeccionados\n📍 Houston, TX\n\n¡No van a durar — escribenos para la mejor oferta!',
    cta_text: 'Chat on WhatsApp',
    welcome_message_en: '⚡ Welcome to our Clearance Event! These vehicles are priced to move. Which one caught your eye?',
    welcome_message_es: '⚡ ¡Bienvenido a nuestro Evento de Liquidacion! Estos vehiculos estan a precios de remate. ¿Cual te llamo la atencion?',
    icebreakers_en: [
      '🏷️ Show me the biggest discounts',
      '🚗 What SUVs are on clearance?',
      '🚙 What trucks are on clearance?',
      '💬 I want to make an offer',
    ],
    icebreakers_es: [
      '🏷️ Muestrame los mayores descuentos',
      '🚗 ¿Que SUVs estan en liquidacion?',
      '🚙 ¿Que trucks estan en liquidacion?',
      '💬 Quiero hacer una oferta',
    ],
    recommended_format: 'video',
    recommended_budget_min: 20,
    recommended_budget_max: 60,
    recommended_duration_days: 10,
    tips_en: [
      'Show original price vs clearance price for impact',
      '30-second video walkarounds convert best',
      'Be transparent about why vehicles are discounted',
      'Pair with retargeting ads for viewers who watched 50%+',
      'Update creative immediately when a vehicle sells',
    ],
    tips_es: [
      'Muestra precio original vs precio de liquidacion para impacto',
      'Videos de 30 segundos walkaround convierten mejor',
      'Se transparente sobre por que los vehiculos estan rebajados',
      'Combina con retargeting para viewers que vieron 50%+',
      'Actualiza el creativo inmediatamente cuando un vehiculo se venda',
    ],
  },

  // ─────────────────────────────────────────
  // 4. Financing Focus
  // ─────────────────────────────────────────
  {
    id: 'financing',
    type: 'financing',
    name_en: 'Easy Financing',
    name_es: 'Financiamiento Facil',
    description_en: 'Target buyers who need financing help. Emphasize low payments, easy approval, and credit flexibility.',
    description_es: 'Targeta compradores que necesitan financiamiento. Enfasis en pagos bajos, aprobacion facil y flexibilidad de credito.',
    icon: 'CreditCard',
    color: 'am-blue-light',
    headline_en: 'Drive Today, Pay Over Time!',
    headline_es: '¡Maneja Hoy, Paga a Tu Ritmo!',
    body_en: '🏦 Financing Made Easy!\n\n✅ All Credit Welcome\n💵 Payments from $199/month\n⚡ 30-Minute Approval\n📱 Apply via WhatsApp — no paperwork!\n\nChat with us to get pre-approved today!',
    body_es: '🏦 ¡Financiamiento Facil!\n\n✅ Todo Tipo de Credito\n💵 Pagos desde $199/mes\n⚡ Aprobacion en 30 Minutos\n📱 ¡Aplica por WhatsApp — sin papeleo!\n\n¡Chatea con nosotros para pre-aprobacion hoy!',
    cta_text: 'Get Pre-Approved',
    welcome_message_en: '🏦 Welcome! Getting financed is easier than you think. Let me help you find out what you qualify for — it only takes a few minutes!',
    welcome_message_es: '🏦 ¡Bienvenido! Obtener financiamiento es mas facil de lo que piensas. ¡Dejame ayudarte a saber para que calificas — solo toma unos minutos!',
    icebreakers_en: [
      '💳 Check my payment options',
      '🚗 What can I afford?',
      '📝 Start the approval process',
      '❓ What credit score do I need?',
    ],
    icebreakers_es: [
      '💳 Ver mis opciones de pago',
      '🚗 ¿Que puedo comprar con mi presupuesto?',
      '📝 Iniciar el proceso de aprobacion',
      '❓ ¿Que score de credito necesito?',
    ],
    recommended_format: 'single_image',
    recommended_budget_min: 20,
    recommended_budget_max: 50,
    recommended_duration_days: 30,
    tips_en: [
      'Lead with monthly payment, not total price',
      'Emphasize "All Credit Welcome" — it\'s a huge draw',
      'Use a calculator/payment visual in ad creative',
      'Best audience: ages 25-45, renting, vehicle age 5+ years',
      'This campaign type works great as an always-on campaign',
    ],
    tips_es: [
      'Destaca el pago mensual, no el precio total',
      'Enfatiza "Todo Tipo de Credito" — es un gran atractivo',
      'Usa visual de calculadora/pago en el creativo',
      'Mejor audiencia: 25-45 anos, rentando, vehiculo de 5+ anos',
      'Este tipo de campana funciona genial como campana permanente',
    ],
  },

  // ─────────────────────────────────────────
  // 5. Trade-In Campaign
  // ─────────────────────────────────────────
  {
    id: 'trade_in',
    type: 'trade_in',
    name_en: 'Trade-In Special',
    name_es: 'Especial de Intercambio',
    description_en: 'Target vehicle owners ready to upgrade. Offer instant trade-in valuations via WhatsApp to start conversations.',
    description_es: 'Targeta duenos de vehiculos listos para upgrade. Ofrece valuaciones instantaneas via WhatsApp para iniciar conversaciones.',
    icon: 'RefreshCw',
    color: 'am-orange-light',
    headline_en: 'Your Car Is Worth More Than You Think!',
    headline_es: '¡Tu Auto Vale Mas de Lo Que Piensas!',
    body_en: '🔄 Trade In & Upgrade!\n\n📊 Free Instant Valuation\n💰 Top Dollar for Your Trade\n🚗 Huge Selection of Upgrades\n⚡ Same-Day Process\n\nSend us 3 photos of your car and get a quote in minutes!',
    body_es: '🔄 ¡Intercambia y Mejora!\n\n📊 Valuacion Instantanea Gratis\n💰 El Mejor Precio por Tu Auto\n🚗 Gran Seleccion de Vehiculos\n⚡ Proceso el Mismo Dia\n\n¡Envianos 3 fotos de tu auto y recibe cotizacion en minutos!',
    cta_text: 'Get My Quote',
    welcome_message_en: '🔄 Great move! Let\'s see how much your current vehicle is worth. Can you send me 3 photos (front, back, interior) and tell me the year, make, model, and mileage?',
    welcome_message_es: '🔄 ¡Gran decision! Veamos cuanto vale tu vehiculo actual. ¿Puedes enviarme 3 fotos (frente, atras, interior) y decirme el ano, marca, modelo y millaje?',
    icebreakers_en: [
      '📸 I have photos of my car ready',
      '💰 How much is my car worth?',
      '🚗 What upgrades are available?',
      '🔄 How does the trade-in process work?',
    ],
    icebreakers_es: [
      '📸 Tengo fotos de mi auto listas',
      '💰 ¿Cuanto vale mi auto?',
      '🚗 ¿Que upgrades hay disponibles?',
      '🔄 ¿Como funciona el proceso de intercambio?',
    ],
    recommended_format: 'single_image',
    recommended_budget_min: 15,
    recommended_budget_max: 40,
    recommended_duration_days: 21,
    tips_en: [
      'Target people with vehicles 4+ years old',
      'Show before/after upgrade stories in creative',
      'Quick response is critical — valuations should take < 15 min',
      'Follow up in 24 hours if they sent photos but didn\'t respond',
      'Combine with financing campaign for maximum impact',
    ],
    tips_es: [
      'Targeta personas con vehiculos de 4+ anos',
      'Muestra historias de antes/despues en el creativo',
      'Respuesta rapida es critica — valuaciones deben tomar < 15 min',
      'Seguimiento en 24 horas si enviaron fotos pero no respondieron',
      'Combina con campana de financiamiento para maximo impacto',
    ],
  },
];

/**
 * Get a template by type
 */
export function getTemplate(type: string): CampaignTemplate | undefined {
  return CAMPAIGN_TEMPLATES.find((t) => t.type === type);
}

/**
 * Get all template summaries (for selection UI)
 */
export function getTemplateSummaries(lang: 'en' | 'es') {
  return CAMPAIGN_TEMPLATES.map((t) => ({
    id: t.id,
    type: t.type,
    name: lang === 'es' ? t.name_es : t.name_en,
    description: lang === 'es' ? t.description_es : t.description_en,
    icon: t.icon,
    color: t.color,
    recommended_budget_min: t.recommended_budget_min,
    recommended_budget_max: t.recommended_budget_max,
    recommended_duration_days: t.recommended_duration_days,
  }));
}
