/**
 * CALENDLY EMBED COMPONENT
 * Componente para embedding de Calendly optimizado para Next.js 2025
 * Basado en mejores prácticas de integración Calendly + React
 *
 * ENHANCED: Auto-saves appointment data to backend when scheduled
 *
 * Made by mbxarts.com The Moon in a Box property
 * Co-Author: Godez22
 */

"use client";

import React, { useEffect, useCallback } from 'react';

interface CalendlyEmbedProps {
  url: string;
  height?: number;
  className?: string;
  prefill?: {
    name?: string;
    email?: string;
    customQuestions?: Record<string, string>;
  };
  utm?: {
    utmCampaign?: string;
    utmSource?: string;
    utmMedium?: string;
    utmContent?: string;
    utmTerm?: string;
  };
  // Props para manejar el evento de cita agendada
  inviteCode?: string; // For special invites
  giftId?: string; // For knowledge mode
  tokenId?: string; // For knowledge mode
  onAppointmentScheduled?: (data: any) => void;
}

export const CalendlyEmbed: React.FC<CalendlyEmbedProps> = ({
  url,
  height = 700,
  className = "",
  prefill = {},
  utm = {},
  inviteCode,
  giftId,
  tokenId,
  onAppointmentScheduled
}) => {
  // Función para procesar la cita cuando se agenda
  const handleAppointmentScheduled = useCallback(async (eventData: any) => {
    console.log('🎉 ¡Cita agendada en Calendly!', eventData);

    try {
      // Extraer información del evento
      const appointmentData = {
        scheduledAt: eventData.event?.start_time || eventData.payload?.event?.start_time || new Date().toISOString(),
        eventType: eventData.event?.event_type_name || eventData.payload?.event?.name || '30 Minute Meeting',
        inviteeEmail: eventData.invitee?.email || eventData.payload?.invitee?.email || prefill.email,
        uri: eventData.event?.uri || eventData.payload?.event?.uri
      };

      console.log('📅 Appointment data extracted:', appointmentData);

      // Si hay inviteCode, guardar en la base de datos
      if (inviteCode) {
        console.log('💾 Saving appointment to database for invite:', inviteCode);

        const response = await fetch('/api/referrals/special-invite/update-appointment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            inviteCode,
            appointmentScheduled: true,
            appointmentData,
            email: appointmentData.inviteeEmail,
            source: 'calendly-embed'
          }),
        });

        const data = await response.json();
        if (data.success) {
          console.log('✅ Appointment saved to database:', data);
        } else {
          console.error('❌ Failed to save appointment:', data.error);
        }
      }

      // Llamar callback para notificar al componente padre
      if (onAppointmentScheduled) {
        onAppointmentScheduled(appointmentData);
      }

      // Mostrar notificación de éxito
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-pulse';
      notification.innerHTML = '✅ ¡Cita agendada exitosamente!';
      document.body.appendChild(notification);

      setTimeout(() => {
        notification.remove();
      }, 5000);

    } catch (error) {
      console.error('❌ Error processing appointment:', error);
    }
  }, [inviteCode, giftId, tokenId, prefill, onAppointmentScheduled]);

  useEffect(() => {
    console.log('📅 Initializing Calendly Embed with SDK...');

    // Cargar Calendly widget script dinámicamente
    const script = document.createElement('script');
    script.src = 'https://assets.calendly.com/assets/external/widget.js';
    script.async = true;
    document.body.appendChild(script);

    console.log('✅ Calendly SDK script loaded');

    // CRITICAL: Escuchar eventos de Calendly
    const handleCalendlyEvent = (e: MessageEvent) => {
      // Log ALL postMessage events for debugging
      console.log('📬 PostMessage received:', {
        origin: e.origin,
        event: e.data?.event,
        hasPayload: !!e.data?.payload,
        timestamp: new Date().toISOString()
      });

      // CRITICAL: Check if message is from Calendly
      if (e.origin.indexOf('calendly.com') === -1) {
        console.log('⏭️ Skipping non-Calendly message from:', e.origin);
        return;
      }

      // Parse message
      if (e.data && e.data.event) {
        console.log('📅 Calendly event received:', e.data.event);

        // Detect when appointment is scheduled
        if (e.data.event === 'calendly.event_scheduled') {
          console.log('🎉 CALENDLY EVENT_SCHEDULED DETECTED! Processing...');
          handleAppointmentScheduled(e.data.payload || e.data);
        }

        // Also detect page_height changes (confirmation page)
        if (e.data.event === 'calendly.page_height') {
          const pageHeight = e.data.payload?.pageHeight || 0;
          console.log('📏 Calendly page height:', pageHeight);

          if (pageHeight > 600) {
            console.log('✅ Detected Calendly confirmation page (height > 600)');
          }
        }

        // Detect date/time selected
        if (e.data.event === 'calendly.date_and_time_selected') {
          console.log('📅 User selected date/time in Calendly');
        }
      }
    };

    // Add listener for Calendly messages
    window.addEventListener('message', handleCalendlyEvent);

    return () => {
      // Cleanup
      console.log('🧹 Cleaning up Calendly Embed');
      window.removeEventListener('message', handleCalendlyEvent);
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [handleAppointmentScheduled]);

  // Build URL with parameters
  const buildCalendlyUrl = () => {
    const urlObj = new URL(url);

    // Add prefill parameters
    if (prefill.name) urlObj.searchParams.set('name', prefill.name);
    if (prefill.email) urlObj.searchParams.set('email', prefill.email);

    // Add custom questions
    if (prefill.customQuestions) {
      Object.entries(prefill.customQuestions).forEach(([key, value]) => {
        urlObj.searchParams.set(`a1`, value); // Calendly custom question format
      });
    }

    // Add UTM parameters
    Object.entries(utm).forEach(([key, value]) => {
      if (value) urlObj.searchParams.set(key, value);
    });

    return urlObj.toString();
  };

  return (
    <div className={`calendly-embed-container ${className}`}>
      <div
        className="calendly-inline-widget"
        data-url={buildCalendlyUrl()}
        style={{ minWidth: '320px', height: `${height}px` }}
      />
    </div>
  );
};
