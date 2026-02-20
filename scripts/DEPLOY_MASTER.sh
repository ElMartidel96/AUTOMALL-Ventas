#!/bin/bash

# =====================================================
# 🏛️ CryptoGift DAO - Master Deployment Script
# =====================================================
# This script executes the complete deployment process
# with automatic verification on Basescan
# =====================================================

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Configuration
NETWORK="base"  # Change to "baseSepolia" for testnet
SKIP_COMPILE=false
SKIP_PRECHECK=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --network)
      NETWORK="$2"
      shift 2
      ;;
    --skip-compile)
      SKIP_COMPILE=true
      shift
      ;;
    --skip-precheck)
      SKIP_PRECHECK=true
      shift
      ;;
    --help)
      echo "Usage: ./DEPLOY_MASTER.sh [options]"
      echo "Options:"
      echo "  --network <network>    Network to deploy to (base or baseSepolia)"
      echo "  --skip-compile         Skip contract compilation"
      echo "  --skip-precheck        Skip pre-deployment checks"
      echo "  --help                 Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

clear

echo -e "${BOLD}${BLUE}"
echo "╔════════════════════════════════════════════════╗"
echo "║   🏛️  CryptoGift DAO - Master Deployment       ║"
echo "║         Automatic Basescan Verification         ║"
echo "╚════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${CYAN}Network: ${BOLD}$NETWORK${NC}"
echo -e "${CYAN}Timestamp: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
echo ""

# Function to check command result
check_result() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1 successful${NC}"
    else
        echo -e "${RED}❌ $1 failed${NC}"
        exit 1
    fi
}

# Function to prompt for confirmation
confirm() {
    echo -e "${YELLOW}$1${NC}"
    read -p "Continue? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}Deployment cancelled${NC}"
        exit 1
    fi
}

# =====================================================
# STEP 1: Environment Check
# =====================================================
echo -e "${BOLD}${CYAN}[STEP 1/7] Checking Environment...${NC}"

# Check if .env.dao exists
if [ ! -f ".env.dao" ]; then
    echo -e "${RED}❌ .env.dao file not found!${NC}"
    echo "Please create .env.dao with required variables"
    exit 1
fi

# Source environment variables
source .env.dao

# Check critical environment variables
if [ -z "$PRIVATE_KEY_DAO_DEPLOYER" ]; then
    echo -e "${RED}❌ PRIVATE_KEY_DAO_DEPLOYER not set in .env.dao${NC}"
    exit 1
fi

if [ -z "$BASESCAN_API_KEY" ]; then
    echo -e "${RED}❌ BASESCAN_API_KEY not set in .env.dao${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Environment variables loaded${NC}"

# =====================================================
# STEP 2: Install Dependencies
# =====================================================
echo -e "\n${BOLD}${CYAN}[STEP 2/7] Installing Dependencies...${NC}"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing npm packages..."
    npm install
    check_result "Dependency installation"
else
    echo -e "${GREEN}✅ Dependencies already installed${NC}"
fi

# =====================================================
# STEP 3: Compile Contracts
# =====================================================
if [ "$SKIP_COMPILE" = false ]; then
    echo -e "\n${BOLD}${CYAN}[STEP 3/7] Compiling Contracts...${NC}"
    
    # Clean previous artifacts
    echo "Cleaning previous artifacts..."
    npx hardhat clean
    
    # Compile contracts
    echo "Compiling contracts..."
    npx hardhat compile
    check_result "Contract compilation"
    
    # Run contract sizer
    echo "Checking contract sizes..."
    npx hardhat size-contracts
else
    echo -e "\n${BOLD}${YELLOW}[STEP 3/7] Skipping compilation (--skip-compile flag)${NC}"
fi

# =====================================================
# STEP 4: Pre-deployment Checks
# =====================================================
if [ "$SKIP_PRECHECK" = false ]; then
    echo -e "\n${BOLD}${CYAN}[STEP 4/7] Running Pre-deployment Checks...${NC}"
    
    npx hardhat run scripts/deploy/pre-deployment-check.ts --network $NETWORK
    check_result "Pre-deployment checks"
else
    echo -e "\n${BOLD}${YELLOW}[STEP 4/7] Skipping pre-deployment checks (--skip-precheck flag)${NC}"
fi

