'use client';

import { useMutation } from '@tanstack/react-query';

export function useMetaPublish(walletAddress: string | undefined) {
  return useMutation({
    mutationFn: async (vehicleId: string) => {
      if (!walletAddress) {
        throw new Error('Wallet not connected');
      }
      const res = await fetch('/api/meta/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleId, sellerAddress: walletAddress.toLowerCase() }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to publish');
      }
      return res.json();
    },
  });
}
