-- ============================================================================
-- Migration: Add Bilingual Fields to Tasks Table
-- Date: 2025-12-20
-- Description: Adds title_es and description_es columns for dynamic translations
-- ============================================================================
-- This avoids hardcoding translations in JSON files
-- The frontend will read from database based on current locale
-- ============================================================================

-- Add Spanish translation columns
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS title_es TEXT,
ADD COLUMN IF NOT EXISTS description_es TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tasks_title_es ON public.tasks(title_es);

-- ============================================================================
-- SECTION 1: CONTRACTS & BLOCKCHAIN (35 Tasks)
-- ============================================================================

UPDATE public.tasks SET
  title_es = 'Migrar Contrato NFT de Sepolia a Base Mainnet',
  description_es = 'Desplegar y configurar el contrato NFT en Base Mainnet con todos los parámetros y verificaciones necesarias.'
WHERE task_id = 'T001';

UPDATE public.tasks SET
  title_es = 'Migrar Contrato Escrow a Base Mainnet',
  description_es = 'Desplegar el contrato Escrow a Base Mainnet con configuraciones de seguridad apropiadas.'
WHERE task_id = 'T002';

UPDATE public.tasks SET
  title_es = 'Migrar Registry ERC-6551 a Base Mainnet',
  description_es = 'Desplegar y configurar el registry de cuentas token-bound ERC-6551 en mainnet.'
WHERE task_id = 'T003';

UPDATE public.tasks SET
  title_es = 'Configurar límites de gas optimizados para mainnet',
  description_es = 'Analizar y optimizar parámetros de gas para todas las funciones de contratos en mainnet.'
WHERE task_id = 'T004';

UPDATE public.tasks SET
  title_es = 'Implementar circuit breakers en contratos de producción',
  description_es = 'Añadir mecanismos de pausa de emergencia y circuit breakers a todos los contratos críticos.'
WHERE task_id = 'T005';

UPDATE public.tasks SET
  title_es = 'Auditoría de seguridad externa pre-mainnet',
  description_es = 'Coordinar y completar auditoría de seguridad externa con firma auditora de reputación.'
WHERE task_id = 'T006';

UPDATE public.tasks SET
  title_es = 'Configurar monitoreo de contratos (Tenderly/OZ Defender)',
  description_es = 'Configurar monitoreo y alertas en tiempo real para todos los contratos desplegados.'
WHERE task_id = 'T007';

UPDATE public.tasks SET
  title_es = 'Ejecutar batch atómico: addMinter + removeMinter + transferOwnership',
  description_es = 'Ejecutar la transacción batch crítica vía Safe multisig para activar MinterGateway.'
WHERE task_id = 'T008';

UPDATE public.tasks SET
  title_es = 'Configurar addAuthorizedCaller para sistema de recompensas',
  description_es = 'Añadir el sistema de recompensas como caller autorizado en MinterGateway.'
WHERE task_id = 'T009';

UPDATE public.tasks SET
  title_es = 'Implementar rate limiting en MinterGateway',
  description_es = 'Añadir lógica de rate limiting para prevenir abuso de minting en el gateway.'
WHERE task_id = 'T010';

UPDATE public.tasks SET
  title_es = 'Crear dashboard de monitoreo de MinterGateway',
  description_es = 'Construir dashboard en tiempo real para monitorear actividad del gateway y eventos de minting.'
WHERE task_id = 'T011';

UPDATE public.tasks SET
  title_es = 'Documentar proceso de pause/unpause de emergencia',
  description_es = 'Crear runbook completo para procedimientos de pausa de emergencia.'
WHERE task_id = 'T012';

UPDATE public.tasks SET
  title_es = 'Desplegar Contrato de Vesting para Equipo (15% - 300,000 CGC)',
  description_es = 'Desplegar y configurar el contrato de vesting de tokens del equipo con calendarios apropiados.'
WHERE task_id = 'T013';

