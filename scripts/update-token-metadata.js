/**
 * @title Automated Token Metadata Update Script
 * @author CryptoGift DAO Team
 * @notice Complete automation for token metadata updates across platforms
 * @dev Handles BaseScan, wallets, and token list aggregators
 */

const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');

// Contract and asset paths
const CGC_TOKEN_ADDRESS = '0x5e3a61b550328f3D8C44f60b3e10a49D3d806175';
const DEPLOYER_ADDRESS = '0xc655BF2Bd9AfA997c757Bef290A9Bb6ca41c5dE6';
const METADATA_DIR = path.join(__dirname, '../public/metadata');

/**
 * Generate permanent GitHub URLs for assets
 */
async function generateGitHubURLs() {
    console.log('🔗 Generating GitHub URLs for assets...');
    
    // For production, we'll use the main branch
    // In practice, you should replace 'main' with a specific commit hash
    const baseUrl = 'https://raw.githubusercontent.com/CryptoGift-Wallets-DAO/CryptoGift-Wallets-DAO/main/public/metadata';
    
    const urls = {
        logo64: `${baseUrl}/cgc-logo-64.png`,
        logo256: `${baseUrl}/cgc-logo-256.png`,
        logo512: `${baseUrl}/cgc-logo-512.png`,
        tokenList: `${baseUrl}/cgc-tokenlist.json`,
        metadata: `${baseUrl}/token-metadata.json`
    };
    
    console.log('✅ GitHub URLs generated:');
    Object.entries(urls).forEach(([key, url]) => {
        console.log(`  ${key}: ${url}`);
    });
    
    return urls;
}

/**
 * Generate BaseScan submission instructions
 */
function generateBaseScanInstructions(urls) {
    console.log('\n📋 BASESCAN SUBMISSION INSTRUCTIONS');
    console.log('===================================');
    
    const instructions = {
        tokenPage: `https://basescan.org/token/${CGC_TOKEN_ADDRESS}`,
        updateForm: `https://basescan.org/token/${CGC_TOKEN_ADDRESS}#tokenInfo`,
        requiredWallet: DEPLOYER_ADDRESS,
        logoUrl: urls.logo64,
        
        formData: {
            tokenName: 'CryptoGift Coin',
            tokenSymbol: 'CGC',
            website: 'https://crypto-gift-wallets-dao.vercel.app',
            email: 'dao@cryptogift-wallets.com',
            description: 'CryptoGift Coin (CGC) is the governance token of the CryptoGift Wallets DAO. The token enables holders to participate in DAO governance decisions and receive rewards for contributions to the ecosystem.',
            discord: 'https://discord.gg/cryptogift',
            twitter: 'https://x.com/cryptogiftdao',
            github: 'https://github.com/CryptoGift-Wallets-DAO',
            reddit: '',
            telegram: '',
            facebook: ''
        }
    };
    
    console.log(`\n🔗 Token Page: ${instructions.tokenPage}`);
    console.log(`📝 Update Form: ${instructions.updateForm}`);
    console.log(`💼 Required Wallet: ${instructions.requiredWallet}`);
    console.log(`🖼️  Logo URL: ${instructions.logoUrl}`);
    
    console.log('\n📝 FORM DATA TO SUBMIT:');
    console.log('========================');
    Object.entries(instructions.formData).forEach(([field, value]) => {
        if (value) {
            console.log(`${field}: ${value}`);
        }
    });
    
    console.log('\n⚠️  IMPORTANT STEPS:');
    console.log('1. Visit the token page above');
    console.log('2. Connect wallet with deployer address');
    console.log('3. Click "More" → "Update Token Info"');
    console.log('4. Complete address ownership verification if needed');
    console.log('5. Fill form with data above');
    console.log('6. Upload logo from URL or file');
    console.log('7. Submit and wait 24-48h for approval');
    
    return instructions;
}

/**
 * Generate Coinbase Wallet submission instructions
 */
function generateCoinbaseWalletInstructions(urls) {
    console.log('\n📱 COINBASE WALLET SUBMISSION INSTRUCTIONS');
    console.log('==========================================');
    
    const instructions = {
        updateUrl: 'https://wallet.coinbase.com',
        tokenAddress: CGC_TOKEN_ADDRESS,
        logoUrl: urls.logo256,
        requiredWallet: DEPLOYER_ADDRESS
    };
    
    console.log(`\n🔗 Coinbase Wallet: ${instructions.updateUrl}`);
    console.log(`📝 Token Address: ${instructions.tokenAddress}`);
    console.log(`🖼️  Logo URL: ${instructions.logoUrl}`);
    console.log(`💼 Required Wallet: ${instructions.requiredWallet}`);
    
    console.log('\n⚠️  IMPORTANT STEPS:');
    console.log('1. Visit wallet.coinbase.com');
    console.log('2. Search for CGC token or contract address');
    console.log('3. Click "Update here" at the bottom');
    console.log('4. Connect with deployer wallet');
    console.log('5. Upload logo and metadata');
    console.log('6. Publish official announcement on X/Farcaster');
    console.log('7. Wait 24-48h for changes to appear');
    
    return instructions;
}

