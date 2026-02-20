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
  previousRank?: number
  score: number
  totalEarned: bigint
  completedTasks: number
  successRate: number
  averageRating: number
  badge?: BadgeType
  recentActivity: Date
  trend: 'up' | 'down' | 'stable'
  trendChange: number
  avatar?: string
  isOnline?: boolean
}

export type BadgeType = 
  | 'rookie'
  | 'contributor' 
  | 'expert'
  | 'master'
  | 'legend'
  | 'streak'
  | 'perfectionist'
  | 'speed'
  | 'big-earner'
  | 'community'

export interface Badge {
  type: BadgeType
  name: string
  description: string
  icon: string
  color: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  requirement: string
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
  type: 'RANKING_UPDATE' | 'TASK_UPDATE' | 'TRANSACTION_UPDATE' | 'SYSTEM_STATS' | 'LIVE_UPDATE'
  payload: any
  timestamp: Date
  id: string
}

export interface FilterOptions {
  complexity?: number[]
  minEarnings?: bigint
  maxEarnings?: bigint
  timeRange?: 'day' | 'week' | 'month' | 'year' | 'all'
  status?: Task['status'][]
  badges?: BadgeType[]
  sortBy?: 'rank' | 'earnings' | 'tasks' | 'success-rate' | 'recent-activity'
  sortOrder?: 'asc' | 'desc'
}

export interface SearchOptions {
  query: string
  fields: ('username' | 'address' | 'taskId')[]
  fuzzy?: boolean
  limit?: number
}

export interface PaginationOptions {
  page: number
  limit: number
  offset: number
  hasMore: boolean
  total: number
}

export interface ApiResponse<T> {
  data: T
  pagination?: PaginationOptions
  lastUpdate: Date
  success: boolean
  error?: string
}

export interface RankingApiResponse extends ApiResponse<Ranking[]> {
  rankings: Ranking[]
}

export interface LeaderboardResponse extends ApiResponse<Ranking[]> {
  leaderboard: Ranking[]
  generatedAt: Date
  totalParticipants: number
}

export interface CollaboratorResponse extends ApiResponse<Collaborator> {
  collaborator: Collaborator
}

export interface StatsResponse extends ApiResponse<SystemStats> {
  stats: SystemStats
}

export interface RecentActivityResponse extends ApiResponse<Activity[]> {
  activities: Activity[]
  count: number
}

export interface Activity {
  id: string
  type: 'task_completed' | 'funds_released' | 'batch_created' | 'dispute_resolved' | 'milestone_created'
  collaborator: Address
  data: {
    taskId?: string
    amount?: bigint
    txHash: string
    description: string
  }
  timestamp: Date
}

export interface NotificationData {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
  timestamp: Date
}

export interface ThemeConfig {
  mode: 'light' | 'dark' | 'system'
  accentColor: string
  reducedMotion: boolean
  soundEffects: boolean
  notifications: boolean
}

export interface UIPreferences {
  theme: ThemeConfig
  language: string
  currency: 'CGC' | 'USD' | 'ETH'
  itemsPerPage: number
  autoRefresh: boolean
  refreshInterval: number
  compactMode: boolean
  showTooltips: boolean
  showAnimations: boolean
  soundEnabled: boolean
}

export interface WebSocketState {
  connected: boolean
  connecting: boolean
  error: string | null
  reconnectAttempts: number
  lastConnected?: Date
  lastMessage?: Date
}

export interface AppState {
  rankings: Ranking[]
  collaborators: Map<Address, Collaborator>
  stats: SystemStats | null
  recentActivity: Activity[]
  isLoading: boolean
  error: string | null
  lastUpdate: Date | null
  websocket: WebSocketState
  preferences: UIPreferences
}

export interface ChartDataPoint {
  timestamp: Date
  value: number
  label?: string
  color?: string
}

export interface TimeSeriesData {
  label: string
  data: ChartDataPoint[]
  color: string
  fill?: boolean
}

export interface HeatMapData {
  date: Date
  value: number
  level: 0 | 1 | 2 | 3 | 4
}

export interface NetworkNode {
  id: string
  address: Address
  username?: string
  size: number
  color: string
  x?: number
  y?: number
}

export interface NetworkEdge {
  source: string
  target: string
  weight: number
  color: string
}

export interface NetworkData {
  nodes: NetworkNode[]
  edges: NetworkEdge[]
}

export interface PerformanceMetrics {
  renderTime: number
  updateTime: number
  memoryUsage: number
  fps: number
  apiLatency: number
  websocketLatency: number
}

export interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: any
  timestamp?: Date
}

export type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
export type ComponentVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link'
export type LoadingState = 'idle' | 'loading' | 'success' | 'error'
export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'reconnecting' | 'error'

export interface ComponentProps {
  className?: string
  size?: ComponentSize
  variant?: ComponentVariant
  disabled?: boolean
  loading?: boolean
  children?: React.ReactNode
}

export interface TableColumn<T = any> {
  key: keyof T | string
  label: string
  sortable?: boolean
  width?: number | string
  align?: 'left' | 'center' | 'right'
  render?: (value: any, row: T, index: number) => React.ReactNode
}

export interface TableProps<T = any> {
  data: T[]
  columns: TableColumn<T>[]
  loading?: boolean
  error?: string | null
  emptyMessage?: string
  onSort?: (column: string, direction: 'asc' | 'desc') => void
  onRowClick?: (row: T, index: number) => void
  className?: string
}

export interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  children: React.ReactNode
  className?: string
}