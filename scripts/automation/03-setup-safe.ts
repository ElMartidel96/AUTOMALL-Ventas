import { ethers } from "hardhat";
import Safe, { 
  SafeFactory, 
  SafeAccountConfig,
  EthersAdapter 
} from "@safe-global/protocol-kit";
import { SafeTransactionDataPartial } from "@safe-global/safe-core-sdk-types";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Safe Multisig Setup Automation
 * 
 * This script automates:
 * 1. Safe deployment on Base network
 * 2. Owner configuration
 * 3. Transaction management
 * 4. Module setup for automation
 */

interface SafeConfig {
  owners: string[];
  threshold: number;
  saltNonce?: string;
}

interface SafeDeployment {
  address: string;
  owners: string[];
  threshold: number;
  chainId: number;
  deploymentTx: string;
  createdAt: string;
}

class SafeAutomation {
  private ethAdapter: EthersAdapter;
  private safeFactory: SafeFactory;
  private signer: ethers.Signer;
  private network: string;
  
  constructor() {
    this.network = process.env.NETWORK || "base";
  }
  
  async initialize() {
    // Get signer
    const signers = await ethers.getSigners();
    this.signer = signers[0];
    
    console.log(`👤 Using deployer: ${await this.signer.getAddress()}`);
    
    // Create EthersAdapter
    this.ethAdapter = new EthersAdapter({
      ethers,
      signerOrProvider: this.signer
    });
    
    // Create SafeFactory
    this.safeFactory = await SafeFactory.create({ ethAdapter: this.ethAdapter });
  }
  
  /**
   * Deploy a new Safe
   */
  async deploySafe(config: SafeConfig): Promise<SafeDeployment> {
    console.log("\n🏦 Deploying Safe Multisig...");
    console.log(`  Owners: ${config.owners.length}`);
    console.log(`  Threshold: ${config.threshold}/${config.owners.length}`);
    
    // Validate configuration
    if (config.threshold > config.owners.length) {
      throw new Error("Threshold cannot be greater than number of owners");
    }
    
    if (config.threshold < 1) {
      throw new Error("Threshold must be at least 1");
    }
    
    // Safe configuration
    const safeAccountConfig: SafeAccountConfig = {
      owners: config.owners,
      threshold: config.threshold,
      // Optional: Use a salt nonce for deterministic addresses
      ...(config.saltNonce && { saltNonce: config.saltNonce })
    };
    
    try {
      // Deploy Safe
      const safeSdk = await this.safeFactory.deploySafe({ safeAccountConfig });
      const safeAddress = await safeSdk.getAddress();
      
      console.log(`✅ Safe deployed at: ${safeAddress}`);
      
      // Get deployment transaction
      const deploymentTx = safeSdk.getContractManager().contractNetworks?.[
        await safeSdk.getChainId()
      ]?.safeMasterCopyAddress || "";
      
      // Create deployment record
      const deployment: SafeDeployment = {
        address: safeAddress,
        owners: config.owners,
        threshold: config.threshold,
        chainId: Number(await safeSdk.getChainId()),
        deploymentTx,
        createdAt: new Date().toISOString()
      };
      
      // Save deployment info
      await this.saveDeployment(deployment);
      
      return deployment;
    } catch (error) {
      console.error("❌ Safe deployment failed:", error);
      throw error;
    }
  }
  
  /**
   * Connect to existing Safe
   */
  async connectToSafe(safeAddress: string): Promise<Safe> {
    console.log(`\n🔗 Connecting to Safe: ${safeAddress}`);
    
    try {
      const safeSdk = await Safe.create({
        ethAdapter: this.ethAdapter,
        safeAddress
      });
      
      const owners = await safeSdk.getOwners();
      const threshold = await safeSdk.getThreshold();
      
      console.log(`✅ Connected to Safe`);
      console.log(`  Owners: ${owners.length}`);
      console.log(`  Threshold: ${threshold}`);
      
      return safeSdk;
    } catch (error) {
      console.error("❌ Failed to connect to Safe:", error);
      throw error;
    }
  }
  
