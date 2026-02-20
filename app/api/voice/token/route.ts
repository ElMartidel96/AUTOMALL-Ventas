/**
 * 🎤 REALTIME VOICE API - Token Efímero
 * 
 * Genera tokens temporales para que el cliente se conecte
 * directamente a OpenAI Realtime API sin exponer la API key
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema
const TokenRequestSchema = z.object({
  userId: z.string().optional(),
  sessionId: z.string().optional(),
});

// ===================================================
// 🔐 GENERATE EPHEMERAL TOKEN
// ===================================================

async function generateEphemeralToken(userId?: string) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }
  
  try {
    // Crear sesión efímera con OpenAI Realtime API
    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-realtime', // Modelo más avanzado de voz
        voice: 'cedar', // Nueva voz 2025
        instructions: `Eres el asistente de voz del CryptoGift DAO.
        
        CONTEXTO:
        - DAO Address: ${process.env.ARAGON_DAO_ADDRESS || '0x3244DFBf9E5374DF2f106E89Cf7972E5D4C9ac31'}
        - CGC Token: ${process.env.CGC_TOKEN_ADDRESS || '0x5e3a61b550328f3D8C44f60b3e10a49D3d806175'}
        - Network: Base Mainnet
        
        COMPORTAMIENTO:
        - Responde de forma natural y conversacional
        - Sé conciso pero informativo
        - Usa un tono profesional pero amigable
        - Si no entiendes algo, pide clarificación
        - Puedes cambiar entre idiomas si el usuario lo hace`,
        
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        turn_detection: {
          type: 'server_vad', // Voice Activity Detection del servidor
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500,
        },
        tools: [
          {
            type: 'function',
            name: 'search_documentation',
            description: 'Search DAO documentation',
            parameters: {
              type: 'object',
              properties: {
                query: { type: 'string' }
              }
            }
          },
          {
            type: 'function', 
            name: 'get_contract_info',
            description: 'Get information about a smart contract',
            parameters: {
              type: 'object',
              properties: {
                address: { type: 'string' }
              }
            }
          }
        ],
        max_output_tokens: 4096,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI Realtime API error:', error);
      throw new Error('Failed to create realtime session');
    }
    
    const session = await response.json();
    
    // Retornar token efímero y configuración de conexión
    return {
      token: session.client_token, // Token temporal para el cliente
      sessionId: session.id,
      expiresIn: 3600, // 1 hora
      websocketUrl: `wss://api.openai.com/v1/realtime?session_id=${session.id}`,
      model: 'gpt-realtime',
      voice: 'cedar',
    };
    
  } catch (error) {
    console.error('Error generating ephemeral token:', error);
    throw error;
  }
}

// ===================================================
// 🚀 API HANDLER
// ===================================================

export async function POST(req: NextRequest) {
  try {
    // 🔐 Basic rate limiting and origin validation
    const origin = req.headers.get('origin');
    const referer = req.headers.get('referer');
    
    // Only allow requests from our domains in production
    if (process.env.NODE_ENV === 'production') {
      const allowedDomains = [
        'crypto-gift-wallets-dao.vercel.app',
        'cryptogift-wallets-dao.vercel.app',
        'localhost:3000'
      ];
      
      const isValidOrigin = allowedDomains.some(domain => 
        origin?.includes(domain) || referer?.includes(domain)
      );
      
      if (!isValidOrigin) {
        return NextResponse.json(
          { error: 'Unauthorized origin' },
          { status: 403 }
        );
      }
    }
    
    const body = await req.json();
    const { userId, sessionId } = TokenRequestSchema.parse(body);
    
    // Rate limiting: max 5 requests per minute per IP
    // TODO: Implementar rate limiting con Upstash
    
    // Generate ephemeral token
    const tokenData = await generateEphemeralToken(userId);
    
    // Log for monitoring
    console.log('[Voice Token] Generated token for user:', userId || 'anonymous');
    
    return NextResponse.json({
      success: true,
      ...tokenData,
      instructions: {
        connect: 'Use the WebSocket URL with the token to establish connection',
        audio: 'Send PCM16 audio chunks, receive PCM16 audio responses',
        tools: 'Tools will be executed server-side and results returned in conversation',
      }
    });
    
  } catch (error) {
    console.error('Voice token API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request format', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to generate voice session token' },
      { status: 500 }
    );
  }
}

// ===================================================
// 🔍 GET HANDLER (INFO)
// ===================================================

export async function GET() {
  return NextResponse.json({
    service: 'CG DAO Realtime Voice API',
    version: '1.0.0',
    model: 'gpt-realtime',
    capabilities: [
      'Voice-to-voice conversation',
      'Real-time streaming',
      'Tool calling support',
      'Multi-language',
      'Voice Activity Detection',
    ],
    instructions: 'POST to this endpoint to get an ephemeral token for WebSocket connection',
  });
}