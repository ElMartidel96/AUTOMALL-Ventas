#!/usr/bin/env node
/**
 * 🪙 TRANSFERIR TOKENS AL VAULT - SEGÚN TOKENOMICS
 * Transfiere 400,000 CGC del deployer al GovTokenVault
 * Parte del flujo post-deployment crítico
 */

const hre = require("hardhat");
const fs = require('fs');
require('dotenv').config({ path: '.env.dao' });

// Colores para output
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

async function transferTokensToVault() {
  try {
    console.log(`${colors.bright}${colors.cyan}🪙 TRANSFERENCIA DE TOKENS AL VAULT${colors.reset}`);
    console.log('═'.repeat(60));

    // Cargar deployment data
    const deploymentData = JSON.parse(
      fs.readFileSync('deployments/deployment-base-latest.json', 'utf8')
    );

    const tokenAddress = deploymentData.contracts.CGCToken.address;
    const vaultAddress = deploymentData.contracts.GovTokenVault.address;
    const deployerAddress = deploymentData.deployer;

    console.log(`📄 CGC Token: ${colors.green}${tokenAddress}${colors.reset}`);
    console.log(`🏦 Vault: ${colors.blue}${vaultAddress}${colors.reset}`);
    console.log(`👤 Deployer: ${colors.yellow}${deployerAddress}${colors.reset}`);
    console.log('');

    // Conectar a contratos
    const [deployer] = await hre.ethers.getSigners();
    console.log(`🔑 Signer address: ${deployer.address}`);

    const CGCToken = await hre.ethers.getContractAt("CGCToken", tokenAddress);
    
    // Verificar balance actual
    console.log(`${colors.yellow}📊 Verificando balances actuales...${colors.reset}`);
    
    const deployerBalance = await CGCToken.balanceOf(deployer.address);
    const vaultBalance = await CGCToken.balanceOf(vaultAddress);
    const totalSupply = await CGCToken.totalSupply();

    console.log(`   Total Supply: ${colors.bright}${hre.ethers.formatEther(totalSupply)} CGC${colors.reset}`);
    console.log(`   Deployer Balance: ${colors.bright}${hre.ethers.formatEther(deployerBalance)} CGC${colors.reset}`);
    console.log(`   Vault Balance: ${colors.bright}${hre.ethers.formatEther(vaultBalance)} CGC${colors.reset}`);
    console.log('');

    // Verificar si ya se hizo la transferencia
    const targetAmount = hre.ethers.parseEther("400000");
    if (vaultBalance >= targetAmount) {
      console.log(`${colors.green}✅ TRANSFERENCIA YA COMPLETADA${colors.reset}`);
      console.log(`   Vault ya tiene ${hre.ethers.formatEther(vaultBalance)} CGC`);
      return;
    }

    // Verificar si el deployer tiene suficientes tokens
    if (deployerBalance < targetAmount) {
      console.error(`${colors.red}❌ ERROR: Deployer no tiene suficientes tokens${colors.reset}`);
      console.error(`   Necesarios: ${hre.ethers.formatEther(targetAmount)} CGC`);
      console.error(`   Disponibles: ${hre.ethers.formatEther(deployerBalance)} CGC`);
      return;
    }

    // Realizar transferencia
    console.log(`${colors.bright}${colors.cyan}🚀 INICIANDO TRANSFERENCIA${colors.reset}`);
    console.log(`   Transfiriendo: ${colors.bright}400,000 CGC${colors.reset}`);
    console.log(`   Desde: ${colors.yellow}${deployer.address}${colors.reset}`);
    console.log(`   Hacia: ${colors.blue}${vaultAddress}${colors.reset}`);
    console.log('');

    // Ejecutar transferencia
    console.log(`${colors.yellow}⏳ Ejecutando transferencia...${colors.reset}`);
    const tx = await CGCToken.transfer(vaultAddress, targetAmount);
    
    console.log(`   TX Hash: ${colors.blue}${tx.hash}${colors.reset}`);
    console.log(`${colors.yellow}⏳ Esperando confirmación...${colors.reset}`);
    
    const receipt = await tx.wait();
    
    console.log(`${colors.green}✅ TRANSFERENCIA COMPLETADA${colors.reset}`);
    console.log(`   Block Number: ${colors.bright}${receipt.blockNumber}${colors.reset}`);
    console.log(`   Gas Used: ${colors.bright}${receipt.gasUsed.toString()}${colors.reset}`);
    console.log('');

    // Verificar balances finales
    console.log(`${colors.magenta}📊 BALANCES FINALES:${colors.reset}`);
    
    const newDeployerBalance = await CGCToken.balanceOf(deployer.address);
    const newVaultBalance = await CGCToken.balanceOf(vaultAddress);
    
    console.log(`   Deployer: ${colors.yellow}${hre.ethers.formatEther(newDeployerBalance)} CGC${colors.reset}`);
    console.log(`   Vault: ${colors.green}${hre.ethers.formatEther(newVaultBalance)} CGC${colors.reset}`);
    console.log('');

    // Verificar distribución según tokenomics
    console.log(`${colors.bright}${colors.magenta}📈 VERIFICACIÓN TOKENOMICS:${colors.reset}`);
    const expectedVault = 400000; // 40% del supply
    const actualVault = parseFloat(hre.ethers.formatEther(newVaultBalance));
    
    if (actualVault >= expectedVault) {
      console.log(`${colors.green}✅ Vault configurado correctamente: ${actualVault} CGC${colors.reset}`);
    } else {
      console.log(`${colors.red}❌ Vault insuficiente: ${actualVault} CGC (esperado: ${expectedVault})${colors.reset}`);
    }

    // Guardar datos de la transferencia
    const transferData = {
      timestamp: new Date().toISOString(),
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      amount: "400000",
      from: deployer.address,
      to: vaultAddress,
      finalBalances: {
        deployer: hre.ethers.formatEther(newDeployerBalance),
        vault: hre.ethers.formatEther(newVaultBalance)
      }
    };

    // Actualizar deployment data
    deploymentData.tokenTransfer = transferData;
    fs.writeFileSync(
      'deployments/deployment-base-latest.json', 
      JSON.stringify(deploymentData, null, 2)
    );

    console.log(`${colors.bright}${colors.green}🎉 TRANSFERENCIA DE TOKENS COMPLETADA EXITOSAMENTE${colors.reset}`);
    console.log(`${colors.cyan}💾 Datos guardados en deployment-base-latest.json${colors.reset}`);

  } catch (error) {
    console.error(`${colors.red}💥 Error en transferencia: ${error.message}${colors.reset}`);
    if (error.transaction) {
      console.error(`   TX Hash: ${error.transaction.hash}`);
    }
    throw error;
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  transferTokensToVault()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { transferTokensToVault };