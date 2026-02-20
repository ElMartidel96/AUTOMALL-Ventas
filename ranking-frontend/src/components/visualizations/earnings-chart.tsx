'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Ranking } from '@/types'
import { formatCGC, cn } from '@/lib/utils'

interface EarningsChartProps {
  data: Ranking[]
  height?: number
  className?: string
}

export function EarningsChart({ data, height = 256, className }: EarningsChartProps) {
  const [hoveredBar, setHoveredBar] = React.useState<number | null>(null)
  
  if (!data || data.length === 0) {
    return (
      <div className={cn("flex items-center justify-center bg-muted/20 rounded-lg", className)} style={{ height }}>
        <p className="text-muted-foreground">No earnings data available</p>
      </div>
    )
  }

  const maxEarnings = Math.max(...data.map(d => Number(d.totalEarned)))
  const minEarnings = Math.min(...data.map(d => Number(d.totalEarned)))
  const range = maxEarnings - minEarnings

  return (
    <div className={cn("relative w-full bg-card rounded-lg border p-4", className)} style={{ height }}>
      
      {/* Chart Title */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-foreground">Top Contributors by Earnings</h4>
        <p className="text-xs text-muted-foreground">Interactive earnings distribution</p>
      </div>

      {/* Y-Axis Labels */}
      <div className="absolute left-2 top-16 bottom-8 flex flex-col justify-between text-xs text-muted-foreground">
        <span>{formatCGC(BigInt(maxEarnings), 18, true)}</span>
        <span>{formatCGC(BigInt(maxEarnings * 0.75), 18, true)}</span>
        <span>{formatCGC(BigInt(maxEarnings * 0.5), 18, true)}</span>
        <span>{formatCGC(BigInt(maxEarnings * 0.25), 18, true)}</span>
        <span>0</span>
      </div>

      {/* Chart Area */}
      <div className="ml-16 mr-4 mt-8 mb-8 h-full relative">
        
        {/* Grid Lines */}
        <svg className="absolute inset-0 w-full h-full">
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
            <line
              key={index}
              x1="0"
              y1={`${(1 - ratio) * 100}%`}
              x2="100%"
              y2={`${(1 - ratio) * 100}%`}
              stroke="hsl(var(--border))"
              strokeWidth="1"
              strokeOpacity="0.3"
            />
          ))}
        </svg>

        {/* Bars */}
        <div className="flex items-end justify-between h-full space-x-1">
          {data.slice(0, 12).map((ranking, index) => {
            const earnings = Number(ranking.totalEarned)
            const heightPercentage = range > 0 ? ((earnings - minEarnings) / range) * 100 : 0
            const isHovered = hoveredBar === index
            
            return (
              <div
                key={ranking.address}
                className="relative flex-1 group cursor-pointer"
                onMouseEnter={() => setHoveredBar(index)}
                onMouseLeave={() => setHoveredBar(null)}
              >
                {/* Bar */}
                <motion.div
                  className={cn(
                    "w-full rounded-t-md relative overflow-hidden",
                    "bg-gradient-to-t from-primary via-primary/80 to-cgc-500",
                    isHovered && "from-primary/90 via-primary/70 to-cgc-500/90"
                  )}
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(heightPercentage, 2)}%` }}
                  transition={{ 
                    duration: 0.8, 
                    delay: index * 0.1,
                    ease: "easeOut"
                  }}
                  whileHover={{
                    scale: 1.05,
                    transition: { duration: 0.2 }
                  }}
                >
                  {/* Rank badge */}
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                    <div className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white",
                      ranking.rank === 1 ? "bg-yellow-500" :
                      ranking.rank === 2 ? "bg-gray-400" :
                      ranking.rank === 3 ? "bg-orange-600" : "bg-blue-500"
                    )}>
                      {ranking.rank}
                    </div>
                  </div>

                  {/* Shimmer effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-t from-transparent via-white/20 to-transparent -translate-x-full"
                    animate={{
                      x: isHovered ? "200%" : "-100%"
                    }}
                    transition={{ 
                      duration: isHovered ? 0.6 : 0,
                      ease: "easeInOut"
                    }}
                  />
                </motion.div>

                {/* Collaborator info */}
                <div className="mt-2 text-center">
                  <div className="text-xs font-medium text-foreground truncate">
                    {ranking.username || `${ranking.address.slice(0, 6)}...`}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {ranking.completedTasks} tasks
                  </div>
                </div>

                {/* Hover tooltip */}
                <AnimatePresence>
                  {isHovered && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.9 }}
                      className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-10"
                    >
                      <div className="bg-popover border border-border rounded-lg p-3 shadow-lg min-w-[200px]">
                        <div className="text-sm font-medium text-foreground mb-1">
                          {ranking.username || formatAddress(ranking.address)}
                        </div>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <div className="flex justify-between">
                            <span>Rank:</span>
                            <span className="font-medium">#{ranking.rank}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Earnings:</span>
                            <span className="font-medium">{formatCGC(ranking.totalEarned, 18, true)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Tasks:</span>
                            <span className="font-medium">{ranking.completedTasks}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Success Rate:</span>
                            <span className="font-medium">{Math.round(ranking.successRate * 100)}%</span>
                          </div>
                        </div>
                      </div>
                      {/* Tooltip arrow */}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-popover" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </div>

      {/* X-Axis Label */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs text-muted-foreground">
        Contributors (Top {Math.min(data.length, 12)})
      </div>

      {/* Legend */}
      <div className="absolute top-4 right-4 flex items-center space-x-4 text-xs">
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded bg-gradient-to-t from-primary to-cgc-500" />
          <span className="text-muted-foreground">Total Earnings</span>
        </div>
      </div>
    </div>
  )
}