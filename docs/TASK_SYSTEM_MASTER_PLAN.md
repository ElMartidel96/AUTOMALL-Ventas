# 🎯 TASK SYSTEM MASTER PLAN v1.0

**Status**: 📋 DISEÑADO - Listo para Implementación
**Priority**: 🔥 CRÍTICA
**Version**: 1.0
**Last Updated**: 19 Diciembre 2025
**Author**: Claude Opus 4.5 + CryptoGift DAO Team

---

## 📋 RESUMEN EJECUTIVO

Este documento define el sistema completo de tareas integrado con Discord para CryptoGift Wallets DAO:

1. **Taxonomía de Tareas** - Sistema de clasificación escalable
2. **Arquitectura de Datos** - Estructura optimizada para miles de tareas
3. **Integración Discord** - Sincronización bidireccional en tiempo real
4. **UI/UX Components** - Componentes de interfaz agrupados por categoría
5. **Plan de Implementación** - 10 fases con acciones específicas

---

## 🏗️ TAXONOMÍA DE TAREAS (TASK TAXONOMY)

### Principio de Organización: 3 Niveles Jerárquicos

```
DOMINIO (Domain)        →  CATEGORÍA (Category)      →  TIPO (Type)
"¿Qué área general?"       "¿Qué especialidad?"          "¿Qué formato?"

Ejemplo:
DESARROLLO              →  Frontend                   →  Feature
DESARROLLO              →  Blockchain                 →  Smart Contract
COMUNIDAD               →  Social                     →  Content Creation
GOBERNANZA              →  Treasury                   →  Proposal
```

### 📊 DOMINIOS PRINCIPALES (6 Total)

| Emoji | Dominio | Descripción | Categorías |
|-------|---------|-------------|------------|
| 💻 | **DESARROLLO** | Todo código y desarrollo técnico | frontend, backend, mobile, blockchain, ai, defi, nft, performance, testing, infrastructure |
| 📚 | **DOCUMENTACIÓN** | Contenido escrito y educativo | documentation, localization, academy |
| 🎨 | **DISEÑO** | UI/UX, branding, multimedia | design, branding, multimedia |
| 👥 | **COMUNIDAD** | Engagement y crecimiento | social, notifications, gamification, support |
| 🏛️ | **GOBERNANZA** | DAO y operaciones | governance, treasury, compliance, analytics |
| 🔧 | **OPERACIONES** | Integraciones y automatización | integration, automation, algorithm, search, security |

### 📂 CATEGORÍAS DETALLADAS (25 Total)

```typescript
// Dominio: DESARROLLO (10 categorías)
type DevCategory =
  | 'frontend'       // UI Components, Pages, Styling
  | 'backend'        // APIs, Services, Database
  | 'mobile'         // React Native, PWA
  | 'blockchain'     // Smart Contracts, Web3
  | 'ai'             // ML Models, Agents, RAG
  | 'defi'           // Swaps, Pools, Vaults
  | 'nft'            // ERC-721, ERC-1155, Metadata
  | 'performance'    // Optimization, Caching
  | 'testing'        // Unit, E2E, Security
  | 'infrastructure' // DevOps, CI/CD, Monitoring

// Dominio: DOCUMENTACIÓN (3 categorías)
type DocsCategory =
  | 'documentation'  // Technical Docs, API Refs
  | 'localization'   // i18n, Translations
  | 'academy'        // Courses, Tutorials, Guides

// Dominio: DISEÑO (3 categorías)
type DesignCategory =
  | 'design'         // UI/UX, Mockups, Prototypes
  | 'branding'       // Logos, Brand Assets
  | 'multimedia'     // Videos, Animations, Graphics

// Dominio: COMUNIDAD (4 categorías)
type CommunityCategory =
  | 'social'         // Twitter, Discord, Content
  | 'notifications'  // Emails, Push, Webhooks
  | 'gamification'   // Badges, Leaderboards, Quests
  | 'support'        // Help Desk, FAQ, Troubleshooting

// Dominio: GOBERNANZA (4 categorías)
type GovernanceCategory =
  | 'governance'     // Proposals, Voting, DAO
  | 'treasury'       // Budgets, Allocations, Reports
  | 'compliance'     // Legal, Audit, KYC
  | 'analytics'      // Dashboards, Metrics, Reports

// Dominio: OPERACIONES (5 categorías)
type OpsCategory =
  | 'integration'    // Third-party, APIs, Plugins
  | 'automation'     // Bots, Scripts, Cron
  | 'algorithm'      // Reward Calc, Matching, ML
  | 'search'         // Indexing, Elastic, Vector
  | 'security'       // Audits, Penetration, Access
```

