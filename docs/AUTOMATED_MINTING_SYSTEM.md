# 🤖 AUTOMATED MILESTONE-BASED MINTING SYSTEM

**Status**: 📋 DISEÑADO - Listo para Implementación
**Priority**: 🔥 ALTA - Objetivo a Corto Plazo
**Version**: 1.0
**Last Updated**: 7 Diciembre 2025

Made by mbxarts.com The Moon in a Box property

---

## 📋 RESUMEN EJECUTIVO

Sistema completamente automatizado que permite:
- ✅ Votación descentralizada de tareas via Discord/Telegram
- ✅ Generación automática de tareas aprobadas por la comunidad
- ✅ Claim y firma criptográfica de tareas
- ✅ Validación administrativa con EIP-712
- ✅ **Minting automático semanal** basado en milestones completados
- ✅ Distribución on-chain transparente y auditable

---

## 🏗️ ARQUITECTURA DEL SISTEMA

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTOMATED MINTING SYSTEM                     │
└─────────────────────────────────────────────────────────────────┘

FASE 1: GENERACIÓN DE TAREAS (Task Generation)
════════════════════════════════════════════════
┌────────────────┐
│ Discord/Telegram│
│   Bot Listener  │──┐
└────────────────┘   │
                     │
┌────────────────┐   │    ┌──────────────────────┐
│   DAO Proposal │───┼───▶│ Task Generator       │
│   On-chain     │   │    │ Microservice         │
└────────────────┘   │    └──────────────────────┘
                     │              │
┌────────────────┐   │              │
│  Manual Admin  │───┘              ▼
│   Interface    │           ┌──────────────────┐
└────────────────┘           │   Supabase DB    │
                             │   tasks table    │
                             └──────────────────┘

FASE 2: DISTRIBUCIÓN Y NOTIFICACIÓN (Distribution)
══════════════════════════════════════════════════
┌──────────────────┐
│   Supabase DB    │
│   tasks table    │
└──────────────────┘
         │
         ├──────────────┬──────────────┬──────────────┐
         ▼              ▼              ▼              ▼
┌──────────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ Task Page    │ │ Discord  │ │ Telegram │ │  Email   │
│ /task        │ │  Bot     │ │   Bot    │ │  Queue   │
│ (Real-time)  │ │ (Webhook)│ │ (Webhook)│ │ (SendGrid│
└──────────────┘ └──────────┘ └──────────┘ └──────────┘

FASE 3: CLAIM Y FIRMA (Task Claim & Signature)
═══════════════════════════════════════════════
Usuario → TaskClaimFlow → EIP-712 Signature → Supabase DB

FASE 4: COMPLETACIÓN Y VALIDACIÓN (Task Completion)
════════════════════════════════════════════════════
Usuario sube evidencia → Admin Validation Panel → EIP-712 Admin Signature → validated_tasks

FASE 5: AUTOMATED MINTING & DISTRIBUTION (The Magic)
═════════════════════════════════════════════════════
Cron Semanal → Query validated_tasks → MilestoneEscrow.mintForMilestone()
→ CGC.mint() → CGC.transfer() → Update DB → EAS Attestation
```

---

## 📊 COMPONENTES TÉCNICOS

### 1. Task Voting Bot (Discord/Telegram)
**Archivo**: `lib/bots/task-voting-bot.ts`

```typescript
interface TaskProposal {
  title: string;
  description: string;
  estimatedReward: number;
  complexity: 1 | 2 | 3 | 4 | 5;
  deadline: Date;
  milestoneCategory: 'platform_dev' | 'community' | 'revenue';
}

async function handleChannelVote(message: DiscordMessage | TelegramMessage) {
  // 1. Parse proposal from message
  const proposal = parseTaskProposal(message.content);

  // 2. Create voting reaction/buttons
  const voteId = await createVotingPoll(proposal);

  // 3. Wait for voting period (24-48 hours)
  const approved = await checkVotingResult(voteId);

  // 4. If approved, create task in database
  if (approved) {
    await createTask(proposal);
    await notifyChannels(proposal);
    await postToTaskPage(proposal);
  }
}
```

### 2. Task Generator API
**Archivo**: `app/api/tasks/generate/route.ts`

```typescript
export async function POST(req: Request) {
  const { source, proposal } = await req.json();

  // Validate proposal structure
  const validatedProposal = TaskProposalSchema.parse(proposal);

  // Insert into Supabase
  const { data: task } = await supabase
    .from('tasks')
    .insert({
      title: validatedProposal.title,
      description: validatedProposal.description,
      estimated_reward: validatedProposal.estimatedReward,
      complexity: validatedProposal.complexity,
      deadline: validatedProposal.deadline,
      status: 'available',
      milestone_category: validatedProposal.milestoneCategory,
      source: source, // 'discord_vote', 'dao_proposal', 'admin'
      created_at: new Date()
    })
    .select()
    .single();

  // Trigger notifications
  await Promise.all([
    sendDiscordNotification(task),
    sendTelegramNotification(task),
    sendEmailNotification(task),
    revalidatePath('/task')
  ]);

  return NextResponse.json({ success: true, task });
}
```

### 3. Real-Time Task Page
**Archivo**: `app/task/page.tsx`

```typescript
'use client';

export default function TaskPage() {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    // Subscribe to real-time task updates
    const subscription = supabase
      .channel('tasks_channel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tasks'
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setTasks(prev => [payload.new, ...prev]);
          toast.success('¡Nueva tarea disponible!');
        }
      })
      .subscribe();

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div>
      <TaskFilters />
      <TaskGrid tasks={tasks} />
      <TaskClaimModal />
    </div>
  );
}
```

### 4. Automated Minting Cron Job ⭐ (CORE)
**Archivo**: `app/api/cron/weekly-minting/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, createWalletClient, http } from 'viem';
import { base } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

