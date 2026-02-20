'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Ranking } from '@/types'
import { cn, formatTimeAgo } from '@/lib/utils'

interface ActivityHeatmapProps {
  data: Ranking[]
  height?: number
  className?: string
}

export function ActivityHeatmap({ data, height = 384, className }: ActivityHeatmapProps) {
  const [hoveredCell, setHoveredCell] = React.useState<{ day: number; hour: number } | null>(null)
  
  if (!data || data.length === 0) {
    return (
      <div className={cn("flex items-center justify-center bg-muted/20 rounded-lg", className)} style={{ height }}>
        <p className="text-muted-foreground">No activity data available</p>
      </div>
    )
  }

  // Generate activity heatmap data (simulated based on recent activity)
  const generateHeatmapData = () => {
    const days = 7 // Week view
    const hours = 24
    const heatmapData: number[][] = Array(days).fill(0).map(() => Array(hours).fill(0))

    // Simulate activity based on collaborator data
    data.forEach(collaborator => {
      const activityTime = collaborator.recentActivity
      const now = new Date()
      const daysDiff = Math.floor((now.getTime() - activityTime.getTime()) / (24 * 60 * 60 * 1000))
      
      if (daysDiff < days) {
        const hour = activityTime.getHours()
        const day = daysDiff
        heatmapData[day]![hour]! += collaborator.completedTasks * 0.1
      }
    })

    return heatmapData
  }

  const heatmapData = generateHeatmapData()
  const maxActivity = Math.max(...heatmapData.flat())
  
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'))

  const getIntensity = (value: number): number => {
    if (maxActivity === 0) return 0
    return Math.min(value / maxActivity, 1)
  }

  const getColor = (intensity: number): string => {
    if (intensity === 0) return 'rgb(241, 245, 249)' // slate-100
    if (intensity < 0.2) return 'rgb(186, 230, 253)' // sky-200
    if (intensity < 0.4) return 'rgb(125, 211, 252)' // sky-300
    if (intensity < 0.6) return 'rgb(56, 189, 248)' // sky-400
    if (intensity < 0.8) return 'rgb(14, 165, 233)' // sky-500
    return 'rgb(2, 132, 199)' // sky-600
  }

  return (
    <div className={cn("relative w-full bg-card rounded-lg border p-4", className)} style={{ height }}>
      
      {/* Chart Title */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-foreground">Activity Heatmap</h4>
        <p className="text-xs text-muted-foreground">Collaboration patterns over the past week</p>
      </div>

      {/* Hour labels (top) */}
      <div className="flex justify-between mb-2 pl-12">
        {[0, 6, 12, 18, 23].map(hour => (
          <div key={hour} className="text-xs text-muted-foreground">
            {hour.toString().padStart(2, '0')}:00
          </div>
        ))}
      </div>

      {/* Main heatmap grid */}
      <div className="space-y-1">
        {heatmapData.map((dayData, dayIndex) => (
          <div key={dayIndex} className="flex items-center space-x-1">
            
            {/* Day label */}
            <div className="w-8 text-xs text-muted-foreground text-right">
              {days[dayIndex]}
            </div>

            {/* Hour cells */}
            <div className="flex space-x-1">
              {dayData.map((activity, hourIndex) => {
                const intensity = getIntensity(activity)
                const isHovered = hoveredCell?.day === dayIndex && hoveredCell?.hour === hourIndex
                
                return (
                  <motion.div
                    key={hourIndex}
                    className={cn(
                      "w-4 h-4 rounded-sm cursor-pointer border",
                      isHovered ? "border-primary" : "border-transparent"
                    )}
                    style={{ 
                      backgroundColor: getColor(intensity),
                    }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ 
                      scale: isHovered ? 1.2 : 1, 
                      opacity: 1 
                    }}
                    transition={{ 
                      duration: 0.2,
                      delay: (dayIndex * 24 + hourIndex) * 0.005 
                    }}
                    whileHover={{ scale: 1.3 }}
                    onMouseEnter={() => setHoveredCell({ day: dayIndex, hour: hourIndex })}
                    onMouseLeave={() => setHoveredCell(null)}
                  />
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          <span>Less</span>
          <div className="flex space-x-1">
            {[0, 0.2, 0.4, 0.6, 0.8, 1].map(intensity => (
              <div
                key={intensity}
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: getColor(intensity) }}
              />
            ))}
          </div>
          <span>More</span>
        </div>
        
        <div className="text-xs text-muted-foreground">
          {data.filter(d => 
            Date.now() - d.recentActivity.getTime() < 7 * 24 * 60 * 60 * 1000
          ).length} active this week
        </div>
      </div>

      {/* Tooltip */}
      {hoveredCell && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-popover border border-border rounded-lg p-3 shadow-lg z-10"
        >
          <div className="text-sm font-medium text-foreground mb-1">
            {days[hoveredCell.day]} {hoveredCell.hour}:00
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            <div>Activity Level: {heatmapData[hoveredCell.day]![hoveredCell.hour]!.toFixed(1)}</div>
            <div>
              Intensity: {Math.round(getIntensity(heatmapData[hoveredCell.day]![hoveredCell.hour]!) * 100)}%
            </div>
          </div>
        </motion.div>
      )}

      {/* Weekly stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="mt-6 grid grid-cols-3 gap-4 pt-4 border-t border-border"
      >
        <div className="text-center">
          <div className="text-lg font-bold text-foreground">
            {data.filter(d => 
              Date.now() - d.recentActivity.getTime() < 24 * 60 * 60 * 1000
            ).length}
          </div>
          <div className="text-xs text-muted-foreground">Active Today</div>
        </div>
        
        <div className="text-center">
          <div className="text-lg font-bold text-foreground">
            {Math.round(heatmapData.flat().reduce((a, b) => a + b, 0) / 7)}
          </div>
          <div className="text-xs text-muted-foreground">Daily Average</div>
        </div>
        
        <div className="text-center">
          <div className="text-lg font-bold text-foreground">
            {Math.max(...heatmapData.flat()).toFixed(1)}
          </div>
          <div className="text-xs text-muted-foreground">Peak Activity</div>
        </div>
      </motion.div>
    </div>
  )
}