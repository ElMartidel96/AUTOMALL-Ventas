/**
 * EMAIL VERIFICATION API - SEND OTP CODE
 * Sends 6-digit OTP code via Resend for CryptoGift DAO profile verification.
 * Supports both Redis-backed OTP and fallback to database token storage.
 *
 * @endpoint POST /api/email/send-verification
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateRedisForEmail } from '@/lib/redis/config';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Rate limiting: 3 attempts per email per 10 minutes
const RATE_LIMIT = 3;
const RATE_WINDOW = 10 * 60; // 10 minutes in seconds
const CODE_EXPIRY = 10 * 60; // 10 minutes in seconds

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate secure token for fallback
function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Email validation
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

// Lazy Resend initialization
let resend: any = null;

async function getResend() {
  if (resend) return resend;

  // Try DAO-prefixed variable first (preferred), then fallback
  const apiKey = process.env.RESEND_DAO_API_KEY || process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_DAO_API_KEY not configured');
  }

  if (!apiKey.startsWith('re_')) {
    throw new Error('RESEND_DAO_API_KEY appears invalid (should start with "re_")');
  }

  const { Resend } = await import('resend');
  resend = new Resend(apiKey);
  return resend;
}

// Lazy Supabase initialization for fallback token storage
let supabase: ReturnType<typeof createClient> | null = null;

function getSupabase() {
  if (supabase) return supabase;

  const url = process.env.NEXT_PUBLIC_SUPABASE_DAO_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_DAO_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Supabase environment variables not configured');
  }

  supabase = createClient(url, key);
  return supabase;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, wallet } = body;

    // Validation
    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Valid email is required', success: false },
        { status: 400 }
      );
    }

    // Wallet is optional for educational flow
    // If wallet is provided and looks like an address, validate it
    // Otherwise, allow 'pending-verification' or empty wallet for educational mode
    const isValidWallet = wallet && /^0x[a-fA-F0-9]{40}$/.test(wallet);
    const isPendingVerification = !wallet || wallet === 'pending-verification';

    // Use email as identifier when no wallet connected (educational flow)
    const userIdentifier = isValidWallet ? wallet.toLowerCase() : `email:${email.toLowerCase()}`;

    // Get Resend client
    let resendClient;
    try {
      resendClient = await getResend();
    } catch (error) {
      console.error('Resend initialization failed:', error);
      return NextResponse.json(
        { error: 'Email service not configured', success: false },
        { status: 503 }
      );
    }

    // Generate OTP
    const otpCode = generateOTP();
    let redisAvailable = false;

    // Try to use Redis for rate limiting and OTP storage
    const redis = validateRedisForEmail('email_verification_send');

    if (redis) {
      try {
        // Rate limiting check
        const rateLimitKey = `dao_email_rate:${email.toLowerCase()}`;
        const attempts = await redis.get(rateLimitKey);
        const currentAttempts = attempts ? parseInt(String(attempts)) : 0;

        if (currentAttempts >= RATE_LIMIT) {
          const ttl = await redis.ttl(rateLimitKey);
          return NextResponse.json(
            {
              error: 'Too many attempts. Please try again later.',
              success: false,
              rateLimited: true,
              retryAfter: ttl > 0 ? ttl : 300,
            },
            { status: 429 }
          );
        }

        // Store OTP in Redis
        const verificationKey = `dao_email_verify:${email.toLowerCase()}`;
        const verificationData = {
          code: otpCode,
          email: email.toLowerCase(),
          wallet: userIdentifier, // Uses email as identifier when no wallet connected
          createdAt: Date.now(),
          expiresAt: Date.now() + CODE_EXPIRY * 1000,
          attempts: 0,
        };

        await redis.setex(verificationKey, CODE_EXPIRY, JSON.stringify(verificationData));
        await redis.setex(rateLimitKey, RATE_WINDOW, (currentAttempts + 1).toString());
        redisAvailable = true;
      } catch (redisError) {
        console.warn('⚠️ Redis operation failed, falling back to Supabase:', redisError);
      }
    }

    // Fallback: Store OTP in Supabase
    if (!redisAvailable) {
      console.log('📦 Using Supabase fallback for OTP storage');
      try {
        const db = getSupabase();
        const expiresAt = new Date(Date.now() + CODE_EXPIRY * 1000);

        if (isValidWallet) {
          // Store OTP in user_profiles for wallet-connected flow
          const { error: updateError } = await db
            .from('user_profiles')
            .update({
              email_verification_token: otpCode,
              email_verification_expires_at: expiresAt.toISOString(),
              email: email.toLowerCase(),
              updated_at: new Date().toISOString(),
            })
            .eq('wallet_address', wallet.toLowerCase());

          if (updateError) {
            console.error('Failed to store OTP in user_profiles:', updateError);
          }
        } else {
          // Educational flow: Store OTP in dedicated email_otp_verifications table
          console.log('📧 Educational flow: Storing OTP by email only');

          // Upsert into email_otp_verifications table
          const { error: upsertError } = await db
            .from('email_otp_verifications')
            .upsert({
              email: email.toLowerCase(),
              otp_code: otpCode,
              expires_at: expiresAt.toISOString(),
              created_at: new Date().toISOString(),
            }, {
              onConflict: 'email'
            });

          if (upsertError) {
            console.error('Failed to store OTP in email_otp_verifications:', upsertError);
            // If table doesn't exist, the error will be logged but email still sends
          } else {
            console.log('✅ OTP stored in email_otp_verifications table');
          }
        }
      } catch (dbError) {
        console.error('Supabase fallback failed:', dbError);
      }
    }

    // Send email via Resend - Try DAO-prefixed variable first
    const fromEmail = process.env.RESEND_DAO_FROM_EMAIL || process.env.RESEND_FROM_EMAIL || 'CryptoGift DAO <onboarding@resend.dev>';

    console.log('📧 Attempting to send email via Resend:', {
      from: fromEmail,
      to: email.replace(/(.{2}).*(@.*)/, '$1***$2'),
    });

    const { data: emailResult, error: emailError } = await resendClient.emails.send({
      from: fromEmail,
      to: [email],
      subject: `CryptoGift DAO - Verification Code: ${otpCode}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; border-radius: 20px; padding: 40px; text-align: center;">
          <h1 style="margin: 0 0 20px 0; font-size: 32px; font-weight: bold;">
            CryptoGift DAO
          </h1>

          <div style="background: rgba(255,255,255,0.15); border-radius: 15px; padding: 30px; margin: 20px 0;">
            <h2 style="margin: 0 0 15px 0; color: white; font-size: 24px;">
              Your Verification Code
            </h2>
            <div style="font-size: 48px; font-weight: bold; letter-spacing: 8px; margin: 20px 0; color: white; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">
              ${otpCode}
            </div>
            <p style="margin: 15px 0 0 0; font-size: 16px; opacity: 0.9;">
              This code expires in 10 minutes
            </p>
          </div>

          <div style="background: rgba(255,255,255,0.1); border-radius: 10px; padding: 20px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; opacity: 0.9;">
              <strong>Important:</strong> Setting up a recovery email ensures you never lose access to your DAO profile, even if you change wallets.
            </p>
          </div>

          <div style="margin-top: 30px; font-size: 14px; opacity: 0.7;">
            <p style="margin: 5px 0;">If you did not request this code, you can safely ignore this email.</p>
            <p style="margin: 5px 0;">&copy; ${new Date().getFullYear()} CryptoGift DAO</p>
          </div>
        </div>
      `,
    });

    if (emailError) {
      console.error('❌ Resend API error:', emailError);
      return NextResponse.json(
        { error: 'Failed to send verification email', success: false, details: emailError.message },
        { status: 500 }
      );
    }

    console.log('✅ Email verification sent:', {
      emailId: emailResult?.id,
      email: email.replace(/(.{2}).*(@.*)/, '$1***$2'),
      identifier: isValidWallet
        ? wallet.slice(0, 6) + '...' + wallet.slice(-4)
        : 'educational-flow',
      code: otpCode.slice(0, 2) + '****',
    });

    return NextResponse.json({
      success: true,
      message: 'Verification code sent to your email',
    });
  } catch (error) {
    console.error('❌ Email verification send failed:', error);
    return NextResponse.json(
      { error: 'Failed to send verification email', success: false },
      { status: 500 }
    );
  }
}
