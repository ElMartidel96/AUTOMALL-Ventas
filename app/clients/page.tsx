'use client';

/**
 * Autos MALL - CRM Page
 *
 * Client relationship management for sellers.
 * Tabs: Leads | Ventas (Deals)
 * Supports: lead list, pipeline view, interactions, stats, deals, payments.
 */

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Navbar, NavbarSpacer } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useAccount } from '@/lib/thirdweb';
import { useUser } from '@/hooks/useUser';
import { useLeads, useCreateLead, useUpdateLead, useCRMStats } from '@/hooks/useCRM';
import { useDeals, useCreateDeal, useUpdateDeal, useDealStats, useExportDeals } from '@/hooks/useDeals';
import { CRMStats } from '@/components/crm/CRMStats';
import { LeadList } from '@/components/crm/LeadList';
import { LeadDetail } from '@/components/crm/LeadDetail';
import { LeadForm, type LeadFormData } from '@/components/crm/LeadForm';
import { PipelineView } from '@/components/crm/PipelineView';
import { DealStats } from '@/components/crm/DealStats';
import { DealList } from '@/components/crm/DealList';
import { DealDetail } from '@/components/crm/DealDetail';
import { DealForm, type DealFormData } from '@/components/crm/DealForm';
import { Users, Plus, LayoutGrid, List, ShoppingCart } from 'lucide-react';
import type { CRMLead } from '@/hooks/useCRM';
import type { CRMDeal } from '@/lib/crm/types';

type Tab = 'leads' | 'deals';
type ViewMode = 'list' | 'pipeline' | 'detail' | 'form'
  | 'deals' | 'deal-detail' | 'deal-form';

