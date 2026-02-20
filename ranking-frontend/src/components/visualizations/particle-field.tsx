'use client'

import React from 'react'
import { motion } from 'framer-motion'

interface Particle {
  id: number
  x: number
  y: number
  size: number
  vx: number
  vy: number
  opacity: number
  color: string
}

interface ParticleFieldProps {
  count?: number
  className?: string
}

export function ParticleField({ count = 50, className }: ParticleFieldProps) {
  const [particles, setParticles] = React.useState<Particle[]>([])
  const containerRef = React.useRef<HTMLDivElement>(null)
  
  // Initialize particles
  React.useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    const colors = [
      'rgb(59, 130, 246)', // blue-500
      'rgb(16, 185, 129)', // emerald-500  
      'rgb(139, 92, 246)', // violet-500
      'rgb(236, 72, 153)', // pink-500
      'rgb(245, 158, 11)',  // amber-500
    ]

    const newParticles: Particle[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * rect.width,
      y: Math.random() * rect.height,
      size: Math.random() * 3 + 1,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      opacity: Math.random() * 0.6 + 0.2,
      color: colors[Math.floor(Math.random() * colors.length)]!
    }))

    setParticles(newParticles)
  }, [count])

  // Animation loop
  React.useEffect(() => {
    const container = containerRef.current
    if (!container || particles.length === 0) return

    let animationId: number

    const animate = () => {
      const rect = container.getBoundingClientRect()
      
      setParticles(prevParticles => 
        prevParticles.map(particle => {
          let { x, y, vx, vy } = particle

          // Update position
          x += vx
          y += vy

          // Bounce off edges
          if (x <= 0 || x >= rect.width) vx *= -1
          if (y <= 0 || y >= rect.height) vy *= -1

          // Keep in bounds
          x = Math.max(0, Math.min(rect.width, x))
          y = Math.max(0, Math.min(rect.height, y))

          return { ...particle, x, y, vx, vy }
        })
      )

      animationId = requestAnimationFrame(animate)
    }

    animationId = requestAnimationFrame(animate)

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [particles.length])

  return (
    <div 
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden ${className || ''}`}
    >
      {particles.map(particle => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: particle.x,
            top: particle.y,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            opacity: particle.opacity,
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [particle.opacity, particle.opacity * 0.5, particle.opacity],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      ))}
      
      {/* Connection lines between nearby particles */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {particles.map((particle, i) => 
          particles.slice(i + 1).map((otherParticle, j) => {
            const dx = particle.x - otherParticle.x
            const dy = particle.y - otherParticle.y
            const distance = Math.sqrt(dx * dx + dy * dy)
            
            if (distance < 100) {
              const opacity = (100 - distance) / 100 * 0.2
              
              return (
                <motion.line
                  key={`${i}-${j}`}
                  x1={particle.x}
                  y1={particle.y}
                  x2={otherParticle.x}
                  y2={otherParticle.y}
                  stroke="rgb(59, 130, 246)"
                  strokeWidth="1"
                  strokeOpacity={opacity}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                />
              )
            }
            return null
          })
        )}
      </svg>
    </div>
  )
}