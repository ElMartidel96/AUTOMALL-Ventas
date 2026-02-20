# 📋 CONFIGURACIONES PENDIENTES - CryptoGift DAO

## ✅ YA CONFIGURADO
- ✅ GitHub Repo: CryptoGift-Wallets-DAO
- ✅ Private Key Deployer: 97bc7d...
- ✅ Aragon DAO: 0x3244DFBf9E5374DF2f106E89Cf7972E5D4C9ac31
- ✅ Safe Multisig: 0x11323672b5f9bB899Fa332D5d464CC4e66637b42
- ✅ Discord Bot: Creado y token guardado
- ✅ Zealy: API Key configurada
- ✅ Supabase: Proyecto creado
- ✅ Vercel: Proyecto creado
- ✅ Security Secrets: Generados automáticamente

## 🔧 CONFIGURACIONES PENDIENTES

### 1. SENTRY DSN (Monitoring)
**Status:** ⏳ Pendiente - Ya tienes el proyecto creado

**Pasos:**
1. Ve a https://sentry.io
2. Selecciona tu proyecto "cryptogift-dao"
3. Settings → Client Keys (DSN)
4. Copia el DSN (formato: `https://xxx@xxx.ingest.sentry.io/xxx`)
5. Agrégalo a `.env.dao`:
```env
SENTRY_DAO_DSN=tu_dsn_aqui
NEXT_PUBLIC_SENTRY_DAO_DSN=tu_dsn_aqui
```

### 2. GOOGLE ANALYTICS (GA4)
**Status:** ⏳ Pendiente

**Pasos:**
1. Ve a https://analytics.google.com
2. Admin (⚙️) → Create Property
3. Property name: "CryptoGift DAO"
4. Time zone: Tu zona
5. Currency: USD
6. Create → Web → Add stream
7. Website URL: https://dao.cryptogift.com
8. Stream name: "DAO Website"
9. Copia el Measurement ID (G-XXXXXXXXXX)
10. Agrégalo a `.env.dao`:
```env
GA_DAO_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 3. POSTHOG (Product Analytics)
**Status:** ⏳ Pendiente

**Pasos:**
1. Ve a https://app.posthog.com
2. Create New Project → "CryptoGift DAO"
3. Project Settings → Project API Key
4. Copia el API Key
5. Agrégalo a `.env.dao`:
```env
POSTHOG_DAO_API_KEY=phc_xxxxxxxxxxxxx
POSTHOG_DAO_HOST=https://us.i.posthog.com
```

### 4. MIXPANEL (Analytics)
**Status:** ⏳ Pendiente

**Pasos:**
1. Ve a https://mixpanel.com
2. Create New Project → "CryptoGift DAO"
3. Settings → Project Settings → Project Token
4. Copia el token
5. Agrégalo a `.env.dao`:
```env
MIXPANEL_DAO_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 5. RESEND (Email)
**Status:** ⏳ Pendiente

**Pasos:**
1. Ve a https://resend.com
2. API Keys → Create API Key
3. Name: "dao-backend"
4. Permission: "Sending access"
5. Create y copia la key (se muestra solo una vez)
6. Agrégalo a `.env.dao`:
```env
RESEND_DAO_API_KEY=re_xxxxxxxxxxxxx
RESEND_DAO_FROM_EMAIL=DAO CryptoGift <dao@cryptogift.com>
```

**Nota:** Necesitarás verificar tu dominio en Resend → Domains

### 6. UPSTASH REDIS (Dedicado)
**Status:** ⚠️ Usando instancia compartida temporalmente

**Configuración Temporal:**
```typescript
// Usando prefijo 'dao:' para evitar colisiones
// Ver: /lib/redis-dao.ts
```

**Para crear instancia dedicada (cuando pagues):**
1. Ve a https://console.upstash.com
2. Create Database → "cryptogift-dao"
3. Region: us-east-1
4. Copia las credenciales:
```env
UPSTASH_DAO_REDIS_URL=https://xxx.upstash.io
UPSTASH_DAO_REDIS_TOKEN=xxx
KV_DAO_REST_API_URL=https://xxx.upstash.io
KV_DAO_REST_API_TOKEN=xxx
```

### 7. RAILWAY (Bot Hosting)
**Status:** ⏳ Opcional

**Pasos:**
1. Ve a https://railway.app
2. New Project → "cryptogift-dao-bots"
3. Settings → Generate Token
4. Agrégalo a `.env.dao`:
```env
RAILWAY_DAO_TOKEN=xxx
RAILWAY_DAO_PROJECT_ID=xxx
```

---

## 🚀 COMANDOS PARA VERIFICAR CONFIGURACIÓN

Una vez que hayas agregado las configuraciones pendientes:

```bash
# Verificar estado de configuración
npm run setup

# Si todo está verde, proceder con:
npm install
npm run compile
npm run deploy:sepolia
```

## 📝 NOTAS IMPORTANTES

1. **Sentry DSN**: El DSN puede ser público, no es secreto
2. **GA4**: Puede tardar 24h en mostrar datos
3. **PostHog/Mixpanel**: Elige uno, no necesitas ambos
4. **Resend**: Requiere verificación DNS del dominio
5. **Redis**: La config temporal funciona, pero es mejor tener instancia dedicada

## 🔒 GITHUB SECRETS

Una vez que tengas todas las claves, agrégalas como secrets en GitHub:

1. Ve a tu repo: https://github.com/CryptoGift-Wallets-DAO/CryptoGift-Wallets-DAO
2. Settings → Secrets and variables → Actions
3. New repository secret → Agrega cada una:

```yaml
Secretos Críticos (NUNCA en código):
- PRIVATE_KEY_DAO_DEPLOYER
- JWT_DAO_SECRET
- SUPABASE_DAO_SERVICE_KEY
- DISCORD_DAO_TOKEN
- ZEALY_API_KEY
- RESEND_DAO_API_KEY
- ADMIN_DAO_API_TOKEN
- WEBHOOK_SIGNING_SECRET

Pueden estar en código (pero mejor en secrets):
- SENTRY_DAO_DSN
- GA_DAO_MEASUREMENT_ID
- POSTHOG_DAO_API_KEY
- MIXPANEL_DAO_TOKEN
```

---

*Última actualización: December 28, 2024*