/**
 * Referral Link Landing
 *
 * GET /ref/[code]
 *
 * Handles referral links (e.g. autosmall.org/ref/AM-A1B2C3).
 * Redirects to the homepage with ?ref= parameter so the
 * ReferralTracker provider picks up the code automatically.
 */

import { redirect } from 'next/navigation';

interface Props {
  params: Promise<{ code: string }>;
}

export default async function ReferralRedirectPage({ params }: Props) {
  const { code } = await params;

  // Redirect to homepage with ref query param
  // ReferralTracker in the layout will handle tracking + cookie storage
  redirect(`/?ref=${encodeURIComponent(code)}`);
}
