# 🚀 CryptoGift Wallets DAO - Setup Guide

## 📋 Prerequisites

Before starting, ensure you have:
- Node.js v18+ installed
- Git installed
- A wallet with at least 0.05 ETH on Base network
- Access to your Aragon DAO (for proposals)

## 🛠️ Step-by-Step Setup

### 1️⃣ Initial Setup

```bash
# Clone the repository (if not already done)
cd /mnt/c/Users/rafae/cryptogift-wallets-DAO

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

### 2️⃣ Configure Environment Variables

Edit `.env` file and add your values:

```env
# REQUIRED - Your deployer wallet private key
DEPLOYER_PRIVATE_KEY=0x...

# REQUIRED - RPC URLs (use Alchemy, Infura, or public RPC)
RPC_URL=https://mainnet.base.org
RPC_URL_BASE_SEPOLIA=https://sepolia.base.org

# REQUIRED for contract verification
BASESCAN_API_KEY=your_basescan_api_key

# Bot keys (can be same as deployer for testing)
ATTESTOR_PRIVATE_KEY=0x...
BOT_PRIVATE_KEY=0x...

# Optional - Quest platform keys (add when available)
WONDERVERSE_API_KEY=
DEWORK_API_KEY=
ZEALY_API_KEY=
```

### 3️⃣ Compile Contracts

```bash
# Clean previous builds
npm run clean

# Compile all contracts
npm run compile

# Should see: "Compiled X contracts successfully"
```

### 4️⃣ Run Tests (Optional but Recommended)

```bash
# Run all tests
npm test

# Run with coverage
npm run coverage

# Run with gas reporting
npm run gas-report
```

### 5️⃣ Deploy Contracts

Deploy contracts in this exact order:

#### A. Deploy CGC Token
```bash
npx hardhat run scripts/deploy/00-deploy-token.ts --network base
```

Expected output:
- ✅ CGC Token deployed to: 0x...
- Save the token address!

#### B. Update .env with Token Address
```bash
# Add to your .env file:
CGC_TOKEN_ADDRESS=0x... # The address from step A
```

#### C. Deploy Vault and Supporting Contracts
```bash
npx hardhat run scripts/deploy/01-deploy-vault.ts --network base
```

Expected output:
- ✅ GovTokenVault deployed to: 0x...
- ✅ AllowedSignersCondition deployed to: 0x...
- ✅ MerklePayouts deployed to: 0x...

### 6️⃣ Register EAS Schema

```bash
npx hardhat run scripts/deploy/03-register-eas.ts --network base
```

Expected output:
- ✅ Schema registered successfully!
- 📌 Schema UID: 0x...

Update `.env` with the Schema UID:
```bash
SCHEMA_UID=0x... # The UID from registration
```

### 7️⃣ Verify Contracts on Basescan

```bash
npx hardhat run scripts/deploy/04-verify-contracts.ts --network base
```

This enables contract interaction on Basescan.

### 8️⃣ Configure Aragon Permissions

Generate the proposal data:
```bash
npx hardhat run scripts/deploy/02-setup-aragon.ts --network base
```

This creates `proposals/001-initialize-vault.json`

#### Create DAO Proposal:

1. Go to: https://app.aragon.org/dao/base-mainnet/0x3244DFBf9E5374DF2f106E89Cf7972E5D4C9ac31/dashboard
2. Click "New Proposal"
3. Add the actions from the JSON file
4. Submit for voting
5. Wait for voting period
6. Execute if approved

### 9️⃣ Setup Attestation Bot

```bash
# Navigate to bot directory
cd bots/eas-attestor

# Install dependencies
npm install

# Create bot .env file
cp .env.example .env

# Edit .env with your values:
# - ATTESTOR_PRIVATE_KEY
# - SCHEMA_UID (from step 6)
# - API keys for quest platforms

# Start the bot
npm start
```

The bot will run on port 3001 with endpoints:
- `POST /webhook/wonderverse`
- `POST /webhook/dework`
- `POST /webhook/zealy`
- `GET /health`
- `GET /stats`

## 🔍 Verification Checklist

After deployment, verify:

- [ ] CGC Token deployed with 1,000,000 supply
- [ ] DAO received all CGC tokens
- [ ] Vault deployed with shadow mode ENABLED
- [ ] EAS schema registered
- [ ] Contracts verified on Basescan
- [ ] Bot running and accessible

## 📊 Contract Addresses

After deployment, you'll have:

| Contract | Address | Purpose |
|----------|---------|---------|
| CGC Token | 0x... | Governance token |
| GovTokenVault | 0x... | Token release vault |
| AllowedSignersCondition | 0x... | Permission condition |
| MerklePayouts | 0x... | Batch distributions |

## 🚨 Important Security Notes

1. **Shadow Mode**: The vault starts in shadow mode (simulated transfers only)
2. **Real Transfers**: Require DAO proposal to disable shadow mode
3. **Private Keys**: Never commit real private keys
4. **Permissions**: Only the DAO can authorize releases

## 🐛 Troubleshooting

### "Insufficient ETH balance"
- Ensure deployer wallet has at least 0.05 ETH on Base

### "CGC_TOKEN_ADDRESS not set"
- Deploy token first (step 5A)
- Add address to .env file

### "Schema already exists"
- Check if schema was previously registered
- Use existing schema UID if available

### "Verification failed"
- Check BASESCAN_API_KEY is correct
- Wait a few minutes after deployment
- Try manual verification command shown in output

## 📚 Next Steps

After successful setup:

1. **Fund the Vault**: Transfer CGC tokens via DAO proposal
2. **Configure Quest Platforms**: Set up webhooks to bot endpoints
3. **Test Shadow Mode**: Create test attestations
4. **Go Live**: Disable shadow mode via DAO proposal

## 🆘 Support

- Documentation: `/docs` folder
- Discord: [Join our Discord](https://discord.gg/cryptogift)
- Issues: Create an issue in this repository

## 📝 Useful Commands

```bash
# Check deployment status
cat deployments/deployment-8453.json

# View contract size
npm run size

# Flatten contracts for verification
npm run flatten

# Start local node for testing
npm run node

# Console interaction
npm run console
```

---

**Remember**: Always test on testnet first! Use `--network baseSepolia` for testnet deployment.