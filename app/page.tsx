'use client';

/**
 * Autos MALL - Dealer Home Page
 *
 * The customer-facing welcome page for the Autos MALL dealer.
 * Designed with buyer psychology in mind:
 * - Reduce anxiety: clean, simple, no-pressure language
 * - Build trust: inspections, transparent pricing, social proof
 * - Create desire: beautiful visuals, aspirational feel
 * - Minimize friction: search front-and-center, easy navigation
 *
 * Glass morphism design system with AM brand colors.
 * i18n: Full bilingual support (EN/ES)
 */

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import { Navbar, NavbarSpacer } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useAccount } from '@/lib/thirdweb';
import {
  Search,
  Shield,
  DollarSign,
  Heart,
  Headphones,
  Star,
  ChevronRight,
  MapPin,
  BadgeCheck,
  CreditCard,
  Phone,
  MessageCircle,
  ArrowRight,
  Sparkles,
  Bell,
} from 'lucide-react';

/* ─── Car Brand Logo SVGs ──────────────────────────────────────────────
   Inline SVGs ensure zero external dependencies, perfect sizing,
   instant load, and dark/light mode compatibility.
   All logos render at a uniform 80x80 container for visual consistency.
   ──────────────────────────────────────────────────────────────────── */

function ChevroletLogo({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 80" className={className} aria-label="Chevrolet">
      <rect x="10" y="30" width="60" height="20" rx="2" fill="#D4A843" stroke="#C49A38" strokeWidth="2"/>
      <rect x="18" y="34" width="18" height="12" rx="1" fill="#FFFFFF"/>
      <rect x="44" y="34" width="18" height="12" rx="1" fill="#FFFFFF"/>
    </svg>
  );
}

function FordLogo({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 80" className={className} aria-label="Ford">
      <ellipse cx="40" cy="40" rx="34" ry="22" fill="#003478" stroke="#002D6B" strokeWidth="1.5"/>
      <text x="40" y="46" textAnchor="middle" fill="#FFFFFF" fontFamily="serif" fontStyle="italic" fontSize="22" fontWeight="bold">Ford</text>
    </svg>
  );
}

function GMCLogo({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 80" className={className} aria-label="GMC">
      <rect x="8" y="26" width="64" height="28" rx="3" fill="#CC0000" stroke="#AA0000" strokeWidth="1.5"/>
      <text x="40" y="46" textAnchor="middle" fill="#FFFFFF" fontFamily="Arial, sans-serif" fontSize="22" fontWeight="bold" letterSpacing="2">GMC</text>
    </svg>
  );
}

function DodgeLogo({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 80" className={className} aria-label="Dodge">
      <rect x="6" y="24" width="68" height="32" rx="3" fill="#1A1A1A" stroke="#333" strokeWidth="1"/>
      <text x="40" y="45" textAnchor="middle" fill="#FFFFFF" fontFamily="Arial, sans-serif" fontSize="17" fontWeight="bold" letterSpacing="3">DODGE</text>
      <line x1="14" y1="50" x2="66" y2="50" stroke="#CC0000" strokeWidth="2"/>
    </svg>
  );
}

function JeepLogo({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 80" className={className} aria-label="Jeep">
      <rect x="8" y="28" width="64" height="24" rx="2" fill="#3D6B35" stroke="#2D5525" strokeWidth="1.5"/>
      <text x="40" y="45" textAnchor="middle" fill="#FFFFFF" fontFamily="Arial, sans-serif" fontSize="19" fontWeight="bold" letterSpacing="4">JEEP</text>
    </svg>
  );
}

function NissanLogo({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 80" className={className} aria-label="Nissan">
      <circle cx="40" cy="40" r="28" fill="none" stroke="#C3002F" strokeWidth="3"/>
      <rect x="12" y="34" width="56" height="12" fill="#C3002F"/>
      <text x="40" y="44" textAnchor="middle" fill="#FFFFFF" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" letterSpacing="2">NISSAN</text>
    </svg>
  );
}

function MazdaLogo({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 80" className={className} aria-label="Mazda">
      <ellipse cx="40" cy="38" rx="28" ry="22" fill="none" stroke="#1A1A1A" strokeWidth="2.5" className="dark:stroke-gray-300"/>
      <path d="M20 38 Q30 26 40 30 Q50 26 60 38" fill="none" stroke="#1A1A1A" strokeWidth="2.5" className="dark:stroke-gray-300"/>
      <text x="40" y="58" textAnchor="middle" fill="#1A1A1A" className="dark:fill-gray-300" fontFamily="Arial, sans-serif" fontSize="11" fontWeight="bold" letterSpacing="3">MAZDA</text>
    </svg>
  );
}

