'use client';

/**
 * Autos MALL - Inventory Page (Placeholder)
 *
 * Vehicle inventory management for sellers.
 * Will support: add/edit/delete vehicles, photos, pricing, status.
 */

import { Navbar, NavbarSpacer } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useAccount } from '@/lib/thirdweb';
import { Car, Plus, Search, Filter } from 'lucide-react';
import Link from 'next/link';

export default function InventoryPage() {
  const { isConnected } = useAccount();

  return (
    <div className="min-h-screen theme-gradient-bg">
      <Navbar />
      <NavbarSpacer />

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="glass-panel p-6 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mi Inventario</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                Gestiona los vehiculos que tienes en venta
              </p>
            </div>
            {isConnected && (
              <button className="flex items-center gap-2 bg-am-orange hover:bg-am-orange-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                <Plus className="w-4 h-4" />
                Agregar Vehiculo
              </button>
            )}
          </div>
        </div>

        {!isConnected ? (
          <div className="glass-panel p-12 text-center">
            <Car className="w-16 h-16 mx-auto text-am-orange mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Inicia sesion para ver tu inventario
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              Necesitas iniciar sesion para gestionar tu inventario de vehiculos.
            </p>
          </div>
        ) : (
          <>
            {/* Search and filters */}
            <div className="glass-panel p-4 mb-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar vehiculos..."
                    className="w-full pl-10 pr-4 py-2 bg-white/50 dark:bg-am-dark/50 border border-gray-200 dark:border-am-blue/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-am-orange/50"
                    disabled
                  />
                </div>
                <button
                  className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-am-blue/30 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-am-blue/10 transition-colors"
                  disabled
                >
                  <Filter className="w-4 h-4" />
                  Filtros
                </button>
              </div>
            </div>

            {/* Empty state */}
            <div className="glass-panel p-16 text-center">
              <Car className="w-20 h-20 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Tu inventario esta vacio
              </h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
                Agrega tu primer vehiculo para comenzar a mostrar tu inventario a potenciales compradores.
              </p>
              <button className="inline-flex items-center gap-2 bg-am-orange hover:bg-am-orange-dark text-white px-6 py-3 rounded-lg font-medium transition-colors">
                <Plus className="w-5 h-5" />
                Agregar Mi Primer Vehiculo
              </button>
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
