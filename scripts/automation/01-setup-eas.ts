import { ethers } from "hardhat";
import { EAS, SchemaRegistry, SchemaEncoder } from "@ethereum-attestation-service/eas-sdk";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Complete EAS Setup Automation
 * 
 * This script automates:
 * 1. Schema registration on Base network
 * 2. Attestation system setup
 * 3. Verification and testing
 */

// EAS Contract Addresses for Base Network
const BASE_MAINNET_CONFIG = {
  EAS_CONTRACT: "0x4200000000000000000000000000000000000021",
  SCHEMA_REGISTRY: "0x4200000000000000000000000000000000000020",
  CHAIN_ID: 8453
};

const BASE_SEPOLIA_CONFIG = {
  EAS_CONTRACT: "0x4200000000000000000000000000000000000021", 
  SCHEMA_REGISTRY: "0x4200000000000000000000000000000000000020",
  CHAIN_ID: 84532
};

// Schema definitions for different attestation types
const SCHEMAS = {
  goalCompleted: {
    name: "GoalCompleted",
    schema: "address recipient,uint256 goalId,uint256 score,uint256 timestamp,uint256 expirationTime,uint256 campaignId,string platform,bytes32 externalId",
    description: "Attestation for completed goals from quest platforms"
  },
  contributorRole: {
    name: "ContributorRole",
    schema: "address contributor,string role,uint256 level,uint256 startDate,uint256 endDate,bytes32 proofHash",
    description: "Attestation for contributor roles and permissions"
  },
  tokenRelease: {
    name: "TokenReleaseApproval",
    schema: "address beneficiary,uint256 amount,uint256 releaseId,bytes32 merkleRoot,uint256 timestamp,bool approved",
    description: "Attestation for approved token releases"
  }
};

interface AttestationData {
  recipient: string;
  goalId?: number;
  score?: number;
  platform?: string;
  expirationTime?: number;
}

class EASAutomation {
  private eas: EAS;
  private schemaRegistry: SchemaRegistry;
  private provider: ethers.Provider;
  private signer: ethers.Signer;
  private config: typeof BASE_MAINNET_CONFIG;
  private schemaUIDs: Map<string, string> = new Map();
  
  constructor(network: "base" | "baseSepolia" = "base") {
    this.config = network === "base" ? BASE_MAINNET_CONFIG : BASE_SEPOLIA_CONFIG;
    this.provider = ethers.provider;
    this.initializeSigner();
    this.initializeContracts();
  }
  
  private async initializeSigner() {
    const signers = await ethers.getSigners();
    this.signer = signers[0];
    console.log(`📝 Using signer: ${await this.signer.getAddress()}`);
  }
  
  private initializeContracts() {
    // Initialize EAS
    this.eas = new EAS(this.config.EAS_CONTRACT);
    this.eas.connect(this.signer);
    
    // Initialize Schema Registry
    this.schemaRegistry = new SchemaRegistry(this.config.SCHEMA_REGISTRY);
    this.schemaRegistry.connect(this.signer);
  }
  
  /**
   * Register a schema on EAS
   */
  async registerSchema(
    schemaType: keyof typeof SCHEMAS,
    revocable: boolean = true
  ): Promise<string> {
    const schemaData = SCHEMAS[schemaType];
    
    console.log(`\n📜 Registering schema: ${schemaData.name}`);
    console.log(`Schema: ${schemaData.schema}`);
    
    try {
      const transaction = await this.schemaRegistry.register({
        schema: schemaData.schema,
        resolver: ethers.ZeroAddress,
        revocable: revocable
      });
      
      console.log(`⏳ Transaction: ${transaction.tx.hash}`);
      console.log("⏳ Waiting for confirmation...");
      
      const receipt = await transaction.tx.wait();
      console.log(`✅ Schema registered in block: ${receipt.blockNumber}`);
      
      // Store schema UID
      this.schemaUIDs.set(schemaType, transaction.uid);
      
      console.log(`📌 Schema UID: ${transaction.uid}`);
      
      return transaction.uid;
    } catch (error: any) {
      if (error.message?.includes("AlreadyExists")) {
        console.log("⚠️ Schema already exists, fetching existing UID...");
        // In production, you would fetch the existing schema UID here
        throw new Error("Schema already registered. Please check existing schemas.");
      }
      throw error;
    }
  }
  
