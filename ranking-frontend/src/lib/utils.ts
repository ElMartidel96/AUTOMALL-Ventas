import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Address } from 'viem'
import { BadgeType, Badge } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatAddress(address: Address, short = true): string {
  if (!address) return ''
  
  if (short) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }
  
  return address
}

export function formatCGC(amount: bigint, decimals = 18, compact = false): string {
  const value = Number(amount) / Math.pow(10, decimals)
  
  if (compact) {
    if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(1)}M CGC`
    } else if (value >= 1_000) {
      return `${(value / 1_000).toFixed(1)}K CGC`
    }
  }
  
  return `${value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })} CGC`
}

export function formatNumber(num: number, compact = false): string {
  if (compact) {
    if (num >= 1_000_000) {
      return `${(num / 1_000_000).toFixed(1)}M`
    } else if (num >= 1_000) {
      return `${(num / 1_000).toFixed(1)}K`
    }
  }
  
  return num.toLocaleString()
}

export function formatPercentage(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`
}

export function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  const weeks = Math.floor(diff / 604800000)
  const months = Math.floor(diff / 2628000000)
  const years = Math.floor(diff / 31536000000)
  
  if (years > 0) return `${years}y ago`
  if (months > 0) return `${months}mo ago`
  if (weeks > 0) return `${weeks}w ago`
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return 'just now'
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`
  } else {
    return `${remainingSeconds}s`
  }
}

export function formatDate(date: Date, format: 'short' | 'medium' | 'long' = 'medium'): string {
  const options: Intl.DateTimeFormatOptions = {
    short: { month: 'short', day: 'numeric' },
    medium: { month: 'short', day: 'numeric', year: 'numeric' },
    long: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  }
  
  return new Intl.DateTimeFormat('en-US', options[format]).format(date)
}

export function calculateRankChange(currentRank: number, previousRank?: number): {
  change: number
  trend: 'up' | 'down' | 'stable'
  isNew: boolean
} {
  if (previousRank === undefined) {
    return { change: 0, trend: 'stable', isNew: true }
  }
  
  const change = previousRank - currentRank
  const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
  
  return { change: Math.abs(change), trend, isNew: false }
}

export function calculateSuccessRate(completed: number, total: number): number {
  if (total === 0) return 0
  return completed / total
}

export function calculateScore(
  completedTasks: number,
  totalEarned: bigint,
  successRate: number,
  averageRating: number
): number {
  const taskWeight = 10
  const earningsWeight = 0.001
  const successRateWeight = 50
  const ratingWeight = 20
  
  const taskScore = completedTasks * taskWeight
  const earningsScore = Number(totalEarned) / Math.pow(10, 18) * earningsWeight
  const successScore = successRate * successRateWeight
  const ratingScore = averageRating * ratingWeight
  
  return Math.round(taskScore + earningsScore + successScore + ratingScore)
}

export function getBadgeInfo(type: BadgeType): Badge {
  const badges: Record<BadgeType, Badge> = {
    rookie: {
      type: 'rookie',
      name: 'Rookie',
      description: 'Completed your first task',
      icon: '🌱',
      color: 'text-green-500',
      rarity: 'common',
      requirement: 'Complete 1 task'
    },
    contributor: {
      type: 'contributor',
      name: 'Contributor',
      description: 'Active community member',
      icon: '🤝',
      color: 'text-blue-500',
      rarity: 'common',
      requirement: 'Complete 10 tasks'
    },
    expert: {
      type: 'expert',
      name: 'Expert',
      description: 'Skilled collaborator',
      icon: '⭐',
      color: 'text-yellow-500',
      rarity: 'rare',
      requirement: 'Complete 50 tasks'
    },
    master: {
      type: 'master',
      name: 'Master',
      description: 'Top-tier performer',
      icon: '👑',
      color: 'text-purple-500',
      rarity: 'epic',
      requirement: 'Complete 100 tasks'
    },
    legend: {
      type: 'legend',
      name: 'Legend',
      description: 'Legendary contributor',
      icon: '🏆',
      color: 'text-orange-500',
      rarity: 'legendary',
      requirement: 'Complete 250 tasks'
    },
    streak: {
      type: 'streak',
      name: 'Streak',
      description: '7-day active streak',
      icon: '🔥',
      color: 'text-red-500',
      rarity: 'rare',
      requirement: '7 consecutive days'
    },
    perfectionist: {
      type: 'perfectionist',
      name: 'Perfectionist',
      description: '100% success rate',
      icon: '💎',
      color: 'text-cyan-500',
      rarity: 'epic',
      requirement: '100% success rate (20+ tasks)'
    },
    speed: {
      type: 'speed',
      name: 'Speed Demon',
      description: 'Lightning fast completion',
      icon: '⚡',
      color: 'text-yellow-400',
      rarity: 'rare',
      requirement: 'Top 10% completion speed'
    },
    'big-earner': {
      type: 'big-earner',
      name: 'Big Earner',
      description: 'High-value contributor',
      icon: '💰',
      color: 'text-emerald-500',
      rarity: 'epic',
      requirement: 'Earn 10,000+ CGC'
    },
    community: {
      type: 'community',
      name: 'Community Champion',
      description: 'Outstanding community member',
      icon: '🌟',
      color: 'text-indigo-500',
      rarity: 'legendary',
      requirement: 'Special recognition'
    }
  }
  
  return badges[type]
}

export function getBadgeForCollaborator(
  completedTasks: number,
  totalEarned: bigint,
  successRate: number
): BadgeType | undefined {
  const earningsInCGC = Number(totalEarned) / Math.pow(10, 18)
  
  if (completedTasks >= 250) return 'legend'
  if (completedTasks >= 100) return 'master'
  if (earningsInCGC >= 10000) return 'big-earner'
  if (completedTasks >= 50) return 'expert'
  if (successRate === 1 && completedTasks >= 20) return 'perfectionist'
  if (completedTasks >= 10) return 'contributor'
  if (completedTasks >= 1) return 'rookie'
  
  return undefined
}

export function getHealthColor(health: 'healthy' | 'warning' | 'critical'): string {
  const colors = {
    healthy: 'text-success',
    warning: 'text-warning',
    critical: 'text-error'
  }
  return colors[health]
}

export function getTrendIcon(trend: 'up' | 'down' | 'stable'): string {
  const icons = {
    up: '📈',
    down: '📉',
    stable: '➡️'
  }
  return icons[trend]
}

export function getTrendColor(trend: 'up' | 'down' | 'stable'): string {
  const colors = {
    up: 'text-success',
    down: 'text-destructive',
    stable: 'text-muted-foreground'
  }
  return colors[trend]
}

export function debounce<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

export function throttle<T extends (...args: any[]) => void>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function lerp(start: number, end: number, factor: number): number {
  return start + (end - start) * factor
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

export function isValidAddress(address: string): address is Address {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

export function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(text).then(() => true).catch(() => false)
  } else {
    const textArea = document.createElement('textarea')
    textArea.value = text
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    const successful = document.execCommand('copy')
    document.body.removeChild(textArea)
    return Promise.resolve(successful)
  }
}

export function downloadJSON(data: any, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json'
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function getColorFromAddress(address: Address): string {
  const hash = address.toLowerCase()
  const hue = parseInt(hash.slice(2, 8), 16) % 360
  return `hsl(${hue}, 70%, 50%)`
}

export function generateAvatar(address: Address, size = 40): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
    '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43'
  ]
  
  const hash = address.toLowerCase()
  const colorIndex = parseInt(hash.slice(2, 4), 16) % colors.length
  const color = colors[colorIndex]
  
  return `https://ui-avatars.com/api/?name=${address.slice(2, 8)}&background=${color?.slice(1)}&color=fff&size=${size}&bold=true`
}

