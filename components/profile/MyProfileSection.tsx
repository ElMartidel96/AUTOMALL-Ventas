'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import {
  User as UserIcon, Mail, Phone, Calendar, Camera,
  Users, MousePointerClick, TrendingUp, DollarSign, Link2,
  Check, CheckCircle, AlertCircle, Loader2, X, Pencil,
} from 'lucide-react';
import type { User } from '@/lib/types/user';
import type { ReferralStats } from '@/hooks/useReferrals';
import { useProfileManager } from '@/hooks/useProfile';
import { InstagramIcon, FacebookIcon, TikTokIcon } from '@/components/icons/SocialIcons';
import { CopyPanel } from './CopyPanel';

interface MyProfileSectionProps {
  user: User | null;
  address: string;
  referralCode?: string;
  referralLink?: string;
  referralStats?: ReferralStats;
  isLoadingReferrals: boolean;
  refetchUser?: () => void;
}

export function MyProfileSection({
  user,
  address,
  referralCode,
  referralLink,
  referralStats,
  isLoadingReferrals,
  refetchUser,
}: MyProfileSectionProps) {
  const t = useTranslations('profile');

  const stats = [
    {
      label: t('totalReferrals'),
      value: referralStats?.totalReferrals ?? 0,
      icon: Users,
      color: 'text-am-blue',
    },
    {
      label: t('clicks'),
      value: referralStats?.engagement?.clickCount ?? 0,
      icon: MousePointerClick,
      color: 'text-am-orange',
    },
    {
      label: t('conversionRate'),
      value: `${Math.round(referralStats?.engagement?.conversionRate ?? 0)}%`,
      icon: TrendingUp,
      color: 'text-am-green',
    },
    {
      label: t('totalEarned'),
      value: `$${referralStats?.totalEarned ?? 0}`,
      icon: DollarSign,
      color: 'text-am-orange-light',
    },
  ];

  return (
    <section className="space-y-6">
      {/* Personal Information + Avatar Upload + Edit Profile */}
      <PersonalInfoCard user={user} address={address} refetchUser={refetchUser} />

      {/* Referral Activity */}
      <div className="glass-crystal-enhanced rounded-2xl p-5">
        <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-am-orange" />
          {t('referralActivity')}
        </h3>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-white/50 dark:bg-white/5 rounded-xl p-3 text-center border border-gray-100 dark:border-gray-700/50"
            >
              <stat.icon className={`w-4 h-4 mx-auto mb-1 ${stat.color}`} />
              <p className={`text-lg font-bold text-gray-900 dark:text-white ${
                isLoadingReferrals ? 'animate-pulse' : ''
              }`}>
                {stat.value}
              </p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Referral Link CopyPanel */}
        <CopyPanel
          label={t('myReferralLink')}
          value={referralCode ? `autosmall.org?ref=${referralCode}` : t('generating')}
          fullUrl={referralLink || ''}
          icon={<Link2 className="w-4 h-4" />}
          disabled={!referralLink}
        />
      </div>

      {/* Personal Social Media */}
      <PersonalSocialForm user={user} address={address} refetchUser={refetchUser} />
    </section>
  );
}

/* ─────────────────────────────────────────────
   Personal Info Card — Avatar Upload + Edit Profile
   (adapted from DAO profile/page.tsx)
   ───────────────────────────────────────────── */

