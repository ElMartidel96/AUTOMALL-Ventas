/**
 * 🌐 TRANSLATION API
 *
 * Provides automatic text translation using Lingva Translate.
 * Free, no API key required, no rate limits.
 *
 * @endpoint POST /api/translate
 * @body { text: string, to: 'en' | 'es', from?: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { translateToLocale, translateText } from '@/lib/i18n/translation-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, to, from } = body;

    // Validation
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required', success: false },
        { status: 400 }
      );
    }

    if (!to || !['en', 'es'].includes(to)) {
      return NextResponse.json(
        { error: 'Target language (to) must be "en" or "es"', success: false },
        { status: 400 }
      );
    }

    // Limit text length to prevent abuse
    if (text.length > 5000) {
      return NextResponse.json(
        { error: 'Text too long (max 5000 characters)', success: false },
        { status: 400 }
      );
    }

    // Translate
    let translation: string;
    if (from) {
      translation = await translateText(text, from, to);
    } else {
      translation = await translateToLocale(text, to as 'en' | 'es');
    }

    return NextResponse.json({
      success: true,
      original: text,
      translation,
      to,
      from: from || 'auto',
    });
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json(
      { error: 'Translation failed', success: false },
      { status: 500 }
    );
  }
}
