#!/usr/bin/env node
/**
 * 📢 Publish DAO Tasks to Discord
 *
 * Posts all 34 predefined tasks to the #task-dao channel
 * Uses Discord REST API directly
 *
 * Usage: node scripts/publish-tasks-discord.js
 */

require('dotenv').config({ path: '.env.local' });

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID || '1440971032818090006';

if (!DISCORD_BOT_TOKEN) {
  console.error('❌ DISCORD_BOT_TOKEN is required');
  process.exit(1);
}

const API_BASE = 'https://discord.com/api/v10';

// Helper to make Discord API calls
async function discordAPI(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
  };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(`${API_BASE}${endpoint}`, options);
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Discord API error: ${response.status} - ${error}`);
  }
  return response.json();
}

// Sleep helper
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Category emoji mapping
const CATEGORY_EMOJI = {
  development: '💻',
  design: '🎨',
  documentation: '📚',
  marketing: '📣',
  community: '👥',
  security: '🔐',
  content: '✍️',
  translation: '🌐',
  testing: '🧪',
  research: '🔬',
};

// Priority colors
const PRIORITY_COLORS = {
  critical: 0xFF0000,  // Red
  high: 0xFF8C00,      // Orange
  medium: 0xFFD700,    // Gold
  low: 0x32CD32,       // Green
};

// Complexity to tier
function getTier(complexity) {
  if (complexity >= 9) return { name: 'EPIC', emoji: '🏆' };
  if (complexity >= 7) return { name: 'HIGH', emoji: '🔥' };
  if (complexity >= 5) return { name: 'MEDIUM', emoji: '⚡' };
  return { name: 'SIMPLE', emoji: '✨' };
}

// The 34 predefined tasks
const PREDEFINED_TASKS = [
  {
    task_id: 'DAO-001',
    title: 'Crear sistema de autenticación Web3',
    description: 'Implementar autenticación con wallet usando WalletConnect y verificación de firmas EIP-712',
    complexity: 8,
    reward_cgc: 2750.00,
    estimated_days: 5,
    category: 'development',
    priority: 'high',
    required_skills: ['React', 'Web3', 'TypeScript'],
  },
  {
    task_id: 'DAO-002',
    title: 'Diseñar UI/UX del dashboard principal',
    description: 'Crear mockups y prototipos del dashboard DAO con Figma, incluyendo responsive design',
    complexity: 6,
    reward_cgc: 1400.00,
    estimated_days: 4,
    category: 'design',
    priority: 'high',
    required_skills: ['Figma', 'UI/UX', 'Design Systems'],
  },
  {
    task_id: 'DAO-003',
    title: 'Integrar Ethereum Attestation Service',
    description: 'Conectar el sistema con EAS para validación automática de tareas completadas',
    complexity: 9,
    reward_cgc: 5000.00,
    estimated_days: 6,
    category: 'development',
    priority: 'critical',
    required_skills: ['Solidity', 'Web3', 'EAS'],
  },
  {
    task_id: 'DAO-004',
    title: 'Configurar bot de Discord',
    description: 'Desarrollar bot para notificar tareas, recompensas y eventos del DAO en Discord',
    complexity: 7,
    reward_cgc: 2000.00,
    estimated_days: 4,
    category: 'development',
    priority: 'medium',
    required_skills: ['Node.js', 'Discord.js', 'APIs'],
  },
  {
    task_id: 'DAO-005',
    title: 'Crear documentación técnica',
    description: 'Escribir docs completas de arquitectura, APIs y guías de contribución',
    complexity: 5,
    reward_cgc: 1000.00,
    estimated_days: 3,
    category: 'documentation',
    priority: 'medium',
    required_skills: ['Technical Writing', 'Markdown', 'Architecture'],
  },
  {
    task_id: 'DAO-006',
    title: 'Implementar sistema de votación',
    description: 'Crear interface para propuestas y votación usando Aragon OSx',
    complexity: 8,
    reward_cgc: 2750.00,
    estimated_days: 5,
    category: 'development',
    priority: 'high',
    required_skills: ['React', 'Aragon', 'Web3'],
  },
  {
    task_id: 'DAO-007',
    title: 'Auditoría de seguridad de contratos',
    description: 'Revisar y auditar los smart contracts del sistema DAO',
    complexity: 9,
    reward_cgc: 5000.00,
    estimated_days: 7,
    category: 'security',
    priority: 'critical',
    required_skills: ['Solidity', 'Security', 'Audit'],
  },
  {
    task_id: 'DAO-008',
    title: 'Setup CI/CD pipeline',
    description: 'Configurar GitHub Actions para testing automático y deployment',
    complexity: 6,
    reward_cgc: 1400.00,
    estimated_days: 3,
    category: 'development',
    priority: 'medium',
    required_skills: ['GitHub Actions', 'CI/CD', 'DevOps'],
  },
  {
    task_id: 'DAO-009',
    title: 'Crear landing page',
    description: 'Desarrollar página principal del proyecto con información del DAO',
    complexity: 4,
    reward_cgc: 700.00,
    estimated_days: 3,
    category: 'development',
    priority: 'medium',
    required_skills: ['Next.js', 'Tailwind', 'React'],
  },
  {
    task_id: 'DAO-010',
    title: 'Sistema de notificaciones email',
    description: 'Implementar envío de emails para eventos importantes del DAO',
    complexity: 7,
    reward_cgc: 2000.00,
    estimated_days: 4,
    category: 'development',
    priority: 'medium',
    required_skills: ['Node.js', 'Email APIs', 'Templates'],
  },
  {
    task_id: 'DAO-011',
    title: 'Integrar analytics y métricas',
    description: 'Dashboard de métricas con Grafana para monitorear actividad del DAO',
    complexity: 8,
    reward_cgc: 2750.00,
    estimated_days: 5,
    category: 'development',
    priority: 'high',
    required_skills: ['Grafana', 'Data Analysis', 'APIs'],
  },
  {
    task_id: 'DAO-012',
    title: 'Crear sistema de badges/NFTs',
    description: 'Sistema de reconocimientos NFT para contribuidores destacados',
    complexity: 6,
    reward_cgc: 1400.00,
    estimated_days: 4,
    category: 'development',
    priority: 'medium',
    required_skills: ['Solidity', 'NFTs', 'IPFS'],
  },
  {
    task_id: 'DAO-013',
    title: 'Implementar multi-idioma',
    description: 'Sistema i18n completo para español, inglés y portugués',
    complexity: 7,
    reward_cgc: 2000.00,
    estimated_days: 4,
    category: 'development',
    priority: 'medium',
    required_skills: ['i18n', 'React', 'Localization'],
  },
  {
    task_id: 'DAO-014',
    title: 'Optimización de rendimiento',
    description: 'Mejorar tiempos de carga y performance general de la aplicación',
    complexity: 5,
    reward_cgc: 1000.00,
    estimated_days: 3,
    category: 'development',
    priority: 'medium',
    required_skills: ['Performance', 'React', 'Web Vitals'],
  },
  {
    task_id: 'DAO-015',
    title: 'Diseñar sistema de recompensas',
    description: 'Crear visual del sistema de gamificación y recompensas',
    complexity: 6,
    reward_cgc: 1400.00,
    estimated_days: 4,
    category: 'design',
    priority: 'high',
    required_skills: ['Figma', 'Gamification', 'UI Design'],
  },
  {
    task_id: 'DAO-016',
    title: 'Escribir whitepaper v2',
    description: 'Actualizar whitepaper con nuevas funcionalidades y tokenomics',
    complexity: 4,
    reward_cgc: 700.00,
    estimated_days: 3,
    category: 'documentation',
    priority: 'medium',
    required_skills: ['Technical Writing', 'Tokenomics', 'Research'],
  },
  {
    task_id: 'DAO-017',
    title: 'Crear tests E2E',
    description: 'Suite completa de tests end-to-end con Playwright',
    complexity: 5,
    reward_cgc: 1000.00,
    estimated_days: 4,
    category: 'testing',
    priority: 'medium',
    required_skills: ['Playwright', 'Testing', 'TypeScript'],
  },
  {
    task_id: 'DAO-018',
    title: 'API pública documentada',
    description: 'Crear API REST pública con documentación OpenAPI/Swagger',
    complexity: 6,
    reward_cgc: 1400.00,
    estimated_days: 4,
    category: 'development',
    priority: 'medium',
    required_skills: ['API Design', 'OpenAPI', 'Node.js'],
  },
  {
    task_id: 'DAO-019',
    title: 'Moderar comunidad Discord',
    description: 'Gestionar comunidad, responder preguntas y mantener ambiente positivo',
    complexity: 4,
    reward_cgc: 700.00,
    estimated_days: 30,
    category: 'community',
    priority: 'medium',
    required_skills: ['Community Management', 'Discord', 'Communication'],
  },
  {
    task_id: 'DAO-020',
    title: 'Crear contenido educativo',
    description: 'Videos y artículos explicando funcionamiento del DAO',
    complexity: 5,
    reward_cgc: 1000.00,
    estimated_days: 5,
    category: 'content',
    priority: 'medium',
    required_skills: ['Content Creation', 'Video Editing', 'Writing'],
  },
  {
    task_id: 'DAO-021',
    title: 'Gestión de redes sociales',
    description: 'Manejar Twitter, crear contenido y engagement con comunidad',
    complexity: 5,
    reward_cgc: 1000.00,
    estimated_days: 30,
    category: 'marketing',
    priority: 'medium',
    required_skills: ['Social Media', 'Content', 'Community'],
  },
  {
    task_id: 'DAO-022',
    title: 'Traducir docs a portugués',
    description: 'Traducir documentación completa al portugués brasileño',
    complexity: 4,
    reward_cgc: 700.00,
    estimated_days: 3,
    category: 'translation',
    priority: 'low',
    required_skills: ['Portuguese', 'Technical Translation', 'Documentation'],
  },
  {
    task_id: 'DAO-023',
    title: 'Diseñar assets de marketing',
    description: 'Crear banners, infografías y material promocional',
    complexity: 4,
    reward_cgc: 700.00,
    estimated_days: 3,
    category: 'design',
    priority: 'medium',
    required_skills: ['Graphic Design', 'Illustrator', 'Marketing'],
  },
  {
    task_id: 'DAO-024',
    title: 'Implementar staking básico',
    description: 'Sistema simple de staking de CGC tokens con rewards',
    complexity: 6,
    reward_cgc: 1400.00,
    estimated_days: 5,
    category: 'development',
    priority: 'high',
    required_skills: ['Solidity', 'DeFi', 'Web3'],
  },
  {
    task_id: 'DAO-025',
    title: 'Dashboard de tesorería',
    description: 'Visualización en tiempo real de fondos y gastos del DAO',
    complexity: 8,
    reward_cgc: 2750.00,
    estimated_days: 5,
    category: 'development',
    priority: 'high',
    required_skills: ['React', 'Data Viz', 'Web3'],
  },
  {
    task_id: 'DAO-026',
    title: 'Bug bounty inicial',
    description: 'Reportar y documentar bugs encontrados en la plataforma',
    complexity: 3,
    reward_cgc: 500.00,
    estimated_days: 7,
    category: 'testing',
    priority: 'medium',
    required_skills: ['QA', 'Bug Reporting', 'Testing'],
  },
  {
    task_id: 'DAO-027',
    title: 'Investigar Layer 2 options',
    description: 'Análisis comparativo de opciones L2 para escalabilidad',
    complexity: 9,
    reward_cgc: 5000.00,
    estimated_days: 5,
    category: 'research',
    priority: 'critical',
    required_skills: ['Blockchain', 'Research', 'Technical Analysis'],
  },
  {
    task_id: 'DAO-028',
    title: 'Crear onboarding tutorial',
    description: 'Guía interactiva paso a paso para nuevos usuarios',
    complexity: 7,
    reward_cgc: 2000.00,
    estimated_days: 4,
    category: 'development',
    priority: 'high',
    required_skills: ['UX', 'React', 'Tutorial Design'],
  },
  {
    task_id: 'DAO-029',
    title: 'Implementar 2FA opcional',
    description: 'Autenticación de dos factores para cuentas sensibles',
    complexity: 8,
    reward_cgc: 2750.00,
    estimated_days: 4,
    category: 'security',
    priority: 'high',
    required_skills: ['Security', 'Authentication', 'Node.js'],
  },
  {
    task_id: 'DAO-030',
    title: 'Sistema de delegación de votos',
    description: 'Permitir delegar poder de voto a otros miembros',
    complexity: 7,
    reward_cgc: 2000.00,
    estimated_days: 5,
    category: 'development',
    priority: 'high',
    required_skills: ['Solidity', 'Governance', 'Web3'],
  },
  {
    task_id: 'DAO-031',
    title: 'Mobile responsive audit',
    description: 'Revisar y mejorar experiencia en dispositivos móviles',
    complexity: 6,
    reward_cgc: 1400.00,
    estimated_days: 3,
    category: 'design',
    priority: 'medium',
    required_skills: ['Responsive Design', 'CSS', 'Mobile UX'],
  },
  {
    task_id: 'DAO-032',
    title: 'Integración con Snapshot',
    description: 'Conectar sistema de votación con Snapshot para governance offchain',
    complexity: 9,
    reward_cgc: 5000.00,
    estimated_days: 5,
    category: 'development',
    priority: 'critical',
    required_skills: ['Snapshot', 'GraphQL', 'Web3'],
  },
  {
    task_id: 'DAO-033',
    title: 'Crear FAQ completo',
    description: 'Documento de preguntas frecuentes con respuestas detalladas',
    complexity: 5,
    reward_cgc: 1000.00,
    estimated_days: 2,
    category: 'documentation',
    priority: 'medium',
    required_skills: ['Technical Writing', 'Documentation', 'UX Writing'],
  },
  {
    task_id: 'DAO-034',
    title: 'Setup monitoring y alertas',
    description: 'Sistema de monitoreo con alertas para contratos y APIs',
    complexity: 6,
    reward_cgc: 1400.00,
    estimated_days: 3,
    category: 'development',
    priority: 'high',
    required_skills: ['DevOps', 'Monitoring', 'Alerting'],
  },
];

// Create embed for a task
function createTaskEmbed(task) {
  const tier = getTier(task.complexity);
  const categoryEmoji = CATEGORY_EMOJI[task.category] || '📋';
  const priorityColor = PRIORITY_COLORS[task.priority] || 0x7289DA;

  return {
    embeds: [{
      title: `${tier.emoji} ${task.task_id}: ${task.title}`,
      description: task.description,
      color: priorityColor,
      fields: [
        {
          name: '💰 Reward',
          value: `**${task.reward_cgc.toLocaleString()} CGC**`,
          inline: true,
        },
        {
          name: '⚡ Complexity',
          value: `${task.complexity}/10 (${tier.name})`,
          inline: true,
        },
        {
          name: '📅 Estimated Time',
          value: `${task.estimated_days} days`,
          inline: true,
        },
        {
          name: `${categoryEmoji} Category`,
          value: task.category.charAt(0).toUpperCase() + task.category.slice(1),
          inline: true,
        },
        {
          name: '🎯 Priority',
          value: task.priority.toUpperCase(),
          inline: true,
        },
        {
          name: '📊 Status',
          value: '🟢 Available',
          inline: true,
        },
        {
          name: '🛠️ Required Skills',
          value: task.required_skills.map(s => `\`${s}\``).join(', '),
          inline: false,
        },
      ],
      footer: {
        text: `CryptoGift DAO | Use /claim ${task.task_id} to claim this task`,
      },
      timestamp: new Date().toISOString(),
    }],
  };
}

