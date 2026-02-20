#!/usr/bin/env node
/**
 * 💬 INTERACTIVE CHAT INTERFACE
 * Real-time conversation with the CG DAO OPS Agent
 */

import { CGDAOAgent, CONFIG } from './agent.mjs';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(dirname(__dirname), '.env') });

// ===================================================
// 💬 CHAT INTERFACE
// ===================================================

class ChatInterface {
  constructor() {
    this.agent = null;
    this.isRunning = true;
    this.commandHistory = [];
    this.shortcuts = {
      '/help': this.showHelp.bind(this),
      '/clear': this.clearScreen.bind(this),
      '/history': this.showHistory.bind(this),
      '/contracts': this.showContracts.bind(this),
      '/status': this.showStatus.bind(this),
      '/search': this.searchDocs.bind(this),
      '/analyze': this.analyzeProject.bind(this),
      '/proposal': this.generateProposal.bind(this),
      '/tokenomics': this.showTokenomics.bind(this),
      '/deployment': this.deploymentGuide.bind(this),
      '/exit': this.exit.bind(this),
      '/quit': this.exit.bind(this),
    };
  }

  /**
   * Initialize the chat interface
   */
  async initialize() {
    console.clear();
    this.printBanner();
    
    const spinner = ora('Initializing CG DAO OPS Agent...').start();
    
    try {
      this.agent = new CGDAOAgent(CONFIG);
      await this.agent.initialize();
      spinner.succeed('Agent ready!');
      
      console.log(chalk.gray('\nType /help for available commands or just start chatting!\n'));
      
      await this.startChatLoop();
    } catch (error) {
      spinner.fail('Failed to initialize agent');
      console.error(chalk.red('Error:'), error.message);
      process.exit(1);
    }
  }

