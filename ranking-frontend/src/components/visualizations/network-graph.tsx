'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Ranking } from '@/types'
import { cn, formatAddress, generateAvatar } from '@/lib/utils'

interface NetworkNode {
  id: string
  address: string
  x: number
  y: number
  size: number
  color: string
  connections: string[]
  rank: number
  username?: string
}

interface NetworkEdge {
  source: string
  target: string
  strength: number
}

interface NetworkGraphProps {
  data: Ranking[]
  height?: number
  className?: string
}

export function NetworkGraph({ data, height = 384, className }: NetworkGraphProps) {
  const [hoveredNode, setHoveredNode] = React.useState<string | null>(null)
  const [selectedNode, setSelectedNode] = React.useState<string | null>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)
  
  // Generate network data - moved before early return
  const generateNetworkData = React.useMemo(() => {
    if (!data || data.length === 0) {
      return { nodes: [], edges: [] };
    }
    const width = 600
    const graphHeight = height - 40

    // Create nodes based on top collaborators
    const topCollaborators = data.slice(0, 20)
    const centerX = width / 2
    const centerY = graphHeight / 2
    
    const nodes: NetworkNode[] = topCollaborators.map((collaborator, index) => {
      // Position nodes in a circular layout with some randomness
      const angle = (index / topCollaborators.length) * 2 * Math.PI
      const radius = Math.min(width, graphHeight) * 0.3 * (0.7 + Math.random() * 0.3)
      
      const x = centerX + Math.cos(angle) * radius
      const y = centerY + Math.sin(angle) * radius
      
      // Node size based on earnings (normalized)
      const maxEarnings = Math.max(...topCollaborators.map(c => Number(c.totalEarned)))
      const minSize = 6
      const maxSize = 20
      const size = minSize + (Number(collaborator.totalEarned) / maxEarnings) * (maxSize - minSize)
      
      // Color based on rank
      const getColor = (rank: number) => {
        if (rank <= 3) return 'rgb(234, 179, 8)' // yellow-500
        if (rank <= 10) return 'rgb(59, 130, 246)' // blue-500
        if (rank <= 15) return 'rgb(16, 185, 129)' // emerald-500
        return 'rgb(139, 92, 246)' // violet-500
      }
      
      return {
        id: collaborator.address,
        address: collaborator.address,
        x,
        y,
        size,
        color: getColor(collaborator.rank),
        connections: [],
        rank: collaborator.rank,
        username: collaborator.username
      }
    })

    // Generate edges (connections) based on similar performance or activity patterns
    const edges: NetworkEdge[] = []
    
    nodes.forEach((node, i) => {
      nodes.slice(i + 1).forEach((otherNode) => {
        const nodeData = topCollaborators.find(c => c.address === node.address)!
        const otherData = topCollaborators.find(c => c.address === otherNode.address)!
        
        // Calculate connection strength based on similar metrics
        const successRateDiff = Math.abs(nodeData.successRate - otherData.successRate)
        const tasksDiff = Math.abs(nodeData.completedTasks - otherData.completedTasks)
        const maxTasks = Math.max(...topCollaborators.map(c => c.completedTasks))
        
        // Normalize differences
        const successRateSimilarity = 1 - successRateDiff
        const tasksSimilarity = 1 - (tasksDiff / maxTasks)
        
        // Calculate overall similarity
        const similarity = (successRateSimilarity + tasksSimilarity) / 2
        
        // Only create edge if similarity is above threshold
        if (similarity > 0.6) {
          const strength = similarity * Math.random() * 0.8 + 0.2
          edges.push({
            source: node.id,
            target: otherNode.id,
            strength
          })
          
          node.connections.push(otherNode.id)
          otherNode.connections.push(node.id)
        }
      })
    })

    return { nodes, edges, width, height: graphHeight }
  }, [data, height])

  const { nodes, edges, width, height: graphHeight } = generateNetworkData

  // Early return after hooks
  if (!data || data.length === 0) {
    return (
      <div className={cn("flex items-center justify-center bg-muted/20 rounded-lg", className)} style={{ height }}>
        <p className="text-muted-foreground">No network data available</p>
      </div>
    )
  }

  return (
    <div 
      ref={containerRef}
      className={cn("relative w-full bg-card rounded-lg border overflow-hidden", className)} 
      style={{ height }}
    >
      
      {/* Chart Title */}
      <div className="absolute top-2 left-4 z-10">
        <h4 className="text-sm font-medium text-foreground">Collaboration Network</h4>
        <p className="text-xs text-muted-foreground">Interconnected contributor relationships</p>
      </div>

      {/* Network Visualization */}
      <svg 
        width="100%" 
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="absolute inset-0"
      >
        <defs>
          <filter id="nodeGlow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          <filter id="edgeGlow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Edges */}
        {edges.map((edge, index) => {
          const sourceNode = nodes.find(n => n.id === edge.source)!
          const targetNode = nodes.find(n => n.id === edge.target)!
          
          const isHighlighted = hoveredNode === edge.source || hoveredNode === edge.target ||
                               selectedNode === edge.source || selectedNode === edge.target
          
          return (
            <motion.line
              key={`${edge.source}-${edge.target}`}
              x1={sourceNode.x}
              y1={sourceNode.y}
              x2={targetNode.x}
              y2={targetNode.y}
              stroke={isHighlighted ? 'rgb(59, 130, 246)' : 'rgb(156, 163, 175)'}
              strokeWidth={edge.strength * 3}
              strokeOpacity={isHighlighted ? 0.8 : 0.3}
              filter={isHighlighted ? "url(#edgeGlow)" : "none"}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ 
                duration: 1, 
                delay: index * 0.02,
                ease: "easeOut"
              }}
            />
          )
        })}

        {/* Nodes */}
        {nodes.map((node, index) => {
          const isHovered = hoveredNode === node.id
          const isSelected = selectedNode === node.id
          const isConnected = selectedNode && node.connections.includes(selectedNode)
          
          return (
            <g key={node.id}>
              {/* Node circle */}
              <motion.circle
                cx={node.x}
                cy={node.y}
                r={node.size}
                fill={node.color}
                stroke={isHovered || isSelected ? "white" : "transparent"}
                strokeWidth="2"
                filter={isHovered || isSelected || isConnected ? "url(#nodeGlow)" : "none"}
                className="cursor-pointer"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: isHovered ? 1.2 : isSelected ? 1.1 : 1, 
                  opacity: selectedNode && !isSelected && !isConnected ? 0.3 : 1
                }}
                transition={{ 
                  duration: 0.3, 
                  delay: index * 0.05,
                  type: "spring",
                  stiffness: 200
                }}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => setSelectedNode(selectedNode === node.id ? null : node.id)}
              />
              
              {/* Rank badge */}
              <motion.circle
                cx={node.x + node.size * 0.7}
                cy={node.y - node.size * 0.7}
                r="8"
                fill="white"
                stroke={node.color}
                strokeWidth="2"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ 
                  duration: 0.2, 
                  delay: index * 0.05 + 0.3,
                  type: "spring"
                }}
              />
              <motion.text
                x={node.x + node.size * 0.7}
                y={node.y - node.size * 0.7}
                textAnchor="middle"
                dominantBaseline="central"
                className="text-xs font-bold fill-current"
                style={{ color: node.color }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.05 + 0.5 }}
              >
                {node.rank}
              </motion.text>
              
              {/* Node label (shown on hover or selection) */}
              {(isHovered || isSelected) && (
                <motion.g
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <rect
                    x={node.x - 40}
                    y={node.y + node.size + 10}
                    width="80"
                    height="24"
                    rx="4"
                    fill="hsl(var(--popover))"
                    stroke="hsl(var(--border))"
                  />
                  <text
                    x={node.x}
                    y={node.y + node.size + 22}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="text-xs fill-popover-foreground font-medium"
                  >
                    {node.username || formatAddress(node.address as `0x${string}`, true)}
                  </text>
                </motion.g>
              )}
            </g>
          )
        })}
      </svg>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-popover/90 backdrop-blur border border-border rounded-lg p-3">
        <div className="text-xs font-medium text-foreground mb-2">Network Legend</div>
        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span>Top 3 Contributors</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span>Top 10 Contributors</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span>Top 15 Contributors</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-violet-500" />
            <span>Other Contributors</span>
          </div>
        </div>
      </div>

      {/* Network stats */}
      <div className="absolute bottom-4 right-4 bg-popover/90 backdrop-blur border border-border rounded-lg p-3">
        <div className="text-xs font-medium text-foreground mb-2">Network Stats</div>
        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="flex justify-between space-x-4">
            <span>Nodes:</span>
            <span className="font-medium">{nodes.length}</span>
          </div>
          <div className="flex justify-between space-x-4">
            <span>Connections:</span>
            <span className="font-medium">{edges.length}</span>
          </div>
          <div className="flex justify-between space-x-4">
            <span>Density:</span>
            <span className="font-medium">
              {((edges.length * 2) / (nodes.length * (nodes.length - 1)) * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Selection info */}
      {selectedNode && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-16 right-4 bg-popover border border-border rounded-lg p-4 shadow-lg max-w-xs"
        >
          <div className="text-sm font-medium text-foreground mb-2">
            Collaborator Details
          </div>
          {(() => {
            const nodeData = data.find(d => d.address === selectedNode)!
            const node = nodes.find(n => n.id === selectedNode)!
            
            return (
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Rank:</span>
                  <span className="font-medium">#{nodeData.rank}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tasks:</span>
                  <span className="font-medium">{nodeData.completedTasks}</span>
                </div>
                <div className="flex justify-between">
                  <span>Success Rate:</span>
                  <span className="font-medium">{Math.round(nodeData.successRate * 100)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Connections:</span>
                  <span className="font-medium">{node.connections.length}</span>
                </div>
                <div className="pt-2 border-t border-border">
                  <button
                    onClick={() => setSelectedNode(null)}
                    className="text-xs text-primary hover:underline"
                  >
                    Close
                  </button>
                </div>
              </div>
            )
          })()}
        </motion.div>
      )}

      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
    </div>
  )
}