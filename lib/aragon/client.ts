/**
 * Aragon DAO Client - Programmatic Access to DAO Governance
 *
 * This client queries admin permissions and roles directly from on-chain contracts.
 * NO HARDCODED ADDRESSES - All admin wallets are fetched from Gnosis Safe multisigs.
 *
 * @version 1.0.0
 * @updated December 2025
 */

import { createPublicClient, http, Address, formatEther } from 'viem';
import { base } from 'viem/chains';

// ============================================================================
// CONTRACT ADDRESSES (from .env or constants)
// These are the SOURCE OF TRUTH addresses - contracts themselves contain member lists
// ============================================================================

// Core DAO addresses
export const DAO_ADDRESS = (process.env.NEXT_PUBLIC_DAO_ADDRESS || '0x3244DFBf9E5374DF2f106E89Cf7972E5D4C9ac31') as Address;
export const TOKEN_VOTING_PLUGIN = (process.env.NEXT_PUBLIC_TOKEN_VOTING_PLUGIN || '0x5ADD5dc0a677dbB48fAC5e1DE4ca336d40B161a2') as Address;
export const CGC_TOKEN_ADDRESS = (process.env.NEXT_PUBLIC_CGC_TOKEN_ADDRESS || '0x5e3a61b550328f3D8C44f60b3e10a49D3d806175') as Address;
export const TIMELOCK_CONTROLLER = (process.env.NEXT_PUBLIC_TIMELOCK_CONTROLLER || '0x9753d772C632e2d117b81d96939B878D74fB5166') as Address;
export const MINTER_GATEWAY = (process.env.NEXT_PUBLIC_MINTER_GATEWAY || '0xdd10540847a4495e21f01230a0d39C7c6785598F') as Address;

// Gnosis Safe Multisig Addresses (signers of these are admins)
export const SAFE_OWNER_ADDRESS = (process.env.NEXT_PUBLIC_SAFE_OWNER || '0x11323672b5f9bB899Fa332D5d464CC4e66637b42') as Address;
export const SAFE_GUARDIAN_ADDRESS = (process.env.NEXT_PUBLIC_SAFE_GUARDIAN || '0xe9411DD1f2AF42186b2bCE828B6e7d0dd0D7a6bc') as Address;

// ============================================================================
// ABIs - Minimal ABIs for the functions we need
// ============================================================================

