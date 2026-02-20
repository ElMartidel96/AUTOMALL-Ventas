import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Register EAS Schema
 * 
 * This script registers the GoalCompleted schema on the
 * Ethereum Attestation Service for Base network
 */

// EAS Contract Addresses for Base
const EAS_CONTRACT_ADDRESS = "0x4200000000000000000000000000000000000021";
const SCHEMA_REGISTRY_ADDRESS = "0x4200000000000000000000000000000000000020";

// Schema definition for GoalCompleted attestations
const SCHEMA = "address recipient,uint256 goalId,uint256 score,uint256 timestamp,uint256 expirationTime,uint256 campaignId,string platform,bytes32 externalId";
const SCHEMA_NAME = "GoalCompleted";
const RESOLVER_ADDRESS = ethers.ZeroAddress; // No resolver needed
const REVOCABLE = true; // Allow attestations to be revoked

async function main() {
  console.log("📜 Registering EAS Schema...");
  console.log("================================================");
  
  // Get network info
  const network = await ethers.provider.getNetwork();
  console.log(`📡 Network: ${network.name} (chainId: ${network.chainId})`);
  
  // Get deployer
  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}`);
  
  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH`);
  
  // Connect to Schema Registry
  console.log("\n🔗 Connecting to Schema Registry...");
  console.log(`Registry Address: ${SCHEMA_REGISTRY_ADDRESS}`);
  
  // Schema Registry ABI
  const schemaRegistryABI = [
    "function register(string calldata schema, address resolver, bool revocable) external returns (bytes32)",
    "function getSchema(bytes32 uid) external view returns (tuple(bytes32 uid, address resolver, bool revocable, string schema) schema)",
    "event Registered(bytes32 indexed uid, address indexed registerer)"
  ];
  
  const schemaRegistry = new ethers.Contract(
    SCHEMA_REGISTRY_ADDRESS,
    schemaRegistryABI,
    deployer
  );
  
  // Check if registry exists
  const registryCode = await ethers.provider.getCode(SCHEMA_REGISTRY_ADDRESS);
  if (registryCode === "0x") {
    throw new Error("Schema Registry not found at address. Are you on the right network?");
  }
  console.log("✅ Schema Registry verified");
  
  // Register schema
  console.log("\n📝 Registering schema...");
  console.log(`Schema: ${SCHEMA}`);
  console.log(`Resolver: ${RESOLVER_ADDRESS}`);
  console.log(`Revocable: ${REVOCABLE}`);
  
  try {
    // Estimate gas
    const estimatedGas = await schemaRegistry.register.estimateGas(
      SCHEMA,
      RESOLVER_ADDRESS,
      REVOCABLE
    );
    console.log(`⛽ Estimated gas: ${estimatedGas.toString()}`);
    
    // Register schema
    const tx = await schemaRegistry.register(
      SCHEMA,
      RESOLVER_ADDRESS,
      REVOCABLE,
      {
        gasLimit: estimatedGas * 120n / 100n // 20% buffer
      }
    );
    
    console.log(`\n⏳ Transaction hash: ${tx.hash}`);
    console.log("⏳ Waiting for confirmation...");
    
    // Wait for transaction
    const receipt = await tx.wait();
    console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
    
    // Get schema UID from event
    const event = receipt.logs.find((log: any) => {
      try {
        const parsed = schemaRegistry.interface.parseLog(log);
        return parsed?.name === "Registered";
      } catch {
        return false;
      }
    });
    
    if (!event) {
      throw new Error("Registration event not found");
    }
    
    const parsedEvent = schemaRegistry.interface.parseLog(event);
    const schemaUID = parsedEvent?.args[0];
    
    console.log(`\n✅ Schema registered successfully!`);
    console.log(`📌 Schema UID: ${schemaUID}`);
    
    // Verify schema
    console.log("\n🔍 Verifying schema...");
    const registeredSchema = await schemaRegistry.getSchema(schemaUID);
    console.log(`Schema data retrieved:`, {
      uid: registeredSchema.uid,
      resolver: registeredSchema.resolver,
      revocable: registeredSchema.revocable,
      schema: registeredSchema.schema.substring(0, 50) + "..."
    });
    
    // Save schema info
    const schemaInfo = {
      network: network.name,
      chainId: Number(network.chainId),
      registeredAt: new Date().toISOString(),
      schemaUID: schemaUID,
      schemaName: SCHEMA_NAME,
      schema: SCHEMA,
      resolver: RESOLVER_ADDRESS,
      revocable: REVOCABLE,
      registryAddress: SCHEMA_REGISTRY_ADDRESS,
      easAddress: EAS_CONTRACT_ADDRESS,
      deployer: deployer.address,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber
    };
    
    // Save to deployments
    const deploymentsDir = path.join(__dirname, "../../deployments");
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    
    const schemaFile = path.join(deploymentsDir, `eas-schema-${network.chainId}.json`);
    fs.writeFileSync(schemaFile, JSON.stringify(schemaInfo, null, 2));
    console.log(`\n📁 Schema info saved to: ${schemaFile}`);
    
    // Update deployment file
    const deploymentFile = path.join(deploymentsDir, `deployment-${network.chainId}.json`);
    if (fs.existsSync(deploymentFile)) {
      const deployment = JSON.parse(fs.readFileSync(deploymentFile, "utf-8"));
      deployment.eas = {
        schemaUID: schemaUID,
        schemaRegistryAddress: SCHEMA_REGISTRY_ADDRESS,
        easContractAddress: EAS_CONTRACT_ADDRESS
      };
      fs.writeFileSync(deploymentFile, JSON.stringify(deployment, null, 2));
      console.log(`📁 Deployment file updated`);
    }
    
    // Print summary
    console.log("\n================================================");
    console.log("🎉 EAS SCHEMA REGISTRATION SUCCESSFUL!");
    console.log("================================================");
    console.log(`Schema UID: ${schemaUID}`);
    console.log(`Registry: ${SCHEMA_REGISTRY_ADDRESS}`);
    console.log(`EAS Contract: ${EAS_CONTRACT_ADDRESS}`);
    console.log("================================================");
    
    console.log("\n📋 Next steps:");
    console.log("1. Update .env with SCHEMA_UID:");
    console.log(`   SCHEMA_UID=${schemaUID}`);
    console.log("2. Update the bot configuration:");
    console.log(`   cd bots/eas-attestor`);
    console.log(`   Update SCHEMA_UID in .env`);
    console.log("3. Start the attestation bot:");
    console.log(`   npm start`);
    
    console.log("\n📚 Schema Fields:");
    console.log("- recipient: address - Who completed the goal");
    console.log("- goalId: uint256 - Unique goal identifier");
    console.log("- score: uint256 - Achievement score (0-100)");
    console.log("- timestamp: uint256 - When goal was completed");
    console.log("- expirationTime: uint256 - When attestation expires");
    console.log("- campaignId: uint256 - Campaign identifier");
    console.log("- platform: string - Quest platform name");
    console.log("- externalId: bytes32 - External reference ID");
    
    return schemaUID;
    
  } catch (error: any) {
    // Check if schema already exists
    if (error.message?.includes("already exists") || error.message?.includes("duplicate")) {
      console.log("\n⚠️ Schema might already be registered. Checking...");
      
      // Try to find existing schema by computing its UID
      const schemaHash = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ["string", "address", "bool"],
          [SCHEMA, RESOLVER_ADDRESS, REVOCABLE]
        )
      );
      
      console.log(`Computed schema hash: ${schemaHash}`);
      console.log("\nℹ️ If the schema was previously registered, use this hash as the SCHEMA_UID");
      
      throw new Error("Schema registration failed. It may already exist.");
    }
    
    throw error;
  }
}

// Execute registration
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Registration failed!");
    console.error(error);
    process.exit(1);
  });