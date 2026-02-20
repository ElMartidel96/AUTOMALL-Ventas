import { ethers } from "ethers";
import { EAS, SchemaEncoder, type TransactionSigner } from "@ethereum-attestation-service/eas-sdk";
import express, { type Request, type Response } from "express";
import cors from "cors";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * EAS Attestation Bot
 * 
 * This bot creates on-chain attestations when goals are completed
 * Integrates with quest platforms (Wonderverse, Dework, Zealy)
 * 
 * Flow:
 * 1. Receive webhook from quest platform
 * 2. Validate completion
 * 3. Create EAS attestation
 * 4. Generate EIP-712 signature for token release
 */

// Configuration
const CONFIG = {
  // Network
  RPC_URL: process.env.RPC_URL || "https://mainnet.base.org",
  CHAIN_ID: 8453, // Base Mainnet
  
  // EAS Configuration
  EAS_CONTRACT: process.env.EAS_CONTRACT || "0x4200000000000000000000000000000000000021",
  SCHEMA_REGISTRY: process.env.SCHEMA_REGISTRY || "0x4200000000000000000000000000000000000020",
  SCHEMA_UID: process.env.SCHEMA_UID || "", // To be set after schema registration
  
  // DAO Configuration
  DAO_ADDRESS: "0x3244DFBf9E5374DF2f106E89Cf7972E5D4C9ac31",
  VAULT_ADDRESS: process.env.VAULT_ADDRESS || "",
  
  // Bot Configuration
  ATTESTOR_PRIVATE_KEY: process.env.ATTESTOR_PRIVATE_KEY || "",
  PORT: process.env.PORT || 3001,
  
  // Quest Platforms
  WONDERVERSE_API_KEY: process.env.WONDERVERSE_API_KEY || "",
  DEWORK_API_KEY: process.env.DEWORK_API_KEY || "",
  ZEALY_API_KEY: process.env.ZEALY_API_KEY || "",
};

// Initialize provider and wallet
const provider = new ethers.providers.JsonRpcProvider(CONFIG.RPC_URL);
const wallet = new ethers.Wallet(CONFIG.ATTESTOR_PRIVATE_KEY, provider);

// Initialize EAS
const eas = new EAS(CONFIG.EAS_CONTRACT);
eas.connect(wallet as unknown as TransactionSigner);

// Schema for GoalCompleted attestation
const SCHEMA = "address recipient,uint256 goalId,uint256 score,uint256 timestamp,uint256 expirationTime";
const schemaEncoder = new SchemaEncoder(SCHEMA);

// Express app for webhooks
const app = express();
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "healthy",
    attestor: wallet.address,
    network: CONFIG.CHAIN_ID,
    schema: CONFIG.SCHEMA_UID,
  });
});

// Attestation statistics
let stats = {
  totalAttestations: 0,
  successfulAttestations: 0,
  failedAttestations: 0,
  lastAttestation: null as string | null,
};

app.get("/stats", (_req: Request, res: Response) => {
  res.json(stats);
});

/**
 * Create an attestation for goal completion
 */
