/**
 * Generate Farcaster Screenshot Mockups
 *
 * Creates 3 realistic UI mockups for Warpcast manifest:
 * 1. Dashboard - User profile + 6 metrics + CTA
 * 2. Tasks - List of available tasks with rewards
 * 3. Referrals - Code, stats, sharing options
 *
 * Dimensions: 1284x2778 (iPhone Pro Max)
 *
 * Made by mbxarts.com The Moon in a Box property
 * Co-Author: Godez22
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Constants
const WIDTH = 1284;
const HEIGHT = 2778;
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// Brand colors
const COLORS = {
  bg: '#0f0f1a',
  bgCard: '#1a1a2e',
  bgCardHover: '#252542',
  purple: '#8b5cf6',
  purpleLight: '#a78bfa',
  blue: '#3b82f6',
  blueLight: '#60a5fa',
  green: '#22c55e',
  yellow: '#eab308',
  orange: '#f97316',
  red: '#ef4444',
  cyan: '#06b6d4',
  white: '#ffffff',
  gray100: '#f3f4f6',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
};

// Helper: Create rounded rect
function roundedRect(x, y, w, h, r, fill, stroke = null, strokeWidth = 0) {
  let svg = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}"`;
  if (stroke) svg += ` stroke="${stroke}" stroke-width="${strokeWidth}"`;
  svg += '/>';
  return svg;
}

// Helper: Create text
function text(content, x, y, size, color, weight = 'normal', anchor = 'start') {
  return `<text x="${x}" y="${y}" font-family="Inter, -apple-system, BlinkMacSystemFont, sans-serif" font-size="${size}" font-weight="${weight}" fill="${color}" text-anchor="${anchor}">${escapeXml(content)}</text>`;
}

// Helper: Escape XML entities
function escapeXml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Helper: Create circle
function circle(cx, cy, r, fill) {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>`;
}

// Helper: Gradient definition
function gradientDef(id, color1, color2, vertical = false) {
  const x2 = vertical ? '0%' : '100%';
  const y2 = vertical ? '100%' : '0%';
  return `<linearGradient id="${id}" x1="0%" y1="0%" x2="${x2}" y2="${y2}">
    <stop offset="0%" stop-color="${color1}"/>
    <stop offset="100%" stop-color="${color2}"/>
  </linearGradient>`;
}

// Create status bar (iPhone style)
function createStatusBar() {
  return `
    <!-- Status Bar -->
    <rect x="0" y="0" width="${WIDTH}" height="94" fill="${COLORS.bg}"/>
    ${text('4:20', 60, 62, 34, COLORS.white, '600')}
    <!-- Signal bars -->
    <rect x="1050" y="42" width="6" height="12" rx="1" fill="${COLORS.white}"/>
    <rect x="1060" y="38" width="6" height="16" rx="1" fill="${COLORS.white}"/>
    <rect x="1070" y="34" width="6" height="20" rx="1" fill="${COLORS.white}"/>
    <rect x="1080" y="30" width="6" height="24" rx="1" fill="${COLORS.white}"/>
    <!-- Battery -->
    <rect x="1140" y="36" width="50" height="22" rx="6" stroke="${COLORS.white}" stroke-width="2" fill="none"/>
    <rect x="1144" y="40" width="38" height="14" rx="3" fill="${COLORS.green}"/>
    <rect x="1190" y="42" width="4" height="10" rx="2" fill="${COLORS.white}"/>
  `;
}

// Create app header
function createHeader(activeTab = 'panel') {
  return `
    <!-- Header -->
    <rect x="0" y="94" width="${WIDTH}" height="100" fill="${COLORS.bgCard}"/>
    <rect x="0" y="193" width="${WIDTH}" height="1" fill="${COLORS.gray700}"/>
    <!-- Logo placeholder -->
    ${circle(WIDTH/2 - 80, 144, 24, COLORS.purple)}
    ${text('C', WIDTH/2 - 80, 152, 28, COLORS.white, 'bold', 'middle')}
    ${text('CryptoGift DAO', WIDTH/2 + 30, 154, 36, COLORS.white, '600', 'middle')}
  `;
}

// Create bottom navigation
function createBottomNav(activeTab = 'panel') {
  const navY = HEIGHT - 180;
  const tabWidth = WIDTH / 3;

  const tabs = [
    { id: 'panel', label: 'Panel', icon: 'grid' },
    { id: 'tareas', label: 'Tareas', icon: 'list' },
    { id: 'referidos', label: 'Referidos', icon: 'users' },
  ];

  let svg = `
    <!-- Bottom Nav Background -->
    <rect x="0" y="${navY}" width="${WIDTH}" height="180" fill="${COLORS.bgCard}"/>
    <rect x="0" y="${navY}" width="${WIDTH}" height="1" fill="${COLORS.gray700}"/>
  `;

  tabs.forEach((tab, i) => {
    const x = i * tabWidth + tabWidth / 2;
    const isActive = tab.id === activeTab;
    const color = isActive ? COLORS.purple : COLORS.gray500;

    // Active background
    if (isActive) {
      svg += roundedRect(x - 70, navY + 20, 140, 100, 20, COLORS.purple + '20');
    }

    // Icon placeholder (simplified)
    if (tab.icon === 'grid') {
      svg += `
        <rect x="${x-24}" y="${navY + 40}" width="20" height="20" rx="4" fill="${color}"/>
        <rect x="${x+4}" y="${navY + 40}" width="20" height="20" rx="4" fill="${color}"/>
        <rect x="${x-24}" y="${navY + 64}" width="20" height="20" rx="4" fill="${color}"/>
        <rect x="${x+4}" y="${navY + 64}" width="20" height="20" rx="4" fill="${color}"/>
      `;
    } else if (tab.icon === 'list') {
      svg += `
        <rect x="${x-20}" y="${navY + 42}" width="40" height="6" rx="3" fill="${color}"/>
        <rect x="${x-20}" y="${navY + 56}" width="30" height="6" rx="3" fill="${color}"/>
        <rect x="${x-20}" y="${navY + 70}" width="35" height="6" rx="3" fill="${color}"/>
      `;
    } else if (tab.icon === 'users') {
      svg += circle(x - 10, navY + 55, 14, color);
      svg += circle(x + 14, navY + 55, 14, color);
      svg += `<ellipse cx="${x}" cy="${navY + 82}" rx="30" ry="12" fill="${color}"/>`;
    }

    svg += text(tab.label, x, navY + 130, 26, color, '500', 'middle');
  });

  // Home indicator
  svg += roundedRect(WIDTH/2 - 70, HEIGHT - 30, 140, 8, 4, COLORS.gray600);

  return svg;
}

// Screenshot 1: Dashboard
async function generateDashboard() {
  console.log('📊 Creating Dashboard mockup...');

  const metrics = [
    { value: '12', label: 'Tareas', color: COLORS.purple },
    { value: '2', label: 'En Progreso', color: COLORS.yellow },
    { value: '450', label: 'CGC Pendiente', color: COLORS.green },
    { value: '8', label: 'Referidos', color: COLORS.blue },
    { value: '5', label: 'Racha', color: COLORS.orange },
    { value: '#47', label: 'Ranking', color: COLORS.yellow },
  ];

  let svg = `<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      ${gradientDef('purpleBlue', COLORS.purple, COLORS.blue)}
      ${gradientDef('userGradient', COLORS.purple, COLORS.blue, true)}
    </defs>

    <!-- Background -->
    <rect width="${WIDTH}" height="${HEIGHT}" fill="${COLORS.bg}"/>

    ${createStatusBar()}
    ${createHeader('panel')}

    <!-- User Profile Card -->
    <rect x="40" y="230" width="${WIDTH - 80}" height="160" rx="32" fill="url(#purpleBlue)" opacity="0.15"/>
    <rect x="40" y="230" width="${WIDTH - 80}" height="160" rx="32" fill="none" stroke="${COLORS.purple}" stroke-width="2" opacity="0.3"/>

    <!-- Avatar -->
    ${circle(130, 310, 50, 'url(#userGradient)')}
    ${text('R', 130, 325, 40, COLORS.white, 'bold', 'middle')}

    <!-- User info -->
    ${text('Rafael Gonzalez', 210, 295, 36, COLORS.white, '600')}
    ${text('FID: 847293', 210, 340, 28, COLORS.gray400, '400')}

    <!-- Metrics Grid -->
    ${(() => {
      let metricsHtml = '';
      const startY = 430;
      const cardW = (WIDTH - 120) / 3;
      const cardH = 180;
      const gap = 20;

      metrics.forEach((m, i) => {
        const row = Math.floor(i / 3);
        const col = i % 3;
        const x = 40 + col * (cardW + gap);
        const y = startY + row * (cardH + gap);

        metricsHtml += roundedRect(x, y, cardW, cardH, 24, COLORS.bgCard);
        metricsHtml += roundedRect(x, y, cardW, cardH, 24, 'none', COLORS.gray700, 1);

        // Icon circle
        metricsHtml += circle(x + cardW/2, y + 50, 28, m.color + '30');
        metricsHtml += circle(x + cardW/2, y + 50, 16, m.color);

        // Value
        metricsHtml += text(m.value, x + cardW/2, y + 115, 48, COLORS.white, 'bold', 'middle');

        // Label
        metricsHtml += text(m.label, x + cardW/2, y + 155, 24, COLORS.gray400, '400', 'middle');
      });

      return metricsHtml;
    })()}

    <!-- Primary CTA Button -->
    <rect x="40" y="880" width="${WIDTH - 80}" height="120" rx="28" fill="url(#purpleBlue)"/>
    ${text('Ver Tareas Disponibles', WIDTH/2 - 80, 955, 36, COLORS.white, '600')}
    <!-- Arrow icon -->
    <path d="M${WIDTH - 120} 940 l20 0 l-8 -12 M${WIDTH - 100} 940 l-8 12" stroke="${COLORS.white}" stroke-width="4" fill="none" stroke-linecap="round"/>

    <!-- Tip Card -->
    <rect x="40" y="1040" width="${WIDTH - 80}" height="100" rx="20" fill="${COLORS.yellow}15"/>
    <rect x="40" y="1040" width="${WIDTH - 80}" height="100" rx="20" fill="none" stroke="${COLORS.yellow}50" stroke-width="1"/>
    ${text('Tienes 2 tareas en progreso. Completa una para ganar CGC!', 80, 1100, 28, COLORS.yellow, '400')}

    ${createBottomNav('panel')}
  </svg>`;

  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(PUBLIC_DIR, 'farcaster-screen-1.png'));

  console.log('✅ Dashboard mockup created');
}

// Screenshot 2: Tasks
async function generateTasks() {
  console.log('📝 Creating Tasks mockup...');

  const tasks = [
    { title: 'Seguir @cryptogiftdao en X', reward: 50, time: '5 min', status: 'Disponible' },
    { title: 'Unirte al servidor de Discord', reward: 100, time: '10 min', status: 'Disponible' },
    { title: 'Completar verificacion KYC', reward: 200, time: '15 min', status: 'Disponible' },
    { title: 'Crear tu primer post sobre CGC', reward: 150, time: '20 min', status: 'Disponible' },
    { title: 'Invitar 3 amigos al DAO', reward: 300, time: '30 min', status: 'En Progreso' },
  ];

  let svg = `<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      ${gradientDef('purpleBlue', COLORS.purple, COLORS.blue)}
    </defs>

    <!-- Background -->
    <rect width="${WIDTH}" height="${HEIGHT}" fill="${COLORS.bg}"/>

    ${createStatusBar()}
    ${createHeader('tareas')}

    <!-- Section Header -->
    <rect x="40" y="230" width="50" height="50" rx="12" fill="${COLORS.green}30"/>
    ${text('DISPONIBLES (12)', 110, 265, 32, COLORS.white, '600')}

    <!-- Task Cards -->
    ${(() => {
      let tasksHtml = '';
      const startY = 320;
      const cardH = 200;
      const gap = 20;

      tasks.forEach((task, i) => {
        const y = startY + i * (cardH + gap);
        const isInProgress = task.status === 'En Progreso';

        // Card background
        tasksHtml += roundedRect(40, y, WIDTH - 80, cardH, 24, COLORS.bgCard);
        tasksHtml += roundedRect(40, y, WIDTH - 80, cardH, 24, 'none', isInProgress ? COLORS.yellow + '50' : COLORS.gray700, isInProgress ? 2 : 1);

        // Task title
        tasksHtml += text(task.title, 80, y + 55, 32, COLORS.white, '500');

        // Reward badge
        tasksHtml += roundedRect(80, y + 80, 140, 50, 12, COLORS.green + '20');
        tasksHtml += text(`${task.reward} CGC`, 150, y + 115, 28, COLORS.green, '600', 'middle');

        // Time badge
        tasksHtml += roundedRect(240, y + 80, 120, 50, 12, COLORS.blue + '20');
        tasksHtml += text(task.time, 300, y + 115, 28, COLORS.blue, '500', 'middle');

        // Status badge
        const statusColor = isInProgress ? COLORS.yellow : COLORS.purple;
        tasksHtml += roundedRect(WIDTH - 280, y + 80, 200, 50, 12, statusColor + '20');
        tasksHtml += text(task.status, WIDTH - 180, y + 115, 26, statusColor, '500', 'middle');

        // Arrow
        tasksHtml += `<path d="M${WIDTH - 100} ${y + 100} l16 0 l-6 -10 M${WIDTH - 84} ${y + 100} l-6 10" stroke="${COLORS.gray500}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
      });

      return tasksHtml;
    })()}

    ${createBottomNav('tareas')}
  </svg>`;

  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(PUBLIC_DIR, 'farcaster-screen-2.png'));

  console.log('✅ Tasks mockup created');
}

// Screenshot 3: Referrals
async function generateReferrals() {
  console.log('🤝 Creating Referrals mockup...');

  let svg = `<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      ${gradientDef('purpleBlue', COLORS.purple, COLORS.blue)}
      ${gradientDef('bronzeGrad', '#CD7F32', '#B87333')}
    </defs>

    <!-- Background -->
    <rect width="${WIDTH}" height="${HEIGHT}" fill="${COLORS.bg}"/>

    ${createStatusBar()}
    ${createHeader('referidos')}

    <!-- Referral Code Card -->
    <rect x="40" y="230" width="${WIDTH - 80}" height="200" rx="28" fill="url(#purpleBlue)" opacity="0.2"/>
    <rect x="40" y="230" width="${WIDTH - 80}" height="200" rx="28" fill="none" stroke="${COLORS.purple}" stroke-width="2" opacity="0.5"/>

    ${text('Tu Codigo de Referido', WIDTH/2, 285, 28, COLORS.gray400, '400', 'middle')}

    <!-- Code box -->
    <rect x="100" y="310" width="${WIDTH - 340}" height="80" rx="16" fill="${COLORS.bgCard}"/>
    ${text('RAFAEL-X7K9', WIDTH/2 - 60, 365, 44, COLORS.white, '700', 'middle')}

    <!-- Copy button -->
    <rect x="${WIDTH - 220}" y="310" width="140" height="80" rx="16" fill="${COLORS.purple}"/>
    ${text('Copiar', WIDTH - 150, 365, 28, COLORS.white, '600', 'middle')}

    <!-- Stats Row -->
    ${(() => {
      const stats = [
        { value: '247', label: 'Clicks' },
        { value: '23', label: 'Conversiones' },
        { value: '460', label: 'CGC Ganados' },
      ];

      let statsHtml = '';
      const statW = (WIDTH - 120) / 3;
      const startY = 480;

      stats.forEach((stat, i) => {
        const x = 40 + i * (statW + 20);
        statsHtml += roundedRect(x, startY, statW, 140, 20, COLORS.bgCard);
        statsHtml += text(stat.value, x + statW/2, startY + 65, 44, COLORS.white, 'bold', 'middle');
        statsHtml += text(stat.label, x + statW/2, startY + 110, 26, COLORS.gray400, '400', 'middle');
      });

      return statsHtml;
    })()}

    <!-- Tier Badge -->
    <rect x="40" y="660" width="${WIDTH - 80}" height="120" rx="20" fill="url(#bronzeGrad)" opacity="0.15"/>
    <rect x="40" y="660" width="${WIDTH - 80}" height="120" rx="20" fill="none" stroke="#CD7F32" stroke-width="2"/>
    ${circle(130, 720, 35, '#CD7F32')}
    ${text('BRONZE', 200, 710, 36, '#CD7F32', '700')}
    ${text('8 referidos - Siguiente: Silver (15)', 200, 750, 26, COLORS.gray400, '400')}

    <!-- Share Buttons -->
    ${text('Compartir en', 60, 840, 28, COLORS.gray400, '400')}

    ${(() => {
      const platforms = [
        { name: 'Farcaster', color: COLORS.purple },
        { name: 'X/Twitter', color: '#1DA1F2' },
        { name: 'Telegram', color: '#0088cc' },
        { name: 'Discord', color: '#5865F2' },
      ];

      let btnsHtml = '';
      const btnW = (WIDTH - 140) / 4;
      const startY = 870;

      platforms.forEach((p, i) => {
        const x = 40 + i * (btnW + 20);
        btnsHtml += roundedRect(x, startY, btnW, 90, 16, p.color + '20');
        btnsHtml += roundedRect(x, startY, btnW, 90, 16, 'none', p.color, 2);
        btnsHtml += text(p.name, x + btnW/2, startY + 55, 24, p.color, '600', 'middle');
      });

      return btnsHtml;
    })()}

    <!-- Network Preview -->
    ${text('Tu Red de Referidos', 60, 1040, 32, COLORS.white, '600')}

    <!-- Mini network tree visualization -->
    <rect x="40" y="1070" width="${WIDTH - 80}" height="300" rx="20" fill="${COLORS.bgCard}"/>

    <!-- Level 1 -->
    ${circle(WIDTH/2, 1130, 40, COLORS.purple)}
    ${text('Tu', WIDTH/2, 1140, 24, COLORS.white, '600', 'middle')}

    <!-- Level 2 connections -->
    <line x1="${WIDTH/2}" y1="1170" x2="${WIDTH/2 - 200}" y2="1230" stroke="${COLORS.gray600}" stroke-width="2"/>
    <line x1="${WIDTH/2}" y1="1170" x2="${WIDTH/2}" y2="1230" stroke="${COLORS.gray600}" stroke-width="2"/>
    <line x1="${WIDTH/2}" y1="1170" x2="${WIDTH/2 + 200}" y2="1230" stroke="${COLORS.gray600}" stroke-width="2"/>

    ${circle(WIDTH/2 - 200, 1260, 30, COLORS.blue)}
    ${text('5', WIDTH/2 - 200, 1270, 24, COLORS.white, '600', 'middle')}

    ${circle(WIDTH/2, 1260, 30, COLORS.blue)}
    ${text('2', WIDTH/2, 1270, 24, COLORS.white, '600', 'middle')}

    ${circle(WIDTH/2 + 200, 1260, 30, COLORS.blue)}
    ${text('1', WIDTH/2 + 200, 1270, 24, COLORS.white, '600', 'middle')}

    <!-- Level indicator -->
    ${text('Nivel 1: 8 referidos directos', WIDTH/2, 1340, 26, COLORS.gray400, '400', 'middle')}

    ${createBottomNav('referidos')}
  </svg>`;

  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(PUBLIC_DIR, 'farcaster-screen-3.png'));

  console.log('✅ Referrals mockup created');
}

// Main
async function main() {
  console.log('\n📱 Generating Farcaster Screenshot Mockups (1284x2778)\n');

  try {
    await generateDashboard();
    await generateTasks();
    await generateReferrals();

    console.log('\n✨ All mockups generated successfully!\n');
    console.log('Output files:');
    console.log('  📊 public/farcaster-screen-1.png (Dashboard)');
    console.log('  📝 public/farcaster-screen-2.png (Tasks)');
    console.log('  🤝 public/farcaster-screen-3.png (Referrals)');
    console.log('\n📝 Remember to add these to .vercelignore whitelist!');
  } catch (error) {
    console.error('❌ Error generating mockups:', error);
    process.exit(1);
  }
}

main();
