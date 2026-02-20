/**
 * 🔗 TaskRulesEIP712 Contract Integration
 * 
 * Handles interaction with the deployed TaskRulesEIP712 smart contract
 * Validates task operations and manages on-chain state
 */

import { ethers } from 'ethers'
import type { Database } from '@/lib/supabase/types'
import { TaskStatus } from './types'

// Re-export TaskStatus for backward compatibility
export { TaskStatus }

type Task = Database['public']['Tables']['tasks']['Row']

// Contract ABI for TaskRulesEIP712
const TASK_RULES_ABI = [
  // Task management functions
  'function createTask(bytes32 taskId, uint256 rewardAmount, uint8 complexity, string memory title) external',
  'function claimTask(bytes32 taskId, address claimant, bytes calldata signature) external',
  'function validateSubmission(bytes32 taskId, string memory evidenceUrl, bytes calldata signature) external returns (bool)',
  'function completeTask(bytes32 taskId) external',
  
  // View functions
  'function getTask(bytes32 taskId) external view returns (tuple(bytes32 id, uint256 reward, uint8 complexity, string title, address assignee, uint8 status))',
  'function isTaskClaimable(bytes32 taskId) external view returns (bool)',
  'function getTaskAssignee(bytes32 taskId) external view returns (address)',
  'function getTaskStatus(bytes32 taskId) external view returns (uint8)',
  
  // Events
  'event TaskCreated(bytes32 indexed taskId, uint256 rewardAmount, uint8 complexity)',
  'event TaskClaimed(bytes32 indexed taskId, address indexed claimant)',
  'event TaskSubmitted(bytes32 indexed taskId, address indexed assignee, string evidenceUrl)',
  'event TaskCompleted(bytes32 indexed taskId, address indexed assignee, uint256 rewardAmount)',
  
  // EIP-712 related
  'function DOMAIN_SEPARATOR() external view returns (bytes32)',
  'function nonces(address) external view returns (uint256)',
]

// Contract configuration
const CONTRACT_ADDRESS = process.env.TASK_RULES_ADDRESS || '0xdDcfFF04eC6D8148CDdE3dBde42456fB32bcC5bb'

// Robust RPC configuration with multiple fallbacks
const RPC_ENDPOINTS = [
  process.env.BASE_RPC_URL,
  process.env.NEXT_PUBLIC_RPC_URL, 
  process.env.RPC_URL,
  process.env.ALCHEMY_BASE_RPC,
  // Primary endpoints - most reliable
  'https://mainnet.base.org',
  'https://base-rpc.publicnode.com',
  'https://base.llamarpc.com',
  // Secondary endpoints - additional backup
  'https://base-mainnet.public.blastapi.io',
  'https://base.blockpi.network/v1/rpc/public',
  'https://base.drpc.org',
  'https://base-mainnet.diamondswap.org/rpc',
  // Coinbase official endpoints
  'https://developer-access-mainnetbeta.base.org',
].filter(Boolean) as string[]

// Get the first available RPC URL
const RPC_URL = RPC_ENDPOINTS[0]

// Debug logging for production troubleshooting
if (typeof window === 'undefined') {
  console.log('🔧 TaskRules RPC Configuration:')
  console.log(`  Available endpoints: ${RPC_ENDPOINTS.length}`)
  console.log(`  Selected RPC: ${RPC_URL}`)
  console.log(`  All endpoints: ${JSON.stringify(RPC_ENDPOINTS)}`)
  console.log(`  Environment variables:`)
  console.log(`    BASE_RPC_URL: ${process.env.BASE_RPC_URL ? '✅ Set' : '❌ Missing'}`)
  console.log(`    NEXT_PUBLIC_RPC_URL: ${process.env.NEXT_PUBLIC_RPC_URL ? '✅ Set' : '❌ Missing'}`)
  console.log(`    RPC_URL: ${process.env.RPC_URL ? '✅ Set' : '❌ Missing'}`)
  console.log(`    ALCHEMY_BASE_RPC: ${process.env.ALCHEMY_BASE_RPC ? '✅ Set' : '❌ Missing'}`)
  console.log(`  NODE_ENV: ${process.env.NODE_ENV}`)
  console.log(`  VERCEL: ${process.env.VERCEL}`)
}


export class TaskRulesContract {
  private contract: ethers.Contract
  private provider: ethers.providers.JsonRpcProvider
  private signer?: ethers.Signer
  private currentRpcUrl: string

  constructor(privateKey?: string) {
    this.currentRpcUrl = RPC_URL
    this.provider = this.createRobustProvider()
    this.contract = new ethers.Contract(CONTRACT_ADDRESS, TASK_RULES_ABI, this.provider)
    
    if (privateKey) {
      this.signer = new ethers.Wallet(privateKey, this.provider)
      this.contract = this.contract.connect(this.signer)
    }
  }

