/**
 * 🎯 Tasks & Rewards Page - CRYSTAL EDITION
 *
 * Clean glass-crystal design following Home page aesthetic.
 * Uses theme-gradient-bg + subtle blur elements + glass-crystal cards.
 * 🌐 i18n: Full translation support for EN/ES
 */

'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { useAccount } from '@/lib/thirdweb'
import { useCGCBalance } from '@/lib/web3/hooks'
import { TaskList } from '@/components/tasks/TaskList'
import { TasksInProgress } from '@/components/tasks/TasksInProgress'
import { TaskProposal } from '@/components/tasks/TaskProposal'
import { ProposalList } from '@/components/proposals/ProposalList'
import { TaskHistory } from '@/components/tasks/TaskHistory'
import { LeaderboardTable } from '@/components/leaderboard/LeaderboardTable'
import { StatsOverview } from '@/components/leaderboard/StatsOverview'
import { TaskCategoryChips } from '@/components/tasks/TaskCategoryChips'
import { FeaturedTasks } from '@/components/tasks/FeaturedTasks'
import type { TaskCategory } from '@/lib/tasks/task-constants'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import {
  Trophy,
  Target,
  Clock,
  PlusCircle,
  Users,
  Zap,
  Award,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Rocket,
  Crown,
  Flame,
  History
} from 'lucide-react'

// Simple animations like Home page
const pageAnimations = `
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }

  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }

  @keyframes fade-in {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
`