export default function ClientsPage() {
  const t = useTranslations('crm');
  const td = useTranslations('deals');
  const { isConnected, address } = useAccount();
  const { isDealer, isBuyer, isLoading: userLoading } = useUser();

  const [tab, setTab] = useState<Tab>('leads');
  const [view, setView] = useState<ViewMode>('list');

  // ── Leads state ──
  const [selectedLead, setSelectedLead] = useState<CRMLead | null>(null);
  const [editingLead, setEditingLead] = useState<CRMLead | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [page, setPage] = useState(1);

  // ── Deals state ──
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [editingDeal, setEditingDeal] = useState<CRMDeal | null>(null);
  const [dealSearch, setDealSearch] = useState('');
  const [dealStatusFilter, setDealStatusFilter] = useState('');
  const [dealFinancingFilter, setDealFinancingFilter] = useState('');
  const [dealPage, setDealPage] = useState(1);

  const walletAddress = address;

  // ── Leads hooks ──
  const { data: leadsData, isLoading: leadsLoading } = useLeads(walletAddress, {
    search: search || undefined,
    status: statusFilter || undefined,
    source: sourceFilter || undefined,
    page,
  });
  const { data: stats } = useCRMStats(walletAddress);
  const createLead = useCreateLead(walletAddress);
  const updateLead = useUpdateLead(walletAddress);
  const { data: allLeadsData } = useLeads(walletAddress, { page: 1 });

  // ── Deals hooks ──
  const { data: dealsData, isLoading: dealsLoading } = useDeals(walletAddress, {
    search: dealSearch || undefined,
    deal_status: (dealStatusFilter as any) || undefined,
    financing_type: (dealFinancingFilter as any) || undefined,
    page: dealPage,
  });
  const { data: dealStats } = useDealStats(walletAddress);
  const createDeal = useCreateDeal(walletAddress);
  const updateDeal2 = useUpdateDeal(walletAddress);
  const exportDeals = useExportDeals(walletAddress);

  // ── Lead handlers ──
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
    setView(tab === 'deals' ? 'deals' : 'list');
    setSelectedLead(null);
    setSelectedDealId(null);
    setEditingDeal(null);
  }, [tab]);

  // ── Deal handlers ──
  const handleDealClick = useCallback((deal: CRMDeal) => {
    setSelectedDealId(deal.id);
    setView('deal-detail');
  }, []);

  const handleNewDeal = useCallback(() => {
    setEditingDeal(null);
    setView('deal-form');
  }, []);

  const handleEditDeal = useCallback((deal: CRMDeal) => {
    setEditingDeal(deal);
    setView('deal-form');
  }, []);

  const handleDealFormSubmit = useCallback(async (data: DealFormData) => {
    if (editingDeal) {
      await updateDeal2.mutateAsync({ id: editingDeal.id, data });
    } else {
      await createDeal.mutateAsync(data);
    }
    setView('deals');
    setEditingDeal(null);
  }, [editingDeal, createDeal, updateDeal2]);

  const handleTabChange = useCallback((newTab: Tab) => {
    setTab(newTab);
    setView(newTab === 'deals' ? 'deals' : 'list');
    setSelectedLead(null);
    setSelectedDealId(null);
  }, []);

  // ── Render helpers ──
  const isLeadView = view === 'list' || view === 'pipeline' || view === 'detail' || view === 'form';
  const isDealView = view === 'deals' || view === 'deal-detail' || view === 'deal-form';
  const showHeader = (tab === 'leads' && (view === 'list' || view === 'pipeline'))
    || (tab === 'deals' && view === 'deals');

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

        // ── Lead Detail ──
        ) : view === 'detail' && selectedLead ? (
          <LeadDetail
            lead={selectedLead}
            walletAddress={walletAddress!}
            onBack={handleBackToList}
            onEdit={handleEditLead}
            onDeleted={handleBackToList}
          />

        // ── Lead Form ──
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

        // ── Deal Detail ──
        ) : view === 'deal-detail' && selectedDealId ? (
          <DealDetail
            dealId={selectedDealId}
            walletAddress={walletAddress!}
            onBack={handleBackToList}
            onEdit={handleEditDeal}
          />

        // ── Deal Form ──
        ) : view === 'deal-form' ? (
          <DealForm
            onSubmit={handleDealFormSubmit}
            onCancel={handleBackToList}
            initialData={editingDeal ? {
              client_name: editingDeal.client_name,
              vehicle_brand: editingDeal.vehicle_brand,
              vehicle_model: editingDeal.vehicle_model,
              vehicle_year: editingDeal.vehicle_year,
              sale_price: Number(editingDeal.sale_price),
              client_phone: editingDeal.client_phone || undefined,
              client_email: editingDeal.client_email || undefined,
              client_whatsapp: editingDeal.client_whatsapp || undefined,
              referred_by: editingDeal.referred_by || undefined,
              vehicle_color: editingDeal.vehicle_color || undefined,
              vehicle_vin: editingDeal.vehicle_vin || undefined,
              vehicle_mileage: editingDeal.vehicle_mileage || undefined,
              sale_date: editingDeal.sale_date,
              down_payment: Number(editingDeal.down_payment),
              financing_type: editingDeal.financing_type,
              finance_company: editingDeal.finance_company || undefined,
              num_installments: editingDeal.num_installments,
              first_payment_date: editingDeal.first_payment_date || undefined,
              payment_frequency: editingDeal.payment_frequency,
              installment_amount: editingDeal.installment_amount ? Number(editingDeal.installment_amount) : undefined,
              gps_installed: editingDeal.gps_installed,
              commission: Number(editingDeal.commission),
              notes: editingDeal.notes || undefined,
            } : undefined}
            isLoading={createDeal.isPending || updateDeal2.isPending}
          />

        // ── Main view (tabs) ──
        ) : (
          <>
            {/* Header with Tabs */}
            {showHeader && (
              <div className="glass-panel p-6 mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {tab === 'leads' ? t('title') : td('title')}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                      {tab === 'leads' ? t('subtitle') : td('subtitle')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Tab toggle */}
                    <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                      <button
                        onClick={() => handleTabChange('leads')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                          tab === 'leads' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500'
                        }`}
                      >
                        <Users className="w-3.5 h-3.5" />
                        Leads
                      </button>
                      <button
                        onClick={() => handleTabChange('deals')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                          tab === 'deals' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500'
                        }`}
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        {td('tabTitle')}
                      </button>
                    </div>

                    {/* View toggle (leads only) */}
                    {tab === 'leads' && (
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
                    )}

                    {/* New button */}
                    {isDealer && (
                      <button
                        onClick={tab === 'leads' ? handleNewLead : handleNewDeal}
                        className="flex items-center gap-2 bg-am-green hover:bg-am-green/80 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        {tab === 'leads' ? t('newLead') : td('newDeal')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Stats */}
            {tab === 'leads' && stats && <div className="mb-6"><CRMStats stats={stats} /></div>}
            {tab === 'deals' && dealStats && <div className="mb-6"><DealStats stats={dealStats} /></div>}

            {/* Content */}
            {tab === 'leads' ? (
              view === 'pipeline' ? (
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
              )
            ) : (
              <DealList
                deals={dealsData?.deals || []}
                total={dealsData?.total || 0}
                page={dealsData?.page || 1}
                totalPages={dealsData?.totalPages || 1}
                search={dealSearch}
                statusFilter={dealStatusFilter}
                financingFilter={dealFinancingFilter}
                onSearchChange={(s) => { setDealSearch(s); setDealPage(1); }}
                onStatusFilter={(s) => { setDealStatusFilter(s); setDealPage(1); }}
                onFinancingFilter={(s) => { setDealFinancingFilter(s); setDealPage(1); }}
                onPageChange={setDealPage}
                onDealClick={handleDealClick}
                onExport={() => exportDeals.mutate()}
                isExporting={exportDeals.isPending}
                isLoading={dealsLoading}
              />
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
