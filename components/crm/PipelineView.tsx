'use client';

import { useTranslations } from 'next-intl';
import type { CRMLead } from '@/hooks/useCRM';

interface Props {
  leads: CRMLead[];
  onLeadClick: (lead: CRMLead) => void;
}

const pipelineStages = ['new', 'contacted', 'qualified', 'negotiating', 'won', 'lost'];

const stageColors: Record<string, { bg: string; border: string; dot: string }> = {
  new: { bg: 'bg-blue-50 dark:bg-blue-900/10', border: 'border-blue-200 dark:border-blue-800', dot: 'bg-blue-500' },
  contacted: { bg: 'bg-yellow-50 dark:bg-yellow-900/10', border: 'border-yellow-200 dark:border-yellow-800', dot: 'bg-yellow-500' },
  qualified: { bg: 'bg-purple-50 dark:bg-purple-900/10', border: 'border-purple-200 dark:border-purple-800', dot: 'bg-purple-500' },
  negotiating: { bg: 'bg-orange-50 dark:bg-orange-900/10', border: 'border-orange-200 dark:border-orange-800', dot: 'bg-orange-500' },
  won: { bg: 'bg-green-50 dark:bg-green-900/10', border: 'border-green-200 dark:border-green-800', dot: 'bg-green-500' },
  lost: { bg: 'bg-red-50 dark:bg-red-900/10', border: 'border-red-200 dark:border-red-800', dot: 'bg-red-500' },
};

export function PipelineView({ leads, onLeadClick }: Props) {
  const t = useTranslations('crm');

  const grouped = pipelineStages.reduce((acc, stage) => {
    acc[stage] = leads.filter((l) => l.status === stage);
    return acc;
  }, {} as Record<string, CRMLead[]>);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {pipelineStages.map((stage) => {
        const colors = stageColors[stage];
        const stageLeads = grouped[stage] || [];

        return (
          <div key={stage} className={`rounded-xl border ${colors.border} ${colors.bg} p-3`}>
            <div className="flex items-center gap-2 mb-3">
              <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {t(`status.${stage}`)}
              </span>
              <span className="text-xs text-gray-400 ml-auto">{stageLeads.length}</span>
            </div>

            <div className="space-y-2">
              {stageLeads.slice(0, 5).map((lead) => (
                <button
                  key={lead.id}
                  onClick={() => onLeadClick(lead)}
                  className="w-full text-left p-2 rounded-lg bg-white/80 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 transition-colors"
                >
                  <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                    {lead.name}
                  </p>
                  {lead.phone && (
                    <p className="text-[10px] text-gray-400 truncate">{lead.phone}</p>
                  )}
                </button>
              ))}
              {stageLeads.length > 5 && (
                <p className="text-[10px] text-gray-400 text-center">
                  +{stageLeads.length - 5} {t('more')}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
