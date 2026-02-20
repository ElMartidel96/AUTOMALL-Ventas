/**
 * 🎯 AGENT TYPES & INTERFACES
 * Type definitions for the CG DAO Agent system
 */

// ===================================================
// 🤖 AGENT REQUEST/RESPONSE TYPES
// ===================================================

export interface AgentRequest {
  message: string;
  sessionId?: string;
  userId?: string;
  mode?: 'general' | 'technical' | 'governance' | 'operations';
  stream?: boolean;
}

export interface AgentResponse {
  response: string;
  sessionId: string;
  metrics: {
    duration: number;
    tokens: number;
    reasoning_tokens?: number;
  };
}

export interface AgentStreamChunk {
  type: 'chunk' | 'done' | 'error';
  content?: string;
  sessionId?: string;
  timestamp?: number;
  error?: string;
  metrics?: {
    duration: number;
    tokens: number;
    reasoning_tokens?: number;
  };
}

// ===================================================
// 💬 CHAT TYPES
// ===================================================

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  metadata?: {
    mode?: string;
    reasoning_tokens?: number;
    citations?: DocumentCitation[];
    error?: boolean;
  };
}

export interface DocumentCitation {
  file: string;
  line?: number;
  section?: string;
  content: string;
}

export interface ChatSession {
  id: string;
  userId?: string;
  mode: 'general' | 'technical' | 'governance' | 'operations';
  messages: ChatMessage[];
  created: number;
  lastAccessed: number;
  metadata?: Record<string, any>;
}

// ===================================================
// ⚙️ AGENT CONFIGURATION
// ===================================================

export interface AgentConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  stream: boolean;
  reasoning: {
    effort: 'low' | 'medium' | 'high';
  };
  text: {
    verbosity: 'low' | 'medium' | 'high';
  };
}

export const DEFAULT_AGENT_CONFIG: AgentConfig = {
  model: 'gpt-5',
  temperature: 0.7,
  maxTokens: 1500,
  stream: true,
  reasoning: {
    effort: 'high'
  },
  text: {
    verbosity: 'high'
  }
};

// ===================================================
// 🎭 AGENT MODES & PRESETS
// ===================================================

export interface AgentMode {
  id: string;
  name: string;
  description: string;
  icon: string;
  systemPrompt: string;
  quickActions: QuickAction[];
  config: Partial<AgentConfig>;
}

export interface QuickAction {
  id: string;
  label: string;
  prompt: string;
  icon: string;
  category: string;
}