export function getBaseExplorerUrl(hash: string, type: 'tx' | 'address' = 'tx'): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASESCAN_URL || 'https://basescan.org'
  return `${baseUrl}/${type}/${hash}`
}

export function formatGasPrice(gasPrice: bigint): string {
  const gwei = Number(gasPrice) / 1e9
  return `${gwei.toFixed(2)} Gwei`
}

export function calculateProgress(current: number, total: number): number {
  if (total === 0) return 0
  return clamp((current / total) * 100, 0, 100)
}

export function getRandomElements<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

export function groupBy<T, K extends keyof any>(
  array: T[],
  key: (item: T) => K
): Record<K, T[]> {
  return array.reduce((groups, item) => {
    const group = key(item)
    groups[group] = groups[group] || []
    groups[group]!.push(item)
    return groups
  }, {} as Record<K, T[]>)
}

export function sortBy<T>(
  array: T[],
  key: keyof T | ((item: T) => any),
  order: 'asc' | 'desc' = 'asc'
): T[] {
  const getValue = typeof key === 'function' ? key : (item: T) => item[key]
  
  return [...array].sort((a, b) => {
    const aValue = getValue(a)
    const bValue = getValue(b)
    
    if (aValue < bValue) return order === 'asc' ? -1 : 1
    if (aValue > bValue) return order === 'asc' ? 1 : -1
    return 0
  })
}

export function createQueryString(params: Record<string, string | number | boolean>): string {
  const searchParams = new URLSearchParams()
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value))
    }
  })
  
  return searchParams.toString()
}

export function parseQueryString(queryString: string): Record<string, string> {
  const params = new URLSearchParams(queryString)
  const result: Record<string, string> = {}
  
  params.forEach((value, key) => {
    result[key] = value
  })
  
  return result
}

export function validateEnvironmentVariable(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue
  
  if (!value) {
    throw new Error(`Environment variable ${key} is required`)
  }
  
  return value
}