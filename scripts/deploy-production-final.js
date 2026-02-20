/**
 * @title CryptoGift DAO - Production Deployment Script
 * @author CryptoGift Wallets Team
 * @notice Script profesional y robusto para deployment en Base Mainnet
 * @dev Versión final con todas las validaciones y manejo de errores
 */

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: ".env.dao" });

// Colores para output profesional
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m"
};

// Configuración de deployment
const DEPLOYMENT_CONFIG = {
  // Configuración de red
  expectedChainId: 8453, // Base Mainnet
  minBalance: "0.002", // ETH mínimo requerido
  
  // Contratos externos
  aragonDAO: "0x3244DFBf9E5374DF2f106E89Cf7972E5D4C9ac31",
  easContract: "0x4200000000000000000000000000000000000021",
  schemaRegistry: "0x4200000000000000000000000000000000000020",
  
  // Configuración del token
  tokenName: "CryptoGift Coin",
  tokenSymbol: "CGC",
  totalSupply: "1000000", // 1 millón de tokens
  
  // Configuración del vault
  shadowMode: true, // Iniciar en modo shadow para testing seguro
  initialDailyCap: "1000", // 1000 tokens daily cap
  initialWeeklyCap: "5000", // 5000 tokens weekly cap  
  initialMonthlyCap: "15000", // 15000 tokens monthly cap
  
  // Confirmaciones para seguridad
  confirmations: 5,
  
  // Distribución inicial (tokenomics)
  distribution: {
    vault: 400000,     // 40% - Recompensas educativas
    treasury: 250000,  // 25% - Tesoro DAO  
    team: 150000,      // 15% - Core contributors
    ecosystem: 100000, // 10% - Desarrollo ecosistema
    liquidity: 50000,  // 5% - Liquidez
    emergency: 50000   // 5% - Reserva emergencia
  }
};

// Helper: Esperar confirmaciones
async function waitForConfirmations(tx, confirmations = DEPLOYMENT_CONFIG.confirmations) {
  console.log(`${colors.yellow}⏳ Esperando ${confirmations} confirmaciones...${colors.reset}`);
  const receipt = await tx.wait(confirmations);
  console.log(`${colors.green}✅ Confirmado en bloque ${receipt.blockNumber}${colors.reset}`);
  return receipt;
}

// Helper: Verificar contrato en Basescan
async function verifyContract(address, constructorArgs, contractPath) {
  console.log(`\n${colors.cyan}🔍 Verificando contrato en Basescan...${colors.reset}`);
  console.log(`   Dirección: ${address}`);
  
  try {
    await hre.run("verify:verify", {
      address: address,
      constructorArguments: constructorArgs,
      contract: contractPath
    });
    console.log(`${colors.green}✅ Contrato verificado exitosamente${colors.reset}`);
    return true;
  } catch (error) {
    if (error.message.toLowerCase().includes("already verified")) {
      console.log(`${colors.yellow}⚠️  Contrato ya estaba verificado${colors.reset}`);
      return true;
    } else {
      console.log(`${colors.red}❌ Error en verificación: ${error.message}${colors.reset}`);
      console.log(`   Puedes verificar manualmente más tarde`);
      return false;
    }
  }
}

// Helper: Guardar deployment data
async function saveDeploymentData(data) {
  const deploymentPath = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentPath)) {
    fs.mkdirSync(deploymentPath, { recursive: true });
  }
  
  const filename = `deployment-${data.network}-${Date.now()}.json`;
  const filepath = path.join(deploymentPath, filename);
  
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
  console.log(`${colors.green}📁 Datos guardados en: ${filename}${colors.reset}`);
  
  // También guardar como "latest"
  const latestPath = path.join(deploymentPath, `deployment-${data.network}-latest.json`);
  fs.writeFileSync(latestPath, JSON.stringify(data, null, 2));
  
  return filename;
}

