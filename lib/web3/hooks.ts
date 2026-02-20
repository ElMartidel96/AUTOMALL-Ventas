/**
 * Web3 React Hooks for CryptoGift DAO
 * Custom hooks to interact with smart contracts using Wagmi v2
 */

import { useState, useEffect } from 'react'
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi'
import { formatUnits, parseUnits, keccak256, toHex, pad } from 'viem'
import {
  CGC_TOKEN_ABI,
  MILESTONE_ESCROW_ABI,
  MASTER_CONTROLLER_ABI,
  TASK_RULES_ABI,
  ARAGON_DAO_ABI
} from './abis'

// Contract addresses (Base Mainnet)
export const contracts = {
  cgcToken: '0x5e3a61b550328f3D8C44f60b3e10a49D3d806175' as `0x${string}`,
  masterController: '0x67D9a01A3F7b5D38694Bb78dD39286Db75D7D869' as `0x${string}`,
  taskRules: '0xdDcfFF04eC6D8148CDdE3dBde42456fB32bcC5bb' as `0x${string}`,
  milestoneEscrow: '0x8346CFcaECc90d678d862319449E5a742c03f109' as `0x${string}`,
  aragonDAO: '0x3244DFBf9E5374DF2f106E89Cf7972E5D4C9ac31' as `0x${string}`,
}

export const targetChainId = 8453 // Base Mainnet

// ===== CGC Token Hooks =====

/**
 * Get total supply of CGC tokens
 */
export function useCGCTotalSupply() {
  const { data, isError, isLoading } = useReadContract({
    address: contracts.cgcToken,
    abi: CGC_TOKEN_ABI,
    functionName: 'totalSupply',
    chainId: targetChainId,
  })

  return {
    totalSupply: data ? formatUnits(data as bigint, 18) : '0',
    totalSupplyRaw: data as bigint | undefined,
    isLoading,
    isError,
  }
}

/**
 * Get CGC token balance for an address
 */
export function useCGCBalance(address?: `0x${string}`) {
  const { data, isError, isLoading, refetch } = useReadContract({
    address: contracts.cgcToken,
    abi: CGC_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: targetChainId,
  })

  return {
    balance: data ? formatUnits(data as bigint, 18) : '0',
    balanceRaw: data as bigint | undefined,
    isLoading,
    isError,
    refetch,
  }
}

/**
 * Get total number of CGC token holders from API
 * Fetches dynamically from BaseScan API, excludes Treasury and Escrow
 */
