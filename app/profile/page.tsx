'use client';

/**
 * Seller Profile Page
 *
 * Manages the seller's dealership profile (reads/writes to `sellers` table).
 * Replaces the legacy CryptoGift user_profiles page.
 */

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Navbar, NavbarSpacer } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useAccount } from '@/lib/thirdweb';
import { useSellerProfile } from '@/hooks/useSellerProfile';
import { useUser } from '@/hooks/useUser';
import type { Seller } from '@/lib/types/seller';
import type { UserRole } from '@/lib/types/user';
import { isDealerRole } from '@/lib/types/user';
import {
  Store,
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  Camera,
  Check,
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  Image as ImageIcon,
  ShoppingCart,
  Search,
} from 'lucide-react';

// Social icons
const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
  </svg>
);

const FacebookIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
  </svg>
);

export default function ProfilePage() {
  const t = useTranslations('profile');
  const tCommon = useTranslations('common');
  const tRoles = useTranslations('roles');
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { seller, isLoading, isOnboarded, completionPercentage, missingFields, refetch } = useSellerProfile();
  const { user, role, isDealer, isLoading: userLoading, updateRole } = useUser();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted || isLoading || userLoading) {
    return <ProfileSkeleton />;
  }

  if (!isConnected || !address) {
    return (
      <>
        <Navbar />
        <NavbarSpacer />
        <div className="min-h-screen theme-gradient-bg flex items-center justify-center p-4">
          <div className="glass-crystal-enhanced rounded-2xl p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-am-orange to-am-orange-light flex items-center justify-center">
              <Store className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {tCommon('pleaseConnectWallet')}
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              {t('connectPrompt')}
            </p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  // Dealer without seller profile → redirect to onboarding
  if (isDealer && !seller) {
    return (
      <>
        <Navbar />
        <NavbarSpacer />
        <div className="min-h-screen theme-gradient-bg flex items-center justify-center p-4">
          <div className="glass-crystal-enhanced rounded-2xl p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-am-blue to-am-blue-light flex items-center justify-center">
              <Store className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {t('noProfile')}
            </h2>
            <Link
              href="/onboarding"
              className="mt-4 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-am-orange to-am-orange-light text-white font-bold hover:shadow-lg transition-all"
            >
              {t('setupCta')}
            </Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <NavbarSpacer />
      <div className="min-h-screen theme-gradient-bg">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t('title')}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">{t('subtitle')}</p>
          </div>

          {/* Role Selector */}
          <RoleChanger
            currentRole={role}
            onChangeRole={async (newRole) => {
              const { needs_onboarding } = await updateRole(newRole);
              if (isDealerRole(newRole) && needs_onboarding) {
                router.push('/onboarding');
              }
            }}
            tRoles={tRoles}
          />

          {/* Dealer-specific: URL + completion + seller form */}
          {isDealer && seller && (
            <>
              {/* Top bar: URL + completion */}
              <div className="glass-crystal-enhanced rounded-2xl p-5 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Subdomain URL */}
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">{t('yourUrl')}</p>
                    <a
                      href={`https://${seller.handle}.autosmall.org`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-am-blue dark:text-am-blue-light font-semibold hover:underline"
                    >
                      {seller.handle}.autosmall.org
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {/* Completion */}
                  <div className="sm:text-right min-w-[180px]">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                      {t('completion')}
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-am-orange to-am-orange-light transition-all duration-500"
                          style={{ width: `${completionPercentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{completionPercentage}%</span>
                    </div>
                    {completionPercentage < 100 && (
                      <p className="text-xs text-gray-400 mt-1">{t('completionHint')}</p>
                    )}
                  </div>
                </div>

                {/* Member since */}
                {seller.created_at && (
                  <p className="text-xs text-gray-400 mt-3">
                    {t('memberSince')} {new Date(seller.created_at).toLocaleDateString()}
                  </p>
                )}
              </div>

              {/* Profile edit form */}
              <SellerForm seller={seller} address={address} refetch={refetch} t={t} />
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}

/* ─────────────────────────────────────────────
   Role Changer
   ───────────────────────────────────────────── */

const ROLE_CONFIG: { role: UserRole; icon: typeof ShoppingCart }[] = [
  { role: 'buyer', icon: ShoppingCart },
  { role: 'seller', icon: Store },
  { role: 'birddog', icon: Search },
];

function RoleChanger({
  currentRole,
  onChangeRole,
  tRoles,
}: {
  currentRole: UserRole | null;
  onChangeRole: (role: UserRole) => Promise<void>;
  tRoles: ReturnType<typeof useTranslations<'roles'>>;
}) {
  const [isChanging, setIsChanging] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!currentRole) return null;

  const handleChange = async (newRole: UserRole) => {
    if (newRole === currentRole || isChanging) return;
    setIsChanging(true);
    setSuccess(false);
    try {
      await onChangeRole(newRole);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      // Error handled upstream
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div className="glass-crystal-enhanced rounded-2xl p-5 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
          {tRoles('currentRole')}
        </h3>
        {success && (
          <span className="text-sm text-am-green flex items-center gap-1">
            <CheckCircle className="w-4 h-4" />
            {tRoles('changeSuccess')}
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {ROLE_CONFIG.map(({ role, icon: Icon }) => {
          const isActive = role === currentRole;
          return (
            <button
              key={role}
              onClick={() => handleChange(role)}
              disabled={isChanging}
              className={`p-3 rounded-xl border-2 transition-all text-center ${
                isActive
                  ? 'border-am-orange bg-am-orange/10 dark:bg-am-orange/15'
                  : 'border-gray-200 dark:border-gray-700 hover:border-am-orange/50 bg-white/50 dark:bg-white/5'
              } disabled:opacity-50`}
            >
              <Icon className={`w-5 h-5 mx-auto mb-1 ${isActive ? 'text-am-orange' : 'text-gray-400'}`} />
              <p className={`text-xs font-bold ${isActive ? 'text-am-orange' : 'text-gray-600 dark:text-gray-300'}`}>
                {tRoles(`${role}.label`)}
              </p>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-gray-400 mt-3 text-center">{tRoles('roleNote')}</p>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Seller Edit Form
   ───────────────────────────────────────────── */

function SellerForm({
  seller,
  address,
  refetch,
  t,
}: {
  seller: Seller;
  address: string;
  refetch: () => void;
  t: ReturnType<typeof useTranslations<'profile'>>;
}) {
  const [form, setForm] = useState({
    business_name: seller.business_name || '',
    tagline: seller.tagline || '',
    phone: seller.phone || '',
    whatsapp: seller.whatsapp || '',
    email: seller.email || '',
    address: seller.address || '',
    social_instagram: seller.social_instagram || '',
    social_facebook: seller.social_facebook || '',
    social_tiktok: seller.social_tiktok || '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  // Logo upload
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoStatus, setLogoStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Sync form if seller prop changes (e.g. after refetch)
  useEffect(() => {
    setForm({
      business_name: seller.business_name || '',
      tagline: seller.tagline || '',
      phone: seller.phone || '',
      whatsapp: seller.whatsapp || '',
      email: seller.email || '',
      address: seller.address || '',
      social_instagram: seller.social_instagram || '',
      social_facebook: seller.social_facebook || '',
      social_tiktok: seller.social_tiktok || '',
    });
  }, [seller]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaveStatus('idle');
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    setErrorMsg('');

    try {
      const res = await fetch('/api/sellers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: address, ...form }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save');
      }

      setSaveStatus('success');
      refetch();
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      setSaveStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save');
      setTimeout(() => setSaveStatus('idle'), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  // Logo upload via Supabase storage (reusing the sellers PATCH for logo_url)
  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !address) return;

    if (file.size > 2 * 1024 * 1024) {
      setLogoStatus('error');
      setTimeout(() => setLogoStatus('idle'), 3000);
      return;
    }

    setIsUploadingLogo(true);
    setLogoStatus('idle');

    try {
      // Compress client-side
      const compressed = await compressImage(file, 500, 0.85);

      const formData = new FormData();
      formData.append('file', new File([compressed], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' }));
      formData.append('wallet', address);

      const res = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
      });

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error(res.status === 413 ? 'File too large' : `Server error (${res.status})`);
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      // Save the returned URL to sellers table
      if (data.data?.avatar_url) {
        await fetch('/api/sellers', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wallet: address, logo_url: data.data.avatar_url }),
        });
      }

      setLogoStatus('success');
      refetch();
      setTimeout(() => setLogoStatus('idle'), 3000);
    } catch {
      setLogoStatus('error');
      setTimeout(() => setLogoStatus('idle'), 5000);
    } finally {
      setIsUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Logo & Branding */}
      <div className="glass-crystal-enhanced rounded-2xl p-5">
        <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-am-orange" />
          {t('branding')}
        </h3>

        <div className="flex items-center gap-5">
          {/* Logo preview */}
          <div className="relative group">
            <div className="w-20 h-20 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden ring-2 ring-gray-200 dark:ring-gray-700">
              {isUploadingLogo ? (
                <Loader2 className="w-6 h-6 text-am-orange animate-spin" />
              ) : seller.logo_url ? (
                <Image
                  src={seller.logo_url}
                  alt="Logo"
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              ) : (
                <Store className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleLogoUpload}
              className="hidden"
            />
            <button
              onClick={() => logoInputRef.current?.click()}
              disabled={isUploadingLogo}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-am-orange text-white flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110 disabled:opacity-50"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1">
            <button
              onClick={() => logoInputRef.current?.click()}
              disabled={isUploadingLogo}
              className="px-4 py-2 rounded-xl text-sm font-medium glass-crystal text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
            >
              {t('logoUpload')}
            </button>
            <p className="text-xs text-gray-400 mt-1">{t('logoHelp')}</p>
            {logoStatus === 'success' && (
              <p className="text-xs text-am-green flex items-center gap-1 mt-1"><CheckCircle className="w-3 h-3" />{t('logoSuccess')}</p>
            )}
            {logoStatus === 'error' && (
              <p className="text-xs text-red-500 flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3" />Error</p>
            )}
          </div>
        </div>
      </div>

      {/* Business Information */}
      <div className="glass-crystal-enhanced rounded-2xl p-5">
        <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Store className="w-5 h-5 text-am-blue" />
          {t('businessInfo')}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label={t('businessName')}
            value={form.business_name}
            onChange={(v) => handleChange('business_name', v)}
            placeholder={t('businessNamePlaceholder')}
          />
          <InputField
            label={t('tagline')}
            value={form.tagline}
            onChange={(v) => handleChange('tagline', v)}
            placeholder={t('taglinePlaceholder')}
          />
          <InputField
            label={t('phone')}
            icon={<Phone className="w-4 h-4 text-gray-400" />}
            value={form.phone}
            onChange={(v) => handleChange('phone', v)}
            placeholder={t('phonePlaceholder')}
            type="tel"
            help={t('phoneHelp')}
          />
          <InputField
            label={t('whatsapp')}
            icon={<MessageCircle className="w-4 h-4 text-gray-400" />}
            value={form.whatsapp}
            onChange={(v) => handleChange('whatsapp', v)}
            placeholder={t('whatsappPlaceholder')}
            help={t('whatsappHelp')}
          />
          <InputField
            label={t('email')}
            icon={<Mail className="w-4 h-4 text-gray-400" />}
            value={form.email}
            onChange={(v) => handleChange('email', v)}
            placeholder={t('emailPlaceholder')}
            type="email"
          />
          <InputField
            label={t('address')}
            icon={<MapPin className="w-4 h-4 text-gray-400" />}
            value={form.address}
            onChange={(v) => handleChange('address', v)}
            placeholder={t('addressPlaceholder')}
          />
        </div>
      </div>

      {/* Social Media */}
      <div className="glass-crystal-enhanced rounded-2xl p-5">
        <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="text-am-orange">@</span>
          {t('socialLinks')}
        </h3>

        <div className="space-y-3">
          <InputField
            label={t('instagram')}
            icon={<InstagramIcon className="w-4 h-4 text-pink-500" />}
            value={form.social_instagram}
            onChange={(v) => handleChange('social_instagram', v)}
            placeholder={t('instagramPlaceholder')}
          />
          <InputField
            label={t('facebook')}
            icon={<FacebookIcon className="w-4 h-4 text-blue-600" />}
            value={form.social_facebook}
            onChange={(v) => handleChange('social_facebook', v)}
            placeholder={t('facebookPlaceholder')}
          />
          <InputField
            label={t('tiktok')}
            icon={<TikTokIcon className="w-4 h-4 text-gray-900 dark:text-white" />}
            value={form.social_tiktok}
            onChange={(v) => handleChange('social_tiktok', v)}
            placeholder={t('tiktokPlaceholder')}
          />
        </div>
      </div>

      {/* Save button */}
      <div className="flex flex-col items-center gap-3">
        {saveStatus === 'success' && (
          <div className="flex items-center gap-2 text-am-green text-sm">
            <CheckCircle className="w-4 h-4" />
            {t('saveSuccess')}
          </div>
        )}
        {saveStatus === 'error' && (
          <div className="flex items-center gap-2 text-red-500 text-sm">
            <AlertCircle className="w-4 h-4" />
            {errorMsg || t('saveError')}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`w-full max-w-md py-3 px-6 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 ${
            saveStatus === 'success'
              ? 'bg-am-green'
              : 'bg-gradient-to-r from-am-orange to-am-orange-light hover:shadow-lg hover:-translate-y-0.5'
          } disabled:opacity-50`}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {t('saving')}
            </>
          ) : saveStatus === 'success' ? (
            <>
              <Check className="w-4 h-4" />
              {t('saved')}
            </>
          ) : (
            t('saveChanges')
          )}
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Reusable Input Field
   ───────────────────────────────────────────── */

function InputField({
  label,
  value,
  onChange,
  placeholder,
  icon,
  type = 'text',
  help,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  type?: string;
  help?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2">{icon}</span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white py-2.5 focus:ring-2 focus:ring-am-orange/50 focus:border-am-orange outline-none transition-all ${
            icon ? 'pl-10 pr-4' : 'px-4'
          }`}
        />
      </div>
      {help && <p className="text-xs text-gray-400 mt-1">{help}</p>}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Image Compression Utility
   ───────────────────────────────────────────── */

function compressImage(file: File, maxSize = 500, quality = 0.85): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      if (width > maxSize || height > maxSize) {
        const ratio = Math.min(maxSize / width, maxSize / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas context failed'));
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Compression failed'))),
        'image/jpeg',
        quality,
      );
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

/* ─────────────────────────────────────────────
   Skeleton Loader
   ───────────────────────────────────────────── */

function ProfileSkeleton() {
  return (
    <>
      <Navbar />
      <NavbarSpacer />
      <div className="min-h-screen theme-gradient-bg">
        <div className="container mx-auto px-4 py-8 max-w-4xl animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-xl w-48 mb-2" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-64 mb-8" />
          <div className="glass-crystal-enhanced rounded-2xl h-28 mb-6" />
          <div className="glass-crystal-enhanced rounded-2xl h-40 mb-6" />
          <div className="glass-crystal-enhanced rounded-2xl h-64 mb-6" />
          <div className="glass-crystal-enhanced rounded-2xl h-48" />
        </div>
      </div>
      <Footer />
    </>
  );
}
