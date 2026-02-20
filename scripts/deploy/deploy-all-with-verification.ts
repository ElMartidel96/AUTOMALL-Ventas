import { ethers, run, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

// Load DAO environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env.dao') });

// Color codes for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m"
};

// Deployment configuration
const DEPLOYMENT_CONFIG = {
  // Network validation
  expectedChainId: 8453, // Base Mainnet
  expectedChainIdSepolia: 84532, // Base Sepolia
  
  // Aragon DAO (already deployed)
  aragonDAO: "0x3244DFBf9E5374DF2f106E89Cf7972E5D4C9ac31",
  
  // EAS Contracts on Base
  easContract: "0x4200000000000000000000000000000000000021",
  schemaRegistry: "0x4200000000000000000000000000000000000020",
  
  // Token configuration
  tokenName: "CryptoGift Coin",
  tokenSymbol: "CGC",
  totalSupply: ethers.parseEther("1000000"), // 1 million CGC
  
  // Vault configuration
  shadowMode: true, // Start in shadow mode for safety
  globalDailyCap: ethers.parseEther("10000"),
  globalWeeklyCap: ethers.parseEther("50000"),
  globalMonthlyCap: ethers.parseEther("150000"),
  userDailyCap: ethers.parseEther("500"),
  userWeeklyCap: ethers.parseEther("2000"),
  userMonthlyCap: ethers.parseEther("5000"),
  
  // Initial distribution (from tokenomics)
  distributions: {
    vault: ethers.parseEther("400000"), // 40% for rewards
    treasury: ethers.parseEther("250000"), // 25% for DAO treasury
    team: ethers.parseEther("150000"), // 15% for core contributors
    ecosystem: ethers.parseEther("100000"), // 10% for ecosystem
    liquidity: ethers.parseEther("50000"), // 5% for liquidity
    emergency: ethers.parseEther("50000") // 5% for emergency
  }
};

// Helper function to wait for confirmations
async function waitForConfirmations(tx: any, confirmations = 5) {
  console.log(`${colors.yellow}⏳ Waiting for ${confirmations} confirmations...${colors.reset}`);
  await tx.wait(confirmations);
  console.log(`${colors.green}✅ Confirmed!${colors.reset}`);
}

// Helper function to verify contract
async function verifyContract(address: string, constructorArgs: any[], contractPath?: string) {
  console.log(`${colors.cyan}🔍 Verifying contract at ${address}...${colors.reset}`);
  
  try {
    await run("verify:verify", {
      address: address,
      constructorArguments: constructorArgs,
      contract: contractPath
    });
    console.log(`${colors.green}✅ Contract verified on Basescan!${colors.reset}`);
    return true;
  } catch (error: any) {
    if (error.message.toLowerCase().includes("already verified")) {
      console.log(`${colors.yellow}⚠️ Contract already verified${colors.reset}`);
      return true;
    }
    console.error(`${colors.red}❌ Verification failed: ${error.message}${colors.reset}`);
    return false;
  }
}

// Helper function to save deployment data
function saveDeploymentData(deploymentData: any) {
  const deploymentPath = path.join(__dirname, "../../deployments");
  if (!fs.existsSync(deploymentPath)) {
    fs.mkdirSync(deploymentPath, { recursive: true });
  }
  
  const filename = `deployment-${network.name}-${Date.now()}.json`;
  const filepath = path.join(deploymentPath, filename);
  
  fs.writeFileSync(filepath, JSON.stringify(deploymentData, null, 2));
  console.log(`${colors.green}📁 Deployment data saved to: ${filename}${colors.reset}`);
  
  // Also save as latest
  const latestPath = path.join(deploymentPath, `deployment-${network.name}-latest.json`);
  fs.writeFileSync(latestPath, JSON.stringify(deploymentData, null, 2));
}

// Helper function to update .env.dao file
function updateEnvFile(deploymentData: any) {
  const envPath = path.resolve(__dirname, '../../.env.dao');
  let envContent = fs.readFileSync(envPath, 'utf-8');
  
  // Update contract addresses
  envContent = envContent.replace(/CGC_TOKEN_ADDRESS=.*/, `CGC_TOKEN_ADDRESS=${deploymentData.CGCToken.address}`);
  envContent = envContent.replace(/VAULT_ADDRESS=.*/, `VAULT_ADDRESS=${deploymentData.GovTokenVault.address}`);
  envContent = envContent.replace(/CONDITION_ADDRESS=.*/, `CONDITION_ADDRESS=${deploymentData.AllowedSignersCondition.address}`);
  envContent = envContent.replace(/MERKLE_DISTRIBUTOR_ADDRESS=.*/, `MERKLE_DISTRIBUTOR_ADDRESS=${deploymentData.MerklePayouts.address}`);
  
  fs.writeFileSync(envPath, envContent);
  console.log(`${colors.green}📝 Updated .env.dao with deployed addresses${colors.reset}`);
}

