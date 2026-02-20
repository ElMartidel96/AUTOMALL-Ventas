import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { locale } = await request.json();

    // Validate locale
    if (!locale || !['en', 'es'].includes(locale)) {
      return NextResponse.json({ error: 'Invalid locale' }, { status: 400 });
    }

    console.log(`[Locale API] Setting locale to: ${locale}`);

    // Create response with cookie set via NextResponse
    const response = NextResponse.json({ success: true, locale }, { status: 200 });

    // Set the cookie properly using NextResponse
    response.cookies.set('NEXT_LOCALE', locale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      httpOnly: false, // Allow client-side access for reading
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    console.log(`[Locale API] Cookie set successfully for locale: ${locale}`);

    return response;

  } catch (error) {
    console.error('[Locale API] Error setting locale:', error);
    return NextResponse.json({ error: 'Failed to set locale' }, { status: 500 });
  }
}