async function createAttestation(
  recipient: string,
  goalId: number,
  score: number = 100,
  expirationHours: number = 72
): Promise<string> {
  try {
    console.log(`Creating attestation for ${recipient}, goal ${goalId}`);
    
    const timestamp = Math.floor(Date.now() / 1000);
    const expirationTime = timestamp + (expirationHours * 3600);
    
    // Encode attestation data
    const encodedData = schemaEncoder.encodeData([
      { name: "recipient", value: recipient, type: "address" },
      { name: "goalId", value: goalId, type: "uint256" },
      { name: "score", value: score, type: "uint256" },
      { name: "timestamp", value: timestamp, type: "uint256" },
      { name: "expirationTime", value: expirationTime, type: "uint256" },
    ]);
    
    // Create attestation
    const tx = await eas.attest({
      schema: CONFIG.SCHEMA_UID,
      data: {
        recipient: recipient,
        expirationTime: BigInt(expirationTime),
        revocable: true,
        refUID: "0x0000000000000000000000000000000000000000000000000000000000000000",
        data: encodedData,
        value: BigInt(0),
      },
    });
    
    // Wait for transaction
    const receipt = await tx.wait();
    const attestationUID = (receipt as { logs?: Array<{ topics?: string[] }> }).logs?.[0]?.topics?.[1];

    if (!attestationUID) {
      throw new Error("Attestation UID not found in receipt logs");
    }
    
    console.log(`✅ Attestation created: ${attestationUID}`);
    
    // Update stats
    stats.totalAttestations++;
    stats.successfulAttestations++;
    stats.lastAttestation = attestationUID;
    
    return attestationUID;
    
  } catch (error) {
    console.error("❌ Attestation failed:", error);
    stats.totalAttestations++;
    stats.failedAttestations++;
    throw error;
  }
}

/**
 * Generate EIP-712 signature for token release order
 */
async function generateReleaseOrder(
  beneficiary: string,
  amount: string,
  goalId: number,
  campaignId: number,
  attestationUID: string
): Promise<any> {
  const deadline = Math.floor(Date.now() / 1000) + (15 * 60); // 15 minutes TTL
  const nonce = Date.now(); // Simple nonce strategy
  
  const domain = {
    name: "GovTokenVault",
    version: "1",
    chainId: CONFIG.CHAIN_ID,
    verifyingContract: CONFIG.VAULT_ADDRESS,
  };
  
  const types = {
    ReleaseOrder: [
      { name: "beneficiary", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "goalId", type: "uint256" },
      { name: "campaignId", type: "uint256" },
      { name: "attestationUID", type: "bytes32" },
      { name: "deadline", type: "uint256" },
      { name: "nonce", type: "uint256" },
    ],
  };
  
  const value = {
    beneficiary,
    amount: ethers.utils.parseEther(amount).toString(),
    goalId,
    campaignId,
    attestationUID,
    deadline,
    nonce,
  };
  
  // Note: In production, this signature should come from the DAO (ERC-1271)
  // This is a placeholder for the attestor's signature
  const signature = await wallet._signTypedData(domain, types, value);
  
  return {
    order: value,
    signature,
    domain,
  };
}

// ============ Webhook Endpoints ============

/**
 * Wonderverse webhook endpoint
 */