/**
 * Generate CoinGecko submission instructions
 */
function generateCoinGeckoInstructions(urls) {
    console.log('\n🦎 COINGECKO SUBMISSION INSTRUCTIONS');
    console.log('====================================');
    
    const instructions = {
        listingUrl: 'https://support.coingecko.com/hc/en-us/requests/new',
        category: 'Cryptocurrency Listing Request',
        tokenAddress: CGC_TOKEN_ADDRESS,
        logoUrl: urls.logo256,
        
        requiredInfo: {
            tokenName: 'CryptoGift Coin',
            tokenSymbol: 'CGC',
            contractAddress: CGC_TOKEN_ADDRESS,
            blockchain: 'Base',
            website: 'https://crypto-gift-wallets-dao.vercel.app',
            twitter: 'https://x.com/cryptogiftdao',
            discord: 'https://discord.gg/cryptogift',
            github: 'https://github.com/CryptoGift-Wallets-DAO',
            whitepaper: 'https://crypto-gift-wallets-dao.vercel.app/docs',
            description: 'CryptoGift Coin (CGC) is the governance token of the CryptoGift Wallets DAO',
            totalSupply: '2,000,000',
            circulatingSupply: 'To be determined',
            logoUrl: urls.logo256
        }
    };
    
    console.log(`\n🔗 Listing Form: ${instructions.listingUrl}`);
    console.log(`📂 Category: ${instructions.category}`);
    console.log(`🖼️  Logo URL: ${instructions.logoUrl}`);
    
    console.log('\n📝 REQUIRED INFORMATION:');
    console.log('========================');
    Object.entries(instructions.requiredInfo).forEach(([field, value]) => {
        console.log(`${field}: ${value}`);
    });
    
    console.log('\n⚠️  PREREQUISITES:');
    console.log('1. Token should have active trading pairs');
    console.log('2. Community engagement and social presence');
    console.log('3. Official website and documentation');
    console.log('4. Transparent project information');
    console.log('\n📋 APPROVAL TIME: Usually 3-7 business days');
    
    return instructions;
}

/**
 * Generate deployment checklist
 */
function generateDeploymentChecklist(urls) {
    console.log('\n✅ DEPLOYMENT CHECKLIST');
    console.log('=======================');
    
    const checklist = [
        {
            task: 'Generate optimized logos',
            status: '✅ COMPLETED',
            description: 'Created 64x64, 256x256, 512x512 PNG versions'
        },
        {
            task: 'Create and validate token list',
            status: '✅ COMPLETED',
            description: 'Token list passes Uniswap schema validation'
        },
        {
            task: 'Commit assets to GitHub',
            status: '⏳ PENDING',
            description: 'Push all metadata files to GitHub repository',
            action: 'git add public/metadata/ && git commit -m "feat: add CGC token metadata and logos" && git push'
        },
        {
            task: 'Get commit hash',
            status: '⏳ PENDING',
            description: 'Get specific commit hash for permanent URLs',
            action: 'git rev-parse HEAD'
        },
        {
            task: 'Update URLs with commit hash',
            status: '⏳ PENDING',
            description: 'Replace "main" with commit hash in URLs'
        },
        {
            task: 'Verify contract on BaseScan',
            status: '⏳ PENDING',
            description: 'Ensure contract source code is verified',
            action: 'node scripts/verify-new-contracts.js'
        },
        {
            task: 'Submit BaseScan update',
            status: '⏳ PENDING',
            description: 'Submit token info update form'
        },
        {
            task: 'Update Coinbase Wallet',
            status: '⏳ PENDING',
            description: 'Submit metadata to Coinbase Wallet'
        },
        {
            task: 'Apply to CoinGecko',
            status: '⏳ PENDING',
            description: 'Submit listing application'
        },
        {
            task: 'Create trading pair (optional)',
            status: '⏳ OPTIONAL',
            description: 'Create CGC/WETH pair on Aerodrome or Uniswap'
        },
        {
            task: 'Verify metadata propagation',
            status: '⏳ PENDING',
            description: 'Check logos appear in wallets after 24-48h'
        }
    ];
    
    checklist.forEach((item, index) => {
        console.log(`\n${index + 1}. ${item.task}`);
        console.log(`   Status: ${item.status}`);
        console.log(`   Description: ${item.description}`);
        if (item.action) {
            console.log(`   Action: ${item.action}`);
        }
    });
    
    return checklist;
}

