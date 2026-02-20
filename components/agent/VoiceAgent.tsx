/**
 * 🎤 VOICE AGENT COMPONENT
 * Conexión directa browser → OpenAI Realtime API
 * Usa token efímero para seguridad
 */

'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Phone, PhoneOff, Volume2, Loader2 } from 'lucide-react';

interface VoiceAgentProps {
  userId?: string;
  onTranscript?: (text: string, role: 'user' | 'assistant') => void;
  onToolCall?: (tool: string, args: any) => void;
}

export function VoiceAgent({ userId, onTranscript, onToolCall }: VoiceAgentProps) {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const audioQueueRef = useRef<Float32Array[]>([]);
  const isPlayingRef = useRef(false);
  
  // ===================================================
  // 🔐 GET EPHEMERAL TOKEN
  // ===================================================
  
  const getEphemeralToken = async () => {
    try {
      const response = await fetch('/api/voice/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get voice token');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Token error:', error);
      throw error;
    }
  };
  
  // ===================================================
  // 🎤 AUDIO PROCESSING
  // ===================================================
  
  const startAudioCapture = async () => {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 24000,
          echoCancellation: true,
          noiseSuppression: true,
        }
      });
      
      mediaStreamRef.current = stream;
      
      // Create audio context
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000,
      });
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      const processor = audioContextRef.current.createScriptProcessor(2048, 1, 1);
      
      processor.onaudioprocess = (e) => {
        if (!isRecording || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
          return;
        }
        
        const inputData = e.inputBuffer.getChannelData(0);
        
        // Convert Float32 to PCM16
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const sample = inputData[i] ?? 0;
          const s = Math.max(-1, Math.min(1, sample));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        
        // Send audio to WebSocket
        wsRef.current.send(JSON.stringify({
          type: 'input_audio_buffer.append',
          audio: btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(pcm16.buffer)) as any)),
        }));
      };
      
      source.connect(processor);
      processor.connect(audioContextRef.current.destination);
      processorRef.current = processor;
      
    } catch (error) {
      console.error('Audio capture error:', error);
      throw error;
    }
  };
  
  const playAudioChunk = async (audioData: string) => {
    if (!audioContextRef.current) return;
    
    try {
      // Decode base64 audio
      const binaryString = atob(audioData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Convert PCM16 to Float32
      const pcm16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(pcm16.length);
      for (let i = 0; i < pcm16.length; i++) {
        float32[i] = (pcm16[i] ?? 0) / 0x8000;
      }
      
      // Queue audio for playback
      audioQueueRef.current.push(float32);
      
      if (!isPlayingRef.current) {
        playNextInQueue();
      }
      
    } catch (error) {
      console.error('Audio playback error:', error);
    }
  };
  
  const playNextInQueue = async () => {
    if (audioQueueRef.current.length === 0 || !audioContextRef.current) {
      isPlayingRef.current = false;
      setIsSpeaking(false);
      return;
    }
    
    isPlayingRef.current = true;
    setIsSpeaking(true);
    
    const audioData = audioQueueRef.current.shift()!;
    const buffer = audioContextRef.current.createBuffer(1, audioData.length, 24000);
    buffer.copyToChannel(new Float32Array(audioData.buffer as ArrayBuffer), 0);
    
    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);
    
    source.onended = () => {
      playNextInQueue();
    };
    
    source.start();
  };
  
  // ===================================================
  // 🔌 WEBSOCKET CONNECTION
  // ===================================================
  
  const connect = async () => {
    try {
      setStatus('connecting');
      setError(null);
      
      // Get ephemeral token
      const tokenData = await getEphemeralToken();
      console.log('Got token:', tokenData);
      
      // Start audio capture
      await startAudioCapture();
      
      // Connect to OpenAI Realtime WebSocket
      const ws = new WebSocket(tokenData.websocketUrl);
      wsRef.current = ws;
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        setStatus('connected');
        
        // Send initial configuration
        ws.send(JSON.stringify({
          type: 'session.update',
          session: {
            modalities: ['text', 'audio'],
            instructions: 'Eres el asistente de voz del CryptoGift DAO. Responde en español de forma natural.',
            voice: 'cedar',
            input_audio_format: 'pcm16',
            output_audio_format: 'pcm16',
            input_audio_transcription: { model: 'whisper-1' },
            turn_detection: {
              type: 'server_vad',
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 500,
            },
          },
        }));
      };
      
      ws.onmessage = async (event) => {
        const message = JSON.parse(event.data);
        
        switch (message.type) {
          case 'response.audio.delta':
            // Play audio chunk
            if (message.delta) {
              await playAudioChunk(message.delta);
            }
            break;
            
          case 'response.audio_transcript.done':
            // Assistant transcript
            if (message.transcript) {
              onTranscript?.(message.transcript, 'assistant');
            }
            break;
            
          case 'conversation.item.input_audio_transcription.completed':
            // User transcript
            if (message.transcript) {
              onTranscript?.(message.transcript, 'user');
            }
            break;
            
          case 'response.function_call_arguments.done':
            // Tool call
            if (message.name && message.arguments) {
              onToolCall?.(message.name, JSON.parse(message.arguments));
            }
            break;
            
          case 'error':
            console.error('WebSocket error:', message);
            setError(message.error?.message || 'Unknown error');
            break;
            
          default:
            console.log('WebSocket message:', message.type);
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('Connection error');
        setStatus('error');
      };
      
      ws.onclose = () => {
        console.log('WebSocket closed');
        setStatus('idle');
        cleanup();
      };
      
    } catch (error) {
      console.error('Connection error:', error);
      setError(error instanceof Error ? error.message : 'Connection failed');
      setStatus('error');
      cleanup();
    }
  };
  
  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    cleanup();
    setStatus('idle');
  };
  
  const cleanup = () => {
    // Stop audio
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    setIsRecording(false);
    setIsSpeaking(false);
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);
  
  // ===================================================
  // 🎨 RENDER
  // ===================================================
  
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>🎤 Voice Assistant</span>
          <div className="flex gap-2">
            {status === 'connected' && (
              <>
                {isRecording && <Badge variant="destructive">Recording</Badge>}
                {isSpeaking && <Badge variant="secondary">Speaking</Badge>}
              </>
            )}
            <Badge variant={
              status === 'connected' ? 'default' : 
              status === 'connecting' ? 'secondary' : 
              status === 'error' ? 'destructive' : 'outline'
            }>
              {status}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Connection Button */}
        {status === 'idle' && (
          <Button 
            onClick={connect} 
            className="w-full" 
            size="lg"
          >
            <Phone className="mr-2 h-5 w-5" />
            Conectar Asistente de Voz
          </Button>
        )}
        
        {/* Connecting */}
        {status === 'connecting' && (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p>Conectando con asistente de voz...</p>
          </div>
        )}
        
        {/* Connected */}
        {status === 'connected' && (
          <div className="space-y-4">
            <div className="text-center py-8">
              <div className="relative inline-block">
                {isSpeaking ? (
                  <Volume2 className="h-16 w-16 text-green-500 animate-pulse" />
                ) : isRecording ? (
                  <Mic className="h-16 w-16 text-red-500 animate-pulse" />
                ) : (
                  <Mic className="h-16 w-16 text-gray-400" />
                )}
              </div>
              <p className="mt-4 text-sm text-gray-600">
                {isSpeaking ? 'Asistente hablando...' : 
                 isRecording ? 'Escuchando...' : 
                 'Habla para comenzar'}
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant={isRecording ? "destructive" : "default"}
                onClick={() => setIsRecording(!isRecording)}
                className="flex-1"
              >
                {isRecording ? (
                  <>
                    <MicOff className="mr-2 h-4 w-4" />
                    Pausar
                  </>
                ) : (
                  <>
                    <Mic className="mr-2 h-4 w-4" />
                    Hablar
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={disconnect}
              >
                <PhoneOff className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        
        {/* Error */}
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}
        
        {/* Info */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Modelo: gpt-realtime (más avanzado)</p>
          <p>• Voz: Cedar (nueva 2025)</p>
          <p>• Idiomas: Español, English, y más</p>
          <p>• Conexión directa browser → OpenAI</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default VoiceAgent;