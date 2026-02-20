#!/usr/bin/env node

/**
 * CryptoGift DAO - Setup Script
 * 
 * Este script configura todos los servicios necesarios para el DAO
 * de forma automatizada
 */

import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';

// Load environment variables
dotenv.config({ path: '.env.dao' });

interface SetupStep {
  name: string;
  check: () => boolean;
  action?: () => Promise<void>;
  required: boolean;
}

class DAOSetup {
  private steps: SetupStep[] = [];
  
  constructor() {
    this.defineSteps();
  }

  private defineSteps() {
    this.steps = [
      {
        name: 'GitHub Repository',
        check: () => !!process.env.URL_GITHUB_REPO,
        required: true,
      },
      {
        name: 'Private Key (Deployer)',
        check: () => !!process.env.PRIVATE_KEY_DAO_DEPLOYER,
        required: true,
      },
      {
        name: 'Aragon DAO Address',
        check: () => !!process.env.ARAGON_DAO_ADDRESS,
        required: true,
      },
      {
        name: 'Safe Multisig',
        check: () => !!process.env.SAFE_DAO_ADDRESS,
        required: false,
      },
      {
        name: 'Discord Bot',
        check: () => !!process.env.DISCORD_DAO_TOKEN,
        required: false,
      },
      {
        name: 'Zealy API',
        check: () => !!process.env.ZEALY_API_KEY,
        required: false,
      },
      {
        name: 'Supabase',
        check: () => !!process.env.SUPABASE_DAO_URL,
        required: false,
      },
      {
        name: 'Vercel',
        check: () => !!process.env.VERCEL_DAO_TOKEN,
        required: false,
      },
      {
        name: 'Security Secrets',
        check: () => !!process.env.JWT_DAO_SECRET,
        required: true,
      },
      {
        name: 'Sentry DSN',
        check: () => !!process.env.SENTRY_DAO_DSN || !!process.env.NEXT_PUBLIC_SENTRY_DAO_DSN,
        required: false,
      },
    ];
  }

  async run() {
    console.log(chalk.cyan.bold('\n🚀 CryptoGift DAO - Setup Verification\n'));
    console.log(chalk.gray('=' .repeat(50)));

    let allRequired = true;
    let configuredCount = 0;
    const totalSteps = this.steps.length;

    // Check each step
    for (const step of this.steps) {
      const isConfigured = step.check();
      
      if (isConfigured) {
        console.log(chalk.green('✅'), step.name);
        configuredCount++;
      } else if (step.required) {
        console.log(chalk.red('❌'), step.name, chalk.red('(REQUIRED)'));
        allRequired = false;
      } else {
        console.log(chalk.yellow('⚠️'), step.name, chalk.gray('(optional)'));
      }
    }

    console.log(chalk.gray('\n' + '=' .repeat(50)));
    
    // Summary
    const percentage = Math.round((configuredCount / totalSteps) * 100);
    console.log(chalk.cyan(`\n📊 Configuration Status: ${configuredCount}/${totalSteps} (${percentage}%)\n`));

    if (!allRequired) {
      console.log(chalk.red.bold('❌ Missing required configurations!\n'));
      this.printNextSteps();
      process.exit(1);
    } else if (configuredCount === totalSteps) {
      console.log(chalk.green.bold('✅ All services configured! Ready to deploy.\n'));
      this.printDeploymentCommands();
    } else {
      console.log(chalk.yellow.bold('⚠️  Required services configured, optional services pending.\n'));
      this.printNextSteps();
      this.printDeploymentCommands();
    }
  }

