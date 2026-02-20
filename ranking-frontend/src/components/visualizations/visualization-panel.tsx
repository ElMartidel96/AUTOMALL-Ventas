'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Activity,
  Zap,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  RotateCcw,
  Download
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs as ShadcnTabs, TabsContent as ShadcnTabsContent, TabsList as ShadcnTabsList, TabsTrigger as ShadcnTabsTrigger } from '@/components/ui/tabs'

import { Ranking, SystemStats } from '@/types'
import { cn, formatCGC, formatNumber } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'

// Import visualization components
import { EarningsChart } from './earnings-chart'
import { TaskDistributionChart } from './task-distribution-chart'
import { ActivityHeatmap } from './activity-heatmap'
import { PerformanceRadar } from './performance-radar'
import { NetworkGraph } from './network-graph'
import { ParticleField } from './particle-field'

interface VisualizationPanelProps {
  rankings: Ranking[]
  stats?: SystemStats
  loading?: boolean
  className?: string
}

export function VisualizationPanel({ 
  rankings, 
  stats, 
  loading, 
  className 
}: VisualizationPanelProps) {
  const { preferences } = useAppStore()
  const [activeTab, setActiveTab] = React.useState('overview')
  const [isExpanded, setIsExpanded] = React.useState(false)
  const [isVisible, setIsVisible] = React.useState(true)

  // Auto-rotate visualizations
  React.useEffect(() => {
    if (!preferences.showAnimations) return
    
    const tabs = ['overview', 'distribution', 'activity', 'network']
    let currentIndex = 0
    
    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % tabs.length
      setActiveTab(tabs[currentIndex]!)
    }, 8000) // Change every 8 seconds
    
    return () => clearInterval(interval)
  }, [preferences.showAnimations])

  const handleDownload = React.useCallback(() => {
    // Export current visualization as SVG/PNG
    const element = document.getElementById(`viz-${activeTab}`)
    if (!element) return

    // Implementation would depend on the specific chart library
    console.log('Downloading visualization:', activeTab)
  }, [activeTab])

  const handleRefresh = React.useCallback(() => {
    // Force refresh data
    window.location.reload()
  }, [])

  if (!isVisible) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4"
      >
        <Eye className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <motion.div
      className={cn("space-y-4", className)}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={cn(
        "relative overflow-hidden transition-all duration-500",
        isExpanded && "fixed inset-4 z-50 max-w-none max-h-none"
      )}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <span>Analytics Dashboard</span>
              <Badge variant="secondary" className="ml-2">
                Live
              </Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Real-time visual insights into DAO performance
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              className="h-8 w-8"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDownload}
              className="h-8 w-8"
            >
              <Download className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsVisible(false)}
              className="h-8 w-8"
            >
              <EyeOff className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8"
            >
              {isExpanded ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <ShadcnTabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="px-6 border-b border-border">
              <ShadcnTabsList className="grid w-full grid-cols-4">
                <ShadcnTabsTrigger 
                  value="overview" 
                  className="flex items-center space-x-2"
                >
                  <TrendingUp className="h-4 w-4" />
                  <span>Overview</span>
                </ShadcnTabsTrigger>
                <ShadcnTabsTrigger 
                  value="distribution" 
                  className="flex items-center space-x-2"
                >
                  <PieChart className="h-4 w-4" />
                  <span>Distribution</span>
                </ShadcnTabsTrigger>
                <ShadcnTabsTrigger 
                  value="activity" 
                  className="flex items-center space-x-2"
                >
                  <Activity className="h-4 w-4" />
                  <span>Activity</span>
                </ShadcnTabsTrigger>
                <ShadcnTabsTrigger 
                  value="network" 
                  className="flex items-center space-x-2"
                >
                  <Zap className="h-4 w-4" />
                  <span>Network</span>
                </ShadcnTabsTrigger>
              </ShadcnTabsList>
            </div>

            <div className="p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className={cn(
                    "min-h-[400px]",
                    isExpanded && "min-h-[600px]"
                  )}
                >
                  
                  {/* Overview Tab */}
                  <ShadcnTabsContent value="overview" className="mt-0">
                    <div id="viz-overview" className="space-y-6">
                      <OverviewVisualization 
                        rankings={rankings} 
                        stats={stats}
                        expanded={isExpanded}
                      />
                    </div>
                  </ShadcnTabsContent>

                  {/* Distribution Tab */}
                  <ShadcnTabsContent value="distribution" className="mt-0">
                    <div id="viz-distribution" className="space-y-6">
                      <DistributionVisualization 
                        rankings={rankings}
                        expanded={isExpanded}
                      />
                    </div>
                  </ShadcnTabsContent>

                  {/* Activity Tab */}
                  <ShadcnTabsContent value="activity" className="mt-0">
                    <div id="viz-activity" className="space-y-6">
                      <ActivityVisualization 
                        rankings={rankings}
                        expanded={isExpanded}
                      />
                    </div>
                  </ShadcnTabsContent>

                  {/* Network Tab */}
                  <ShadcnTabsContent value="network" className="mt-0">
                    <div id="viz-network" className="space-y-6">
                      <NetworkVisualization 
                        rankings={rankings}
                        expanded={isExpanded}
                      />
                    </div>
                  </ShadcnTabsContent>
                </motion.div>
              </AnimatePresence>
            </div>
          </ShadcnTabs>
        </CardContent>

        {/* Background particle effect */}
        {preferences.showAnimations && (
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <ParticleField count={isExpanded ? 150 : 50} />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/5 pointer-events-none" />
      </Card>
    </motion.div>
  )
}

