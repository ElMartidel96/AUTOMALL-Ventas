const sharp = require('sharp');
const fs = require('fs');

async function createAdvancedSvg() {
  try {
    const inputPath = 'frontend/public/CGC-logo.png';
    const outputPath = 'public/metadata/cgc-logo-32-vectorized.svg';
    
    // Get the original image data
    const { data, info } = await sharp(inputPath)
      .resize(32, 32, { fit: 'contain' })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    console.log('Analyzing image colors and patterns...');
    
    // Analyze colors
    const colorMap = new Map();
    const width = info.width;
    const height = info.height;
    const channels = info.channels;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * channels;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const a = data[idx + 3];
        
        if (a > 128) { // Only non-transparent pixels
          const colorKey = `${Math.round(r/16)*16},${Math.round(g/16)*16},${Math.round(b/16)*16}`;
          if (!colorMap.has(colorKey)) {
            colorMap.set(colorKey, []);
          }
          colorMap.get(colorKey).push([x, y]);
        }
      }
    }
    
    console.log(`Found ${colorMap.size} distinct color regions`);
    
    // Create SVG with paths for each color region
    let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">\n`;
    
    // Sort colors by frequency to get major colors first
    const sortedColors = Array.from(colorMap.entries()).sort((a, b) => b[1].length - a[1].length);
    
    sortedColors.slice(0, 10).forEach(([color, pixels]) => {
      const [r, g, b] = color.split(',').map(Number);
      const hexColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
      
      if (pixels.length > 3) { // Only significant color areas
        // Create a simplified path for this color
        const rects = [];
        const visited = new Set();
        
        pixels.forEach(([x, y]) => {
          const key = `${x},${y}`;
          if (!visited.has(key)) {
            visited.add(key);
            rects.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="${hexColor}"/>`);
          }
        });
        
        svgContent += `  <!-- Color: ${hexColor} (${pixels.length} pixels) -->\n`;
        svgContent += `  ${rects.slice(0, Math.min(rects.length, 50)).join('\n  ')}\n`;
      }
    });
    
    svgContent += `</svg>`;
    
    fs.writeFileSync(outputPath, svgContent);
    console.log(`✅ Vectorized SVG created: ${outputPath}`);
    console.log(`📏 Size: ${Buffer.from(svgContent).length} bytes`);
    
    return outputPath;
    
  } catch (error) {
    console.error('Error creating vectorized SVG:', error);
    throw error;
  }
}

async function createPixelPerfectSvg() {
  try {
    const inputPath = 'frontend/public/CGC-logo.png';
    
    // Create a super high quality version first
    const hqBuffer = await sharp(inputPath)
      .resize(32, 32, { 
        fit: 'contain',
        kernel: 'lanczos3',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png({ 
        quality: 100, 
        compressionLevel: 0,
        adaptiveFiltering: false
      })
      .toBuffer();
    
    const base64 = hqBuffer.toString('base64');
    
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 32 32" width="32" height="32">
  <defs>
    <filter id="pixelPerfect" color-interpolation-filters="sRGB">
      <feComponentTransfer>
        <feFuncA type="discrete" tableValues="0 .2 .4 .6 .8 1"/>
      </feComponentTransfer>
    </filter>
  </defs>
  <image x="0" y="0" width="32" height="32" 
         image-rendering="pixelated" 
         image-rendering="crisp-edges" 
         image-rendering="optimizeQuality"
         filter="url(#pixelPerfect)"
         xlink:href="data:image/png;base64,${base64}" />
</svg>`;
    
    const outputPath = 'public/metadata/cgc-logo-32-perfect.svg';
    fs.writeFileSync(outputPath, svgContent);
    console.log(`✅ Pixel-perfect SVG created: ${outputPath}`);
    console.log(`📏 Size: ${Buffer.from(svgContent).length} bytes`);
    
    return outputPath;
    
  } catch (error) {
    console.error('Error creating pixel-perfect SVG:', error);
    throw error;
  }
}

async function main() {
  console.log('🔄 Creating advanced SVG conversions...');
  
  await createAdvancedSvg();
  await createPixelPerfectSvg();
  
  console.log('✅ Advanced conversion complete!');
}

main().catch(console.error);