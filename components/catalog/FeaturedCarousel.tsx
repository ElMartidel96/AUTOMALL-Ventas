'use client';

/**
 * Featured vehicles carousel for the home page.
 * CSS scroll-snap + framer-motion fade-in stagger.
 */

import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowRight, Car, Gauge } from 'lucide-react';
import { useFeaturedVehicles } from '@/hooks/useCatalog';

export default function FeaturedCarousel() {
  const { data, isLoading } = useFeaturedVehicles();
  const scrollRef = useRef<HTMLDivElement>(null);
  const t = useTranslations('catalog');

  const vehicles = data?.data || [];

  // Don't render if no vehicles and not loading
  if (!isLoading && vehicles.length === 0) return null;

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.7;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  };

  return (
    <section className="py-10 md:py-14 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              {t('featured.title')}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              {t('featured.subtitle')}
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => scroll('left')}
              className="w-9 h-9 rounded-full glass-crystal flex items-center justify-center hover:bg-am-orange/10 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="w-9 h-9 rounded-full glass-crystal flex items-center justify-center hover:bg-am-orange/10 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
        </div>

        {/* Loading skeleton */}
        {isLoading && (
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-[clamp(280px,40vw,420px)] glass-crystal rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-[16/10] bg-gray-200 dark:bg-am-dark/50" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Carousel */}
        {!isLoading && vehicles.length > 0 && (
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-hide pb-2"
          >
            {vehicles.map((vehicle, i) => (
              <motion.div
                key={vehicle.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
                className="flex-shrink-0 snap-start w-[clamp(280px,40vw,420px)]"
              >
                <Link
                  href={`/catalog/${vehicle.id}`}
                  className="glass-crystal rounded-2xl overflow-hidden block hover:scale-[1.02] hover:shadow-xl transition-all duration-300 group"
                >
                  <div className="relative aspect-[16/10] bg-gray-100 dark:bg-am-dark/50">
                    {vehicle.primary_image_url ? (
                      <Image
                        src={vehicle.primary_image_url}
                        alt={`${vehicle.year} ${vehicle.brand} ${vehicle.model}`}
                        fill
                        sizes="(max-width: 640px) 80vw, 420px"
                        className="object-contain"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Car className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-1 group-hover:text-am-orange transition-colors">
                      {vehicle.year} {vehicle.brand} {vehicle.model}
                    </h3>
                    <p className="text-lg font-bold text-am-orange mt-1">
                      ${vehicle.price.toLocaleString()}
                    </p>
                    <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <Gauge className="w-3.5 h-3.5" />
                      {vehicle.mileage.toLocaleString()} mi
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}

            {/* View All card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: vehicles.length * 0.05, duration: 0.4 }}
              className="flex-shrink-0 snap-start w-[clamp(280px,40vw,420px)]"
            >
              <Link
                href="/catalog"
                className="glass-crystal rounded-2xl h-full flex flex-col items-center justify-center p-8 hover:scale-[1.02] hover:shadow-xl transition-all duration-300 group min-h-[280px]"
              >
                <div className="w-16 h-16 rounded-full bg-am-orange/10 dark:bg-am-orange/20 flex items-center justify-center mb-4 group-hover:bg-am-orange/20 transition-colors">
                  <ArrowRight className="w-7 h-7 text-am-orange" />
                </div>
                <span className="font-bold text-gray-900 dark:text-white text-lg">
                  {t('featured.viewAll')}
                </span>
              </Link>
            </motion.div>
          </div>
        )}
      </div>
    </section>
  );
}
