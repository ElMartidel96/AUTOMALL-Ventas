/**
 * 🔀 Wallets Service Proxy
 *
 * Proxies requests to the Wallets service (gifts.mbxarts.com).
 * All wallet-related operations go through this gateway.
 *
 * Supported paths:
 * - /api/v1/wallets/:address - Get wallet info
 * - /api/v1/wallets/:address/balance - Get wallet balance
 * - /api/v1/wallets/tba/create - Create TBA wallet
 *
 * @endpoint /api/v1/wallets/[...path]
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
  serverErrorResponse,
} from '@/lib/integrations/middleware';

// Build the target URL for the Wallets service
function buildTargetUrl(path: string[], searchParams: URLSearchParams): string {
  const baseUrl = SERVICES.WALLETS.internalUrl;
  const pathStr = path.join('/');
  const query = searchParams.toString();
  return `${baseUrl}/api/${pathStr}${query ? `?${query}` : ''}`;
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
    // Validate request
    const validated = validateRequest(request);

    // Build target URL
    const targetUrl = buildTargetUrl(path, new URL(request.url).searchParams);

    // Prepare headers for forwarded request
    const forwardHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Request-ID': validated.requestId || requestId,
      'X-Forwarded-For': request.headers.get('x-forwarded-for') || request.ip || 'unknown',
      'X-Forwarded-Host': request.headers.get('host') || '',
    };

    // Forward auth headers
    if (validated.walletAddress) {
      forwardHeaders['X-Wallet-Address'] = validated.walletAddress;
    }
    if (validated.apiKey) {
      forwardHeaders['X-API-Key'] = validated.apiKey;
    }
    if (validated.signature) {
      forwardHeaders['X-Signature'] = validated.signature;
    }
    if (validated.timestamp) {
      forwardHeaders['X-Timestamp'] = validated.timestamp.toString();
    }

    // Add internal API key for service-to-service auth
    const internalKey = process.env.INTERNAL_API_KEY;
    if (internalKey) {
      forwardHeaders['X-Internal-API-Key'] = internalKey;
    }

    // Get request body for POST/PUT/PATCH
    let body: string | undefined;
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      try {
        const jsonBody = await request.json();
        body = JSON.stringify(jsonBody);
      } catch {
        // No body or invalid JSON
      }
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUTS.long);

    // Make the proxied request
    const response = await fetch(targetUrl, {
      method,
      headers: forwardHeaders,
      body,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Parse response
    const contentType = response.headers.get('content-type');
    let responseData: unknown;

    if (contentType?.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    // Calculate duration
    const duration = Date.now() - startTime;

    // Create response with CORS headers
    const proxyResponse = NextResponse.json(responseData, {
      status: response.status,
      headers: corsHeaders(request),
    });

    // Add timing headers
    proxyResponse.headers.set('X-Request-ID', requestId);
    proxyResponse.headers.set('X-Response-Time', `${duration}ms`);
    proxyResponse.headers.set('X-Proxied-To', 'wallets-service');

    return proxyResponse;
  } catch (error) {
    console.error('[Wallets Proxy] Error:', error);

    // Handle timeout
    if ((error as Error).name === 'AbortError') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'GATEWAY_TIMEOUT',
            message: 'Request to Wallets service timed out',
          },
          meta: { requestId },
        },
        {
          status: 504,
          headers: corsHeaders(request),
        }
      );
    }

    // Handle network errors
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Wallets service is temporarily unavailable',
        },
        meta: { requestId },
      },
      {
        status: 503,
        headers: corsHeaders(request),
      }
    );
  }
}

// =============================================================================
// HTTP METHODS
// =============================================================================

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