export function useCGCHolders() {
  const [holders, setHolders] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    async function fetchHolders() {
      try {
        setIsLoading(true)
        const response = await fetch('/api/cgc/stats')
        const data = await response.json()

        if (data.success && data.data?.holdersCount) {
          setHolders(data.data.holdersCount)
        }
        setIsError(false)
      } catch (error) {
        console.error('Error fetching holders:', error)
        setIsError(true)
      } finally {
        setIsLoading(false)
      }
    }

    fetchHolders()
    // Refresh every 5 minutes
    const interval = setInterval(fetchHolders, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  return {
    holders,
    isLoading,
    isError,
  }
}

/**
 * Get token owner address
 */
export function useCGCOwner() {
  const { data, isError, isLoading } = useReadContract({
    address: contracts.cgcToken,
    abi: CGC_TOKEN_ABI,
    functionName: 'owner',
    chainId: targetChainId,
  })

  return {
    owner: data as `0x${string}` | undefined,
    isLoading,
    isError,
  }
}

// ===== MilestoneEscrow Hooks =====

/**
 * Get total funds held in escrow
 */
export function useEscrowBalance() {
  const { data, isError, isLoading } = useReadContract({
    address: contracts.milestoneEscrow,
    abi: MILESTONE_ESCROW_ABI,
    functionName: 'totalFundsHeld',
    chainId: targetChainId,
  })

  return {
    escrowBalance: data ? formatUnits(data as bigint, 18) : '0',
    escrowBalanceRaw: data as bigint | undefined,
    isLoading,
    isError,
  }
}

/**
 * Get total milestones released
 */
export function useMilestonesReleased() {
  const { data, isError, isLoading } = useReadContract({
    address: contracts.milestoneEscrow,
    abi: MILESTONE_ESCROW_ABI,
    functionName: 'totalMilestonesReleased',
    chainId: targetChainId,
  })

  return {
    milestonesReleased: data ? Number(data) : 0,
    isLoading,
    isError,
  }
}

/**
 * Get collaborator earnings
 */
export function useCollaboratorEarnings(address?: `0x${string}`) {
  const { data, isError, isLoading } = useReadContract({
    address: contracts.milestoneEscrow,
    abi: MILESTONE_ESCROW_ABI,
    functionName: 'getCollaboratorEarnings',
    args: address ? [address] : undefined,
    chainId: targetChainId,
  })

  return {
    earnings: data ? formatUnits(data as bigint, 18) : '0',
    earningsRaw: data as bigint | undefined,
    isLoading,
    isError,
  }
}

// ===== Master Controller Hooks =====

/**
 * Get system status and limits
 */
export function useSystemStatus() {
  const { data: isActive, isLoading: isLoadingActive } = useReadContract({
    address: contracts.masterController,
    abi: MASTER_CONTROLLER_ABI,
    functionName: 'isActive',
    chainId: targetChainId,
  })

  const { data: dailyLimit } = useReadContract({
    address: contracts.masterController,
    abi: MASTER_CONTROLLER_ABI,
    functionName: 'getDailyLimit',
    chainId: targetChainId,
  })

  const { data: weeklyLimit } = useReadContract({
    address: contracts.masterController,
    abi: MASTER_CONTROLLER_ABI,
    functionName: 'getWeeklyLimit',
    chainId: targetChainId,
  })

  const { data: monthlyLimit } = useReadContract({
    address: contracts.masterController,
    abi: MASTER_CONTROLLER_ABI,
    functionName: 'getMonthlyLimit',
    chainId: targetChainId,
  })

  const { data: dailyUsage } = useReadContract({
    address: contracts.masterController,
    abi: MASTER_CONTROLLER_ABI,
    functionName: 'getCurrentDailyUsage',
    chainId: targetChainId,
  })

  const { data: weeklyUsage } = useReadContract({
    address: contracts.masterController,
    abi: MASTER_CONTROLLER_ABI,
    functionName: 'getCurrentWeeklyUsage',
    chainId: targetChainId,
  })

  const { data: monthlyUsage } = useReadContract({
    address: contracts.masterController,
    abi: MASTER_CONTROLLER_ABI,
    functionName: 'getCurrentMonthlyUsage',
    chainId: targetChainId,
  })

  return {
    isActive: isActive as boolean | undefined,
    limits: {
      daily: dailyLimit ? formatUnits(dailyLimit as bigint, 18) : '0',
      weekly: weeklyLimit ? formatUnits(weeklyLimit as bigint, 18) : '0',
      monthly: monthlyLimit ? formatUnits(monthlyLimit as bigint, 18) : '0',
    },
    usage: {
      daily: dailyUsage ? formatUnits(dailyUsage as bigint, 18) : '0',
      weekly: weeklyUsage ? formatUnits(weeklyUsage as bigint, 18) : '0',
      monthly: monthlyUsage ? formatUnits(monthlyUsage as bigint, 18) : '0',
    },
    isLoading: isLoadingActive,
  }
}

// ===== Task Rules Hooks =====

/**
 * Get task statistics
 */
export function useTaskStats() {
  const { data: createdCount } = useReadContract({
    address: contracts.taskRules,
    abi: TASK_RULES_ABI,
    functionName: 'totalTasksCreated',
    chainId: targetChainId,
  })

  const { data: completedCount } = useReadContract({
    address: contracts.taskRules,
    abi: TASK_RULES_ABI,
    functionName: 'totalTasksCompleted',
    chainId: targetChainId,
  })

  return {
    activeTasks: createdCount && completedCount ? Number(createdCount) - Number(completedCount) : 0,
    completedTasks: completedCount ? Number(completedCount) : 0,
    totalTasks: createdCount ? Number(createdCount) : 0,
  }
}

// ===== Aragon DAO Hooks =====

/**
 * Get proposal count from Aragon DAO
 */
export function useAragonProposals() {
  const { data, isError, isLoading } = useReadContract({
    address: contracts.aragonDAO,
    abi: ARAGON_DAO_ABI,
    functionName: 'proposalCount',
    chainId: targetChainId,
  })

  return {
    proposalCount: data ? Number(data) : 0,
    isLoading,
    isError,
  }
}

// ===== Write Hooks (Transactions) =====

/**
 * Transfer CGC tokens
 */
export function useCGCTransfer() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  
  const transfer = async (to: `0x${string}`, amount: string) => {
    const amountWei = parseUnits(amount, 18)
    return writeContract({
      address: contracts.cgcToken,
      abi: CGC_TOKEN_ABI,
      functionName: 'transfer',
      args: [to, amountWei],
      chainId: targetChainId,
    })
  }

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  return {
    transfer,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
  }
}

