const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

// Load DAO environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.dao') });

// Color codes for console output
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

// Helper function to parse ether
function parseEther(value) {
  return hre.ethers.parseEther(value);
}

// Deployment configuration (will be initialized after ethers is available)
let DEPLOYMENT_CONFIG;

// Helper function to wait for confirmations
async function waitForConfirmations(tx, confirmations = 5) {
  console.log(`${colors.yellow}⏳ Waiting for ${confirmations} confirmations...${colors.reset}`);
  await tx.wait(confirmations);
  console.log(`${colors.green}✅ Confirmed!${colors.reset}`);
}

// Helper function to verify contract
async function verifyContract(address, constructorArgs, contractPath) {
  console.log(`${colors.cyan}🔍 Verifying contract at ${address}...${colors.reset}`);
  
  try {
    await hre.run("verify:verify", {
      address: address,
      constructorArguments: constructorArgs,
      contract: contractPath
    });
    console.log(`${colors.green}✅ Contract verified on Basescan!${colors.reset}`);
    return true;
  } catch (error) {
    if (error.message.toLowerCase().includes("already verified")) {
      console.log(`${colors.yellow}⚠️ Contract already verified${colors.reset}`);
      return true;
    } else {
      console.log(`${colors.red}❌ Verification failed: ${error.message}${colors.reset}`);
      return false;
    }
  }
}

