#!/usr/bin/env node
/**
 * 🤖 CG DAO OPS AGENT
 * Main agent implementation with OpenAI SDK + MCP Filesystem (read-only)
 * 
 * This agent provides intelligent assistance for CryptoGift DAO operations
 * with real-time access to local documentation and project files.
 */

import OpenAI from 'openai';
import { spawn } from 'child_process';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import { existsSync, mkdirSync } from 'fs';
import chalk from 'chalk';
import ora from 'ora';
import winston from 'winston';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(dirname(__dirname), '.env') });

// ===================================================
// 📋 CONFIGURATION
// ===================================================

const CONFIG = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.AGENT_MODEL || 'gpt-4o-mini',
    temperature: parseFloat(process.env.TEMPERATURE || '0.7'),
    maxTokens: parseInt(process.env.MAX_CONTEXT_LENGTH || '128000'),
  },
  paths: {
    docsDir: process.env.DOCS_DIR || resolve(dirname(dirname(__dirname))),
    additionalDirs: process.env.ADDITIONAL_DIRS?.split(',').filter(Boolean) || [],
    logsDir: join(dirname(__dirname), 'logs'),
  },
  mcp: {
    timeout: parseInt(process.env.MCP_SERVER_TIMEOUT || '30000'),
    cacheTools: process.env.MCP_CACHE_TOOLS === 'true',
    maxFileSize: parseInt(process.env.MCP_MAX_FILE_SIZE || '10485760'),
  },
  security: {
    writeProtection: process.env.ENABLE_WRITE_PROTECTION !== 'false',
    auditLog: process.env.ENABLE_AUDIT_LOG === 'true',
  },
  agent: {
    name: process.env.AGENT_NAME || 'CG DAO OPS Agent',
    version: process.env.AGENT_VERSION || '1.0.0',
  },
  contracts: {
    cgcToken: process.env.CGC_TOKEN_ADDRESS,
    masterController: process.env.MASTER_CONTROLLER_ADDRESS,
    taskRules: process.env.TASK_RULES_ADDRESS,
    milestoneEscrow: process.env.MILESTONE_ESCROW_ADDRESS,
    aragonDao: process.env.ARAGON_DAO_ADDRESS,
  },
  debug: process.env.DEBUG_MODE === 'true',
};

// ===================================================
// 🔧 LOGGER SETUP
// ===================================================

// Ensure logs directory exists
if (!existsSync(CONFIG.paths.logsDir)) {
  mkdirSync(CONFIG.paths.logsDir, { recursive: true });
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: join(CONFIG.paths.logsDir, 'error.log'), 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: join(CONFIG.paths.logsDir, 'agent.log') 
    }),
  ],
});

// Add console transport in non-production
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// ===================================================
// 🛡️ MCP SERVER IMPLEMENTATION
// ===================================================

class MCPFilesystemServer {
  constructor(allowedDirs, options = {}) {
    this.allowedDirs = allowedDirs;
    this.options = {
      readOnly: options.readOnly ?? true,
      cacheTools: options.cacheTools ?? true,
      timeout: options.timeout ?? 30000,
      ...options
    };
    this.process = null;
    this.tools = null;
    this.isConnected = false;
  }

