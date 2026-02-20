/**
 * 🛡️ Admin Dashboard Page
 * 
 * Protected page for DAO administrators to validate tasks and manage system
 */

'use client'

import React, { useState } from 'react'
import { ValidationPanel } from '@/components/admin/ValidationPanel'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Shield, 
  Activity, 
  DollarSign, 
  Users,
  RefreshCw,
  Settings,
  BarChart3
} from 'lucide-react'
import { useDashboardStats } from '@/lib/web3/hooks'
import { useAccount } from '@/lib/thirdweb'

export default function AdminPage() {
  const [refreshKey, setRefreshKey] = useState(0)
  const { address } = useAccount()
  const stats = useDashboardStats()

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-glass">Admin Dashboard</h1>
            </div>
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
          <p className="text-glass-secondary">
            Manage task validations and monitor system health
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-500">
                  System Status
                </CardTitle>
                <Activity className="w-4 h-4 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {stats.systemActive ? 'Active' : 'Inactive'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Smart contracts operational
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Escrow Balance
                </CardTitle>
                <DollarSign className="w-4 h-4 text-amber-500" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {stats.escrowBalance} CGC
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Available for payments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Active Tasks
                </CardTitle>
                <BarChart3 className="w-4 h-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {stats.activeTasks}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.questsCompleted} completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Token Holders
                </CardTitle>
                <Users className="w-4 h-4 text-purple-500" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {stats.holdersCount}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                CGC token holders
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="validation" className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="validation">Validation</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="validation">
            <ValidationPanel refreshKey={refreshKey} />
          </TabsContent>

          <TabsContent value="metrics">
            <Card>
              <CardHeader>
                <CardTitle>System Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Daily Limit</p>
                    <p className="text-xl font-bold">{stats.systemLimits?.daily || '0'} CGC</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Used: {stats.systemUsage?.daily || '0'} CGC
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Weekly Limit</p>
                    <p className="text-xl font-bold">{stats.systemLimits?.weekly || '0'} CGC</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Used: {stats.systemUsage?.weekly || '0'} CGC
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="font-medium mb-3">Contract Addresses</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">CGC Token:</span>
                      <span className="font-mono">0x5e3a...6175</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Master Controller:</span>
                      <span className="font-mono">0x67D9...D869</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Task Rules:</span>
                      <span className="font-mono">0xdDcf...C5bb</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Milestone Escrow:</span>
                      <span className="font-mono">0x8346...f109</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Admin Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-amber-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Settings className="w-5 h-5 text-amber-600" />
                      <p className="font-medium text-amber-900">Authorized Validators</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 bg-white rounded">
                        <span className="font-mono text-sm">0xc655...5dE6</span>
                        <Badge variant="outline">Deployer</Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-white rounded">
                        <span className="font-mono text-sm">0x3244...ac31</span>
                        <Badge variant="outline">DAO</Badge>
                      </div>
                    </div>
                  </div>

                  {address && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-500 mb-1">Connected Wallet</p>
                      <p className="font-mono text-sm">
                        {address.slice(0, 12)}...{address.slice(-10)}
                      </p>
                    </div>
                  )}

                  <div className="pt-4">
                    <p className="text-sm text-gray-500">
                      Note: Only authorized validators can approve or reject task completions.
                      Approved tasks automatically trigger CGC token payments from the escrow contract.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}