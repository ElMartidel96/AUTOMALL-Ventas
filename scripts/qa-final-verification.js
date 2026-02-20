/**
 * @title Final QA Verification Script
 * @author CryptoGift DAO Team
 * @notice Comprehensive QA verification with objective evidence
 * @dev Final validation before production deployment
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const METADATA_DIR = path.join(__dirname, '../public/metadata');
const TOKEN_ADDRESS = '0x5e3a61b550328f3D8C44f60b3e10a49D3d806175';

/**
 * Calculate SHA256 hash of a file
 */
function calculateHash(filePath) {
    const content = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Get file size in bytes
 */
function getFileSize(filePath) {
    return fs.statSync(filePath).size;
}

/**
 * Verify image dimensions using sharp
 */
async function verifyImageDimensions(filePath, expectedWidth, expectedHeight) {
    try {
        const sharp = require('sharp');
        const metadata = await sharp(filePath).metadata();
        return {
            actual: { width: metadata.width, height: metadata.height },
            expected: { width: expectedWidth, height: expectedHeight },
            valid: metadata.width === expectedWidth && metadata.height === expectedHeight
        };
    } catch (error) {
        return { error: error.message, valid: false };
    }
}

/**
 * Validate token list against Uniswap schema
 */
function validateTokenList() {
    try {
        const tokenListPath = path.join(METADATA_DIR, 'cgc-tokenlist.json');
        const result = execSync(`node scripts/validate-tokenlist.js`, { 
            encoding: 'utf8',
            cwd: path.join(__dirname, '..')
        });
        return {
            valid: result.includes('TOKEN LIST IS FULLY VALID'),
            output: result
        };
    } catch (error) {
        return {
            valid: false,
            error: error.message
        };
    }
}

/**
 * Test URL accessibility (if GitHub URLs are available)
 */
async function testUrlAccessibility(url) {
    try {
        const https = require('https');
        return new Promise((resolve) => {
            const req = https.request(url, { method: 'HEAD' }, (res) => {
                resolve({
                    url,
                    statusCode: res.statusCode,
                    contentType: res.headers['content-type'],
                    contentLength: res.headers['content-length'],
                    accessible: res.statusCode === 200
                });
            });
            
            req.on('error', (error) => {
                resolve({
                    url,
                    accessible: false,
                    error: error.message
                });
            });
            
            req.setTimeout(10000, () => {
                req.destroy();
                resolve({
                    url,
                    accessible: false,
                    error: 'Timeout'
                });
            });
            
            req.end();
        });
    } catch (error) {
        return {
            url,
            accessible: false,
            error: error.message
        };
    }
}

/**
 * Main QA verification
 */
async function main() {
    console.log('🔍 FINAL QA VERIFICATION - CGC TOKEN METADATA');
    console.log('===============================================\n');
    
    const results = {
        timestamp: new Date().toISOString(),
        tokenAddress: TOKEN_ADDRESS,
        files: {},
        dimensions: {},
        tokenList: {},
        urls: {},
        checksums: {},
        summary: { passed: 0, failed: 0, warnings: 0 }
    };
    
    // 1. File existence and size verification
    console.log('📁 1. FILE VERIFICATION');
    console.log('=======================');
    
    const requiredFiles = [
        { name: 'cgc-logo-64.png', maxSize: 30000, dimensions: [64, 64] },
        { name: 'cgc-logo-256.png', maxSize: 50000, dimensions: [256, 256] },
        { name: 'cgc-logo-512.png', maxSize: 100000, dimensions: [512, 512] },
        { name: 'cgc-tokenlist.json', maxSize: 10000 },
        { name: 'token-metadata.json', maxSize: 5000 },
        { name: 'submission-guide.json', maxSize: 50000 }
    ];
    
    for (const file of requiredFiles) {
        const filePath = path.join(METADATA_DIR, file.name);
        
        if (fs.existsSync(filePath)) {
            const size = getFileSize(filePath);
            const hash = calculateHash(filePath);
            
            results.files[file.name] = {
                exists: true,
                size,
                sizeOk: size <= file.maxSize,
                hash
            };
            
            results.checksums[file.name] = hash;
            
            console.log(`✅ ${file.name}: ${size} bytes (${hash.substring(0, 16)}...)`);
            
            if (size > file.maxSize) {
                console.log(`⚠️  WARNING: ${file.name} exceeds recommended size (${size} > ${file.maxSize})`);
                results.summary.warnings++;
            } else {
                results.summary.passed++;
            }
            
            // Verify image dimensions if specified
            if (file.dimensions && file.name.endsWith('.png')) {
                try {
                    const dimResult = await verifyImageDimensions(filePath, file.dimensions[0], file.dimensions[1]);
                    results.dimensions[file.name] = dimResult;
                    
                    if (dimResult.valid) {
                        console.log(`✅ ${file.name}: ${dimResult.actual.width}x${dimResult.actual.height} (correct)`);
                        results.summary.passed++;
                    } else {
                        console.log(`❌ ${file.name}: ${dimResult.actual.width}x${dimResult.actual.height} (expected ${dimResult.expected.width}x${dimResult.expected.height})`);
                        results.summary.failed++;
                    }
                } catch (error) {
                    console.log(`⚠️  Could not verify dimensions for ${file.name}: ${error.message}`);
                    results.summary.warnings++;
                }
            }
        } else {
            console.log(`❌ ${file.name}: NOT FOUND`);
            results.files[file.name] = { exists: false };
            results.summary.failed++;
        }
    }
    
    // 2. Token List Validation
    console.log('\n🔍 2. TOKEN LIST VALIDATION');
    console.log('===========================');
    
    try {
        results.tokenList = validateTokenList();
        if (results.tokenList.valid) {
            console.log('✅ Token list validation PASSED');
            results.summary.passed++;
        } else {
            console.log('❌ Token list validation FAILED');
            console.log(results.tokenList.error || 'Unknown error');
            results.summary.failed++;
        }
    } catch (error) {
        console.log(`❌ Token list validation ERROR: ${error.message}`);
        results.tokenList = { valid: false, error: error.message };
        results.summary.failed++;
    }
    
    // 3. URL Testing (if available)
    console.log('\n🌐 3. URL ACCESSIBILITY TEST');
    console.log('============================');
    
    // Test with main branch URLs (will need commit hash in production)
    const testUrls = [
        'https://raw.githubusercontent.com/CryptoGift-Wallets-DAO/CryptoGift-Wallets-DAO/main/public/metadata/cgc-logo-64.png',
        'https://raw.githubusercontent.com/CryptoGift-Wallets-DAO/CryptoGift-Wallets-DAO/main/public/metadata/cgc-logo-256.png',
        'https://raw.githubusercontent.com/CryptoGift-Wallets-DAO/CryptoGift-Wallets-DAO/main/public/metadata/cgc-tokenlist.json'
    ];
    
    console.log('⏳ Testing GitHub raw URLs (main branch)...');
    console.log('Note: URLs will need commit hash replacement after push');
    
    for (const url of testUrls) {
        try {
            const urlResult = await testUrlAccessibility(url);
            results.urls[url] = urlResult;
            
            if (urlResult.accessible) {
                console.log(`✅ ${url}: ${urlResult.statusCode} (${urlResult.contentType})`);
                results.summary.passed++;
            } else {
                console.log(`❌ ${url}: ${urlResult.error || 'Not accessible'}`);
                results.summary.failed++;
            }
        } catch (error) {
            console.log(`❌ ${url}: ${error.message}`);
            results.summary.failed++;
        }
    }
    
    // 4. Generate evidence summary
    console.log('\n📊 4. QA SUMMARY');
    console.log('================');
    
    const totalChecks = results.summary.passed + results.summary.failed + results.summary.warnings;
    const successRate = Math.round((results.summary.passed / totalChecks) * 100);
    
    console.log(`Total checks: ${totalChecks}`);
    console.log(`Passed: ${results.summary.passed}`);
    console.log(`Failed: ${results.summary.failed}`);
    console.log(`Warnings: ${results.summary.warnings}`);
    console.log(`Success rate: ${successRate}%`);
    
    // 5. Save QA report
    const reportPath = path.join(METADATA_DIR, 'qa-verification-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`\n💾 QA report saved: ${reportPath}`);
    
    // 6. Generate checksums for documentation
    console.log('\n🔐 CHECKSUMS FOR DOCUMENTATION');
    console.log('===============================');
    console.log('Add these to TOKEN_METADATA_IMPLEMENTATION.md:');
    console.log('\n```');
    console.log('## 🔐 CHECKSUMS v1.0 (9 Jan 2025)');
    console.log('');
    Object.entries(results.checksums).forEach(([file, hash]) => {
        console.log(`${file}: ${hash}`);
    });
    console.log('```');
    
    // 7. Final verdict
    console.log('\n🎯 FINAL VERDICT');
    console.log('================');
    
    if (results.summary.failed === 0) {
        console.log('🎉 ALL QA CHECKS PASSED!');
        console.log('✅ Ready for production deployment');
        console.log('✅ Ready for BaseScan submission');
        console.log('✅ Ready for wallet integrations');
        
        console.log('\n📋 IMMEDIATE NEXT STEPS:');
        console.log('1. Commit all files to GitHub');
        console.log('2. Get commit hash: git rev-parse HEAD');
        console.log('3. Replace "main" with commit hash in URLs');
        console.log('4. Submit to BaseScan using verified assets');
        
        return true;
    } else {
        console.log(`❌ ${results.summary.failed} QA checks failed`);
        console.log('🔧 Fix issues above before proceeding');
        return false;
    }
}

// Execute if run directly
if (require.main === module) {
    main()
        .then((success) => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('\n❌ QA verification failed:', error);
            process.exit(1);
        });
}

module.exports = { main };