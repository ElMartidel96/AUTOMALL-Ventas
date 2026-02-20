const sharp = require('sharp');
const fs = require('fs');

async function convertPngToSvg() {
  try {
    // Read the original PNG
    const inputPath = 'frontend/public/CGC-logo.png';
    const outputPath = 'public/metadata/cgc-logo-32-original.svg';
    
    // First, let's get the image as a buffer and analyze it
    const imageBuffer = await sharp(inputPath)
      .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    
    // Get image metadata
    const metadata = await sharp(imageBuffer).metadata();
    console.log('Image metadata:', metadata);
    
    // Convert to base64 for embedding in SVG
    const base64 = imageBuffer.toString('base64');
    
    // Create SVG with embedded PNG
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 32 32" width="32" height="32">
  <image x="0" y="0" width="32" height="32" xlink:href="data:image/png;base64,${base64}" />
</svg>`;
    
    fs.writeFileSync(outputPath, svgContent);
    console.log(`✅ SVG created: ${outputPath}`);
    console.log(`📏 Size: ${Buffer.from(svgContent).length} bytes`);
    
    return outputPath;
    
  } catch (error) {
    console.error('Error converting PNG to SVG:', error);
    throw error;
  }
}

// Also create a traced version using a simple color quantization approach
async function createTracedSvg() {
  try {
    const inputPath = 'frontend/public/CGC-logo.png';
    const outputPath = 'public/metadata/cgc-logo-32-traced.svg';
    
    // Process image to get key colors
    const { data, info } = await sharp(inputPath)
      .resize(32, 32, { fit: 'contain' })
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    console.log('Processing image data for color analysis...');
    
    // Simple approach: create SVG with the original as embedded image but optimized
    const optimizedBuffer = await sharp(inputPath)
      .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ quality: 100, compressionLevel: 9 })
      .toBuffer();
    
    const base64 = optimizedBuffer.toString('base64');
    
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 32 32" width="32" height="32">
  <defs>
    <filter id="crisp">
      <feComponentTransfer>
        <feFuncA type="discrete" tableValues="0 1"/>
      </feComponentTransfer>
    </filter>
  </defs>
  <image x="0" y="0" width="32" height="32" filter="url(#crisp)" xlink:href="data:image/png;base64,${base64}" />
</svg>`;
    
    fs.writeFileSync(outputPath, svgContent);
    console.log(`✅ Traced SVG created: ${outputPath}`);
    
    return outputPath;
    
  } catch (error) {
    console.error('Error creating traced SVG:', error);
    throw error;
  }
}

async function main() {
  console.log('🔄 Converting PNG to SVG formats...');
  
  await convertPngToSvg();
  await createTracedSvg();
  
  console.log('✅ Conversion complete!');
}

main().catch(console.error);