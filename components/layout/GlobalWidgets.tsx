/**
 * Global Widgets
 * Client-side wrapper for global floating components.
 * Includes apeX chat widget and seller setup banner.
 */

'use client';

import { ApexAgent } from '@/components/agent/ApexAgent';
import { SellerSetupBanner } from '@/components/seller/SellerSetupBanner';

export function GlobalWidgets() {
  return (
    <>
      <SellerSetupBanner />
      <ApexAgent />
    </>
  );
}
