'use client'

/**
 * AgentChatWidget — Floating chat widget for the AutoMALL AI assistant
 *
 * Bottom-right FAB that expands into a chat panel with streaming responses.
 * Uses /api/agent/chat endpoint via Vercel AI SDK v5 useChat.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { useChat } from '@ai-sdk/react'
import { TextStreamChatTransport } from 'ai'
import { X, Send, Bot, User, Loader2, Sparkles } from 'lucide-react'
import { useAccount } from '@/lib/thirdweb'
import { FEATURE_AI_AGENT_CONNECTOR } from '@/lib/config/features'

export function AgentChatWidget() {
  const t = useTranslations('agent')
  const { address, isConnected } = useAccount()
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { messages, sendMessage, status, error } = useChat({
    transport: new TextStreamChatTransport({
      api: '/api/agent/chat',
      headers: address ? { 'x-wallet-address': address } : undefined,
    }),
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = useCallback(() => {
    const text = inputValue.trim()
    if (!text || isLoading) return
    setInputValue('')
    sendMessage({ text })
  }, [inputValue, isLoading, sendMessage])

  // Don't render if feature is disabled or user not connected
  if (!FEATURE_AI_AGENT_CONNECTOR || !isConnected || !address) {
    return null
  }

  return (
    <>
      {/* FAB Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-am-blue to-am-blue-light text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center justify-center"
          aria-label={t('chat.open')}
        >
          <Sparkles className="w-6 h-6" />
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100vh-4rem)] flex flex-col rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-am-blue to-am-blue-light text-white">
            <Bot className="w-6 h-6" />
            <div className="flex-1">
              <p className="font-bold text-sm">Alfred</p>
              <p className="text-xs text-white/70">{t('chat.subtitle')}</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <Bot className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('chat.welcome')}</p>
              </div>
            )}

            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-am-blue to-am-blue-light flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-am-blue to-am-blue-light text-white rounded-br-md'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">
                    {msg.parts?.filter(p => p.type === 'text').map((part, i) => (
                      <span key={i}>{part.type === 'text' ? part.text : ''}</span>
                    ))}
                  </p>
                </div>
                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-am-orange flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2 items-center">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-am-blue to-am-blue-light flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-md px-4 py-3">
                  <Loader2 className="w-4 h-4 animate-spin text-am-blue" />
                </div>
              </div>
            )}

            {error && (
              <p className="text-xs text-red-400 text-center">{t('chat.error')}</p>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder={t('chat.placeholder')}
                className="flex-1 px-3 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm border border-gray-200 dark:border-gray-700 focus:border-am-blue focus:outline-none"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading}
                className="p-2.5 rounded-xl bg-gradient-to-r from-am-orange to-am-orange-light text-white hover:shadow-lg transition-all disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
