'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Ranking } from '@/types'
import { cn } from '@/lib/utils'

interface PerformanceRadarProps {
  data: Ranking[]
  height?: number
  className?: string
}

export function PerformanceRadar({ data, height = 256, className }: PerformanceRadarProps) {
  const [selectedCollaborator, setSelectedCollaborator] = React.useState<number>(0)
  
  if (!data || data.length === 0) {
    return (
      <div className={cn("flex items-center justify-center bg-muted/20 rounded-lg", className)} style={{ height }}>
        <p className="text-muted-foreground">No performance data available</p>
      </div>
    )
  }

  const metrics = [
    { name: 'Tasks', key: 'completedTasks', max: Math.max(...data.map(d => d.completedTasks)) },
    { name: 'Success Rate', key: 'successRate', max: 1 },
    { name: 'Earnings Rank', key: 'rank', max: data.length, invert: true },
    { name: 'Recent Activity', key: 'activity', max: 7 }, // days ago
    { name: 'Consistency', key: 'consistency', max: 100 },
  ]

  const radius = Math.min(height, 200) / 2 - 40
  const centerX = radius + 40
  const centerY = height / 2
  const numMetrics = metrics.length

  // Calculate radar points for selected collaborator
  const getRadarPoints = (ranking: Ranking) => {
    return metrics.map((metric, index) => {
      let value = 0
      
      switch (metric.key) {
        case 'completedTasks':
          value = ranking.completedTasks / metric.max
          break
        case 'successRate':
          value = ranking.successRate
          break
        case 'rank':
          value = (data.length - ranking.rank + 1) / data.length // Higher rank = lower number, so invert
          break
        case 'activity':
          const daysAgo = Math.min((Date.now() - ranking.recentActivity.getTime()) / (24 * 60 * 60 * 1000), 7)
          value = (7 - daysAgo) / 7
          break
        case 'consistency':
          value = ranking.successRate * 0.8 + (ranking.completedTasks / metric.max) * 0.2
          break
      }
      
      value = Math.max(0, Math.min(1, value)) // Clamp between 0 and 1
      
      const angle = (index / numMetrics) * 2 * Math.PI - Math.PI / 2
      const x = centerX + Math.cos(angle) * radius * value
      const y = centerY + Math.sin(angle) * radius * value
      
      return { x, y, value, angle, metric: metric.name }
    })
  }

  const selectedPoints = getRadarPoints(data[selectedCollaborator]!)
  const pathData = selectedPoints
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ') + ' Z'

  return (
    <div className={cn("relative w-full bg-card rounded-lg border p-4", className)} style={{ height }}>
      
      {/* Chart Title */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-foreground">Performance Radar</h4>
          <p className="text-xs text-muted-foreground">Multi-dimensional performance analysis</p>
        </div>
        
        {/* Collaborator selector */}
        <select
          value={selectedCollaborator}
          onChange={(e) => setSelectedCollaborator(Number(e.target.value))}
          className="text-xs border border-border rounded px-2 py-1 bg-background"
        >
          {data.slice(0, 10).map((ranking, index) => (
            <option key={ranking.address} value={index}>
              #{ranking.rank} {ranking.username || `${ranking.address.slice(0, 8)}...`}
            </option>
          ))}
        </select>
      </div>

      {/* SVG Radar Chart */}
      <svg width="100%" height={height - 80} className="overflow-visible">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Grid circles */}
        {[0.2, 0.4, 0.6, 0.8, 1].map((scale, index) => (
          <circle
            key={index}
            cx={centerX}
            cy={centerY}
            r={radius * scale}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth="1"
            strokeOpacity="0.3"
          />
        ))}

        {/* Axis lines and labels */}
        {metrics.map((metric, index) => {
          const angle = (index / numMetrics) * 2 * Math.PI - Math.PI / 2
          const endX = centerX + Math.cos(angle) * radius
          const endY = centerY + Math.sin(angle) * radius
          
          // Label position (slightly outside the circle)
          const labelRadius = radius + 20
          const labelX = centerX + Math.cos(angle) * labelRadius
          const labelY = centerY + Math.sin(angle) * labelRadius
          
          return (
            <g key={index}>
              <line
                x1={centerX}
                y1={centerY}
                x2={endX}
                y2={endY}
                stroke="hsl(var(--border))"
                strokeWidth="1"
                strokeOpacity="0.5"
              />
              <text
                x={labelX}
                y={labelY}
                textAnchor="middle"
                dominantBaseline="central"
                className="text-xs fill-muted-foreground font-medium"
              >
                {metric.name}
              </text>
            </g>
          )
        })}

        {/* Radar area */}
        <motion.path
          d={pathData}
          fill="rgb(59, 130, 246)"
          fillOpacity="0.2"
          stroke="rgb(59, 130, 246)"
          strokeWidth="2"
          filter="url(#glow)"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
        />

        {/* Data points */}
        {selectedPoints.map((point, index) => (
          <motion.circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="4"
            fill="rgb(59, 130, 246)"
            stroke="white"
            strokeWidth="2"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ 
              duration: 0.3, 
              delay: index * 0.1 + 0.5,
              type: "spring",
              stiffness: 200
            }}
            className="cursor-pointer"
          />
        ))}

        {/* Value labels on points */}
        {selectedPoints.map((point, index) => (
          <motion.text
            key={`label-${index}`}
            x={point.x}
            y={point.y - 15}
            textAnchor="middle"
            className="text-xs fill-foreground font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.1 + 0.8 }}
          >
            {metrics[index]?.key === 'successRate' 
              ? `${Math.round(point.value * 100)}%`
              : Math.round(point.value * metrics[index]!.max)}
          </motion.text>
        ))}
      </svg>

      {/* Performance scores */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="mt-4 grid grid-cols-5 gap-2 text-center"
      >
        {selectedPoints.map((point, index) => (
          <div key={index} className="space-y-1">
            <div className="text-xs text-muted-foreground">
              {point.metric}
            </div>
            <div 
              className={cn(
                "text-lg font-bold",
                point.value >= 0.8 ? "text-green-500" :
                point.value >= 0.6 ? "text-yellow-500" :
                point.value >= 0.4 ? "text-orange-500" : "text-red-500"
              )}
            >
              {metrics[index]?.key === 'successRate' 
                ? `${Math.round(point.value * 100)}%`
                : metrics[index]?.key === 'rank'
                  ? `#${data[selectedCollaborator]?.rank}`
                  : Math.round(point.value * metrics[index]!.max)
              }
            </div>
          </div>
        ))}
      </motion.div>

      {/* Overall score */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.2 }}
        className="mt-4 text-center p-3 bg-muted/20 rounded-lg"
      >
        <div className="text-sm text-muted-foreground mb-1">Overall Performance Score</div>
        <div className="text-2xl font-bold text-primary">
          {Math.round(selectedPoints.reduce((sum, point) => sum + point.value, 0) / selectedPoints.length * 100)}
        </div>
      </motion.div>
    </div>
  )
}