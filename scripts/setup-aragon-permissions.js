#!/usr/bin/env node
/**
 * 🏛️ CONFIGURAR PERMISOS DE ARAGON DAO
 * Permite que el vault reciba tokens del treasury del DAO automáticamente
 * Sin necesidad de propuestas para cada transferencia
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

async function setupAragonPermissions() {
  try {
    console.log(`${colors.bright}${colors.cyan}🏛️ CONFIGURAR PERMISOS DE ARAGON DAO${colors.reset}`);
    console.log('═'.repeat(60));

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

    // Conectar al deployer (admin inicial del DAO)
    const [deployer] = await hre.ethers.getSigners();
    console.log(`🔑 Admin/Deployer: ${colors.yellow}${deployer.address}${colors.reset}`);

    // Para interactuar con Aragon, necesitamos las interfaces correctas
    // Aragon DAO implementa ERC165 y tiene funciones específicas
    
    console.log(`${colors.yellow}📋 PASO 1: Verificar acceso administrativo al DAO${colors.reset}`);
    
    // Intentar obtener información básica del DAO
    const daoContract = await hre.ethers.getContractAt(
      "IERC165", // Interface básica que todo DAO debe implementar
      daoAddress
    );

    // Verificar si el contrato responde
    try {
      const supportsInterface = await daoContract.supportsInterface("0x01ffc9a7"); // ERC165
      console.log(`   DAO responde: ${colors.green}✅${colors.reset} (ERC165: ${supportsInterface})`);
    } catch (error) {
      console.log(`   DAO no responde: ${colors.red}❌${colors.reset}`);
      throw new Error(`DAO no accesible: ${error.message}`);
    }

    console.log(`${colors.yellow}📋 PASO 2: Configurar permisos para transferencia automática${colors.reset}`);
    
    // Para Aragon DAO, necesitamos crear una acción que:
    // 1. Otorgue permisos al vault para recibir tokens
    // 2. Execute la transferencia inicial de 400K tokens
    
    // Crear la call data para la transferencia
    const CGCToken = await hre.ethers.getContractAt("CGCToken", tokenAddress);
    const transferAmount = hre.ethers.parseEther("400000");
    
    const transferCalldata = CGCToken.interface.encodeFunctionData("transfer", [
      vaultAddress,
      transferAmount
    ]);

    console.log(`   Preparando transferencia de 400,000 CGC...`);
    console.log(`   Calldata: ${colors.blue}${transferCalldata}${colors.reset}`);
    
    // Para Aragon, necesitamos crear una propuesta o ejecutar directamente si somos admin
    // Primero intentemos una transferencia directa usando el patrón de Aragon
    
    console.log(`${colors.yellow}📋 PASO 3: Intentar transferencia directa desde DAO${colors.reset}`);
    
    // Método 1: Si el deployer tiene permisos administrativos en el DAO
    try {
      // Crear una action para ejecutar en el DAO
      const action = {
        to: tokenAddress,
        value: 0,
        data: transferCalldata
      };

      console.log(`   Acción preparada: Transfer 400K CGC al vault`);
      console.log(`   Target: ${action.to}`);
      console.log(`   Value: ${action.value} ETH`);
      console.log(`   Data: ${action.data.slice(0, 42)}...`);
      
      // Para un DAO de Aragon, usualmente hay una función execute() o similar
      // Pero necesitamos los ABIs específicos del DAO deployed
      
      console.log(`${colors.magenta}ℹ️  NOTA: Para completar esta transferencia necesitamos:${colors.reset}`);
      console.log(`   1. ABI específico del DAO Aragon desplegado`);
      console.log(`   2. O crear una propuesta de governance`);
      console.log(`   3. O usar la interfaz web de Aragon para ejecutar la acción`);
      
    } catch (error) {
      console.log(`   ${colors.yellow}⚠️  Transferencia directa no disponible: ${error.message}${colors.reset}`);
    }

    console.log(`${colors.yellow}📋 PASO 4: Crear propuesta de governance (Plan B)${colors.reset}`);
    
    // Crear metadata para una propuesta
    const proposalMetadata = {
      title: "Transfer 400K CGC to GovTokenVault",
      description: "Initial token distribution according to tokenomics: Transfer 400,000 CGC tokens from DAO treasury to GovTokenVault contract for governance operations.",
      actions: [{
        to: tokenAddress,
        value: "0",
        data: transferCalldata,
        description: "Transfer 400,000 CGC tokens to vault"
      }],
      timestamp: new Date().toISOString()
    };

    // Guardar propuesta para uso manual
    const proposalFile = `aragon-proposal-${Date.now()}.json`;
    fs.writeFileSync(proposalFile, JSON.stringify(proposalMetadata, null, 2));
    
    console.log(`${colors.green}✅ Propuesta creada: ${proposalFile}${colors.reset}`);
    
    // Actualizar deployment data
    deploymentData.aragonSetup = {
      timestamp: new Date().toISOString(),
      daoAddress,
      proposalFile,
      transferAmount: "400000",
      targetVault: vaultAddress,
      status: "pending_execution"
    };

    fs.writeFileSync(
      'deployments/deployment-base-latest.json', 
      JSON.stringify(deploymentData, null, 2)
    );

    console.log(`${colors.bright}${colors.cyan}📋 RESUMEN DE CONFIGURACIÓN:${colors.reset}`);
    console.log(`   DAO Address: ${colors.magenta}${daoAddress}${colors.reset}`);
    console.log(`   Vault Address: ${colors.blue}${vaultAddress}${colors.reset}`);
    console.log(`   Transfer Amount: ${colors.bright}400,000 CGC${colors.reset}`);
    console.log(`   Proposal File: ${colors.green}${proposalFile}${colors.reset}`);
    console.log('');
    
    console.log(`${colors.bright}${colors.yellow}🚀 PRÓXIMOS PASOS:${colors.reset}`);
    console.log(`   1. Usar Aragon App UI para ejecutar la propuesta`);
    console.log(`   2. O investigar ABI del DAO para ejecutar programáticamente`);
    console.log(`   3. Verificar transferencia con: node scripts/check-dao-balance.js`);
    
    return {
      daoAddress,
      vaultAddress,
      proposalFile,
      transferAmount: "400000",
      status: "configured"
    };

  } catch (error) {
    console.error(`${colors.red}💥 Error configurando Aragon: ${error.message}${colors.reset}`);
    throw error;
  }
}

if (require.main === module) {
  setupAragonPermissions()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { setupAragonPermissions };