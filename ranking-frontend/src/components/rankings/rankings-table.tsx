'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronUp, 
  ChevronDown, 
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Minus,
  Crown,
  Medal,
  Award,
  Star
} from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import { Ranking, PaginationOptions } from '@/types'
import { 
  formatAddress, 
  formatCGC, 
  formatPercentage, 
  formatTimeAgo, 
  getBadgeInfo, 
  calculateRankChange,
  getBaseExplorerUrl,
  generateAvatar,
  cn 
} from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'

interface RankingsTableProps {
  data: Ranking[]
  loading?: boolean
  error?: any
  pagination?: PaginationOptions
  className?: string
}

export function RankingsTable({ 
  data, 
  loading, 
  error, 
  pagination,
  className 
}: RankingsTableProps) {
  const { preferences, filters, setFilters } = useAppStore()
  const [selectedRanking, setSelectedRanking] = React.useState<Ranking | null>(null)
  const [sortColumn, setSortColumn] = React.useState<string | null>(null)
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc')

  // Handle sorting
  const handleSort = React.useCallback((column: string) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }

    // Update global filters
    setFilters({ 
      sortBy: column as any, 
      sortOrder: sortDirection === 'asc' ? 'desc' : 'asc' 
    })
  }, [sortColumn, sortDirection, setFilters])

  // Handle row click
  const handleRowClick = React.useCallback((ranking: Ranking) => {
    setSelectedRanking(ranking)
    // Navigate to collaborator detail page
    // router.push(`/collaborator/${ranking.address}`)
  }, [])

  if (loading) {
    return <RankingsTableSkeleton className={className} />
  }

  if (error) {
    return (
      <Card className={cn("bg-error/5 border-error/20", className)}>
        <CardContent className="p-8 text-center">
          <div className="text-error text-lg font-medium mb-2">
            Failed to load rankings
          </div>
          <p className="text-muted-foreground text-sm mb-4">
            {error.message || 'Something went wrong'}
          </p>
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <div className="text-muted-foreground text-lg font-medium mb-2">
            No rankings found
          </div>
          <p className="text-muted-foreground text-sm">
            {filters.searchQuery ? 'Try adjusting your search terms' : 'No collaborators available'}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      
      {/* Table Header Info */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border">
        <div className="text-sm text-muted-foreground">
          Showing {data.length} of {pagination?.total || data.length} collaborators
        </div>
        
        {filters.searchQuery && (
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              Search: &quot;{filters.searchQuery}&quot;
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilters({ searchQuery: '' })}
            >
              Clear
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border">
              
              {/* Rank */}
              <TableHead className="w-16">
                <SortableHeader
                  title="Rank"
                  column="rank"
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
              </TableHead>
              
              {/* Collaborator */}
              <TableHead className="min-w-[200px]">
                Collaborator
              </TableHead>
              
              {/* Total Earned */}
              <TableHead className="text-right">
                <SortableHeader
                  title="Total Earned"
                  column="earnings"
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
              </TableHead>
              
              {/* Tasks */}
              <TableHead className="text-right">
                <SortableHeader
                  title="Tasks"
                  column="tasks"
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
              </TableHead>
              
              {/* Success Rate */}
              <TableHead className="text-right">
                <SortableHeader
                  title="Success Rate"
                  column="success-rate"
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
              </TableHead>
              
              {/* Badge */}
              <TableHead className="text-center">
                Badge
              </TableHead>
              
              {/* Activity */}
              <TableHead className="text-right">
                <SortableHeader
                  title="Last Activity"
                  column="recent-activity"
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
              </TableHead>
              
              {/* Trend */}
              <TableHead className="w-16 text-center">
                Trend
              </TableHead>
              
              {/* Actions */}
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          
          <TableBody>
            <AnimatePresence mode="popLayout">
              {data.map((ranking, index) => (
                <RankingRow
                  key={ranking.address}
                  ranking={ranking}
                  index={index}
                  onClick={() => handleRowClick(ranking)}
                  compact={preferences.compactMode}
                  animated={preferences.showAnimations}
                />
              ))}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && pagination.total > pagination.limit && (
        <RankingsPagination pagination={pagination} />
      )}
    </div>
  )
}

// Sortable Header Component
interface SortableHeaderProps {
  title: string
  column: string
  sortColumn: string | null
  sortDirection: 'asc' | 'desc'
  onSort: (column: string) => void
}

function SortableHeader({ 
  title, 
  column, 
  sortColumn, 
  sortDirection, 
  onSort 
}: SortableHeaderProps) {
  const isActive = sortColumn === column

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => onSort(column)}
      className="h-8 px-2 font-medium hover:bg-transparent hover:text-foreground"
    >
      <span>{title}</span>
      <div className="ml-1 flex flex-col">
        <ChevronUp 
          className={cn(
            "h-3 w-3 transition-colors",
            isActive && sortDirection === 'asc' ? "text-primary" : "text-muted-foreground"
          )} 
        />
        <ChevronDown 
          className={cn(
            "h-3 w-3 -mt-1 transition-colors",
            isActive && sortDirection === 'desc' ? "text-primary" : "text-muted-foreground"
          )} 
        />
      </div>
    </Button>
  )
}

