/**
 * MCP Client - Streamable HTTP Transport (2025-03-26 spec)
 * 
 * Implements Model Context Protocol with modern transport layer:
 * - Single /mcp endpoint for all requests
 * - Session ID via Mcp-Session-Id header
 * - JSON/SSE responses based on client needs
 * - Roots Protocol for filesystem access
 * - Proper error handling with stderr logging
 */

import { NextRequest } from 'next/server';

// ===================================================
// 📋 TYPES - MCP 2025 Spec
// ===================================================

export interface MCPRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: Record<string, any>;
}

export interface MCPResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: any;
  error?: MCPError;
}

export interface MCPError {
  code: number;
  message: string;
  data?: any;
}

export interface MCPSession {
  id: string;
  created: number;
  lastAccessed: number;
  tools?: Array<{
    name: string;
    description: string;
    inputSchema: Record<string, any>;
  }>;
  roots?: string[];
}

export interface MCPClientOptions {
  baseUrl?: string;
  authToken?: string;
  timeout?: number;
  sessionId?: string;
  enableLogging?: boolean;
}

// ===================================================
// 📊 MCP CLIENT CLASS
// ===================================================

export class MCPClient {
  private baseUrl: string;
  private authToken: string;
  private timeout: number;
  private sessionId: string;
  private enableLogging: boolean;

  constructor(options: MCPClientOptions = {}) {
    // Environment-based URL routing
    // Dev: use local endpoint, Prod: use internal URL
    const isDev = process.env.NODE_ENV === 'development';
    this.baseUrl = options.baseUrl || 
      (isDev ? 'http://localhost:3000' : process.env.NEXT_PUBLIC_DAO_URL || '');
    
    this.authToken = options.authToken || process.env.MCP_AUTH_TOKEN || 'internal';
    this.timeout = options.timeout || 30000;
    this.sessionId = options.sessionId || this.generateSessionId();
    this.enableLogging = options.enableLogging ?? (process.env.NODE_ENV === 'development');
  }

  // ===================================================
  // 🔧 CORE METHODS
  // ===================================================