UPDATE public.tasks SET
  title_es = 'Desplegar Contrato de Reserva del Ecosistema (10% - 200,000 CGC)',
  description_es = 'Desplegar el contrato de reserva del ecosistema con controles de acceso apropiados.'
WHERE task_id = 'T014';

UPDATE public.tasks SET
  title_es = 'Configurar Multisig de Emergencia (3/5) para reserva',
  description_es = 'Configurar y establecer el multisig de emergencia para gestión de reserva.'
WHERE task_id = 'T015';

UPDATE public.tasks SET
  title_es = 'Implementar cliff de 12 meses para equipo',
  description_es = 'Añadir mecanismo de cliff al vesting del equipo con bloqueos temporales apropiados.'
WHERE task_id = 'T016';

UPDATE public.tasks SET
  title_es = 'Crear dashboard público de calendarios de vesting',
  description_es = 'Construir dashboard transparente mostrando todos los calendarios de vesting y fechas de liberación.'
WHERE task_id = 'T017';

UPDATE public.tasks SET
  title_es = 'Implementar Contrato de Staking CGC',
  description_es = 'Desarrollar y desplegar contrato de staking con lógica de distribución de recompensas.'
WHERE task_id = 'T018';

UPDATE public.tasks SET
  title_es = 'Crear Contrato de Liquidity Mining para Aerodrome',
  description_es = 'Construir contrato de programa de liquidity mining para integración con Aerodrome LP.'
WHERE task_id = 'T019';

UPDATE public.tasks SET
  title_es = 'Desarrollar Registry de Delegación (compatible EIP-5639)',
  description_es = 'Implementar registry de delegación compatible con EIP-5639 para gobernanza.'
WHERE task_id = 'T020';

UPDATE public.tasks SET
  title_es = 'Implementar Contrato de Transferencia por Lotes para eficiencia de gas',
  description_es = 'Crear contrato de transferencia por lotes optimizado para múltiples destinatarios.'
WHERE task_id = 'T021';

UPDATE public.tasks SET
  title_es = 'Crear Contrato de Airdrop con merkle proofs',
  description_es = 'Desarrollar contrato de airdrop basado en merkle para distribución eficiente de tokens.'
WHERE task_id = 'T022';

UPDATE public.tasks SET
  title_es = 'Desarrollar Contrato de Suscripción para funciones premium',
  description_es = 'Construir contrato de pago por suscripción para funciones premium del DAO.'
WHERE task_id = 'T023';

UPDATE public.tasks SET
  title_es = 'Implementar bridge de CGC a Optimism',
  description_es = 'Desarrollar y desplegar contrato de bridge cross-chain para red Optimism.'
WHERE task_id = 'T024';

UPDATE public.tasks SET
  title_es = 'Implementar bridge de CGC a Arbitrum',
  description_es = 'Desarrollar y desplegar contrato de bridge cross-chain para red Arbitrum.'
WHERE task_id = 'T025';

UPDATE public.tasks SET
  title_es = 'Configurar LayerZero/Hyperlane para mensajería cross-chain',
  description_es = 'Integrar LayerZero o Hyperlane para comunicación cross-chain confiable.'
WHERE task_id = 'T026';

UPDATE public.tasks SET
  title_es = 'Crear reclamación de regalos cross-chain (Base → OP)',
  description_es = 'Habilitar reclamación de regalos entre cadenas con experiencia de usuario fluida.'
WHERE task_id = 'T027';

UPDATE public.tasks SET
  title_es = 'Registrar esquema de attestation en Base Mainnet',
  description_es = 'Registrar todos los esquemas EAS requeridos en Base mainnet.'
WHERE task_id = 'T028';

UPDATE public.tasks SET
  title_es = 'Configurar bot attestador EAS con wallet fondeado',
  description_es = 'Configurar y fondear el bot de attestation automatizado.'
WHERE task_id = 'T029';