// Individual Ranking Row Component
interface RankingRowProps {
  ranking: Ranking
  index: number
  onClick: () => void
  compact: boolean
  animated: boolean
}

function RankingRow({ ranking, index, onClick, compact, animated }: RankingRowProps) {
  const [isHovered, setIsHovered] = React.useState(false)
  
  const rankChange = calculateRankChange(ranking.rank, ranking.previousRank)
  const badgeInfo = ranking.badge ? getBadgeInfo(ranking.badge) : null

  const rowVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { 
        duration: 0.3,
        delay: index * 0.05
      }
    },
    exit: { 
      opacity: 0, 
      x: 20,
      transition: { duration: 0.2 }
    }
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-4 w-4 text-yellow-500" />
    if (rank === 2) return <Medal className="h-4 w-4 text-gray-400" />
    if (rank === 3) return <Award className="h-4 w-4 text-orange-600" />
    if (rank <= 10) return <Star className="h-4 w-4 text-blue-500" />
    return null
  }

  const getTrendIcon = () => {
    if (rankChange.trend === 'up') return <TrendingUp className="h-4 w-4 text-green-500" />
    if (rankChange.trend === 'down') return <TrendingDown className="h-4 w-4 text-red-500" />
    return <Minus className="h-4 w-4 text-muted-foreground" />
  }

  return (
    <motion.tr
      variants={animated ? rowVariants : {}}
      initial={animated ? "hidden" : "visible"}
      animate="visible"
      exit={animated ? "exit" : undefined}
      layout={animated}
      className={cn(
        "group cursor-pointer transition-colors duration-200",
        "hover:bg-muted/50 border-b border-border/50",
        isHovered && "bg-muted/30"
      )}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
    >
      
      {/* Rank */}
      <TableCell className="font-medium">
        <div className="flex items-center space-x-2">
          <motion.span 
            className="text-lg font-bold font-mono"
            animate={rankChange.trend !== 'stable' && animated ? {
              scale: [1, 1.1, 1],
              color: rankChange.trend === 'up' ? '#10b981' : '#ef4444'
            } : {}}
            transition={{ duration: 0.5 }}
          >
            {ranking.rank}
          </motion.span>
          {getRankIcon(ranking.rank)}
        </div>
      </TableCell>
      
      {/* Collaborator */}
      <TableCell>
        <div className="flex items-center space-x-3">
          <Avatar 
            size={compact ? "sm" : "default"}
            status={ranking.isOnline ? "online" : "offline"}
          >
            <AvatarImage 
              src={ranking.avatar || generateAvatar(ranking.address)} 
              alt={ranking.username || formatAddress(ranking.address)} 
            />
            <AvatarFallback>
              {ranking.username ? ranking.username.slice(0, 2).toUpperCase() : ranking.address.slice(2, 4).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="min-w-0 flex-1">
            <div className="font-medium text-foreground truncate">
              {ranking.username || formatAddress(ranking.address)}
            </div>
            <div className="text-xs text-muted-foreground font-mono">
              {formatAddress(ranking.address, true)}
            </div>
          </div>
        </div>
      </TableCell>
      
      {/* Total Earned */}
      <TableCell className="text-right">
        <motion.div 
          className="font-mono font-medium"
          animate={animated ? {
            scale: isHovered ? 1.05 : 1
          } : {}}
        >
          {formatCGC(ranking.totalEarned, 18, true)}
        </motion.div>
        <div className="text-xs text-muted-foreground">
          CGC
        </div>
      </TableCell>
      
      {/* Tasks */}
      <TableCell className="text-right">
        <div className="font-medium">
          {ranking.completedTasks}
        </div>
        <div className="text-xs text-muted-foreground">
          completed
        </div>
      </TableCell>
      
      {/* Success Rate */}
      <TableCell className="text-right">
        <div className="flex items-center justify-end space-x-2">
          <span className="font-medium">
            {formatPercentage(ranking.successRate)}
          </span>
          <div 
            className={cn(
              "h-2 w-12 rounded-full overflow-hidden",
              ranking.successRate >= 0.9 ? "bg-green-500/20" :
              ranking.successRate >= 0.7 ? "bg-yellow-500/20" : "bg-red-500/20"
            )}
          >
            <motion.div
              className={cn(
                "h-full rounded-full",
                ranking.successRate >= 0.9 ? "bg-green-500" :
                ranking.successRate >= 0.7 ? "bg-yellow-500" : "bg-red-500"
              )}
              initial={{ width: 0 }}
              animate={{ width: `${ranking.successRate * 100}%` }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
            />
          </div>
        </div>
      </TableCell>
      
      {/* Badge */}
      <TableCell className="text-center">
        {badgeInfo ? (
          <Badge 
            variant={ranking.badge as any}
            className="text-xs"
            icon={<span>{badgeInfo.icon}</span>}
          >
            {badgeInfo.name}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        )}
      </TableCell>
      
      {/* Last Activity */}
      <TableCell className="text-right">
        <div className="text-sm">
          {formatTimeAgo(ranking.recentActivity)}
        </div>
      </TableCell>
      
      {/* Trend */}
      <TableCell className="text-center">
        <motion.div
          whileHover={animated ? { scale: 1.2 } : {}}
          className="flex items-center justify-center"
        >
          {getTrendIcon()}
        </motion.div>
        {rankChange.change > 0 && (
          <div className="text-xs text-muted-foreground mt-1">
            {rankChange.change}
          </div>
        )}
      </TableCell>
      
      {/* Actions */}
      <TableCell>
        <Button
          variant="ghost"
          size="icon"
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation()
            window.open(getBaseExplorerUrl(ranking.address, 'address'), '_blank')
          }}
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
      </TableCell>
    </motion.tr>
  )
}

