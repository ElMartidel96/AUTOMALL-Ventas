/**
 * Mini App Layout
 *
 * Specialized layout for Farcaster Mini App context.
 * Provides Farcaster SDK context, optimized mobile styling,
 * and safe area handling.
 *
 * Made by mbxarts.com The Moon in a Box property
 * Co-Author: Godez22
 */

import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { MiniAppProvider } from './components/MiniAppProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CryptoGift DAO - Earn CGC Tokens by Completing Simple Tasks',
  description: 'Complete tasks, earn CGC tokens, and help govern the DAO. Join CryptoGift on Base - the future of decentralized rewards. Start earning crypto today!',

  // Open Graph - For rich cards when sharing links
  openGraph: {
    title: 'CryptoGift DAO - Earn CGC Tokens by Completing Simple Tasks',
    description: 'Complete tasks, earn CGC tokens, and help govern the DAO. Join CryptoGift on Base - the future of decentralized rewards. Start earning crypto today!',
    url: 'https://mbxarts.com/miniapp',
    siteName: 'CryptoGift DAO',
    images: [
      {
        url: 'https://mbxarts.com/farcaster-og-1200x630.png',
        width: 1200,
        height: 630,
        alt: 'CryptoGift DAO - Earn CGC by completing tasks',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },

  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'CryptoGift DAO - Earn CGC Tokens by Completing Simple Tasks',
    description: 'Complete tasks, earn CGC tokens, and help govern the DAO. Join CryptoGift on Base - the future of decentralized rewards. Start earning crypto today!',
    images: ['https://mbxarts.com/farcaster-og-1200x630.png'],
    creator: '@cryptogiftdao',
  },

  // Farcaster Mini App meta tags
  other: {
    'fc:frame': 'vNext',
    'fc:frame:image': 'https://mbxarts.com/farcaster-preview-1200x800.png',
    'fc:frame:button:1': 'Open Mini App',
    'fc:frame:button:1:action': 'launch_frame',
    'fc:frame:button:1:target': 'https://mbxarts.com/miniapp',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1a2e' },
  ],
};

export default async function MiniAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className="dark" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="icon" href="/cgc-icon.png" />
        <link rel="apple-touch-icon" href="/cgc-icon-1024.png" />
      </head>
      <body className={`${inter.className} overscroll-none`}>
        <ThemeProvider>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <MiniAppProvider>
              <main className="min-h-screen min-h-[100dvh] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 overflow-x-hidden">
                {children}
              </main>
            </MiniAppProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
