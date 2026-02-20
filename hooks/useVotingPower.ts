/**
 * 🗳️ useVotingPower Hook
 *
 * Custom hook for managing ERC20Votes voting power delegation.
 * Provides utilities to check delegation status and activate voting power.
 *
 * CGC Token uses OpenZeppelin's ERC20Votes which requires users to
 * explicitly delegate their votes (to themselves or others) before
 * their token balance counts as voting power in the DAO.
 *
 * Uses Thirdweb v5 for transaction signing (not Wagmi's useWriteContract
 * because Wagmi doesn't have connectors configured in this project).
 *
 * Made by mbxarts.com The Moon in a Box property
 * Co-Author: Godez22
 */

import { useState, useEffect, useCallback } from 'react';
import { useReadContract } from 'wagmi';
import { parseAbi, type Address } from 'viem';
import { useAccount } from '@/lib/thirdweb';
import { useSendTransaction, useActiveAccount } from 'thirdweb/react';
import { prepareContractCall, getContract } from 'thirdweb';
import { getClientSafe } from '@/lib/thirdweb/client';
import { base } from 'thirdweb/chains';

// CGC Token Contract Address (Base Mainnet)
const CGC_TOKEN_ADDRESS: Address = '0x5e3a61b550328f3D8C44f60b3e10a49D3d806175';

// Minimal ABI for ERC20Votes delegation functions (for wagmi reads)
const ERC20_VOTES_ABI = parseAbi([
  'function delegate(address delegatee) external',
  'function delegates(address account) view returns (address)',
  'function getVotes(address account) view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
]);

export interface VotingPowerStatus {
  /** User's CGC token balance */
  balance: bigint;
  /** User's current voting power */
  votingPower: bigint;
  /** Address the user has delegated to (address(0) if not delegated) */
  delegatee: Address | null;
  /** Whether voting power is activated (delegated to self or another) */
  isActivated: boolean;
  /** Whether the user has CGC tokens but no voting power */
  needsActivation: boolean;
}

export interface UseVotingPowerReturn {
  /** Current voting power status */
  status: VotingPowerStatus | null;
  /** Whether the status is loading */
  isLoading: boolean;
  /** Error if any */
  error: Error | null;
  /** Activate voting power by delegating to self */
  activateVotingPower: () => void;
  /** Delegate to a specific address */
  delegateTo: (delegatee: Address) => void;
  /** Whether a delegation transaction is pending */
  isPending: boolean;
  /** Whether the last delegation was successful */
  isSuccess: boolean;
  /** Transaction hash of pending/completed delegation */
  txHash: string | undefined;
  /** Refetch the voting power status */
  refetch: () => void;
}

/**
 * Hook to manage ERC20Votes voting power delegation
 *
 * @returns Voting power status and functions to activate/delegate
 */
