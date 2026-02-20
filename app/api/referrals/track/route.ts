/**
 * 📡 REFERRAL TRACKING API
 *
 * POST - Track a click on a referral link
 * GET - Get referral code info (for landing page)
 *
 * Features:
 * - Code format validation (CG-XXXXXX)
 * - Rate limiting (10 clicks/minute per IP)
 * - Click deduplication (same IP+code in 5 min = ignore)
 * - Fraud detection integration
 *
 * Made by mbxarts.com The Moon in a Box property
 * Co-Author: Godez22
 *
 * @endpoint /api/referrals/track
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  trackClick,
  getReferralCodeByCode,
  hashIP,
  registerReferral,
  markClickConverted,
  isValidReferralCode,
  checkFraudIndicators,
} from '@/lib/referrals/referral-service';
import { distributeSignupBonus } from '@/lib/referrals/signup-bonus-service';

// =====================================================
// 🛡️ RATE LIMITING & DEDUPLICATION
// =====================================================

// In-memory rate limit store (resets on server restart, which is acceptable)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

// Rate limit: 10 clicks per minute per IP
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

// Click deduplication: same IP+code ignored for 5 minutes
const DEDUP_WINDOW = 5 * 60 * 1000; // 5 minutes
const recentClicks = new Map<string, number>();

/**
 * Check rate limit for an IP
 * Returns true if allowed, false if rate limited
 */
function checkRateLimit(ipHash: string): boolean {
  const now = Date.now();
  const key = `rate_${ipHash}`;
  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetAt < now) {
    // New window
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count++;
  return true;
}

/**
 * Check if click is duplicate (same IP+code in dedup window)
 * Returns true if duplicate, false if new click
 */
function isDuplicateClick(ipHash: string, code: string): boolean {
  const now = Date.now();
  const key = `${ipHash}_${code}`;
  const lastClick = recentClicks.get(key);

  if (lastClick && (now - lastClick) < DEDUP_WINDOW) {
    return true;
  }

  recentClicks.set(key, now);
  return false;
}

// Clean up old entries periodically (every 10 minutes)
setInterval(() => {
  const now = Date.now();

  // Clean rate limit store
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }

  // Clean dedup store
  for (const [key, timestamp] of recentClicks.entries()) {
    if ((now - timestamp) > DEDUP_WINDOW) {
      recentClicks.delete(key);
    }
  }
}, 10 * 60 * 1000);

// Helper to detect device type from user agent
function detectDeviceType(userAgent: string): 'desktop' | 'mobile' | 'tablet' | 'unknown' {
  const ua = userAgent.toLowerCase();
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile/i.test(ua)) {
    return 'mobile';
  }
  if (/windows|macintosh|linux/i.test(ua)) {
    return 'desktop';
  }
  return 'unknown';
}

// Helper to extract browser from user agent
function detectBrowser(userAgent: string): string {
  if (userAgent.includes('Chrome') && !userAgent.includes('Edge')) return 'Chrome';
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Edge')) return 'Edge';
  if (userAgent.includes('Opera') || userAgent.includes('OPR')) return 'Opera';
  return 'Other';
}

// Helper to extract OS from user agent
function detectOS(userAgent: string): string {
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Mac')) return 'macOS';
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS';
  return 'Other';
}

// GET /api/referrals/track?code=CG-XXXXXX
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { error: 'Referral code is required' },
        { status: 400 }
      );
    }

    const referralCode = await getReferralCodeByCode(code);

    if (!referralCode) {
      return NextResponse.json(
        { error: 'Invalid referral code' },
        { status: 404 }
      );
    }

    if (!referralCode.is_active) {
      return NextResponse.json(
        { error: 'Referral code is no longer active' },
        { status: 410 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        code: referralCode.custom_code || referralCode.code,
        isValid: true,
        isActive: referralCode.is_active,
      },
    });
  } catch (error) {
    console.error('Error validating referral code:', error);
    return NextResponse.json(
      { error: 'Failed to validate referral code' },
      { status: 500 }
    );
  }
}

