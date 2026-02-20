'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Suspense } from 'react'

import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { StatsOverview } from '@/components/dashboard/stats-overview'
import { RankingsTable } from '@/components/rankings/rankings-table'
import { VisualizationPanel } from '@/components/visualizations/visualization-panel'
import { LiveActivity } from '@/components/live-activity'
import { ConnectionStatus } from '@/components/connection-status'
import { TopPerformers } from '@/components/rankings/top-performers'

import { useAppStore } from '@/store/useAppStore'
import { useRankings, useSystemStats, useRecentActivity } from '@/lib/api'
import { SkeletonStats, SkeletonRankingCard, SkeletonChart } from '@/components/ui/skeleton'
import { ErrorBoundary } from '@/components/error-boundary'

// Page variants for smooth animations
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 }
}

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.4
}

export default function HomePage() {
  const { preferences, isLoading } = useAppStore()
  const { data: rankingsData, error: rankingsError, isLoading: rankingsLoading } = useRankings({
    limit: preferences.itemsPerPage,
    offset: 0
  })
  const { data: statsData, error: statsError } = useSystemStats()
  const { data: activityData, error: activityError } = useRecentActivity(20)

  // Loading state
  if (isLoading) {
    return <PageSkeleton />
  }

  return (
    <ErrorBoundary>
      <motion.div 
        className="min-h-screen bg-background"
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
      >
        {/* Header */}
        <DashboardHeader />

        {/* Main Content */}
        <main 
          id="main-content"
          className="container mx-auto px-4 py-8 space-y-8"
          tabIndex={-1}
        >
          {/* Connection Status - Fixed Position */}
          <ConnectionStatus position="fixed" showDetails={true} />

          {/* Stats Overview */}
          <section aria-label="System Statistics">
            <Suspense fallback={<SkeletonStats />}>
              <StatsOverview 
                data={statsData?.stats} 
                error={statsError} 
                className="mb-8"
              />
            </Suspense>
          </section>

          {/* Main Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column - Rankings */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Top Performers Carousel */}
              <section aria-label="Top Performers">
                <Suspense fallback={<TopPerformersSkeleton />}>
                  <TopPerformers 
                    rankings={rankingsData?.rankings?.slice(0, 10) || []}
                    loading={rankingsLoading}
                    error={rankingsError}
                  />
                </Suspense>
              </section>

              {/* Main Rankings Table */}
              <section aria-label="Collaborator Rankings">
                <div className="bg-card rounded-xl border border-border shadow-sm">
                  <div className="p-6 border-b border-border">
                    <h2 className="text-xl font-semibold text-foreground">
                      Collaborator Rankings
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Real-time performance rankings of all DAO contributors
                    </p>
                  </div>
                  
                  <Suspense fallback={<RankingsTableSkeleton />}>
                    <RankingsTable 
                      data={rankingsData?.rankings || []}
                      loading={rankingsLoading}
                      error={rankingsError}
                      pagination={rankingsData?.pagination}
                    />
                  </Suspense>
                </div>
              </section>
            </div>

            {/* Right Column - Visualizations & Activity */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Visualization Panel */}
              <section aria-label="Data Visualizations">
                <Suspense fallback={<VisualizationSkeleton />}>
                  <VisualizationPanel 
                    rankings={rankingsData?.rankings || []}
                    stats={statsData?.stats}
                    loading={rankingsLoading}
                  />
                </Suspense>
              </section>

              {/* Live Activity Feed */}
              <section aria-label="Live Activity Feed">
                <Suspense fallback={<ActivitySkeleton />}>
                  <LiveActivity 
                    activities={activityData?.activities || []}
                    className="sticky top-8"
                  />
                </Suspense>
              </section>
            </div>
          </div>

          {/* Bottom Section - Extended Visualizations (Optional) */}
          {preferences.showAnimations && (
            <section aria-label="Extended Analytics" className="mt-12">
              <AnimatePresence mode="wait">
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-8"
                >
                  {/* Collaboration Network Visualization */}
                  <div className="bg-card rounded-xl border border-border p-6">
                    <h3 className="text-lg font-semibold mb-4">Collaboration Network</h3>
                    <div className="h-64 flex items-center justify-center text-muted-foreground">
                      <span>Network visualization coming soon...</span>
                    </div>
                  </div>

                  {/* Activity Heatmap */}
                  <div className="bg-card rounded-xl border border-border p-6">
                    <h3 className="text-lg font-semibold mb-4">Activity Heatmap</h3>
                    <div className="h-64 flex items-center justify-center text-muted-foreground">
                      <span>Heatmap visualization coming soon...</span>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </section>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-border bg-muted/30 py-8 mt-16">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-sm text-muted-foreground">
                © 2024 CryptoGift DAO. All rights reserved.
              </div>
              
              <div className="flex items-center space-x-4 mt-4 md:mt-0">
                <span className="text-sm text-muted-foreground">
                  Powered by{' '}
                  <a 
                    href="https://base.org" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline"
                  >
                    Base
                  </a>
                </span>
                
                <div className="h-4 w-px bg-border" />
                
                <a
                  href="https://github.com/cryptogift-dao"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  GitHub
                </a>
              </div>
            </div>
          </div>
        </footer>
      </motion.div>
    </ErrorBoundary>
  )
}

// Skeleton Components for Loading States
function PageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="h-16 border-b border-border bg-card" />
      <div className="container mx-auto px-4 py-8 space-y-8">
        <SkeletonStats />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <RankingsTableSkeleton />
          </div>
          <div className="lg:col-span-4 space-y-6">
            <VisualizationSkeleton />
            <ActivitySkeleton />
          </div>
        </div>
      </div>
    </div>
  )
}

function TopPerformersSkeleton() {
  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="h-6 w-32 bg-muted rounded animate-pulse" />
        <div className="h-4 w-24 bg-muted rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonRankingCard key={i} />
        ))}
      </div>
    </div>
  )
}

function RankingsTableSkeleton() {
  return (
    <div className="p-6">
      <div className="space-y-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <SkeletonRankingCard key={i} />
        ))}
      </div>
    </div>
  )
}

function VisualizationSkeleton() {
  return (
    <div className="bg-card rounded-xl border border-border p-6 space-y-4">
      <div className="h-6 w-40 bg-muted rounded animate-pulse" />
      <SkeletonChart height="h-48" />
    </div>
  )
}

function ActivitySkeleton() {
  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="h-6 w-32 bg-muted rounded animate-pulse mb-4" />
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-3">
            <div className="h-8 w-8 bg-muted rounded-full animate-pulse" />
            <div className="flex-1 space-y-1">
              <div className="h-3 w-3/4 bg-muted rounded animate-pulse" />
              <div className="h-2 w-1/2 bg-muted rounded animate-pulse" />
            </div>
            <div className="h-2 w-12 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}