# 🔗 GUÍA COMPLETA - SISTEMA DE PERMANENT SPECIAL INVITES

## 📋 RESUMEN EJECUTIVO

El sistema de **Permanent Special Invites** es una evolución del sistema de invites especiales que permite crear enlaces permanentes de referidos con las siguientes características:

### ✨ **Características Principales**

| Característica | Special Invites (Legacy) | Permanent Invites (NUEVO) |
|----------------|-------------------------|---------------------------|
| **Duración** | Limitado (expira) | ✅ Permanente (nunca expira) |
| **Usos** | 1 solo usuario | ✅ Ilimitados usuarios |
| **Tracking** | Solo el primero | ✅ TODOS los usuarios |
| **Analytics** | Básico | ✅ Completo (clicks, conversiones, etc.) |
| **Signup Bonus** | ❌ No integrado | ✅ 200 CGC + comisiones automáticas |
| **Historial** | No disponible | ✅ Ver todos los usuarios que usaron el link |

---

## 🏗️ ARQUITECTURA DEL SISTEMA

```
┌─────────────────────────────────────────────────────────┐
│         PERMANENT SPECIAL INVITES SYSTEM                │
│         (Enterprise-Grade Multi-Use System)              │
└─────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
  ┌─────▼──────┐     ┌─────▼──────┐     ┌─────▼──────┐
  │  Database  │     │    APIs     │     │ Integration│
  │   Tables   │     │  Endpoints  │     │  Services  │
  └────────────┘     └─────────────┘     └────────────┘
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────────────────────────────────────────────────┐
│  permanent_special_invites                               │
│  - Invite metadata y configuración                       │
│  - Analytics en tiempo real                              │
│  - Password protection opcional                          │
└──────────────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────────┐
│  permanent_special_invite_claims                         │
│  - Tracking de TODOS los usuarios                       │
│  - Signup bonus information                             │
│  - Session tracking (IP, user agent, source)            │
└──────────────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────────┐
│  referrals (tabla actualizada)                           │
│  + source_permanent_invite (NUEVO campo)                 │
│  → Indica de qué enlace permanente vino cada usuario    │
└──────────────────────────────────────────────────────────┘
```

---

## 🗄️ ESTRUCTURA DE BASE DE DATOS

### **Tabla 1: permanent_special_invites**

Almacena la configuración de cada enlace permanente.

```sql
CREATE TABLE permanent_special_invites (
  id uuid PRIMARY KEY,
  invite_code text UNIQUE NOT NULL,        -- PI-TIMESTAMP-RANDOM
  referrer_wallet text NOT NULL,           -- Wallet del creador
  referrer_code text,                      -- Código de referido del creador
  custom_message text,                     -- Mensaje personalizado
  custom_title text,                       -- Título personalizado
  image_url text,                          -- Imagen custom
  password_hash text,                      -- Hash SHA-256 (opcional)
  status text DEFAULT 'active',            -- active | paused | disabled
  never_expires boolean DEFAULT true,      -- Permanente por defecto
  expires_at timestamptz,                  -- Fecha expiración (si never_expires=false)
  max_claims integer,                      -- Máximo de claims (null = ilimitado)

  -- Analytics (actualizados automáticamente)
  total_clicks integer DEFAULT 0,
  total_claims integer DEFAULT 0,
  total_completed integer DEFAULT 0,
  conversion_rate numeric(5,2) DEFAULT 0.00,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_claimed_at timestamptz,

  metadata jsonb
);
```

**Índices:**
- `idx_permanent_invites_code` - Búsqueda por código
- `idx_permanent_invites_referrer` - Búsqueda por creador
- `idx_permanent_invites_status` - Filtrado por estado
- `idx_permanent_invites_created` - Ordenamiento por fecha

### **Tabla 2: permanent_special_invite_claims**

Registra CADA usuario que usa el enlace (multi-tracking).

```sql
CREATE TABLE permanent_special_invite_claims (
  id uuid PRIMARY KEY,
  invite_code text NOT NULL,
  claimed_by_wallet text NOT NULL,
  referrer_wallet text,
  referrer_code text,

  -- Flow completion tracking
  education_completed boolean DEFAULT false,
  wallet_connected boolean DEFAULT false,
  profile_created boolean DEFAULT false,
  signup_bonus_claimed boolean DEFAULT false,

  -- Bonus info
  bonus_amount numeric(20,2) DEFAULT 0,
  bonus_tx_hash text,
  bonus_claimed_at timestamptz,

  -- Session tracking
  ip_hash text,
  user_agent text,
  source text,
  campaign text,

  -- Timestamps
  clicked_at timestamptz,
  claimed_at timestamptz DEFAULT now(),
  completed_at timestamptz,

  metadata jsonb,

  -- Constraints
  UNIQUE(invite_code, claimed_by_wallet)  -- Previene duplicados
);
```