  /**
   * Start the MCP filesystem server with read-only restrictions
   */
  async connect() {
    const spinner = ora('Starting MCP Filesystem Server...').start();
    
    try {
      // Build command with allowed directories
      const args = [
        '-y',
        '@modelcontextprotocol/server-filesystem',
        ...this.allowedDirs
      ];

      // Spawn the MCP server process
      this.process = spawn('npx', args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true,
        env: {
          ...process.env,
          MCP_READ_ONLY: 'true', // Hint to server (if supported)
        }
      });

      // Handle process events
      this.process.on('error', (error) => {
        logger.error('MCP Server error:', error);
        spinner.fail('Failed to start MCP Server');
      });

      this.process.stderr.on('data', (data) => {
        if (CONFIG.debug) {
          console.error(chalk.yellow(`MCP stderr: ${data}`));
        }
        logger.debug('MCP stderr:', data.toString());
      });

      // Wait for server to be ready
      await this.waitForReady();
      
      // Discover available tools
      await this.discoverTools();
      
      this.isConnected = true;
      spinner.succeed('MCP Filesystem Server connected');
      
      if (CONFIG.debug) {
        console.log(chalk.gray('Available tools:', this.getAvailableTools()));
      }
      
    } catch (error) {
      spinner.fail('Failed to connect MCP Server');
      throw error;
    }
  }

  /**
   * Wait for server to be ready
   */
  async waitForReady() {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('MCP Server startup timeout'));
      }, this.options.timeout);

      const checkReady = () => {
        // Send a test command to check if server is ready
        this.sendCommand({ method: 'initialize' })
          .then(() => {
            clearTimeout(timeout);
            resolve();
          })
          .catch(() => {
            setTimeout(checkReady, 500);
          });
      };

      checkReady();
    });
  }

  /**
   * Discover available tools from the MCP server
   */
  async discoverTools() {
    const response = await this.sendCommand({ method: 'tools/list' });
    
    if (CONFIG.security.writeProtection) {
      // Filter out write operations
      const readOnlyTools = [
        'read_file',
        'read_multiple_files',
        'list_directory',
        'search_files',
        'get_file_info',
        'list_allowed_directories'
      ];
      
      this.tools = response.tools?.filter(tool => 
        readOnlyTools.includes(tool.name)
      ) || [];
    } else {
      this.tools = response.tools || [];
    }
    
    if (this.options.cacheTools) {
      logger.info('Cached MCP tools:', this.tools.map(t => t.name));
    }
  }

  /**
   * Send command to MCP server via stdio
   */
  async sendCommand(command) {
    return new Promise((resolve, reject) => {
      if (!this.process) {
        reject(new Error('MCP Server not connected'));
        return;
      }

      const id = Date.now();
      const message = JSON.stringify({ ...command, id }) + '\n';

      // Set up response listener
      const responseHandler = (data) => {
        try {
          const lines = data.toString().split('\n').filter(Boolean);
          for (const line of lines) {
            const response = JSON.parse(line);
            if (response.id === id) {
              this.process.stdout.removeListener('data', responseHandler);
              if (response.error) {
                reject(new Error(response.error.message));
              } else {
                resolve(response.result);
              }
            }
          }
        } catch (e) {
          // Continue listening if parse fails
        }
      };

      this.process.stdout.on('data', responseHandler);
      this.process.stdin.write(message);

      // Timeout handler
      setTimeout(() => {
        this.process.stdout.removeListener('data', responseHandler);
        reject(new Error('Command timeout'));
      }, this.options.timeout);
    });
  }

  /**
   * Call a tool on the MCP server
   */
  async callTool(toolName, params) {
    if (CONFIG.debug) {
      console.log(chalk.blue(`Calling MCP tool: ${toolName}`));
      console.log(chalk.gray('Params:', JSON.stringify(params, null, 2)));
    }

    // Security check for write operations
    if (CONFIG.security.writeProtection) {
      const blockedTools = ['write_file', 'edit_file', 'move_file', 'create_directory', 'delete_file'];
      if (blockedTools.includes(toolName)) {
        throw new Error(`Tool '${toolName}' is blocked in read-only mode`);
      }
    }

    // Audit logging
    if (CONFIG.security.auditLog) {
      logger.info('MCP Tool Call', { tool: toolName, params, timestamp: new Date() });
    }

    const response = await this.sendCommand({
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: params
      }
    });

    if (CONFIG.debug && response) {
      console.log(chalk.green(`Tool ${toolName} completed`));
    }

    return response;
  }

  /**
   * Get list of available tools
   */
  getAvailableTools() {
    return this.tools?.map(t => ({
      name: t.name,
      description: t.description,
      parameters: t.inputSchema
    })) || [];
  }

  /**
   * Gracefully close the MCP server
   */
  async close() {
    if (this.process) {
      this.process.kill('SIGTERM');
      this.process = null;
      this.isConnected = false;
      logger.info('MCP Server closed');
    }
  }
}

// ===================================================
// 🤖 MAIN AGENT CLASS
// ===================================================

class CGDAOAgent {
  constructor(config) {
    this.config = config;
    this.openai = new OpenAI({
      apiKey: config.openai.apiKey,
    });
    this.mcpServer = null;
    this.conversationHistory = [];
  }

