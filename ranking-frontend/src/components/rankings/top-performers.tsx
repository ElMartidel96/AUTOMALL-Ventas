'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Crown, 
  Medal, 
  Award, 
  TrendingUp, 
  Star,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Zap,
  Target,
  Users
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

import { Ranking } from '@/types'
import { 
  formatAddress, 
  formatCGC, 
  formatPercentage, 
  getBadgeInfo, 
  generateAvatar,
  cn 
} from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'

interface TopPerformersProps {
  rankings: Ranking[]
  loading?: boolean
  error?: any
  className?: string
}

export function TopPerformers({ 
  rankings, 
  loading, 
  error, 
  className 
}: TopPerformersProps) {
  const { preferences } = useAppStore()
  const [currentSlide, setCurrentSlide] = React.useState(0)
  const [hoveredCard, setHoveredCard] = React.useState<number | null>(null)
  
  const itemsPerSlide = preferences.compactMode ? 6 : 4
  const totalSlides = Math.ceil(rankings.length / itemsPerSlide)
  
  // Auto-advance slides
  React.useEffect(() => {
    if (!preferences.showAnimations || totalSlides <= 1) return
    
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % totalSlides)
    }, 5000)
    
    return () => clearInterval(interval)
  }, [totalSlides, preferences.showAnimations])

  const nextSlide = React.useCallback(() => {
    setCurrentSlide(prev => (prev + 1) % totalSlides)
  }, [totalSlides])

  const prevSlide = React.useCallback(() => {
    setCurrentSlide(prev => (prev - 1 + totalSlides) % totalSlides)
  }, [totalSlides])

  if (loading) {
    return <TopPerformersSkeleton className={className} />
  }

  if (error || !rankings || rankings.length === 0) {
    return (
      <Card className={cn("bg-muted/20", className)}>
        <CardContent className="p-6 text-center">
          <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {error ? 'Failed to load top performers' : 'No top performers available'}
          </p>
        </CardContent>
      </Card>
    )
  }

  const currentSlideItems = rankings.slice(
    currentSlide * itemsPerSlide,
    (currentSlide + 1) * itemsPerSlide
  )

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <span>Top Performers</span>
            <Badge variant="secondary" className="ml-2">
              {rankings.length}
            </Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Leading contributors in the DAO ecosystem
          </p>
        </div>
        
        {totalSlides > 1 && (
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={prevSlide}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex space-x-1">
              {Array.from({ length: totalSlides }).map((_, index) => (
                <button
                  key={index}
                  className={cn(
                    "h-2 w-2 rounded-full transition-colors",
                    index === currentSlide ? "bg-primary" : "bg-muted"
                  )}
                  onClick={() => setCurrentSlide(index)}
                />
              ))}
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={nextSlide}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent className="pb-6">
        <div className="relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className={cn(
                "grid gap-4",
                preferences.compactMode 
                  ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-6"
                  : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
              )}
            >
              {currentSlideItems.map((ranking, index) => (
                <PerformerCard
                  key={ranking.address}
                  ranking={ranking}
                  globalIndex={currentSlide * itemsPerSlide + index}
                  isHovered={hoveredCard === currentSlide * itemsPerSlide + index}
                  onHover={(hovered) => setHoveredCard(hovered ? currentSlide * itemsPerSlide + index : null)}
                  compact={preferences.compactMode}
                  animated={preferences.showAnimations}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Podium View for Top 3 */}
        {currentSlide === 0 && rankings.length >= 3 && !preferences.compactMode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="mt-8 pt-6 border-t border-border"
          >
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-foreground">Champion Podium</h3>
              <p className="text-sm text-muted-foreground">Top 3 DAO Contributors</p>
            </div>
            
            <PodiumView rankings={rankings.slice(0, 3)} />
          </motion.div>
        )}
      </CardContent>

      {/* Background decoration */}
      <div className="absolute top-0 right-0 -mr-4 -mt-4 opacity-10">
        <Trophy className="h-24 w-24 text-primary" />
      </div>
    </Card>
  )
}

// Individual Performer Card
interface PerformerCardProps {
  ranking: Ranking
  globalIndex: number
  isHovered: boolean
  onHover: (hovered: boolean) => void
  compact: boolean
  animated: boolean
}

