/**
 * 🏆 Leaderboard Table Component
 *
 * Shows collaborator rankings
 * 🌐 i18n: Full translation support for EN/ES
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/badge'
import { Loader2, Trophy, Medal, Award, User } from 'lucide-react'
import type { Database } from '@/lib/supabase/types'

// Use the actual leaderboard_view type from Supabase
type LeaderboardViewRow = Database['public']['Views']['leaderboard_view']['Row']

interface LeaderboardTableProps {
  userAddress?: string
  refreshKey?: number
}

interface LeaderboardEntry extends LeaderboardViewRow {
  tasks_in_progress?: number
}

export function LeaderboardTable({ userAddress, refreshKey = 0 }: LeaderboardTableProps) {
  // 🌐 Translation hooks
  const t = useTranslations('leaderboard')

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null)

  useEffect(() => {
    loadLeaderboard()
  }, [refreshKey, userAddress])

  const loadLeaderboard = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/leaderboard${userAddress ? `?address=${userAddress}` : ''}`)
      const data = await response.json()

      if (data.success) {
        setLeaderboard(data.data.leaderboard || [])
        setUserRank(data.data.userRank || null)
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />
      default:
        return <span className="text-sm font-semibold text-gray-500">#{rank}</span>
    }
  }

  const getLevelBadge = (level: string, cgc: number) => {
    if (cgc >= 10000) return { label: t('levels.legend'), color: 'bg-purple-100 text-purple-800' }
    if (cgc >= 5000) return { label: t('levels.master'), color: 'bg-red-100 text-red-800' }
    if (cgc >= 2000) return { label: t('levels.expert'), color: 'bg-blue-100 text-blue-800' }
    if (cgc >= 500) return { label: t('levels.contributor'), color: 'bg-green-100 text-green-800' }
    return { label: t('levels.novice'), color: 'bg-gray-100 text-gray-800' }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* User's Position (if not in top 10) */}
      {userRank && userRank.rank > 10 && (
        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl backdrop-blur-sm">
          <h4 className="font-medium text-blue-600 dark:text-blue-400 mb-2">{t('yourPosition')}</h4>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getRankIcon(userRank.rank)}
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{userRank.address?.slice(0, 8)}...{userRank.address?.slice(-6)}</p>
                <p className="text-sm text-blue-600 dark:text-blue-400">{userRank.total_cgc_earned.toFixed(2)} CGC</p>
              </div>
            </div>
            <Badge className={getLevelBadge('', userRank.total_cgc_earned).color}>
              {getLevelBadge('', userRank.total_cgc_earned).label}
            </Badge>
          </div>
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="overflow-hidden rounded-xl border border-white/10 dark:border-white/5 backdrop-blur-sm">
        <table className="w-full">
          <thead className="bg-white/5 dark:bg-white/5">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                {t('columns.rank')}
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                {t('columns.address')}
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                {t('columns.cgcEarned')}
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                {t('columns.tasks')}
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                {t('columns.level')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 dark:divide-white/5">
            {leaderboard.map((collaborator, index) => {
              const isUserRow = collaborator.address === userAddress
              const levelBadge = getLevelBadge('', collaborator.total_cgc_earned)

              return (
                <tr
                  key={collaborator.address}
                  className={`hover:bg-white/5 dark:hover:bg-white/5 transition-colors ${isUserRow ? 'bg-blue-500/10' : ''}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getRankIcon(collaborator.rank || index + 1)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <User className="w-4 h-4 text-gray-400 dark:text-gray-500 mr-2" />
                      <div>
                        <p className={`font-medium ${isUserRow ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                          {collaborator.address?.slice(0, 8)}...{collaborator.address?.slice(-6)}
                        </p>
                        {collaborator.discord_id && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">Discord: {collaborator.discord_id}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {collaborator.total_cgc_earned.toFixed(2)} CGC
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        ~${(collaborator.total_cgc_earned * 0.1).toFixed(0)} USD
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{collaborator.total_tasks_completed}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {collaborator.tasks_in_progress || 0} {t('inProgressLabel')}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={`${levelBadge.color} border-0`}>
                      {levelBadge.label}
                    </Badge>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {leaderboard.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">{t('noCollaboratorsYet')}</p>
        </div>
      )}
    </div>
  )
}