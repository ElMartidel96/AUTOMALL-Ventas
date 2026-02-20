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

// Aragon DAO minimal ABI
const ARAGON_DAO_ABI = [
  "function grant(address _where, address _who, bytes32 _permissionId) external",
  "function revoke(address _where, address _who, bytes32 _permissionId) external",
  "function hasPermission(address _where, address _who, bytes32 _permissionId, bytes memory _data) external view returns (bool)",
  "function execute(bytes32 _callId, tuple(address to, uint256 value, bytes data)[] memory _actions, uint256 _allowFailureMap) external returns (bytes[] memory execResults, uint256 failureMap)",
  "function isGranted(address _where, address _who, bytes32 _permissionId, bytes memory _data) external view returns (bool)"
];

// Token Voting Plugin ABI (for creating proposals)
const TOKEN_VOTING_ABI = [
  "function createProposal(bytes calldata _metadata, tuple(address to, uint256 value, bytes data)[] calldata _actions, uint256 _allowFailureMap, uint64 _startDate, uint64 _endDate, uint8 _voteOption, bool _tryEarlyExecution) external returns (uint256 proposalId)",
  "function vote(uint256 _proposalId, uint8 _voteOption, bool _tryEarlyExecution) external",
  "function execute(uint256 _proposalId) external",
  "function canExecute(uint256 _proposalId) external view returns (bool)",
  "function getProposal(uint256 _proposalId) external view returns (tuple(bool open, bool executed, tuple(uint8 abstain, uint8 yes, uint8 no) tally, uint64 startDate, uint64 endDate) proposal)"
];

