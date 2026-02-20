#!/usr/bin/env node
/**
 * 📊 CONTRACT MONITOR
 * Real-time monitoring of CryptoGift DAO contracts on Base Mainnet
 */

import { CGDAOAgent, CONFIG } from './agent.mjs';
import { ethers } from 'ethers';
import chalk from 'chalk';
import ora from 'ora';
import cron from 'node-cron';
import winston from 'winston';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(dirname(__dirname), '.env') });

// ===================================================
// 📋 CONTRACT ABIS (Minimal for monitoring)
// ===================================================

const ABIS = {
  CGCToken: [
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address) view returns (uint256)",
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function paused() view returns (bool)",
    "event Transfer(address indexed from, address indexed to, uint256 value)",
    "event Approval(address indexed owner, address indexed spender, uint256 value)"
  ],
  MilestoneEscrow: [
    "function totalEscrowed() view returns (uint256)",
    "function totalReleased() view returns (uint256)",
    "function getMilestoneCount() view returns (uint256)",
    "event MilestoneCreated(uint256 indexed milestoneId, address indexed beneficiary, uint256 amount)",
    "event MilestoneReleased(uint256 indexed milestoneId, address indexed beneficiary, uint256 amount)"
  ],
  MasterController: [
    "function paused() view returns (bool)",
    "function isAuthorized(address) view returns (bool)",
    "function emergencyStop() view returns (bool)",
    "event AuthorizationGranted(address indexed account)",
    "event AuthorizationRevoked(address indexed account)",
    "event EmergencyActivated(address indexed by)"
  ]
};

// ===================================================
// 📊 CONTRACT MONITOR CLASS
// ===================================================

