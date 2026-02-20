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
  Mail,
  Phone,
  MapPin,
  Car,
  Users,
  Heart,
} from 'lucide-react';

export const Footer: React.FC = () => {
  const t = useTranslations('footer');

  return (
    <footer className="bg-am-dark text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className="relative w-10 h-10">
                <Image
                  src="/logo-automall-square.png"
                  alt="Autos MALL"
                  width={40}
                  height={40}
                  className="rounded-xl object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
              <div>
                <div className="font-bold text-xl">Autos</div>
                <div className="text-xs font-bold -mt-1 text-am-orange">MALL</div>
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              {t('brand.description')}
            </p>
            <div className="flex space-x-4">
              {/* Instagram */}
              <a
                href="https://instagram.com/autosmall"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-am-orange transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              {/* Facebook */}
              <a
                href="https://facebook.com/autosmall"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-am-orange transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              {/* Email */}
              <a
                href="mailto:info@autosmall.com"
                className="text-gray-400 hover:text-am-orange transition-colors"
                aria-label="Email"
              >
                <Mail className="w-5 h-5" />
              </a>
              {/* Phone */}
              <a
                href="tel:+1-832-000-0000"
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
                  href="mailto:soporte@autosmall.com"
                  className="hover:text-am-orange transition-colors"
                >
                  {t('resources.support')}
                </a>
              </li>
              <li>
                <a
                  href="mailto:soporte@autosmall.com"
                  className="hover:text-am-orange transition-colors"
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
                  href="mailto:info@autosmall.com"
                  className="hover:text-am-orange transition-colors"
                >
                  {t('company.about')}
                </a>
              </li>
              <li>
                <a
                  href="mailto:info@autosmall.com"
                  className="hover:text-am-orange transition-colors"
                >
                  {t('company.contact')}
                </a>
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
            <Heart className="w-3.5 h-3.5 text-am-orange" />
            <span>{t('bottom.madeIn')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
