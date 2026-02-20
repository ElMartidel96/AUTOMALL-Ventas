# 🚀 MASTER EXECUTION GUIDE - CryptoGift Wallets DAO
**Sistema de Automatización Completo**

---

## 📋 RESUMEN EJECUTIVO

Este documento consolida **TODO** el proceso de implementación del DAO de CryptoGift Wallets, categorizando cada tarea según su nivel de automatización:

- 🤖 **AUTOMATIZADO**: Ejecutable vía scripts (70% del trabajo)
- 🔧 **SEMI-AUTOMATIZADO**: Requiere configuración inicial manual + scripts
- 👤 **MANUAL**: Requiere decisiones humanas o interfaces web

---

## 🎯 PREREQUISITOS CRÍTICOS

### Cuentas Necesarias (MANUAL - Hacer PRIMERO)
```bash
# 1. Crear estas cuentas antes de empezar:
- [ ] GitHub Account (para código)
- [ ] Vercel Account (para frontend)
- [ ] Railway/Render Account (para bots)
- [ ] Upstash Account (para Redis)
- [ ] Supabase Account (para DB)
- [ ] Sentry Account (para monitoring)
- [ ] Discord Developer Account
- [ ] Zealy API Access (solicitar)
- [ ] Base RPC (Alchemy/Infura)
```

### Instalaciones Requeridas
```bash
# Verificar instalaciones
node --version  # v18+
npm --version   # v9+
git --version   # v2.30+

# Instalar Hardhat globalmente
npm install -g hardhat

# Instalar dependencias del proyecto
cd cryptogift-wallets-DAO
npm install
```

### Configuración Inicial .env
```bash
# Crear archivo .env con valores mínimos
cp .env.example .env

# Editar con valores reales:
PRIVATE_KEY="tu-private-key-deployer"
BASE_RPC_URL="https://mainnet.base.org"
BASE_SEPOLIA_RPC_URL="https://sepolia.base.org"
BASESCAN_API_KEY="tu-api-key"

# IMPORTANTE: Aragon DAO ya desplegado
ARAGON_DAO_ADDRESS="0x3244DFBf9E5374DF2f106E89Cf7972E5D4C9ac31"
ARAGON_TOKEN_VOTING="0x3244DFBf9E5374DF2f106E89Cf7972E5D4C9ac31"
```

---

## 🔄 ORDEN DE EJECUCIÓN

### FASE 1: SMART CONTRACTS (🤖 AUTOMATIZADO)

#### 1.1 Compilar Contratos
```bash
# Compilar todos los contratos
npm run compile

# Verificar que compilen:
# ✓ CGCToken.sol
# ✓ GovTokenVault.sol
# ✓ AllowedSignersCondition.sol
# ✓ MerklePayouts.sol
```

#### 1.2 Desplegar en Base Sepolia (Testnet)
```bash
# Ejecutar script de deployment
npm run deploy:sepolia

# Salida esperada:
# CGC Token deployed to: 0x...
# Token Vault deployed to: 0x...
# Condition deployed to: 0x...
# 
# Guardará addresses en: deployments/base-sepolia.json
```

#### 1.3 Verificar en Basescan
```bash
# Verificación automática
npm run verify:sepolia

# O manual si falla:
npx hardhat verify --network baseSepolia <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

#### 1.4 Configurar Vault
```bash
# Ejecutar configuración post-deploy
npx hardhat run scripts/setup/configure-vault.ts --network baseSepolia

# Esto hace:
# - Añade Aragon DAO como authorized signer
# - Configura caps y límites
# - Activa shadow mode por defecto
```

---

### FASE 2: ETHEREUM ATTESTATION SERVICE (🤖 AUTOMATIZADO)

#### 2.1 Registrar Schemas
```bash
# Ejecutar automatización EAS
npx ts-node scripts/automation/01-setup-eas.ts

# Acciones automáticas:
# ✓ Conecta a EAS en Base
# ✓ Registra 4 schemas (Quest, User, Reward, Campaign)
# ✓ Crea attestaciones de ejemplo
# ✓ Guarda UIDs en config/eas-schemas.json
# ✓ Actualiza .env con schema UIDs
```

#### 2.2 Verificar en EAS Explorer
```bash
# URLs generadas automáticamente:
echo "Quest Schema: https://base.easscan.org/schema/view/$QUEST_SCHEMA_UID"
echo "User Schema: https://base.easscan.org/schema/view/$USER_SCHEMA_UID"
```

---

### FASE 3: PLATAFORMA DE QUESTS - ZEALY (🔧 SEMI-AUTOMATIZADO)

#### 3.1 Obtener API Key (MANUAL)
```bash
# 1. Ir a https://app.zealy.io/c/cryptogiftwallet
# 2. Settings -> API -> Generate API Key
# 3. Copiar API Key y Subdomain
```

#### 3.2 Configurar Webhook (AUTOMATIZADO)
```bash
# Añadir a .env:
ZEALY_API_KEY="xly_..."
ZEALY_SUBDOMAIN="cryptogiftwallet"
ZEALY_WEBHOOK_URL="https://tu-dominio.com/api/webhooks/zealy"

