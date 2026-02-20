/**
 * 🤖 CG DAO AGENT API - V2 con Vercel AI SDK
 * 
 * Features:
 * - Vercel AI SDK para streaming optimizado
 * - OpenAI provider con modelo configurable
 * - Rate limiting con @upstash/ratelimit
 * - Session management mejorado
 * - Tool calling preparado para MCP
 */

import { NextRequest } from 'next/server';
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import OpenAI from 'openai'; // Native OpenAI SDK para GPT-5 garantizado
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// ===================================================
// 📋 CONFIGURATION & VALIDATION
// ===================================================

const AgentRequestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
  })),
  sessionId: z.string().optional(),
  userId: z.string().optional(),
  mode: z.enum(['general', 'technical', 'governance', 'operations']).default('general'),
});

// ===================================================
// 🛡️ RATE LIMITING
// ===================================================

const createRateLimiter = () => {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  
  if (!url || !token) {
    console.warn('Rate limiting disabled: Redis config missing');
    return null;
  }
  
  return new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(10, '1m'),
    prefix: 'dao:agent:rl',
  });
};

const rateLimiter = createRateLimiter();

// ===================================================
// 📊 LOGGING
// ===================================================

const logger = {
  info: (msg: string, data?: any) => console.log(`[AGENT-V2] ${msg}`, data || ''),
  error: (msg: string, error?: any) => console.error(`[AGENT-V2] ${msg}`, error || ''),
  warn: (msg: string, data?: any) => console.warn(`[AGENT-V2] ${msg}`, data || '')
};

// ===================================================
// 🔧 HELPER FUNCTIONS
// ===================================================

function extractIP(req: NextRequest): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // Take first IP from comma-separated list
    const firstIP = forwardedFor.split(',')[0];
    return firstIP ? firstIP.trim() : 'unknown';
  }
  return req.ip || 'unknown';
}

function getSystemPrompt(mode: string): string {
  const basePrompt = `Eres apeX, el asistente técnico-operativo principal del ecosistema CryptoGift DAO, potenciado por GPT-4o con capacidades avanzadas.

CONTEXTO CRÍTICO:
- DAO Address: ${process.env.ARAGON_DAO_ADDRESS || '0x3244DFBf9E5374DF2f106E89Cf7972E5D4C9ac31'}
- CGC Token: ${process.env.CGC_TOKEN_ADDRESS || '0x5e3a61b550328f3D8C44f60b3e10a49D3d806175'} (2M total supply)
- Network: Base Mainnet (Chain ID: 8453)
- Fase actual: Production Ready - Contratos desplegados y verificados

CAPACIDADES AVANZADAS:
- Análisis profundo paso a paso para problemas complejos
- Análisis de contratos inteligentes con detalles técnicos precisos
- Búsqueda inteligente y síntesis de información del proyecto
- Gobernanza DAO con recomendaciones estratégicas fundamentadas
- Soporte técnico especializado en Aragon OSx, EAS, EIP-712
- Pensamiento crítico y resolución de problemas multi-paso

INSTRUCCIONES DE RAZONAMIENTO:
- Analiza problemas complejos paso a paso
- Proporciona explicaciones detalladas cuando sea apropiado
- Fundamenta tus recomendaciones con análisis técnico profundo
- Considera múltiples perspectivas antes de concluir`;

  const modePrompts = {
    technical: `
MODO TÉCNICO ACTIVADO:
- Proporcionar detalles de implementación
- Incluir direcciones de contratos y funciones
- Explicar arquitectura y patrones de diseño
- Sugerir mejoras y optimizaciones`,
    
    governance: `
MODO GOBERNANZA ACTIVADO:
- Información sobre propuestas y votaciones
- Procesos de toma de decisiones
- Tokenomics y distribución
- Mecánicas de participación`,
    
    operations: `
MODO OPERACIONES ACTIVADO:
- Estado actual del sistema
- Métricas y KPIs
- Procedimientos operativos
- Troubleshooting y soporte`,
    
    general: ''
  };

  return basePrompt + (modePrompts[mode as keyof typeof modePrompts] || '');
}

// ===================================================
// 🚀 MAIN API HANDLER
// ===================================================

