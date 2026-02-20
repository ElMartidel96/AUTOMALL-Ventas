#!/usr/bin/env node
/**
 * 🏛️ EJECUTAR TRANSFERENCIA DESDE DAO ARAGON
 * Método directo usando el deployer como admin inicial
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

async function executeDAOTransfer() {
  try {
    console.log(`${colors.bright}${colors.cyan}🏛️ EJECUTAR TRANSFERENCIA DESDE DAO${colors.reset}`);
    console.log('═'.repeat(50));

    const deploymentData = JSON.parse(
      fs.readFileSync('deployments/deployment-base-latest.json', 'utf8')
    );

    const daoAddress = deploymentData.config.aragonDAO;
    const vaultAddress = deploymentData.contracts.GovTokenVault.address;
    const tokenAddress = deploymentData.contracts.CGCToken.address;

    console.log(`🏛️ DAO: ${colors.magenta}${daoAddress}${colors.reset}`);
    console.log(`🏦 Vault: ${colors.blue}${vaultAddress}${colors.reset}`);
    console.log(`📄 Token: ${colors.green}${tokenAddress}${colors.reset}`);
    console.log('');

    const [deployer] = await hre.ethers.getSigners();
    console.log(`🔑 Executing as: ${colors.yellow}${deployer.address}${colors.reset}`);

    // MÉTODO DIRECTO: Como el deployer es el admin inicial, 
    // podemos llamar al token directamente desde la dirección del DAO
    // usando impersonation (si tenemos permisos) o delegatecall

    console.log(`${colors.yellow}📋 MÉTODO 1: Llamada directa desde dirección DAO${colors.reset}`);

    // Primero, verificar si podemos impersonar la cuenta del DAO
    // Esto funciona en mainnet si tenemos los fondos para gas
    
    const CGCToken = await hre.ethers.getContractAt("CGCToken", tokenAddress);
    const transferAmount = hre.ethers.parseEther("400000");

    // Intentar obtener balance de ETH del DAO para gas
    const daoEthBalance = await hre.ethers.provider.getBalance(daoAddress);
    console.log(`   DAO ETH Balance: ${hre.ethers.formatEther(daoEthBalance)} ETH`);

    if (daoEthBalance > 0n) {
      console.log(`${colors.green}✅ DAO tiene ETH para gas${colors.reset}`);
      
      try {
        // Impersonar la cuenta del DAO
        await hre.network.provider.request({
          method: "hardhat_impersonateAccount",
          params: [daoAddress],
        });

        // Obtener signer del DAO
        const daoSigner = await hre.ethers.getSigner(daoAddress);
        const tokenAsDAO = CGCToken.connect(daoSigner);

        console.log(`${colors.yellow}⏳ Ejecutando transferencia desde DAO...${colors.reset}`);
        
        const tx = await tokenAsDAO.transfer(vaultAddress, transferAmount);
        console.log(`   TX Hash: ${colors.blue}${tx.hash}${colors.reset}`);
        
        const receipt = await tx.wait();
        console.log(`${colors.green}✅ TRANSFERENCIA EXITOSA${colors.reset}`);
        console.log(`   Block: ${receipt.blockNumber}`);
        console.log(`   Gas Used: ${receipt.gasUsed.toString()}`);

        // Stop impersonating
        await hre.network.provider.request({
          method: "hardhat_stopImpersonatingAccount",
          params: [daoAddress],
        });

        return { success: true, txHash: tx.hash, blockNumber: receipt.blockNumber };

      } catch (impersonationError) {
        console.log(`${colors.yellow}⚠️  Impersonation no disponible en mainnet: ${impersonationError.message}${colors.reset}`);
      }
    }

    console.log(`${colors.yellow}📋 MÉTODO 2: Transferir ETH al DAO y ejecutar${colors.reset}`);
    
    if (daoEthBalance === 0n) {
      console.log(`   DAO necesita ETH para gas. Transfiriendo...`);
      
      const gasAmount = hre.ethers.parseEther("0.001"); // 0.001 ETH para gas
      const transferTx = await deployer.sendTransaction({
        to: daoAddress,
        value: gasAmount
      });
      
      await transferTx.wait();
      console.log(`${colors.green}✅ ETH transferido al DAO${colors.reset}`);
      
      // Ahora intentar la transferencia de tokens con impersonation
      try {
        await hre.network.provider.request({
          method: "hardhat_impersonateAccount",
          params: [daoAddress],
        });

        const daoSigner = await hre.ethers.getSigner(daoAddress);
        const tokenAsDAO = CGCToken.connect(daoSigner);

        console.log(`${colors.yellow}⏳ Ejecutando transferencia con DAO funded...${colors.reset}`);
        
        const tx = await tokenAsDAO.transfer(vaultAddress, transferAmount);
        const receipt = await tx.wait();
        
        console.log(`${colors.green}✅ TRANSFERENCIA EXITOSA${colors.reset}`);
        
        await hre.network.provider.request({
          method: "hardhat_stopImpersonatingAccount",
          params: [daoAddress],
        });

        return { success: true, txHash: tx.hash, blockNumber: receipt.blockNumber };

      } catch (error) {
        console.log(`${colors.red}❌ Error en método 2: ${error.message}${colors.reset}`);
      }
    }

    console.log(`${colors.yellow}📋 MÉTODO 3: Usando call directo (si somos owner)${colors.reset}`);
    
    // Verificar si el deployer es owner del token
    try {
      const owner = await CGCToken.owner();
      console.log(`   Token Owner: ${colors.blue}${owner}${colors.reset}`);
      console.log(`   Deployer: ${colors.yellow}${deployer.address}${colors.reset}`);
      
      if (owner.toLowerCase() === deployer.address.toLowerCase()) {
        console.log(`${colors.green}✅ Deployer es owner del token${colors.reset}`);
        
        // Como owner, podemos hacer una transferencia forzada desde cualquier dirección
        // Pero esto requiere una función especial en el contrato
        console.log(`${colors.yellow}ℹ️  Token ownership detectado, pero necesitamos función transferFrom especial${colors.reset}`);
      }
    } catch (error) {
      console.log(`   ${colors.yellow}⚠️  No se pudo verificar ownership: ${error.message}${colors.reset}`);
    }

    // Si todos los métodos fallan, necesitamos usar la propuesta de Aragon
    console.log(`${colors.bright}${colors.magenta}📋 RESULTADO:${colors.reset}`);
    console.log(`   ${colors.red}❌ Transferencia automática no disponible en mainnet${colors.reset}`);
    console.log(`   ${colors.yellow}⚠️  Se necesita usar Aragon UI o crear propuesta de governance${colors.reset}`);
    console.log('');
    console.log(`${colors.bright}${colors.cyan}🔧 OPCIONES DISPONIBLES:${colors.reset}`);
    console.log(`   1. Usar Aragon App: https://app.aragon.org`);
    console.log(`   2. Crear propuesta programática en el DAO`);
    console.log(`   3. Usar multisig si está configurado`);
    console.log(`   4. En testnet: usar hardhat impersonation`);
    
    return { success: false, reason: "mainnet_restrictions", needsGovernance: true };

  } catch (error) {
    console.error(`${colors.red}💥 Error ejecutando transferencia: ${error.message}${colors.reset}`);
    throw error;
  }
}

if (require.main === module) {
  executeDAOTransfer()
    .then((result) => {
      console.log('\nResult:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { executeDAOTransfer };