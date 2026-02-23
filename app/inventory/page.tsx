'use client';

/**
 * Autos MALL — Vehicle Inventory Management
 *
 * Full CRUD with VIN decoder, multi-image upload, filters, and status workflow.
 */

import React, { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Navbar, NavbarSpacer } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CGCAccessGate } from '@/components/auth/CGCAccessGate';
import { useAccount } from '@/lib/thirdweb';
import { useUser } from '@/hooks/useUser';
import { useVehicles, useDeleteVehicle, useUpdateVehicleStatus } from '@/hooks/useInventory';
import { VehicleCard } from '@/components/inventory/VehicleCard';
import { VehicleForm } from '@/components/inventory/VehicleForm';
import type { VehicleStatus } from '@/lib/supabase/types';
import { Plus, Car, Search, Loader2 } from 'lucide-react';

const TABS: Array<{ key: string; status?: VehicleStatus }> = [
  { key: 'all' },
  { key: 'active', status: 'active' },
  { key: 'draft', status: 'draft' },
  { key: 'sold', status: 'sold' },
];

function InventoryContent() {
  const t = useTranslations('inventory');
  const { address } = useAccount();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editVehicleId, setEditVehicleId] = useState<string | undefined>();

  const statusFilter = TABS.find(tab => tab.key === activeTab)?.status;

  const { data: response, isLoading } = useVehicles(address, {
    status: statusFilter,
    search: searchQuery || undefined,
    limit: 50,
  });

  const deleteVehicle = useDeleteVehicle();
  const updateStatus = useUpdateVehicleStatus();

  const vehicles = response?.data || [];
  const total = response?.pagination?.total || 0;

  // Tab counts from full list (approximate from current data)
  const tabCounts = useMemo(() => {
    if (!response?.data) return {};
    const counts: Record<string, number> = { all: total };
    response.data.forEach(v => {
      counts[v.status] = (counts[v.status] || 0) + 1;
    });
    return counts;
  }, [response, total]);

  const handleEdit = (id: string) => {
    setEditVehicleId(id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!address || !confirm(t('messages.confirmDelete'))) return;
    deleteVehicle.mutate({ id, seller: address });
  };

  const handleMarkSold = async (id: string) => {
    if (!address) return;
    updateStatus.mutate({ id, seller: address, status: 'sold' });
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditVehicleId(undefined);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditVehicleId(undefined);
  };

  // Show form view
  if (showForm) {
    return (
      <div className="max-w-3xl mx-auto">
        <VehicleForm
          editVehicleId={editVehicleId}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('list.title')}</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              {t('list.subtitle', { count: total })}
            </p>
          </div>
          <button
            onClick={() => { setEditVehicleId(undefined); setShowForm(true); }}
            className="flex items-center gap-2 bg-gradient-to-r from-am-orange to-am-orange-light hover:from-am-orange-light hover:to-am-orange text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-md hover:shadow-lg"
          >
            <Plus className="w-4 h-4" />
            {t('actions.addVehicle')}
          </button>
        </div>
      </div>

      {/* Tabs + Search */}
      <div className="glass-panel p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-white dark:bg-am-dark text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {t(`status.${tab.key}`)}
                {tabCounts[tab.key] !== undefined && (
                  <span className="ml-1 text-gray-400">({tabCounts[tab.key]})</span>
                )}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="flex-1 relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('list.search')}
              className="w-full pl-10 pr-4 py-2 bg-white/50 dark:bg-am-dark/50 border border-gray-200 dark:border-am-blue/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-am-orange/50"
            />
          </div>
        </div>
      </div>

      {/* Vehicle grid */}
      {isLoading ? (
        <div className="glass-panel p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-am-orange mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('list.loading')}</p>
        </div>
      ) : vehicles.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map(vehicle => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onMarkSold={handleMarkSold}
            />
          ))}
        </div>
      ) : (
        <div className="glass-panel p-16 text-center">
          <Car className="w-20 h-20 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {searchQuery ? t('list.noResults') : t('list.empty')}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
            {searchQuery ? t('list.noResultsDesc') : t('list.emptyDesc')}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-am-orange to-am-orange-light text-white px-6 py-3 rounded-xl font-medium transition-all hover:shadow-lg"
            >
              <Plus className="w-5 h-5" />
              {t('actions.addFirst')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function BuyerBlock() {
  const t = useTranslations('inventory');
  return (
    <div className="min-h-screen theme-gradient-bg">
      <Navbar />
      <NavbarSpacer />
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="glass-panel p-12 text-center">
          <Car className="w-16 h-16 mx-auto text-am-orange mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {t('title')}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            {t('subtitle')}
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default function InventoryPage() {
  const { isBuyer, isLoading } = useUser();

  // Buyers can't manage inventory
  if (!isLoading && isBuyer) return <BuyerBlock />;

  return (
    <CGCAccessGate requiredBalance="0">
      <div className="min-h-screen theme-gradient-bg">
        <Navbar />
        <NavbarSpacer />
        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <InventoryContent />
        </div>
        <Footer />
      </div>
    </CGCAccessGate>
  );
}
