'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Navbar, NavbarSpacer } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Trash2 } from 'lucide-react';

export default function DataDeletionPage() {
  const t = useTranslations('legal');

  return (
    <>
      <Navbar />
      <NavbarSpacer />
      <div className="min-h-screen theme-gradient-bg">
        <div className="container mx-auto px-4 py-12 max-w-3xl">
          <div className="glass-crystal-enhanced rounded-2xl p-8 md:p-12">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {t('dataDeletion.title')}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('dataDeletion.subtitle')}
                </p>
              </div>
            </div>

            <div className="prose prose-gray dark:prose-invert max-w-none space-y-6 text-sm leading-relaxed">
              <section>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('dataDeletion.howTitle')}</h2>
                <p className="text-gray-600 dark:text-gray-300">{t('dataDeletion.howText')}</p>
                <ol className="list-decimal pl-6 text-gray-600 dark:text-gray-300 space-y-2">
                  <li>{t('dataDeletion.step1')}</li>
                  <li>{t('dataDeletion.step2')}</li>
                  <li>{t('dataDeletion.step3')}</li>
                  <li>{t('dataDeletion.step4')}</li>
                </ol>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('dataDeletion.facebookTitle')}</h2>
                <p className="text-gray-600 dark:text-gray-300">{t('dataDeletion.facebookText')}</p>
                <ol className="list-decimal pl-6 text-gray-600 dark:text-gray-300 space-y-2">
                  <li>{t('dataDeletion.fbStep1')}</li>
                  <li>{t('dataDeletion.fbStep2')}</li>
                  <li>{t('dataDeletion.fbStep3')}</li>
                  <li>{t('dataDeletion.fbStep4')}</li>
                </ol>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('dataDeletion.whatTitle')}</h2>
                <ul className="list-disc pl-6 text-gray-600 dark:text-gray-300 space-y-1">
                  <li>{t('dataDeletion.what1')}</li>
                  <li>{t('dataDeletion.what2')}</li>
                  <li>{t('dataDeletion.what3')}</li>
                  <li>{t('dataDeletion.what4')}</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('dataDeletion.timelineTitle')}</h2>
                <p className="text-gray-600 dark:text-gray-300">{t('dataDeletion.timelineText')}</p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('dataDeletion.contactTitle')}</h2>
                <p className="text-gray-600 dark:text-gray-300">{t('dataDeletion.contactText')}</p>
              </section>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
