/**
 * @title BaseScan Contract Verification Script - New Contracts
 * @author CryptoGift DAO Team
 * @notice Verify the newly deployed contracts (31 Jan 2025) on BaseScan
 * @dev Specifically for CGC Token v2 and associated contracts
 */

const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

// New contract addresses from 31 Jan 2025 deployment
const CONTRACTS = {
    cgcToken: {
        address: "0x5e3a61b550328f3D8C44f60b3e10a49D3d806175",
        name: "CGCToken",
        constructorArgs: [
            "0x3244DFBf9E5374DF2f106E89Cf7972E5D4C9ac31", // DAO address
            "0xc655BF2Bd9AfA997c757Bef290A9Bb6ca41c5dE6"  // Initial owner (deployer)
        ]
    },
    masterController: {
        address: "0x67D9a01A3F7b5D38694Bb78dD39286Db75D7D869",
        name: "MasterEIP712Controller",
        constructorArgs: [
            "0xc655BF2Bd9AfA997c757Bef290A9Bb6ca41c5dE6", // Initial admin
            "0x3244DFBf9E5374DF2f106E89Cf7972E5D4C9ac31"  // Secondary admin (DAO)
        ]
    },
    taskRules: {
        address: "0xdDcfFF04eC6D8148CDdE3dBde42456fB32bcC5bb",
        name: "TaskRulesEIP712",
        constructorArgs: [
            "0x67D9a01A3F7b5D38694Bb78dD39286Db75D7D869" // Master controller
        ]
    },
    milestoneEscrow: {
        address: "0x8346CFcaECc90d678d862319449E5a742c03f109",
        name: "MilestoneEscrow",
        constructorArgs: [
            "0x5e3a61b550328f3D8C44f60b3e10a49D3d806175", // CGC Token
            "0x67D9a01A3F7b5D38694Bb78dD39286Db75D7D869"  // Master controller
        ]
    }
};

// ============ VERIFICATION FUNCTIONS ============

async function verifyContract(contractInfo) {
    console.log(`\n🔍 Verifying ${contractInfo.name} at ${contractInfo.address}...`);
    
    try {
        await hre.run("verify:verify", {
            address: contractInfo.address,
            constructorArguments: contractInfo.constructorArgs,
            contract: `contracts/core/${contractInfo.name}.sol:${contractInfo.name}`
        });
        
        console.log(`✅ ${contractInfo.name} verified successfully!`);
        console.log(`🔗 BaseScan: https://basescan.org/address/${contractInfo.address}#code`);
        
        return { 
            name: contractInfo.name, 
            address: contractInfo.address, 
            verified: true, 
            url: `https://basescan.org/address/${contractInfo.address}#code` 
        };
        
    } catch (error) {
        if (error.message.includes("Already Verified")) {
            console.log(`✅ ${contractInfo.name} already verified!`);
            console.log(`🔗 BaseScan: https://basescan.org/address/${contractInfo.address}#code`);
            return { 
                name: contractInfo.name, 
                address: contractInfo.address, 
                verified: true, 
                alreadyVerified: true,
                url: `https://basescan.org/address/${contractInfo.address}#code`
            };
        } else {
            console.error(`❌ Failed to verify ${contractInfo.name}: ${error.message}`);
            return { 
                name: contractInfo.name, 
                address: contractInfo.address, 
                verified: false, 
                error: error.message 
            };
        }
    }
}

