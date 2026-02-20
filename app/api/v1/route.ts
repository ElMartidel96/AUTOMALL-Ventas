/**
 * 🌐 API v1 Root Endpoint
 *
 * Returns API information and available endpoints.
 *
 * @endpoint GET /api/v1
 *
 * Made by mbxarts.com The Moon in a Box property
 * Co-Author: Godez22
 */

import { NextResponse } from 'next/server';
import { API_VERSION, SERVICES } from '@/lib/integrations/config';

export async function GET() {
  return NextResponse.json({
    name: 'MBXarts Unified API',
    version: API_VERSION,
    services: {
      dao: {
        name: SERVICES.DAO.name,
        status: 'active',
        endpoints: [
          '/api/v1/profiles',
          '/api/v1/referrals',
          '/api/v1/tasks',
          '/api/v1/governance',
          '/api/v1/cgc',
        ],
      },
      wallets: {
        name: SERVICES.WALLETS.name,
        status: 'active',
        endpoints: [
          '/api/v1/wallets',
          '/api/v1/competitions',
          '/api/v1/escrow',
          '/api/v1/notifications',
        ],
      },
    },
    documentation: 'https://docs.mbxarts.com/api',
    timestamp: new Date().toISOString(),
  });
}
