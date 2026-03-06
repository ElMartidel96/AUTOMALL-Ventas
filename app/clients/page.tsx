'use client';

/**
 * Autos MALL - CRM Page
 *
 * Client relationship management for sellers.
 * Supports: lead list, pipeline view, interactions, stats.
 */

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Navbar, NavbarSpacer } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useAccount } from '@/lib/thirdweb';
import { useUser } from '@/hooks/useUser';
import { useLeads, useCreateLead, useUpdateLead, useCRMStats } from '@/hooks/useCRM';
import { CRMStats } from '@/components/crm/CRMStats';
import { LeadList } from '@/components/crm/LeadList';
import { LeadDetail } from '@/components/crm/LeadDetail';
import { LeadForm, type LeadFormData } from '@/components/crm/LeadForm';
import { PipelineView } from '@/components/crm/PipelineView';
import { Users, Plus, LayoutGrid, List } from 'lucide-react';
import type { CRMLead } from '@/hooks/useCRM';

type ViewMode = 'list' | 'pipeline' | 'detail' | 'form';

export default function ClientsPage() {
  const t = useTranslations('crm');
  const { isConnected, address } = useAccount();
  const { isDealer, isBuyer, isLoading: userLoading } = useUser();

  const [view, setView] = useState<ViewMode>('list');
  const [selectedLead, setSelectedLead] = useState<CRMLead | null>(null);
  const [editingLead, setEditingLead] = useState<CRMLead | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [page, setPage] = useState(1);

  const walletAddress = address;

  const { data: leadsData, isLoading: leadsLoading } = useLeads(walletAddress, {
    search: search || undefined,
    status: statusFilter || undefined,
    source: sourceFilter || undefined,
    page,
  });
  const { data: stats } = useCRMStats(walletAddress);
  const createLead = useCreateLead(walletAddress);
  const updateLead = useUpdateLead(walletAddress);

  // Also fetch all leads for pipeline view (no pagination)
  const { data: allLeadsData } = useLeads(walletAddress, { page: 1 });

  const handleLeadClick = useCallback((lead: CRMLead) => {
    setSelectedLead(lead);
    setView('detail');
  }, []);

  const handleNewLead = useCallback(() => {
    setEditingLead(null);
    setView('form');
  }, []);

  const handleEditLead = useCallback(() => {
    setEditingLead(selectedLead);
    setView('form');
  }, [selectedLead]);

  const handleFormSubmit = useCallback(async (data: LeadFormData) => {
    if (editingLead) {
      await updateLead.mutateAsync({
        id: editingLead.id,
        data: {
          name: data.name,
          phone: data.phone || undefined,
          email: data.email || undefined,
          whatsapp: data.whatsapp || undefined,
          source: data.source,
          interest_level: data.interest_level,
          notes: data.notes || undefined,
          budget_min: data.budget_min,
          budget_max: data.budget_max,
        },
      });
    } else {
      await createLead.mutateAsync({
        name: data.name,
        phone: data.phone || undefined,
        email: data.email || undefined,
        whatsapp: data.whatsapp || undefined,
        source: data.source,
        interest_level: data.interest_level,
        notes: data.notes || undefined,
        budget_min: data.budget_min,
        budget_max: data.budget_max,
      });
    }
    setView('list');
    setEditingLead(null);
  }, [editingLead, createLead, updateLead]);

  const handleBackToList = useCallback(() => {
    setView('list');
    setSelectedLead(null);
  }, []);

  return (
    <div className="min-h-screen theme-gradient-bg">
      <Navbar />
      <NavbarSpacer />

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {!isConnected ? (
          <div className="glass-panel p-12 text-center">
            <Users className="w-16 h-16 mx-auto text-am-green mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('loginRequired')}</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">{t('loginRequiredDesc')}</p>
          </div>
        ) : !userLoading && isBuyer ? (
          <div className="glass-panel p-12 text-center">
            <Users className="w-16 h-16 mx-auto text-am-green mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('sellersOnly')}</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">{t('sellersOnlyDesc')}</p>
          </div>
        ) : view === 'detail' && selectedLead ? (
          <LeadDetail
            lead={selectedLead}
            walletAddress={walletAddress!}
            onBack={handleBackToList}
            onEdit={handleEditLead}
            onDeleted={handleBackToList}
          />
        ) : view === 'form' ? (
          <LeadForm
            onSubmit={handleFormSubmit}
            onCancel={handleBackToList}
            initialData={editingLead ? {
              name: editingLead.name,
              phone: editingLead.phone || '',
              email: editingLead.email || '',
              whatsapp: editingLead.whatsapp || '',
              source: editingLead.source,
              interest_level: editingLead.interest_level,
              notes: editingLead.notes || '',
              budget_min: editingLead.budget_min ?? undefined,
              budget_max: editingLead.budget_max ?? undefined,
            } : undefined}
            isLoading={createLead.isPending || updateLead.isPending}
          />
        ) : (
          <>
            {/* Header */}
            <div className="glass-panel p-6 mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{t('subtitle')}</p>
                </div>
                <div className="flex items-center gap-3">
                  {/* View toggle */}
                  <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                    <button
                      onClick={() => setView('list')}
                      className={`p-2 rounded-md transition-colors ${view === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm' : ''}`}
                      title={t('listView')}
                    >
                      <List className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                    </button>
                    <button
                      onClick={() => setView('pipeline')}
                      className={`p-2 rounded-md transition-colors ${view === 'pipeline' ? 'bg-white dark:bg-gray-700 shadow-sm' : ''}`}
                      title={t('pipelineView')}
                    >
                      <LayoutGrid className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                    </button>
                  </div>

                  {isDealer && (
                    <button
                      onClick={handleNewLead}
                      className="flex items-center gap-2 bg-am-green hover:bg-am-green/80 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      {t('newLead')}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Stats */}
            {stats && <div className="mb-6"><CRMStats stats={stats} /></div>}

            {/* Content */}
            {view === 'pipeline' ? (
              <PipelineView
                leads={allLeadsData?.leads || []}
                onLeadClick={handleLeadClick}
              />
            ) : (
              <LeadList
                leads={leadsData?.leads || []}
                total={leadsData?.total || 0}
                page={leadsData?.page || 1}
                totalPages={leadsData?.totalPages || 1}
                search={search}
                statusFilter={statusFilter}
                sourceFilter={sourceFilter}
                onSearchChange={(s) => { setSearch(s); setPage(1); }}
                onStatusFilter={(s) => { setStatusFilter(s); setPage(1); }}
                onSourceFilter={(s) => { setSourceFilter(s); setPage(1); }}
                onPageChange={setPage}
                onLeadClick={handleLeadClick}
                isLoading={leadsLoading}
              />
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
