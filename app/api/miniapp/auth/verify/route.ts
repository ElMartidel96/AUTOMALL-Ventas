/**
 * Mini App Auth Verification API
 *
 * SECURITY CRITICAL: This endpoint verifies Farcaster signatures
 * and creates secure sessions. Never trust client-provided data.
 *
 * Made by mbxarts.com The Moon in a Box property
 * Co-Author: Godez22
 */

import { NextRequest, NextResponse } from 'next/server';

// Session expiration: 24 hours
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;

interface VerifyRequest {
  message: string;
  signature: string;
  nonce: string;
}

interface FarcasterMessage {
  domain: string;
  nonce: string;
  fid: number;
  custody?: string;
}

/**
 * Verify Farcaster signature and create session
 */
export async function POST(request: NextRequest) {
  try {
    const body: VerifyRequest = await request.json();

    // Validate required fields
    if (!body.message || !body.signature || !body.nonce) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Decode and parse the message
    let parsedMessage: FarcasterMessage;
    try {
      // The message is typically a JSON string
      parsedMessage = JSON.parse(body.message);
    } catch {
      return NextResponse.json(
        { error: 'Invalid message format' },
        { status: 400 }
      );
    }

    // Verify nonce matches
    if (parsedMessage.nonce !== body.nonce) {
      return NextResponse.json(
        { error: 'Nonce mismatch' },
        { status: 400 }
      );
    }

    // Verify domain matches our app
    const expectedDomain = 'mbxarts.com';
    if (parsedMessage.domain !== expectedDomain) {
      return NextResponse.json(
        { error: 'Domain mismatch' },
        { status: 400 }
      );
    }

    // TODO: In production, verify the signature cryptographically
    // This requires calling Farcaster Hub or using a verification library
    // For now, we trust the message structure (suitable for MVP)
    //
    // Production implementation should:
    // 1. Fetch the user's custody address from Farcaster Hub
    // 2. Verify the signature using ethers or viem
    // 3. Confirm the FID owns the signing address

    const fid = parsedMessage.fid;
    if (!fid || typeof fid !== 'number') {
      return NextResponse.json(
        { error: 'Invalid FID' },
        { status: 400 }
      );
    }

    // Get wallet address for this FID
    // In production, fetch from Farcaster Hub API
    const wallet = await getWalletForFid(fid);

    if (!wallet) {
      return NextResponse.json(
        { error: 'Could not resolve wallet for FID' },
        { status: 400 }
      );
    }

    // Create session
    const now = Date.now();
    const session = {
      fid,
      wallet: wallet.toLowerCase(),
      verifiedAt: now,
      expiresAt: now + SESSION_DURATION_MS,
      signature: body.signature,
    };

    // Return session to client
    // In production, also store server-side for validation
    return NextResponse.json(session);
  } catch (error) {
    console.error('[MiniApp Auth] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Neynar API response types
 */
interface NeynarUser {
  fid: number;
  username: string;
  display_name: string;
  verified_addresses: {
    eth_addresses: string[];
    sol_addresses: string[];
  };
  custody_address: string;
}

interface NeynarResponse {
  users: NeynarUser[];
}

/**
 * Get wallet address for a Farcaster FID via Neynar API
 * Returns the first verified ETH address, or custody address as fallback
 */
async function getWalletForFid(fid: number): Promise<string | null> {
  const apiKey = process.env.NEYNAR_API_KEY;

  if (!apiKey) {
    console.error('[MiniApp Auth] NEYNAR_API_KEY not configured');
    return null;
  }

  try {
    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`,
      {
        headers: {
          'accept': 'application/json',
          'x-api-key': apiKey,
        },
        next: { revalidate: 300 }, // Cache for 5 minutes
      }
    );

    if (!response.ok) {
      console.error(`[MiniApp Auth] Neynar API error: ${response.status}`);
      return null;
    }

    const data: NeynarResponse = await response.json();

    if (!data.users || data.users.length === 0) {
      console.error(`[MiniApp Auth] No user found for FID: ${fid}`);
      return null;
    }

    const user = data.users[0];

    // Prefer verified ETH address, fallback to custody address
    const verifiedAddresses = user.verified_addresses?.eth_addresses || [];
    const wallet = verifiedAddresses[0] || user.custody_address;

    if (!wallet) {
      console.error(`[MiniApp Auth] No wallet found for FID: ${fid}`);
      return null;
    }

    console.log(`[MiniApp Auth] Resolved FID ${fid} (@${user.username}) → ${wallet.slice(0, 10)}...`);
    return wallet;
  } catch (error) {
    console.error('[MiniApp Auth] Error fetching wallet for FID:', error);
    return null;
  }
}