// Helper: Actualizar archivo .env.dao
function updateEnvFile(contracts) {
  const envPath = path.resolve(__dirname, "../.env.dao");
  let envContent = fs.readFileSync(envPath, "utf8");
  
  // Actualizar direcciones de contratos
  envContent = envContent.replace(/CGC_TOKEN_ADDRESS=.*/g, `CGC_TOKEN_ADDRESS=${contracts.CGCToken}`);
  envContent = envContent.replace(/VAULT_ADDRESS=.*/g, `VAULT_ADDRESS=${contracts.GovTokenVault}`);
  envContent = envContent.replace(/CONDITION_ADDRESS=.*/g, `CONDITION_ADDRESS=${contracts.AllowedSignersCondition}`);
  envContent = envContent.replace(/MERKLE_DISTRIBUTOR_ADDRESS=.*/g, `MERKLE_DISTRIBUTOR_ADDRESS=${contracts.MerklePayouts}`);
  
  // Añadir timestamp de deployment
  const deploymentDate = new Date().toISOString();
  if (!envContent.includes("LAST_DEPLOYMENT_DATE")) {
    envContent += `\n# Último deployment\nLAST_DEPLOYMENT_DATE=${deploymentDate}\n`;
  } else {
    envContent = envContent.replace(/LAST_DEPLOYMENT_DATE=.*/g, `LAST_DEPLOYMENT_DATE=${deploymentDate}`);
  }
  
  fs.writeFileSync(envPath, envContent);
  console.log(`${colors.green}✅ Archivo .env.dao actualizado${colors.reset}`);
}

