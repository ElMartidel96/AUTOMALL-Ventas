import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Setup Aragon Permissions
 * 
 * This script prepares the data for Aragon DAO proposals to:
 * 1. Grant permissions to the Vault
 * 2. Configure the AllowedSignersCondition
 * 3. Set up the permission system
 * 
 * NOTE: Actual execution requires a DAO proposal
 */

// Configuration
const DAO_ADDRESS = "0x3244DFBf9E5374DF2f106E89Cf7972E5D4C9ac31";
const TOKEN_VOTING_ADDRESS = "0x8Bf2C7555B9d0b96b9bC7782671553C91E6Fcd2b";
const ADMIN_PLUGIN_ADDRESS = "0xaaAC7a7e1b9f5e14711903d9418C36D01E143667";

async function main() {
  console.log("🏛️ Preparing Aragon Permission Setup...");
  console.log("================================================");
  
  // Get network info
  const network = await ethers.provider.getNetwork();
  console.log(`📡 Network: ${network.name} (chainId: ${network.chainId})`);
  
  // Load deployment info
  const deploymentsDir = path.join(__dirname, "../../deployments");
  const deploymentFile = path.join(deploymentsDir, `deployment-${network.chainId}.json`);
  
  if (!fs.existsSync(deploymentFile)) {
    throw new Error("Deployment file not found. Run deployment scripts first.");
  }
  
  const deployment = JSON.parse(fs.readFileSync(deploymentFile, "utf-8"));
  const vaultAddress = deployment.contracts?.GovTokenVault?.address;
  const conditionAddress = deployment.contracts?.AllowedSignersCondition?.address;
  const cgcTokenAddress = deployment.contracts?.CGCToken?.address;
  
  if (!vaultAddress || !conditionAddress || !cgcTokenAddress) {
    throw new Error("Required contracts not found in deployment file");
  }
  
  console.log("\n📋 Contract Addresses:");
  console.log(`GovTokenVault: ${vaultAddress}`);
  console.log(`AllowedSignersCondition: ${conditionAddress}`);
  console.log(`CGC Token: ${cgcTokenAddress}`);
  
  // Prepare permission identifiers
  const PERMISSION_IDS = {
    RELEASE_PERMISSION: ethers.id("RELEASE_PERMISSION"),
    PAUSE_PERMISSION: ethers.id("PAUSE_PERMISSION"),
    CONFIG_PERMISSION: ethers.id("CONFIG_PERMISSION"),
    SHADOW_PERMISSION: ethers.id("SHADOW_PERMISSION"),
    EMERGENCY_PERMISSION: ethers.id("EMERGENCY_PERMISSION"),
  };
  
  console.log("\n🔑 Permission IDs:");
  Object.entries(PERMISSION_IDS).forEach(([name, id]) => {
    console.log(`${name}: ${id}`);
  });
  
  // Prepare proposal actions
  const actions = [];
  
  // Action 1: Grant RELEASE_PERMISSION to DAO with condition
  actions.push({
    to: DAO_ADDRESS,
    value: 0,
    data: prepareGrantPermission(
      vaultAddress,
      DAO_ADDRESS,
      PERMISSION_IDS.RELEASE_PERMISSION,
      conditionAddress
    ),
    description: "Grant RELEASE_PERMISSION to DAO with AllowedSignersCondition"
  });
  
  // Action 2: Grant PAUSE_PERMISSION to Admin Plugin
  actions.push({
    to: DAO_ADDRESS,
    value: 0,
    data: prepareGrantPermission(
      vaultAddress,
      ADMIN_PLUGIN_ADDRESS,
      PERMISSION_IDS.PAUSE_PERMISSION,
      ethers.ZeroAddress // No condition
    ),
    description: "Grant PAUSE_PERMISSION to Admin Plugin"
  });
  
  // Action 3: Grant CONFIG_PERMISSION to Token Voting Plugin
  actions.push({
    to: DAO_ADDRESS,
    value: 0,
    data: prepareGrantPermission(
      vaultAddress,
      TOKEN_VOTING_ADDRESS,
      PERMISSION_IDS.CONFIG_PERMISSION,
      ethers.ZeroAddress // No condition
    ),
    description: "Grant CONFIG_PERMISSION to Token Voting Plugin"
  });
  
  // Action 4: Transfer CGC tokens to Vault (example: 400,000 for education rewards)
  const transferAmount = ethers.parseEther("400000");
  const cgcToken = await ethers.getContractAt("CGCToken", cgcTokenAddress);
  actions.push({
    to: cgcTokenAddress,
    value: 0,
    data: cgcToken.interface.encodeFunctionData("transfer", [vaultAddress, transferAmount]),
    description: `Transfer ${ethers.formatEther(transferAmount)} CGC to Vault`
  });
  
  // Action 5: Add DAO as authorized signer in condition
  const condition = await ethers.getContractAt("AllowedSignersCondition", conditionAddress);
  actions.push({
    to: conditionAddress,
    value: 0,
    data: condition.interface.encodeFunctionData("addSigner", [DAO_ADDRESS]),
    description: "Add DAO as authorized signer in AllowedSignersCondition"
  });
  
  // Generate proposal JSON
  const proposal = {
    title: "Initialize GovTokenVault Permissions and Funding",
    summary: "Grant permissions to the Vault, configure signers, and transfer initial CGC tokens",
    description: `This proposal sets up the GovTokenVault system:
    
1. Grants RELEASE_PERMISSION to the DAO with AllowedSignersCondition
2. Grants PAUSE_PERMISSION to Admin Plugin for emergency actions
3. Grants CONFIG_PERMISSION to Token Voting Plugin for parameter updates
4. Transfers 400,000 CGC to the Vault for education rewards
5. Adds the DAO as an authorized signer

After this proposal, the Vault will be ready to process release orders signed by the DAO.`,
    actions: actions,
    resources: [
      {
        name: "GovTokenVault Contract",
        url: `https://basescan.org/address/${vaultAddress}`
      },
      {
        name: "Documentation",
        url: "https://docs.cryptogift-wallets.com/dao/vault"
      }
    ]
  };
  
  // Save proposal JSON
  const proposalsDir = path.join(__dirname, "../../proposals");
  if (!fs.existsSync(proposalsDir)) {
    fs.mkdirSync(proposalsDir, { recursive: true });
  }
  
  const proposalFile = path.join(proposalsDir, "001-initialize-vault.json");
  fs.writeFileSync(proposalFile, JSON.stringify(proposal, null, 2));
  console.log(`\n📁 Proposal saved to: ${proposalFile}`);
  
  // Generate Aragon App URL
  const aragonUrl = `https://app.aragon.org/dao/base-mainnet/${DAO_ADDRESS}/dashboard`;
  console.log(`\n🌐 Aragon DAO Dashboard: ${aragonUrl}`);
  
  // Print instructions
  console.log("\n================================================");
  console.log("📋 NEXT STEPS:");
  console.log("================================================");
  console.log("1. Review the proposal JSON file");
  console.log("2. Go to the Aragon App and create a new proposal");
  console.log("3. Add the actions from the JSON file");
  console.log("4. Submit the proposal for voting");
  console.log("5. Wait for the voting period to complete");
  console.log("6. Execute the proposal if approved");
  console.log("\n⚠️ IMPORTANT: This script only prepares the data.");
  console.log("Actual execution requires a DAO proposal and vote.");
  
  // Generate encoded calldata for manual submission
  console.log("\n📦 Encoded Actions (for manual submission):");
  actions.forEach((action, index) => {
    console.log(`\nAction ${index + 1}: ${action.description}`);
    console.log(`To: ${action.to}`);
    console.log(`Value: ${action.value}`);
    console.log(`Data: ${action.data}`);
  });
}

// Helper function to prepare grant permission calldata
function prepareGrantPermission(
  where: string,
  who: string,
  permissionId: string,
  condition: string
): string {
  // This would encode the grantPermission function call
  // The actual implementation depends on the Aragon permission manager interface
  const iface = new ethers.Interface([
    "function grant(address where, address who, bytes32 permissionId, address condition)"
  ]);
  
  return iface.encodeFunctionData("grant", [where, who, permissionId, condition]);
}

// Execute setup
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Setup failed!");
    console.error(error);
    process.exit(1);
  });