/**
 * 🛡️ Role Gate - RBAC-Based Access Control Component
 *
 * Conditionally renders content based on user role/permissions.
 * Uses programmatic admin checks from Aragon Gnosis Safe contracts.
 *
 * Features:
 * - Role-based access (visitor, holder, voter, proposer, admin, superadmin)
 * - Permission-based access (view:admin, manage:treasury, etc.)
 * - Loading states with skeleton
 * - Fallback content for unauthorized users
 * - Cache to reduce RPC calls
 *
 * @version 1.0.0
 * @updated December 2025
 */

'use client';

import React, { useEffect, useState, createContext, useContext, useCallback } from 'react';
import { useAccount } from '@/lib/thirdweb';
import {
  getUserPermissions,
  getCachedUserPermissions,
  clearPermissionCache,
  roleIsAtLeast,
  type Permission,
  type UserPermissions,
  type UserRole,
} from '@/lib/auth/permissions';
import { Loader2, ShieldX, Lock, AlertTriangle } from 'lucide-react';
import type { Address } from 'viem';

// ============================================================================
// CONTEXT - Share permissions across components
// ============================================================================

interface PermissionsContextType {
  permissions: UserPermissions | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

const PermissionsContext = createContext<PermissionsContextType>({
  permissions: null,
  isLoading: true,
  error: null,
  refetch: async () => {},
});

/**
 * Hook to access user permissions from context
 */
export function usePermissions(): PermissionsContextType {
  return useContext(PermissionsContext);
}

/**
 * Provider component that fetches and caches user permissions
 */
export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const { address, isConnected } = useAccount();
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPermissions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const userPerms = await getCachedUserPermissions(
        isConnected && address ? (address as Address) : null
      );
      setPermissions(userPerms);
    } catch (err) {
      console.error('[RoleGate] Error fetching permissions:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch permissions'));
      // Set default visitor permissions on error
      setPermissions({
        role: 'visitor',
        permissions: ['view:dashboard', 'view:proposals', 'view:tasks', 'view:funding', 'view:docs'],
        hasPermission: () => false,
        isAtLeast: () => false,
        isAdmin: false,
        isSuperAdmin: false,
        roleInfo: {
          role: 'visitor',
          isAdmin: false,
          isHolder: false,
          isVoter: false,
          canCreateProposals: false,
          balance: 0n,
          balanceFormatted: '0',
          votingPower: 0n,
          votingPowerFormatted: '0',
          delegate: null,
          safeRoles: { isOwnerSigner: false, isGuardianSigner: false },
        },
      });
    } finally {
      setIsLoading(false);
    }
  }, [address, isConnected]);

  // Fetch permissions when wallet changes
  useEffect(() => {
    // Clear cache when wallet changes
    clearPermissionCache();
    fetchPermissions();
  }, [fetchPermissions]);

  return (
    <PermissionsContext.Provider
      value={{
        permissions,
        isLoading,
        error,
        refetch: fetchPermissions,
      }}
    >
      {children}
    </PermissionsContext.Provider>
  );
}

// ============================================================================
// ROLE GATE COMPONENT
// ============================================================================

interface RoleGateProps {
  children: React.ReactNode;
  // Role-based access
  requiredRole?: UserRole;
  // Permission-based access
  requiredPermission?: Permission;
  // Multiple permissions (user must have ALL)
  requiredPermissions?: Permission[];
  // Any permission (user must have at least ONE)
  anyPermission?: Permission[];
  // Custom fallback
  fallback?: React.ReactNode;
  // Show nothing instead of fallback
  hideWhenUnauthorized?: boolean;
  // Show loading skeleton
  showLoading?: boolean;
  // Custom loading component
  loadingComponent?: React.ReactNode;
}

/**
 * Gate component that conditionally renders based on role/permissions
 *
 * @example
 * // Require admin role
 * <RoleGate requiredRole="admin">
 *   <AdminPanel />
 * </RoleGate>
 *
 * @example
 * // Require specific permission
 * <RoleGate requiredPermission="manage:treasury">
 *   <TreasuryControls />
 * </RoleGate>
 *
 * @example
 * // Hide when unauthorized (no fallback)
 * <RoleGate requiredRole="proposer" hideWhenUnauthorized>
 *   <CreateProposalButton />
 * </RoleGate>
 */