export default function TasksPage() {
  // 🌐 Translation hooks
  const t = useTranslations('tasks')
  const tCommon = useTranslations('common')

  const { address, isConnected } = useAccount()
  const { balance } = useCGCBalance(address as `0x${string}` | undefined)
  const { success, error, warning, info } = useToast()

  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    availableTasks: 0,
    tasksInProgress: 0,
    completedTasks: 0,
    totalRewards: 0,
    activeCollaborators: 0,
    userRank: 0,
  })

  const [refreshKey, setRefreshKey] = useState(0)
  const [selectedTab, setSelectedTab] = useState('available')

  // Category filters for Task System v2.0
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory | null>(null)
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({})
  const [allTasks, setAllTasks] = useState<any[]>([])

  // Ref for scrolling to task list when clicking featured tasks
  const taskListRef = useRef<HTMLDivElement>(null)
  const [selectedTaskIdFromFeatured, setSelectedTaskIdFromFeatured] = useState<string | null>(null)

  // Load statistics
  useEffect(() => {
    loadStatistics()
  }, [address])

  // Reload when category changes
  useEffect(() => {
    loadStatistics()
  }, [selectedCategory])

  // Handle task click for featured tasks - scrolls to list and opens details
  const handleFeaturedTaskClick = (task: any) => {
    setSelectedTab('available')
    setSelectedTaskIdFromFeatured(task.task_id)

    // Scroll to task list section with smooth animation
    setTimeout(() => {
      taskListRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })
    }, 100)
  }

  // Clear selected task after modal is opened
  const handleTaskDetailsOpened = () => {
    setSelectedTaskIdFromFeatured(null)
  }

  const loadStatistics = async () => {
    try {
      setIsLoading(true)

      // Build filter query for category
      const filterParams = new URLSearchParams()
      filterParams.set('status', 'available')
      if (selectedCategory) filterParams.set('category', selectedCategory)

      // Fetch tasks statistics
      const [availableRes, progressRes, leaderboardRes] = await Promise.all([
        fetch(`/api/tasks?${filterParams.toString()}`),
        fetch('/api/tasks?status=in_progress'),
        fetch(`/api/leaderboard${address ? `?address=${address}` : ''}`),
      ])

      const availableData = await availableRes.json()
      const progressData = await progressRes.json()
      const leaderboardData = await leaderboardRes.json()

      // Store tasks and calculate category counts
      if (availableData.data) {
        setAllTasks(availableData.data)
        // Calculate category counts from tasks
        const catCounts: Record<string, number> = {}
        availableData.data.forEach((task: any) => {
          if (task.category) {
            catCounts[task.category] = (catCounts[task.category] || 0) + 1
          }
        })
        setCategoryCounts(catCounts)
      }

      setStats({
        availableTasks: availableData.count || 0,
        tasksInProgress: progressData.count || 0,
        completedTasks: leaderboardData.data?.statistics?.totalTasksCompleted || 0,
        totalRewards: leaderboardData.data?.statistics?.totalCGCDistributed || 0,
        activeCollaborators: leaderboardData.data?.statistics?.totalCollaborators || 0,
        userRank: leaderboardData.data?.userRank?.position || 0,
      })
    } catch (err) {
      console.error('Error loading statistics:', err)
      error(t('toasts.failedToLoadStats'), t('toasts.failedToLoadStatsDesc'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
    loadStatistics()
    info(t('toasts.refreshing'), t('toasts.refreshingDesc'))
  }

  const handleInitializeTasks = async () => {
    try {
      const adminToken = process.env.NEXT_PUBLIC_ADMIN_TOKEN || process.env.ADMIN_DAO_API_TOKEN

      const response = await fetch('/api/admin/init-tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
      })

      const data = await response.json()

      if (data.success) {
        success(
          t('toasts.tasksInitialized'),
          t('toasts.tasksInitializedDesc', { count: data.data.tasksCreated, rewards: data.data.totalRewards })
        )
        handleRefresh()
      } else {
        error(t('toasts.initFailed'), data.error)
      }
    } catch (err) {
      console.error('Error initializing tasks:', err)
      error(t('toasts.errorInitializing'), tCommon('pleaseRetry'))
    }
  }

  return (
    <div className="min-h-screen theme-gradient-bg text-gray-900 dark:text-white overflow-hidden">
      <style jsx>{pageAnimations}</style>

      {/* Animated background elements - exactly like Funding page */}
      <div className="fixed inset-0 opacity-30 dark:opacity-20 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-400 dark:bg-cyan-600 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl animate-pulse" />
        <div className="absolute top-60 right-20 w-72 h-72 bg-purple-400 dark:bg-purple-600 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl animate-pulse" />
        <div className="absolute bottom-40 left-1/4 w-72 h-72 bg-blue-400 dark:bg-blue-600 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl animate-pulse" />
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <header
          className="mb-8"
          style={{ animation: 'fade-in 0.6s ease-out' }}
        >
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              {/* Title with Icon */}
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 shadow-lg">
                  <Target className="w-7 h-7 text-white" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 via-blue-500 to-cyan-500 bg-clip-text text-transparent">
                  {t('title')}
                </h1>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-base ml-1">
                {t('subtitle')}
              </p>
            </div>

            {/* Action Badges */}
            <div className="flex flex-wrap items-center gap-3">
              {address && (
                <div className="glass-crystal flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 hover:scale-105">
                  <Crown className="w-4 h-4 text-amber-500" />
                  <span className="font-semibold text-amber-700 dark:text-amber-300 text-sm">
                    {t('page.rankLabel')} #{stats.userRank || '—'}
                  </span>
                </div>
              )}
              <div className="glass-crystal flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 hover:scale-105">
                <Zap className="w-4 h-4 text-purple-500" />
                <span className="font-semibold text-purple-700 dark:text-purple-300 text-sm">
                  {balance} {tCommon('cgc')}
                </span>
              </div>
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                className="glass-crystal rounded-full px-4 hover:scale-105 transition-all duration-300"
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                {tCommon('refresh')}
              </Button>
            </div>
          </div>
        </header>

        {/* Statistics Overview */}
        <div style={{ animation: 'fade-in 0.6s ease-out 0.1s backwards' }}>
          <StatsOverview
            stats={{
              available: stats.availableTasks,
              inProgress: stats.tasksInProgress,
              completed: stats.completedTasks,
              totalRewards: stats.totalRewards,
              collaborators: stats.activeCollaborators,
            }}
            isLoading={isLoading}
          />
        </div>

        {/* Tabs Container */}
        <div
          className="mt-8"
          style={{ animation: 'fade-in 0.6s ease-out 0.2s backwards' }}
        >
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            {/* Tab List - Same style as stats cards */}
            <div className="glass-panel p-2 rounded-2xl shadow-lg mb-6">
              <TabsList className="grid w-full grid-cols-5 bg-transparent gap-2 h-auto">
                {[
                  { value: 'available', icon: Target, label: t('tabs.available'), color: 'from-blue-500 to-cyan-500' },
                  { value: 'progress', icon: Clock, label: t('tabs.inProgress'), color: 'from-amber-500 to-orange-500' },
                  { value: 'history', icon: History, label: t('tabs.history'), color: 'from-teal-500 to-emerald-500' },
                  { value: 'leaderboard', icon: Trophy, label: t('tabs.leaderboard'), color: 'from-purple-500 to-pink-500' },
                  { value: 'propose', icon: PlusCircle, label: t('tabs.propose'), color: 'from-green-500 to-emerald-500' },
                ].map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className={`flex items-center justify-center gap-2 h-11 px-4 rounded-xl font-medium text-sm transition-all duration-300
                      data-[state=active]:text-white data-[state=active]:shadow-md
                      data-[state=inactive]:text-gray-400 dark:data-[state=inactive]:text-gray-400
                      data-[state=inactive]:hover:bg-white/10 dark:data-[state=inactive]:hover:bg-white/10
                      ${selectedTab === tab.value ? `bg-gradient-to-r ${tab.color}` : 'bg-transparent'}`}
                  >
                    <tab.icon className="w-4 h-4 flex-shrink-0" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* Available Tasks Tab */}
            <TabsContent value="available">
              {/* Featured & Urgent Tasks - Task System v2.0 */}
              {allTasks.length > 0 && (
                <FeaturedTasks
                  tasks={allTasks}
                  onTaskClick={handleFeaturedTaskClick}
                  className="mb-6"
                />
              )}

              {/* Category Filter Chips - Task System v2.0 */}
              <div className="mb-6">
                <TaskCategoryChips
                  selectedDomain={null}
                  selectedCategory={selectedCategory}
                  onCategoryChange={setSelectedCategory}
                  categoryCounts={categoryCounts}
                />
              </div>

              <div
                ref={taskListRef}
                className="bg-white/80 dark:bg-white/[0.07] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-xl backdrop-blur-sm scroll-mt-4"
              >
                {/* Card Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 shadow-md">
                        <Target className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                          {t('page.availableTasksTitle')}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {t('page.availableTasksDescription')}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 shadow-md px-3 py-1">
                      <Flame className="w-3.5 h-3.5 mr-1" />
                      {stats.availableTasks}
                    </Badge>
                  </div>
                </div>
                <div className="p-6">
                  <TaskList
                    userAddress={address}
                    refreshKey={refreshKey}
                    onTaskClaimed={() => {
                      success(t('toasts.taskClaimed'), t('toasts.taskClaimedDesc'))
                      handleRefresh()
                    }}
                    category={selectedCategory}
                    initialSelectedTaskId={selectedTaskIdFromFeatured}
                    onTaskDetailsOpened={handleTaskDetailsOpened}
                  />
                </div>
              </div>

              {/* Admin: Initialize Tasks Button */}
              {stats.availableTasks === 0 && (
                <div className="mt-6 glass-panel rounded-2xl p-6 border-l-4 border-amber-400">
                  <div className="flex items-start space-x-4">
                    <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/30">
                      <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-amber-900 dark:text-amber-100">
                        {t('page.noTasksAvailable')}
                      </h4>
                      <p className="text-amber-700 dark:text-amber-300 text-sm mt-1">
                        {t('page.noTasksMessage')}
                      </p>
                      <Button
                        onClick={handleInitializeTasks}
                        className="mt-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-md hover:shadow-lg transition-all hover:scale-105"
                        size="sm"
                      >
                        <Rocket className="w-4 h-4 mr-2" />
                        {t('page.initializeTasks')}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* In Progress Tab */}
            <TabsContent value="progress">
              <div className="glass-panel rounded-2xl overflow-hidden shadow-xl">
                <div className="px-6 py-4 border-b border-gray-200/50 dark:border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 shadow-md">
                        <Clock className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                          {t('page.inProgressTitle')}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {t('page.inProgressDescription')}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-md px-3 py-1">
                      <Clock className="w-3.5 h-3.5 mr-1" />
                      {stats.tasksInProgress}
                    </Badge>
                  </div>
                </div>
                <div className="p-6">
                  <TasksInProgress
                    userAddress={address}
                    refreshKey={refreshKey}
                    onTaskSubmitted={() => {
                      success(t('toasts.evidenceSubmitted'), t('toasts.evidenceSubmittedDesc'))
                      handleRefresh()
                    }}
                  />
                </div>
              </div>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history">
              <div className="glass-panel rounded-2xl overflow-hidden shadow-xl">
                <div className="px-6 py-4 border-b border-gray-200/50 dark:border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-500 shadow-md">
                        <History className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                          {t('history.title')}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {t('history.description')}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white border-0 shadow-md px-3 py-1">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      {stats.completedTasks}
                    </Badge>
                  </div>
                </div>
                <div className="p-6">
                  <TaskHistory
                    userAddress={address}
                    refreshKey={refreshKey}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Leaderboard Tab */}
            <TabsContent value="leaderboard">
              <div className="glass-panel rounded-2xl overflow-hidden shadow-xl">
                <div className="px-6 py-4 border-b border-gray-200/50 dark:border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 shadow-md">
                        <Trophy className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                          {t('page.leaderboardTitle')}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {t('page.leaderboardDescription')}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-md px-3 py-1">
                      <Users className="w-3.5 h-3.5 mr-1" />
                      {stats.activeCollaborators}
                    </Badge>
                  </div>
                </div>
                <div className="p-6">
                  <LeaderboardTable
                    userAddress={address}
                    refreshKey={refreshKey}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Propose Task Tab */}
            <TabsContent value="propose">
              <div className="space-y-8">
                {/* Proposal Form Section */}
                <div className="glass-panel rounded-2xl overflow-hidden shadow-xl">
                  <div className="px-6 py-4 border-b border-gray-200/50 dark:border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 shadow-md">
                        <PlusCircle className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                          {t('page.proposeTitle')}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {t('page.proposeDescription')}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <TaskProposal
                      userAddress={address}
                      onProposalSubmitted={() => {
                        success(t('toasts.proposalSubmitted'), t('toasts.proposalSubmittedDesc'))
                        setRefreshKey(prev => prev + 1)
                      }}
                    />
                  </div>
                </div>

                {/* Community Proposals List Section */}
                <div className="glass-panel rounded-2xl overflow-hidden shadow-xl">
                  <div className="px-6 py-4 border-b border-gray-200/50 dark:border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 shadow-md">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                          {t('page.communityProposals')}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {t('page.communityProposalsDesc')}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <ProposalList
                      userAddress={address}
                      refreshKey={refreshKey}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer Stats */}
        <footer
          className="mt-8 glass-crystal rounded-2xl p-5 shadow-lg"
          style={{ animation: 'fade-in 0.6s ease-out 0.3s backwards' }}
        >
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                {t('page.systemOperational')}
              </span>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="font-medium text-green-700 dark:text-green-300">
                  {stats.completedTasks} {t('page.completedLabel')}
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10">
                <Award className="w-4 h-4 text-amber-500" />
                <span className="font-medium text-amber-700 dark:text-amber-300">
                  {stats.totalRewards.toFixed(0)} {t('page.cgcDistributed')}
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10">
                <Users className="w-4 h-4 text-blue-500" />
                <span className="font-medium text-blue-700 dark:text-blue-300">
                  {stats.activeCollaborators} {t('page.contributorsLabel')}
                </span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
