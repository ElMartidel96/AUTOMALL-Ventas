/**
 * 🤖 AGENT CONTEXT
 * Global context for managing apeX agent state and conversation persistence
 * Ensures conversation continuity between floating widget and full page
 */

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { nanoid } from 'nanoid';
import type { ChatMessage, AgentModeId } from './types';

// ===================================================
// 📦 TYPES
// ===================================================

interface AgentContextState {
  // Session
  sessionId: string;
  messages: ChatMessage[];
  mode: AgentModeId;

  // UI State
  isFloatingChatOpen: boolean;

  // Actions
  addMessage: (message: Omit<ChatMessage, 'id'>) => ChatMessage;
  updateLastMessage: (updates: Partial<ChatMessage>) => void;
  clearMessages: () => void;
  setMode: (mode: AgentModeId) => void;
  setFloatingChatOpen: (open: boolean) => void;
  loadFromStorage: () => void;
  saveToStorage: () => void;
}

const STORAGE_KEY = 'apex-agent-session';

// ===================================================
// 🎯 CONTEXT
// ===================================================

const AgentContext = createContext<AgentContextState | null>(null);

export function AgentProvider({ children }: { children: ReactNode }) {
  const [sessionId] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          return parsed.sessionId || nanoid();
        } catch {
          return nanoid();
        }
      }
    }
    return nanoid();
  });

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [mode, setMode] = useState<AgentModeId>('general');
  const [isFloatingChatOpen, setFloatingChatOpen] = useState(false);

  // Load from localStorage on mount
  const loadFromStorage = useCallback(() => {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.messages && Array.isArray(parsed.messages)) {
          setMessages(parsed.messages);
        }
        if (parsed.mode) {
          setMode(parsed.mode);
        }
      }
    } catch (err) {
      console.warn('Failed to load agent session from storage:', err);
    }
  }, []);

  // Save to localStorage
  const saveToStorage = useCallback(() => {
    if (typeof window === 'undefined') return;

    try {
      const data = {
        sessionId,
        messages,
        mode,
        lastUpdated: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.warn('Failed to save agent session to storage:', err);
    }
  }, [sessionId, messages, mode]);

  // Load on mount
  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  // Auto-save when messages change
  useEffect(() => {
    if (messages.length > 0) {
      saveToStorage();
    }
  }, [messages, saveToStorage]);

  // Add message
  const addMessage = useCallback((message: Omit<ChatMessage, 'id'>): ChatMessage => {
    const fullMessage: ChatMessage = {
      ...message,
      id: nanoid(),
    };

    setMessages(prev => [...prev, fullMessage]);
    return fullMessage;
  }, []);

  // Update last message (for streaming)
  const updateLastMessage = useCallback((updates: Partial<ChatMessage>) => {
    setMessages(prev => {
      const newMessages = [...prev];
      const lastIndex = newMessages.length - 1;
      if (lastIndex >= 0 && newMessages[lastIndex]) {
        newMessages[lastIndex] = {
          ...newMessages[lastIndex],
          ...updates,
        } as ChatMessage;
      }
      return newMessages;
    });
  }, []);

  // Clear messages
  const clearMessages = useCallback(() => {
    setMessages([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const value: AgentContextState = {
    sessionId,
    messages,
    mode,
    isFloatingChatOpen,
    addMessage,
    updateLastMessage,
    clearMessages,
    setMode,
    setFloatingChatOpen,
    loadFromStorage,
    saveToStorage,
  };

  return (
    <AgentContext.Provider value={value}>
      {children}
    </AgentContext.Provider>
  );
}

// ===================================================
// 🎣 HOOK
// ===================================================

export function useAgentContext() {
  const context = useContext(AgentContext);
  if (!context) {
    throw new Error('useAgentContext must be used within an AgentProvider');
  }
  return context;
}
