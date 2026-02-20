import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Ensures a string is a valid Ethereum address type
 * @param address - The address string to validate (accepts null, undefined, or string)
 * @returns The address as `0x${string}` type or null if invalid
 */
export function ensureEthereumAddress(address: string | undefined | null): `0x${string}` | null {
  if (!address || typeof address !== 'string' || !address.startsWith('0x') || address.length !== 42) {
    return null
  }
  return address as `0x${string}`
}