async function findTaskChannel() {
  console.log('🔍 Searching for #task-dao channel...');

  const channels = await discordAPI(`/guilds/${DISCORD_GUILD_ID}/channels`);

  // Look for task-dao or similar channel names
  const taskChannel = channels.find(ch =>
    ch.name === 'task-dao' ||
    ch.name === '🎯-task-dao' ||
    ch.name === '🎯-tareas-dao' ||
    ch.name.includes('task-dao')
  );

  if (!taskChannel) {
    console.log('\n📋 Available channels:');
    channels.filter(ch => ch.type === 0).forEach(ch => {
      console.log(`   - #${ch.name} (${ch.id})`);
    });
    throw new Error('Could not find #task-dao channel. Please check channel name.');
  }

  console.log(`✅ Found channel: #${taskChannel.name} (${taskChannel.id})`);
  return taskChannel.id;
}

async function publishTasks() {
  console.log('🚀 CryptoGift DAO - Task Publisher\n');
  console.log(`📍 Guild ID: ${DISCORD_GUILD_ID}`);
  console.log(`📋 Tasks to publish: ${PREDEFINED_TASKS.length}\n`);

  try {
    // Find the task channel
    const channelId = await findTaskChannel();

    // First, send header message
    console.log('\n📝 Sending header message...');
    await discordAPI(`/channels/${channelId}/messages`, 'POST', {
      embeds: [{
        title: '🎯 CryptoGift DAO - Available Tasks',
        description: `Welcome to the DAO Task Board!\n\n**Total Tasks:** ${PREDEFINED_TASKS.length}\n**Total Rewards:** ${PREDEFINED_TASKS.reduce((sum, t) => sum + t.reward_cgc, 0).toLocaleString()} CGC\n\nUse \`/claim <TASK-ID>\` to claim a task and start earning CGC tokens!\n\n**Tier System:**\n🏆 EPIC (9-10) - 5,000+ CGC\n🔥 HIGH (7-8) - 2,000-2,750 CGC\n⚡ MEDIUM (5-6) - 1,000-1,400 CGC\n✨ SIMPLE (3-4) - 500-700 CGC`,
        color: 0x5865F2,
        thumbnail: {
          url: 'https://www.mbxarts.com/cgc-logo-150.png'
        },
        footer: {
          text: 'CryptoGift DAO | Task System v3.0'
        },
        timestamp: new Date().toISOString(),
      }]
    });
    await sleep(1000);

    // Group tasks by priority for organized posting
    const priorities = ['critical', 'high', 'medium', 'low'];

    for (const priority of priorities) {
      const priorityTasks = PREDEFINED_TASKS.filter(t => t.priority === priority);
      if (priorityTasks.length === 0) continue;

      // Send priority divider
      console.log(`\n📌 Publishing ${priority.toUpperCase()} priority tasks (${priorityTasks.length})...`);
      await discordAPI(`/channels/${channelId}/messages`, 'POST', {
        content: `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n**${priority.toUpperCase()} PRIORITY TASKS** (${priorityTasks.length})\n━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      });
      await sleep(500);

      // Post each task
      for (let i = 0; i < priorityTasks.length; i++) {
        const task = priorityTasks[i];
        const embed = createTaskEmbed(task);

        try {
          await discordAPI(`/channels/${channelId}/messages`, 'POST', embed);
          console.log(`   ✅ [${i + 1}/${priorityTasks.length}] ${task.task_id}: ${task.title}`);
          await sleep(1500); // Avoid rate limits
        } catch (error) {
          console.error(`   ❌ Failed to post ${task.task_id}:`, error.message);
        }
      }
    }

    // Send footer message
    console.log('\n📝 Sending footer message...');
    await discordAPI(`/channels/${channelId}/messages`, 'POST', {
      embeds: [{
        title: '📋 How to Participate',
        description: `**1.** Browse the tasks above\n**2.** Use \`/claim DAO-XXX\` to claim a task\n**3.** Complete the work within the estimated time\n**4.** Submit your work for review\n**5.** Receive CGC tokens upon approval!\n\n**Need help?** Use \`/help\` or ask in #❓-preguntas\n\n**Propose new tasks:** Use \`/propose\` to suggest new tasks for the DAO!`,
        color: 0x00D166,
        footer: {
          text: 'CryptoGift DAO | Building the future together'
        }
      }]
    });

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ All tasks published successfully!');
    console.log(`📊 Total: ${PREDEFINED_TASKS.length} tasks`);
    console.log(`💰 Total rewards: ${PREDEFINED_TASKS.reduce((sum, t) => sum + t.reward_cgc, 0).toLocaleString()} CGC`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run
publishTasks();
