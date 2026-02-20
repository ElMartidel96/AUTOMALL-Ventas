'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useWebSocket } from '@/hooks/use-websocket'

interface ConnectionStatusProps {
  className?: string
  showDetails?: boolean
  position?: 'fixed' | 'relative'
}

export function ConnectionStatus({ 
  className, 
  showDetails = false, 
  position = 'fixed' 
}: ConnectionStatusProps) {
  const { 
    isConnected, 
    isConnecting, 
    lastMessage, 
    error, 
    reconnectAttempts,
    connectionId 
  } = useWebSocket()
  
  const [isExpanded, setIsExpanded] = React.useState(false)
  const [lastPingTime, setLastPingTime] = React.useState<Date>(new Date())

  React.useEffect(() => {
    if (lastMessage) {
      setLastPingTime(new Date())
    }
  }, [lastMessage])

  const getStatusColor = () => {
    if (error) return 'bg-red-500'
    if (isConnecting) return 'bg-yellow-500'
    if (isConnected) return 'bg-green-500'
    return 'bg-gray-500'
  }

  const getStatusText = () => {
    if (error) return 'Connection Error'
    if (isConnecting) return 'Connecting...'
    if (isConnected) return 'Connected'
    return 'Disconnected'
  }

  const getStatusIcon = () => {
    if (error) return '⚠️'
    if (isConnecting) return '🔄'
    if (isConnected) return '✅'
    return '❌'
  }

  const formatConnectionId = (id?: string) => {
    if (!id) return 'Unknown'
    return id.slice(0, 8) + '...'
  }

  const timeSinceLastPing = () => {
    const diff = Date.now() - lastPingTime.getTime()
    if (diff < 1000) return 'Just now'
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    return `${Math.floor(diff / 3600000)}h ago`
  }

  const StatusIndicator = () => (
    <motion.div
      className={cn(
        "flex items-center space-x-2 px-3 py-2 rounded-full text-xs font-medium",
        "bg-card border border-border shadow-sm",
        "cursor-pointer transition-all duration-200",
        isExpanded && "rounded-lg",
        className
      )}
      onClick={() => showDetails && setIsExpanded(!isExpanded)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Status Dot with Pulse Animation */}
      <motion.div
        className={cn("w-2 h-2 rounded-full", getStatusColor())}
        animate={isConnected ? {
          scale: [1, 1.2, 1],
          opacity: [1, 0.7, 1]
        } : isConnecting ? {
          rotate: 360
        } : {}}
        transition={
          isConnected 
            ? { duration: 2, repeat: Infinity, ease: "easeInOut" }
            : isConnecting
            ? { duration: 1, repeat: Infinity, ease: "linear" }
            : {}
        }
      />
      
      {/* Status Text */}
      <span className="text-foreground">
        {getStatusText()}
      </span>

      {/* Status Icon */}
      <span className="text-xs">
        {getStatusIcon()}
      </span>

      {/* Reconnection Indicator */}
      {reconnectAttempts > 0 && (
        <motion.span
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded dark:bg-yellow-900/20 dark:text-yellow-400"
        >
          #{reconnectAttempts}
        </motion.span>
      )}
    </motion.div>
  )

  const DetailedView = () => (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="mt-2 p-4 bg-popover border border-border rounded-lg shadow-lg"
    >
      <div className="space-y-3 text-xs">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Connection Status:</span>
          <span className={cn(
            "font-medium",
            isConnected ? "text-green-500" : error ? "text-red-500" : "text-yellow-500"
          )}>
            {getStatusText()}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Connection ID:</span>
          <span className="font-mono text-foreground">
            {formatConnectionId(connectionId)}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Last Activity:</span>
          <span className="text-foreground">
            {timeSinceLastPing()}
          </span>
        </div>

        {reconnectAttempts > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Reconnect Attempts:</span>
            <span className="text-yellow-500 font-medium">
              {reconnectAttempts}
            </span>
          </div>
        )}

        {error && (
          <div className="pt-2 border-t border-border">
            <div className="text-muted-foreground mb-1">Error Details:</div>
            <div className="text-red-500 text-xs bg-red-50 dark:bg-red-900/20 p-2 rounded">
              {error}
            </div>
          </div>
        )}

        {lastMessage && (
          <div className="pt-2 border-t border-border">
            <div className="text-muted-foreground mb-1">Last Message:</div>
            <div className="text-foreground font-mono text-xs bg-muted p-2 rounded max-h-20 overflow-y-auto">
              {JSON.stringify(lastMessage, null, 2)}
            </div>
          </div>
        )}
      </div>

      <button
        onClick={() => setIsExpanded(false)}
        className="mt-3 text-xs text-primary hover:underline"
      >
        Hide Details
      </button>
    </motion.div>
  )

  return (
    <div className={cn(
      position === 'fixed' && "fixed bottom-4 right-4 z-50",
      position === 'relative' && "relative"
    )}>
      <StatusIndicator />
      
      <AnimatePresence>
        {isExpanded && showDetails && <DetailedView />}
      </AnimatePresence>
    </div>
  )
}

// Compact version for headers or toolbars
export function ConnectionStatusCompact({ className }: { className?: string }) {
  const { isConnected, isConnecting, error } = useWebSocket()

  const getStatusColor = () => {
    if (error) return 'text-red-500'
    if (isConnecting) return 'text-yellow-500'
    if (isConnected) return 'text-green-500'
    return 'text-gray-500'
  }

  return (
    <motion.div
      className={cn("flex items-center space-x-1", className)}
      whileHover={{ scale: 1.05 }}
    >
      <motion.div
        className={cn("w-1.5 h-1.5 rounded-full", 
          error ? "bg-red-500" :
          isConnecting ? "bg-yellow-500" :
          isConnected ? "bg-green-500" : "bg-gray-500"
        )}
        animate={isConnected ? {
          scale: [1, 1.3, 1],
          opacity: [1, 0.6, 1]
        } : isConnecting ? {
          rotate: 360
        } : {}}
        transition={
          isConnected 
            ? { duration: 2, repeat: Infinity, ease: "easeInOut" }
            : isConnecting
            ? { duration: 1, repeat: Infinity, ease: "linear" }
            : {}
        }
      />
      <span className={cn("text-xs font-medium", getStatusColor())}>
        {isConnected ? 'Live' : isConnecting ? 'Connecting' : 'Offline'}
      </span>
    </motion.div>
  )
}