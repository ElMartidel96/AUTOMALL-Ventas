'use client';

/**
 * Seller Onboarding Wizard
 *
 * Multi-step wizard for sellers to create their professional
 * subdomain landing page. Steps:
 * 1. Choose handle (URL)
 * 2. Business info (name, phone, email, etc.)
 * 3. Branding (logo, hero image, social links)
 * 4. Preview & launch
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Navbar, NavbarSpacer } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useAccount } from '@/lib/thirdweb';
import { ConnectButtonDAO } from '@/components/thirdweb/ConnectButtonDAO';
import { useSellerProfile } from '@/hooks/useSellerProfile';
import { useUser } from '@/hooks/useUser';
import { APP_DOMAIN, FEATURE_SELLER_SUBDOMAINS } from '@/lib/config/features';
import { ImageUploadField } from '@/components/ui/ImageUploadField';
import {
  Globe,
  Building2,
  Palette,
  Eye,
  Check,
  Loader2,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Rocket,
  ExternalLink,
  LayoutDashboard,
  Car,
} from 'lucide-react';

interface OnboardingData {
  handle: string;
  business_name: string;
  tagline: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  logo_url: string;
  hero_image_url: string;
  social_instagram: string;
  social_facebook: string;
  social_tiktok: string;
}

const INITIAL_DATA: OnboardingData = {
  handle: '',
  business_name: '',
  tagline: '',
  phone: '',
  whatsapp: '',
  email: '',
  address: '',
  logo_url: '',
  hero_image_url: '',
  social_instagram: '',
  social_facebook: '',
  social_tiktok: '',
};

const STEPS = ['handle', 'business', 'branding', 'preview'] as const;
type Step = typeof STEPS[number];

export default function OnboardingPage() {
  const t = useTranslations('onboarding');
  const router = useRouter();
  const { address, isConnected } = useAccount();

  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<OnboardingData>(INITIAL_DATA);
  const [handleStatus, setHandleStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'reserved'>('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successHandle, setSuccessHandle] = useState('');
  const [mounted, setMounted] = useState(false);
  const whatsappManuallyEdited = useRef(false);
  const [useLogoAsHero, setUseLogoAsHero] = useState(false);

  // Detect if user already has a seller profile → redirect
  const { seller: existingSeller, isLoading: profileLoading } = useSellerProfile();
  const { user, isLoading: userLoading } = useUser();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && existingSeller?.onboarding_completed) {
      router.push('/dashboard');
    }
  }, [mounted, existingSeller, router]);

  // Buyers shouldn't be on onboarding — redirect to home
  useEffect(() => {
    if (mounted && !userLoading && user?.role === 'buyer') {
      router.push('/');
    }
  }, [mounted, userLoading, user, router]);

  // Check handle availability with debounce
  const checkHandle = useCallback(async (handle: string) => {
    if (handle.length < 3) {
      setHandleStatus('idle');
      return;
    }

    setHandleStatus('checking');

    try {
      const res = await fetch(`/api/sellers/check-handle?handle=${encodeURIComponent(handle)}`);
      const result = await res.json();

      if (result.available) {
        setHandleStatus('available');
      } else if (result.reason?.includes('reserved')) {
        setHandleStatus('reserved');
      } else if (result.reason?.includes('format') || result.reason?.includes('Invalid')) {
        setHandleStatus('invalid');
      } else {
        setHandleStatus('taken');
      }
    } catch {
      setHandleStatus('idle');
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (data.handle.length >= 3) {
        checkHandle(data.handle);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [data.handle, checkHandle]);

  const updateData = (field: keyof OnboardingData, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const canProceed = (): boolean => {
    switch (STEPS[currentStep]) {
      case 'handle':
        return handleStatus === 'available';
      case 'business':
        return data.business_name.trim().length >= 2
          && data.phone.replace(/\D/g, '').length >= 10;
      case 'branding':
        return true; // Optional step
      case 'preview':
        return true;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    if (!address) return;

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/sellers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: address,
          handle: data.handle,
          business_name: data.business_name,
          tagline: data.tagline || undefined,
          phone: data.phone || undefined,
          whatsapp: data.whatsapp || undefined,
          email: data.email || undefined,
          address: data.address || undefined,
          logo_url: data.logo_url || undefined,
          hero_image_url: data.hero_image_url || undefined,
          social_instagram: data.social_instagram || undefined,
          social_facebook: data.social_facebook || undefined,
          social_tiktok: data.social_tiktok || undefined,
          onboarding_completed: true,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        // Handle duplicate profile (409) with clear message
        if (res.status === 409) {
          setError(t('errors.alreadyExists'));
          return;
        }
        setError(result.error || 'Failed to create seller profile');
        return;
      }

      setSuccessHandle(data.handle);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (currentStep === STEPS.length - 1) {
      handleSubmit();
    } else {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  // Not mounted yet or checking existing profile / user role
  if (!mounted || profileLoading || userLoading) return null;

  // Buyer shouldn't be here (useEffect handles redirect)
  if (user?.role === 'buyer') return null;

  // Already onboarded — redirecting (useEffect handles it)
  if (existingSeller?.onboarding_completed) return null;

  // Success state — profile was just created
  if (successHandle) {
    const siteUrl = `https://${successHandle}.${APP_DOMAIN}`;

    return (
      <div className="min-h-screen theme-gradient-bg">
        <Navbar />
        <NavbarSpacer />
        <div className="flex items-center justify-center py-20 px-4">
          <div className="glass-crystal-enhanced rounded-3xl p-8 md:p-12 max-w-lg w-full text-center">
            <div className="w-20 h-20 rounded-full bg-am-green/20 flex items-center justify-center mx-auto mb-6">
              <Rocket className="w-10 h-10 text-am-green" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
              {t('success.title')}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {t('success.description')}
            </p>

            {/* Show subdomain URL */}
            <div className="bg-gray-50 dark:bg-am-blue/10 rounded-xl p-4 mb-6">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                {t('success.yourUrl')}
              </p>
              <p className="text-am-orange font-bold text-lg break-all">
                {siteUrl}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {FEATURE_SELLER_SUBDOMAINS ? (
                <a
                  href={siteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-am-orange to-am-orange-light text-white px-6 py-3.5 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                >
                  <ExternalLink className="w-5 h-5" />
                  {t('success.visitSite')}
                </a>
              ) : (
                <button
                  onClick={() => router.push('/dashboard')}
                  className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-am-orange to-am-orange-light text-white px-6 py-3.5 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                >
                  <LayoutDashboard className="w-5 h-5" />
                  {t('success.goToDashboard')}
                </button>
              )}
              <button
                onClick={() => router.push('/inventory')}
                className="inline-flex items-center justify-center gap-2 glass-button px-6 py-3.5 rounded-xl font-bold"
              >
                <Car className="w-5 h-5" />
                {t('success.addVehicles')}
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Not connected — require login
  if (!isConnected || !address) {
    return (
      <div className="min-h-screen theme-gradient-bg">
        <Navbar />
        <NavbarSpacer />
        <div className="flex items-center justify-center py-20 px-4">
          <div className="glass-crystal-enhanced rounded-3xl p-8 md:p-12 max-w-lg w-full text-center">
            <Building2 className="w-16 h-16 text-am-blue dark:text-am-blue-light mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {t('title')}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8">
              {t('requiresLogin')}
            </p>
            <ConnectButtonDAO />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const stepIcons = [Globe, Building2, Palette, Eye];

  return (
    <div className="min-h-screen theme-gradient-bg">
      <Navbar />
      <NavbarSpacer />

      <div className="container mx-auto max-w-2xl px-4 py-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('title')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {t('subtitle')}
          </p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((step, i) => {
            const Icon = stepIcons[i];
            const isActive = i === currentStep;
            const isComplete = i < currentStep;

            return (
              <div key={step} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isComplete
                      ? 'bg-am-green text-white'
                      : isActive
                      ? 'bg-am-orange text-white shadow-lg scale-110'
                      : 'bg-gray-200 dark:bg-am-blue/20 text-gray-400 dark:text-gray-500'
                  }`}
                >
                  {isComplete ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-8 h-0.5 mx-1 transition-colors ${
                    isComplete ? 'bg-am-green' : 'bg-gray-200 dark:bg-am-blue/20'
                  }`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step content */}
        <div className="glass-crystal-enhanced rounded-2xl p-6 md:p-8">
          {/* Step 1: Handle */}
          {STEPS[currentStep] === 'handle' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  {t('steps.handle.title')}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('steps.handle.description')}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('steps.handle.label')}
                </label>
                <div className="flex items-center gap-0">
                  <input
                    type="text"
                    value={data.handle}
                    onChange={(e) => updateData('handle', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder={t('steps.handle.placeholder')}
                    maxLength={30}
                    className="flex-1 px-4 py-3 rounded-l-xl bg-white dark:bg-am-dark/80 border border-r-0 border-gray-200 dark:border-am-blue/30 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-am-orange/50 text-lg"
                  />
                  <span className="px-3 py-3 bg-gray-100 dark:bg-am-blue/20 border border-l-0 border-gray-200 dark:border-am-blue/30 rounded-r-xl text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    .{APP_DOMAIN}
                  </span>
                </div>

                {/* Status indicator */}
                <div className="mt-2 text-sm flex items-center gap-1.5">
                  {handleStatus === 'checking' && (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-am-blue" />
                      <span className="text-gray-500">{t('steps.handle.checking')}</span>
                    </>
                  )}
                  {handleStatus === 'available' && (
                    <>
                      <Check className="w-4 h-4 text-am-green" />
                      <span className="text-am-green font-medium">{t('steps.handle.available')}</span>
                    </>
                  )}
                  {handleStatus === 'taken' && (
                    <>
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span className="text-red-500">{t('steps.handle.taken')}</span>
                    </>
                  )}
                  {handleStatus === 'invalid' && (
                    <>
                      <AlertCircle className="w-4 h-4 text-amber-500" />
                      <span className="text-amber-500">{t('steps.handle.invalid')}</span>
                    </>
                  )}
                  {handleStatus === 'reserved' && (
                    <>
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span className="text-red-500">{t('steps.handle.reserved')}</span>
                    </>
                  )}
                </div>

                {data.handle.length >= 3 && handleStatus === 'available' && (
                  <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                    {t('steps.handle.preview')}{' '}
                    <span className="font-bold text-am-orange">
                      {data.handle}.{APP_DOMAIN}
                    </span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Business Info */}
          {STEPS[currentStep] === 'business' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  {t('steps.business.title')}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('steps.business.description')}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('steps.business.name')} *
                  </label>
                  <input
                    type="text"
                    value={data.business_name}
                    onChange={(e) => updateData('business_name', e.target.value)}
                    placeholder={t('steps.business.namePlaceholder')}
                    className="w-full px-4 py-3 rounded-xl bg-white dark:bg-am-dark/80 border border-gray-200 dark:border-am-blue/30 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-am-orange/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('steps.business.tagline')}
                  </label>
                  <input
                    type="text"
                    value={data.tagline}
                    onChange={(e) => updateData('tagline', e.target.value)}
                    placeholder={t('steps.business.taglinePlaceholder')}
                    className="w-full px-4 py-3 rounded-xl bg-white dark:bg-am-dark/80 border border-gray-200 dark:border-am-blue/30 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-am-orange/50"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('steps.business.phone')} *
                    </label>
                    <input
                      type="tel"
                      value={data.phone}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!whatsappManuallyEdited.current) {
                          setData(prev => ({ ...prev, phone: val, whatsapp: val.replace(/\D/g, '') }));
                        } else {
                          updateData('phone', val);
                        }
                      }}
                      placeholder={t('steps.business.phonePlaceholder')}
                      className={`w-full px-4 py-3 rounded-xl bg-white dark:bg-am-dark/80 border text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-am-orange/50 ${
                        data.phone && data.phone.replace(/\D/g, '').length < 10
                          ? 'border-red-300 dark:border-red-500/50'
                          : 'border-gray-200 dark:border-am-blue/30'
                      }`}
                    />
                    <p className="text-xs text-gray-400 mt-1">{t('steps.business.phoneHelp')}</p>
                    {data.phone && data.phone.replace(/\D/g, '').length < 10 && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {t('steps.business.phoneInvalid')}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('steps.business.whatsapp')}
                    </label>
                    <input
                      type="tel"
                      value={data.whatsapp}
                      onChange={(e) => {
                        whatsappManuallyEdited.current = true;
                        updateData('whatsapp', e.target.value);
                      }}
                      placeholder={t('steps.business.whatsappPlaceholder')}
                      className="w-full px-4 py-3 rounded-xl bg-white dark:bg-am-dark/80 border border-gray-200 dark:border-am-blue/30 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-am-orange/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('steps.business.email')}
                  </label>
                  <input
                    type="email"
                    value={data.email}
                    onChange={(e) => updateData('email', e.target.value)}
                    placeholder={t('steps.business.emailPlaceholder')}
                    className="w-full px-4 py-3 rounded-xl bg-white dark:bg-am-dark/80 border border-gray-200 dark:border-am-blue/30 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-am-orange/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('steps.business.address')}
                  </label>
                  <input
                    type="text"
                    value={data.address}
                    onChange={(e) => updateData('address', e.target.value)}
                    placeholder={t('steps.business.addressPlaceholder')}
                    className="w-full px-4 py-3 rounded-xl bg-white dark:bg-am-dark/80 border border-gray-200 dark:border-am-blue/30 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-am-orange/50"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Branding */}
          {STEPS[currentStep] === 'branding' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  {t('steps.branding.title')}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('steps.branding.description')}
                </p>
              </div>

              {/* Logo Upload */}
              {address && (
                <ImageUploadField
                  label={t('steps.branding.logo')}
                  help={t('steps.branding.logoHelp')}
                  currentUrl={data.logo_url || undefined}
                  uploadEndpoint="/api/profile/avatar"
                  walletAddress={address}
                  compressOptions={{ maxWidth: 500, maxHeight: 500, preserveTransparency: true }}
                  previewAspect="square"
                  onUploadComplete={(url) => {
                    updateData('logo_url', url);
                    if (useLogoAsHero) {
                      updateData('hero_image_url', url);
                    }
                  }}
                  strings={{
                    dragOrClick: t('steps.branding.dragOrClick'),
                    compressing: t('steps.branding.compressing'),
                    uploading: t('steps.branding.uploadingImage'),
                    success: t('steps.branding.uploadSuccess'),
                    error: t('steps.branding.uploadError'),
                    change: t('steps.branding.changeImage'),
                  }}
                />
              )}

              {/* Hero Image Upload */}
              {address && (
                <div className="space-y-3">
                  <ImageUploadField
                    label={t('steps.branding.heroImage')}
                    help={t('steps.branding.heroImageHelp')}
                    currentUrl={data.hero_image_url || undefined}
                    uploadEndpoint="/api/upload/hero"
                    walletAddress={address}
                    compressOptions={{ maxWidth: 1920, maxHeight: 1080, preserveTransparency: false }}
                    previewAspect="wide"
                    disabled={useLogoAsHero}
                    onUploadComplete={(url) => updateData('hero_image_url', url)}
                    strings={{
                      dragOrClick: t('steps.branding.dragOrClick'),
                      compressing: t('steps.branding.compressing'),
                      uploading: t('steps.branding.uploadingImage'),
                      success: t('steps.branding.uploadSuccess'),
                      error: t('steps.branding.uploadError'),
                      change: t('steps.branding.changeImage'),
                    }}
                  />

                  {/* Checkbox: use logo as background */}
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={useLogoAsHero}
                      onChange={(e) => {
                        setUseLogoAsHero(e.target.checked);
                        if (e.target.checked && data.logo_url) {
                          updateData('hero_image_url', data.logo_url);
                        } else if (!e.target.checked) {
                          updateData('hero_image_url', '');
                        }
                      }}
                      className="w-5 h-5 rounded-lg border-2 border-gray-300 dark:border-gray-600 text-am-orange focus:ring-am-orange/50 accent-am-orange"
                    />
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-am-orange transition-colors">
                        {t('steps.branding.useLogoAsHero')}
                      </span>
                      <p className="text-xs text-gray-400">{t('steps.branding.useLogoAsHeroHint')}</p>
                    </div>
                  </label>
                </div>
              )}

              {/* Social Media */}
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  {t('steps.branding.socialTitle')}
                </p>
                <div className="space-y-3">
                  <input
                    type="url"
                    value={data.social_instagram}
                    onChange={(e) => updateData('social_instagram', e.target.value)}
                    placeholder={t('steps.branding.instagram')}
                    className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-am-dark/80 border border-gray-200 dark:border-am-blue/30 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-am-orange/50 text-sm"
                  />
                  <input
                    type="url"
                    value={data.social_facebook}
                    onChange={(e) => updateData('social_facebook', e.target.value)}
                    placeholder={t('steps.branding.facebook')}
                    className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-am-dark/80 border border-gray-200 dark:border-am-blue/30 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-am-orange/50 text-sm"
                  />
                  <input
                    type="url"
                    value={data.social_tiktok}
                    onChange={(e) => updateData('social_tiktok', e.target.value)}
                    placeholder={t('steps.branding.tiktok')}
                    className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-am-dark/80 border border-gray-200 dark:border-am-blue/30 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-am-orange/50 text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Preview */}
          {STEPS[currentStep] === 'preview' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  {t('steps.preview.title')}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('steps.preview.description')}
                </p>
              </div>

              {/* Preview card */}
              <div className="rounded-xl border border-gray-200 dark:border-am-blue/30 overflow-hidden">
                {/* Mini browser bar */}
                <div className="bg-gray-100 dark:bg-am-blue/10 px-4 py-2 flex items-center gap-2 border-b border-gray-200 dark:border-am-blue/20">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 bg-white dark:bg-am-dark/80 rounded-md px-3 py-1 text-xs text-gray-500 dark:text-gray-400 text-center">
                    {data.handle}.{APP_DOMAIN}
                  </div>
                </div>

                {/* Preview content */}
                <div className="p-6 bg-white dark:bg-am-dark/50">
                  <div className="flex items-center gap-4 mb-4">
                    {data.logo_url ? (
                      <Image
                        src={data.logo_url}
                        alt={data.business_name}
                        width={60}
                        height={60}
                        className="w-15 h-15 rounded-xl object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-15 h-15 rounded-xl bg-gradient-to-br from-am-blue to-am-orange flex items-center justify-center">
                        <Building2 className="w-8 h-8 text-white" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {data.business_name || 'Your Business'}
                      </h3>
                      {data.tagline && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">{data.tagline}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {data.phone && (
                      <div className="text-gray-600 dark:text-gray-300">
                        <span className="text-gray-400">Tel:</span> {data.phone}
                      </div>
                    )}
                    {data.email && (
                      <div className="text-gray-600 dark:text-gray-300">
                        <span className="text-gray-400">Email:</span> {data.email}
                      </div>
                    )}
                    {data.address && (
                      <div className="text-gray-600 dark:text-gray-300 col-span-2">
                        <span className="text-gray-400">Dir:</span> {data.address}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 dark:bg-red-900/20 rounded-xl p-3">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-am-blue/20">
            {currentStep > 0 ? (
              <button
                onClick={prevStep}
                className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-am-orange transition-colors font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('back')}
              </button>
            ) : (
              <div />
            )}

            <button
              onClick={nextStep}
              disabled={!canProceed() || isSubmitting}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-am-orange to-am-orange-light hover:from-am-orange-dark hover:to-am-orange text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('steps.preview.looksGood')}
                </>
              ) : currentStep === STEPS.length - 1 ? (
                <>
                  <Rocket className="w-4 h-4" />
                  {t('finish')}
                </>
              ) : (
                <>
                  {t('next')}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
