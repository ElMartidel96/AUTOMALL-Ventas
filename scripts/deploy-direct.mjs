#!/usr/bin/env node

import { ethers } from 'ethers';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.dao') });

// Colors for console output
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
  network: process.argv[2] || 'baseSepolia', // Default to testnet
  aragonDAO: "0x3244DFBf9E5374DF2f106E89Cf7972E5D4C9ac31",
  easContract: "0x4200000000000000000000000000000000000021",
  schemaRegistry: "0x4200000000000000000000000000000000000020",
  tokenName: "CryptoGift Coin",
  tokenSymbol: "CGC",
  totalSupply: ethers.parseEther("1000000"),
  shadowMode: true,
  globalDailyCap: ethers.parseEther("10000"),
  globalWeeklyCap: ethers.parseEther("50000"),
  globalMonthlyCap: ethers.parseEther("150000"),
  userDailyCap: ethers.parseEther("500"),
  userWeeklyCap: ethers.parseEther("2000"),
  userMonthlyCap: ethers.parseEther("5000"),
  distributions: {
    vault: ethers.parseEther("400000"),
    treasury: ethers.parseEther("250000"),
    team: ethers.parseEther("150000"),
    ecosystem: ethers.parseEther("100000"),
    liquidity: ethers.parseEther("50000"),
    emergency: ethers.parseEther("50000")
  }
};

// Network configurations
const NETWORKS = {
  base: {
    name: 'Base Mainnet',
    chainId: 8453,
    rpcUrl: process.env.ALCHEMY_BASE_RPC || process.env.BASE_RPC_URL || "https://mainnet.base.org",
    explorerUrl: "https://basescan.org",
    explorerApi: "https://api.basescan.org/api"
  },
  baseSepolia: {
    name: 'Base Sepolia',
    chainId: 84532,
    rpcUrl: process.env.ALCHEMY_SEPOLIA_RPC || process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
    explorerUrl: "https://sepolia.basescan.org",
    explorerApi: "https://api-sepolia.basescan.org/api"
  }
};

// Get network config
const networkConfig = NETWORKS[DEPLOYMENT_CONFIG.network];
if (!networkConfig) {
  console.error(`${colors.red}Invalid network: ${DEPLOYMENT_CONFIG.network}${colors.reset}`);
  process.exit(1);
}

// Check environment variables
const PRIVATE_KEY = process.env.PRIVATE_KEY_DAO_DEPLOYER;
const BASESCAN_API_KEY = process.env.BASESCAN_API_KEY;

if (!PRIVATE_KEY) {
  console.error(`${colors.red}❌ PRIVATE_KEY_DAO_DEPLOYER not found in .env.dao${colors.reset}`);
  process.exit(1);
}

if (!BASESCAN_API_KEY) {
  console.error(`${colors.red}❌ BASESCAN_API_KEY not found in .env.dao${colors.reset}`);
  process.exit(1);
}

// Contract ABIs and Bytecodes (simplified versions)
const CONTRACTS = {
  CGCToken: {
    abi: [
      "constructor(string name, string symbol, address initialOwner)",
      "function transfer(address to, uint256 amount) returns (bool)",
      "function balanceOf(address account) view returns (uint256)",
      "function totalSupply() view returns (uint256)",
      "function name() view returns (string)",
      "function symbol() view returns (string)",
      "function decimals() view returns (uint8)"
    ],
    bytecode: "0x" // Will be loaded from compiled artifacts
  },
  GovTokenVault: {
    abi: [
      "constructor(address _governanceToken, address _aragonDAO, address _easContract, bool _shadowMode, tuple(uint256 globalDailyCap, uint256 globalWeeklyCap, uint256 globalMonthlyCap, uint256 userDailyCap, uint256 userWeeklyCap, uint256 userMonthlyCap) _caps)",
      "function shadowMode() view returns (bool)",
      "function aragonDAO() view returns (address)",
      "function governanceToken() view returns (address)"
    ],
    bytecode: "0x" // Will be loaded from compiled artifacts
  },
  AllowedSignersCondition: {
    abi: [
      "constructor(address _owner, address[] _initialSigners)",
      "function isAllowedSigner(address signer) view returns (bool)",
      "function owner() view returns (address)"
    ],
    bytecode: "0x" // Will be loaded from compiled artifacts
  },
  MerklePayouts: {
    abi: [
      "constructor(address _token, address _owner)",
      "function token() view returns (address)",
      "function owner() view returns (address)"
    ],
    bytecode: "0x" // Will be loaded from compiled artifacts
  }
};