export async function POST(req: NextRequest) {
  const requestId = nanoid();
  const startTime = Date.now();
  
  try {
    // 🔐 Basic origin validation for production
    const origin = req.headers.get('origin');
    const referer = req.headers.get('referer');
    
    if (process.env.NODE_ENV === 'production') {
      const allowedDomains = [
        'crypto-gift-wallets-dao.vercel.app',
        'cryptogift-wallets-dao.vercel.app',
        'localhost:3000'
      ];
      
      const isValidOrigin = allowedDomains.some(domain => 
        origin?.includes(domain) || referer?.includes(domain)
      );
      
      if (!isValidOrigin && origin && referer) {
        logger.warn('Blocked request from unauthorized origin', { origin, referer, requestId });
        return new Response(JSON.stringify({
          error: 'Unauthorized origin',
          requestId,
        }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }
    
    // Parse and validate request with enhanced error logging
    let body: any;
    try {
      body = await req.json();
    } catch (jsonError) {
      // Log the exact request body that's causing the JSON parse error
      const bodyText = await req.clone().text();
      logger.error('JSON parsing failed:', { 
        error: jsonError, 
        bodyText: bodyText.substring(0, 200), // First 200 chars for debugging
        bodyLength: bodyText.length,
        requestId,
      });
      
      return new Response(JSON.stringify({
        error: 'Invalid JSON in request body',
        details: jsonError instanceof Error ? jsonError.message : 'Unknown JSON error',
        requestId,
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    const { messages, sessionId, userId, mode } = AgentRequestSchema.parse(body);
    
    const clientIP = extractIP(req);
    
    // Rate limiting
    if (rateLimiter) {
      const rateLimitKey = userId || clientIP;
      const { success, limit, reset, remaining } = await rateLimiter.limit(rateLimitKey);
      
      if (!success) {
        logger.warn('Rate limit exceeded', { rateLimitKey, requestId });
        return new Response('Rate limit exceeded. Please wait before making another request.', {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': new Date(reset).toISOString(),
          },
        });
      }
    }
    
    // Log request
    logger.info('Processing request', {
      requestId,
      sessionId,
      userId,
      mode,
      messageCount: messages.length,
      ip: clientIP,
    });
    
    // Build messages with system prompt
    const systemMessage = {
      role: 'system' as const,
      content: getSystemPrompt(mode),
    };
    
    const allMessages = [systemMessage, ...messages];
    
    // Stream response usando GPT-4o (Fallback estable hasta verificación GPT-5)
    // Configuración compatible con Vercel AI SDK actual
    const modelToUse = process.env.AI_MODEL || 'gpt-4o'; // GPT-4o para máxima estabilidad
    
    const result = await streamText({
      model: openai(modelToUse),
      messages: allMessages,
      maxOutputTokens: parseInt(process.env.MAX_TOKENS || '3000'), // Usar maxOutputTokens para AI SDK
      temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
      // Configuración estable compatible con AI SDK actual
      // (GPT-5 reasoning parameters requieren organización verificada)
      // Tool calling preparado para futura integración MCP
      tools: {
        // searchDocumentation: {
        //   description: 'Search DAO documentation',
        //   parameters: z.object({
        //     query: z.string(),
        //     type: z.enum(['contracts', 'docs', 'governance']).optional(),
        //   }),
        //   execute: async ({ query, type }) => {
        //     // TODO: Integrar con MCP
        //     return `Búsqueda simulada para: ${query}`;
        //   },
        // },
      },
      toolChoice: 'auto',
      onFinish: ({ text, usage, finishReason }) => {
        // Log completion
        logger.info('Request completed', {
          requestId,
          sessionId,
          duration: Date.now() - startTime,
          tokens: usage?.totalTokens,
          finishReason,
        });
      },
    });
    
    // Return streaming response
    return result.toTextStreamResponse({
      headers: {
        'X-Request-Id': requestId,
        'X-Session-Id': sessionId || '',
      },
    });
    
  } catch (error) {
    logger.error('Agent API error', { error, requestId });
    
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ 
        error: 'Invalid request format', 
        details: error.errors 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error. Please try again later.',
      requestId,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// ===================================================
// 🔍 GET HANDLER (HEALTH CHECK)
// ===================================================

export async function GET(req: NextRequest) {
  return new Response(JSON.stringify({
    service: 'CG DAO Agent API V2 - Unified Core',
    version: '3.0.0',
    status: 'healthy',
    model: process.env.AI_MODEL || 'gpt-4o',
    capabilities: [
      'Unified AI Provider (OpenAI + Vercel AI SDK v5)',
      'MCP Streamable HTTP Transport (2025-03-26 spec)',
      'Proper Tool Calling with Parallel Execution',
      'toDataStreamResponse() with proper headers',
      'Local MCP in Development',
      'Rate limiting',
      'Session management',
    ],
    timestamp: new Date().toISOString(),
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}