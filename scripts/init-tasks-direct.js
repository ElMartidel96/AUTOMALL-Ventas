#!/usr/bin/env node
/**
 * 🚀 Direct Database Task Initialization
 * 
 * Inserta las 34 tareas directamente en Supabase sin API
 */

require('dotenv').config({ path: '.env.local' });

// Las 34 tareas predefinidas del DAO
const PREDEFINED_TASKS = [
  {
    task_id: 'DAO-001',
    title: 'Crear sistema de autenticación Web3',
    description: 'Implementar autenticación con wallet usando WalletConnect y verificación de firmas EIP-712',
    complexity: 8,
    reward_cgc: 2750.00,
    estimated_days: 5,
    platform: 'github',
    category: 'development',
    priority: 'high',
    required_skills: ['React', 'Web3', 'TypeScript'],
    tags: ['authentication', 'web3', 'security']
  },
  {
    task_id: 'DAO-002',
    title: 'Diseñar UI/UX del dashboard principal',
    description: 'Crear mockups y prototipos del dashboard DAO con Figma, incluyendo responsive design',
    complexity: 6,
    reward_cgc: 1400.00,
    estimated_days: 4,
    platform: 'manual',
    category: 'design',
    priority: 'high',
    required_skills: ['Figma', 'UI/UX', 'Design Systems'],
    tags: ['design', 'dashboard', 'figma']
  },
  {
    task_id: 'DAO-003',
    title: 'Integrar Ethereum Attestation Service',
    description: 'Conectar el sistema con EAS para validación automática de tareas completadas',
    complexity: 9,
    reward_cgc: 5000.00,
    estimated_days: 6,
    platform: 'github',
    category: 'development',
    priority: 'critical',
    required_skills: ['Solidity', 'Web3', 'EAS'],
    tags: ['blockchain', 'attestation', 'validation']
  },
  {
    task_id: 'DAO-004',
    title: 'Configurar bot de Discord',
    description: 'Desarrollar bot para notificar tareas, recompensas y eventos del DAO en Discord',
    complexity: 7,
    reward_cgc: 2000.00,
    estimated_days: 4,
    platform: 'discord',
    category: 'development',
    priority: 'medium',
    required_skills: ['Node.js', 'Discord.js', 'APIs'],
    tags: ['discord', 'bot', 'notifications']
  },
  {
    task_id: 'DAO-005',
    title: 'Crear documentación técnica',
    description: 'Escribir docs completas de arquitectura, APIs y guías de contribución',
    complexity: 5,
    reward_cgc: 1000.00,
    estimated_days: 3,
    platform: 'github',
    category: 'documentation',
    priority: 'medium',
    required_skills: ['Technical Writing', 'Markdown', 'Architecture'],
    tags: ['documentation', 'guides', 'architecture']
  },
  {
    task_id: 'DAO-006',
    title: 'Implementar sistema de votación',
    description: 'Crear interface para propuestas y votación usando Aragon OSx',
    complexity: 8,
    reward_cgc: 2750.00,
    estimated_days: 5,
    platform: 'github',
    category: 'development',
    priority: 'high',
    required_skills: ['React', 'Aragon', 'Web3'],
    tags: ['voting', 'dao', 'governance']
  },
  {
    task_id: 'DAO-007',
    title: 'Auditoría de seguridad de contratos',
    description: 'Revisar y auditar los smart contracts del sistema DAO',
    complexity: 9,
    reward_cgc: 5000.00,
    estimated_days: 7,
    platform: 'manual',
    category: 'security',
    priority: 'critical',
    required_skills: ['Solidity', 'Security', 'Audit'],
    tags: ['security', 'audit', 'smart-contracts']
  },
  {
    task_id: 'DAO-008',
    title: 'Setup CI/CD pipeline',
    description: 'Configurar GitHub Actions para testing automático y deployment',
    complexity: 6,
    reward_cgc: 1400.00,
    estimated_days: 3,
    platform: 'github',
    category: 'development',
    priority: 'medium',
    required_skills: ['GitHub Actions', 'CI/CD', 'DevOps'],
    tags: ['cicd', 'automation', 'deployment']
  },
  {
    task_id: 'DAO-009',
    title: 'Crear landing page',
    description: 'Desarrollar página principal del proyecto con información del DAO',
    complexity: 4,
    reward_cgc: 700.00,
    estimated_days: 2,
    platform: 'manual',
    category: 'design',
    priority: 'low',
    required_skills: ['HTML', 'CSS', 'Design'],
    tags: ['landing', 'marketing', 'frontend']
  },
  {
    task_id: 'DAO-010',
    title: 'Integración con Zealy',
    description: 'Conectar tareas del DAO con la plataforma Zealy para gamificación',
    complexity: 7,
    reward_cgc: 2000.00,
    estimated_days: 4,
    platform: 'zealy',
    category: 'development',
    priority: 'medium',
    required_skills: ['APIs', 'Integration', 'Zealy'],
    tags: ['zealy', 'gamification', 'integration']
  },
  {
    task_id: 'DAO-011',
    title: 'Testing automatizado',
    description: 'Escribir tests unitarios y de integración para todo el sistema',
    complexity: 8,
    reward_cgc: 2750.00,
    estimated_days: 5,
    platform: 'github',
    category: 'testing',
    priority: 'high',
    required_skills: ['Jest', 'Testing', 'JavaScript'],
    tags: ['testing', 'quality', 'automation']
  },
  {
    task_id: 'DAO-012',
    title: 'Optimización de performance',
    description: 'Optimizar carga y rendimiento del dashboard y APIs',
    complexity: 6,
    reward_cgc: 1400.00,
    estimated_days: 3,
    platform: 'github',
    category: 'development',
    priority: 'medium',
    required_skills: ['Performance', 'React', 'Optimization'],
    tags: ['performance', 'optimization', 'speed']
  },
  {
    task_id: 'DAO-013',
    title: 'Sistema de notificaciones',
    description: 'Implementar notificaciones push y email para eventos importantes',
    complexity: 7,
    reward_cgc: 2000.00,
    estimated_days: 4,
    platform: 'github',
    category: 'development',
    priority: 'medium',
    required_skills: ['Push Notifications', 'Email', 'APIs'],
    tags: ['notifications', 'communication', 'alerts']
  },
  {
    task_id: 'DAO-014',
    title: 'Mobile responsive design',
    description: 'Adaptar todo el dashboard para funcionar perfectamente en móviles',
    complexity: 5,
    reward_cgc: 1000.00,
    estimated_days: 3,
    platform: 'github',
    category: 'design',
    priority: 'medium',
    required_skills: ['CSS', 'Responsive', 'Mobile'],
    tags: ['mobile', 'responsive', 'css']
  },
  {
    task_id: 'DAO-015',
    title: 'Analytics y métricas',
    description: 'Implementar tracking de uso y métricas del DAO con dashboards',
    complexity: 6,
    reward_cgc: 1400.00,
    estimated_days: 4,
    platform: 'github',
    category: 'development',
    priority: 'low',
    required_skills: ['Analytics', 'Metrics', 'Dashboards'],
    tags: ['analytics', 'metrics', 'data']
  },
  {
    task_id: 'DAO-016',
    title: 'Internacionalización (i18n)',
    description: 'Agregar soporte multi-idioma al dashboard (EN/ES)',
    complexity: 4,
    reward_cgc: 700.00,
    estimated_days: 2,
    platform: 'github',
    category: 'development',
    priority: 'low',
    required_skills: ['i18n', 'React', 'Localization'],
    tags: ['i18n', 'localization', 'languages']
  },
  {
    task_id: 'DAO-017',
    title: 'API rate limiting',
    description: 'Implementar rate limiting y protección anti-spam en APIs',
    complexity: 5,
    reward_cgc: 1000.00,
    estimated_days: 2,
    platform: 'github',
    category: 'security',
    priority: 'medium',
    required_skills: ['Security', 'APIs', 'Rate Limiting'],
    tags: ['security', 'api', 'rate-limiting']
  },
  {
    task_id: 'DAO-018',
    title: 'Backup y recovery',
    description: 'Setup sistema de backups automáticos para base de datos',
    complexity: 6,
    reward_cgc: 1400.00,
    estimated_days: 3,
    platform: 'manual',
    category: 'development',
    priority: 'high',
    required_skills: ['Database', 'Backup', 'DevOps'],
    tags: ['backup', 'recovery', 'database']
  },
  {
    task_id: 'DAO-019',
    title: 'Social media integration',
    description: 'Conectar con Twitter/X para compartir logros y actualizaciones',
    complexity: 4,
    reward_cgc: 700.00,
    estimated_days: 2,
    platform: 'manual',
    category: 'marketing',
    priority: 'low',
    required_skills: ['Social Media', 'APIs', 'Marketing'],
    tags: ['social', 'twitter', 'marketing']
  },
  {
    task_id: 'DAO-020',
    title: 'Error handling mejorado',
    description: 'Implementar manejo robusto de errores y logging con Sentry',
    complexity: 5,
    reward_cgc: 1000.00,
    estimated_days: 2,
    platform: 'github',
    category: 'development',
    priority: 'medium',
    required_skills: ['Error Handling', 'Logging', 'Sentry'],
    tags: ['errors', 'logging', 'monitoring']
  },
  {
    task_id: 'DAO-021',
    title: 'Tutorial interactivo',
    description: 'Crear tour guiado para nuevos usuarios del DAO',
    complexity: 5,
    reward_cgc: 1000.00,
    estimated_days: 3,
    platform: 'github',
    category: 'design',
    priority: 'low',
    required_skills: ['UX', 'Tutorial Design', 'JavaScript'],
    tags: ['tutorial', 'onboarding', 'ux']
  },
  {
    task_id: 'DAO-022',
    title: 'API documentation',
    description: 'Crear documentación interactiva de APIs con Swagger/OpenAPI',
    complexity: 4,
    reward_cgc: 700.00,
    estimated_days: 2,
    platform: 'github',
    category: 'documentation',
    priority: 'medium',
    required_skills: ['OpenAPI', 'Documentation', 'APIs'],
    tags: ['api', 'documentation', 'swagger']
  },
  {
    task_id: 'DAO-023',
    title: 'Dark mode implementation',
    description: 'Implementar tema oscuro para el dashboard completo',
    complexity: 4,
    reward_cgc: 700.00,
    estimated_days: 2,
    platform: 'github',
    category: 'design',
    priority: 'low',
    required_skills: ['CSS', 'Theming', 'Design'],
    tags: ['dark-mode', 'theming', 'ui']
  },
  {
    task_id: 'DAO-024',
    title: 'Load testing',
    description: 'Realizar pruebas de carga para identificar límites del sistema',
    complexity: 6,
    reward_cgc: 1400.00,
    estimated_days: 3,
    platform: 'manual',
    category: 'testing',
    priority: 'medium',
    required_skills: ['Load Testing', 'Performance', 'Testing'],
    tags: ['load-testing', 'performance', 'scalability']
  },
  {
    task_id: 'DAO-025',
    title: 'Multi-signature wallet integration',
    description: 'Integrar soporte para wallets multi-sig como Gnosis Safe',
    complexity: 8,
    reward_cgc: 2750.00,
    estimated_days: 5,
    platform: 'github',
    category: 'development',
    priority: 'high',
    required_skills: ['Web3', 'Multi-sig', 'Gnosis Safe'],
    tags: ['multisig', 'wallet', 'security']
  },
  {
    task_id: 'DAO-026',
    title: 'Community guidelines',
    description: 'Redactar código de conducta y guidelines para colaboradores',
    complexity: 3,
    reward_cgc: 500.00,
    estimated_days: 1,
    platform: 'manual',
    category: 'community',
    priority: 'medium',
    required_skills: ['Writing', 'Community Management'],
    tags: ['community', 'guidelines', 'conduct']
  },
  {
    task_id: 'DAO-027',
    title: 'NFT rewards system',
    description: 'Crear sistema de NFTs como recompensas por contribuciones destacadas',
    complexity: 9,
    reward_cgc: 5000.00,
    estimated_days: 6,
    platform: 'github',
    category: 'development',
    priority: 'low',
    required_skills: ['NFT', 'Solidity', 'Web3'],
    tags: ['nft', 'rewards', 'blockchain']
  },
  {
    task_id: 'DAO-028',
    title: 'Database optimization',
    description: 'Optimizar queries y estructura de base de datos para mejor performance',
    complexity: 7,
    reward_cgc: 2000.00,
    estimated_days: 4,
    platform: 'github',
    category: 'development',
    priority: 'medium',
    required_skills: ['Database', 'SQL', 'Optimization'],
    tags: ['database', 'optimization', 'performance']
  },
  {
    task_id: 'DAO-029',
    title: 'Legal compliance review',
    description: 'Revisar aspectos legales del DAO y compliance en diferentes jurisdicciones',
    complexity: 8,
    reward_cgc: 2750.00,
    estimated_days: 5,
    platform: 'manual',
    category: 'security',
    priority: 'high',
    required_skills: ['Legal', 'Compliance', 'DAO Law'],
    tags: ['legal', 'compliance', 'regulation']
  },
  {
    task_id: 'DAO-030',
    title: 'Tokenomics analysis',
    description: 'Análizar y optimizar la tokenomics del CGC token',
    complexity: 7,
    reward_cgc: 2000.00,
    estimated_days: 4,
    platform: 'manual',
    category: 'community',
    priority: 'medium',
    required_skills: ['Tokenomics', 'Economics', 'Analysis'],
    tags: ['tokenomics', 'economics', 'cgc']
  },
  {
    task_id: 'DAO-031',
    title: 'Monitoring y alertas',
    description: 'Setup sistema de monitoreo con alertas para el health del sistema',
    complexity: 6,
    reward_cgc: 1400.00,
    estimated_days: 3,
    platform: 'github',
    category: 'development',
    priority: 'high',
    required_skills: ['Monitoring', 'Alerting', 'DevOps'],
    tags: ['monitoring', 'alerts', 'health']
  },
  {
    task_id: 'DAO-032',
    title: 'Cross-chain integration',
    description: 'Investigar e implementar soporte para otras blockchains además de Base',
    complexity: 9,
    reward_cgc: 5000.00,
    estimated_days: 7,
    platform: 'github',
    category: 'development',
    priority: 'low',
    required_skills: ['Cross-chain', 'Web3', 'Multiple Networks'],
    tags: ['cross-chain', 'multichain', 'integration']
  },
  {
    task_id: 'DAO-033',
    title: 'User feedback system',
    description: 'Implementar sistema para recolectar y gestionar feedback de usuarios',
    complexity: 5,
    reward_cgc: 1000.00,
    estimated_days: 3,
    platform: 'github',
    category: 'community',
    priority: 'medium',
    required_skills: ['Feedback', 'UX', 'Community'],
    tags: ['feedback', 'community', 'improvement']
  },
  {
    task_id: 'DAO-034',
    title: 'Performance dashboard',
    description: 'Crear dashboard interno para métricas de performance del DAO',
    complexity: 6,
    reward_cgc: 1400.00,
    estimated_days: 4,
    platform: 'github',
    category: 'development',
    priority: 'low',
    required_skills: ['Dashboard', 'Metrics', 'Visualization'],
    tags: ['dashboard', 'metrics', 'performance']
  }
];

