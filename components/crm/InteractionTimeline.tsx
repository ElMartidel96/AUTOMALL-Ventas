'use client';

import { useTranslations } from 'next-intl';
import {
  Phone,
  MessageCircle,
  Mail,
  Smartphone,
  Facebook,
  Globe,
  Car,
  UserCheck,
  StickyNote,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRight,
} from 'lucide-react';
import type { CRMInteraction } from '@/hooks/useCRM';

interface Props {
  interactions: CRMInteraction[];
}

const typeIcons: Record<string, React.ReactNode> = {
  call: <Phone className="w-4 h-4" />,
  whatsapp: <MessageCircle className="w-4 h-4" />,
  email: <Mail className="w-4 h-4" />,
  sms: <Smartphone className="w-4 h-4" />,
  facebook_comment: <Facebook className="w-4 h-4" />,
  facebook_message: <Facebook className="w-4 h-4" />,
  website_visit: <Globe className="w-4 h-4" />,
  test_drive: <Car className="w-4 h-4" />,
  walk_in: <UserCheck className="w-4 h-4" />,
  note: <StickyNote className="w-4 h-4" />,
  status_change: <ArrowRight className="w-4 h-4" />,
};

const typeColors: Record<string, string> = {
  call: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  whatsapp: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
  email: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  sms: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400',
  facebook_comment: 'bg-blue-100 dark:bg-blue-900/30 text-[#1877F2]',
  facebook_message: 'bg-blue-100 dark:bg-blue-900/30 text-[#1877F2]',
  website_visit: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
  test_drive: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
  walk_in: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
  note: 'bg-gray-100 dark:bg-gray-800 text-gray-500',
  status_change: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
};

const directionIcons: Record<string, React.ReactNode> = {
  inbound: <ArrowDownLeft className="w-3 h-3 text-green-500" />,
  outbound: <ArrowUpRight className="w-3 h-3 text-blue-500" />,
  internal: null,
};

export function InteractionTimeline({ interactions }: Props) {
  const t = useTranslations('crm');

  if (interactions.length === 0) {
    return (
      <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">
        {t('noInteractions')}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {interactions.map((interaction) => (
        <div key={interaction.id} className="flex gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${typeColors[interaction.type] || typeColors.note}`}>
            {typeIcons[interaction.type] || typeIcons.note}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {t(`interactionType.${interaction.type}`)}
              </span>
              {directionIcons[interaction.direction]}
              <span className="text-xs text-gray-400 ml-auto">
                {new Date(interaction.interaction_at).toLocaleDateString()}{' '}
                {new Date(interaction.interaction_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">{interaction.summary}</p>
            {interaction.details && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{interaction.details}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
