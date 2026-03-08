/**
 * Autos MALL - Footer Component
 *
 * Branded footer with navigation, social links, and stats.
 * i18n pattern: useTranslations('footer')
 */

'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import {
  Facebook,
  Instagram,
  MessageCircle,
  Mail,
  Phone,
  MapPin,
  Car,
  Users,
  Heart,
} from 'lucide-react';
import { useTenant } from '@/lib/tenant/TenantProvider';
import { DEFAULT_LOGO_FOOTER } from '@/lib/config/defaults';

export const Footer: React.FC = () => {
  const t = useTranslations('footer');
  const tLegal = useTranslations('legal');
  const { seller, isSubdomain } = useTenant();

  // Seller-specific or default contact info — WhatsApp is primary support channel
  const supportWhatsApp = 'https://wa.me/12814680109';
  const contactEmail = (isSubdomain && seller?.email) || 'info@autosmall.com';
  const contactPhone = (isSubdomain && seller?.phone) || '+1 (281) 468-0109';
  const instagramUrl = (isSubdomain && seller?.social_instagram) || 'https://instagram.com/autosmall';
  const facebookUrl = (isSubdomain && seller?.social_facebook) || 'https://facebook.com/autosmall';

  return (
    <footer className="bg-am-dark text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1">
            <div className="mb-4">
              {isSubdomain && seller?.logo_url ? (
                <Image
                  src={seller.logo_url}
                  alt={seller.business_name}
                  width={220}
                  height={120}
                  className="h-20 w-auto drop-shadow-md"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              ) : (
                <Image
                  src={DEFAULT_LOGO_FOOTER}
                  alt="Autos MALL"
                  width={220}
                  height={120}
                  className="h-20 w-auto drop-shadow-md"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              )}
            </div>
            <p className="text-gray-400 text-sm mb-4">
              {isSubdomain && seller ? seller.tagline || seller.business_name : t('brand.description')}
            </p>
            <div className="flex space-x-4">
              {/* Instagram */}
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-am-orange transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              {/* Facebook */}
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-am-orange transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              {/* WhatsApp — primary support */}
              <a
                href={isSubdomain && seller?.whatsapp ? `https://wa.me/${seller.whatsapp.replace(/\D/g, '')}` : supportWhatsApp}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-green-500 transition-colors"
                aria-label="WhatsApp"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
              {/* Email */}
              <a
                href={`mailto:${contactEmail}`}
                className="text-gray-400 hover:text-am-orange transition-colors"
                aria-label="Email"
              >
                <Mail className="w-5 h-5" />
              </a>
              {/* Phone */}
              <a
                href={`tel:${contactPhone}`}
                className="text-gray-400 hover:text-am-orange transition-colors"
                aria-label="Phone"
              >
                <Phone className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold text-lg mb-4">{t('product.title')}</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <Link href="/dashboard" className="hover:text-am-orange transition-colors">
                  {t('product.dashboard')}
                </Link>
              </li>
              <li>
                <Link href="/inventory" className="hover:text-am-orange transition-colors">
                  {t('product.inventory')}
                </Link>
              </li>
              <li>
                <Link href="/clients" className="hover:text-am-orange transition-colors">
                  {t('product.crm')}
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-am-orange transition-colors">
                  {t('product.analytics')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold text-lg mb-4">{t('resources.title')}</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <a
                  href={isSubdomain && seller?.whatsapp ? `https://wa.me/${seller.whatsapp.replace(/\D/g, '')}` : supportWhatsApp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-green-500 transition-colors"
                >
                  {t('resources.support')}
                </a>
              </li>
              <li>
                <a
                  href={isSubdomain && seller?.whatsapp ? `https://wa.me/${seller.whatsapp.replace(/\D/g, '')}` : supportWhatsApp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-green-500 transition-colors"
                >
                  {t('resources.faq')}
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold text-lg mb-4">{t('company.title')}</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <a
                  href={`mailto:${contactEmail}`}
                  className="hover:text-am-orange transition-colors"
                >
                  {t('company.about')}
                </a>
              </li>
              <li>
                <a
                  href={isSubdomain && seller?.whatsapp ? `https://wa.me/${seller.whatsapp.replace(/\D/g, '')}` : supportWhatsApp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-green-500 transition-colors"
                >
                  {t('company.contact')}
                </a>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-am-orange transition-colors">
                  {tLegal('footerPrivacy')}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-am-orange transition-colors">
                  {tLegal('footerTerms')}
                </Link>
              </li>
              <li>
                <Link href="/data-deletion" className="hover:text-am-orange transition-colors">
                  {tLegal('footerDataDeletion')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="border-t border-am-blue/30 mt-8 pt-8">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Users className="w-4 h-4 text-am-blue-light" />
                <div className="text-2xl font-bold text-am-blue-light">50+</div>
              </div>
              <div className="text-xs text-gray-500">{t('stats.sellers')}</div>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Car className="w-4 h-4 text-am-orange" />
                <div className="text-2xl font-bold text-am-orange">500+</div>
              </div>
              <div className="text-xs text-gray-500">{t('stats.listings')}</div>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <MapPin className="w-4 h-4 text-am-green" />
                <div className="text-2xl font-bold text-am-green">Houston</div>
              </div>
              <div className="text-xs text-gray-500">{t('stats.location')}</div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-am-blue/30 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm text-gray-400 mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} {t('brand.copyright')}
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            {isSubdomain ? (
              <>
                <span>Powered by</span>
                <a href="https://autosmall.org" className="text-am-orange hover:text-am-orange-light transition-colors font-medium">
                  Autos MALL
                </a>
              </>
            ) : (
              <>
                <Heart className="w-3.5 h-3.5 text-am-orange" />
                <span>{t('bottom.madeIn')}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};
