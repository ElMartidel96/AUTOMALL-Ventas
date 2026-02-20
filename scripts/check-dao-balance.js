#!/usr/bin/env node
/**
 * 🏛️ VERIFICAR BALANCE DEL DAO ARAGON
 * Los tokens se mintearon al DAO, no al deployer
 */

const hre = require("hardhat");
const fs = require('fs');
require('dotenv').config({ path: '.env.dao' });

const colors = {
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

async function checkDAOBalance() {
  try {
    console.log(`${colors.bright}${colors.cyan}🏛️ VERIFICAR BALANCE DEL DAO ARAGON${colors.reset}`);
    console.log('═'.repeat(50));

    const deploymentData = JSON.parse(
      fs.readFileSync('deployments/deployment-base-latest.json', 'utf8')
    );

    const tokenAddress = deploymentData.contracts.CGCToken.address;
    const daoAddress = deploymentData.config.aragonDAO; // 0x3244DFBf9E5374DF2f106E89Cf7972E5D4C9ac31
    const vaultAddress = deploymentData.contracts.GovTokenVault.address;
    const deployerAddress = deploymentData.deployer;

    console.log(`📄 CGC Token: ${colors.green}${tokenAddress}${colors.reset}`);
    console.log(`🏛️ DAO Aragon: ${colors.magenta}${daoAddress}${colors.reset}`);
    console.log(`🏦 Vault: ${colors.blue}${vaultAddress}${colors.reset}`);
    console.log(`👤 Deployer: ${colors.yellow}${deployerAddress}${colors.reset}`);
    console.log('');

    // Conectar al token
    const CGCToken = await hre.ethers.getContractAt("CGCToken", tokenAddress);
    
    // Verificar balances
    console.log(`${colors.yellow}📊 BALANCES ACTUALES:${colors.reset}`);
    
    const totalSupply = await CGCToken.totalSupply();
    const daoBalance = await CGCToken.balanceOf(daoAddress);
    const vaultBalance = await CGCToken.balanceOf(vaultAddress);
    const deployerBalance = await CGCToken.balanceOf(deployerAddress);

    console.log(`   Total Supply: ${colors.bright}${hre.ethers.formatEther(totalSupply)} CGC${colors.reset}`);
    console.log(`   DAO Balance: ${colors.magenta}${hre.ethers.formatEther(daoBalance)} CGC${colors.reset}`);
    console.log(`   Vault Balance: ${colors.blue}${hre.ethers.formatEther(vaultBalance)} CGC${colors.reset}`);
    console.log(`   Deployer Balance: ${colors.yellow}${hre.ethers.formatEther(deployerBalance)} CGC${colors.reset}`);
    console.log('');

    // Análisis
    const totalSupplyNum = parseFloat(hre.ethers.formatEther(totalSupply));
    const daoBalanceNum = parseFloat(hre.ethers.formatEther(daoBalance));
    const vaultBalanceNum = parseFloat(hre.ethers.formatEther(vaultBalance));

    console.log(`${colors.bright}${colors.cyan}📈 ANÁLISIS:${colors.reset}`);
    
    if (daoBalanceNum === totalSupplyNum) {
      console.log(`${colors.green}✅ CORRECTO: DAO tiene todo el supply (${daoBalanceNum} CGC)${colors.reset}`);
      console.log(`   Esto significa que el deployment funcionó como se esperaba.`);
    } else {
      console.log(`${colors.red}⚠️  ATENCIÓN: DAO no tiene todo el supply${colors.reset}`);
    }

    if (vaultBalanceNum === 0) {
      console.log(`${colors.yellow}⏳ PENDIENTE: Vault está vacío, necesita recibir tokens del DAO${colors.reset}`);
      console.log(`   Según tokenomics: ${colors.bright}400,000 CGC${colors.reset} deben ir al vault`);
    } else {
      console.log(`${colors.blue}ℹ️  Vault ya tiene: ${vaultBalanceNum} CGC${colors.reset}`);
    }

    console.log('');
    console.log(`${colors.bright}${colors.magenta}🎯 PRÓXIMO PASO:${colors.reset}`);
    console.log(`   Para transferir tokens del DAO al vault se necesita:`);
    console.log(`   1. Propuesta en Aragon DAO para autorizar transferencia`);
    console.log(`   2. O configurar permisos en el DAO para que el vault tome tokens automáticamente`);
    console.log(`   3. O usar multisig si el DAO está configurado así`);

    return {
      totalSupply: totalSupplyNum,
      daoBalance: daoBalanceNum,
      vaultBalance: vaultBalanceNum,
      deployerBalance: parseFloat(hre.ethers.formatEther(deployerBalance)),
      needsTransfer: vaultBalanceNum < 400000
    };

  } catch (error) {
    console.error(`${colors.red}💥 Error verificando balance: ${error.message}${colors.reset}`);
    throw error;
  }
}

if (require.main === module) {
  checkDAOBalance()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { checkDAOBalance };