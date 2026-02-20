/**
 * Auth Components - Access Control and Role Gates
 *
 * Exports all authentication and authorization components.
 *
 * @version 1.0.0
 * @updated December 2025
 */

// CGC Token Balance Gate
export { CGCAccessGate, withCGCAccess } from './CGCAccessGate';

// RBAC Role Gate (Programmatic from Aragon)
export {
  // Provider
  PermissionsProvider,
  // Gate Components
  RoleGate,
  AdminGate,
  SuperAdminGate,
  HolderGate,
  ProposerGate,
  // Hooks
  usePermissions,
  useHasRole,
  useHasPermission,
  useIsAdmin,
  useIsSuperAdmin,
  useUserRole,
  // Types
  type Permission,
  type UserRole,
  type UserPermissions,
} from './RoleGate';
