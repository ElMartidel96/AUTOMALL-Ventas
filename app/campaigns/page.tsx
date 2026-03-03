'use client';

/**
 * Campaigns Page — Facebook Click-to-WhatsApp Campaign Manager
 *
 * Seller-facing page for creating and managing CTWA campaigns.
 * Two views: Dashboard (list) and Builder (create new).
 *
 * Auth: Requires seller login.
 * Feature flag: FEATURE_CAMPAIGNS
 */

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Navbar, NavbarSpacer } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useAccount } from '@/lib/thirdweb';
import { useUser } from '@/hooks/useUser';
import { FEATURE_CAMPAIGNS } from '@/lib/config/features';
import { CampaignBuilder } from '@/components/campaigns/CampaignBuilder';
import { CampaignDashboard } from '@/components/campaigns/CampaignDashboard';
import { Megaphone, Plus, LayoutDashboard, ArrowLeft, Car } from 'lucide-react';

export default function CampaignsPage() {
  const { isConnected, address } = useAccount();
  const { isDealer, isLoading: userLoading } = useUser();
  const t = useTranslations('campaigns');

  const [view, setView] = useState<'dashboard' | 'create'>('dashboard');
  const [vehicles, setVehicles] = useState<
    { id: string; brand: string; model: string; year: number; price: number; image_url?: string }[]
  >([]);
  const [sellerData, setSellerData] = useState<{
    whatsapp: string;
    phone: string;
    handle: string;
    business_name: string;
  } | null>(null);

  // Detect language from browser
  const [lang, setLang] = useState<'en' | 'es'>('en');
  useEffect(() => {
    const browserLang = navigator.language || '';
    setLang(browserLang.startsWith('es') ? 'es' : 'en');
  }, []);

  // Load seller data and vehicles
  useEffect(() => {
    if (!address) return;

    async function loadData() {
      try {
        // Load vehicles
        const vRes = await fetch(`/api/inventory?wallet=${address}&status=active`);
        if (vRes.ok) {
          const vData = await vRes.json();
          setVehicles(
            (vData.vehicles || []).map(
              (v: { id: string; brand: string; model: string; year: number; price: number }) => ({
                id: v.id,
                brand: v.brand,
                model: v.model,
                year: v.year,
                price: v.price,
              })
            )
          );
        }

        // Load seller profile
        const pRes = await fetch(`/api/agent/keys?wallet=${address}&action=profile`);
        if (pRes.ok) {
          const pData = await pRes.json();
          if (pData.seller) {
            setSellerData({
              whatsapp: pData.seller.whatsapp || '',
              phone: pData.seller.phone || '',
              handle: pData.seller.handle || '',
              business_name: pData.seller.business_name || '',
            });
          }
        }
      } catch {
        // Silently fail
      }
    }

    loadData();
  }, [address]);

  if (!FEATURE_CAMPAIGNS) {
    return null;
  }

  return (
    <div className="min-h-screen theme-gradient-bg">
      <Navbar />
      <NavbarSpacer />

      {/* Background */}
      <div className="fixed inset-0 opacity-20 dark:opacity-10 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-am-orange rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl animate-pulse" />
        <div className="absolute top-40 right-20 w-72 h-72 bg-am-blue rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl animate-pulse delay-1000" />
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-am-green rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl animate-pulse delay-2000" />
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-6 -mt-[19px]">
        {!isConnected ? (
          <div className="glass-panel p-12 text-center">
            <Megaphone className="w-16 h-16 mx-auto text-am-orange mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {lang === 'es' ? 'Inicia sesion para gestionar campañas' : 'Sign in to manage campaigns'}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              {lang === 'es'
                ? 'Conecta tu cuenta para crear y gestionar campañas de Facebook-to-WhatsApp.'
                : 'Connect your account to create and manage Facebook-to-WhatsApp campaigns.'}
            </p>
          </div>
        ) : userLoading ? (
          <div className="glass-panel p-12 text-center">
            <div className="w-8 h-8 border-2 border-am-orange border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : (
          <>
            {/* View Toggle */}
            {view === 'create' && (
              <button
                onClick={() => setView('dashboard')}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('tabDashboard')}
              </button>
            )}

            {view === 'dashboard' ? (
              <CampaignDashboard
                walletAddress={address || ''}
                lang={lang}
                onCreateNew={() => setView('create')}
              />
            ) : (
              <CampaignBuilder
                walletAddress={address || ''}
                sellerWhatsapp={sellerData?.whatsapp || ''}
                sellerPhone={sellerData?.phone || ''}
                sellerHandle={sellerData?.handle || ''}
                sellerBusinessName={sellerData?.business_name || ''}
                vehicles={vehicles}
                lang={lang}
                onCampaignCreated={() => {
                  // Stay in create view to show success state
                }}
              />
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
