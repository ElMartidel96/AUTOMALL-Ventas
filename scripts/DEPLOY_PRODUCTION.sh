#!/bin/bash

# ============================================
# 🚀 CRYPTOGIFT DAO PRODUCTION DEPLOYMENT
# ============================================
# 
# Complete deployment script for Base Mainnet
# 
# Author: CryptoGift DAO Team
# Chain: Base Mainnet (8453)
# Total Supply: 2,000,000 CGC tokens
# Architecture: 3-layer security system
#
# ============================================

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ============ BANNER ============
echo -e "${PURPLE}"
echo "  ╔═══════════════════════════════════════════════════════════════╗"
echo "  ║                                                               ║"
echo "  ║               🚀 CRYPTOGIFT DAO DEPLOYMENT 🚀                ║"
echo "  ║                                                               ║"
echo "  ║                    Base Mainnet Production                    ║"
echo "  ║                     2,000,000 CGC Tokens                     ║"
echo "  ║                                                               ║"
echo "  ╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# ============ CONFIGURATION ============
DEPLOYMENT_ENV_FILE=".env.deployment"
HARDHAT_CONFIG="hardhat.config.production.js"
NETWORK="base"
MIN_ETH_BALANCE="0.02"

# ============ PRE-FLIGHT CHECKS ============
echo -e "${CYAN}🔍 Running pre-flight checks...${NC}"

# Check if environment file exists
if [ ! -f "$DEPLOYMENT_ENV_FILE" ]; then
    echo -e "${RED}❌ Environment file not found: $DEPLOYMENT_ENV_FILE${NC}"
    echo -e "${YELLOW}📋 Please copy .env.deployment.example to .env.deployment and fill in your values${NC}"
    exit 1
fi

# Check if hardhat config exists
if [ ! -f "$HARDHAT_CONFIG" ]; then
    echo -e "${RED}❌ Hardhat config not found: $HARDHAT_CONFIG${NC}"
    exit 1
fi

# Load environment variables
source $DEPLOYMENT_ENV_FILE

# Check required environment variables
REQUIRED_VARS=(
    "DEPLOYER_PRIVATE_KEY"
    "BASE_RPC_URL" 
    "BASESCAN_API_KEY"
)

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}❌ Missing required environment variable: $var${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✅ Environment configuration validated${NC}"

# Check Node.js and dependencies
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi

if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  Node modules not found. Installing dependencies...${NC}"
    pnpm install
fi

echo -e "${GREEN}✅ Dependencies validated${NC}"

# Check Hardhat compilation
echo -e "${CYAN}🔨 Compiling contracts...${NC}"
pnpm hardhat compile --config $HARDHAT_CONFIG

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Contract compilation failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Contracts compiled successfully${NC}"

# ============ DEPLOYMENT PHASE ============
echo -e "${PURPLE}🚀 Starting deployment phase...${NC}"

# Run deployment script
echo -e "${CYAN}📋 Deploying all contracts to Base Mainnet...${NC}"
pnpm hardhat run scripts/deploy/deploy-base-mainnet-final.js --network $NETWORK --config $HARDHAT_CONFIG

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Deployment completed successfully${NC}"

# ============ VERIFICATION PHASE ============
echo -e "${PURPLE}🔍 Starting verification phase...${NC}"

# Wait a bit for contracts to propagate
echo -e "${CYAN}⏳ Waiting 60 seconds for contract propagation...${NC}"
sleep 60

# Run verification script
echo -e "${CYAN}📋 Verifying contracts on BaseScan...${NC}"
pnpm hardhat run scripts/verify-base-mainnet.js --network $NETWORK --config $HARDHAT_CONFIG

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Verification failed, but deployment was successful${NC}"
    echo -e "${YELLOW}📋 You can retry verification later using the verify script${NC}"
else
    echo -e "${GREEN}✅ Verification completed successfully${NC}"
fi

# ============ TESTING PHASE ============
echo -e "${PURPLE}🧪 Starting testing phase...${NC}"

echo -e "${CYAN}📋 Running first minting test...${NC}"
pnpm hardhat run scripts/test-first-mint.js --network $NETWORK --config $HARDHAT_CONFIG

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Testing failed${NC}"
    echo -e "${YELLOW}📋 Deployment was successful but tests failed${NC}"
    echo -e "${YELLOW}📋 Please check the test output and retry manually if needed${NC}"
else
    echo -e "${GREEN}✅ Testing completed successfully${NC}"
fi

# ============ SUMMARY ============
echo -e "${PURPLE}"
echo "  ╔═══════════════════════════════════════════════════════════════╗"
echo "  ║                                                               ║"
echo "  ║                🎉 DEPLOYMENT COMPLETED! 🎉                   ║"
echo "  ║                                                               ║"
echo "  ╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Find and display the latest deployment file
LATEST_DEPLOYMENT=$(ls -t base-mainnet-deployment-*.json 2>/dev/null | head -n1)
if [ -n "$LATEST_DEPLOYMENT" ]; then
    echo -e "${GREEN}📄 Deployment file: $LATEST_DEPLOYMENT${NC}"
    
    # Extract contract addresses using grep and sed
    if command -v jq &> /dev/null; then
        echo -e "${BLUE}📋 Contract Addresses:${NC}"
        jq -r '.contracts | to_entries[] | "  \(.key): \(.value)"' "$LATEST_DEPLOYMENT"
    else
        echo -e "${YELLOW}📋 Install 'jq' to see formatted contract addresses${NC}"
    fi
fi

echo -e "${CYAN}"
echo "📋 Next Steps:"
echo "1. 📤 git add . && git commit -m 'feat: deploy contracts to Base Mainnet'"
echo "2. 📤 git push origin main"
echo "3. 🌐 Update frontend environment with contract addresses"
echo "4. 🖥️  Deploy ranking backend with new configuration"
echo "5. 🎨 Deploy frontend to production"
echo "6. 🧪 Run additional integration tests"
echo -e "${NC}"

echo -e "${GREEN}"
echo "🎉 Your CryptoGift DAO is now live on Base Mainnet!"
echo "💰 2,000,000 CGC tokens minted and ready"
echo "🔒 3-layer security architecture active"
echo "✨ Visual ranking system ready for deployment"
echo -e "${NC}"

echo -e "${RED}"
echo "⚠️  SECURITY REMINDERS:"
echo "- NEVER share your private keys"
echo "- Keep deployment files secure"
echo "- Monitor contract activity"
echo "- Set up BaseScan alerts"
echo -e "${NC}"

exit 0