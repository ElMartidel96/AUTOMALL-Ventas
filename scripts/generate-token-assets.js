/**
 * @title Token Assets Generator
 * @author CryptoGift DAO Team
 * @notice Generate optimized token logos for BaseScan and wallets
 * @dev Creates reproducible, validated assets with proper sizing
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');

const SOURCE_LOGO = path.join(__dirname, '../frontend/public/CGC-logo.png');
const OUTPUT_DIR = path.join(__dirname, '../public/metadata');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Generate 64x64 PNG for BaseScan
 */
async function generate64x64PNG() {
    console.log('🎨 Generating 64x64 PNG for BaseScan...');
    
    const outputPath = path.join(OUTPUT_DIR, 'cgc-logo-64.png');
    
    try {
        await sharp(SOURCE_LOGO)
            .resize(64, 64, {
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            })
            .png({ 
                compressionLevel: 9,
                quality: 100
            })
            .toFile(outputPath);
        
        // Validate dimensions
        const metadata = await sharp(outputPath).metadata();
        if (metadata.width !== 64 || metadata.height !== 64) {
            throw new Error(`Invalid dimensions: ${metadata.width}x${metadata.height}`);
        }
        
        // Check file size
        const stats = fs.statSync(outputPath);
        const fileSizeKB = stats.size / 1024;
        
        if (fileSizeKB > 30) {
            console.warn(`⚠️  File size ${fileSizeKB.toFixed(2)} KB exceeds recommended 30KB`);
            // Recompress with lower quality
            await sharp(SOURCE_LOGO)
                .resize(64, 64, {
                    fit: 'contain',
                    background: { r: 0, g: 0, b: 0, alpha: 0 }
                })
                .png({ 
                    compressionLevel: 9,
                    quality: 80
                })
                .toFile(outputPath);
                
            const newStats = fs.statSync(outputPath);
            const newFileSizeKB = newStats.size / 1024;
            console.log(`✅ Recompressed to ${newFileSizeKB.toFixed(2)} KB`);
        } else {
            console.log(`✅ 64x64 PNG generated (${fileSizeKB.toFixed(2)} KB)`);
        }
        
        return outputPath;
    } catch (error) {
        console.error('❌ Failed to generate 64x64 PNG:', error);
        throw error;
    }
}

/**
 * Generate 256x256 PNG for wallets and listings
 */
async function generate256x256PNG() {
    console.log('🎨 Generating 256x256 PNG for wallets...');
    
    const outputPath = path.join(OUTPUT_DIR, 'cgc-logo-256.png');
    
    try {
        await sharp(SOURCE_LOGO)
            .resize(256, 256, {
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            })
            .png({ 
                compressionLevel: 9,
                quality: 100
            })
            .toFile(outputPath);
        
        // Validate dimensions
        const metadata = await sharp(outputPath).metadata();
        if (metadata.width !== 256 || metadata.height !== 256) {
            throw new Error(`Invalid dimensions: ${metadata.width}x${metadata.height}`);
        }
        
        const stats = fs.statSync(outputPath);
        const fileSizeKB = stats.size / 1024;
        console.log(`✅ 256x256 PNG generated (${fileSizeKB.toFixed(2)} KB)`);
        
        return outputPath;
    } catch (error) {
        console.error('❌ Failed to generate 256x256 PNG:', error);
        throw error;
    }
}

/**
 * Generate 512x512 PNG for high-res displays
 */
async function generate512x512PNG() {
    console.log('🎨 Generating 512x512 PNG for high-res displays...');
    
    const outputPath = path.join(OUTPUT_DIR, 'cgc-logo-512.png');
    
    try {
        await sharp(SOURCE_LOGO)
            .resize(512, 512, {
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            })
            .png({ 
                compressionLevel: 9,
                quality: 100
            })
            .toFile(outputPath);
        
        // Validate dimensions
        const metadata = await sharp(outputPath).metadata();
        if (metadata.width !== 512 || metadata.height !== 512) {
            throw new Error(`Invalid dimensions: ${metadata.width}x${metadata.height}`);
        }
        
        const stats = fs.statSync(outputPath);
        const fileSizeKB = stats.size / 1024;
        console.log(`✅ 512x512 PNG generated (${fileSizeKB.toFixed(2)} KB)`);
        
        return outputPath;
    } catch (error) {
        console.error('❌ Failed to generate 512x512 PNG:', error);
        throw error;
    }
}

/**
 * Copy original logo for reference
 */
async function copyOriginalLogo() {
    console.log('📋 Copying original logo...');
    
    const outputPath = path.join(OUTPUT_DIR, 'cgc-logo-original.png');
    
    try {
        fs.copyFileSync(SOURCE_LOGO, outputPath);
        
        const metadata = await sharp(outputPath).metadata();
        const stats = fs.statSync(outputPath);
        const fileSizeKB = stats.size / 1024;
        
        console.log(`✅ Original logo copied (${metadata.width}x${metadata.height}, ${fileSizeKB.toFixed(2)} KB)`);
        
        return outputPath;
    } catch (error) {
        console.error('❌ Failed to copy original logo:', error);
        throw error;
    }
}

/**
 * Generate metadata JSON for the assets
 */
