'use client'

/**
 * TaskDomainNav - Domain Navigation Component
 *
 * Displays clickable tabs for each task domain with task counts.
 * Part of the Task System v2.0 upgrade.
 *
 * @author CryptoGift Wallets DAO
 * @version 2.0.0
 */

import { useTranslations } from 'next-intl'
import { TASK_DOMAINS, type TaskDomain } from '@/lib/tasks/task-constants'

interface TaskDomainNavProps {
  selectedDomain: TaskDomain | null
  onDomainChange: (domain: TaskDomain | null) => void
  taskCounts: Record<string, number>
  className?: string
}

export function TaskDomainNav({
  selectedDomain,
  onDomainChange,
  taskCounts,
  className = '',
}: TaskDomainNavProps) {
  const t = useTranslations('tasks')

  // Calculate total tasks
  const totalTasks = Object.values(taskCounts).reduce((a, b) => a + b, 0)

  // Get all domains for iteration
  const domains = Object.entries(TASK_DOMAINS) as [TaskDomain, (typeof TASK_DOMAINS)[TaskDomain]][]

  return (
    <div className={`glass-panel p-3 rounded-2xl ${className}`}>
      <div className="flex flex-wrap gap-2 justify-center md:justify-start">
        {/* All domains button */}
        <button
          onClick={() => onDomainChange(null)}
          className={`
            px-4 py-2.5 rounded-xl transition-all duration-300 font-medium
            flex items-center gap-2 text-sm
            ${
              !selectedDomain
                ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/25'
                : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10'
            }
          `}
          aria-pressed={!selectedDomain}
        >
          <span className="text-lg">🎯</span>
          <span>{t('domains.all')}</span>
          <span
            className={`
              text-xs px-2 py-0.5 rounded-full
              ${!selectedDomain ? 'bg-white/20' : 'bg-white/10'}
            `}
          >
            {totalTasks}
          </span>
        </button>

        {/* Domain buttons */}
        {domains.map(([key, domain]) => {
          const count = taskCounts[key] || 0
          const isSelected = selectedDomain === key

          return (
            <button
              key={key}
              onClick={() => onDomainChange(key)}
              className={`
                px-4 py-2.5 rounded-xl transition-all duration-300 font-medium
                flex items-center gap-2 text-sm
                ${
                  isSelected
                    ? 'text-white shadow-lg'
                    : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10'
                }
              `}
              style={
                isSelected
                  ? {
                      background: `linear-gradient(135deg, ${domain.color}, ${domain.color}99)`,
                      boxShadow: `0 4px 20px ${domain.color}40`,
                    }
                  : undefined
              }
              aria-pressed={isSelected}
            >
              <span className="text-lg">{domain.emoji}</span>
              <span className="hidden sm:inline">{domain.label}</span>
              <span
                className={`
                  text-xs px-2 py-0.5 rounded-full
                  ${isSelected ? 'bg-white/20' : 'bg-white/10'}
                `}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default TaskDomainNav