  /**
   * Generate session ID following MCP 2025 spec
   */
  private generateSessionId(): string {
    return `mcp-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Safe logging that respects MCP protocol
   * CRITICAL: Never log to stdout in STDIO-based servers
   */
  private log(level: 'info' | 'warn' | 'error', message: string, data?: any): void {
    if (!this.enableLogging) return;
    
    const logData = data ? ` ${JSON.stringify(data)}` : '';
    const logMessage = `[MCP-CLIENT:${level.toUpperCase()}] ${message}${logData}`;
    
    // Always log to stderr to avoid corrupting JSON-RPC stream
    console.error(logMessage);
  }

  /**
   * Make MCP request using Streamable HTTP Transport
   */
  private async makeRequest(method: string, params?: Record<string, any>): Promise<any> {
    const requestId = Date.now().toString();
    const mcpRequest: MCPRequest = {
      jsonrpc: '2.0',
      id: requestId,
      method,
      params: params || {}
    };

    const url = `${this.baseUrl}/api/mcp-docs`;
    
    this.log('info', `MCP request: ${method}`, { url, sessionId: this.sessionId });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`,
          'Mcp-Session-Id': this.sessionId, // 2025 spec session management
        },
        body: JSON.stringify(mcpRequest),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`MCP HTTP error: ${response.status} ${response.statusText}`);
      }

      const mcpResponse: MCPResponse = await response.json();

      if (mcpResponse.error) {
        throw new Error(`MCP error: ${mcpResponse.error.message} (code: ${mcpResponse.error.code})`);
      }

      this.log('info', `MCP response: ${method}`, { success: true });
      return mcpResponse.result;

    } catch (error) {
      this.log('error', `MCP request failed: ${method}`, { 
        error: error instanceof Error ? error.message : 'Unknown error',
        url,
        sessionId: this.sessionId
      });
      throw error;
    }
  }

  // ===================================================
  // 🛠️ MCP PROTOCOL METHODS
  // ===================================================

  /**
   * Initialize MCP session and get available tools
   */
  async initialize(): Promise<MCPSession> {
    try {
      // Get server info
      const serverInfo = await this.makeRequest('initialize', {
        protocolVersion: '2025-03-26',
        capabilities: {
          roots: { listChanged: true },
          sampling: {}
        },
        clientInfo: {
          name: 'CG-DAO-Agent',
          version: '1.0.0'
        }
      });

      // List available tools
      const toolsResult = await this.listTools();
      
      const session: MCPSession = {
        id: this.sessionId,
        created: Date.now(),
        lastAccessed: Date.now(),
        tools: toolsResult,
        roots: await this.getRoots()
      };

      this.log('info', 'MCP session initialized', { sessionId: this.sessionId, toolsCount: toolsResult.length });
      return session;

    } catch (error) {
      this.log('error', 'Failed to initialize MCP session', { error });
      throw new Error(`MCP initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * List available tools from MCP server
   */
  async listTools(): Promise<Array<{ name: string; description: string; inputSchema: Record<string, any> }>> {
    try {
      const result = await this.makeRequest('tools/list');
      return result.tools || [];
    } catch (error) {
      this.log('error', 'Failed to list MCP tools', { error });
      return [];
    }
  }

  /**
   * Get filesystem roots (2025 Roots Protocol)
   */
  async getRoots(): Promise<string[]> {
    try {
      const result = await this.makeRequest('roots/list');
      return result.roots?.map((root: any) => root.uri || root) || [];
    } catch (error) {
      this.log('warn', 'Failed to get MCP roots, using fallback', { error });
      return ['/'];
    }
  }

  /**
   * Call a specific MCP tool
   */
  async callTool(name: string, arguments_: Record<string, any>): Promise<string> {
    try {
      this.log('info', `Calling MCP tool: ${name}`, { arguments: arguments_ });
      
      const result = await this.makeRequest('tools/call', {
        name,
        arguments: arguments_
      });

      // Extract text content from MCP response
      if (result?.content) {
        if (Array.isArray(result.content)) {
          return result.content.map((item: any) => {
            // Type-safe MCP content handling
            if (typeof item === 'string') return item;
            if (item && typeof item === 'object') {
              return item.text || item.content || '[MCP Content]';
            }
            return '';
          }).join('\n');
        } else if (typeof result.content === 'string') {
          return result.content;
        } else if (result.content.text) {
          return result.content.text;
        }
      }

      return result?.text || JSON.stringify(result) || 'No content returned';

    } catch (error) {
      const errorMessage = `MCP tool call failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.log('error', errorMessage, { tool: name, arguments: arguments_ });
      return errorMessage;
    }
  }

  /**
   * Read file via MCP
   */
  async readFile(path: string): Promise<string> {
    return this.callTool('read_file', { path });
  }

  /**
   * Search files via MCP
   */
  async searchFiles(query: string, type?: 'contracts' | 'docs' | 'governance'): Promise<string> {
    return this.callTool('search_files', { query, type });
  }

  /**
   * Get project structure via MCP
   */
  async getProjectStructure(): Promise<string> {
    return this.callTool('get_project_structure', {});
  }

  // ===================================================
  // 🧹 SESSION MANAGEMENT
  // ===================================================

  /**
   * Update session last accessed time
   */
  updateLastAccessed(): void {
    // Session management handled by server-side via Mcp-Session-Id header
    this.log('info', 'Session accessed', { sessionId: this.sessionId });
  }

  /**
   * Clean up session (send DELETE request)
   */
  async cleanup(): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/api/mcp-docs`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Mcp-Session-Id': this.sessionId,
        }
      });
      this.log('info', 'MCP session cleaned up', { sessionId: this.sessionId });
    } catch (error) {
      this.log('warn', 'Failed to cleanup MCP session', { error });
    }
  }
}

// ===================================================
// 🏗️ FACTORY FUNCTIONS
// ===================================================

/**
 * Create MCP client with environment-based configuration
 */
export function createMCPClient(options: Partial<MCPClientOptions> = {}): MCPClient {
  return new MCPClient({
    enableLogging: process.env.NODE_ENV === 'development',
    ...options
  });
}

/**
 * Create MCP client for Next.js API route context
 */
export function createMCPClientFromRequest(req: NextRequest, options: Partial<MCPClientOptions> = {}): MCPClient {
  // Use internal URL for server-to-server calls in production
  const baseUrl = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3000'
    : new URL('/api/mcp-docs', req.url).origin;

  return new MCPClient({
    baseUrl,
    sessionId: req.headers.get('x-session-id') || undefined,
    ...options
  });
}