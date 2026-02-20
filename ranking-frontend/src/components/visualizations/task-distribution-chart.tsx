'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Ranking } from '@/types'
import { cn } from '@/lib/utils'

interface TaskDistributionChartProps {
  data: Ranking[]
  height?: number
  className?: string
}

export function TaskDistributionChart({ data, height = 256, className }: TaskDistributionChartProps) {
  const [hoveredSegment, setHoveredSegment] = React.useState<number | null>(null)
  
  if (!data || data.length === 0) {
    return (
      <div className={cn("flex items-center justify-center bg-muted/20 rounded-lg", className)} style={{ height }}>
        <p className="text-muted-foreground">No task distribution data available</p>
      </div>
    )
  }

  // Calculate task distribution
  const taskRanges = [
    { label: '1-5 Tasks', min: 1, max: 5, color: 'rgb(59, 130, 246)', count: 0 },
    { label: '6-15 Tasks', min: 6, max: 15, color: 'rgb(16, 185, 129)', count: 0 },
    { label: '16-30 Tasks', min: 16, max: 30, color: 'rgb(245, 158, 11)', count: 0 },
    { label: '31-50 Tasks', min: 31, max: 50, color: 'rgb(239, 68, 68)', count: 0 },
    { label: '50+ Tasks', min: 51, max: Infinity, color: 'rgb(139, 92, 246)', count: 0 }
  ]

  data.forEach(ranking => {
    const tasks = ranking.completedTasks
    const range = taskRanges.find(r => tasks >= r.min && tasks <= r.max)
    if (range) range.count++
  })

  const total = data.length
  const radius = Math.min(height, 300) / 2 - 40
  const centerX = radius + 40
  const centerY = height / 2

  let currentAngle = -Math.PI / 2 // Start at top

  return (
    <div className={cn("relative w-full bg-card rounded-lg border p-4", className)} style={{ height }}>
      
      {/* Chart Title */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-foreground">Task Distribution</h4>
        <p className="text-xs text-muted-foreground">Contributors grouped by task completion</p>
      </div>

      {/* SVG Chart */}
      <svg width="100%" height={height - 80} className="overflow-visible">
        <defs>
          {taskRanges.map((range, index) => (
            <filter key={index} id={`shadow-${index}`}>
              <feDropShadow dx="2" dy="2" stdDeviation="3" floodOpacity="0.3"/>
            </filter>
          ))}
        </defs>
        
        {taskRanges.map((range, index) => {
          if (range.count === 0) return null

          const percentage = range.count / total
          const angle = percentage * 2 * Math.PI
          const isHovered = hoveredSegment === index

          const startX = centerX + Math.cos(currentAngle) * radius
          const startY = centerY + Math.sin(currentAngle) * radius
          
          const endAngle = currentAngle + angle
          const endX = centerX + Math.cos(endAngle) * radius
          const endY = centerY + Math.sin(endAngle) * radius
          
          const largeArcFlag = angle > Math.PI ? 1 : 0
          
          const pathData = [
            `M ${centerX} ${centerY}`,
            `L ${startX} ${startY}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
            'Z'
          ].join(' ')

          // Calculate label position
          const labelAngle = currentAngle + angle / 2
          const labelRadius = radius * 0.7
          const labelX = centerX + Math.cos(labelAngle) * labelRadius
          const labelY = centerY + Math.sin(labelAngle) * labelRadius

          const segment = (
            <g key={index}>
              <motion.path
                d={pathData}
                fill={range.color}
                stroke="white"
                strokeWidth="2"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ 
                  opacity: isHovered ? 0.9 : 0.8,
                  scale: isHovered ? 1.05 : 1
                }}
                transition={{ 
                  duration: 0.6, 
                  delay: index * 0.1,
                  type: "spring",
                  stiffness: 100
                }}
                style={{ 
                  filter: isHovered ? `url(#shadow-${index})` : 'none',
                  transformOrigin: `${centerX}px ${centerY}px`,
                  cursor: 'pointer'
                }}
                onMouseEnter={() => setHoveredSegment(index)}
                onMouseLeave={() => setHoveredSegment(null)}
              />
              
              {/* Percentage label */}
              {percentage > 0.05 && (
                <motion.text
                  x={labelX}
                  y={labelY}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="text-xs font-medium fill-white"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.1 + 0.3 }}
                >
                  {Math.round(percentage * 100)}%
                </motion.text>
              )}
            </g>
          )

          currentAngle = endAngle
          return segment
        })}

        {/* Center circle with total count */}
        <motion.circle
          cx={centerX}
          cy={centerY}
          r={radius * 0.3}
          fill="hsl(var(--card))"
          stroke="hsl(var(--border))"
          strokeWidth="2"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        />
        <motion.text
          x={centerX}
          y={centerY - 8}
          textAnchor="middle"
          dominantBaseline="central"
          className="text-lg font-bold fill-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          {total}
        </motion.text>
        <motion.text
          x={centerX}
          y={centerY + 8}
          textAnchor="middle"
          dominantBaseline="central"
          className="text-xs fill-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          Contributors
        </motion.text>
      </svg>

      {/* Legend */}
      <div className="absolute top-4 right-4 space-y-1">
        {taskRanges.map((range, index) => {
          if (range.count === 0) return null
          
          return (
            <motion.div
              key={index}
              className={cn(
                "flex items-center space-x-2 text-xs cursor-pointer p-1 rounded",
                hoveredSegment === index && "bg-muted/50"
              )}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 + 0.5 }}
              onMouseEnter={() => setHoveredSegment(index)}
              onMouseLeave={() => setHoveredSegment(null)}
            >
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: range.color }}
              />
              <span className="text-muted-foreground">
                {range.label}
              </span>
              <span className="font-medium text-foreground">
                ({range.count})
              </span>
            </motion.div>
          )
        })}
      </div>

      {/* Hover tooltip */}
      {hoveredSegment !== null && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute bottom-4 left-4 bg-popover border border-border rounded-lg p-3 shadow-lg"
        >
          <div className="text-sm font-medium text-foreground mb-1">
            {taskRanges[hoveredSegment]?.label}
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            <div>Contributors: {taskRanges[hoveredSegment]?.count}</div>
            <div>Percentage: {Math.round((taskRanges[hoveredSegment]?.count || 0) / total * 100)}%</div>
          </div>
        </motion.div>
      )}
    </div>
  )
}