### 🏷️ TIPOS DE TAREA (Task Types)

| Tipo | Emoji | Descripción | Duración Típica |
|------|-------|-------------|-----------------|
| `feature` | ✨ | Nueva funcionalidad | 3-14 días |
| `bugfix` | 🐛 | Corrección de errores | 1-3 días |
| `refactor` | ♻️ | Mejora de código existente | 2-7 días |
| `research` | 🔬 | Investigación y POC | 1-5 días |
| `design` | 🎨 | Diseño UI/UX | 2-5 días |
| `content` | 📝 | Creación de contenido | 1-3 días |
| `review` | 👀 | Revisión y auditoría | 1-2 días |
| `setup` | ⚙️ | Configuración y setup | 0.5-2 días |
| `migration` | 📦 | Migración de datos/código | 2-7 días |
| `integration` | 🔌 | Integración de sistemas | 3-10 días |

### 🎚️ NIVELES DE COMPLEJIDAD (10 Niveles)

| Level | Nombre | CGC Range | Días Est. | Descripción |
|-------|--------|-----------|-----------|-------------|
| 1-2 | **TRIVIAL** | 200-400 | 0.5-1 | Config changes, typos, simple updates |
| 3-4 | **SIMPLE** | 400-900 | 1-3 | Single component, basic features |
| 5-6 | **MEDIUM** | 900-1,750 | 3-7 | Multi-component, moderate logic |
| 7-8 | **HIGH** | 1,750-3,750 | 7-14 | System-level, complex integration |
| 9-10 | **CRITICAL** | 3,750-7,500 | 14-28 | Cross-system, security-critical |
| 10+ | **EPIC** | 7,500-12,500 | 28-42 | Protocol-level, architectural |

---

## 🗄️ ESTRUCTURA DE DATOS OPTIMIZADA

### Campos Adicionales para la Tabla `tasks`

```sql
-- Migration: add_task_taxonomy_fields.sql
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS domain TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS task_type TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS skills_required JSONB DEFAULT '[]';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS bounty_pool_id UUID;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS discord_message_id TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS discord_thread_id TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN DEFAULT false;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS max_assignees INTEGER DEFAULT 1;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS acceptance_criteria JSONB DEFAULT '[]';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS deliverables JSONB DEFAULT '[]';

-- Add indexes for filtering
CREATE INDEX idx_tasks_domain ON tasks(domain);
CREATE INDEX idx_tasks_category ON tasks(category);
CREATE INDEX idx_tasks_task_type ON tasks(task_type);
CREATE INDEX idx_tasks_is_featured ON tasks(is_featured) WHERE is_featured = true;
CREATE INDEX idx_tasks_is_urgent ON tasks(is_urgent) WHERE is_urgent = true;

-- Domain enum constraint
ALTER TABLE tasks ADD CONSTRAINT valid_domain
  CHECK (domain IN ('development', 'documentation', 'design', 'community', 'governance', 'operations'));

-- Task type enum constraint
ALTER TABLE tasks ADD CONSTRAINT valid_task_type
  CHECK (task_type IN ('feature', 'bugfix', 'refactor', 'research', 'design', 'content', 'review', 'setup', 'migration', 'integration'));
```

### TypeScript Types Actualizados

