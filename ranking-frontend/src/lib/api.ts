'use client'

import useSWR from 'swr'
import { Address } from 'viem'
import { 
  RankingApiResponse, 
  LeaderboardResponse, 
  CollaboratorResponse, 
  StatsResponse, 
  RecentActivityResponse,
  PaginationOptions,
  FilterOptions 
} from '@/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// Generic fetcher with error handling
async function fetcher<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
  })
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
  }
  
  return response.json()
}

// POST fetcher
async function postFetcher<T>(url: string, data: any): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
  }
  
  return response.json()
}

// API Configuration
export const API_CONFIG = {
  baseURL: API_BASE_URL,
  endpoints: {
    health: '/api/health',
    rankings: '/api/rankings',
    leaderboard: '/api/leaderboard',
    collaborator: (address: Address) => `/api/collaborator/${address}`,
    stats: '/api/stats',
    recentActivity: '/api/recent-activity',
    websocketStats: '/api/websocket/stats',
    broadcast: '/api/broadcast',
    cacheStatus: '/api/cache/status',
    clearCache: (key: string) => `/api/cache/${key}`
  },
  swrConfig: {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    refreshInterval: 0, // We'll handle refresh via WebSocket
    errorRetryCount: 3,
    errorRetryInterval: 5000,
    dedupingInterval: 2000,
  }
}

// Health Check Hook
export function useHealthCheck() {
  return useSWR(
    `${API_CONFIG.baseURL}${API_CONFIG.endpoints.health}`,
    fetcher,
    {
      ...API_CONFIG.swrConfig,
      refreshInterval: 30000, // Check health every 30 seconds
    }
  )
}

// Rankings Hook with Pagination and Filters
interface UseRankingsOptions {
  limit?: number
  offset?: number
  filters?: Partial<FilterOptions>
  enabled?: boolean
}

export function useRankings(options: UseRankingsOptions = {}) {
  const { limit = 50, offset = 0, filters, enabled = true } = options
  
  const queryParams = new URLSearchParams()
  queryParams.set('limit', limit.toString())
  queryParams.set('offset', offset.toString())
  
  if (filters?.complexity?.length) {
    queryParams.set('complexity', filters.complexity.join(','))
  }
  if (filters?.minEarnings) {
    queryParams.set('minEarnings', filters.minEarnings.toString())
  }
  if (filters?.maxEarnings) {
    queryParams.set('maxEarnings', filters.maxEarnings.toString())
  }
  if (filters?.timeRange) {
    queryParams.set('timeRange', filters.timeRange)
  }
  if (filters?.sortBy) {
    queryParams.set('sortBy', filters.sortBy)
  }
  if (filters?.sortOrder) {
    queryParams.set('sortOrder', filters.sortOrder)
  }
  
  const url = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.rankings}?${queryParams.toString()}`
  
  return useSWR<RankingApiResponse>(
    enabled ? url : null,
    fetcher,
    API_CONFIG.swrConfig
  )
}

// Leaderboard Hook (Top Performers)
export function useLeaderboard(limit = 10) {
  const queryParams = new URLSearchParams({ limit: limit.toString() })
  const url = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.leaderboard}?${queryParams.toString()}`
  
  return useSWR<LeaderboardResponse>(
    url,
    fetcher,
    {
      ...API_CONFIG.swrConfig,
      refreshInterval: 60000, // Refresh leaderboard every minute
    }
  )
}

// Individual Collaborator Hook
export function useCollaborator(address: Address | null, enabled = true) {
  const url = address 
    ? `${API_CONFIG.baseURL}${API_CONFIG.endpoints.collaborator(address)}`
    : null
  
  return useSWR<CollaboratorResponse>(
    enabled && url ? url : null,
    fetcher,
    API_CONFIG.swrConfig
  )
}

// System Stats Hook
export function useSystemStats() {
  return useSWR<StatsResponse>(
    `${API_CONFIG.baseURL}${API_CONFIG.endpoints.stats}`,
    fetcher,
    {
      ...API_CONFIG.swrConfig,
      refreshInterval: 30000, // Refresh stats every 30 seconds
    }
  )
}

// Recent Activity Hook
export function useRecentActivity(limit = 20) {
  const queryParams = new URLSearchParams({ limit: limit.toString() })
  const url = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.recentActivity}?${queryParams.toString()}`
  
  return useSWR<RecentActivityResponse>(
    url,
    fetcher,
    {
      ...API_CONFIG.swrConfig,
      refreshInterval: 15000, // Refresh activity every 15 seconds
    }
  )
}

// WebSocket Stats Hook
export function useWebSocketStats() {
  return useSWR(
    `${API_CONFIG.baseURL}${API_CONFIG.endpoints.websocketStats}`,
    fetcher,
    {
      ...API_CONFIG.swrConfig,
      refreshInterval: 10000, // Refresh WebSocket stats every 10 seconds
    }
  )
}

// Cache Status Hook
export function useCacheStatus() {
  return useSWR(
    `${API_CONFIG.baseURL}${API_CONFIG.endpoints.cacheStatus}`,
    fetcher,
    {
      ...API_CONFIG.swrConfig,
      refreshInterval: 60000, // Check cache status every minute
    }
  )
}

// Manual API calls (not hooks)

// Broadcast message to WebSocket clients
export async function broadcastMessage(data: {
  event: string
  data: any
  target?: 'all' | 'client'
  clientId?: string
}): Promise<any> {
  return postFetcher(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.broadcast}`, data)
}