function generateMetadataJSON(assets) {
    console.log('📝 Generating metadata JSON...');
    
    // Get checksum addresses
    const TOKEN_ADDRESS = ethers.utils.getAddress('0x5e3a61b550328f3D8C44f60b3e10a49D3d806175');
    
    const metadata = {
        name: "CryptoGift Coin",
        symbol: "CGC",
        decimals: 18,
        address: TOKEN_ADDRESS,
        chainId: 8453,
        network: "base",
        logoSizes: {
            '64x64': 'cgc-logo-64.png',
            '256x256': 'cgc-logo-256.png',
            '512x512': 'cgc-logo-512.png',
            'original': 'cgc-logo-original.png'
        },
        urls: {
            website: 'https://crypto-gift-wallets-dao.vercel.app',
            github: 'https://github.com/CryptoGift-Wallets-DAO/CryptoGift-Wallets-DAO',
            discord: 'https://discord.gg/cryptogift',
            twitter: 'https://x.com/cryptogiftdao'
        },
        description: "CryptoGift Coin (CGC) is the governance token of the CryptoGift Wallets DAO, enabling community-driven decision making and rewards distribution for educational achievements.",
        tags: ["governance", "dao", "rewards", "education", "community"],
        generated: new Date().toISOString()
    };
    
    const outputPath = path.join(OUTPUT_DIR, 'token-metadata.json');
    fs.writeFileSync(outputPath, JSON.stringify(metadata, null, 2));
    
    console.log('✅ Metadata JSON generated');
    return outputPath;
}

/**
 * Generate submission info for BaseScan
 */
function generateBaseScanInfo() {
    console.log('\n📋 BASESCAN SUBMISSION INFO');
    console.log('============================');
    console.log('\nToken Information:');
    console.log('- Name: CryptoGift Coin');
    console.log('- Symbol: CGC');
    console.log('- Contract: 0x5e3a61b550328f3D8C44f60b3e10a49D3d806175');
    console.log('- Decimals: 18');
    console.log('- Total Supply: 2,000,000 CGC');
    
    console.log('\nDescription (neutral, factual):');
    console.log('CryptoGift Coin (CGC) is the governance token of the CryptoGift Wallets DAO. The token enables holders to participate in DAO governance decisions and receive rewards for contributions to the ecosystem. CGC operates on Base network and follows ERC-20 standard with voting capabilities.');
    
    console.log('\nWebsite & Socials:');
    console.log('- Website: https://crypto-gift-wallets-dao.vercel.app');
    console.log('- GitHub: https://github.com/CryptoGift-Wallets-DAO');
    console.log('- Discord: https://discord.gg/cryptogift');
    console.log('- X/Twitter: @cryptogiftdao');
    console.log('- Email: dao@cryptogift-wallets.com');
    
    console.log('\nLogo URLs (use after GitHub commit):');
    console.log('Note: Replace <COMMIT_HASH> with actual commit hash after pushing');
    console.log('- 64x64: https://raw.githubusercontent.com/CryptoGift-Wallets-DAO/CryptoGift-Wallets-DAO/<COMMIT_HASH>/public/metadata/cgc-logo-64.png');
    console.log('- 256x256: https://raw.githubusercontent.com/CryptoGift-Wallets-DAO/CryptoGift-Wallets-DAO/<COMMIT_HASH>/public/metadata/cgc-logo-256.png');
    
    console.log('\n⚠️  IMPORTANT NOTES:');
    console.log('1. Sign with deployer wallet: 0xc655BF2Bd9AfA997c757Bef290A9Bb6ca41c5dE6');
    console.log('2. Use 64x64 PNG for BaseScan submission');
    console.log('3. Avoid promotional language or price claims');
    console.log('4. Submit via: https://basescan.org/token/0x5e3a61b550328f3D8C44f60b3e10a49D3d806175');
    console.log('5. Click "More" → "Update Token Info"');
}

/**
 * Main execution
 */
async function main() {
    console.log('🚀 CGC Token Assets Generator');
    console.log('=============================\n');
    
    // Check source file exists
    if (!fs.existsSync(SOURCE_LOGO)) {
        throw new Error(`Source logo not found: ${SOURCE_LOGO}`);
    }
    
    try {
        // Generate all sizes
        const assets = {
            logo64: await generate64x64PNG(),
            logo256: await generate256x256PNG(),
            logo512: await generate512x512PNG(),
            original: await copyOriginalLogo()
        };
        
        // Generate metadata
        const metadataPath = generateMetadataJSON(assets);
        
        // Display BaseScan info
        generateBaseScanInfo();
        
        console.log('\n✅ ALL ASSETS GENERATED SUCCESSFULLY!');
        console.log('=====================================');
        console.log('\nGenerated files:');
        console.log(`📁 ${OUTPUT_DIR}/`);
        console.log('  ├── cgc-logo-64.png (BaseScan)');
        console.log('  ├── cgc-logo-256.png (Wallets)');
        console.log('  ├── cgc-logo-512.png (High-res)');
        console.log('  ├── cgc-logo-original.png (Reference)');
        console.log('  └── token-metadata.json (Info)');
        
        console.log('\n📋 NEXT STEPS:');
        console.log('1. Commit and push these files to GitHub');
        console.log('2. Get the commit hash from GitHub');
        console.log('3. Update token list with permanent URLs');
        console.log('4. Submit to BaseScan with 64x64 logo');
        console.log('5. Apply to CoinGecko with 256x256 logo');
        
        return assets;
        
    } catch (error) {
        console.error('❌ Asset generation failed:', error);
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