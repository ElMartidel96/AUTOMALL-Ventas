/**
 * Reserved handles that cannot be used by sellers.
 * These are subdomains used by the platform itself.
 */
export const RESERVED_HANDLES = new Set([
  'www',
  'app',
  'api',
  'admin',
  'dashboard',
  'catalog',
  'inventory',
  'login',
  'signup',
  'onboarding',
  'profile',
  'settings',
  'docs',
  'blog',
  'help',
  'support',
  'status',
  'mail',
  'ftp',
  'dev',
  'staging',
  'test',
]);

/** Validate a seller handle format: lowercase, alphanumeric + hyphens, 3-30 chars */
export function isValidHandle(handle: string): boolean {
  return /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/.test(handle);
}

/** Check if a handle is available (not reserved) */
export function isHandleReserved(handle: string): boolean {
  return RESERVED_HANDLES.has(handle.toLowerCase());
}
