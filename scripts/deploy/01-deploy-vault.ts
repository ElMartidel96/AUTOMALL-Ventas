import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Deploy GovTokenVault Contract
 * 
 * This script deploys the main vault for programmatic token releases
 * Must be run AFTER the CGC token is deployed
 * 
 * Network: Base Mainnet
 * DAO: 0x3244DFBf9E5374DF2f106E89Cf7972E5D4C9ac31
 */

// Configuration
const DAO_ADDRESS = "0x3244DFBf9E5374DF2f106E89Cf7972E5D4C9ac31";
const TOKEN_VOTING_ADDRESS = "0x8Bf2C7555B9d0b96b9bC7782671553C91E6Fcd2b";
const ADMIN_PLUGIN_ADDRESS = "0xaaAC7a7e1b9f5e14711903d9418C36D01E143667";
const CGC_TOKEN_ADDRESS = process.env.CGC_TOKEN_ADDRESS || "";

// Shadow mode enabled by default for safety
const ENABLE_SHADOW_MODE = true;

// Default caps (in CGC tokens with decimals)
const DEFAULT_GLOBAL_DAILY_CAP = ethers.parseEther("5000");
const DEFAULT_GLOBAL_WEEKLY_CAP = ethers.parseEther("30000");
const DEFAULT_GLOBAL_MONTHLY_CAP = ethers.parseEther("100000");
const DEFAULT_PER_USER_DAILY_CAP = ethers.parseEther("500");
const DEFAULT_PER_USER_WEEKLY_CAP = ethers.parseEther("3000");
const DEFAULT_PER_USER_MONTHLY_CAP = ethers.parseEther("10000");

