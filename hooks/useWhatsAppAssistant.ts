/**
 * WhatsApp AI Assistant Hooks
 *
 * usePhoneLink — GET/POST phone link
 * useWASessions — GET recent sessions
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

interface PhoneLink {
  id: string;
  phone_number: string;
  verified: boolean;
  auto_activate: boolean;
  language: 'en' | 'es';
  created_at: string;
}

interface WASession {
  id: string;
  state: string;
  image_urls: string[];
  extracted_vehicle: Record<string, unknown> | null;
  vehicle_id: string | null;
  language: string;
  created_at: string;
  updated_at: string;
}

export function usePhoneLink(wallet: string | undefined) {
  const [phoneLink, setPhoneLink] = useState<PhoneLink | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch_ = useCallback(async () => {
    if (!wallet) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/whatsapp/phone-link', {
        headers: { 'x-wallet-address': wallet },
      });
      const json = await res.json();
      if (json.success) {
        setPhoneLink(json.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch phone link');
    } finally {
      setIsLoading(false);
    }
  }, [wallet]);

  useEffect(() => {
    fetch_();
  }, [fetch_]);

  const linkPhone = useCallback(async (
    phoneNumber: string,
    autoActivate: boolean,
    language: 'en' | 'es'
  ) => {
    if (!wallet) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/whatsapp/phone-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': wallet,
        },
        body: JSON.stringify({
          phone_number: phoneNumber,
          auto_activate: autoActivate,
          language,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setPhoneLink(json.data);
        return true;
      } else {
        setError(json.error || 'Failed to link phone');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to link phone');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [wallet]);

  return { phoneLink, isLoading, error, linkPhone, refetch: fetch_ };
}

export function useWASessions(wallet: string | undefined) {
  const [sessions, setSessions] = useState<WASession[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetch_ = useCallback(async () => {
    if (!wallet) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/whatsapp/sessions', {
        headers: { 'x-wallet-address': wallet },
      });
      const json = await res.json();
      if (json.success) {
        setSessions(json.data || []);
      }
    } catch {
      // Silent fail
    } finally {
      setIsLoading(false);
    }
  }, [wallet]);

  useEffect(() => {
    fetch_();
  }, [fetch_]);

  return { sessions, isLoading, refetch: fetch_ };
}