```typescript
// lib/supabase/types.ts - Addition
export type TaskDomain =
  | 'development'
  | 'documentation'
  | 'design'
  | 'community'
  | 'governance'
  | 'operations'

export type TaskType =
  | 'feature'
  | 'bugfix'
  | 'refactor'
  | 'research'
  | 'design'
  | 'content'
  | 'review'
  | 'setup'
  | 'migration'
  | 'integration'

export interface TaskExtended extends Task {
  domain: TaskDomain
  task_type: TaskType
  skills_required: string[]
  discord_message_id: string | null
  discord_thread_id: string | null
  is_featured: boolean
  is_urgent: boolean
  max_assignees: number
  acceptance_criteria: string[]
  deliverables: string[]
}
```

---

## 🎨 ARQUITECTURA UI - TASK PAGE REDISEÑADA

### Vista Principal: Agrupación por Dominio

```
┌─────────────────────────────────────────────────────────────────┐
│  🎯 Tasks & Rewards                          [Balance] [Refresh] │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────┬─────────┬─────────┬─────────┬─────────┬─────────┐ │
│  │💻 Dev   │📚 Docs  │🎨 Design│👥 Comm  │🏛️ Gov   │🔧 Ops   │ │
│  │  (23)   │  (8)    │  (5)    │  (12)   │  (4)    │  (7)    │ │
│  └─────────┴─────────┴─────────┴─────────┴─────────┴─────────┘ │
│                                                                  │
│  🔍 Search...  [Category ▼] [Type ▼] [Complexity ▼] [Sort ▼]   │
│                                                                  │
│  ═══════════════════════════════════════════════════════════════ │
│  📌 FEATURED & URGENT                                            │
│  ═══════════════════════════════════════════════════════════════ │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ 🔥 RC-1155 Tokenbone Protocol          │ 7,500 CGC │ EPIC   │ │
│  │ 💻 Development > Blockchain > Feature  │ 21 days   │ 🔥🔥🔥  │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ═══════════════════════════════════════════════════════════════ │
│  💻 DESARROLLO (23 tasks)                                        │
│  ═══════════════════════════════════════════════════════════════ │
│                                                                  │
│  ▸ Frontend (6)  ▸ Backend (4)  ▸ Blockchain (5)  ▸ AI (3) ...  │
│                                                                  │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐          │
│  │ Task Card 1   │ │ Task Card 2   │ │ Task Card 3   │          │
│  │ ...           │ │ ...           │ │ ...           │          │
│  └───────────────┘ └───────────────┘ └───────────────┘          │
│                                                                  │
│  ═══════════════════════════════════════════════════════════════ │
│  📚 DOCUMENTACIÓN (8 tasks)                                      │
│  ═══════════════════════════════════════════════════════════════ │
│  ...                                                             │
└─────────────────────────────────────────────────────────────────┘
```

### Componentes Necesarios

```
components/tasks/
├── TaskPage.tsx              # Main page (UPDATED)
├── TaskDomainNav.tsx         # NEW: Domain navigation tabs
├── TaskDomainSection.tsx     # NEW: Collapsible domain section
├── TaskCategoryChips.tsx     # NEW: Category filter chips
├── TaskGrid.tsx              # NEW: Responsive task grid
├── TaskCard.tsx              # UPDATED: Add domain/type badges
├── TaskFilters.tsx           # UPDATED: Add new filters
├── TaskList.tsx              # UPDATED: Group by domain/category
├── TaskDetailsModal.tsx      # UPDATED: Show full taxonomy
├── FeaturedTasks.tsx         # NEW: Pinned/urgent tasks section
├── TaskProposal.tsx          # Existing
├── TasksInProgress.tsx       # Existing
└── index.ts                  # Exports
```

---

## 🔗 INTEGRACIÓN DISCORD - ARQUITECTURA

### Flujo Completo Bidireccional

```
┌─────────────────────────────────────────────────────────────────┐
│                    TASK SYNC ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐         ┌──────────────┐                      │
│  │   SUPABASE   │ ◀─────▶ │   DISCORD    │                      │
│  │  (Database)  │         │   (Server)   │                      │
│  └──────────────┘         └──────────────┘                      │
│         │                        │                               │
│         ▼                        ▼                               │
│  ┌──────────────┐         ┌──────────────┐                      │
│  │   Realtime   │         │    Bot +     │                      │
│  │  Subscript.  │         │   Webhooks   │                      │
│  └──────────────┘         └──────────────┘                      │
│         │                        │                               │
│         ▼                        ▼                               │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    WEBHOOK HANDLERS                         │ │
│  │  /api/webhooks/task-created   → Discord notification        │ │
│  │  /api/webhooks/task-claimed   → Discord update + thread     │ │
│  │  /api/webhooks/task-completed → Discord celebration         │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Discord Channel Structure for Tasks

```
📢 INFORMACIÓN
└── 📜-anuncios

