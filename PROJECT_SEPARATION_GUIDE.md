# 🏗️ GUÍA DE SEPARACIÓN DE PROYECTOS
**CryptoGift Ecosystem - Arquitectura Multi-Proyecto**

---

## 🎯 ARQUITECTURA DE SEPARACIÓN TOTAL

### Por qué separar completamente:
1. **Seguridad**: Breach en uno no afecta al otro
2. **Compliance**: DAO tiene requisitos regulatorios diferentes
3. **Escalabilidad**: Límites y quotas independientes
4. **Auditoría**: Trazabilidad clara de fondos y acciones
5. **Governance**: El DAO debe ser autónomo

---

## 📊 MATRIZ DE SEPARACIÓN

| Servicio | CryptoGift Gifts | CryptoGift DAO | Acción Requerida |
|----------|------------------|----------------|-------------------|
| **GitHub** | `/cryptogift-wallets` | `/cryptogift-dao` | Crear nuevo repo |
| **Vercel** | `cryptogift-wallets` | `cryptogift-dao` | Nuevo proyecto |
| **Discord** | Gift Bot | DAO Bot | Nuevo bot |
| **Zealy** | `/c/cryptogiftwallet` | `/c/cryptogiftdao` | Nueva comunidad |
| **Upstash** | `fit-mole-59344` | Crear nueva | Nueva instancia |
| **Supabase** | `cryptogift-wallets` | `cryptogift-dao` | Nuevo proyecto |
| **Sentry** | `cryptogift-wallets` | `cryptogift-dao` | Nuevo proyecto |
| **Railway** | Gifts bots | DAO bots | Nuevo proyecto |
| **Safe** | Treasury gifts | Treasury DAO | Nuevo Safe |
| **Wallet** | Deployer gifts | Deployer DAO | Nueva wallet |

---

## 🔄 PASOS DE CREACIÓN DE CUENTAS SEPARADAS

### 1️⃣ GITHUB - Nuevo Repositorio
```bash
# Crear nuevo repo
1. github.com/new
2. Name: "cryptogift-dao"
3. Description: "Governance and token distribution system for CryptoGift"
4. Private: YES (inicial)
5. Initialize with README: YES

# Clonar y setup
git clone https://github.com/ElMartidel96/cryptogift-dao.git
cd cryptogift-dao
# Copiar archivos del DAO (no del frontend gifts)
```

### 2️⃣ VERCEL - Nuevo Proyecto
```bash
1. vercel.com/new
2. Import Git Repository: cryptogift-dao
3. Project Name: "cryptogift-dao"
4. Framework: Next.js (para dashboard)
5. Environment Variables: (usar .env.dao)

# Dominios
- dao.cryptogift.com (producción)
- cryptogift-dao.vercel.app (staging)
```

### 3️⃣ DISCORD - Nuevo Bot
```bash
1. discord.com/developers/applications
2. New Application: "CryptoGift DAO Bot"
3. Bot -> Create Bot
4. Token: Guardar en DISCORD_DAO_TOKEN
5. OAuth2 -> URL Generator
   - Scopes: bot, applications.commands
   - Permissions: Administrator
6. Crear nuevo servidor: "CryptoGift DAO"
```

### 4️⃣ ZEALY - Nueva Comunidad
```bash
1. app.zealy.io
2. Create Community
3. Subdomain: "cryptogiftdao"
4. Name: "CryptoGift DAO"
5. Settings -> API -> Generate Key
6. Guardar: ZEALY_API_KEY
```

### 5️⃣ UPSTASH - Nueva Instancia Redis
```bash
1. console.upstash.com
2. Create Database
3. Name: "cryptogift-dao"
4. Region: us-east-1
5. Type: Regional (no global)
6. Eviction: allkeys-lru
7. Guardar credenciales en .env.dao
```

### 6️⃣ SUPABASE - Nuevo Proyecto
```bash
1. app.supabase.com
2. New Project
3. Name: "cryptogift-dao"
4. Database Password: [generar fuerte]
5. Region: East US
6. Plan: Free (inicial)
7. Guardar:
   - URL: SUPABASE_DAO_URL
   - Anon Key: SUPABASE_DAO_ANON_KEY
   - Service Key: Settings -> API
```

### 7️⃣ SENTRY - Nuevo Proyecto
```bash
1. sentry.io
2. Create Project
3. Platform: Node.js
4. Project Name: "cryptogift-dao"
5. Team: Create new "DAO Team"
6. Guardar DSN en SENTRY_DAO_DSN
7. Create Auth Token para CI/CD
```

