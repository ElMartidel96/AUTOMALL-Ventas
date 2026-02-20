/**
 * Zod validation schemas for WebSocket data
 * Ensures only validated data is broadcasted to clients
 */

import { z } from 'zod';

// Base address schema with proper hex validation
const AddressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address');

// BigInt schema that handles string conversion
const BigIntSchema = z.union([
  z.bigint(),
  z.string().regex(/^\d+$/).transform(s => BigInt(s)),
  z.number().transform(n => BigInt(n))
]);

// Task status enum
const TaskStatusSchema = z.enum([
  'pending', 'in_progress', 'submitted', 'verified', 
  'released', 'disputed', 'cancelled'
]);

// Transaction type enum
const TransactionTypeSchema = z.enum([
  'deposit', 'release', 'withdraw', 'dispute', 'mint', 'transfer'
]);

// Transaction status enum
const TransactionStatusSchema = z.enum(['pending', 'confirmed', 'failed']);

// System health enum
const SystemHealthSchema = z.enum(['healthy', 'warning', 'critical']);

// Trend enum
const TrendSchema = z.enum(['up', 'down', 'stable']);

// WebSocket message type enum
const WebSocketMessageTypeSchema = z.enum([
  'RANKING_UPDATE', 'TASK_UPDATE', 'TRANSACTION_UPDATE', 'SYSTEM_STATS',
  'MILESTONE_UPDATE', 'TOKEN_UPDATE'
]);

// Ranking update type enum
const RankingUpdateTypeSchema = z.enum([
  'TASK_COMPLETED', 'FUNDS_RELEASED', 'DISPUTE_RESOLVED', 
  'BATCH_CREATED', 'MINT_OCCURRED'
]);

// Collaborator validation schema
export const CollaboratorSchema = z.object({
  id: z.string().min(1),
  address: AddressSchema,
  username: z.string().optional(),
  avatar: z.string().url().optional(),
  joinedAt: z.date(),
  isActive: z.boolean(),
  totalEarned: BigIntSchema,
  completedTasks: z.number().int().min(0),
  pendingTasks: z.number().int().min(0),
  disputedTasks: z.number().int().min(0),
  successRate: z.number().min(0).max(100),
  averageRating: z.number().min(0).max(5),
  complexity: z.object({
    level1: z.number().int().min(0),
    level2: z.number().int().min(0),
    level3: z.number().int().min(0),
    level4: z.number().int().min(0),
    level5: z.number().int().min(0),
    custom: z.number().int().min(0)
  })
});

// Task validation schema
export const TaskSchema = z.object({
  id: z.string().min(1),
  taskId: z.string().min(1),
  platform: z.string().min(1),
  assignee: AddressSchema,
  complexity: z.number().int().min(1).max(5),
  rewardAmount: BigIntSchema,
  deadline: z.date(),
  status: TaskStatusSchema,
  createdAt: z.date(),
  completedAt: z.date().optional(),
  verificationHash: z.string().optional(),
  proofHash: z.string().optional(),
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/).optional(),
  batchId: z.string().optional(),
  milestoneId: z.string().optional()
});

// Transaction validation schema
export const TransactionSchema = z.object({
  id: z.string().min(1),
  hash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid transaction hash'),
  blockNumber: BigIntSchema,
  timestamp: z.date(),
  from: AddressSchema,
  to: AddressSchema,
  value: BigIntSchema,
  type: TransactionTypeSchema,
  taskId: z.string().optional(),
  batchId: z.string().optional(),
  milestoneId: z.string().optional(),
  status: TransactionStatusSchema
});

// Ranking validation schema
export const RankingSchema = z.object({
  address: AddressSchema,
  username: z.string().optional(),
  rank: z.number().int().min(1),
  score: z.number().min(0),
  totalEarned: BigIntSchema,
  completedTasks: z.number().int().min(0),
  successRate: z.number().min(0).max(100),
  averageRating: z.number().min(0).max(5),
  badge: z.string().optional(),
  recentActivity: z.date(),
  trend: TrendSchema,
  trendChange: z.number()
});

// Ranking update validation schema
export const RankingUpdateSchema = z.object({
  type: RankingUpdateTypeSchema,
  collaborator: AddressSchema,
  data: z.object({
    taskId: z.string().optional(),
    amount: BigIntSchema.optional(),
    newRank: z.number().int().min(1).optional(),
    oldRank: z.number().int().min(1).optional(),
    txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/)
  }),
  timestamp: z.date()
});

// System stats validation schema
export const SystemStatsSchema = z.object({
  totalDeposited: BigIntSchema,
  totalReleased: BigIntSchema,
  totalLocked: BigIntSchema,
  totalDisputed: BigIntSchema,
  activeBatches: z.number().int().min(0),
  completedMilestones: z.number().int().min(0),
  activeCollaborators: z.number().int().min(0),
  totalTasks: z.number().int().min(0),
  averageCompletionTime: z.number().min(0),
  systemHealth: SystemHealthSchema,
  lastUpdate: z.date()
});

// WebSocket message validation schema
export const WebSocketMessageSchema = z.object({
  type: WebSocketMessageTypeSchema,
  payload: z.union([
    RankingUpdateSchema,
    TaskSchema,
    TransactionSchema,
    SystemStatsSchema
  ]),
  timestamp: z.date(),
  id: z.string().min(1)
});

// Utility function to validate and sanitize broadcast data
export function validateBroadcastData(type: string, data: unknown) {
  switch (type) {
    case 'RANKING_UPDATE':
      return RankingUpdateSchema.parse(data);
    case 'TASK_UPDATE':
      return TaskSchema.parse(data);
    case 'TRANSACTION_UPDATE':
      return TransactionSchema.parse(data);
    case 'SYSTEM_STATS':
      return SystemStatsSchema.parse(data);
    default:
      throw new Error(`Unknown broadcast type: ${type}`);
  }
}

// Array validation schemas
export const RankingsArraySchema = z.array(RankingSchema);
export const TasksArraySchema = z.array(TaskSchema);
export const TransactionsArraySchema = z.array(TransactionSchema);
export const CollaboratorsArraySchema = z.array(CollaboratorSchema);