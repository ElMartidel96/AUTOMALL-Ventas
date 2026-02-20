/**
 * EMAIL VERIFICATION API - VERIFY OTP CODE
 * Verifies 6-digit OTP code and saves email to user profile.
 * Includes rate limiting and attempt tracking for security.
 *
 * @endpoint POST /api/email/verify-code
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateRedisForEmail } from '@/lib/redis/config';
import { createClient } from '@supabase/supabase-js';

// Security limits
const MAX_VERIFICATION_ATTEMPTS = 5;
const VERIFICATION_LOCKOUT = 15 * 60; // 15 minutes in seconds

// Lazy Supabase initialization
let supabase: ReturnType<typeof createClient> | null = null;

function getSupabase() {
  if (supabase) return supabase;

  // Try DAO-prefixed variables first (preferred), then fallback
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
    const { email, code, wallet } = body;

    // Validation
    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email and code are required', success: false },
        { status: 400 }
      );
    }

    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { error: 'Code must be 6 digits', success: false },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase();
    const normalizedWallet = wallet?.toLowerCase();

    // Try Redis first, fallback to Supabase
    const redis = validateRedisForEmail('email_verification_verify');
    let redisAvailable = false;

    if (redis) {
      try {
        const verificationKey = `dao_email_verify:${normalizedEmail}`;
        const lockoutKey = `dao_email_lockout:${normalizedEmail}`;

        // Check if account is locked out
        const lockout = await redis.get(lockoutKey);
        if (lockout) {
          const lockoutData = typeof lockout === 'string' ? JSON.parse(lockout) : lockout;
          const timeRemaining = Math.ceil((lockoutData.expiresAt - Date.now()) / 1000 / 60);

          return NextResponse.json(
            {
              error: `Too many failed attempts. Try again in ${timeRemaining} minutes.`,
              success: false,
              rateLimited: true,
            },
            { status: 429 }
          );
        }

        // Get verification data from Redis
        const verificationData = await redis.get(verificationKey);
        if (verificationData) {
          redisAvailable = true;
          const data = typeof verificationData === 'string' ? JSON.parse(verificationData) : verificationData;

          // Check if code has expired
          if (Date.now() > data.expiresAt) {
            await redis.del(verificationKey);
            return NextResponse.json(
              {
                error: 'Code has expired. Please request a new one.',
                success: false,
                expired: true,
              },
              { status: 400 }
            );
          }

          // Check attempts
          if (data.attempts >= MAX_VERIFICATION_ATTEMPTS) {
            const lockoutData = {
              email: normalizedEmail,
              lockedAt: Date.now(),
              expiresAt: Date.now() + VERIFICATION_LOCKOUT * 1000,
              reason: 'too_many_attempts',
            };

            await redis.setex(lockoutKey, VERIFICATION_LOCKOUT, JSON.stringify(lockoutData));
            await redis.del(verificationKey);

            return NextResponse.json(
              {
                error: 'Too many failed attempts. Account locked for 15 minutes.',
                success: false,
                rateLimited: true,
              },
              { status: 429 }
            );
          }

          // Verify code
          if (data.code !== code) {
            const updatedData = {
              ...data,
              attempts: data.attempts + 1,
              lastAttempt: Date.now(),
            };

            const ttl = await redis.ttl(verificationKey);
            await redis.setex(verificationKey, ttl > 0 ? ttl : 300, JSON.stringify(updatedData));

            const remainingAttempts = MAX_VERIFICATION_ATTEMPTS - updatedData.attempts;

            return NextResponse.json(
              {
                error: `Incorrect code. ${remainingAttempts} attempts remaining.`,
                success: false,
                verified: false,
                remainingAttempts,
              },
              { status: 400 }
            );
          }

          // Code is correct via Redis - save email to profile
          const walletToUse = normalizedWallet || data.wallet;
          const isRealWallet = walletToUse && /^0x[a-fA-F0-9]{40}$/.test(walletToUse);

          if (isRealWallet) {
            try {
              const db = getSupabase();
              const { error: updateError } = await db
                .from('user_profiles')
                .update({
                  email: normalizedEmail,
                  email_verified: true,
                  email_verification_token: null,
                  email_verification_expires_at: null,
                  updated_at: new Date().toISOString(),
                })
                .eq('wallet_address', walletToUse.toLowerCase());

              if (updateError) {
                console.error('Failed to update profile with email:', updateError);
              } else {
                console.log('✅ Email saved to profile (Redis path):', {
                  email: normalizedEmail.replace(/(.{2}).*(@.*)/, '$1***$2'),
                  identifier: walletToUse.startsWith('email:')
                    ? 'educational-flow'
                    : walletToUse.slice(0, 6) + '...' + walletToUse.slice(-4),
                });
              }
            } catch (dbError) {
              console.error('Database error saving email:', dbError);
            }
          }

          // Store verified email in Redis (30 days)
          const verifiedKey = `dao_email_verified:${normalizedEmail}`;
          const verifiedData = {
            email: normalizedEmail,
            wallet: walletToUse,
            verifiedAt: Date.now(),
          };
          await redis.setex(verifiedKey, 30 * 24 * 60 * 60, JSON.stringify(verifiedData));

          // Clean up
          await redis.del(verificationKey);
          await redis.del(lockoutKey);

          console.log('✅ Email verification successful (Redis):', {
            email: normalizedEmail.replace(/(.{2}).*(@.*)/, '$1***$2'),
            verifiedAt: new Date().toISOString(),
          });

          return NextResponse.json({
            success: true,
            message: 'Email verified successfully!',
            verified: true,
          });
        }
      } catch (redisError) {
        console.warn('⚠️ Redis verification failed, trying Supabase fallback:', redisError);
      }
    }

    // Supabase fallback: Verify OTP stored in database
    if (!redisAvailable) {
      console.log('📦 Using Supabase fallback for OTP verification');

      try {
        const db = getSupabase();

        // Check if this is educational flow (no wallet) or wallet-connected flow
        if (normalizedWallet && /^0x[a-fA-F0-9]{40}$/.test(normalizedWallet)) {
          // Wallet-connected flow: Get stored OTP from user_profiles
          const { data: profile, error: fetchError } = await db
            .from('user_profiles')
            .select('email_verification_token, email_verification_expires_at, email')
            .eq('wallet_address', normalizedWallet)
            .single();

          if (fetchError || !profile) {
            return NextResponse.json(
              {
                error: 'Profile not found. Please request a new verification code.',
                success: false,
                expired: true,
              },
              { status: 404 }
            );
          }

          // Check if OTP exists
          if (!profile.email_verification_token) {
            return NextResponse.json(
              {
                error: 'Verification code not found or expired. Please request a new code.',
                success: false,
                expired: true,
              },
              { status: 404 }
            );
          }

          // Check if code has expired
          if (profile.email_verification_expires_at) {
            const expiresAt = new Date(profile.email_verification_expires_at).getTime();
            if (Date.now() > expiresAt) {
              // Clear expired token
              await db
                .from('user_profiles')
                .update({
                  email_verification_token: null,
                  email_verification_expires_at: null,
                  updated_at: new Date().toISOString(),
                })
                .eq('wallet_address', normalizedWallet);

              return NextResponse.json(
                {
                  error: 'Code has expired. Please request a new one.',
                  success: false,
                  expired: true,
                },
                { status: 400 }
              );
            }
          }

          // Verify the code
          if (profile.email_verification_token !== code) {
            return NextResponse.json(
              {
                error: 'Incorrect code. Please try again.',
                success: false,
                verified: false,
              },
              { status: 400 }
            );
          }

          // Code is correct - update profile
          const { error: updateError } = await db
            .from('user_profiles')
            .update({
              email: normalizedEmail,
              email_verified: true,
              email_verification_token: null,
              email_verification_expires_at: null,
              updated_at: new Date().toISOString(),
            })
            .eq('wallet_address', normalizedWallet);

          if (updateError) {
            console.error('Failed to update profile with verified email:', updateError);
            return NextResponse.json(
              { error: 'Failed to save verified email', success: false },
              { status: 500 }
            );
          }

          console.log('✅ Email verification successful (Supabase - wallet flow):', {
            email: normalizedEmail.replace(/(.{2}).*(@.*)/, '$1***$2'),
            wallet: normalizedWallet.slice(0, 6) + '...' + normalizedWallet.slice(-4),
            verifiedAt: new Date().toISOString(),
          });

          return NextResponse.json({
            success: true,
            message: 'Email verified successfully!',
            verified: true,
          });
        } else {
          // Educational flow (no wallet): Get stored OTP from email_otp_verifications table
          console.log('📧 Educational flow: Verifying by email only');

          const { data: otpRecord, error: fetchError } = await db
            .from('email_otp_verifications')
            .select('otp_code, expires_at')
            .eq('email', normalizedEmail)
            .single();

          if (fetchError || !otpRecord) {
            console.error('OTP record not found:', fetchError);
            return NextResponse.json(
              {
                error: 'Verification code not found. Please request a new code.',
                success: false,
                expired: true,
              },
              { status: 404 }
            );
          }

          // Check if code has expired
          if (otpRecord.expires_at) {
            const expiresAt = new Date(otpRecord.expires_at).getTime();
            if (Date.now() > expiresAt) {
              // Delete expired record
              await db
                .from('email_otp_verifications')
                .delete()
                .eq('email', normalizedEmail);

              return NextResponse.json(
                {
                  error: 'Code has expired. Please request a new one.',
                  success: false,
                  expired: true,
                },
                { status: 400 }
              );
            }
          }

          // Verify the code
          if (otpRecord.otp_code !== code) {
            return NextResponse.json(
              {
                error: 'Incorrect code. Please try again.',
                success: false,
                verified: false,
              },
              { status: 400 }
            );
          }

          // Code is correct - delete OTP record and return success
          await db
            .from('email_otp_verifications')
            .delete()
            .eq('email', normalizedEmail);

          console.log('✅ Email verification successful (Supabase - educational flow):', {
            email: normalizedEmail.replace(/(.{2}).*(@.*)/, '$1***$2'),
            verifiedAt: new Date().toISOString(),
          });

          return NextResponse.json({
            success: true,
            message: 'Email verified successfully!',
            verified: true,
          });
        }
      } catch (dbError) {
        console.error('Supabase verification failed:', dbError);
        return NextResponse.json(
          { error: 'Verification service temporarily unavailable', success: false },
          { status: 503 }
        );
      }
    }

    // Should not reach here, but just in case
    return NextResponse.json(
      { error: 'Verification service temporarily unavailable', success: false },
      { status: 503 }
    );
  } catch (error) {
    console.error('❌ Email verification failed:', error);
    return NextResponse.json(
      { error: 'Verification failed', success: false },
      { status: 500 }
    );
  }
}