// Overview Visualization Component
interface VisualizationComponentProps {
  rankings: Ranking[]
  stats?: SystemStats
  expanded: boolean
}

function OverviewVisualization({ rankings, stats, expanded }: VisualizationComponentProps) {
  const topPerformers = rankings.slice(0, 10)
  const totalEarnings = rankings.reduce((sum, r) => sum + Number(r.totalEarned), 0)
  const totalTasks = rankings.reduce((sum, r) => sum + r.completedTasks, 0)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* Earnings Chart */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Earnings Distribution</h3>
          <Badge variant="outline">
            {formatCGC(BigInt(totalEarnings), 18, true)} Total
          </Badge>
        </div>
        <div className="h-64">
          <EarningsChart 
            data={topPerformers}
            height={expanded ? 400 : 256}
          />
        </div>
      </div>

      {/* Performance Radar */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Performance Metrics</h3>
          <Badge variant="outline">
            Top 5 Contributors
          </Badge>
        </div>
        <div className="h-64">
          <PerformanceRadar 
            data={rankings.slice(0, 5)}
            height={expanded ? 400 : 256}
          />
        </div>
      </div>

      {/* Key Metrics Grid */}
      {expanded && (
        <div className="lg:col-span-2">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              title="Active Contributors"
              value={rankings.length}
              change="+12%"
              trend="up"
            />
            <MetricCard
              title="Total Tasks"
              value={totalTasks}
              change="+8%"
              trend="up"
            />
            <MetricCard
              title="Avg Success Rate"
              value={`${Math.round(rankings.reduce((sum, r) => sum + r.successRate, 0) / rankings.length * 100)}%`}
              change="+2%"
              trend="up"
            />
            <MetricCard
              title="Network Health"
              value={stats?.systemHealth || "Healthy"}
              change="99.9%"
              trend="stable"
            />
          </div>
        </div>
      )}
    </div>
  )
}

