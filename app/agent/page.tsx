/**
 * 🤖 AGENT DEMO PAGE
 * Demonstration page for the CG DAO Agent integration
 * Protected with CGC token-based access control
 * 🌐 i18n: Full translation support for EN/ES
 */

'use client';

import { useTranslations } from 'next-intl';
import { Navbar, NavbarSpacer } from '@/components/layout/Navbar';
import { AgentChat } from '@/components/agent/AgentChat';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CGCAccessGate } from '@/components/auth/CGCAccessGate';
import {
  Zap,
  Shield,
  Globe,
  Database,
  Activity,
  MessageSquare,
  Settings,
  FileSearch,
  Brain
} from 'lucide-react';

export default function AgentPage() {
  // 🌐 Translation hooks
  const t = useTranslations('agent');

  return (
    <>
      {/* Navbar always visible */}
      <Navbar />
      <NavbarSpacer />

      {/* Token-gated content */}
      <CGCAccessGate
        title={`🤖 ${t('page.accessTitle')}`}
        description={t('page.accessDescription')}
        requiredBalance="0.01"
      >
        <div className="min-h-screen theme-gradient-bg">
        {/* Background effects - Theme Aware */}
        <div className="fixed inset-0 opacity-30 dark:opacity-20 pointer-events-none overflow-hidden">
          <div className="absolute top-20 left-20 w-72 h-72 bg-blue-400 dark:bg-blue-600 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl animate-pulse"></div>
          <div className="absolute top-40 right-20 w-72 h-72 bg-purple-400 dark:bg-purple-600 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl animate-pulse"></div>
          <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-cyan-400 dark:bg-cyan-600 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-xl animate-pulse"></div>
        </div>

        {/* Header - Theme Aware */}
        <div className="relative z-10 border-b border-gray-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-purple-500/30 shadow-lg shadow-purple-500/20">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/apeX11.png"
                      alt="apeX"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">apeX</h1>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{t('page.headerTitle')}</span>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                  <Activity className="h-3 w-3 mr-1" />
                  {t('page.liveReady')}
                </Badge>
              </div>

              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="dark:border-slate-600 dark:text-gray-300">{t('page.gpt5Thinking')}</Badge>
                <Badge variant="outline" className="dark:border-slate-600 dark:text-gray-300">{t('page.mcpEnabled')}</Badge>
                <Badge variant="outline" className="dark:border-slate-600 dark:text-gray-300">{t('page.sseStreaming')}</Badge>
              </div>
            </div>
          </div>
        </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main Chat Interface */}
          <div className="lg:col-span-2">
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
                  <MessageSquare className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                  <span>{t('page.interactiveAssistant')}</span>
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  {t('page.chatDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <AgentChat
                  className="border-0 shadow-none"
                  maxHeight="h-[600px]"
                  showHeader={false}
                />
              </CardContent>
            </Card>
          </div>

          {/* Features & Info */}
          <div className="space-y-6">

            {/* Key Features */}
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
                  <Zap className="h-5 w-5 text-amber-500 dark:text-amber-400" />
                  <span>{t('features.title')}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Brain className="h-5 w-5 text-purple-500 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{t('features.gpt5Thinking')}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('features.gpt5ThinkingDesc')}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <FileSearch className="h-5 w-5 text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{t('features.documentAccess')}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('features.documentAccessDesc')}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Globe className="h-5 w-5 text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{t('features.sseStreaming')}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('features.sseStreamingDesc')}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Shield className="h-5 w-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{t('features.enterpriseSecurity')}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('features.enterpriseSecurityDesc')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contract Info */}
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
                  <Database className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
                  <span>{t('contracts.title')}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="font-medium text-sm text-gray-900 dark:text-white">{t('contracts.cgcToken')}</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-mono">0x5e3a61b550328f3D8C44f60b3e10a49D3d806175</p>
                  <p className="text-xs text-green-600 dark:text-green-400">{t('contracts.totalSupply')}</p>
                </div>

                <div>
                  <h4 className="font-medium text-sm text-gray-900 dark:text-white">{t('contracts.aragonDAO')}</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-mono">0x3244DFBf9E5374DF2f106E89Cf7972E5D4C9ac31</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">{t('contracts.baseMainnet')}</p>
                </div>

                <Button variant="outline" size="sm" className="w-full dark:border-slate-600 dark:text-gray-300 dark:hover:bg-slate-700">
                  {t('contracts.viewAllContracts')}
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
                  <Settings className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  <span>{t('quickActions.title')}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="ghost" size="sm" className="w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700">
                  📊 {t('quickActions.statusReport')}
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700">
                  📜 {t('quickActions.analyzeContracts')}
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700">
                  🏛️ {t('quickActions.createProposal')}
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700">
                  💰 {t('quickActions.reviewTokenomics')}
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700">
                  🔍 {t('quickActions.searchDocs')}
                </Button>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
                  <Activity className="h-5 w-5 text-green-500 dark:text-green-400" />
                  <span>{t('systemStatus.title')}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{t('systemStatus.agentApi')}</span>
                  <Badge variant="outline" className="text-green-700 dark:text-green-400 dark:border-green-700/50">{t('systemStatus.online')}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{t('systemStatus.mcpServer')}</span>
                  <Badge variant="outline" className="text-green-700 dark:text-green-400 dark:border-green-700/50">{t('systemStatus.connected')}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{t('systemStatus.documentation')}</span>
                  <Badge variant="outline" className="text-blue-700 dark:text-blue-400 dark:border-blue-700/50">{t('systemStatus.synced')}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{t('systemStatus.rateLimits')}</span>
                  <Badge variant="outline" className="text-gray-700 dark:text-gray-400 dark:border-slate-600">{t('systemStatus.normal')}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Implementation Info */}
        <Card className="mt-8 glass-panel">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">🚀 {t('guide.title')}</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              {t('guide.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <h4 className="font-medium mb-2 text-gray-900 dark:text-white">{t('guide.step1Title')}</h4>
                <div className="bg-gray-100 dark:bg-slate-800 p-3 rounded text-sm border border-gray-200 dark:border-slate-700">
                  <code className="text-gray-800 dark:text-gray-200">pnpm add @openai/agents @modelcontextprotocol/server-filesystem</code>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2 text-gray-900 dark:text-white">{t('guide.step2Title')}</h4>
                <div className="bg-gray-100 dark:bg-slate-800 p-3 rounded text-sm border border-gray-200 dark:border-slate-700">
                  <code className="text-gray-800 dark:text-gray-200">app/api/agent/route.ts</code>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2 text-gray-900 dark:text-white">{t('guide.step3Title')}</h4>
                <div className="bg-gray-100 dark:bg-slate-800 p-3 rounded text-sm border border-gray-200 dark:border-slate-700">
                  <code className="text-gray-800 dark:text-gray-200">&lt;AgentChat userId=&quot;user123&quot; /&gt;</code>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="font-medium mb-3 text-gray-900 dark:text-white">{t('guide.envVarsTitle')}</h4>
              <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <div><code className="text-gray-800 dark:text-gray-200">OPENAI_API_KEY</code> - {t('guide.envOpenAI')}</div>
                <div><code className="text-gray-800 dark:text-gray-200">UPSTASH_REDIS_REST_URL</code> - {t('guide.envRedisUrl')}</div>
                <div><code className="text-gray-800 dark:text-gray-200">UPSTASH_REDIS_REST_TOKEN</code> - {t('guide.envRedisToken')}</div>
                <div><code className="text-gray-800 dark:text-gray-200">MCP_AUTH_TOKEN</code> - {t('guide.envMcpAuth')}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
        </div>
      </CGCAccessGate>
    </>
  );
}

