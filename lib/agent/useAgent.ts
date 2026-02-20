/**
 * 🎣 AGENT HOOK
 * React hook for interacting with the CG DAO Agent
 * Handles SSE streaming, session management, and error handling
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { nanoid } from 'nanoid';
import type {
  AgentRequest,
  AgentResponse,
  AgentStreamChunk,
  ChatMessage,
  ChatSession,
  AgentModeId,
  AgentError
} from './types';

// ===================================================
// 💾 PERSISTENCE LAYER
// ===================================================

const STORAGE_KEY = 'apex-agent-conversation';
const PENDING_KEY = 'apex-agent-pending';

function saveMessagesToStorage(messages: ChatMessage[]) {
  if (typeof window === 'undefined') return;
  try {
    const data = {
      messages,
      lastUpdated: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('Failed to save messages to storage:', err);
  }
}

function loadMessagesFromStorage(): ChatMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      // Only load messages from the last 24 hours
      const dayAgo = Date.now() - (24 * 60 * 60 * 1000);
      if (data.lastUpdated > dayAgo && Array.isArray(data.messages)) {
        return data.messages;
      }
    }
  } catch (err) {
    console.warn('Failed to load messages from storage:', err);
  }
  return [];
}

function savePendingMessage(message: string) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify({ message, timestamp: Date.now() }));
  } catch (err) {
    console.warn('Failed to save pending message:', err);
  }
}

function loadPendingMessage(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(PENDING_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      // Only recover messages from the last hour
      const hourAgo = Date.now() - (60 * 60 * 1000);
      if (data.timestamp > hourAgo) {
        return data.message;
      }
    }
  } catch (err) {
    console.warn('Failed to load pending message:', err);
  }
  return null;
}

function clearPendingMessage() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(PENDING_KEY);
  } catch (err) {
    console.warn('Failed to clear pending message:', err);
  }
}

// ===================================================
// 🎣 HOOK INTERFACE
// ===================================================

export interface UseAgentOptions {
  sessionId?: string;
  userId?: string;
  mode?: AgentModeId;
  stream?: boolean;
  onMessage?: (message: ChatMessage) => void;
  onError?: (error: AgentError) => void;
  onMetrics?: (metrics: any) => void;
}

export interface UseAgentReturn {
  // State
  messages: ChatMessage[];
  isLoading: boolean;
  isConnected: boolean;
  session: ChatSession | null;
  error: AgentError | null;
  pendingMessage: string | null;

  // Actions
  sendMessage: (message: string, options?: { mode?: AgentModeId }) => Promise<void>;
  clearMessages: () => void;
  changeMode: (mode: AgentModeId) => void;
  retry: () => void;
  dismissPendingMessage: () => void;

  // Session management
  sessionId: string;
  loadSession: (sessionId: string) => Promise<void>;

  // Utils
  exportSession: () => string;
  getMetrics: () => Promise<any>;
}

// ===================================================
// 🎣 MAIN HOOK
// ===================================================

export function useAgent(options: UseAgentOptions = {}): UseAgentReturn {
  const {
    sessionId: initialSessionId,
    userId,
    mode = 'general',
    stream = true,
    onMessage,
    onError,
    onMetrics
  } = options;

  // State - Load messages from storage on init
  const [sessionId] = useState(() => initialSessionId || nanoid());
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadMessagesFromStorage());
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [session, setSession] = useState<ChatSession | null>(null);
  const [error, setError] = useState<AgentError | null>(null);
  const [currentMode, setCurrentMode] = useState<AgentModeId>(mode);
  const [pendingMessage, setPendingMessage] = useState<string | null>(() => loadPendingMessage());

  // Refs
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastMessageRef = useRef<string>('');

  // Auto-save messages to localStorage when they change
  useEffect(() => {
    if (messages.length > 0) {
      saveMessagesToStorage(messages);
    }
  }, [messages]);

  // ===================================================
  // 🔄 SESSION MANAGEMENT
  // ===================================================

  const initializeSession = useCallback(async () => {
    try {
      const newSession: ChatSession = {
        id: sessionId,
        userId,
        mode: currentMode,
        messages: [],
        created: Date.now(),
        lastAccessed: Date.now(),
      };
      
      setSession(newSession);
      setError(null);
    } catch (err) {
      setError({
        code: 'SESSION_ERROR',
        message: 'Failed to initialize session',
        timestamp: Date.now(),
        details: err
      });
    }
  }, [sessionId, userId, currentMode]);

  const loadSession = useCallback(async (sessionId: string) => {
    try {
      // In a real implementation, this would load from the server
      console.log('Loading session:', sessionId);
    } catch (err) {
      setError({
        code: 'LOAD_ERROR', 
        message: 'Failed to load session',
        timestamp: Date.now(),
        details: err
      });
    }
  }, []);

  // ===================================================
  // 💬 MESSAGE HANDLING
  // ===================================================

  const addMessage = useCallback((message: Omit<ChatMessage, 'id'>) => {
    const fullMessage: ChatMessage = {
      ...message,
      id: nanoid(),
    };
    
    setMessages(prev => [...prev, fullMessage]);
    
    if (onMessage) {
      onMessage(fullMessage);
    }
    
    return fullMessage;
  }, [onMessage]);

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

  // ===================================================
  // 🔄 STREAMING LOGIC
  // ===================================================

  const handleStreamResponse = useCallback(async (request: AgentRequest) => {
    return new Promise<void>((resolve, reject) => {
      // Use fetch for both streaming and non-streaming (AI SDK compatible)
      if (!stream) {
        fetch('/api/agent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...request, stream: false }),
        })
        .then(res => res.json())
        .then((data: AgentResponse) => {
          addMessage({
            role: 'assistant',
            content: data.response,
            timestamp: Date.now(),
            metadata: {
              mode: currentMode as AgentModeId,
              reasoning_tokens: data.metrics.reasoning_tokens,
            }
          });
          
          if (onMetrics) {
            onMetrics(data.metrics);
          }
          
          resolve();
        })
        .catch(reject);
        
        return;
      }

      // Streaming with POST fetch (compatible with AI SDK)
      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      
      fetch('/api/agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: request.message,
          sessionId: request.sessionId || sessionId,
          userId: request.userId || userId || '',
          mode: request.mode || currentMode,
          stream: true,
        }),
        signal: abortController.signal,
      })
      .then(async response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        if (!response.body) {
          throw new Error('No response body for streaming');
        }

        // Add placeholder assistant message
        addMessage({
          role: 'assistant', 
          content: '',
          timestamp: Date.now(),
          metadata: { mode: currentMode }
        });
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              resolve();
              break;
            }

            // Decode the chunk and split by lines
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = line.slice(6).trim();
                  if (data === '[DONE]') {
                    setIsLoading(false); // ✅ Ensure loading state is cleared
                    resolve();
                    return;
                  }

                  const parsed: AgentStreamChunk = JSON.parse(data);
                  
                  switch (parsed.type) {
                    case 'chunk':
                      if (parsed.content) {
                        fullContent += parsed.content;
                        updateLastMessage({ content: fullContent });
                      }
                      break;
                      
                    case 'done':
                      updateLastMessage({ 
                        content: fullContent,
                        metadata: {
                          mode: currentMode as AgentModeId,
                          reasoning_tokens: parsed.metrics?.reasoning_tokens || 0,
                        }
                      });
                      
                      if (onMetrics && parsed.metrics) {
                        onMetrics(parsed.metrics);
                      }
                      
                      setIsLoading(false); // ✅ Ensure loading state is cleared
                      resolve();
                      return;
                      
                    case 'error':
                      const agentError: AgentError = {
                        code: 'STREAM_ERROR',
                        message: parsed.error || 'Streaming error',
                        timestamp: Date.now()
                      };
                      
                      updateLastMessage({ 
                        content: parsed.error || 'An error occurred',
                        metadata: { error: true }
                      });
                      
                      setError(agentError);
                      if (onError) onError(agentError);
                      
                      setIsLoading(false); // ✅ Ensure loading state is cleared on error
                      reject(new Error(parsed.error || 'Unknown streaming error'));
                      return;
                  }
                } catch (parseErr) {
                  console.warn('Failed to parse streaming chunk:', parseErr, line);
                }
              }
            }
          }
        } catch (streamErr) {
          console.error('Streaming error:', streamErr);
          const agentError: AgentError = {
            code: 'STREAM_ERROR',
            message: 'Streaming interrupted',
            timestamp: Date.now(),
            details: streamErr
          };
          
          setError(agentError);
          if (onError) onError(agentError);
          reject(streamErr);
        } finally {
          reader.releaseLock();
        }
      })
      .catch(error => {
        console.error('Fetch error:', error);
        const agentError: AgentError = {
          code: 'CONNECTION_ERROR',
          message: 'Connection to agent failed',
          timestamp: Date.now(),
          details: error
        };
        
        setError(agentError);
        if (onError) onError(agentError);
        
        reject(new Error('Connection failed'));
      });
    });
  }, [stream, sessionId, userId, currentMode, addMessage, updateLastMessage, onMetrics, onError]);

  // ===================================================
  // 📤 SEND MESSAGE
  // ===================================================

  const sendMessage = useCallback(async (message: string, options: { mode?: AgentModeId } = {}) => {
    if (!message.trim()) return;
    if (isLoading) return;

    const messageMode: AgentModeId = options.mode || currentMode;

    // Save message as pending before sending (recovery on connection failure)
    savePendingMessage(message);
    setPendingMessage(message);

    try {
      setIsLoading(true);
      setError(null);
      lastMessageRef.current = message;

      // Add user message
      addMessage({
        role: 'user',
        content: message,
        timestamp: Date.now(),
        metadata: { mode: messageMode }
      });

      // Prepare request
      const request: AgentRequest = {
        message,
        sessionId,
        userId,
        mode: messageMode,
        stream,
      };

      // Handle response (streaming or non-streaming)
      await handleStreamResponse(request);

      // Success - clear pending message
      clearPendingMessage();
      setPendingMessage(null);
      
    } catch (err) {
      const agentError: AgentError = {
        code: 'SEND_ERROR',
        message: err instanceof Error ? err.message : 'Failed to send message',
        timestamp: Date.now(),
        details: err
      };
      
      setError(agentError);
      if (onError) onError(agentError);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, currentMode, sessionId, userId, stream, addMessage, handleStreamResponse, onError]);

  // ===================================================
  // 🛠️ UTILITY FUNCTIONS
  // ===================================================

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    // Also clear from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // Dismiss pending message (user chooses not to recover)
  const dismissPendingMessage = useCallback(() => {
    clearPendingMessage();
    setPendingMessage(null);
  }, []);

  const changeMode = useCallback((newMode: AgentModeId) => {
    setCurrentMode(newMode);
    
    // Add system message about mode change
    addMessage({
      role: 'system',
      content: `Switched to ${newMode} mode`,
      timestamp: Date.now(),
      metadata: { mode: newMode }
    });
  }, [addMessage]);

  const retry = useCallback(() => {
    if (lastMessageRef.current) {
      sendMessage(lastMessageRef.current);
    }
  }, [sendMessage]);

  const exportSession = useCallback(() => {
    const sessionData = {
      sessionId,
      messages,
      mode: currentMode,
      exported: new Date().toISOString(),
    };
    
    return JSON.stringify(sessionData, null, 2);
  }, [sessionId, messages, currentMode]);

  const getMetrics = useCallback(async () => {
    try {
      const response = await fetch('/api/agent?action=metrics');
      return await response.json();
    } catch (err) {
      console.error('Failed to get metrics:', err);
      return null;
    }
  }, []);

  // ===================================================
  // 🔄 EFFECTS
  // ===================================================

  useEffect(() => {
    initializeSession();
  }, [initializeSession]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Connection monitoring
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch('/api/agent?action=health');
        const health = await response.json();
        setIsConnected(health.status === 'healthy');
      } catch (err) {
        setIsConnected(false);
      }
    };

    const interval = setInterval(checkConnection, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  return {
    // State
    messages,
    isLoading,
    isConnected,
    session,
    error,
    pendingMessage,

    // Actions
    sendMessage,
    clearMessages,
    changeMode,
    retry,
    dismissPendingMessage,

    // Session
    sessionId,
    loadSession,
    
    // Utils
    exportSession,
    getMetrics,
  };
}