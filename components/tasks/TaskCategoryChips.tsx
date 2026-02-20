'use client'

/**
 * TaskCategoryChips - Category Filter Chips Component
 *
 * Displays clickable chips for filtering tasks by category.
 * Shows only categories relevant to the selected domain.
 *
 * @author CryptoGift Wallets DAO
 * @version 2.0.0
 */

import { useTranslations } from 'next-intl'
import {
  TASK_CATEGORIES,
  getCategoriesForDomain,
  type TaskCategory,
  type TaskDomain,
} from '@/lib/tasks/task-constants'

interface TaskCategoryChipsProps {
  selectedDomain: TaskDomain | null
  selectedCategory: TaskCategory | null
  onCategoryChange: (category: TaskCategory | null) => void
  categoryCounts?: Record<string, number>
  className?: string
}

export function TaskCategoryChips({
  selectedDomain,
  selectedCategory,
  onCategoryChange,
  categoryCounts = {},
  className = '',
}: TaskCategoryChipsProps) {
  const t = useTranslations('tasks')

  // Get categories for the selected domain, or all if no domain selected
  const categories: TaskCategory[] = selectedDomain
    ? getCategoriesForDomain(selectedDomain)
    : (Object.keys(TASK_CATEGORIES) as TaskCategory[])

  // Filter to only show categories with tasks (if counts provided)
  const visibleCategories = Object.keys(categoryCounts).length > 0
    ? categories.filter((cat) => (categoryCounts[cat] || 0) > 0)
    : categories

  // If no visible categories, don't render
  if (visibleCategories.length === 0) {
    return null
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {/* All categories button */}
      <button
        onClick={() => onCategoryChange(null)}
        className={`
          px-3 py-1.5 rounded-lg transition-all duration-200 text-xs font-medium
          ${
            !selectedCategory
              ? 'bg-gradient-to-r from-cyan-500/80 to-purple-500/80 text-white'
              : 'bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-white/10'
          }
        `}
      >
        {t('filters.allCategories')}
      </button>

      {/* Category chips */}
      {visibleCategories.map((cat) => {
        const config = TASK_CATEGORIES[cat]
        const count = categoryCounts[cat] || 0
        const isSelected = selectedCategory === cat

        return (
          <button
            key={cat}
            onClick={() => onCategoryChange(cat)}
            className={`
              px-3 py-1.5 rounded-lg transition-all duration-200 text-xs font-medium
              flex items-center gap-1.5
              ${
                isSelected
                  ? 'bg-gradient-to-r from-cyan-500/80 to-purple-500/80 text-white'
                  : 'bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-white/10'
              }
            `}
          >
            <span>{config.emoji}</span>
            <span>{config.label}</span>
            {count > 0 && (
              <span
                className={`
                  px-1.5 py-0.5 rounded text-[10px]
                  ${isSelected ? 'bg-white/20' : 'bg-gray-200 dark:bg-white/10'}
                `}
              >
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export default TaskCategoryChips
