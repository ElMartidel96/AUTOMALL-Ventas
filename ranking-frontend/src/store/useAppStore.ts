'use client'

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { Address } from 'viem'
import { 
  AppState, 
  Ranking, 
  Collaborator, 
  SystemStats, 
  Activity, 
  WebSocketState, 
  UIPreferences, 
  NotificationData 
} from '@/types'

interface AppStore extends AppState {
  // Ranking actions
  setRankings: (rankings: Ranking[]) => void
  updateRanking: (address: Address, ranking: Partial<Ranking>) => void
  updateRankingPosition: (address: Address, newRank: number, oldRank?: number) => void
  
  // Collaborator actions
  setCollaborator: (collaborator: Collaborator) => void
  updateCollaborator: (address: Address, updates: Partial<Collaborator>) => void
  
  // Stats actions
  setStats: (stats: SystemStats) => void
  updateStats: (updates: Partial<SystemStats>) => void
  
  // Activity actions
  addActivity: (activity: Activity) => void
  setRecentActivity: (activities: Activity[]) => void
  
  // Loading and error states
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
  
  // WebSocket state
  setWebSocketState: (state: Partial<WebSocketState>) => void
  
  // UI Preferences
  setPreferences: (preferences: Partial<UIPreferences>) => void
  toggleTheme: () => void
  setThemeMode: (mode: 'light' | 'dark' | 'system') => void
  
  // Notifications
  notifications: NotificationData[]
  addNotification: (notification: Omit<NotificationData, 'id' | 'timestamp'>) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
  
  // Cache management
  lastUpdate: Date | null
  setLastUpdate: (date: Date) => void
  
  // Filters and search
  filters: {
    searchQuery: string
    complexity: number[]
    minEarnings: bigint | null
    maxEarnings: bigint | null
    timeRange: 'day' | 'week' | 'month' | 'year' | 'all'
    sortBy: 'rank' | 'earnings' | 'tasks' | 'success-rate' | 'recent-activity'
    sortOrder: 'asc' | 'desc'
  }
  setFilters: (filters: Partial<AppStore['filters']>) => void
  resetFilters: () => void
  
  // Computed values
  getFilteredRankings: () => Ranking[]
  getTopPerformers: (limit?: number) => Ranking[]
  getCollaboratorByAddress: (address: Address) => Collaborator | null
  getRankingByAddress: (address: Address) => Ranking | null
  
  // Actions
  reset: () => void
  hydrate: () => void
}

const DEFAULT_PREFERENCES: UIPreferences = {
  theme: {
    mode: 'system',
    accentColor: '#3b82f6',
    reducedMotion: false,
    soundEffects: true,
    notifications: true
  },
  language: 'en',
  currency: 'CGC',
  itemsPerPage: 50,
  autoRefresh: true,
  refreshInterval: 30000,
  compactMode: false,
  showTooltips: true,
  showAnimations: true,
  soundEnabled: true
}

const DEFAULT_WEBSOCKET_STATE: WebSocketState = {
  connected: false,
  connecting: false,
  error: null,
  reconnectAttempts: 0
}

const DEFAULT_FILTERS = {
  searchQuery: '',
  complexity: [] as number[],
  minEarnings: null as bigint | null,
  maxEarnings: null as bigint | null,
  timeRange: 'all' as const,
  sortBy: 'rank' as const,
  sortOrder: 'asc' as const
}

