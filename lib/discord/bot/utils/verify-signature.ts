/**
 * Discord Signature Verification
 *
 * Verifies that incoming requests are actually from Discord
 * Required for Interactions Endpoint security
 *
 * Uses discord-interactions library for battle-tested verification
 */

import { verifyKey } from 'discord-interactions'

// Lazy load public key to avoid build-time errors
function getPublicKey(): string | null {
  const key = process.env.DISCORD_PUBLIC_KEY
  if (!key) {
    console.error('[Discord] DISCORD_PUBLIC_KEY not configured')
    return null
  }
  return key
}

/**
 * Verify Discord request signature using discord-interactions library
 *
 * Discord signs all interaction requests with Ed25519.
 * We must verify the signature before processing.
 *
 * The discord-interactions library handles this correctly and is
 * maintained by the Discord team.
 */
export async function verifyDiscordSignature(
  body: string,
  signature: string,
  timestamp: string
): Promise<boolean> {
  const publicKey = getPublicKey()
  if (!publicKey) {
    console.error('[Discord] No public key available')
    return false
  }

  try {
    console.log('[Discord] Verifying signature with discord-interactions library')
    console.log('[Discord] Body length:', body.length)
    console.log('[Discord] Signature:', signature?.substring(0, 20) + '...')
    console.log('[Discord] Timestamp:', timestamp)
    console.log('[Discord] Public key:', publicKey.substring(0, 20) + '...')

    // verifyKey expects the raw body as a string or Buffer
    // It returns a Promise<boolean> so we need to await it
    const isValid = await verifyKey(body, signature, timestamp, publicKey)

    if (!isValid) {
      console.error('[Discord] Signature verification failed - signature does not match')
    } else {
      console.log('[Discord] Signature verification SUCCESS!')
    }

    return isValid
  } catch (error) {
    console.error('[Discord] Signature verification error:', error)
    return false
  }
}

/**
 * Alias for backward compatibility
 */
export async function verifyDiscordSignatureNacl(
  body: string,
  signature: string,
  timestamp: string
): Promise<boolean> {
  return verifyDiscordSignature(body, signature, timestamp)
}

/**
 * Verify request headers have required Discord fields
 */
export function hasRequiredHeaders(headers: Headers): boolean {
  const signature = headers.get('x-signature-ed25519')
  const timestamp = headers.get('x-signature-timestamp')
  return !!signature && !!timestamp
}

/**
 * Get signature and timestamp from headers
 */
export function getSignatureHeaders(headers: Headers): {
  signature: string | null
  timestamp: string | null
} {
  return {
    signature: headers.get('x-signature-ed25519'),
    timestamp: headers.get('x-signature-timestamp'),
  }
}