# Ejecutar setup
npx ts-node scripts/automation/02-setup-zealy.ts

# Acciones automáticas:
# ✓ Lista event types disponibles
# ✓ Crea webhook con HMAC secret
# ✓ Guarda config en config/zealy-webhook.json
# ✓ Actualiza .env con WEBHOOK_ID y SECRET
```

---

### FASE 4: SAFE MULTISIG (🤖 AUTOMATIZADO)

#### 4.1 Desplegar Safe
```bash
# Ejecutar deployment
npx ts-node scripts/automation/03-setup-safe.ts

# Acciones automáticas:
# ✓ Despliega Safe con configuración
# ✓ Configura owners y threshold
# ✓ Guarda address en config/safe-deployment.json
# ✓ Actualiza .env con SAFE_ADDRESS

# Salida:
# Safe deployed at: 0x...
# Owners: 3
# Threshold: 2/3
```

#### 4.2 Transferir Tokens a Safe
```bash
# Ejecutar transfer inicial
npx hardhat run scripts/setup/transfer-to-safe.ts --network baseSepolia

# Transfiere:
# - 250,000 CGC al Safe (25% treasury)
```

---

### FASE 5: DISCORD BOT (🔧 SEMI-AUTOMATIZADO)

#### 5.1 Crear Bot (MANUAL)
```bash
# 1. Ir a https://discord.com/developers/applications
# 2. New Application -> "CryptoGift Bot"
# 3. Bot -> Create Bot
# 4. Copiar TOKEN
# 5. OAuth2 -> URL Generator:
#    - Scopes: bot, applications.commands
#    - Permissions: Administrator
# 6. Copiar URL e invitar a servidor
```

#### 5.2 Configurar Bot (AUTOMATIZADO)
```bash
# Añadir a .env:
DISCORD_TOKEN="tu-bot-token"
DISCORD_CLIENT_ID="tu-client-id"
DISCORD_GUILD_ID="tu-server-id"

# Ejecutar setup
npx ts-node scripts/automation/04-setup-discord.ts

# Acciones automáticas:
# ✓ Registra 15 slash commands
# ✓ Crea roles (Member, Holder, Whale, Admin)
# ✓ Crea canales organizados por categorías
# ✓ Configura permisos
# ✓ Activa event listeners
```

#### 5.3 Iniciar Bot
```bash
# Desarrollo local
npm run bot:dev

# Producción (con PM2)
npm run bot:start
```

---

### FASE 6: SERVICIOS CLOUD (🔧 SEMI-AUTOMATIZADO)

#### 6.1 Configurar Cuentas (MANUAL)
```bash
# Obtener credenciales de cada servicio:
# - Vercel: https://vercel.com/account/tokens
# - Railway: https://railway.app/account/tokens
# - Upstash: https://console.upstash.com
# - Supabase: https://app.supabase.com/account/tokens
# - Sentry: https://sentry.io/settings/auth-tokens/
```

#### 6.2 Ejecutar Configuración (AUTOMATIZADO)
```bash
# Añadir todas las API keys a .env

# Ejecutar setup completo
npx ts-node scripts/automation/05-setup-cloud.ts

# Acciones automáticas:
# ✓ Configura Vercel project
# ✓ Crea Redis en Upstash
# ✓ Configura Supabase DB + schemas
# ✓ Configura Sentry monitoring
# ✓ Sincroniza environment variables
```

---

### FASE 7: FRONTEND & BOTS (🔧 SEMI-AUTOMATIZADO)

#### 7.1 Desplegar Frontend
```bash
# Build local
cd frontend
npm run build

# Deploy a Vercel (automatizado si configurado)
vercel --prod

# O manual:
# 1. git push origin main
# 2. Vercel auto-deploys
```

#### 7.2 Desplegar Bots
```bash
# EAS Attestor Bot
cd bots/eas-attestor
npm run deploy

# Discord Bot (Railway)
railway up

# Quest Sync Service
cd services/quest-sync
npm run deploy
```

---

### FASE 8: ACTIVACIÓN FINAL (👤 MANUAL + 🤖 AUTOMATIZADO)

#### 8.1 Remover Shadow Mode (MANUAL - CRÍTICO)
```bash
# SOLO después de testing completo
npx hardhat run scripts/setup/disable-shadow-mode.ts --network base

