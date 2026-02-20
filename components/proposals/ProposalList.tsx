/**
 * 🗳️ Proposal List Component
 *
 * Displays community proposals with voting functionality
 * Bidirectional sync with Discord
 * 🌐 i18n: Full translation support for EN/ES
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/toast'
import {
  MessageSquarePlus,
  ThumbsUp,
  ThumbsDown,
  Clock,
  CheckCircle2,
  XCircle,
  Rocket,
  Users,
  RefreshCw,
  Bot,
  Loader2,
  ExternalLink,
} from 'lucide-react'

interface Proposal {
  id: string
  title: string
  description: string | null
  source: 'discord' | 'web'
  proposedByDiscordUsername: string | null
  proposedByWallet: string | null
  votesUp: number
  votesDown: number
  voteScore: number
  approvalPercentage: number
  suggestedCategory: string | null
  suggestedReward: number | null
  suggestedDomain: string | null
  status: 'pending' | 'voting' | 'approved' | 'rejected' | 'converted'
  refinedTitle: string | null
  refinedDescription: string | null
  createdAt: string
}

interface ProposalListProps {
  userAddress?: string
  refreshKey?: number
  onProposalsLoaded?: (count: number) => void
}

export function ProposalList({ userAddress, refreshKey = 0, onProposalsLoaded }: ProposalListProps) {
  const t = useTranslations('proposals')
  const tCommon = useTranslations('common')

  const { success, error, warning } = useToast()

  const [proposals, setProposals] = useState<Proposal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState('active')
  const [syncStatus, setSyncStatus] = useState<any>(null)
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    loadProposals()
    loadSyncStatus()
  }, [refreshKey])

  const loadProposals = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/proposals')
      if (response.ok) {
        const result = await response.json()
        const proposalData = result.data || result.proposals || []
        setProposals(proposalData)
        onProposalsLoaded?.(proposalData.length)
      }
    } catch (err) {
      console.error('Failed to load proposals:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const loadSyncStatus = async () => {
    try {
      const response = await fetch('/api/discord/sync')
      if (response.ok) {
        const data = await response.json()
        setSyncStatus(data)
      }
    } catch (err) {
      console.error('Failed to load sync status:', err)
    }
  }

  const handleVote = async (proposalId: string, vote: 'up' | 'down') => {
    if (!userAddress) {
      warning(t('errors.connectWallet'), t('errors.connectWalletDesc'))
      return
    }

    try {
      const response = await fetch('/api/proposals/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposalId,
          voteType: vote,
          voterWallet: userAddress,
          source: 'web',
        }),
      })

      if (response.ok) {
        const result = await response.json()
        const action = result.action === 'removed'
          ? t('toasts.voteRemoved')
          : t('toasts.voteRecorded')
        success(action)
        loadProposals()
      } else {
        const data = await response.json()
        error(t('toasts.voteFailed'), data.error)
      }
    } catch (err) {
      error(t('toasts.voteFailed'))
    }
  }

  const handleSync = async () => {
    setIsSyncing(true)
    try {
      const response = await fetch('/api/discord/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync_new_proposals' }),
      })

      if (response.ok) {
        const data = await response.json()
        success(t('toasts.syncComplete'), t('toasts.syncedProposals', { count: data.synced || 0 }))
        loadProposals()
        loadSyncStatus()
      } else {
        error(t('toasts.syncFailed'))
      }
    } catch (err) {
      error(t('toasts.syncFailed'))
    } finally {
      setIsSyncing(false)
    }
  }

  const activeProposals = proposals.filter((p) => p.status === 'pending' || p.status === 'voting')
  const approvedProposals = proposals.filter((p) => p.status === 'approved' || p.status === 'converted')
  const rejectedProposals = proposals.filter((p) => p.status === 'rejected')

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl rounded-xl p-4 text-center border border-purple-200/50 dark:border-purple-500/30 shadow-lg shadow-purple-500/10">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{activeProposals.length}</div>
          <div className="text-sm text-gray-600 dark:text-gray-300">{t('stats.activeProposals')}</div>
        </div>
        <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl rounded-xl p-4 text-center border border-green-200/50 dark:border-green-500/30 shadow-lg shadow-green-500/10">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{approvedProposals.length}</div>
          <div className="text-sm text-gray-600 dark:text-gray-300">{t('stats.approved')}</div>
        </div>
        <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl rounded-xl p-4 text-center border border-blue-200/50 dark:border-blue-500/30 shadow-lg shadow-blue-500/10">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {proposals.reduce((sum, p) => sum + p.votesUp + p.votesDown, 0)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">{t('stats.totalVotes')}</div>
        </div>
        <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl rounded-xl p-4 text-center border border-indigo-200/50 dark:border-indigo-500/30 shadow-lg shadow-indigo-500/10">
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            {syncStatus?.proposals?.synced || 0}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">Discord Sync</div>
        </div>
      </div>

      {/* Actions Row */}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={handleSync}
          variant="outline"
          size="sm"
          disabled={isSyncing}
          className="border-purple-500/30 hover:bg-purple-500/10"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
          {t('actions.refresh')}
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="border-indigo-500/30 hover:bg-indigo-500/10"
          asChild
        >
          <a href="https://discord.gg/XzmKkrvhHc" target="_blank" rel="noopener noreferrer">
            <Bot className="w-4 h-4 mr-2" />
            Discord Bot
            <ExternalLink className="w-3 h-3 ml-2" />
          </a>
        </Button>
      </div>

      {/* Tabs for proposals */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl border border-gray-200/80 dark:border-purple-500/20 shadow-md">
          <TabsTrigger
            value="active"
            className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-700 dark:data-[state=active]:text-purple-300"
          >
            {t('tabs.voting')} ({activeProposals.length})
          </TabsTrigger>
          <TabsTrigger
            value="approved"
            className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-700 dark:data-[state=active]:text-green-300"
          >
            {t('tabs.approved')} ({approvedProposals.length})
          </TabsTrigger>
          <TabsTrigger
            value="rejected"
            className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-700 dark:data-[state=active]:text-red-300"
          >
            {t('tabs.rejected')} ({rejectedProposals.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          {activeProposals.length === 0 ? (
            <EmptyState type="active" />
          ) : (
            <div className="grid gap-4">
              {activeProposals.map((proposal) => (
                <ProposalCard
                  key={proposal.id}
                  proposal={proposal}
                  onVote={handleVote}
                  isConnected={!!userAddress}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved" className="mt-4">
          {approvedProposals.length === 0 ? (
            <EmptyState type="approved" />
          ) : (
            <div className="grid gap-4">
              {approvedProposals.map((proposal) => (
                <ProposalCard
                  key={proposal.id}
                  proposal={proposal}
                  onVote={handleVote}
                  isConnected={!!userAddress}
                  readonly
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rejected" className="mt-4">
          {rejectedProposals.length === 0 ? (
            <EmptyState type="rejected" />
          ) : (
            <div className="grid gap-4">
              {rejectedProposals.map((proposal) => (
                <ProposalCard
                  key={proposal.id}
                  proposal={proposal}
                  onVote={handleVote}
                  isConnected={!!userAddress}
                  readonly
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Empty State Component
function EmptyState({ type }: { type: 'active' | 'approved' | 'rejected' }) {
  const t = useTranslations('proposals')

  return (
    <div className="text-center py-12 bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl rounded-xl border border-gray-200/50 dark:border-purple-500/20">
      <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-500/20 w-fit mx-auto mb-4">
        <MessageSquarePlus className="w-8 h-8 text-purple-500 dark:text-purple-400" />
      </div>
      <p className="text-gray-700 dark:text-gray-300 font-medium">
        {type === 'active' ? t('empty.noProposals') : t('empty.noMatching')}
      </p>
      {type === 'active' && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          {t('empty.beFirst')}
        </p>
      )}
    </div>
  )
}

// Proposal Card Component
function ProposalCard({
  proposal,
  onVote,
  isConnected,
  readonly = false,
}: {
  proposal: Proposal
  onVote: (id: string, vote: 'up' | 'down') => void
  isConnected: boolean
  readonly?: boolean
}) {
  const t = useTranslations('proposals')

  const votePercentage = proposal.approvalPercentage || (
    proposal.votesUp + proposal.votesDown > 0
      ? Math.round((proposal.votesUp / (proposal.votesUp + proposal.votesDown)) * 100)
      : 50
  )

  return (
    <div className="bg-white/90 dark:bg-slate-800/70 backdrop-blur-xl rounded-xl p-5 border border-gray-200/80 dark:border-purple-500/30 hover:border-purple-500/50 dark:hover:border-purple-400/50 transition-all shadow-lg hover:shadow-xl hover:shadow-purple-500/10">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {proposal.refinedTitle || proposal.title}
            </h3>
            {proposal.source === 'discord' && (
              <Badge className="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30 text-xs">
                <Bot className="w-3 h-3 mr-1" />
                Discord
              </Badge>
            )}
          </div>

          <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
            {proposal.refinedDescription || proposal.description || t('card.noDescription')}
          </p>
        </div>

        <StatusBadge status={proposal.status} />
      </div>

      {/* Meta Info */}
      <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
        <span>
          {t('card.by')}:{' '}
          <span className="text-gray-700 dark:text-gray-300">
            {proposal.proposedByDiscordUsername ||
              (proposal.proposedByWallet
                ? `${proposal.proposedByWallet.slice(0, 6)}...${proposal.proposedByWallet.slice(-4)}`
                : t('card.anonymous'))}
          </span>
        </span>

        {proposal.suggestedCategory && (
          <span>
            {t('card.category')}: <span className="text-purple-600 dark:text-purple-400">{proposal.suggestedCategory}</span>
          </span>
        )}

        {proposal.suggestedReward && (
          <span>
            {t('card.reward')}: <span className="text-green-600 dark:text-green-400">{proposal.suggestedReward} CGC</span>
          </span>
        )}

        <span>
          {new Date(proposal.createdAt).toLocaleDateString()}
        </span>
      </div>

      {/* Voting Section */}
      <div className="flex items-center gap-4">
        {/* Vote Progress Bar */}
        <div className="flex-1">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
            <span className="text-green-600 dark:text-green-400">
              {proposal.votesUp} {t('card.votes')}
            </span>
            <span className="font-medium">{votePercentage}% {t('card.approval')}</span>
            <span className="text-red-600 dark:text-red-400">
              {proposal.votesDown} {t('card.votes')}
            </span>
          </div>
          <div className="h-2.5 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500"
              style={{ width: `${votePercentage}%` }}
            />
          </div>
        </div>

        {/* Vote Buttons */}
        {!readonly && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onVote(proposal.id, 'up')}
              disabled={!isConnected}
              className="border-green-500/30 hover:bg-green-500/10 text-green-600 dark:text-green-400"
              title={t('card.voteFor')}
            >
              <ThumbsUp className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onVote(proposal.id, 'down')}
              disabled={!isConnected}
              className="border-red-500/30 hover:bg-red-500/10 text-red-600 dark:text-red-400"
              title={t('card.voteAgainst')}
            >
              <ThumbsDown className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const t = useTranslations('proposals')

  switch (status) {
    case 'pending':
      return (
        <Badge className="bg-amber-100 dark:bg-yellow-500/20 text-amber-700 dark:text-yellow-300 border-amber-200 dark:border-yellow-500/30">
          <Clock className="w-3 h-3 mr-1" />
          {t('status.pending')}
        </Badge>
      )
    case 'voting':
      return (
        <Badge className="bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/30">
          <Users className="w-3 h-3 mr-1" />
          {t('status.voting')}
        </Badge>
      )
    case 'approved':
      return (
        <Badge className="bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-500/30">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          {t('status.approved')}
        </Badge>
      )
    case 'rejected':
      return (
        <Badge className="bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-500/30">
          <XCircle className="w-3 h-3 mr-1" />
          {t('status.rejected')}
        </Badge>
      )
    case 'converted':
      return (
        <Badge className="bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/30">
          <Rocket className="w-3 h-3 mr-1" />
          {t('status.converted')}
        </Badge>
      )
    default:
      return null
  }
}