🎯 TAREAS (NUEVO)
├── 📋-tareas-disponibles     # Webhook: new tasks
├── 🔥-tareas-urgentes        # Webhook: urgent/featured
├── 💻-dev-tasks              # Domain: Development
├── 📚-docs-tasks             # Domain: Documentation
├── 👥-community-tasks        # Domain: Community
├── 🏆-tareas-completadas     # Webhook: completed tasks
└── 📊-leaderboard            # Weekly stats

💬 COMUNIDAD
└── 💬-general
```

### Webhook Message Format

```typescript
// Task Created Notification
const taskCreatedEmbed = {
  title: `🆕 Nueva Tarea: ${task.title}`,
  description: task.description.substring(0, 200) + '...',
  color: DOMAIN_COLORS[task.domain], // Color by domain
  fields: [
    { name: '💰 Recompensa', value: `${task.reward_cgc} CGC`, inline: true },
    { name: '⚡ Complejidad', value: `Nivel ${task.complexity}`, inline: true },
    { name: '📅 Duración', value: `${task.estimated_days} días`, inline: true },
    { name: '🏷️ Dominio', value: getDomainLabel(task.domain), inline: true },
    { name: '📂 Categoría', value: getCategoryLabel(task.category), inline: true },
    { name: '🔧 Tipo', value: getTypeLabel(task.task_type), inline: true },
  ],
  footer: { text: `ID: ${task.task_id}` },
  timestamp: new Date().toISOString(),
}

const components = [{
  type: 1, // Action Row
  components: [
    {
      type: 2, // Button
      style: 5, // Link
      label: '📋 Ver Detalles',
      url: `https://mbxarts.com/tasks?highlight=${task.task_id}`
    },
    {
      type: 2,
      style: 5,
      label: '🎯 Reclamar Tarea',
      url: `https://mbxarts.com/tasks?claim=${task.task_id}`
    }
  ]
}]
```

---

## 📍 PLAN DE IMPLEMENTACIÓN - 10 FASES

### FASE 0: PREPARACIÓN (30 min)
**Objetivo**: Preparar entorno y backups

```bash
# Acciones:
□ Crear rama: git checkout -b feature/task-system-v2
□ Backup Supabase: pg_dump > backup_$(date +%Y%m%d).sql
□ Documentar estado actual de producción
□ Verificar Discord bot credentials
```

### FASE 1: SCHEMA DATABASE (1-2 horas)
**Objetivo**: Actualizar estructura de datos

```sql
-- Archivo: supabase/migrations/20251219_task_taxonomy.sql

-- 1. Add new columns
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS domain TEXT DEFAULT 'development';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS task_type TEXT DEFAULT 'feature';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS discord_message_id TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS discord_thread_id TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN DEFAULT false;

-- 2. Create indexes
CREATE INDEX IF NOT EXISTS idx_tasks_domain ON tasks(domain);
CREATE INDEX IF NOT EXISTS idx_tasks_featured ON tasks(is_featured) WHERE is_featured = true;

-- 3. Update existing tasks with domain inference
UPDATE tasks SET domain =
  CASE
    WHEN category IN ('frontend', 'backend', 'mobile', 'blockchain', 'ai', 'defi', 'nft', 'performance', 'testing', 'infrastructure') THEN 'development'
    WHEN category IN ('documentation', 'localization') THEN 'documentation'
    WHEN category IN ('social', 'notifications', 'gamification') THEN 'community'
    WHEN category IN ('governance', 'treasury', 'compliance', 'analytics') THEN 'governance'
    WHEN category IN ('integration', 'automation', 'algorithm', 'search', 'security') THEN 'operations'
    ELSE 'development'
  END
