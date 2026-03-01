'use client';

/**
 * Public Vehicle Detail Page
 * Shows full vehicle info, gallery, specs, contact CTA, and related vehicles.
 * Includes JSON-LD for SEO/AI readability.
 *
 * Security note: JSON-LD content is generated internally from sanitized
 * vehicle data via generateVehicleJsonLd() — no raw user HTML is injected.
 */

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
  ChevronRight,
  Phone,
  MessageCircle,
  Mail,
  Gauge,
  Calendar,
  Fuel,
  Cog,
  Car,
  Loader2,
} from 'lucide-react';
import { Navbar, NavbarSpacer } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import VehicleGallery from '@/components/catalog/VehicleGallery';
import VehicleSpecs from '@/components/catalog/VehicleSpecs';
import CatalogVehicleCard from '@/components/catalog/CatalogVehicleCard';
import { useCatalogVehicle } from '@/hooks/useCatalog';
import { generateVehicleJsonLd } from '@/lib/catalog/json-ld';
import { useTenant } from '@/lib/tenant/TenantProvider';

function JsonLdScript({ data }: { data: Record<string, unknown> }) {
  // Safe: data is generated internally by generateVehicleJsonLd,
  // not from raw user HTML input. JSON.stringify escapes all special chars.
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export default function VehicleDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const t = useTranslations('catalog');
  const { data: vehicle, isLoading, error } = useCatalogVehicle(id);
  const { seller, isSubdomain } = useTenant();

  // Priority: subdomain tenant > per-vehicle contact > seller_contact fallback > null
  const contactPhone = (isSubdomain && seller?.phone)
    || vehicle?.contact_phone
    || vehicle?.seller_contact?.phone
    || null;
  const contactWhatsApp = (isSubdomain && seller?.whatsapp)
    || vehicle?.contact_whatsapp
    || vehicle?.seller_contact?.whatsapp
    || null;
  const sellerName = (isSubdomain && seller?.business_name)
    || vehicle?.seller_contact?.business_name
    || null;

  if (isLoading) {
    return (
      <div className="min-h-screen theme-gradient-bg">
        <Navbar />
        <NavbarSpacer />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-am-orange" />
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="min-h-screen theme-gradient-bg">
        <Navbar />
        <NavbarSpacer />
        <div className="flex flex-col items-center justify-center py-32 px-4">
          <Car className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {t('detail.notFound')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">{t('detail.notFoundDesc')}</p>
          <Link
            href="/catalog"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-am-orange to-am-orange-light text-white font-bold hover:shadow-lg transition-all"
          >
            {t('detail.backToCatalog')}
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const title = `${vehicle.year} ${vehicle.brand} ${vehicle.model}`;
  const jsonLd = generateVehicleJsonLd(vehicle as Parameters<typeof generateVehicleJsonLd>[0], vehicle.images);

  return (
    <div className="min-h-screen theme-gradient-bg">
      <Navbar />
      <NavbarSpacer />

      {/* JSON-LD structured data for SEO/AI — generated from internal data */}
      <JsonLdScript data={jsonLd} />

      {/* Breadcrumb */}
      <section className="pt-6 px-4">
        <div className="container mx-auto max-w-7xl">
          <nav className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
            <Link href="/" className="hover:text-am-orange transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/catalog" className="hover:text-am-orange transition-colors">{t('title')}</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-900 dark:text-white font-medium truncate">{title}</span>
          </nav>
        </div>
      </section>

      {/* Main content */}
      <section className="py-6 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Gallery — 60% */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="lg:w-[60%]"
            >
              <VehicleGallery images={vehicle.images} alt={title} />
            </motion.div>

            {/* Info panel — 40% */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="lg:w-[40%] space-y-4"
            >
              {/* Title + Price */}
              <div className="glass-crystal-enhanced rounded-2xl p-5">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  {title}
                </h1>
                {typeof vehicle.trim === 'string' && vehicle.trim && (
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{vehicle.trim}</p>
                )}
                <p className="text-3xl font-bold text-am-orange mt-3">
                  ${Number(vehicle.price).toLocaleString()}
                  {vehicle.price_negotiable && (
                    <span className="text-sm font-normal text-gray-400 ml-2">{t('negotiable')}</span>
                  )}
                </p>

                {/* Quick specs 2x2 */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {[
                    { icon: Gauge, label: `${Number(vehicle.mileage).toLocaleString()} mi` },
                    { icon: Calendar, label: String(vehicle.year) },
                    { icon: Fuel, label: typeof vehicle.fuel_type === 'string' ? vehicle.fuel_type.replace('_', ' ') : '-' },
                    { icon: Cog, label: typeof vehicle.transmission === 'string' ? vehicle.transmission : '-' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 capitalize">
                      <item.icon className="w-4 h-4 text-gray-400" />
                      {item.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact CTA */}
              <div className="glass-crystal-enhanced rounded-2xl p-5">
                <h3 className="font-bold text-gray-900 dark:text-white mb-3">
                  {t('contact.title')}
                </h3>
                {sellerName && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                    {t('contact.sellerName', { name: sellerName })}
                  </p>
                )}
                <div className="flex flex-col sm:flex-row gap-3">
                  {contactPhone && (
                    <a
                      href={`tel:${contactPhone}`}
                      className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-am-orange to-am-orange-light text-white px-5 py-3 rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
                    >
                      <Phone className="w-4 h-4" />
                      {t('contact.call')}
                    </a>
                  )}
                  {contactWhatsApp && (
                    <a
                      href={`https://wa.me/${contactWhatsApp}?text=${encodeURIComponent(`Hola! Me interesa el ${title}${vehicle.year ? ` ${vehicle.year}` : ''}${vehicle.mileage ? `, ${Number(vehicle.mileage).toLocaleString()} mi` : ''}${vehicle.price ? `, $${Number(vehicle.price).toLocaleString()}` : ''}. Necesito más información. Gracias!`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-am-green to-emerald-500 text-white px-5 py-3 rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
                    >
                      <MessageCircle className="w-4 h-4" />
                      {t('contact.whatsapp')}
                    </a>
                  )}
                  {!contactPhone && !contactWhatsApp && (
                    <div className="flex-1 text-center py-3 px-5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-sm">
                      <Mail className="w-4 h-4 inline mr-2" />
                      {t('contact.noContactAvailable')}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Specs */}
      <section className="py-6 px-4">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {t('detail.specifications')}
            </h2>
            <VehicleSpecs vehicle={vehicle} />
          </motion.div>
        </div>
      </section>

      {/* Features */}
      {Array.isArray(vehicle.features) && vehicle.features.length > 0 && (
        <section className="py-6 px-4">
          <div className="container mx-auto max-w-7xl">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {t('detail.features')}
            </h2>
            <div className="flex flex-wrap gap-2">
              {vehicle.features.filter((f): f is string => typeof f === 'string').map((f) => (
                <span
                  key={f}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-am-blue/10 dark:bg-am-blue/20 text-am-blue dark:text-am-blue-light"
                >
                  {f}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Description */}
      {typeof vehicle.description === 'string' && vehicle.description && (
        <section className="py-6 px-4">
          <div className="container mx-auto max-w-7xl">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {t('detail.description')}
            </h2>
            <div className="glass-crystal rounded-2xl p-5">
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                {vehicle.description}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Related vehicles */}
      {vehicle.related && vehicle.related.length > 0 && (
        <section className="py-8 px-4">
          <div className="container mx-auto max-w-7xl">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {t('related.title')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {vehicle.related.map((rv) => (
                <CatalogVehicleCard key={rv.id} vehicle={rv} />
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