/**
 * Release milestone payment
 */
export function useMilestoneRelease() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  
  const releaseMilestone = async (
    recipient: `0x${string}`,
    amount: string,
    milestoneId: `0x${string}`
  ) => {
    const amountWei = parseUnits(amount, 18)
    return writeContract({
      address: contracts.milestoneEscrow,
      abi: MILESTONE_ESCROW_ABI,
      functionName: 'releaseMilestonePayment',
      args: [recipient, amountWei, milestoneId],
      chainId: targetChainId,
    })
  }

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  return {
    releaseMilestone,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
  }
}

/**
 * Create task on blockchain
 */
export function useTaskCreate() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  
  const createTask = async (
    taskId: string,
    platform: string,
    assignee: `0x${string}`,
    complexity: number,
    customReward: string,
    deadline: number,
    verificationHash: string
  ) => {
    // Convert taskId string to bytes32 using keccak256 hash
    const taskIdBytes32 = keccak256(toHex(taskId))
    // Convert verificationHash to bytes32 similarly
    const verificationBytes32 = keccak256(toHex(verificationHash))
    const customRewardWei = parseUnits(customReward, 18)
    
    return writeContract({
      address: contracts.taskRules,
      abi: TASK_RULES_ABI,
      functionName: 'createTask',
      args: [
        taskIdBytes32,
        platform,
        assignee,
        complexity,
        customRewardWei,
        BigInt(deadline),
        verificationBytes32
      ],
      chainId: targetChainId,
    })
  }

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  return {
    createTask,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
  }
}

/**
 * Submit task completion
 */
export function useTaskCompletion() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  
  const submitCompletion = async (
    taskId: string,
    proofHash: string
  ) => {
    // Convert taskId string to bytes32 using keccak256 hash
    const taskIdBytes32 = keccak256(toHex(taskId))
    // proofHash is already a hex hash from SHA-256, just ensure it's bytes32
    const proofBytes32 = `0x${proofHash.padStart(64, '0')}` as `0x${string}`
    
    return writeContract({
      address: contracts.taskRules,
      abi: TASK_RULES_ABI,
      functionName: 'submitCompletion',
      args: [taskIdBytes32, proofBytes32],
      chainId: targetChainId,
    })
  }

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  return {
    submitCompletion,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
  }
}

/**
 * Get blockchain task details
 */
export function useBlockchainTask(taskId?: string) {
  // Convert taskId string to bytes32 using keccak256 hash
  const taskIdBytes32 = taskId ? keccak256(toHex(taskId)) : undefined

  const { data: taskExists } = useReadContract({
    address: contracts.taskRules,
    abi: TASK_RULES_ABI,
    functionName: 'taskExists',
    args: taskIdBytes32 ? [taskIdBytes32] : undefined,
    chainId: targetChainId,
  })

  // Only query task data if taskId exists and task is confirmed to exist
  const shouldFetchTask = !!taskIdBytes32 && !!taskExists
  
  const { data: taskData, isLoading, isError, refetch } = useReadContract({
    address: contracts.taskRules,
    abi: TASK_RULES_ABI,
    functionName: 'getTask',
    args: shouldFetchTask ? [taskIdBytes32] : undefined,
    chainId: targetChainId,
  })

  return {
    task: taskData,
    exists: !!taskExists,
    isLoading,
    isError,
    refetch,
  }
}

/**
 * Validate task completion on blockchain
 */
export function useTaskValidation() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  
  const validateCompletion = async (
    taskId: string,
    approved: boolean
  ) => {
    // Convert taskId string to bytes32 using keccak256 hash
    const taskIdBytes32 = keccak256(toHex(taskId))
    
    return writeContract({
      address: contracts.taskRules,
      abi: TASK_RULES_ABI,
      functionName: 'validateCompletion',
      args: [taskIdBytes32, approved],
      chainId: targetChainId,
    })
  }

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  return {
    validateCompletion,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
  }
}

