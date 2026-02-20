/**
 * RBAC Permission System - Role-Based Access Control
 *
 * This system determines user permissions based on on-chain data from Aragon DAO.
 * NO HARDCODED ADDRESSES - Admin wallets are fetched from Gnosis Safe multisigs.
 *
 * Role Hierarchy (lowest to highest):
 * visitor < holder < voter < proposer < admin < superadmin
 *
 * @version 1.0.0
 * @updated December 2025
 */

import {
  getUserRoleInfo,
  getAllAdminWallets,
  isAdmin as checkIsAdmin,
  UserRole,
  UserRoleInfo,
} from '@/lib/aragon/client';
import type { Address } from 'viem';

// ============================================================================
// PERMISSION DEFINITIONS
// ============================================================================

/**
 * Available permissions in the system
 */
export type Permission =
  // Public permissions
  | 'view:dashboard'
  | 'view:proposals'
  | 'view:tasks'
  | 'view:funding'
  | 'view:docs'
  // Holder permissions
  | 'view:wallet'
  | 'view:referrals'
  | 'claim:tasks'
  // Voter permissions
  | 'vote:proposals'
  | 'submit:tasks'
  // Proposer permissions
  | 'create:proposals'
  | 'create:tasks'
  // Admin permissions
  | 'view:admin'
  | 'validate:tasks'
  | 'manage:users'
  | 'manage:proposals'
  // Superadmin permissions
  | 'manage:treasury'
  | 'manage:system'
  | 'emergency:pause';

/**
 * Permission sets for each role
 */
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  visitor: [
    'view:dashboard',
    'view:proposals',
    'view:tasks',
    'view:funding',
    'view:docs',
  ],
  holder: [
    'view:dashboard',
    'view:proposals',
    'view:tasks',
    'view:funding',
    'view:docs',
    'view:wallet',
    'view:referrals',
    'claim:tasks',
  ],
  voter: [
    'view:dashboard',
    'view:proposals',
    'view:tasks',
    'view:funding',
    'view:docs',
    'view:wallet',
    'view:referrals',
    'claim:tasks',
    'vote:proposals',
    'submit:tasks',
  ],
  proposer: [
    'view:dashboard',
    'view:proposals',
    'view:tasks',
    'view:funding',
    'view:docs',
    'view:wallet',
    'view:referrals',
    'claim:tasks',
    'vote:proposals',
    'submit:tasks',
    'create:proposals',
    'create:tasks',
  ],
  admin: [
    'view:dashboard',
    'view:proposals',
    'view:tasks',
    'view:funding',
    'view:docs',
    'view:wallet',
    'view:referrals',
    'claim:tasks',
    'vote:proposals',
    'submit:tasks',
    'create:proposals',
    'create:tasks',
    'view:admin',
    'validate:tasks',
    'manage:users',
    'manage:proposals',
  ],
  superadmin: [
    'view:dashboard',
    'view:proposals',
    'view:tasks',
    'view:funding',
    'view:docs',
    'view:wallet',
    'view:referrals',
    'claim:tasks',
    'vote:proposals',
    'submit:tasks',
    'create:proposals',
    'create:tasks',
    'view:admin',
    'validate:tasks',
    'manage:users',
    'manage:proposals',
    'manage:treasury',
    'manage:system',
    'emergency:pause',
  ],
};

// ============================================================================
// PERMISSION CHECK FUNCTIONS
// ============================================================================

/**
 * Check if a role has a specific permission
 */
export function roleHasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

/**
 * Check if a role is at least at a certain level
 */
export function roleIsAtLeast(userRole: UserRole, requiredRole: UserRole): boolean {
  const roleHierarchy: UserRole[] = ['visitor', 'holder', 'voter', 'proposer', 'admin', 'superadmin'];
  const userIndex = roleHierarchy.indexOf(userRole);
  const requiredIndex = roleHierarchy.indexOf(requiredRole);
  return userIndex >= requiredIndex;
}

/**
 * Get all permissions for a role
 */
export function getPermissionsForRole(role: UserRole): Permission[] {
  return [...ROLE_PERMISSIONS[role]];
}

// ============================================================================
// USER PERMISSION CONTEXT
// ============================================================================

export interface UserPermissions {
  role: UserRole;
  permissions: Permission[];
  hasPermission: (permission: Permission) => boolean;
  isAtLeast: (role: UserRole) => boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  roleInfo: UserRoleInfo;
}

/**
 * Get complete permission context for a user
 * Fetches role from on-chain data via Aragon client
 */
export async function getUserPermissions(walletAddress: Address | undefined | null): Promise<UserPermissions> {
  // Get role info from on-chain data
  const roleInfo = await getUserRoleInfo(walletAddress as Address);

  return {
    role: roleInfo.role,
    permissions: ROLE_PERMISSIONS[roleInfo.role],
    hasPermission: (permission: Permission) => roleHasPermission(roleInfo.role, permission),
    isAtLeast: (role: UserRole) => roleIsAtLeast(roleInfo.role, role),
    isAdmin: roleInfo.isAdmin,
    isSuperAdmin: roleInfo.role === 'superadmin',
    roleInfo,
  };
}

// ============================================================================
// API AUTHORIZATION HELPERS
// ============================================================================

/**
 * Check if a wallet address is authorized as admin (for API routes)
 * This replaces the hardcoded ADMIN_ADDRESSES array
 */
export async function isAuthorizedAdmin(walletAddress: string | undefined | null): Promise<boolean> {
  if (!walletAddress) return false;

  try {
    return await checkIsAdmin(walletAddress.toLowerCase() as Address);
  } catch (error) {
    console.error('[Permissions] Error checking admin authorization:', error);
    return false;
  }
}

/**
 * Get list of all admin wallet addresses (for API routes)
 * Fetches from Gnosis Safe on-chain - NO HARDCODING
 */
export async function getAdminWalletList(): Promise<string[]> {
  try {
    const admins = await getAllAdminWallets();
    return admins.map(addr => addr.toLowerCase());
  } catch (error) {
    console.error('[Permissions] Error fetching admin wallet list:', error);
    return [];
  }
}

// ============================================================================
// CACHED PERMISSION CHECKS (for client-side use)
// ============================================================================

// In-memory cache for permission checks
const permissionCache = new Map<string, { permissions: UserPermissions; timestamp: number }>();
const CACHE_TTL_MS = 30 * 1000; // 30 seconds

/**
 * Get cached user permissions (reduces RPC calls on client)
 */
export async function getCachedUserPermissions(
  walletAddress: Address | undefined | null
): Promise<UserPermissions> {
  const cacheKey = walletAddress?.toLowerCase() || 'visitor';

  // Check cache
  const cached = permissionCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.permissions;
  }

  // Fetch fresh data
  const permissions = await getUserPermissions(walletAddress);

  // Update cache
  permissionCache.set(cacheKey, {
    permissions,
    timestamp: Date.now(),
  });

  return permissions;
}

/**
 * Clear permission cache (call when wallet changes)
 */
export function clearPermissionCache(): void {
  permissionCache.clear();
}

// ============================================================================
// EXPORTS
// ============================================================================

export type { UserRole, UserRoleInfo };
export { getUserRoleInfo } from '@/lib/aragon/client';
