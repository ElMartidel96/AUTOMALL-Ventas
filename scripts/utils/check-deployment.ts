import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * Check Deployment Status
 * 
 * This script verifies the deployment and configuration
 * of all contracts in the DAO system
 */

async function main() {
  console.log("🔍 Checking Deployment Status...");
  console.log("================================================");
  
  // Get network info
  const network = await ethers.provider.getNetwork();
  console.log(`📡 Network: ${network.name} (chainId: ${network.chainId})`);
  
  // Load deployment file
  const deploymentsDir = path.join(__dirname, "../../deployments");
  const deploymentFile = path.join(deploymentsDir, `deployment-${network.chainId}.json`);
  
  if (!fs.existsSync(deploymentFile)) {
    console.log("❌ No deployment found for this network");
    console.log("Run deployment scripts first");
    return;
  }
  
  const deployment = JSON.parse(fs.readFileSync(deploymentFile, "utf-8"));
  console.log(`\n📁 Deployment file loaded from: ${deploymentFile}`);
  console.log(`📅 Deployed at: ${deployment.deployedAt || "Unknown"}`);
  
  const results: any = {
    network: network.name,
    chainId: Number(network.chainId),
    checkedAt: new Date().toISOString(),
    contracts: {},
    configuration: {},
    issues: []
  };
  
  // Check CGC Token
  if (deployment.contracts?.CGCToken) {
    console.log("\n📌 Checking CGC Token...");
    const tokenAddress = deployment.contracts.CGCToken.address;
    
    try {
      const token = await ethers.getContractAt("CGCToken", tokenAddress);
      const name = await token.name();
      const symbol = await token.symbol();
      const totalSupply = await token.totalSupply();
      const daoBalance = await token.balanceOf(deployment.dao?.address || ethers.ZeroAddress);
      
      console.log(`  Address: ${tokenAddress}`);
      console.log(`  Name: ${name}`);
      console.log(`  Symbol: ${symbol}`);
      console.log(`  Total Supply: ${ethers.formatEther(totalSupply)} CGC`);
      console.log(`  DAO Balance: ${ethers.formatEther(daoBalance)} CGC`);
      
      results.contracts.CGCToken = {
        address: tokenAddress,
        verified: deployment.contracts.CGCToken.verified || false,
        name,
        symbol,
        totalSupply: ethers.formatEther(totalSupply),
        daoBalance: ethers.formatEther(daoBalance)
      };
      
      console.log("  ✅ Token is live and functional");
    } catch (error: any) {
      console.log(`  ❌ Error checking token: ${error.message}`);
      results.issues.push(`CGC Token check failed: ${error.message}`);
    }
  }
  
  // Check GovTokenVault
  if (deployment.contracts?.GovTokenVault) {
    console.log("\n📌 Checking GovTokenVault...");
    const vaultAddress = deployment.contracts.GovTokenVault.address;
    
    try {
      const vault = await ethers.getContractAt("GovTokenVault", vaultAddress);
      const shadowMode = await vault.shadowMode();
      const paused = await vault.paused();
      const authorizedSigner = await vault.authorizedSigner();
      const token = await vault.token();
      
      console.log(`  Address: ${vaultAddress}`);
      console.log(`  Shadow Mode: ${shadowMode ? "ENABLED ✅" : "DISABLED ❌"}`);
      console.log(`  Paused: ${paused ? "YES ⚠️" : "NO ✅"}`);
      console.log(`  Authorized Signer: ${authorizedSigner}`);
      console.log(`  Token: ${token}`);
      
      // Check vault balance
      if (deployment.contracts?.CGCToken) {
        const tokenContract = await ethers.getContractAt("CGCToken", deployment.contracts.CGCToken.address);
        const vaultBalance = await tokenContract.balanceOf(vaultAddress);
        console.log(`  Vault Balance: ${ethers.formatEther(vaultBalance)} CGC`);
        
        results.contracts.GovTokenVault = {
          address: vaultAddress,
          verified: deployment.contracts.GovTokenVault.verified || false,
          shadowMode,
          paused,
          authorizedSigner,
          vaultBalance: ethers.formatEther(vaultBalance)
        };
        
        if (vaultBalance === 0n && !shadowMode) {
          results.issues.push("Vault has no CGC tokens but shadow mode is disabled");
        }
      }
      
      console.log("  ✅ Vault is live and functional");
    } catch (error: any) {
      console.log(`  ❌ Error checking vault: ${error.message}`);
      results.issues.push(`GovTokenVault check failed: ${error.message}`);
    }
  }
  
  // Check AllowedSignersCondition
  if (deployment.contracts?.AllowedSignersCondition) {
    console.log("\n📌 Checking AllowedSignersCondition...");
    const conditionAddress = deployment.contracts.AllowedSignersCondition.address;
    
    try {
      const condition = await ethers.getContractAt("AllowedSignersCondition", conditionAddress);
      const dao = await condition.dao();
      
      console.log(`  Address: ${conditionAddress}`);
      console.log(`  DAO: ${dao}`);
      
      results.contracts.AllowedSignersCondition = {
        address: conditionAddress,
        verified: deployment.contracts.AllowedSignersCondition.verified || false,
        dao
      };
      
      console.log("  ✅ Condition contract is live");
    } catch (error: any) {
      console.log(`  ❌ Error checking condition: ${error.message}`);
      results.issues.push(`AllowedSignersCondition check failed: ${error.message}`);
    }
  }
  
  // Check MerklePayouts
  if (deployment.contracts?.MerklePayouts) {
    console.log("\n📌 Checking MerklePayouts...");
    const merkleAddress = deployment.contracts.MerklePayouts.address;
    
    try {
      const merkle = await ethers.getContractAt("MerklePayouts", merkleAddress);
      const token = await merkle.token();
      const vault = await merkle.vault();
      const shadowMode = await merkle.shadowMode();
      
      console.log(`  Address: ${merkleAddress}`);
      console.log(`  Token: ${token}`);
      console.log(`  Vault: ${vault}`);
      console.log(`  Shadow Mode: ${shadowMode ? "ENABLED ✅" : "DISABLED ❌"}`);
      
      results.contracts.MerklePayouts = {
        address: merkleAddress,
        verified: deployment.contracts.MerklePayouts.verified || false,
        token,
        vault,
        shadowMode
      };
      
      console.log("  ✅ MerklePayouts is live");
    } catch (error: any) {
      console.log(`  ❌ Error checking merkle: ${error.message}`);
      results.issues.push(`MerklePayouts check failed: ${error.message}`);
    }
  }
  
  // Check EAS Schema
  if (deployment.eas?.schemaUID) {
    console.log("\n📌 Checking EAS Schema...");
    console.log(`  Schema UID: ${deployment.eas.schemaUID}`);
    console.log(`  Registry: ${deployment.eas.schemaRegistryAddress}`);
    console.log(`  EAS Contract: ${deployment.eas.easContractAddress}`);
    
    results.configuration.eas = {
      schemaUID: deployment.eas.schemaUID,
      registryAddress: deployment.eas.schemaRegistryAddress,
      easAddress: deployment.eas.easContractAddress
    };
  }
  
  // Summary
  console.log("\n================================================");
  console.log("📊 DEPLOYMENT SUMMARY");
  console.log("================================================");
  
  const contractCount = Object.keys(results.contracts).length;
  console.log(`\n✅ Contracts Deployed: ${contractCount}`);
  
  Object.entries(results.contracts).forEach(([name, data]: [string, any]) => {
    console.log(`   ${name}: ${data.address}`);
  });
  
  if (results.issues.length > 0) {
    console.log(`\n⚠️ Issues Found: ${results.issues.length}`);
    results.issues.forEach((issue: string) => {
      console.log(`   - ${issue}`);
    });
  } else {
    console.log("\n✅ No issues detected");
  }
  
  // Save check results
  const checkFile = path.join(deploymentsDir, `check-${network.chainId}-${Date.now()}.json`);
  fs.writeFileSync(checkFile, JSON.stringify(results, null, 2));
  console.log(`\n📁 Check results saved to: ${checkFile}`);
  
  // Recommendations
  console.log("\n📋 Recommendations:");
  
  if (!deployment.contracts?.CGCToken) {
    console.log("1. Deploy CGC Token first");
  } else if (!deployment.contracts?.GovTokenVault) {
    console.log("1. Deploy Vault contracts");
  } else if (!deployment.eas?.schemaUID) {
    console.log("1. Register EAS schema");
  } else {
    console.log("1. System is ready for Aragon configuration");
    console.log("2. Create DAO proposal to set permissions");
    console.log("3. Transfer CGC tokens to vault");
    console.log("4. Test with shadow mode enabled");
    console.log("5. Disable shadow mode when ready for production");
  }
}

// Execute check
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Check failed!");
    console.error(error);
    process.exit(1);
  });