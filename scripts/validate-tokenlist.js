/**
 * @title Token List Validator
 * @author CryptoGift DAO Team
 * @notice Validate token list JSON against Uniswap schema
 * @dev Ensures token list meets all standards for compatibility
 */

const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');

const TOKENLIST_PATH = path.join(__dirname, '../public/metadata/cgc-tokenlist.json');
const SCHEMA_PATH = path.join(__dirname, '../node_modules/@uniswap/token-lists/src/tokenlist.schema.json');

/**
 * Load and parse JSON files
 */
function loadJSON(filePath, description) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(content);
    } catch (error) {
        throw new Error(`Failed to load ${description}: ${error.message}`);
    }
}

/**
 * Validate addresses are checksummed (EIP-55)
 */
function validateAddressChecksum(tokenList) {
    const errors = [];
    
    tokenList.tokens.forEach((token, index) => {
        try {
            const checksummed = ethers.utils.getAddress(token.address);
            if (token.address !== checksummed) {
                errors.push(`Token ${index}: address "${token.address}" should be checksummed as "${checksummed}"`);
            }
        } catch (error) {
            errors.push(`Token ${index}: invalid address "${token.address}"`);
        }
    });
    
    return errors;
}

/**
 * Validate token list using Uniswap schema
 */
function validateTokenList() {
    console.log('🔍 Validating CryptoGift DAO Token List');
    console.log('=======================================\n');
    
    // Load files
    console.log('📄 Loading token list...');
    const tokenList = loadJSON(TOKENLIST_PATH, 'token list');
    console.log(`✅ Token list loaded (${tokenList.tokens.length} tokens)`);
    
    console.log('📄 Loading Uniswap schema...');
    const schema = loadJSON(SCHEMA_PATH, 'Uniswap token list schema');
    console.log('✅ Schema loaded');
    
    // Setup AJV validator
    const ajv = new Ajv({ allErrors: true, verbose: true });
    addFormats(ajv);
    
    console.log('\n🔍 Running schema validation...');
    const validate = ajv.compile(schema);
    const isValid = validate(tokenList);
    
    if (isValid) {
        console.log('✅ Schema validation passed!');
    } else {
        console.log('❌ Schema validation failed:');
        validate.errors.forEach((error, index) => {
            console.log(`  ${index + 1}. ${error.instancePath || '/'}: ${error.message}`);
            if (error.data !== undefined) {
                console.log(`     Data: ${JSON.stringify(error.data)}`);
            }
        });
    }
    
    // Validate address checksums
    console.log('\n🔍 Validating address checksums...');
    const checksumErrors = validateAddressChecksum(tokenList);
    
    if (checksumErrors.length === 0) {
        console.log('✅ All addresses properly checksummed');
    } else {
        console.log('❌ Address checksum errors:');
        checksumErrors.forEach((error, index) => {
            console.log(`  ${index + 1}. ${error}`);
        });
    }
    
    // Additional validations
    console.log('\n🔍 Additional validations...');
    
    const additionalErrors = [];
    
    // Check chain ID
    tokenList.tokens.forEach((token, index) => {
        if (token.chainId !== 8453) {
            additionalErrors.push(`Token ${index}: expected chainId 8453 (Base), got ${token.chainId}`);
        }
        
        // Check decimals
        if (typeof token.decimals !== 'number' || token.decimals < 0 || token.decimals > 18) {
            additionalErrors.push(`Token ${index}: decimals must be a number between 0-18`);
        }
        
        // Check logoURI format
        if (token.logoURI && !token.logoURI.startsWith('https://')) {
            additionalErrors.push(`Token ${index}: logoURI must use HTTPS`);
        }
    });
    
    if (additionalErrors.length === 0) {
        console.log('✅ Additional validations passed');
    } else {
        console.log('❌ Additional validation errors:');
        additionalErrors.forEach((error, index) => {
            console.log(`  ${index + 1}. ${error}`);
        });
    }
    
    // Summary
    const totalErrors = (validate.errors?.length || 0) + checksumErrors.length + additionalErrors.length;
    
    console.log('\n📊 VALIDATION SUMMARY');
    console.log('=====================');
    console.log(`Schema validation: ${isValid ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Address checksums: ${checksumErrors.length === 0 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Additional checks: ${additionalErrors.length === 0 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Total errors: ${totalErrors}`);
    
    if (totalErrors === 0) {
        console.log('\n🎉 TOKEN LIST IS FULLY VALID!');
        console.log('✅ Ready for deployment and submission to aggregators');
        
        // Display token info
        console.log('\n📋 TOKEN LIST INFO');
        console.log('==================');
        console.log(`Name: ${tokenList.name}`);
        console.log(`Version: ${tokenList.version.major}.${tokenList.version.minor}.${tokenList.version.patch}`);
        console.log(`Tokens: ${tokenList.tokens.length}`);
        console.log(`Keywords: ${tokenList.keywords.join(', ')}`);
        
        tokenList.tokens.forEach((token, index) => {
            console.log(`\nToken ${index + 1}:`);
            console.log(`  Name: ${token.name} (${token.symbol})`);
            console.log(`  Address: ${token.address}`);
            console.log(`  Chain: ${token.chainId} (Base)`);
            console.log(`  Decimals: ${token.decimals}`);
            console.log(`  Logo: ${token.logoURI || 'Not set'}`);
            console.log(`  Tags: ${token.tags.join(', ')}`);
        });
        
        // Deployment URLs
        console.log('\n🔗 DEPLOYMENT URLS');
        console.log('==================');
        console.log('After committing to GitHub, your token list will be available at:');
        console.log(`📄 GitHub: https://raw.githubusercontent.com/CryptoGift-Wallets-DAO/CryptoGift-Wallets-DAO/main/public/metadata/cgc-tokenlist.json`);
        console.log(`📄 Vercel: https://crypto-gift-wallets-dao.vercel.app/metadata/cgc-tokenlist.json`);
        
        return true;
        
    } else {
        console.log('\n❌ TOKEN LIST HAS ERRORS');
        console.log('Please fix the issues above before deployment');
        return false;
    }
}

