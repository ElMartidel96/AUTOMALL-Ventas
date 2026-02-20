/**
 * 🌐 AUTOMATIC TRANSLATION SERVICE
 *
 * Uses Lingva Translate API for free, unlimited translations.
 * Lingva is an open-source alternative frontend for Google Translate.
 *
 * Features:
 * - Free, no API key required
 * - No rate limits
 * - High quality translations (uses Google Translate backend)
 * - Simple REST API
 *
 * @see https://github.com/thedaviddelta/lingva-translate
 */

// Available Lingva instances (fallback if one is down)
// Updated December 2025 with active instances
const LINGVA_INSTANCES = [
  'https://lingva.lunar.icu',
  'https://lingva.thedaviddelta.com',
  'https://translate.plausibility.cloud',
  'https://lingva.garuber.eu',
];

// MyMemory API as ultimate fallback (free, no API key, 5000 chars/day)
const MYMEMORY_API = 'https://api.mymemory.translated.net/get';

// In-memory cache for translations (per session)
const translationCache = new Map<string, string>();

/**
 * Generate cache key for a translation
 */
function getCacheKey(text: string, from: string, to: string): string {
  return `${from}:${to}:${text.substring(0, 100)}`;
}

/**
 * Detect if text is likely in Spanish
 * Simple heuristic based on common Spanish words/patterns
 */
export function detectLanguage(text: string): 'es' | 'en' | 'unknown' {
  const spanishIndicators = [
    /\b(el|la|los|las|un|una|unos|unas)\b/i,
    /\b(que|de|en|por|para|con|sin)\b/i,
    /\b(es|son|está|están|ser|tener)\b/i,
    /\b(tu|tus|su|sus|mi|mis)\b/i,
    /[áéíóúüñ]/i,
  ];

  const englishIndicators = [
    /\b(the|a|an)\b/i,
    /\b(is|are|was|were|be|been)\b/i,
    /\b(you|your|their|our)\b/i,
    /\b(and|or|but|if|then)\b/i,
    /\b(with|from|into|that)\b/i,
  ];

  const spanishScore = spanishIndicators.filter(r => r.test(text)).length;
  const englishScore = englishIndicators.filter(r => r.test(text)).length;

  if (spanishScore > englishScore + 1) return 'es';
  if (englishScore > spanishScore + 1) return 'en';
  return 'unknown';
}

/**
 * Translate text using Lingva Translate API
 *
 * @param text - Text to translate
 * @param from - Source language code (e.g., 'en', 'es', 'auto')
 * @param to - Target language code (e.g., 'en', 'es')
 * @returns Translated text or original if translation fails
 */
export async function translateText(
  text: string,
  from: string = 'auto',
  to: string = 'es'
): Promise<string> {
  console.log('[translateText] Called with:', { textLength: text?.length, from, to });

  // Don't translate empty text
  if (!text || text.trim().length === 0) {
    console.log('[translateText] Empty text, skipping');
    return text;
  }

  // Don't translate if source and target are the same
  if (from === to) {
    console.log('[translateText] Source equals target, skipping');
    return text;
  }

  // Check cache first
  const cacheKey = getCacheKey(text, from, to);
  const cached = translationCache.get(cacheKey);
  if (cached) {
    console.log('[translateText] Cache hit:', { cacheKey: cacheKey.substring(0, 30) });
    return cached;
  }

  console.log('[translateText] No cache, trying Lingva instances...');

  // Try each Lingva instance until one works
  for (const baseUrl of LINGVA_INSTANCES) {
    try {
      const encodedText = encodeURIComponent(text);
      const url = `${baseUrl}/api/v1/${from}/${to}/${encodedText}`;
      console.log('[translateText] Trying:', baseUrl);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        // 5 second timeout
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        console.warn(`[translateText] ${baseUrl} returned ${response.status}`);
        continue;
      }

      const data = await response.json();
      console.log('[translateText] Response from', baseUrl, ':', {
        hasTranslation: !!data.translation,
        translationPreview: data.translation?.substring(0, 30),
      });

      if (data.translation) {
        // Cache the result
        translationCache.set(cacheKey, data.translation);
        console.log('[translateText] SUCCESS - Cached and returning translation');
        return data.translation;
      }
    } catch (error) {
      console.warn(`[translateText] ${baseUrl} failed:`, error instanceof Error ? error.message : error);
      // Try next instance
      continue;
    }
  }

  // All Lingva instances failed, try MyMemory as fallback
  console.log('[translateText] All Lingva instances failed, trying MyMemory fallback...');
  try {
    const langPair = `${from}|${to}`;
    const url = `${MYMEMORY_API}?q=${encodeURIComponent(text)}&langpair=${langPair}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('[translateText] MyMemory response:', {
        status: data.responseStatus,
        hasTranslation: !!data.responseData?.translatedText,
      });

      if (data.responseStatus === 200 && data.responseData?.translatedText) {
        const translation = data.responseData.translatedText;
        // Don't cache "INVALID LANGUAGE PAIR" or similar errors
        if (!translation.toLowerCase().includes('invalid') && translation !== text) {
          translationCache.set(cacheKey, translation);
          console.log('[translateText] MyMemory SUCCESS - Cached and returning translation');
          return translation;
        }
      }
    }
  } catch (error) {
    console.warn('[translateText] MyMemory fallback failed:', error instanceof Error ? error.message : error);
  }

  // All instances failed, return original text
  console.error('[translateText] ALL TRANSLATION METHODS FAILED - returning original text');
  return text;
}

/**
 * Translate text to match the target locale
 * Automatically detects source language
 *
 * @param text - Text to translate
 * @param targetLocale - Target locale ('en' or 'es')
 * @returns Translated text or original if already in target language
 */
export async function translateToLocale(
  text: string,
  targetLocale: 'en' | 'es'
): Promise<string> {
  console.log('[translateToLocale] Called:', {
    textPreview: text?.substring(0, 50),
    targetLocale,
  });

  if (!text || text.trim().length === 0) {
    console.log('[translateToLocale] Empty text, returning as-is');
    return text;
  }

  // Detect source language
  const sourceLanguage = detectLanguage(text);
  console.log('[translateToLocale] Language detection:', {
    detected: sourceLanguage,
    target: targetLocale,
  });

  // If already in target language, return as-is
  if (sourceLanguage === targetLocale) {
    console.log('[translateToLocale] Already in target language, skipping translation');
    return text;
  }

  // If unknown, assume it's the opposite of target
  const from = sourceLanguage === 'unknown'
    ? (targetLocale === 'es' ? 'en' : 'es')
    : sourceLanguage;

  console.log('[translateToLocale] Will translate from:', from, 'to:', targetLocale);
  return translateText(text, from, targetLocale);
}

/**
 * Clear translation cache
 * Useful for testing or memory management
 */
export function clearTranslationCache(): void {
  translationCache.clear();
}

/**
 * Get cache statistics
 */
export function getTranslationCacheStats(): { size: number; keys: string[] } {
  return {
    size: translationCache.size,
    keys: Array.from(translationCache.keys()),
  };
}
