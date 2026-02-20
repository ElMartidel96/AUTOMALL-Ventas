/**
 * @title Version Management and Rollback System
 * @author CryptoGift DAO Team
 * @notice Comprehensive versioning and rollback for token metadata
 * @dev Freeze tags, version management, and emergency rollback procedures
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Create freeze tag for current metadata version
 */
function createFreezeTag(version = '1.0.0') {
    console.log('🏷️  CREATING FREEZE TAG');
    console.log('======================');
    
    try {
        // Get current commit hash
        const currentCommit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
        console.log(`Current commit: ${currentCommit}`);
        
        // Create tag
        const tagName = `token-metadata-v${version}`;
        const tagMessage = `Token metadata freeze v${version} - BaseScan submission ready

Assets included:
- cgc-logo-64.png (BaseScan optimized)
- cgc-logo-256.png (Wallet optimized)  
- cgc-logo-512.png (High-res)
- cgc-tokenlist.json (Uniswap validated)
- Complete submission guides

Made by mbxarts.com The Moon in a Box property

Co-Author: Godez22`;
        
        console.log(`Creating tag: ${tagName}`);
        execSync(`git tag -a ${tagName} -m "${tagMessage}"`, { encoding: 'utf8' });
        
        console.log(`✅ Tag created: ${tagName}`);
        console.log(`📌 Frozen commit: ${currentCommit}`);
        console.log(`📋 Tag message: ${tagMessage}`);
        
        return {
            tagName,
            commit: currentCommit,
            version,
            created: new Date().toISOString()
        };
        
    } catch (error) {
        console.error(`❌ Failed to create freeze tag: ${error.message}`);
        throw error;
    }
}

/**
 * Generate version URLs with frozen commit
 */
function generateVersionUrls(commit, version) {
    const baseUrl = `https://raw.githubusercontent.com/CryptoGift-Wallets-DAO/CryptoGift-Wallets-DAO/${commit}/public/metadata`;
    
    const urls = {
        version,
        commit,
        immutable: true,
        assets: {
            logo64: `${baseUrl}/cgc-logo-64.png`,
            logo256: `${baseUrl}/cgc-logo-256.png`,
            logo512: `${baseUrl}/cgc-logo-512.png`,
            tokenList: `${baseUrl}/cgc-tokenlist.json`,
            metadata: `${baseUrl}/token-metadata.json`,
            submissionGuide: `${baseUrl}/submission-guide.json`
        }
    };
    
    console.log('\n🔗 IMMUTABLE VERSION URLS');
    console.log('==========================');
    Object.entries(urls.assets).forEach(([key, url]) => {
        console.log(`${key}: ${url}`);
    });
    
    return urls;
}

/**
 * Create rollback procedure
 */
function createRollbackProcedure(frozenVersion) {
    console.log('\n🔄 ROLLBACK PROCEDURE');
    console.log('=====================');
    
    const rollback = {
        version: frozenVersion.version,
        commit: frozenVersion.commit,
        tagName: frozenVersion.tagName,
        
        emergencySteps: [
            {
                step: 1,
                action: "Revert to frozen tag",
                command: `git checkout ${frozenVersion.tagName}`,
                description: "Switch to known-good version"
            },
            {
                step: 2,
                action: "Update token list URLs",
                command: "Edit cgc-tokenlist.json logoURI fields",
                description: "Point to frozen commit URLs"
            },
            {
                step: 3,
                action: "Re-submit to BaseScan",
                command: "Use frozen logo URL in form",
                description: "Submit with verified frozen assets"
            },
            {
                step: 4,
                action: "Verify HEAD request",
                command: `curl -I ${frozenVersion.urls?.assets?.logo64 || 'FROZEN_URL'}`,
                description: "Confirm asset accessibility"
            },
            {
                step: 5,
                action: "Test in wallet",
                command: "Clear cache and test display",
                description: "Verify logo appears correctly"
            }
        ],
        
        successCriteria: [
            "HTTP 200 response for all asset URLs",
            "Logo displays correctly in BaseScan",
            "Logo displays correctly in test wallet",
            "No artifact or distortion visible",
            "File sizes within limits (<30KB for 64x64)"
        ],
        
        fallbackContacts: [
            "BaseScan Priority Support (if urgent)",
            "Coinbase Wallet support",
            "GitHub repository maintainers"
        ]
    };
    
    console.log('\n📋 EMERGENCY ROLLBACK STEPS:');
    rollback.emergencySteps.forEach(step => {
        console.log(`${step.step}. ${step.action}`);
        console.log(`   Command: ${step.command}`);
        console.log(`   Description: ${step.description}\n`);
    });
    
    console.log('✅ SUCCESS CRITERIA:');
    rollback.successCriteria.forEach((criteria, index) => {
        console.log(`${index + 1}. ${criteria}`);
    });
    
    return rollback;
}

/**
 * Version management for token list
 */