  /**
   * Propose a transaction
   */
  async proposeTransaction(
    safeSdk: Safe,
    to: string,
    value: string,
    data: string = "0x"
  ): Promise<string> {
    console.log("\n📝 Proposing transaction...");
    console.log(`  To: ${to}`);
    console.log(`  Value: ${ethers.formatEther(value)} ETH`);
    
    const safeTransactionData: SafeTransactionDataPartial = {
      to,
      value,
      data
    };
    
    try {
      // Create transaction
      const safeTransaction = await safeSdk.createTransaction({ 
        safeTransactionData 
      });
      
      // Get transaction hash
      const txHash = await safeSdk.getTransactionHash(safeTransaction);
      console.log(`  Transaction hash: ${txHash}`);
      
      // Sign transaction
      const signedTx = await safeSdk.signTransaction(safeTransaction);
      console.log("✅ Transaction signed");
      
      // Check if we can execute
      const threshold = await safeSdk.getThreshold();
      const signatures = signedTx.signatures.size;
      
      if (signatures >= threshold) {
        console.log("🚀 Executing transaction...");
        const executionResult = await safeSdk.executeTransaction(signedTx);
        console.log(`✅ Transaction executed: ${executionResult.hash}`);
        return executionResult.hash!;
      } else {
        console.log(`⏳ Need ${threshold - signatures} more signature(s)`);
        return txHash;
      }
    } catch (error) {
      console.error("❌ Transaction proposal failed:", error);
      throw error;
    }
  }
  
  /**
   * Add an owner to Safe
   */
  async addOwner(
    safeSdk: Safe,
    newOwner: string,
    newThreshold?: number
  ): Promise<void> {
    console.log(`\n➕ Adding owner: ${newOwner}`);
    
    const currentOwners = await safeSdk.getOwners();
    
    if (currentOwners.includes(newOwner)) {
      console.log("⚠️ Address is already an owner");
      return;
    }
    
    try {
      const params = {
        ownerAddress: newOwner,
        ...(newThreshold && { threshold: newThreshold })
      };
      
      const safeTransaction = await safeSdk.createAddOwnerTx(params);
      const txHash = await safeSdk.getTransactionHash(safeTransaction);
      
      console.log(`  Transaction hash: ${txHash}`);
      
      // Sign and potentially execute
      const signedTx = await safeSdk.signTransaction(safeTransaction);
      const executionResult = await safeSdk.executeTransaction(signedTx);
      
      console.log(`✅ Owner added: ${executionResult.hash}`);
    } catch (error) {
      console.error("❌ Failed to add owner:", error);
      throw error;
    }
  }
  
  /**
   * Remove an owner from Safe
   */
  async removeOwner(
    safeSdk: Safe,
    ownerToRemove: string,
    newThreshold?: number
  ): Promise<void> {
    console.log(`\n➖ Removing owner: ${ownerToRemove}`);
    
    const currentOwners = await safeSdk.getOwners();
    
    if (!currentOwners.includes(ownerToRemove)) {
      console.log("⚠️ Address is not an owner");
      return;
    }
    
    // Find the previous owner in the linked list
    const ownerIndex = currentOwners.indexOf(ownerToRemove);
    const prevOwner = ownerIndex === 0 
      ? "0x0000000000000000000000000000000000000001"
      : currentOwners[ownerIndex - 1];
    
    try {
      const params = {
        ownerAddress: ownerToRemove,
        ...(newThreshold && { threshold: newThreshold })
      };
      
      const safeTransaction = await safeSdk.createRemoveOwnerTx(params);
      const txHash = await safeSdk.getTransactionHash(safeTransaction);
      
      console.log(`  Transaction hash: ${txHash}`);
      
      // Sign and potentially execute
      const signedTx = await safeSdk.signTransaction(safeTransaction);
      const executionResult = await safeSdk.executeTransaction(signedTx);
      
      console.log(`✅ Owner removed: ${executionResult.hash}`);
    } catch (error) {
      console.error("❌ Failed to remove owner:", error);
      throw error;
    }
  }
  
  /**
   * Change threshold
   */
  async changeThreshold(safeSdk: Safe, newThreshold: number): Promise<void> {
    console.log(`\n🔄 Changing threshold to: ${newThreshold}`);
    
    const owners = await safeSdk.getOwners();
    
    if (newThreshold > owners.length) {
      throw new Error("Threshold cannot be greater than number of owners");
    }
    
    if (newThreshold < 1) {
      throw new Error("Threshold must be at least 1");
    }
    
    try {
      const safeTransaction = await safeSdk.createChangeThresholdTx(newThreshold);
      const txHash = await safeSdk.getTransactionHash(safeTransaction);
      
      console.log(`  Transaction hash: ${txHash}`);
      
      // Sign and potentially execute
      const signedTx = await safeSdk.signTransaction(safeTransaction);
      const executionResult = await safeSdk.executeTransaction(signedTx);
      
      console.log(`✅ Threshold changed: ${executionResult.hash}`);
    } catch (error) {
      console.error("❌ Failed to change threshold:", error);
      throw error;
    }
  }
  