class ContractMonitor {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(
      process.env.BASE_RPC_URL || 'https://mainnet.base.org'
    );
    this.contracts = {};
    this.agent = null;
    this.logger = this.setupLogger();
    this.stats = {
      lastCheck: null,
      totalSupply: 0n,
      circulatingSupply: 0n,
      escrowedAmount: 0n,
      releasedAmount: 0n,
      isPaused: false,
      emergencyStop: false,
      recentTransfers: [],
      alerts: []
    };
  }

  /**
   * Setup logger
   */
  setupLogger() {
    const logsDir = join(dirname(__dirname), 'logs');
    
    return winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.File({ 
          filename: join(logsDir, 'monitor.log') 
        }),
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })
      ]
    });
  }

  /**
   * Initialize monitor
   */
  async initialize() {
    console.log(chalk.cyan.bold('\n📊 CryptoGift DAO Contract Monitor\n'));
    
    const spinner = ora('Initializing monitor...').start();
    
    try {
      // Initialize contracts
      this.contracts.cgcToken = new ethers.Contract(
        CONFIG.contracts.cgcToken,
        ABIS.CGCToken,
        this.provider
      );
      
      this.contracts.milestoneEscrow = new ethers.Contract(
        CONFIG.contracts.milestoneEscrow,
        ABIS.MilestoneEscrow,
        this.provider
      );
      
      this.contracts.masterController = new ethers.Contract(
        CONFIG.contracts.masterController,
        ABIS.MasterController,
        this.provider
      );
      
      // Initialize agent for intelligent analysis
      this.agent = new CGDAOAgent(CONFIG);
      await this.agent.initialize();
      
      // Perform initial check
      await this.checkContracts();
      
      spinner.succeed('Monitor initialized successfully!');
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Display initial stats
      this.displayStats();
      
    } catch (error) {
      spinner.fail('Failed to initialize monitor');
      this.logger.error('Initialization error:', error);
      throw error;
    }
  }

  /**
   * Check all contracts
   */
  async checkContracts() {
    try {
      // Get current block
      const blockNumber = await this.provider.getBlockNumber();
      
      // Check CGC Token
      const [totalSupply, isPaused] = await Promise.all([
        this.contracts.cgcToken.totalSupply(),
        this.contracts.cgcToken.paused().catch(() => false)
      ]);
      
      // Check Milestone Escrow
      const [totalEscrowed, totalReleased] = await Promise.all([
        this.contracts.milestoneEscrow.totalEscrowed().catch(() => 0n),
        this.contracts.milestoneEscrow.totalReleased().catch(() => 0n)
      ]);
      
      // Check Master Controller
      const emergencyStop = await this.contracts.masterController
        .emergencyStop()
        .catch(() => false);
      
      // Calculate circulating supply
      const deployerBalance = await this.contracts.cgcToken.balanceOf(
        '0xc655BF2Bd9AfA997c757Bef290A9Bb6ca41c5dE6'
      );
      const circulatingSupply = totalSupply - deployerBalance;
      
      // Update stats
      this.stats = {
        ...this.stats,
        lastCheck: new Date(),
        blockNumber,
        totalSupply,
        circulatingSupply,
        escrowedAmount: totalEscrowed,
        releasedAmount: totalReleased,
        isPaused,
        emergencyStop
      };
      
      // Check for alerts
      this.checkAlerts();
      
      // Log stats
      this.logger.info('Contract check completed', {
        blockNumber,
        totalSupply: ethers.formatEther(totalSupply),
        circulatingSupply: ethers.formatEther(circulatingSupply),
        escrowedAmount: ethers.formatEther(totalEscrowed),
        releasedAmount: ethers.formatEther(totalReleased),
        isPaused,
        emergencyStop
      });
      
    } catch (error) {
      this.logger.error('Contract check error:', error);
      this.stats.alerts.push({
        type: 'ERROR',
        message: `Failed to check contracts: ${error.message}`,
        timestamp: new Date()
      });
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Listen for CGC Token transfers
    this.contracts.cgcToken.on('Transfer', async (from, to, value, event) => {
      const transfer = {
        from,
        to,
        value: ethers.formatEther(value),
        txHash: event.log.transactionHash,
        blockNumber: event.log.blockNumber,
        timestamp: new Date()
      };
      
      this.stats.recentTransfers.unshift(transfer);
      if (this.stats.recentTransfers.length > 10) {
        this.stats.recentTransfers.pop();
      }
      
      // Check if large transfer
      if (value > ethers.parseEther('10000')) {
        this.stats.alerts.push({
          type: 'LARGE_TRANSFER',
          message: `Large transfer detected: ${transfer.value} CGC from ${from} to ${to}`,
          timestamp: new Date(),
          data: transfer
        });
        
        console.log(chalk.yellow.bold('\n⚠️  Large Transfer Alert:'));
        console.log(chalk.white(`   ${transfer.value} CGC transferred`));
        console.log(chalk.gray(`   From: ${from}`));
        console.log(chalk.gray(`   To: ${to}`));
        console.log(chalk.gray(`   TX: ${transfer.txHash}\n`));
      }
      
      this.logger.info('Transfer detected', transfer);
    });
    
    // Listen for milestone events
    this.contracts.milestoneEscrow.on('MilestoneReleased', async (milestoneId, beneficiary, amount, event) => {
      const release = {
        milestoneId: milestoneId.toString(),
        beneficiary,
        amount: ethers.formatEther(amount),
        txHash: event.log.transactionHash,
        timestamp: new Date()
      };
      
      this.stats.alerts.push({
        type: 'MILESTONE_RELEASED',
        message: `Milestone #${release.milestoneId} released: ${release.amount} CGC to ${beneficiary}`,
        timestamp: new Date(),
        data: release
      });
      
      console.log(chalk.green.bold('\n✅ Milestone Released:'));
      console.log(chalk.white(`   Milestone #${release.milestoneId}`));
      console.log(chalk.white(`   Amount: ${release.amount} CGC`));
      console.log(chalk.gray(`   Beneficiary: ${beneficiary}`));
      console.log(chalk.gray(`   TX: ${release.txHash}\n`));
      
      this.logger.info('Milestone released', release);
    });
    
    // Listen for emergency events
    this.contracts.masterController.on('EmergencyActivated', async (by, event) => {
      this.stats.alerts.push({
        type: 'EMERGENCY',
        message: `EMERGENCY STOP ACTIVATED by ${by}`,
        timestamp: new Date(),
        critical: true
      });
      
      console.log(chalk.red.bold('\n🚨 EMERGENCY STOP ACTIVATED!'));
      console.log(chalk.red(`   Activated by: ${by}`));
      console.log(chalk.red(`   TX: ${event.log.transactionHash}\n`));
      
      // Use agent to analyze the situation
      const analysis = await this.agent.processQuery(
        "EMERGENCY: The emergency stop has been activated. Analyze what this means for the DAO and what steps should be taken immediately."
      );
      
      console.log(chalk.yellow.bold('🤖 Agent Analysis:'));
      console.log(chalk.white(analysis));
      
      this.logger.error('EMERGENCY ACTIVATED', { by, txHash: event.log.transactionHash });
    });
  }

  /**
   * Check for alert conditions
   */
  checkAlerts() {
    // Clear old alerts (keep last 24 hours)
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    this.stats.alerts = this.stats.alerts.filter(a => a.timestamp > cutoff);
    
    // Check for paused state
    if (this.stats.isPaused) {
      this.stats.alerts.push({
        type: 'WARNING',
        message: 'CGC Token contract is PAUSED',
        timestamp: new Date()
      });
    }
    
    // Check for emergency stop
    if (this.stats.emergencyStop) {
      this.stats.alerts.push({
        type: 'CRITICAL',
        message: 'Emergency stop is ACTIVE',
        timestamp: new Date(),
        critical: true
      });
    }
    
    // Check for low circulation
    const circulationPercent = (Number(this.stats.circulatingSupply) / Number(this.stats.totalSupply)) * 100;
    if (circulationPercent < 1) {
      this.stats.alerts.push({
        type: 'INFO',
        message: `Very low circulation: ${circulationPercent.toFixed(2)}% of total supply`,
        timestamp: new Date()
      });
    }
  }

  /**
   * Display current stats
   */
  displayStats() {
    console.log(chalk.cyan.bold('\n📊 Current Statistics:\n'));
    
    console.log(chalk.yellow('Token Stats:'));
    console.log(chalk.gray('  Total Supply:      '), chalk.white(ethers.formatEther(this.stats.totalSupply) + ' CGC'));
    console.log(chalk.gray('  Circulating:       '), chalk.white(ethers.formatEther(this.stats.circulatingSupply) + ' CGC'));
    console.log(chalk.gray('  % Circulating:     '), chalk.white(
      ((Number(this.stats.circulatingSupply) / Number(this.stats.totalSupply)) * 100).toFixed(2) + '%'
    ));
    
    console.log(chalk.yellow('\nEscrow Stats:'));
    console.log(chalk.gray('  Total Escrowed:    '), chalk.white(ethers.formatEther(this.stats.escrowedAmount) + ' CGC'));
    console.log(chalk.gray('  Total Released:    '), chalk.white(ethers.formatEther(this.stats.releasedAmount) + ' CGC'));
    
    console.log(chalk.yellow('\nSystem Status:'));
    console.log(chalk.gray('  Token Paused:      '), this.stats.isPaused ? chalk.red('YES') : chalk.green('NO'));
    console.log(chalk.gray('  Emergency Stop:    '), this.stats.emergencyStop ? chalk.red('ACTIVE') : chalk.green('INACTIVE'));
    console.log(chalk.gray('  Last Check:        '), chalk.white(this.stats.lastCheck?.toLocaleString() || 'N/A'));
    console.log(chalk.gray('  Block Number:      '), chalk.white(this.stats.blockNumber || 'N/A'));
    
    if (this.stats.recentTransfers.length > 0) {
      console.log(chalk.yellow('\nRecent Transfers:'));
      this.stats.recentTransfers.slice(0, 5).forEach(transfer => {
        console.log(chalk.gray(`  ${transfer.timestamp.toLocaleTimeString()}: `), 
          chalk.white(`${transfer.value} CGC`),
          chalk.gray(` (${transfer.from.slice(0, 6)}...${transfer.from.slice(-4)} → ${transfer.to.slice(0, 6)}...${transfer.to.slice(-4)})`)
        );
      });
    }
    
    if (this.stats.alerts.filter(a => a.type !== 'INFO').length > 0) {
      console.log(chalk.yellow('\n⚠️  Active Alerts:'));
      this.stats.alerts
        .filter(a => a.type !== 'INFO')
        .slice(0, 5)
        .forEach(alert => {
          const color = alert.critical ? chalk.red : alert.type === 'WARNING' ? chalk.yellow : chalk.white;
          console.log(color(`  [${alert.type}] ${alert.message}`));
        });
    }
    
    console.log();
  }

  /**
   * Start scheduled monitoring
   */
  startScheduledMonitoring(interval = '*/5 * * * *') {
    console.log(chalk.green.bold(`\n⏰ Starting scheduled monitoring (${interval})...\n`));
    
    // Schedule regular checks
    cron.schedule(interval, async () => {
      console.log(chalk.gray(`\n[${new Date().toLocaleTimeString()}] Running scheduled check...`));
      
      await this.checkContracts();
      this.displayStats();
      
      // Check if any critical alerts
      const criticalAlerts = this.stats.alerts.filter(a => a.critical);
      if (criticalAlerts.length > 0) {
        console.log(chalk.red.bold('\n🚨 CRITICAL ALERTS DETECTED!'));
        
        // Use agent to analyze critical situation
        const query = `Analyze these critical alerts and provide immediate action recommendations: ${JSON.stringify(criticalAlerts)}`;
        const analysis = await this.agent.processQuery(query);
        
        console.log(chalk.yellow.bold('\n🤖 Agent Recommendations:'));
        console.log(chalk.white(analysis));
      }
    });
    
    console.log(chalk.gray('Monitor is running. Press Ctrl+C to stop.\n'));
  }

  /**
   * Generate monitoring report
   */
  async generateReport() {
    const spinner = ora('Generating monitoring report...').start();
    
    try {
      const query = `Generate a comprehensive monitoring report based on these stats: ${JSON.stringify(this.stats, (key, value) => 
        typeof value === 'bigint' ? ethers.formatEther(value) + ' CGC' : value
      )}. Include analysis of token circulation, escrow activity, system health, and any recommendations.`;
      
      const report = await this.agent.processQuery(query);
      
      spinner.succeed('Report generated');
      
      console.log(chalk.cyan.bold('\n📄 Monitoring Report:\n'));
      console.log(report);
      
      // Save report to logs
      this.logger.info('Monitoring report generated', { report });
      
      return report;
    } catch (error) {
      spinner.fail('Failed to generate report');
      this.logger.error('Report generation error:', error);
      throw error;
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    // Remove all listeners
    await this.contracts.cgcToken.removeAllListeners();
    await this.contracts.milestoneEscrow.removeAllListeners();
    await this.contracts.masterController.removeAllListeners();
    
    // Cleanup agent
    if (this.agent) {
      await this.agent.cleanup();
    }
    
    this.logger.info('Monitor cleanup completed');
  }
}

// ===================================================
// 🚀 MAIN EXECUTION
// ===================================================

async function main() {
  const monitor = new ContractMonitor();
  
  try {
    // Initialize monitor
    await monitor.initialize();
    
    // Check for command line arguments
    const args = process.argv.slice(2);
    
    if (args.includes('--once')) {
      // Run once and exit
      await monitor.checkContracts();
      monitor.displayStats();
      await monitor.generateReport();
    } else if (args.includes('--report')) {
      // Generate report only
      await monitor.generateReport();
    } else {
      // Start continuous monitoring
      const interval = args.find(a => a.startsWith('--interval='))?.split('=')[1] || '*/5 * * * *';
      monitor.startScheduledMonitoring(interval);
    }
    
  } catch (error) {
    console.error(chalk.red.bold('\n❌ Error:'), error.message);
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log(chalk.yellow('\n\nShutting down monitor...'));
  const monitor = new ContractMonitor();
  await monitor.cleanup();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log(chalk.yellow('\n\nTermination signal received...'));
  const monitor = new ContractMonitor();
  await monitor.cleanup();
  process.exit(0);
});

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { ContractMonitor };