UPDATE public.tasks SET
  title_es = 'Implementar webhooks para verificación automática',
  description_es = 'Crear sistema de webhooks para verificación automática de attestations.'
WHERE task_id = 'T030';

UPDATE public.tasks SET
  title_es = 'Crear API pública de verificación de attestations',
  description_es = 'Construir API pública para verificación de attestations por terceros.'
WHERE task_id = 'T031';

UPDATE public.tasks SET
  title_es = 'Construir dashboard de attestations por usuario',
  description_es = 'Crear dashboard orientado al usuario mostrando todas sus attestations.'
WHERE task_id = 'T032';

UPDATE public.tasks SET
  title_es = 'Implementar cumplimiento OFAC con Chainalysis',
  description_es = 'Integrar API de Chainalysis para screening de sanciones OFAC.'
WHERE task_id = 'T033';

UPDATE public.tasks SET
  title_es = 'Configurar rate limiting por wallet',
  description_es = 'Implementar rate limiting basado en wallet para prevenir abuso.'
WHERE task_id = 'T034';

UPDATE public.tasks SET
  title_es = 'Implementar anti-sybil vía análisis de grafos',
  description_es = 'Desarrollar detección de sybil basada en grafos usando relaciones de wallets.'
WHERE task_id = 'T035';

-- ============================================================================
-- SECTION 2: BACKEND & APIs (T036-T077) - Spanish translations
-- ============================================================================

UPDATE public.tasks SET
  title_es = 'Implementar Motor Completo de Asignación de Tareas',
  description_es = 'Construir el motor principal de asignación de tareas con lógica de matching inteligente.'
WHERE task_id = 'T036';

UPDATE public.tasks SET
  title_es = 'Crear Registry de Skills en base de datos',
  description_es = 'Diseñar e implementar esquema de registry de skills y sistema de gestión.'
WHERE task_id = 'T037';

UPDATE public.tasks SET
  title_es = 'Desarrollar algoritmo de matching tarea-contribuidor',
  description_es = 'Crear algoritmo basado en ML para matching óptimo tarea-contribuidor.'
WHERE task_id = 'T038';

UPDATE public.tasks SET
  title_es = 'Implementar Cola de Tareas con priorización',
  description_es = 'Construir sistema de cola con prioridad para distribución de tareas.'
WHERE task_id = 'T039';

UPDATE public.tasks SET
  title_es = 'Crear sistema de puntuación de reputación',
  description_es = 'Desarrollar puntuación de reputación completa basada en contribuciones.'
WHERE task_id = 'T040';

UPDATE public.tasks SET
  title_es = 'Desarrollar balanceador de carga para distribución equitativa',
  description_es = 'Crear sistema de distribución justa de tareas entre contribuidores.'
WHERE task_id = 'T041';

UPDATE public.tasks SET
  title_es = 'Implementar cron jobs para procesamiento de recompensas',
  description_es = 'Configurar trabajos programados para distribución automatizada de recompensas.'
WHERE task_id = 'T042';

UPDATE public.tasks SET
  title_es = 'Crear sistema de colas (Redis/BullMQ) para minting',
  description_es = 'Construir sistema de colas robusto para operaciones de minting confiables.'
WHERE task_id = 'T043';

UPDATE public.tasks SET
  title_es = 'Implementar lógica de reintentos para transacciones fallidas',
  description_es = 'Añadir lógica de reintento con backoff exponencial para transacciones blockchain.'
WHERE task_id = 'T044';

UPDATE public.tasks SET
  title_es = 'Configurar webhooks post-minting',
  description_es = 'Configurar notificaciones webhook para eventos de minting exitosos.'
WHERE task_id = 'T045';

UPDATE public.tasks SET
  title_es = 'Construir dashboard de monitoreo de minting',
  description_es = 'Crear dashboard en tiempo real para monitorear operaciones de minting.'
WHERE task_id = 'T046';

