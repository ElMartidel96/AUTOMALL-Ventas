/**
 * @title BaseScan Contract Verification Script
 * @author CryptoGift DAO Team
 * @notice Verify all deployed contracts on BaseScan
 * @dev Reads deployment data and verifies each contract with source code
 */

const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

// ============ VERIFICATION FUNCTIONS ============

async function verifyContract(name, address, constructorArgs = []) {
    console.log(`\n🔍 Verifying ${name} at ${address}...`);
    
    try {
        await hre.run("verify:verify", {
            address: address,
            constructorArguments: constructorArgs,
        });
        
        console.log(`✅ ${name} verified successfully!`);
        console.log(`🔗 BaseScan: https://basescan.org/address/${address}#code`);
        
        return { name, address, verified: true, url: `https://basescan.org/address/${address}#code` };
        
    } catch (error) {
        if (error.message.includes("Already Verified")) {
            console.log(`✅ ${name} already verified!`);
            return { name, address, verified: true, alreadyVerified: true };
        } else {
            console.error(`❌ Failed to verify ${name}: ${error.message}`);
            return { name, address, verified: false, error: error.message };
        }
    }
}

async function main() {
    console.log("\n🔍 STARTING BASESCAN VERIFICATION");
    console.log("=================================");
    
    // Find latest deployment file
    const scriptsDir = path.join(__dirname, '..');
    const files = fs.readdirSync(scriptsDir);
    const deploymentFiles = files.filter(file => file.startsWith('base-mainnet-deployment-'));
    
    if (deploymentFiles.length === 0) {
        throw new Error("❌ No deployment file found! Deploy contracts first.");
    }
    
    // Use the latest deployment file
    deploymentFiles.sort();
    const latestDeployment = deploymentFiles[deploymentFiles.length - 1];
    const deploymentPath = path.join(scriptsDir, latestDeployment);
    
    console.log(`📄 Using deployment file: ${latestDeployment}`);
    
    // Read deployment data
    const deploymentData = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
    const { contracts, verification } = deploymentData;
    
    console.log(`📍 Network: ${deploymentData.network.name} (Chain ID: ${deploymentData.network.chainId})`);
    console.log(`💼 Deployer: ${deploymentData.deployer}`);
    console.log(`⏰ Deployed: ${deploymentData.timestamp}`);
    
    // Verify network
    const network = await hre.ethers.provider.getNetwork();
    if (network.chainId !== deploymentData.network.chainId) {
        throw new Error(`❌ Network mismatch! Expected ${deploymentData.network.chainId}, got ${network.chainId}`);
    }
    
    console.log("✅ Network verification passed");
    
    // ============ VERIFY EACH CONTRACT ============
    
    const verificationResults = [];
    
    // Wait a bit for contracts to propagate to BaseScan
    console.log("\n⏳ Waiting 30 seconds for contracts to propagate to BaseScan...");
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    // Verify contracts in order
    for (const contractInfo of verification) {
        const result = await verifyContract(
            contractInfo.name,
            contractInfo.address,
            contractInfo.constructorArgs
        );
        verificationResults.push(result);
        
        // Wait between verifications to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    // ============ VERIFICATION SUMMARY ============
    console.log("\n📋 VERIFICATION SUMMARY");
    console.log("=======================");
    
    let successCount = 0;
    let failureCount = 0;
    
    for (const result of verificationResults) {
        if (result.verified) {
            successCount++;
            console.log(`✅ ${result.name}: VERIFIED`);
            if (result.url) {
                console.log(`   🔗 ${result.url}`);
            }
        } else {
            failureCount++;
            console.log(`❌ ${result.name}: FAILED`);
            console.log(`   📋 Error: ${result.error}`);
        }
    }
    
    console.log(`\n📊 Results: ${successCount} verified, ${failureCount} failed`);
    
    // ============ SAVE VERIFICATION REPORT ============
    
    const verificationReport = {
        timestamp: new Date().toISOString(),
        deploymentFile: latestDeployment,
        network: deploymentData.network,
        results: verificationResults,
        summary: {
            total: verificationResults.length,
            verified: successCount,
            failed: failureCount,
            successRate: Math.round((successCount / verificationResults.length) * 100)
        }
    };
    
    const reportPath = path.join(scriptsDir, `verification-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(verificationReport, null, 2));
    console.log(`💾 Verification report saved: ${reportPath}`);
    
    // ============ CREATE DEPLOYMENT LINKS ============
    console.log("\n🔗 CONTRACT LINKS");
    console.log("=================");
    
    console.log("📋 Contract addresses for frontend configuration:");
    console.log("```javascript");
    console.log("export const BASE_MAINNET_CONTRACTS = {");
    console.log(`  masterController: "${contracts.masterController}",`);
    console.log(`  taskRules: "${contracts.taskRules}",`);
    console.log(`  milestoneEscrow: "${contracts.milestoneEscrow}",`);
    console.log(`  cgcToken: "${contracts.cgcToken}",`);
    console.log("};");
    console.log("```");
    
    console.log("\n🔗 BaseScan Links:");
    for (const [name, address] of Object.entries(contracts)) {
        console.log(`${name}: https://basescan.org/address/${address}`);
    }
    
    // ============ FINAL STATUS ============
    
    if (failureCount === 0) {
        console.log("\n🎉 ALL CONTRACTS VERIFIED SUCCESSFULLY!");
        console.log("✅ Your contracts are now publicly visible on BaseScan");
        console.log("✅ Ready for production use");
    } else {
        console.log(`\n⚠️  ${failureCount} contracts failed verification`);
        console.log("📋 Check the errors above and retry verification if needed");
    }
    
    console.log("\n📋 NEXT STEPS:");
    console.log("1. Update frontend environment variables with contract addresses");
    console.log("2. Update backend configuration with new contract addresses");
    console.log("3. Test token minting and transfers");
    console.log("4. Deploy frontend and backend to production");
    
    return verificationReport;
}

// ============ ERROR HANDLING ============

async function handleError(error) {
    console.error("\n❌ VERIFICATION FAILED!");
    console.error("========================");
    console.error(error.message);
    
    console.error("\n🔧 Troubleshooting:");
    console.error("1. Ensure contracts are deployed on Base Mainnet");
    console.error("2. Check BASESCAN_API_KEY in hardhat.config.js");
    console.error("3. Wait longer for contract propagation");
    console.error("4. Try verifying individual contracts manually");
    
    process.exit(1);
}

// ============ EXECUTION ============

if (require.main === module) {
    main()
        .then((report) => {
            if (report.summary.failed === 0) {
                console.log("\n✅ Verification completed successfully!");
                process.exit(0);
            } else {
                console.log(`\n⚠️  Verification completed with ${report.summary.failed} failures`);
                process.exit(1);
            }
        })
        .catch(handleError);
}

module.exports = { main };