// Main deployment function
async function deployDAO() {
  await hre.run('compile');
  
  const ethers = hre.ethers;
  const run = hre.run;
  const network = hre.network;
  
  // Initialize deployment configuration with ethers available
  DEPLOYMENT_CONFIG = {
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
  
  console.log(`${colors.bright}${colors.blue}
╔══════════════════════════════════════════════════════════════╗
║                 🏛️  CryptoGift DAO Deployment                ║
║                      BASE MAINNET - PRODUCTION                ║
║                         Maximum Quality Build                  ║
╚══════════════════════════════════════════════════════════════╝
${colors.reset}`);

  // Get deployer
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  
  // Validate network
  const chainId = (await ethers.provider.getNetwork()).chainId;
  console.log(`\n${colors.cyan}📊 Network Information:${colors.reset}`);
  console.log(`   Network: ${network.name}`);
  console.log(`   Chain ID: ${chainId}`);
  console.log(`   Deployer: ${deployerAddress}`);
  
  // Check balance
  const balance = await ethers.provider.getBalance(deployerAddress);
  console.log(`   Balance: ${ethers.formatEther(balance)} ETH`);
  
  if (balance < ethers.parseEther("0.002")) {
    console.error(`${colors.red}❌ Insufficient balance. Need at least 0.002 ETH${colors.reset}`);
    process.exit(1);
  }
  
  // Validate chain ID
  if (network.name === "base" && chainId !== BigInt(DEPLOYMENT_CONFIG.expectedChainId)) {
    console.error(`${colors.red}❌ Wrong network! Expected Base Mainnet (${DEPLOYMENT_CONFIG.expectedChainId}), got ${chainId}${colors.reset}`);
    process.exit(1);
  }
  
  // Get gas price
  const feeData = await ethers.provider.getFeeData();
  const gasPrice = feeData.gasPrice;
  console.log(`   Gas Price: ${ethers.formatUnits(gasPrice, 'gwei')} Gwei`);
  
  console.log(`\n${colors.cyan}🏗️ Deployment Configuration:${colors.reset}`);
  console.log(`   Aragon DAO: ${DEPLOYMENT_CONFIG.aragonDAO}`);
  console.log(`   EAS Contract: ${DEPLOYMENT_CONFIG.easContract}`);
  console.log(`   Total Supply: ${ethers.formatEther(DEPLOYMENT_CONFIG.totalSupply)} CGC`);
  console.log(`   Shadow Mode: ${DEPLOYMENT_CONFIG.shadowMode}`);
  
  // Deployment tracking
  const deploymentData = {
    network: network.name,
    chainId: chainId.toString(),
    deployer: deployerAddress,
    timestamp: new Date().toISOString(),
    contracts: {},
    gasUsed: BigInt(0)
  };
  
  console.log(`\n${colors.bright}${colors.magenta}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}📦 Starting Deployment Process...${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}═══════════════════════════════════════${colors.reset}\n`);
  
  // 1. Deploy CGC Token
  console.log(`${colors.bright}${colors.yellow}[1/4] Deploying CGC Token...${colors.reset}`);
  const CGCToken = await ethers.getContractFactory("CGCToken");
  const cgcToken = await CGCToken.deploy(
    DEPLOYMENT_CONFIG.tokenName,
    DEPLOYMENT_CONFIG.tokenSymbol,
    deployerAddress
  );
  await cgcToken.waitForDeployment();
  const cgcTokenAddress = await cgcToken.getAddress();
  
  console.log(`${colors.green}✅ CGC Token deployed at: ${cgcTokenAddress}${colors.reset}`);
  console.log(`   View on Basescan: https://basescan.org/address/${cgcTokenAddress}`);
  
  deploymentData.contracts.CGCToken = {
    address: cgcTokenAddress,
    txHash: cgcToken.deploymentTransaction().hash,
    constructorArgs: [DEPLOYMENT_CONFIG.tokenName, DEPLOYMENT_CONFIG.tokenSymbol, deployerAddress]
  };
  
  // Wait for confirmations before verification
  await waitForConfirmations(cgcToken.deploymentTransaction(), 5);
  
  // 2. Deploy GovTokenVault
  console.log(`\n${colors.bright}${colors.yellow}[2/4] Deploying GovTokenVault...${colors.reset}`);
  const GovTokenVault = await ethers.getContractFactory("GovTokenVault");
  const govTokenVault = await GovTokenVault.deploy(
    cgcTokenAddress,
    DEPLOYMENT_CONFIG.aragonDAO,
    DEPLOYMENT_CONFIG.easContract,
    DEPLOYMENT_CONFIG.shadowMode
  );
  await govTokenVault.waitForDeployment();
  const vaultAddress = await govTokenVault.getAddress();
  
  console.log(`${colors.green}✅ GovTokenVault deployed at: ${vaultAddress}${colors.reset}`);
  console.log(`   Shadow Mode: ${DEPLOYMENT_CONFIG.shadowMode ? "ENABLED (Safe testing)" : "DISABLED (Live)"}`);
  console.log(`   View on Basescan: https://basescan.org/address/${vaultAddress}`);
  
  deploymentData.contracts.GovTokenVault = {
    address: vaultAddress,
    txHash: govTokenVault.deploymentTransaction().hash,
    constructorArgs: [cgcTokenAddress, DEPLOYMENT_CONFIG.aragonDAO, DEPLOYMENT_CONFIG.easContract, DEPLOYMENT_CONFIG.shadowMode],
    config: {
      shadowMode: DEPLOYMENT_CONFIG.shadowMode,
      globalDailyCap: DEPLOYMENT_CONFIG.globalDailyCap.toString(),
      userDailyCap: DEPLOYMENT_CONFIG.userDailyCap.toString()
    }
  };
  
  await waitForConfirmations(govTokenVault.deploymentTransaction(), 5);
  
  // 3. Deploy AllowedSignersCondition
  console.log(`\n${colors.bright}${colors.yellow}[3/4] Deploying AllowedSignersCondition...${colors.reset}`);
  const AllowedSignersCondition = await ethers.getContractFactory("AllowedSignersCondition");
  const allowedSignersCondition = await AllowedSignersCondition.deploy(
    DEPLOYMENT_CONFIG.aragonDAO,
    [DEPLOYMENT_CONFIG.aragonDAO, deployerAddress] // Initial allowed signers
  );
  await allowedSignersCondition.waitForDeployment();
  const conditionAddress = await allowedSignersCondition.getAddress();
  
  console.log(`${colors.green}✅ AllowedSignersCondition deployed at: ${conditionAddress}${colors.reset}`);
  console.log(`   Initial Signers: Aragon DAO & Deployer`);
  console.log(`   View on Basescan: https://basescan.org/address/${conditionAddress}`);
  
  deploymentData.contracts.AllowedSignersCondition = {
    address: conditionAddress,
    txHash: allowedSignersCondition.deploymentTransaction().hash,
    constructorArgs: [DEPLOYMENT_CONFIG.aragonDAO, [DEPLOYMENT_CONFIG.aragonDAO, deployerAddress]]
  };
  
  await waitForConfirmations(allowedSignersCondition.deploymentTransaction(), 5);
  
  // 4. Deploy MerklePayouts
  console.log(`\n${colors.bright}${colors.yellow}[4/4] Deploying MerklePayouts...${colors.reset}`);
  const MerklePayouts = await ethers.getContractFactory("MerklePayouts");
  const merklePayouts = await MerklePayouts.deploy(
    cgcTokenAddress,
    DEPLOYMENT_CONFIG.aragonDAO
  );
  await merklePayouts.waitForDeployment();
  const merkleAddress = await merklePayouts.getAddress();
  
  console.log(`${colors.green}✅ MerklePayouts deployed at: ${merkleAddress}${colors.reset}`);
  console.log(`   View on Basescan: https://basescan.org/address/${merkleAddress}`);
  
  deploymentData.contracts.MerklePayouts = {
    address: merkleAddress,
    txHash: merklePayouts.deploymentTransaction().hash,
    constructorArgs: [cgcTokenAddress, DEPLOYMENT_CONFIG.aragonDAO]
  };
  
  await waitForConfirmations(merklePayouts.deploymentTransaction(), 5);
  
  // Calculate total gas used
  const cgcGas = (await cgcToken.deploymentTransaction().wait()).gasUsed;
  const vaultGas = (await govTokenVault.deploymentTransaction().wait()).gasUsed;
  const conditionGas = (await allowedSignersCondition.deploymentTransaction().wait()).gasUsed;
  const merkleGas = (await merklePayouts.deploymentTransaction().wait()).gasUsed;
  
  deploymentData.gasUsed = (cgcGas + vaultGas + conditionGas + merkleGas).toString();
  const totalGasCost = (cgcGas + vaultGas + conditionGas + merkleGas) * gasPrice;
  
  console.log(`\n${colors.bright}${colors.magenta}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}📊 Deployment Summary${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}═══════════════════════════════════════${colors.reset}`);
  console.log(`   Total Gas Used: ${deploymentData.gasUsed}`);
  console.log(`   Total Cost: ${ethers.formatEther(totalGasCost)} ETH`);
  
  // Save deployment data
  const deploymentPath = path.join(__dirname, '../deployments');
  if (!fs.existsSync(deploymentPath)) {
    fs.mkdirSync(deploymentPath, { recursive: true });
  }
  
  const deploymentFile = path.join(deploymentPath, `deployment-${network.name}-${Date.now()}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentData, null, 2));
  console.log(`\n${colors.green}📁 Deployment data saved: ${deploymentFile}${colors.reset}`);
  
  // Update .env.dao file
  console.log(`\n${colors.cyan}📝 Updating .env.dao with contract addresses...${colors.reset}`);
  const envPath = path.resolve(__dirname, '../.env.dao');
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  envContent = envContent.replace(/CGC_TOKEN_ADDRESS=.*/, `CGC_TOKEN_ADDRESS=${cgcTokenAddress}`);
  envContent = envContent.replace(/VAULT_ADDRESS=.*/, `VAULT_ADDRESS=${vaultAddress}`);
  envContent = envContent.replace(/CONDITION_ADDRESS=.*/, `CONDITION_ADDRESS=${conditionAddress}`);
  envContent = envContent.replace(/MERKLE_DISTRIBUTOR_ADDRESS=.*/, `MERKLE_DISTRIBUTOR_ADDRESS=${merkleAddress}`);
  
  fs.writeFileSync(envPath, envContent);
  console.log(`${colors.green}✅ .env.dao updated successfully${colors.reset}`);
  
  // Verify contracts on Basescan
  console.log(`\n${colors.bright}${colors.cyan}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}🔍 Verifying Contracts on Basescan...${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}═══════════════════════════════════════${colors.reset}\n`);
  
  // Verify CGC Token
  console.log(`${colors.yellow}[1/4] Verifying CGC Token...${colors.reset}`);
  await verifyContract(
    cgcTokenAddress,
    deploymentData.contracts.CGCToken.constructorArgs,
    "contracts/CGCToken.sol:CGCToken"
  );
  
  // Verify GovTokenVault
  console.log(`\n${colors.yellow}[2/4] Verifying GovTokenVault...${colors.reset}`);
  await verifyContract(
    vaultAddress,
    deploymentData.contracts.GovTokenVault.constructorArgs,
    "contracts/GovTokenVault.sol:GovTokenVault"
  );
  
  // Verify AllowedSignersCondition
  console.log(`\n${colors.yellow}[3/4] Verifying AllowedSignersCondition...${colors.reset}`);
  await verifyContract(
    conditionAddress,
    deploymentData.contracts.AllowedSignersCondition.constructorArgs,
    "contracts/conditions/AllowedSignersCondition.sol:AllowedSignersCondition"
  );
  
  // Verify MerklePayouts
  console.log(`\n${colors.yellow}[4/4] Verifying MerklePayouts...${colors.reset}`);
  await verifyContract(
    merkleAddress,
    deploymentData.contracts.MerklePayouts.constructorArgs,
    "contracts/MerklePayouts.sol:MerklePayouts"
  );
  
  // Final success message
  console.log(`\n${colors.bright}${colors.green}
╔══════════════════════════════════════════════════════════════╗
║                   🎉 DEPLOYMENT SUCCESSFUL!                   ║
║                    ALL CONTRACTS DEPLOYED                     ║
║                    BASE MAINNET - PRODUCTION                  ║
╚══════════════════════════════════════════════════════════════╝
${colors.reset}`);
  
  console.log(`\n${colors.bright}📋 Contract Addresses:${colors.reset}`);
  console.log(`   CGC Token:        ${cgcTokenAddress}`);
  console.log(`   GovTokenVault:    ${vaultAddress}`);
  console.log(`   AllowedSigners:   ${conditionAddress}`);
  console.log(`   MerklePayouts:    ${merkleAddress}`);
  
  console.log(`\n${colors.bright}📚 Next Steps:${colors.reset}`);
  console.log(`   1. ✅ Transfer CGC tokens to vault (400,000 CGC)`);
  console.log(`   2. ✅ Configure Aragon DAO permissions`);
  console.log(`   3. ✅ Register EAS schema for attestations`);
  console.log(`   4. ✅ Setup bot for automatic attestations`);
  console.log(`   5. ✅ Configure dashboard with new addresses`);
  console.log(`   6. ✅ Test shadow mode operations`);
  console.log(`   7. ✅ When ready, disable shadow mode`);
  
  console.log(`\n${colors.bright}${colors.blue}🔗 Important Links:${colors.reset}`);
  console.log(`   Aragon DAO: https://app.aragon.org/dao/base-mainnet/${DEPLOYMENT_CONFIG.aragonDAO}`);
  console.log(`   Basescan: https://basescan.org/address/${cgcTokenAddress}`);
  console.log(`   Documentation: https://docs.cryptogift-wallets.com`);
  
  console.log(`\n${colors.bright}${colors.green}✨ CryptoGift DAO is now live on Base Mainnet! ✨${colors.reset}\n`);
}

// Error handling
async function main() {
  try {
    await deployDAO();
    process.exit(0);
  } catch (error) {
    console.error(`\n${colors.red}❌ Deployment failed:${colors.reset}`);
    console.error(error);
    process.exit(1);
  }
}

// Execute deployment
main();