/**
 * Save comprehensive guide to file
 */
function saveComprehensiveGuide(urls, baseScan, coinbase, coinGecko, checklist) {
    console.log('\n💾 Saving comprehensive guide...');
    
    const guide = {
        metadata: {
            generated: new Date().toISOString(),
            tokenAddress: CGC_TOKEN_ADDRESS,
            deployerAddress: DEPLOYER_ADDRESS,
            network: 'Base Mainnet (8453)'
        },
        urls,
        baseScan,
        coinbase,
        coinGecko,
        checklist,
        
        quickStart: {
            immediate: [
                'Commit and push metadata files to GitHub',
                'Get commit hash and update URLs',
                'Verify contract on BaseScan if not done',
                'Submit BaseScan token update form'
            ],
            nextDay: [
                'Apply to CoinGecko (requires active community)',
                'Update Coinbase Wallet metadata',
                'Consider creating trading pair for liquidity'
            ],
            followUp: [
                'Monitor for logo appearance (24-48h)',
                'Submit to additional token lists',
                'Announce successful listings to community'
            ]
        },
        
        troubleshooting: {
            baseScanRejection: 'Ensure neutral description, correct logo format, and deployer wallet signature',
            coinbaseDelay: 'Make official social media announcement and resubmit if needed',
            coinGeckoRejection: 'Ensure active trading pairs and community engagement before reapplying'
        }
    };
    
    const guidePath = path.join(METADATA_DIR, 'submission-guide.json');
    fs.writeFileSync(guidePath, JSON.stringify(guide, null, 2));
    
    console.log(`✅ Comprehensive guide saved: ${guidePath}`);
    
    return guide;
}

/**
 * Main execution
 */
async function main() {
    console.log('🚀 CGC TOKEN METADATA UPDATE AUTOMATION');
    console.log('========================================\n');
    
    try {
        // Check that metadata files exist
        const requiredFiles = [
            'cgc-logo-64.png',
            'cgc-logo-256.png',
            'cgc-logo-512.png',
            'cgc-tokenlist.json',
            'token-metadata.json'
        ];
        
        for (const file of requiredFiles) {
            const filePath = path.join(METADATA_DIR, file);
            if (!fs.existsSync(filePath)) {
                throw new Error(`Required file not found: ${file}`);
            }
        }
        
        console.log('✅ All metadata files found');
        
        // Generate GitHub URLs
        const urls = await generateGitHubURLs();
        
        // Generate platform-specific instructions
        const baseScanInstructions = generateBaseScanInstructions(urls);
        const coinbaseInstructions = generateCoinbaseWalletInstructions(urls);
        const coinGeckoInstructions = generateCoinGeckoInstructions(urls);
        
        // Generate deployment checklist
        const checklist = generateDeploymentChecklist(urls);
        
        // Save comprehensive guide
        const guide = saveComprehensiveGuide(
            urls,
            baseScanInstructions,
            coinbaseInstructions,
            coinGeckoInstructions,
            checklist
        );
        
        console.log('\n🎉 TOKEN METADATA UPDATE GUIDE GENERATED!');
        console.log('=========================================');
        
        console.log('\n📁 Generated Files:');
        console.log(`📄 ${METADATA_DIR}/submission-guide.json`);
        console.log(`📄 ${METADATA_DIR}/cgc-tokenlist.json`);
        console.log(`📄 ${METADATA_DIR}/token-metadata.json`);
        console.log(`🖼️  ${METADATA_DIR}/cgc-logo-64.png`);
        console.log(`🖼️  ${METADATA_DIR}/cgc-logo-256.png`);
        console.log(`🖼️  ${METADATA_DIR}/cgc-logo-512.png`);
        
        console.log('\n🚀 IMMEDIATE NEXT STEPS:');
        console.log('1. git add public/metadata/');
        console.log('2. git commit -m "feat: add CGC token metadata and logos"');
        console.log('3. git push');
        console.log('4. Get commit hash: git rev-parse HEAD');
        console.log('5. Update URLs with commit hash');
        console.log('6. Run: node scripts/verify-new-contracts.js');
        console.log('7. Submit to BaseScan using generated instructions');
        
        console.log('\n📋 For detailed instructions, see:');
        console.log(`${METADATA_DIR}/submission-guide.json`);
        
        return guide;
        
    } catch (error) {
        console.error('\n❌ Failed to generate metadata update guide:', error.message);
        process.exit(1);
    }
}

// Execute if run directly
if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = { main };