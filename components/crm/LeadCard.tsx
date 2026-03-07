'use client';

import { useTranslations } from 'next-intl';
import { Phone, Mail, MessageCircle, Facebook, Clock, ChevronRight } from 'lucide-react';
import type { CRMLead } from '@/hooks/useCRM';

interface Props {
  lead: CRMLead;
  onClick: () => void;
}

const interestColors: Record<string, string> = {
  hot: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  warm: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
  cold: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  lost: 'bg-gray-100 dark:bg-gray-800 text-gray-500',
};

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  contacted: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
  qualified: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  negotiating: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
  won: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
  lost: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
};

const sourceIcons: Record<string, React.ReactNode> = {
  facebook: <Facebook className="w-3 h-3 text-[#1877F2]" />,
  whatsapp: <MessageCircle className="w-3 h-3 text-green-500" />,
  phone: <Phone className="w-3 h-3 text-blue-500" />,
  email: <Mail className="w-3 h-3 text-purple-500" />,
};

export function LeadCard({ lead, onClick }: Props) {
  const t = useTranslations('crm');

  const timeSince = lead.last_contacted_at
    ? getTimeSince(new Date(lead.last_contacted_at))
    : null;

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 rounded-xl bg-gray-50 dark:bg-gray-800/30 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-gray-900 dark:text-white truncate">{lead.name}</h4>
            {sourceIcons[lead.source] && (
              <span title={t(`source.${lead.source}`)}>{sourceIcons[lead.source]}</span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[lead.status] || statusColors.new}`}>
              {t(`status.${lead.status}`)}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${interestColors[lead.interest_level] || interestColors.warm}`}>
              {t(`interest.${lead.interest_level}`)}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            {lead.phone && (
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {lead.phone}
              </span>
            )}
            {timeSince && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {timeSince}
              </span>
            )}
          </div>
        </div>

        <ChevronRight className="w-5 h-5 text-gray-300 dark:text-gray-600 flex-shrink-0 mt-2" />
      </div>
    </button>
  );
}

function getTimeSince(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Today';
  if (days === 1) return '1d ago';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}