# ⚠️ ADVERTENCIA: Esto activa transferencias reales
# Requiere multisig approval
```

#### 8.2 Activar Monitoreo
```bash
# Iniciar todos los servicios de monitoreo
npm run monitoring:start

# Verifica dashboards:
# - Sentry: https://sentry.io/organizations/cryptogift/
# - Grafana: http://localhost:3000
# - Upstash: https://console.upstash.com
```

#### 8.3 Testing E2E
```bash
# Ejecutar suite completa
npm run test:e2e

# Tests incluyen:
# ✓ Token release flow
# ✓ EAS attestation creation
# ✓ Quest completion webhook
# ✓ Discord commands
# ✓ Safe multisig execution
```

---

## 📊 MATRIZ DE AUTOMATIZACIÓN

| Componente | Automatización | Tiempo | Dependencias |
|------------|---------------|---------|--------------|
| Smart Contracts | 🤖 100% | 10 min | Private key, RPC |
| EAS Setup | 🤖 100% | 5 min | Contracts deployed |
| Zealy Integration | 🔧 80% | 15 min | API key manual |
| Safe Multisig | 🤖 100% | 5 min | Contracts deployed |
| Discord Bot | 🔧 70% | 20 min | Bot creation manual |
| Cloud Services | 🔧 60% | 30 min | Account creation manual |
| Frontend Deploy | 🔧 90% | 10 min | Vercel account |
| Testing | 🤖 100% | 15 min | All services running |
| **TOTAL** | **~85% automatizado** | **~2 horas** | - |

---

## ✅ CHECKLIST DE VERIFICACIÓN

### Pre-Launch
```bash
□ Todos los contratos verificados en Basescan
□ Safe multisig con threshold correcto
□ EAS schemas registrados y funcionando
□ Zealy webhook respondiendo (200 OK)
□ Discord bot online y respondiendo
□ Frontend accesible y conectando wallets
□ Redis cache funcionando
□ Supabase guardando datos
□ Sentry capturando errores
□ Shadow mode ACTIVO
```

### Post-Launch (Día 1)
```bash
□ Primera release order ejecutada exitosamente
□ Primera attestation creada
□ Primer quest completado
□ Discord roles asignados
□ Métricas fluyendo a dashboards
□ Logs centralizados
□ Backups configurados
□ Alertas funcionando
```

---

## 🚨 COMANDOS DE EMERGENCIA

```bash
# Pausar todo el sistema
npm run emergency:pause

# Activar shadow mode inmediatamente
npx hardhat run scripts/emergency/enable-shadow.ts --network base

# Backup completo
npm run backup:all

# Rollback a versión anterior
npm run rollback -- --version=1.0.0

# Logs en tiempo real
npm run logs:tail

# Status check completo
npm run health:check
```

---

## 📈 MONITOREO POST-DEPLOYMENT

### KPIs Críticos (Primeras 24h)
- Gas usado por transacción < $2
- Tiempo de respuesta API < 500ms
- Uptime > 99.9%
- Error rate < 0.1%
- Successful attestations > 95%

### Dashboards
```bash
# URLs de monitoreo
echo "Grafana: https://grafana.cryptogift.com"
echo "Sentry: https://cryptogift.sentry.io"
echo "Upstash: https://console.upstash.com"
echo "Safe: https://app.safe.global"
echo "Basescan: https://basescan.org/address/$VAULT_ADDRESS"
```

---

## 📝 NOTAS FINALES

### Lo que NO está automatizado:
1. **Decisiones de negocio** (thresholds, caps, multipliers)
2. **Creación de cuentas** en servicios externos
3. **Aprobaciones multisig** (requiere firmas manuales)
4. **Configuración DNS** para dominios custom
5. **KYC/Compliance** si se requiere

### Orden Crítico:
1. **SIEMPRE** testear en Sepolia primero
2. **NUNCA** desactivar shadow mode sin testing completo
3. **SIEMPRE** tener backups antes de cambios mayores
4. **VERIFICAR** multisig threshold antes de transferir fondos

### Soporte y Escalación:
- Documentación: `/docs`
- Scripts de emergencia: `/scripts/emergency`
- Logs: `/logs`
- Backups: `/backups`

---

## 🎯 RESULTADO FINAL

Con esta guía, el **85% del trabajo está automatizado**. Los scripts manejan:
- ✅ Toda la infraestructura blockchain
- ✅ Integraciones con servicios externos
- ✅ Configuración de seguridad
- ✅ Monitoreo y alertas
- ✅ Testing y validación

**Tiempo total estimado: 2 horas** (vs 2-3 días manual)

---

*Generado para CryptoGift Wallets DAO - v1.0.0*
*Última actualización: Diciembre 2024*