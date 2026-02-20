'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { 
  Trophy, 
  Users, 
  Search, 
  Filter,
  Settings,
  Moon,
  Sun,
  Monitor,
  Maximize2,
  Minimize2
} from 'lucide-react'
import { useTheme } from 'next-themes'

import { Button } from '@/components/ui/button'
import { SearchInput } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { useAppStore } from '@/store/useAppStore'
import { cn, formatTimeAgo } from '@/lib/utils'

interface DashboardHeaderProps {
  className?: string
}

export function DashboardHeader({ className }: DashboardHeaderProps) {
  const { theme, setTheme } = useTheme()
  const {
    filters,
    setFilters,
    resetFilters,
    preferences,
    setPreferences,
    rankings,
    stats,
    websocket,
    lastUpdate
  } = useAppStore()

  const [isFullscreen, setIsFullscreen] = React.useState(false)

  // Search functionality
  const handleSearch = React.useCallback((query: string) => {
    setFilters({ searchQuery: query })
  }, [setFilters])

  // Sort functionality  
  const handleSortChange = React.useCallback((value: string) => {
    const [sortBy, sortOrder] = value.split('-') as [any, 'asc' | 'desc']
    setFilters({ sortBy, sortOrder })
  }, [setFilters])

  // Theme switching
  const cycleTheme = React.useCallback(() => {
    const themes = ['light', 'dark', 'system']
    const currentIndex = themes.indexOf(theme || 'system')
    const nextIndex = (currentIndex + 1) % themes.length
    setTheme(themes[nextIndex]!)
  }, [theme, setTheme])

  // Fullscreen toggle
  const toggleFullscreen = React.useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
        setIsFullscreen(true)
      } else {
        await document.exitFullscreen()
        setIsFullscreen(false)
      }
    } catch (error) {
      console.error('Failed to toggle fullscreen:', error)
    }
  }, [])

  // Listen for fullscreen changes
  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const totalCollaborators = rankings.length
  const activeCollaborators = rankings.filter(r => 
    Date.now() - r.recentActivity.getTime() < 7 * 24 * 60 * 60 * 1000 // Active in last 7 days
  ).length

  return (
    <motion.header 
      className={cn(
        "sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border",
        className
      )}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo and Title */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-cgc-500 flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
                {websocket.connected && (
                  <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-background animate-pulse" />
                )}
              </div>
              
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  CryptoGift DAO
                </h1>
                <p className="text-xs text-muted-foreground">
                  Ranking System
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="hidden lg:flex items-center space-x-4 ml-8">
              <div className="flex items-center space-x-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{totalCollaborators}</span>
                <span className="text-muted-foreground">collaborators</span>
              </div>
              
              <div className="h-4 w-px bg-border" />
              
              <Badge variant="success" className="text-xs">
                {activeCollaborators} active
              </Badge>
              
              {lastUpdate && (
                <>
                  <div className="h-4 w-px bg-border" />
                  <span className="text-xs text-muted-foreground">
                    Updated {formatTimeAgo(lastUpdate)}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Search and Controls */}
          <div className="flex items-center space-x-4 flex-1 max-w-lg mx-8">
            
            {/* Search */}
            <div className="relative flex-1">
              <SearchInput
                placeholder="Search collaborators..."
                value={filters.searchQuery}
                onSearch={handleSearch}
                className="w-full"
              />
            </div>

            {/* Sort */}
            <Select 
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onValueChange={handleSortChange}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rank-asc">Rank ↑</SelectItem>
                <SelectItem value="rank-desc">Rank ↓</SelectItem>
                <SelectItem value="earnings-desc">Earnings ↓</SelectItem>
                <SelectItem value="earnings-asc">Earnings ↑</SelectItem>
                <SelectItem value="tasks-desc">Tasks ↓</SelectItem>
                <SelectItem value="tasks-asc">Tasks ↑</SelectItem>
                <SelectItem value="success-rate-desc">Success ↓</SelectItem>
                <SelectItem value="recent-activity-desc">Activity ↓</SelectItem>
              </SelectContent>
            </Select>

            {/* Filter Button */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => {/* Open filter modal */}}
              className="shrink-0"
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {/* Right Side Controls */}
          <div className="flex items-center space-x-2">
            
            {/* Fullscreen Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="hidden md:flex"
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={cycleTheme}
            >
              {theme === 'light' ? (
                <Moon className="h-4 w-4" />
              ) : theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Monitor className="h-4 w-4" />
              )}
            </Button>

            {/* Settings Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>View Options</DropdownMenuLabel>
                
                <DropdownMenuItem
                  onClick={() => setPreferences({ 
                    compactMode: !preferences.compactMode 
                  })}
                  className="flex items-center justify-between"
                >
                  Compact Mode
                  <Badge variant={preferences.compactMode ? "default" : "secondary"}>
                    {preferences.compactMode ? "On" : "Off"}
                  </Badge>
                </DropdownMenuItem>
                
                <DropdownMenuItem
                  onClick={() => setPreferences({ 
                    showAnimations: !preferences.showAnimations 
                  })}
                  className="flex items-center justify-between"
                >
                  Animations
                  <Badge variant={preferences.showAnimations ? "default" : "secondary"}>
                    {preferences.showAnimations ? "On" : "Off"}
                  </Badge>
                </DropdownMenuItem>
                
                <DropdownMenuItem
                  onClick={() => setPreferences({ 
                    soundEnabled: !preferences.soundEnabled 
                  })}
                  className="flex items-center justify-between"
                >
                  Sound Effects
                  <Badge variant={preferences.soundEnabled ? "default" : "secondary"}>
                    {preferences.soundEnabled ? "On" : "Off"}
                  </Badge>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuLabel>Data</DropdownMenuLabel>
                
                <DropdownMenuItem
                  onClick={() => setPreferences({ 
                    autoRefresh: !preferences.autoRefresh 
                  })}
                  className="flex items-center justify-between"
                >
                  Auto Refresh
                  <Badge variant={preferences.autoRefresh ? "default" : "secondary"}>
                    {preferences.autoRefresh ? "On" : "Off"}
                  </Badge>
                </DropdownMenuItem>
                
                <DropdownMenuItem>
                  <Select
                    value={preferences.itemsPerPage.toString()}
                    onValueChange={(value) => setPreferences({ 
                      itemsPerPage: parseInt(value) 
                    })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25">25 per page</SelectItem>
                      <SelectItem value="50">50 per page</SelectItem>
                      <SelectItem value="100">100 per page</SelectItem>
                    </SelectContent>
                  </Select>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem 
                  onClick={resetFilters}
                  className="text-muted-foreground"
                >
                  Reset Filters
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Avatar */}
            <div className="hidden md:block">
              <Avatar size="sm">
                <AvatarFallback className="bg-muted text-muted-foreground">
                  U
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  )
}