export async function GET(req: NextRequest) {
  // Verify cron secret (Vercel Cron or similar)
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Query all validated tasks not yet paid
    const { data: pendingTasks } = await supabase
      .from('validated_tasks')
      .select('*')
      .eq('payment_status', 'pending')
      .order('validated_at', { ascending: true });

    if (!pendingTasks || pendingTasks.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending tasks to pay'
      });
    }

    // 2. Calculate total CGC needed
    const totalCGC = pendingTasks.reduce((sum, task) => sum + task.reward_amount, 0);

    // 3. Group by milestone category for minting justification
    const milestoneGroups = groupBy(pendingTasks, 'milestone_category');

    // 4. Mint CGC via MilestoneEscrow contract
    const account = privateKeyToAccount(process.env.PRIVATE_KEY_DAO_DEPLOYER as `0x${string}`);
    const walletClient = createWalletClient({
      account,
      chain: base,
      transport: http(process.env.BASE_RPC_URL)
    });

    // Call mintForMilestone function
    const mintTx = await walletClient.writeContract({
      address: '0x8346CFcaECc90d678d862319449E5a742c03f109', // MilestoneEscrow
      abi: MilestoneEscrowABI,
      functionName: 'mintForMilestone',
      args: [
        totalCGC,
        Object.keys(milestoneGroups), // milestone categories
        'Weekly automated minting for completed tasks'
      ]
    });

    await publicClient.waitForTransactionReceipt({ hash: mintTx });

    // 5. Distribute CGC to task completers
    const batchTransfers = await distributeCGCBatch(pendingTasks);

    // 6. Update database: mark tasks as paid
    await supabase
      .from('validated_tasks')
      .update({
        payment_status: 'paid',
        payment_tx_hash: mintTx,
        paid_at: new Date()
      })
      .in('id', pendingTasks.map(t => t.id));

    // 7. Create milestone attestation on EAS
    const attestation = await createMilestoneAttestation({
      milestone_type: 'weekly_tasks_batch',
      total_cgc_minted: totalCGC,
      tasks_count: pendingTasks.length,
      tx_hash: mintTx
    });

    return NextResponse.json({
      success: true,
      minted: totalCGC,
      tasks_paid: pendingTasks.length,
      tx_hash: mintTx,
      attestation_id: attestation.uid
    });

  } catch (error) {
    console.error('Automated minting error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
```

### 5. Vercel Cron Configuration
**Archivo**: `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron/weekly-minting",
      "schedule": "0 0 * * 0"
    }
  ]
}
```

---

## 📊 SUPABASE DATABASE SCHEMA

**Migration**: `supabase/migrations/202512_automated_minting_system.sql`

```sql
-- Tasks table (enhanced)
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  estimated_reward BIGINT NOT NULL, -- CGC amount in wei
  complexity INTEGER CHECK (complexity BETWEEN 1 AND 5),
  deadline TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'available', -- available, claimed, in_progress, submitted, validated, rejected
  milestone_category TEXT NOT NULL, -- platform_dev, community, revenue
  source TEXT NOT NULL, -- discord_vote, dao_proposal, admin
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task claims
CREATE TABLE IF NOT EXISTS task_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  claimer_wallet TEXT NOT NULL,
  claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  signature TEXT NOT NULL, -- EIP-712 signature
  status TEXT NOT NULL DEFAULT 'active' -- active, completed, abandoned
);

