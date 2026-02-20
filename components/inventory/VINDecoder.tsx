'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useDecodeVIN } from '@/hooks/useInventory';
import { isValidVIN, countDecodedFields, type DecodedVIN } from '@/lib/inventory/vin-fields';
import { Search, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface VINDecoderProps {
  onApply: (data: DecodedVIN) => void;
}

export function VINDecoder({ onApply }: VINDecoderProps) {
  const t = useTranslations('inventory.vin');
  const [vin, setVin] = useState('');
  const decode = useDecodeVIN();

  const handleDecode = () => {
    if (!isValidVIN(vin)) return;
    decode.mutate(vin.toUpperCase());
  };

  const handleApply = () => {
    if (decode.data) {
      onApply(decode.data as DecodedVIN);
    }
  };

  return (
    <div className="glass-crystal rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
        <Search className="w-4 h-4" />
        <span>{t('title')}</span>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={vin}
          onChange={(e) => setVin(e.target.value.toUpperCase().slice(0, 17))}
          placeholder={t('placeholder')}
          maxLength={17}
          className="flex-1 px-3 py-2 bg-white/50 dark:bg-am-dark/50 border border-gray-200 dark:border-am-blue/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-am-orange/50 font-mono tracking-wider"
        />
        <button
          onClick={handleDecode}
          disabled={!isValidVIN(vin) || decode.isPending}
          className="px-4 py-2 bg-am-blue hover:bg-am-blue-light text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {decode.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
          {t('decode')}
        </button>
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500">
        {t('hint')} ({vin.length}/17)
      </p>

      {/* Error state */}
      {decode.isError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800/30">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-400">{t('notFound')}</p>
        </div>
      )}

      {/* Success state */}
      {decode.data && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <CheckCircle className="w-4 h-4" />
            <span>{t('found', { count: countDecodedFields(decode.data as DecodedVIN) })}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {decode.data.brand && (
              <div className="p-2 bg-green-50 dark:bg-green-900/10 rounded">
                <span className="text-gray-500 dark:text-gray-400">{t('fieldBrand')}: </span>
                <span className="font-medium text-gray-900 dark:text-white">{decode.data.brand}</span>
              </div>
            )}
            {decode.data.model && (
              <div className="p-2 bg-green-50 dark:bg-green-900/10 rounded">
                <span className="text-gray-500 dark:text-gray-400">{t('fieldModel')}: </span>
                <span className="font-medium text-gray-900 dark:text-white">{decode.data.model}</span>
              </div>
            )}
            {decode.data.year && (
              <div className="p-2 bg-green-50 dark:bg-green-900/10 rounded">
                <span className="text-gray-500 dark:text-gray-400">{t('fieldYear')}: </span>
                <span className="font-medium text-gray-900 dark:text-white">{decode.data.year}</span>
              </div>
            )}
            {decode.data.engine && (
              <div className="p-2 bg-green-50 dark:bg-green-900/10 rounded">
                <span className="text-gray-500 dark:text-gray-400">{t('fieldEngine')}: </span>
                <span className="font-medium text-gray-900 dark:text-white">{decode.data.engine}</span>
              </div>
            )}
          </div>
          <button
            onClick={handleApply}
            className="w-full py-2 bg-am-green hover:bg-am-green/90 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {t('apply')}
          </button>
        </div>
      )}
    </div>
  );
}
