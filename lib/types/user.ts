/**
 * User Types — Role-based user system
 *
 * Every wallet maps to exactly one `users` row.
 * Role determines navigation, onboarding flow, and feature access.
 */

export type UserRole = 'buyer' | 'seller' | 'birddog';

export interface User {
  id: string;
  wallet_address: string;
  role: UserRole;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

/** Roles that require onboarding and get a professional subdomain page */
export const DEALER_ROLES: UserRole[] = ['seller', 'birddog'];

export function isDealerRole(role: UserRole): boolean {
  return DEALER_ROLES.includes(role);
}