// Additional dropdown menu components needed
const Select = React.forwardRef<
  React.ElementRef<"select">,
  React.ComponentPropsWithoutRef<"select"> & {
    value?: string
    onValueChange?: (value: string) => void
    children: React.ReactNode
  }
>(({ className, value, onValueChange, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    value={value}
    onChange={(e) => onValueChange?.(e.target.value)}
    {...props}
  >
    {children}
  </select>
))
Select.displayName = "Select"

const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    children: React.ReactNode
  }
>(({ className, children, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  >
    {children}
  </button>
))
SelectTrigger.displayName = "SelectTrigger"

const SelectValue = ({ placeholder }: { placeholder?: string }) => (
  <span className="text-muted-foreground">{placeholder}</span>
)

const SelectContent = ({ children }: { children: React.ReactNode }) => (
  <div className="relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md">
    {children}
  </div>
)

const SelectItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value: string
    children: React.ReactNode
  }
>(({ className, children, value, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    {children}
  </div>
))
SelectItem.displayName = "SelectItem"

const DropdownMenu = ({ children }: { children: React.ReactNode }) => (
  <div className="relative inline-block text-left">{children}</div>
)

const DropdownMenuTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    asChild?: boolean
    children: React.ReactNode
  }
>(({ children, asChild, ...props }, ref) => (
  <button ref={ref} {...props}>
    {children}
  </button>
))
DropdownMenuTrigger.displayName = "DropdownMenuTrigger"

const DropdownMenuContent = ({ 
  align = "center", 
  className, 
  children 
}: { 
  align?: "start" | "center" | "end"
  className?: string
  children: React.ReactNode 
}) => (
  <div className={cn("absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg", className)}>
    {children}
  </div>
)

const DropdownMenuLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="px-2 py-1.5 text-sm font-semibold text-foreground">
    {children}
  </div>
)

const DropdownMenuItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  />
))
DropdownMenuItem.displayName = "DropdownMenuItem"

const DropdownMenuSeparator = () => (
  <div className="mx-1 my-1 h-px bg-muted" />
)

export {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
}