/**
 * PERMANENT REFERRAL CARD COMPONENT
 *
 * Multi-use referral link generator that NEVER expires.
 * Tracks ALL users who click and complete signup through the link.
 *
 * Features:
 * - Never expires (permanent links)
 * - Unlimited users OR custom max_claims limit
 * - Full analytics: clicks, claims, completion rate
 * - Password protection (optional)
 * - Custom image and message
 * - Complete user history tracking
 * - Can pause/resume instead of delete
 *
 * Made by mbxarts.com The Moon in a Box property
 * Co-Author: Godez22
 *
 * @component
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Infinity,
  Copy,
  Check,
  Sparkles,
  Lock,
  Users,
  Award,
  ExternalLink,
  RefreshCw,
  Loader2,
  Star,
  Link as LinkIcon,
  ImagePlus,
  Eye,
  X,
  Upload,
  ChevronDown,
  ChevronUp,
  History,
  MessageSquare,
  Pause,
  Play,
  Calendar,
  TrendingUp,
  UserCheck,
  Activity,
  Wallet,
  BarChart3,
  QrCode,
  Clock,
} from 'lucide-react';
import { QRCodeModal } from './QRCodeModal';
import {
  MASTERCLASS_TYPE_OPTIONS,
  type MasterclassType
} from '@/lib/supabase/types';
import { BookOpen } from 'lucide-react';

interface PermanentReferralCardProps {
  referralCode: string;
  walletAddress?: string;
}

interface PermanentInviteData {
  code: string;
  password?: string;
  customMessage?: string;
  customTitle?: string;
  image?: string;
  maxClaims?: number;
  masterclassType: MasterclassType;
  createdAt: string;
}

// Interface for stored permanent invites from database
interface StoredPermanentInvite {
  inviteCode: string;
  customMessage: string | null;
  customTitle: string | null;
  imageUrl: string | null;
  hasPassword: boolean;
  status: 'active' | 'paused' | 'disabled';
  neverExpires: boolean;
  expiresAt: string | null;
  maxClaims: number | null;
  masterclassType: MasterclassType;
  totalClicks: number;
  totalClaims: number;
  totalCompleted: number;
  conversionRate: number;
  createdAt: string;
  lastClaimedAt: string | null;
}

interface ClaimHistoryEntry {
  wallet: string;
  claimedAt: string;
  completedAt: string | null;
  bonusClaimed: boolean;
  bonusAmount: number;
  // User profile data from metadata
  userProfile?: {
    email: string | null;
    selectedRole: string | null;
    twitter: { username: string | null; userId: string | null } | null;
    discord: { username: string | null; userId: string | null } | null;
  };
}

// Partial activation (users who started but haven't connected wallet)
interface PartialActivationEntry {
  partialId: string;
  inviteCode: string;
  createdAt: string;
  updatedAt: string;
  email: string | null;
  selectedRole: string | null;
  twitter: { username: string | null } | null;
  discord: { username: string | null } | null;
  hasEmail: boolean;
  hasRole: boolean;
  hasTwitter: boolean;
  hasDiscord: boolean;
}

export function PermanentReferralCard({ referralCode, walletAddress }: PermanentReferralCardProps) {
  const t = useTranslations('referrals.permanent');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [password, setPassword] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [maxClaims, setMaxClaims] = useState<string>(''); // Empty = unlimited
  const [masterclassType, setMasterclassType] = useState<MasterclassType>('v2'); // V2 is default
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [showForm, setShowForm] = useState(true);

  // State for permanent invites history
  const [permanentInvites, setPermanentInvites] = useState<StoredPermanentInvite[]>([]);
  const [isLoadingInvites, setIsLoadingInvites] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedInvite, setSelectedInvite] = useState<string | null>(null);
  const [claimHistory, setClaimHistory] = useState<Record<string, ClaimHistoryEntry[]>>({});
  const [partialActivations, setPartialActivations] = useState<Record<string, PartialActivationEntry[]>>({});
  const [loadingClaimHistory, setLoadingClaimHistory] = useState<string | null>(null);
  const [pausingInviteCode, setPausingInviteCode] = useState<string | null>(null);
  const [qrModalInvite, setQrModalInvite] = useState<{ code: string; url: string } | null>(null);

  const defaultMessage = t('form.customMessagePlaceholder');
  const defaultTitle = t('form.customTitlePlaceholder');

  // Load permanent invites on mount and when wallet changes
  useEffect(() => {
    const fetchPermanentInvites = async () => {
      if (!walletAddress) return;

      setIsLoadingInvites(true);
      try {
        const response = await fetch(`/api/referrals/permanent-invite/user?wallet=${walletAddress}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.invites) {
            setPermanentInvites(data.invites);
            console.log(`📋 Loaded ${data.invites.length} permanent invites`);
          }
        }
      } catch (error) {
        console.error('Error fetching permanent invites:', error);
      } finally {
        setIsLoadingInvites(false);
      }
    };

    fetchPermanentInvites();
  }, [walletAddress]);

  // Load claim history and partial activations for a specific invite
  const loadClaimHistory = useCallback(async (inviteCode: string) => {
    setLoadingClaimHistory(inviteCode);
    try {
      // Load both claim history and partial activations in parallel
      const [historyResponse, partialsResponse] = await Promise.all([
        fetch(`/api/referrals/permanent-invite/history?code=${inviteCode}`),
        fetch(`/api/referrals/permanent-invite/partial-activation?code=${inviteCode}`),
      ]);

      if (historyResponse.ok) {
        const data = await historyResponse.json();
        if (data.success && data.claims) {
          setClaimHistory(prev => ({ ...prev, [inviteCode]: data.claims }));
        }
      }

      if (partialsResponse.ok) {
        const data = await partialsResponse.json();
        if (data.success && data.partialActivations) {
          setPartialActivations(prev => ({ ...prev, [inviteCode]: data.partialActivations }));
        }
      }
    } catch (error) {
      console.error('Error loading claim history:', error);
    } finally {
      setLoadingClaimHistory(null);
    }
  }, []);

  // Toggle invite status (pause/resume)
  const handleToggleInviteStatus = useCallback(async (inviteCode: string, currentStatus: string) => {
    if (!walletAddress) return;

    const action = currentStatus === 'active' ? 'pause' : 'resume';
    const newStatus = action === 'pause' ? 'paused' : 'active';
    setPausingInviteCode(inviteCode);

    try {
      const response = await fetch('/api/referrals/permanent-invite/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode, wallet: walletAddress, action }),
      });

      if (response.ok) {
        // Update local state
        setPermanentInvites(prev =>
          prev.map(invite =>
            invite.inviteCode === inviteCode
              ? { ...invite, status: newStatus as 'active' | 'paused' | 'disabled' }
              : invite
          )
        );
        console.log(`🔄 ${newStatus === 'active' ? 'Resumed' : 'Paused'} invite ${inviteCode}`);
      }
    } catch (error) {
      console.error('Error toggling invite status:', error);
    } finally {
      setPausingInviteCode(null);
    }
  }, [walletAddress]);

  // Delete a permanent invite permanently
  const handleDeleteInvite = useCallback(async (inviteCode: string) => {
    if (!walletAddress) return;

    const confirmed = window.confirm(t('deleteConfirm'));

    if (!confirmed) return;

    setPausingInviteCode(inviteCode);

    try {
      const response = await fetch('/api/referrals/permanent-invite/user', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode, wallet: walletAddress }),
      });

      if (response.ok) {
        // Remove from local state
        setPermanentInvites(prev => prev.filter(invite => invite.inviteCode !== inviteCode));
        // Clear claim history for this invite
        setClaimHistory(prev => {
          const newHistory = { ...prev };
          delete newHistory[inviteCode];
          return newHistory;
        });
        console.log(`🗑️ Deleted permanent invite ${inviteCode}`);
      } else {
        const data = await response.json();
        alert(`${t('errorDeleting')}: ${data.error || ''}`);
      }
    } catch (error) {
      console.error('Error deleting invite:', error);
      alert(t('errorDeleting'));
    } finally {
      setPausingInviteCode(null);
    }
  }, [walletAddress]);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return { color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300', text: t('history.status.active'), icon: <Activity className="h-3 w-3" /> };
      case 'paused':
        return { color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300', text: t('history.status.paused'), icon: <Pause className="h-3 w-3" /> };
      case 'disabled':
        return { color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', text: t('history.status.disabled'), icon: <X className="h-3 w-3" /> };
      default:
        return { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', text: t('history.status.unknown'), icon: null };
    }
  };

  // Handle image file selection
  const handleImageSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert(t('form.invalidImage'));
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert(t('form.imageTooLarge'));
      return;
    }

    setImageFile(file);

    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setCustomImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  // Remove selected image
  const handleRemoveImage = useCallback(() => {
    setCustomImage(null);
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Upload image to server
  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const generatePermanentLink = useCallback(async () => {
    // Validate wallet is connected before proceeding
    if (!walletAddress) {
      alert(t('errorNoWallet'));
      return;
    }

    setIsGenerating(true);

    try {
      // Upload image if selected
      let imageUrl: string | undefined;
      if (imageFile) {
        setIsUploadingImage(true);
        const uploadedUrl = await uploadImage(imageFile);
        setIsUploadingImage(false);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }

      // Generate unique code for this permanent invite
      const uniqueCode = `PI-${referralCode}-${Date.now().toString(36).toUpperCase()}`;

      const inviteData: PermanentInviteData = {
        code: uniqueCode,
        password: password || undefined,
        customMessage: customMessage || defaultMessage,
        customTitle: customTitle || defaultTitle,
        image: imageUrl,
        maxClaims: maxClaims ? parseInt(maxClaims) : undefined,
        masterclassType, // V2 is default, user can select legacy or none
        createdAt: new Date().toISOString(),
      };

      // Call API to create permanent invite
      const response = await fetch('/api/referrals/permanent-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...inviteData,
          referrerWallet: walletAddress,
          referrerCode: referralCode,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create permanent invite');
      }

      const data = await response.json();

      // Build the permanent invite URL
      const baseUrl = typeof window !== 'undefined'
        ? window.location.origin
        : 'https://cryptogift-dao.com';

      const permanentLink = `${baseUrl}/permanent-invite/${data.inviteCode}`;
      setGeneratedLink(permanentLink);

      // Store password to show it visibly after generation
      if (password) {
        setGeneratedPassword(password);
      }

      // Add the new invite to the beginning of permanentInvites list
      const newInvite: StoredPermanentInvite = {
        inviteCode: data.inviteCode,
        customMessage: customMessage || defaultMessage,
        customTitle: customTitle || defaultTitle,
        imageUrl: imageUrl || null,
        hasPassword: !!password,
        status: 'active',
        neverExpires: true,
        expiresAt: null,
        maxClaims: maxClaims ? parseInt(maxClaims) : null,
        masterclassType,
        totalClicks: 0,
        totalClaims: 0,
        totalCompleted: 0,
        conversionRate: 0,
        createdAt: new Date().toISOString(),
        lastClaimedAt: null,
      };
      setPermanentInvites(prev => [newInvite, ...prev]);

      setShowForm(false);
    } catch (error) {
      console.error('Error generating permanent link:', error);
      alert(t('errorGenerating'));
    } finally {
      setIsGenerating(false);
      setIsUploadingImage(false);
    }
  }, [referralCode, password, customMessage, customTitle, defaultMessage, defaultTitle, walletAddress, imageFile, maxClaims, masterclassType, t]);

  const handleCopy = useCallback(async () => {
    if (!generatedLink) return;

    await navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [generatedLink]);

  const handleCopyPassword = useCallback(async () => {
    if (!generatedPassword) return;

    await navigator.clipboard.writeText(generatedPassword);
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 2000);
  }, [generatedPassword]);

  const handleCreateAnother = useCallback(() => {
    setGeneratedLink(null);
    setGeneratedPassword(null);
    setShowForm(true);
    setPassword('');
    setCustomMessage('');
    setCustomTitle('');
    setCustomImage(null);
    setImageFile(null);
    setMaxClaims('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  return (
    <Card className="glass-panel border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50/50 to-indigo-50/50 dark:from-purple-950/20 dark:to-indigo-950/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg">
              <Infinity className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
                <span>{t('title')}</span>
                <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs">
                  <Infinity className="h-3 w-3 mr-1" />
                  {t('badge')}
                </Badge>
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                {t('subtitle')}
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Description */}
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          {t('description')}
        </p>

        {/* Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="flex items-start space-x-2 p-3 rounded-lg bg-white/60 dark:bg-slate-800/40">
            <Infinity className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {t('benefits.neverExpires')}
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-2 p-3 rounded-lg bg-white/60 dark:bg-slate-800/40">
            <Users className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {t('benefits.unlimitedUsers')}
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-2 p-3 rounded-lg bg-white/60 dark:bg-slate-800/40">
            <BarChart3 className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {t('benefits.fullAnalytics')}
              </p>
            </div>
          </div>
        </div>

        {showForm ? (
          /* Form to generate link */
          <div className="space-y-4 pt-2">
            {/* Custom Title */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                <Sparkles className="h-4 w-4 mr-2 text-purple-500" />
                {t('form.customTitle')}
              </label>
              <Input
                type="text"
                placeholder={t('form.customTitlePlaceholder')}
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="bg-white/70 dark:bg-slate-800/50"
                maxLength={100}
              />
            </div>

            {/* Custom Image Upload */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                <ImagePlus className="h-4 w-4 mr-2 text-purple-500" />
                {t('form.customImage')}
              </label>

              {customImage ? (
                <div className="relative rounded-xl overflow-hidden border-2 border-purple-200 dark:border-purple-700">
                  <Image
                    src={customImage}
                    alt="Preview"
                    width={400}
                    height={300}
                    className="w-full h-48 object-cover"
                  />
                  <button
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center cursor-pointer hover:border-purple-400 dark:hover:border-purple-500 transition-colors"
                >
                  <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('form.uploadPrompt')}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {t('form.uploadFormat')}
                  </p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>

            {/* Password - VISIBLE (not hidden) */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                <Lock className="h-4 w-4 mr-2 text-gray-500" />
                {t('form.password')}
              </label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder={t('form.passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/70 dark:bg-slate-800/50 pr-10 font-mono"
                />
                <Eye className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
              </div>
              <div className="flex items-center gap-2">
                <p className="text-xs text-gray-500 dark:text-gray-400 flex-1">
                  {t('form.passwordHelp')}
                </p>
                <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {t('form.passwordVisible')}
                </span>
              </div>
            </div>

            {/* Max Claims Limit */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                <Users className="h-4 w-4 mr-2 text-purple-500" />
                {t('form.maxClaims')}
              </label>
              <Input
                type="number"
                placeholder={t('form.maxClaimsPlaceholder')}
                value={maxClaims}
                onChange={(e) => setMaxClaims(e.target.value)}
                className="bg-white/70 dark:bg-slate-800/50"
                min="1"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('form.maxClaimsHelp')}
              </p>
            </div>

            {/* Custom Message */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                <Sparkles className="h-4 w-4 mr-2 text-purple-500" />
                {t('form.customMessage')}
              </label>
              <Textarea
                placeholder={t('form.customMessagePlaceholder')}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="bg-white/70 dark:bg-slate-800/50 min-h-[100px] resize-none"
                maxLength={500}
              />
              <div className="flex justify-between">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('form.customMessageHelp')}
                </p>
                <span className="text-xs text-gray-400">
                  {customMessage.length}/500
                </span>
              </div>
            </div>

            {/* Masterclass Type Selector */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                <BookOpen className="h-4 w-4 mr-2 text-amber-500" />
                {t('form.masterclassType')}
              </label>
              <select
                value={masterclassType}
                onChange={(e) => setMasterclassType(e.target.value as MasterclassType)}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white/70 dark:bg-slate-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
              >
                {MASTERCLASS_TYPE_OPTIONS.map((option) => (
                  <option key={option.typeId} value={option.typeId}>
                    {t(`form.masterclassTypeOptions.${option.typeId}`)}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('form.masterclassTypeHelp')}
              </p>
              {/* Preview of selected masterclass */}
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  {t(`form.masterclassTypeOptions.${masterclassType}Description`)}
                </p>
              </div>
            </div>

            {/* Generate Button */}
            <Button
              onClick={generatePermanentLink}
              disabled={isGenerating || isUploadingImage || !walletAddress}
              className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isUploadingImage ? t('uploadingImage') : t('generating')}
                </>
              ) : !walletAddress ? (
                <>
                  <Wallet className="h-4 w-4 mr-2" />
                  {t('connectWalletFirst')}
                </>
              ) : (
                <>
                  <Infinity className="h-4 w-4 mr-2" />
                  {t('generate')}
                </>
              )}
            </Button>
          </div>
        ) : (
          /* Generated Link Display */
          <div className="space-y-4 pt-2">
            {/* Success Banner */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800">
              <div className="flex items-center space-x-2 mb-3">
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  {t('linkCreated')}
                </span>
              </div>

              {/* Link with Copy Button */}
              <div className="flex items-center space-x-2">
                <code className="flex-1 text-xs bg-white/70 dark:bg-slate-800/50 p-3 rounded-lg text-gray-700 dark:text-gray-300 truncate border border-green-200 dark:border-green-800">
                  {generatedLink}
                </code>
                <Button
                  onClick={handleCopy}
                  variant="outline"
                  size="sm"
                  className="flex-shrink-0 border-green-300 dark:border-green-700"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-green-500 mr-1" />
                      {t('copied')}
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1" />
                      {t('copy')}
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* PASSWORD DISPLAY - Visible for sharing with invitee */}
            {generatedPassword && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-800">
                <div className="flex items-center space-x-2 mb-3">
                  <Lock className="h-5 w-5 text-purple-500" />
                  <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                    {t('passwordShare.title')}
                  </span>
                  <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs">
                    <Eye className="h-3 w-3 mr-1" />
                    {t('form.passwordVisible')}
                  </Badge>
                </div>

                <div className="flex items-center space-x-2">
                  <code className="flex-1 text-sm bg-white/70 dark:bg-slate-800/50 p-3 rounded-lg text-purple-800 dark:text-purple-200 font-mono font-bold border border-purple-200 dark:border-purple-800 tracking-wide">
                    {generatedPassword}
                  </code>
                  <Button
                    onClick={handleCopyPassword}
                    variant="outline"
                    size="sm"
                    className="flex-shrink-0 border-purple-300 dark:border-purple-700"
                  >
                    {copiedPassword ? (
                      <>
                        <Check className="h-4 w-4 text-purple-500 mr-1" />
                        {t('copied')}
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-1" />
                        {t('copy')}
                      </>
                    )}
                  </Button>
                </div>

                <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
                  {t('passwordShare.help')}
                </p>
              </div>
            )}

            <div className="flex space-x-3">
              <Button
                onClick={handleCreateAnother}
                variant="outline"
                className="flex-1"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {t('createAnother')}
              </Button>
              <Button
                onClick={() => generatedLink && window.open(generatedLink, '_blank')}
                variant="ghost"
                className="flex-shrink-0"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* PERMANENT INVITES HISTORY PANEL */}
        {permanentInvites.length > 0 && (
          <div className="mt-6 pt-6 border-t border-purple-200 dark:border-purple-800">
            {/* Collapsible Header */}
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 hover:from-purple-100 hover:to-indigo-100 dark:hover:from-purple-900/30 dark:hover:to-indigo-900/30 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <History className="h-5 w-5 text-purple-500" />
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {t('history.title')}
                </span>
                <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs">
                  {permanentInvites.length}
                </Badge>
              </div>
              {showHistory ? (
                <ChevronUp className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              )}
            </button>

            {/* History List */}
            {showHistory && (
              <div className="mt-3 space-y-3 max-h-96 overflow-y-auto">
                {isLoadingInvites ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
                    <span className="ml-2 text-sm text-gray-500">{t('history.loading')}</span>
                  </div>
                ) : (
                  permanentInvites.map((invite) => {
                    const statusBadge = getStatusBadge(invite.status);
                    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
                    const inviteUrl = `${baseUrl}/permanent-invite/${invite.inviteCode}`;
                    const isExpanded = selectedInvite === invite.inviteCode;
                    const claims = claimHistory[invite.inviteCode] || [];
                    const partials = partialActivations[invite.inviteCode] || [];

                    return (
                      <div
                        key={invite.inviteCode}
                        className="p-4 rounded-xl bg-white/70 dark:bg-slate-800/50 border border-gray-200 dark:border-gray-700 space-y-3"
                      >
                        {/* Header with status and date */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2">
                            <Badge className={`${statusBadge.color} text-xs flex items-center gap-1`}>
                              {statusBadge.icon}
                              {statusBadge.text}
                            </Badge>
                            {invite.hasPassword && (
                              <Lock className="h-3 w-3 text-purple-500" />
                            )}
                            <Badge variant="outline" className="text-xs">
                              <Infinity className="h-3 w-3 mr-1" />
                              {t('history.badgePermanent')}
                            </Badge>
                          </div>
                          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(invite.createdAt)}
                          </div>
                        </div>

                        {/* Analytics Stats */}
                        <div className="grid grid-cols-4 gap-2">
                          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 text-center">
                            <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">{t('history.analytics.clicks')}</div>
                            <div className="text-lg font-bold text-blue-700 dark:text-blue-300">{invite.totalClicks || 0}</div>
                          </div>
                          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2 text-center">
                            <div className="text-xs text-green-600 dark:text-green-400 mb-1">{t('history.analytics.claimed')}</div>
                            <div className="text-lg font-bold text-green-700 dark:text-green-300">{invite.totalClaims || 0}</div>
                          </div>
                          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-2 text-center">
                            <div className="text-xs text-purple-600 dark:text-purple-400 mb-1">{t('history.analytics.completed')}</div>
                            <div className="text-lg font-bold text-purple-700 dark:text-purple-300">{invite.totalCompleted || 0}</div>
                          </div>
                          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2 text-center">
                            <div className="text-xs text-amber-600 dark:text-amber-400 mb-1">{t('history.analytics.conversion')}</div>
                            <div className="text-lg font-bold text-amber-700 dark:text-amber-300">{(invite.conversionRate || 0).toFixed(0)}%</div>
                          </div>
                        </div>

                        {/* Invite Code */}
                        <div className="flex items-center space-x-2">
                          <code className="flex-1 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded text-gray-700 dark:text-gray-300 truncate">
                            {inviteUrl}
                          </code>
                          <Button
                            onClick={async () => {
                              await navigator.clipboard.writeText(inviteUrl);
                            }}
                            variant="ghost"
                            size="sm"
                            className="flex-shrink-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            onClick={() => window.open(inviteUrl, '_blank')}
                            variant="ghost"
                            size="sm"
                            className="flex-shrink-0"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center flex-wrap gap-2 pt-2">
                          {/* View History Button */}
                          <Button
                            onClick={() => {
                              if (isExpanded) {
                                setSelectedInvite(null);
                              } else {
                                setSelectedInvite(invite.inviteCode);
                                if (!claims.length) {
                                  loadClaimHistory(invite.inviteCode);
                                }
                              }
                            }}
                            variant="outline"
                            size="sm"
                            className="text-xs"
                          >
                            <UserCheck className="h-3 w-3 mr-1" />
                            {isExpanded ? t('history.viewHistory') : t('history.viewUsers', { count: invite.totalClaims })}
                          </Button>

                          {/* QR Code Button */}
                          <Button
                            onClick={() => setQrModalInvite({ code: invite.inviteCode, url: inviteUrl })}
                            variant="outline"
                            size="sm"
                            className="text-xs"
                          >
                            <QrCode className="h-3 w-3 mr-1" />
                            QR
                          </Button>

                          {/* Pause/Resume Button */}
                          <Button
                            onClick={() => handleToggleInviteStatus(invite.inviteCode, invite.status)}
                            variant="outline"
                            size="sm"
                            disabled={pausingInviteCode === invite.inviteCode}
                            className="text-xs"
                          >
                            {pausingInviteCode === invite.inviteCode ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : invite.status === 'active' ? (
                              <>
                                <Pause className="h-3 w-3 mr-1" />
                                {t('history.pause')}
                              </>
                            ) : (
                              <>
                                <Play className="h-3 w-3 mr-1" />
                                {t('history.resume')}
                              </>
                            )}
                          </Button>

                          {/* Delete Button */}
                          <Button
                            onClick={() => handleDeleteInvite(invite.inviteCode)}
                            variant="outline"
                            size="sm"
                            disabled={pausingInviteCode === invite.inviteCode}
                            className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                          >
                            {pausingInviteCode === invite.inviteCode ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <>
                                <X className="h-3 w-3 mr-1" />
                                {t('history.delete')}
                              </>
                            )}
                          </Button>
                        </div>

                        {/* Claim History Display */}
                        {isExpanded && (
                          <div className="mt-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                            <h4 className="text-sm font-medium text-purple-800 dark:text-purple-300 mb-2 flex items-center gap-2">
                              <UserCheck className="h-4 w-4" />
                              {t('history.usersTitle')} ({claims.length})
                            </h4>
                            {loadingClaimHistory === invite.inviteCode ? (
                              <div className="flex items-center justify-center py-2">
                                <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
                              </div>
                            ) : claims.length > 0 ? (
                              <div className="space-y-2 max-h-40 overflow-y-auto">
                                {claims.map((claim, idx) => (
                                  <div key={idx} className="flex items-center justify-between text-xs bg-white dark:bg-slate-800 p-2 rounded">
                                    <div className="flex items-center gap-2">
                                      <Wallet className="h-3 w-3 text-gray-400" />
                                      <code className="text-gray-700 dark:text-gray-300">
                                        {claim.wallet.slice(0, 6)}...{claim.wallet.slice(-4)}
                                      </code>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {claim.completedAt ? (
                                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 text-xs">
                                          {t('history.userCompleted')}
                                        </Badge>
                                      ) : (
                                        <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300 text-xs">
                                          {t('history.userPending')}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
                                {t('history.noUsers')}
                              </p>
                            )}

                            {/* Partial Activations Section */}
                            {partials.length > 0 && (
                              <div className="mt-4 pt-3 border-t border-purple-200 dark:border-purple-700">
                                <h5 className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-2">
                                  <Clock className="h-3 w-3" />
                                  {t('history.partialActivations') || 'Partial Activations'} ({partials.length})
                                </h5>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                  {t('history.partialDescription') || 'Users who started but haven\'t connected wallet yet'}
                                </p>
                                <div className="space-y-2 max-h-32 overflow-y-auto">
                                  {partials.map((partial, idx) => (
                                    <div key={idx} className="text-xs bg-amber-50 dark:bg-amber-900/20 p-2 rounded border border-amber-200 dark:border-amber-800">
                                      <div className="flex flex-wrap items-center gap-2">
                                        {partial.email && (
                                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded">
                                            📧 {partial.email.slice(0, 15)}{partial.email.length > 15 ? '...' : ''}
                                          </span>
                                        )}
                                        {partial.selectedRole && (
                                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 rounded">
                                            🎯 {partial.selectedRole}
                                          </span>
                                        )}
                                        {partial.hasTwitter && partial.twitter?.username && (
                                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 rounded">
                                            𝕏 @{partial.twitter.username}
                                          </span>
                                        )}
                                        {partial.hasDiscord && partial.discord?.username && (
                                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded">
                                            🎮 {partial.discord.username}
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-gray-500 dark:text-gray-400 mt-1 text-[10px]">
                                        {new Date(partial.updatedAt).toLocaleDateString()}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}

        {/* QR Code Modal for Permanent Invites */}
        {qrModalInvite && (
          <QRCodeModal
            isOpen={!!qrModalInvite}
            onClose={() => setQrModalInvite(null)}
            referralLink={qrModalInvite.url}
            referralCode={qrModalInvite.code}
          />
        )}
      </CardContent>
    </Card>
  );
}
