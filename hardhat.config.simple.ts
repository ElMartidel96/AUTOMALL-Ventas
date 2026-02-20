import { HardhatUserConfig } from "hardhat/config";
import * as dotenv from "dotenv";
import * as path from "path";

// Load DAO-specific environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.dao') });

const PRIVATE_KEY_DAO_DEPLOYER = process.env.PRIVATE_KEY_DAO_DEPLOYER || "0000000000000000000000000000000000000000000000000000000000000001";
const BASESCAN_API_KEY = process.env.BASESCAN_API_KEY || "";
const BASE_RPC_URL = process.env.ALCHEMY_BASE_RPC || process.env.BASE_RPC_URL || "https://mainnet.base.org";
const BASE_SEPOLIA_RPC_URL = process.env.ALCHEMY_SEPOLIA_RPC || process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  
  networks: {
    hardhat: {
      chainId: 31337
    },
    
    base: {
      url: BASE_RPC_URL,
      chainId: 8453,
      accounts: [PRIVATE_KEY_DAO_DEPLOYER]
    },
    
    baseSepolia: {
      url: BASE_SEPOLIA_RPC_URL,
      chainId: 84532,
      accounts: [PRIVATE_KEY_DAO_DEPLOYER]
    }
  },
  
  paths: {
    sources: "./contracts",
    tests: "./tests",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};

export default config;
