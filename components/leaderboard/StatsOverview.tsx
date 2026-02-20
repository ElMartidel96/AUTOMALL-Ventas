/**
 * 📊 Stats Overview Component
 *
 * Display key statistics for the tasks system
 * 🌐 i18n: Full translation support for EN/ES
 */

'use client'

import React from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Target,
  Clock,
  CheckCircle2,
  Award,
  Users,
  TrendingUp,
  Loader2
} from 'lucide-react'

interface StatsOverviewProps {
  stats: {
    available: number
    inProgress: number
    completed: number
    totalRewards: number
    collaborators: number
  }
  isLoading?: boolean
}

export function StatsOverview({ stats, isLoading = false }: StatsOverviewProps) {
  // 🌐 Translation hooks
  const t = useTranslations('tasks.stats')

  const statItems = [
    {
      label: t('availableTasks'),
      value: stats.available,
      icon: <Target className="w-5 h-5 text-blue-500" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: t('inProgress'),
      value: stats.inProgress,
      icon: <Clock className="w-5 h-5 text-amber-500" />,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
    {
      label: t('completed'),
      value: stats.completed,
      icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: t('totalRewards'),
      value: `${stats.totalRewards.toLocaleString()} CGC`,
      icon: <Award className="w-5 h-5 text-purple-500" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      label: t('contributors'),
      value: stats.collaborators,
      icon: <Users className="w-5 h-5 text-indigo-500" />,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
  ]

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="glass-panel">
            <CardContent className="p-6">
              <div className="flex items-center justify-center h-16">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
      {statItems.map((item, index) => (
        <Card 
          key={item.label} 
          className="glass-panel hover:shadow-md transition-all duration-300 spring-in"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${item.bgColor}`}>
                {item.icon}
              </div>
              <div className="flex-1">
                <p className="text-xs text-glass-secondary uppercase tracking-wide font-medium">
                  {item.label}
                </p>
                <p className={`text-2xl font-bold ${item.color}`}>
                  {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}