UPDATE public.tasks SET
  title_es = 'Completar integración API de Wonderverse',
  description_es = 'Integrar con Wonderverse para sincronización de tareas.'
WHERE task_id = 'T047';

UPDATE public.tasks SET
  title_es = 'Integración API de Dework',
  description_es = 'Conectar con plataforma Dework para gestión de tareas.'
WHERE task_id = 'T048';

UPDATE public.tasks SET
  title_es = 'Integración API de GitHub Issues',
  description_es = 'Sincronizar issues de GitHub como tareas del DAO automáticamente.'
WHERE task_id = 'T049';

UPDATE public.tasks SET
  title_es = 'Receptores webhook para plataformas de quests',
  description_es = 'Construir receptores webhook para eventos de plataformas externas de quests.'
WHERE task_id = 'T050';

UPDATE public.tasks SET
  title_es = 'API de sincronización bidireccional',
  description_es = 'Crear API de sync para sincronización bidireccional de tareas.'
WHERE task_id = 'T051';

UPDATE public.tasks SET
  title_es = 'Crear endpoint público /api/gifts/create',
  description_es = 'Construir endpoint API público para creación de regalos.'
WHERE task_id = 'T052';

UPDATE public.tasks SET
  title_es = 'Crear endpoint público /api/gifts/claim',
  description_es = 'Construir endpoint API público para reclamar regalos.'
WHERE task_id = 'T053';

UPDATE public.tasks SET
  title_es = 'Crear endpoint público /api/gifts/status',
  description_es = 'Construir endpoint API público para verificar estado de regalos.'
WHERE task_id = 'T054';

UPDATE public.tasks SET
  title_es = 'Crear endpoint /api/rewards/check',
  description_es = 'Construir endpoint API para verificar recompensas disponibles.'
WHERE task_id = 'T055';

UPDATE public.tasks SET
  title_es = 'Crear endpoint /api/governance/proposals',
  description_es = 'Construir API para gestión de propuestas de gobernanza.'
WHERE task_id = 'T056';

UPDATE public.tasks SET
  title_es = 'Implementar sistema de gestión de API keys',
  description_es = 'Construir sistema seguro de emisión y gestión de API keys.'
WHERE task_id = 'T057';

UPDATE public.tasks SET
  title_es = 'Rate limiting por API key',
  description_es = 'Implementar rate limiting por key con cuotas.'
WHERE task_id = 'T058';

UPDATE public.tasks SET
  title_es = 'Completar documentación OpenAPI/Swagger',
  description_es = 'Generar documentación API completa con ejemplos.'
WHERE task_id = 'T059';

UPDATE public.tasks SET
  title_es = 'Optimizar índices de Supabase',
  description_es = 'Analizar y optimizar índices de base de datos para rendimiento.'
WHERE task_id = 'T060';

UPDATE public.tasks SET
  title_es = 'Implementar backups de base de datos (diario)',
  description_es = 'Configurar sistema automatizado de backup diario de base de datos.'
WHERE task_id = 'T061';

UPDATE public.tasks SET
  title_es = 'Configurar réplicas de lectura para escalado',
  description_es = 'Configurar réplicas de lectura de base de datos para escalado horizontal.'
WHERE task_id = 'T062';

UPDATE public.tasks SET
  title_es = 'Implementar connection pooling',
  description_es = 'Configurar PgBouncer o similar para connection pooling.'
WHERE task_id = 'T063';

UPDATE public.tasks SET
  title_es = 'Crear pipeline de migraciones de base de datos',
  description_es = 'Construir pipeline CI/CD para migraciones de base de datos.'
WHERE task_id = 'T064';

UPDATE public.tasks SET
  title_es = 'Configurar capa de caché Redis',
  description_es = 'Implementar caché Redis para datos accedidos frecuentemente.'
WHERE task_id = 'T065';

UPDATE public.tasks SET
  title_es = 'Configurar CDN para assets estáticos',
  description_es = 'Configurar Cloudflare o CDN similar para entrega de assets.'
