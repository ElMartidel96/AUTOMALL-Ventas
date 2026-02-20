/**
 * Dynamic Open Graph Image for Public Profile
 * Generates a visual preview card for social media sharing
 *
 * This image appears when the profile link is shared on:
 * - WhatsApp
 * - Telegram
 * - Twitter/X
 * - Discord
 * - Facebook
 * - LinkedIn
 * - Any platform that supports OG images
 *
 * Made by mbxarts.com The Moon in a Box property
 * Co-Author: Godez22
 */

import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'CryptoGift DAO Profile';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

interface ProfileData {
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  tier: string;
  tier_color: string;
  reputation_score: number;
  total_tasks_completed: number;
  total_cgc_earned: number;
  bio: string | null;
}

async function getProfile(wallet: string): Promise<ProfileData | null> {
  try {
    // Use absolute URL for edge runtime
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cryptogift.mbxarts.com';
    const res = await fetch(`${baseUrl}/api/profile?wallet=${wallet}&public=true`, {
      next: { revalidate: 60 }, // Cache for 60 seconds
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.data;
  } catch {
    return null;
  }
}

export default async function Image({ params }: { params: { wallet: string } }) {
  const profile = await getProfile(params.wallet);

  const displayName = profile?.display_name || profile?.username || 'Anonymous';
  const tier = profile?.tier || 'Member';
  const tierColor = profile?.tier_color || '#f59e0b';
  const reputation = profile?.reputation_score || 0;
  const tasks = profile?.total_tasks_completed || 0;
  const cgc = profile?.total_cgc_earned || 0;
  const avatarUrl = profile?.avatar_url;
  const bio = profile?.bio || 'CryptoGift DAO Member';
  const walletShort = `${params.wallet.slice(0, 6)}...${params.wallet.slice(-4)}`;

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1e1b4b 100%)',
          padding: '48px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Header with logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '32px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                fontWeight: 'bold',
                color: 'white',
              }}
            >
              CGC
            </div>
            <span
              style={{
                fontSize: '24px',
                fontWeight: '600',
                color: '#94a3b8',
              }}
            >
              CryptoGift DAO
            </span>
          </div>
          <div
            style={{
              fontSize: '18px',
              color: '#64748b',
            }}
          >
            Profile Card
          </div>
        </div>

        {/* Main content */}
        <div
          style={{
            display: 'flex',
            flex: 1,
            gap: '48px',
          }}
        >
          {/* Left: Avatar and basic info */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '280px',
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: '180px',
                height: '180px',
                borderRadius: '50%',
                background: avatarUrl
                  ? 'transparent'
                  : 'linear-gradient(135deg, #f59e0b, #ea580c)',
                border: '4px solid rgba(245, 158, 11, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                marginBottom: '24px',
              }}
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt=""
                  width={180}
                  height={180}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <svg
                  width="80"
                  height="80"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              )}
            </div>

            {/* Tier badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 20px',
                borderRadius: '9999px',
                background: tierColor,
                color: 'white',
                fontSize: '18px',
                fontWeight: '700',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
              {tier}
            </div>

            {/* Wallet */}
            <div
              style={{
                marginTop: '16px',
                padding: '8px 16px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#94a3b8',
                fontSize: '16px',
                fontFamily: 'monospace',
              }}
            >
              {walletShort}
            </div>
          </div>

          {/* Right: Name, bio, stats */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              justifyContent: 'center',
            }}
          >
            {/* Name */}
            <h1
              style={{
                fontSize: '56px',
                fontWeight: '800',
                color: 'white',
                margin: '0 0 8px 0',
                lineHeight: 1.1,
              }}
            >
              {displayName}
            </h1>

            {/* Bio */}
            <p
              style={{
                fontSize: '22px',
                color: '#94a3b8',
                margin: '0 0 32px 0',
                lineHeight: 1.4,
                maxWidth: '500px',
              }}
            >
              {bio.length > 100 ? bio.slice(0, 100) + '...' : bio}
            </p>

            {/* Stats */}
            <div
              style={{
                display: 'flex',
                gap: '24px',
              }}
            >
              {/* Reputation */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '20px 32px',
                  background: 'rgba(245, 158, 11, 0.15)',
                  borderRadius: '16px',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                }}
              >
                <span
                  style={{
                    fontSize: '36px',
                    fontWeight: '800',
                    color: '#f59e0b',
                  }}
                >
                  {reputation}
                </span>
                <span
                  style={{
                    fontSize: '14px',
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                  }}
                >
                  Reputation
                </span>
              </div>

              {/* Tasks */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '20px 32px',
                  background: 'rgba(59, 130, 246, 0.15)',
                  borderRadius: '16px',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                }}
              >
                <span
                  style={{
                    fontSize: '36px',
                    fontWeight: '800',
                    color: '#3b82f6',
                  }}
                >
                  {tasks}
                </span>
                <span
                  style={{
                    fontSize: '14px',
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                  }}
                >
                  Tasks
                </span>
              </div>

              {/* CGC Earned */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '20px 32px',
                  background: 'rgba(34, 197, 94, 0.15)',
                  borderRadius: '16px',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                }}
              >
                <span
                  style={{
                    fontSize: '36px',
                    fontWeight: '800',
                    color: '#22c55e',
                  }}
                >
                  {cgc.toLocaleString()}
                </span>
                <span
                  style={{
                    fontSize: '14px',
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                  }}
                >
                  CGC Earned
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: '24px',
            paddingTop: '24px',
            borderTop: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <span
            style={{
              fontSize: '16px',
              color: '#64748b',
            }}
          >
            cryptogift.mbxarts.com
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
