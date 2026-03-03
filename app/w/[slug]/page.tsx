'use client';

/**
 * WhatsApp Campaign Landing Page
 *
 * Public landing page for Facebook Click-to-WhatsApp (CTWA) campaigns.
 * Optimized for maximum conversion with:
 * - Mobile-first design (82.9% of FB traffic is mobile)
 * - Sub-2-second load time
 * - One-tap WhatsApp CTA (primary action)
 * - Vehicle showcase with swipe carousel
 * - Trust signals (inspected, certified, local)
 * - Bilingual EN/ES auto-detect
 * - UTM tracking for attribution
 * - Event tracking (page_view, whatsapp_click, etc.)
 *
 * URL: /w/[campaign-slug]?v=vehicleId&utm_source=facebook&utm_medium=ctwa
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import {
  MessageCircle,
  Phone,
  MapPin,
  Shield,
  Star,
  ChevronLeft,
  ChevronRight,
  Car,
  CreditCard,
  RefreshCw,
  Clock,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface CampaignData {
  campaign: {
    id: string;
    name: string;
    type: string;
    headline_en: string;
    headline_es: string;
    body_en: string;
    body_es: string;
    cta_text: string;
    whatsapp_number: string;
    welcome_message_en: string;
    welcome_message_es: string;
    icebreakers_en: string[];
    icebreakers_es: string[];
    caption_language: string;
    landing_enabled: boolean;
    vehicle_ids: string[];
  };
  seller: {
    business_name: string;
    phone: string | null;
    whatsapp: string | null;
    city: string | null;
    state: string | null;
    handle: string;
    logo_url: string | null;
  };
  vehicles: {
    id: string;
    brand: string;
    model: string;
    year: number;
    price: number;
    mileage: number;
    condition: string;
    transmission: string;
    body_type: string;
    image_url: string | null;
  }[];
}

// ─────────────────────────────────────────────
// Helpers
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

function estimateMonthly(price: number): number {
  const r = 0.069 / 12;
  const n = 60;
  return Math.round((price * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
}

function detectLanguage(): 'en' | 'es' {
  if (typeof navigator === 'undefined') return 'en';
  const lang = navigator.language || '';
  return lang.startsWith('es') ? 'es' : 'en';
}

function buildWhatsAppUrl(phone: string, message: string): string {
  const clean = phone.replace(/\D/g, '');
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

// ─────────────────────────────────────────────
// Event Tracking
// ─────────────────────────────────────────────

function trackEvent(
  campaignId: string,
  eventType: string,
  vehicleId?: string,
  utmParams?: Record<string, string>
) {
  fetch('/api/campaigns/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      campaign_id: campaignId,
      event_type: eventType,
      vehicle_id: vehicleId,
      ...utmParams,
    }),
  }).catch(() => {}); // Fire and forget
}

// ─────────────────────────────────────────────
// Page Component
// ─────────────────────────────────────────────

export default function CampaignLandingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;

  const [data, setData] = useState<CampaignData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lang, setLang] = useState<'en' | 'es'>('en');
  const [currentVehicle, setCurrentVehicle] = useState(0);

  // UTM params
  const utmParams = {
    utm_source: searchParams.get('utm_source') || 'facebook',
    utm_medium: searchParams.get('utm_medium') || 'ctwa',
    utm_campaign: searchParams.get('utm_campaign') || slug,
    utm_content: searchParams.get('utm_content') || '',
  };

  // Focused vehicle from URL param
  const focusedVehicleId = searchParams.get('v');

  useEffect(() => {
    setLang(detectLanguage());
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/campaigns/${slug}`);
        if (!res.ok) throw new Error('Not found');
        const json = await res.json();
        setData(json);

        // Track page view
        trackEvent(json.campaign.id, 'page_view', undefined, utmParams);

        // Set focused vehicle
        if (focusedVehicleId && json.vehicles) {
          const idx = json.vehicles.findIndex((v: { id: string }) => v.id === focusedVehicleId);
          if (idx >= 0) setCurrentVehicle(idx);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const handleWhatsAppClick = useCallback(
    (vehicleId?: string, vehicleTitle?: string) => {
      if (!data) return;
      const { campaign, seller } = data;
      const phone = campaign.whatsapp_number || seller.whatsapp || seller.phone || '';

      let message: string;
      if (vehicleTitle) {
        message =
          lang === 'es'
            ? `Hola! Vi el ${vehicleTitle} en su anuncio y me gustaria mas informacion.`
            : `Hi! I saw the ${vehicleTitle} on your ad and I'd like more information.`;
      } else {
        message =
          lang === 'es'
            ? `Hola! Vi su anuncio de ${campaign.name} y me gustaria mas informacion.`
            : `Hi! I saw your ${campaign.name} ad and I'd like more information.`;
      }

      trackEvent(campaign.id, 'whatsapp_click', vehicleId, utmParams);
      window.open(buildWhatsAppUrl(phone, message), '_blank');
    },
    [data, lang, utmParams]
  );

  const handlePhoneClick = useCallback(() => {
    if (!data) return;
    const phone = data.seller.phone || data.campaign.whatsapp_number;
    trackEvent(data.campaign.id, 'phone_click', undefined, utmParams);
    window.open(`tel:${phone}`, '_self');
  }, [data, utmParams]);

  // ── Loading State ──
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0D1B2A] to-[#1B3A6B] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  // ── Error State ──
  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0D1B2A] to-[#1B3A6B] flex items-center justify-center p-6">
        <div className="text-center">
          <Car className="w-16 h-16 text-[#E8832A] mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">
            {lang === 'es' ? 'Campaña no encontrada' : 'Campaign not found'}
          </h1>
          <p className="text-gray-400 text-sm">
            {lang === 'es'
              ? 'Esta campaña ya no está disponible.'
              : 'This campaign is no longer available.'}
          </p>
        </div>
      </div>
    );
  }

  const { campaign, seller, vehicles } = data;
  const headline = lang === 'es' ? campaign.headline_es : campaign.headline_en;
  const body = lang === 'es' ? campaign.body_es : campaign.body_en;
  const icebreakers = lang === 'es' ? campaign.icebreakers_es : campaign.icebreakers_en;
  const currentV = vehicles[currentVehicle];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0D1B2A] via-[#122A4F] to-[#1B3A6B]">
      {/* ── Top Bar ── */}
      <div className="bg-[#0D1B2A]/80 backdrop-blur-sm border-b border-white/10 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            {seller.logo_url ? (
              <Image
                src={seller.logo_url}
                alt={seller.business_name}
                width={32}
                height={32}
                className="rounded-lg"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-[#E8832A] flex items-center justify-center">
                <Car className="w-4 h-4 text-white" />
              </div>
            )}
            <div>
              <p className="text-white text-sm font-semibold leading-tight">
                {seller.business_name}
              </p>
              <p className="text-gray-400 text-xs flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {seller.city || 'Houston'}, {seller.state || 'TX'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
              className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded border border-white/20"
            >
              {lang === 'es' ? 'EN' : 'ES'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* ── Hero Headline ── */}
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight mb-3">
            {headline}
          </h1>
          <p className="text-gray-300 text-sm whitespace-pre-line leading-relaxed">
            {body}
          </p>
        </div>

        {/* ── Vehicle Carousel ── */}
        {vehicles.length > 0 && (
          <div className="relative">
            {/* Vehicle Card */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden">
              {/* Image */}
              <div className="relative aspect-[16/10] bg-[#0D1B2A]">
                {currentV?.image_url ? (
                  <Image
                    src={currentV.image_url}
                    alt={`${currentV.year} ${currentV.brand} ${currentV.model}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 512px) 100vw, 512px"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Car className="w-16 h-16 text-gray-600" />
                  </div>
                )}

                {/* Vehicle count badge */}
                {vehicles.length > 1 && (
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full">
                    {currentVehicle + 1} / {vehicles.length}
                  </div>
                )}

                {/* Navigation Arrows */}
                {vehicles.length > 1 && (
                  <>
                    <button
                      onClick={() =>
                        setCurrentVehicle((p) => (p > 0 ? p - 1 : vehicles.length - 1))
                      }
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() =>
                        setCurrentVehicle((p) => (p < vehicles.length - 1 ? p + 1 : 0))
                      }
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>

              {/* Vehicle Info */}
              {currentV && (
                <div className="p-4">
                  <h3 className="text-white font-bold text-lg">
                    {currentV.year} {currentV.brand} {currentV.model}
                  </h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {currentV.price > 0 && (
                      <span className="bg-[#E8832A]/20 text-[#F5A623] text-sm font-bold px-3 py-1 rounded-full">
                        {fmtPrice(currentV.price)}
                      </span>
                    )}
                    {currentV.price > 0 && (
                      <span className="bg-[#2D8F4E]/20 text-[#4CAF50] text-xs font-semibold px-3 py-1 rounded-full">
                        ~${estimateMonthly(currentV.price)}/{lang === 'es' ? 'mes' : 'mo'}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-gray-400 text-xs">
                    {currentV.mileage > 0 && (
                      <span>{fmtMileage(currentV.mileage)} {lang === 'es' ? 'millas' : 'miles'}</span>
                    )}
                    {currentV.transmission && <span>{currentV.transmission}</span>}
                    {currentV.body_type && <span>{currentV.body_type}</span>}
                    {currentV.condition && (
                      <span className="capitalize">{currentV.condition}</span>
                    )}
                  </div>

                  {/* Per-vehicle WhatsApp CTA */}
                  <button
                    onClick={() =>
                      handleWhatsAppClick(
                        currentV.id,
                        `${currentV.year} ${currentV.brand} ${currentV.model}`
                      )
                    }
                    className="w-full mt-4 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-[#25D366]/20"
                  >
                    <MessageCircle className="w-5 h-5" />
                    {lang === 'es' ? 'Preguntar por este vehículo' : 'Ask about this vehicle'}
                  </button>
                </div>
              )}
            </div>

            {/* Dot indicators */}
            {vehicles.length > 1 && (
              <div className="flex justify-center gap-1.5 mt-3">
                {vehicles.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentVehicle(i)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      i === currentVehicle ? 'bg-[#E8832A]' : 'bg-white/30'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Primary CTA — WhatsApp ── */}
        <button
          onClick={() => handleWhatsAppClick()}
          className="w-full flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#20BD5A] text-white font-extrabold text-lg py-4 rounded-2xl transition-all shadow-xl shadow-[#25D366]/30 active:scale-[0.98]"
        >
          <MessageCircle className="w-6 h-6" />
          {campaign.cta_text || (lang === 'es' ? 'Chatear en WhatsApp' : 'Chat on WhatsApp')}
        </button>

        {/* ── Quick Reply Buttons (Icebreakers) ── */}
        {icebreakers && icebreakers.length > 0 && (
          <div className="space-y-2">
            <p className="text-gray-400 text-xs text-center">
              {lang === 'es' ? '¿Qué te interesa?' : 'What are you interested in?'}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {icebreakers.map((text, i) => (
                <button
                  key={i}
                  onClick={() => {
                    const phone =
                      campaign.whatsapp_number || seller.whatsapp || seller.phone || '';
                    trackEvent(campaign.id, 'whatsapp_click', undefined, utmParams);
                    window.open(buildWhatsAppUrl(phone, text), '_blank');
                  }}
                  className="text-left text-sm text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10 rounded-xl px-3 py-2.5 transition-colors"
                >
                  {text}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Trust Signals ── */}
        <div className="grid grid-cols-2 gap-3">
          <TrustBadge
            icon={<Shield className="w-5 h-5 text-[#2D8F4E]" />}
            text={lang === 'es' ? 'Inspeccionados' : 'Inspected'}
            sub={lang === 'es' ? 'Certificación completa' : 'Full certification'}
          />
          <TrustBadge
            icon={<CheckCircle2 className="w-5 h-5 text-[#2B5EA7]" />}
            text={lang === 'es' ? 'Sin sorpresas' : 'No surprises'}
            sub={lang === 'es' ? 'Precios transparentes' : 'Transparent pricing'}
          />
          <TrustBadge
            icon={<CreditCard className="w-5 h-5 text-[#E8832A]" />}
            text={lang === 'es' ? 'Financiamiento' : 'Financing'}
            sub={lang === 'es' ? 'Opciones disponibles' : 'Options available'}
          />
          <TrustBadge
            icon={<Clock className="w-5 h-5 text-[#F5A623]" />}
            text={lang === 'es' ? 'Respuesta rápida' : 'Fast response'}
            sub={lang === 'es' ? 'En minutos' : 'Within minutes'}
          />
        </div>

        {/* ── Campaign Type Specific Content ── */}
        {campaign.type === 'financing' && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-5">
            <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#E8832A]" />
              {lang === 'es' ? 'Financiamiento Fácil' : 'Easy Financing'}
            </h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#2D8F4E] flex-shrink-0" />
                {lang === 'es' ? 'Todo tipo de crédito bienvenido' : 'All credit types welcome'}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#2D8F4E] flex-shrink-0" />
                {lang === 'es' ? 'Aprobación en 30 minutos' : '30-minute approval'}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#2D8F4E] flex-shrink-0" />
                {lang === 'es' ? 'Opciones de $0 enganche' : '$0 down payment options'}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#2D8F4E] flex-shrink-0" />
                {lang === 'es' ? 'Aplica desde WhatsApp' : 'Apply from WhatsApp'}
              </li>
            </ul>
          </div>
        )}

        {campaign.type === 'trade_in' && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-5">
            <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-[#E8832A]" />
              {lang === 'es' ? 'Cómo funciona' : 'How it works'}
            </h3>
            <div className="space-y-3">
              {[
                {
                  step: '1',
                  en: 'Send us 3 photos of your car',
                  es: 'Envíanos 3 fotos de tu auto',
                },
                {
                  step: '2',
                  en: 'Get an instant valuation',
                  es: 'Recibe una valuación instantánea',
                },
                {
                  step: '3',
                  en: 'Choose your upgrade vehicle',
                  es: 'Elige tu vehículo de upgrade',
                },
                {
                  step: '4',
                  en: 'Drive away same day!',
                  es: '¡Llévatelo el mismo día!',
                },
              ].map((item) => (
                <div key={item.step} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#E8832A] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {item.step}
                  </div>
                  <p className="text-gray-300 text-sm">{lang === 'es' ? item.es : item.en}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Social Proof ── */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-4">
          <div className="flex items-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="w-4 h-4 fill-[#F5A623] text-[#F5A623]" />
            ))}
            <span className="text-gray-400 text-xs ml-1">5.0</span>
          </div>
          <p className="text-gray-300 text-sm italic">
            {lang === 'es'
              ? '"Excelente servicio. Me respondieron en minutos por WhatsApp y encontré el auto perfecto."'
              : '"Excellent service. They responded within minutes on WhatsApp and I found the perfect car."'}
          </p>
          <p className="text-gray-500 text-xs mt-1">
            — {lang === 'es' ? 'Cliente verificado' : 'Verified customer'}, Houston TX
          </p>
        </div>

        {/* ── Secondary CTA — Phone ── */}
        {(seller.phone || campaign.whatsapp_number) && (
          <button
            onClick={handlePhoneClick}
            className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-semibold py-3 rounded-xl border border-white/20 transition-colors"
          >
            <Phone className="w-5 h-5" />
            {lang === 'es' ? 'Llamar directamente' : 'Call directly'}
          </button>
        )}

        {/* ── Footer ── */}
        <div className="text-center pb-6">
          <p className="text-gray-500 text-xs">
            © {new Date().getFullYear()} {seller.business_name} ·{' '}
            {seller.city || 'Houston'}, {seller.state || 'TX'}
          </p>
          <p className="text-gray-600 text-[10px] mt-1">
            Powered by Autos MALL
          </p>
        </div>
      </div>

      {/* ── Floating WhatsApp FAB ── */}
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => handleWhatsAppClick()}
          className="w-14 h-14 rounded-full bg-[#25D366] shadow-xl shadow-[#25D366]/40 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
        >
          <MessageCircle className="w-7 h-7 text-white" />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Trust Badge Component
// ─────────────────────────────────────────────

function TrustBadge({
  icon,
  text,
  sub,
}: {
  icon: React.ReactNode;
  text: string;
  sub: string;
}) {
  return (
    <div className="bg-white/5 rounded-xl border border-white/10 p-3 flex items-start gap-2.5">
      <div className="flex-shrink-0 mt-0.5">{icon}</div>
      <div>
        <p className="text-white text-sm font-semibold leading-tight">{text}</p>
        <p className="text-gray-500 text-xs">{sub}</p>
      </div>
    </div>
  );
}
