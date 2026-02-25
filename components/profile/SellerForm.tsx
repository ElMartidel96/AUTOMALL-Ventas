'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
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
  Image as ImageIcon,
} from 'lucide-react';
import type { Seller } from '@/lib/types/seller';
import { InstagramIcon, FacebookIcon, TikTokIcon } from '@/components/icons/SocialIcons';
import { ImageUploadField } from '@/components/ui/ImageUploadField';
import { compressImageSmart } from '@/lib/inventory/image-utils';

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

export function SellerForm({
  seller,
  address,
  refetch,
}: {
  seller: Seller;
  address: string;
  refetch: () => void;
}) {
  const t = useTranslations('profile');
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

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !address) return;

    setIsUploadingLogo(true);
    setLogoStatus('idle');

    try {
      const { blob, format } = await compressImageSmart(file, {
        maxWidth: 500,
        maxHeight: 500,
        preserveTransparency: true,
      });

      const ext = format === 'image/png' ? 'png' : format === 'image/webp' ? 'webp' : 'jpg';
      const formData = new FormData();
      formData.append('file', new File([blob], `logo.${ext}`, { type: format }));
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

      {/* Hero / Background Image */}
      <div className="glass-crystal-enhanced rounded-2xl p-5">
        <ImageUploadField
          label={t('heroImage')}
          help={t('heroHelp')}
          currentUrl={seller.hero_image_url || undefined}
          uploadEndpoint="/api/upload/hero"
          walletAddress={address}
          compressOptions={{ maxWidth: 1920, maxHeight: 1080, preserveTransparency: false }}
          previewAspect="wide"
          onUploadComplete={async (url) => {
            await fetch('/api/sellers', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ wallet: address, hero_image_url: url }),
            });
            refetch();
          }}
          strings={{
            dragOrClick: t('logoUpload'),
            compressing: t('saving'),
            uploading: t('saving'),
            success: t('logoSuccess'),
            error: t('saveError'),
            change: t('logoUpload'),
          }}
        />
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
