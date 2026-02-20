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

// EAS Contract ABIs (minimal interfaces)
const SCHEMA_REGISTRY_ABI = [
  "function register(string calldata schema, address resolver, bool revocable) external returns (bytes32)",
  "function getSchema(bytes32 uid) external view returns (tuple(bytes32 uid, address resolver, bool revocable, string schema) schema)"
];

// Schema definitions for the DAO
const SCHEMAS = {
  // Quest/Goal completion schema
  questCompletion: {
    schema: "address recipient,uint256 goalId,uint256 score,uint256 timestamp,uint256 expirationTime,bytes32 questPlatformId,string metadataURI",
    resolver: ethers.ZeroAddress, // No resolver needed
    revocable: true,
    description: "Quest/Goal completion attestation for token rewards"
  },
  
  // User reputation schema
  userReputation: {
    schema: "address user,uint256 totalScore,uint256 questsCompleted,uint256 tokensEarned,uint256 level,string profileURI",
    resolver: ethers.ZeroAddress,
    revocable: false,
    description: "User reputation and achievements"
  },
  
  // Token release authorization schema
  tokenRelease: {
    schema: "address recipient,uint256 amount,bytes32 releaseOrderHash,uint256 nonce,uint256 deadline,address authorizer",
    resolver: ethers.ZeroAddress,
    revocable: true,
    description: "Token release authorization from DAO"
  },
  
  // Milestone completion schema
  milestoneCompletion: {
    schema: "address collaborator,uint256 milestoneId,bytes32 taskHash,uint256 completionTime,uint256 qualityScore,string deliverableURI",
    resolver: ethers.ZeroAddress,
    revocable: true,
    description: "Milestone completion for collaborator rewards"
  }
};

