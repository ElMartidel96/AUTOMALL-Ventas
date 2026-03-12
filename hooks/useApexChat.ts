'use client'

/**
 * useApexChat — Hook for the apeX chat widget
 *
 * Wraps @ai-sdk/react useChat with TextStreamChatTransport
 * pointing to /api/agent/chat. Manages input state internally.
 */

import { useChat } from '@ai-sdk/react'
import { TextStreamChatTransport } from 'ai'
import { useState, useCallback, useMemo } from 'react'

export interface UseApexChatOptions {
  walletAddress: string
  onError?: (error: Error) => void
}

export function useApexChat({ walletAddress, onError }: UseApexChatOptions) {
  const [input, setInput] = useState('')

  const transport = useMemo(() => new TextStreamChatTransport({
    api: '/api/agent/chat',
    headers: {
      'x-wallet-address': walletAddress,
    },
  }), [walletAddress])

  const { messages, setMessages, sendMessage, stop, status, error } = useChat({
    transport,
    onError: (err: Error) => {
      console.error('[useApexChat] Error:', err)
      onError?.(err)
    },
  })

  const isLoading = status === 'submitted' || status === 'streaming'

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    setInput(e.target.value)
  }, [])

  const handleSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault?.()
    const text = input.trim()
    if (!text || isLoading) return
    setInput('')
    sendMessage({ text })
  }, [input, isLoading, sendMessage])

  const appendMessage = useCallback((text: string) => {
    if (!text.trim() || isLoading) return
    sendMessage({ text })
  }, [isLoading, sendMessage])

  const clearChat = useCallback(() => {
    setMessages([])
    setInput('')
  }, [setMessages])

  return {
    messages,
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    isLoading,
    status,
    error,
    setMessages,
    stop,
    appendMessage,
    clearChat,
  }
}
