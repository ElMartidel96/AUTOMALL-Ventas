import { Address } from 'viem'

export interface Collaborator {
  id: string
  address: Address
  username?: string
  avatar?: string
  joinedAt: Date
  isActive: boolean
  totalEarned: bigint
  completedTasks: number
  pendingTasks: number
  disputedTasks: number
  successRate: number
  averageRating: number
  complexity: {
    level1: number
    level2: number
    level3: number
    level4: number
    level5: number
    custom: number
  }
}

export interface Task {
  id: string
  taskId: string
  platform: string
  assignee: Address
  complexity: number
  rewardAmount: bigint
  deadline: Date
  status: 'pending' | 'in_progress' | 'submitted' | 'verified' | 'released' | 'disputed' | 'cancelled'
  createdAt: Date
  completedAt?: Date
  verificationHash?: string
  proofHash?: string
  txHash?: string
  batchId?: string
  milestoneId?: string
}

export interface Transaction {
  id: string
  hash: string
  blockNumber: bigint
  timestamp: Date
  from: Address
  to: Address
  value: bigint
  type: 'deposit' | 'release' | 'withdraw' | 'dispute' | 'mint' | 'transfer'
  taskId?: string
  batchId?: string
  milestoneId?: string
  status: 'pending' | 'confirmed' | 'failed'
}

export interface Ranking {
  address: Address
  username?: string
  rank: number
  score: number
  totalEarned: bigint
  completedTasks: number
  successRate: number
  averageRating: number
  badge?: string
  recentActivity: Date
  trend: 'up' | 'down' | 'stable'
  trendChange: number
}

export interface RankingUpdate {
  type: 'TASK_COMPLETED' | 'FUNDS_RELEASED' | 'DISPUTE_RESOLVED' | 'BATCH_CREATED' | 'MINT_OCCURRED'
  collaborator: Address
  data: {
    taskId?: string
    amount?: bigint
    newRank?: number
    oldRank?: number
    txHash: string
  }
  timestamp: Date
}

export interface SystemStats {
  totalDeposited: bigint
  totalReleased: bigint
  totalLocked: bigint
  totalDisputed: bigint
  activeBatches: number
  completedMilestones: number
  activeCollaborators: number
  totalTasks: number
  averageCompletionTime: number
  systemHealth: 'healthy' | 'warning' | 'critical'
  lastUpdate: Date
}

export interface WebSocketMessage {
  type: 'RANKING_UPDATE' | 'TASK_UPDATE' | 'TRANSACTION_UPDATE' | 'SYSTEM_STATS'
  payload: RankingUpdate | Task | Transaction | SystemStats
  timestamp: Date
  id: string
}

export interface BlockchainEvent {
  eventName: string
  contractAddress: Address
  blockNumber: bigint
  transactionHash: string
  logIndex: number
  args: Record<string, any>
  timestamp: Date
}

export interface CacheData<T = any> {
  data: T
  timestamp: Date
  ttl: number
}