// ===== Utility Hooks =====

/**
 * Dashboard database stats interface (from Supabase)
 */
interface DashboardDBStats {
  proposalsActive: number;
  proposalsPending: number;
  proposalsApproved: number;
  proposalsRejected: number;
  proposalsTotal: number;
  tasksCompleted: number;
  tasksActive: number;
  tasksAvailable: number;
  tasksSubmitted: number;
  tasksTotal: number;
  totalCGCDistributed: number;
  activeCollaborators: number;
  totalCollaborators: number;
}

/**
 * Get dashboard stats from Supabase database
 * This fetches real data from task_proposals and tasks tables
 */
export function useDashboardDBStats() {
  const [stats, setStats] = useState<DashboardDBStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    async function fetchStats() {
      try {
        setIsLoading(true)
        const response = await fetch('/api/dashboard/stats')
        const data = await response.json()

        if (data.success && data.data) {
          setStats(data.data)
        }
        setIsError(false)
      } catch (error) {
        console.error('Error fetching dashboard DB stats:', error)
        setIsError(true)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30 * 1000)
    return () => clearInterval(interval)
  }, [])

  return {
    stats,
    isLoading,
    isError,
  }
}

/**
 * Get all dashboard stats in one hook
 * Combines blockchain data (token stats) with Supabase data (tasks/proposals)
 */
export function useDashboardStats() {
  const { address } = useAccount()

  // Blockchain data (token stats)
  const { totalSupply } = useCGCTotalSupply()
  const { holders } = useCGCHolders() // Dynamic from BaseScan API
  const { balance: treasuryBalance } = useCGCBalance(contracts.aragonDAO)
  // Use CGC balance of escrow contract (real token balance)
  const { balance: escrowCGCBalance } = useCGCBalance(contracts.milestoneEscrow)
  const { milestonesReleased } = useMilestonesReleased()
  const { balance: userBalance } = useCGCBalance(address)
  const { earnings } = useCollaboratorEarnings(address)
  const { isActive, limits, usage } = useSystemStatus()

  // Database data (tasks/proposals from Supabase)
  const { stats: dbStats, isLoading: dbLoading } = useDashboardDBStats()

  // Calculate circulating supply (total - treasury - escrow)
  const treasuryNum = parseFloat(treasuryBalance || '0')
  const escrowNum = parseFloat(escrowCGCBalance || '0')
  const totalNum = parseFloat(totalSupply || '0')
  const circulatingSupply = Math.max(0, totalNum - treasuryNum - escrowNum)

  return {
    // Token/Blockchain stats
    totalSupply,
    circulatingSupply: circulatingSupply.toFixed(2),
    treasuryBalance,
    escrowBalance: escrowCGCBalance,
    holdersCount: holders, // Dynamic from API

    // Proposals from Supabase (real data)
    proposalsActive: dbStats?.proposalsActive ?? 0,
    proposalsPending: dbStats?.proposalsPending ?? 0,
    proposalsApproved: dbStats?.proposalsApproved ?? 0,
    proposalsTotal: dbStats?.proposalsTotal ?? 0,

    // Tasks from Supabase (real data)
    questsCompleted: dbStats?.tasksCompleted ?? 0,
    activeTasks: dbStats?.tasksActive ?? 0,
    tasksAvailable: dbStats?.tasksAvailable ?? 0,
    tasksSubmitted: dbStats?.tasksSubmitted ?? 0,
    totalTasks: dbStats?.tasksTotal ?? 0,

    // CGC distributed from completed tasks
    totalCGCDistributed: dbStats?.totalCGCDistributed ?? 0,

    // Collaborators
    activeCollaborators: dbStats?.activeCollaborators ?? 0,
    totalCollaborators: dbStats?.totalCollaborators ?? 0,

    // Milestones (from blockchain)
    milestonesReleased,

    // User specific
    userBalance,
    userEarnings: earnings,

    // System status
    systemActive: isActive,
    systemLimits: limits,
    systemUsage: usage,

    // Loading state
    isDBLoading: dbLoading,
  }
}