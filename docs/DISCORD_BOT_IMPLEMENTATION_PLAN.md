# Discord Bot Bidireccional - Plan de Implementación

## Estado: EN DESARROLLO

**Fecha de inicio**: 19 Diciembre 2025
**Objetivo**: Sistema bidireccional Discord ↔ Web para propuestas y gestión de tareas

---

## FASES DE IMPLEMENTACIÓN

### FASE 1: Configuración Discord Application ⏳
**Duración estimada**: 30 minutos
**Requiere acción manual**: SÍ (crear app en Discord Developer Portal)

- [ ] Crear Discord Application
- [ ] Configurar Interactions Endpoint URL
- [ ] Registrar Slash Commands
- [ ] Obtener Bot Token y Application ID
- [ ] Configurar variables de entorno

### FASE 2: Base de Datos ⏳
**Duración estimada**: 20 minutos
**Requiere acción manual**: NO

- [ ] Crear tabla `task_proposals`
- [ ] Crear tabla `proposal_votes`
- [ ] Crear tabla `discord_user_links`
- [ ] Añadir campos Discord a tabla `tasks`
- [ ] Crear funciones y triggers

### FASE 3: API Endpoints ⏳
**Duración estimada**: 2-3 horas
**Requiere acción manual**: NO

- [ ] `/api/discord/interactions` - Manejar comandos de Discord
- [ ] `/api/discord/verify` - Verificar firma de Discord
- [ ] `/api/proposals` - CRUD propuestas
- [ ] `/api/proposals/vote` - Sistema de votación
- [ ] `/api/proposals/approve` - Aprobación de moderadores

### FASE 4: Slash Commands ⏳
**Duración estimada**: 2-3 horas
**Requiere acción manual**: NO

- [ ] `/propose` - Crear propuesta de tarea
- [ ] `/tasks` - Listar tareas disponibles
- [ ] `/claim [task_id]` - Reclamar tarea
- [ ] `/vote [proposal_id] [up/down]` - Votar propuesta
- [ ] `/approve [proposal_id]` - Aprobar propuesta (solo mods)
- [ ] `/my-tasks` - Ver mis tareas asignadas
- [ ] `/help` - Ayuda del bot

### FASE 5: Componentes Interactivos ⏳
**Duración estimada**: 1-2 horas
**Requiere acción manual**: NO

- [ ] Botones de votación (✅ Aprobar / ❌ Rechazar)
- [ ] Select menus para categorías
- [ ] Modales para formularios de propuesta
- [ ] Embeds con información de tareas

### FASE 6: Webhooks Bidireccionales ⏳
**Duración estimada**: 1 hora
**Requiere acción manual**: NO

- [ ] Webhook: Nueva tarea → #recently-added
- [ ] Webhook: Tarea reclamada → #task-updates
- [ ] Webhook: Propuesta aprobada → #announcements
- [ ] Webhook: Tarea completada → #achievements

### FASE 7: AI Refinement ⏳
**Duración estimada**: 1-2 horas
**Requiere acción manual**: NO

- [ ] Integrar GPT para refinar descripciones
- [ ] Auto-estimar recompensa CGC
- [ ] Sugerir categoría y dominio
- [ ] Detectar duplicados

### FASE 8: Panel Web de Propuestas ⏳
**Duración estimada**: 2 horas
**Requiere acción manual**: NO

- [ ] Página `/proposals` para ver propuestas
- [ ] Sistema de votación web
- [ ] Sincronización con Discord
- [ ] Panel admin para aprobar

---

## VARIABLES DE ENTORNO REQUERIDAS

```env
# Discord Bot (NUEVAS)
DISCORD_APPLICATION_ID=
DISCORD_PUBLIC_KEY=
DISCORD_BOT_TOKEN=
DISCORD_GUILD_ID=1440971032818090006

# Canales específicos
DISCORD_CHANNEL_RECENTLY_ADDED=
DISCORD_CHANNEL_TASK_UPDATES=
DISCORD_CHANNEL_PROPOSALS=

# Roles
DISCORD_ROLE_MODERATOR=
DISCORD_ROLE_VERIFIED=
```

---

## ESTRUCTURA DE ARCHIVOS

```
lib/discord/
├── bot/
│   ├── commands/
│   │   ├── propose.ts
│   │   ├── tasks.ts
│   │   ├── claim.ts
│   │   ├── vote.ts
│   │   ├── approve.ts
│   │   └── help.ts
│   ├── components/
│   │   ├── buttons.ts
│   │   ├── modals.ts
│   │   ├── embeds.ts
│   │   └── select-menus.ts
│   ├── handlers/
│   │   ├── interaction-handler.ts
│   │   ├── button-handler.ts
│   │   └── modal-handler.ts
│   └── utils/
│       ├── verify-signature.ts
│       ├── register-commands.ts
│       └── discord-api.ts
├── webhooks/
│   ├── task-notifications.ts (existente)
│   └── channel-sync.ts (nuevo)
└── types.ts

app/api/discord/
├── interactions/route.ts
├── register-commands/route.ts
└── sync/route.ts

app/proposals/
├── page.tsx
└── [id]/page.tsx

supabase/migrations/
└── 20251219_discord_proposals_system.sql
```

---

## ESQUEMA DE BASE DE DATOS

