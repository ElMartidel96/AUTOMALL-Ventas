'use client';

/**
 * Campaign Landing — Client Component
 *
 * Interactive CTWA landing page with:
 * - Vehicle carousel with touch swipe
 * - WhatsApp CTA button (#25D366)
 * - Event tracking (fire-and-forget)
 * - Bilingual auto-detect
 * - Mobile-first responsive design
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import type { PublicCampaignData, PublicVehicle } from '@/lib/campaigns/types';
import { estimateMonthly, buildWhatsAppURL } from '@/lib/campaigns/ad-copy-generator';
import { GetDirectionsButton } from '@/components/map/GetDirectionsButton';

const DynamicVehicleLocationMap = dynamic(
  () => import('@/components/catalog/VehicleLocationMap'),
  { ssr: false }
);

const DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || 'autosmall.org';

interface Props {
  data: PublicCampaignData;
  slug: string;
}

function detectLang(): 'en' | 'es' {
  if (typeof navigator === 'undefined') return 'en';
  const lang = navigator.language || '';
  return lang.startsWith('es') ? 'es' : 'en';
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price);
}

function generateSessionId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function CampaignLanding({ data, slug }: Props) {
  const [lang, setLang] = useState<'en' | 'es'>('en');
  const [selectedVehicle, setSelectedVehicle] = useState(0);
  const [sessionId] = useState(generateSessionId);
  const trackedRef = useRef(false);
  const scrollTracked50 = useRef(false);
  const scrollTracked100 = useRef(false);

  const seller = data.seller;
  const vehicles = data.vehicles;
  const headline = lang === 'es' ? data.headline_es : data.headline_en;
  const ctaText = lang === 'es' ? data.cta_text_es : data.cta_text_en;

  // Detect language on mount
  useEffect(() => {
    setLang(detectLang());
  }, []);

  // Track page view
  useEffect(() => {
    if (trackedRef.current) return;
    trackedRef.current = true;
    trackEvent('page_view');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll tracking
  useEffect(() => {
    function handleScroll() {
      const scrollPercent = (window.scrollY + window.innerHeight) / document.body.scrollHeight;
      if (scrollPercent > 0.5 && !scrollTracked50.current) {
        scrollTracked50.current = true;
        trackEvent('scroll_50');
      }
      if (scrollPercent > 0.95 && !scrollTracked100.current) {
        scrollTracked100.current = true;
        trackEvent('scroll_100');
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const trackEvent = useCallback((eventType: string, vehicleId?: string) => {
    const params = new URLSearchParams(window.location.search);
    fetch('/api/campaigns/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campaign_id: data.id,
        event_type: eventType,
        vehicle_id: vehicleId || null,
        session_id: sessionId,
        utm_source: params.get('utm_source'),
        utm_medium: params.get('utm_medium'),
        utm_campaign: params.get('utm_campaign'),
      }),
    }).catch(() => {}); // Fire-and-forget
  }, [data.id, sessionId]);

  const handleVehicleClick = (index: number) => {
    setSelectedVehicle(index);
    if (vehicles[index]) {
      trackEvent('vehicle_view', vehicles[index].id);
    }
  };

  const handleWhatsAppClick = (vehicle?: PublicVehicle) => {
    trackEvent('whatsapp_click', vehicle?.id);
    const phone = seller.whatsapp || seller.phone || '';
    const msg = vehicle
      ? lang === 'es'
        ? `Hola! Vi tu ${vehicle.year} ${vehicle.brand} ${vehicle.model} (${formatPrice(vehicle.price)}) en la campana. Me interesa! Cual es el mejor precio disponible?`
        : `Hi! I saw your ${vehicle.year} ${vehicle.brand} ${vehicle.model} (${formatPrice(vehicle.price)}) in the campaign. I'm interested! What's the best price available?`
      : lang === 'es'
        ? `Hola! Vi tu campana en Facebook. Me interesan tus vehiculos disponibles!`
        : `Hi! I saw your campaign on Facebook. I'm interested in your available vehicles!`;
    window.open(buildWhatsAppURL(phone, msg), '_blank');
  };

  const handlePhoneClick = () => {
    trackEvent('phone_click');
  };

  const currentVehicle = vehicles[selectedVehicle] || null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0D1B2A] via-[#1B3A6B] to-[#0D1B2A]">
      {/* Header */}
      <header className="px-4 py-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-3 h-3 bg-[#2D8F4E] rounded-full animate-pulse" />
          <span className="text-[#2D8F4E] text-sm font-medium">
            {lang === 'es' ? 'En linea ahora' : 'Online now'}
          </span>
        </div>
        <h1 className="text-white text-2xl md:text-4xl font-bold mb-1">
          {seller.business_name}
        </h1>
        <p className="text-gray-300 text-sm">
          {seller.city && seller.state ? `${seller.city}, ${seller.state}` : ''}
        </p>
      </header>

      {/* Headline */}
      <section className="px-4 pb-6 text-center">
        <h2 className="text-[#E8832A] text-xl md:text-2xl font-bold">
          {headline || data.name}
        </h2>
      </section>

      {/* Vehicle Carousel */}
      {vehicles.length > 0 && (
        <section className="px-4 pb-6">
          {/* Thumbnails */}
          {vehicles.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-hide">
              {vehicles.map((v, i) => (
                <button
                  key={v.id}
                  onClick={() => handleVehicleClick(i)}
                  className={`flex-shrink-0 snap-center px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                    i === selectedVehicle
                      ? 'bg-[#E8832A] text-white'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  {v.year} {v.brand} {v.model}
                </button>
              ))}
            </div>
          )}

          {/* Selected Vehicle Card */}
          {currentVehicle && (
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10">
              {currentVehicle.image_url && (
                <div className="relative aspect-[16/10] bg-black/20">
                  <Image
                    src={currentVehicle.image_url}
                    alt={`${currentVehicle.year} ${currentVehicle.brand} ${currentVehicle.model}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 600px"
                  />
                </div>
              )}

              <div className="p-4">
                <h3 className="text-white text-xl font-bold">
                  {currentVehicle.year} {currentVehicle.brand} {currentVehicle.model}
                  {currentVehicle.trim ? ` ${currentVehicle.trim}` : ''}
                </h3>

                <div className="flex flex-wrap gap-3 mt-3">
                  <span className="text-[#E8832A] text-2xl font-bold">
                    {formatPrice(currentVehicle.price)}
                  </span>
                  {currentVehicle.price > 0 && (
                    <span className="text-gray-400 text-sm self-end">
                      {lang === 'es' ? 'Desde' : 'From'} ${estimateMonthly(currentVehicle.price)}/{lang === 'es' ? 'mes' : 'mo'}*
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mt-3">
                  {currentVehicle.mileage && (
                    <span className="px-2 py-1 bg-white/10 rounded-lg text-gray-300 text-xs">
                      {new Intl.NumberFormat('en-US').format(currentVehicle.mileage)} mi
                    </span>
                  )}
                  {currentVehicle.transmission && (
                    <span className="px-2 py-1 bg-white/10 rounded-lg text-gray-300 text-xs">
                      {currentVehicle.transmission}
                    </span>
                  )}
                  {currentVehicle.exterior_color && (
                    <span className="px-2 py-1 bg-white/10 rounded-lg text-gray-300 text-xs">
                      {currentVehicle.exterior_color}
                    </span>
                  )}
                  {currentVehicle.condition && (
                    <span className="px-2 py-1 bg-white/10 rounded-lg text-gray-300 text-xs">
                      {currentVehicle.condition}
                    </span>
                  )}
                </div>

                {/* WhatsApp CTA for this vehicle */}
                <button
                  onClick={() => handleWhatsAppClick(currentVehicle)}
                  className="w-full mt-4 py-3 bg-[#25D366] hover:bg-[#22c55e] text-white font-bold rounded-xl text-lg transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  {ctaText || (lang === 'es' ? 'Escribenos por WhatsApp' : 'Message on WhatsApp')}
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Dealer Location */}
      {(seller.address || (seller.latitude && seller.longitude)) && (
        <section className="px-4 pb-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 p-4">
            {seller.address && (
              <p className="text-gray-300 text-sm flex items-center gap-2 mb-3">
                <span>📍</span>
                <span>
                  {seller.address}
                  {seller.city && seller.state && `, ${seller.city}, ${seller.state}`}
                </span>
              </p>
            )}
            {seller.latitude && seller.longitude && (
              <DynamicVehicleLocationMap
                latitude={seller.latitude}
                longitude={seller.longitude}
                vehicleTitle={seller.business_name}
                address={seller.address || `${seller.city}, ${seller.state}`}
              />
            )}
            {seller.latitude && seller.longitude && (
              <div className="mt-3">
                <GetDirectionsButton
                  destLat={seller.latitude}
                  destLng={seller.longitude}
                  label={seller.business_name}
                  variant="primary"
                />
              </div>
            )}
          </div>
        </section>
      )}

      {/* Trust Signals */}
      <section className="px-4 pb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            {
              icon: '📍',
              en: `Local — ${seller.city || 'Houston'}, ${seller.state || 'TX'}`,
              es: `Local — ${seller.city || 'Houston'}, ${seller.state || 'TX'}`,
            },
            {
              icon: '🔒',
              en: 'Verified Dealer',
              es: 'Dealer Verificado',
            },
            {
              icon: '💬',
              en: 'Fast Response',
              es: 'Respuesta Rapida',
            },
            {
              icon: '🏦',
              en: 'Financing Available',
              es: 'Financiamiento',
            },
          ].map((signal, i) => (
            <div
              key={i}
              className="bg-white/5 rounded-xl p-3 text-center border border-white/10"
            >
              <span className="text-2xl">{signal.icon}</span>
              <p className="text-gray-300 text-xs mt-1">
                {lang === 'es' ? signal.es : signal.en}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact Info */}
      <section className="px-4 pb-6">
        <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
          <h3 className="text-white font-bold mb-3">
            {lang === 'es' ? 'Contactanos' : 'Contact Us'}
          </h3>

          {seller.address && (
            <p className="flex items-center gap-3 text-gray-300 py-2">
              <span className="text-lg">📍</span>
              <span className="text-sm">{seller.address}</span>
            </p>
          )}

          {seller.phone && (
            <a
              href={`tel:${seller.phone}`}
              onClick={handlePhoneClick}
              className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors py-2"
            >
              <span className="text-lg">📞</span>
              <span>{seller.phone}</span>
            </a>
          )}

          <a
            href={`https://${seller.handle}.${DOMAIN}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors py-2"
          >
            <span className="text-lg">🌐</span>
            <span>{seller.handle}.{DOMAIN}</span>
          </a>
        </div>
      </section>

      {/* Sticky WhatsApp CTA (mobile) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0D1B2A] via-[#0D1B2A]/95 to-transparent md:hidden z-50">
        <button
          onClick={() => handleWhatsAppClick(currentVehicle || undefined)}
          className="w-full py-4 bg-[#25D366] hover:bg-[#22c55e] text-white font-bold rounded-2xl text-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#25D366]/30"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          {ctaText || (lang === 'es' ? 'Escribenos por WhatsApp' : 'Message on WhatsApp')}
        </button>
      </div>

      {/* Footer spacer for sticky CTA */}
      <div className="h-24 md:h-8" />

      {/* Footer */}
      <footer className="px-4 py-6 text-center border-t border-white/10">
        <p className="text-gray-500 text-xs">
          {lang === 'es' ? 'Impulsado por' : 'Powered by'}{' '}
          <a href={`https://${DOMAIN}`} className="text-[#E8832A] hover:underline">
            Autos MALL
          </a>
        </p>
        {vehicles.some(v => v.price > 0) && (
          <p className="text-gray-600 text-[10px] mt-2">
            *{lang === 'es'
              ? 'Pago estimado. Sujeto a aprobacion de credito. No es una oferta de credito.'
              : 'Estimated payment. Subject to credit approval. Not a credit offer.'}
          </p>
        )}
      </footer>

      {/* Language toggle */}
      <button
        onClick={() => setLang(l => l === 'en' ? 'es' : 'en')}
        className="fixed top-4 right-4 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-full text-white text-sm transition-colors z-50"
      >
        {lang === 'en' ? 'ES' : 'EN'}
      </button>
    </div>
  );
}