function ToyotaLogo({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 80" className={className} aria-label="Toyota">
      <ellipse cx="40" cy="36" rx="30" ry="20" fill="none" stroke="#CC0000" strokeWidth="2.5"/>
      <ellipse cx="40" cy="36" rx="18" ry="12" fill="none" stroke="#CC0000" strokeWidth="2.5"/>
      <ellipse cx="40" cy="36" rx="8" ry="18" fill="none" stroke="#CC0000" strokeWidth="2.5"/>
      <text x="40" y="64" textAnchor="middle" fill="#CC0000" fontFamily="Arial, sans-serif" fontSize="10" fontWeight="bold" letterSpacing="3">TOYOTA</text>
    </svg>
  );
}

function HondaLogo({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 80" className={className} aria-label="Honda">
      <rect x="16" y="22" width="48" height="36" rx="3" fill="none" stroke="#CC0000" strokeWidth="2.5"/>
      <text x="40" y="46" textAnchor="middle" fill="#CC0000" fontFamily="Arial, sans-serif" fontSize="18" fontWeight="bold" letterSpacing="1">H</text>
      <text x="40" y="68" textAnchor="middle" fill="#1A1A1A" className="dark:fill-gray-300" fontFamily="Arial, sans-serif" fontSize="10" fontWeight="bold" letterSpacing="3">HONDA</text>
    </svg>
  );
}

function HyundaiLogo({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 80" className={className} aria-label="Hyundai">
      <ellipse cx="40" cy="36" rx="28" ry="20" fill="none" stroke="#002C5F" strokeWidth="2.5"/>
      <text x="40" y="42" textAnchor="middle" fill="#002C5F" fontFamily="Arial, sans-serif" fontSize="20" fontWeight="bold" fontStyle="italic">H</text>
      <text x="40" y="66" textAnchor="middle" fill="#002C5F" fontFamily="Arial, sans-serif" fontSize="9" fontWeight="bold" letterSpacing="2">HYUNDAI</text>
    </svg>
  );
}

function KiaLogo({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 80" className={className} aria-label="Kia">
      <rect x="8" y="28" width="64" height="24" rx="12" fill="#05141F" stroke="#05141F" strokeWidth="1"/>
      <text x="40" y="46" textAnchor="middle" fill="#FFFFFF" fontFamily="Arial, sans-serif" fontSize="22" fontWeight="bold" fontStyle="italic" letterSpacing="2">KIA</text>
    </svg>
  );
}

function BMWLogo({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 80" className={className} aria-label="BMW">
      <circle cx="40" cy="38" r="24" fill="#FFFFFF" stroke="#1A1A1A" strokeWidth="3"/>
      <circle cx="40" cy="38" r="20" fill="none" stroke="#1A1A1A" strokeWidth="2"/>
      <path d="M40 18 L40 38 L20 38" fill="#0066B1"/>
      <path d="M40 38 L40 58 L60 38" fill="#0066B1"/>
      <text x="40" y="72" textAnchor="middle" fill="#1A1A1A" className="dark:fill-gray-300" fontFamily="Arial, sans-serif" fontSize="9" fontWeight="bold" letterSpacing="2">BMW</text>
    </svg>
  );
}

const brandLogos = [
  { name: 'Toyota', Logo: ToyotaLogo },
  { name: 'Honda', Logo: HondaLogo },
  { name: 'Ford', Logo: FordLogo },
  { name: 'Chevrolet', Logo: ChevroletLogo },
  { name: 'Nissan', Logo: NissanLogo },
  { name: 'Hyundai', Logo: HyundaiLogo },
  { name: 'GMC', Logo: GMCLogo },
  { name: 'Dodge', Logo: DodgeLogo },
  { name: 'Jeep', Logo: JeepLogo },
  { name: 'Mazda', Logo: MazdaLogo },
  { name: 'Kia', Logo: KiaLogo },
  { name: 'BMW', Logo: BMWLogo },
];

