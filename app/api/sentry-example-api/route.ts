import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

class SentryExampleAPIError extends Error {
  constructor(message: string | undefined) {
    super(message);
    this.name = "SentryExampleAPIError";
  }
}

// A faulty API route to test Sentry's error monitoring
// 🔐 Protected: Only accessible in development or with admin token
export function GET(req: NextRequest) {
  // 🔒 Restrict access to development or authorized users
  const adminToken = req.headers.get('admin-token');
  const isDevelopment = process.env.NODE_ENV === 'development';
  const validAdminToken = process.env.ADMIN_API_TOKEN;
  
  if (!isDevelopment && adminToken !== validAdminToken) {
    return NextResponse.json(
      { error: 'This endpoint is restricted to development or authorized admin access' },
      { status: 403 }
    );
  }
  
  throw new SentryExampleAPIError("This error is raised on the backend called by the example page.");
  return NextResponse.json({ data: "Testing Sentry Error..." });
}