// POST /api/referrals/track - Track a click
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, source, medium, campaign, referer, landingPage } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'Referral code is required' },
        { status: 400 }
      );
    }

    // 🛡️ VALIDATION 1: Check code format (CG-XXXXXX or custom alphanumeric)
    const isValidFormat = isValidReferralCode(code) || /^[A-Za-z0-9]{4,20}$/i.test(code);
    if (!isValidFormat) {
      return NextResponse.json(
        { error: 'Invalid referral code format' },
        { status: 400 }
      );
    }

    // Get request metadata
    const userAgent = request.headers.get('user-agent') || '';
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const ip = forwardedFor?.split(',')[0] || realIP || 'unknown';

    // Hash IP for privacy
    const ipHash = await hashIP(ip);

    // 🛡️ VALIDATION 2: Rate limiting (10 clicks/minute per IP)
    if (!checkRateLimit(ipHash)) {
      console.warn(`[TrackAPI] Rate limit exceeded for IP hash: ${ipHash.slice(0, 8)}...`);
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // 🛡️ VALIDATION 3: Deduplication (same IP+code in 5 min = ignore, but return success)
    if (isDuplicateClick(ipHash, code)) {
      // Silently accept but don't record duplicate click
      const response = NextResponse.json({
        success: true,
        data: { tracked: true },
      });

      // Still set cookies for conversion tracking
      response.cookies.set('ref_code', code, {
        maxAge: 30 * 24 * 60 * 60,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });

      response.cookies.set('ref_ip', ipHash, {
        maxAge: 30 * 24 * 60 * 60,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });

      return response;
    }

    // Detect device info
    const deviceType = detectDeviceType(userAgent);
    const browser = detectBrowser(userAgent);
    const os = detectOS(userAgent);

    // Track the click
    await trackClick({
      referralCode: code,
      ipHash,
      userAgent,
      source: source || null,
      medium: medium || null,
      campaign: campaign || null,
      referer: referer || request.headers.get('referer') || null,
      landingPage: landingPage || null,
      deviceType,
      browser,
      os,
    });

    // Set cookie for conversion tracking
    // 🔒 SECURITY: Don't expose ipHash in response (removed)
    const response = NextResponse.json({
      success: true,
      data: { tracked: true },
    });

    // Set referral code cookie (expires in 30 days)
    response.cookies.set('ref_code', code, {
      maxAge: 30 * 24 * 60 * 60, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    // Set IP hash cookie for conversion tracking
    response.cookies.set('ref_ip', ipHash, {
      maxAge: 30 * 24 * 60 * 60,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return response;
  } catch (error) {
    console.error('Error tracking referral click:', error);
    return NextResponse.json(
      { error: 'Failed to track click' },
      { status: 500 }
    );
  }
}

// PUT /api/referrals/track - Register conversion (when user signs up)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { wallet, code, source, campaign } = body;

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }

    // Get referral code from cookie or body
    const refCode = code || request.cookies.get('ref_code')?.value;
    const ipHash = request.cookies.get('ref_ip')?.value;

    if (!refCode) {
      return NextResponse.json({
        success: true,
        data: {
          registered: false,
          message: 'No referral code found',
        },
      });
    }

    // 🛡️ FRAUD DETECTION: Check for suspicious activity before registering
    const fraudCheck = await checkFraudIndicators(wallet, ipHash || undefined);
    if (fraudCheck.isSuspicious) {
      console.warn(`[TrackAPI] Suspicious referral blocked for ${wallet}:`, fraudCheck.reasons);
      return NextResponse.json({
        success: false,
        data: {
          registered: false,
          message: 'Registration blocked due to suspicious activity',
          // Don't expose specific reasons to potential attackers
        },
      }, { status: 403 });
    }

    // Register the referral
    const referral = await registerReferral(wallet, refCode, source, campaign);

    if (!referral) {
      return NextResponse.json({
        success: true,
        data: {
          registered: false,
          message: 'User already registered or invalid referral code',
        },
      });
    }

    // Mark the click as converted
    if (ipHash) {
      await markClickConverted(ipHash, wallet);
    }

    // 🎁 Automatically distribute signup bonus (200 CGC) and referral commissions
    let bonusResult = null;
    try {
      console.log(`[TrackAPI] Distributing signup bonus for ${wallet} via ${refCode}`);
      bonusResult = await distributeSignupBonus(wallet, refCode);
      if (!bonusResult.success) {
        console.error('[TrackAPI] Bonus distribution had errors:', bonusResult.errors);
      } else {
        console.log(`[TrackAPI] Bonus distributed: ${bonusResult.totalDistributed} CGC`);
      }
    } catch (bonusError) {
      console.error('[TrackAPI] Failed to distribute bonus:', bonusError);
      // Don't fail the registration if bonus fails - it can be retried
    }

    // Clear referral cookies
    const response = NextResponse.json({
      success: true,
      data: {
        registered: true,
        referrer: referral.referrer_address,
        level: referral.level,
        bonus: bonusResult ? {
          distributed: bonusResult.success,
          totalAmount: bonusResult.totalDistributed,
          newUserBonus: bonusResult.newUserBonus,
          referrerCommissions: bonusResult.referrerCommissions,
          errors: bonusResult.errors.length > 0 ? bonusResult.errors : undefined,
        } : null,
      },
    });

    response.cookies.delete('ref_code');
    response.cookies.delete('ref_ip');

    return response;
  } catch (error) {
    console.error('Error registering referral conversion:', error);
    return NextResponse.json(
      { error: 'Failed to register conversion' },
      { status: 500 }
    );
  }
}