// Distribution Visualization
function DistributionVisualization({ rankings, expanded }: Omit<VisualizationComponentProps, 'stats'>) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* Task Distribution Pie Chart */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Task Distribution</h3>
        <div className="h-64">
          <TaskDistributionChart 
            data={rankings}
            height={expanded ? 400 : 256}
          />
        </div>
      </div>

      {/* Earnings Distribution */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Earnings Concentration</h3>
        <div className="space-y-3">
          {rankings.slice(0, 8).map((ranking, index) => (
            <div key={ranking.address} className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-8 text-center text-sm font-medium">
                #{ranking.rank}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium truncate">
                    {ranking.username || `${ranking.address.slice(0, 8)}...`}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {formatCGC(ranking.totalEarned, 18, true)}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary to-cgc-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(Number(ranking.totalEarned) / Number(rankings[0]?.totalEarned || 1)) * 100}%` }}
                    transition={{ duration: 1, delay: index * 0.1 }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Activity Visualization
function ActivityVisualization({ rankings, expanded }: Omit<VisualizationComponentProps, 'stats'>) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Activity Patterns</h3>
        <Badge variant="outline">
          Last 30 Days
        </Badge>
      </div>
      
      <div className="h-96">
        <ActivityHeatmap 
          data={rankings}
          height={expanded ? 500 : 384}
        />
      </div>

      {expanded && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500 mb-1">
                {rankings.filter(r => Date.now() - r.recentActivity.getTime() < 24 * 60 * 60 * 1000).length}
              </div>
              <div className="text-sm text-muted-foreground">
                Active Today
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500 mb-1">
                {rankings.filter(r => Date.now() - r.recentActivity.getTime() < 7 * 24 * 60 * 60 * 1000).length}
              </div>
              <div className="text-sm text-muted-foreground">
                Active This Week
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-500 mb-1">
                {Math.round(rankings.reduce((sum, r) => sum + r.successRate, 0) / rankings.length * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">
                Avg Success Rate
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

// Network Visualization
function NetworkVisualization({ rankings, expanded }: Omit<VisualizationComponentProps, 'stats'>) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Collaboration Network</h3>
        <Badge variant="outline">
          Interactive Graph
        </Badge>
      </div>
      
      <div className="h-96 rounded-lg border border-border overflow-hidden">
        <NetworkGraph 
          data={rankings}
          height={expanded ? 500 : 384}
        />
      </div>

      <div className="text-center text-sm text-muted-foreground">
        Node size represents total earnings • Edge thickness represents collaboration frequency
      </div>
    </div>
  )
}

// Metric Card Component
interface MetricCardProps {
  title: string
  value: string | number
  change: string
  trend: 'up' | 'down' | 'stable'
}

function MetricCard({ title, value, change, trend }: MetricCardProps) {
  return (
    <Card className="p-4">
      <div className="space-y-2">
        <div className="text-sm text-muted-foreground">
          {title}
        </div>
        <div className="text-2xl font-bold">
          {value}
        </div>
        <div className={cn(
          "text-xs flex items-center space-x-1",
          trend === 'up' && "text-green-600",
          trend === 'down' && "text-red-600",
          trend === 'stable' && "text-muted-foreground"
        )}>
          {trend === 'up' && <TrendingUp className="h-3 w-3" />}
          {trend === 'down' && <TrendingUp className="h-3 w-3 rotate-180" />}
          <span>{change}</span>
        </div>
      </div>
    </Card>
  )
}

// Tabs components (simplified)
const Tabs = ({ 
  value, 
  onValueChange, 
  children, 
  className 
}: { 
  value: string
  onValueChange: (value: string) => void
  children: React.ReactNode
  className?: string 
}) => (
  <div className={className}>{children}</div>
)

const TabsList = ({ 
  children, 
  className 
}: { 
  children: React.ReactNode
  className?: string 
}) => (
  <div className={cn("flex space-x-1 bg-muted p-1 rounded-lg", className)}>
    {children}
  </div>
)

const TabsTrigger = ({ 
  value, 
  children, 
  className 
}: { 
  value: string
  children: React.ReactNode
  className?: string 
}) => (
  <button className={cn("flex-1 px-3 py-2 rounded-md text-sm transition-colors", className)}>
    {children}
  </button>
)

const TabsContent = ({ 
  value, 
  children, 
  className 
}: { 
  value: string
  children: React.ReactNode
  className?: string 
}) => (
  <div className={className}>{children}</div>
)

export { 
  VisualizationPanel
}