  /**
   * Create an attestation
   */
  async createAttestation(
    schemaUID: string,
    data: AttestationData,
    expirationHours: number = 72
  ): Promise<string> {
    console.log(`\n🎯 Creating attestation for ${data.recipient}`);
    
    const schemaEncoder = new SchemaEncoder(SCHEMAS.goalCompleted.schema);
    
    const timestamp = Math.floor(Date.now() / 1000);
    const expirationTime = data.expirationTime || (timestamp + (expirationHours * 3600));
    
    const encodedData = schemaEncoder.encodeData([
      { name: "recipient", value: data.recipient, type: "address" },
      { name: "goalId", value: data.goalId || 0, type: "uint256" },
      { name: "score", value: data.score || 100, type: "uint256" },
      { name: "timestamp", value: timestamp, type: "uint256" },
      { name: "expirationTime", value: expirationTime, type: "uint256" },
      { name: "campaignId", value: 1, type: "uint256" },
      { name: "platform", value: data.platform || "direct", type: "string" },
      { name: "externalId", value: ethers.id(timestamp.toString()), type: "bytes32" }
    ]);
    
    try {
      const tx = await this.eas.attest({
        schema: schemaUID,
        data: {
          recipient: data.recipient,
          expirationTime: BigInt(expirationTime),
          revocable: true,
          refUID: ethers.ZeroHash,
          data: encodedData,
          value: 0n
        }
      });
      
      console.log(`⏳ Transaction: ${tx.tx.hash}`);
      const receipt = await tx.wait();
      
      console.log(`✅ Attestation created: ${tx.uid}`);
      console.log(`📦 Block: ${receipt.blockNumber}`);
      
      return tx.uid;
    } catch (error) {
      console.error("❌ Attestation failed:", error);
      throw error;
    }
  }
  
  /**
   * Batch create multiple attestations
   */
  async createBatchAttestations(
    schemaUID: string,
    attestations: AttestationData[]
  ): Promise<string[]> {
    console.log(`\n📦 Creating ${attestations.length} attestations in batch...`);
    
    const schemaEncoder = new SchemaEncoder(SCHEMAS.goalCompleted.schema);
    const timestamp = Math.floor(Date.now() / 1000);
    
    const attestationRequests = attestations.map((data, index) => {
      const expirationTime = data.expirationTime || (timestamp + (72 * 3600));
      
      const encodedData = schemaEncoder.encodeData([
        { name: "recipient", value: data.recipient, type: "address" },
        { name: "goalId", value: data.goalId || index, type: "uint256" },
        { name: "score", value: data.score || 100, type: "uint256" },
        { name: "timestamp", value: timestamp, type: "uint256" },
        { name: "expirationTime", value: expirationTime, type: "uint256" },
        { name: "campaignId", value: 1, type: "uint256" },
        { name: "platform", value: data.platform || "batch", type: "string" },
        { name: "externalId", value: ethers.id(`${timestamp}-${index}`), type: "bytes32" }
      ]);
      
      return {
        schema: schemaUID,
        data: {
          recipient: data.recipient,
          expirationTime: BigInt(expirationTime),
          revocable: true,
          refUID: ethers.ZeroHash,
          data: encodedData,
          value: 0n
        }
      };
    });
    
    try {
      const tx = await this.eas.multiAttest(attestationRequests);
      console.log(`⏳ Transaction: ${tx.tx.hash}`);
      
      const receipt = await tx.wait();
      console.log(`✅ Batch attestation complete in block: ${receipt.blockNumber}`);
      
      return tx.uids;
    } catch (error) {
      console.error("❌ Batch attestation failed:", error);
      throw error;
    }
  }
  
