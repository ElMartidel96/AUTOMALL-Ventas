/**
 * 🌐 AUTO-TRANSLATE HOOK
 *
 * React hook for automatic text translation based on current locale.
 * Translates text on-the-fly when the user's language doesn't match
 * the detected language of the text.
 *
 * Features:
 * - Automatic language detection
 * - Caches translations to avoid repeated API calls
 * - Loading state management
 * - Error handling with graceful fallback
 *
 * @example
 * const { translatedText, isTranslating } = useAutoTranslate(
 *   "Hello, how are you?",
 *   "es" // target locale
 * );
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useLocale } from 'next-intl';

// Client-side translation cache (persists across component remounts)
const clientCache = new Map<string, string>();

function getCacheKey(text: string, locale: string): string {
  return `${locale}:${text.substring(0, 100)}`;
}

interface UseAutoTranslateResult {
  translatedText: string;
  isTranslating: boolean;
  error: string | null;
  originalText: string;
}

/**
 * Hook for automatic text translation
 *
 * @param text - Text to translate
 * @param targetLocale - Optional override for target locale (uses current locale by default)
 * @returns Object with translatedText, isTranslating state, and error
 */
export function useAutoTranslate(
  text: string | undefined | null,
  targetLocale?: 'en' | 'es'
): UseAutoTranslateResult {
  const currentLocale = useLocale() as 'en' | 'es';
  const locale = targetLocale || currentLocale;

  const [translatedText, setTranslatedText] = useState<string>(text || '');
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track the current text to avoid stale updates
  const textRef = useRef(text);
  textRef.current = text;

  useEffect(() => {
    // No text to translate
    if (!text || text.trim().length === 0) {
      setTranslatedText('');
      setIsTranslating(false);
      return;
    }

    const cacheKey = getCacheKey(text, locale);

    // Check cache first
    const cached = clientCache.get(cacheKey);
    if (cached) {
      setTranslatedText(cached);
      setIsTranslating(false);
      return;
    }

    // Start translation
    setIsTranslating(true);
    setError(null);

    const abortController = new AbortController();

    async function translate() {
      try {
        console.log('[useAutoTranslate] Starting translation:', {
          text: text?.substring(0, 50),
          targetLocale: locale,
          cacheKey,
        });

        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, to: locale }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[useAutoTranslate] API error:', response.status, errorText);
          throw new Error(`Translation failed: ${response.status}`);
        }

        const data = await response.json();
        console.log('[useAutoTranslate] API response:', {
          success: data.success,
          original: data.original?.substring(0, 30),
          translation: data.translation?.substring(0, 30),
          from: data.from,
          to: data.to,
        });

        // Only update if the text hasn't changed
        if (textRef.current === text) {
          const result = data.translation || text;
          const wasTranslated = result !== text;
          console.log('[useAutoTranslate] Result:', {
            wasTranslated,
            caching: true,
          });
          clientCache.set(cacheKey, result);
          setTranslatedText(result);
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return; // Ignored - component unmounted
        }
        console.error('[useAutoTranslate] Translation error:', err);
        setError(err instanceof Error ? err.message : 'Translation failed');
        // Fallback to original text
        setTranslatedText(text || '');
      } finally {
        if (textRef.current === text) {
          setIsTranslating(false);
        }
      }
    }

    translate();

    return () => {
      abortController.abort();
    };
  }, [text, locale]);

  return {
    translatedText,
    isTranslating,
    error,
    originalText: text || '',
  };
}

/**
 * Clear the client-side translation cache
 */
export function clearAutoTranslateCache(): void {
  clientCache.clear();
}
