/**
 * Global Widgets
 * Client-side wrapper for global floating components.
 * Includes apeX chat widget, seller setup banner,
 * and auth data capture (email/phone from social login).
 */

'use client';

import { ApexAgent } from '@/components/agent/ApexAgent';
import { SellerSetupBanner } from '@/components/seller/SellerSetupBanner';
import { RoleSelectorModal } from '@/components/user/RoleSelectorModal';
import { useAuthData } from '@/hooks/useAuthData';

export function GlobalWidgets() {
  // Captures email/phone from OAuth provider and saves to user profile
  useAuthData();

  return (
    <>
      <RoleSelectorModal />
      <SellerSetupBanner />
      <ApexAgent />
    </>
  );
}
