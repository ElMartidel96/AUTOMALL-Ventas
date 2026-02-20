'use client'

import React from 'react'
import { useWebSocket } from '@/hooks/useWebSocket'
import { useAppStore } from '@/store/useAppStore'
import { WebSocketMessage, RankingUpdate, Activity } from '@/types'

interface WebSocketProviderProps {
  children: React.ReactNode
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const {
    // Store actions
    setWebSocketState,
    setRankings,
    updateRanking,
    updateRankingPosition,
    setStats,
    addActivity,
    addNotification,
  } = useAppStore()

  // WebSocket connection
  const {
    connected,
    connecting,
    status,
    error,
    reconnectAttempts,
    lastConnected,
    lastMessage,
    subscribe,
    unsubscribe,
  } = useWebSocket({
    url: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001',
    autoConnect: true,
    reconnectAttempts: 10,
    reconnectInterval: 3000,
    timeout: 20000,
    
    onConnect: () => {
      console.log('✅ WebSocket connected')
      
      // Subscribe to channels
      subscribe('rankings')
      subscribe('stats')
      subscribe('live-updates')
      subscribe('tasks')
      subscribe('transactions')
      
      // Update store state
      setWebSocketState({
        connected: true,
        connecting: false,
        error: null,
        lastConnected: new Date(),
      })
      
      // Show connection notification
      addNotification({
        type: 'success',
        title: 'Connected',
        message: 'Real-time updates enabled',
        duration: 3000,
      })
    },
    
    onDisconnect: () => {
      console.log('❌ WebSocket disconnected')
      
      setWebSocketState({
        connected: false,
        connecting: false,
      })
    },
    
    onError: (error) => {
      console.error('WebSocket error:', error)
      
      setWebSocketState({
        connected: false,
        connecting: false,
        error: error.message,
      })
    },
    
    onMessage: (message: WebSocketMessage) => {
      console.log('📨 WebSocket message:', message.type, message.payload)
      
      setWebSocketState({
        lastMessage: new Date(),
      })
      
      handleWebSocketMessage(message)
    },
  })

  // Update store with WebSocket state
  React.useEffect(() => {
    setWebSocketState({
      connected,
      connecting,
      error,
      reconnectAttempts,
      lastConnected,
      lastMessage,
    })
  }, [connected, connecting, error, reconnectAttempts, lastConnected, lastMessage, setWebSocketState])

  // Handle WebSocket messages
  const handleWebSocketMessage = React.useCallback((message: WebSocketMessage) => {
    try {
      switch (message.type) {
        case 'RANKING_UPDATE':
          handleRankingUpdate(message.payload)
          break
          
        case 'TASK_UPDATE':
          handleTaskUpdate(message.payload)
          break
          
        case 'TRANSACTION_UPDATE':
          handleTransactionUpdate(message.payload)
          break
          
        case 'SYSTEM_STATS':
          handleStatsUpdate(message.payload)
          break
          
        case 'LIVE_UPDATE':
          handleLiveUpdate(message.payload)
          break
          
        default:
          console.warn('Unknown WebSocket message type:', message.type)
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error, message)
    }
  }, [])

  // Handle ranking updates
  const handleRankingUpdate = React.useCallback((data: any) => {
    if (data.rankings) {
      // Full rankings update
      setRankings(data.rankings)
      
      addNotification({
        type: 'info',
        title: 'Rankings Updated',
        message: `${data.rankings.length} collaborators ranked`,
        duration: 2000,
      })
    } else if (data.collaborator && data.data) {
      // Individual ranking update
      const { collaborator, data: updateData } = data
      
      if (updateData.newRank && updateData.oldRank) {
        // Rank position change
        updateRankingPosition(collaborator, updateData.newRank, updateData.oldRank)
        
        const rankChange = updateData.oldRank - updateData.newRank
        const isImprovement = rankChange > 0
        
        addNotification({
          type: isImprovement ? 'success' : 'info',
          title: `Rank ${isImprovement ? 'Up' : 'Down'}!`,
          message: `${collaborator.slice(0, 8)}... moved ${isImprovement ? 'up' : 'down'} ${Math.abs(rankChange)} position${Math.abs(rankChange) > 1 ? 's' : ''}`,
          duration: 4000,
        })
      } else {
        // General ranking update
        updateRanking(collaborator, updateData)
      }
    }
  }, [setRankings, updateRanking, updateRankingPosition, addNotification])