export function RoleGate({
  children,
  requiredRole,
  requiredPermission,
  requiredPermissions,
  anyPermission,
  fallback,
  hideWhenUnauthorized = false,
  showLoading = true,
  loadingComponent,
}: RoleGateProps) {
  const { permissions, isLoading } = usePermissions();

  // Loading state
  if (isLoading && showLoading) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
      </div>
    );
  }

  // Check authorization
  let isAuthorized = true;

  if (!permissions) {
    isAuthorized = false;
  } else {
    // Check role requirement
    if (requiredRole && !roleIsAtLeast(permissions.role, requiredRole)) {
      isAuthorized = false;
    }

    // Check single permission requirement
    if (requiredPermission && !permissions.hasPermission(requiredPermission)) {
      isAuthorized = false;
    }

    // Check multiple permissions (ALL required)
    if (requiredPermissions && requiredPermissions.length > 0) {
      const hasAll = requiredPermissions.every((p) => permissions.hasPermission(p));
      if (!hasAll) isAuthorized = false;
    }

    // Check any permission (at least ONE required)
    if (anyPermission && anyPermission.length > 0) {
      const hasAny = anyPermission.some((p) => permissions.hasPermission(p));
      if (!hasAny) isAuthorized = false;
    }
  }

  // Authorized - render children
  if (isAuthorized) {
    return <>{children}</>;
  }

  // Not authorized - hide or show fallback
  if (hideWhenUnauthorized) {
    return null;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  // Default fallback
  return null;
}

// ============================================================================
// SPECIALIZED GATE COMPONENTS
// ============================================================================

interface AdminGateProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showFallback?: boolean;
}

/**
 * Gate that only allows admin users
 * Admin = Gnosis Safe Owner OR Guardian signer
 */
export function AdminGate({ children, fallback, showFallback = false }: AdminGateProps) {
  const { permissions, isLoading } = usePermissions();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!permissions?.isAdmin) {
    if (showFallback && fallback) {
      return <>{fallback}</>;
    }
    if (showFallback) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <ShieldX className="h-12 w-12 text-red-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Admin Access Required
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
            This section is restricted to DAO administrators. Admin wallets are determined
            programmatically from Aragon Gnosis Safe multisigs.
          </p>
        </div>
      );
    }
    return null;
  }

  return <>{children}</>;
}

/**
 * Gate that only allows superadmin users (Owner Safe signers)
 */
export function SuperAdminGate({ children, fallback, showFallback = false }: AdminGateProps) {
  const { permissions, isLoading } = usePermissions();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!permissions?.isSuperAdmin) {
    if (showFallback && fallback) {
      return <>{fallback}</>;
    }
    if (showFallback) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <Lock className="h-12 w-12 text-amber-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Super Admin Access Required
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
            This section is restricted to Owner Safe (3/5) signers only.
          </p>
        </div>
      );
    }
    return null;
  }

  return <>{children}</>;
}

/**
 * Gate that requires holder status (any CGC balance)
 */
export function HolderGate({ children, fallback, showFallback = false }: AdminGateProps) {
  const { permissions, isLoading } = usePermissions();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!permissions?.roleInfo.isHolder) {
    if (showFallback && fallback) {
      return <>{fallback}</>;
    }
    if (showFallback) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            CGC Holder Required
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
            You need to hold CGC tokens to access this feature.
          </p>
        </div>
      );
    }
    return null;
  }

  return <>{children}</>;
}

/**
 * Gate that requires proposer status (can create proposals)
 */
export function ProposerGate({ children, fallback, showFallback = false }: AdminGateProps) {
  const { permissions, isLoading } = usePermissions();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!permissions?.roleInfo.canCreateProposals) {
    if (showFallback && fallback) {
      return <>{fallback}</>;
    }
    if (showFallback) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-orange-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Proposer Status Required
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
            You need 1,000+ CGC voting power to create proposals.
          </p>
        </div>
      );
    }
    return null;
  }

  return <>{children}</>;
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Hook to check if current user has a specific role
 */
export function useHasRole(role: UserRole): boolean {
  const { permissions } = usePermissions();
  if (!permissions) return false;
  return roleIsAtLeast(permissions.role, role);
}

/**
 * Hook to check if current user has a specific permission
 */
export function useHasPermission(permission: Permission): boolean {
  const { permissions } = usePermissions();
  if (!permissions) return false;
  return permissions.hasPermission(permission);
}

/**
 * Hook to check if current user is admin
 */
export function useIsAdmin(): boolean {
  const { permissions } = usePermissions();
  return permissions?.isAdmin ?? false;
}

/**
 * Hook to check if current user is superadmin
 */
export function useIsSuperAdmin(): boolean {
  const { permissions } = usePermissions();
  return permissions?.isSuperAdmin ?? false;
}

/**
 * Hook to get current user role
 */
export function useUserRole(): UserRole {
  const { permissions } = usePermissions();
  return permissions?.role ?? 'visitor';
}

// ============================================================================
// EXPORTS
// ============================================================================

export type { Permission, UserRole, UserPermissions };