// Clear cache entry
export async function clearCacheEntry(key: string): Promise<any> {
  const response = await fetch(
    `${API_CONFIG.baseURL}${API_CONFIG.endpoints.clearCache(key)}`,
    { method: 'DELETE' }
  )
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || `Failed to clear cache: ${response.statusText}`)
  }
  
  return response.json()
}

// Prefetch data
export async function prefetchRankings(options: UseRankingsOptions = {}): Promise<RankingApiResponse> {
  const { limit = 50, offset = 0, filters } = options
  
  const queryParams = new URLSearchParams()
  queryParams.set('limit', limit.toString())
  queryParams.set('offset', offset.toString())
  
  if (filters?.sortBy) queryParams.set('sortBy', filters.sortBy)
  if (filters?.sortOrder) queryParams.set('sortOrder', filters.sortOrder)
  
  const url = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.rankings}?${queryParams.toString()}`
  return fetcher<RankingApiResponse>(url)
}

export async function prefetchCollaborator(address: Address): Promise<CollaboratorResponse> {
  const url = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.collaborator(address)}`
  return fetcher<CollaboratorResponse>(url)
}

export async function prefetchSystemStats(): Promise<StatsResponse> {
  const url = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.stats}`
  return fetcher<StatsResponse>(url)
}

// Search functionality
export async function searchCollaborators(query: string, limit = 20): Promise<RankingApiResponse> {
  const queryParams = new URLSearchParams({
    search: query,
    limit: limit.toString()
  })
  
  const url = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.rankings}?${queryParams.toString()}`
  return fetcher<RankingApiResponse>(url)
}

// Error boundaries and retry logic
export class APIError extends Error {
  constructor(
    message: string, 
    public status?: number, 
    public code?: string,
    public details?: any
  ) {
    super(message)
    this.name = 'APIError'
  }
}

// Retry wrapper for critical API calls
export async function retryFetch<T>(
  fn: () => Promise<T>, 
  maxRetries = 3, 
  delay = 1000
): Promise<T> {
  let lastError: Error
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      
      if (i < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)))
      }
    }
  }
  
  throw lastError!
}

// Batch API calls
export async function batchFetch<T>(
  urls: string[], 
  batchSize = 5
): Promise<(T | Error)[]> {
  const results: (T | Error)[] = []
  
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize)
    const promises = batch.map(url => 
      fetcher<T>(url).catch(error => error as Error)
    )
    
    const batchResults = await Promise.all(promises)
    results.push(...batchResults)
  }
  
  return results
}

// API Response Cache (for client-side caching)
class APICache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  
  set(key: string, data: any, ttl = 300000) { // 5 minutes default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }
  
  get(key: string): any | null {
    const entry = this.cache.get(key)
    if (!entry) return null
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return entry.data
  }
  
  clear(key?: string) {
    if (key) {
      this.cache.delete(key)
    } else {
      this.cache.clear()
    }
  }
  
  size() {
    return this.cache.size
  }
}

export const apiCache = new APICache()

// Cached fetcher
export async function cachedFetcher<T>(url: string, ttl?: number): Promise<T> {
  const cached = apiCache.get(url)
  if (cached) return cached
  
  const data = await fetcher<T>(url)
  apiCache.set(url, data, ttl)
  return data
}

// Performance monitoring
export function createAPIPerformanceMonitor() {
  const metrics = {
    requestCount: 0,
    errorCount: 0,
    totalResponseTime: 0,
    slowestRequest: 0,
    fastestRequest: Infinity
  }
  
  const monitor = async <T>(url: string, fn: () => Promise<T>): Promise<T> => {
    const start = performance.now()
    metrics.requestCount++
    
    try {
      const result = await fn()
      const responseTime = performance.now() - start
      
      metrics.totalResponseTime += responseTime
      metrics.slowestRequest = Math.max(metrics.slowestRequest, responseTime)
      metrics.fastestRequest = Math.min(metrics.fastestRequest, responseTime)
      
      return result
    } catch (error) {
      metrics.errorCount++
      throw error
    }
  }
  
  const getMetrics = () => ({
    ...metrics,
    averageResponseTime: metrics.requestCount > 0 
      ? metrics.totalResponseTime / metrics.requestCount 
      : 0,
    errorRate: metrics.requestCount > 0 
      ? metrics.errorCount / metrics.requestCount 
      : 0
  })
  
  const reset = () => {
    metrics.requestCount = 0
    metrics.errorCount = 0
    metrics.totalResponseTime = 0
    metrics.slowestRequest = 0
    metrics.fastestRequest = Infinity
  }
  
  return { monitor, getMetrics, reset }
}

export const apiPerformanceMonitor = createAPIPerformanceMonitor()