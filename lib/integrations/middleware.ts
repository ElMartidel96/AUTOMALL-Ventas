/**
 * 🛡️ API Middleware
 *
 * Common middleware functions for API routes:
 * - CORS handling
 * - Authentication
 * - Rate limiting
 * - Request validation
 *
 * Made by mbxarts.com The Moon in a Box property
 * Co-Author: Godez22
 */

import { NextRequest, NextResponse } from 'next/server';
import { CORS_CONFIG, isAllowedOrigin, generateRequestId } from './config';

// =============================================================================
// CORS MIDDLEWARE
// =============================================================================

export function corsHeaders(request: NextRequest): Headers {
  const origin = request.headers.get('origin');
  const headers = new Headers();

  // Set CORS headers
  if (origin && isAllowedOrigin(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
  }

  headers.set('Access-Control-Allow-Methods', CORS_CONFIG.allowedMethods.join(', '));
  headers.set('Access-Control-Allow-Headers', CORS_CONFIG.allowedHeaders.join(', '));
  headers.set('Access-Control-Expose-Headers', CORS_CONFIG.exposedHeaders.join(', '));
  headers.set('Access-Control-Max-Age', CORS_CONFIG.maxAge.toString());

  if (CORS_CONFIG.credentials) {
    headers.set('Access-Control-Allow-Credentials', 'true');
  }

  return headers;
}

/**
 * Handle CORS preflight requests
 */
export function handleCorsPreflightRequest(request: NextRequest): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(request),
  });
}

/**
 * Add CORS headers to response
 */
export function withCors(response: NextResponse, request: NextRequest): NextResponse {
  const headers = corsHeaders(request);
  headers.forEach((value, key) => {
    response.headers.set(key, value);
  });
  return response;
}

// =============================================================================
// REQUEST VALIDATION
// =============================================================================

export interface ValidatedRequest {
  requestId: string;
  walletAddress?: string;
  apiKey?: string;
  signature?: string;
  timestamp?: number;
}

/**
 * Extract and validate common request parameters
 */
export function validateRequest(request: NextRequest): ValidatedRequest {
  const requestId = request.headers.get('x-request-id') || generateRequestId();
  const walletAddress = request.headers.get('x-wallet-address') || undefined;
  const apiKey = request.headers.get('x-api-key') || undefined;
  const signature = request.headers.get('x-signature') || undefined;
  const timestampStr = request.headers.get('x-timestamp');
  const timestamp = timestampStr ? parseInt(timestampStr, 10) : undefined;

  // Validate wallet address format if provided
  if (walletAddress && !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
    throw new Error('Invalid wallet address format');
  }

  return {
    requestId,
    walletAddress,
    apiKey,
    signature,
    timestamp,
  };
}

// =============================================================================
// AUTHENTICATION
// =============================================================================

/**
 * Verify internal API key for service-to-service calls
 */
export function verifyInternalApiKey(apiKey: string | undefined): boolean {
  const validKey = process.env.INTERNAL_API_KEY;
  if (!validKey) {
    console.warn('⚠️ INTERNAL_API_KEY not configured');
    return false;
  }
  return apiKey === validKey;
}

/**
 * Check if request is from an allowed internal service
 */
export function isInternalRequest(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key');
  return verifyInternalApiKey(apiKey || undefined);
}

// =============================================================================
// ERROR RESPONSES
// =============================================================================

export function unauthorizedResponse(
  message = 'Unauthorized',
  requestId?: string
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message,
      },
      meta: { requestId },
    },
    { status: 401 }
  );
}

export function forbiddenResponse(
  message = 'Forbidden',
  requestId?: string
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'FORBIDDEN',
        message,
      },
      meta: { requestId },
    },
    { status: 403 }
  );
}

export function badRequestResponse(
  message: string,
  details?: unknown,
  requestId?: string
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'BAD_REQUEST',
        message,
        details,
      },
      meta: { requestId },
    },
    { status: 400 }
  );
}

export function notFoundResponse(
  message = 'Not found',
  requestId?: string
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message,
      },
      meta: { requestId },
    },
    { status: 404 }
  );
}

export function serverErrorResponse(
  message = 'Internal server error',
  requestId?: string
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message,
      },
      meta: { requestId },
    },
    { status: 500 }
  );
}

export function successResponse<T>(
  data: T,
  requestId?: string,
  status = 200
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      meta: { requestId },
    },
    { status }
  );
}