-- Validated tasks ready for payment
CREATE TABLE IF NOT EXISTS validated_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  claim_id UUID REFERENCES task_claims(id) ON DELETE CASCADE,
  completer_wallet TEXT NOT NULL,
  reward_amount BIGINT NOT NULL,
  validated_by TEXT NOT NULL, -- admin wallet
  validated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  validation_signature TEXT NOT NULL, -- EIP-712 admin signature
  payment_status TEXT NOT NULL DEFAULT 'pending', -- pending, paid, failed
  payment_tx_hash TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  milestone_category TEXT NOT NULL
);

-- Milestone minting history
CREATE TABLE IF NOT EXISTS milestone_minting_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_cgc_minted BIGINT NOT NULL,
  tasks_count INTEGER NOT NULL,
  milestone_categories TEXT[] NOT NULL,
  tx_hash TEXT NOT NULL,
  attestation_uid TEXT,
  minted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT
);

-- Indexes for performance
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_milestone_category ON tasks(milestone_category);
CREATE INDEX idx_validated_tasks_payment_status ON validated_tasks(payment_status);
CREATE INDEX idx_task_claims_wallet ON task_claims(claimer_wallet);
```

---

## 🎯 FLUJO DE TRABAJO COMPLETO

### 1. Generación de Tarea (Discord/Telegram Vote)
- Usuario propone tarea: `/propose-task "Crear landing page" 500 CGC 3 platform_dev`
- Bot crea encuesta de votación (24h duration)
- Si alcanza quorum (60% approval), bot llama `/api/tasks/generate`
- Tarea aparece instantáneamente en `/task` página via Supabase Realtime

### 2. Usuario Reclama Tarea
- Usuario ve tarea en `/task`
- Click "Claim Task" → Modal de confirmación
- Firma EIP-712 commitment signature
- DB actualiza `task_claims` con firma
- Tarea cambia status: available → claimed

### 3. Usuario Completa Tarea
- Usuario sube evidencia (screenshots, PR link, etc.)
- Submit para validación
- Tarea cambia status: claimed → submitted

### 4. Admin Valida Tarea
- Admin accede `/admin/validation`
- Revisa evidencia
- Aprueba/Rechaza con firma EIP-712
- Si aprueba: DB inserta en `validated_tasks`
- Tarea cambia status: submitted → validated

### 5. Minting Automático Semanal (Domingo 00:00 UTC)
- Vercel Cron trigger `/api/cron/weekly-minting`
- Query todas las `validated_tasks` con `payment_status = pending`
- Calcula total CGC needed
- Mint CGC via `MilestoneEscrow.mintForMilestone()`
- Distribuye CGC a cada `completer_wallet`
- Actualiza DB: `payment_status = paid`
- Crea EAS attestation on-chain para audit trail

### 6. Notificaciones Post-Pago
- Email/Discord/Telegram notify cada usuario
- "¡Recibiste 500 CGC por completar: Crear landing page!"

---

## 🛡️ SEGURIDAD Y GOBERNANZA

### Multi-Signature Requirement
```solidity
// MilestoneEscrow.sol
function mintForMilestone(
  uint256 amount,
  string[] calldata categories,
  string calldata justification
) external onlyAuthorized {
  require(amount <= WEEKLY_CAP, "Exceeds weekly cap");

  if (amount > MULTISIG_THRESHOLD) {
    require(hasMultisigApproval(amount, categories), "Needs multisig");
  }

  cgcToken.mint(address(this), amount);
  emit MilestoneMinted(amount, categories, justification);
}
```

### Rate Limiting
- **Weekly cap**: Max 50,000 CGC per week
- **Monthly rolling cap**: Max 200,000 CGC per month
- **Emergency pause** si se detecta actividad sospechosa

### DAO Override
- DAO puede pausar automated minting via governance proposal
- DAO puede ajustar weekly/monthly caps
- DAO puede invalidar tareas sospechosas

---

## 📈 MÉTRICAS Y MONITORING

```typescript
// Dashboard de Métricas (/admin/metrics)
interface MintingMetrics {
  weekly: {
    cgc_minted: bigint;
    tasks_completed: number;
    unique_contributors: number;
    avg_reward_per_task: number;
  };
  monthly: {
    cgc_minted: bigint;
    tasks_completed: number;
    platform_dev_tasks: number;
    community_tasks: number;
    revenue_tasks: number;
  };
  all_time: {
    total_cgc_minted: bigint;
    total_tasks_completed: number;
    circulating_supply: bigint;
    progress_to_max_supply: number; // percentage
  };
}
```

---

## 🚀 IMPLEMENTACIÓN ROADMAP

### FASE 1 (Semana 1-2): Foundations
- [ ] Crear tablas Supabase (tasks, task_claims, validated_tasks)
- [ ] Implementar Task Generator API (`/api/tasks/generate`)
- [ ] Crear Task Page con real-time updates (`/task`)
- [ ] Implementar Task Claim flow con EIP-712 signatures

### FASE 2 (Semana 3-4): Admin & Validation
- [ ] Implementar Admin Validation Panel (`/admin/validation`)
- [ ] Admin EIP-712 signature flow
- [ ] Evidencia upload system (Supabase Storage)

### FASE 3 (Semana 5-6): Automated Minting
- [ ] Smart Contract: `MilestoneEscrow.mintForMilestone()`
- [ ] Cron Job: `/api/cron/weekly-minting`
- [ ] Batch CGC distribution logic
- [ ] EAS attestation creation

### FASE 4 (Semana 7-8): Bot Integration
- [ ] Discord Bot (voting + notifications)
- [ ] Telegram Bot (voting + notifications)
- [ ] Webhook integrations

### FASE 5 (Semana 9-10): Testing & Deployment
- [ ] Testnet full flow testing
- [ ] Security audit
- [ ] Mainnet deployment
- [ ] Documentation

---

## 💰 PRESUPUESTO ESTIMADO

```
Backend Development (API + Cron): $12,000
Frontend Development (Task UI):   $8,000
Smart Contract Updates:            $6,000
Bot Development (Discord/TG):      $10,000
Testing & QA:                      $4,000
Security Audit:                    $8,000
Documentation:                     $2,000
─────────────────────────────────
TOTAL ESTIMADO:                    $50,000
```

---

## 📞 PRÓXIMOS PASOS

1. **Revisar y aprobar** este diseño
2. **Priorizar fases** según urgencia
3. **Asignar recursos** (desarrolladores, presupuesto)
4. **Iniciar FASE 1** - Foundations
5. **Iterar** basado en feedback

---

**© 2024-2025 The Moon in a Box Inc. All rights reserved.**

Made with ❤️ and maximum quality by Claude Code

---

**END OF DOCUMENTATION**
