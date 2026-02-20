import {getRequestConfig} from 'next-intl/server';
import {cookies} from 'next/headers';

export const locales = ['en', 'es'] as const;
export const defaultLocale = 'en' as const;

export type Locale = (typeof locales)[number];

/**
 * 🌐 I18N Configuration - Cookie-based locale detection
 *
 * This config reads the NEXT_LOCALE cookie to determine the active language.
 * The cookie is set by /api/locale when user clicks the language toggle.
 *
 * Flow:
 * 1. User clicks EN/ES in LanguageToggle.tsx
 * 2. POST /api/locale sets NEXT_LOCALE cookie
 * 3. Page reloads, this config reads the cookie
 * 4. NextIntlClientProvider receives messages in correct language
 * 5. useTranslations() returns translated strings
 */
export default getRequestConfig(async () => {
  // Read locale directly from cookie (not from requestLocale which requires middleware)
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get('NEXT_LOCALE')?.value;

  // Validate and use cookie value, fallback to default
  const locale: Locale = (localeCookie && locales.includes(localeCookie as Locale))
    ? (localeCookie as Locale)
    : defaultLocale;

  console.log(`[i18n] Loading locale: ${locale} (cookie: ${localeCookie || 'not set'})`);

  return {
    locale,
    messages: (await import(`../locales/${locale}.json`)).default,
    timeZone: 'America/Mexico_City'
  };
});
