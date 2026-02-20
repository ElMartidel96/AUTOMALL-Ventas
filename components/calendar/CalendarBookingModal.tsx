/**
 * CALENDAR BOOKING MODAL
 *
 * Modal para mostrar Calendly después de completar Special Invite Flow
 * Usa CalendlyEmbed component con SDK oficial para eventos postMessage
 *
 * FIXED: Ahora usa Calendly SDK en lugar de iframe crudo
 * - Escucha eventos calendly.event_scheduled correctamente
 * - Marca checkbox automáticamente cuando se agenda
 * - Compatible con el sistema que funciona en cryptogift-wallets
 *
 * Made by mbxarts.com The Moon in a Box property
 * Co-Author: Godez22
 */

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, CheckCircle, Clock, Video } from 'lucide-react';
import { CalendlyEmbed } from './CalendlyEmbed';

interface CalendarBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBooked?: (appointmentData?: AppointmentData) => void;
  onAppointmentBooked?: (appointmentData?: AppointmentData) => void;
  email?: string;
  userEmail?: string;
  userName?: string;
  source?: string;
  inviteCode?: string; // For saving to database (special invites)
  giftId?: string; // For knowledge mode tracking
  tokenId?: string; // For knowledge mode tracking
}

// Appointment data structure for callbacks
export interface AppointmentData {
  scheduledAt?: string;
  eventType?: string;
  inviteeEmail?: string;
  uri?: string;
}

// Calendly URL from environment variable with fallback
const CALENDLY_BASE_URL = process.env.NEXT_PUBLIC_CALENDLY_URL || 'https://calendly.com/rafael1996k';

export const CalendarBookingModal: React.FC<CalendarBookingModalProps> = ({
  isOpen,
  onClose,
  onBooked,
  onAppointmentBooked,
  email,
  userEmail,
  userName,
  inviteCode,
  giftId,
  tokenId,
  source = 'special-invite'
}) => {
  const [isBooked, setIsBooked] = useState(false);

  // Handle appointment scheduled
  const handleAppointmentScheduled = (appointmentData: any) => {
    console.log('✅ Appointment scheduled callback received:', appointmentData);

    setIsBooked(true);

    // Call both callbacks for compatibility
    if (onBooked) {
      onBooked(appointmentData);
    }

    if (onAppointmentBooked) {
      onAppointmentBooked(appointmentData);
    }

    // Close modal after showing success message
    setTimeout(() => {
      onClose();
    }, 3000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 bg-white/80 dark:bg-gray-800/80 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 shadow-lg"
          >
            <X className="w-5 h-5" />
          </button>

          {isBooked ? (
            /* Success State */
            <div className="text-center py-12 px-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle className="w-10 h-10 text-green-500" />
              </motion.div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                ✅ Cita Agendada
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Te enviaremos la confirmación por email
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                Revisa tu bandeja de entrada
              </p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      🎉 ¡Agenda tu Consulta Personalizada!
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Selecciona un horario disponible
                    </p>
                  </div>
                </div>
              </div>

              {/* Info Cards */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="grid md:grid-cols-3 gap-4 text-center">
                  <div className="flex items-center gap-2 justify-center text-purple-600 dark:text-purple-400">
                    <Clock className="w-5 h-5" />
                    <span className="font-medium">30 minutos</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center text-pink-600 dark:text-pink-400">
                    <Video className="w-5 h-5" />
                    <span className="font-medium">Video llamada</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center text-green-600 dark:text-green-400">
                    <Calendar className="w-5 h-5" />
                    <span className="font-medium">100% Gratuito</span>
                  </div>
                </div>
                <p className="text-center text-gray-600 dark:text-gray-400 mt-4">
                  Conversaremos sobre tus objetivos y cómo CryptoGift puede ayudarte
                </p>
              </div>

              {/* Calendly Embed with SDK */}
              <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 280px)' }}>
                <CalendlyEmbed
                  url={CALENDLY_BASE_URL}
                  height={600}
                  prefill={{
                    email: email || userEmail,
                    name: userName,
                    customQuestions: {
                      source: source,
                      completion_date: new Date().toISOString().split('T')[0]
                    }
                  }}
                  utm={{
                    utmSource: 'cryptogift-special-invite',
                    utmMedium: 'modal',
                    utmCampaign: 'post-education-booking',
                    utmContent: source
                  }}
                  inviteCode={inviteCode}
                  giftId={giftId}
                  tokenId={tokenId}
                  onAppointmentScheduled={handleAppointmentScheduled}
                />
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CalendarBookingModal;