  /**
   * Initialize the agent
   */
  async initialize() {
    console.log(chalk.cyan.bold(`\n🤖 ${this.config.agent.name} v${this.config.agent.version}`));
    console.log(chalk.gray('Initializing...\n'));

    // Validate configuration
    if (!this.config.openai.apiKey) {
      throw new Error('OPENAI_API_KEY is required. Please set it in your .env file');
    }

    // Check if docs directory exists
    if (!existsSync(this.config.paths.docsDir)) {
      throw new Error(`Docs directory not found: ${this.config.paths.docsDir}`);
    }

    // Initialize MCP server
    const allowedDirs = [
      this.config.paths.docsDir,
      ...this.config.paths.additionalDirs
    ].filter(dir => existsSync(dir));

    console.log(chalk.blue('📁 Allowed directories:'));
    allowedDirs.forEach(dir => console.log(chalk.gray(`  - ${dir}`)));
    console.log();

    this.mcpServer = new MCPFilesystemServer(allowedDirs, {
      readOnly: this.config.security.writeProtection,
      cacheTools: this.config.mcp.cacheTools,
      timeout: this.config.mcp.timeout,
    });

    await this.mcpServer.connect();

    console.log(chalk.green.bold('\n✅ Agent initialized successfully!\n'));
    console.log(chalk.yellow('Available capabilities:'));
    console.log(chalk.gray('  • Read and analyze project documentation'));
    console.log(chalk.gray('  • Search for specific information in files'));
    console.log(chalk.gray('  • Provide contextual assistance for DAO operations'));
    console.log(chalk.gray('  • Generate proposals and deployment guides'));
    console.log(chalk.gray('  • Monitor contracts on Base Mainnet'));
    console.log();
  }

  /**
   * Build system prompt with context
   */
  buildSystemPrompt() {
    return `You are ${this.config.agent.name}, an intelligent AI assistant for CryptoGift DAO operations.

## Your Capabilities:
- Read and analyze project documentation from the local filesystem
- Search for specific information across all project files
- Provide expert guidance on DAO operations and smart contracts
- Generate Aragon proposals and deployment scripts
- Analyze tokenomics and distribution strategies
- Monitor contracts on Base Mainnet

## Important Project Information:
- DAO Address: ${this.config.contracts.aragonDao}
- CGC Token: ${this.config.contracts.cgcToken} (2M supply)
- Master Controller: ${this.config.contracts.masterController}
- Task Rules: ${this.config.contracts.taskRules}
- Milestone Escrow: ${this.config.contracts.milestoneEscrow}
- Network: Base Mainnet (Chain ID: 8453)

## Available MCP Tools:
${this.mcpServer.getAvailableTools().map(t => `- ${t.name}: ${t.description}`).join('\n')}

## Guidelines:
1. Always use MCP tools to read files instead of assuming content
2. When citing information, include the file path and line numbers if relevant
3. Provide specific, actionable advice based on the actual project state
4. Be concise but thorough in your responses
5. Prioritize security and best practices in all recommendations
6. Never attempt to write or modify files (read-only mode)

## Response Format:
- Start with a brief summary of what you're doing
- Use markdown for better readability
- Include code examples when relevant
- Cite sources from the documentation
- End with clear next steps or recommendations`;
  }