async function registerSchemas() {
  console.log(`${colors.bright}${colors.blue}
╔════════════════════════════════════════════════╗
║   📜 EAS Schema Registration                    ║
║       CryptoGift DAO - Base Mainnet            ║
╚════════════════════════════════════════════════╝
${colors.reset}`);

  // Get deployer
  const [deployer] = await ethers.getSigners();
  console.log(`${colors.cyan}Deployer: ${deployer.address}${colors.reset}`);
  console.log(`${colors.cyan}Network: ${network.name}${colors.reset}\n`);

  // Connect to Schema Registry
  const schemaRegistryAddress = network.name === "base" 
    ? "0x4200000000000000000000000000000000000020"
    : "0x4200000000000000000000000000000000000020"; // Same on Sepolia
  
  console.log(`${colors.yellow}Connecting to Schema Registry at: ${schemaRegistryAddress}${colors.reset}`);
  
  const schemaRegistry = new ethers.Contract(
    schemaRegistryAddress,
    SCHEMA_REGISTRY_ABI,
    deployer
  );

  // Check if registry exists
  const code = await ethers.provider.getCode(schemaRegistryAddress);
  if (code === "0x") {
    console.error(`${colors.red}❌ No Schema Registry found at ${schemaRegistryAddress}${colors.reset}`);
    console.log(`${colors.yellow}Note: EAS might not be deployed on this network yet${colors.reset}`);
    process.exit(1);
  }

  console.log(`${colors.green}✅ Schema Registry found${colors.reset}\n`);

  // Object to store registered schema UIDs
  const registeredSchemas: Record<string, string> = {};

  // Register each schema
  for (const [name, config] of Object.entries(SCHEMAS)) {
    console.log(`${colors.yellow}Registering schema: ${name}${colors.reset}`);
    console.log(`   Description: ${config.description}`);
    console.log(`   Schema: ${config.schema.substring(0, 50)}...`);
    console.log(`   Revocable: ${config.revocable}`);
    
    try {
      // Register the schema
      const tx = await schemaRegistry.register(
        config.schema,
        config.resolver,
        config.revocable
      );
      
      console.log(`   ${colors.yellow}⏳ Waiting for confirmation...${colors.reset}`);
      const receipt = await tx.wait(2);
      
      // Get the schema UID from the event logs
      const schemaUID = receipt.logs[0]?.topics[1];
      
      if (schemaUID) {
        registeredSchemas[name] = schemaUID;
        console.log(`   ${colors.green}✅ Registered! UID: ${schemaUID}${colors.reset}\n`);
      } else {
        console.log(`   ${colors.red}❌ Failed to get schema UID${colors.reset}\n`);
      }
      
    } catch (error: any) {
      console.log(`   ${colors.red}❌ Registration failed: ${error.message}${colors.reset}\n`);
      
      // Try to extract UID from error if schema already exists
      if (error.message.includes("AlreadyExists")) {
        console.log(`   ${colors.yellow}Schema might already be registered${colors.reset}`);
      }
    }
  }

  // Save schema UIDs to file
  if (Object.keys(registeredSchemas).length > 0) {
    console.log(`${colors.cyan}📁 Saving schema UIDs...${colors.reset}`);
    
    const deploymentPath = path.join(__dirname, "../../deployments");
    if (!fs.existsSync(deploymentPath)) {
      fs.mkdirSync(deploymentPath, { recursive: true });
    }
    
    const schemaFile = path.join(deploymentPath, `eas-schemas-${network.name}.json`);
    const schemaData = {
      network: network.name,
      chainId: (await ethers.provider.getNetwork()).chainId.toString(),
      schemaRegistry: schemaRegistryAddress,
      timestamp: new Date().toISOString(),
      schemas: registeredSchemas
    };
    
    fs.writeFileSync(schemaFile, JSON.stringify(schemaData, null, 2));
    console.log(`${colors.green}✅ Schema UIDs saved to: eas-schemas-${network.name}.json${colors.reset}`);
    
    // Update .env.dao file
    console.log(`\n${colors.cyan}📝 Updating .env.dao with schema UIDs...${colors.reset}`);
    
    const envPath = path.resolve(__dirname, '../../.env.dao');
    let envContent = fs.readFileSync(envPath, 'utf-8');
    
    if (registeredSchemas.questCompletion) {
      envContent = envContent.replace(/EAS_QUEST_SCHEMA_UID=.*/, `EAS_QUEST_SCHEMA_UID=${registeredSchemas.questCompletion}`);
    }
    if (registeredSchemas.userReputation) {
      envContent = envContent.replace(/EAS_USER_SCHEMA_UID=.*/, `EAS_USER_SCHEMA_UID=${registeredSchemas.userReputation}`);
    }
    if (registeredSchemas.tokenRelease) {
      envContent = envContent.replace(/EAS_REWARD_SCHEMA_UID=.*/, `EAS_REWARD_SCHEMA_UID=${registeredSchemas.tokenRelease}`);
    }
    if (registeredSchemas.milestoneCompletion) {
      envContent = envContent.replace(/EAS_CAMPAIGN_SCHEMA_UID=.*/, `EAS_CAMPAIGN_SCHEMA_UID=${registeredSchemas.milestoneCompletion}`);
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log(`${colors.green}✅ .env.dao updated${colors.reset}`);
  }

  // Summary
  console.log(`\n${colors.bright}${colors.green}═══════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}📜 Schema Registration Complete${colors.reset}`);
  
  if (Object.keys(registeredSchemas).length > 0) {
    console.log(`\n${colors.cyan}Registered Schema UIDs:${colors.reset}`);
    for (const [name, uid] of Object.entries(registeredSchemas)) {
      console.log(`   ${name}: ${uid}`);
    }
  }
  
  console.log(`\n${colors.yellow}Next steps:${colors.reset}`);
  console.log(`   1. Configure attestor bot with these schema UIDs`);
  console.log(`   2. Fund attestor wallet for gas fees`);
  console.log(`   3. Setup webhooks from quest platforms`);
  console.log(`   4. Test attestation creation`);
}

// Run registration
registerSchemas()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(`${colors.red}Error during schema registration:${colors.reset}`, error);
    process.exit(1);
  });