  /**
   * Create a robust provider with connection testing and fallbacks
   */
  private createRobustProvider(): ethers.providers.JsonRpcProvider {
    console.log(`🌐 Creating provider with URL: ${this.currentRpcUrl}`)
    
    // Create provider with timeout configuration in constructor
    const provider = new ethers.providers.JsonRpcProvider({
      url: this.currentRpcUrl,
      timeout: 15000 // 15 second timeout configured at creation
    }, {
      name: 'base',
      chainId: 8453,
      ensAddress: undefined
    })

    // Optimize timeouts for serverless environment
    provider.pollingInterval = 8000 // 8 seconds - faster for serverless
    
    // Log provider creation success
    console.log('✅ Provider created successfully with serverless optimizations and 15s timeout')
    
    return provider
  }

  /**
   * Test connection and fallback to alternative RPC if needed
   * Optimized for serverless environments with timeouts
   */
  private async testAndFallbackProvider(): Promise<void> {
    console.log(`🔄 Testing ${RPC_ENDPOINTS.length} RPC endpoints for failover...`)
    
    // Test all endpoints in parallel with timeout
    const testPromises = RPC_ENDPOINTS.map(async (rpcUrl, index) => {
      try {
        console.log(`🔗 Testing RPC ${index + 1}/${RPC_ENDPOINTS.length}: ${rpcUrl}`)
        
        const testProvider = new ethers.providers.JsonRpcProvider({
          url: rpcUrl,
          timeout: 8000 // 8 second timeout for connection tests
        }, {
          name: 'base',
          chainId: 8453,
          ensAddress: undefined
        })
        
        // Set aggressive polling interval for serverless
        testProvider.pollingInterval = 4000 // 4 seconds
        
        // Use Promise.race with timeout for faster failing
        const networkPromise = testProvider.getNetwork()
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Connection timeout')), 8000) // 8 second timeout
        })
        
        const network = await Promise.race([networkPromise, timeoutPromise])
        
        if (network.chainId === 8453) {
          console.log(`✅ RPC ${index + 1} connection successful: ${rpcUrl}`)
          return { rpcUrl, provider: testProvider, success: true, index }
        }
        
        throw new Error(`Wrong network: ${network.chainId}`)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        console.warn(`⚠️ RPC ${index + 1} failed: ${rpcUrl} - ${errorMessage}`)
        return { rpcUrl, provider: null, success: false, error: errorMessage, index }
      }
    })
    
    // Wait for first successful connection or all to fail
    const results = await Promise.allSettled(testPromises)
    
    // Find first successful connection
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value.success) {
        const successfulConnection = result.value
        console.log(`🎯 Using RPC endpoint ${successfulConnection.index + 1}: ${successfulConnection.rpcUrl}`)
        
        // Update provider if different from current
        if (successfulConnection.rpcUrl !== this.currentRpcUrl) {
          this.currentRpcUrl = successfulConnection.rpcUrl
          this.provider = successfulConnection.provider!
          this.contract = new ethers.Contract(CONTRACT_ADDRESS, TASK_RULES_ABI, this.provider)
          
          if (this.signer) {
            this.signer = new ethers.Wallet((this.signer as ethers.Wallet).privateKey, this.provider)
            this.contract = this.contract.connect(this.signer)
          }
        }
        return
      }
    }
    
    // All endpoints failed
    console.error('💥 ALL RPC endpoints failed. Results:', 
      results.map(r => r.status === 'fulfilled' ? r.value : r.reason)
    )
    throw new Error('All RPC endpoints failed. Please check network connectivity and try again.')
  }

  /**
   * Retry a contract call with fallback providers on network errors
   */
  private async retryWithFallback<T>(
    operation: () => Promise<T>,
    errorContext: string
  ): Promise<T> {
    try {
      return await operation()
    } catch (error) {
      console.error(`${errorContext}:`, error)
      
      // Type guard for error handling
      const isError = error instanceof Error
      const errorMessage = isError ? error.message : String(error)
      const errorCode = (error as any)?.code
      
      // If network error, try fallback providers
      if (errorMessage?.includes('could not detect network') || errorCode === 'NETWORK_ERROR') {
        console.log('🔄 Network error detected, attempting fallback providers...')
        try {
          await this.testAndFallbackProvider()
          // Retry with fallback provider
          return await operation()
        } catch (fallbackError) {
          console.error('Fallback provider also failed:', fallbackError)
          throw fallbackError
        }
      }
      
      throw error
    }
  }

  /**
   * Create a task on-chain
   */
  async createTask(task: Task): Promise<string | null> {
    if (!this.signer) {
      throw new Error('Signer required for creating tasks')
    }

    try {
      const taskId = ethers.utils.id(task.task_id)
      const rewardWei = ethers.utils.parseEther(task.reward_cgc.toString())
      
      const tx = await this.contract.createTask(
        taskId,
        rewardWei,
        task.complexity,
        task.title
      )
      
      console.log('Task creation transaction:', tx.hash)
      await tx.wait()
      
      return tx.hash
    } catch (error) {
      console.error('Error creating task on-chain:', error)
      return null
    }
  }

  /**
   * Claim a task with EIP-712 signature
   */
  async claimTask(taskId: string, claimantAddress: string, signature: string): Promise<string | null> {
    if (!this.signer) {
      throw new Error('Signer required for claiming tasks')
    }

    try {
      return await this.retryWithFallback(async () => {
        const taskIdBytes32 = ethers.utils.id(taskId)
        
        const tx = await this.contract.claimTask(
          taskIdBytes32,
          claimantAddress,
          signature
        )
        
        console.log('Task claim transaction:', tx.hash)
        await tx.wait()
        
        return tx.hash
      }, 'Error claiming task on-chain')
    } catch (error) {
      console.error('Final error claiming task on-chain:', error)
      return null
    }
  }

  /**
   * Validate task submission with evidence
   */
  async validateSubmission(
    taskId: string, 
    evidenceUrl: string, 
    signature: string
  ): Promise<{ isValid: boolean; txHash?: string }> {
    if (!this.signer) {
      throw new Error('Signer required for validating submissions')
    }

    try {
      const taskIdBytes32 = ethers.utils.id(taskId)
      
      const tx = await this.contract.validateSubmission(
        taskIdBytes32,
        evidenceUrl,
        signature
      )
      
      console.log('Submission validation transaction:', tx.hash)
      const receipt = await tx.wait()
      
      // Check if validation was successful
      const isValid = receipt.status === 1
      
      return { isValid, txHash: tx.hash }
    } catch (error) {
      console.error('Error validating submission on-chain:', error)
      return { isValid: false }
    }
  }

  /**
   * Complete a task (admin function)
   */
  async completeTask(taskId: string): Promise<string | null> {
    if (!this.signer) {
      throw new Error('Signer required for completing tasks')
    }

    try {
      const taskIdBytes32 = ethers.utils.id(taskId)
      
      const tx = await this.contract.completeTask(taskIdBytes32)
      
      console.log('Task completion transaction:', tx.hash)
      await tx.wait()
      
      return tx.hash
    } catch (error) {
      console.error('Error completing task on-chain:', error)
      return null
    }
  }

  /**
   * Get task information from contract
   */
  async getTask(taskId: string): Promise<any | null> {
    try {
      return await this.retryWithFallback(async () => {
        const taskIdBytes32 = ethers.utils.id(taskId)
        const taskData = await this.contract.getTask(taskIdBytes32)
        
        return {
          id: taskData.id,
          reward: ethers.utils.formatEther(taskData.reward),
          complexity: taskData.complexity,
          title: taskData.title,
          assignee: taskData.assignee,
          status: taskData.status
        }
      }, 'Error fetching task from contract')
    } catch (error) {
      console.error('Final error fetching task from contract:', error)
      return null
    }
  }

  /**
   * Check if task is claimable
   */
  async isTaskClaimable(taskId: string): Promise<boolean> {
    try {
      return await this.retryWithFallback(async () => {
        const taskIdBytes32 = ethers.utils.id(taskId)
        return await this.contract.isTaskClaimable(taskIdBytes32)
      }, 'Error checking task claimability')
    } catch (error) {
      console.error('Final error checking task claimability:', error)
      return false
    }
  }

  /**
   * Get task assignee
   */
  async getTaskAssignee(taskId: string): Promise<string | null> {
    try {
      const taskIdBytes32 = ethers.utils.id(taskId)
      const assignee = await this.contract.getTaskAssignee(taskIdBytes32)
      return assignee === ethers.constants.AddressZero ? null : assignee
    } catch (error) {
      console.error('Error fetching task assignee:', error)
      return null
    }
  }

  /**
   * Get task status
   */
  async getTaskStatus(taskId: string): Promise<TaskStatus> {
    try {
      const taskIdBytes32 = ethers.utils.id(taskId)
      const status = await this.contract.getTaskStatus(taskIdBytes32)
      return status
    } catch (error) {
      console.error('Error fetching task status:', error)
      return TaskStatus.Available
    }
  }

  /**
   * Generate EIP-712 signature for task claiming
   */
  async generateClaimSignature(
    taskId: string,
    claimantAddress: string,
    deadline: number
  ): Promise<string> {
    if (!this.signer) {
      throw new Error('Signer required for generating signatures')
    }

    try {
      const domain = {
        name: 'TaskRulesEIP712',
        version: '1',
        chainId: 8453, // Base mainnet
        verifyingContract: CONTRACT_ADDRESS
      }

      const types = {
        ClaimTask: [
          { name: 'taskId', type: 'bytes32' },
          { name: 'claimant', type: 'address' },
          { name: 'deadline', type: 'uint256' },
          { name: 'nonce', type: 'uint256' }
        ]
      }

      const nonce = await this.contract.nonces(claimantAddress)
      const taskIdBytes32 = ethers.utils.id(taskId)

      const value = {
        taskId: taskIdBytes32,
        claimant: claimantAddress,
        deadline: deadline,
        nonce: nonce
      }

      return await (this.signer as any)._signTypedData(domain, types, value)
    } catch (error) {
      console.error('Error generating claim signature:', error)
      throw error
    }
  }

  /**
   * Generate EIP-712 signature for submission validation
   */
  async generateSubmissionSignature(
    taskId: string,
    assigneeAddress: string,
    evidenceUrl: string,
    deadline: number
  ): Promise<string> {
    if (!this.signer) {
      throw new Error('Signer required for generating signatures')
    }

    try {
      const domain = {
        name: 'TaskRulesEIP712',
        version: '1',
        chainId: 8453, // Base mainnet
        verifyingContract: CONTRACT_ADDRESS
      }

      const types = {
        ValidateSubmission: [
          { name: 'taskId', type: 'bytes32' },
          { name: 'assignee', type: 'address' },
          { name: 'evidenceUrl', type: 'string' },
          { name: 'deadline', type: 'uint256' },
          { name: 'nonce', type: 'uint256' }
        ]
      }

      const nonce = await this.contract.nonces(assigneeAddress)
      const taskIdBytes32 = ethers.utils.id(taskId)

      const value = {
        taskId: taskIdBytes32,
        assignee: assigneeAddress,
        evidenceUrl: evidenceUrl,
        deadline: deadline,
        nonce: nonce
      }

      return await (this.signer as any)._signTypedData(domain, types, value)
    } catch (error) {
      console.error('Error generating submission signature:', error)
      throw error
    }
  }

  /**
   * Listen for contract events
   */
  setupEventListeners() {
    // Task Created
    this.contract.on('TaskCreated', (taskId, rewardAmount, complexity) => {
      console.log('Task created on-chain:', {
        taskId: taskId,
        reward: ethers.utils.formatEther(rewardAmount),
        complexity: complexity
      })
    })

    // Task Claimed
    this.contract.on('TaskClaimed', (taskId, claimant) => {
      console.log('Task claimed on-chain:', {
        taskId: taskId,
        claimant: claimant
      })
    })

    // Task Submitted
    this.contract.on('TaskSubmitted', (taskId, assignee, evidenceUrl) => {
      console.log('Task submitted on-chain:', {
        taskId: taskId,
        assignee: assignee,
        evidenceUrl: evidenceUrl
      })
    })

    // Task Completed
    this.contract.on('TaskCompleted', (taskId, assignee, rewardAmount) => {
      console.log('Task completed on-chain:', {
        taskId: taskId,
        assignee: assignee,
        reward: ethers.utils.formatEther(rewardAmount)
      })
    })
  }

  /**
   * Get contract address
   */
  getContractAddress(): string {
    return CONTRACT_ADDRESS
  }

  /**
   * Get domain separator
   */
  async getDomainSeparator(): Promise<string> {
    try {
      return await this.contract.DOMAIN_SEPARATOR()
    } catch (error) {
      console.error('Error fetching domain separator:', error)
      throw error
    }
  }
}

// Singleton instance for the app
let taskRulesInstance: TaskRulesContract | null = null

export function getTaskRulesContract(privateKey?: string): TaskRulesContract {
  if (!taskRulesInstance) {
    const key = privateKey || process.env.PRIVATE_KEY_DAO_DEPLOYER
    taskRulesInstance = new TaskRulesContract(key)
  }
  return taskRulesInstance
}

// Helper functions
export function taskIdToBytes32(taskId: string): string {
  return ethers.utils.id(taskId)
}

export function formatTaskReward(rewardWei: string): string {
  return ethers.utils.formatEther(rewardWei)
}

export function parseTaskReward(rewardCGC: string): string {
  return ethers.utils.parseEther(rewardCGC).toString()
}