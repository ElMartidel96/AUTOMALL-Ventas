'use client';

import React from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Phone, MessageCircle, Mail, MapPin, ExternalLink, Eye } from 'lucide-react';
import { InstagramIcon, FacebookIcon, TikTokIcon } from '@/components/icons/SocialIcons';
import { APP_DOMAIN } from '@/lib/config/features';
import { DEFAULT_LOGO } from '@/lib/config/defaults';
import type { Seller } from '@/lib/types/seller';

function normalizeSocialUrl(value: string, platform: 'instagram' | 'facebook' | 'tiktok'): string {
  if (value.startsWith('http')) return value;
  const handle = value.replace(/^@/, '');
  const bases = {
    instagram: 'https://instagram.com/',
    facebook: 'https://facebook.com/',
    tiktok: 'https://tiktok.com/@',
  };
  return `${bases[platform]}${handle}`;
}

export function DealerPreviewCard({ seller }: { seller: Seller }) {
  const t = useTranslations('profile');

  const hasHandle = !!seller.handle?.trim();
  const sellerUrl = hasHandle ? `https://${seller.handle}.${APP_DOMAIN}` : '';
  const hasContact = !!(seller.phone || seller.whatsapp || seller.email || seller.address);
  const hasSocial = !!(seller.social_instagram || seller.social_facebook || seller.social_tiktok);

  return (
    <div className="glass-crystal-enhanced rounded-2xl p-5">
      <h3 className="font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
        <Eye className="w-5 h-5 text-am-blue" />
        {t('dealerPreview')}
      </h3>
      <p className="text-xs text-gray-400 mb-4">{t('dealerPreviewHint')}</p>

      <div className="bg-white/50 dark:bg-white/5 rounded-xl p-5 border border-gray-100 dark:border-gray-700/50">
        {/* Header: Logo + Business Name + Tagline */}
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden ring-2 ring-gray-200 dark:ring-gray-700 flex-shrink-0">
            <Image
              src={seller.logo_url || DEFAULT_LOGO}
              alt={seller.business_name}
              width={56}
              height={56}
              className="w-full h-full object-cover"
              unoptimized
            />
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-lg text-gray-900 dark:text-white truncate">
              {seller.business_name}
            </h4>
            {seller.tagline && (
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{seller.tagline}</p>
            )}
          </div>
        </div>

        {/* Contact Methods */}
        <div className="mb-4">
          <h5 className="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-2">
            {t('contactMethods')}
          </h5>
          {hasContact ? (
            <div className="flex flex-wrap gap-2">
              {seller.phone && (
                <a
                  href={`tel:${seller.phone}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-am-blue/10 text-am-blue dark:text-am-blue-light text-sm font-medium hover:bg-am-blue/20 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  {seller.phone}
                </a>
              )}
              {seller.whatsapp && (
                <a
                  href={`https://wa.me/${seller.whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 text-sm font-medium hover:bg-green-500/20 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  {t('whatsappLabel')}
                </a>
              )}
              {seller.email && (
                <a
                  href={`mailto:${seller.email}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-am-orange/10 text-am-orange text-sm font-medium hover:bg-am-orange/20 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" />
                  {seller.email}
                </a>
              )}
              {seller.address && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm">
                  <MapPin className="w-3.5 h-3.5" />
                  {seller.address}
                </span>
              )}
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic">{t('noContactInfo')}</p>
          )}
        </div>

        {/* Social Presence */}
        <div className="mb-5">
          <h5 className="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-2">
            {t('socialPresence')}
          </h5>
          {hasSocial ? (
            <div className="flex gap-3">
              {seller.social_instagram && (
                <a
                  href={normalizeSocialUrl(seller.social_instagram, 'instagram')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white hover:scale-110 transition-transform"
                  aria-label="Instagram"
                >
                  <InstagramIcon className="w-4 h-4" />
                </a>
              )}
              {seller.social_facebook && (
                <a
                  href={normalizeSocialUrl(seller.social_facebook, 'facebook')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white hover:scale-110 transition-transform"
                  aria-label="Facebook"
                >
                  <FacebookIcon className="w-4 h-4" />
                </a>
              )}
              {seller.social_tiktok && (
                <a
                  href={normalizeSocialUrl(seller.social_tiktok, 'tiktok')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-gray-900 dark:bg-white flex items-center justify-center text-white dark:text-gray-900 hover:scale-110 transition-transform"
                  aria-label="TikTok"
                >
                  <TikTokIcon className="w-4 h-4" />
                </a>
              )}
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic">{t('noSocialLinks')}</p>
          )}
        </div>

        {/* Visit page button */}
        {hasHandle && (
          <a
            href={sellerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-am-orange to-am-orange-light text-white text-sm font-bold hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            <ExternalLink className="w-4 h-4" />
            {t('visitPage')}
          </a>
        )}
      </div>
    </div>
  );
}