function PerformerCard({ 
  ranking, 
  globalIndex, 
  isHovered, 
  onHover, 
  compact, 
  animated 
}: PerformerCardProps) {
  const badgeInfo = ranking.badge ? getBadgeInfo(ranking.badge) : null
  
  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-4 w-4 text-yellow-500" />
    if (rank === 2) return <Medal className="h-4 w-4 text-gray-400" />
    if (rank === 3) return <Award className="h-4 w-4 text-orange-600" />
    return <Star className="h-3 w-3 text-blue-500" />
  }

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: {
        duration: 0.4,
        delay: globalIndex * 0.1,
        ease: "easeOut"
      }
    },
    hover: {
      scale: 1.05,
      y: -5,
      transition: { duration: 0.2 }
    }
  }

  return (
    <motion.div
      variants={animated ? cardVariants : {}}
      initial={animated ? "hidden" : "visible"}
      animate="visible"
      whileHover={animated ? "hover" : undefined}
      onHoverStart={() => onHover(true)}
      onHoverEnd={() => onHover(false)}
      className="group cursor-pointer"
    >
      <Card className={cn(
        "relative overflow-hidden transition-all duration-300",
        "hover:shadow-lg hover:border-primary/20",
        ranking.rank <= 3 && "bg-gradient-to-br from-card to-primary/5",
        compact ? "p-3" : "p-4"
      )}>
        <CardContent className="p-0">
          
          {/* Rank Badge */}
          <div className="absolute top-2 left-2 z-10">
            <Badge 
              variant={ranking.rank <= 3 ? "default" : "secondary"}
              className={cn(
                "font-bold",
                ranking.rank === 1 && "bg-yellow-500 text-white",
                ranking.rank === 2 && "bg-gray-400 text-white",
                ranking.rank === 3 && "bg-orange-600 text-white"
              )}
            >
              <div className="flex items-center space-x-1">
                {getRankIcon(ranking.rank)}
                <span>#{ranking.rank}</span>
              </div>
            </Badge>
          </div>

          {/* Trend Badge */}
          {ranking.trend !== 'stable' && (
            <div className="absolute top-2 right-2 z-10">
              <Badge 
                variant={ranking.trend === 'up' ? 'success' : 'warning'}
                className="text-xs"
              >
                <TrendingUp className="h-3 w-3 mr-1" />
                {ranking.trendChange}
              </Badge>
            </div>
          )}

          <div className="space-y-3">
            
            {/* Avatar and Basic Info */}
            <div className="flex flex-col items-center text-center pt-8">
              <motion.div
                animate={animated && isHovered ? { scale: 1.1 } : { scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <Avatar 
                  size={compact ? "default" : "lg"}
                  status={ranking.isOnline ? "online" : "offline"}
                >
                  <AvatarImage 
                    src={ranking.avatar || generateAvatar(ranking.address)} 
                    alt={ranking.username || formatAddress(ranking.address)} 
                  />
                  <AvatarFallback>
                    {ranking.username 
                      ? ranking.username.slice(0, 2).toUpperCase() 
                      : ranking.address.slice(2, 4).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </motion.div>
              
              <div className="mt-2 min-h-0">
                <h3 className="font-semibold text-sm text-foreground truncate">
                  {ranking.username || formatAddress(ranking.address)}
                </h3>
                <p className="text-xs text-muted-foreground font-mono">
                  {formatAddress(ranking.address, true)}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 text-center">
              <div>
                <div className="text-sm font-bold text-foreground">
                  {formatCGC(ranking.totalEarned, 18, true)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Earned
                </div>
              </div>
              <div>
                <div className="text-sm font-bold text-foreground">
                  {ranking.completedTasks}
                </div>
                <div className="text-xs text-muted-foreground">
                  Tasks
                </div>
              </div>
            </div>

            {/* Success Rate Bar */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Success Rate</span>
                <span className="text-xs font-medium">
                  {formatPercentage(ranking.successRate)}
                </span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className={cn(
                    "h-full rounded-full",
                    ranking.successRate >= 0.9 ? "bg-green-500" :
                    ranking.successRate >= 0.7 ? "bg-yellow-500" : "bg-red-500"
                  )}
                  initial={{ width: 0 }}
                  animate={{ width: `${ranking.successRate * 100}%` }}
                  transition={{ duration: 1, delay: globalIndex * 0.1 }}
                />
              </div>
            </div>

            {/* Badge */}
            {badgeInfo && (
              <div className="flex justify-center">
                <Badge 
                  variant={ranking.badge as any}
                  className="text-xs"
                  icon={<span>{badgeInfo.icon}</span>}
                >
                  {badgeInfo.name}
                </Badge>
              </div>
            )}
          </div>

          {/* Hover overlay */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent opacity-0"
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.2 }}
          />
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Podium View for Top 3
interface PodiumViewProps {
  rankings: Ranking[]
}

function PodiumView({ rankings }: PodiumViewProps) {
  const podiumHeights = ['h-24', 'h-32', 'h-20'] // 2nd, 1st, 3rd
  const podiumOrder = [rankings[1], rankings[0], rankings[2]].filter(Boolean)
  const podiumPositions = [2, 1, 3]

  return (
    <div className="flex items-end justify-center space-x-4">
      {podiumOrder.map((ranking, index) => {
        if (!ranking) return null
        
        const position = podiumPositions[index]!
        const height = podiumHeights[index]!
        
        return (
          <motion.div
            key={ranking.address}
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ 
              duration: 0.6, 
              delay: index * 0.2,
              ease: "easeOut"
            }}
            className="flex flex-col items-center"
          >
            {/* Collaborator */}
            <div className="mb-4 text-center">
              <Avatar size="lg" className="mb-2">
                <AvatarImage 
                  src={ranking.avatar || generateAvatar(ranking.address)} 
                  alt={ranking.username || formatAddress(ranking.address)} 
                />
                <AvatarFallback>
                  {ranking.username 
                    ? ranking.username.slice(0, 2).toUpperCase() 
                    : ranking.address.slice(2, 4).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="font-semibold text-sm">
                {ranking.username || formatAddress(ranking.address)}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatCGC(ranking.totalEarned, 18, true)}
              </div>
            </div>

            {/* Podium */}
            <div className={cn(
              "relative w-20 rounded-t-lg border-2 border-border",
              height,
              position === 1 && "bg-gradient-to-t from-yellow-500/20 to-yellow-500/10 border-yellow-500/30",
              position === 2 && "bg-gradient-to-t from-gray-400/20 to-gray-400/10 border-gray-400/30",
              position === 3 && "bg-gradient-to-t from-orange-600/20 to-orange-600/10 border-orange-600/30"
            )}>
              {/* Position number */}
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold",
                  position === 1 && "bg-yellow-500",
                  position === 2 && "bg-gray-400",
                  position === 3 && "bg-orange-600"
                )}>
                  {position}
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className={cn(
                  "text-6xl opacity-20",
                  position === 1 ? "text-yellow-500" :
                  position === 2 ? "text-gray-400" : "text-orange-600"
                )}>
                  {position === 1 ? '🏆' : position === 2 ? '🥈' : '🥉'}
                </div>
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

// Skeleton Component
function TopPerformersSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="space-y-2">
          <div className="h-6 w-40 bg-muted rounded animate-pulse" />
          <div className="h-4 w-64 bg-muted rounded animate-pulse" />
        </div>
        <div className="flex space-x-2">
          <div className="h-8 w-8 bg-muted rounded animate-pulse" />
          <div className="h-8 w-8 bg-muted rounded animate-pulse" />
        </div>
      </CardHeader>
      
      <CardContent className="pb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-4">
              <div className="space-y-3">
                <div className="flex flex-col items-center text-center">
                  <div className="h-12 w-12 bg-muted rounded-full animate-pulse mb-2" />
                  <div className="h-4 w-24 bg-muted rounded animate-pulse mb-1" />
                  <div className="h-3 w-20 bg-muted rounded animate-pulse" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center">
                    <div className="h-4 w-12 bg-muted rounded animate-pulse mb-1" />
                    <div className="h-3 w-8 bg-muted rounded animate-pulse" />
                  </div>
                  <div className="text-center">
                    <div className="h-4 w-8 bg-muted rounded animate-pulse mb-1" />
                    <div className="h-3 w-8 bg-muted rounded animate-pulse" />
                  </div>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full animate-pulse" />
              </div>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export { TopPerformers }