// Pagination Component
interface RankingsPaginationProps {
  pagination: PaginationOptions
}

function RankingsPagination({ pagination }: RankingsPaginationProps) {
  const { setFilters } = useAppStore()
  
  const totalPages = Math.ceil(pagination.total / pagination.limit)
  const currentPage = Math.floor(pagination.offset / pagination.limit) + 1
  
  const handlePageChange = (page: number) => {
    setFilters({ 
      // offset: (page - 1) * pagination.limit 
    })
  }

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-border">
      <div className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </div>
      
      <div className="flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => handlePageChange(currentPage - 1)}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => handlePageChange(currentPage + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  )
}

// Table Components (simplified for this example)
const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <table
    ref={ref}
    className={cn("w-full caption-bottom text-sm", className)}
    {...props}
  />
))
Table.displayName = "Table"

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className
    )}
    {...props}
  />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
    {...props}
  />
))
TableCell.displayName = "TableCell"

// Skeleton Component
function RankingsTableSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="px-6 py-3 border-b border-border">
        <div className="h-4 w-48 bg-muted rounded animate-pulse" />
      </div>
      
      <div className="space-y-3 px-6">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4 py-3">
            <div className="h-6 w-8 bg-muted rounded animate-pulse" />
            <div className="h-10 w-10 bg-muted rounded-full animate-pulse" />
            <div className="flex-1 space-y-1">
              <div className="h-4 w-32 bg-muted rounded animate-pulse" />
              <div className="h-3 w-24 bg-muted rounded animate-pulse" />
            </div>
            <div className="h-4 w-20 bg-muted rounded animate-pulse" />
            <div className="h-4 w-12 bg-muted rounded animate-pulse" />
            <div className="h-4 w-16 bg-muted rounded animate-pulse" />
            <div className="h-5 w-16 bg-muted rounded-full animate-pulse" />
            <div className="h-4 w-12 bg-muted rounded animate-pulse" />
            <div className="h-4 w-4 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}

export { RankingsTable, Table, TableBody, TableCell, TableHead, TableHeader, TableRow }