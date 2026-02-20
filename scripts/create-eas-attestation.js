/**
 * @title EAS Official Token Metadata Attestation
 * @author CryptoGift DAO Team
 * @notice Create EAS attestation for official token metadata
 * @dev Provides public proof of official metadata URLs and checksums
 */

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// EAS Contracts on Base
const EAS_CONTRACT_ADDRESS = '0x4200000000000000000000000000000000000021';
const SCHEMA_REGISTRY_ADDRESS = '0x4200000000000000000000000000000000000020';

// Token metadata
const TOKEN_ADDRESS = '0x5e3a61b550328f3D8C44f60b3e10a49D3d806175';
const DEPLOYER_ADDRESS = '0xc655BF2Bd9AfA997c757Bef290A9Bb6ca41c5dE6';

/**
 * EAS Schema for Official Token Metadata V1
 */
const METADATA_SCHEMA = {
    name: "OfficialTokenMetadataV1",
    description: "Official token metadata attestation with asset verification",
    schema: "address token,uint256 chainId,string logoURI64,string logoURI256,string tokenlistURI,bytes32 sha256Logo64,bytes32 sha256Logo256,bytes32 sha256Tokenlist,address issuedBy,uint256 validUntil,string version",
    fields: [
        { name: "token", type: "address", description: "Token contract address" },
        { name: "chainId", type: "uint256", description: "Blockchain chain ID" },
        { name: "logoURI64", type: "string", description: "64x64 logo URL" },
        { name: "logoURI256", type: "string", description: "256x256 logo URL" },
        { name: "tokenlistURI", type: "string", description: "Token list URL" },
        { name: "sha256Logo64", type: "bytes32", description: "SHA256 of 64x64 logo" },
        { name: "sha256Logo256", type: "bytes32", description: "SHA256 of 256x256 logo" },
        { name: "sha256Tokenlist", type: "bytes32", description: "SHA256 of token list" },
        { name: "issuedBy", type: "address", description: "Issuer address (deployer)" },
        { name: "validUntil", type: "uint256", description: "Expiration timestamp (0 = no expiry)" },
        { name: "version", type: "string", description: "Metadata version" }
    ]
};

/**
 * Calculate file hash
 */
