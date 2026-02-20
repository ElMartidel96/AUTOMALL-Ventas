/**
 * 💡 Task Proposal Component
 *
 * Form for proposing new tasks
 * 🌐 i18n: Full translation support for EN/ES
 */

'use client'

import React, { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, PlusCircle, AlertCircle } from 'lucide-react'

interface TaskProposalProps {
  userAddress?: string
  onProposalSubmitted?: () => void
}

export function TaskProposal({ userAddress, onProposalSubmitted }: TaskProposalProps) {
  // 🌐 Translation hooks
  const t = useTranslations('tasks.proposal')
  const tCommon = useTranslations('common')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    estimatedComplexity: '',
    estimatedDays: '',
    platformOrigin: 'manual',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!userAddress) {
      alert(tCommon('pleaseConnectWallet'))
      return
    }

    if (!form.title || !form.description) {
      alert(t('pleaseCompleteFields'))
      return
    }

    try {
      setIsSubmitting(true)

      const response = await fetch('/api/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          proposed_by_address: userAddress,
          platform_origin: form.platformOrigin,
          estimated_complexity: form.estimatedComplexity ? parseInt(form.estimatedComplexity) : null,
          estimated_days: form.estimatedDays ? parseInt(form.estimatedDays) : null,
        }),
      })

      const data = await response.json()

      if (data.success) {
        onProposalSubmitted?.()
        setForm({
          title: '',
          description: '',
          estimatedComplexity: '',
          estimatedDays: '',
          platformOrigin: 'manual',
        })
      } else {
        alert(data.error || t('failedToSubmit'))
      }
    } catch (error) {
      console.error('Error submitting proposal:', error)
      alert(t('failedToSubmitRetry'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateForm = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  // Calculate estimated reward based on complexity and days
  const estimatedReward = (() => {
    const days = parseInt(form.estimatedDays) || 0
    return days * 50 // 50 CGC per day
  })()

  return (
    <div className="space-y-6">
      {/* Info Card */}
      <div className="p-5 rounded-xl bg-blue-500/10 border border-blue-500/20 backdrop-blur-sm">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-700 dark:text-blue-300">{t('guidelinesTitle')}</h4>
            <ul className="text-sm text-blue-600 dark:text-blue-400/80 mt-2 space-y-1">
              <li>• {t('guideline1')}</li>
              <li>• {t('guideline2')}</li>
              <li>• {t('guideline3')}</li>
              <li>• {t('guideline4')}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Proposal Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <Label htmlFor="title">{t('taskTitle')} *</Label>
            <Input
              id="title"
              placeholder={t('titlePlaceholder')}
              value={form.title}
              onChange={(e) => updateForm('title', e.target.value)}
              required
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="description">{t('descriptionLabel')} *</Label>
            <Textarea
              id="description"
              placeholder={t('descriptionPlaceholder')}
              value={form.description}
              onChange={(e) => updateForm('description', e.target.value)}
              className="min-h-[120px]"
              required
            />
          </div>

          <div>
            <Label htmlFor="complexity">{t('estimatedComplexity')}</Label>
            <Select value={form.estimatedComplexity} onValueChange={(v) => updateForm('estimatedComplexity', v)}>
              <SelectTrigger>
                <SelectValue placeholder={t('selectComplexity')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">{t('complexity.level1')}</SelectItem>
                <SelectItem value="2">{t('complexity.level2')}</SelectItem>
                <SelectItem value="3">{t('complexity.level3')}</SelectItem>
                <SelectItem value="4">{t('complexity.level4')}</SelectItem>
                <SelectItem value="5">{t('complexity.level5')}</SelectItem>
                <SelectItem value="6">{t('complexity.level6')}</SelectItem>
                <SelectItem value="7">{t('complexity.level7')}</SelectItem>
                <SelectItem value="8">{t('complexity.level8')}</SelectItem>
                <SelectItem value="9">{t('complexity.level9')}</SelectItem>
                <SelectItem value="10">{t('complexity.level10')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="estimatedDays">{t('estimatedDays')}</Label>
            <Input
              id="estimatedDays"
              type="number"
              placeholder={t('daysPlaceholder')}
              min="1"
              max="60"
              value={form.estimatedDays}
              onChange={(e) => updateForm('estimatedDays', e.target.value)}
            />
            {estimatedReward > 0 && (
              <p className="text-sm text-green-600 mt-1">
                {t('estimatedReward', { reward: estimatedReward })}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="platform">{t('platformOrigin')}</Label>
            <Select value={form.platformOrigin} onValueChange={(v) => updateForm('platformOrigin', v)}>
              <SelectTrigger>
                <SelectValue placeholder={t('selectPlatform')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">{t('platform.manual')}</SelectItem>
                <SelectItem value="discord">{t('platform.discord')}</SelectItem>
                <SelectItem value="github">{t('platform.github')}</SelectItem>
                <SelectItem value="custom">{t('platform.custom')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => setForm({
              title: '',
              description: '',
              estimatedComplexity: '',
              estimatedDays: '',
              platformOrigin: 'manual',
            })}
          >
            {t('clearForm')}
          </Button>
          <Button
            type="submit"
            disabled={!form.title || !form.description || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                {t('submitting')}
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4 mr-2" />
                {t('submitProposal')}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}