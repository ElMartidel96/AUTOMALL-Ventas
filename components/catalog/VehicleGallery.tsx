'use client';

/**
 * Vehicle image gallery with main image + thumbnails.
 */

import { useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { Car, ChevronLeft, ChevronRight } from 'lucide-react';
import type { VehicleImage } from '@/lib/supabase/types';

interface Props {
  images: VehicleImage[];
  alt: string;
}

export default function VehicleGallery({ images, alt }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="glass-crystal rounded-2xl aspect-[16/10] flex items-center justify-center">
        <Car className="w-24 h-24 text-gray-300 dark:text-gray-600" />
      </div>
    );
  }

  const current = images[selectedIndex];

  const prev = () => setSelectedIndex((i) => (i > 0 ? i - 1 : images.length - 1));
  const next = () => setSelectedIndex((i) => (i < images.length - 1 ? i + 1 : 0));

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="relative glass-crystal rounded-2xl overflow-hidden aspect-[16/10]">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0"
          >
            <Image
              src={current.public_url}
              alt={alt}
              fill
              sizes="(max-width: 1024px) 100vw, 60vw"
              className="object-contain"
              priority
            />
          </motion.div>
        </AnimatePresence>

        {/* Navigation arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Counter */}
        {images.length > 1 && (
          <span className="absolute bottom-3 right-3 px-2 py-1 text-xs font-medium rounded-lg bg-black/60 text-white backdrop-blur-sm">
            {selectedIndex + 1} / {images.length}
          </span>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setSelectedIndex(i)}
              className={`relative flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                i === selectedIndex
                  ? 'border-am-orange shadow-md'
                  : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <Image
                src={img.public_url}
                alt={`${alt} ${i + 1}`}
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