### Tabla: task_proposals
```sql
CREATE TABLE task_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,

  -- Origen
  source TEXT NOT NULL CHECK (source IN ('discord', 'web')),
  proposed_by_wallet TEXT,
  proposed_by_discord_id TEXT,
  proposed_by_discord_username TEXT,

  -- Discord threading
  discord_message_id TEXT,
  discord_channel_id TEXT,
  discord_thread_id TEXT,

  -- Votación
  votes_up INTEGER DEFAULT 0,
  votes_down INTEGER DEFAULT 0,

  -- Categorización (sugerida por AI o usuario)
  suggested_domain TEXT,
  suggested_category TEXT,
  suggested_reward INTEGER,
  suggested_complexity INTEGER,

  -- AI Refinement
  ai_refined_title TEXT,
  ai_refined_description TEXT,
  ai_analysis TEXT,

  -- Estado
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'voting', 'approved', 'rejected', 'converted')),

  -- Aprobación
  approved_by_wallet TEXT,
  approved_by_discord_id TEXT,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,

  -- Task resultante
  resulting_task_id UUID REFERENCES dao_tasks(id),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_proposals_status ON task_proposals(status);
CREATE INDEX idx_proposals_discord_msg ON task_proposals(discord_message_id);
```

### Tabla: proposal_votes
```sql
CREATE TABLE proposal_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID REFERENCES task_proposals(id) ON DELETE CASCADE,

  -- Votante
  voter_wallet TEXT,
  voter_discord_id TEXT,

  -- Voto
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),

  -- Metadata
  source TEXT NOT NULL CHECK (source IN ('discord', 'web')),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Un voto por usuario por propuesta
  UNIQUE(proposal_id, voter_wallet),
  UNIQUE(proposal_id, voter_discord_id)
);
```

### Tabla: discord_user_links
```sql
CREATE TABLE discord_user_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL UNIQUE,
  discord_id TEXT NOT NULL UNIQUE,
  discord_username TEXT,
  discord_avatar TEXT,

  -- Verificación
  verified_at TIMESTAMPTZ,
  verification_code TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## FLUJO DE COMANDOS

### /propose
```
Usuario: /propose title:"Crear landing page" description:"Necesitamos..."

Bot responde con embed:
┌─────────────────────────────────────────┐
│ 📝 Nueva Propuesta de Tarea             │
│                                         │
│ **Crear landing page**                  │
│ Necesitamos una landing page moderna... │
│                                         │
│ 👤 Propuesto por: @usuario              │
│ 📊 Votos: 0 ✅ | 0 ❌                    │
│ 📁 Categoría: Por definir               │
│ 💰 Recompensa sugerida: Pendiente       │
│                                         │
│ [✅ Votar a favor] [❌ Votar en contra] │
│ [🔧 Sugerir cambios] [📋 Ver detalles] │
└─────────────────────────────────────────┘

// Se crea thread automático para discusión
// AI analiza y sugiere categoría + recompensa
```

### /tasks
```
Usuario: /tasks

Bot responde:
┌─────────────────────────────────────────┐
│ 📋 Tareas Disponibles (5)               │
│                                         │
│ 1. 🔥 [URGENT] Fix login bug            │
│    💰 500 CGC | ⭐ Nivel 3 | ⏱️ 2 días  │
│    [Reclamar]                           │
│                                         │
│ 2. ⭐ [FEATURED] Diseño nuevo logo      │
│    💰 1,000 CGC | ⭐ Nivel 5 | ⏱️ 5 días│
│    [Reclamar]                           │
│                                         │
│ 3. Documentar API endpoints             │
│    💰 300 CGC | ⭐ Nivel 2 | ⏱️ 3 días  │
│    [Reclamar]                           │
│                                         │
│ [◀️ Anterior] Página 1/2 [Siguiente ▶️] │
│ [🔍 Filtrar por categoría]              │
└─────────────────────────────────────────┘
```

### /claim
```
Usuario: /claim task_id:CGC-042

Bot responde:
┌─────────────────────────────────────────┐
│ ✅ ¡Tarea Reclamada!                    │
│                                         │
│ **Documentar API endpoints**            │
│ ID: CGC-042                             │
│                                         │
│ 💰 Recompensa: 300 CGC                  │
│ ⏱️ Tiempo límite: 3 días                │
│ 📅 Fecha límite: 22 Dic 2025            │
│                                         │
│ 📝 Próximos pasos:                      │
│ 1. Completa la tarea                    │
│ 2. Sube evidencia en la web             │
│ 3. Espera validación                    │
│                                         │
│ [📤 Subir evidencia] [❌ Abandonar]     │
└─────────────────────────────────────────┘

// También notifica en #task-updates
```

---

## PENDIENTES PARA HOSTING 24/7 (FUTURO)

Cuando el proyecto tenga más tracción, migrar a:

### Opción 1: Railway ($5/mes)
- Deploy con un click desde GitHub
- Soporte nativo para Node.js bots
- Logs en tiempo real

### Opción 2: Render ($7/mes)
- Similar a Railway
- Mejor para proyectos más grandes

### Opción 3: VPS (DigitalOcean $4/mes)
- Máximo control
- Requiere más configuración

**Por ahora**: Usamos Interactions Endpoint de Discord (gratis en Vercel)

---

## PRÓXIMOS PASOS INMEDIATOS

1. ✅ Crear este documento de plan
2. ⏳ Fase 1: Configurar Discord Application (requiere acción manual)
3. ⏳ Fase 2: Crear migraciones de base de datos
4. ⏳ Fase 3: Implementar API endpoints
5. ⏳ Continuar con resto de fases...

---

*Documento creado: 19 Dic 2025*
*Última actualización: 19 Dic 2025*