export const useAppStore = create<AppStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    rankings: [],
    collaborators: new Map(),
    stats: null,
    recentActivity: [],
    isLoading: false,
    error: null,
    lastUpdate: null,
    websocket: DEFAULT_WEBSOCKET_STATE,
    preferences: DEFAULT_PREFERENCES,
    notifications: [],
    filters: DEFAULT_FILTERS,

    // Ranking actions
    setRankings: (rankings) => 
      set({ 
        rankings, 
        lastUpdate: new Date(),
        error: null 
      }),

    updateRanking: (address, updates) =>
      set((state) => ({
        rankings: state.rankings.map(r => 
          r.address === address ? { ...r, ...updates } : r
        ),
        lastUpdate: new Date()
      })),

    updateRankingPosition: (address, newRank, oldRank) =>
      set((state) => {
        const rankings = [...state.rankings]
        const targetIndex = rankings.findIndex(r => r.address === address)
        
        if (targetIndex === -1) return state
        
        const ranking = rankings[targetIndex]!
        const updatedRanking = {
          ...ranking,
          rank: newRank,
          previousRank: oldRank || ranking.rank,
          trend: oldRank 
            ? (newRank < oldRank ? 'up' : newRank > oldRank ? 'down' : 'stable') as const
            : 'stable' as const,
          trendChange: oldRank ? Math.abs(oldRank - newRank) : 0
        }
        
        // Remove from old position and insert at new position
        rankings.splice(targetIndex, 1)
        rankings.splice(newRank - 1, 0, updatedRanking)
        
        // Update all rankings to reflect new positions
        const reindexedRankings = rankings.map((r, index) => ({
          ...r,
          rank: index + 1
        }))
        
        return {
          rankings: reindexedRankings,
          lastUpdate: new Date()
        }
      }),

    // Collaborator actions
    setCollaborator: (collaborator) =>
      set((state) => ({
        collaborators: new Map(state.collaborators.set(collaborator.address, collaborator))
      })),

    updateCollaborator: (address, updates) =>
      set((state) => {
        const existing = state.collaborators.get(address)
        if (!existing) return state
        
        const updated = { ...existing, ...updates }
        return {
          collaborators: new Map(state.collaborators.set(address, updated))
        }
      }),

    // Stats actions
    setStats: (stats) => 
      set({ stats, lastUpdate: new Date() }),

    updateStats: (updates) =>
      set((state) => ({
        stats: state.stats ? { ...state.stats, ...updates } : null
      })),

    // Activity actions
    addActivity: (activity) =>
      set((state) => ({
        recentActivity: [activity, ...state.recentActivity].slice(0, 100)
      })),

    setRecentActivity: (activities) =>
      set({ recentActivity: activities }),

    // Loading and error states
    setLoading: (loading) => set({ isLoading: loading }),
    
    setError: (error) => set({ error, isLoading: false }),
    
    clearError: () => set({ error: null }),

    // WebSocket state
    setWebSocketState: (wsState) =>
      set((state) => ({
        websocket: { ...state.websocket, ...wsState }
      })),

    // UI Preferences
    setPreferences: (prefs) =>
      set((state) => {
        const newPreferences = { ...state.preferences, ...prefs }
        
        // Persist to localStorage
        try {
          localStorage.setItem('cgc-preferences', JSON.stringify(newPreferences))
        } catch (error) {
          console.warn('Failed to save preferences:', error)
        }
        
        return { preferences: newPreferences }
      }),

    toggleTheme: () =>
      set((state) => {
        const currentMode = state.preferences.theme.mode
        const newMode = currentMode === 'light' ? 'dark' : 'light'
        
        const newPreferences = {
          ...state.preferences,
          theme: { ...state.preferences.theme, mode: newMode }
        }
        
        // Persist to localStorage
        try {
          localStorage.setItem('cgc-preferences', JSON.stringify(newPreferences))
        } catch (error) {
          console.warn('Failed to save theme preference:', error)
        }
        
        return { preferences: newPreferences }
      }),

    setThemeMode: (mode) =>
      set((state) => {
        const newPreferences = {
          ...state.preferences,
          theme: { ...state.preferences.theme, mode }
        }
        
        try {
          localStorage.setItem('cgc-preferences', JSON.stringify(newPreferences))
        } catch (error) {
          console.warn('Failed to save theme preference:', error)
        }
        
        return { preferences: newPreferences }
      }),

    // Notifications
    addNotification: (notification) => {
      const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const newNotification: NotificationData = {
        ...notification,
        id,
        timestamp: new Date()
      }
      
      set((state) => ({
        notifications: [newNotification, ...state.notifications].slice(0, 10)
      }))
      
      // Auto-remove after duration
      if (notification.duration) {
        setTimeout(() => {
          get().removeNotification(id)
        }, notification.duration)
      }
    },

    removeNotification: (id) =>
      set((state) => ({
        notifications: state.notifications.filter(n => n.id !== id)
      })),

    clearNotifications: () => set({ notifications: [] }),

    // Cache management
    setLastUpdate: (date) => set({ lastUpdate: date }),

    // Filters and search
    setFilters: (filters) =>
      set((state) => ({
        filters: { ...state.filters, ...filters }
      })),

    resetFilters: () => set({ filters: DEFAULT_FILTERS }),

    // Computed values
    getFilteredRankings: () => {
      const { rankings, filters } = get()
      let filtered = [...rankings]
      
      // Search query
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase()
        filtered = filtered.filter(r => 
          r.username?.toLowerCase().includes(query) ||
          r.address.toLowerCase().includes(query)
        )
      }
      
      // Complexity filter
      if (filters.complexity.length > 0) {
        // This would need additional data from collaborator details
        // For now, we'll skip this filter
      }
      
      // Earnings filter
      if (filters.minEarnings !== null) {
        filtered = filtered.filter(r => r.totalEarned >= filters.minEarnings!)
      }
      if (filters.maxEarnings !== null) {
        filtered = filtered.filter(r => r.totalEarned <= filters.maxEarnings!)
      }
      
      // Time range filter (based on recentActivity)
      if (filters.timeRange !== 'all') {
        const now = new Date()
        const timeRanges = {
          day: 24 * 60 * 60 * 1000,
          week: 7 * 24 * 60 * 60 * 1000,
          month: 30 * 24 * 60 * 60 * 1000,
          year: 365 * 24 * 60 * 60 * 1000
        }
        
        const cutoff = new Date(now.getTime() - timeRanges[filters.timeRange])
        filtered = filtered.filter(r => r.recentActivity >= cutoff)
      }
      
      // Sort
      filtered.sort((a, b) => {
        let aValue: any
        let bValue: any
        
        switch (filters.sortBy) {
          case 'rank':
            aValue = a.rank
            bValue = b.rank
            break
          case 'earnings':
            aValue = Number(a.totalEarned)
            bValue = Number(b.totalEarned)
            break
          case 'tasks':
            aValue = a.completedTasks
            bValue = b.completedTasks
            break
          case 'success-rate':
            aValue = a.successRate
            bValue = b.successRate
            break
          case 'recent-activity':
            aValue = a.recentActivity.getTime()
            bValue = b.recentActivity.getTime()
            break
          default:
            aValue = a.rank
            bValue = b.rank
        }
        
        if (aValue < bValue) return filters.sortOrder === 'asc' ? -1 : 1
        if (aValue > bValue) return filters.sortOrder === 'asc' ? 1 : -1
        return 0
      })
      
      return filtered
    },

    getTopPerformers: (limit = 10) => {
      const { rankings } = get()
      return rankings.slice(0, limit)
    },

    getCollaboratorByAddress: (address) => {
      const { collaborators } = get()
      return collaborators.get(address) || null
    },

    getRankingByAddress: (address) => {
      const { rankings } = get()
      return rankings.find(r => r.address === address) || null
    },

    // Actions
    reset: () => 
      set({
        rankings: [],
        collaborators: new Map(),
        stats: null,
        recentActivity: [],
        isLoading: false,
        error: null,
        lastUpdate: null,
        notifications: [],
        filters: DEFAULT_FILTERS
      }),

    hydrate: () => {
      try {
        const storedPrefs = localStorage.getItem('cgc-preferences')
        if (storedPrefs) {
          const preferences = JSON.parse(storedPrefs)
          set({ preferences: { ...DEFAULT_PREFERENCES, ...preferences } })
        }
      } catch (error) {
        console.warn('Failed to hydrate preferences from localStorage:', error)
      }
    }
  }))
)

// Subscribe to preferences changes and apply theme
useAppStore.subscribe(
  (state) => state.preferences.theme,
  (theme) => {
    const root = document.documentElement
    
    // Apply theme mode
    if (theme.mode === 'dark') {
      root.classList.add('dark')
    } else if (theme.mode === 'light') {
      root.classList.remove('dark')
    } else {
      // System preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (prefersDark) {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    }
    
    // Apply accent color
    root.style.setProperty('--primary', theme.accentColor)
  }
)

// Subscribe to reduced motion preference
useAppStore.subscribe(
  (state) => state.preferences.theme.reducedMotion,
  (reducedMotion) => {
    const root = document.documentElement
    if (reducedMotion) {
      root.style.setProperty('--motion-reduce', '1')
    } else {
      root.style.removeProperty('--motion-reduce')
    }
  }
)