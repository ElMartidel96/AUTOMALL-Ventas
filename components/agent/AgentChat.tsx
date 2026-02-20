/**
 * 🤖 AGENT CHAT WIDGET
 * Main chat interface for CG DAO Agent with GPT-5 Thinking
 * 🌐 i18n: Full translation support for EN/ES
 *
 * Features:
 * - SSE streaming responses
 * - Mode switching (General, Technical, Governance, Operations)
 * - Quick actions and presets
 * - Document citations
 * - Message history and export
 * - Real-time metrics
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  User,
  Send,
  Loader2,
  Settings,
  Download,
  RefreshCw,
  AlertCircle,
  Zap,
  Brain,
  FileText,
  Copy,
  CheckCircle2,
  Activity,
  Clock,
  Bot
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAgent } from '@/lib/agent/useAgent';
import { AGENT_MODES, type AgentModeId, type ChatMessage } from '@/lib/agent/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

// ===================================================
// 🎨 COMPONENTS
// ===================================================

interface AgentChatProps {
  className?: string;
  userId?: string;
  initialMode?: AgentModeId;
  showHeader?: boolean;
  showModeSelector?: boolean;
  maxHeight?: string;
}

export function AgentChat({
  className,
  userId,
  initialMode = 'general',
  showHeader = true,
  showModeSelector = true,
  maxHeight = 'h-96'
}: AgentChatProps) {
  // 🌐 Translation hooks
  const t = useTranslations('agent.chat');

  const [input, setInput] = useState('');
  const [selectedMode, setSelectedMode] = useState<AgentModeId>(initialMode);
  const [showMetrics, setShowMetrics] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    messages,
    isLoading,
    isConnected,
    error,
    sendMessage,
    clearMessages,
    changeMode,
    retry,
    exportSession,
    getMetrics
  } = useAgent({
    userId,
    mode: selectedMode,
    stream: true,
  });

  // Auto-scroll to bottom only when not actively reading
  useEffect(() => {
    if (scrollRef.current && !isLoading) {
      // Only auto-scroll when agent finishes responding
      const timer = setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 500); // Small delay to allow user to read
      
      return () => clearTimeout(timer);
    }
  }, [messages, isLoading]);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    sendMessage(input.trim());
    setInput('');
  };

  // Handle quick action
  const handleQuickAction = (prompt: string) => {
    sendMessage(prompt);
  };

  // Handle mode change
  const handleModeChange = (mode: AgentModeId) => {
    setSelectedMode(mode);
    changeMode(mode);
  };

  // Copy message content
  const copyMessage = async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  // Export session
  const handleExport = () => {
    const data = exportSession();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cg-dao-chat-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <TooltipProvider>
      <div className={cn('flex flex-col border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 shadow-lg', maxHeight, className)}>
        {/* Header */}
        {showHeader && (
          <div className="p-4 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-full overflow-hidden border border-purple-500/30 shadow-sm shadow-purple-500/20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/apeX11.png"
                    alt="apeX"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">apeX</h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                    <div className={cn(
                      'flex items-center space-x-1',
                      isConnected ? 'text-green-600' : 'text-red-600'
                    )}>
                      <Activity className="h-3 w-3" />
                      <span>{isConnected ? t('connected') : t('disconnected')}</span>
                    </div>
                    <Separator orientation="vertical" className="h-3" />
                    <span>{AGENT_MODES[selectedMode]?.name || 'General'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleExport}
                      disabled={messages.length === 0}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t('exportConversation')}</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearMessages}
                      disabled={messages.length === 0}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t('clearConversation')}</TooltipContent>
                </Tooltip>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t('settingsTitle')}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">{t('model')}</h4>
                        <p className="text-sm text-gray-600">{t('modelDescription')}</p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">{t('featuresTitle')}</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• {t('featuresList.documentAccess')}</li>
                          <li>• {t('featuresList.streaming')}</li>
                          <li>• {t('featuresList.sessionMemory')}</li>
                          <li>• {t('featuresList.citations')}</li>
                        </ul>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        )}

        {/* Mode Selector */}
        {showModeSelector && (
          <div className="p-3 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
            <div className="flex space-x-2 overflow-x-auto">
              {Object.entries(AGENT_MODES).map(([id, mode]) => (
                <Button
                  key={id}
                  variant={selectedMode === id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleModeChange(id as AgentModeId)}
                  className={cn(
                    "flex-shrink-0",
                    selectedMode !== id && "dark:border-slate-600 dark:text-gray-300 dark:hover:bg-slate-700"
                  )}
                >
                  <span className="mr-1">{mode.icon}</span>
                  {mode.name}
                </Button>
              ))}
            </div>

            {/* Quick Actions */}
            {(AGENT_MODES[selectedMode]?.quickActions?.length ?? 0) > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {AGENT_MODES[selectedMode]?.quickActions?.map((action) => (
                  <Button
                    key={action.id}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAction(action.prompt)}
                    disabled={isLoading}
                    className="text-xs h-7 dark:border-slate-600 dark:text-gray-300 dark:hover:bg-slate-700"
                  >
                    <span className="mr-1">{action.icon}</span>
                    {action.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                <Bot className="h-16 w-16 mx-auto mb-4 text-blue-500 dark:text-blue-400" />
                <p className="mb-2 text-gray-700 dark:text-white font-medium">{t('helloMessage')}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('askAnything')}</p>
              </div>
            )}

            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                onCopy={copyMessage}
                isCopied={copiedMessageId === message.id}
                t={t}
              />
            ))}

            {error && (
              <div className="flex items-start space-x-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-red-800 dark:text-red-300 font-medium">{t('errorTitle')}</p>
                  <p className="text-red-700 dark:text-red-400 text-sm">{error.message}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={retry}
                    className="mt-2 text-red-700 hover:text-red-800"
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    {t('retry')}
                  </Button>
                </div>
              </div>
            )}

            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('askAbout', { topic: AGENT_MODES[selectedMode]?.name?.toLowerCase() || 'general topics' })}
              disabled={!isConnected}
              className="flex-1 dark:bg-slate-900 dark:border-slate-600 dark:text-white dark:placeholder:text-gray-400"
              maxLength={4000}
            />
            <Button
              type="submit"
              disabled={isLoading || !input.trim() || !isConnected}
              size="sm"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>

          {input.length > 3800 && (
            <p className="text-xs text-gray-500 mt-1">
              {t('charactersRemaining', { count: 4000 - input.length })}
            </p>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}

// ===================================================
// 💬 MESSAGE BUBBLE COMPONENT
// ===================================================

interface MessageBubbleProps {
  message: ChatMessage;
  onCopy: (id: string, content: string) => void;
  isCopied: boolean;
  t: ReturnType<typeof useTranslations>;
}

function MessageBubble({ message, onCopy, isCopied, t }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const isError = message.metadata?.error;

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <div className="px-3 py-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 text-sm rounded-full">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      'flex items-start space-x-3',
      isUser && 'flex-row-reverse space-x-reverse'
    )}>
      {isUser ? (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarFallback className="bg-green-600 text-white">
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      ) : (
        <div className="h-8 w-8 flex-shrink-0 rounded-full overflow-hidden border border-purple-500/30 shadow-sm shadow-purple-500/20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/apeX11.png"
            alt="apeX"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className={cn(
        'flex-1 min-w-0',
        isUser && 'flex flex-col items-end'
      )}>
        <div className={cn(
          'rounded-lg px-4 py-2 max-w-[80%]',
          isUser
            ? 'bg-green-600 text-white'
            : isError
            ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50'
            : 'bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-gray-100'
        )}>
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                  // Custom link rendering for citations
                  a: ({ node, ...props }) => (
                    <a {...props} className="text-blue-600 hover:underline" />
                  ),
                  // Custom code block styling
                  code: ({ node, className, ...props }) => {
                    // Detect if code is inline by checking if it has a language class or parent
                    const isInline = !className && node?.position?.start.line === node?.position?.end.line;
                    return (
                      <code
                        className={cn(
                          className,
                          isInline
                            ? 'bg-gray-200 px-1 rounded text-sm'
                            : 'block bg-gray-800 text-gray-100 p-3 rounded mt-2'
                        )}
                        {...props}
                      />
                    );
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2 mt-1 text-xs text-gray-500">
          <Clock className="h-3 w-3" />
          <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
          
          {message.metadata?.reasoning_tokens && (
            <>
              <Separator orientation="vertical" className="h-3" />
              <Brain className="h-3 w-3 text-purple-500" />
              <span className="text-purple-600">
                {t('reasoningTokens', { count: message.metadata.reasoning_tokens })}
              </span>
            </>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCopy(message.id, message.content)}
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-gray-200"
          >
            {isCopied ? (
              <CheckCircle2 className="h-3 w-3 text-green-600" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default AgentChat;