// Gnosis Safe ABI - to query owners/signers
const GNOSIS_SAFE_ABI = [
  {
    inputs: [],
    name: 'getOwners',
    outputs: [{ internalType: 'address[]', name: '', type: 'address[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getThreshold',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'owner', type: 'address' }],
    name: 'isOwner',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// CGC Token ABI (ERC20Votes) - to query voting power
const CGC_TOKEN_ABI = [
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'getVotes',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'delegates',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Token Voting Plugin ABI - to check proposal creation power
const TOKEN_VOTING_ABI = [
  {
    inputs: [],
    name: 'minProposerVotingPower',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '_account', type: 'address' }],
    name: 'isMember',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// ============================================================================
// VIEM CLIENT
// ============================================================================

const publicClient = createPublicClient({
  chain: base,
  transport: http(process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org'),
});

// ============================================================================
// CACHE SYSTEM - Reduce RPC calls
// ============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL_MS = 60 * 1000; // 1 minute cache

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) {
    return entry.data as T;
  }
  return null;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

// ============================================================================
// CORE FUNCTIONS - Get Admin Wallets Programmatically from Gnosis Safe
// ============================================================================

/**
 * Get all owners of a Gnosis Safe multisig - THE SOURCE OF ADMIN WALLETS
 * This is called to determine who are admins - NO HARDCODING
 */
export async function getSafeOwners(safeAddress: Address): Promise<Address[]> {
  const cacheKey = `safe-owners-${safeAddress}`;
  const cached = getCached<Address[]>(cacheKey);
  if (cached) return cached;

  try {
    const owners = await publicClient.readContract({
      address: safeAddress,
      abi: GNOSIS_SAFE_ABI,
      functionName: 'getOwners',
    });

    const result = [...owners] as Address[];
    setCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error(`[AragonClient] Error fetching Safe owners for ${safeAddress}:`, error);
    return [];
  }
}

/**
 * Check if an address is an owner of a specific Safe
 */
export async function isSafeOwner(safeAddress: Address, walletAddress: Address): Promise<boolean> {
  try {
    const isOwner = await publicClient.readContract({
      address: safeAddress,
      abi: GNOSIS_SAFE_ABI,
      functionName: 'isOwner',
      args: [walletAddress],
    });

    return isOwner;
  } catch (error) {
    console.error(`[AragonClient] Error checking Safe owner status:`, error);
    return false;
  }
}

/**
 * Get ALL admin wallets from both Gnosis Safes
 * This is the PROGRAMMATIC source of admin addresses
 */
export async function getAllAdminWallets(): Promise<Address[]> {
  const cacheKey = 'all-admin-wallets';
  const cached = getCached<Address[]>(cacheKey);
  if (cached) return cached;

  try {
    // Query both Safe multisigs in parallel
    const [ownerSafeSigners, guardianSafeSigners] = await Promise.all([
      getSafeOwners(SAFE_OWNER_ADDRESS),
      getSafeOwners(SAFE_GUARDIAN_ADDRESS),
    ]);

    // Include the DAO address itself as an admin
    const allAdmins = new Set<Address>([
      DAO_ADDRESS,
      ...ownerSafeSigners,
      ...guardianSafeSigners,
    ]);

    const result = Array.from(allAdmins);
    setCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error('[AragonClient] Error fetching all admin wallets:', error);
    // Fallback to DAO address only if queries fail
    return [DAO_ADDRESS];
  }
}

/**
 * Check if an address is an admin (member of any Safe or is the DAO)
 */
export async function isAdmin(walletAddress: Address): Promise<boolean> {
  if (!walletAddress) return false;

  const normalizedAddress = walletAddress.toLowerCase() as Address;

  // Check if it's the DAO address
  if (normalizedAddress === DAO_ADDRESS.toLowerCase()) {
    return true;
  }

  // Check Safe Owner (3/5)
  const isOwnerSigner = await isSafeOwner(SAFE_OWNER_ADDRESS, walletAddress);
  if (isOwnerSigner) return true;

  // Check Safe Guardian (2/3)
  const isGuardianSigner = await isSafeOwner(SAFE_GUARDIAN_ADDRESS, walletAddress);
  if (isGuardianSigner) return true;

  return false;
}

// ============================================================================
// TOKEN & VOTING POWER FUNCTIONS
// ============================================================================

/**
 * Get CGC token balance for an address
 */
export async function getTokenBalance(walletAddress: Address): Promise<bigint> {
  try {
    const balance = await publicClient.readContract({
      address: CGC_TOKEN_ADDRESS,
      abi: CGC_TOKEN_ABI,
      functionName: 'balanceOf',
      args: [walletAddress],
    });

    return balance;
  } catch (error) {
    console.error('[AragonClient] Error fetching token balance:', error);
    return 0n;
  }
}

/**
 * Get voting power for an address (includes delegated votes)
 */
export async function getVotingPower(walletAddress: Address): Promise<bigint> {
  try {
    const votes = await publicClient.readContract({
      address: CGC_TOKEN_ADDRESS,
      abi: CGC_TOKEN_ABI,
      functionName: 'getVotes',
      args: [walletAddress],
    });

    return votes;
  } catch (error) {
    console.error('[AragonClient] Error fetching voting power:', error);
    return 0n;
  }
}

/**
 * Get delegate address for a wallet
 */
export async function getDelegate(walletAddress: Address): Promise<Address | null> {
  try {
    const delegate = await publicClient.readContract({
      address: CGC_TOKEN_ADDRESS,
      abi: CGC_TOKEN_ABI,
      functionName: 'delegates',
      args: [walletAddress],
    });

    // Return null if self-delegated or zero address
    if (delegate === walletAddress || delegate === '0x0000000000000000000000000000000000000000') {
      return null;
    }

    return delegate;
  } catch (error) {
    console.error('[AragonClient] Error fetching delegate:', error);
    return null;
  }
}

/**
 * Get minimum voting power required to create proposals
 */
export async function getMinProposerVotingPower(): Promise<bigint> {
  const cacheKey = 'min-proposer-voting-power';
  const cached = getCached<bigint>(cacheKey);
  if (cached) return cached;

  try {
    const minPower = await publicClient.readContract({
      address: TOKEN_VOTING_PLUGIN,
      abi: TOKEN_VOTING_ABI,
      functionName: 'minProposerVotingPower',
    });

    setCache(cacheKey, minPower);
    return minPower;
  } catch (error) {
    console.error('[AragonClient] Error fetching min proposer voting power:', error);
    // Default to 1000 CGC (as per aragon-manual.md)
    return BigInt(1000) * BigInt(10 ** 18);
  }
}

/**
 * Check if address can create proposals
 */
export async function canCreateProposals(walletAddress: Address): Promise<boolean> {
  try {
    const [votingPower, minRequired] = await Promise.all([
      getVotingPower(walletAddress),
      getMinProposerVotingPower(),
    ]);

    return votingPower >= minRequired;
  } catch (error) {
    console.error('[AragonClient] Error checking proposal creation ability:', error);
    return false;
  }
}

// ============================================================================
// ROLE DETERMINATION - Based on on-chain data
// ============================================================================

export type UserRole = 'visitor' | 'holder' | 'voter' | 'proposer' | 'admin' | 'superadmin';

export interface UserRoleInfo {
  role: UserRole;
  isAdmin: boolean;
  isHolder: boolean;
  isVoter: boolean;
  canCreateProposals: boolean;
  balance: bigint;
  balanceFormatted: string;
  votingPower: bigint;
  votingPowerFormatted: string;
  delegate: Address | null;
  safeRoles: {
    isOwnerSigner: boolean;
    isGuardianSigner: boolean;
  };
}

/**
 * Get complete role information for a wallet address
 * ALL DATA COMES FROM ON-CHAIN - NO HARDCODING
 */
export async function getUserRoleInfo(walletAddress: Address | undefined | null): Promise<UserRoleInfo> {
  // Default for non-connected wallets
  if (!walletAddress) {
    return {
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
      safeRoles: {
        isOwnerSigner: false,
        isGuardianSigner: false,
      },
    };
  }

  try {
    // Fetch all on-chain data in parallel
    const [
      balance,
      votingPower,
      delegate,
      minProposerPower,
      isOwnerSigner,
      isGuardianSigner,
    ] = await Promise.all([
      getTokenBalance(walletAddress),
      getVotingPower(walletAddress),
      getDelegate(walletAddress),
      getMinProposerVotingPower(),
      isSafeOwner(SAFE_OWNER_ADDRESS, walletAddress),
      isSafeOwner(SAFE_GUARDIAN_ADDRESS, walletAddress),
    ]);

    // Determine role hierarchy
    const isHolder = balance > 0n;
    const isVoter = votingPower > 0n;
    const canPropose = votingPower >= minProposerPower;
    const isAdminUser = isOwnerSigner || isGuardianSigner || walletAddress.toLowerCase() === DAO_ADDRESS.toLowerCase();
    const isSuperAdmin = isOwnerSigner; // Owner Safe signers are superadmins

    // Determine highest role
    let role: UserRole = 'visitor';
    if (isSuperAdmin) {
      role = 'superadmin';
    } else if (isAdminUser) {
      role = 'admin';
    } else if (canPropose) {
      role = 'proposer';
    } else if (isVoter) {
      role = 'voter';
    } else if (isHolder) {
      role = 'holder';
    }

    return {
      role,
      isAdmin: isAdminUser,
      isHolder,
      isVoter,
      canCreateProposals: canPropose,
      balance,
      balanceFormatted: formatEther(balance),
      votingPower,
      votingPowerFormatted: formatEther(votingPower),
      delegate,
      safeRoles: {
        isOwnerSigner,
        isGuardianSigner,
      },
    };
  } catch (error) {
    console.error('[AragonClient] Error getting user role info:', error);
    // Return minimal info on error
    return {
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
      safeRoles: {
        isOwnerSigner: false,
        isGuardianSigner: false,
      },
    };
  }
}

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

export { publicClient };
export { formatEther };