// Function to compile contracts
async function compileContracts() {
  console.log(`${colors.yellow}📦 Compiling contracts...${colors.reset}`);
  
  try {
    // First, try to compile with Hardhat using the mjs config
    execSync('npx hardhat compile --config hardhat.config.mjs', { stdio: 'pipe' });
    console.log(`${colors.green}✅ Contracts compiled successfully${colors.reset}`);
    
    // Load compiled bytecode
    const artifactsPath = path.join(__dirname, '../artifacts/contracts');
    
    // Load CGCToken
    const cgcTokenArtifact = JSON.parse(
      fs.readFileSync(path.join(artifactsPath, 'CGCToken.sol/CGCToken.json'), 'utf8')
    );
    CONTRACTS.CGCToken.bytecode = cgcTokenArtifact.bytecode;
    CONTRACTS.CGCToken.abi = cgcTokenArtifact.abi;
    
    // Load GovTokenVault
    const vaultArtifact = JSON.parse(
      fs.readFileSync(path.join(artifactsPath, 'GovTokenVault.sol/GovTokenVault.json'), 'utf8')
    );
    CONTRACTS.GovTokenVault.bytecode = vaultArtifact.bytecode;
    CONTRACTS.GovTokenVault.abi = vaultArtifact.abi;
    
    // Load AllowedSignersCondition
    const conditionArtifact = JSON.parse(
      fs.readFileSync(path.join(artifactsPath, 'conditions/AllowedSignersCondition.sol/AllowedSignersCondition.json'), 'utf8')
    );
    CONTRACTS.AllowedSignersCondition.bytecode = conditionArtifact.bytecode;
    CONTRACTS.AllowedSignersCondition.abi = conditionArtifact.abi;
    
    // Load MerklePayouts
    const merkleArtifact = JSON.parse(
      fs.readFileSync(path.join(artifactsPath, 'MerklePayouts.sol/MerklePayouts.json'), 'utf8')
    );
    CONTRACTS.MerklePayouts.bytecode = merkleArtifact.bytecode;
    CONTRACTS.MerklePayouts.abi = merkleArtifact.abi;
    
    return true;
  } catch (error) {
    console.error(`${colors.red}❌ Compilation failed: ${error.message}${colors.reset}`);
    console.log(`${colors.yellow}⚠️ Make sure you have installed all dependencies with: pnpm install${colors.reset}`);
    return false;
  }
}

