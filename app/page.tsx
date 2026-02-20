'use client';

/**
 * Autos MALL - Landing Page
 *
 * Professional landing page for the AI-powered car sales platform.
 * Glass morphism design system with AM brand colors.
 * i18n: Full bilingual support (EN/ES)
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import { Navbar, NavbarSpacer } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useAccount } from '@/lib/thirdweb';
import {
  Users,
  Zap,
  Shield,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Star,
  Car,
  MessageSquare,
  BarChart3,
  Globe,
  UserPlus,
  Bot,
  Layout,
  TrendingUp,
  Target,
} from 'lucide-react';

export default function Home() {
  const [isVisible, setIsVisible] = useState(false);
  const router = useRouter();
  const { isConnected } = useAccount();
  const t = useTranslations('landing');

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Car brand logos from reference images
  const carBrands = [
    { name: 'Chevrolet', color: 'from-yellow-500 to-yellow-600' },
    { name: 'Ford', color: 'from-blue-600 to-blue-700' },
    { name: 'GMC', color: 'from-red-600 to-red-700' },
    { name: 'Dodge', color: 'from-gray-600 to-gray-700' },
    { name: 'Jeep', color: 'from-green-600 to-green-700' },
    { name: 'Nissan', color: 'from-gray-500 to-gray-600' },
    { name: 'Mazda', color: 'from-red-500 to-red-600' },
    { name: 'Toyota', color: 'from-red-600 to-red-700' },
  ];

  return (
    <div className="min-h-screen theme-gradient-bg">
      <Navbar />
      <NavbarSpacer />

      {/* ====================================================
         HERO SECTION
         ==================================================== */}
      <section className="relative overflow-hidden py-12 md:py-20 px-4">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-am-blue/5 dark:bg-am-blue/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-am-orange/5 dark:bg-am-orange/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-am-green/3 dark:bg-am-green/5 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Text */}
            <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-am-orange/10 dark:bg-am-orange/20 text-am-orange dark:text-am-orange-light px-4 py-1.5 rounded-full text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                {t('hero.badge')}
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                <span className="text-gray-900 dark:text-white">{t('hero.titleLine1')}</span>
                <br />
                <span className="text-holographic">{t('hero.titleLine2')}</span>
              </h1>

              {/* Subtitle */}
              <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-lg">
                {t('hero.subtitle')}
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link
                  href={isConnected ? '/dashboard' : '#'}
                  onClick={(e) => {
                    if (!isConnected) {
                      e.preventDefault();
                      // Trigger login modal via ConnectButton
                      const btn = document.querySelector('[data-connect-button]') as HTMLButtonElement;
                      btn?.click();
                    }
                  }}
                  className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-am-blue to-am-blue-light hover:from-am-blue-dark hover:to-am-blue text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
                >
                  {t('hero.ctaPrimary')}
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/docs"
                  className="inline-flex items-center justify-center gap-2 glass-button px-8 py-4 rounded-xl font-bold text-lg"
                >
                  {t('hero.ctaSecondary')}
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap gap-6">
                {[
                  { icon: Shield, text: t('hero.trust1') },
                  { icon: Globe, text: t('hero.trust2') },
                  { icon: Zap, text: t('hero.trust3') },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <item.icon className="w-4 h-4 text-am-green" />
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column - Hero Visual */}
            <div className={`transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <div className="relative">
                {/* Main logo display with glass effect */}
                <div className="glass-crystal-enhanced rounded-3xl p-8 md:p-12 text-center">
                  <div className="relative w-full max-w-md mx-auto">
                    <Image
                      src="/logo-automall.png"
                      alt="Autos MALL"
                      width={500}
                      height={280}
                      className="w-full h-auto drop-shadow-2xl"
                      priority
                    />
                  </div>
                  {/* Floating particles */}
                  <div className="absolute top-4 right-4 w-3 h-3 bg-am-blue rounded-full float opacity-60"></div>
                  <div className="absolute bottom-8 left-4 w-2 h-2 bg-am-orange rounded-full float opacity-60" style={{ animationDelay: '1s' }}></div>
                  <div className="absolute top-1/2 right-8 w-2 h-2 bg-am-green rounded-full float opacity-60" style={{ animationDelay: '2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================
         STATS SECTION
         ==================================================== */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="glass-crystal-enhanced rounded-2xl p-6 md:p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {[
                { value: '150+', label: t('stats.sellers'), color: 'text-am-blue dark:text-am-blue-light' },
                { value: '2,400+', label: t('stats.listings'), color: 'text-am-orange dark:text-am-orange-light' },
                { value: '8,500+', label: t('stats.clients'), color: 'text-am-green dark:text-am-green-light' },
                { value: '95%', label: t('stats.satisfaction'), color: 'text-am-blue dark:text-am-blue-light' },
              ].map((stat, i) => (
                <div key={i}>
                  <div className={`text-2xl md:text-3xl font-bold ${stat.color}`}>{stat.value}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================
         PROBLEM / SOLUTION SECTION
         ==================================================== */}
      <section className="py-16 md:py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {t('problem.title')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Problems */}
            <div className="glass-crystal rounded-2xl p-6 md:p-8 border-l-4 border-red-500">
              <h3 className="text-xl font-bold text-red-500 dark:text-red-400 mb-6 flex items-center gap-2">
                <Target className="w-5 h-5" />
                {t('problem.problemTitle')}
              </h3>
              <ul className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-red-400 mt-0.5">&#10005;</span>
                    <span className="text-gray-600 dark:text-gray-300">{t(`problem.problem${i}`)}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Solutions */}
            <div className="glass-crystal rounded-2xl p-6 md:p-8 border-l-4 border-am-green">
              <h3 className="text-xl font-bold text-am-green dark:text-am-green-light mb-6 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                {t('problem.solutionTitle')}
              </h3>
              <ul className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-am-green mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600 dark:text-gray-300">{t(`problem.solution${i}`)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================
         HOW IT WORKS
         ==================================================== */}
      <section className="py-16 md:py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {t('howItWorks.title')}
            </h2>
            <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              {t('howItWorks.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connector lines (desktop only) */}
            <div className="hidden md:block absolute top-16 left-[33%] right-[33%] h-0.5 bg-gradient-to-r from-am-blue via-am-orange to-am-green opacity-30"></div>

            {[
              {
                step: '01',
                icon: UserPlus,
                title: t('howItWorks.step1Title'),
                desc: t('howItWorks.step1Desc'),
                color: 'from-am-blue to-am-blue-light',
                iconColor: 'text-am-blue',
              },
              {
                step: '02',
                icon: Car,
                title: t('howItWorks.step2Title'),
                desc: t('howItWorks.step2Desc'),
                color: 'from-am-orange to-am-orange-light',
                iconColor: 'text-am-orange',
              },
              {
                step: '03',
                icon: TrendingUp,
                title: t('howItWorks.step3Title'),
                desc: t('howItWorks.step3Desc'),
                color: 'from-am-green to-am-green-light',
                iconColor: 'text-am-green',
              },
            ].map((item, i) => (
              <div key={i} className="glass-crystal-enhanced rounded-2xl p-6 text-center relative">
                {/* Step badge */}
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center text-white font-bold text-lg mx-auto mb-4 shadow-lg`}>
                  {item.step}
                </div>
                <item.icon className={`w-8 h-8 ${item.iconColor} mx-auto mb-4`} />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====================================================
         FEATURES SECTION
         ==================================================== */}
      <section className="py-16 md:py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {t('features.title')}
            </h2>
            <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              {t('features.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Bot, title: t('features.f1Title'), desc: t('features.f1Desc'), color: 'text-am-blue' },
              { icon: MessageSquare, title: t('features.f2Title'), desc: t('features.f2Desc'), color: 'text-am-green' },
              { icon: Layout, title: t('features.f3Title'), desc: t('features.f3Desc'), color: 'text-am-orange' },
              { icon: BarChart3, title: t('features.f4Title'), desc: t('features.f4Desc'), color: 'text-am-blue-light' },
              { icon: Users, title: t('features.f5Title'), desc: t('features.f5Desc'), color: 'text-am-green' },
              { icon: Shield, title: t('features.f6Title'), desc: t('features.f6Desc'), color: 'text-am-orange' },
            ].map((feat, i) => (
              <div key={i} className="glass-crystal rounded-xl p-6 hover:scale-[1.02] transition-transform duration-300">
                <feat.icon className={`w-8 h-8 ${feat.color} mb-4`} />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{feat.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====================================================
         CAR BRANDS SHOWCASE
         ==================================================== */}
      <section className="py-16 md:py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {t('brands.title')}
            </h2>
            <p className="text-lg text-gray-500 dark:text-gray-400">
              {t('brands.subtitle')}
            </p>
          </div>

          <div className="glass-crystal-enhanced rounded-2xl p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {carBrands.map((brand, i) => (
                <div
                  key={i}
                  className="glass-crystal rounded-xl p-4 text-center hover:scale-105 transition-transform duration-300 cursor-default"
                >
                  <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${brand.color} flex items-center justify-center mx-auto mb-3 shadow-md`}>
                    <Car className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{brand.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================
         FINAL CTA SECTION
         ==================================================== */}
      <section className="py-16 md:py-24 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="glass-crystal-enhanced rounded-3xl p-8 md:p-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {t('cta.title')}
            </h2>
            <p className="text-lg text-gray-500 dark:text-gray-400 mb-8 max-w-xl mx-auto">
              {t('cta.subtitle')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link
                href={isConnected ? '/dashboard' : '#'}
                onClick={(e) => {
                  if (!isConnected) {
                    e.preventDefault();
                    const btn = document.querySelector('[data-connect-button]') as HTMLButtonElement;
                    btn?.click();
                  }
                }}
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-am-orange to-am-orange-light hover:from-am-orange-dark hover:to-am-orange text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
              >
                {t('cta.button')}
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            {/* Social proof */}
            <div className="flex items-center justify-center gap-4">
              <div className="flex -space-x-2">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-am-blue to-am-orange border-2 border-white dark:border-am-dark"
                  ></div>
                ))}
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-am-orange fill-am-orange" />
                  ))}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('cta.socialProof')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