**Índices:**
- `idx_permanent_claims_code` - Búsqueda por código
- `idx_permanent_claims_wallet` - Búsqueda por wallet
- `idx_permanent_claims_referrer` - Búsqueda por referrer
- `idx_permanent_claims_completed` - Filtrado por completados
- `idx_permanent_claims_claimed_at` - Ordenamiento por fecha

---

## 🔌 APIs DISPONIBLES

### **1. Crear Permanent Invite**

```typescript
POST /api/referrals/permanent-invite

Body:
{
  "referrerWallet": "0x...",        // REQUERIDO
  "referrerCode": "CG-XXXXXX",      // REQUERIDO
  "customMessage": "Welcome!",       // Opcional
  "customTitle": "Exclusive Invite", // Opcional
  "password": "secret123",           // Opcional
  "image": "https://...",            // Opcional
  "maxClaims": 100,                  // Opcional (null = ilimitado)
  "neverExpires": true               // Default: true
}

Response (Success):
{
  "success": true,
  "inviteCode": "PI-L5X2C3-A1B2C3D4E5F6",
  "invite": { ... },
  "url": "https://yourapp.com/permanent-invite/PI-L5X2C3-A1B2C3D4E5F6"
}
```

### **2. Obtener Detalles del Invite**

```typescript
GET /api/referrals/permanent-invite?code=PI-XXXXXX&wallet=0x... (opcional)

Response (Success):
{
  "success": true,
  "invite": {
    "code": "PI-L5X2C3-A1B2C3D4E5F6",
    "referrerCode": "CG-XXXXXX",
    "customMessage": "Welcome!",
    "customTitle": "Exclusive Invite",
    "hasPassword": false,
    "neverExpires": true,
    "maxClaims": null,
    "totalClaims": 15,
    "totalCompleted": 12,
    "conversionRate": 80.00,
    "status": "active"
  },
  "alreadyClaimed": false,  // Si se proporcionó wallet
  "recentClaims": [...]
}
```

### **3. Reclamar Permanent Invite**

```typescript
POST /api/referrals/permanent-invite/claim

Body:
{
  "code": "PI-XXXXXX",
  "claimedBy": "0x...",
  "source": "twitter",      // Opcional
  "campaign": "launch",     // Opcional
  "ipHash": "...",          // Opcional
  "userAgent": "..."        // Opcional
}

Response (Success):
{
  "success": true,
  "message": "Invite claimed successfully",
  "claimId": "..."
}

Response (Already Claimed):
{
  "success": true,
  "alreadyClaimed": true,
  "message": "You have already claimed this invite"
}
```

### **4. Ver Historial Completo**

```typescript
GET /api/referrals/permanent-invite/history?code=PI-XXXXXX&limit=50&offset=0

Response (Success):
{
  "success": true,
  "invite": { ... },
  "analytics": {
    "totalClicks": 100,
    "totalClaims": 50,
    "totalCompleted": 40,
    "conversionRate": 40.00,
    "bonusClaimedCount": 38,
    "totalBonusDistributed": 8930,  // CGC
    "sourceBreakdown": {
      "twitter": 25,
      "discord": 15,
      "direct": 10
    }
  },
  "claims": [
    {
      "wallet": "0x...",
      "claimedAt": "2025-12-04T...",
      "completedAt": "2025-12-04T...",
      "completed": true,
      "signupBonusClaimed": true,
      "bonusAmount": 235,
      "bonusTxHash": "0x...",
      "source": "twitter"
    },
    ...
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

### **5. Verificar Password (si el invite está protegido)**

```typescript
POST /api/referrals/permanent-invite/verify-password

Body:
{
  "code": "PI-XXXXXX",
  "password": "secret123"
}

Response (Success):
{
  "success": true,
  "verified": true,
  "message": "Password verified successfully"
}