  // Handle task updates
  const handleTaskUpdate = React.useCallback((data: any) => {
    const activity: Activity = {
      id: `task-${Date.now()}-${Math.random()}`,
      type: 'task_completed',
      collaborator: data.assignee || data.collaborator,
      data: {
        taskId: data.taskId,
        amount: data.rewardAmount,
        txHash: data.txHash || 'pending',
        description: `Task ${data.status || 'updated'}`,
      },
      timestamp: new Date(),
    }
    
    addActivity(activity)
    
    if (data.status === 'released') {
      addNotification({
        type: 'success',
        title: 'Task Completed!',
        message: `Reward of ${data.rewardAmount ? `${Number(data.rewardAmount) / 1e18} CGC` : 'tokens'} released`,
        duration: 5000,
      })
    }
  }, [addActivity, addNotification])

  // Handle transaction updates
  const handleTransactionUpdate = React.useCallback((data: any) => {
    const activity: Activity = {
      id: `tx-${Date.now()}-${Math.random()}`,
      type: data.type === 'release' ? 'funds_released' : 'batch_created',
      collaborator: data.to || data.from,
      data: {
        amount: data.value,
        txHash: data.hash,
        description: `${data.type} transaction`,
      },
      timestamp: new Date(),
    }
    
    addActivity(activity)
    
    if (data.type === 'release' && data.value) {
      const amount = Number(data.value) / 1e18
      if (amount > 0) {
        addNotification({
          type: 'success',
          title: 'Funds Released!',
          message: `${amount.toFixed(2)} CGC transferred`,
          duration: 4000,
        })
      }
    }
  }, [addActivity, addNotification])

  // Handle system stats updates
  const handleStatsUpdate = React.useCallback((data: any) => {
    setStats(data)
  }, [setStats])

  // Handle live updates
  const handleLiveUpdate = React.useCallback((data: any) => {
    const { type: eventType, ...eventData } = data
    
    switch (eventType) {
      case 'MILESTONE':
        addActivity({
          id: `milestone-${Date.now()}-${Math.random()}`,
          type: 'milestone_created',
          collaborator: eventData.collaborator,
          data: {
            amount: eventData.amount,
            txHash: eventData.txHash,
            description: 'New milestone created',
          },
          timestamp: new Date(),
        })
        break
        
      case 'TOKEN':
        if (eventData.amount && Number(eventData.amount) > 1000000000000000000n) { // > 1 CGC
          addNotification({
            type: 'info',
            title: 'Large Token Movement',
            message: `${Number(eventData.amount) / 1e18} CGC transferred`,
            duration: 3000,
          })
        }
        break
        
      default:
        console.log('Live update:', eventType, eventData)
    }
  }, [addActivity, addNotification])

  // Provide WebSocket context (if needed by child components)
  const contextValue = React.useMemo(() => ({
    connected,
    connecting,
    status,
    error,
    reconnectAttempts,
    lastConnected,
    lastMessage,
    subscribe,
    unsubscribe,
  }), [
    connected,
    connecting,
    status,
    error,
    reconnectAttempts,
    lastConnected,
    lastMessage,
    subscribe,
    unsubscribe,
  ])

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  )
}

// WebSocket context for child components
const WebSocketContext = React.createContext<{
  connected: boolean
  connecting: boolean
  status: string
  error: string | null
  reconnectAttempts: number
  lastConnected: Date | null
  lastMessage: Date | null
  subscribe: (channel: string) => void
  unsubscribe: (channel: string) => void
} | null>(null)

// Hook to use WebSocket context
export function useWebSocketContext() {
  const context = React.useContext(WebSocketContext)
  if (!context) {
    throw new Error('useWebSocketContext must be used within WebSocketProvider')
  }
  return context
}