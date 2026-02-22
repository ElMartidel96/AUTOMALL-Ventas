/**
 * Multi-Tenant Middleware
 *
 * Detects seller subdomains from the Host header and injects
 * x-seller-handle into the request for downstream consumption.
 *
 * Examples:
 *   juanperez.autosmall.org → x-seller-handle: juanperez
 *   autosmall.org           → no header (main site)
 *   localhost:3000          → no header (development)
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { FEATURE_SELLER_SUBDOMAINS } from '@/lib/config/features';

// Domains where subdomain routing applies
const TENANT_DOMAINS = ['autosmall.org', 'autosmall.com'];

export function middleware(request: NextRequest) {
  // Skip if feature is disabled
  if (!FEATURE_SELLER_SUBDOMAINS) {
    return NextResponse.next();
  }

  const host = request.headers.get('host') || '';
  const handle = extractHandle(host);

  if (!handle) {
    return NextResponse.next();
  }

  // Clone headers and inject seller handle
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-seller-handle', handle);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

function extractHandle(host: string): string | null {
  // Remove port for local development
  const hostname = host.split(':')[0];

  // Check each tenant domain
  for (const domain of TENANT_DOMAINS) {
    if (hostname.endsWith(`.${domain}`)) {
      const handle = hostname.replace(`.${domain}`, '');
      // Ignore www and empty handles
      if (handle && handle !== 'www') {
        return handle.toLowerCase();
      }
    }
  }

  // Support local development: handle.localhost
  if (hostname.endsWith('.localhost')) {
    const handle = hostname.replace('.localhost', '');
    if (handle && handle !== 'www') {
      return handle.toLowerCase();
    }
  }

  return null;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
};
