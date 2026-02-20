/**
 * 🛡️ Admin Validation Panel
 * 
 * Secure panel for task validation by authorized administrators
 * Only accessible by whitelisted wallet addresses
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useAccount } from '@/lib/thirdweb'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  Loader2,
  AlertTriangle,
  FileText,
  GitPullRequest
} from 'lucide-react'
import type { Task } from '@/lib/supabase/types'
import { useTaskValidation, useMilestoneRelease } from '@/lib/web3/hooks'
import { stringToHex } from 'viem'
import { ensureEthereumAddress } from '@/lib/utils'

// Authorized validator addresses - should match backend
const AUTHORIZED_VALIDATORS = [
  '0xc655BF2Bd9AfA997c757Bef290A9Bb6ca41c5dE6', // Deployer
  '0x3244DFBf9E5374DF2f106E89Cf7972E5D4C9ac31', // DAO
]

interface ValidationPanelProps {
  refreshKey?: number
}

export function ValidationPanel({ refreshKey = 0 }: ValidationPanelProps) {
  const { address, isConnected } = useAccount()
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [validationNotes, setValidationNotes] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [filter, setFilter] = useState<'all' | 'pending' | 'validated'>('pending')

  // Blockchain validation hook
  const { validateCompletion, isPending: isBlockchainPending, isSuccess: isValidationSuccess } = useTaskValidation()
  
  // Payment release hook
  const { releaseMilestone, isPending: isPaymentPending, isSuccess: isPaymentSuccess } = useMilestoneRelease()

  // Check if current user is authorized
  const isAuthorized = address && AUTHORIZED_VALIDATORS.some(
    addr => addr.toLowerCase() === address.toLowerCase()
  )

  useEffect(() => {
    if (isAuthorized) {
      loadTasksForValidation()
    }
  }, [refreshKey, isAuthorized])

  const loadTasksForValidation = async () => {
    if (!address) {
      console.warn('No wallet address available for loading validation tasks')
      setTasks([])
      setIsLoading(false)
      return
    }
    
    try {
      setIsLoading(true)
      const response = await fetch('/api/tasks/validate', {
        headers: {
          'x-wallet-address': address
        }
      })
      const data = await response.json()
      
      if (data.success) {
        setTasks(data.data || [])
      }
    } catch (error) {
      console.error('Error loading tasks for validation:', error)
      setTasks([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleValidation = async (taskId: string, approved: boolean) => {
    if (!address || !isAuthorized) return

    // Find the task being validated for payment data
    const task = tasks.find(t => t.task_id === taskId)
    if (!task) {
      alert('Task not found')
      return
    }

    try {
      setIsValidating(true)
      
      // Step 1: Update database first
      const response = await fetch('/api/tasks/validate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-wallet-address': address
        },
        body: JSON.stringify({
          taskId,
          validatorAddress: address,
          approved,
          notes: validationNotes,
        }),
      })

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to validate task in database')
      }

      // Step 2: If approved, validate on blockchain
      if (approved) {
        try {
          await validateCompletion(taskId, approved)
          console.log('✅ Task validated on blockchain and database')
          
          // Step 3: Release payment automatically
          const assigneeAddress = ensureEthereumAddress(task.assignee_address)
          if (assigneeAddress) {
            console.log('🚀 Triggering automatic payment release...')
            const milestoneIdHex: `0x${string}` = stringToHex(taskId, { size: 32 })
            await releaseMilestone(
              assigneeAddress,
              task.reward_cgc.toString(),
              milestoneIdHex
            )
            
            // Update task status to completed in database
            await fetch('/api/tasks/validate', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'x-wallet-address': address || ''
              },
              body: JSON.stringify({
                taskId,
                validatorAddress: address,
                approved: true,
                notes: `${validationNotes} | PAYMENT RELEASED: ${task.reward_cgc} CGC`,
              }),
            })
            
            console.log('✅ Payment released successfully!')
            alert('✅ Task validated and payment released successfully! User received ' + task.reward_cgc + ' CGC tokens.')
          }
        } catch (blockchainError: any) {
          console.error('Blockchain validation failed:', blockchainError)
          
          // Revert database validation if blockchain fails
          await fetch('/api/tasks/validate', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'x-wallet-address': address || ''
            },
            body: JSON.stringify({
              taskId,
              validatorAddress: address,
              approved: false, // Revert to rejected
              notes: `Blockchain validation failed: ${blockchainError.message}`,
            }),
          })
          
          const errorMessage = blockchainError.message?.includes('User rejected')
            ? 'Transaction was cancelled by user. Task validation reverted.'
            : `Blockchain validation failed: ${blockchainError.message}`
          
          alert(errorMessage)
        }
      } else {
        // Just rejection - no blockchain interaction needed
        console.log('❌ Task rejected in database')
        alert('❌ Task rejected. User must resubmit evidence.')
      }

      // Step 3: Reload tasks and reset form
      await loadTasksForValidation()
      setSelectedTask(null)
      setValidationNotes('')

    } catch (error: any) {
      console.error('Error validating task:', error)
      alert(error.message || 'Failed to validate task. Please try again.')
    } finally {
      setIsValidating(false)
    }
  }

  // Filter tasks based on selected filter
  const filteredTasks = tasks.filter(task => {
    if (filter === 'pending') return !task.validated_at
    if (filter === 'validated') return task.validated_at
    return true
  })

  // If not connected
  if (!isConnected) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Shield className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-medium mb-2">Connect Wallet</p>
          <p className="text-sm text-gray-500">
            Please connect your wallet to access the validation panel
          </p>
        </CardContent>
      </Card>
    )
  }

  // If not authorized
  if (!isAuthorized) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="py-12 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <p className="text-lg font-medium mb-2 text-red-900">Access Denied</p>
          <p className="text-sm text-red-700">
            Your wallet address is not authorized to validate tasks.
          </p>
          <p className="text-xs text-red-600 mt-4 font-mono">
            Connected: {address?.slice(0, 8)}...{address?.slice(-6)}
          </p>
        </CardContent>
      </Card>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" />
          <p className="mt-4 text-sm text-gray-500">Loading tasks for validation...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="w-6 h-6 text-blue-600" />
              <CardTitle>Admin Validation Panel</CardTitle>
            </div>
            <Badge variant="outline" className="bg-green-50">
              <CheckCircle className="w-3 h-3 mr-1" />
              Authorized Validator
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              You are authorized to validate task completions. Approved tasks will trigger 
              automatic CGC token payments from the escrow contract.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Tabs for filtering */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">
            Pending ({filteredTasks.filter(t => !t.validated_at).length})
          </TabsTrigger>
          <TabsTrigger value="validated">
            Validated ({filteredTasks.filter(t => t.validated_at).length})
          </TabsTrigger>
          <TabsTrigger value="all">
            All ({tasks.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="space-y-4 mt-6">
          {filteredTasks.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Clock className="w-8 h-8 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">No tasks to validate</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredTasks.map((task) => (
                <Card key={task.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{task.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Task ID: {task.task_id}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">
                          {task.complexity} Complexity
                        </Badge>
                        <Badge variant="outline" className="bg-amber-50">
                          {task.reward_cgc} CGC
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Task Description */}
                    <div>
                      <p className="text-sm text-gray-600">{task.description}</p>
                    </div>

                    {/* Assignee Info */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-500">Assignee:</span>
                      <span className="font-mono text-sm">
                        {task.assignee_address?.slice(0, 8)}...{task.assignee_address?.slice(-6)}
                      </span>
                    </div>

                    {/* Evidence Links */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Submitted Evidence:</p>
                      <div className="flex flex-col space-y-2">
                        {task.evidence_url && (
                          <a
                            href={task.evidence_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 text-sm"
                          >
                            <FileText className="w-4 h-4" />
                            <span>Primary Evidence</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        {task.pr_url && (
                          <a
                            href={task.pr_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 text-sm"
                          >
                            <GitPullRequest className="w-4 h-4" />
                            <span>Pull Request</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Validation Status */}
                    {task.validated_at ? (
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-green-800">
                            Validated on {new Date(task.validated_at).toLocaleDateString()}
                          </span>
                        </div>
                        {task.validation_notes && (
                          <p className="text-xs text-gray-600 mt-2">
                            Notes: {task.validation_notes}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Textarea
                          placeholder="Add validation notes (optional)..."
                          value={selectedTask?.id === task.id ? validationNotes : ''}
                          onChange={(e) => {
                            setSelectedTask(task)
                            setValidationNotes(e.target.value)
                          }}
                          className="min-h-[80px]"
                        />
                        <div className="flex space-x-3">
                          <Button
                            onClick={() => handleValidation(task.task_id, false)}
                            disabled={isValidating || isBlockchainPending || isPaymentPending}
                            variant="destructive"
                            className="flex-1"
                          >
                            {(isValidating || isBlockchainPending || isPaymentPending) ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                              <XCircle className="w-4 h-4 mr-2" />
                            )}
                            Reject
                          </Button>
                          <Button
                            onClick={() => handleValidation(task.task_id, true)}
                            disabled={isValidating || isBlockchainPending || isPaymentPending}
                            variant="default"
                            className="flex-1 bg-green-600 hover:bg-green-700"
                          >
                            {(isValidating || isBlockchainPending || isPaymentPending) ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                {isPaymentPending ? 'Releasing payment...' : 
                                 isBlockchainPending ? 'Confirming on blockchain...' : 
                                 'Validating...'}
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Approve & Pay
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}