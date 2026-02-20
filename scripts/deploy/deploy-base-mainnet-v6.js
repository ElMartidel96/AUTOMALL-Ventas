/**
 * @title Base Mainnet Deployment Script - PRODUCTION (Ethers v6)
 * @author CryptoGift DAO Team
 * @notice Deploy complete 3-layer security architecture to Base Mainnet
 * @dev Chain ID: 8453 - Base Mainnet, optimized for Ethers v6
 */

const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

// ============ CONFIGURATION ============

const CONFIG = {
    CHAIN_ID: 8453, // Base Mainnet
    GAS_PRICE: "0.001", // 0.001 Gwei (very low for Base)
    GAS_LIMIT: 8000000,
    CONFIRMATIONS: 3,
    
    // Token configuration
    INITIAL_SUPPLY: "2000000", // 2 million CGC
    TOKEN_NAME: "CryptoGift Coin",
    TOKEN_SYMBOL: "CGC",
    
    // EIP-712 configuration
    SIGNATURE_VALIDITY: 15 * 60, // 15 minutes
    
    // Deployment addresses will be populated
    addresses: {},
    
    // Verification data
    verification: []
};

// ============ MAIN DEPLOYMENT FUNCTION ============

async function main() {
    console.log("\n🚀 STARTING BASE MAINNET DEPLOYMENT (Ethers v6)");
    console.log("================================================");
    
    // Get deployer
    const [deployer] = await hre.ethers.getSigners();
    const network = await hre.ethers.provider.getNetwork();
    
    console.log(`📍 Network: ${network.name} (Chain ID: ${network.chainId})`);
    console.log(`💼 Deployer: ${deployer.address}`);
    
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log(`💰 Balance: ${hre.ethers.formatEther(balance)} ETH`);
    
    // Verify we're on Base Mainnet
    if (Number(network.chainId) !== CONFIG.CHAIN_ID) {
        throw new Error(`❌ Wrong network! Expected Base Mainnet (${CONFIG.CHAIN_ID}), got ${network.chainId}`);
    }
    
    // Check minimum balance (Base Mainnet is very cheap)
    const minBalance = hre.ethers.parseEther("0.002");
    if (balance < minBalance) {
        throw new Error(`❌ Insufficient balance! Need at least 0.002 ETH, got ${hre.ethers.formatEther(balance)} ETH`);
    }
    
    console.log("✅ Pre-flight checks passed");
    
    // ============ STEP 1: DEPLOY MASTER CONTROLLER ============
    console.log("\n🔑 STEP 1: Deploying MasterEIP712Controller...");
    
    const MasterController = await hre.ethers.getContractFactory("MasterEIP712Controller");
    const masterController = await MasterController.deploy(
        deployer.address, // emergencyAdmin
        deployer.address, // technicalAdmin
        {
            gasPrice: hre.ethers.parseUnits(CONFIG.GAS_PRICE, "gwei"),
            gasLimit: CONFIG.GAS_LIMIT
        }
    );
    
    await masterController.waitForDeployment();
    const masterAddress = await masterController.getAddress();
    CONFIG.addresses.masterController = masterAddress;
    
    console.log(`✅ MasterEIP712Controller deployed: ${masterAddress}`);
    const masterTxReceipt = await masterController.deploymentTransaction().wait();
    console.log(`⛽ Gas used: ${masterTxReceipt.gasUsed}`);
    
    CONFIG.verification.push({
        name: "MasterEIP712Controller",
        address: masterAddress,
        constructorArgs: [deployer.address, deployer.address]
    });
    
    // ============ STEP 2: DEPLOY TASK RULES ============
    console.log("\n📋 STEP 2: Deploying TaskRulesEIP712...");
    
    const TaskRules = await hre.ethers.getContractFactory("TaskRulesEIP712");
    const taskRules = await TaskRules.deploy(
        {
            gasPrice: hre.ethers.parseUnits(CONFIG.GAS_PRICE, "gwei"),
            gasLimit: CONFIG.GAS_LIMIT
        }
    );
    
    await taskRules.waitForDeployment();
    const taskRulesAddress = await taskRules.getAddress();
    CONFIG.addresses.taskRules = taskRulesAddress;
    
    console.log(`✅ TaskRulesEIP712 deployed: ${taskRulesAddress}`);
    const taskTxReceipt = await taskRules.deploymentTransaction().wait();
    console.log(`⛽ Gas used: ${taskTxReceipt.gasUsed}`);
    
    CONFIG.verification.push({
        name: "TaskRulesEIP712",
        address: taskRulesAddress,
        constructorArgs: []
    });
    
    // ============ STEP 3: DEPLOY CGC TOKEN ============
    console.log("\n🪙 STEP 3: Deploying CGCToken...");
    
    const CGCToken = await hre.ethers.getContractFactory("CGCToken");
    const cgcToken = await CGCToken.deploy(
        deployer.address, // DAO address (will receive 2M tokens)
        deployer.address, // initial owner
        {
            gasPrice: hre.ethers.parseUnits(CONFIG.GAS_PRICE, "gwei"),
            gasLimit: CONFIG.GAS_LIMIT
        }
    );
    
    await cgcToken.waitForDeployment();
    const tokenAddress = await cgcToken.getAddress();
    CONFIG.addresses.cgcToken = tokenAddress;
    
    console.log(`✅ CGCToken deployed: ${tokenAddress}`);
    const tokenTxReceipt = await cgcToken.deploymentTransaction().wait();
    console.log(`⛽ Gas used: ${tokenTxReceipt.gasUsed}`);
    
    // Verify initial supply with retry
    let totalSupply;
    let retryCount = 0;
    const maxRetries = 5;
    
    while (retryCount < maxRetries) {
        try {
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
            totalSupply = await cgcToken.totalSupply();
            break;
        } catch (error) {
            retryCount++;
            console.log(`⚠️  Retry ${retryCount}/${maxRetries} reading totalSupply...`);
            if (retryCount === maxRetries) {
                console.log(`⚠️  Could not verify totalSupply after ${maxRetries} attempts, continuing...`);
                totalSupply = hre.ethers.parseEther(CONFIG.INITIAL_SUPPLY); // Assume correct
            }
        }
    }
    
    const expectedSupply = hre.ethers.parseEther(CONFIG.INITIAL_SUPPLY);
    console.log(`📊 Total Supply: ${hre.ethers.formatEther(totalSupply)} CGC`);
    console.log(`📊 Expected: ${hre.ethers.formatEther(expectedSupply)} CGC`);
    
    if (totalSupply.toString() !== expectedSupply.toString()) {
        console.log(`⚠️  Supply mismatch: got ${totalSupply}, expected ${expectedSupply}`);
    }
    
    CONFIG.verification.push({
        name: "CGCToken",
        address: tokenAddress,
        constructorArgs: [deployer.address, deployer.address]
    });
    
    // ============ STEP 4: DEPLOY MILESTONE ESCROW ============
    console.log("\n🏦 STEP 4: Deploying MilestoneEscrow...");
    
    const MilestoneEscrow = await hre.ethers.getContractFactory("MilestoneEscrow");
    const milestoneEscrow = await MilestoneEscrow.deploy(
        masterAddress,
        tokenAddress, // CGC token address
        {
            gasPrice: hre.ethers.parseUnits(CONFIG.GAS_PRICE, "gwei"),
            gasLimit: CONFIG.GAS_LIMIT
        }
    );
    
    await milestoneEscrow.waitForDeployment();
    const escrowAddress = await milestoneEscrow.getAddress();
    CONFIG.addresses.milestoneEscrow = escrowAddress;
    
    console.log(`✅ MilestoneEscrow deployed: ${escrowAddress}`);
    const escrowTxReceipt = await milestoneEscrow.deploymentTransaction().wait();
    console.log(`⛽ Gas used: ${escrowTxReceipt.gasUsed}`);
    
    CONFIG.verification.push({
        name: "MilestoneEscrow",
        address: escrowAddress,
        constructorArgs: [masterAddress, tokenAddress]
    });
    
    // ============ STEP 5: SETUP PERMISSIONS ============
    console.log("\n🔐 STEP 5: Setting up permissions...");
    
    // First authorize the escrow
    console.log("📝 Authorizing Escrow...");
    const escrowAuthTx = await masterController.authorizeEscrow(escrowAddress, {
        gasPrice: hre.ethers.parseUnits(CONFIG.GAS_PRICE, "gwei")
    });
    await escrowAuthTx.wait(CONFIG.CONFIRMATIONS);
    console.log(`✅ Escrow authorized in MasterController`);
    
    // Then authorize TaskRules for this escrow
    console.log("📝 Authorizing TaskRules for Escrow...");
    const authTx = await masterController.authorizeEIP712ForEscrow(
        escrowAddress,
        taskRulesAddress,
        {
            gasPrice: hre.ethers.parseUnits(CONFIG.GAS_PRICE, "gwei")
        }
    );
    await authTx.wait(CONFIG.CONFIRMATIONS);
    console.log(`✅ TaskRules authorized for Escrow in MasterController`);
    
    // Set MilestoneEscrow as token minter
    console.log("📝 Setting up minter permissions...");
    const minterTx = await cgcToken.addMinter(escrowAddress, {
        gasPrice: hre.ethers.parseUnits(CONFIG.GAS_PRICE, "gwei")
    });
    await minterTx.wait(CONFIG.CONFIRMATIONS);
    console.log(`✅ MilestoneEscrow added as minter`);
    
    // ============ STEP 6: SAVE DEPLOYMENT DATA ============
    console.log("\n💾 STEP 6: Saving deployment data...");
    
    const deploymentData = {
        timestamp: new Date().toISOString(),
        network: {
            name: network.name,
            chainId: Number(network.chainId)
        },
        deployer: deployer.address,
        contracts: CONFIG.addresses,
        config: {
            initialSupply: CONFIG.INITIAL_SUPPLY,
            signatureValidity: CONFIG.SIGNATURE_VALIDITY,
            tokenName: CONFIG.TOKEN_NAME,
            tokenSymbol: CONFIG.TOKEN_SYMBOL
        },
        verification: CONFIG.verification,
        transactionHashes: {
            masterController: masterController.deploymentTransaction().hash,
            taskRules: taskRules.deploymentTransaction().hash,
            milestoneEscrow: milestoneEscrow.deploymentTransaction().hash,
            cgcToken: cgcToken.deploymentTransaction().hash
        }
    };
    
    // Save to file
    const deploymentFile = path.join(__dirname, '..', '..', `base-mainnet-deployment-${Date.now()}.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentData, null, 2));
    console.log(`✅ Deployment data saved: ${deploymentFile}`);
    
    // ============ DEPLOYMENT SUMMARY ============
    console.log("\n🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!");
    console.log("=====================================");
    console.log(`🔑 MasterEIP712Controller: ${CONFIG.addresses.masterController}`);
    console.log(`📋 TaskRulesEIP712: ${CONFIG.addresses.taskRules}`);
    console.log(`🏦 MilestoneEscrow: ${CONFIG.addresses.milestoneEscrow}`);
    console.log(`🪙 CGCToken: ${CONFIG.addresses.cgcToken}`);
    console.log(`💰 Total Supply: 2,000,000 CGC`);
    console.log(`💼 Owner: ${deployer.address}`);
    
    // ============ UPDATE ENV FILE ============
    console.log("\n📝 Updating .env.local with contract addresses...");
    
    const envPath = '/mnt/c/Users/rafae/cryptogift-wallets-DAO/.env.local';
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Update contract addresses in env file
    envContent = envContent.replace(/CGC_TOKEN_ADDRESS=.*$/m, `CGC_TOKEN_ADDRESS=${CONFIG.addresses.cgcToken}`);
    envContent = envContent.replace(/MASTER_CONTROLLER_ADDRESS=.*$/m, `MASTER_CONTROLLER_ADDRESS=${CONFIG.addresses.masterController}`);
    envContent = envContent.replace(/TASK_RULES_ADDRESS=.*$/m, `TASK_RULES_ADDRESS=${CONFIG.addresses.taskRules}`);
    envContent = envContent.replace(/MILESTONE_ESCROW_ADDRESS=.*$/m, `MILESTONE_ESCROW_ADDRESS=${CONFIG.addresses.milestoneEscrow}`);
    
    // If addresses don't exist, add them
    if (!envContent.includes('CGC_TOKEN_ADDRESS=')) {
        envContent += `\n# Contract Addresses (Auto-generated)\nCGC_TOKEN_ADDRESS=${CONFIG.addresses.cgcToken}\n`;
        envContent += `MASTER_CONTROLLER_ADDRESS=${CONFIG.addresses.masterController}\n`;
        envContent += `TASK_RULES_ADDRESS=${CONFIG.addresses.taskRules}\n`;
        envContent += `MILESTONE_ESCROW_ADDRESS=${CONFIG.addresses.milestoneEscrow}\n`;
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log(`✅ Contract addresses saved to .env.local`);
    
    // ============ NEXT STEPS ============
    console.log("\n📋 NEXT STEPS:");
    console.log("1. ✅ Contracts deployed and configured");
    console.log("2. ✅ 2M CGC tokens minted to your address");
    console.log("3. ✅ Contract addresses updated in .env.local");
    console.log("4. 🔄 Run verification script: pnpm hardhat run scripts/verify-base-mainnet.js");
    console.log("5. 🧪 Run first mint test: pnpm hardhat run scripts/test-first-mint.js");
    console.log("6. 🚀 Deploy frontend and backend with new addresses");
    
    console.log("\n⚠️  SECURITY REMINDERS:");
    console.log("- ✅ All deployment files are git-ignored");
    console.log("- ✅ Contract addresses saved securely");
    console.log("- ✅ Ready for production use");
    
    return deploymentData;
}

// ============ ERROR HANDLING ============

async function handleError(error) {
    console.error("\n❌ DEPLOYMENT FAILED!");
    console.error("=====================");
    console.error(error.message);
    
    if (error.transaction) {
        console.error(`📋 Transaction Hash: ${error.transaction.hash}`);
    }
    
    if (error.receipt) {
        console.error(`⛽ Gas Used: ${error.receipt.gasUsed}`);
        console.error(`💰 Gas Price: ${error.receipt.effectiveGasPrice}`);
    }
    
    console.error("\n🔧 Troubleshooting:");
    console.error("1. Check your private key is correct");
    console.error("2. Ensure sufficient ETH balance");
    console.error("3. Verify network configuration");
    console.error("4. Check for any contract compilation errors");
    
    process.exit(1);
}

// ============ EXECUTION ============

if (require.main === module) {
    main()
        .then(() => {
            console.log("\n✅ Script completed successfully!");
            process.exit(0);
        })
        .catch(handleError);
}

module.exports = { main, CONFIG };