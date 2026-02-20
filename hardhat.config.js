require("@nomiclabs/hardhat-ethers");
require("@nomicfoundation/hardhat-verify");
require("dotenv").config({ path: ".env.dao" });

const PRIVATE_KEY_DAO_DEPLOYER = process.env.PRIVATE_KEY_DAO_DEPLOYER || "0000000000000000000000000000000000000000000000000000000000000001";
const BASESCAN_API_KEY = process.env.BASESCAN_API_KEY || "";
const BASE_RPC_URL = process.env.ALCHEMY_BASE_RPC || process.env.BASE_RPC_URL || "https://mainnet.base.org";
const BASE_SEPOLIA_RPC_URL = process.env.ALCHEMY_SEPOLIA_RPC || process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org";

console.log("\n🏛️ CryptoGift DAO - Hardhat Configuration");
console.log("📍 Network: Base Mainnet");
console.log("🔑 Deployer configured:", PRIVATE_KEY_DAO_DEPLOYER ? "✅" : "❌");
console.log("🔍 Basescan API:", BASESCAN_API_KEY ? "✅" : "❌");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.20",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
            details: {
              yul: true,
              yulDetails: {
                stackAllocation: true,
                optimizerSteps: "dhfoDgvulfnTUtnIf"
              }
            }
          },
          evmVersion: "cancun"
        }
      },
      {
        version: "0.8.24",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          },
          evmVersion: "cancun"
        }
      },
      {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          },
          evmVersion: "cancun"
        }
      }
    ]
  },
  
  networks: {
    hardhat: {
      chainId: 31337,
      allowUnlimitedContractSize: false
    },
    base: {
      url: BASE_RPC_URL,
      accounts: [PRIVATE_KEY_DAO_DEPLOYER],
      chainId: 8453,
      gasPrice: "auto",
      gasMultiplier: 1.2,
      timeout: 120000
    },
    baseSepolia: {
      url: BASE_SEPOLIA_RPC_URL,
      accounts: [PRIVATE_KEY_DAO_DEPLOYER],
      chainId: 84532,
      gasPrice: "auto",
      gasMultiplier: 1.2,
      timeout: 120000
    }
  },
  
  etherscan: {
    apiKey: BASESCAN_API_KEY
  },
  sourcify: {
    enabled: true
  },
  
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  
  mocha: {
    timeout: 120000
  },
  
  gasReporter: {
    enabled: true,
    currency: "USD",
    gasPrice: 1
  }
};