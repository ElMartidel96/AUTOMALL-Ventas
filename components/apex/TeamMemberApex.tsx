'use client';

/**
 * TeamMemberApex - apeX profile card for team members
 *
 * Features:
 * - VideoAvatar with squircle shape (supports video + image)
 * - Click to open profile panel with stats
 * - Reputation & Respect system
 * - Social links as elegant "slots" that illuminate when linked
 * - Chat button (redirects to X initially)
 *
 * Made by mbxarts.com The Moon in a Box property
 * Co-Author: Godez22
 */

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';
import { VideoAvatar } from './VideoAvatar';
import type { TeamMember, TeamSocialKey } from '@/lib/team/types';
import { useIsAdmin } from '@/components/auth/RoleGate';
import { useAccount } from '@/lib/thirdweb';

// Map member names to translation keys
const MEMBER_TRANSLATION_KEYS: Record<string, string> = {
  'Rafael Gonzalez': 'rafael',
  'Roberto Legrá': 'roberto',
  'Leodanni Avila': 'leodanni',
};
import {
  X,
  Copy,
  Check,
  Trophy,
  Star,
  Zap,
  MessageCircle,
  TrendingUp,
  Target,
  Camera,
  Save,
  Loader2,
} from 'lucide-react';

// Social Network Icons with brand colors
const SocialIcons: Record<TeamSocialKey, { icon: JSX.Element; color: string; darkColor: string; name: string }> = {
  twitter: {
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
    color: '#000000',
    darkColor: '#ffffff',
    name: 'X',
  },
  linkedin: {
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    ),
    color: '#0A66C2',
    darkColor: '#0A66C2',
    name: 'LinkedIn',
  },
  discord: {
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z"/>
      </svg>
    ),
    color: '#5865F2',
    darkColor: '#5865F2',
    name: 'Discord',
  },
  github: {
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
      </svg>
    ),
    color: '#181717',
    darkColor: '#ffffff',
    name: 'GitHub',
  },
  telegram: {
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
      </svg>
    ),
    color: '#26A5E4',
    darkColor: '#26A5E4',
    name: 'Telegram',
  },
  youtube: {
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
    color: '#FF0000',
    darkColor: '#FF0000',
    name: 'YouTube',
  },
};

interface TeamMemberApexProps {
  member: TeamMember;
  onMemberUpdated?: (member: TeamMember) => void;
}

// Social Slot Component - elegant hollow design that illuminates when linked
function SocialSlot({
  network,
  url,
  isDark = false
}: {
  network: TeamSocialKey;
  url?: string;
  isDark?: boolean;
}) {
  const social = SocialIcons[network];
  const isLinked = !!url;
  const activeColor = isDark ? social.darkColor : social.color;

  const slot = (
    <div
      className={`
        relative w-10 h-10 rounded-lg
        border-2 transition-all duration-300
        flex items-center justify-center
        ${isLinked
          ? 'border-transparent bg-opacity-20 shadow-lg'
          : 'border-gray-300 dark:border-gray-600 bg-transparent opacity-40'
        }
      `}
      style={isLinked ? {
        backgroundColor: `${activeColor}15`,
        boxShadow: `0 0 20px ${activeColor}40, inset 0 0 10px ${activeColor}20`,
        borderColor: activeColor,
      } : {}}
    >
      <div
        className={`transition-colors duration-300 ${isLinked ? '' : 'text-gray-400 dark:text-gray-500'}`}
        style={isLinked ? { color: activeColor } : {}}
      >
        {social.icon}
      </div>
      {/* Glow effect for linked */}
      {isLinked && (
        <div
          className="absolute inset-0 rounded-lg opacity-30 blur-sm -z-10"
          style={{ backgroundColor: activeColor }}
        />
      )}
    </div>
  );

  if (isLinked && url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:scale-110 transition-transform"
        title={social.name}
      >
        {slot}
      </a>
    );
  }

  return <div title={`${social.name} not linked`}>{slot}</div>;
}