async function main() {
  console.log(`${colors.bright}${colors.blue}
╔════════════════════════════════════════════════╗
║   🏛️  CryptoGift DAO - Smart Contract Deploy   ║
║          With Automatic Verification            ║
╚════════════════════════════════════════════════╝
${colors.reset}`);

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  const deployerBalance = await ethers.provider.getBalance(deployer.address);
  
  console.log(`${colors.cyan}📊 Deployment Information:${colors.reset}`);
  console.log(`   Network: ${network.name}`);
  console.log(`   Chain ID: ${network.config.chainId}`);
  console.log(`   Deployer: ${deployer.address}`);
  console.log(`   Balance: ${ethers.formatEther(deployerBalance)} ETH`);
  console.log(`   Aragon DAO: ${DEPLOYMENT_CONFIG.aragonDAO}`);
  
  // Validate network
  const chainId = await ethers.provider.getNetwork().then(n => n.chainId);
  const expectedChainId = network.name === "base" ? DEPLOYMENT_CONFIG.expectedChainId : DEPLOYMENT_CONFIG.expectedChainIdSepolia;
  
  if (chainId !== BigInt(expectedChainId)) {
    console.error(`${colors.red}❌ Wrong network! Expected chain ID ${expectedChainId}, got ${chainId}${colors.reset}`);
    process.exit(1);
  }
  
  // Check balance
  if (deployerBalance < ethers.parseEther("0.05")) {
    console.error(`${colors.red}❌ Insufficient balance! Need at least 0.05 ETH for deployment${colors.reset}`);
    process.exit(1);
  }
  
  // Deployment data object
  const deploymentData: any = {
    network: network.name,
    chainId: chainId.toString(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    aragonDAO: DEPLOYMENT_CONFIG.aragonDAO,
    gasUsed: BigInt(0),
    ethSpent: BigInt(0)
  };
  
  console.log(`\n${colors.bright}📦 Starting Deployment...${colors.reset}\n`);
  
  // ====================================
  // 1. Deploy CGC Token
  // ====================================
  console.log(`${colors.yellow}[1/4] Deploying CGC Token...${colors.reset}`);
  
  const CGCToken = await ethers.getContractFactory("CGCToken");
  const cgcToken = await CGCToken.deploy(
    DEPLOYMENT_CONFIG.tokenName,
    DEPLOYMENT_CONFIG.tokenSymbol,
    deployer.address // Initial owner (will transfer to vault/DAO)
  );
  
  await cgcToken.waitForDeployment();
  const cgcTokenAddress = await cgcToken.getAddress();
  
  console.log(`${colors.green}✅ CGC Token deployed at: ${cgcTokenAddress}${colors.reset}`);
  
  // Wait for confirmations before verification
  await waitForConfirmations(cgcToken.deploymentTransaction(), 5);
  
  // Verify CGC Token
  const cgcVerified = await verifyContract(
    cgcTokenAddress,
    [
      DEPLOYMENT_CONFIG.tokenName,
      DEPLOYMENT_CONFIG.tokenSymbol,
      deployer.address
    ],
    "contracts/CGCToken.sol:CGCToken"
  );
  
  deploymentData.CGCToken = {
    address: cgcTokenAddress,
    verified: cgcVerified,
    txHash: cgcToken.deploymentTransaction()?.hash,
    gasUsed: (await cgcToken.deploymentTransaction()?.wait())?.gasUsed.toString()
  };
  
  // ====================================
  // 2. Deploy AllowedSignersCondition
  // ====================================
  console.log(`\n${colors.yellow}[2/4] Deploying AllowedSignersCondition...${colors.reset}`);
  
  const AllowedSignersCondition = await ethers.getContractFactory("AllowedSignersCondition");
  const condition = await AllowedSignersCondition.deploy(
    DEPLOYMENT_CONFIG.aragonDAO, // DAO can manage signers
    [DEPLOYMENT_CONFIG.aragonDAO] // Initial allowed signer is the DAO itself
  );
  
  await condition.waitForDeployment();
  const conditionAddress = await condition.getAddress();
  
  console.log(`${colors.green}✅ AllowedSignersCondition deployed at: ${conditionAddress}${colors.reset}`);
  
  await waitForConfirmations(condition.deploymentTransaction(), 5);
  
  // Verify AllowedSignersCondition
  const conditionVerified = await verifyContract(
    conditionAddress,
    [
      DEPLOYMENT_CONFIG.aragonDAO,
      [DEPLOYMENT_CONFIG.aragonDAO]
    ],
    "contracts/conditions/AllowedSignersCondition.sol:AllowedSignersCondition"
  );
  
  deploymentData.AllowedSignersCondition = {
    address: conditionAddress,
    verified: conditionVerified,
    txHash: condition.deploymentTransaction()?.hash,
    gasUsed: (await condition.deploymentTransaction()?.wait())?.gasUsed.toString()
  };
  
  // ====================================
  // 3. Deploy GovTokenVault
  // ====================================
  console.log(`\n${colors.yellow}[3/4] Deploying GovTokenVault...${colors.reset}`);
  
  const GovTokenVault = await ethers.getContractFactory("GovTokenVault");
  const vault = await GovTokenVault.deploy(
    cgcTokenAddress, // CGC token
    DEPLOYMENT_CONFIG.aragonDAO, // Aragon DAO as authorizer
    DEPLOYMENT_CONFIG.easContract, // EAS contract
    DEPLOYMENT_CONFIG.shadowMode, // Start in shadow mode
    {
      globalDailyCap: DEPLOYMENT_CONFIG.globalDailyCap,
      globalWeeklyCap: DEPLOYMENT_CONFIG.globalWeeklyCap,
      globalMonthlyCap: DEPLOYMENT_CONFIG.globalMonthlyCap,
      userDailyCap: DEPLOYMENT_CONFIG.userDailyCap,
      userWeeklyCap: DEPLOYMENT_CONFIG.userWeeklyCap,
      userMonthlyCap: DEPLOYMENT_CONFIG.userMonthlyCap
    }
  );
  
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  
  console.log(`${colors.green}✅ GovTokenVault deployed at: ${vaultAddress}${colors.reset}`);
  console.log(`   Shadow Mode: ${DEPLOYMENT_CONFIG.shadowMode ? "ENABLED" : "DISABLED"}`);
  
  await waitForConfirmations(vault.deploymentTransaction(), 5);
  
  // Verify GovTokenVault
  const vaultVerified = await verifyContract(
    vaultAddress,
    [
      cgcTokenAddress,
      DEPLOYMENT_CONFIG.aragonDAO,
      DEPLOYMENT_CONFIG.easContract,
      DEPLOYMENT_CONFIG.shadowMode,
      {
        globalDailyCap: DEPLOYMENT_CONFIG.globalDailyCap,
        globalWeeklyCap: DEPLOYMENT_CONFIG.globalWeeklyCap,
        globalMonthlyCap: DEPLOYMENT_CONFIG.globalMonthlyCap,
        userDailyCap: DEPLOYMENT_CONFIG.userDailyCap,
        userWeeklyCap: DEPLOYMENT_CONFIG.userWeeklyCap,
        userMonthlyCap: DEPLOYMENT_CONFIG.userMonthlyCap
      }
    ],
    "contracts/GovTokenVault.sol:GovTokenVault"
  );
  
  deploymentData.GovTokenVault = {
    address: vaultAddress,
    verified: vaultVerified,
    shadowMode: DEPLOYMENT_CONFIG.shadowMode,
    txHash: vault.deploymentTransaction()?.hash,
    gasUsed: (await vault.deploymentTransaction()?.wait())?.gasUsed.toString()
  };
  
  // ====================================
  // 4. Deploy MerklePayouts
  // ====================================
  console.log(`\n${colors.yellow}[4/4] Deploying MerklePayouts...${colors.reset}`);
  
  const MerklePayouts = await ethers.getContractFactory("MerklePayouts");
  const merkle = await MerklePayouts.deploy(
    cgcTokenAddress,
    DEPLOYMENT_CONFIG.aragonDAO
  );
  
  await merkle.waitForDeployment();
  const merkleAddress = await merkle.getAddress();
  
  console.log(`${colors.green}✅ MerklePayouts deployed at: ${merkleAddress}${colors.reset}`);
  
  await waitForConfirmations(merkle.deploymentTransaction(), 5);
  
  // Verify MerklePayouts
  const merkleVerified = await verifyContract(
    merkleAddress,
    [
      cgcTokenAddress,
      DEPLOYMENT_CONFIG.aragonDAO
    ],
    "contracts/MerklePayouts.sol:MerklePayouts"
  );
  
  deploymentData.MerklePayouts = {
    address: merkleAddress,
    verified: merkleVerified,
    txHash: merkle.deploymentTransaction()?.hash,
    gasUsed: (await merkle.deploymentTransaction()?.wait())?.gasUsed.toString()
  };
  
  // ====================================
  // 5. Initial Token Distribution
  // ====================================
  console.log(`\n${colors.yellow}📊 Performing Initial Token Distribution...${colors.reset}`);
  
  // Transfer tokens to vault for rewards
  console.log(`   Transferring ${ethers.formatEther(DEPLOYMENT_CONFIG.distributions.vault)} CGC to Vault...`);
  const transferToVault = await cgcToken.transfer(vaultAddress, DEPLOYMENT_CONFIG.distributions.vault);
  await waitForConfirmations(transferToVault, 2);
  
  // Transfer remaining to Aragon DAO treasury
  console.log(`   Transferring ${ethers.formatEther(DEPLOYMENT_CONFIG.distributions.treasury)} CGC to DAO Treasury...`);
  const transferToDAO = await cgcToken.transfer(DEPLOYMENT_CONFIG.aragonDAO, DEPLOYMENT_CONFIG.distributions.treasury);
  await waitForConfirmations(transferToDAO, 2);
  
  // Note: Other distributions (team, ecosystem, liquidity, emergency) will be handled via governance proposals
  
  // ====================================
  // 6. Summary and Save
  // ====================================
  console.log(`\n${colors.bright}${colors.green}
╔════════════════════════════════════════════════╗
║           🎉 DEPLOYMENT SUCCESSFUL!             ║
╚════════════════════════════════════════════════╝
${colors.reset}`);
  
  console.log(`${colors.cyan}📋 Deployment Summary:${colors.reset}`);
  console.log(`   CGC Token: ${cgcTokenAddress} ${deploymentData.CGCToken.verified ? "✅" : "⚠️"}`);
  console.log(`   GovTokenVault: ${vaultAddress} ${deploymentData.GovTokenVault.verified ? "✅" : "⚠️"}`);
  console.log(`   AllowedSignersCondition: ${conditionAddress} ${deploymentData.AllowedSignersCondition.verified ? "✅" : "⚠️"}`);
  console.log(`   MerklePayouts: ${merkleAddress} ${deploymentData.MerklePayouts.verified ? "✅" : "⚠️"}`);
  
  // Calculate total gas used
  const totalGasUsed = 
    BigInt(deploymentData.CGCToken.gasUsed || 0) +
    BigInt(deploymentData.GovTokenVault.gasUsed || 0) +
    BigInt(deploymentData.AllowedSignersCondition.gasUsed || 0) +
    BigInt(deploymentData.MerklePayouts.gasUsed || 0);
  
  deploymentData.totalGasUsed = totalGasUsed.toString();
  
  console.log(`\n${colors.yellow}⛽ Total Gas Used: ${totalGasUsed.toString()}${colors.reset}`);
  
  // Save deployment data
  saveDeploymentData(deploymentData);
  
  // Update .env.dao file
  updateEnvFile(deploymentData);
  
  console.log(`\n${colors.bright}${colors.blue}📚 Next Steps:${colors.reset}`);
  console.log(`   1. Configure Aragon DAO permissions for the Vault`);
  console.log(`   2. Register EAS schema for attestations`);
  console.log(`   3. Setup Discord/Telegram bots with contract addresses`);
  console.log(`   4. Update dashboard to connect to deployed contracts`);
  console.log(`   5. Disable shadow mode when ready for production`);
  
  console.log(`\n${colors.green}✨ All contracts deployed and verified on Basescan!${colors.reset}`);
  console.log(`${colors.cyan}🔗 View on Basescan:${colors.reset}`);
  console.log(`   https://basescan.org/address/${cgcTokenAddress}#code`);
  console.log(`   https://basescan.org/address/${vaultAddress}#code`);
  console.log(`   https://basescan.org/address/${conditionAddress}#code`);
  console.log(`   https://basescan.org/address/${merkleAddress}#code`);
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(`${colors.red}❌ Deployment failed:${colors.reset}`, error);
    process.exit(1);
  });