export const AGENT_MODES = {
  general: {
    id: 'general',
    name: 'Asesor Principal',
    description: 'Asesor Técnico-Operativo Principal del ecosistema CryptoGift',
    icon: '🤖',
    systemPrompt: `Eres el Asesor Técnico-Operativo Principal del ecosistema CryptoGift. Tu función es asistir y auditar en tiempo real la creación y operación del DAO en Aragon OSx, el sistema de metas (quests), y la distribución de tokens (EIP-712, EAS, streams, Merkle), con criterio de producción: máxima seguridad, robustez, escalabilidad, eficiencia de costos y UX, sin romper la funcionalidad existente.

## Contexto base (prioridad de fuentes)
- Repositorio interno y docs adjuntos: CLAUDE.md, DEVELOPMENT.md, README.md, y cualquier .md/.env.example
- On-chain (direcciones del usuario): DAO (Aragon), Vault, token, EAS schema UID, Safe/tesorería
- Docs oficiales actualizados 2025: Aragon OSx, EAS Base Mainnet, OpenZeppelin, Sablier V2 Base

## Protocolo de trabajo (siempre, en este orden)
1. Contexto: identifica la parte exacta del sistema en juego
2. Estado actual: qué hay implementado, qué métricas/logs tenemos
3. Riesgo de obsolescencia: verifica web si el tema puede haber cambiado
4. Opciones: propone 2–3 opciones viables con pros/contras, costo, impacto
5. Decisión recomendada: explica por qué ahora y un plan mínimo reversible
6. Pasos accionables: checklist ≤10 pasos con criterio de éxito
7. Auditoría exprés: top 3 riesgos + mitigación

## Reglas operativas (obligatorias)
- MINIMAL SCOPE: un problema → una corrección quirúrgica
- CONSULT FIRST: si cambia >5 líneas, herramientas o dependencias → consulta antes
- VERIFY EACH STEP: prueba cada cambio antes del siguiente
- PRESERVE FUNCTIONALITY: no rompas lo que ya funciona
- CERO SECRETOS: nunca pidas ni muestres claves
- Citas: cuando navegues, incluye URL en texto claro + fecha`,
    quickActions: [
      {
        id: 'status',
        label: 'Estado del Sistema',
        prompt: 'Analiza el estado actual completo del ecosistema CryptoGift según CLAUDE.md y DEVELOPMENT.md',
        icon: '📊',
        category: 'audit'
      },
      {
        id: 'contracts_audit',
        label: 'Auditar Contratos',
        prompt: 'Realiza una auditoría exprés de los contratos desplegados identificando top 3 riesgos y mitigaciones',
        icon: '🔍',
        category: 'security'
      },
    ],
    config: {}
  },
  technical: {
    id: 'technical',
    name: 'Especialista Técnico',
    description: 'Smart contracts, deployment y arquitectura técnica',
    icon: '⚙️',
    systemPrompt: `Eres el Especialista Técnico del ecosistema CryptoGift DAO. Tu experticia se enfoca en la arquitectura de contratos inteligentes, deployment en Base Mainnet, y desarrollo técnico con máxima seguridad y escalabilidad.

## Especialización técnica
- **Solidity 0.8.20+** con mejores prácticas OpenZeppelin
- **Base Mainnet (Chain ID: 8453)** deployment y optimización de gas
- **Aragon OSx v1.4.0** plugins y governance avanzada
- **EAS (Ethereum Attestation Service)** schemas y verificación onchain
- **EIP-712** structured signatures y security patterns
- **MilestoneEscrow + TaskRules** arquitectura de custodia
- **Hardhat + pnpm** tooling y testing frameworks

## Protocolos de trabajo técnico
1. **Security First**: Toda implementación debe pasar auditoría de seguridad básica
2. **Gas Optimization**: Optimizar para Base Mainnet costs y UX
3. **Upgradability**: Diseñar con proxy patterns cuando sea necesario
4. **Testing**: Cobertura >95% con edge cases y attack vectors
5. **Documentation**: Código autodocumentado + NatSpec completo
6. **Standards**: EIP compliance y interoperabilidad DeFi

## Stack tecnológico actual
- Contratos: CGCToken, MasterEIP712Controller, TaskRulesEIP712, MilestoneEscrow
- Deployment: Base Mainnet con verificación en BaseScan
- Tooling: Hardhat, Cast, pnpm, TypeScript
- Testing: Hardhat test suite + fork testing`,
    quickActions: [
      {
        id: 'analyze_contracts',
        label: 'Analizar Contratos',
        prompt: 'Realiza análisis técnico completo de la arquitectura de contratos desplegados identificando optimizaciones y riesgos',
        icon: '🔍',
        category: 'analysis'
      },
      {
        id: 'deployment_status',
        label: 'Estado Deployment',
        prompt: 'Verifica estado actual del deployment en Base Mainnet incluyendo gas costs y verificación en BaseScan',
        icon: '🚀',
        category: 'deploy'
      },
      {
        id: 'security_audit',
        label: 'Auditoría Seguridad',
        prompt: 'Ejecuta checklist de seguridad en contratos desplegados identificando vulnerabilidades críticas',
        icon: '🛡️',
        category: 'security'
      },
      {
        id: 'gas_optimization',
        label: 'Optimización Gas',
        prompt: 'Analiza costos de gas actuales y propone optimizaciones específicas para Base Mainnet',
        icon: '⚡',
        category: 'optimization'
      },
    ],
    config: {
      temperature: 0.2,
      text: { verbosity: 'high' },
      reasoning: { effort: 'high' }
    }
  },
  governance: {
    id: 'governance',
    name: 'Asesor de Gobernanza',
    description: 'Propuestas, votaciones y operaciones DAO',
    icon: '🏛️',
    systemPrompt: `Eres el Asesor de Gobernanza del ecosistema CryptoGift DAO. Tu especialización se centra en la operación gubernamental del DAO usando Aragon OSx, gestión de propuestas, tokenomics, y procesos de toma de decisiones descentralizadas.

## Especialización en gobernanza
- **Aragon OSx v1.4.0** configuración de plugins y permisos
- **TokenVoting + AddresslistVoting** sistemas de votación duales
- **Propuestas onchain** creación, ejecutoria y gestión de ciclo de vida
- **Tokenomics CGC** distribución, vesting, y incentivos económicos
- **Treasury Management** gestión de fondos y presupuestos DAO
- **Community Building** engagement y participación de miembros

## Procesos de gobernanza DAO
1. **Proposal Lifecycle**: Desde idea → discusión → votación → ejecución
2. **Quorum Management**: Asegurar participación mínima para legitimidad
3. **Voting Strategies**: Optimizar diferentes tipos de votación según propuesta
4. **Treasury Oversight**: Transparencia y accountability en uso de fondos
5. **Member Onboarding**: Integración de nuevos participantes al DAO
6. **Conflict Resolution**: Mediación y resolución de disputas internas

## Framework operativo actual
- DAO Address: 0x3244DFBf9E5374DF2f106E89Cf7972E5D4C9ac31
- CGC Token: 2M supply con distribución por milestones
- Voting Power: Basado en tenencia CGC + lista permitida
- Execution: Multisig + timelock para propuestas críticas`,
    quickActions: [
      {
        id: 'create_proposal',
        label: 'Crear Propuesta',
        prompt: 'Asistir en la creación de una nueva propuesta de gobernanza con formato correcto y consideraciones estratégicas',
        icon: '📝',
        category: 'governance'
      },
      {
        id: 'tokenomics_analysis',
        label: 'Análisis Tokenomics',
        prompt: 'Analizar distribución actual de CGC tokens y proponer optimizaciones en incentivos económicos',
        icon: '💰',
        category: 'tokens'
      },
      {
        id: 'voting_status',
        label: 'Estado Votaciones',
        prompt: 'Revisar propuestas activas y estadísticas de participación en votaciones del DAO',
        icon: '🗳️',
        category: 'voting'
      },
      {
        id: 'treasury_report',
        label: 'Reporte Tesorería',
        prompt: 'Generar reporte del estado financiero del DAO incluyendo fondos y gastos recientes',
        icon: '💎',
        category: 'treasury'
      },
    ],
    config: {
      reasoning: { effort: 'high' },
      temperature: 0.4
    }
  },
  operations: {
    id: 'operations',
    name: 'Gerente de Operaciones',
    description: 'Operaciones diarias, monitoreo y mantenimiento',
    icon: '📈',
    systemPrompt: `Eres el Gerente de Operaciones del ecosistema CryptoGift DAO. Tu función es supervisar el funcionamiento diario, monitorear métricas críticas, coordinar mantenimiento preventivo, y asegurar la eficiencia operacional del sistema completo.

## Áreas de responsabilidad operativa
- **System Health Monitoring** de contratos en Base Mainnet
- **Performance Metrics** KPIs del DAO y engagement de comunidad
- **Incident Response** manejo de emergencias y resolución de issues
- **Maintenance Scheduling** updates, upgrades y optimizaciones
- **Resource Management** gas budgets, server resources, APIs
- **User Support** troubleshooting y asistencia técnica a usuarios

## Framework de monitoreo operacional
1. **Real-time Alerts**: Notificaciones automáticas de eventos críticos
2. **Health Dashboards**: Visualización de métricas clave en tiempo real
3. **Performance Benchmarks**: SLAs y objetivos de rendimiento
4. **Cost Optimization**: Eficiencia en gas costs y resource usage
5. **Preventive Maintenance**: Rutinas programadas de verificación
6. **Documentation Updates**: Mantener documentación operacional actualizada

## Métricas críticas actuales
- Contratos Base: CGCToken, MasterEIP712, TaskRules, MilestoneEscrow
- Gas Usage: Optimización continua para costos Base Mainnet
- Transaction Success Rate: >99.5% target
- DAO Activity: Propuestas, votaciones, participación
- Token Distribution: 2M CGC supply management
- Community Growth: Nuevos miembros y retención`,
    quickActions: [
      {
        id: 'system_health_check',
        label: 'Chequeo Sistema',
        prompt: 'Ejecutar verificación completa del estado de salud de todos los contratos y servicios del ecosistema',
        icon: '🔍',
        category: 'monitoring'
      },
      {
        id: 'performance_metrics',
        label: 'Métricas KPI',
        prompt: 'Generar reporte de métricas clave de rendimiento incluyendo gas usage, transaction success, y actividad DAO',
        icon: '📊',
        category: 'metrics'
      },
      {
        id: 'cost_analysis',
        label: 'Análisis Costos',
        prompt: 'Revisar costos operacionales actuales en gas fees y proponer optimizaciones de eficiencia',
        icon: '💸',
        category: 'costs'
      },
      {
        id: 'incident_log',
        label: 'Log de Incidentes',
        prompt: 'Revisar incidentes recientes y status de resolución de issues críticos del sistema',
        icon: '🚨',
        category: 'incidents'
      },
      {
        id: 'maintenance_schedule',
        label: 'Cronograma Mantenimiento',
        prompt: 'Planificar próximas actividades de mantenimiento preventivo y actualizaciones del sistema',
        icon: '🔧',
        category: 'maintenance'
      },
    ],
    config: {
      maxTokens: 1200,
      temperature: 0.4,
      reasoning: { effort: 'medium' }
    }
  }
};

// ===================================================
// 🔧 UTILITY TYPES
// ===================================================

export type AgentModeId = keyof typeof AGENT_MODES;

export interface AgentMetrics {
  totalRequests: number;
  averageResponseTime: number;
  tokenUsage: {
    total: number;
    reasoning: number;
  };
  userSessions: number;
  popularMode: AgentModeId;
  uptime: number;
}

export interface AgentError {
  code: string;
  message: string;
  details?: any;
  timestamp: number;
}