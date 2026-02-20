import { run } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Verify Contracts on Basescan
 * 
 * This script verifies all deployed contracts on Basescan
 * for transparency and to enable contract interaction
 */

async function main() {
  console.log("🔍 Starting contract verification on Basescan...");
  console.log("================================================");
  
  // Get network info
  const { chainId } = await ethers.provider.getNetwork();
  console.log(`📡 Network Chain ID: ${chainId}`);
  
  // Load deployment info
  const deploymentsDir = path.join(__dirname, "../../deployments");
  const deploymentFile = path.join(deploymentsDir, `deployment-${chainId}.json`);
  
  if (!fs.existsSync(deploymentFile)) {
    throw new Error("Deployment file not found. Run deployment scripts first.");
  }
  
  const deployment = JSON.parse(fs.readFileSync(deploymentFile, "utf-8"));
  
  // Check if API key is set
  if (!process.env.BASESCAN_API_KEY && !process.env.ETHERSCAN_API_KEY) {
    throw new Error("BASESCAN_API_KEY or ETHERSCAN_API_KEY not set in .env");
  }
  
  const verificationResults: any[] = [];
  
  // Verify CGC Token
  if (deployment.contracts?.CGCToken) {
    console.log("\n📝 Verifying CGC Token...");
    const contract = deployment.contracts.CGCToken;
    
    if (contract.verified) {
      console.log("✅ Already verified");
    } else {
      try {
        await verifyContract(
          "CGCToken",
          contract.address,
          contract.constructorArgs || []
        );
        
        contract.verified = true;
        verificationResults.push({
          name: "CGCToken",
          address: contract.address,
          status: "verified"
        });
        console.log("✅ CGC Token verified successfully");
      } catch (error: any) {
        console.log(`⚠️ Verification failed: ${error.message}`);
        verificationResults.push({
          name: "CGCToken",
          address: contract.address,
          status: "failed",
          error: error.message
        });
      }
    }
  }
  
  // Verify GovTokenVault
  if (deployment.contracts?.GovTokenVault) {
    console.log("\n📝 Verifying GovTokenVault...");
    const contract = deployment.contracts.GovTokenVault;
    
    if (contract.verified) {
      console.log("✅ Already verified");
    } else {
      try {
        await verifyContract(
          "GovTokenVault",
          contract.address,
          contract.constructorArgs || []
        );
        
        contract.verified = true;
        verificationResults.push({
          name: "GovTokenVault",
          address: contract.address,
          status: "verified"
        });
        console.log("✅ GovTokenVault verified successfully");
      } catch (error: any) {
        console.log(`⚠️ Verification failed: ${error.message}`);
        verificationResults.push({
          name: "GovTokenVault",
          address: contract.address,
          status: "failed",
          error: error.message
        });
      }
    }
  }
  
  // Verify AllowedSignersCondition
  if (deployment.contracts?.AllowedSignersCondition) {
    console.log("\n📝 Verifying AllowedSignersCondition...");
    const contract = deployment.contracts.AllowedSignersCondition;
    
    if (contract.verified) {
      console.log("✅ Already verified");
    } else {
      try {
        await verifyContract(
          "AllowedSignersCondition",
          contract.address,
          contract.constructorArgs || []
        );
        
        contract.verified = true;
        verificationResults.push({
          name: "AllowedSignersCondition",
          address: contract.address,
          status: "verified"
        });
        console.log("✅ AllowedSignersCondition verified successfully");
      } catch (error: any) {
        console.log(`⚠️ Verification failed: ${error.message}`);
        verificationResults.push({
          name: "AllowedSignersCondition",
          address: contract.address,
          status: "failed",
          error: error.message
        });
      }
    }
  }
  
  // Verify MerklePayouts
  if (deployment.contracts?.MerklePayouts) {
    console.log("\n📝 Verifying MerklePayouts...");
    const contract = deployment.contracts.MerklePayouts;
    
    if (contract.verified) {
      console.log("✅ Already verified");
    } else {
      try {
        await verifyContract(
          "MerklePayouts",
          contract.address,
          contract.constructorArgs || []
        );
        
        contract.verified = true;
        verificationResults.push({
          name: "MerklePayouts",
          address: contract.address,
          status: "verified"
        });
        console.log("✅ MerklePayouts verified successfully");
      } catch (error: any) {
        console.log(`⚠️ Verification failed: ${error.message}`);
        verificationResults.push({
          name: "MerklePayouts",
          address: contract.address,
          status: "failed",
          error: error.message
        });
      }
    }
  }
  
  // Update deployment file with verification status
  fs.writeFileSync(deploymentFile, JSON.stringify(deployment, null, 2));
  console.log("\n📁 Deployment file updated with verification status");
  
  // Print summary
  console.log("\n================================================");
  console.log("📊 VERIFICATION SUMMARY");
  console.log("================================================");
  
  const verified = verificationResults.filter(r => r.status === "verified");
  const failed = verificationResults.filter(r => r.status === "failed");
  
  if (verified.length > 0) {
    console.log("\n✅ Successfully Verified:");
    verified.forEach(r => {
      console.log(`   - ${r.name}: ${r.address}`);
    });
  }
  
  if (failed.length > 0) {
    console.log("\n❌ Failed to Verify:");
    failed.forEach(r => {
      console.log(`   - ${r.name}: ${r.address}`);
      console.log(`     Error: ${r.error}`);
    });
  }
  
  // Generate Basescan URLs
  const basescanUrl = chainId === 8453n 
    ? "https://basescan.org" 
    : "https://sepolia.basescan.org";
  
  console.log("\n🔗 Contract Links:");
  Object.entries(deployment.contracts || {}).forEach(([name, contract]: [string, any]) => {
    console.log(`${name}: ${basescanUrl}/address/${contract.address}`);
  });
  
  console.log("\n================================================");
  
  if (failed.length > 0) {
    console.log("\n⚠️ Some contracts failed verification.");
    console.log("You can verify them manually using:");
    failed.forEach(r => {
      const contract = deployment.contracts[r.name];
      const args = contract.constructorArgs || [];
      console.log(`\nnpx hardhat verify --network ${chainId === 8453n ? "base" : "baseSepolia"} ${r.address} ${args.map((a: any) => `"${a}"`).join(" ")}`);
    });
  }
}

// Helper function to verify a contract
async function verifyContract(
  contractName: string,
  address: string,
  constructorArguments: any[]
): Promise<void> {
  try {
    await run("verify:verify", {
      address: address,
      constructorArguments: constructorArguments,
      contract: `contracts/${contractName}.sol:${contractName}`
    });
  } catch (error: any) {
    // Check if already verified
    if (error.message.includes("already verified")) {
      console.log("✅ Contract already verified on Basescan");
      return;
    }
    
    // Check for rate limiting
    if (error.message.includes("rate limit") || error.message.includes("429")) {
      console.log("⏳ Rate limited. Waiting 5 seconds...");
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Retry once
      await run("verify:verify", {
        address: address,
        constructorArguments: constructorArguments,
        contract: `contracts/${contractName}.sol:${contractName}`
      });
      return;
    }
    
    throw error;
  }
}

// Execute verification
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Verification failed!");
    console.error(error);
    process.exit(1);
  });