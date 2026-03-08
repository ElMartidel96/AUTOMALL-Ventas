/**
 * Campaign Landing Page — Public CTWA page
 *
 * Mobile-first (82.9% of FB traffic is mobile).
 * SSR with client-side interactivity for event tracking.
 * No auth — this page is for buyers arriving from Facebook ads.
 */

import { Metadata } from 'next';
import { getCampaignBySlug } from '@/lib/campaigns/campaign-service';
import { CampaignLanding } from './CampaignLanding';

const DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || 'autosmall.org';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getCampaignBySlug(slug);

  if (!data) {
    return { title: 'Campaign Not Found — Autos MALL' };
  }

  const title = data.headline_en || data.name;
  const description = data.body_en?.slice(0, 160) || `Check out deals at ${data.seller.business_name}`;
  const firstVehicleImage = data.vehicles[0]?.image_url;

  return {
    title: `${title} — ${data.seller.business_name}`,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `https://${DOMAIN}/w/${slug}`,
      images: firstVehicleImage ? [{ url: firstVehicleImage, width: 1200, height: 630 }] : [],
      siteName: 'Autos MALL',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: firstVehicleImage ? [firstVehicleImage] : [],
    },
  };
}

export default async function CampaignLandingPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await getCampaignBySlug(slug);

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0D1B2A] to-[#1B3A6B] flex items-center justify-center">
        <div className="text-center text-white p-8">
          <h1 className="text-4xl font-bold mb-4">Campaign Not Found</h1>
          <p className="text-gray-300">This campaign may have ended or the link is incorrect.</p>
        </div>
      </div>
    );
  }

  return <CampaignLanding data={data} slug={slug} />;
}
