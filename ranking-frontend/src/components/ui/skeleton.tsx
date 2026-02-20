import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

// Specialized skeleton components for common patterns
function SkeletonText({ lines = 1, className, ...props }: {
  lines?: number
  className?: string
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4",
            i === lines - 1 && lines > 1 ? "w-3/4" : "w-full"
          )}
        />
      ))}
    </div>
  )
}

function SkeletonAvatar({ size = "default", className, ...props }: {
  size?: "xs" | "sm" | "default" | "lg" | "xl"
  className?: string
} & React.HTMLAttributes<HTMLDivElement>) {
  const sizeClasses = {
    xs: "h-6 w-6",
    sm: "h-8 w-8",
    default: "h-10 w-10",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  }
  
  return (
    <Skeleton
      className={cn("rounded-full", sizeClasses[size], className)}
      {...props}
    />
  )
}

function SkeletonCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-lg border border-border bg-card p-6", className)} {...props}>
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <SkeletonAvatar />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
        <SkeletonText lines={2} />
        <div className="flex space-x-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
    </div>
  )
}

function SkeletonTable({ rows = 5, columns = 4, className, ...props }: {
  rows?: number
  columns?: number
  className?: string
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("w-full", className)} {...props}>
      {/* Header */}
      <div className="flex space-x-4 border-b border-border pb-3 mb-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`header-${i}`} className="h-4 flex-1" />
        ))}
      </div>
      
      {/* Rows */}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={`row-${rowIndex}`} className="flex space-x-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton 
                key={`cell-${rowIndex}-${colIndex}`} 
                className={cn(
                  "h-4 flex-1",
                  colIndex === 0 && "w-12", // First column narrower
                  colIndex === columns - 1 && "w-20" // Last column fixed width
                )}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function SkeletonChart({ height = "h-64", className, ...props }: {
  height?: string
  className?: string
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("w-full", height, className)} {...props}>
      <div className="h-full flex items-end space-x-2 p-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton
            key={i}
            className={cn(
              "flex-1",
              `h-${Math.floor(Math.random() * 32) + 8}` // Random heights
            )}
            style={{ height: `${Math.random() * 80 + 20}%` }}
          />
        ))}
      </div>
    </div>
  )
}

function SkeletonRankingCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-lg border border-border bg-card p-4", className)} {...props}>
      <div className="flex items-center space-x-4">
        {/* Rank number */}
        <Skeleton className="h-8 w-8 rounded-full" />
        
        {/* Avatar */}
        <SkeletonAvatar size="lg" />
        
        {/* Info */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="flex space-x-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        
        {/* Badge */}
        <Skeleton className="h-6 w-20 rounded-full" />
        
        {/* Trend */}
        <Skeleton className="h-4 w-4" />
      </div>
    </div>
  )
}

function SkeletonStats({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", className)} {...props}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-lg border border-border bg-card p-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded" />
            </div>
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  )
}

export { 
  Skeleton, 
  SkeletonText,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonTable,
  SkeletonChart,
  SkeletonRankingCard,
  SkeletonStats
}