app.post("/webhook/wonderverse", async (req: Request, res: Response) => {
  try {
    // Verify API key
    if (req.headers["x-api-key"] !== CONFIG.WONDERVERSE_API_KEY) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const { userId, questId, walletAddress, score } = req.body;
    
    // Create attestation
    const attestationUID = await createAttestation(
      walletAddress,
      questId,
      score || 100,
      72 // 3 days expiration
    );
    
    res.json({
      success: true,
      attestationUID,
      recipient: walletAddress,
      goalId: questId,
    });
    
  } catch (error: any) {
    console.error("Wonderverse webhook error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Dework webhook endpoint
 */
app.post("/webhook/dework", async (req: Request, res: Response) => {
  try {
    // Verify API key
    if (req.headers["x-api-key"] !== CONFIG.DEWORK_API_KEY) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const { taskId, assignee, status, reward } = req.body;
    
    if (status !== "completed") {
      return res.json({ message: "Task not completed yet" });
    }
    
    // Create attestation
    const attestationUID = await createAttestation(
      assignee.address,
      taskId,
      100,
      72
    );
    
    // Generate release order if reward specified
    let releaseOrder = null;
    if (reward && reward.amount) {
      releaseOrder = await generateReleaseOrder(
        assignee.address,
        reward.amount,
        taskId,
        1, // Default campaign ID
        attestationUID
      );
    }
    
    res.json({
      success: true,
      attestationUID,
      releaseOrder,
    });
    
  } catch (error: any) {
    console.error("Dework webhook error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Zealy webhook endpoint
 */
app.post("/webhook/zealy", async (req: Request, res: Response) => {
  try {
    // Verify signature (Zealy uses HMAC)
    // Implementation depends on Zealy's specific requirements
    
    const { user, quest, xp } = req.body;
    
    // Create attestation
    const attestationUID = await createAttestation(
      user.walletAddress,
      quest.id,
      xp,
      72
    );
    
    res.json({
      success: true,
      attestationUID,
    });
    
  } catch (error: any) {
    console.error("Zealy webhook error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Manual attestation endpoint (for testing)
 */
app.post("/attest", async (req: Request, res: Response) => {
  try {
    const { recipient, goalId, score } = req.body;
    
    if (!recipient || !goalId) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    const attestationUID = await createAttestation(
      recipient,
      goalId,
      score || 100,
      72
    );
    
    res.json({
      success: true,
      attestationUID,
      recipient,
      goalId,
      score: score || 100,
    });
    
  } catch (error: any) {
    console.error("Manual attestation error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Generate release order endpoint
 */
app.post("/generate-order", async (req: Request, res: Response) => {
  try {
    const { beneficiary, amount, goalId, campaignId, attestationUID } = req.body;
    
    const releaseOrder = await generateReleaseOrder(
      beneficiary,
      amount,
      goalId,
      campaignId || 1,
      attestationUID
    );
    
    res.json({
      success: true,
      ...releaseOrder,
    });
    
  } catch (error: any) {
    console.error("Generate order error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============ Schema Registration ============

/**
 * Register the GoalCompleted schema on EAS
 * Run this once during initial setup
 */
async function registerSchema() {
  try {
    console.log("📝 Registering schema on EAS...");
    
    const schemaRegistry = new ethers.Contract(
      CONFIG.SCHEMA_REGISTRY,
      [
        "function register(string calldata schema, address resolver, bool revocable) external returns (bytes32)"
      ],
      wallet
    );
    
    const tx = await schemaRegistry.register(
      SCHEMA,
      ethers.constants.AddressZero, // No resolver
      true // Revocable
    );
    
    const receipt = await tx.wait();
    const schemaUID = (receipt as { logs?: Array<{ topics?: string[] }> }).logs?.[0]?.topics?.[1];

    if (!schemaUID) {
      throw new Error("Schema UID not found in receipt logs");
    }
    
    console.log("✅ Schema registered:", schemaUID);
    console.log("Add this to your .env: SCHEMA_UID=" + schemaUID);
    
    return schemaUID;
    
  } catch (error) {
    console.error("Schema registration failed:", error);
    throw error;
  }
}

// ============ Server Startup ============

async function start() {
  console.log("🚀 Starting EAS Attestor Bot...");
  console.log("Network:", CONFIG.CHAIN_ID);
  console.log("Attestor:", wallet.address);
  console.log("DAO:", CONFIG.DAO_ADDRESS);
  
  // Check if schema is registered
  if (!CONFIG.SCHEMA_UID) {
    console.log("⚠️ Schema not registered. Registering now...");
    const schemaUID = await registerSchema();
    CONFIG.SCHEMA_UID = schemaUID;
  } else {
    console.log("Schema UID:", CONFIG.SCHEMA_UID);
  }
  
  // Start server
  app.listen(CONFIG.PORT, () => {
    console.log(`✅ Server running on port ${CONFIG.PORT}`);
    console.log(`Health check: http://localhost:${CONFIG.PORT}/health`);
    console.log("\n📮 Webhook endpoints:");
    console.log(`  - Wonderverse: POST /webhook/wonderverse`);
    console.log(`  - Dework: POST /webhook/dework`);
    console.log(`  - Zealy: POST /webhook/zealy`);
    console.log(`  - Manual: POST /attest`);
  });
}

// Error handling
process.on("unhandledRejection", (error) => {
  console.error("Unhandled rejection:", error);
});

// Start the bot
start().catch(console.error);