// Function to verify contract on Basescan
async function verifyContract(address, constructorArgs, contractName, sourceCode) {
  console.log(`${colors.cyan}🔍 Verifying ${contractName} at ${address}...${colors.reset}`);
  
  try {
    const verifyUrl = `${networkConfig.explorerApi}?module=contract&action=verifysourcecode`;
    
    const params = new URLSearchParams({
      apikey: BASESCAN_API_KEY,
      module: 'contract',
      action: 'verifysourcecode',
      contractaddress: address,
      sourceCode: sourceCode,
      codeformat: 'solidity-single-file',
      contractname: contractName,
      compilerversion: 'v0.8.20+commit.a1b79de6',
      optimizationUsed: '1',
      runs: '200',
      constructorArguements: ethers.AbiCoder.defaultAbiCoder().encode(
        constructorArgs.types || [],
        constructorArgs.values || []
      ).slice(2),
      evmversion: 'paris',
      licenseType: '3' // MIT
    });
    
    const response = await fetch(verifyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });
    
    const data = await response.json();
    
    if (data.status === "1") {
      console.log(`${colors.green}✅ Verification submitted! GUID: ${data.result}${colors.reset}`);
      
      // Wait for verification to complete
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Check verification status
      const checkUrl = `${networkConfig.explorerApi}?module=contract&action=checkverifystatus&guid=${data.result}&apikey=${BASESCAN_API_KEY}`;
      const checkResponse = await fetch(checkUrl);
      const checkData = await checkResponse.json();
      
      if (checkData.result === "Pending in queue") {
        console.log(`${colors.yellow}⏳ Verification pending...${colors.reset}`);
      } else if (checkData.result === "Pass - Verified") {
        console.log(`${colors.green}✅ Contract verified successfully!${colors.reset}`);
      } else {
        console.log(`${colors.yellow}⚠️ Verification status: ${checkData.result}${colors.reset}`);
      }
      
      return true;
    } else {
      console.log(`${colors.yellow}⚠️ Verification failed: ${data.result}${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.error(`${colors.red}❌ Verification error: ${error.message}${colors.reset}`);
    return false;
  }
}

// Main deployment function
async function deploy() {
  console.log(`${colors.bright}${colors.blue}
╔════════════════════════════════════════════════╗
║   🏛️  CryptoGift DAO - Direct Deployment       ║
║          With Automatic Verification            ║
╚════════════════════════════════════════════════╝
${colors.reset}`);

  console.log(`${colors.cyan}📊 Deployment Information:${colors.reset}`);
  console.log(`   Network: ${networkConfig.name}`);
  console.log(`   Chain ID: ${networkConfig.chainId}`);
  console.log(`   RPC URL: ${networkConfig.rpcUrl}`);
  console.log(`   Explorer: ${networkConfig.explorerUrl}`);
  
  // Connect to provider
  const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log(`   Deployer: ${wallet.address}`);
  
  // Check balance
  const balance = await provider.getBalance(wallet.address);
  console.log(`   Balance: ${ethers.formatEther(balance)} ETH`);
  
  if (balance < ethers.parseEther("0.02")) {
    console.error(`${colors.red}❌ Insufficient balance! Need at least 0.02 ETH${colors.reset}`);
    process.exit(1);
  }
  
  if (balance < ethers.parseEther("0.05")) {
    console.log(`${colors.yellow}⚠️ Warning: Balance is below recommended 0.05 ETH${colors.reset}`);
    console.log(`${colors.yellow}   Proceeding with deployment but watch for gas issues${colors.reset}`);
  }
  
  // Check network
  const network = await provider.getNetwork();
  if (network.chainId !== BigInt(networkConfig.chainId)) {
    console.error(`${colors.red}❌ Wrong network! Expected ${networkConfig.chainId}, got ${network.chainId}${colors.reset}`);
    process.exit(1);
  }
  
  // Compile contracts first
  const compiled = await compileContracts();
  if (!compiled) {
    console.error(`${colors.red}❌ Cannot proceed without compiled contracts${colors.reset}`);
    process.exit(1);
  }
  
  // Deployment data
  const deploymentData = {
    network: DEPLOYMENT_CONFIG.network,
    chainId: networkConfig.chainId,
    deployer: wallet.address,
    timestamp: new Date().toISOString(),
    aragonDAO: DEPLOYMENT_CONFIG.aragonDAO,
    contracts: {}
  };
  
  console.log(`\n${colors.bright}📦 Starting Deployment...${colors.reset}\n`);
  
  // Deploy CGC Token
  console.log(`${colors.yellow}[1/4] Deploying CGC Token...${colors.reset}`);
  
  const CGCTokenFactory = new ethers.ContractFactory(
    CONTRACTS.CGCToken.abi,
    CONTRACTS.CGCToken.bytecode,
    wallet
  );
  
  const cgcToken = await CGCTokenFactory.deploy(
    DEPLOYMENT_CONFIG.tokenName,
    DEPLOYMENT_CONFIG.tokenSymbol,
    wallet.address
  );
  
  await cgcToken.waitForDeployment();
  const cgcTokenAddress = await cgcToken.getAddress();
  
  console.log(`${colors.green}✅ CGC Token deployed at: ${cgcTokenAddress}${colors.reset}`);
  console.log(`   View on explorer: ${networkConfig.explorerUrl}/address/${cgcTokenAddress}`);
  
  deploymentData.contracts.CGCToken = {
    address: cgcTokenAddress,
    txHash: cgcToken.deploymentTransaction().hash
  };
  
  // Wait for confirmations
  console.log(`${colors.yellow}⏳ Waiting for confirmations...${colors.reset}`);
  await cgcToken.deploymentTransaction().wait(3);
  
  // Verify CGC Token
  await verifyContract(
    cgcTokenAddress,
    {
      types: ['string', 'string', 'address'],
      values: [DEPLOYMENT_CONFIG.tokenName, DEPLOYMENT_CONFIG.tokenSymbol, wallet.address]
    },
    'CGCToken',
    fs.readFileSync(path.join(__dirname, '../contracts/CGCToken.sol'), 'utf8')
  );
  
  // Deploy AllowedSignersCondition
  console.log(`\n${colors.yellow}[2/4] Deploying AllowedSignersCondition...${colors.reset}`);
  
  const AllowedSignersConditionFactory = new ethers.ContractFactory(
    CONTRACTS.AllowedSignersCondition.abi,
    CONTRACTS.AllowedSignersCondition.bytecode,
    wallet
  );
  
  const condition = await AllowedSignersConditionFactory.deploy(
    DEPLOYMENT_CONFIG.aragonDAO,
    [DEPLOYMENT_CONFIG.aragonDAO]
  );
  
  await condition.waitForDeployment();
  const conditionAddress = await condition.getAddress();
  
  console.log(`${colors.green}✅ AllowedSignersCondition deployed at: ${conditionAddress}${colors.reset}`);
  console.log(`   View on explorer: ${networkConfig.explorerUrl}/address/${conditionAddress}`);
  
  deploymentData.contracts.AllowedSignersCondition = {
    address: conditionAddress,
    txHash: condition.deploymentTransaction().hash
  };
  
  await condition.deploymentTransaction().wait(3);
  
  // Deploy GovTokenVault
  console.log(`\n${colors.yellow}[3/4] Deploying GovTokenVault...${colors.reset}`);
  
  const GovTokenVaultFactory = new ethers.ContractFactory(
    CONTRACTS.GovTokenVault.abi,
    CONTRACTS.GovTokenVault.bytecode,
    wallet
  );
  
  const vault = await GovTokenVaultFactory.deploy(
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
  );
  
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  
  console.log(`${colors.green}✅ GovTokenVault deployed at: ${vaultAddress}${colors.reset}`);
  console.log(`   Shadow Mode: ${DEPLOYMENT_CONFIG.shadowMode ? "ENABLED" : "DISABLED"}`);
  console.log(`   View on explorer: ${networkConfig.explorerUrl}/address/${vaultAddress}`);
  
  deploymentData.contracts.GovTokenVault = {
    address: vaultAddress,
    txHash: vault.deploymentTransaction().hash,
    shadowMode: DEPLOYMENT_CONFIG.shadowMode
  };
  
  await vault.deploymentTransaction().wait(3);
  
  // Deploy MerklePayouts
  console.log(`\n${colors.yellow}[4/4] Deploying MerklePayouts...${colors.reset}`);
  
  const MerklePayoutsFactory = new ethers.ContractFactory(
    CONTRACTS.MerklePayouts.abi,
    CONTRACTS.MerklePayouts.bytecode,
    wallet
  );
  
  const merkle = await MerklePayoutsFactory.deploy(
    cgcTokenAddress,
    DEPLOYMENT_CONFIG.aragonDAO
  );
  
  await merkle.waitForDeployment();
  const merkleAddress = await merkle.getAddress();
  
  console.log(`${colors.green}✅ MerklePayouts deployed at: ${merkleAddress}${colors.reset}`);
  console.log(`   View on explorer: ${networkConfig.explorerUrl}/address/${merkleAddress}`);
  
  deploymentData.contracts.MerklePayouts = {
    address: merkleAddress,
    txHash: merkle.deploymentTransaction().hash
  };
  
  await merkle.deploymentTransaction().wait(3);
  
  // Initial token distribution
  console.log(`\n${colors.yellow}📊 Performing Initial Token Distribution...${colors.reset}`);
  
  const cgcTokenContract = new ethers.Contract(cgcTokenAddress, CONTRACTS.CGCToken.abi, wallet);
  
  // Transfer to vault
  console.log(`   Transferring ${ethers.formatEther(DEPLOYMENT_CONFIG.distributions.vault)} CGC to Vault...`);
  const transferToVault = await cgcTokenContract.transfer(vaultAddress, DEPLOYMENT_CONFIG.distributions.vault);
  await transferToVault.wait(2);
  console.log(`   ${colors.green}✅ Done${colors.reset}`);
  
  // Transfer to DAO treasury
  console.log(`   Transferring ${ethers.formatEther(DEPLOYMENT_CONFIG.distributions.treasury)} CGC to DAO Treasury...`);
  const transferToDAO = await cgcTokenContract.transfer(DEPLOYMENT_CONFIG.aragonDAO, DEPLOYMENT_CONFIG.distributions.treasury);
  await transferToDAO.wait(2);
  console.log(`   ${colors.green}✅ Done${colors.reset}`);
  
  // Save deployment data
  const deploymentsPath = path.join(__dirname, '../deployments');
  if (!fs.existsSync(deploymentsPath)) {
    fs.mkdirSync(deploymentsPath, { recursive: true });
  }
  
  const filename = `deployment-${DEPLOYMENT_CONFIG.network}-${Date.now()}.json`;
  const filepath = path.join(deploymentsPath, filename);
  
  fs.writeFileSync(filepath, JSON.stringify(deploymentData, null, 2));
  console.log(`\n${colors.green}📁 Deployment data saved to: ${filename}${colors.reset}`);
  
  // Also save as latest
  const latestPath = path.join(deploymentsPath, `deployment-${DEPLOYMENT_CONFIG.network}-latest.json`);
  fs.writeFileSync(latestPath, JSON.stringify(deploymentData, null, 2));
  
  // Update .env.dao
  const envPath = path.resolve(__dirname, '../.env.dao');
  let envContent = fs.readFileSync(envPath, 'utf-8');
  
  envContent = envContent.replace(/CGC_TOKEN_ADDRESS=.*/, `CGC_TOKEN_ADDRESS=${cgcTokenAddress}`);
  envContent = envContent.replace(/VAULT_ADDRESS=.*/, `VAULT_ADDRESS=${vaultAddress}`);
  envContent = envContent.replace(/CONDITION_ADDRESS=.*/, `CONDITION_ADDRESS=${conditionAddress}`);
  envContent = envContent.replace(/MERKLE_DISTRIBUTOR_ADDRESS=.*/, `MERKLE_DISTRIBUTOR_ADDRESS=${merkleAddress}`);
  
  fs.writeFileSync(envPath, envContent);
  console.log(`${colors.green}📝 Updated .env.dao with deployed addresses${colors.reset}`);
  
  // Summary
  console.log(`\n${colors.bright}${colors.green}
╔════════════════════════════════════════════════╗
║           🎉 DEPLOYMENT SUCCESSFUL!             ║
╚════════════════════════════════════════════════╝
${colors.reset}`);
  
  console.log(`${colors.cyan}📋 Deployment Summary:${colors.reset}`);
  console.log(`   CGC Token: ${cgcTokenAddress}`);
  console.log(`   GovTokenVault: ${vaultAddress}`);
  console.log(`   AllowedSignersCondition: ${conditionAddress}`);
  console.log(`   MerklePayouts: ${merkleAddress}`);
  
  console.log(`\n${colors.cyan}🔗 View on Explorer:${colors.reset}`);
  console.log(`   ${networkConfig.explorerUrl}/address/${cgcTokenAddress}`);
  console.log(`   ${networkConfig.explorerUrl}/address/${vaultAddress}`);
  console.log(`   ${networkConfig.explorerUrl}/address/${conditionAddress}`);
  console.log(`   ${networkConfig.explorerUrl}/address/${merkleAddress}`);
  
  console.log(`\n${colors.bright}${colors.blue}📚 Next Steps:${colors.reset}`);
  console.log(`   1. Verify contracts are showing as verified on explorer`);
  console.log(`   2. Configure Aragon DAO permissions for the Vault`);
  console.log(`   3. Register EAS schema for attestations`);
  console.log(`   4. Setup Discord/Telegram bots with contract addresses`);
  console.log(`   5. Update dashboard to connect to deployed contracts`);
  console.log(`   6. Disable shadow mode when ready for production`);
}

// Execute deployment
deploy().catch(error => {
  console.error(`${colors.red}❌ Deployment failed:${colors.reset}`, error);
  process.exit(1);
});