'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  ArrowLeft,
  Phone,
  Mail,
  MessageCircle,
  Facebook,
  DollarSign,
  Edit2,
  Trash2,
} from 'lucide-react';
import type { CRMLead } from '@/hooks/useCRM';
import { useInteractions, useAddInteraction, useUpdateLead, useDeleteLead } from '@/hooks/useCRM';
import { InteractionTimeline } from './InteractionTimeline';
import { AddInteractionForm } from './AddInteractionForm';

interface Props {
  lead: CRMLead;
  walletAddress: string;
  onBack: () => void;
  onEdit: () => void;
  onDeleted: () => void;
}

const statusOptions = ['new', 'contacted', 'qualified', 'negotiating', 'won', 'lost'];

export function LeadDetail({ lead, walletAddress, onBack, onEdit, onDeleted }: Props) {
  const t = useTranslations('crm');
  const { data: interactionsData, isLoading: interactionsLoading } = useInteractions(walletAddress, lead.id);
  const addInteraction = useAddInteraction(walletAddress);
  const updateLead = useUpdateLead(walletAddress);
  const deleteLead = useDeleteLead(walletAddress);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleStatusChange = (newStatus: string) => {
    updateLead.mutate({ id: lead.id, data: { status: newStatus } });
  };

  const handleAddInteraction = (data: { type: string; direction: string; summary: string; details?: string }) => {
    addInteraction.mutate({ leadId: lead.id, data });
  };

  const handleDelete = async () => {
    await deleteLead.mutateAsync(lead.id);
    onDeleted();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </button>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{lead.name}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t(`source.${lead.source}`)} · {new Date(lead.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Edit2 className="w-4 h-4 text-gray-400" />
          </button>
          {showDeleteConfirm ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-500">{t('confirmDelete')}</span>
              <button
                onClick={handleDelete}
                disabled={deleteLead.isPending}
                className="px-3 py-1 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-500 text-xs font-medium hover:bg-red-200 transition-colors"
              >
                {t('form.delete')}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 text-xs hover:bg-gray-200 transition-colors"
              >
                {t('form.cancel')}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
            </button>
          )}
        </div>
      </div>

      {/* Contact Info + Status */}
      <div className="glass-crystal-enhanced rounded-2xl p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {lead.phone && (
            <a href={`tel:${lead.phone}`} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 hover:text-am-green transition-colors">
              <Phone className="w-4 h-4 text-blue-500" /> {lead.phone}
            </a>
          )}
          {lead.email && (
            <a href={`mailto:${lead.email}`} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 hover:text-am-green transition-colors">
              <Mail className="w-4 h-4 text-purple-500" /> {lead.email}
            </a>
          )}
          {lead.whatsapp && (
            <a href={`https://wa.me/${lead.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 hover:text-am-green transition-colors">
              <MessageCircle className="w-4 h-4 text-green-500" /> {lead.whatsapp}
            </a>
          )}
          {lead.source === 'facebook' && lead.source_detail && (
            <span className="flex items-center gap-2 text-sm text-gray-500">
              <Facebook className="w-4 h-4 text-[#1877F2]" /> {t('source.facebook')}
            </span>
          )}
        </div>

        {(lead.budget_min || lead.budget_max) && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
            <DollarSign className="w-4 h-4 text-am-green" />
            {t('budget')}: ${lead.budget_min?.toLocaleString() || '?'} - ${lead.budget_max?.toLocaleString() || '?'}
          </div>
        )}

        {/* Status pipeline */}
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">{t('pipeline')}</p>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((s) => (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                disabled={updateLead.isPending}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  lead.status === s
                    ? 'bg-am-green text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {t(`status.${s}`)}
              </button>
            ))}
          </div>
        </div>

        {lead.notes && (
          <div className="mt-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/30">
            <p className="text-xs font-medium text-gray-500 mb-1">{t('form.notes')}</p>
            <p className="text-sm text-gray-700 dark:text-gray-300">{lead.notes}</p>
          </div>
        )}
      </div>

      {/* Add Interaction */}
      <AddInteractionForm
        onSubmit={handleAddInteraction}
        isLoading={addInteraction.isPending}
      />

      {/* Interaction Timeline */}
      <div className="glass-crystal-enhanced rounded-2xl p-6">
        <h3 className="font-bold text-gray-900 dark:text-white mb-4">{t('timeline')}</h3>
        {interactionsLoading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          </div>
        ) : (
          <InteractionTimeline interactions={interactionsData?.interactions || []} />
        )}
      </div>
    </div>
  );
}