async function main() {
  console.log("🚀 Starting Vault deployment...");
  console.log("================================================");
  
  // Verify CGC token is set
  if (!CGC_TOKEN_ADDRESS) {
    throw new Error("CGC_TOKEN_ADDRESS not set in .env. Deploy token first with 00-deploy-token.ts");
  }
  
  // Get network info
  const network = await ethers.provider.getNetwork();
  console.log(`📡 Network: ${network.name} (chainId: ${network.chainId})`);
  
  // Get deployer
  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}`);
  
  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Deployer balance: ${ethers.formatEther(balance)} ETH`);
  
  if (balance < ethers.parseEther("0.02")) {
    throw new Error("Insufficient ETH balance for deployment");
  }
  
  // Deploy GovTokenVault
  console.log("\n📦 Deploying GovTokenVault...");
  const GovTokenVault = await ethers.getContractFactory("GovTokenVault");
  
  const vault = await GovTokenVault.deploy(
    CONFIG.CGC_TOKEN_ADDRESS,
    CONFIG.DAO_ADDRESS,
    CONFIG.EAS_CONTRACT_ADDRESS,
    CONFIG.INITIAL_DAILY_CAP,
    CONFIG.INITIAL_WEEKLY_CAP,
    CONFIG.INITIAL_MONTHLY_CAP,
    {
      gasLimit: CONFIG.GAS_LIMIT,
    }
  );
  
  await vault.deployed();
  console.log("✅ GovTokenVault deployed to:", vault.address);
  
  // Wait for confirmations
  console.log(`Waiting for ${CONFIG.CONFIRMATION_BLOCKS} confirmations...`);
  await vault.deployTransaction.wait(CONFIG.CONFIRMATION_BLOCKS);
  
  // Verify initial state
  console.log("\n🔍 Verifying initial state...");
  const shadowMode = await vault.shadowMode();
  console.log("Shadow Mode:", shadowMode);
  console.log("Daily Cap:", ethers.utils.formatEther(await vault.globalDailyCap()), "CGC");
  console.log("Weekly Cap:", ethers.utils.formatEther(await vault.globalWeeklyCap()), "CGC");
  console.log("Monthly Cap:", ethers.utils.formatEther(await vault.globalMonthlyCap()), "CGC");
  
  // Deploy AllowedSignersCondition
  console.log("\n📦 Deploying AllowedSignersCondition...");
  const AllowedSignersCondition = await ethers.getContractFactory("AllowedSignersCondition");
  
  // Initial signers (can be empty, will be added via DAO proposal)
  const initialSigners: string[] = [];
  
  const condition = await AllowedSignersCondition.deploy(
    CONFIG.DAO_ADDRESS,
    vault.address,
    initialSigners,
    {
      gasLimit: CONFIG.GAS_LIMIT,
    }
  );
  
  await condition.deployed();
  console.log("✅ AllowedSignersCondition deployed to:", condition.address);
  
  // Wait for confirmations
  await condition.deployTransaction.wait(CONFIG.CONFIRMATION_BLOCKS);
  
  // Deploy MerklePayouts
  console.log("\n📦 Deploying MerklePayouts...");
  const MerklePayouts = await ethers.getContractFactory("MerklePayouts");
  
  const merkle = await MerklePayouts.deploy(
    CONFIG.CGC_TOKEN_ADDRESS,
    CONFIG.DAO_ADDRESS,
    {
      gasLimit: CONFIG.GAS_LIMIT,
    }
  );
  
  await merkle.deployed();
  console.log("✅ MerklePayouts deployed to:", merkle.address);
  
  // Wait for confirmations
  await merkle.deployTransaction.wait(CONFIG.CONFIRMATION_BLOCKS);
  
  // Prepare deployment summary
  const deployment = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      GovTokenVault: vault.address,
      AllowedSignersCondition: condition.address,
      MerklePayouts: merkle.address,
    },
    configuration: {
      daoAddress: CONFIG.DAO_ADDRESS,
      cgcToken: CONFIG.CGC_TOKEN_ADDRESS,
      easContract: CONFIG.EAS_CONTRACT_ADDRESS,
      initialDailyCap: ethers.utils.formatEther(CONFIG.INITIAL_DAILY_CAP),
      initialWeeklyCap: ethers.utils.formatEther(CONFIG.INITIAL_WEEKLY_CAP),
      initialMonthlyCap: ethers.utils.formatEther(CONFIG.INITIAL_MONTHLY_CAP),
    },
    status: {
      shadowMode: shadowMode,
      paused: await vault.paused(),
    }
  };
  
  // Save deployment info
  const fs = require("fs");
  const deploymentPath = "./deployment/deployment-vault.json";
  fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
  console.log("\n💾 Deployment info saved to:", deploymentPath);
  
  // Verify on Etherscan
  if (CONFIG.VERIFY_ON_ETHERSCAN && CONFIG.ETHERSCAN_API_KEY) {
    console.log("\n🔍 Verifying contracts on Etherscan...");
    
    try {
      // Verify GovTokenVault
      await run("verify:verify", {
        address: vault.address,
        constructorArguments: [
          CONFIG.CGC_TOKEN_ADDRESS,
          CONFIG.DAO_ADDRESS,
          CONFIG.EAS_CONTRACT_ADDRESS,
          CONFIG.INITIAL_DAILY_CAP,
          CONFIG.INITIAL_WEEKLY_CAP,
          CONFIG.INITIAL_MONTHLY_CAP,
        ],
      });
      console.log("✅ GovTokenVault verified");
      
      // Verify AllowedSignersCondition
      await run("verify:verify", {
        address: condition.address,
        constructorArguments: [
          CONFIG.DAO_ADDRESS,
          vault.address,
          initialSigners,
        ],
      });
      console.log("✅ AllowedSignersCondition verified");
      
      // Verify MerklePayouts
      await run("verify:verify", {
        address: merkle.address,
        constructorArguments: [
          CONFIG.CGC_TOKEN_ADDRESS,
          CONFIG.DAO_ADDRESS,
        ],
      });
      console.log("✅ MerklePayouts verified");
      
    } catch (error) {
      console.error("Verification error:", error);
      console.log("You can verify manually later");
    }
  }
  
  // Next steps
  console.log("\n" + "=".repeat(50));
  console.log("📋 NEXT STEPS:");
  console.log("=".repeat(50));
  console.log("1. Run 02-setup-aragon.ts to configure Aragon permissions");
  console.log("2. Transfer CGC tokens to the Vault");
  console.log("3. Create DAO proposal to:");
  console.log("   - Grant RELEASE_PERMISSION with AllowedSignersCondition");
  console.log("   - Add initial signers to the condition");
  console.log("   - Disable shadow mode when ready");
  console.log("\n🎉 Deployment complete!");
}

// Error handling
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });

// Helper function for Etherscan verification
async function run(task: string, args: any) {
  const { run } = await import("hardhat");
  return run(task, args);
}