Response (Incorrect):
{
  "success": false,
  "verified": false,
  "error": "Incorrect password"
}
```

---

## 🎯 INTEGRACIÓN CON SIGNUP BONUS

El sistema está **completamente integrado** con el sistema de signup bonus automático:

### **Flujo Completo:**

1. **Usuario hace click** en enlace permanente `PI-XXXXXX`
2. **Sistema registra click** (incrementa `total_clicks`)
3. **Usuario completa onboarding** (wallet + educación)
4. **Sistema crea claim record** en `permanent_special_invite_claims`
5. **Sistema distribuye bonos automáticamente:**
   - ✅ **Nuevo usuario**: 200 CGC
   - ✅ **Referrer Level 1**: 20 CGC (10%)
   - ✅ **Referrer Level 2**: 10 CGC (5%)
   - ✅ **Referrer Level 3**: 5 CGC (2.5%)
   - ✅ **TOTAL**: Hasta 235 CGC distribuidos
6. **Sistema actualiza claim record** con bonus info:
   - `signup_bonus_claimed`: true
   - `bonus_amount`: 235
   - `bonus_tx_hash`: "0x..."
   - `bonus_claimed_at`: timestamp
7. **Sistema crea referral relationship** en tabla `referrals`:
   - `source_permanent_invite`: "PI-XXXXXX"
   - `source`: "permanent_invite"
   - `campaign`: código del invite

### **Servicio de Integración:**

```typescript
import { completePermanentInviteSignup } from '@/lib/referrals/permanent-invite-integration-service';

// Llamar después de que el usuario complete el onboarding
const result = await completePermanentInviteSignup(
  'PI-XXXXXX',
  '0xuserWallet'
);

// Result:
{
  success: true,
  permanentInviteCode: 'PI-XXXXXX',
  walletAddress: '0x...',
  referralCreated: true,
  bonusDistributed: true,
  bonusAmount: 235,
  bonusTxHashes: ['0x...', '0x...'],
  errors: []
}
```

---

## 📊 ANALYTICS Y TRACKING

### **Funciones Helper SQL:**

```sql
-- Obtener estadísticas completas
SELECT get_permanent_invite_stats('PI-XXXXXX');

-- Verificar si wallet ya reclamó
SELECT has_claimed_permanent_invite('PI-XXXXXX', '0xwallet');

-- Incrementar contador de clicks (llamado automáticamente)
SELECT increment_permanent_invite_clicks('PI-XXXXXX');
```

### **Triggers Automáticos:**

1. **`trigger_update_permanent_invite_counters`**
   - Se dispara: Al insertar nuevo claim
   - Acción: Incrementa `total_claims`, actualiza `conversion_rate`

2. **`trigger_update_permanent_invite_completed`**
   - Se dispara: Al marcar claim como completado
   - Acción: Incrementa `total_completed`, actualiza `conversion_rate`

---

## 🔐 SEGURIDAD

### **Row Level Security (RLS)**

```sql
-- Invites: Cualquiera puede leer los activos
CREATE POLICY "Anyone can read active invites"
ON permanent_special_invites FOR SELECT
USING (status = 'active');

-- Claims: Solo puedes ver tus propios claims
CREATE POLICY "Users can read their own claims"
ON permanent_special_invite_claims FOR SELECT
USING (claimed_by_wallet = current_user_wallet);

-- Service role: Acceso completo a todo
CREATE POLICY "Service role full access" FOR ALL
USING (true) WITH CHECK (true);
```

### **Validaciones:**

- ✅ Formato de wallet: `^0x[a-fA-F0-9]{40}$`
- ✅ Formato de código: `^PI-[A-Z0-9]+-[A-F0-9]+$`
- ✅ Password: SHA-256 hash
- ✅ Unique constraint: (invite_code, claimed_by_wallet)

---

## 🚀 CÓMO USAR EL SISTEMA

### **Para Usuarios (Crear Permanent Invite):**

1. Ve a tu dashboard de referidos
2. Click en "Crear Permanent Invite" (próximamente)
3. Personaliza tu invite (mensaje, título, password opcional)
4. Copia el enlace: `https://app.com/permanent-invite/PI-XXXXXX`
5. Comparte en redes sociales, Discord, Telegram, etc.
6. **Ver analytics en tiempo real** de cuántas personas usaron tu link

### **Para Nuevos Usuarios:**

1. Click en enlace permanente que recibiste
2. Si tiene password, ingrésalo
3. Completa el onboarding (wallet + educación)
4. **Recibe automáticamente 200 CGC** 🎁
5. El creador del enlace recibe comisiones automáticamente

---

## 🎨 FRONTEND COMPONENTS