WHERE task_id = 'T066';

UPDATE public.tasks SET
  title_es = 'Implementar edge functions para latencia',
  description_es = 'Desplegar edge functions para operaciones sensibles a latencia.'
WHERE task_id = 'T067';

UPDATE public.tasks SET
  title_es = 'Configurar Sentry para tracking de errores',
  description_es = 'Configurar Sentry con agrupación y alertas apropiadas.'
WHERE task_id = 'T068';

UPDATE public.tasks SET
  title_es = 'Configurar logging estructurado (Winston/Pino)',
  description_es = 'Implementar logging JSON estructurado en todos los servicios.'
WHERE task_id = 'T069';

UPDATE public.tasks SET
  title_es = 'Crear dashboards operacionales (Grafana)',
  description_es = 'Construir dashboards Grafana para métricas del sistema.'
WHERE task_id = 'T070';

UPDATE public.tasks SET
  title_es = 'Implementar sistema de alertas (PagerDuty/OpsGenie)',
  description_es = 'Configurar alertas on-call para problemas críticos.'
WHERE task_id = 'T071';

UPDATE public.tasks SET
  title_es = 'Configurar monitoreo de uptime (Better Uptime)',
  description_es = 'Configurar monitoreo de uptime con página de estado.'
WHERE task_id = 'T072';

UPDATE public.tasks SET
  title_es = 'Implementar rotación de refresh tokens JWT',
  description_es = 'Añadir mecanismo seguro de rotación de refresh tokens JWT.'
WHERE task_id = 'T073';

UPDATE public.tasks SET
  title_es = 'Configurar CORS apropiadamente para producción',
  description_es = 'Configurar políticas CORS estrictas para todos los endpoints.'
WHERE task_id = 'T074';

UPDATE public.tasks SET
  title_es = 'Implementar firma de requests para endpoints sensibles',
  description_es = 'Añadir verificación de firma de requests para APIs sensibles.'
WHERE task_id = 'T075';

UPDATE public.tasks SET
  title_es = 'Configurar reglas WAF (Cloudflare)',
  description_es = 'Configurar reglas de Web Application Firewall.'
WHERE task_id = 'T076';

UPDATE public.tasks SET
  title_es = 'Coordinación de penetration testing',
  description_es = 'Coordinar y revisar resultados de penetration testing.'
WHERE task_id = 'T077';

-- ============================================================================
-- SECTION 3: FRONTEND & UX (T078-T115)
-- ============================================================================

UPDATE public.tasks SET
  title_es = 'Completar conexiones reales con contratos',
  description_es = 'Conectar todos los componentes del dashboard a contratos inteligentes en vivo.'
WHERE task_id = 'T078';

UPDATE public.tasks SET
  title_es = 'Implementar actualizaciones de datos en tiempo real (WebSocket)',
  description_es = 'Añadir conexiones WebSocket para actualizaciones de datos en vivo.'
WHERE task_id = 'T079';

UPDATE public.tasks SET
  title_es = 'Crear dashboard de analíticas completo',
  description_es = 'Construir dashboard de analíticas detallado con gráficos y métricas.'
WHERE task_id = 'T080';

UPDATE public.tasks SET
  title_es = 'Construir vista de portfolio con todos los activos del usuario',
  description_es = 'Crear vista de portfolio unificada mostrando todas las tenencias del usuario.'
WHERE task_id = 'T081';

UPDATE public.tasks SET
  title_es = 'Implementar historial de transacciones con filtros',
  description_es = 'Construir componente de historial de transacciones filtrable.'
WHERE task_id = 'T082';

UPDATE public.tasks SET
  title_es = 'Crear centro de notificaciones (in-app)',
  description_es = 'Construir centro de notificaciones in-app con preferencias.'
WHERE task_id = 'T083';

