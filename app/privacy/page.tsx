'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Navbar, NavbarSpacer } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Shield } from 'lucide-react';

export default function PrivacyPolicyPage() {
  const t = useTranslations('legal');

  return (
    <>
      <Navbar />
      <NavbarSpacer />
      <div className="min-h-screen theme-gradient-bg">
        <div className="container mx-auto px-4 py-12 max-w-3xl">
          <div className="glass-crystal-enhanced rounded-2xl p-8 md:p-12">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-am-blue to-am-blue-light flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {t('privacy.title')}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('privacy.lastUpdated', { date: 'February 28, 2026' })}
                </p>
              </div>
            </div>

            <div className="prose prose-gray dark:prose-invert max-w-none space-y-6 text-sm leading-relaxed">
              <section>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('privacy.introTitle')}</h2>
                <p className="text-gray-600 dark:text-gray-300">{t('privacy.introText')}</p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('privacy.collectTitle')}</h2>
                <p className="text-gray-600 dark:text-gray-300">{t('privacy.collectText')}</p>
                <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-1">
                  <li>{t('privacy.collect1')}</li>
                  <li>{t('privacy.collect2')}</li>
                  <li>{t('privacy.collect3')}</li>
                  <li>{t('privacy.collect4')}</li>
                  <li>{t('privacy.collect5')}</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('privacy.useTitle')}</h2>
                <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-1">
                  <li>{t('privacy.use1')}</li>
                  <li>{t('privacy.use2')}</li>
                  <li>{t('privacy.use3')}</li>
                  <li>{t('privacy.use4')}</li>
                  <li>{t('privacy.use5')}</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('privacy.thirdPartyTitle')}</h2>
                <p className="text-gray-600 dark:text-gray-300">{t('privacy.thirdPartyText')}</p>
                <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-1">
                  <li>{t('privacy.thirdParty1')}</li>
                  <li>{t('privacy.thirdParty2')}</li>
                  <li>{t('privacy.thirdParty3')}</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('privacy.facebookTitle')}</h2>
                <p className="text-gray-600 dark:text-gray-300">{t('privacy.facebookText')}</p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('privacy.securityTitle')}</h2>
                <p className="text-gray-600 dark:text-gray-300">{t('privacy.securityText')}</p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('privacy.retentionTitle')}</h2>
                <p className="text-gray-600 dark:text-gray-300">{t('privacy.retentionText')}</p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('privacy.rightsTitle')}</h2>
                <p className="text-gray-600 dark:text-gray-300">{t('privacy.rightsText')}</p>
                <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-1">
                  <li>{t('privacy.rights1')}</li>
                  <li>{t('privacy.rights2')}</li>
                  <li>{t('privacy.rights3')}</li>
                  <li>{t('privacy.rights4')}</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('privacy.ccpaTitle')}</h2>
                <p className="text-gray-600 dark:text-gray-300">{t('privacy.ccpaText')}</p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('privacy.childrenTitle')}</h2>
                <p className="text-gray-600 dark:text-gray-300">{t('privacy.childrenText')}</p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('privacy.changesTitle')}</h2>
                <p className="text-gray-600 dark:text-gray-300">{t('privacy.changesText')}</p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('privacy.contactTitle')}</h2>
                <p className="text-gray-600 dark:text-gray-300">{t('privacy.contactText')}</p>
              </section>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