  private printNextSteps() {
    console.log(chalk.cyan('📝 Next Steps:\n'));

    if (!process.env.SENTRY_DAO_DSN) {
      console.log(chalk.white('1. Get Sentry DSN:'));
      console.log(chalk.gray('   - Go to: https://sentry.io'));
      console.log(chalk.gray('   - Select your DAO project'));
      console.log(chalk.gray('   - Settings → Client Keys (DSN) → Copy DSN'));
      console.log(chalk.gray('   - Add to .env.dao as SENTRY_DAO_DSN\n'));
    }

    if (!process.env.GA_DAO_MEASUREMENT_ID) {
      console.log(chalk.white('2. Get Google Analytics ID:'));
      console.log(chalk.gray('   - Go to: https://analytics.google.com'));
      console.log(chalk.gray('   - Admin → Data Streams → Web'));
      console.log(chalk.gray('   - Copy Measurement ID (G-...)'));
      console.log(chalk.gray('   - Add to .env.dao as GA_DAO_MEASUREMENT_ID\n'));
    }

    if (!process.env.POSTHOG_DAO_API_KEY) {
      console.log(chalk.white('3. Get PostHog API Key:'));
      console.log(chalk.gray('   - Go to: https://app.posthog.com'));
      console.log(chalk.gray('   - Project Settings → Project API Key'));
      console.log(chalk.gray('   - Add to .env.dao as POSTHOG_DAO_API_KEY\n'));
    }

    if (!process.env.RESEND_DAO_API_KEY) {
      console.log(chalk.white('4. Get Resend API Key:'));
      console.log(chalk.gray('   - Go to: https://resend.com'));
      console.log(chalk.gray('   - API Keys → Create API Key'));
      console.log(chalk.gray('   - Add to .env.dao as RESEND_DAO_API_KEY\n'));
    }
  }

  private printDeploymentCommands() {
    console.log(chalk.cyan.bold('🚀 Ready to Deploy!\n'));
    console.log(chalk.white('Run these commands in order:\n'));
    
    console.log(chalk.gray('# 1. Install dependencies'));
    console.log(chalk.green('npm install\n'));
    
    console.log(chalk.gray('# 2. Compile contracts'));
    console.log(chalk.green('npm run compile\n'));
    
    console.log(chalk.gray('# 3. Deploy to Base Sepolia'));
    console.log(chalk.green('npm run deploy:sepolia\n'));
    
    console.log(chalk.gray('# 4. Setup EAS'));
    console.log(chalk.green('npx ts-node scripts/automation/01-setup-eas.ts\n'));
    
    console.log(chalk.gray('# 5. Setup Safe (if not done)'));
    console.log(chalk.green('npx ts-node scripts/automation/03-setup-safe.ts\n'));
    
    console.log(chalk.gray('# 6. Setup Discord Bot'));
    console.log(chalk.green('npx ts-node scripts/automation/04-setup-discord.ts\n'));
    
    console.log(chalk.gray('# 7. Verify deployment'));
    console.log(chalk.green('npx ts-node scripts/utils/check-deployment.ts\n'));
  }
}

// Check if Redis is accessible
async function checkRedisConnection() {
  try {
    const { getDAORedis } = await import('../lib/redis-dao');
    const redis = getDAORedis();
    const isConnected = await redis.ping();
    
    if (isConnected) {
      console.log(chalk.green('✅'), 'Redis Connection');
      
      // List existing DAO keys
      const keys = await redis.listDAOKeys();
      if (keys.length > 0) {
        console.log(chalk.yellow('⚠️'), `Found ${keys.length} existing DAO keys in Redis`);
      }
    } else {
      console.log(chalk.red('❌'), 'Redis Connection Failed');
    }
  } catch (error) {
    console.log(chalk.red('❌'), 'Redis Connection Error:', error instanceof Error ? error.message : String(error));
  }
}

// Main execution
async function main() {
  const setup = new DAOSetup();
  await setup.run();
  
  console.log(chalk.cyan('\n🔗 Testing Redis Connection...\n'));
  await checkRedisConnection();
  
  console.log(chalk.cyan('\n📁 Project Structure:\n'));
  console.log(chalk.gray('   /contracts     - Smart contracts'));
  console.log(chalk.gray('   /scripts       - Automation scripts'));
  console.log(chalk.gray('   /docs          - Documentation'));
  console.log(chalk.gray('   /bots          - Bot services'));
  console.log(chalk.gray('   /lib           - Shared libraries'));
  console.log(chalk.gray('   .env.dao       - Environment variables\n'));
  
  console.log(chalk.cyan.bold('💡 Tips:\n'));
  console.log(chalk.gray('   - Always test on Sepolia first'));
  console.log(chalk.gray('   - Keep shadow mode enabled initially'));
  console.log(chalk.gray('   - Monitor gas costs carefully'));
  console.log(chalk.gray('   - Join our Discord for support\n'));
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error(chalk.red('Setup failed:'), error);
    process.exit(1);
  });
}

export { DAOSetup };