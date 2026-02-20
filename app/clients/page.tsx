'use client';

/**
 * Autos MALL - Clients CRM Page (Placeholder)
 *
 * Client relationship management for sellers.
 * Will support: client list, interaction history, lead tracking.
 */

import { Navbar, NavbarSpacer } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useAccount } from '@/lib/thirdweb';
import { Users, Plus, Search, Filter, MessageSquare } from 'lucide-react';

export default function ClientsPage() {
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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mis Clientes</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                Gestiona tus relaciones con compradores y leads
              </p>
            </div>
            {isConnected && (
              <button className="flex items-center gap-2 bg-am-green hover:bg-am-green/80 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                <Plus className="w-4 h-4" />
                Agregar Cliente
              </button>
            )}
          </div>
        </div>

        {!isConnected ? (
          <div className="glass-panel p-12 text-center">
            <Users className="w-16 h-16 mx-auto text-am-green mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Inicia sesion para ver tus clientes
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              Necesitas iniciar sesion para gestionar tu CRM de clientes.
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
                    placeholder="Buscar clientes..."
                    className="w-full pl-10 pr-4 py-2 bg-white/50 dark:bg-am-dark/50 border border-gray-200 dark:border-am-blue/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-am-green/50"
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
              <MessageSquare className="w-20 h-20 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Aun no tienes clientes
              </h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
                Comparte tu pagina de vendedor para que los compradores interesados puedan contactarte. Todos los leads apareceran aqui automaticamente.
              </p>
              <button className="inline-flex items-center gap-2 bg-am-green hover:bg-am-green/80 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                <Users className="w-5 h-5" />
                Compartir Mi Pagina
              </button>
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
