/**
 * 📋 Task Details Modal - PREMIUM EDITION
 *
 * Stunning modal with glass morphism, holographic effects,
 * and smooth animations. Enterprise-level design.
 * 🌐 i18n: Full translation support for EN/ES
 */

'use client'

import React from 'react'
import { useTranslations, useLocale } from 'next-intl'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Clock,
  Coins,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Copy,
  MessageCircle,
  Github,
  FileText,
  Zap,
  Target,
  Users,
  Calendar,
  Star,
  Shield,
  Sparkles,
  Rocket
} from 'lucide-react'
import type { Task } from '@/lib/supabase/types'

// Inline keyframes for premium animations
const modalAnimations = `
  @keyframes modal-shimmer {
    0% { transform: translateX(-100%) rotate(15deg); }
    100% { transform: translateX(200%) rotate(15deg); }
  }

  @keyframes modal-glow {
    0%, 100% {
      box-shadow: 0 0 20px rgba(59, 130, 246, 0.3),
                  0 0 40px rgba(147, 51, 234, 0.2);
    }
    50% {
      box-shadow: 0 0 30px rgba(147, 51, 234, 0.4),
                  0 0 60px rgba(59, 130, 246, 0.3);
    }
  }

  @keyframes float-subtle {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-5px); }
  }

  @keyframes gradient-shift {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }
`

interface TaskDetailsModalProps {
  task: Task
  isOpen: boolean
  onClose: () => void
  onClaim: () => void
  canClaim: boolean
  isClaimingTask: boolean
}

