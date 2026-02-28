/**
 * Meta Data Deletion Callback
 *
 * POST /api/meta/data-deletion
 *
 * Facebook sends a signed request when a user requests deletion of their data.
 * We delete the user's Meta connection and return a confirmation URL + code.
 *
 * Spec: https://developers.facebook.com/docs/development/create-an-app/app-dashboard/data-deletion-callback
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTypedClient } from '@/lib/supabase/client';
import crypto from 'crypto';

const META_APP_SECRET = process.env.META_APP_SECRET || '';
const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || 'autosmall.org';

function parseSignedRequest(signedRequest: string, secret: string): Record<string, unknown> | null {
  const [encodedSig, payload] = signedRequest.split('.', 2);
  if (!encodedSig || !payload) return null;

  const sig = Buffer.from(encodedSig.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest();

  if (!crypto.timingSafeEqual(sig, expectedSig)) return null;

  const data = JSON.parse(Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString());
  return data;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const signedRequest = formData.get('signed_request') as string;

    if (!signedRequest || !META_APP_SECRET) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const data = parseSignedRequest(signedRequest, META_APP_SECRET);
    if (!data) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    const fbUserId = data.user_id as string;
    if (!fbUserId) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
    }

    // Generate confirmation code
    const confirmationCode = crypto.randomUUID();

    // Delete user's Meta connection data
    const supabase = getTypedClient();
    await supabase
      .from('seller_meta_connections')
      .delete()
      .eq('fb_user_id', fbUserId);

    // Return status URL and confirmation code per Meta spec
    return NextResponse.json({
      url: `https://${APP_DOMAIN}/data-deletion?code=${confirmationCode}`,
      confirmation_code: confirmationCode,
    });
  } catch (error) {
    console.error('[DataDeletion] Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