### **Página Landing**

```typescript
// app/permanent-invite/[code]/page.tsx
export default function PermanentInvitePage() {
  // Carga datos del invite
  // Valida disponibilidad
  // Muestra flow de onboarding
  // Integra con signup bonus
}
```

### **Componente Flow** (Reutiliza SpecialInviteFlow)

```typescript
<SpecialInviteFlow
  inviteData={inviteData}
  onClaimComplete={handleClaimComplete}
  isPermanent={true}  // Flag para usar permanent invite API
/>
```

---

## 📈 DIFERENCIAS CON SPECIAL INVITES LEGACY

| Aspecto | Special Invites | Permanent Invites |
|---------|----------------|-------------------|
| **Tabla** | `special_invites` | `permanent_special_invites` |
| **Claims** | Marca como "claimed" | Crea registro por cada usuario |
| **Expiración** | 30 días | Nunca (configurable) |
| **Tracking** | Solo primero | TODOS los usuarios |
| **Analytics** | No disponible | Completo y en tiempo real |
| **Signup Bonus** | No integrado | Automático |
| **API** | `/api/referrals/special-invite` | `/api/referrals/permanent-invite` |
| **URL** | `/special-invite/SI-XXX` | `/permanent-invite/PI-XXX` |

---

## ✅ TESTING

### **Test Manual:**

1. **Crear Invite:**
   ```bash
   curl -X POST https://yourapp.com/api/referrals/permanent-invite \
     -H "Content-Type: application/json" \
     -d '{
       "referrerWallet": "0xYourWallet",
       "referrerCode": "CG-XXXXXX"
     }'
   ```

2. **Obtener Detalles:**
   ```bash
   curl https://yourapp.com/api/referrals/permanent-invite?code=PI-XXXXXX
   ```

3. **Reclamar:**
   ```bash
   curl -X POST https://yourapp.com/api/referrals/permanent-invite/claim \
     -H "Content-Type: application/json" \
     -d '{
       "code": "PI-XXXXXX",
       "claimedBy": "0xNewUserWallet"
     }'
   ```

4. **Ver Historial:**
   ```bash
   curl https://yourapp.com/api/referrals/permanent-invite/history?code=PI-XXXXXX
   ```

---

## 🐛 TROUBLESHOOTING

### **Error: "Invite not found"**
- Verifica que el código sea correcto (case-sensitive)
- Verifica que las tablas se crearon en Supabase
- Verifica que el invite existe: `SELECT * FROM permanent_special_invites WHERE invite_code = 'PI-XXX';`

### **Error: "Already claimed"**
- Es correcto si el mismo wallet intenta reclamar dos veces
- Cada wallet solo puede reclamar una vez por invite

### **Signup bonus no se distribuyó**
- Verifica que el deployer wallet tenga CGC tokens suficientes
- Verifica que el deployer wallet tenga ETH para gas
- Revisa logs en `/api/referrals/permanent-invite/claim`

### **Contadores no se actualizan**
- Verifica que los triggers están creados:
  ```sql
  SELECT trigger_name FROM information_schema.triggers
  WHERE trigger_name LIKE '%permanent%';
  ```

---

## 📚 RECURSOS ADICIONALES

### **Archivos Importantes:**

- 📄 SQL Migration: `scripts/supabase/create-permanent-invites-system.sql`
- 📄 Tracking Migration: `scripts/supabase/add-permanent-invite-tracking.sql`
- 📄 TypeScript Types: `lib/supabase/types.ts`
- 📄 Integration Service: `lib/referrals/permanent-invite-integration-service.ts`
- 📄 Main API: `app/api/referrals/permanent-invite/route.ts`
- 📄 Claim API: `app/api/referrals/permanent-invite/claim/route.ts`
- 📄 History API: `app/api/referrals/permanent-invite/history/route.ts`
- 📄 Frontend Page: `app/permanent-invite/[code]/page.tsx`

---

## 🎉 CONCLUSIÓN

El sistema de **Permanent Special Invites** proporciona una solución enterprise-grade para:

✅ Crear enlaces permanentes de referidos
✅ Tracking completo de múltiples usuarios
✅ Analytics en tiempo real
✅ Integración automática con signup bonus
✅ Escalabilidad ilimitada
✅ Seguridad con RLS y validaciones

**El sistema está listo para producción** 🚀

---

*Creado: 2025-12-05*
*Versión: 1.0.0*
*Autor: CryptoGift DAO Team*