UPDATE public.tasks SET
  title_es = 'Construir página de configuración con preferencias',
  description_es = 'Crear página de configuración de usuario con todas las preferencias.'
WHERE task_id = 'T084';

UPDATE public.tasks SET
  title_es = 'Implementar persistencia de tema oscuro/claro',
  description_es = 'Añadir persistencia de tema entre sesiones.'
WHERE task_id = 'T085';

UPDATE public.tasks SET
  title_es = 'Wizard multi-paso para crear regalo con progreso',
  description_es = 'Construir wizard paso a paso para creación de regalos con indicador de progreso.'
WHERE task_id = 'T086';

UPDATE public.tasks SET
  title_es = 'Vista previa antes de confirmación',
  description_es = 'Añadir pantalla de vista previa de regalo antes de confirmación final.'
WHERE task_id = 'T087';

UPDATE public.tasks SET
  title_es = 'Creación de regalos por lotes (importar CSV)',
  description_es = 'Habilitar creación masiva de regalos vía carga de archivo CSV.'
WHERE task_id = 'T088';

UPDATE public.tasks SET
  title_es = 'Plantillas de regalos (cumpleaños, aniversario, etc.)',
  description_es = 'Crear plantillas pre-construidas para ocasiones comunes.'
WHERE task_id = 'T089';

UPDATE public.tasks SET
  title_es = 'Entrega programada de regalos',
  description_es = 'Añadir capacidad de programar regalos para entrega futura.'
WHERE task_id = 'T090';

UPDATE public.tasks SET
  title_es = 'Personalización de regalos (mensajes, temas)',
  description_es = 'Habilitar personalización de regalos con mensajes y temas.'
WHERE task_id = 'T091';

UPDATE public.tasks SET
  title_es = 'Experiencia animada de desenvolver regalo',
  description_es = 'Crear animación atractiva para desenvolver regalo.'
WHERE task_id = 'T092';

UPDATE public.tasks SET
  title_es = 'Efectos de confeti y celebración',
  description_es = 'Añadir efectos de celebración después de reclamación exitosa.'
WHERE task_id = 'T093';

UPDATE public.tasks SET
  title_es = 'Compartir en redes sociales después de reclamar',
  description_es = 'Habilitar compartir regalos reclamados en redes sociales.'
WHERE task_id = 'T094';

UPDATE public.tasks SET
  title_es = 'Mensaje de agradecimiento al remitente',
  description_es = 'Permitir a destinatarios enviar mensajes de agradecimiento.'
WHERE task_id = 'T095';

-- Continue with remaining sections...

-- ============================================================================
-- DeFi Integration Tasks (T150-T160 area - commonly visible ones)
-- ============================================================================

UPDATE public.tasks SET
  title_es = 'Integración Compound/Aave para fondos inactivos',
  description_es = 'Integrar protocolos de préstamo para optimización de tesorería.'
WHERE title LIKE '%Compound/Aave%' OR title LIKE '%idle funds%';

UPDATE public.tasks SET
  title_es = 'Incentivos de liquidez en Aerodrome',
  description_es = 'Implementar programa de incentivos de liquidez con Aerodrome.'
WHERE title LIKE '%Aerodrome liquidity incentives%';

UPDATE public.tasks SET
  title_es = 'Integración con vaults de Yearn',
  description_es = 'Integrar con vaults de Yearn para optimización de yield.'
WHERE title LIKE '%Yearn vault%';

UPDATE public.tasks SET
  title_es = 'Gestión de posiciones Uniswap v3',
  description_es = 'Implementar gestión automatizada de posiciones de liquidez Uniswap v3.'
WHERE title LIKE '%Uniswap v3 position%';

-- ============================================================================
-- Comment for documentation
-- ============================================================================
COMMENT ON COLUMN public.tasks.title_es IS 'Spanish translation of task title - used for i18n';
COMMENT ON COLUMN public.tasks.description_es IS 'Spanish translation of task description - used for i18n';
