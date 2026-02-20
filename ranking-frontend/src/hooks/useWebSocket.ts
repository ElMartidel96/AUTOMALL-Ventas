'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { WebSocketMessage, ConnectionStatus } from '@/types'

interface UseWebSocketOptions {
  url: string
  autoConnect?: boolean
  reconnectAttempts?: number
  reconnectInterval?: number
  timeout?: number
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Error) => void
  onMessage?: (message: WebSocketMessage) => void
}

interface UseWebSocketReturn {
  socket: Socket | null
  connected: boolean
  connecting: boolean
  status: ConnectionStatus
  error: string | null
  reconnectAttempts: number
  lastConnected: Date | null
  lastMessage: Date | null
  connect: () => void
  disconnect: () => void
  emit: (event: string, data?: any) => void
  subscribe: (channel: string) => void
  unsubscribe: (channel: string) => void
}

const DEFAULT_OPTIONS: Required<Omit<UseWebSocketOptions, 'url' | 'onConnect' | 'onDisconnect' | 'onError' | 'onMessage'>> = {
  autoConnect: true,
  reconnectAttempts: 10,
  reconnectInterval: 3000,
  timeout: 20000
}

export function useWebSocket(options: UseWebSocketOptions): UseWebSocketReturn {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')
  const [error, setError] = useState<string | null>(null)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const [lastConnected, setLastConnected] = useState<Date | null>(null)
  const [lastMessage, setLastMessage] = useState<Date | null>(null)
  
  const socketRef = useRef<Socket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const connectTimeoutRef = useRef<NodeJS.Timeout>()
  const isManualDisconnectRef = useRef(false)
  const mountedRef = useRef(true)

  const clearTimeouts = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = undefined
    }
    if (connectTimeoutRef.current) {
      clearTimeout(connectTimeoutRef.current)
      connectTimeoutRef.current = undefined
    }
  }, [])

  const updateState = useCallback((
    newStatus: ConnectionStatus,
    newConnected: boolean,
    newConnecting: boolean,
    errorMessage: string | null = null
  ) => {
    if (!mountedRef.current) return
    
    setStatus(newStatus)
    setConnected(newConnected)
    setConnecting(newConnecting)
    setError(errorMessage)
  }, [])

  const handleReconnect = useCallback(() => {
    if (isManualDisconnectRef.current || !mountedRef.current) return
    
    if (reconnectAttempts < opts.reconnectAttempts) {
      const delay = Math.min(opts.reconnectInterval * Math.pow(1.5, reconnectAttempts), 30000)
      
      updateState('reconnecting', false, true, `Reconnecting in ${delay / 1000}s...`)
      
      reconnectTimeoutRef.current = setTimeout(() => {
        if (!mountedRef.current) return
        setReconnectAttempts(prev => prev + 1)
        connect()
      }, delay)
    } else {
      updateState('error', false, false, 'Maximum reconnection attempts reached')
    }
  }, [reconnectAttempts, opts.reconnectAttempts, opts.reconnectInterval, updateState])

  const connect = useCallback(() => {
    if (!mountedRef.current) return
    
    clearTimeouts()
    
    if (socketRef.current?.connected) {
      return
    }

    if (socketRef.current) {
      socketRef.current.removeAllListeners()
      socketRef.current.close()
    }

    updateState('connecting', false, true, null)
    isManualDisconnectRef.current = false

    try {
      const socket = io(opts.url, {
        transports: ['websocket', 'polling'],
        upgrade: true,
        rememberUpgrade: true,
        timeout: opts.timeout,
        autoConnect: false,
        reconnection: false, // We handle reconnection manually
        forceNew: true
      })

      socketRef.current = socket

      connectTimeoutRef.current = setTimeout(() => {
        if (!socket.connected && mountedRef.current) {
          updateState('error', false, false, 'Connection timeout')
          socket.close()
          handleReconnect()
        }
      }, opts.timeout)

      socket.on('connect', () => {
        if (!mountedRef.current) return
        
        clearTimeouts()
        setReconnectAttempts(0)
        setLastConnected(new Date())
        updateState('connected', true, false, null)
        opts.onConnect?.()
      })

      socket.on('disconnect', (reason) => {
        if (!mountedRef.current) return
        
        clearTimeouts()
        updateState('disconnected', false, false, `Disconnected: ${reason}`)
        
        if (!isManualDisconnectRef.current && reason !== 'io client disconnect') {
          handleReconnect()
        }
        
        opts.onDisconnect?.()
      })

      socket.on('connect_error', (err) => {
        if (!mountedRef.current) return
        
        clearTimeouts()
        const errorMessage = err.message || 'Connection failed'
        updateState('error', false, false, errorMessage)
        
        opts.onError?.(new Error(errorMessage))
        
        if (!isManualDisconnectRef.current) {
          handleReconnect()
        }
      })

      socket.on('error', (err) => {
        if (!mountedRef.current) return
        
        const errorMessage = typeof err === 'string' ? err : err.message || 'Socket error'
        setError(errorMessage)
        opts.onError?.(new Error(errorMessage))
      })

      // Listen for any message to update lastMessage timestamp
      socket.onAny(() => {
        if (mountedRef.current) {
          setLastMessage(new Date())
        }
      })

      // Handle WebSocket messages
      socket.on('ranking-update', (data) => {
        if (!mountedRef.current) return
        const message: WebSocketMessage = {
          type: 'RANKING_UPDATE',
          payload: data,
          timestamp: new Date(),
          id: `ranking-${Date.now()}-${Math.random()}`
        }
        opts.onMessage?.(message)
      })

      socket.on('task-update', (data) => {
        if (!mountedRef.current) return
        const message: WebSocketMessage = {
          type: 'TASK_UPDATE',
          payload: data,
          timestamp: new Date(),
          id: `task-${Date.now()}-${Math.random()}`
        }
        opts.onMessage?.(message)
      })

      socket.on('transaction-update', (data) => {
        if (!mountedRef.current) return
        const message: WebSocketMessage = {
          type: 'TRANSACTION_UPDATE',
          payload: data,
          timestamp: new Date(),
          id: `tx-${Date.now()}-${Math.random()}`
        }
        opts.onMessage?.(message)
      })

      socket.on('stats-update', (data) => {
        if (!mountedRef.current) return
        const message: WebSocketMessage = {
          type: 'SYSTEM_STATS',
          payload: data,
          timestamp: new Date(),
          id: `stats-${Date.now()}-${Math.random()}`
        }
        opts.onMessage?.(message)
      })

      socket.on('live-update', (data) => {
        if (!mountedRef.current) return
        const message: WebSocketMessage = {
          type: 'LIVE_UPDATE',
          payload: data,
          timestamp: new Date(),
          id: `live-${Date.now()}-${Math.random()}`
        }
        opts.onMessage?.(message)
      })

      socket.connect()

    } catch (err) {
      if (!mountedRef.current) return
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to create socket connection'
      updateState('error', false, false, errorMessage)
      opts.onError?.(new Error(errorMessage))
      
      if (!isManualDisconnectRef.current) {
        handleReconnect()
      }
    }
  }, [opts, clearTimeouts, updateState, handleReconnect])

  const disconnect = useCallback(() => {
    isManualDisconnectRef.current = true
    clearTimeouts()
    
    if (socketRef.current) {
      socketRef.current.removeAllListeners()
      socketRef.current.close()
      socketRef.current = null
    }
    
    setReconnectAttempts(0)
    updateState('disconnected', false, false, null)
  }, [clearTimeouts, updateState])

  const emit = useCallback((event: string, data?: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data)
    } else {
      console.warn(`Cannot emit '${event}': WebSocket not connected`)
    }
  }, [])

  const subscribe = useCallback((channel: string) => {
    emit('subscribe', channel)
  }, [emit])

  const unsubscribe = useCallback((channel: string) => {
    emit('unsubscribe', channel)
  }, [emit])

  // Auto-connect on mount
  useEffect(() => {
    if (opts.autoConnect) {
      connect()
    }

    return () => {
      mountedRef.current = false
      disconnect()
    }
  }, [opts.autoConnect, connect, disconnect])

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden - reduce reconnection frequency
        clearTimeouts()
      } else if (!socketRef.current?.connected && !isManualDisconnectRef.current) {
        // Page is visible and not connected - attempt to reconnect
        setReconnectAttempts(0)
        connect()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [connect, clearTimeouts])

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      if (!socketRef.current?.connected && !isManualDisconnectRef.current) {
        setReconnectAttempts(0)
        connect()
      }
    }

    const handleOffline = () => {
      updateState('disconnected', false, false, 'Network offline')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [connect, updateState])

  return {
    socket: socketRef.current,
    connected,
    connecting,
    status,
    error,
    reconnectAttempts,
    lastConnected,
    lastMessage,
    connect,
    disconnect,
    emit,
    subscribe,
    unsubscribe
  }
}