export function TeamMemberApex({ member, onMemberUpdated }: TeamMemberApexProps) {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [formState, setFormState] = useState<TeamMember>(member);
  const cardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isAdmin = useIsAdmin();
  const { address } = useAccount();
  const t = useTranslations('landing.team');

  // Get translated role and description (fallback to member data if no translation)
  const memberKey = MEMBER_TRANSLATION_KEYS[member.name];
  const translatedRole = memberKey ? t(`members.${memberKey}.role`) : member.role;
  const translatedDescription = memberKey ? t(`members.${memberKey}.description`) : member.description;

  useEffect(() => {
    if (!isEditing) {
      setFormState(member);
    }
  }, [isEditing, member]);

  const handleCopyWallet = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(member.wallet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shortWallet = `${member.wallet.slice(0, 6)}...${member.wallet.slice(-4)}`;

  // Get linked socials for preview
  const linkedSocials = Object.entries(member.socials).filter(([_, url]) => url);

  const handleEditOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFormState(member);
    setSaveError(null);
    setSaveSuccess(false);
    setIsEditing(true);
  };

  const handleEditClose = () => {
    setIsEditing(false);
    setSaveError(null);
  };

  const updateField = (field: keyof TeamMember, value: string) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateSocial = (network: TeamSocialKey, value: string) => {
    setFormState((prev) => ({
      ...prev,
      socials: {
        ...prev.socials,
        [network]: value,
      },
    }));
  };

  const updateStat = (field: keyof TeamMember['stats'], value: string) => {
    const numericFields: Array<keyof TeamMember['stats']> = [
      'tasksCompleted',
      'reputation',
      'respect',
      'contributions',
    ];
    setFormState((prev) => ({
      ...prev,
      stats: {
        ...prev.stats,
        [field]: numericFields.includes(field) ? Number(value) || 0 : value,
      },
    }));
  };

  const handleSave = async () => {
    if (!address) return;
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const response = await fetch('/api/team', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': address,
        },
        body: JSON.stringify({ member: formState }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to update team member');
      }

      onMemberUpdated?.(data.data || formState);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      setIsEditing(false);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !address) return;

    setIsUploading(true);
    setSaveError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('wallet', formState.wallet);

      const response = await fetch('/api/team/avatar', {
        method: 'POST',
        headers: {
          'x-wallet-address': address,
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to upload image');
      }

      const imageUrl = data.data?.image_url || formState.imageSrc;
      setFormState((prev) => ({
        ...prev,
        imageSrc: imageUrl,
      }));
      onMemberUpdated?.({
        ...member,
        imageSrc: imageUrl,
      });
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      {/* Card */}
      <div
        ref={cardRef}
        className="text-center p-6 rounded-2xl glass-crystal hover:scale-[1.02] transition-all duration-300 cursor-pointer group"
        onClick={() => setIsPanelOpen(true)}
      >
        {/* Avatar - Clean Apple Watch style */}
        <div className="relative mx-auto mb-4" style={{ width: 112, height: 112 }}>
          <VideoAvatar
            imageSrc={member.imageSrc}
            videoSrc={member.videoSrc}
            alt={member.name}
            size="xl"
            enableFloat
          />
        </div>

        {/* Name */}
        <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-1">
          {member.name}
        </h4>

        {/* Role */}
        <p className="text-sm text-purple-600 dark:text-purple-400 font-medium mb-2">
          {translatedRole}
        </p>

        {/* Quick Stats */}
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="flex items-center gap-1 text-amber-500">
            <Trophy className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold">{member.stats.rank}</span>
          </div>
          <div className="flex items-center gap-1 text-emerald-500">
            <Star className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold">{member.stats.reputation}</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
          {translatedDescription}
        </p>

        {/* Social Preview - Small icons */}
        <div className="flex items-center justify-center gap-2">
          {linkedSocials.slice(0, 3).map(([network, url]) => (
            <a
              key={network}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 rounded-md hover:bg-white/10 transition-colors"
              style={{ color: SocialIcons[network as TeamSocialKey].color }}
            >
              <div className="w-4 h-4">
                {SocialIcons[network as TeamSocialKey].icon}
              </div>
            </a>
          ))}
          {linkedSocials.length > 3 && (
            <span className="text-xs text-gray-400">+{linkedSocials.length - 3}</span>
          )}
        </div>

        {/* Click hint */}
        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
          Click to view full profile
        </p>
      </div>

      {/* Profile Panel (Portal) */}
      {isPanelOpen && typeof document !== 'undefined' && createPortal(
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm animate-fadeIn"
            onClick={() => setIsPanelOpen(false)}
          />

          {/* Panel - mobile: centered, PC: below navbar */}
          <div className="fixed z-[70] top-1/2 -translate-y-1/2 md:top-20 md:translate-y-0 left-1/2 -translate-x-1/2 w-[420px] max-w-[calc(100vw-32px)] max-h-[calc(100vh-64px)] md:max-h-[calc(100vh-96px)] overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200/50 dark:border-slate-700/50 animate-scaleIn">

            {/* Header with gradient */}
            <div className="relative bg-gradient-to-br from-purple-600/10 via-indigo-600/10 to-cyan-600/10 dark:from-purple-600/20 dark:via-indigo-600/20 dark:to-cyan-600/20 p-6 pb-4">
              {/* Close Button */}
              <button
                onClick={() => setIsPanelOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>

              {/* Avatar */}
              <div className="relative mx-auto mb-4" style={{ width: 120, height: 120 }}>
                <VideoAvatar
                  imageSrc={member.imageSrc}
                  videoSrc={member.videoSrc}
                  alt={member.name}
                  size="xl"
                  enableSound
                  className="!w-[120px] !h-[120px]"
                />
                {isAdmin && (
                  <button
                    type="button"
                    onClick={handleEditOpen}
                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-600 text-white text-xs shadow-lg hover:bg-purple-700 transition-colors"
                  >
                    <Camera className="w-3 h-3" />
                    Edit
                  </button>
                )}
              </div>

              {/* Name & Role */}
              <h3 className="text-xl font-bold text-center text-gray-900 dark:text-white">
                {member.name}
              </h3>
              <p className="text-sm text-center text-purple-600 dark:text-purple-400 font-medium mb-3">
                {translatedRole}
              </p>

              {/* Rank Badge */}
              <div className="flex justify-center">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                    {member.stats.rank}
                  </span>
                </div>
              </div>
            </div>

            {isEditing ? (
              <div className="p-4 space-y-4">
                <div className="rounded-xl bg-gray-50 dark:bg-slate-800/50 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Edit Team Card
                    </h4>
                    <button
                      type="button"
                      onClick={handleEditClose}
                      className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                      Photo
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-600 text-white text-xs hover:bg-purple-700 transition-colors"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        {isUploading ? 'Uploading...' : 'Upload Photo'}
                      </button>
                      <span className="text-[11px] text-gray-400">
                        {formState.imageSrc ? 'Custom image set' : 'Using default image'}
                      </span>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </div>

                  <div className="grid gap-3">
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Name
                      <input
                        value={formState.name}
                        onChange={(e) => updateField('name', e.target.value)}
                        className="mt-1 w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                      />
                    </label>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Role
                      <input
                        value={formState.role}
                        onChange={(e) => updateField('role', e.target.value)}
                        className="mt-1 w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                      />
                    </label>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Description
                      <textarea
                        value={formState.description}
                        onChange={(e) => updateField('description', e.target.value)}
                        className="mt-1 w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                        rows={3}
                      />
                    </label>
                  </div>
                </div>

                <div className="rounded-xl bg-gray-50 dark:bg-slate-800/50 p-4 space-y-3">
                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Social Links
                  </h4>
                  {(['twitter', 'linkedin', 'discord', 'github', 'telegram', 'youtube'] as TeamSocialKey[]).map((network) => (
                    <label key={network} className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      {SocialIcons[network].name}
                      <input
                        value={formState.socials[network] || ''}
                        onChange={(e) => updateSocial(network, e.target.value)}
                        className="mt-1 w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                      />
                    </label>
                  ))}
                </div>

                <div className="rounded-xl bg-gray-50 dark:bg-slate-800/50 p-4 space-y-3">
                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Stats
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Rank
                      <input
                        value={formState.stats.rank}
                        onChange={(e) => updateStat('rank', e.target.value)}
                        className="mt-1 w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                      />
                    </label>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Reputation
                      <input
                        type="number"
                        value={formState.stats.reputation}
                        onChange={(e) => updateStat('reputation', e.target.value)}
                        className="mt-1 w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                      />
                    </label>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Respect
                      <input
                        type="number"
                        value={formState.stats.respect}
                        onChange={(e) => updateStat('respect', e.target.value)}
                        className="mt-1 w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                      />
                    </label>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Tasks Completed
                      <input
                        type="number"
                        value={formState.stats.tasksCompleted}
                        onChange={(e) => updateStat('tasksCompleted', e.target.value)}
                        className="mt-1 w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                      />
                    </label>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Contributions
                      <input
                        type="number"
                        value={formState.stats.contributions}
                        onChange={(e) => updateStat('contributions', e.target.value)}
                        className="mt-1 w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                      />
                    </label>
                  </div>
                </div>

                {saveError && (
                  <div className="text-xs text-red-500">{saveError}</div>
                )}
                {saveSuccess && (
                  <div className="text-xs text-emerald-500">Saved!</div>
                )}
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving || isUploading}
                  className="flex items-center justify-center gap-2 w-full p-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium transition-all hover:shadow-lg disabled:opacity-60"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save changes
                </button>
              </div>
            ) : (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-2 p-4 border-b border-gray-200/50 dark:border-slate-700/50">
                  <div className="text-center p-2 rounded-lg bg-emerald-500/10">
                    <Star className="w-4 h-4 mx-auto mb-1 text-emerald-500" />
                    <div className="text-lg font-bold text-gray-900 dark:text-white">{member.stats.reputation}</div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400">Reputation</div>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-purple-500/10">
                    <Zap className="w-4 h-4 mx-auto mb-1 text-purple-500" />
                    <div className="text-lg font-bold text-gray-900 dark:text-white">{member.stats.respect}</div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400">Respect</div>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-blue-500/10">
                    <Target className="w-4 h-4 mx-auto mb-1 text-blue-500" />
                    <div className="text-lg font-bold text-gray-900 dark:text-white">{member.stats.tasksCompleted}</div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400">Tasks</div>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-cyan-500/10">
                    <TrendingUp className="w-4 h-4 mx-auto mb-1 text-cyan-500" />
                    <div className="text-lg font-bold text-gray-900 dark:text-white">{member.stats.contributions}</div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400">Contribs</div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                  {/* About */}
                  <div className="rounded-xl bg-gray-50 dark:bg-slate-800/50 p-4">
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                      About
                    </h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {translatedDescription}
                    </p>
                  </div>

                  {/* Social Networks - Elegant Slots */}
                  <div className="rounded-xl bg-gray-50 dark:bg-slate-800/50 p-4">
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                      Networks
                    </h4>
                    <div className="flex flex-wrap justify-center gap-3">
                      {(['twitter', 'linkedin', 'discord', 'github', 'telegram', 'youtube'] as TeamSocialKey[]).map((network) => (
                        <SocialSlot
                          key={network}
                          network={network}
                          url={member.socials[network]}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Chat Button */}
                  <a
                    href={member.socials.twitter || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full p-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium transition-all hover:shadow-lg hover:shadow-purple-500/25"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>Send Message</span>
                  </a>

                  {/* Wallet - Compact, copyable */}
                  <button
                    onClick={handleCopyWallet}
                    className="flex items-center justify-between w-full p-3 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors group/wallet"
                  >
                    <span className="text-xs text-gray-500 dark:text-gray-400">Wallet</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-gray-700 dark:text-gray-300">{shortWallet}</span>
                      {copied ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-400 group-hover/wallet:text-gray-600 dark:group-hover/wallet:text-gray-300" />
                      )}
                    </div>
                  </button>
                </div>
              </>
            )}

            {/* Footer */}
            <div className="p-3 border-t border-gray-200/50 dark:border-slate-700/50 text-center">
              <p className="text-[10px] text-gray-400 dark:text-gray-500">
                apeX Profile System • CryptoGift DAO
              </p>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}

export default TeamMemberApex;
