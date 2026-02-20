#!/usr/bin/env node
/**
 * 🚨 EMERGENCY TOOLKIT - HERRAMIENTAS DE EMERGENCIA
 * Para usar cuando Claude CLI crashea - INDEPENDIENTE Y ROBUSTO
 * IMPORTANTE: Este proyecto usa PNPM, no NPM (excepto para Claude CLI)
 */

const fs = require('fs');
const { ethers } = require('ethers');
require('dotenv').config({ path: '.env.dao' });

const colors = {
  bright: '\x1b[1m', green: '\x1b[32m', red: '\x1b[31m',
  yellow: '\x1b[33m', blue: '\x1b[34m', magenta: '\x1b[35m',
  cyan: '\x1b[36m', reset: '\x1b[0m'
};

class EmergencyToolkit {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(
      process.env.BASE_RPC_URL || 'https://mainnet.base.org'
    );
    this.deploymentData = this.loadDeployment();
    // Solo crear wallet si necesitamos hacer transacciones
    this.wallet = null;
  }

  getWallet() {
    if (!this.wallet && process.env.DEPLOYER_PRIVATE_KEY) {
      this.wallet = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, this.provider);
    }
    return this.wallet;
  }

  loadDeployment() {
    try {
      return JSON.parse(fs.readFileSync('deployments/deployment-base-latest.json', 'utf8'));
    } catch (error) {
      console.error(`${colors.red}❌ Error cargando deployment: ${error.message}${colors.reset}`);
      process.exit(1);
    }
  }

  async quickStatus() {
    console.log(`${colors.bright}${colors.cyan}⚡ ESTADO RÁPIDO DEL PROYECTO${colors.reset}`);
    console.log('═'.repeat(50));
    
    // Balance deployer
    const balance = await this.provider.getBalance(this.deploymentData.deployer);
    console.log(`💰 Balance deployer: ${colors.yellow}${ethers.formatEther(balance)} ETH${colors.reset}`);
    
    // Estado contratos
    let contractsOk = 0;
    const total = Object.keys(this.deploymentData.contracts).length;
    
    for (const [name, data] of Object.entries(this.deploymentData.contracts)) {
      const code = await this.provider.getCode(data.address);
      const hasCode = code && code !== '0x';
      if (hasCode) contractsOk++;
      console.log(`📄 ${name}: ${hasCode ? colors.green + '✅' : colors.red + '❌'}${colors.reset}`);
    }
    
    console.log(`\n🎯 Contratos: ${colors.green}${contractsOk}/${total}${colors.reset} funcionando`);
    return { contractsOk, total, balance: ethers.formatEther(balance) };
  }

  async tokenStatus() {
    console.log(`${colors.bright}${colors.magenta}🪙 ESTADO DEL TOKEN CGC${colors.reset}`);
    console.log('═'.repeat(40));
    
    const tokenAddress = this.deploymentData.contracts.CGCToken.address;
    const tokenABI = [
      'function totalSupply() view returns (uint256)',
      'function balanceOf(address) view returns (uint256)',
      'function owner() view returns (address)',
      'function name() view returns (string)',
      'function symbol() view returns (string)'
    ];
    
    try {
      const token = new ethers.Contract(tokenAddress, tokenABI, this.provider);
      
      // Usar call estático para evitar revert
      const totalSupply = await this.provider.call({
        to: tokenAddress,
        data: token.interface.encodeFunctionData('totalSupply')
      }).then(data => token.interface.decodeFunctionResult('totalSupply', data)[0]);
      
      const ownerBalance = await this.provider.call({
        to: tokenAddress,
        data: token.interface.encodeFunctionData('balanceOf', [this.deploymentData.deployer])
      }).then(data => token.interface.decodeFunctionResult('balanceOf', data)[0]);
      
      console.log(`📊 Total Supply: ${colors.yellow}${ethers.formatEther(totalSupply)} CGC${colors.reset}`);
      console.log(`💼 Owner Balance: ${colors.yellow}${ethers.formatEther(ownerBalance)} CGC${colors.reset}`);
      
      return {
        totalSupply: ethers.formatEther(totalSupply),
        ownerBalance: ethers.formatEther(ownerBalance)
      };
    } catch (error) {
      console.log(`${colors.red}❌ Error leyendo token: ${error.message}${colors.reset}`);
      return null;
    }
  }

  async vaultStatus() {
    console.log(`${colors.bright}${colors.blue}🏦 ESTADO DEL VAULT${colors.reset}`);
    console.log('═'.repeat(35));
    
    const vaultAddress = this.deploymentData.contracts.GovTokenVault.address;
    const tokenAddress = this.deploymentData.contracts.CGCToken.address;
    
    // Balance del vault
    const vaultBalance = await this.provider.call({
      to: tokenAddress,
      data: '0x70a08231' + vaultAddress.slice(2).padStart(64, '0') // balanceOf(vault)
    }).catch(() => '0x0');
    
    const balance = vaultBalance !== '0x0' ? ethers.formatEther(vaultBalance) : '0';
    console.log(`💰 CGC en Vault: ${colors.yellow}${balance} CGC${colors.reset}`);
    
    // ETH balance del vault
    const ethBalance = await this.provider.getBalance(vaultAddress);
    console.log(`⚡ ETH en Vault: ${colors.yellow}${ethers.formatEther(ethBalance)} ETH${colors.reset}`);
    
    return { cgcBalance: balance, ethBalance: ethers.formatEther(ethBalance) };
  }

  async createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupData = {
      timestamp,
      deploymentData: this.deploymentData,
      status: await this.quickStatus(),
      tokenStatus: await this.tokenStatus(),
      vaultStatus: await this.vaultStatus(),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      }
    };
    
    const filename = `emergency-backup-${timestamp}.json`;
    fs.writeFileSync(filename, JSON.stringify(backupData, null, 2));
    
    console.log(`${colors.green}💾 Backup creado: ${filename}${colors.reset}`);
    return filename;
  }

  async transferTokensToVault(amount = '400000') {
    console.log(`${colors.bright}${colors.cyan}🔄 TRANSFIRIENDO ${amount} CGC AL VAULT${colors.reset}`);
    
    const wallet = this.getWallet();
    if (!wallet) {
      console.error(`${colors.red}❌ No se puede crear wallet - verificar DEPLOYER_PRIVATE_KEY${colors.reset}`);
      return { success: false, error: 'No wallet available' };
    }
    
    const tokenAddress = this.deploymentData.contracts.CGCToken.address;
    const vaultAddress = this.deploymentData.contracts.GovTokenVault.address;
    
    const tokenABI = ['function transfer(address to, uint256 amount) returns (bool)'];
    const token = new ethers.Contract(tokenAddress, tokenABI, wallet);
    
    try {
      const amountWei = ethers.parseEther(amount);
      console.log(`📤 Enviando ${amount} CGC a ${vaultAddress}...`);
      
      const tx = await token.transfer(vaultAddress, amountWei);
      console.log(`⏳ TX enviada: ${colors.blue}${tx.hash}${colors.reset}`);
      
      const receipt = await tx.wait();
      console.log(`✅ Transfer completado en block ${colors.green}${receipt.blockNumber}${colors.reset}`);
      
      return { success: true, txHash: tx.hash, blockNumber: receipt.blockNumber };
    } catch (error) {
      console.error(`${colors.red}❌ Error en transfer: ${error.message}${colors.reset}`);
      return { success: false, error: error.message };
    }
  }
}