  /**
   * Get attestation by UID
   */
  async getAttestation(uid: string): Promise<any> {
    try {
      const attestation = await this.eas.getAttestation(uid);
      console.log(`\n📄 Attestation ${uid}:`);
      console.log(`  Recipient: ${attestation.recipient}`);
      console.log(`  Attester: ${attestation.attester}`);
      console.log(`  Time: ${new Date(Number(attestation.time) * 1000).toISOString()}`);
      console.log(`  Revocable: ${attestation.revocable}`);
      
      return attestation;
    } catch (error) {
      console.error("❌ Failed to get attestation:", error);
      throw error;
    }
  }
  
  /**
   * Revoke an attestation
   */
  async revokeAttestation(uid: string): Promise<void> {
    console.log(`\n🔴 Revoking attestation: ${uid}`);
    
    try {
      const tx = await this.eas.revoke({
        schema: uid,
        data: {
          uid: uid,
          value: 0n
        }
      });
      
      await tx.wait();
      console.log("✅ Attestation revoked successfully");
    } catch (error) {
      console.error("❌ Revocation failed:", error);
      throw error;
    }
  }
  
  /**
   * Save configuration to file
   */
  async saveConfiguration(): Promise<void> {
    const configDir = path.join(__dirname, "../../config");
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    const config = {
      network: await this.provider.getNetwork(),
      eas: {
        contract: this.config.EAS_CONTRACT,
        schemaRegistry: this.config.SCHEMA_REGISTRY
      },
      schemas: Object.fromEntries(this.schemaUIDs),
      timestamp: new Date().toISOString()
    };
    
    const configFile = path.join(configDir, `eas-config-${this.config.CHAIN_ID}.json`);
    fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
    
    console.log(`\n💾 Configuration saved to: ${configFile}`);
  }
}

// Main execution
async function main() {
  console.log("🚀 Starting EAS Automation Setup...");
  console.log("================================================");
  
  const network = process.env.NETWORK as "base" | "baseSepolia" || "base";
  const automation = new EASAutomation(network);
  
  // Step 1: Register all schemas
  console.log("\n📋 Step 1: Registering Schemas");
  const schemaUIDs: Record<string, string> = {};
  
  for (const [key, _] of Object.entries(SCHEMAS)) {
    try {
      const uid = await automation.registerSchema(key as keyof typeof SCHEMAS);
      schemaUIDs[key] = uid;
      
      // Update .env file
      const envPath = path.join(__dirname, "../../.env");
      if (fs.existsSync(envPath)) {
        let envContent = fs.readFileSync(envPath, "utf-8");
        envContent += `\n${key.toUpperCase()}_SCHEMA_UID=${uid}`;
        fs.writeFileSync(envPath, envContent);
      }
    } catch (error) {
      console.log(`⚠️ Skipping ${key} schema registration: ${error.message}`);
    }
  }
  
  // Step 2: Create test attestation
  if (schemaUIDs.goalCompleted) {
    console.log("\n📋 Step 2: Creating Test Attestation");
    
    const testData: AttestationData = {
      recipient: await (await ethers.getSigners())[0].getAddress(),
      goalId: 1,
      score: 100,
      platform: "test"
    };
    
    const attestationUID = await automation.createAttestation(
      schemaUIDs.goalCompleted,
      testData
    );
    
    // Verify attestation
    await automation.getAttestation(attestationUID);
  }
  
  // Step 3: Save configuration
  await automation.saveConfiguration();
  
  console.log("\n================================================");
  console.log("✅ EAS SETUP COMPLETE!");
  console.log("================================================");
  console.log("\n📋 Next Steps:");
  console.log("1. Schema UIDs have been added to your .env file");
  console.log("2. Update bot configuration with schema UIDs");
  console.log("3. Configure webhook endpoints to create attestations");
  console.log("4. Test attestation flow with quest platforms");
}

// Export for use in other scripts
export { EASAutomation, SCHEMAS };

// Execute if run directly
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Setup failed:", error);
      process.exit(1);
    });
}