  /**
   * Get Safe information
   */
  async getSafeInfo(safeSdk: Safe): Promise<any> {
    const address = await safeSdk.getAddress();
    const owners = await safeSdk.getOwners();
    const threshold = await safeSdk.getThreshold();
    const balance = await safeSdk.getBalance();
    const nonce = await safeSdk.getNonce();
    
    const info = {
      address,
      owners,
      threshold,
      balance: ethers.formatEther(balance),
      nonce,
      chainId: await safeSdk.getChainId()
    };
    
    console.log("\n📊 Safe Information:");
    console.log(`  Address: ${info.address}`);
    console.log(`  Owners: ${info.owners.length}`);
    info.owners.forEach((owner, i) => {
      console.log(`    ${i + 1}. ${owner}`);
    });
    console.log(`  Threshold: ${info.threshold}/${info.owners.length}`);
    console.log(`  Balance: ${info.balance} ETH`);
    console.log(`  Nonce: ${info.nonce}`);
    console.log(`  Chain ID: ${info.chainId}`);
    
    return info;
  }
  
  /**
   * Save deployment information
   */
  private async saveDeployment(deployment: SafeDeployment): Promise<void> {
    const configDir = path.join(__dirname, "../../config");
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    const configFile = path.join(configDir, `safe-deployment-${deployment.chainId}.json`);
    
    let deployments = [];
    if (fs.existsSync(configFile)) {
      deployments = JSON.parse(fs.readFileSync(configFile, "utf-8"));
    }
    
    deployments.push(deployment);
    
    fs.writeFileSync(configFile, JSON.stringify(deployments, null, 2));
    console.log(`💾 Deployment saved to: ${configFile}`);
    
    // Update .env
    const envPath = path.join(__dirname, "../../.env");
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, "utf-8");
      
      if (!envContent.includes("SAFE_ADDRESS")) {
        envContent += `\nSAFE_ADDRESS=${deployment.address}`;
        fs.writeFileSync(envPath, envContent);
        console.log("✅ Safe address added to .env");
      }
    }
  }
}

// Main execution
async function main() {
  console.log("🚀 Starting Safe Multisig Setup...");
  console.log("================================================");
  
  const safe = new SafeAutomation();
  await safe.initialize();
  
  // Configuration
  const SAFE_ADDRESS = process.env.SAFE_ADDRESS;
  
  if (SAFE_ADDRESS) {
    // Connect to existing Safe
    console.log("\n📋 Connecting to Existing Safe");
    const safeSdk = await safe.connectToSafe(SAFE_ADDRESS);
    
    // Get Safe info
    await safe.getSafeInfo(safeSdk);
    
    // Example: Propose a transaction
    // await safe.proposeTransaction(
    //   safeSdk,
    //   "0x...", // recipient
    //   ethers.parseEther("0.1").toString(), // value
    //   "0x" // data
    // );
    
  } else {
    // Deploy new Safe
    console.log("\n📋 Deploying New Safe");
    
    // Get signers for owners
    const signers = await ethers.getSigners();
    const owners = [
      await signers[0].getAddress(),
      // Add more owners as needed
      // process.env.SAFE_OWNER_2 || "",
      // process.env.SAFE_OWNER_3 || ""
    ].filter(addr => addr !== "");
    
    const config: SafeConfig = {
      owners,
      threshold: Math.ceil(owners.length / 2), // 50% threshold
      saltNonce: Date.now().toString() // For deterministic address
    };
    
    const deployment = await safe.deploySafe(config);
    
    console.log("\n================================================");
    console.log("✅ SAFE DEPLOYMENT COMPLETE!");
    console.log("================================================");
    console.log(`Safe Address: ${deployment.address}`);
    console.log(`Owners: ${deployment.owners.length}`);
    console.log(`Threshold: ${deployment.threshold}`);
    console.log("\n📋 Next Steps:");
    console.log("1. Fund the Safe with ETH for operations");
    console.log("2. Transfer CGC tokens to Safe for treasury");
    console.log("3. Configure modules for automation");
    console.log("4. Set up transaction service integration");
  }
  
  // Generate integration code
  const integrationExample = `
// Connect to Safe in your application:
const safeSdk = await Safe.create({
  ethAdapter,
  safeAddress: "${SAFE_ADDRESS || "YOUR_SAFE_ADDRESS"}"
});

// Create and execute transactions
const tx = await safeSdk.createTransaction({ safeTransactionData });
const signedTx = await safeSdk.signTransaction(tx);
const result = await safeSdk.executeTransaction(signedTx);
`;
  
  console.log("\n📝 Integration Example:");
  console.log(integrationExample);
}

// Export for use in other scripts
export { SafeAutomation };

// Execute if run directly
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Setup failed:", error);
      process.exit(1);
    });
}