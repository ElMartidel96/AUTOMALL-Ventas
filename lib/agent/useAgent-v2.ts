/**
 * 🎣 useAgent Hook V2 - Con Vercel AI SDK
 * 
 * Hook simplificado usando @ai-sdk/react useChat
 * Maneja streaming, estado y errores automáticamente
 */

'use client';

import { useChat } from '@ai-sdk/react';
import { useCallback, useMemo } from 'react';
import type { CoreMessage } from 'ai';

type Message = CoreMessage;

// ===================================================
// 📋 TYPES
// ===================================================

export interface UseAgentOptions {
  sessionId?: string;
  userId?: string;
  mode?: 'general' | 'technical' | 'governance' | 'operations';
  initialMessages?: Message[];
  onError?: (error: Error) => void;
  onFinish?: (message: Message) => void;
}

export interface UseAgentReturn {
  // Estado del chat
  messages: Message[];
  input: string;
  isLoading: boolean;
  error: Error | undefined;
  
  // Acciones
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSubmit: (e?: React.FormEvent<HTMLFormElement>, options?: any) => void;
  append: (message: Message | { role: 'user' | 'assistant'; content: string }) => Promise<string | null | undefined>;
  reload: () => void;
  stop: () => void;
  setMessages: (messages: Message[]) => void;
  setInput: (input: string) => void;
  
  // Métodos específicos del agente DAO
  askAboutContract: (address: string) => Promise<void>;
  askAboutProposal: (proposalId: string) => Promise<void>;
  searchDocumentation: (query: string) => Promise<void>;
  clearSession: () => void;
}

// ===================================================
// 🪝 MAIN HOOK
// ===================================================

export function useAgent(options: UseAgentOptions = {}): UseAgentReturn {
  const {
    sessionId,
    userId,
    mode = 'general',
    initialMessages = [],
    onError,
    onFinish,
  } = options;
  
  // Use Vercel AI SDK's useChat hook
  const chatHelpers = useChat({
    api: '/api/agent-v2', // Point to our agent-v2 endpoint for AI SDK compatibility
    initialMessages,
    onError: (error: Error) => {
      console.error('[useAgent] Error:', error);
      onError?.(error);
    },
    onFinish: (message: any) => {
      console.log('[useAgent] Message completed:', message);
      onFinish?.(message);
    },
  } as any);
  
  // Destructure with defaults for compatibility
  const {
    messages = [],
    input = '',
    handleInputChange = () => {},
    handleSubmit: originalHandleSubmit = () => {},
    append = async () => null,
    reload = () => {},
    stop = () => {},
    setMessages = () => {},
    setInput = () => {},
    isLoading = false,
    error,
  } = chatHelpers as any;
  
  // ===================================================
  // 🎯 CUSTOM METHODS
  // ===================================================
  
  // Preguntar sobre un contrato específico
  const askAboutContract = useCallback(async (address: string) => {
    const message = `Analiza el contrato en la dirección ${address} en Base Mainnet. Proporciona información sobre sus funciones principales, estado actual y cualquier dato relevante.`;
    
    await append({
      role: 'user',
      content: message,
    });
  }, [append]);
  
  // Preguntar sobre una propuesta DAO
  const askAboutProposal = useCallback(async (proposalId: string) => {
    const message = `Dame información sobre la propuesta DAO con ID ${proposalId}. Incluye estado, descripción, votos y cualquier detalle relevante.`;
    
    await append({
      role: 'user',
      content: message,
    });
  }, [append]);
  
  // Buscar en documentación
  const searchDocumentation = useCallback(async (query: string) => {
    const message = `Busca en la documentación del proyecto: "${query}"`;
    
    await append({
      role: 'user',
      content: message,
    });
  }, [append]);
  
  // Limpiar sesión
  const clearSession = useCallback(() => {
    setMessages([]);
    setInput('');
  }, [setMessages, setInput]);
  
  // Custom handleSubmit que preserva el comportamiento original
  const handleSubmit = useCallback((
    e?: React.FormEvent<HTMLFormElement>,
    options?: any
  ) => {
    // Log para debugging
    console.log('[useAgent] Submitting message', { input, mode, sessionId });
    
    // Llamar al handleSubmit original
    originalHandleSubmit(e, {
      ...options,
      body: {
        ...options?.body,
        sessionId,
        userId,
        mode,
      },
    });
  }, [originalHandleSubmit, input, mode, sessionId, userId]);
  
  // ===================================================
  // 📊 COMPUTED VALUES
  // ===================================================
  
  // Estadísticas del chat
  const stats = useMemo(() => ({
    messageCount: messages?.length || 0,
    userMessages: messages?.filter((m: Message) => m.role === 'user').length || 0,
    assistantMessages: messages?.filter((m: Message) => m.role === 'assistant').length || 0,
    totalTokens: messages?.reduce((acc: number, m: Message) => {
      const content = typeof m.content === 'string' ? m.content : 
        Array.isArray(m.content) ? m.content.map((part: any) => {
          if (typeof part === 'string') return part;
          // Type-safe handling of multi-modal content parts
          if ('text' in part) return part.text || '';
          if ('image' in part) return '[Image]';
          if ('file' in part) return '[File]';
          return '[Content]';
        }).join('') : 
        '';
      return acc + (content.length || 0);
    }, 0) / 4 || 0, // Aproximación
  }), [messages]);
  
  // ===================================================
  // 🔄 RETURN
  // ===================================================
  
  return {
    // Estado del chat
    messages,
    input,
    isLoading,
    error,
    
    // Acciones básicas
    handleInputChange,
    handleSubmit,
    append,
    reload,
    stop,
    setMessages,
    setInput,
    
    // Métodos específicos del agente DAO
    askAboutContract,
    askAboutProposal,
    searchDocumentation,
    clearSession,
    
    // Estadísticas (útil para debugging)
    ...stats,
  };
}

// ===================================================
// 🎨 UTILITY FUNCTIONS
// ===================================================

/**
 * Formatea un mensaje para display
 */
export function formatMessage(message: Message): string {
  const content = typeof message.content === 'string' 
    ? message.content 
    : JSON.stringify(message.content);
    
  if (message.role === 'user') {
    return `👤 ${content}`;
  }
  if (message.role === 'assistant') {
    return `🤖 ${content}`;
  }
  return content;
}

/**
 * Extrae menciones de contratos de los mensajes
 */
export function extractContractMentions(messages: Message[]): string[] {
  const contractRegex = /0x[a-fA-F0-9]{40}/g;
  const mentions = new Set<string>();
  
  messages.forEach(message => {
    const content = typeof message.content === 'string' ? message.content : '';
    const matches = content.match(contractRegex);
    if (matches) {
      matches.forEach((match: string) => mentions.add(match));
    }
  });
  
  return Array.from(mentions);
}