### 8️⃣ RAILWAY - Nuevo Proyecto
```bash
1. railway.app
2. New Project
3. Name: "cryptogift-dao-bots"
4. Add Service: "eas-attestor"
5. Add Service: "discord-bot"
6. Add Service: "quest-sync"
7. Settings -> Generate Token
```

### 9️⃣ SAFE - Nuevo Multisig
```bash
1. app.safe.global
2. Create Safe
3. Name: "CryptoGift DAO Treasury"
4. Owners:
   - DAO Deployer
   - Team Member 2
   - Team Member 3
5. Threshold: 2 of 3
6. Network: Base
```

### 🔟 WALLET - Nueva para DAO
```bash
# Generar nueva wallet para deployments DAO
const wallet = ethers.Wallet.createRandom();
console.log("Address:", wallet.address);
console.log("Private Key:", wallet.privateKey);

# Guardar en PRIVATE_KEY_DAO_DEPLOYER
# Fondear con ETH para deployments
```

---

## 🔐 CONFIGURACIÓN DE SEGURIDAD

### Mejores Prácticas de Separación:

```yaml
NUNCA:
  - Compartir private keys entre proyectos
  - Usar misma wallet deployer
  - Mezclar tokens en mismo Safe
  - Compartir Redis/DB entre sistemas
  - Usar mismo bot Discord
  - Mezclar webhooks

SIEMPRE:
  - Prefijos claros (_DAO_ vs _GIFTS_)
  - Repos separados
  - Dominios diferentes
  - Analytics separados
  - Logs separados
  - Backups independientes
```

---

## 📁 ESTRUCTURA DE ARCHIVOS RECOMENDADA

```
/cryptogift-ecosystem/
├── /cryptogift-wallets/     # Frontend Gifts (EXISTENTE)
│   ├── .env.local           # Variables del frontend
│   └── ...componentes gifts
│
└── /cryptogift-dao/         # DAO System (NUEVO)
    ├── .env.dao             # Variables del DAO
    ├── /contracts/          # Smart contracts DAO
    ├── /scripts/            # Automation scripts
    ├── /bots/              # Bot services
    ├── /dashboard/         # DAO dashboard UI
    └── /docs/              # Documentation
```

---

## 🚀 ORDEN DE EJECUCIÓN

### Fase 1: Cuentas (30 min)
```bash
□ Crear GitHub repo
□ Crear Vercel project
□ Crear Discord bot + server
□ Crear Zealy community
□ Crear Upstash Redis
□ Crear Supabase project
□ Crear Sentry project
□ Crear Railway project
□ Generar nueva wallet DAO
```

### Fase 2: Configuración (15 min)
```bash
□ Copiar .env.dao
□ Llenar API keys obtenidas
□ Configurar webhooks
□ Setup DNS (si tienes dominio)
```

### Fase 3: Deployment (2 horas)
```bash
□ Seguir MASTER_EXECUTION_GUIDE.md
□ Usar nuevas credenciales DAO
□ Verificar separación completa
```

---

## ✅ CHECKLIST DE VERIFICACIÓN

### Separación Correcta:
```bash
□ Wallets diferentes para deploy
□ Discord bots diferentes
□ Redis instances separadas
□ Supabase projects separados
□ GitHub repos independientes
□ Vercel projects distintos
□ Safe multisigs separados
□ Analytics properties diferentes
□ Sentry projects independientes
□ Dominios/subdominios únicos
```

### Red Flags 🚩:
```bash
❌ Mismo deployer wallet
❌ Compartir Redis
❌ Mismo Discord bot
❌ Mezclat tokens en Safe
❌ Compartir Supabase
❌ API keys duplicadas
```

---

## 📊 COSTOS ESTIMADOS

### Cuentas Gratuitas Suficientes Para:
- **Vercel**: 100GB bandwidth/mes
- **Upstash**: 10k comandos/día
- **Supabase**: 500MB DB, 50k requests
- **Railway**: $5 credit inicial
- **Sentry**: 5k eventos/mes
- **GitHub**: Repos privados ilimitados

### Costos Cuando Escale:
- **Total mensual estimado**: $50-100 USD
- **Por usuario activo**: ~$0.01-0.02

---

## 🎯 RESULTADO FINAL

Con esta separación logras:
1. **Independencia total** entre productos
2. **Seguridad mejorada** con aislamiento
3. **Escalabilidad** sin límites compartidos
4. **Compliance** más fácil
5. **Governance** verdaderamente descentralizada

---

*IMPORTANTE: Esta separación debe hacerse ANTES de deployar contratos*
*Una vez deployado es muy difícil migrar*