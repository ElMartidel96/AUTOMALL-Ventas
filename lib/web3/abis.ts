/**
 * Contract ABIs for CryptoGift DAO
 * Minimal ABIs with only the functions we need for the dashboard
 */

// CGC Token ABI - ERC20 + some custom functions
export const CGC_TOKEN_ABI = [
  // Read functions
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'name',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalHolders',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  // Write functions
  {
    inputs: [
      { internalType: 'address', name: 'recipient', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'spender', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'from', type: 'address' },
      { indexed: true, internalType: 'address', name: 'to', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'value', type: 'uint256' },
    ],
    name: 'Transfer',
    type: 'event',
  },
] as const

// MilestoneEscrow ABI - For token custody and release
export const MILESTONE_ESCROW_ABI = [
  {
    inputs: [],
    name: 'cgcToken',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalFundsHeld',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalMilestonesReleased',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'collaborator', type: 'address' }],
    name: 'getCollaboratorEarnings',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'recipient', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
      { internalType: 'string', name: 'milestoneId', type: 'string' },
    ],
    name: 'releaseMilestonePayment',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const

// MasterController ABI - For authorization and rate limiting
export const MASTER_CONTROLLER_ABI = [
  {
    inputs: [],
    name: 'isActive',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getDailyLimit',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getWeeklyLimit',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getMonthlyLimit',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getCurrentDailyUsage',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getCurrentWeeklyUsage',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getCurrentMonthlyUsage',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

// TaskRules ABI - For task validation and management
export const TASK_RULES_ABI = [
  // Read functions
  {
    inputs: [{ internalType: 'uint8', name: 'complexity', type: 'uint8' }],
    name: 'calculateReward',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalTasksCreated',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalTasksCompleted',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes32', name: 'taskId', type: 'bytes32' }],
    name: 'getTask',
    outputs: [
      {
        internalType: 'tuple',
        name: '',
        type: 'tuple',
        components: [
          { internalType: 'bytes32', name: 'taskId', type: 'bytes32' },
          { internalType: 'string', name: 'platform', type: 'string' },
          { internalType: 'address', name: 'assignee', type: 'address' },
          { internalType: 'uint8', name: 'complexity', type: 'uint8' },
          { internalType: 'uint256', name: 'rewardAmount', type: 'uint256' },
          { internalType: 'uint256', name: 'deadline', type: 'uint256' },
          { internalType: 'bytes32', name: 'verificationHash', type: 'bytes32' },
          { internalType: 'uint256', name: 'createdAt', type: 'uint256' },
          { internalType: 'address', name: 'creator', type: 'address' },
          { internalType: 'bool', name: 'isActive', type: 'bool' }
        ]
      }
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes32', name: 'taskId', type: 'bytes32' }],
    name: 'taskExists',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  // Write functions
  {
    inputs: [
      { internalType: 'bytes32', name: 'taskId', type: 'bytes32' },
      { internalType: 'string', name: 'platform', type: 'string' },
      { internalType: 'address', name: 'assignee', type: 'address' },
      { internalType: 'uint8', name: 'complexity', type: 'uint8' },
      { internalType: 'uint256', name: 'customReward', type: 'uint256' },
      { internalType: 'uint256', name: 'deadline', type: 'uint256' },
      { internalType: 'bytes32', name: 'verificationHash', type: 'bytes32' }
    ],
    name: 'createTask',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'taskId', type: 'bytes32' },
      { internalType: 'bytes32', name: 'proofHash', type: 'bytes32' }
    ],
    name: 'submitCompletion',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'taskId', type: 'bytes32' },
      { internalType: 'bool', name: 'approve', type: 'bool' }
    ],
    name: 'validateCompletion',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'bytes32', name: 'taskId', type: 'bytes32' },
      { indexed: true, internalType: 'address', name: 'assignee', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'rewardAmount', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'deadline', type: 'uint256' },
      { indexed: false, internalType: 'address', name: 'creator', type: 'address' }
    ],
    name: 'TaskCreated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'bytes32', name: 'taskId', type: 'bytes32' },
      { indexed: true, internalType: 'address', name: 'completer', type: 'address' },
      { indexed: false, internalType: 'bytes32', name: 'proofHash', type: 'bytes32' },
      { indexed: false, internalType: 'uint256', name: 'timestamp', type: 'uint256' }
    ],
    name: 'TaskCompleted',
    type: 'event',
  },
] as const

// Aragon DAO minimal ABI (if needed for proposals)
export const ARAGON_DAO_ABI = [
  {
    inputs: [],
    name: 'proposalCount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const