export function TaskDetailsModal({
  task,
  isOpen,
  onClose,
  onClaim,
  canClaim,
  isClaimingTask
}: TaskDetailsModalProps) {
  // 🌐 Translation hooks
  const t = useTranslations('tasks.detailsModal')
  const tCommon = useTranslations('common')
  const locale = useLocale()

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

  // Calculate difficulty visualization
  const getDifficultyStars = (complexity: number) => {
    return Array.from({ length: 10 }, (_, i) => (
      <Star
        key={i}
        className={`w-3 h-3 transition-all duration-300 ${
          i < complexity
            ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_3px_rgba(251,191,36,0.5)]'
            : 'text-gray-300 dark:text-gray-600'
        }`}
      />
    ))
  }

  // Get priority color and icon - Theme aware
  const getPriorityInfo = (priority: string) => {
    switch (priority) {
      case 'critical': return { color: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700/50', icon: AlertTriangle, label: t('priority.critical') }
      case 'high': return { color: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-700/50', icon: TrendingUp, label: t('priority.high') }
      case 'medium': return { color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700/50', icon: Clock, label: t('priority.medium') }
      case 'low': return { color: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700/50', icon: CheckCircle2, label: t('priority.low') }
      default: return { color: 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700', icon: Clock, label: t('priority.normal') }
    }
  }

  // Get platform icon
  const getPlatformIcon = () => {
    switch (task.platform) {
      case 'github': return <Github className="w-4 h-4" />
      case 'discord': return <MessageCircle className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  // Copy task ID to clipboard
  const copyTaskId = async () => {
    try {
      await navigator.clipboard.writeText(task.task_id)
      console.log('Task ID copied to clipboard')
    } catch (error) {
      console.error('Failed to copy task ID:', error)
    }
  }

  const priorityInfo = getPriorityInfo(task.priority)
  const estimatedUsdValue = (task.reward_cgc * 0.85).toFixed(2)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <style jsx>{modalAnimations}</style>

      <DialogContent className="max-w-4xl h-[90vh] p-0 flex flex-col overflow-hidden">
        {/* Animated background gradient */}
        <div className="absolute inset-0 opacity-30 dark:opacity-20 pointer-events-none overflow-hidden rounded-lg">
          <div
            className="absolute -top-20 -right-20 w-60 h-60 bg-purple-400 dark:bg-purple-500 rounded-full filter blur-3xl"
            style={{ animation: 'float-subtle 6s ease-in-out infinite' }}
          />
          <div
            className="absolute -bottom-20 -left-20 w-60 h-60 bg-blue-400 dark:bg-blue-500 rounded-full filter blur-3xl"
            style={{ animation: 'float-subtle 8s ease-in-out infinite 2s' }}
          />
        </div>

        {/* Premium Header with glass effect */}
        <DialogHeader className="relative px-6 py-5 flex-shrink-0 overflow-hidden border-b border-gray-200 dark:border-white/[0.08] bg-gray-50/50 dark:bg-white/[0.02]">
          {/* Subtle shimmer effect overlay */}
          <div
            className="absolute inset-0 w-[200%] h-full bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none"
            style={{ animation: 'modal-shimmer 4s infinite' }}
          />

          <div className="relative z-10 pr-10">
            <div className="flex items-center gap-2 mb-3">
              <Badge className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white border border-cyan-400/30 shadow-lg shadow-cyan-500/20">
                <Sparkles className="w-3 h-3 mr-1" />
                {tCommon('level')} {task.complexity}
              </Badge>
              <Badge variant="outline" className="bg-gray-100 dark:bg-white/[0.03] border-gray-300 dark:border-white/[0.08] text-gray-700 dark:text-white/70">
                {getPlatformIcon()}
                <span className="ml-1 capitalize">{task.platform}</span>
              </Badge>
            </div>

            <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              {translatedTask.title}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500 dark:text-white/50 mt-2">
              {t('subtitle', { level: task.complexity, taskId: task.task_id.slice(0, 8) })}
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Scrollable Content - NATIVE CSS OVERFLOW */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 custom-scrollbar">
          <div className="px-6 py-5 space-y-6">

            {/* Overview Section with Glass Cards */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center text-gray-900 dark:text-white">
                <Target className="w-5 h-5 mr-2 text-cyan-600 dark:text-cyan-400" />
                <span className="text-cyan-600 dark:text-cyan-400">
                  {t('overview')}
                </span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Reward Card - Glass */}
                <div className="relative p-5 rounded-xl overflow-hidden group bg-amber-50 dark:bg-white/[0.03] border border-amber-200 dark:border-white/[0.08] hover:bg-amber-100 dark:hover:bg-white/[0.06] hover:border-amber-300 dark:hover:border-white/[0.12] transition-all duration-300">
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-amber-600 dark:text-amber-400 flex items-center">
                        <Coins className="w-4 h-4 mr-2" />
                        {t('reward')}
                      </span>
                      <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/20 flex items-center justify-center">
                        <Coins className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">{task.reward_cgc} CGC</div>
                    <div className="text-sm text-gray-500 dark:text-white/50 mt-1">~${estimatedUsdValue} USD</div>
                  </div>
                </div>

                {/* Timeline Card - Glass */}
                <div className="relative p-5 rounded-xl overflow-hidden group bg-cyan-50 dark:bg-white/[0.03] border border-cyan-200 dark:border-white/[0.08] hover:bg-cyan-100 dark:hover:bg-white/[0.06] hover:border-cyan-300 dark:hover:border-white/[0.12] transition-all duration-300">
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-cyan-600 dark:text-cyan-400 flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        {t('timeline')}
                      </span>
                      <div className="w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-500/10 border border-cyan-300 dark:border-cyan-500/20 flex items-center justify-center">
                        <Clock className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">{task.estimated_days}</div>
                    <div className="text-sm text-gray-500 dark:text-white/50 mt-1">{t('daysEstimated')}</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Difficulty Card - Glass */}
                <div className="p-4 rounded-xl bg-purple-50 dark:bg-white/[0.03] border border-purple-200 dark:border-white/[0.08] hover:bg-purple-100 dark:hover:bg-white/[0.06] hover:border-purple-300 dark:hover:border-white/[0.12] transition-all duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-purple-600 dark:text-purple-400 flex items-center">
                      <Zap className="w-4 h-4 mr-1" />
                      {t('difficulty')}
                    </span>
                  </div>
                  <div className="flex items-center space-x-0.5 mb-2">
                    {getDifficultyStars(task.complexity)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-white/50">{tCommon('level')} {task.complexity}/10</div>
                </div>

                {/* Priority Card - Glass */}
                <div className="p-4 rounded-xl bg-red-50 dark:bg-white/[0.03] border border-red-200 dark:border-white/[0.08] hover:bg-red-100 dark:hover:bg-white/[0.06] hover:border-red-300 dark:hover:border-white/[0.12] transition-all duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-600 dark:text-white/70">{t('priorityLabel')}</span>
                    <priorityInfo.icon className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="font-bold text-lg text-red-600 dark:text-red-400">{priorityInfo.label}</div>
                </div>

                {/* Platform Card - Glass */}
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.08] hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:border-gray-300 dark:hover:border-white/[0.12] transition-all duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-600 dark:text-white/70">
                      {t('platform')}
                    </span>
                    <span className="text-cyan-600 dark:text-cyan-400">{getPlatformIcon()}</span>
                  </div>
                  <div className="font-bold text-lg text-gray-900 dark:text-white capitalize">{task.platform}</div>
                  <div className="text-xs text-gray-500 dark:text-white/50">{task.category}</div>
                </div>
              </div>
            </div>

            <Separator className="bg-gradient-to-r from-transparent via-gray-200 dark:via-white/10 to-transparent" />

            {/* Description Section */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg flex items-center text-gray-900 dark:text-white">
                <FileText className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
                <span className="text-green-600 dark:text-green-400">
                  {t('description')}
                </span>
              </h3>
              <div className="p-5 rounded-xl bg-green-50 dark:bg-white/[0.03] border border-green-200 dark:border-white/[0.08]">
                <p className="text-gray-700 dark:text-white/70 leading-relaxed whitespace-pre-wrap">
                  {translatedTask.description || t('noDescriptionProvided')}
                </p>
              </div>
            </div>

            <Separator className="bg-gradient-to-r from-transparent via-gray-200 dark:via-white/10 to-transparent" />

            {/* Technical Requirements */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg flex items-center text-gray-900 dark:text-white">
                <Shield className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
                <span className="text-purple-600 dark:text-purple-400">
                  {t('technicalRequirements')}
                </span>
              </h3>

              {task.required_skills && task.required_skills.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-600 dark:text-white/70 mb-3">{t('requiredSkills')}</h4>
                  <div className="flex flex-wrap gap-2">
                    {task.required_skills.map((skill, index) => (
                      <Badge
                        key={index}
                        className="bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/20 hover:bg-purple-200 dark:hover:bg-purple-500/20 hover:scale-105 transition-all"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {task.tags && task.tags.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-600 dark:text-white/70 mb-3">{t('tags')}</h4>
                  <div className="flex flex-wrap gap-2">
                    {task.tags.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="text-xs bg-gray-100 dark:bg-white/[0.03] border-gray-300 dark:border-white/[0.08] text-gray-600 dark:text-white/60 hover:bg-gray-200 dark:hover:bg-white/[0.06] hover:scale-105 transition-all"
                      >
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Separator className="bg-gradient-to-r from-transparent via-gray-200 dark:via-white/10 to-transparent" />

            {/* Success Criteria */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg flex items-center text-gray-900 dark:text-white">
                <CheckCircle2 className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
                <span className="text-green-600 dark:text-green-400">
                  {t('successCriteria.title')}
                </span>
              </h3>
              <div className="p-5 rounded-xl bg-green-50 dark:bg-white/[0.03] border border-green-200 dark:border-white/[0.08]">
                <ul className="space-y-3 text-sm text-gray-700 dark:text-white/70">
                  {[1, 2, 3, 4].map((i) => (
                    <li key={i} className="flex items-center group">
                      <CheckCircle2 className="w-4 h-4 mr-3 text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform" />
                      <span>{t(`successCriteria.item${i}`)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <Separator className="bg-gradient-to-r from-transparent via-gray-200 dark:via-white/10 to-transparent" />

            {/* Completion Process */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg flex items-center text-gray-900 dark:text-white">
                <Users className="w-5 h-5 mr-2 text-cyan-600 dark:text-cyan-400" />
                <span className="text-cyan-600 dark:text-cyan-400">
                  {t('completionProcess.title')}
                </span>
              </h3>
              <div className="p-5 rounded-xl bg-cyan-50 dark:bg-white/[0.03] border border-cyan-200 dark:border-white/[0.08]">
                <ol className="space-y-4 text-sm text-gray-700 dark:text-white/70">
                  {[1, 2, 3, 4, 5].map((step) => (
                    <li key={step} className="flex items-start group">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs mr-3 mt-0.5 font-bold text-white transition-transform group-hover:scale-110 ${
                          step === 5
                            ? 'bg-green-500/80'
                            : 'bg-cyan-500/80'
                        }`}
                      >
                        {step}
                      </span>
                      <span>
                        <strong className="text-gray-800 dark:text-white/90">{t(`completionProcess.step${step}.title`)}</strong>
                        <span className="text-gray-600 dark:text-white/60"> - {t(`completionProcess.step${step}.desc`)}</span>
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

          </div>
        </div>

        {/* Premium Action Footer */}
        <div className="relative px-6 py-5 flex-shrink-0 overflow-hidden border-t border-gray-200 dark:border-white/[0.08] bg-gray-50/50 dark:bg-white/[0.02]">
          <div className="relative z-10 flex flex-col sm:flex-row gap-3">
            {canClaim && (
              <Button
                onClick={onClaim}
                disabled={isClaimingTask}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all hover:scale-[1.02] border border-cyan-400/30"
              >
                {isClaimingTask ? (
                  <>
                    <div className="w-4 h-4 animate-spin mr-2 border-2 border-white border-t-transparent rounded-full" />
                    {t('claiming')}
                  </>
                ) : (
                  <>
                    <Rocket className="w-4 h-4 mr-2" />
                    {t('claimThisTask')}
                  </>
                )}
              </Button>
            )}

            <Button
              onClick={copyTaskId}
              variant="outline"
              className="flex-shrink-0 bg-gray-100 dark:bg-white/[0.03] border-gray-300 dark:border-white/[0.08] text-gray-700 dark:text-white/70 hover:bg-gray-200 dark:hover:bg-white/[0.08] hover:text-gray-900 dark:hover:text-white hover:scale-105 transition-all"
            >
              <Copy className="w-4 h-4 mr-2" />
              {t('copyTaskId')}
            </Button>

            <Button
              variant="outline"
              className="flex-shrink-0 bg-gray-100 dark:bg-white/[0.03] border-gray-300 dark:border-white/[0.08] text-gray-700 dark:text-white/70 hover:bg-gray-200 dark:hover:bg-white/[0.08] hover:text-gray-900 dark:hover:text-white hover:scale-105 transition-all"
              onClick={() => {
                console.log('Opening help for task:', task.task_id)
              }}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              {t('askQuestions')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
