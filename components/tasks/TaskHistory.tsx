/**
 * 📜 Task History Component
 *
 * Shows completed tasks with assignee addresses and timestamps
 * All data is fetched dynamically from Supabase - NO hardcoded data
 *
 * i18n: Full translation support for EN/ES
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/badge'
import {
  Loader2,
  CheckCircle2,
  Calendar,
  Coins,
  User,
  ExternalLink,
  Clock,
  FileCheck,
  RefreshCw
} from 'lucide-react'
import type { HistoryEntry } from '@/app/api/tasks/history/route'

interface TaskHistoryProps {
  userAddress?: string
  refreshKey?: number
}

interface HistoryData {
  history: HistoryEntry[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
  stats: {
    totalCompleted: number
    totalCGCDistributed: number
    uniqueContributors: number
  }
}

export function TaskHistory({ userAddress, refreshKey = 0 }: TaskHistoryProps) {
  const t = useTranslations('tasks')

  const [data, setData] = useState<HistoryData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'mine'>('all')

  const loadHistory = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (filter === 'mine' && userAddress) {
        params.set('wallet', userAddress)
      }
      params.set('limit', '50')

      const response = await fetch(`/api/tasks/history?${params.toString()}`)
      const result = await response.json()

      if (result.success) {
        setData(result)
      } else {
        setError(result.error || 'Failed to load history')
      }
    } catch (err) {
      console.error('Error loading history:', err)
      setError(err instanceof Error ? err.message : 'Failed to load history')
    } finally {
      setIsLoading(false)
    }
  }, [filter, userAddress])

  useEffect(() => {
    loadHistory()
  }, [loadHistory, refreshKey])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatAddress = (address: string) => {
    if (!address) return 'Unknown'
    return `${address.slice(0, 8)}...${address.slice(-6)}`
  }

  const getCategoryColor = (category: string | null) => {
    const colors: Record<string, string> = {
      frontend: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      backend: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      blockchain: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      documentation: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
      security: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      ai: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
      governance: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
      default: 'bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-300'
    }
    return colors[category || 'default'] || colors.default
  }

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      critical: 'text-red-500',
      high: 'text-orange-500',
      medium: 'text-yellow-500',
      low: 'text-green-500'
    }
    return colors[priority] || 'text-gray-500'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={loadHistory}
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          {t('history.retry')}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      {data?.stats && (
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-gradient-to-br from-teal-500/10 to-emerald-500/10 border border-teal-500/20 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 mb-1">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-xs font-medium uppercase">{t('history.totalCompleted')}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {data.stats.totalCompleted}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-1">
              <Coins className="w-4 h-4" />
              <span className="text-xs font-medium uppercase">{t('history.totalCGC')}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {data.stats.totalCGCDistributed.toLocaleString()} CGC
            </p>
          </div>
          <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-1">
              <User className="w-4 h-4" />
              <span className="text-xs font-medium uppercase">{t('history.contributors')}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {data.stats.uniqueContributors}
            </p>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
            filter === 'all'
              ? 'bg-teal-500 text-white'
              : 'bg-white/10 text-gray-600 dark:text-gray-400 hover:bg-white/20'
          }`}
        >
          {t('history.allTasks')}
        </button>
        {userAddress && (
          <button
            onClick={() => setFilter('mine')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              filter === 'mine'
                ? 'bg-teal-500 text-white'
                : 'bg-white/10 text-gray-600 dark:text-gray-400 hover:bg-white/20'
            }`}
          >
            {t('history.myTasks')}
          </button>
        )}
      </div>

      {/* History Table */}
      <div className="overflow-hidden rounded-xl border border-white/10 dark:border-white/5 backdrop-blur-sm">
        <table className="w-full">
          <thead className="bg-white/5 dark:bg-white/5">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                {t('history.columns.task')}
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                {t('history.columns.contributor')}
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                {t('history.columns.reward')}
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                {t('history.columns.completed')}
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                {t('history.columns.evidence')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 dark:divide-white/5">
            {data?.history.map((entry) => {
              const isUserTask = entry.assignee_address?.toLowerCase() === userAddress?.toLowerCase()

              return (
                <tr
                  key={entry.id}
                  className={`hover:bg-white/5 dark:hover:bg-white/5 transition-colors ${
                    isUserTask ? 'bg-teal-500/10' : ''
                  }`}
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className={`font-medium ${isUserTask ? 'text-teal-600 dark:text-teal-400' : 'text-gray-900 dark:text-white'}`}>
                        {entry.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={`text-xs ${getCategoryColor(entry.category)}`}>
                          {entry.category || 'general'}
                        </Badge>
                        <span className={`text-xs ${getPriorityColor(entry.priority)}`}>
                          {entry.priority}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className={`font-mono text-sm ${isUserTask ? 'text-teal-600 dark:text-teal-400 font-semibold' : 'text-gray-600 dark:text-gray-300'}`}>
                        {formatAddress(entry.assignee_address)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Coins className="w-4 h-4 text-amber-500" />
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {entry.reward_cgc} CGC
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      {entry.completed_at ? formatDate(entry.completed_at) : '-'}
                    </div>
                    {entry.validated_at && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-green-600 dark:text-green-400">
                        <FileCheck className="w-3 h-3" />
                        {t('history.validated')}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {entry.pr_url && (
                        <a
                          href={entry.pr_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                          PR <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {entry.evidence_url && (
                        <a
                          href={entry.evidence_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 rounded hover:bg-teal-200 dark:hover:bg-teal-900/50 transition-colors"
                        >
                          {t('history.evidence')} <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {!entry.pr_url && !entry.evidence_url && (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {(!data?.history || data.history.length === 0) && (
        <div className="text-center py-12">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">{t('history.noHistory')}</p>
          {filter === 'mine' && (
            <p className="text-sm text-gray-400 mt-2">{t('history.noHistoryHint')}</p>
          )}
        </div>
      )}

      {/* Pagination Info */}
      {data?.pagination && data.pagination.total > data.pagination.limit && (
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          {t('history.showing', {
            shown: data.history.length,
            total: data.pagination.total
          })}
        </div>
      )}
    </div>
  )
}