async function main() {
    console.log("\n🔍 BASESCAN VERIFICATION - NEW CONTRACTS (31 JAN 2025)");
    console.log("=====================================================");
    
    // Verify network
    const network = await hre.ethers.provider.getNetwork();
    console.log(`📍 Network: Base Mainnet (Chain ID: ${network.chainId})`);
    
    if (network.chainId !== 8453n) {
        throw new Error(`❌ Wrong network! Expected Base Mainnet (8453), got ${network.chainId}`);
    }
    
    console.log("✅ Network verification passed");
    
    // Get deployer info
    const [signer] = await hre.ethers.getSigners();
    console.log(`💼 Verifying from: ${signer.address}`);
    
    // ============ VERIFY EACH CONTRACT ============
    
    const verificationResults = [];
    
    console.log("\n⏳ Starting contract verification...");
    console.log("Note: Contracts may already be verified from deployment");
    
    // Verify contracts in order
    for (const [key, contractInfo] of Object.entries(CONTRACTS)) {
        const result = await verifyContract(contractInfo);
        verificationResults.push(result);
        
        // Wait between verifications to avoid rate limiting
        if (!result.alreadyVerified) {
            console.log("⏳ Waiting 5 seconds to avoid rate limiting...");
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
    
    // ============ VERIFICATION SUMMARY ============
    console.log("\n📋 VERIFICATION SUMMARY");
    console.log("=======================");
    
    let successCount = 0;
    let failureCount = 0;
    let alreadyVerifiedCount = 0;
    
    for (const result of verificationResults) {
        if (result.verified) {
            successCount++;
            if (result.alreadyVerified) {
                alreadyVerifiedCount++;
                console.log(`✅ ${result.name}: ALREADY VERIFIED`);
            } else {
                console.log(`✅ ${result.name}: NEWLY VERIFIED`);
            }
            console.log(`   🔗 ${result.url}`);
        } else {
            failureCount++;
            console.log(`❌ ${result.name}: FAILED`);
            console.log(`   📋 Error: ${result.error}`);
        }
    }
    
    console.log(`\n📊 Results: ${successCount} verified (${alreadyVerifiedCount} already done), ${failureCount} failed`);
    
    // ============ TOKEN METADATA INFO ============
    console.log("\n📝 TOKEN METADATA STATUS");
    console.log("========================");
    console.log("CGC Token Contract: https://basescan.org/token/" + CONTRACTS.cgcToken.address);
    console.log("\n⚠️  IMPORTANT NEXT STEPS:");
    console.log("1. Visit the token page above");
    console.log("2. Click 'More' → 'Update Token Info'");
    console.log("3. Sign message with deployer wallet (0xc655BF2Bd9AfA997c757Bef290A9Bb6ca41c5dE6)");
    console.log("4. Upload logo (64x64 PNG or 32x32 SVG)");
    console.log("5. Add website, social links, and description");
    console.log("6. Submit and wait for BaseScan team approval (24-48h)");
    
    // ============ SAVE VERIFICATION REPORT ============
    
    const verificationReport = {
        timestamp: new Date().toISOString(),
        network: "Base Mainnet",
        chainId: 8453,
        contracts: CONTRACTS,
        results: verificationResults,
        summary: {
            total: verificationResults.length,
            verified: successCount,
            alreadyVerified: alreadyVerifiedCount,
            failed: failureCount,
            successRate: Math.round((successCount / verificationResults.length) * 100)
        }
    };
    
    const reportPath = path.join(__dirname, `../deployments/verification-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(verificationReport, null, 2));
    console.log(`\n💾 Verification report saved: ${reportPath}`);
    
    // ============ ENVIRONMENT VARIABLES UPDATE ============
    console.log("\n📋 CONTRACT ADDRESSES FOR FRONTEND:");
    console.log("=====================================");
    console.log("Add these to your .env.local or frontend config:\n");
    console.log("```");
    console.log(`NEXT_PUBLIC_CGC_TOKEN_ADDRESS=${CONTRACTS.cgcToken.address}`);
    console.log(`NEXT_PUBLIC_MASTER_CONTROLLER_ADDRESS=${CONTRACTS.masterController.address}`);
    console.log(`NEXT_PUBLIC_TASK_RULES_ADDRESS=${CONTRACTS.taskRules.address}`);
    console.log(`NEXT_PUBLIC_MILESTONE_ESCROW_ADDRESS=${CONTRACTS.milestoneEscrow.address}`);
    console.log("```");
    
    // ============ FINAL STATUS ============
    
    if (failureCount === 0) {
        console.log("\n🎉 ALL CONTRACTS VERIFIED SUCCESSFULLY!");
        console.log("✅ Contracts are publicly visible on BaseScan");
        console.log("✅ Ready for token metadata update");
    } else {
        console.log(`\n⚠️  ${failureCount} contracts failed verification`);
        console.log("📋 Check the errors above and retry if needed");
    }
    
    return verificationReport;
}

// ============ ERROR HANDLING ============

async function handleError(error) {
    console.error("\n❌ VERIFICATION FAILED!");
    console.error("========================");
    console.error(error.message);
    
    console.error("\n🔧 Troubleshooting:");
    console.error("1. Check BASESCAN_API_KEY in .env.local");
    console.error("2. Ensure you're on Base Mainnet");
    console.error("3. Verify contract addresses are correct");
    console.error("4. Try individual contract verification");
    
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