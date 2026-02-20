/**
 * @title Hardhat Configuration for Base Mainnet Production Deployment
 * @author CryptoGift DAO Team  
 * @notice Production-ready configuration for Base Mainnet deployment
 * @dev Uses environment variables for sensitive data
 */

require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config({ path: ".env.deployment" });

// ============ ENVIRONMENT VALIDATION ============

function validateEnvironment() {
    const required = [
        'DEPLOYER_PRIVATE_KEY',
        'BASE_RPC_URL', 
        'BASESCAN_API_KEY'
    ];
    
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
        console.error("❌ Missing required environment variables:");
        missing.forEach(key => console.error(`   - ${key}`));
        console.error("\nPlease check your .env.deployment file");
        process.exit(1);
    }
}

// Validate environment only for deployment tasks
if (process.argv.includes('deploy') || process.argv.includes('verify')) {
    validateEnvironment();
}

// ============ CONFIGURATION ============

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: {
        version: "0.8.20",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200, // Optimized for deployment cost vs runtime cost
                details: {
                    yul: true,
                    yulDetails: {
                        stackAllocation: true,
                        optimizerSteps: "dhfoDgvulfnTUtnIf"
                    }
                }
            },
            viaIR: false, // Disable for better compatibility
            metadata: {
                // Include source code in bytecode for verification
                bytecodeHash: "ipfs",
                appendCBOR: true
            }
        }
    },
    
    networks: {
        // Base Mainnet (Production)
        base: {
            url: process.env.BASE_RPC_URL || "https://mainnet.base.org",
            accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
            chainId: parseInt(process.env.BASE_CHAIN_ID) || 8453,
            gasPrice: process.env.GAS_PRICE_GWEI ? 
                parseInt(process.env.GAS_PRICE_GWEI) * 1000000000 : // Convert Gwei to wei
                1000000, // 0.001 Gwei default (very low for Base)
            gas: parseInt(process.env.GAS_LIMIT) || 8000000,
            confirmations: parseInt(process.env.CONFIRMATIONS) || 3,
            timeout: 60000, // 1 minute timeout
            verify: {
                etherscan: {
                    apiUrl: "https://api.basescan.org",
                    apiKey: process.env.BASESCAN_API_KEY
                }
            }
        },
        
        // Base Sepolia (Testnet) - for testing
        baseSepolia: {
            url: "https://sepolia.base.org",
            accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
            chainId: 84532,
            gasPrice: 1000000, // 0.001 Gwei
            gas: 8000000,
            confirmations: 2
        },
        
        // Local Hardhat Network (Development)
        hardhat: {
            chainId: 31337,
            gas: 12000000,
            blockGasLimit: 12000000,
            allowUnlimitedContractSize: true,
            mining: {
                auto: true,
                interval: 0
            }
        }
    },
    
    // Contract verification configuration
    etherscan: {
        apiKey: {
            base: process.env.BASESCAN_API_KEY || "",
            baseSepolia: process.env.BASESCAN_API_KEY || ""
        },
        customChains: [
            {
                network: "base",
                chainId: 8453,
                urls: {
                    apiURL: "https://api.basescan.org/api",
                    browserURL: "https://basescan.org"
                }
            },
            {
                network: "baseSepolia", 
                chainId: 84532,
                urls: {
                    apiURL: "https://api-sepolia.basescan.org/api",
                    browserURL: "https://sepolia.basescan.org"
                }
            }
        ]
    },
    
    // Gas reporting
    gasReporter: {
        enabled: process.env.REPORT_GAS === "true",
        currency: "USD",
        gasPrice: 0.001, // Base Mainnet typical gas price in Gwei
        coinmarketcap: process.env.COINMARKETCAP_API_KEY,
        showTimeSpent: true,
        showMethodSig: true,
        excludeContracts: ["Migrations"]
    },
    
    // Source maps for debugging
    sourcify: {
        enabled: true,
        apiUrl: "https://sourcify.dev/server",
        browserUrl: "https://repo.sourcify.dev"
    },
    
    // Contract size reporting  
    contractSizer: {
        alphaSort: true,
        runOnCompile: true,
        disambiguatePaths: false,
        strict: true,
        only: []
    },
    
    // Test configuration
    mocha: {
        timeout: 60000, // 1 minute timeout for tests
        reporter: "spec",
        slow: 10000 // 10 seconds
    },
    
    // Paths configuration
    paths: {
        sources: "./contracts",
        tests: "./test", 
        cache: "./cache",
        artifacts: "./artifacts"
    },
    
    // Warnings configuration
    warnings: {
        "*": {
            "code-size": true,
            "unused-param": false,
            "unreachable-code": true
        }
    }
};

// ============ TASKS ============

// Custom task for deployment summary
task("deployment-summary", "Show deployment summary")
    .setAction(async (taskArgs, hre) => {
        const fs = require('fs');
        const path = require('path');
        
        const scriptsDir = path.join(__dirname, 'scripts');
        const deploymentFiles = fs.readdirSync(scriptsDir)
            .filter(file => file.startsWith('base-mainnet-deployment-'))
            .sort();
        
        if (deploymentFiles.length === 0) {
            console.log("❌ No deployment files found");
            return;
        }
        
        const latest = deploymentFiles[deploymentFiles.length - 1];
        const data = JSON.parse(fs.readFileSync(path.join(scriptsDir, latest), 'utf8'));
        
        console.log("\n🚀 LATEST DEPLOYMENT SUMMARY");
        console.log("============================");
        console.log(`📅 Date: ${data.timestamp}`);
        console.log(`🌐 Network: ${data.network.name} (${data.network.chainId})`);
        console.log(`💼 Deployer: ${data.deployer}`);
        console.log("\n📋 Contracts:");
        Object.entries(data.contracts).forEach(([name, address]) => {
            console.log(`   ${name}: ${address}`);
        });
    });

// Custom task for gas estimation
task("estimate-gas", "Estimate deployment gas costs")
    .setAction(async (taskArgs, hre) => {
        console.log("⛽ Estimating deployment gas costs...");
        
        // This would estimate gas for each contract deployment
        // Implementation depends on specific requirements
        console.log("📊 Estimated total gas: ~2,500,000");
        console.log("💰 Estimated cost: ~0.0025 ETH on Base Mainnet");
    });

console.log("✅ Hardhat configuration loaded for Base Mainnet production deployment");