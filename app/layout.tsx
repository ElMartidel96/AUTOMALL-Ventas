import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/ui/toast';
import { Web3Provider } from '@/lib/thirdweb/provider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { ReferralTracker } from '@/components/providers/ReferralTracker';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { GlobalWidgets } from '@/components/layout/GlobalWidgets';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Autos MALL - Tu Plataforma de Venta de Autos con IA',
  description: 'La plataforma todo-en-uno para vendedores independientes de autos. Pagina profesional, asistente IA de ventas, CRM inteligente y comunicacion multicanal bajo tu marca.',
  keywords: 'autos, venta de autos, vendedor de autos, Houston, Texas, financiamiento, CRM automotriz, IA ventas, plataforma vendedores, inventario autos',
  authors: [{ name: 'Autos MALL Team' }],
  creator: 'Autos MALL LLC',
  publisher: 'Autos MALL LLC',
  metadataBase: new URL('https://autosmall.com'),
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: { url: '/apple-touch-icon.png', sizes: '180x180' },
  },
  alternates: {
    canonical: 'https://autosmall.com',
  },
  openGraph: {
    title: 'Autos MALL - Tu Plataforma de Venta de Autos con IA',
    description: 'La plataforma todo-en-uno para vendedores independientes de autos. Pagina profesional, asistente IA de ventas, CRM inteligente y comunicacion multicanal.',
    url: 'https://autosmall.com',
    siteName: 'Autos MALL',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: '/og-automall.png',
        width: 1200,
        height: 630,
        alt: 'Autos MALL - Tu Plataforma de Venta de Autos con IA',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Autos MALL - Tu Plataforma de Venta de Autos con IA',
    description: 'La plataforma todo-en-uno para vendedores independientes de autos. Asistente IA, CRM inteligente y tu propia pagina profesional.',
    images: ['/og-automall.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className="dark" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <Web3Provider>
              <ReferralTracker>
                <ToastProvider>
                  <main className="min-h-screen min-h-[100dvh] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-am-dark dark:to-am-darker transition-colors duration-300">
                    {children}
                  </main>
                  <GlobalWidgets />
                </ToastProvider>
              </ReferralTracker>
            </Web3Provider>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}