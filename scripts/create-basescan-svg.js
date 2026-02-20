const sharp = require('sharp');
const fs = require('fs');

async function createBaseScanOptimizedSvg() {
  try {
    const inputPath = 'frontend/public/CGC-logo.png';
    const outputPath = 'public/metadata/cgc-logo-32-basescan.svg';
    
    console.log('🔄 Creating BaseScan optimized SVG...');
    
    // Create a super clean 32x32 PNG first
    const optimizedPng = await sharp(inputPath)
      .resize(32, 32, { 
        fit: 'contain',
        kernel: 'lanczos3',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png({ 
        quality: 100, 
        compressionLevel: 0,
        palette: false,
        effort: 10
      })
      .toBuffer();
    
    const base64 = optimizedPng.toString('base64');
    
    // Create SVG with maximum compatibility for BaseScan
    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
     viewBox="0 0 32 32" width="32" height="32"
     preserveAspectRatio="xMidYMid meet">
  <title>CGC Token Logo</title>
  <desc>CryptoGift Coin official logo</desc>
  <image x="0" y="0" width="32" height="32" 
         preserveAspectRatio="xMidYMid meet"
         image-rendering="optimizeQuality"
         xlink:href="data:image/png;base64,${base64}" />
</svg>`;
    
    fs.writeFileSync(outputPath, svgContent);
    
    console.log(`✅ BaseScan SVG created: ${outputPath}`);
    console.log(`📏 Size: ${Buffer.from(svgContent).length} bytes`);
    
    // Also create a fallback version without XML declaration
    const svgContentSimple = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 32 32" width="32" height="32">
  <image x="0" y="0" width="32" height="32" xlink:href="data:image/png;base64,${base64}"/>
</svg>`;
    
    const outputPathSimple = 'public/metadata/cgc-logo-32-simple.svg';
    fs.writeFileSync(outputPathSimple, svgContentSimple);
    console.log(`✅ Simple SVG created: ${outputPathSimple}`);
    console.log(`📏 Size: ${Buffer.from(svgContentSimple).length} bytes`);
    
    return [outputPath, outputPathSimple];
    
  } catch (error) {
    console.error('Error creating BaseScan SVG:', error);
    throw error;
  }
}

async function createStandalonePNG() {
  try {
    const inputPath = 'frontend/public/CGC-logo.png';
    const outputPath = 'public/metadata/cgc-logo-32-standalone.png';
    
    console.log('🔄 Creating standalone 32x32 PNG as backup...');
    
    await sharp(inputPath)
      .resize(32, 32, { 
        fit: 'contain',
        kernel: 'lanczos3',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png({ 
        quality: 100, 
        compressionLevel: 0
      })
      .toFile(outputPath);
    
    console.log(`✅ Standalone PNG created: ${outputPath}`);
    
    return outputPath;
    
  } catch (error) {
    console.error('Error creating standalone PNG:', error);
    throw error;
  }
}

async function main() {
  console.log('🚀 Creating BaseScan optimized files...');
  
  await createBaseScanOptimizedSvg();
  await createStandalonePNG();
  
  console.log('✅ All BaseScan files created!');
}

main().catch(console.error);