async function setupAragonPermissions() {
  console.log(`${colors.bright}${colors.blue}
╔════════════════════════════════════════════════╗
║   🏛️ Aragon DAO Permission Setup               ║
║       CryptoGift DAO - Base Mainnet            ║
╚════════════════════════════════════════════════╝
${colors.reset}`);

  // Get deployer
  const [deployer] = await ethers.getSigners();
  console.log(`${colors.cyan}Deployer: ${deployer.address}${colors.reset}`);
  console.log(`${colors.cyan}Network: ${network.name}${colors.reset}\n`);

  // Load deployment data
  const deploymentPath = path.join(__dirname, `../../deployments/deployment-${network.name}-latest.json`);
  
  if (!fs.existsSync(deploymentPath)) {
    console.error(`${colors.red}❌ No deployment data found. Run deployment first!${colors.reset}`);
    process.exit(1);
  }
  
  const deploymentData = JSON.parse(fs.readFileSync(deploymentPath, 'utf-8'));
  
  console.log(`${colors.green}✅ Loaded deployment data${colors.reset}`);
  console.log(`   CGC Token: ${deploymentData.CGCToken.address}`);
  console.log(`   GovTokenVault: ${deploymentData.GovTokenVault.address}`);
  console.log(`   AllowedSignersCondition: ${deploymentData.AllowedSignersCondition.address}`);
  console.log(`   MerklePayouts: ${deploymentData.MerklePayouts.address}\n`);

  // Connect to Aragon DAO
  const aragonDAOAddress = process.env.ARAGON_DAO_ADDRESS || deploymentData.aragonDAO;
  console.log(`${colors.yellow}Connecting to Aragon DAO at: ${aragonDAOAddress}${colors.reset}`);
  
  const aragonDAO = new ethers.Contract(
    aragonDAOAddress,
    ARAGON_DAO_ABI,
    deployer
  );

  // Permission IDs
  const EXECUTE_PERMISSION = ethers.id("EXECUTE_PERMISSION");
  const UPDATE_VAULT_PERMISSION = ethers.id("UPDATE_VAULT_PERMISSION");
  const MINT_PERMISSION = ethers.id("MINT_PERMISSION");
  const UPGRADE_PERMISSION = ethers.id("UPGRADE_PERMISSION");

  console.log(`\n${colors.cyan}📋 Creating Governance Proposal for Permissions...${colors.reset}`);
  
  // Actions to include in the proposal
  const actions = [];

  // 1. Grant EXECUTE_PERMISSION to Vault on DAO
  console.log(`   1. Grant EXECUTE_PERMISSION to Vault`);
  actions.push({
    to: aragonDAOAddress,
    value: 0,
    data: aragonDAO.interface.encodeFunctionData("grant", [
      aragonDAOAddress, // where (DAO itself)
      deploymentData.GovTokenVault.address, // who (Vault)
      EXECUTE_PERMISSION // permissionId
    ])
  });

  // 2. Grant UPDATE_VAULT_PERMISSION to DAO on Vault
  console.log(`   2. Grant UPDATE_VAULT_PERMISSION to DAO`);
  actions.push({
    to: aragonDAOAddress,
    value: 0,
    data: aragonDAO.interface.encodeFunctionData("grant", [
      deploymentData.GovTokenVault.address, // where (Vault)
      aragonDAOAddress, // who (DAO)
      UPDATE_VAULT_PERMISSION // permissionId
    ])
  });

  // 3. Grant MINT_PERMISSION to Vault on Token (if mintable)
  console.log(`   3. Grant MINT_PERMISSION to Vault (if applicable)`);
  actions.push({
    to: aragonDAOAddress,
    value: 0,
    data: aragonDAO.interface.encodeFunctionData("grant", [
      deploymentData.CGCToken.address, // where (Token)
      deploymentData.GovTokenVault.address, // who (Vault)
      MINT_PERMISSION // permissionId
    ])
  });

  // Create proposal metadata
  const proposalMetadata = {
    title: "Setup CryptoGift DAO Permissions",
    summary: "Grant necessary permissions for GovTokenVault to operate",
    description: `This proposal sets up the following permissions:
    
1. EXECUTE_PERMISSION: Allows the GovTokenVault to execute actions through the DAO
2. UPDATE_VAULT_PERMISSION: Allows the DAO to update vault parameters
3. MINT_PERMISSION: Allows the Vault to mint tokens (if applicable)

Contracts:
- CGC Token: ${deploymentData.CGCToken.address}
- GovTokenVault: ${deploymentData.GovTokenVault.address}
- AllowedSignersCondition: ${deploymentData.AllowedSignersCondition.address}

This is a critical setup step for the DAO to function properly.`,
    resources: [
      {
        name: "Deployment Data",
        url: `https://basescan.org/address/${deploymentData.GovTokenVault.address}#code`
      },
      {
        name: "Documentation",
        url: "https://github.com/CryptoGift-Wallets-DAO/docs"
      }
    ]
  };

  // Encode metadata for IPFS (in production, upload to IPFS first)
  const metadataBytes = ethers.toUtf8Bytes(JSON.stringify(proposalMetadata));
  
  console.log(`\n${colors.yellow}📝 Proposal Summary:${colors.reset}`);
  console.log(`   Title: ${proposalMetadata.title}`);
  console.log(`   Actions: ${actions.length}`);
  console.log(`   Start: Now`);
  console.log(`   Duration: 7 days`);

  // Note: In production, you would create this proposal through the Token Voting plugin
  // For now, we'll output the necessary data for manual creation
  
  console.log(`\n${colors.bright}${colors.yellow}⚠️ IMPORTANT: Manual Steps Required${colors.reset}`);
  console.log(`\nSince the Token Voting plugin needs to be installed first, you need to:`);
  console.log(`\n1. Go to the Aragon App: https://app.aragon.org/dao/base-mainnet/${aragonDAOAddress}/dashboard`);
  console.log(`\n2. Install the Token Voting Plugin with these settings:`);
  console.log(`   - Token: ${deploymentData.CGCToken.address}`);
  console.log(`   - Support Threshold: 51%`);
  console.log(`   - Min Participation: 10%`);
  console.log(`   - Min Duration: 7 days`);
  console.log(`   - Min Proposer Power: 1000 CGC`);
  
  console.log(`\n3. Create a proposal with these actions:`);
  actions.forEach((action, index) => {
    console.log(`\n   Action ${index + 1}:`);
    console.log(`   - To: ${action.to}`);
    console.log(`   - Value: ${action.value}`);
    console.log(`   - Data: ${action.data}`);
  });

  // Save proposal data for reference
  const proposalDataPath = path.join(__dirname, "../../deployments");
  const proposalFile = path.join(proposalDataPath, `proposal-permissions-${network.name}.json`);
  
  const proposalData = {
    network: network.name,
    timestamp: new Date().toISOString(),
    metadata: proposalMetadata,
    actions: actions,
    contracts: {
      aragonDAO: aragonDAOAddress,
      cgcToken: deploymentData.CGCToken.address,
      govTokenVault: deploymentData.GovTokenVault.address,
      allowedSignersCondition: deploymentData.AllowedSignersCondition.address,
      merklePayouts: deploymentData.MerklePayouts.address
    }
  };
  
  fs.writeFileSync(proposalFile, JSON.stringify(proposalData, null, 2));
  console.log(`\n${colors.green}📁 Proposal data saved to: proposal-permissions-${network.name}.json${colors.reset}`);

  // Alternative: Direct execution if you have admin rights
  console.log(`\n${colors.cyan}🔧 Alternative: Direct Permission Setup${colors.reset}`);
  console.log(`If you have admin rights on the DAO, you can execute these directly:`);
  
  console.log(`\n${colors.yellow}Checking current permissions...${colors.reset}`);
  
  try {
    // Check if deployer has permission to grant
    const hasAdminPermission = await aragonDAO.hasPermission(
      aragonDAOAddress,
      deployer.address,
      EXECUTE_PERMISSION,
      "0x"
    );
    
    if (hasAdminPermission) {
      console.log(`${colors.green}✅ You have admin permissions!${colors.reset}`);
      console.log(`${colors.yellow}Would execute the permission setup directly...${colors.reset}`);
      
      // In production, you would execute here
      // const tx = await aragonDAO.execute(...);
      
    } else {
      console.log(`${colors.yellow}⚠️ You don't have direct admin permissions${colors.reset}`);
      console.log(`   You need to create a proposal through the governance process`);
    }
  } catch (error) {
    console.log(`${colors.yellow}⚠️ Could not check permissions (expected if plugin not installed)${colors.reset}`);
  }

  // Summary
  console.log(`\n${colors.bright}${colors.green}═══════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}✅ Permission Setup Guide Complete${colors.reset}`);
  
  console.log(`\n${colors.cyan}Next Steps:${colors.reset}`);
  console.log(`   1. Install Token Voting Plugin in Aragon App`);
  console.log(`   2. Create governance proposal with the saved actions`);
  console.log(`   3. Vote and execute the proposal`);
  console.log(`   4. Verify permissions are correctly set`);
  console.log(`   5. Disable shadow mode when ready for production`);
  
  console.log(`\n${colors.yellow}Resources:${colors.reset}`);
  console.log(`   Aragon App: https://app.aragon.org/dao/base-mainnet/${aragonDAOAddress}/dashboard`);
  console.log(`   CGC Token: https://basescan.org/address/${deploymentData.CGCToken.address}#code`);
  console.log(`   GovTokenVault: https://basescan.org/address/${deploymentData.GovTokenVault.address}#code`);
}

// Run setup
setupAragonPermissions()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(`${colors.red}Error during permission setup:${colors.reset}`, error);
    process.exit(1);
  });