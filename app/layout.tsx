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
import { headers } from 'next/headers';
import { TenantProvider } from '@/lib/tenant/TenantProvider';
import { resolveSellerByHandle } from '@/lib/tenant/resolve-seller';
import { FEATURE_SELLER_SUBDOMAINS } from '@/lib/config/features';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Autos MALL - Tu Plataforma de Venta de Autos con IA',
  description: 'La plataforma todo-en-uno para vendedores independientes de autos. Pagina profesional, asistente IA de ventas, CRM inteligente y comunicacion multicanal bajo tu marca.',
  keywords: 'autos, venta de autos, vendedor de autos, Houston, Texas, financiamiento, CRM automotriz, IA ventas, plataforma vendedores, inventario autos',
  authors: [{ name: 'Autos MALL Team' }],
  creator: 'Autos MALL LLC',
  publisher: 'Autos MALL LLC',
  metadataBase: new URL('https://www.autosmall.org'),
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: { url: '/apple-touch-icon.png', sizes: '180x180' },
  },
  alternates: {
    canonical: 'https://www.autosmall.org',
  },
  openGraph: {
    title: 'Autos MALL - Tu Plataforma de Venta de Autos con IA',
    description: 'La plataforma todo-en-uno para vendedores independientes de autos. Pagina profesional, asistente IA de ventas, CRM inteligente y comunicacion multicanal.',
    url: 'https://www.autosmall.org',
    siteName: 'Autos MALL',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Autos MALL - Tu Plataforma de Venta de Autos con IA',
    description: 'La plataforma todo-en-uno para vendedores independientes de autos. Asistente IA, CRM inteligente y tu propia pagina profesional.',
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

  // Multi-tenant: resolve seller from subdomain
  let sellerHandle: string | null = null;
  let seller = null;
  if (FEATURE_SELLER_SUBDOMAINS) {
    const headersList = await headers();
    sellerHandle = headersList.get('x-seller-handle');
    if (sellerHandle) {
      seller = await resolveSellerByHandle(sellerHandle);
    }
  }

  return (
    <html lang={locale} className="dark" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <Web3Provider>
              <TenantProvider seller={seller} handle={sellerHandle}>
                <ReferralTracker>
                  <ToastProvider>
                    <main className="min-h-screen min-h-[100dvh] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-am-dark dark:to-am-darker transition-colors duration-300">
                      {children}
                    </main>
                    <GlobalWidgets />
                  </ToastProvider>
                </ReferralTracker>
              </TenantProvider>
            </Web3Provider>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}