export function useVotingPower(): UseVotingPowerReturn {
  const { address, isConnected } = useAccount();
  const activeAccount = useActiveAccount();
  const [error, setError] = useState<Error | null>(null);
  const [txHash, setTxHash] = useState<string | undefined>(undefined);
  const [isSuccess, setIsSuccess] = useState(false);

  // Thirdweb send transaction hook
  const {
    mutate: sendTransaction,
    isPending: isSending,
    error: sendError,
  } = useSendTransaction();

  // Cast address to proper type for contract calls
  const userAddress = address as Address | undefined;

  // Read balance (using Wagmi - reads don't need wallet)
  const {
    data: balance,
    isLoading: isLoadingBalance,
    refetch: refetchBalance,
  } = useReadContract({
    address: CGC_TOKEN_ADDRESS,
    abi: ERC20_VOTES_ABI,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: isConnected && !!userAddress,
    },
  });

  // Read voting power
  const {
    data: votingPower,
    isLoading: isLoadingVotes,
    refetch: refetchVotes,
  } = useReadContract({
    address: CGC_TOKEN_ADDRESS,
    abi: ERC20_VOTES_ABI,
    functionName: 'getVotes',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: isConnected && !!userAddress,
    },
  });

  // Read delegatee
  const {
    data: delegatee,
    isLoading: isLoadingDelegatee,
    refetch: refetchDelegatee,
  } = useReadContract({
    address: CGC_TOKEN_ADDRESS,
    abi: ERC20_VOTES_ABI,
    functionName: 'delegates',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: isConnected && !!userAddress,
    },
  });

  // Compute status
  const status: VotingPowerStatus | null = address ? {
    balance: balance ?? 0n,
    votingPower: votingPower ?? 0n,
    delegatee: delegatee === '0x0000000000000000000000000000000000000000' ? null : (delegatee as Address),
    isActivated: delegatee !== undefined && delegatee !== '0x0000000000000000000000000000000000000000',
    needsActivation: (balance ?? 0n) > 0n && (votingPower ?? 0n) === 0n,
  } : null;

  // Refetch all data
  const refetch = useCallback(() => {
    refetchBalance();
    refetchVotes();
    refetchDelegatee();
  }, [refetchBalance, refetchVotes, refetchDelegatee]);

  // Handle send errors
  useEffect(() => {
    if (sendError) {
      setError(sendError);
    }
  }, [sendError]);

  // Activate voting power by delegating to self
  const activateVotingPower = useCallback(() => {
    if (!activeAccount || !userAddress) {
      setError(new Error('Wallet not connected'));
      return;
    }

    // Get client safely (may be null during SSR)
    const thirdwebClient = getClientSafe();
    if (!thirdwebClient) {
      setError(new Error('Thirdweb client not available'));
      return;
    }

    setError(null);
    setIsSuccess(false);
    setTxHash(undefined);

    try {
      // Create contract instance with current client
      const cgcContract = getContract({
        client: thirdwebClient,
        chain: base,
        address: CGC_TOKEN_ADDRESS,
      });

      // Prepare the delegate transaction using Thirdweb
      const transaction = prepareContractCall({
        contract: cgcContract,
        method: 'function delegate(address delegatee)',
        params: [userAddress],
      });

      // Send the transaction
      sendTransaction(transaction, {
        onSuccess: (result) => {
          console.log('[VotingPower] Delegation transaction sent:', result.transactionHash);
          setTxHash(result.transactionHash);
          setIsSuccess(true);
          // Refetch after a delay to allow blockchain to update
          setTimeout(() => {
            refetch();
          }, 3000);
        },
        onError: (err) => {
          console.error('[VotingPower] Delegation failed:', err);
          setError(err);
        },
      });
    } catch (err) {
      console.error('[VotingPower] Error preparing transaction:', err);
      setError(err instanceof Error ? err : new Error('Failed to activate voting power'));
    }
  }, [activeAccount, userAddress, sendTransaction, refetch]);

  // Delegate to a specific address
  const delegateTo = useCallback((delegateeAddress: Address) => {
    if (!activeAccount || !userAddress) {
      setError(new Error('Wallet not connected'));
      return;
    }

    // Get client safely (may be null during SSR)
    const thirdwebClient = getClientSafe();
    if (!thirdwebClient) {
      setError(new Error('Thirdweb client not available'));
      return;
    }

    setError(null);
    setIsSuccess(false);
    setTxHash(undefined);

    try {
      // Create contract instance with current client
      const cgcContract = getContract({
        client: thirdwebClient,
        chain: base,
        address: CGC_TOKEN_ADDRESS,
      });

      // Prepare the delegate transaction using Thirdweb
      const transaction = prepareContractCall({
        contract: cgcContract,
        method: 'function delegate(address delegatee)',
        params: [delegateeAddress],
      });

      // Send the transaction
      sendTransaction(transaction, {
        onSuccess: (result) => {
          console.log('[VotingPower] Delegation transaction sent:', result.transactionHash);
          setTxHash(result.transactionHash);
          setIsSuccess(true);
          // Refetch after a delay to allow blockchain to update
          setTimeout(() => {
            refetch();
          }, 3000);
        },
        onError: (err) => {
          console.error('[VotingPower] Delegation failed:', err);
          setError(err);
        },
      });
    } catch (err) {
      console.error('[VotingPower] Error preparing transaction:', err);
      setError(err instanceof Error ? err : new Error('Failed to delegate'));
    }
  }, [activeAccount, userAddress, sendTransaction, refetch]);

  return {
    status,
    isLoading: isLoadingBalance || isLoadingVotes || isLoadingDelegatee,
    error,
    activateVotingPower,
    delegateTo,
    isPending: isSending,
    isSuccess,
    txHash,
    refetch,
  };
}

export default useVotingPower;
