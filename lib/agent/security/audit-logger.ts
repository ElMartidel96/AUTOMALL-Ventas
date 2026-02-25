/**
 * Audit Logger — Log all AI Agent tool executions
 *
 * Every tool call is recorded in the agent_audit_log table
 * for security auditing and usage analytics.
 */

import { supabaseAdmin } from '@/lib/supabase/client'
import type { ConnectionMode, ToolContext, ToolResult } from '../types/connector-types'

interface AuditEntry {
  wallet_address: string
  api_key_id?: string
  tool_name: string
  tool_input: any
  tool_output: any
  connection_mode: ConnectionMode
  ai_provider?: string
  duration_ms: number
  success: boolean
  error_message?: string
  ip_address?: string
}

/**
 * Log a tool execution to the audit table.
 * Fire-and-forget — errors are logged but don't block the caller.
 */
export async function logToolExecution(entry: AuditEntry): Promise<void> {
  if (!supabaseAdmin) return

  try {
    await supabaseAdmin.from('agent_audit_log').insert({
      wallet_address: entry.wallet_address,
      api_key_id: entry.api_key_id || null,
      tool_name: entry.tool_name,
      tool_input: entry.tool_input,
      tool_output: truncateOutput(entry.tool_output),
      connection_mode: entry.connection_mode,
      ai_provider: entry.ai_provider || null,
      duration_ms: entry.duration_ms,
      success: entry.success,
      error_message: entry.error_message || null,
      ip_address: entry.ip_address || null,
    })
  } catch (err) {
    console.error('[AuditLogger] Failed to log:', err)
  }
}

/**
 * Execute a tool with automatic audit logging.
 */
export async function executeToolWithAudit(
  toolName: string,
  handler: (input: any, ctx: ToolContext) => Promise<any>,
  input: any,
  context: ToolContext,
  ipAddress?: string
): Promise<ToolResult> {
  const start = Date.now()

  try {
    const data = await handler(input, context)
    const duration = Date.now() - start

    // Log success (fire & forget)
    logToolExecution({
      wallet_address: context.walletAddress,
      api_key_id: context.apiKeyId,
      tool_name: toolName,
      tool_input: input,
      tool_output: data,
      connection_mode: context.connectionMode,
      ai_provider: context.aiProvider,
      duration_ms: duration,
      success: true,
      ip_address: ipAddress,
    })

    return { success: true, data, duration_ms: duration }
  } catch (err: any) {
    const duration = Date.now() - start

    // Log failure (fire & forget)
    logToolExecution({
      wallet_address: context.walletAddress,
      api_key_id: context.apiKeyId,
      tool_name: toolName,
      tool_input: input,
      tool_output: null,
      connection_mode: context.connectionMode,
      ai_provider: context.aiProvider,
      duration_ms: duration,
      success: false,
      error_message: err.message,
      ip_address: ipAddress,
    })

    return { success: false, error: err.message, duration_ms: duration }
  }
}

/**
 * Truncate large outputs to avoid bloating the audit log.
 */
function truncateOutput(output: any): any {
  if (!output) return null
  const str = JSON.stringify(output)
  if (str.length <= 10000) return output
  return { _truncated: true, preview: str.slice(0, 5000) + '...' }
}
