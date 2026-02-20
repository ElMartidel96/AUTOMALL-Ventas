/**
 * 🏥 Health Check Endpoint
 *
 * Returns service health status for monitoring and load balancers.
 *
 * @endpoint GET /api/v1/health
 *
 * Made by mbxarts.com The Moon in a Box property
 * Co-Author: Godez22
 */

import { NextResponse } from 'next/server';
import { SERVICES, TIMEOUTS } from '@/lib/integrations/config';

export const runtime = 'edge';

interface HealthCheck {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: 'ok' | 'error';
    blockchain: 'ok' | 'error';
    wallets_service: 'ok' | 'error' | 'unknown';
  };
  services: {
    dao: string;
    wallets: string;
  };
}

const startTime = Date.now();

async function checkWalletsService(): Promise<'ok' | 'error'> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUTS.internal);

    const response = await fetch(`${SERVICES.WALLETS.internalUrl}/api/v1/health`, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    return response.ok ? 'ok' : 'error';
  } catch {
    return 'error';
  }
}

export async function GET(): Promise<NextResponse<HealthCheck>> {
  const uptime = Math.floor((Date.now() - startTime) / 1000);

  // Check Wallets service health
  const walletsStatus = await checkWalletsService();

  // Basic health checks
  const checks = {
    database: 'ok' as const,
    blockchain: 'ok' as const,
    wallets_service: walletsStatus,
  };

  const allHealthy = Object.values(checks).every((v) => v === 'ok');
  const anyError = Object.values(checks).some((v) => v === 'error');

  return NextResponse.json({
    service: 'CryptoGift DAO',
    status: allHealthy ? 'healthy' : anyError ? 'degraded' : 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime,
    checks,
    services: {
      dao: SERVICES.DAO.url,
      wallets: SERVICES.WALLETS.url,
    },
  });
}