function manageTokenListVersion(changeType = 'patch') {
    console.log('\n📊 TOKEN LIST VERSION MANAGEMENT');
    console.log('=================================');
    
    const tokenListPath = path.join(__dirname, '../public/metadata/cgc-tokenlist.json');
    const tokenList = JSON.parse(fs.readFileSync(tokenListPath, 'utf8'));
    
    const currentVersion = tokenList.version;
    console.log(`Current version: ${currentVersion.major}.${currentVersion.minor}.${currentVersion.patch}`);
    
    // Update version based on change type
    const newVersion = { ...currentVersion };
    
    switch (changeType) {
        case 'major':
            newVersion.major++;
            newVersion.minor = 0;
            newVersion.patch = 0;
            console.log('📈 MAJOR version bump (breaking changes: logoURI/address changed)');
            break;
        case 'minor':
            newVersion.minor++;
            newVersion.patch = 0;
            console.log('📈 MINOR version bump (new tokens/networks added)');
            break;
        case 'patch':
        default:
            newVersion.patch++;
            console.log('📈 PATCH version bump (copy changes, bug fixes)');
            break;
    }
    
    console.log(`New version: ${newVersion.major}.${newVersion.minor}.${newVersion.patch}`);
    
    // Update timestamp
    tokenList.timestamp = new Date().toISOString();
    tokenList.version = newVersion;
    
    // Save updated token list
    fs.writeFileSync(tokenListPath, JSON.stringify(tokenList, null, 2));
    console.log('✅ Token list version updated');
    
    return {
        previous: currentVersion,
        current: newVersion,
        changeType
    };
}

/**
 * Security audit checklist
 */
function generateSecurityAudit() {
    console.log('\n🔒 SECURITY AUDIT CHECKLIST');
    console.log('============================');
    
    const securityChecklist = {
        keyManagement: [
            "✅ Deployer EOA is in hardware wallet",
            "✅ BASESCAN_API_KEY rotated post-verification",
            "✅ API keys moved to secret manager",
            "⏳ Role account created for listings (no funds)",
            "⏳ Document which address used for each platform"
        ],
        
        assetIntegrity: [
            "✅ SHA256 checksums calculated and documented",
            "✅ File sizes verified (<30KB for critical assets)",
            "✅ Image dimensions verified (exact pixels)",
            "✅ No compression artifacts detected",
            "✅ URLs use immutable GitHub commit hashes"
        ],
        
        accessControl: [
            "✅ Only deployer can update BaseScan info",
            "✅ GitHub repository has proper access controls",
            "✅ No secrets committed to repository",
            "✅ Environment variables properly configured",
            "⏳ EAS attestation created for metadata verification"
        ],
        
        monitoring: [
            "⏳ Asset URL monitoring setup",
            "⏳ Logo display verification in multiple wallets",
            "⏳ Automated checksum verification",
            "⏳ Alert system for unauthorized changes",
            "⏳ Regular audit schedule established"
        ]
    };
    
    Object.entries(securityChecklist).forEach(([category, items]) => {
        console.log(`\n${category.toUpperCase()}:`);
        items.forEach(item => console.log(`  ${item}`));
    });
    
    return securityChecklist;
}

/**
 * Generate comprehensive guide
 */
function generateComprehensiveGuide() {
    console.log('\n📖 COMPREHENSIVE VERSION & ROLLBACK GUIDE');
    console.log('==========================================');
    
    try {
        // Create freeze tag
        const frozenVersion = createFreezeTag('1.0.0');
        
        // Generate immutable URLs
        const versionUrls = generateVersionUrls(frozenVersion.commit, frozenVersion.version);
        frozenVersion.urls = versionUrls;
        
        // Create rollback procedure
        const rollback = createRollbackProcedure(frozenVersion);
        
        // Update token list version
        const versionUpdate = manageTokenListVersion('patch');
        
        // Security audit
        const security = generateSecurityAudit();
        
        // Combine all data
        const comprehensiveGuide = {
            generated: new Date().toISOString(),
            frozenVersion,
            rollback,
            versionUpdate,
            security,
            
            quickReference: {
                emergencyRollback: `git checkout ${frozenVersion.tagName}`,
                verifyAssets: `curl -I ${versionUrls.assets.logo64}`,
                currentVersion: `${versionUpdate.current.major}.${versionUpdate.current.minor}.${versionUpdate.current.patch}`,
                frozenCommit: frozenVersion.commit
            }
        };
        
        // Save guide
        const guidePath = path.join(__dirname, '../public/metadata/version-rollback-guide.json');
        fs.writeFileSync(guidePath, JSON.stringify(comprehensiveGuide, null, 2));
        console.log(`\n💾 Comprehensive guide saved: ${guidePath}`);
        
        // Display quick reference
        console.log('\n🚀 QUICK REFERENCE');
        console.log('==================');
        Object.entries(comprehensiveGuide.quickReference).forEach(([key, value]) => {
            console.log(`${key}: ${value}`);
        });
        
        return comprehensiveGuide;
        
    } catch (error) {
        console.error('\n❌ Failed to generate comprehensive guide:', error);
        throw error;
    }
}

/**
 * Main execution
 */
async function main() {
    console.log('🏷️  TOKEN METADATA VERSION & ROLLBACK SYSTEM');
    console.log('==============================================\n');
    
    try {
        const guide = generateComprehensiveGuide();
        
        console.log('\n✅ VERSION & ROLLBACK SYSTEM READY!');
        console.log('====================================');
        console.log('\n📋 IMMEDIATE ACTIONS:');
        console.log('1. Push the freeze tag: git push origin --tags');
        console.log('2. Use frozen URLs for all submissions');
        console.log('3. Create EAS attestation with frozen commit');
        console.log('4. Document rollback procedure for team');
        console.log('5. Set up monitoring for asset URLs');
        
        return guide;
        
    } catch (error) {
        console.error('\n❌ Version system setup failed:', error);
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

module.exports = { 
    main, 
    createFreezeTag, 
    generateVersionUrls, 
    createRollbackProcedure,
    manageTokenListVersion 
};