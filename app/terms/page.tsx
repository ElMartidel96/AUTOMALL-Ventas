'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Navbar, NavbarSpacer } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { FileText } from 'lucide-react';

export default function TermsOfServicePage() {
  const t = useTranslations('legal');

  return (
    <>
      <Navbar />
      <NavbarSpacer />
      <div className="min-h-screen theme-gradient-bg">
        <div className="container mx-auto px-4 py-12 max-w-3xl">
          <div className="glass-crystal-enhanced rounded-2xl p-8 md:p-12">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-am-orange to-am-orange-light flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {t('terms.title')}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('terms.lastUpdated', { date: 'February 28, 2026' })}
                </p>
              </div>
            </div>

            <div className="prose prose-gray dark:prose-invert max-w-none space-y-6 text-sm leading-relaxed">
              <section>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('terms.acceptanceTitle')}</h2>
                <p className="text-gray-600 dark:text-gray-300">{t('terms.acceptanceText')}</p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('terms.descriptionTitle')}</h2>
                <p className="text-gray-600 dark:text-gray-300">{t('terms.descriptionText')}</p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('terms.accountsTitle')}</h2>
                <p className="text-gray-600 dark:text-gray-300">{t('terms.accountsText')}</p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('terms.sellerTitle')}</h2>
                <p className="text-gray-600 dark:text-gray-300">{t('terms.sellerText')}</p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('terms.contentTitle')}</h2>
                <p className="text-gray-600 dark:text-gray-300">{t('terms.contentText')}</p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('terms.metaTitle')}</h2>
                <p className="text-gray-600 dark:text-gray-300">{t('terms.metaText')}</p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('terms.ipTitle')}</h2>
                <p className="text-gray-600 dark:text-gray-300">{t('terms.ipText')}</p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('terms.disclaimerTitle')}</h2>
                <p className="text-gray-600 dark:text-gray-300">{t('terms.disclaimerText')}</p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('terms.liabilityTitle')}</h2>
                <p className="text-gray-600 dark:text-gray-300">{t('terms.liabilityText')}</p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('terms.terminationTitle')}</h2>
                <p className="text-gray-600 dark:text-gray-300">{t('terms.terminationText')}</p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('terms.governingTitle')}</h2>
                <p className="text-gray-600 dark:text-gray-300">{t('terms.governingText')}</p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('terms.contactTitle')}</h2>
                <p className="text-gray-600 dark:text-gray-300">{t('terms.contactText')}</p>
              </section>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