# =====================================================
# STEP 5: Deployment Confirmation
# =====================================================
echo -e "\n${BOLD}${YELLOW}[STEP 5/7] Deployment Confirmation${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}You are about to deploy to: $NETWORK${NC}"
echo ""
echo -e "This will deploy the following contracts:"
echo -e "  • CGC Token (1,000,000 supply)"
echo -e "  • GovTokenVault (with shadow mode)"
echo -e "  • AllowedSignersCondition"
echo -e "  • MerklePayouts"
echo ""
echo -e "All contracts will be ${BOLD}automatically verified${NC} on Basescan"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ "$NETWORK" = "base" ]; then
    echo -e "${RED}${BOLD}⚠️  WARNING: This is MAINNET deployment!${NC}"
    echo -e "${RED}Real ETH will be spent for gas fees${NC}"
    confirm "Are you SURE you want to deploy to Base Mainnet?"
else
    confirm "Deploy to $NETWORK?"
fi

# =====================================================
# STEP 6: Deploy Contracts
# =====================================================
echo -e "\n${BOLD}${CYAN}[STEP 6/7] Deploying Contracts...${NC}"
echo -e "${YELLOW}This will take several minutes...${NC}"

# Run deployment script
npx hardhat run scripts/deploy/deploy-all-with-verification.ts --network $NETWORK

if [ $? -eq 0 ]; then
    echo -e "${GREEN}${BOLD}✅ Deployment successful!${NC}"
    
    # Read deployment data
    DEPLOYMENT_FILE="deployments/deployment-${NETWORK}-latest.json"
    
    if [ -f "$DEPLOYMENT_FILE" ]; then
        echo -e "\n${CYAN}📋 Deployed Contracts:${NC}"
        
        # Extract addresses using grep and sed
        CGC_TOKEN=$(grep -o '"CGCToken"[^}]*' $DEPLOYMENT_FILE | grep -o '"address":"[^"]*' | sed 's/"address":"//')
        VAULT=$(grep -o '"GovTokenVault"[^}]*' $DEPLOYMENT_FILE | grep -o '"address":"[^"]*' | sed 's/"address":"//')
        CONDITION=$(grep -o '"AllowedSignersCondition"[^}]*' $DEPLOYMENT_FILE | grep -o '"address":"[^"]*' | sed 's/"address":"//')
        MERKLE=$(grep -o '"MerklePayouts"[^}]*' $DEPLOYMENT_FILE | grep -o '"address":"[^"]*' | sed 's/"address":"//')
        
        echo "  CGC Token: $CGC_TOKEN"
        echo "  GovTokenVault: $VAULT"
        echo "  AllowedSignersCondition: $CONDITION"
        echo "  MerklePayouts: $MERKLE"
    fi
else
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
fi

# =====================================================
# STEP 7: Post-deployment Setup
# =====================================================
echo -e "\n${BOLD}${CYAN}[STEP 7/7] Post-deployment Setup...${NC}"

# Option to register EAS schemas
echo -e "\n${YELLOW}Register EAS schemas now? (y/n)${NC}"
read -p "> " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Registering EAS schemas..."
    npx hardhat run scripts/deploy/register-eas-schema.ts --network $NETWORK
    check_result "EAS schema registration"
else
    echo -e "${YELLOW}Skipping EAS schema registration${NC}"
fi

# Option to setup Aragon permissions
echo -e "\n${YELLOW}Generate Aragon permission proposal? (y/n)${NC}"
read -p "> " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Generating Aragon permission proposal..."
    npx hardhat run scripts/deploy/setup-aragon-permissions.ts --network $NETWORK
    check_result "Aragon permission setup"
else
    echo -e "${YELLOW}Skipping Aragon permission setup${NC}"
fi

# =====================================================
# COMPLETION
# =====================================================
echo -e "\n${BOLD}${GREEN}"
echo "╔════════════════════════════════════════════════╗"
echo "║       🎉 DEPLOYMENT COMPLETE!                   ║"
echo "╚════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${CYAN}📚 Next Steps:${NC}"
echo "  1. Check contracts on Basescan (links in deployment output)"
echo "  2. Install Token Voting Plugin in Aragon App"
echo "  3. Create governance proposal for permissions"
echo "  4. Update dashboard to use deployed contracts"
echo "  5. Configure bots with contract addresses"
echo "  6. Fund attestor wallet for EAS"
echo "  7. Disable shadow mode when ready for production"

echo -e "\n${GREEN}All deployment data saved in: deployments/${NC}"
echo -e "${GREEN}.env.dao updated with contract addresses${NC}"

echo -e "\n${BOLD}${CYAN}Deployment completed at: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
echo -e "${CYAN}Made by mbxarts.com The Moon in a Box property${NC}"
echo -e "${CYAN}Co-Author: Godez22${NC}"