  /**
   * Print welcome banner
   */
  printBanner() {
    console.log(chalk.cyan.bold(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║       🤖 CG DAO OPS AGENT - INTERACTIVE CHAT 🤖          ║
║                                                           ║
║         CryptoGift DAO Intelligent Assistant             ║
║              Powered by OpenAI + MCP                     ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    `));
    
    console.log(chalk.yellow('📍 Connected to:'), chalk.white(CONFIG.paths.docsDir));
    console.log(chalk.yellow('🔐 Mode:'), chalk.white('Read-Only Filesystem Access'));
    console.log(chalk.yellow('🧠 Model:'), chalk.white(CONFIG.openai.model));
    console.log();
  }

  /**
   * Main chat loop
   */
  async startChatLoop() {
    while (this.isRunning) {
      try {
        const { input } = await inquirer.prompt([
          {
            type: 'input',
            name: 'input',
            message: chalk.green('You:'),
            prefix: '',
          }
        ]);

        if (!input.trim()) continue;

        // Check for shortcuts
        if (input.startsWith('/')) {
          const command = input.split(' ')[0].toLowerCase();
          const args = input.substring(command.length).trim();
          
          if (this.shortcuts[command]) {
            await this.shortcuts[command](args);
            continue;
          } else {
            console.log(chalk.red(`Unknown command: ${command}. Type /help for available commands.`));
            continue;
          }
        }

        // Add to history
        this.commandHistory.push(input);
        if (this.commandHistory.length > 100) {
          this.commandHistory.shift();
        }

        // Process with agent
        const spinner = ora('Thinking...').start();
        
        try {
          const response = await this.agent.processQuery(input);
          spinner.stop();
          
          console.log(chalk.blue('\n🤖 Agent:'));
          console.log(this.formatResponse(response));
          console.log();
          
        } catch (error) {
          spinner.fail('Error processing query');
          console.error(chalk.red('Error:'), error.message);
        }
        
      } catch (error) {
        if (error.isTtyError) {
          console.error('Prompt couldn\'t be rendered in the current environment');
        } else {
          console.error(chalk.red('Unexpected error:'), error);
        }
      }
    }
  }

  /**
   * Format agent response with proper styling
   */
  formatResponse(response) {
    // Handle code blocks
    response = response.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
      return chalk.gray('```' + (lang || '')) + '\n' + chalk.cyan(code) + chalk.gray('```');
    });
    
    // Handle inline code
    response = response.replace(/`([^`]+)`/g, (match, code) => {
      return chalk.cyan('`' + code + '`');
    });
    
    // Handle bold text
    response = response.replace(/\*\*([^*]+)\*\*/g, (match, text) => {
      return chalk.bold(text);
    });
    
    // Handle headers
    response = response.replace(/^#+\s(.+)$/gm, (match, header) => {
      return chalk.yellow.bold(header);
    });
    
    // Handle bullet points
    response = response.replace(/^[•\-*]\s(.+)$/gm, (match, item) => {
      return chalk.gray('  •') + ' ' + item;
    });
    
    return response;
  }

  /**
   * Show help menu
   */
  async showHelp() {
    console.log(chalk.yellow.bold('\n📚 Available Commands:\n'));
    
    const commands = [
      { cmd: '/help', desc: 'Show this help menu' },
      { cmd: '/clear', desc: 'Clear the screen' },
      { cmd: '/history', desc: 'Show command history' },
      { cmd: '/contracts', desc: 'Display deployed contract addresses' },
      { cmd: '/status', desc: 'Show project status and roadmap' },
      { cmd: '/search <query>', desc: 'Search across all documentation' },
      { cmd: '/analyze', desc: 'Analyze current project state' },
      { cmd: '/proposal', desc: 'Generate an Aragon proposal template' },
      { cmd: '/tokenomics', desc: 'Display tokenomics breakdown' },
      { cmd: '/deployment', desc: 'Show deployment guide' },
      { cmd: '/exit', desc: 'Exit the chat interface' },
    ];
    
    commands.forEach(({ cmd, desc }) => {
      console.log(chalk.cyan(cmd.padEnd(20)) + chalk.gray(desc));
    });
    
    console.log(chalk.gray('\nOr just type any question to chat with the agent!\n'));
  }

  /**
   * Clear screen
   */
  async clearScreen() {
    console.clear();
    this.printBanner();
  }

  /**
   * Show command history
   */
  async showHistory() {
    console.log(chalk.yellow.bold('\n📜 Command History:\n'));
    
    if (this.commandHistory.length === 0) {
      console.log(chalk.gray('No commands in history yet.\n'));
      return;
    }
    
    this.commandHistory.slice(-10).forEach((cmd, i) => {
      console.log(chalk.gray(`${i + 1}.`) + ' ' + cmd);
    });
    console.log();
  }

  /**
   * Show deployed contracts
   */
  async showContracts() {
    console.log(chalk.yellow.bold('\n📋 Deployed Contracts (Base Mainnet):\n'));
    
    const contracts = [
      { name: 'CGC Token', address: CONFIG.contracts.cgcToken },
      { name: 'Master Controller', address: CONFIG.contracts.masterController },
      { name: 'Task Rules', address: CONFIG.contracts.taskRules },
      { name: 'Milestone Escrow', address: CONFIG.contracts.milestoneEscrow },
      { name: 'Aragon DAO', address: CONFIG.contracts.aragonDao },
    ];
    
    contracts.forEach(({ name, address }) => {
      if (address) {
        console.log(chalk.cyan(name.padEnd(20)) + chalk.white(address));
      }
    });
    
    console.log(chalk.gray('\nView on BaseScan: https://basescan.org/address/<address>\n'));
  }

  /**
   * Show project status
   */
  async showStatus() {
    const query = "What is the current status of the CryptoGift DAO project? Include deployment status, completed tasks, and next steps from CLAUDE.md and DEVELOPMENT.md";
    await this.processAgentQuery(query);
  }

  /**
   * Search documentation
   */
  async searchDocs(searchTerm) {
    if (!searchTerm) {
      const { term } = await inquirer.prompt([
        {
          type: 'input',
          name: 'term',
          message: 'Enter search term:',
        }
      ]);
      searchTerm = term;
    }
    
    const query = `Search for "${searchTerm}" across all documentation files and show me where it appears with context`;
    await this.processAgentQuery(query);
  }

  /**
   * Analyze project
   */
  async analyzeProject() {
    const query = "Analyze the complete project structure, deployment status, and provide a comprehensive overview of what's completed and what remains to be done";
    await this.processAgentQuery(query);
  }

  /**
   * Generate proposal template
   */
  async generateProposal() {
    console.log(chalk.yellow.bold('\n📝 Proposal Generator\n'));
    
    const { proposalType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'proposalType',
        message: 'What type of proposal?',
        choices: [
          'Token Distribution',
          'Parameter Change',
          'New Integration',
          'Emergency Action',
          'Custom'
        ]
      }
    ]);
    
    const query = `Generate an Aragon DAO proposal template for a ${proposalType} proposal. Include all necessary fields, voting parameters, and execution details based on our DAO configuration`;
    await this.processAgentQuery(query);
  }

  /**
   * Show tokenomics
   */
  async showTokenomics() {
    const query = "Display the complete tokenomics breakdown for the 2M CGC tokens, including allocations, vesting schedules, and current distribution status";
    await this.processAgentQuery(query);
  }

  /**
   * Show deployment guide
   */
  async deploymentGuide() {
    const query = "Provide a step-by-step deployment guide for the CryptoGift DAO system, including all contracts, verification steps, and post-deployment configuration";
    await this.processAgentQuery(query);
  }

  /**
   * Process a query with the agent
   */
  async processAgentQuery(query) {
    const spinner = ora('Processing...').start();
    
    try {
      const response = await this.agent.processQuery(query);
      spinner.stop();
      
      console.log(chalk.blue('\n🤖 Agent:'));
      console.log(this.formatResponse(response));
      console.log();
      
    } catch (error) {
      spinner.fail('Error processing query');
      console.error(chalk.red('Error:'), error.message);
    }
  }

  /**
   * Exit the chat
   */
  async exit() {
    console.log(chalk.yellow('\n👋 Goodbye! Shutting down agent...\n'));
    
    if (this.agent) {
      await this.agent.cleanup();
    }
    
    this.isRunning = false;
    process.exit(0);
  }
}

// ===================================================
// 🚀 MAIN EXECUTION
// ===================================================

async function main() {
  const chat = new ChatInterface();
  
  // Handle process termination
  process.on('SIGINT', async () => {
    await chat.exit();
  });
  
  process.on('SIGTERM', async () => {
    await chat.exit();
  });
  
  // Start chat interface
  await chat.initialize();
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { ChatInterface };