'use client';

/**
 * Public User Profile Page
 * Shows public profile info with social contact links for referrers to contact invitees
 *
 * Query params:
 * - ?card=presentation - Shows ProfileMiniCard (Presentation Card) as modal over the page
 */

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Navbar, NavbarSpacer } from '@/components/layout/Navbar';
import { ProfileCardProvider } from '@/components/profile/ProfileCardProvider';
import { ProfileMiniCard } from '@/components/profile/ProfileMiniCard';
import { ProfileFullCard } from '@/components/profile/ProfileFullCard';
import { useTrackReferralClick } from '@/hooks/useReferrals';
import {
  User,
  MessageCircle,
  Send,
  Twitter,
  Globe,
  Award,
  CheckCircle,
  Loader2,
  ArrowLeft,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';

interface PublicProfile {
  id: string;
  wallet_address: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  twitter_handle: string | null;
  telegram_handle: string | null;
  discord_handle: string | null;
  website_url: string | null;
  total_tasks_completed: number;
  total_cgc_earned: number;
  total_referrals: number;
  reputation_score: number;
  tier: string;
  tier_color: string;
  created_at: string;
}

export default function PublicProfilePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const wallet = params.wallet as string;

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Check if presentation card mode is active
  const showPresentationCard = searchParams.get('card') === 'presentation';

  // Check for referral code in URL (for tracking)
  const referralCode = searchParams.get('ref');

  // Track referral click when user arrives with a referral code
  const { trackClick } = useTrackReferralClick();
  const [referralTracked, setReferralTracked] = useState(false);

  useEffect(() => {
    // Track the referral click only once when page loads with ref param
    if (referralCode && !referralTracked) {
      trackClick({
        code: referralCode,
        metadata: {
          source: 'profile_share',
          medium: 'social',
          campaign: 'presentation_card',
          landing_page: `/user/${wallet}`,
        },
      });
      setReferralTracked(true);
    }
  }, [referralCode, referralTracked, trackClick, wallet]);

  // Close presentation card by removing query param
  const handleClosePresentationCard = () => {
    router.push(`/user/${wallet}`, { scroll: false });
  };

  useEffect(() => {
    async function fetchProfile() {
      if (!wallet) return;

      try {
        const res = await fetch(`/api/profile?wallet=${wallet}&public=true`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Profile not found');
        }
        const data = await res.json();
        setProfile(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [wallet]);

  const handleCopyWallet = async () => {
    await navigator.clipboard.writeText(wallet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasSocialLinks = profile?.discord_handle || profile?.telegram_handle || profile?.twitter_handle;

  if (loading) {
    return (
      <>
        <Navbar />
        <NavbarSpacer />
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        </div>
      </>
    );
  }

  if (error || !profile) {
    return (
      <>
        <Navbar />
        <NavbarSpacer />
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl border border-slate-200 dark:border-slate-700 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Profile Not Found
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              {error || 'This profile is private or does not exist'}
            </p>
            <Link
              href="/referrals"
              className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 dark:text-amber-400"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Referrals
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <NavbarSpacer />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          {/* Back Link */}
          <Link
            href="/referrals"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Referrals
          </Link>

          {/* Profile Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            {/* Header with gradient */}
            <div className="h-24 bg-gradient-to-r from-amber-400 to-orange-500" />

            {/* Profile Content */}
            <div className="px-6 pb-6">
              {/* Avatar - Overlapping header */}
              <div className="relative -mt-12 mb-4">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 border-4 border-white dark:border-slate-800 flex items-center justify-center overflow-hidden shadow-lg">
                  {profile.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt="Avatar"
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <User className="w-10 h-10 text-white" />
                  )}
                </div>
              </div>

              {/* Name and Username */}
              <div className="mb-4">
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {profile.display_name || profile.username || 'Anonymous'}
                  </h1>
                  {profile.tier && (
                    <span
                      className="px-2 py-1 rounded-full text-xs font-bold"
                      style={{ backgroundColor: profile.tier_color + '30', color: profile.tier_color }}
                    >
                      {profile.tier}
                    </span>
                  )}
                </div>
                {profile.username && (
                  <p className="text-slate-500 dark:text-slate-400">@{profile.username}</p>
                )}
              </div>

              {/* Bio */}
              {profile.bio && (
                <p className="text-slate-600 dark:text-slate-300 mb-6">
                  {profile.bio}
                </p>
              )}

              {/* Wallet Address */}
              <div className="flex items-center gap-2 mb-6 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <code className="text-sm font-mono text-slate-600 dark:text-slate-300 flex-1 truncate">
                  {wallet}
                </code>
                <button
                  onClick={handleCopyWallet}
                  className="p-2 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-slate-500" />
                  )}
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                  <p className="text-xl font-bold text-slate-900 dark:text-white">
                    {profile.total_tasks_completed}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Tasks</p>
                </div>
                <div className="text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                  <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
                    {profile.total_cgc_earned?.toLocaleString() || 0}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">CGC</p>
                </div>
                <div className="text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                  <p className="text-xl font-bold text-slate-900 dark:text-white">
                    {profile.reputation_score}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Reputation</p>
                </div>
              </div>

              {/* Social Contact Links - Prominent Section */}
              {hasSocialLinks && (
                <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-blue-500" />
                    Contact
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {profile.discord_handle && (
                      <a
                        href={`https://discord.com/users/${profile.discord_handle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-xl transition-colors border border-indigo-200 dark:border-indigo-800"
                      >
                        <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center">
                          <MessageCircle className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-white">Discord</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {profile.discord_handle}
                          </p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-slate-400" />
                      </a>
                    )}

                    {profile.telegram_handle && (
                      <a
                        href={`https://t.me/${profile.telegram_handle.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 bg-sky-50 dark:bg-sky-900/20 hover:bg-sky-100 dark:hover:bg-sky-900/30 rounded-xl transition-colors border border-sky-200 dark:border-sky-800"
                      >
                        <div className="w-10 h-10 rounded-full bg-sky-500 flex items-center justify-center">
                          <Send className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-white">Telegram</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            @{profile.telegram_handle.replace('@', '')}
                          </p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-slate-400" />
                      </a>
                    )}

                    {profile.twitter_handle && (
                      <a
                        href={`https://twitter.com/${profile.twitter_handle.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors border border-slate-200 dark:border-slate-600"
                      >
                        <div className="w-10 h-10 rounded-full bg-slate-900 dark:bg-slate-600 flex items-center justify-center">
                          <Twitter className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-white">Twitter/X</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            @{profile.twitter_handle.replace('@', '')}
                          </p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-slate-400" />
                      </a>
                    )}

                    {profile.website_url && (
                      <a
                        href={profile.website_url.startsWith('http') ? profile.website_url : `https://${profile.website_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-xl transition-colors border border-green-200 dark:border-green-800"
                      >
                        <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                          <Globe className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-white">Website</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {profile.website_url.replace(/^https?:\/\//, '')}
                          </p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-slate-400" />
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* No contact info message */}
              {!hasSocialLinks && (
                <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                  <div className="text-center py-4 text-slate-500 dark:text-slate-400">
                    <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No contact information available</p>
                  </div>
                </div>
              )}

              {/* Member Since */}
              <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Member since {new Date(profile.created_at).toLocaleDateString(undefined, {
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Presentation Card - shown when ?card=presentation */}
      {/* L3 (MiniCard) at right edge, click opens L4 (FullCard) at same position */}
      {/* isStandalone=true: no backdrop, no click-outside-close, close buttons visible */}
      {showPresentationCard && profile && (
        <ProfileCardProvider
          wallet={wallet}
          initialLevel={3}
          isStandalone={true}
          onStandaloneClose={handleClosePresentationCard}
        >
          <ProfileMiniCard
            standalone
            standaloneProfile={{
              wallet_address: profile.wallet_address,
              username: profile.username,
              display_name: profile.display_name,
              avatar_url: profile.avatar_url,
              tier: profile.tier,
              tier_color: profile.tier_color,
              reputation_score: profile.reputation_score,
              total_tasks_completed: profile.total_tasks_completed,
              twitter_handle: profile.twitter_handle,
              telegram_handle: profile.telegram_handle,
              discord_handle: profile.discord_handle,
              website_url: profile.website_url,
            }}
            onClose={handleClosePresentationCard}
          />
          {/* L4 renders when user clicks on L3 */}
          <ProfileFullCard />
        </ProfileCardProvider>
      )}
    </>
  );
}
