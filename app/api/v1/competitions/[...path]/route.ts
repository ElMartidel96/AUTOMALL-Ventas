/**
 * 🏆 Competitions Service Proxy
 *
 * Proxies requests to the Wallets service for competition operations.
 *
 * Supported paths:
 * - /api/v1/competitions - List/Create competitions
 * - /api/v1/competitions/:id - Get competition details
 * - /api/v1/competitions/:id/join - Join competition
 * - /api/v1/competitions/:id/leave - Leave competition
 * - /api/v1/competitions/:id/resolve - Resolve competition
 *
 * @endpoint /api/v1/competitions/[...path]
 *
 * Made by mbxarts.com The Moon in a Box property
 * Co-Author: Godez22
 */

import { NextRequest, NextResponse } from 'next/server';
import { SERVICES, TIMEOUTS, generateRequestId } from '@/lib/integrations/config';
import {
  corsHeaders,
  handleCorsPreflightRequest,
  validateRequest,
} from '@/lib/integrations/middleware';

// Build the target URL for the Wallets service
function buildTargetUrl(path: string[], searchParams: URLSearchParams): string {
  const baseUrl = SERVICES.WALLETS.internalUrl;
  const pathStr = path.join('/');
  const query = searchParams.toString();
  return `${baseUrl}/api/competitions/${pathStr}${query ? `?${query}` : ''}`;
}

// Proxy the request to the Wallets service
async function proxyRequest(
  request: NextRequest,
  method: string,
  path: string[]
): Promise<NextResponse> {
  const requestId = generateRequestId();
  const startTime = Date.now();

  try {
    const validated = validateRequest(request);
    const targetUrl = buildTargetUrl(path, new URL(request.url).searchParams);

    const forwardHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Request-ID': validated.requestId || requestId,
      'X-Forwarded-For': request.headers.get('x-forwarded-for') || request.ip || 'unknown',
    };

    if (validated.walletAddress) {
      forwardHeaders['X-Wallet-Address'] = validated.walletAddress;
    }
    if (validated.apiKey) {
      forwardHeaders['X-API-Key'] = validated.apiKey;
    }

    const internalKey = process.env.INTERNAL_API_KEY;
    if (internalKey) {
      forwardHeaders['X-Internal-API-Key'] = internalKey;
    }

    let body: string | undefined;
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      try {
        const jsonBody = await request.json();
        body = JSON.stringify(jsonBody);
      } catch {
        // No body
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUTS.long);

    const response = await fetch(targetUrl, {
      method,
      headers: forwardHeaders,
      body,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const contentType = response.headers.get('content-type');
    let responseData: unknown;

    if (contentType?.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    const duration = Date.now() - startTime;

    const proxyResponse = NextResponse.json(responseData, {
      status: response.status,
      headers: corsHeaders(request),
    });

    proxyResponse.headers.set('X-Request-ID', requestId);
    proxyResponse.headers.set('X-Response-Time', `${duration}ms`);
    proxyResponse.headers.set('X-Proxied-To', 'competitions-service');

    return proxyResponse;
  } catch (error) {
    console.error('[Competitions Proxy] Error:', error);

    if ((error as Error).name === 'AbortError') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'GATEWAY_TIMEOUT',
            message: 'Request to Competitions service timed out',
          },
          meta: { requestId },
        },
        { status: 504, headers: corsHeaders(request) }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Competitions service is temporarily unavailable',
        },
        meta: { requestId },
      },
      { status: 503, headers: corsHeaders(request) }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflightRequest(request);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, 'GET', path);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, 'POST', path);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, 'PUT', path);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, 'PATCH', path);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, 'DELETE', path);
}
