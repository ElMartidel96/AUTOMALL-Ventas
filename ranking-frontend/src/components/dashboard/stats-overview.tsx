'use client'

import React from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Coins, 
  Activity, 
  Clock,
  Award,
  Zap,
  Target,
  Globe,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SystemStats } from '@/types'
import { formatCGC, formatNumber, formatPercentage, getHealthColor, cn } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'

interface StatsOverviewProps {
  data?: SystemStats
  error?: any
  className?: string
}

export function StatsOverview({ data, error, className }: StatsOverviewProps) {
  const { preferences } = useAppStore()

  if (error) {
    return (
      <Card className={cn("bg-error/5 border-error/20", className)}>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-error mx-auto mb-2" />
          <p className="text-sm text-error">Failed to load system statistics</p>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return <StatsOverviewSkeleton className={className} />
  }

  const stats = [
    {
      id: 'total-deposited',
      title: 'Total Deposited',
      value: formatCGC(data.totalDeposited, 18, true),
      rawValue: Number(data.totalDeposited),
      icon: Coins,
      trend: 'up' as const,
      trendValue: '+12.5%',
      description: 'Total CGC deposited in escrows',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20'
    },
    {
      id: 'total-released',
      title: 'Total Released',
      value: formatCGC(data.totalReleased, 18, true),
      rawValue: Number(data.totalReleased),
      icon: CheckCircle,
      trend: 'up' as const,
      trendValue: '+8.3%',
      description: 'CGC released to collaborators',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20'
    },
    {
      id: 'active-collaborators',
      title: 'Active Collaborators',
      value: formatNumber(data.activeCollaborators),
      rawValue: data.activeCollaborators,
      icon: Users,
      trend: 'up' as const,
      trendValue: '+15',
      description: 'Currently active contributors',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20'
    },
    {
      id: 'completion-rate',
      title: 'Avg Completion Time',
      value: `${Math.round(data.averageCompletionTime / 3600)}h`,
      rawValue: data.averageCompletionTime,
      icon: Clock,
      trend: 'down' as const,
      trendValue: '-2.1h',
      description: 'Average time to complete tasks',
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/20'
    },
    {
      id: 'total-tasks',
      title: 'Total Tasks',
      value: formatNumber(data.totalTasks),
      rawValue: data.totalTasks,
      icon: Target,
      trend: 'up' as const,
      trendValue: '+23',
      description: 'Tasks created in the system',
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10',
      borderColor: 'border-indigo-500/20'
    },
    {
      id: 'system-health',
      title: 'System Health',
      value: data.systemHealth.charAt(0).toUpperCase() + data.systemHealth.slice(1),
      rawValue: data.systemHealth === 'healthy' ? 100 : data.systemHealth === 'warning' ? 75 : 25,
      icon: Activity,
      trend: 'stable' as const,
      trendValue: '99.9%',
      description: 'Overall system performance',
      color: getHealthColor(data.systemHealth),
      bgColor: data.systemHealth === 'healthy' ? 'bg-green-500/10' : data.systemHealth === 'warning' ? 'bg-yellow-500/10' : 'bg-red-500/10',
      borderColor: data.systemHealth === 'healthy' ? 'border-green-500/20' : data.systemHealth === 'warning' ? 'border-yellow-500/20' : 'border-red-500/20'
    }
  ]

  return (
    <div className={cn("space-y-6", className)}>
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((stat, index) => (
          <AnimatedStatCard
            key={stat.id}
            stat={stat}
            index={index}
            compact={preferences.compactMode}
            animated={preferences.showAnimations}
          />
        ))}
      </div>

      {/* Additional Metrics Bar */}
      <Card className="bg-gradient-to-r from-card via-card to-muted/20 border border-border/50">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            
            {/* Active Batches */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Globe className="h-4 w-4 text-blue-500" />
                </div>
              </div>
              <div className="text-2xl font-bold text-foreground">
                {formatNumber(data.activeBatches)}
              </div>
              <div className="text-xs text-muted-foreground">
                Active Batches
              </div>
            </div>

            {/* Completed Milestones */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Award className="h-4 w-4 text-green-500" />
                </div>
              </div>
              <div className="text-2xl font-bold text-foreground">
                {formatNumber(data.completedMilestones)}
              </div>
              <div className="text-xs text-muted-foreground">
                Completed Milestones
              </div>
            </div>

            {/* Locked Funds */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="h-8 w-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <Zap className="h-4 w-4 text-yellow-500" />
                </div>
              </div>
              <div className="text-2xl font-bold text-foreground">
                {formatCGC(data.totalLocked, 18, true)}
              </div>
              <div className="text-xs text-muted-foreground">
                Locked Funds
              </div>
            </div>

            {/* Success Rate */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-purple-500" />
                </div>
              </div>
              <div className="text-2xl font-bold text-foreground">
                {formatPercentage(
                  data.totalReleased > 0n 
                    ? Number(data.totalReleased) / (Number(data.totalReleased) + Number(data.totalDisputed))
                    : 0
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                Success Rate
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Animated Stat Card Component
interface StatCardProps {
  stat: {
    id: string
    title: string
    value: string
    rawValue: number
    icon: any
    trend: 'up' | 'down' | 'stable'
    trendValue: string
    description: string
    color: string
    bgColor: string
    borderColor: string
  }
  index: number
  compact: boolean
  animated: boolean
}

function AnimatedStatCard({ stat, index, compact, animated }: StatCardProps) {
  const IconComponent = stat.icon
  
  // Animated counter
  const spring = useSpring(stat.rawValue, { 
    stiffness: 100, 
    damping: 30,
    restDelta: 0.001
  })
  
  const displayValue = useTransform(spring, (value) => {
    if (stat.id === 'total-deposited' || stat.id === 'total-released') {
      return formatCGC(BigInt(Math.round(value)), 18, true)
    } else if (stat.id === 'completion-rate') {
      return `${Math.round(value / 3600)}h`
    } else if (stat.id === 'system-health') {
      return stat.value // Keep original text value
    } else {
      return formatNumber(Math.round(value))
    }
  })

  const containerVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        delay: index * 0.1,
        ease: "easeOut"
      }
    }
  }

  const iconVariants = {
    idle: { scale: 1, rotate: 0 },
    hover: { 
      scale: 1.1, 
      rotate: 5,
      transition: { duration: 0.2 }
    }
  }

  return (
    <motion.div
      variants={animated ? containerVariants : {}}
      initial={animated ? "hidden" : "visible"}
      animate="visible"
      whileHover={animated ? "hover" : undefined}
      className="group"
    >
      <Card className={cn(
        "relative overflow-hidden transition-all duration-300",
        "hover:shadow-lg hover:-translate-y-1 hover:border-primary/20",
        stat.borderColor,
        compact ? "p-4" : "p-6"
      )}>
        <CardContent className="p-0">
          <div className="flex items-start justify-between">
            
            {/* Left Side - Icon and Value */}
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-3">
                <motion.div 
                  className={cn("rounded-lg p-2", stat.bgColor)}
                  variants={animated ? iconVariants : {}}
                >
                  <IconComponent className={cn("h-4 w-4", stat.color)} />
                </motion.div>
                
                {!compact && (
                  <div>
                    <h3 className="font-medium text-sm text-foreground">
                      {stat.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {stat.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Value */}
              <div className="space-y-1">
                <motion.div 
                  className="text-2xl font-bold text-foreground font-mono"
                  layoutId={`value-${stat.id}`}
                >
                  {animated ? displayValue : stat.value}
                </motion.div>
                
                {compact && (
                  <div className="text-xs text-muted-foreground">
                    {stat.title}
                  </div>
                )}
              </div>
            </div>

            {/* Right Side - Trend */}
            <div className="text-right">
              <Badge 
                variant={stat.trend === 'up' ? 'success' : stat.trend === 'down' ? 'warning' : 'secondary'}
                className="text-xs"
              >
                <div className="flex items-center space-x-1">
                  {stat.trend === 'up' && <TrendingUp className="h-3 w-3" />}
                  {stat.trend === 'down' && <TrendingDown className="h-3 w-3" />}
                  {stat.trend === 'stable' && <Activity className="h-3 w-3" />}
                  <span>{stat.trendValue}</span>
                </div>
              </Badge>
            </div>
          </div>

          {/* Progress Bar (for certain metrics) */}
          {(stat.id === 'system-health') && (
            <div className="mt-4">
              <div className="h-1 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className={cn("h-full rounded-full", 
                    stat.color === 'text-success' ? 'bg-green-500' :
                    stat.color === 'text-warning' ? 'bg-yellow-500' : 'bg-red-500'
                  )}
                  initial={{ width: 0 }}
                  animate={{ width: `${stat.rawValue}%` }}
                  transition={{ duration: 1, delay: index * 0.1 }}
                />
              </div>
            </div>
          )}

          {/* Hover Overlay Effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            initial={false}
          />
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Skeleton Component
function StatsOverviewSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="h-8 w-8 bg-muted rounded-lg animate-pulse" />
                  <div className="space-y-1">
                    <div className="h-3 w-20 bg-muted rounded animate-pulse" />
                    <div className="h-2 w-24 bg-muted rounded animate-pulse" />
                  </div>
                </div>
                <div className="h-8 w-16 bg-muted rounded animate-pulse" />
              </div>
              <div className="h-5 w-12 bg-muted rounded-full animate-pulse" />
            </div>
          </Card>
        ))}
      </div>
      
      <Card className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="text-center space-y-2">
              <div className="h-8 w-8 bg-muted rounded-lg animate-pulse mx-auto" />
              <div className="h-6 w-12 bg-muted rounded animate-pulse mx-auto" />
              <div className="h-3 w-16 bg-muted rounded animate-pulse mx-auto" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

export { StatsOverview }