function PersonalInfoCard({
  user,
  address,
  refetchUser,
}: {
  user: User | null;
  address: string;
  refetchUser?: () => void;
}) {
  const t = useTranslations('profile');

  // Profile manager from DAO system (user_profiles table)
  const {
    profile,
    refetch: refetchProfile,
    updateProfile,
    isUpdating,
    checkUsername,
    usernameResult,
    isCheckingUsername,
  } = useProfileManager(address);

  // Avatar upload state (from DAO)
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarSuccess, setAvatarSuccess] = useState(false);

  // Edit mode
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Sync form with loaded data
  useEffect(() => {
    setDisplayName(user?.display_name || profile?.display_name || '');
    setUsername(profile?.username || '');
    setBio(profile?.bio || '');
  }, [user, profile]);

  // Avatar display URL — prefer user table, fallback to profile table
  const avatarUrl = user?.avatar_url || profile?.avatar_url || null;

  // Avatar upload handler (from DAO profile/page.tsx — ORIGINAL)
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !address) return;

    setIsUploadingAvatar(true);
    setAvatarError(null);
    setAvatarSuccess(false);

    try {
      // Step 1: Upload to Supabase Storage
      const formData = new FormData();
      formData.append('file', file);
      formData.append('wallet', address);

      const response = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to upload avatar');

      const newAvatarUrl = data.data.avatar_url;

      // Step 2: Save URL to users table
      await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: address, avatar_url: newAvatarUrl }),
      });

      // Step 3: Save URL to user_profiles table
      try {
        updateProfile({ avatar_url: newAvatarUrl });
      } catch {
        // user_profiles may not exist yet — non-critical
      }

      setAvatarSuccess(true);
      refetchUser?.();
      refetchProfile();
      setTimeout(() => setAvatarSuccess(false), 3000);
    } catch (error) {
      setAvatarError(error instanceof Error ? error.message : 'Failed to upload avatar');
      setTimeout(() => setAvatarError(null), 5000);
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  // Save profile edits
  const handleSaveProfile = async () => {
    setSaveStatus('idle');
    try {
      // Save display_name to users table
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: address, display_name: displayName || null }),
      });
      if (!res.ok) throw new Error('Failed to save');

      // Save username, display_name, bio to user_profiles table
      try {
        updateProfile({
          display_name: displayName || null,
          username: username || null,
          bio: bio || null,
        });
      } catch {
        // user_profiles may not exist yet — non-critical
      }

      setSaveStatus('success');
      refetchUser?.();
      refetchProfile();
      setTimeout(() => {
        setSaveStatus('idle');
        setIsEditing(false);
      }, 2000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 5000);
    }
  };

  // Username availability check
  const handleUsernameChange = (value: string) => {
    const sanitized = value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(sanitized);
    checkUsername(sanitized);
    setSaveStatus('idle');
  };

  return (
    <div className="glass-crystal-enhanced rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <UserIcon className="w-5 h-5 text-am-blue" />
          {t('personalInfo')}
        </h3>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
            isEditing
              ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              : 'bg-am-blue/10 dark:bg-am-blue/20 text-am-blue dark:text-am-blue-light hover:bg-am-blue/20'
          }`}
        >
          {isEditing ? (
            <><X className="w-3.5 h-3.5" />{t('saved')}</>
          ) : (
            <><Pencil className="w-3.5 h-3.5" />{t('editProfile')}</>
          )}
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-start gap-5">
        {/* Avatar with camera overlay (from DAO — ORIGINAL) */}
        <div className="relative group flex-shrink-0 self-center sm:self-start">
          {/* Holographic glow ring */}
          <div
            className="absolute -inset-1 rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-500 blur-sm"
            style={{
              background: 'linear-gradient(90deg, #1B3A6B, #E8832A, #2D8F4E, #1B3A6B)',
              backgroundSize: '300% 100%',
              animation: 'gradient-shift 4s ease infinite',
            }}
          />

          {/* Avatar container */}
          <div className="relative w-24 h-24 rounded-full overflow-hidden ring-2 ring-white dark:ring-gray-800 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            {isUploadingAvatar ? (
              <Loader2 className="w-8 h-8 text-am-orange animate-spin" />
            ) : avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={user?.display_name || t('noName')}
                width={96}
                height={96}
                className="w-full h-full object-cover"
                unoptimized
              />
            ) : (
              <UserIcon className="w-10 h-10 text-gray-400" />
            )}
          </div>

          {/* Hidden file input */}
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleAvatarUpload}
            className="hidden"
          />

          {/* Camera button overlay (from DAO — ORIGINAL) */}
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            disabled={isUploadingAvatar}
            className="absolute bottom-0 right-0 w-8 h-8 glass-crystal rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 shadow-lg border border-white/30 dark:border-white/20 disabled:opacity-50"
            title={t('uploadAvatar')}
          >
            <Camera className="w-4 h-4 text-gray-700 dark:text-white" />
          </button>

          {/* Avatar feedback */}
          {avatarSuccess && (
            <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs text-am-green flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />{t('avatarSuccess')}
            </div>
          )}
          {avatarError && (
            <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />{t('avatarError')}
            </div>
          )}
        </div>

        {/* Info / Edit form */}
        <div className="flex-1 w-full">
          {isEditing ? (
            /* Edit mode */
            <div className="space-y-3">
              {/* Display Name */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {t('displayNameLabel')}
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => { setDisplayName(e.target.value); setSaveStatus('idle'); }}
                  placeholder={t('displayNamePlaceholder')}
                  maxLength={100}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white py-2.5 px-4 text-sm focus:ring-2 focus:ring-am-blue/50 focus:border-am-blue outline-none transition-all"
                />
              </div>

              {/* Username with availability check (from DAO — ORIGINAL) */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {t('usernameLabel')}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    placeholder={t('usernamePlaceholder')}
                    maxLength={30}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white py-2.5 pl-8 pr-10 text-sm focus:ring-2 focus:ring-am-blue/50 focus:border-am-blue outline-none transition-all"
                  />
                  {/* Username status indicator */}
                  {username.length >= 3 && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2">
                      {isCheckingUsername ? (
                        <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                      ) : usernameResult?.available ? (
                        <Check className="w-4 h-4 text-am-green" />
                      ) : (
                        <X className="w-4 h-4 text-red-500" />
                      )}
                    </span>
                  )}
                </div>
                {/* Username feedback text */}
                {username.length > 0 && username.length < 3 && (
                  <p className="text-xs text-gray-400 mt-1">{t('usernameTooShort')}</p>
                )}
                {username.length >= 3 && !isCheckingUsername && usernameResult && (
                  <p className={`text-xs mt-1 ${usernameResult.available ? 'text-am-green' : 'text-red-500'}`}>
                    {usernameResult.available ? t('usernameAvailable') : t('usernameTaken')}
                  </p>
                )}
              </div>

              {/* Bio */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {t('bioLabel')}
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => { setBio(e.target.value); setSaveStatus('idle'); }}
                  placeholder={t('bioPlaceholder')}
                  maxLength={500}
                  rows={3}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white py-2.5 px-4 text-sm focus:ring-2 focus:ring-am-blue/50 focus:border-am-blue outline-none transition-all resize-none"
                />
                <p className="text-xs text-gray-400 text-right">
                  {t('bioCharCount', { count: bio.length })}
                </p>
              </div>

              {/* Read-only fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <InfoRow
                  icon={<Mail className="w-4 h-4 text-gray-400" />}
                  label={t('emailLabel')}
                  value={user?.email}
                  placeholder={t('noData')}
                />
                <InfoRow
                  icon={<Phone className="w-4 h-4 text-gray-400" />}
                  label={t('phoneLabel')}
                  value={user?.phone}
                  placeholder={t('noData')}
                />
                <InfoRow
                  icon={<Calendar className="w-4 h-4 text-gray-400" />}
                  label={t('memberSinceLabel')}
                  value={user?.created_at ? new Date(user.created_at).toLocaleDateString() : undefined}
                  placeholder={t('noData')}
                />
              </div>

              {/* Save button */}
              <div className="flex flex-col items-center gap-2 pt-2">
                {saveStatus === 'success' && (
                  <p className="text-xs text-am-green flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />{t('profileSaved')}
                  </p>
                )}
                {saveStatus === 'error' && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />{t('profileSaveError')}
                  </p>
                )}
                <button
                  onClick={handleSaveProfile}
                  disabled={isUpdating || (username.length >= 3 && !usernameResult?.available)}
                  className={`w-full max-w-xs py-2.5 px-5 rounded-xl font-bold text-white text-sm transition-all flex items-center justify-center gap-2 ${
                    saveStatus === 'success'
                      ? 'bg-am-green'
                      : 'bg-gradient-to-r from-am-orange to-am-orange-light hover:shadow-lg hover:-translate-y-0.5'
                  } disabled:opacity-50`}
                >
                  {isUpdating ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />{t('saving')}</>
                  ) : saveStatus === 'success' ? (
                    <><Check className="w-4 h-4" />{t('saved')}</>
                  ) : (
                    t('saveProfile')
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Display mode */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InfoRow
                icon={<UserIcon className="w-4 h-4 text-gray-400" />}
                label={t('nameLabel')}
                value={user?.display_name || profile?.display_name || t('noName')}
              />
              <InfoRow
                icon={<Mail className="w-4 h-4 text-gray-400" />}
                label={t('emailLabel')}
                value={user?.email}
                placeholder={t('noData')}
              />
              <InfoRow
                icon={<Phone className="w-4 h-4 text-gray-400" />}
                label={t('phoneLabel')}
                value={user?.phone}
                placeholder={t('noData')}
              />
              <InfoRow
                icon={<Calendar className="w-4 h-4 text-gray-400" />}
                label={t('memberSinceLabel')}
                value={user?.created_at ? new Date(user.created_at).toLocaleDateString() : undefined}
                placeholder={t('noData')}
              />
            </div>
          )}
        </div>
      </div>

      {/* CSS for gradient animation */}
      <style jsx>{`
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </div>
  );
}