async function insertTasksDirectly() {
  console.log('🚀 Insertando 34 tareas directamente en Supabase...\n');
  
  const supabaseUrl = process.env.SUPABASE_DAO_URL;
  const serviceKey = process.env.SUPABASE_DAO_SERVICE_KEY;
  
  if (!supabaseUrl || !serviceKey) {
    console.error('❌ Error: Falta configuración de Supabase');
    process.exit(1);
  }
  
  let inserted = 0;
  let skipped = 0;
  let errors = 0;
  
  console.log(`📊 Procesando ${PREDEFINED_TASKS.length} tareas...`);
  
  for (const task of PREDEFINED_TASKS) {
    try {
      console.log(`📝 ${task.task_id}: ${task.title.substring(0, 40)}...`);
      
      const response = await fetch(`${supabaseUrl}/rest/v1/tasks`, {
        method: 'POST',
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=ignore-duplicates'
        },
        body: JSON.stringify({
          task_id: task.task_id,
          title: task.title,
          description: task.description,
          complexity: task.complexity,
          reward_cgc: task.reward_cgc,
          estimated_days: task.estimated_days,
          platform: task.platform,
          category: task.category,
          priority: task.priority,
          status: 'available',
          required_skills: task.required_skills,
          tags: task.tags,
          metadata: {}
        })
      });
      
      if (response.ok) {
        console.log(`   ✅ Insertado`);
        inserted++;
      } else if (response.status === 409) {
        console.log(`   ⏭️  Ya existe`);
        skipped++;
      } else {
        const error = await response.text();
        console.log(`   ❌ Error ${response.status}: ${error.substring(0, 50)}...`);
        errors++;
      }
      
    } catch (error) {
      console.log(`   ❌ Exception: ${error.message}`);
      errors++;
    }
    
    // Pausa pequeña entre inserts
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n🎉 RESUMEN DE INICIALIZACIÓN:');
  console.log('================================');
  console.log(`📊 Total procesadas: ${PREDEFINED_TASKS.length}`);
  console.log(`✅ Insertadas: ${inserted}`);
  console.log(`⏭️  Ya existían: ${skipped}`);
  console.log(`❌ Errores: ${errors}`);
  
  if (inserted > 0) {
    console.log('\n🚀 ¡Tareas creadas exitosamente!');
    console.log('🔗 Ve a tu dashboard para verlas: https://crypto-gift-wallets-dao.vercel.app/tasks');
  }
  
  if (errors > 0) {
    console.log('\n⚠️ Algunos errores ocurrieron, pero el resto se insertó correctamente');
  }
}

// Ejecutar
insertTasksDirectly().catch(console.error);