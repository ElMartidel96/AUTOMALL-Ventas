'use client';

import { createContext, useContext } from 'react';
import type { Seller, TenantContext } from '@/lib/types/seller';

const TenantCtx = createContext<TenantContext>({
  seller: null,
  isSubdomain: false,
  handle: null,
});

interface TenantProviderProps {
  seller: Seller | null;
  handle: string | null;
  children: React.ReactNode;
}

export function TenantProvider({ seller, handle, children }: TenantProviderProps) {
  return (
    <TenantCtx.Provider
      value={{
        seller,
        isSubdomain: !!handle,
        handle,
      }}
    >
      {children}
    </TenantCtx.Provider>
  );
}

export function useTenant(): TenantContext {
  return useContext(TenantCtx);
}
