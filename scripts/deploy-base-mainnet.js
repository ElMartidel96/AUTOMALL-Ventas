// Deployment script para Base Mainnet - CryptoGift DAO
// Script profesional, robusto y completo

async function main() {
  const hre = require("hardhat");
  
  console.log("\n==================================================");
  console.log("   🏛️  CryptoGift DAO - Base Mainnet Deployment");
  console.log("==================================================\n");
  
  // Compilar contratos
  console.log("📦 Compilando contratos...");
  await hre.run('compile');
  
  // Obtener deployer
  const [deployer] = await hre.ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  
  // Verificar red
  const network = await hre.ethers.provider.getNetwork();
  const chainId = network.chainId;
  
  console.log("📊 Información de red:");
  console.log(`   Red: ${hre.network.name}`);
  console.log(`   Chain ID: ${chainId}`);
  console.log(`   Deployer: ${deployerAddress}`);
  
  // Verificar balance
  const balance = await hre.ethers.provider.getBalance(deployerAddress);
  console.log(`   Balance: ${hre.ethers.formatEther(balance)} ETH\n`);
  
  if (balance < hre.ethers.parseEther("0.001")) {
    throw new Error("Balance insuficiente. Se necesita al menos 0.001 ETH");
  }
  
  // Configuración
  const config = {
    aragonDAO: "0x3244DFBf9E5374DF2f106E89Cf7972E5D4C9ac31",
    easContract: "0x4200000000000000000000000000000000000021",
    tokenName: "CryptoGift Coin",
    tokenSymbol: "CGC",
    shadowMode: true
  };
  
  console.log("🚀 Iniciando deployment...\n");
  
  try {
    // 1. Deploy CGC Token
    console.log("[1/4] Desplegando CGC Token...");
    const CGCToken = await hre.ethers.getContractFactory("CGCToken");
    const cgcToken = await CGCToken.deploy(
      config.tokenName,
      config.tokenSymbol,
      deployerAddress
    );
    await cgcToken.waitForDeployment();
    const cgcTokenAddress = await cgcToken.getAddress();
    console.log(`✅ CGC Token desplegado en: ${cgcTokenAddress}`);
    
    // 2. Deploy GovTokenVault
    console.log("\n[2/4] Desplegando GovTokenVault...");
    const GovTokenVault = await hre.ethers.getContractFactory("GovTokenVault");
    const vault = await GovTokenVault.deploy(
      cgcTokenAddress,
      config.aragonDAO,
      config.easContract,
      config.shadowMode
    );
    await vault.waitForDeployment();
    const vaultAddress = await vault.getAddress();
    console.log(`✅ GovTokenVault desplegado en: ${vaultAddress}`);
    console.log(`   Shadow Mode: ${config.shadowMode ? "ACTIVO" : "INACTIVO"}`);
    
    // 3. Deploy AllowedSignersCondition
    console.log("\n[3/4] Desplegando AllowedSignersCondition...");
    const AllowedSignersCondition = await hre.ethers.getContractFactory("AllowedSignersCondition");
    const condition = await AllowedSignersCondition.deploy(
      config.aragonDAO,
      [config.aragonDAO, deployerAddress]
    );
    await condition.waitForDeployment();
    const conditionAddress = await condition.getAddress();
    console.log(`✅ AllowedSignersCondition desplegado en: ${conditionAddress}`);
    
    // 4. Deploy MerklePayouts
    console.log("\n[4/4] Desplegando MerklePayouts...");
    const MerklePayouts = await hre.ethers.getContractFactory("MerklePayouts");
    const merkle = await MerklePayouts.deploy(
      cgcTokenAddress,
      config.aragonDAO
    );
    await merkle.waitForDeployment();
    const merkleAddress = await merkle.getAddress();
    console.log(`✅ MerklePayouts desplegado en: ${merkleAddress}`);
    
    // Resumen
    console.log("\n==================================================");
    console.log("         🎉 DEPLOYMENT COMPLETADO CON ÉXITO!");
    console.log("==================================================\n");
    console.log("📋 Direcciones de contratos:");
    console.log(`   CGC Token:        ${cgcTokenAddress}`);
    console.log(`   GovTokenVault:    ${vaultAddress}`);
    console.log(`   AllowedSigners:   ${conditionAddress}`);
    console.log(`   MerklePayouts:    ${merkleAddress}`);
    
    // Guardar en archivo
    const fs = require("fs");
    const path = require("path");
    const deploymentData = {
      network: hre.network.name,
      chainId: chainId.toString(),
      deployer: deployerAddress,
      timestamp: new Date().toISOString(),
      contracts: {
        CGCToken: cgcTokenAddress,
        GovTokenVault: vaultAddress,
        AllowedSignersCondition: conditionAddress,
        MerklePayouts: merkleAddress
      }
    };
    
    const deploymentPath = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentPath)) {
      fs.mkdirSync(deploymentPath, { recursive: true });
    }
    
    const filename = `deployment-${hre.network.name}-${Date.now()}.json`;
    const filepath = path.join(deploymentPath, filename);
    fs.writeFileSync(filepath, JSON.stringify(deploymentData, null, 2));
    console.log(`\n📁 Datos guardados en: ${filename}`);
    
    // Actualizar .env.dao
    console.log("\n📝 Actualizando .env.dao...");
    const envPath = path.resolve(__dirname, "../.env.dao");
    let envContent = fs.readFileSync(envPath, "utf8");
    
    envContent = envContent.replace(/CGC_TOKEN_ADDRESS=.*/g, `CGC_TOKEN_ADDRESS=${cgcTokenAddress}`);
    envContent = envContent.replace(/VAULT_ADDRESS=.*/g, `VAULT_ADDRESS=${vaultAddress}`);
    envContent = envContent.replace(/CONDITION_ADDRESS=.*/g, `CONDITION_ADDRESS=${conditionAddress}`);
    envContent = envContent.replace(/MERKLE_DISTRIBUTOR_ADDRESS=.*/g, `MERKLE_DISTRIBUTOR_ADDRESS=${merkleAddress}`);
    
    fs.writeFileSync(envPath, envContent);
    console.log("✅ .env.dao actualizado");
    
    // Verificación en Basescan
    console.log("\n🔍 Para verificar en Basescan:");
    console.log("1. CGC Token:");
    console.log(`   npx hardhat verify --network base ${cgcTokenAddress} "${config.tokenName}" "${config.tokenSymbol}" ${deployerAddress}`);
    console.log("\n2. GovTokenVault:");
    console.log(`   npx hardhat verify --network base ${vaultAddress} ${cgcTokenAddress} ${config.aragonDAO} ${config.easContract} ${config.shadowMode}`);
    console.log("\n3. AllowedSignersCondition:");
    console.log(`   npx hardhat verify --network base ${conditionAddress} ${config.aragonDAO} '["${config.aragonDAO}","${deployerAddress}"]'`);
    console.log("\n4. MerklePayouts:");
    console.log(`   npx hardhat verify --network base ${merkleAddress} ${cgcTokenAddress} ${config.aragonDAO}`);
    
    console.log("\n📚 Próximos pasos:");
    console.log("   1. Verificar contratos en Basescan");
    console.log("   2. Transferir tokens al vault");
    console.log("   3. Configurar permisos en Aragon");
    console.log("   4. Registrar schema EAS");
    console.log("   5. Configurar dashboard");
    console.log("\n✨ CryptoGift DAO está live en Base Mainnet! ✨\n");
    
  } catch (error) {
    console.error("\n❌ Error en deployment:", error);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });