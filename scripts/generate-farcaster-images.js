/**
 * Generate Farcaster Marketing Images
 *
 * Creates:
 * 1. Preview Image (1200x800) - For feed previews
 * 2. Hero Image (1200x630) - For app store banner
 * 3. OG Image (1200x630) - For social sharing
 *
 * Made by mbxarts.com The Moon in a Box property
 * Co-Author: Godez22
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Brand colors
const BRAND_BG = '#1a1a2e';
const BRAND_ACCENT = '#6366f1'; // Indigo accent

// Paths
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const LOGO_PATH = path.join(PUBLIC_DIR, 'farcaster-icon-1024.png');

// Text overlay as SVG (since sharp doesn't support text directly)
// NOTE: Avoid emojis in SVG text - they render as broken characters
// Height is set to fontSize + padding to avoid overlap issues
function createTextSVG(text, fontSize, color = '#ffffff') {
  const height = fontSize + 20; // Tight height around text
  return Buffer.from(`
    <svg width="1200" height="${height}">
      <text
        x="600"
        y="${height / 2}"
        font-family="Arial, Helvetica, sans-serif"
        font-size="${fontSize}"
        font-weight="bold"
        fill="${color}"
        text-anchor="middle"
        dominant-baseline="middle"
      >${text}</text>
    </svg>
  `);
}

async function generatePreviewImage() {
  console.log('📸 Generating Preview Image (1200x800)...');

  // Create background
  const background = await sharp({
    create: {
      width: 1200,
      height: 800,
      channels: 4,
      background: { r: 26, g: 26, b: 46, alpha: 1 } // #1a1a2e
    }
  }).png().toBuffer();

  // Resize logo to fit nicely (350px)
  const logo = await sharp(LOGO_PATH)
    .resize(350, 350, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  // Title SVG
  const titleSVG = createTextSVG('CryptoGift DAO', 64);

  // Tagline SVG (no emojis - they break in SVG)
  const taglineSVG = Buffer.from(`
    <svg width="1200" height="48">
      <text x="600" y="24" font-family="Arial, Helvetica, sans-serif" font-size="28" fill="#a5b4fc" text-anchor="middle" dominant-baseline="middle">Learn. Earn. Co-govern.</text>
    </svg>
  `);

  // Composite everything - Logo centered, text closer to logo with proper spacing
  // Preview: 1200x800
  // Logo: 350px at y=150 (ends at y=500)
  // Title: at y=530 (30px gap from logo)
  // Tagline: at y=620 (90px below title start, ~6px gap from title bottom)
  await sharp(background)
    .composite([
      { input: logo, top: 150, left: 425 },
      { input: titleSVG, top: 530, left: 0 },
      { input: taglineSVG, top: 620, left: 0 }
    ])
    .toFile(path.join(PUBLIC_DIR, 'farcaster-preview-1200x800.png'));

  console.log('✅ Preview Image created');
}

async function generateHeroImage() {
  console.log('🎨 Generating Hero Image (1200x630)...');

  // Create gradient-like background with solid color
  const background = await sharp({
    create: {
      width: 1200,
      height: 630,
      channels: 4,
      background: { r: 26, g: 26, b: 46, alpha: 1 }
    }
  }).png().toBuffer();

  // Resize logo (260px for hero - smaller to fit 630 height)
  const logo = await sharp(LOGO_PATH)
    .resize(260, 260, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  // Title
  const titleSVG = createTextSVG('CryptoGift DAO', 52);

  // Subtitle (no emojis - they break in SVG)
  const subtitleSVG = Buffer.from(`
    <svg width="1200" height="40">
      <text x="600" y="20" font-family="Arial, Helvetica, sans-serif" font-size="22" fill="#94a3b8" text-anchor="middle">Complete tasks - Earn CGC tokens - Join the DAO</text>
    </svg>
  `);

  // Base network badge (no emojis)
  const badgeSVG = Buffer.from(`
    <svg width="180" height="36">
      <rect x="0" y="0" width="180" height="36" rx="18" fill="#3b82f6"/>
      <text x="90" y="22" font-family="Arial, Helvetica, sans-serif" font-size="15" font-weight="bold" fill="#ffffff" text-anchor="middle">Built on Base</text>
    </svg>
  `);

  // Hero: 1200x630
  // Logo: 260px at y=80 (ends at y=340)
  // Title: at y=360 (20px gap from logo)
  // Subtitle: at y=440 (80px below title start)
  // Badge: at y=500 (60px below subtitle)
  await sharp(background)
    .composite([
      { input: logo, top: 80, left: 470 },
      { input: titleSVG, top: 360, left: 0 },
      { input: subtitleSVG, top: 440, left: 0 },
      { input: badgeSVG, top: 500, left: 510 }
    ])
    .toFile(path.join(PUBLIC_DIR, 'farcaster-hero-1200x630.png'));

  console.log('✅ Hero Image created');
}

async function generateOGImage() {
  console.log('🌐 Generating OG Image (1200x630)...');

  // Similar to hero but optimized for social sharing
  const background = await sharp({
    create: {
      width: 1200,
      height: 630,
      channels: 4,
      background: { r: 26, g: 26, b: 46, alpha: 1 }
    }
  }).png().toBuffer();

  // Logo for social (280px)
  const logo = await sharp(LOGO_PATH)
    .resize(280, 280, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  // Big title for social
  const titleSVG = createTextSVG('CryptoGift DAO', 64);

  // Call to action (no emojis - they break in SVG)
  const ctaSVG = Buffer.from(`
    <svg width="1200" height="44">
      <text x="600" y="22" font-family="Arial, Helvetica, sans-serif" font-size="26" fill="#a5b4fc" text-anchor="middle">Earn CGC by completing tasks</text>
    </svg>
  `);

  // OG: 1200x630
  // Logo: 280px at y=80 (ends at y=360)
  // Title: at y=380 (20px gap from logo)
  // CTA: at y=470 (90px below title start)
  await sharp(background)
    .composite([
      { input: logo, top: 80, left: 460 },
      { input: titleSVG, top: 380, left: 0 },
      { input: ctaSVG, top: 470, left: 0 }
    ])
    .toFile(path.join(PUBLIC_DIR, 'farcaster-og-1200x630.png'));

  console.log('✅ OG Image created');
}

async function main() {
  console.log('\n🚀 Generating Farcaster Marketing Images\n');
  console.log('Brand Background: ' + BRAND_BG);
  console.log('Logo Source: ' + LOGO_PATH);
  console.log('');

  // Verify logo exists
  if (!fs.existsSync(LOGO_PATH)) {
    console.error('❌ Logo not found at:', LOGO_PATH);
    process.exit(1);
  }

  try {
    await generatePreviewImage();
    await generateHeroImage();
    await generateOGImage();

    console.log('\n✨ All images generated successfully!\n');
    console.log('Output files:');
    console.log('  📸 public/farcaster-preview-1200x800.png (Preview Image)');
    console.log('  🎨 public/farcaster-hero-1200x630.png (Hero Image)');
    console.log('  🌐 public/farcaster-og-1200x630.png (OG/Social Image)');
    console.log('\n📝 Remember to add these to .vercelignore whitelist!');
  } catch (error) {
    console.error('❌ Error generating images:', error);
    process.exit(1);
  }
}

main();
