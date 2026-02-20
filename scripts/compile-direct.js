#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const contractsDir = path.join(__dirname, '../contracts');
const artifactsDir = path.join(__dirname, '../artifacts');

// Create artifacts directory
if (!fs.existsSync(artifactsDir)) {
  fs.mkdirSync(artifactsDir, { recursive: true });
}

console.log('🔨 Compiling contracts with solc...');

// Prepare the combined source file for solc
const sources = {};

// Read all contract files
function readContract(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relativePath = path.relative(contractsDir, filePath).replace(/\\/g, '/');
  sources[relativePath] = content;
  
  // Replace imports with actual content for OpenZeppelin
  const processedContent = content.replace(
    /@openzeppelin\/contracts\//g,
    path.join(__dirname, '../node_modules/@openzeppelin/contracts/').replace(/\\/g, '/') + '/'
  );
  
  return processedContent;
}

// Read all contracts
const cgcToken = readContract(path.join(contractsDir, 'CGCToken.sol'));
const vault = readContract(path.join(contractsDir, 'GovTokenVault.sol'));
const condition = readContract(path.join(contractsDir, 'conditions/AllowedSignersCondition.sol'));
const merkle = readContract(path.join(contractsDir, 'MerklePayouts.sol'));

// Create a simple compilation script
const compilationScript = `
// CGCToken
${cgcToken}

// GovTokenVault
${vault}

// AllowedSignersCondition
${condition}

// MerklePayouts
${merkle}
`;

// Write to temp file
const tempFile = path.join(__dirname, '../temp-compile.sol');
fs.writeFileSync(tempFile, compilationScript);

try {
  // Compile with solc
  const output = execSync(`solcjs --bin --abi --optimize ${tempFile}`, {
    cwd: path.dirname(tempFile)
  });
  
  console.log('✅ Compilation successful!');
  
  // Move artifacts to correct location
  const files = fs.readdirSync(path.dirname(tempFile));
  files.forEach(file => {
    if (file.endsWith('.bin') || file.endsWith('.abi')) {
      fs.renameSync(
        path.join(path.dirname(tempFile), file),
        path.join(artifactsDir, file)
      );
    }
  });
  
  // Clean up
  fs.unlinkSync(tempFile);
  
  console.log('📦 Artifacts saved to:', artifactsDir);
} catch (error) {
  console.error('❌ Compilation failed:', error.message);
  process.exit(1);
}