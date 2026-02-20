/**
 * 💰 Token Transfer Service
 *
 * Handles on-chain CGC token transfers using private key signing.
 * Used by the signup bonus and referral commission systems.
 *
 * SECURITY: Private key is only accessed server-side and never exposed to client.
 */

import {
  createWalletClient,
  createPublicClient,
  http,
  parseUnits,
  formatUnits,
  type Address,
  type Hash,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';

// ERC20 Transfer ABI (minimal)
const ERC20_ABI = [
  {
    name: 'transfer',
    type: 'function',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    name: 'decimals',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
  },
] as const;

// Configuration from environment
const CGC_TOKEN_ADDRESS = process.env.CGC_TOKEN_ADDRESS as Address;
const BASE_RPC_URL = process.env.BASE_RPC_URL || 'https://mainnet.base.org';

// CGC Token has 18 decimals
const CGC_DECIMALS = 18;

// Rate limiting: max transfers per minute (prevent abuse)
const MAX_TRANSFERS_PER_MINUTE = 10;
const transferTimestamps: number[] = [];

export interface TransferResult {
  success: boolean;
  txHash?: Hash;
  error?: string;
  gasUsed?: string;
  blockNumber?: number;
}

export interface BatchTransferResult {
  success: boolean;
  results: {
    recipient: string;
    amount: number;
    txHash?: Hash;
    error?: string;
  }[];
  totalTransferred: number;
  failedCount: number;
}

/**
 * Get the deployer wallet client for signing transactions
 */
function getWalletClient() {
  const privateKey = process.env.PRIVATE_KEY_DAO_DEPLOYER;

  if (!privateKey) {
    throw new Error('PRIVATE_KEY_DAO_DEPLOYER not configured');
  }

  if (!CGC_TOKEN_ADDRESS) {
    throw new Error('CGC_TOKEN_ADDRESS not configured');
  }

  // Ensure proper hex format
  const formattedKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
  const account = privateKeyToAccount(formattedKey as `0x${string}`);

  return createWalletClient({
    account,
    chain: base,
    transport: http(BASE_RPC_URL),
  });
}

/**
 * Get public client for reading blockchain state
 */
function getPublicClient() {
  return createPublicClient({
    chain: base,
    transport: http(BASE_RPC_URL),
  });
}

/**
 * Check rate limiting
 */
function checkRateLimit(): boolean {
  const now = Date.now();
  const oneMinuteAgo = now - 60000;

  // Clean old timestamps
  while (transferTimestamps.length > 0 && transferTimestamps[0] < oneMinuteAgo) {
    transferTimestamps.shift();
  }

  return transferTimestamps.length < MAX_TRANSFERS_PER_MINUTE;
}

/**
 * Record a transfer for rate limiting
 */
function recordTransfer() {
  transferTimestamps.push(Date.now());
}

/**
 * Get deployer wallet balance (CGC tokens)
 */
export async function getDeployerCGCBalance(): Promise<{
  balance: string;
  balanceFormatted: string;
  hasEnoughForBonus: boolean;
}> {
  const publicClient = getPublicClient();
  const walletClient = getWalletClient();
  const deployerAddress = walletClient.account.address;

  const balance = await publicClient.readContract({
    address: CGC_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [deployerAddress],
  }) as bigint;

  const balanceFormatted = formatUnits(balance, CGC_DECIMALS);
  const balanceNumber = parseFloat(balanceFormatted);

  // 235 CGC is max per referral signup (200 + 20 + 10 + 5)
  const hasEnoughForBonus = balanceNumber >= 235;

  return {
    balance: balance.toString(),
    balanceFormatted,
    hasEnoughForBonus,
  };
}

/**
 * Get deployer ETH balance (for gas)
 */
export async function getDeployerETHBalance(): Promise<{
  balance: string;
  balanceFormatted: string;
  hasEnoughForGas: boolean;
}> {
  const publicClient = getPublicClient();
  const walletClient = getWalletClient();
  const deployerAddress = walletClient.account.address;

  const balance = await publicClient.getBalance({
    address: deployerAddress,
  });

  const balanceFormatted = formatUnits(balance, 18);
  const balanceNumber = parseFloat(balanceFormatted);

  // ~0.001 ETH should cover 4 transfers
  const hasEnoughForGas = balanceNumber >= 0.001;

  return {
    balance: balance.toString(),
    balanceFormatted,
    hasEnoughForGas,
  };
}

/**
 * Transfer CGC tokens to a recipient
 *
 * @param recipientAddress - The wallet address to send tokens to
 * @param amount - Amount in CGC (not wei)
 * @param reason - Optional reason for logging
 */
export async function transferCGC(
  recipientAddress: string,
  amount: number,
  reason?: string
): Promise<TransferResult> {
  console.log(`[TokenTransfer] Starting transfer: ${amount} CGC to ${recipientAddress} (${reason || 'no reason'})`);

  // Validate inputs
  if (!recipientAddress || !/^0x[a-fA-F0-9]{40}$/.test(recipientAddress)) {
    return { success: false, error: 'Invalid recipient address' };
  }

  if (amount <= 0 || amount > 10000) {
    return { success: false, error: 'Invalid amount (must be 0 < amount <= 10000)' };
  }

  // Check rate limit
  if (!checkRateLimit()) {
    return { success: false, error: 'Rate limit exceeded. Please try again later.' };
  }

  try {
    const walletClient = getWalletClient();
    const publicClient = getPublicClient();

    // Convert amount to wei (18 decimals)
    const amountWei = parseUnits(amount.toString(), CGC_DECIMALS);

    // Check deployer balance first
    const deployerBalance = await publicClient.readContract({
      address: CGC_TOKEN_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [walletClient.account.address],
    }) as bigint;

    if (deployerBalance < amountWei) {
      console.error(`[TokenTransfer] Insufficient CGC balance. Need ${amount}, have ${formatUnits(deployerBalance, CGC_DECIMALS)}`);
      return { success: false, error: 'Insufficient CGC balance in treasury' };
    }

    // Simulate the transaction first
    const { request } = await publicClient.simulateContract({
      address: CGC_TOKEN_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'transfer',
      args: [recipientAddress as Address, amountWei],
      account: walletClient.account,
    });

    // Execute the transfer
    const txHash = await walletClient.writeContract(request);
    console.log(`[TokenTransfer] Transaction submitted: ${txHash}`);

    // Wait for confirmation
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
      confirmations: 1,
    });

    if (receipt.status === 'reverted') {
      console.error(`[TokenTransfer] Transaction reverted: ${txHash}`);
      return { success: false, error: 'Transaction reverted on-chain', txHash };
    }

    // Record successful transfer for rate limiting
    recordTransfer();

    console.log(`[TokenTransfer] SUCCESS: ${amount} CGC sent to ${recipientAddress}. Block: ${receipt.blockNumber}`);

    return {
      success: true,
      txHash,
      gasUsed: receipt.gasUsed.toString(),
      blockNumber: Number(receipt.blockNumber),
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[TokenTransfer] Error: ${errorMessage}`);
    return { success: false, error: errorMessage };
  }
}

/**
 * Batch transfer CGC tokens to multiple recipients
 *
 * Processes transfers sequentially to ensure proper nonce management.
 * Continues even if some transfers fail.
 *
 * @param transfers - Array of { recipient, amount, reason }
 */
export async function batchTransferCGC(
  transfers: { recipient: string; amount: number; reason?: string }[]
): Promise<BatchTransferResult> {
  console.log(`[TokenTransfer] Starting batch transfer of ${transfers.length} transactions`);

  const results: BatchTransferResult['results'] = [];
  let totalTransferred = 0;
  let failedCount = 0;

  // Process sequentially to ensure proper nonce handling
  for (const transfer of transfers) {
    const result = await transferCGC(transfer.recipient, transfer.amount, transfer.reason);

    results.push({
      recipient: transfer.recipient,
      amount: transfer.amount,
      txHash: result.txHash,
      error: result.error,
    });

    if (result.success) {
      totalTransferred += transfer.amount;
    } else {
      failedCount++;
    }

    // Small delay between transfers to avoid nonce issues
    if (transfers.indexOf(transfer) < transfers.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  console.log(`[TokenTransfer] Batch complete: ${totalTransferred} CGC transferred, ${failedCount} failed`);

  return {
    success: failedCount === 0,
    results,
    totalTransferred,
    failedCount,
  };
}

/**
 * Verify a CGC transfer by transaction hash
 */
export async function verifyCGCTransfer(txHash: Hash): Promise<{
  verified: boolean;
  recipient?: string;
  amount?: string;
  blockNumber?: number;
  error?: string;
}> {
  try {
    const publicClient = getPublicClient();

    const receipt = await publicClient.getTransactionReceipt({
      hash: txHash,
    });

    if (receipt.status !== 'success') {
      return { verified: false, error: 'Transaction failed or reverted' };
    }

    // Parse transfer logs to get details
    const tx = await publicClient.getTransaction({
      hash: txHash,
    });

    return {
      verified: true,
      blockNumber: Number(receipt.blockNumber),
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { verified: false, error: errorMessage };
  }
}
