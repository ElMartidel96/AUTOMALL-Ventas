# 🔄 Actualización de Tareas en Supabase para i18n

**Fecha**: 26 Nov 2025
**Objetivo**: Normalizar todos los títulos/descripciones a inglés en Supabase y usar traducciones estáticas

## 📋 Resumen del Problema

Las tareas en Supabase tienen títulos mezclados (algunos en español, otros en inglés).
Para que el sistema de traducción funcione correctamente, necesitamos:
1. Actualizar todas las tareas a inglés en Supabase
2. Las traducciones al español se cargan desde `src/locales/es.json`

## 🚀 Instrucciones de Ejecución

### Paso 1: Acceder a Supabase SQL Editor
1. Ir a: https://supabase.com/dashboard
2. Seleccionar el proyecto CryptoGift DAO
3. Ir a **SQL Editor** en el menú lateral

### Paso 2: Ejecutar el SQL de Actualización
Copiar y ejecutar el siguiente SQL:

```sql
-- =====================================================
-- ACTUALIZACIÓN DE TAREAS PARA i18n (EN/ES)
-- Normaliza todos los títulos y descripciones a inglés
-- =====================================================

-- DAO-001
UPDATE tasks SET
  title = 'Create Web3 Authentication System',
  description = 'Implement wallet authentication using WalletConnect and signature verification for secure DAO access'
WHERE task_id = 'DAO-001';

-- DAO-002
UPDATE tasks SET
  title = 'Design Main Dashboard UI/UX',
  description = 'Create mockups and prototypes of the DAO dashboard with Figma, including responsive design for all devices'
WHERE task_id = 'DAO-002';

-- DAO-003
UPDATE tasks SET
  title = 'Integrate Ethereum Attestation Service',
  description = 'Connect the system with EAS for automatic validation of completed tasks'
WHERE task_id = 'DAO-003';

-- DAO-004
UPDATE tasks SET
  title = 'Configure Discord Bot',
  description = 'Develop bot to notify tasks, rewards and DAO events on Discord'
WHERE task_id = 'DAO-004';

-- DAO-005
UPDATE tasks SET
  title = 'Create Technical Documentation',
  description = 'Write complete docs on architecture, APIs and contribution guidelines'
WHERE task_id = 'DAO-005';

-- DAO-006
UPDATE tasks SET
  title = 'Implement Voting System',
  description = 'Create interface for proposals and voting using Aragon OSx'
WHERE task_id = 'DAO-006';

-- DAO-007
UPDATE tasks SET
  title = 'Smart Contract Security Audit',
  description = 'Review and audit the DAO system smart contracts'
WHERE task_id = 'DAO-007';

-- DAO-008
UPDATE tasks SET
  title = 'Setup CI/CD Pipeline',
  description = 'Configure GitHub Actions for automatic testing and deployment'
WHERE task_id = 'DAO-008';

-- DAO-009
UPDATE tasks SET
  title = 'Create Landing Page',
  description = 'Develop main project page with DAO information'
WHERE task_id = 'DAO-009';

-- DAO-010
UPDATE tasks SET
  title = 'Zealy Integration',
  description = 'Connect DAO tasks with the Zealy platform for gamification'
WHERE task_id = 'DAO-010';

-- DAO-011
UPDATE tasks SET
  title = 'Automated Testing',
  description = 'Write unit and integration tests for the entire system'
WHERE task_id = 'DAO-011';

-- DAO-012
UPDATE tasks SET
  title = 'Performance Optimization',
  description = 'Optimize dashboard and API load and performance'
WHERE task_id = 'DAO-012';

-- DAO-013
UPDATE tasks SET
  title = 'Notification System',
  description = 'Implement push and email notifications for important events'
WHERE task_id = 'DAO-013';

-- DAO-014
UPDATE tasks SET
  title = 'Mobile Responsive Design',
  description = 'Adapt entire dashboard to work perfectly on mobile devices'
WHERE task_id = 'DAO-014';

-- DAO-015
UPDATE tasks SET
  title = 'Analytics and Metrics',
  description = 'Implement usage tracking and DAO metrics with dashboards'
WHERE task_id = 'DAO-015';

-- DAO-016
UPDATE tasks SET
  title = 'Internationalization (i18n)',
  description = 'Add multi-language support to dashboard (EN/ES)'
WHERE task_id = 'DAO-016';

-- DAO-017
UPDATE tasks SET
  title = 'API Rate Limiting',
  description = 'Implement rate limiting and anti-spam protection on APIs'
WHERE task_id = 'DAO-017';

-- DAO-018
UPDATE tasks SET
  title = 'Backup and Recovery',
  description = 'Setup automatic backup system for database'
WHERE task_id = 'DAO-018';

-- DAO-019
UPDATE tasks SET
  title = 'Social Media Integration',
  description = 'Connect with Twitter/X to share achievements and updates'
WHERE task_id = 'DAO-019';

-- DAO-020
UPDATE tasks SET
  title = 'Improved Error Handling',
  description = 'Implement robust error handling and logging with Sentry'
WHERE task_id = 'DAO-020';

-- DAO-021
UPDATE tasks SET
  title = 'Interactive Tutorial',
  description = 'Create guided tour for new DAO users'
WHERE task_id = 'DAO-021';

-- DAO-022
UPDATE tasks SET
  title = 'API Documentation',
  description = 'Create interactive API documentation with Swagger/OpenAPI'
WHERE task_id = 'DAO-022';

-- DAO-023
UPDATE tasks SET
  title = 'Dark Mode Implementation',
  description = 'Implement dark theme for the entire dashboard'
WHERE task_id = 'DAO-023';

-- DAO-024
UPDATE tasks SET
  title = 'Load Testing',
  description = 'Perform load tests to identify system limits'
WHERE task_id = 'DAO-024';

-- DAO-025
UPDATE tasks SET
  title = 'Multi-signature Wallet Integration',
  description = 'Integrate support for multi-sig wallets like Gnosis Safe'
WHERE task_id = 'DAO-025';

-- DAO-026
UPDATE tasks SET
  title = 'Community Guidelines',
  description = 'Write code of conduct and guidelines for contributors'
WHERE task_id = 'DAO-026';

-- DAO-027
UPDATE tasks SET
  title = 'NFT Rewards System',
  description = 'Create NFT system as rewards for outstanding contributions'
WHERE task_id = 'DAO-027';

-- DAO-028
UPDATE tasks SET
  title = 'Database Optimization',
  description = 'Optimize queries and database structure for better performance'
WHERE task_id = 'DAO-028';

-- DAO-029
UPDATE tasks SET
  title = 'Legal Compliance Review',
  description = 'Review legal aspects of the DAO and compliance in different jurisdictions'
WHERE task_id = 'DAO-029';

-- DAO-030
UPDATE tasks SET
  title = 'Tokenomics Analysis',
  description = 'Analyze and optimize CGC token tokenomics'
WHERE task_id = 'DAO-030';

-- DAO-031
UPDATE tasks SET
  title = 'Monitoring and Alerts',
  description = 'Setup monitoring system with alerts for system health'
WHERE task_id = 'DAO-031';

-- DAO-032
UPDATE tasks SET
  title = 'Cross-chain Integration',
  description = 'Research and implement support for other blockchains besides Base'
WHERE task_id = 'DAO-032';

-- DAO-033
UPDATE tasks SET
  title = 'User Feedback System',
  description = 'Implement system to collect and manage user feedback'
WHERE task_id = 'DAO-033';

-- DAO-034
UPDATE tasks SET
  title = 'Performance Dashboard',
  description = 'Create internal dashboard for DAO performance metrics'
WHERE task_id = 'DAO-034';

-- Verificar cambios
SELECT task_id, title, description FROM tasks ORDER BY task_id;
```

### Paso 3: Actualizar Traducciones en el Código
Después de ejecutar el SQL, el archivo `src/locales/es.json` ya tiene las traducciones correctas.

## 📁 Archivos Relacionados

- `src/locales/en.json` - Traducciones inglés (taskData section)
- `src/locales/es.json` - Traducciones español (taskData section)
- `lib/i18n/task-translations.ts` - Hook de traducción
- `components/tasks/TaskCard.tsx` - Usa el hook
- `components/tasks/TaskDetailsModal.tsx` - Usa el hook
- `components/tasks/TaskClaimModal.tsx` - Usa el hook

## ✅ Verificación Post-Actualización

1. Ir a https://crypto-gift-wallets-dao.vercel.app/tasks
2. Cambiar idioma a Inglés → Todas las tareas en inglés
3. Cambiar idioma a Español → Todas las tareas en español

## 📝 Notas

- El hook `useTaskTranslation()` convierte automáticamente el título a una clave
- Si no encuentra traducción, muestra el texto original de la DB (inglés)
- Las traducciones están en `taskData.{key}.title` y `taskData.{key}.description`
