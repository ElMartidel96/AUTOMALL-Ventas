'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn, formatTimeAgo, formatTokenAmount, formatAddress } from '@/lib/utils'

interface Activity {
  id: string
  type: 'task_completion' | 'milestone_reached' | 'token_distribution' | 'rank_change'
  collaborator: {
    address: string
    username?: string
    avatar?: string
  }
  timestamp: Date
  data: {
    taskId?: string
    taskTitle?: string
    amount?: string
    previousRank?: number
    newRank?: number
    milestone?: string
  }
}

interface LiveActivityProps {
  activities?: Activity[]
  maxItems?: number
  className?: string
}

export function LiveActivity({ activities = [], maxItems = 15, className }: LiveActivityProps) {
  const [visibleActivities, setVisibleActivities] = React.useState<Activity[]>([])
  const [isExpanded, setIsExpanded] = React.useState(false)

  React.useEffect(() => {
    const displayCount = isExpanded ? maxItems : Math.min(5, maxItems)
    setVisibleActivities(activities.slice(0, displayCount))
  }, [activities, maxItems, isExpanded])

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'task_completion':
        return '✅'
      case 'milestone_reached':
        return '🎯'
      case 'token_distribution':
        return '💎'
      case 'rank_change':
        return '📊'
      default:
        return '🔄'
    }
  }

  const getActivityColor = (type: Activity['type']) => {
    switch (type) {
      case 'task_completion':
        return 'text-green-500'
      case 'milestone_reached':
        return 'text-blue-500'
      case 'token_distribution':
        return 'text-purple-500'
      case 'rank_change':
        return 'text-orange-500'
      default:
        return 'text-gray-500'
    }
  }

  const formatActivityDescription = (activity: Activity) => {
    const { type, collaborator, data } = activity
    const name = collaborator.username || formatAddress(collaborator.address as `0x${string}`, true)

    switch (type) {
      case 'task_completion':
        return (
          <span>
            <span className="font-medium text-foreground">{name}</span> completed task{' '}
            <span className="font-medium text-primary">
              {data.taskTitle || `#${data.taskId}`}
            </span>
          </span>
        )
      case 'milestone_reached':
        return (
          <span>
            <span className="font-medium text-foreground">{name}</span> reached milestone{' '}
            <span className="font-medium text-blue-500">{data.milestone}</span>
          </span>
        )
      case 'token_distribution':
        return (
          <span>
            <span className="font-medium text-foreground">{name}</span> received{' '}
            <span className="font-medium text-purple-500">
              {formatTokenAmount(data.amount || '0')} CGC
            </span>
          </span>
        )
      case 'rank_change':
        const isImprovement = (data.newRank || 0) < (data.previousRank || 0)
        return (
          <span>
            <span className="font-medium text-foreground">{name}</span>{' '}
            <span className={isImprovement ? 'text-green-500' : 'text-red-500'}>
              {isImprovement ? 'climbed' : 'dropped'}
            </span>{' '}
            to rank{' '}
            <span className="font-bold text-orange-500">#{data.newRank}</span>
            {data.previousRank && (
              <span className="text-muted-foreground text-xs ml-1">
                (from #{data.previousRank})
              </span>
            )}
          </span>
        )
      default:
        return <span>Unknown activity</span>
    }
  }

  if (activities.length === 0) {
    return (
      <div className={cn("bg-card rounded-lg border p-6", className)}>
        <div className="text-center">
          <div className="text-muted-foreground text-sm mb-2">No recent activity</div>
          <div className="text-xs text-muted-foreground">
            Activities will appear here in real-time
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("bg-card rounded-lg border", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center space-x-2">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-2 h-2 bg-green-500 rounded-full"
          />
          <h3 className="font-medium text-sm text-foreground">Live Activity</h3>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
            {activities.length} events
          </span>
        </div>

        {activities.length > 5 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-primary hover:underline"
          >
            {isExpanded ? 'Show Less' : 'Show All'}
          </button>
        )}
      </div>

      {/* Activity Feed */}
      <div className="max-h-96 overflow-y-auto">
        <AnimatePresence mode="wait">
          {visibleActivities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20, height: 0 }}
              animate={{ opacity: 1, x: 0, height: 'auto' }}
              exit={{ opacity: 0, x: 20, height: 0 }}
              transition={{
                duration: 0.3,
                delay: index * 0.05,
                type: "spring",
                stiffness: 200
              }}
              className="flex items-start space-x-3 p-4 border-b border-border/50 hover:bg-muted/30 transition-colors"
            >
              {/* Activity Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  duration: 0.4,
                  delay: index * 0.05 + 0.2,
                  type: "spring",
                  stiffness: 300
                }}
                className={cn(
                  "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm",
                  "bg-gradient-to-br from-muted to-muted/50 border border-border"
                )}
              >
                <span className={getActivityColor(activity.type)}>
                  {getActivityIcon(activity.type)}
                </span>
              </motion.div>

              {/* Activity Content */}
              <div className="flex-1 min-w-0">
                <div className="text-sm text-muted-foreground leading-relaxed">
                  {formatActivityDescription(activity)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {formatTimeAgo(activity.timestamp)}
                </div>
              </div>

              {/* Activity Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.2,
                  delay: index * 0.05 + 0.3,
                }}
                className={cn(
                  "flex-shrink-0 px-2 py-1 rounded text-xs font-medium",
                  activity.type === 'task_completion' && "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
                  activity.type === 'milestone_reached' && "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
                  activity.type === 'token_distribution' && "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400",
                  activity.type === 'rank_change' && "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400"
                )}
              >
                {activity.type.replace('_', ' ')}
              </motion.div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Footer */}
      {activities.length > 0 && (
        <div className="p-3 border-t border-border bg-muted/20">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Showing {visibleActivities.length} of {activities.length} activities
            </span>
            <span>
              Last updated: {formatTimeAgo(activities[0]?.timestamp || new Date())}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}