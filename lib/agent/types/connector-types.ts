/**
 * AI Agent Connector Types
 *
 * Type definitions for the AutoMALL AI Agent Connector system.
 * Supports 3 connection modes: Platform Chat, MCP Gateway, OpenAPI Actions.
 */

import { z } from 'zod'

// ===================================================
// USER ROLES
// ===================================================

export type UserRole = 'buyer' | 'seller' | 'birddog' | 'admin'

export type ToolPermission = 'read' | 'write' | 'admin'

export type ConnectionMode = 'platform' | 'mcp' | 'openapi'

// ===================================================
// TOOL DEFINITIONS
// ===================================================

export interface AgentTool<TInput = any, TOutput = any> {
  name: string
  description: string
  category: string
  inputSchema: z.ZodType<TInput>
  permission: ToolPermission
  roles: UserRole[]
  handler: (input: TInput, context: ToolContext) => Promise<TOutput>
}

export interface ToolContext {
  walletAddress: string
  role: UserRole
  apiKeyId?: string
  connectionMode: ConnectionMode
  aiProvider?: string
}

export interface ToolResult {
  success: boolean
  data?: any
  error?: string
  duration_ms: number
}

// ===================================================
// API KEYS
// ===================================================

export interface AgentApiKey {
  id: string
  wallet_address: string
  key_prefix: string
  name: string
  scopes: string[]
  is_active: boolean
  last_used_at: string | null
  usage_count: number
  rate_limit: number
  expires_at: string | null
  created_at: string
  updated_at: string
}

export interface CreateApiKeyRequest {
  name: string
  scopes?: string[]
  rate_limit?: number
  expires_in_days?: number
}

export interface CreateApiKeyResponse {
  key: string // Full key — shown ONCE
  api_key: AgentApiKey
}

// ===================================================
// AUDIT LOG
// ===================================================

export interface AuditLogEntry {
  id: string
  wallet_address: string
  api_key_id: string | null
  tool_name: string
  tool_input: any
  tool_output: any
  connection_mode: ConnectionMode
  ai_provider: string | null
  duration_ms: number | null
  success: boolean
  error_message: string | null
  ip_address: string | null
  created_at: string
}

// ===================================================
// MCP PROTOCOL
// ===================================================

export interface JsonRpcRequest {
  jsonrpc: '2.0'
  id?: string | number
  method: string
  params?: any
}

export interface JsonRpcResponse {
  jsonrpc: '2.0'
  id?: string | number
  result?: any
  error?: JsonRpcError
}

export interface JsonRpcError {
  code: number
  message: string
  data?: any
}

export interface McpToolDefinition {
  name: string
  description: string
  inputSchema: {
    type: 'object'
    properties: Record<string, any>
    required?: string[]
  }
}

export interface McpSession {
  id: string
  walletAddress: string
  role: UserRole
  apiKeyId: string
  createdAt: number
  lastAccessedAt: number
}

// ===================================================
// CHAT
// ===================================================

export interface AgentChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface AgentChatRequest {
  messages: AgentChatMessage[]
  sessionId?: string
}

// ===================================================
// ZOD SCHEMAS (for runtime validation)
// ===================================================

export const CreateApiKeySchema = z.object({
  name: z.string().min(1).max(100),
  scopes: z.array(z.enum(['read', 'write', 'admin'])).optional().default(['read']),
  rate_limit: z.number().int().min(10).max(10000).optional().default(100),
  expires_in_days: z.number().int().min(1).max(365).optional(),
})

export const AgentChatRequestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string().min(1).max(8000),
  })).min(1).max(50),
  sessionId: z.string().optional(),
})
