'use client';

/**
 * WhatsApp Conversation History — Recent Sessions
 */

import React from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ImageIcon,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';
import { useWASessions } from '@/hooks/useWhatsAppAssistant';

interface Props {
  walletAddress: string;
}

const STATE_CONFIG: Record<string, { icon: React.ElementType; color: string; labelKey: string }> = {
  idle: { icon: Clock, color: 'text-gray-400', labelKey: 'stateIdle' },
  collecting: { icon: ImageIcon, color: 'text-blue-500', labelKey: 'stateCollecting' },
  extracting: { icon: Loader2, color: 'text-amber-500', labelKey: 'stateExtracting' },
  confirming: { icon: MessageSquare, color: 'text-purple-500', labelKey: 'stateConfirming' },
  creating: { icon: Loader2, color: 'text-green-500', labelKey: 'stateCreating' },
  complete: { icon: CheckCircle2, color: 'text-green-600', labelKey: 'stateComplete' },
  error: { icon: AlertCircle, color: 'text-red-500', labelKey: 'stateError' },
};

export function ConversationHistory({ walletAddress }: Props) {
  const t = useTranslations('whatsapp');
  const { sessions, isLoading } = useWASessions(walletAddress);

  return (
    <div className="glass-crystal-enhanced rounded-2xl p-6">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
        {t('recentSessions')}
      </h3>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-8">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('noSessions')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => {
            const config = STATE_CONFIG[session.state] || STATE_CONFIG.idle;
            const Icon = config.icon;
            const vehicle = session.extracted_vehicle as Record<string, unknown> | null;
            const title = vehicle
              ? `${vehicle.year || '?'} ${vehicle.brand || '?'} ${vehicle.model || '?'}`
              : null;
            const imageUrls = (session.image_urls || []) as string[];
            const date = new Date(session.updated_at);

            return (
              <div
                key={session.id}
                className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  {/* Thumbnail */}
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                    {imageUrls.length > 0 ? (
                      <Image
                        src={imageUrls[0]}
                        alt="Vehicle"
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-gray-300 dark:text-gray-600" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`w-4 h-4 ${config.color} ${session.state === 'extracting' || session.state === 'creating' ? 'animate-spin' : ''}`} />
                      <span className={`text-xs font-medium ${config.color}`}>
                        {t(config.labelKey)}
                      </span>
                    </div>

                    {title && (
                      <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                        {title}
                      </p>
                    )}

                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-400">
                        {imageUrls.length} {t('photos')}
                      </span>
                      <span className="text-xs text-gray-400">
                        {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {/* Link to vehicle */}
                  {session.vehicle_id && (
                    <a
                      href={`/inventory?vehicle=${session.vehicle_id}`}
                      className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
