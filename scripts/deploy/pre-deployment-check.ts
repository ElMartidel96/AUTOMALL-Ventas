import { ethers, network } from "hardhat";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

// Load DAO environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env.dao') });

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m"
};

async function checkDeploymentReadiness() {
  console.log(`${colors.bright}${colors.blue}
╔════════════════════════════════════════════════╗
║   🔍 Pre-Deployment Verification Check         ║
║       CryptoGift DAO - Base Mainnet            ║
╚════════════════════════════════════════════════╝
${colors.reset}`);

  let allChecksPass = true;
  const issues: string[] = [];

  // 1. Check Environment Variables
  console.log(`\n${colors.cyan}1️⃣ Checking Environment Variables...${colors.reset}`);
  
  const requiredEnvVars = [
    'PRIVATE_KEY_DAO_DEPLOYER',
    'BASESCAN_API_KEY',
    'ARAGON_DAO_ADDRESS',
    'URL_GITHUB_REPO'
  ];
  
  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      console.log(`   ✅ ${envVar}: ${envVar.includes('KEY') ? '***' : process.env[envVar]}`);
    } else {
      console.log(`   ❌ ${envVar}: NOT SET`);
      issues.push(`Missing environment variable: ${envVar}`);
      allChecksPass = false;
    }
  }

  // 2. Check Network Configuration
  console.log(`\n${colors.cyan}2️⃣ Checking Network Configuration...${colors.reset}`);
  
  try {
    const chainId = await ethers.provider.getNetwork().then(n => n.chainId);
    const expectedChainId = network.name === "base" ? 8453 : 84532;
    
    if (chainId === BigInt(expectedChainId)) {
      console.log(`   ✅ Network: ${network.name} (Chain ID: ${chainId})`);
    } else {
      console.log(`   ❌ Wrong network! Expected ${expectedChainId}, got ${chainId}`);
      issues.push(`Wrong network: expected chain ID ${expectedChainId}, got ${chainId}`);
      allChecksPass = false;
    }
  } catch (error) {
    console.log(`   ❌ Failed to connect to network`);
    issues.push("Cannot connect to network");
    allChecksPass = false;
  }

  // 3. Check Deployer Account
  console.log(`\n${colors.cyan}3️⃣ Checking Deployer Account...${colors.reset}`);
  
  try {
    const [deployer] = await ethers.getSigners();
    const balance = await ethers.provider.getBalance(deployer.address);
    const minBalance = ethers.parseEther("0.05"); // Minimum 0.05 ETH for deployment
    
    console.log(`   Deployer: ${deployer.address}`);
    console.log(`   Balance: ${ethers.formatEther(balance)} ETH`);
    
    if (balance >= minBalance) {
      console.log(`   ✅ Sufficient balance for deployment`);
    } else {
      console.log(`   ❌ Insufficient balance! Need at least 0.05 ETH`);
      issues.push(`Insufficient balance: ${ethers.formatEther(balance)} ETH (need 0.05 ETH)`);
      allChecksPass = false;
    }
  } catch (error) {
    console.log(`   ❌ Failed to get deployer account`);
    issues.push("Cannot access deployer account");
    allChecksPass = false;
  }

  // 4. Check Contract Compilation
  console.log(`\n${colors.cyan}4️⃣ Checking Contract Compilation...${colors.reset}`);
  
  const contractsToCheck = [
    'CGCToken',
    'GovTokenVault',
    'AllowedSignersCondition',
    'MerklePayouts'
  ];
  
  for (const contractName of contractsToCheck) {
    const artifactPath = path.join(__dirname, `../../artifacts/contracts/${contractName}.sol/${contractName}.json`);
    if (fs.existsSync(artifactPath)) {
      const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf-8'));
      if (artifact.bytecode && artifact.bytecode.length > 2) {
        console.log(`   ✅ ${contractName}: Compiled`);
      } else {
        console.log(`   ❌ ${contractName}: No bytecode`);
        issues.push(`${contractName} has no bytecode`);
        allChecksPass = false;
      }
    } else {
      console.log(`   ❌ ${contractName}: Not compiled`);
      issues.push(`${contractName} not compiled`);
      allChecksPass = false;
    }
  }

  // 5. Check Aragon DAO
  console.log(`\n${colors.cyan}5️⃣ Checking Aragon DAO...${colors.reset}`);
  
  const aragonDAO = process.env.ARAGON_DAO_ADDRESS;
  if (aragonDAO) {
    try {
      const code = await ethers.provider.getCode(aragonDAO);
      if (code && code !== "0x") {
        console.log(`   ✅ Aragon DAO exists at: ${aragonDAO}`);
      } else {
        console.log(`   ❌ No contract at Aragon DAO address`);
        issues.push("Aragon DAO address has no contract");
        allChecksPass = false;
      }
    } catch (error) {
      console.log(`   ❌ Failed to check Aragon DAO`);
      issues.push("Cannot verify Aragon DAO");
      allChecksPass = false;
    }
  }

  // 6. Check EAS Contracts
  console.log(`\n${colors.cyan}6️⃣ Checking EAS Contracts...${colors.reset}`);
  
  const easContracts = {
    'EAS': '0x4200000000000000000000000000000000000021',
    'SchemaRegistry': '0x4200000000000000000000000000000000000020'
  };
  
  for (const [name, address] of Object.entries(easContracts)) {
    try {
      const code = await ethers.provider.getCode(address);
      if (code && code !== "0x") {
        console.log(`   ✅ ${name}: ${address}`);
      } else {
        console.log(`   ⚠️ ${name}: No contract at ${address} (may be different on this network)`);
      }
    } catch (error) {
      console.log(`   ⚠️ ${name}: Cannot verify`);
    }
  }

  // 7. Check Basescan API
  console.log(`\n${colors.cyan}7️⃣ Checking Basescan API...${colors.reset}`);
  
  const basescanApiKey = process.env.BASESCAN_API_KEY;
  if (basescanApiKey && basescanApiKey.length > 10) {
    console.log(`   ✅ Basescan API Key configured`);
    
    // Test API key
    try {
      const testUrl = network.name === "base" 
        ? `https://api.basescan.org/api?module=account&action=balance&address=0x0000000000000000000000000000000000000000&tag=latest&apikey=${basescanApiKey}`
        : `https://api-sepolia.basescan.org/api?module=account&action=balance&address=0x0000000000000000000000000000000000000000&tag=latest&apikey=${basescanApiKey}`;
      
      const response = await fetch(testUrl);
      const data = await response.json();
      
      if (data.status === "1" || data.message === "OK") {
        console.log(`   ✅ Basescan API Key is valid`);
      } else if (data.result === "Invalid API Key") {
        console.log(`   ❌ Invalid Basescan API Key`);
        issues.push("Invalid Basescan API Key");
        allChecksPass = false;
      } else {
        console.log(`   ⚠️ Basescan API response unclear`);
      }
    } catch (error) {
      console.log(`   ⚠️ Could not verify Basescan API Key`);
    }
  } else {
    console.log(`   ❌ Basescan API Key not configured`);
    issues.push("Basescan API Key not configured");
    allChecksPass = false;
  }

  // 8. Check Gas Prices
  console.log(`\n${colors.cyan}8️⃣ Checking Gas Prices...${colors.reset}`);
  
  try {
    const feeData = await ethers.provider.getFeeData();
    console.log(`   Gas Price: ${ethers.formatUnits(feeData.gasPrice || 0, 'gwei')} gwei`);
    console.log(`   Max Fee: ${ethers.formatUnits(feeData.maxFeePerGas || 0, 'gwei')} gwei`);
    console.log(`   Max Priority: ${ethers.formatUnits(feeData.maxPriorityFeePerGas || 0, 'gwei')} gwei`);
    
    // Estimate deployment cost
    const estimatedGas = BigInt(5000000); // ~5M gas for all contracts
    const estimatedCost = (feeData.gasPrice || BigInt(0)) * estimatedGas;
    console.log(`   Estimated deployment cost: ~${ethers.formatEther(estimatedCost)} ETH`);
  } catch (error) {
    console.log(`   ⚠️ Could not fetch gas prices`);
  }

  // Final Summary
  console.log(`\n${colors.bright}${colors.blue}═══════════════════════════════════════════${colors.reset}`);
  
  if (allChecksPass) {
    console.log(`${colors.bright}${colors.green}✅ ALL CHECKS PASSED - READY FOR DEPLOYMENT!${colors.reset}`);
    console.log(`\n${colors.yellow}⚠️ IMPORTANT REMINDERS:${colors.reset}`);
    console.log(`   1. This will deploy to ${network.name.toUpperCase()}`);
    console.log(`   2. Contracts will be automatically verified on Basescan`);
    console.log(`   3. Shadow mode is ENABLED by default`);
    console.log(`   4. Make sure you have backed up your private key`);
    console.log(`   5. Double-check all parameters in deploy script`);
    
    console.log(`\n${colors.cyan}To deploy, run:${colors.reset}`);
    console.log(`   ${colors.bright}npx hardhat run scripts/deploy/deploy-all-with-verification.ts --network ${network.name}${colors.reset}`);
  } else {
    console.log(`${colors.bright}${colors.red}❌ DEPLOYMENT BLOCKED - ISSUES FOUND:${colors.reset}`);
    issues.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue}`);
    });
    console.log(`\n${colors.yellow}Please fix these issues before attempting deployment.${colors.reset}`);
    process.exit(1);
  }
}

// Run the check
checkDeploymentReadiness()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(`${colors.red}Error during pre-deployment check:${colors.reset}`, error);
    process.exit(1);
  });