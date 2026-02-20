'use client'

/**
 * FeaturedTasks - Featured & Urgent Tasks Section
 *
 * Displays pinned/featured tasks at the top of the task list.
 * Shows high-value and urgent tasks prominently.
 *
 * @author CryptoGift Wallets DAO
 * @version 2.0.0
 */

import { useTranslations } from 'next-intl'
import { TASK_DOMAINS, TASK_TYPES, type TaskDomain, type TaskType } from '@/lib/tasks/task-constants'

interface FeaturedTask {
  id: string
  task_id: string
  title: string
  description: string | null
  reward_cgc: number
  complexity: number
  estimated_days: number
  domain: TaskDomain | null
  category: string | null
  task_type: TaskType | null
  is_featured: boolean
  is_urgent: boolean
}

interface FeaturedTasksProps {
  tasks: FeaturedTask[]
  onTaskClick: (task: FeaturedTask) => void
  className?: string
}

export function FeaturedTasks({ tasks, onTaskClick, className = '' }: FeaturedTasksProps) {
  const t = useTranslations('tasks')

  // Filter to only featured or urgent tasks
  const featuredTasks = tasks.filter((task) => task.is_featured || task.is_urgent)

  // If no featured tasks, don't render
  if (featuredTasks.length === 0) {
    return null
  }

  // Sort by urgency first, then by reward
  const sortedTasks = featuredTasks.sort((a, b) => {
    // Urgent tasks first
    if (a.is_urgent && !b.is_urgent) return -1
    if (!a.is_urgent && b.is_urgent) return 1
    // Then by reward
    return b.reward_cgc - a.reward_cgc
  })

  return (
    <div className={`${className}`}>
      {/* Section header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">📌</span>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('featured.title')}</h2>
        <span className="text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-500/20 dark:to-orange-500/20 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30">
          {featuredTasks.length} {t('featured.tasks')}
        </span>
      </div>

      {/* Featured tasks grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedTasks.slice(0, 6).map((task) => {
          const domainConfig = task.domain ? TASK_DOMAINS[task.domain] : null
          const typeConfig = task.task_type ? TASK_TYPES[task.task_type] : null

          return (
            <button
              key={task.id}
              onClick={() => onTaskClick(task)}
              className={`
                relative p-4 rounded-xl text-left transition-all duration-300
                bg-white/80 dark:bg-white/[0.07]
                border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20
                hover:shadow-lg hover:shadow-purple-500/10
                hover:-translate-y-0.5
                ${task.is_urgent ? 'ring-2 ring-red-500/50' : ''}
              `}
            >
              {/* Badges */}
              <div className="absolute top-3 right-3 flex gap-1">
                {task.is_urgent && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-500/30 animate-pulse">
                    🔥 {t('badges.urgent')}
                  </span>
                )}
                {task.is_featured && !task.is_urgent && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30">
                    ⭐ {t('badges.featured')}
                  </span>
                )}
              </div>

              {/* Domain & Type */}
              <div className="flex items-center gap-2 mb-2">
                {domainConfig && (
                  <span
                    className="px-2 py-0.5 text-xs rounded-full"
                    style={{
                      backgroundColor: `${domainConfig.color}20`,
                      color: domainConfig.color,
                    }}
                  >
                    {domainConfig.emoji} {domainConfig.label}
                  </span>
                )}
                {typeConfig && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/60">
                    {typeConfig.emoji} {typeConfig.label}
                  </span>
                )}
              </div>

              {/* Title */}
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 pr-16">{task.title}</h3>

              {/* Description preview */}
              {task.description && (
                <p className="text-sm text-gray-500 dark:text-white/50 line-clamp-2 mb-3">{task.description}</p>
              )}

              {/* Stats */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <span className="text-cyan-600 dark:text-cyan-400 font-bold">
                    {task.reward_cgc.toLocaleString()} CGC
                  </span>
                  <span className="text-gray-400 dark:text-white/40">
                    {task.estimated_days} {t('days')}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(task.complexity, 5) }).map((_, i) => (
                    <span
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full ${
                        task.complexity >= 8
                          ? 'bg-red-400'
                          : task.complexity >= 6
                            ? 'bg-orange-400'
                            : task.complexity >= 4
                              ? 'bg-yellow-400'
                              : 'bg-green-400'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Divider */}
      <div className="mt-6 mb-4 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-white/10 to-transparent" />
    </div>
  )
}

export default FeaturedTasks