function calculateFileHash(filePath) {
    const content = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Generate attestation data
 */
function generateAttestationData(commitHash) {
    const baseUrl = `https://raw.githubusercontent.com/CryptoGift-Wallets-DAO/CryptoGift-Wallets-DAO/${commitHash}/public/metadata`;
    
    // Calculate file hashes
    const hash64 = calculateFileHash(path.join(__dirname, '../public/metadata/cgc-logo-64.png'));
    const hash256 = calculateFileHash(path.join(__dirname, '../public/metadata/cgc-logo-256.png'));
    const hashTokenlist = calculateFileHash(path.join(__dirname, '../public/metadata/cgc-tokenlist.json'));
    
    const attestationData = {
        token: TOKEN_ADDRESS,
        chainId: 8453,
        logoURI64: `${baseUrl}/cgc-logo-64.png`,
        logoURI256: `${baseUrl}/cgc-logo-256.png`,
        tokenlistURI: `${baseUrl}/cgc-tokenlist.json`,
        sha256Logo64: `0x${hash64}`,
        sha256Logo256: `0x${hash256}`,
        sha256Tokenlist: `0x${hashTokenlist}`,
        issuedBy: DEPLOYER_ADDRESS,
        validUntil: 0, // No expiry
        version: "1.0.0"
    };
    
    return attestationData;
}

/**
 * Encode attestation data
 */
function encodeAttestationData(data) {
    const types = [
        'address', // token
        'uint256', // chainId
        'string',  // logoURI64
        'string',  // logoURI256
        'string',  // tokenlistURI
        'bytes32', // sha256Logo64
        'bytes32', // sha256Logo256
        'bytes32', // sha256Tokenlist
        'address', // issuedBy
        'uint256', // validUntil
        'string'   // version
    ];
    
    const values = [
        data.token,
        data.chainId,
        data.logoURI64,
        data.logoURI256,
        data.tokenlistURI,
        data.sha256Logo64,
        data.sha256Logo256,
        data.sha256Tokenlist,
        data.issuedBy,
        data.validUntil,
        data.version
    ];
    
    return ethers.utils.defaultAbiCoder.encode(types, values);
}

/**
 * Create schema registration instruction
 */
function createSchemaRegistration() {
    console.log('📋 EAS SCHEMA REGISTRATION');
    console.log('==========================');
    console.log('\n1. Visit Schema Registry:');
    console.log(`   https://basescan.org/address/${SCHEMA_REGISTRY_ADDRESS}`);
    console.log('\n2. Call "register" function with:');
    console.log(`   schema: ${METADATA_SCHEMA.schema}`);
    console.log(`   resolver: 0x0000000000000000000000000000000000000000`);
    console.log(`   revocable: true`);
    console.log('\n3. Save the returned Schema UID');
    
    return METADATA_SCHEMA;
}

/**
 * Create attestation instruction
 */
function createAttestationInstruction(commitHash, schemaUid = "SCHEMA_UID_PLACEHOLDER") {
    const attestationData = generateAttestationData(commitHash);
    const encodedData = encodeAttestationData(attestationData);
    
    console.log('\n📝 EAS ATTESTATION CREATION');
    console.log('============================');
    console.log('\n1. Visit EAS Contract:');
    console.log(`   https://basescan.org/address/${EAS_CONTRACT_ADDRESS}`);
    console.log('\n2. Call "attest" function with:');
    console.log('   AttestationRequest {');
    console.log(`     schema: ${schemaUid}`);
    console.log(`     data: {`);
    console.log(`       recipient: ${TOKEN_ADDRESS}`);
    console.log(`       expirationTime: 0`);
    console.log(`       revocable: true`);
    console.log(`       refUID: 0x0000000000000000000000000000000000000000000000000000000000000000`);
    console.log(`       data: ${encodedData}`);
    console.log(`       value: 0`);
    console.log('     }');
    console.log('   }');
    
    console.log('\n📊 ATTESTATION DATA BREAKDOWN:');
    console.log('===============================');
    Object.entries(attestationData).forEach(([key, value]) => {
        console.log(`${key}: ${value}`);
    });
    
    return {
        schemaUid,
        attestationData,
        encodedData
    };
}

/**
 * Generate complete EAS guide
 */
function generateEASGuide(commitHash) {
    console.log('🔗 COMPLETE EAS ATTESTATION GUIDE');
    console.log('===================================\n');
    
    // 1. Schema registration
    const schema = createSchemaRegistration();
    
    // 2. Attestation creation
    const attestation = createAttestationInstruction(commitHash);
    
    // 3. Verification instructions
    console.log('\n🔍 VERIFICATION INSTRUCTIONS');
    console.log('=============================');
    console.log('After creating the attestation:');
    console.log('1. Save the attestation UID');
    console.log('2. Add UID to token list extensions.easAttestationUid');
    console.log('3. Update TOKEN_METADATA_IMPLEMENTATION.md with UID');
    console.log('4. Third parties can verify metadata authenticity using the UID');
    
    // 4. Generate verification script
    console.log('\n🔬 VERIFICATION SCRIPT EXAMPLE');
    console.log('===============================');
    console.log('```javascript');
    console.log('// Verify attestation and check asset hashes');
    console.log('const eas = new EAS(EAS_CONTRACT_ADDRESS);');
    console.log('const attestation = await eas.getAttestation(attestationUID);');
    console.log('const decoded = ethers.utils.defaultAbiCoder.decode([...], attestation.data);');
    console.log('// Compare decoded hashes with actual file hashes');
    console.log('```');
    
    // 5. Save guide
    const guide = {
        schema,
        attestation: {
            ...attestation,
            instructions: {
                schemaRegistry: SCHEMA_REGISTRY_ADDRESS,
                easContract: EAS_CONTRACT_ADDRESS,
                deployer: DEPLOYER_ADDRESS
            }
        },
        verification: {
            example: 'See console output above',
            requirements: [
                'Connect with deployer wallet',
                'Have sufficient ETH for gas',
                'Schema must be registered first',
                'Save all UIDs for future reference'
            ]
        }
    };
    
    const guidePath = path.join(__dirname, '../public/metadata/eas-attestation-guide.json');
    fs.writeFileSync(guidePath, JSON.stringify(guide, null, 2));
    console.log(`\n💾 EAS guide saved: ${guidePath}`);
    
    return guide;
}

/**
 * Main execution
 */
async function main() {
    console.log('🔐 EAS OFFICIAL TOKEN METADATA ATTESTATION');
    console.log('===========================================\n');
    
    const args = process.argv.slice(2);
    const commitHash = args[0] || 'COMMIT_HASH_PLACEHOLDER';
    
    if (commitHash === 'COMMIT_HASH_PLACEHOLDER') {
        console.log('⚠️  Usage: node create-eas-attestation.js <commit_hash>');
        console.log('Example: node create-eas-attestation.js abc123def456...');
        console.log('\nProceeding with placeholder for now...\n');
    }
    
    try {
        const guide = generateEASGuide(commitHash);
        
        console.log('\n✅ EAS ATTESTATION GUIDE GENERATED!');
        console.log('=====================================');
        console.log('\n📋 NEXT STEPS:');
        console.log('1. Get commit hash after pushing files');
        console.log('2. Re-run script with: node scripts/create-eas-attestation.js <commit_hash>');
        console.log('3. Register schema using generated instructions');
        console.log('4. Create attestation using generated data');
        console.log('5. Update token list with attestation UID');
        
        return guide;
        
    } catch (error) {
        console.error('\n❌ Failed to generate EAS guide:', error);
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

module.exports = { main, generateAttestationData, createSchemaRegistration };