/**
 * Fix common issues automatically
 */
function fixTokenList() {
    console.log('\n🔧 ATTEMPTING AUTOMATIC FIXES');
    console.log('==============================');
    
    const tokenList = loadJSON(TOKENLIST_PATH, 'token list');
    let modified = false;
    
    // Fix address checksums
    tokenList.tokens.forEach((token, index) => {
        try {
            const checksummed = ethers.utils.getAddress(token.address);
            if (token.address !== checksummed) {
                console.log(`🔧 Fixing address checksum for token ${index}: ${token.address} → ${checksummed}`);
                token.address = checksummed;
                modified = true;
            }
        } catch (error) {
            console.log(`❌ Cannot fix invalid address for token ${index}: ${token.address}`);
        }
    });
    
    // Update timestamp to current time
    const currentTimestamp = new Date().toISOString();
    if (tokenList.timestamp !== currentTimestamp) {
        console.log(`🔧 Updating timestamp: ${tokenList.timestamp} → ${currentTimestamp}`);
        tokenList.timestamp = currentTimestamp;
        modified = true;
    }
    
    if (modified) {
        const updatedContent = JSON.stringify(tokenList, null, 2);
        fs.writeFileSync(TOKENLIST_PATH, updatedContent);
        console.log('✅ Token list updated with fixes');
    } else {
        console.log('✅ No fixes needed');
    }
    
    return modified;
}

/**
 * Main execution
 */
async function main() {
    try {
        // First, try to fix common issues
        const wasFixed = fixTokenList();
        
        // Then validate
        const isValid = validateTokenList();
        
        if (!isValid) {
            process.exit(1);
        }
        
        console.log('\n📋 NEXT STEPS:');
        console.log('1. Commit the token list to GitHub');
        console.log('2. Update any hardcoded URLs with the commit hash');
        console.log('3. Submit to Uniswap, 1inch, and other token list aggregators');
        console.log('4. Add token list URL to your dApp configuration');
        
        return true;
        
    } catch (error) {
        console.error('\n❌ Validation failed:', error.message);
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

module.exports = { validateTokenList, fixTokenList };