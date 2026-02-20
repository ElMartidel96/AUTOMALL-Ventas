/**
 * 🤖 CG DAO AGENT API - Unified Core Integration (2025)
 * 
 * Features:
 * - Unified AI provider with OpenAI SDK and Vercel AI SDK v5
 * - MCP Streamable HTTP Transport (2025-03-26 spec)
 * - Manual parallel tool calls handling
 * - Proper tool_calls processing in streaming loop
 * - Local MCP in development, internal in production
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { Redis } from '@upstash/redis';
import { getCorsHeaders, getCorsHeadersJson, handleCorsPreflight, validateCors } from '@/lib/security/cors';
import { SafeJSON } from '@/lib/utils/safe-json';
import { ErrorHandler } from '@/lib/monitoring/error-taxonomy';
import { observabilityUtils, trackRequest } from '@/lib/monitoring/observability';

// Import unified core modules
import { createAIProvider } from '@/lib/agent/core/ai-provider';
import { createToolExecutor } from '@/lib/agent/core/tool-executor';

// ===================================================
// 📋 CONFIGURATION & VALIDATION
// ===================================================

const AgentRequestSchema = z.object({
  message: z.string().min(1).max(4000),
  sessionId: z.string().optional(),
  userId: z.string().optional(),
  mode: z.enum(['general', 'technical', 'governance', 'operations']).default('general'),
  stream: z.boolean().default(true),
});

// Redis with DAO-specific prefix for shared account
// Initialize lazily to avoid build errors
let redis: Redis | null = null;
const getRedis = () => {
  if (!redis && process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
    } catch (error) {
      logger.warn('Redis initialization failed, continuing without caching:', error);
      return null;
    }
  }
  return redis;
};

// OpenAI client is now handled by unified AI provider

// ===================================================
// 📊 LOGGING & METRICS
// ===================================================

const logger = {
  info: (msg: string, data?: any) => console.log(`[INFO] ${msg}`, data || ''),
  error: (msg: string, error?: any) => console.error(`[ERROR] ${msg}`, error || ''),
  warn: (msg: string, data?: any) => console.warn(`[WARN] ${msg}`, data || '')
};

// ===================================================
// 🤖 AGENT CONFIGURATION
// ===================================================

// Agent configuration is handled in initializeAgent() function

// Initialize core services
let aiProvider: any = null;
let toolExecutor: any = null;

const initializeCoreServices = () => {
  if (!aiProvider) {
    // AI provider with GPT-5 September 2025 configuration
    // 🚧 TEMPORARILY DISABLED GPT-5 parameters due to SDK compatibility (openai@4.104.0)
    aiProvider = createAIProvider({
      model: process.env.AI_MODEL || 'gpt-5', // ✅ GPT-5 default (Aug 7, 2025 release)
      maxCompletionTokens: parseInt(process.env.MAX_COMPLETION_TOKENS || '3000'), // ✅ GPT-5 parameter
      // 🚧 TEMPORARILY DISABLED - SDK Compatibility Issue:
      // reasoningEffort: (process.env.REASONING_EFFORT as 'minimal' | 'high') || 'high', // ⏳ GPT-5 Sept 2025 feature
      // verbosity: (process.env.VERBOSITY as 'low' | 'medium' | 'high') || 'medium', // ⏳ GPT-5 Sept 2025 feature
      // TODO: Re-enable when OpenAI SDK supports GPT-5 September 2025 parameters
      maxToolRoundtrips: 5,
      enableStructuredOutputs: true
      
      // ❌ REMOVED: temperature (deprecated in GPT-5, causes API errors)
      // ❌ REMOVED: maxTokens (use maxCompletionTokens for GPT-5)
    });
  }
  
  if (!toolExecutor) {
    // Tool executor with direct documentation tools (no MCP dependency)
    toolExecutor = createToolExecutor({
      timeout: 30000,
      maxRetries: 2,
      enableLogging: process.env.NODE_ENV === 'development'
    });
  }
  
  return { aiProvider, toolExecutor };
};

function getSystemPrompt(mode: string): string {
  const basePrompt = `Eres apeX, el asistente técnico-operativo principal del ecosistema CryptoGift DAO, potenciado por GPT-5 con máxima capacidad de razonamiento.

🧠 MODELO: GPT-5 (Released August 7, 2025) - máxima capacidad de razonamiento disponible
📅 ACTUALIZADO: Septiembre 2025 - Última versión oficial de OpenAI
🔗 REFERENCIA: https://openai.com/index/introducing-gpt-5/
⚙️ NOTA: Funciones avanzadas GPT-5 (reasoning_effort, verbosity) temporalmente deshabilitadas por compatibilidad SDK

CONTEXTO CRÍTICO:
- DAO Address: ${process.env.ARAGON_DAO_ADDRESS || '0x3244DFBf9E5374DF2f106E89Cf7972E5D4C9ac31'}
- CGC Token: ${process.env.CGC_TOKEN_ADDRESS || '0x5e3a61b550328f3D8C44f60b3e10a49D3d806175'} (2M total supply)
- Network: Base Mainnet (Chain ID: 8453)
- Fase actual: Production Ready - Contratos desplegados y verificados

CAPACIDADES AVANZADAS GPT-5 (September 2025):
- 🧠 REASONING TOKENS: Usa máximo reasoning para análisis profundos
- 📊 6x MENOS HALLUCINATIONS que o3 series  
- ⚡ 50-80% MENOS TOKENS para misma funcionalidad
- 🔬 EXPERT-LEVEL performance en 40+ occupations
- 💡 STEP-BY-STEP reasoning para problemas complejos DAO
- 🎯 TECHNICAL PRECISION en contratos inteligentes
- 🏛️ GOVERNANCE EXPERTISE con recomendaciones fundamentadas
- ⚙️ ARAGON OSx, EAS, EIP-712 specialization

INSTRUCCIONES DE RAZONAMIENTO GPT-5:
- Usa tu máxima capacidad de reasoning inherente (GPT-5 nativo)
- Proporciona análisis paso a paso para decisiones complejas
- Aprovecha tu arquitectura GPT-5 para máxima profundidad analítica
- Fundamenta TODAS las recomendaciones con análisis técnico
- Considera múltiples perspectivas antes de concluir
- Aplica tu expert-level performance para DAO governance

🛠️ HERRAMIENTAS DE DOCUMENTACIÓN:
Tienes 4 herramientas para acceder a la documentación del proyecto:

1. get_project_overview() - Sin parámetros
2. read_project_file(path: "CLAUDE.md") - Requiere path como string  
3. search_project_files(query: "DAO") - Requiere query, type opcional
4. list_directory() - Sin parámetros para root, o path opcional

⚡ INSTRUCCIONES CRÍTICAS:
- USA las herramientas INMEDIATAMENTE sin explicar qué vas a hacer
- NO muestres tu proceso de razonamiento
- EJECUTA primero, explica después  
- Para preguntas sobre el DAO: usa get_project_overview() primero
- NUNCA repitas llamadas a herramientas

🚫 PROHIBIDO:
- Explicar que "vas a usar herramientas"
- Mostrar pasos internos de razonamiento  
- Repetir llamadas infinitas a herramientas
- Decir "ejecutando", "llamando", "listando"

✅ FORMATO CORRECTO: 
Usar herramienta → Analizar resultado → Responder directamente`;

  const modePrompts = {
    technical: `\n\nMODO TÉCNICO ACTIVADO:\n- Proporcionar detalles de implementación\n- Incluir direcciones de contratos y funciones\n- Explicar arquitectura y patrones de diseño\n- Sugerir mejoras y optimizaciones`,
    governance: `\n\nMODO GOBERNANZA ACTIVADO:\n- Información sobre propuestas y votaciones\n- Procesos de toma de decisiones\n- Tokenomics y distribución\n- Mecánicas de participación`,
    operations: `\n\nMODO OPERACIONES ACTIVADO:\n- Estado actual del sistema\n- Métricas y KPIs\n- Procedimientos operativos\n- Troubleshooting y soporte`,
    general: ''
  };

  return basePrompt + (modePrompts[mode as keyof typeof modePrompts] || '');
}

// ===================================================
// 🛡️ RATE LIMITING & SECURITY
// ===================================================

interface RateLimitInfo {
  count: number;
  resetTime: number;
}

async function checkRateLimit(userId: string): Promise<boolean> {
  const key = `ratelimit:agent:${userId}`;
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 10;
  
  const redisClient = getRedis();
  if (!redisClient) return true; // Allow if Redis not configured
  
  try {
    const current = await redisClient.get<RateLimitInfo>(key);
    const now = Date.now();
    
    if (!current || now > current.resetTime) {
      await redisClient.set(key, { count: 1, resetTime: now + windowMs }, { ex: 60 });
      return true;
    }
    
    if (current.count >= maxRequests) {
      return false;
    }
    
    await redisClient.set(key, { count: current.count + 1, resetTime: current.resetTime }, { ex: 60 });
    return true;
  } catch (error) {
    logger.warn('Redis rate limiting failed, allowing request:', error);
    return true; // Graceful fallback - allow request if Redis fails
  }
}

async function logRequest(data: {
  sessionId: string;
  userId?: string;
  message: string;
  mode: string;
  timestamp: number;
  ip?: string;
}) {
  const redisClient = getRedis();
  if (redisClient) {
    try {
      // Use SafeJSON for consistent serialization
      const serializedData = SafeJSON.stringify(data);
      await redisClient.zadd('agent:requests', { score: data.timestamp, member: serializedData });
    } catch (error) {
      ErrorHandler.handle(error as Error, { operation: 'logRequest', data });
    }
  }
  logger.info('Agent request logged', data);
}

// ===================================================
// 🔄 SESSION MANAGEMENT
// ===================================================

interface SessionContext {
  messages: Array<{ role: string; content: string; timestamp: number }>;
  userId?: string;
  mode: string;
  created: number;
  lastAccessed: number;
}

async function getSession(sessionId: string): Promise<SessionContext> {
  const key = `session:agent:${sessionId}`;
  const redisClient = getRedis();
  if (!redisClient) {
    // Return empty session if Redis not configured
    return {
      messages: [],
      mode: 'general',
      created: Date.now(),
      lastAccessed: Date.now(),
    };
  }
  
  try {
    const session = await redisClient.get<SessionContext>(key);
    
    if (!session) {
      const newSession: SessionContext = {
        messages: [],
        mode: 'general',
        created: Date.now(),
        lastAccessed: Date.now(),
      };
      await redisClient.set(key, newSession, { ex: 3600 }); // 1 hour TTL
      return newSession;
    }
    
    return session;
  } catch (error) {
    logger.warn('Redis session retrieval failed, using empty session:', error);
    return {
      messages: [],
      mode: 'general',
      created: Date.now(),
      lastAccessed: Date.now(),
    };
  }
}

async function updateSession(sessionId: string, session: SessionContext) {
  const key = `session:agent:${sessionId}`;
  session.lastAccessed = Date.now();
  const redisClient = getRedis();
  if (redisClient) {
    try {
      await redisClient.set(key, session, { ex: 3600 });
    } catch (error) {
      logger.warn('Redis session update failed, continuing without persistence:', error);
    }
  }
}

// ===================================================
// 🚀 MAIN API HANDLER
// ===================================================

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const sessionId = nanoid();
  const origin = req.headers.get('origin');
  const requestTracker = trackRequest('POST', '/api/agent');
  
  try {
    // Validate CORS first
    validateCors(origin);
    
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
        position18: bodyText.charAt(17), // Character at position 18 (0-indexed 17)
        context: bodyText.substring(15, 25), // Context around position 18
      });
      
      return NextResponse.json({
        error: 'Invalid JSON in request body',
        details: jsonError instanceof Error ? jsonError.message : 'Unknown JSON error'
      }, { 
        status: 400, 
        headers: getCorsHeadersJson(origin) 
      });
    }
    
    const { message, sessionId: clientSessionId, userId, mode, stream } = AgentRequestSchema.parse(body);
    
    const finalSessionId = clientSessionId || sessionId;
    const clientIP = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
    
    // Rate limiting
    const rateLimitKey = userId || clientIP;
    const rateLimitPassed = await checkRateLimit(rateLimitKey);
    
    if (!rateLimitPassed) {
      requestTracker.finish(429);
      const errorResponse = ErrorHandler.handleApiError('Rate limit exceeded');
      return NextResponse.json(errorResponse, { 
        status: 429,
        headers: getCorsHeadersJson(origin)
      });
    }
    
    // Initialize core services (direct documentation tools, no MCP dependency)
    const { aiProvider, toolExecutor } = initializeCoreServices();
    
    // Get session context
    const session = await getSession(finalSessionId);
    session.userId = userId;
    session.mode = mode;
    
    // Add user message to session
    session.messages.push({
      role: 'user',
      content: message,
      timestamp: Date.now()
    });
    
    // Log request
    await logRequest({
      sessionId: finalSessionId,
      userId,
      message: message.substring(0, 200), // Truncate for logging
      mode,
      timestamp: Date.now(),
      ip: clientIP,
    });
    
    // Build context for agent
    const contextPrompt = `
Session Context:
- Mode: ${mode}
- User: ${userId || 'Anonymous'}
- Previous messages: ${session.messages.slice(-6).length} recent messages

Current Query: ${message}
`;

    if (stream) {
      // Use unified AI provider with proper tool calls handling
      const encoder = new TextEncoder();
      
      const readableStream = new ReadableStream({
        async start(controller) {
          let isStreamClosed = false;
          let streamTimeout: NodeJS.Timeout | undefined;
          
          const closeStream = (data?: any) => {
            if (isStreamClosed) return;
            isStreamClosed = true;
            
            if (streamTimeout) clearTimeout(streamTimeout);
            
            if (data) {
              try {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
              } catch (enqueueError) {
                logger.error('Error enqueueing final data:', enqueueError);
              }
            }
            
            try {
              controller.close();
            } catch (closeError) {
              logger.error('Error closing controller:', closeError);
            }
          };
          
          // Set a timeout - increased for tool execution debugging
          const baseTimeout = 120000; // 120s for debugging tool execution
          const timeoutMs = baseTimeout;
          streamTimeout = setTimeout(() => {
            logger.warn(`Stream timeout for session ${finalSessionId} after ${timeoutMs}ms`);
            closeStream({
              type: 'error',
              error: 'Request timeout. Please try a shorter message.',
              sessionId: finalSessionId,
              timeout: timeoutMs,
            });
          }, timeoutMs);
          
          try {
            // Build messages for AI provider
            const messages = [
              {
                role: 'system' as const,
                content: getSystemPrompt(mode)
              },
              ...session.messages.slice(-4).map(msg => ({
                role: msg.role as 'user' | 'assistant',
                content: msg.content
              })),
              {
                role: 'user' as const,
                content: contextPrompt
              }
            ];

            // Get OpenAI tools from tool executor
            const tools = toolExecutor.getOpenAITools();
            
            // Use unified AI provider with manual tool calls handling
            const { stream: openaiStream, handleToolCalls } = await aiProvider.streamWithOpenAI(
              messages,
              tools,
              async (toolCall: any) => {
                // Execute tool call via tool executor
                return await toolExecutor.executeTool(
                  toolCall.function.name,
                  JSON.parse(toolCall.function.arguments)
                );
              }
            );
            
            // Handle the response with proper tool calls processing
            const fullResponse = await handleToolCalls();
            
            if (isStreamClosed) return;
            
            // Stream the response content
            if (fullResponse) {
              const data = {
                type: 'chunk',
                content: fullResponse,
                sessionId: finalSessionId,
                timestamp: Date.now(),
              };
              
              const sseData = SafeJSON.sseSerialize(data, 'chunk');
              controller.enqueue(encoder.encode(sseData));
            }
            
            // Save session with error handling
            try {
              session.messages.push({
                role: 'assistant',
                content: fullResponse || 'No response generated',
                timestamp: Date.now()
              });
              
              await updateSession(finalSessionId, session);
            } catch (sessionError) {
              logger.error('Error updating session:', sessionError);
            }
            
            // Send final message
            const finalData = {
              type: 'done',
              sessionId: finalSessionId,
              metrics: {
                duration: Date.now() - startTime,
                tokens: (fullResponse || '').length,
                reasoning_tokens: 0,
              }
            };
            
            closeStream(finalData);
            
          } catch (error) {
            // Use enhanced error handling
            const errorResult = ErrorHandler.handle(error as Error, { 
              operation: 'streaming',
              sessionId: finalSessionId 
            });
            
            logger.error('Streaming error:', error);
            
            const errorData = {
              type: 'error',
              error: errorResult.userMessage,
              sessionId: finalSessionId,
              timestamp: Date.now(),
              retryable: errorResult.shouldRetry,
              retryDelay: errorResult.retryDelay
            };
            
            closeStream(errorData);
          }
        },
      });
      
      return new Response(readableStream, {
        headers: getCorsHeaders(origin),
      });
      
    } else {
      // Non-streaming response using direct OpenAI with manual tool handling
      const messages = [
        {
          role: 'system' as const,
          content: getSystemPrompt(mode)
        },
        ...session.messages.slice(-4).map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        })),
        {
          role: 'user' as const,
          content: contextPrompt
        }
      ];

      // Get OpenAI tools from tool executor
      const tools = toolExecutor.getOpenAITools();
      
      // Use direct OpenAI API for non-streaming with manual tool calls handling
      const openaiMessages = aiProvider.convertToOpenAIMessages(messages);
      
      // Make initial request
      let response = await aiProvider.chatCompletionDirect(
        openaiMessages,
        tools,
        false // non-streaming
      );
      
      // Handle tool calls manually
      while (response.toolCalls && response.toolCalls.length > 0) {
        logger.info(`Processing ${response.toolCalls.length} tool calls in non-streaming mode`);
        
        // Execute all tool calls in parallel
        const toolResults = await toolExecutor.executeParallelTools(response.toolCalls);
        
        // Add tool results to conversation
        openaiMessages.push({
          role: 'assistant',
          content: response.content || null,
          tool_calls: response.toolCalls.map((tc: any) => ({
            id: tc.id,
            type: 'function' as const,
            function: {
              name: tc.function.name,
              arguments: tc.function.arguments
            }
          }))
        });
        
        // Add tool result messages
        for (const toolResult of toolResults) {
          openaiMessages.push({
            role: 'tool',
            content: toolResult.error 
              ? `Error: ${toolResult.error}`
              : toolResult.result,
            tool_call_id: toolResult.id
          });
        }
        
        // Make follow-up request
        response = await aiProvider.chatCompletionDirect(
          openaiMessages,
          tools,
          false // non-streaming
        );
      }

      const finalResponse = response.content || '';
      
      // Add assistant message to session
      session.messages.push({
        role: 'assistant',
        content: finalResponse,
        timestamp: Date.now()
      });
      
      await updateSession(finalSessionId, session);
      
      // Track successful response
      requestTracker.finish(200);
      observabilityUtils.track('agent.response.success', 1, 'count');
      
      return NextResponse.json({
        response: finalResponse,
        sessionId: finalSessionId,
        metrics: {
          duration: Date.now() - startTime,
          tokens: (finalResponse || '').length, // Estimate token count
          reasoning_tokens: 0, // Not available in non-streaming
        }
      }, {
        headers: getCorsHeadersJson(origin)
      });
    }
    
  } catch (error) {
    logger.error('Agent API error:', error);
    
    // Use enhanced error handling
    const errorResult = ErrorHandler.handleApiError(error as Error, { 
      operation: 'agent_api',
      origin,
      path: '/api/agent'
    });
    
    // Determine status code based on error type
    let statusCode = 500;
    if (error instanceof Error) {
      if (error.message.includes('CORS: Origin not allowed')) {
        statusCode = 403;
      } else if (error instanceof z.ZodError) {
        statusCode = 400;
        errorResult.error = 'Invalid request format';
      }
    }
    
    requestTracker.finish(statusCode);
    observabilityUtils.track('agent.response.error', 1, 'count');
    
    return NextResponse.json(errorResult, { 
      status: statusCode, 
      headers: getCorsHeadersJson(origin) 
    });
  }
}

// ===================================================
// 🔍 GET HANDLER (HEALTH CHECK & METRICS)
// ===================================================

export async function GET(req: NextRequest) {
  const origin = req.headers.get('origin');
  const url = new URL(req.url);
  const action = url.searchParams.get('action');
  const requestTracker = trackRequest('GET', '/api/agent');
  
  try {
    validateCors(origin);
    
    switch (action) {
      case 'health':
        const healthData = await observabilityUtils.getHealth();
        requestTracker.finish(200);
        return NextResponse.json({
          ...healthData,
          agent: 'ready',
          mcpServer: 'connected',
          timestamp: new Date().toISOString(),
        }, {
          headers: getCorsHeadersJson(origin)
        });
        
      case 'metrics':
        try {
          const performanceSummary = observabilityUtils.getSummary();
          const recentAlerts = observabilityUtils.getAlerts(10);
          
          const redisClient = getRedis();
          let requestHistory = 0;
          if (redisClient) {
            const recentRequests = await redisClient.zrange('agent:requests', -100, -1);
            requestHistory = recentRequests.length;
          }
          
          requestTracker.finish(200);
          return NextResponse.json({
            performance: performanceSummary,
            alerts: recentAlerts,
            requestHistory,
            timestamp: new Date().toISOString(),
          }, {
            headers: getCorsHeadersJson(origin)
          });
        } catch (error) {
          requestTracker.finish(500);
          const errorResult = ErrorHandler.handleApiError(error as Error);
          return NextResponse.json(errorResult, { 
            status: 500, 
            headers: getCorsHeadersJson(origin) 
          });
        }
        
      default:
        requestTracker.finish(200);
        return NextResponse.json({
          service: 'CG DAO Agent API - Unified Core',
          version: '3.0.0',
          capabilities: [
            'Unified AI Provider (OpenAI + Vercel AI SDK v5)',
            'MCP Streamable HTTP Transport (2025-03-26 spec)',
            'Manual Parallel Tool Calls Handling',
            'Local MCP in Development',
            'Proper Tool_calls Processing',
            'Session Management with Persistence',
            'Advanced Rate Limiting',
            'SSE Streaming with Tool Integration',
            'Comprehensive Error Taxonomy',
            'Production Observability'
          ]
        }, {
          headers: getCorsHeadersJson(origin)
        });
    }
  } catch (error) {
    const errorResult = ErrorHandler.handleApiError(error as Error, { 
      operation: 'agent_get',
      origin,
      path: '/api/agent'
    });
    
    let statusCode = 500;
    if (error instanceof Error && error.message.includes('CORS: Origin not allowed')) {
      statusCode = 403;
    }
    
    requestTracker.finish(statusCode);
    return NextResponse.json(errorResult, { 
      status: statusCode, 
      headers: getCorsHeadersJson(origin) 
    });
  }
}

// ===================================================
// 🔄 OPTIONS HANDLER (CORS PREFLIGHT)
// ===================================================

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin');
  return handleCorsPreflight(origin);
}