WHERE domain IS NULL;
```

**Verificación**:
```bash
□ Run migration in Supabase dashboard
□ Verify columns exist: SELECT * FROM tasks LIMIT 1;
□ Check domain distribution: SELECT domain, COUNT(*) FROM tasks GROUP BY domain;
```

### FASE 2: TYPES & CONSTANTS (1 hora)
**Objetivo**: Actualizar tipos TypeScript

**Archivos a modificar**:
- `lib/supabase/types.ts` - Add TaskDomain, TaskType
- `lib/tasks/task-constants.ts` - NEW: Domain/Category/Type configs
- `lib/tasks/task-service.ts` - Update INITIAL_TASKS with domain/type

```typescript
// lib/tasks/task-constants.ts (NUEVO)
export const TASK_DOMAINS = {
  development: { emoji: '💻', label: 'Development', labelEs: 'Desarrollo', color: '#3B82F6' },
  documentation: { emoji: '📚', label: 'Documentation', labelEs: 'Documentación', color: '#10B981' },
  design: { emoji: '🎨', label: 'Design', labelEs: 'Diseño', color: '#F59E0B' },
  community: { emoji: '👥', label: 'Community', labelEs: 'Comunidad', color: '#EC4899' },
  governance: { emoji: '🏛️', label: 'Governance', labelEs: 'Gobernanza', color: '#8B5CF6' },
  operations: { emoji: '🔧', label: 'Operations', labelEs: 'Operaciones', color: '#6366F1' },
} as const

export const TASK_CATEGORIES = {
  // Development
  frontend: { domain: 'development', emoji: '🖥️', label: 'Frontend' },
  backend: { domain: 'development', emoji: '⚙️', label: 'Backend' },
  blockchain: { domain: 'development', emoji: '⛓️', label: 'Blockchain' },
  // ... etc
} as const

export const TASK_TYPES = {
  feature: { emoji: '✨', label: 'New Feature', labelEs: 'Nueva Función' },
  bugfix: { emoji: '🐛', label: 'Bug Fix', labelEs: 'Corrección' },
  // ... etc
} as const
```

**Verificación**:
```bash
□ TypeScript compiles: pnpm run build
□ Types exported correctly
□ Constants accessible in components
```

### FASE 3: API ENDPOINTS (2-3 horas)
**Objetivo**: Actualizar APIs para nueva taxonomía

**Archivos a modificar**:
- `app/api/tasks/route.ts` - Add domain/category/type filters
- `app/api/tasks/stats/route.ts` - NEW: Stats by domain
- `app/api/webhooks/supabase/route.ts` - NEW: Database webhooks

```typescript
// app/api/tasks/route.ts - Updated query params
// GET /api/tasks?domain=development&category=frontend&type=feature&featured=true

// app/api/webhooks/supabase/route.ts (NUEVO)
export async function POST(req: Request) {
  const { type, table, record, old_record } = await req.json()

  if (table === 'tasks' && type === 'INSERT') {
    await sendDiscordTaskNotification(record)
  }

  if (table === 'tasks' && type === 'UPDATE') {
    if (old_record.status !== record.status) {
      await sendDiscordStatusUpdate(record, old_record.status)
    }
  }

  return Response.json({ success: true })
}
```

**Verificación**:
```bash
□ Test API: curl "localhost:3000/api/tasks?domain=development"
□ Test filters: curl "localhost:3000/api/tasks?category=frontend&type=feature"
□ Test stats: curl "localhost:3000/api/tasks/stats"
```

### FASE 4: UI COMPONENTS - NAVIGATION (2-3 horas)
**Objetivo**: Crear componentes de navegación por dominio

**Archivos nuevos**:
- `components/tasks/TaskDomainNav.tsx`
- `components/tasks/TaskCategoryChips.tsx`
- `components/tasks/FeaturedTasks.tsx`

```typescript
// components/tasks/TaskDomainNav.tsx
'use client'

import { TASK_DOMAINS } from '@/lib/tasks/task-constants'