// CLI Commands
async function main() {
  const toolkit = new EmergencyToolkit();
  const command = process.argv[2] || 'status';
  
  console.log(`${colors.bright}🚨 EMERGENCY TOOLKIT ACTIVADO${colors.reset}\n`);
  
  switch (command) {
    case 'status':
    case 'check':
      await toolkit.quickStatus();
      await toolkit.tokenStatus();
      await toolkit.vaultStatus();
      break;
      
    case 'backup':
      await toolkit.createBackup();
      break;
      
    case 'transfer':
      const amount = process.argv[3] || '400000';
      await toolkit.transferTokensToVault(amount);
      break;
      
    case 'token':
      await toolkit.tokenStatus();
      break;
      
    case 'vault':
      await toolkit.vaultStatus();
      break;
      
    default:
      console.log(`${colors.yellow}Comandos disponibles:${colors.reset}`);
      console.log('  node scripts/emergency-toolkit.js status   - Estado completo');
      console.log('  node scripts/emergency-toolkit.js backup   - Crear backup');
      console.log('  node scripts/emergency-toolkit.js transfer [amount] - Transferir CGC al vault');
      console.log('  node scripts/emergency-toolkit.js token    - Estado del token');
      console.log('  node scripts/emergency-toolkit.js vault    - Estado del vault');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { EmergencyToolkit };