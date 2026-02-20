/**
 * 🎯 Task Card Component
 *
 * Individual task display card with details and actions
 * 🌐 i18n: Full translation support for EN/ES
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Clock,
  Coins,
  Code,
  MessageSquare,
  FileText,
  TrendingUp,
  Calendar,
  Zap,
  Loader2,
  Timer,
  AlertTriangle
} from 'lucide-react'
import type { Task } from '@/lib/supabase/types'
import { TASK_CLAIM_CONFIG } from '@/lib/tasks/task-service'
import { TaskClaimModal } from './TaskClaimModal'

interface TaskCardProps {
  task: Task
  onClaim?: () => void
  onSubmit?: () => void
  onViewDetails?: () => void
  canClaim?: boolean
  showProgress?: boolean
  isClaimingTask?: boolean
  showClaimModal?: boolean
}

export function TaskCard({
  task,
  onClaim,
  onSubmit,
  onViewDetails,
  canClaim = true,
  showProgress = false,
  isClaimingTask = false,
  showClaimModal = true
}: TaskCardProps) {
  // 🌐 Translation hooks
  const t = useTranslations('tasks.card')
  const tTasks = useTranslations('tasks')
  const tCommon = useTranslations('common')
  const locale = useLocale()

  // Get translated task content from database ONLY (no fallback to JSON to avoid MISSING_MESSAGE errors)
  // Tasks without DB translations will display in English - this is intentional
  const taskWithTranslations = task as Task & { title_es?: string; description_es?: string }

  const translatedTask = {
    title: locale === 'es' && taskWithTranslations.title_es
      ? taskWithTranslations.title_es
      : task.title,  // Fallback to original title (no JSON lookup)
    description: locale === 'es' && taskWithTranslations.description_es
      ? taskWithTranslations.description_es
      : task.description  // Fallback to original description (no JSON lookup)
  }

  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false)
  // Get platform icon
  const getPlatformIcon = () => {
    switch (task.platform) {
      case 'github':
        return <Code className="w-4 h-4" />
      case 'discord':
        return <MessageSquare className="w-4 h-4" />
      case 'manual':
        return <FileText className="w-4 h-4" />
      default:
        return <Zap className="w-4 h-4" />
    }
  }

  // Get complexity color - Theme aware
  const getComplexityColor = () => {
    if (task.complexity <= 3) return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
    if (task.complexity <= 6) return 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300'
    if (task.complexity <= 8) return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300'
    return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
  }

  // Calculate progress if in progress (SSR-safe)
  const [progress, setProgress] = useState(0)
  const [remainingTime, setRemainingTime] = useState('')
  const [isExpired, setIsExpired] = useState(false)
  
  useEffect(() => {
    const calculateProgress = () => {
      if (!showProgress || task.status !== 'in_progress') return 0
      
      const startTime = new Date(task.created_at).getTime()
      const now = Date.now()
      const totalTime = task.estimated_days * 24 * 60 * 60 * 1000
      const elapsed = now - startTime
      
      return Math.min(100, Math.round((elapsed / totalTime) * 100))
    }

    const updateCountdown = () => {
      if ((task.status === 'claimed' || task.status === 'in_progress') && task.claimed_at) {
        const remainingMs = TASK_CLAIM_CONFIG.getRemainingTimeMs(task.claimed_at, task.estimated_days)
        const formattedTime = TASK_CLAIM_CONFIG.formatRemainingTime(remainingMs)
        const expired = remainingMs <= 0
        
        setRemainingTime(formattedTime)
        setIsExpired(expired)
      }
    }

    setProgress(calculateProgress())
    updateCountdown()
    
    // Update both progress and countdown every minute
    let interval: NodeJS.Timeout | null = null
    if (task.status === 'in_progress' || task.status === 'claimed') {
      interval = setInterval(() => {
        setProgress(calculateProgress())
        updateCountdown()
      }, 60000) // Update every minute
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [task.status, task.created_at, task.estimated_days, task.claimed_at, showProgress])

  return (
    <Card className="bg-white/80 dark:bg-slate-900/10 border border-gray-200 dark:border-white/[0.08] hover:border-gray-300 dark:hover:border-white/15 hover:bg-white dark:hover:bg-slate-900/15 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 spring-in backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between mb-2">
          <Badge variant="outline" className={`${getComplexityColor()} border-0`}>
            {t('level')} {task.complexity}
          </Badge>
          <Badge variant="outline" className="glass-bubble">
            {getPlatformIcon()}
            <span className="ml-1 capitalize">{task.platform}</span>
          </Badge>
        </div>
        
        <h3 className="font-semibold text-lg text-glass line-clamp-2">
          {translatedTask.title}
        </h3>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-glass-secondary line-clamp-3">
          {translatedTask.description || t('noDescription')}
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center space-x-2">
            <Coins className="w-4 h-4 text-amber-500" />
            <div>
              <p className="text-xs text-glass-secondary">{tCommon('balance')}</p>
              <p className="font-semibold text-glass">{task.reward_cgc} CGC</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-blue-500" />
            <div>
              <p className="text-xs text-glass-secondary">{tCommon('days')}</p>
              <p className="font-semibold text-glass">{task.estimated_days} {tCommon('days')}</p>
            </div>
          </div>
        </div>

        {/* Show assignee for claimed/in-progress tasks - Theme Aware */}
        {(task.status === 'claimed' || task.status === 'in_progress') && task.assignee_address && (
          <div className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/30">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${task.status === 'claimed' ? 'bg-yellow-500' : 'bg-blue-500'} animate-pulse`} />
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {task.status === 'claimed' ? t('claimedBy') : t('workingOn')}
              </span>
            </div>
            <span className="text-xs font-mono text-gray-900 dark:text-white">
              {task.assignee_address.slice(0, 6)}...{task.assignee_address.slice(-4)}
            </span>
          </div>
        )}

        {/* Countdown timer for claimed/in-progress tasks - Theme Aware */}
        {(task.status === 'claimed' || task.status === 'in_progress') && task.claimed_at && (
          <div className={`flex items-center justify-between p-2 rounded-lg ${
            isExpired
              ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30'
              : remainingTime.includes('h') && !remainingTime.includes('d')
                ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30'
                : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30'
          }`}>
            <div className="flex items-center space-x-2">
              {isExpired ? (
                <AlertTriangle className="w-4 h-4 text-red-500 dark:text-red-400" />
              ) : (
                <Timer className={`w-4 h-4 ${
                  remainingTime.includes('h') && !remainingTime.includes('d')
                    ? 'text-amber-500 dark:text-amber-400'
                    : 'text-green-500 dark:text-green-400'
                }`} />
              )}
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {isExpired ? t('expiredOpenToAll') : t('timeRemaining')}
              </span>
            </div>
            <span className={`text-xs font-semibold ${
              isExpired
                ? 'text-red-600 dark:text-red-400'
                : remainingTime.includes('h') && !remainingTime.includes('d')
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-green-600 dark:text-green-400'
            }`}>
              {remainingTime}
            </span>
          </div>
        )}

        {/* Progress bar for in-progress tasks - Theme Aware */}
        {showProgress && task.status === 'in_progress' && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
              <span>{tTasks('progress')}</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Evidence URLs for in-progress tasks */}
        {task.evidence_url && (
          <div className="pt-2 border-t">
            <p className="text-xs text-glass-secondary mb-1">{t('evidenceSubmitted')}</p>
            <a
              href={task.evidence_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-sm underline"
            >
              {t('viewEvidence')}
            </a>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex-col space-y-2">
        {task.status === 'available' && (
          <div className="flex w-full gap-2">
            <button
              onClick={onViewDetails}
              className="flex-1 min-w-0 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                bg-white/10 dark:bg-white/5 backdrop-blur-md
                border border-white/20 dark:border-white/10
                text-gray-700 dark:text-gray-200
                hover:bg-white/20 dark:hover:bg-white/10 hover:border-white/30 dark:hover:border-white/20
                transition-all duration-200 font-medium"
            >
              <FileText className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{tCommon('details')}</span>
            </button>
            <button
              onClick={showClaimModal ? () => setIsClaimModalOpen(true) : onClaim}
              disabled={!canClaim || isClaimingTask}
              className="flex-1 min-w-0 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                bg-gradient-to-r from-cyan-500 to-blue-600
                hover:from-cyan-400 hover:to-blue-500
                text-white font-semibold
                shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40
                border border-cyan-400/30
                transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-cyan-500/25"
            >
              {isClaimingTask ? (
                <>
                  <Loader2 className="w-4 h-4 flex-shrink-0 animate-spin" />
                  <span className="truncate">{t('claiming')}</span>
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{t('claimTask')}</span>
                </>
              )}
            </button>
          </div>
        )}

        {task.status === 'in_progress' && !task.evidence_url && (
          <Button
            onClick={onSubmit}
            className="w-full"
            variant="default"
          >
            <Clock className="w-4 h-4 mr-2" />
            {t('submitEvidence')}
          </Button>
        )}

        {task.status === 'in_progress' && task.evidence_url && (
          <Badge variant="outline" className="w-full justify-center py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-700/50">
            {t('pendingValidation')}
          </Badge>
        )}

        {task.status === 'completed' && (
          <Badge variant="outline" className="w-full justify-center py-2 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700/50">
            ✅ {t('completedBadge')}
          </Badge>
        )}
      </CardFooter>

      {/* Task Claim Confirmation Modal */}
      {showClaimModal && (
        <TaskClaimModal
          task={task}
          isOpen={isClaimModalOpen}
          onClose={() => setIsClaimModalOpen(false)}
          onConfirmClaim={() => {
            setIsClaimModalOpen(false)
            onClaim?.()
          }}
          isClaimingTask={isClaimingTask}
        />
      )}
    </Card>
  )
}