  /**
   * Process a user query
   */
  async processQuery(query) {
    const spinner = ora('Processing your query...').start();
    
    try {
      // Build messages array with conversation history
      const messages = [
        { role: 'system', content: this.buildSystemPrompt() },
        ...this.conversationHistory,
        { role: 'user', content: query }
      ];

      // Create tools array from MCP server
      const tools = this.mcpServer.getAvailableTools().map(tool => ({
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters || {}
        }
      }));

      // Call OpenAI API with tools
      const response = await this.openai.chat.completions.create({
        model: this.config.openai.model,
        messages,
        tools: tools.length > 0 ? tools : undefined,
        tool_choice: tools.length > 0 ? 'auto' : undefined,
        temperature: this.config.openai.temperature,
        max_tokens: 4096,
      });

      spinner.stop();

      // Handle tool calls if any
      const message = response.choices[0].message;
      
      if (message.tool_calls && message.tool_calls.length > 0) {
        // Process tool calls
        const toolResults = await this.processToolCalls(message.tool_calls);
        
        // Add assistant message with tool calls to history
        this.conversationHistory.push({
          role: 'assistant',
          content: message.content,
          tool_calls: message.tool_calls
        });

        // Add tool results to messages
        for (const result of toolResults) {
          messages.push({
            role: 'tool',
            content: JSON.stringify(result.content),
            tool_call_id: result.tool_call_id
          });
        }

        // Get final response after tool execution
        const finalResponse = await this.openai.chat.completions.create({
          model: this.config.openai.model,
          messages,
          temperature: this.config.openai.temperature,
          max_tokens: 4096,
        });

        const finalMessage = finalResponse.choices[0].message;
        
        // Update conversation history
        this.conversationHistory.push({ role: 'user', content: query });
        this.conversationHistory.push({ role: 'assistant', content: finalMessage.content });

        // Trim history if too long
        if (this.conversationHistory.length > 20) {
          this.conversationHistory = this.conversationHistory.slice(-20);
        }

        return finalMessage.content;
      } else {
        // No tool calls, return direct response
        this.conversationHistory.push({ role: 'user', content: query });
        this.conversationHistory.push({ role: 'assistant', content: message.content });

        // Trim history if too long
        if (this.conversationHistory.length > 20) {
          this.conversationHistory = this.conversationHistory.slice(-20);
        }

        return message.content;
      }
    } catch (error) {
      spinner.fail('Failed to process query');
      logger.error('Query processing error:', error);
      throw error;
    }
  }

  /**
   * Process tool calls from OpenAI
   */
  async processToolCalls(toolCalls) {
    const results = [];
    
    for (const toolCall of toolCalls) {
      try {
        const args = JSON.parse(toolCall.function.arguments);
        
        if (CONFIG.debug) {
          console.log(chalk.blue(`\n📞 Calling tool: ${toolCall.function.name}`));
          console.log(chalk.gray('Arguments:', JSON.stringify(args, null, 2)));
        }

        const result = await this.mcpServer.callTool(
          toolCall.function.name,
          args
        );

        results.push({
          tool_call_id: toolCall.id,
          content: result
        });

        if (CONFIG.debug) {
          console.log(chalk.green(`✅ Tool completed: ${toolCall.function.name}\n`));
        }
      } catch (error) {
        logger.error(`Tool call failed for ${toolCall.function.name}:`, error);
        results.push({
          tool_call_id: toolCall.id,
          content: { error: error.message }
        });
      }
    }
    
    return results;
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    if (this.mcpServer) {
      await this.mcpServer.close();
    }
    logger.info('Agent cleanup completed');
  }
}

// ===================================================
// 🚀 MAIN EXECUTION
// ===================================================

async function main() {
  const agent = new CGDAOAgent(CONFIG);
  
  try {
    // Initialize agent
    await agent.initialize();

    // Example queries to demonstrate capabilities
    const exampleQueries = [
      "What is the current state of the CryptoGift DAO project according to CLAUDE.md?",
      "List all deployed contracts and their addresses from the documentation",
      "Search for EIP-712 implementation details in the contracts",
      "What are the next steps for the project according to the development files?",
      "Analyze the tokenomics distribution plan from the README"
    ];

    // Process a sample query
    console.log(chalk.cyan.bold('📝 Example Query:'));
    console.log(chalk.white(exampleQueries[0]));
    console.log();

    const response = await agent.processQuery(exampleQueries[0]);
    
    console.log(chalk.green.bold('\n🤖 Agent Response:'));
    console.log(chalk.white(response));
    console.log();

    // Interactive mode hint
    console.log(chalk.yellow.bold('\n💡 To use interactive mode, run: npm run chat'));
    console.log(chalk.gray('Or integrate this agent into your workflow using the API\n'));

  } catch (error) {
    console.error(chalk.red.bold('\n❌ Error:'), error.message);
    logger.error('Fatal error:', error);
    process.exit(1);
  } finally {
    // Cleanup
    await agent.cleanup();
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log(chalk.yellow('\n\nGracefully shutting down...'));
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log(chalk.yellow('\n\nTermination signal received...'));
  process.exit(0);
});

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

// Export for use as module
export { CGDAOAgent, MCPFilesystemServer, CONFIG };