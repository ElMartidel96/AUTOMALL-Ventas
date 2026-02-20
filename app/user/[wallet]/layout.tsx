/**
 * Layout for Public Profile Page
 * Provides dynamic metadata for SEO and social sharing
 *
 * Made by mbxarts.com The Moon in a Box property
 * Co-Author: Godez22
 */

import { Metadata } from 'next';

interface ProfileData {
  display_name: string | null;
  username: string | null;
  bio: string | null;
  tier: string;
  reputation_score: number;
  total_tasks_completed: number;
}

async function getProfile(wallet: string): Promise<ProfileData | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cryptogift.mbxarts.com';
    const res = await fetch(`${baseUrl}/api/profile?wallet=${wallet}&public=true`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.data;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { wallet: string };
}): Promise<Metadata> {
  const profile = await getProfile(params.wallet);
  const displayName = profile?.display_name || profile?.username || 'Anonymous';
  const bio = profile?.bio || `CryptoGift DAO Member | ${profile?.tier || 'Member'} Tier`;
  const walletShort = `${params.wallet.slice(0, 6)}...${params.wallet.slice(-4)}`;

  const title = `${displayName} | CryptoGift DAO`;
  const description = profile
    ? `${bio.slice(0, 150)}${bio.length > 150 ? '...' : ''} | ${profile.tier} Tier | ${profile.reputation_score} Reputation | ${profile.total_tasks_completed} Tasks Completed`
    : `Profile ${walletShort} on CryptoGift DAO`;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cryptogift.mbxarts.com';
  const profileUrl = `${baseUrl}/user/${params.wallet}`;

  return {
    title,
    description,
    openGraph: {
      type: 'profile',
      title,
      description,
      url: profileUrl,
      siteName: 'CryptoGift DAO',
      locale: 'en_US',
      // The image is automatically provided by opengraph-image.tsx
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      // The image is automatically provided by twitter-image.tsx (falls back to opengraph-image)
    },
    alternates: {
      canonical: profileUrl,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function UserProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
