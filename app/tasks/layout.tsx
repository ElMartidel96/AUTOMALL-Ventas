/**
 * 📋 Tasks Section Layout
 *
 * CGC-gated layout for tasks section - community members only (1 CGC minimum)
 * Tasks are paid opportunities to build the CryptoGift ecosystem
 */

'use client'

import { Navbar, NavbarSpacer } from '@/components/layout/Navbar'
import { CGCAccessGate } from '@/components/auth/CGCAccessGate'
import { useTranslations } from 'next-intl'
import { CheckCircle, Gift, Trophy, Rocket, ArrowRight, Sparkles } from 'lucide-react'
import Link from 'next/link'

// Permanent invite link for campaign (OFFICIAL CAMPAIGN LINK)
const REFERRAL_INVITE_LINK = '/permanent-invite/PI-MK23MZ2Q-83C705CA88AE0B07'

/**
 * Custom content for insufficient balance state
 * Sales psychology: explain value, create desire, provide easy path to access
 */
function TasksGateContent() {
  const t = useTranslations('tasks.gate')

  return (
    <div className="space-y-6 text-left">
      {/* What are Tasks? */}
      <div className="p-4 bg-blue-50/80 dark:bg-blue-900/20 rounded-lg border border-blue-200/50 dark:border-blue-700/30">
        <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          {t('whatAreTasksTitle')}
        </h3>
        <p className="text-sm text-blue-700 dark:text-blue-400">
          {t('whatAreTasksDesc')}
        </p>
      </div>

      {/* Features/Benefits */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900 dark:text-white text-sm">
          {t('features.title')}
        </h4>
        <ul className="space-y-2">
          {[
            { icon: Trophy, text: t('features.item1') },
            { icon: Rocket, text: t('features.item2') },
            { icon: CheckCircle, text: t('features.item3') },
            { icon: Gift, text: t('features.item4') },
          ].map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
              <item.icon className="h-4 w-4 text-green-500 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <span>{item.text}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA: Get 200 CGC */}
      <div className="p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 dark:from-purple-900/30 dark:to-blue-900/30 rounded-lg border border-purple-200/50 dark:border-purple-700/30">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-purple-800 dark:text-purple-300">
            {t('cta.title')}
          </h4>
          <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 text-xs font-medium rounded-full">
            {t('cta.rewardBadge')}
          </span>
        </div>
        <p className="text-sm text-purple-700 dark:text-purple-400 mb-3">
          {t('cta.description')}
        </p>
        <Link
          href={REFERRAL_INVITE_LINK}
          className="inline-flex items-center gap-2 w-full justify-center px-4 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-lg transition-all shadow-lg hover:shadow-xl"
        >
          <Gift className="h-4 w-4" />
          {t('cta.buttonText')}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}

export default function TasksLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const t = useTranslations('tasks.gate')

  return (
    <>
      {/* Navbar always visible */}
      <Navbar />
      <NavbarSpacer />

      {/* CGC-gated content - 1 CGC minimum */}
      <CGCAccessGate
        requiredBalance="1"
        title={t('title')}
        description={t('description')}
        notConnectedContent={<TasksGateContent />}
        insufficientTitle={t('title')}
        insufficientDescription={t('description')}
        insufficientContent={<TasksGateContent />}
      >
        {children}
      </CGCAccessGate>
    </>
  )
}