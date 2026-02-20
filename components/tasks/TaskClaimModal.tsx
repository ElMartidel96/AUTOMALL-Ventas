/**
 * 🎯 Task Claim Confirmation Modal
 *
 * Shows task details and requires confirmation before claiming
 * 🌐 i18n: Full translation support for EN/ES
 */

'use client'

import React from 'react'
import { useTranslations, useLocale } from 'next-intl'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Clock,
  Coins,
  Code,
  MessageSquare,
  FileText,
  Calendar,
  Zap,
  TrendingUp,
  AlertTriangle,
  Timer,
  Loader2
} from 'lucide-react'
import type { Task } from '@/lib/supabase/types'
import { TASK_CLAIM_CONFIG } from '@/lib/tasks/task-service'

interface TaskClaimModalProps {
  task: Task | null
  isOpen: boolean
  onClose: () => void
  onConfirmClaim: () => void
  isClaimingTask: boolean
}

export function TaskClaimModal({
  task,
  isOpen,
  onClose,
  onConfirmClaim,
  isClaimingTask
}: TaskClaimModalProps) {
  // 🌐 Translation hooks
  const t = useTranslations('tasks.claimModal')
  const tCommon = useTranslations('common')
  const locale = useLocale()

  if (!task) return null

  // Get translated task content from database ONLY (no JSON lookup to avoid MISSING_MESSAGE)
  const taskWithTranslations = task as Task & { title_es?: string; description_es?: string }
  const translatedTask = {
    title: locale === 'es' && taskWithTranslations.title_es
      ? taskWithTranslations.title_es
      : task.title,
    description: locale === 'es' && taskWithTranslations.description_es
      ? taskWithTranslations.description_es
      : task.description
  }

  // Get platform icon
  const getPlatformIcon = () => {
    switch (task.platform) {
      case 'github':
        return <Code className="w-5 h-5" />
      case 'discord':
        return <MessageSquare className="w-5 h-5" />
      case 'manual':
        return <FileText className="w-5 h-5" />
      default:
        return <Zap className="w-5 h-5" />
    }
  }

  // Get complexity color - Light/Dark mode support
  const getComplexityColor = () => {
    if (task.complexity <= 3) return 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/20'
    if (task.complexity <= 6) return 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'
    if (task.complexity <= 8) return 'bg-orange-100 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-500/20'
    return 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20'
  }

  // Calculate claim timeout info
  const timeoutHours = TASK_CLAIM_CONFIG.getClaimTimeoutHours(task.estimated_days)
  const timeoutDisplay = timeoutHours >= 24 
    ? `${Math.floor(timeoutHours / 24)}d ${Math.floor(timeoutHours % 24)}h`
    : `${timeoutHours}h`

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3 text-xl">
            {getPlatformIcon()}
            <span>{t('title')}</span>
          </DialogTitle>
          <DialogDescription>
            {t('description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Task Title and Category */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{translatedTask.title}</h3>
            <div className="flex items-center flex-wrap gap-2 mb-3">
              <Badge className={`border ${getComplexityColor()}`}>
                {t('complexityLabel')} {task.complexity}/10
              </Badge>
              {task.category && (
                <Badge className="capitalize bg-cyan-100 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/20">
                  {task.category}
                </Badge>
              )}
              {task.priority && (
                <Badge
                  className={`capitalize ${
                    task.priority === 'critical'
                      ? 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20'
                      : task.priority === 'high'
                        ? 'bg-orange-100 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-500/20'
                        : 'bg-gray-100 dark:bg-white/[0.05] text-gray-700 dark:text-white/70 border border-gray-200 dark:border-white/[0.1]'
                  }`}
                >
                  {task.priority}
                </Badge>
              )}
            </div>
          </div>

          {/* Task Description */}
          {translatedTask.description && (
            <div className="p-4 bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06] rounded-xl">
              <h4 className="text-sm font-semibold text-cyan-600 dark:text-cyan-400 mb-2">{t('descriptionLabel')}</h4>
              <p className="text-sm text-gray-600 dark:text-white/70 leading-relaxed whitespace-pre-wrap">
                {translatedTask.description}
              </p>
            </div>
          )}

          {/* Task Metrics - Light/Dark Mode */}
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center space-x-3 p-4 bg-amber-50 dark:bg-white/[0.03] border border-amber-200 dark:border-white/[0.08] rounded-xl hover:bg-amber-100 dark:hover:bg-white/[0.06] hover:border-amber-300 dark:hover:border-white/[0.12] transition-all duration-300">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/20 flex items-center justify-center flex-shrink-0">
                <Coins className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-white/50">{t('rewardLabel')}</p>
                <p className="font-semibold text-amber-600 dark:text-amber-400">{task.reward_cgc} CGC</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 bg-cyan-50 dark:bg-white/[0.03] border border-cyan-200 dark:border-white/[0.08] rounded-xl hover:bg-cyan-100 dark:hover:bg-white/[0.06] hover:border-cyan-300 dark:hover:border-white/[0.12] transition-all duration-300">
              <div className="w-10 h-10 rounded-full bg-cyan-100 dark:bg-cyan-500/10 border border-cyan-300 dark:border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-white/50">{t('estimatedLabel')}</p>
                <p className="font-semibold text-cyan-600 dark:text-cyan-400">{task.estimated_days} {tCommon('days')}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 bg-purple-50 dark:bg-white/[0.03] border border-purple-200 dark:border-white/[0.08] rounded-xl hover:bg-purple-100 dark:hover:bg-white/[0.06] hover:border-purple-300 dark:hover:border-white/[0.12] transition-all duration-300">
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-500/10 border border-purple-300 dark:border-purple-500/20 flex items-center justify-center flex-shrink-0">
                <Timer className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-white/50">{t('claimTimeLabel')}</p>
                <p className="font-semibold text-purple-600 dark:text-purple-400">{timeoutDisplay}</p>
              </div>
            </div>
          </div>

          {/* Required Skills */}
          {task.required_skills && task.required_skills.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-purple-600 dark:text-purple-400 mb-3">{t('requiredSkills')}</h4>
              <div className="flex flex-wrap gap-2">
                {task.required_skills.map((skill, index) => (
                  <Badge key={index} className="text-xs bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/20 hover:bg-purple-200 dark:hover:bg-purple-500/20 transition-all">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-green-600 dark:text-green-400 mb-3">{t('tags')}</h4>
              <div className="flex flex-wrap gap-2">
                {task.tags.map((tag, index) => (
                  <Badge key={index} className="text-xs bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-500/20 hover:bg-green-200 dark:hover:bg-green-500/20 transition-all">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Important Notice - Light/Dark Mode */}
          <div className="p-4 bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-xl">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-amber-700 dark:text-amber-400">{t('importantNotice')}</h4>
                <div className="text-xs text-gray-600 dark:text-white/60 space-y-1">
                  <p>• {t('exclusiveAccessNotice', { time: timeoutDisplay })}</p>
                  <p>• {t('afterTimeoutNotice')}</p>
                  <p>• {t('canStillCompleteNotice')}</p>
                  <p>• {t('submitBeforeOthersNotice')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-white/[0.08]">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isClaimingTask}
            className="bg-gray-100 dark:bg-white/[0.03] border-gray-300 dark:border-white/[0.08] text-gray-700 dark:text-white/70 hover:bg-gray-200 dark:hover:bg-white/[0.08] hover:text-gray-900 dark:hover:text-white hover:border-gray-400 dark:hover:border-white/[0.15] transition-all"
          >
            {t('cancel')}
          </Button>
          <Button
            onClick={onConfirmClaim}
            disabled={isClaimingTask}
            className="min-w-[140px] bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all border border-cyan-400/30"
          >
            {isClaimingTask ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('claiming')}
              </>
            ) : (
              <>
                <TrendingUp className="w-4 h-4 mr-2" />
                {t('claimTask')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}