export default function Home() {
  const [isVisible, setIsVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMake, setSelectedMake] = useState('');
  const [selectedPrice, setSelectedPrice] = useState('');
  const { isConnected } = useAccount();
  const t = useTranslations('dealer');

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen theme-gradient-bg">
      <Navbar />
      <NavbarSpacer />

      {/* ════════════════════════════════════════════════════════════
         HERO SECTION — Warm welcome, search-first, trust-building
         ════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden py-16 md:py-24 px-4">
        {/* Ambient background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-80 h-80 bg-am-blue/5 dark:bg-am-blue/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-am-orange/5 dark:bg-am-orange/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-am-green/3 dark:bg-am-green/5 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto max-w-5xl relative z-10 text-center">
          {/* Logo */}
          <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
            <div className="mx-auto mb-8 w-48 md:w-64">
              <Image
                src="/logo-automall.png"
                alt="Autos MALL"
                width={500}
                height={280}
                className="w-full h-auto drop-shadow-2xl"
                priority
              />
            </div>
          </div>

          {/* Welcome text */}
          <div className={`transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4">
              <span className="text-gray-900 dark:text-white">{t('hero.welcome')}</span>
              {' '}
              <span className="text-holographic">Autos MALL</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto">
              {t('hero.tagline')}
            </p>
          </div>

          {/* Search bar — the centerpiece */}
          <div className={`transition-all duration-1000 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <div className="glass-crystal-enhanced rounded-2xl p-4 md:p-6 max-w-3xl mx-auto">
              <div className="flex flex-col md:flex-row gap-3">
                {/* Text search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('hero.searchPlaceholder')}
                    className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-white dark:bg-am-dark/80 border border-gray-200 dark:border-am-blue/30 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-am-orange/50 focus:border-am-orange transition-all text-base"
                  />
                </div>

                {/* Make dropdown */}
                <select
                  value={selectedMake}
                  onChange={(e) => setSelectedMake(e.target.value)}
                  className="px-4 py-3.5 rounded-xl bg-white dark:bg-am-dark/80 border border-gray-200 dark:border-am-blue/30 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-am-orange/50 focus:border-am-orange transition-all text-sm md:w-40"
                >
                  <option value="">{t('search.allMakes')}</option>
                  {brandLogos.map((b) => (
                    <option key={b.name} value={b.name}>{b.name}</option>
                  ))}
                </select>

                {/* Price dropdown */}
                <select
                  value={selectedPrice}
                  onChange={(e) => setSelectedPrice(e.target.value)}
                  className="px-4 py-3.5 rounded-xl bg-white dark:bg-am-dark/80 border border-gray-200 dark:border-am-blue/30 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-am-orange/50 focus:border-am-orange transition-all text-sm md:w-40"
                >
                  <option value="">{t('search.anyPrice')}</option>
                  <option value="0-15000">{t('search.under15k')}</option>
                  <option value="15000-25000">{t('search.15to25k')}</option>
                  <option value="25000-40000">{t('search.25to40k')}</option>
                  <option value="40000+">{t('search.over40k')}</option>
                </select>

                {/* Search button */}
                <Link
                  href="/inventory"
                  className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-am-orange to-am-orange-light hover:from-am-orange-dark hover:to-am-orange text-white px-6 py-3.5 rounded-xl font-bold text-base shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 whitespace-nowrap"
                >
                  <Search className="w-5 h-5" />
                  {t('hero.searchButton')}
                </Link>
              </div>
            </div>
          </div>

          {/* Trust indicators */}
          <div className={`flex flex-wrap justify-center gap-6 mt-8 transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            {[
              { icon: BadgeCheck, text: t('hero.trust1'), color: 'text-am-green' },
              { icon: CreditCard, text: t('hero.trust2'), color: 'text-am-blue dark:text-am-blue-light' },
              { icon: MapPin, text: t('hero.trust3'), color: 'text-am-orange' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <item.icon className={`w-4 h-4 ${item.color}`} />
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
         SHOP BY BRAND — Official logos, uniform sizing
         ════════════════════════════════════════════════════════════ */}
      <section className="py-12 md:py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {t('brands.title')}
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              {t('brands.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {brandLogos.map((brand) => (
              <Link
                key={brand.name}
                href="/inventory"
                className="glass-crystal rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:scale-105 hover:shadow-lg transition-all duration-300 group cursor-pointer"
              >
                <div className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center">
                  <brand.Logo className="w-full h-full" />
                </div>
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 group-hover:text-am-orange dark:group-hover:text-am-orange-light transition-colors">
                  {brand.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
         WHY AUTOS MALL — Trust building, anxiety reduction
         ════════════════════════════════════════════════════════════ */}
      <section className="py-16 md:py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {t('why.title')}
            </h2>
            <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              {t('why.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Shield,
                title: t('why.inspected'),
                desc: t('why.inspectedDesc'),
                color: 'text-am-green',
                bg: 'bg-am-green/10 dark:bg-am-green/20',
              },
              {
                icon: DollarSign,
                title: t('why.transparent'),
                desc: t('why.transparentDesc'),
                color: 'text-am-blue dark:text-am-blue-light',
                bg: 'bg-am-blue/10 dark:bg-am-blue/20',
              },
              {
                icon: CreditCard,
                title: t('why.financing'),
                desc: t('why.financingDesc'),
                color: 'text-am-orange',
                bg: 'bg-am-orange/10 dark:bg-am-orange/20',
              },
              {
                icon: Heart,
                title: t('why.support'),
                desc: t('why.supportDesc'),
                color: 'text-pink-500',
                bg: 'bg-pink-500/10 dark:bg-pink-500/20',
              },
            ].map((item, i) => (
              <div key={i} className="glass-crystal rounded-2xl p-6 text-center hover:scale-[1.02] transition-all duration-300">
                <div className={`w-14 h-14 rounded-2xl ${item.bg} flex items-center justify-center mx-auto mb-4`}>
                  <item.icon className={`w-7 h-7 ${item.color}`} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
         FEATURED VEHICLES — Coming soon placeholder
         ════════════════════════════════════════════════════════════ */}
      <section className="py-16 md:py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {t('featured.title')}
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              {t('featured.subtitle')}
            </p>
          </div>

          <div className="glass-crystal-enhanced rounded-3xl p-8 md:p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-am-orange/10 dark:bg-am-orange/20 flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-10 h-10 text-am-orange" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
              {t('featured.comingSoon')}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
              {t('featured.comingSoonDesc')}
            </p>
            <button
              className="inline-flex items-center gap-2 bg-gradient-to-r from-am-blue to-am-blue-light hover:from-am-blue-dark hover:to-am-blue text-white px-6 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
            >
              <Bell className="w-4 h-4" />
              {t('featured.getNotified')}
            </button>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
         TESTIMONIALS — Social proof, real human stories
         ════════════════════════════════════════════════════════════ */}
      <section className="py-16 md:py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {t('testimonials.title')}
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              {t('testimonials.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: t('testimonials.t1Name'),
                text: t('testimonials.t1Text'),
                role: t('testimonials.t1Role'),
                gradient: 'from-am-blue to-am-green',
              },
              {
                name: t('testimonials.t2Name'),
                text: t('testimonials.t2Text'),
                role: t('testimonials.t2Role'),
                gradient: 'from-am-orange to-am-blue',
              },
              {
                name: t('testimonials.t3Name'),
                text: t('testimonials.t3Text'),
                role: t('testimonials.t3Role'),
                gradient: 'from-am-green to-am-orange',
              },
            ].map((testimonial, i) => (
              <div key={i} className="glass-crystal rounded-2xl p-6 flex flex-col">
                {/* Stars */}
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-am-orange fill-am-orange" />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed flex-1 mb-4">
                  &ldquo;{testimonial.text}&rdquo;
                </p>

                {/* Author */}
                <div className="flex items-center gap-3 pt-4 border-t border-gray-200/50 dark:border-am-blue/20">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${testimonial.gradient} flex items-center justify-center text-white font-bold text-sm`}>
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white text-sm">{testimonial.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
         FINAL CTA — Low friction, multiple contact options
         ════════════════════════════════════════════════════════════ */}
      <section className="py-16 md:py-24 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="glass-crystal-enhanced rounded-3xl p-8 md:p-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {t('cta.title')}
            </h2>
            <p className="text-lg text-gray-500 dark:text-gray-400 mb-8 max-w-xl mx-auto">
              {t('cta.subtitle')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/inventory"
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-am-orange to-am-orange-light hover:from-am-orange-dark hover:to-am-orange text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
              >
                {t('cta.browse')}
                <ArrowRight className="w-5 h-5" />
              </Link>

              <a
                href="mailto:info@autosmall.com"
                className="inline-flex items-center justify-center gap-2 glass-button px-8 py-4 rounded-xl font-bold text-lg"
              >
                <MessageCircle className="w-5 h-5" />
                {t('cta.contact')}
              </a>

              <a
                href="tel:+1-832-000-0000"
                className="inline-flex items-center justify-center gap-2 glass-button px-8 py-4 rounded-xl font-bold text-lg"
              >
                <Phone className="w-5 h-5" />
                {t('cta.phone')}
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