// Función principal de deployment
async function main() {
  console.log(`\n${colors.bright}${colors.blue}`);
  console.log("╔═══════════════════════════════════════════════════════════════════╗");
  console.log("║                                                                   ║");
  console.log("║           🏛️  CRYPTOGIFT DAO - PRODUCTION DEPLOYMENT              ║");
  console.log("║                        BASE MAINNET                              ║");
  console.log("║                    VERSIÓN FINAL Y DEFINITIVA                    ║");
  console.log("║                                                                   ║");
  console.log("╚═══════════════════════════════════════════════════════════════════╝");
  console.log(`${colors.reset}\n`);
  
  // Obtener signer
  const [deployer] = await hre.ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  
  // Validar red
  const network = await hre.ethers.provider.getNetwork();
  const chainId = Number(network.chainId);
  
  console.log(`${colors.cyan}📊 Información de Red:${colors.reset}`);
  console.log(`   Red: ${hre.network.name}`);
  console.log(`   Chain ID: ${chainId}`);
  console.log(`   RPC: ${hre.network.config.url}`);
  console.log(`   Deployer: ${deployerAddress}`);
  
  // Verificar chain ID correcto
  if (hre.network.name === "base" && chainId !== DEPLOYMENT_CONFIG.expectedChainId) {
    throw new Error(`Chain ID incorrecto. Esperado: ${DEPLOYMENT_CONFIG.expectedChainId}, Actual: ${chainId}`);
  }
  
  // Verificar balance  
  const { formatEther, parseEther, formatUnits } = hre.ethers;
  const balance = await hre.ethers.provider.getBalance(deployerAddress);
  const balanceETH = formatEther(balance);
  console.log(`   Balance: ${balanceETH} ETH`);
  
  const minBalance = parseEther(DEPLOYMENT_CONFIG.minBalance);
  if (balance < minBalance) {
    throw new Error(`Balance insuficiente. Mínimo requerido: ${DEPLOYMENT_CONFIG.minBalance} ETH`);
  }
  
  // Obtener gas price
  const feeData = await hre.ethers.provider.getFeeData();
  const gasPrice = feeData.gasPrice;
  console.log(`   Gas Price: ${formatUnits(gasPrice || 0n, "gwei")} Gwei`);
  
  console.log(`\n${colors.cyan}🏗️ Configuración de Deployment:${colors.reset}`);
  console.log(`   Aragon DAO: ${DEPLOYMENT_CONFIG.aragonDAO}`);
  console.log(`   EAS Contract: ${DEPLOYMENT_CONFIG.easContract}`);
  console.log(`   Token: ${DEPLOYMENT_CONFIG.tokenName} (${DEPLOYMENT_CONFIG.tokenSymbol})`);
  console.log(`   Total Supply: ${DEPLOYMENT_CONFIG.totalSupply} CGC`);
  console.log(`   Shadow Mode: ${DEPLOYMENT_CONFIG.shadowMode ? "ACTIVO" : "INACTIVO"}`);
  
  // Tracking de deployment
  const deploymentData = {
    network: hre.network.name,
    chainId: chainId,
    deployer: deployerAddress,
    timestamp: new Date().toISOString(),
    config: DEPLOYMENT_CONFIG,
    contracts: {},
    transactions: [],
    gasUsed: "0",
    totalCost: "0"
  };
  
  let totalGasUsed = 0n; // Using BigInt for ethers v6
  
  console.log(`\n${colors.bright}${colors.magenta}═══════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}📦 INICIANDO DEPLOYMENT DE CONTRATOS${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}═══════════════════════════════════════════════${colors.reset}\n`);
  
  try {
    // ==========================================
    // 1. DEPLOY CGC TOKEN
    // ==========================================
    console.log(`${colors.bright}${colors.yellow}[1/4] Desplegando CGC Token...${colors.reset}`);
    
    const CGCToken = await hre.ethers.getContractFactory("CGCToken");
    const cgcToken = await CGCToken.deploy(
      DEPLOYMENT_CONFIG.aragonDAO  // CGCToken only needs the DAO address
    );
    
    const cgcDeployTx = cgcToken.deploymentTransaction();
    console.log(`   Tx Hash: ${cgcDeployTx.hash}`);
    const cgcReceipt = await waitForConfirmations(cgcDeployTx);
    
    const cgcTokenAddress = await cgcToken.getAddress();
    console.log(`${colors.green}✅ CGC Token desplegado: ${cgcTokenAddress}${colors.reset}`);
    console.log(`   Gas usado: ${cgcReceipt.gasUsed.toString()}`);
    console.log(`   Ver en Basescan: https://basescan.org/address/${cgcTokenAddress}`);
    
    totalGasUsed = totalGasUsed + cgcReceipt.gasUsed;
    
    deploymentData.contracts.CGCToken = {
      address: cgcTokenAddress,
      txHash: cgcDeployTx.hash,
      blockNumber: cgcReceipt.blockNumber,
      gasUsed: cgcReceipt.gasUsed.toString(),
      constructorArgs: [
        DEPLOYMENT_CONFIG.aragonDAO
      ]
    };
    
    // ==========================================
    // 2. DEPLOY GOVTOKENVAULT
    // ==========================================
    console.log(`\n${colors.bright}${colors.yellow}[2/4] Desplegando GovTokenVault...${colors.reset}`);
    
    const GovTokenVault = await hre.ethers.getContractFactory("GovTokenVault");
    const vault = await GovTokenVault.deploy(
      cgcTokenAddress,
      DEPLOYMENT_CONFIG.aragonDAO,
      DEPLOYMENT_CONFIG.easContract,
      parseEther(DEPLOYMENT_CONFIG.initialDailyCap),
      parseEther(DEPLOYMENT_CONFIG.initialWeeklyCap),
      parseEther(DEPLOYMENT_CONFIG.initialMonthlyCap)
    );
    
    const vaultDeployTx = vault.deploymentTransaction();
    console.log(`   Tx Hash: ${vaultDeployTx.hash}`);
    const vaultReceipt = await waitForConfirmations(vaultDeployTx);
    
    const vaultAddress = await vault.getAddress();
    console.log(`${colors.green}✅ GovTokenVault desplegado: ${vaultAddress}${colors.reset}`);
    console.log(`   Shadow Mode: ${DEPLOYMENT_CONFIG.shadowMode ? colors.yellow + "ACTIVO (Testing seguro)" : colors.green + "INACTIVO (Producción)"}${colors.reset}`);
    console.log(`   Gas usado: ${vaultReceipt.gasUsed.toString()}`);
    console.log(`   Ver en Basescan: https://basescan.org/address/${vaultAddress}`);
    
    totalGasUsed = totalGasUsed + vaultReceipt.gasUsed;
    
    deploymentData.contracts.GovTokenVault = {
      address: vaultAddress,
      txHash: vaultDeployTx.hash,
      blockNumber: vaultReceipt.blockNumber,
      gasUsed: vaultReceipt.gasUsed.toString(),
      constructorArgs: [
        cgcTokenAddress,
        DEPLOYMENT_CONFIG.aragonDAO,
        DEPLOYMENT_CONFIG.easContract,
        parseEther(DEPLOYMENT_CONFIG.initialDailyCap).toString(),
        parseEther(DEPLOYMENT_CONFIG.initialWeeklyCap).toString(),
        parseEther(DEPLOYMENT_CONFIG.initialMonthlyCap).toString()
      ]
    };
    
    // ==========================================
    // 3. DEPLOY ALLOWEDSIGNERSCONDITION
    // ==========================================
    console.log(`\n${colors.bright}${colors.yellow}[3/4] Desplegando AllowedSignersCondition...${colors.reset}`);
    
    const AllowedSignersCondition = await hre.ethers.getContractFactory("AllowedSignersCondition");
    const condition = await AllowedSignersCondition.deploy(
      DEPLOYMENT_CONFIG.aragonDAO,
      vaultAddress,  // vault address from previous deployment
      [DEPLOYMENT_CONFIG.aragonDAO, deployerAddress]  // initial signers
    );
    
    const conditionDeployTx = condition.deploymentTransaction();
    console.log(`   Tx Hash: ${conditionDeployTx.hash}`);
    const conditionReceipt = await waitForConfirmations(conditionDeployTx);
    
    const conditionAddress = await condition.getAddress();
    console.log(`${colors.green}✅ AllowedSignersCondition desplegado: ${conditionAddress}${colors.reset}`);
    console.log(`   Firmantes iniciales: Aragon DAO + Deployer`);
    console.log(`   Gas usado: ${conditionReceipt.gasUsed.toString()}`);
    console.log(`   Ver en Basescan: https://basescan.org/address/${conditionAddress}`);
    
    totalGasUsed = totalGasUsed + conditionReceipt.gasUsed;
    
    deploymentData.contracts.AllowedSignersCondition = {
      address: conditionAddress,
      txHash: conditionDeployTx.hash,
      blockNumber: conditionReceipt.blockNumber,
      gasUsed: conditionReceipt.gasUsed.toString(),
      constructorArgs: [
        DEPLOYMENT_CONFIG.aragonDAO,
        vaultAddress,
        [DEPLOYMENT_CONFIG.aragonDAO, deployerAddress]
      ]
    };
    
    // ==========================================
    // 4. DEPLOY MERKLEPAYOUTS
    // ==========================================
    console.log(`\n${colors.bright}${colors.yellow}[4/4] Desplegando MerklePayouts...${colors.reset}`);
    
    const MerklePayouts = await hre.ethers.getContractFactory("MerklePayouts");
    const merkle = await MerklePayouts.deploy(
      cgcTokenAddress,
      DEPLOYMENT_CONFIG.aragonDAO
    );
    
    const merkleDeployTx = merkle.deploymentTransaction();
    console.log(`   Tx Hash: ${merkleDeployTx.hash}`);
    const merkleReceipt = await waitForConfirmations(merkleDeployTx);
    
    const merkleAddress = await merkle.getAddress();
    console.log(`${colors.green}✅ MerklePayouts desplegado: ${merkleAddress}${colors.reset}`);
    console.log(`   Gas usado: ${merkleReceipt.gasUsed.toString()}`);
    console.log(`   Ver en Basescan: https://basescan.org/address/${merkleAddress}`);
    
    totalGasUsed = totalGasUsed + merkleReceipt.gasUsed;
    
    deploymentData.contracts.MerklePayouts = {
      address: merkleAddress,
      txHash: merkleDeployTx.hash,
      blockNumber: merkleReceipt.blockNumber,
      gasUsed: merkleReceipt.gasUsed.toString(),
      constructorArgs: [
        cgcTokenAddress,
        DEPLOYMENT_CONFIG.aragonDAO
      ]
    };
    
    // ==========================================
    // CALCULAR COSTOS TOTALES
    // ==========================================
    const totalCost = totalGasUsed * gasPrice;
    deploymentData.gasUsed = totalGasUsed.toString();
    deploymentData.totalCost = formatEther(totalCost);
    
    console.log(`\n${colors.bright}${colors.magenta}═══════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.bright}📊 RESUMEN DE DEPLOYMENT${colors.reset}`);
    console.log(`${colors.bright}${colors.magenta}═══════════════════════════════════════════════${colors.reset}`);
    console.log(`   Gas total usado: ${totalGasUsed.toString()}`);
    console.log(`   Costo total: ${deploymentData.totalCost} ETH`);
    // Balance restante calculation removed - already shown at the start
    
    // ==========================================
    // GUARDAR DATOS Y ACTUALIZAR .ENV
    // ==========================================
    console.log(`\n${colors.cyan}💾 Guardando información de deployment...${colors.reset}`);
    
    const filename = await saveDeploymentData(deploymentData);
    updateEnvFile(deploymentData.contracts);
    
    // ==========================================
    // VERIFICACIÓN EN BASESCAN
    // ==========================================
    console.log(`\n${colors.bright}${colors.cyan}═══════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.bright}🔍 VERIFICANDO CONTRATOS EN BASESCAN${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}═══════════════════════════════════════════════${colors.reset}`);
    
    // Esperar un poco antes de verificar
    console.log(`\n${colors.yellow}⏳ Esperando 30 segundos antes de verificar...${colors.reset}`);
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    // Verificar CGC Token
    console.log(`\n${colors.yellow}[1/4] Verificando CGC Token...${colors.reset}`);
    await verifyContract(
      cgcTokenAddress,
      deploymentData.contracts.CGCToken.constructorArgs,
      "contracts/CGCToken.sol:CGCToken"
    );
    
    // Verificar GovTokenVault
    console.log(`\n${colors.yellow}[2/4] Verificando GovTokenVault...${colors.reset}`);
    await verifyContract(
      vaultAddress,
      deploymentData.contracts.GovTokenVault.constructorArgs,
      "contracts/GovTokenVault.sol:GovTokenVault"
    );
    
    // Verificar AllowedSignersCondition
    console.log(`\n${colors.yellow}[3/4] Verificando AllowedSignersCondition...${colors.reset}`);
    await verifyContract(
      conditionAddress,
      deploymentData.contracts.AllowedSignersCondition.constructorArgs,
      "contracts/conditions/AllowedSignersCondition.sol:AllowedSignersCondition"
    );
    
    // Verificar MerklePayouts
    console.log(`\n${colors.yellow}[4/4] Verificando MerklePayouts...${colors.reset}`);
    await verifyContract(
      merkleAddress,
      deploymentData.contracts.MerklePayouts.constructorArgs,
      "contracts/MerklePayouts.sol:MerklePayouts"
    );
    
    // ==========================================
    // MENSAJE FINAL DE ÉXITO
    // ==========================================
    console.log(`\n${colors.bright}${colors.green}`);
    console.log("╔═══════════════════════════════════════════════════════════════════╗");
    console.log("║                                                                   ║");
    console.log("║              🎉 DEPLOYMENT COMPLETADO EXITOSAMENTE! 🎉            ║");
    console.log("║                                                                   ║");
    console.log("║                  CRYPTOGIFT DAO ESTÁ LIVE EN                     ║");
    console.log("║                        BASE MAINNET                              ║");
    console.log("║                                                                   ║");
    console.log("╚═══════════════════════════════════════════════════════════════════╝");
    console.log(`${colors.reset}\n`);
    
    console.log(`${colors.bright}📋 DIRECCIONES DE CONTRATOS:${colors.reset}`);
    console.log(`   CGC Token:              ${cgcTokenAddress}`);
    console.log(`   GovTokenVault:          ${vaultAddress}`);
    console.log(`   AllowedSignersCondition: ${conditionAddress}`);
    console.log(`   MerklePayouts:          ${merkleAddress}`);
    
    console.log(`\n${colors.bright}📚 PRÓXIMOS PASOS:${colors.reset}`);
    console.log(`   1. ✅ Transferir ${DEPLOYMENT_CONFIG.distribution.vault} CGC al vault`);
    console.log(`   2. ✅ Configurar permisos en Aragon DAO`);
    console.log(`   3. ✅ Registrar schema en EAS`);
    console.log(`   4. ✅ Configurar bots de Discord/Telegram`);
    console.log(`   5. ✅ Actualizar dashboard con nuevas direcciones`);
    console.log(`   6. ✅ Realizar pruebas en shadow mode`);
    console.log(`   7. ✅ Desactivar shadow mode cuando esté listo`);
    
    console.log(`\n${colors.bright}${colors.blue}🔗 ENLACES IMPORTANTES:${colors.reset}`);
    console.log(`   Aragon DAO: https://app.aragon.org/dao/base-mainnet/${DEPLOYMENT_CONFIG.aragonDAO}`);
    console.log(`   Token en Basescan: https://basescan.org/token/${cgcTokenAddress}`);
    console.log(`   Vault en Basescan: https://basescan.org/address/${vaultAddress}`);
    console.log(`   Documentación: https://docs.cryptogift-wallets.com`);
    
    console.log(`\n${colors.bright}${colors.green}✨ CryptoGift DAO está completamente operativo! ✨${colors.reset}\n`);
    
  } catch (error) {
    console.error(`\n${colors.red}${colors.bright}❌ ERROR EN DEPLOYMENT:${colors.reset}`);
    console.error(`${colors.red}${error.message}${colors.reset}`);
    
    // Guardar estado parcial si hay algo
    if (Object.keys(deploymentData.contracts).length > 0) {
      console.log(`\n${colors.yellow}⚠️ Guardando estado parcial del deployment...${colors.reset}`);
      deploymentData.status = "FAILED";
      deploymentData.error = error.message;
      await saveDeploymentData(deploymentData);
    }
    
    throw error;
  }
}

// Ejecutar deployment
main()
  .then(() => {
    console.log(`${colors.green}✅ Script finalizado exitosamente${colors.reset}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error(`${colors.red}❌ Script falló:${colors.reset}`, error);
    process.exit(1);
  });