interface TaskDomainNavProps {
  selectedDomain: string | null
  onDomainChange: (domain: string | null) => void
  taskCounts: Record<string, number>
}

export function TaskDomainNav({ selectedDomain, onDomainChange, taskCounts }: TaskDomainNavProps) {
  return (
    <div className="glass-panel p-2 rounded-2xl mb-6">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onDomainChange(null)}
          className={`px-4 py-2 rounded-xl transition-all ${!selectedDomain ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white' : 'hover:bg-white/10'}`}
        >
          🎯 All ({Object.values(taskCounts).reduce((a, b) => a + b, 0)})
        </button>
        {Object.entries(TASK_DOMAINS).map(([key, domain]) => (
          <button
            key={key}
            onClick={() => onDomainChange(key)}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
              selectedDomain === key
                ? 'text-white shadow-md'
                : 'hover:bg-white/10'
            }`}
            style={selectedDomain === key ? { background: `linear-gradient(135deg, ${domain.color}, ${domain.color}99)` } : {}}
          >
            <span>{domain.emoji}</span>
            <span>{domain.label}</span>
            <span className="text-xs opacity-75">({taskCounts[key] || 0})</span>
          </button>
        ))}
      </div>
    </div>
  )
}
```

**Verificación**:
```bash
□ Component renders without errors
□ Domain selection updates URL params
□ Task counts display correctly
□ Responsive on mobile
```

### FASE 5: UI COMPONENTS - TASK LIST (2-3 horas)
**Objetivo**: Actualizar TaskList para agrupar por dominio

**Archivos a modificar**:
- `components/tasks/TaskList.tsx` - Add domain grouping
- `components/tasks/TaskCard.tsx` - Add domain/type badges
- `components/tasks/TaskFilters.tsx` - Add new filter options

**Verificación**:
```bash
□ Tasks grouped by domain/category
□ Filters work correctly
□ Search works across all fields
□ Sorting applies correctly
```

### FASE 6: DISCORD WEBHOOKS (2-3 horas)
**Objetivo**: Configurar notificaciones Discord

**Archivos nuevos**:
- `lib/discord/webhook-service.ts`
- `app/api/webhooks/task-created/route.ts`
- `app/api/webhooks/task-claimed/route.ts`
- `app/api/webhooks/task-completed/route.ts`

**Configuración Supabase**:
```sql
-- Create webhook trigger
CREATE OR REPLACE FUNCTION notify_task_change()
RETURNS trigger AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://mbxarts.com/api/webhooks/supabase',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := json_build_object(
      'type', TG_OP,
      'table', TG_TABLE_NAME,
      'record', NEW,
      'old_record', OLD
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tasks_webhook_trigger
AFTER INSERT OR UPDATE ON tasks
FOR EACH ROW EXECUTE FUNCTION notify_task_change();
```

**Verificación**:
```bash
□ Create task → Discord notification appears
□ Claim task → Discord message updates
□ Complete task → Discord celebration post
□ Buttons link correctly to web
```

### FASE 7: DISCORD CHANNELS SETUP (1 hora)
**Objetivo**: Crear canales para tareas en Discord

**Script**: `scripts/setup-discord-task-channels.js`

```javascript
const TASK_CHANNELS = [
  { name: '📋-tareas-disponibles', description: 'New tasks notifications' },
  { name: '🔥-tareas-urgentes', description: 'Urgent and featured tasks' },
  { name: '💻-dev-tasks', description: 'Development domain tasks' },
  { name: '📚-docs-tasks', description: 'Documentation tasks' },
  { name: '👥-community-tasks', description: 'Community tasks' },
  { name: '🏆-tareas-completadas', description: 'Completed tasks celebration' },
]
```

**Verificación**:
```bash
□ Run script: node scripts/setup-discord-task-channels.js
□ Channels created with correct permissions
□ Category "🎯 TAREAS" visible
□ Webhook URLs saved to .env.local
```

### FASE 8: i18n TRANSLATIONS (1 hora)
**Objetivo**: Agregar traducciones para nueva taxonomía

**Archivos a modificar**:
- `src/locales/en.json` - Add domain/category/type translations
- `src/locales/es.json` - Add Spanish translations

```json
// en.json additions
{
  "tasks": {
    "domains": {
      "development": "Development",
      "documentation": "Documentation",
      "design": "Design",
      "community": "Community",
      "governance": "Governance",
      "operations": "Operations"
    },
    "types": {
      "feature": "New Feature",
      "bugfix": "Bug Fix",
      "refactor": "Refactor",
      // ...
    },
    "filters": {
      "allDomains": "All Domains",
      "allCategories": "All Categories",
      "allTypes": "All Types"
    }
  }
}
```

**Verificación**:
```bash
□ EN translations complete
□ ES translations complete
□ Language toggle works
□ No missing keys in console
```

### FASE 9: TASK DATA MIGRATION (1-2 horas)
**Objetivo**: Actualizar tareas existentes con nueva taxonomía

**Script**: `scripts/migrate-task-taxonomy.js`

```javascript
// Classify existing tasks based on title/description keywords
const TASK_CLASSIFICATION_RULES = {
  // Keywords → Domain mapping
  'smart contract|solidity|evm|blockchain': 'development',
  'ui|frontend|component|page': 'development',
  'api|backend|database|supabase': 'development',
  'documentation|docs|readme|guide': 'documentation',
  'translation|i18n|localization': 'documentation',
  'twitter|discord|community|social': 'community',
  'governance|dao|proposal|vote': 'governance',
  // ...
}
```

**Verificación**:
```bash
□ Run migration: node scripts/migrate-task-taxonomy.js
□ All tasks have domain assigned
□ Category inference correct
□ Review edge cases manually
```

### FASE 10: TESTING & DEPLOYMENT (2-3 horas)
**Objetivo**: Probar y desplegar a producción

```bash
# Testing checklist
□ Unit tests pass: pnpm test
□ Build succeeds: pnpm build
□ Local testing: pnpm dev
□ Test all filters
□ Test Discord notifications
□ Test claim flow from Discord
□ Test mobile responsiveness

# Deployment
□ Merge to main: git checkout main && git merge feature/task-system-v2
□ Push: git push origin main
□ Vercel auto-deploys
□ Monitor Sentry for errors
□ Test production URLs
□ Announce in Discord
```

---

## 📊 MÉTRICAS DE ÉXITO

| Métrica | Actual | Objetivo |
|---------|--------|----------|
| Tasks filtrados por dominio | 0 | 100% |
| Discord notifications | Manual | Automático |
| Time to claim from Discord | N/A | < 30 segundos |
| Task discoverability | Bajo | Alto (navegación por dominio) |
| i18n coverage | Parcial | 100% |

---

## 📅 CRONOGRAMA ESTIMADO

| Fase | Tiempo Est. | Prioridad |
|------|-------------|-----------|
| Fase 0: Preparación | 30 min | 🔴 Critical |
| Fase 1: Schema | 1-2 h | 🔴 Critical |
| Fase 2: Types | 1 h | 🔴 Critical |
| Fase 3: APIs | 2-3 h | 🔴 Critical |
| Fase 4: UI Nav | 2-3 h | 🟡 High |
| Fase 5: UI List | 2-3 h | 🟡 High |
| Fase 6: Discord Webhooks | 2-3 h | 🟡 High |
| Fase 7: Discord Channels | 1 h | 🟡 High |
| Fase 8: i18n | 1 h | 🟢 Medium |
| Fase 9: Data Migration | 1-2 h | 🟢 Medium |
| Fase 10: Testing | 2-3 h | 🔴 Critical |
| **TOTAL** | **~18-24 horas** | |

---

## 🚀 PRÓXIMOS PASOS INMEDIATOS

1. **AHORA**: Revisar y aprobar este plan
2. **FASE 1**: Ejecutar migración de schema en Supabase
3. **FASE 2**: Crear archivo `task-constants.ts`
4. **CONTINUAR**: Seguir fases en orden

---

**© 2024-2025 CryptoGift Wallets DAO. All rights reserved.**

Made with ❤️ and maximum quality by Claude Opus 4.5

---

**END OF MASTER PLAN**