function PersonalSocialForm({
  user,
  address,
  refetchUser,
}: {
  user: User | null;
  address: string;
  refetchUser?: () => void;
}) {
  const t = useTranslations('profile');

  const [form, setForm] = useState({
    social_instagram: user?.social_instagram || '',
    social_facebook: user?.social_facebook || '',
    social_tiktok: user?.social_tiktok || '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    setForm({
      social_instagram: user?.social_instagram || '',
      social_facebook: user?.social_facebook || '',
      social_tiktok: user?.social_tiktok || '',
    });
  }, [user]);

  const handleSave = async () => {
    setIsSaving(true);
    setStatus('idle');
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: address, ...form }),
      });
      if (!res.ok) throw new Error('Failed');
      setStatus('success');
      refetchUser?.();
      setTimeout(() => setStatus('idle'), 3000);
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setStatus('idle');
  };

  return (
    <div className="glass-crystal-enhanced rounded-2xl p-5">
      <h3 className="font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
        <span className="text-am-blue">@</span>
        {t('personalSocial')}
      </h3>
      <p className="text-xs text-gray-400 mb-4">{t('personalSocialHint')}</p>

      <div className="space-y-3">
        <SocialInput
          label={t('instagram')}
          icon={<InstagramIcon className="w-4 h-4 text-pink-500" />}
          value={form.social_instagram}
          onChange={(v) => handleChange('social_instagram', v)}
          placeholder={t('personalInstagramPlaceholder')}
        />
        <SocialInput
          label={t('facebook')}
          icon={<FacebookIcon className="w-4 h-4 text-blue-600" />}
          value={form.social_facebook}
          onChange={(v) => handleChange('social_facebook', v)}
          placeholder={t('personalFacebookPlaceholder')}
        />
        <SocialInput
          label={t('tiktok')}
          icon={<TikTokIcon className="w-4 h-4 text-gray-900 dark:text-white" />}
          value={form.social_tiktok}
          onChange={(v) => handleChange('social_tiktok', v)}
          placeholder={t('personalTiktokPlaceholder')}
        />
      </div>

      <div className="mt-4 flex flex-col items-center gap-2">
        {status === 'success' && (
          <p className="text-xs text-am-green flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />{t('socialSaved')}
          </p>
        )}
        {status === 'error' && (
          <p className="text-xs text-red-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />{t('socialSaveError')}
          </p>
        )}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`w-full max-w-xs py-2.5 px-5 rounded-xl font-bold text-white text-sm transition-all flex items-center justify-center gap-2 ${
            status === 'success'
              ? 'bg-am-green'
              : 'bg-gradient-to-r from-am-blue to-am-blue-light hover:shadow-lg hover:-translate-y-0.5'
          } disabled:opacity-50`}
        >
          {isSaving ? (
            <><Loader2 className="w-4 h-4 animate-spin" />{t('saving')}</>
          ) : status === 'success' ? (
            <><Check className="w-4 h-4" />{t('saved')}</>
          ) : (
            t('saveSocial')
          )}
        </button>
      </div>
    </div>
  );
}

function SocialInput({
  label,
  icon,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2">{icon}</span>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-am-blue/50 focus:border-am-blue outline-none transition-all"
        />
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  placeholder,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
  placeholder?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <div className="min-w-0">
        <p className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</p>
        <p className={`text-sm font-medium truncate ${
          value ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'
        }`}>
          {value || placeholder || ''}
        </p>
      </div>
    </div>
  );
}
