#!/usr/bin/env node
/**
 * 🔧 SETUP SCRIPT
 * Initial configuration wizard for CG DAO OPS Agent
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import { spawn } from 'child_process';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = dirname(__dirname);

// ===================================================
// 🔧 SETUP WIZARD
// ===================================================

class SetupWizard {
  constructor() {
    this.config = {};
    this.envPath = join(PROJECT_ROOT, '.env');
    this.envExamplePath = join(PROJECT_ROOT, '.env.example');
  }

  /**
   * Run the setup wizard
   */
  async run() {
    console.clear();
    this.printBanner();
    
    try {
      // Check if .env already exists
      const envExists = await this.checkEnvFile();
      
      if (envExists) {
        const { overwrite } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'overwrite',
            message: '.env file already exists. Do you want to reconfigure?',
            default: false
          }
        ]);
        
        if (!overwrite) {
          console.log(chalk.yellow('\n✨ Using existing configuration.\n'));
          await this.verifySetup();
          return;
        }
      }
      
      // Run configuration steps
      await this.configureOpenAI();
      await this.configurePaths();
      await this.configureContracts();
      await this.configureFeatures();
      await this.configureAdvanced();
      
      // Save configuration
      await this.saveConfiguration();
      
      // Install dependencies if needed
      await this.checkDependencies();
      
      // Verify setup
      await this.verifySetup();
      
      // Show next steps
      this.showNextSteps();
      
    } catch (error) {
      console.error(chalk.red('\n❌ Setup failed:'), error.message);
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
║          🔧 CG DAO OPS AGENT - SETUP WIZARD 🔧           ║
║                                                           ║
║        Configure your intelligent DAO assistant          ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    `));
  }

  /**
   * Check if .env file exists
   */
  async checkEnvFile() {
    try {
      await fs.access(this.envPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Configure OpenAI settings
   */
  async configureOpenAI() {
    console.log(chalk.yellow.bold('\n📝 OpenAI Configuration\n'));
    
    const answers = await inquirer.prompt([
      {
        type: 'password',
        name: 'apiKey',
        message: 'Enter your OpenAI API Key:',
        mask: '*',
        validate: (input) => {
          if (!input) return 'API Key is required';
          if (!input.startsWith('sk-')) return 'Invalid API Key format';
          return true;
        }
      },
      {
        type: 'list',
        name: 'model',
        message: 'Select the model to use:',
        choices: [
          { name: 'GPT-4o Mini (Recommended - Fast & Cheap)', value: 'gpt-4o-mini' },
          { name: 'GPT-4o (More capable)', value: 'gpt-4o' },
          { name: 'GPT-4 Turbo', value: 'gpt-4-turbo' },
          { name: 'GPT-3.5 Turbo (Legacy)', value: 'gpt-3.5-turbo' }
        ],
        default: 'gpt-4o-mini'
      }
    ]);
    
    this.config.OPENAI_API_KEY = answers.apiKey;
    this.config.AGENT_MODEL = answers.model;
  }

  /**
   * Configure paths
   */
  async configurePaths() {
    console.log(chalk.yellow.bold('\n📁 Path Configuration\n'));
    
    // Try to detect the parent DAO directory
    const defaultPath = resolve(PROJECT_ROOT, '..');
    
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'docsDir',
        message: 'Enter the path to your CryptoGift DAO project:',
        default: defaultPath,
        validate: async (input) => {
          try {
            const stats = await fs.stat(input);
            if (!stats.isDirectory()) return 'Path must be a directory';
            
            // Check if it's likely the DAO project
            try {
              await fs.access(join(input, 'CLAUDE.md'));
              return true;
            } catch {
              return 'Warning: CLAUDE.md not found in this directory. Is this the correct path?';
            }
          } catch {
            return 'Directory does not exist';
          }
        }
      },
      {
        type: 'input',
        name: 'additionalDirs',
        message: 'Additional directories to allow (comma-separated, optional):',
        default: '',
        filter: (input) => input.trim()
      }
    ]);
    
    this.config.DOCS_DIR = answers.docsDir;
    if (answers.additionalDirs) {
      this.config.ADDITIONAL_DIRS = answers.additionalDirs;
    }
  }

  /**
   * Configure contract addresses
   */
  async configureContracts() {
    console.log(chalk.yellow.bold('\n🔗 Contract Configuration\n'));
    
    const { useDefaults } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'useDefaults',
        message: 'Use default contract addresses from latest deployment?',
        default: true
      }
    ]);
    
    if (useDefaults) {
      this.config.CGC_TOKEN_ADDRESS = '0x5e3a61b550328f3D8C44f60b3e10a49D3d806175';
      this.config.MASTER_CONTROLLER_ADDRESS = '0x67D9a01A3F7b5D38694Bb78dD39286Db75D7D869';
      this.config.TASK_RULES_ADDRESS = '0xdDcfFF04eC6D8148CDdE3dBde42456fB32bcC5bb';
      this.config.MILESTONE_ESCROW_ADDRESS = '0x8346CFcaECc90d678d862319449E5a742c03f109';
      this.config.ARAGON_DAO_ADDRESS = '0x3244DFBf9E5374DF2f106E89Cf7972E5D4C9ac31';
    } else {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'cgcToken',
          message: 'CGC Token address:',
          validate: (input) => /^0x[a-fA-F0-9]{40}$/.test(input) || 'Invalid address format'
        },
        {
          type: 'input',
          name: 'masterController',
          message: 'Master Controller address:',
          validate: (input) => /^0x[a-fA-F0-9]{40}$/.test(input) || 'Invalid address format'
        },
        {
          type: 'input',
          name: 'aragonDao',
          message: 'Aragon DAO address:',
          validate: (input) => /^0x[a-fA-F0-9]{40}$/.test(input) || 'Invalid address format'
        }
      ]);
      
      Object.assign(this.config, answers);
    }
  }

  /**
   * Configure features
   */
  async configureFeatures() {
    console.log(chalk.yellow.bold('\n⚙️ Feature Configuration\n'));
    
    const answers = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'features',
        message: 'Select features to enable:',
        choices: [
          { name: 'Proposal Generation', value: 'ENABLE_PROPOSAL_GENERATION', checked: true },
          { name: 'Contract Monitoring', value: 'ENABLE_CONTRACT_MONITORING', checked: true },
          { name: 'Tokenomics Analysis', value: 'ENABLE_TOKENOMICS_ANALYSIS', checked: true },
          { name: 'Deployment Assistance', value: 'ENABLE_DEPLOYMENT_ASSISTANCE', checked: true },
          { name: 'Emergency Alerts', value: 'ENABLE_EMERGENCY_ALERTS', checked: false },
          { name: 'Audit Logging', value: 'ENABLE_AUDIT_LOG', checked: true },
          { name: 'Debug Mode', value: 'DEBUG_MODE', checked: false }
        ]
      }
    ]);
    
    // Set all features
    ['ENABLE_PROPOSAL_GENERATION', 'ENABLE_CONTRACT_MONITORING', 'ENABLE_TOKENOMICS_ANALYSIS', 
     'ENABLE_DEPLOYMENT_ASSISTANCE', 'ENABLE_EMERGENCY_ALERTS', 'ENABLE_AUDIT_LOG', 'DEBUG_MODE'].forEach(feature => {
      this.config[feature] = answers.features.includes(feature) ? 'true' : 'false';
    });
  }

  /**
   * Configure advanced settings
   */
  async configureAdvanced() {
    console.log(chalk.yellow.bold('\n🔬 Advanced Settings\n'));
    
    const { configureAdvanced } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'configureAdvanced',
        message: 'Configure advanced settings?',
        default: false
      }
    ]);
    
    if (!configureAdvanced) {
      // Use defaults
      this.config.TEMPERATURE = '0.7';
      this.config.MCP_SERVER_TIMEOUT = '30000';
      this.config.LOG_LEVEL = 'info';
      this.config.ENABLE_WRITE_PROTECTION = 'true';
      return;
    }
    
    const answers = await inquirer.prompt([
      {
        type: 'number',
        name: 'temperature',
        message: 'Model temperature (0.0-1.0):',
        default: 0.7,
        validate: (input) => input >= 0 && input <= 1 || 'Must be between 0 and 1'
      },
      {
        type: 'list',
        name: 'logLevel',
        message: 'Log level:',
        choices: ['debug', 'info', 'warn', 'error'],
        default: 'info'
      },
      {
        type: 'confirm',
        name: 'writeProtection',
        message: 'Enable write protection (recommended)?',
        default: true
      }
    ]);
    
    this.config.TEMPERATURE = answers.temperature.toString();
    this.config.LOG_LEVEL = answers.logLevel;
    this.config.ENABLE_WRITE_PROTECTION = answers.writeProtection ? 'true' : 'false';
    this.config.MCP_SERVER_TIMEOUT = '30000';
  }

  /**
   * Save configuration to .env file
   */
  async saveConfiguration() {
    const spinner = ora('Saving configuration...').start();
    
    try {
      // Read the example file as template
      const template = await fs.readFile(this.envExamplePath, 'utf8');
      
      // Replace values in template
      let envContent = template;
      for (const [key, value] of Object.entries(this.config)) {
        const regex = new RegExp(`^${key}=.*$`, 'gm');
        envContent = envContent.replace(regex, `${key}=${value}`);
      }
      
      // Save to .env
      await fs.writeFile(this.envPath, envContent);
      
      spinner.succeed('Configuration saved to .env');
    } catch (error) {
      spinner.fail('Failed to save configuration');
      throw error;
    }
  }

  /**
   * Check and install dependencies
   */
  async checkDependencies() {
    const spinner = ora('Checking dependencies...').start();
    
    try {
      // Check if node_modules exists
      const nodeModulesPath = join(PROJECT_ROOT, 'node_modules');
      try {
        await fs.access(nodeModulesPath);
        spinner.succeed('Dependencies already installed');
      } catch {
        spinner.text = 'Installing dependencies...';
        
        // Run npm install
        await new Promise((resolve, reject) => {
          const install = spawn('npm', ['install'], {
            cwd: PROJECT_ROOT,
            shell: true,
            stdio: 'pipe'
          });
          
          install.on('close', (code) => {
            if (code === 0) {
              resolve();
            } else {
              reject(new Error(`npm install failed with code ${code}`));
            }
          });
          
          install.on('error', reject);
        });
        
        spinner.succeed('Dependencies installed');
      }
    } catch (error) {
      spinner.fail('Failed to install dependencies');
      console.log(chalk.yellow('\nPlease run "npm install" manually'));
    }
  }

  /**
   * Verify the setup
   */
  async verifySetup() {
    const spinner = ora('Verifying setup...').start();
    
    try {
      // Load the configuration
      config({ path: this.envPath });
      
      // Check critical variables
      const critical = ['OPENAI_API_KEY', 'DOCS_DIR'];
      const missing = critical.filter(key => !process.env[key]);
      
      if (missing.length > 0) {
        throw new Error(`Missing critical variables: ${missing.join(', ')}`);
      }
      
      // Check docs directory
      const docsDir = process.env.DOCS_DIR;
      await fs.access(docsDir);
      
      // Try to find key files
      const keyFiles = ['CLAUDE.md', 'README.md'];
      let foundFiles = 0;
      
      for (const file of keyFiles) {
        try {
          await fs.access(join(docsDir, file));
          foundFiles++;
        } catch {
          // File not found
        }
      }
      
      if (foundFiles === 0) {
        spinner.warn('No documentation files found in the specified directory');
      } else {
        spinner.succeed(`Setup verified! Found ${foundFiles} documentation files`);
      }
      
    } catch (error) {
      spinner.fail('Setup verification failed');
      throw error;
    }
  }

  /**
   * Show next steps
   */
  showNextSteps() {
    console.log(chalk.green.bold('\n✅ Setup Complete!\n'));
    
    console.log(chalk.yellow('Next steps:'));
    console.log(chalk.gray('1. Test the agent:'));
    console.log(chalk.cyan('   npm start\n'));
    
    console.log(chalk.gray('2. Start interactive chat:'));
    console.log(chalk.cyan('   npm run chat\n'));
    
    console.log(chalk.gray('3. Monitor contracts:'));
    console.log(chalk.cyan('   npm run monitor\n'));
    
    console.log(chalk.gray('4. Read the documentation:'));
    console.log(chalk.cyan('   cat README.md\n'));
    
    console.log(chalk.green.bold('Happy DAOing! 🚀\n'));
  }
}

// ===================================================
// 🚀 MAIN EXECUTION
// ===================================================

async function main() {
  const wizard = new SetupWizard();
  await wizard.run();
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { SetupWizard };