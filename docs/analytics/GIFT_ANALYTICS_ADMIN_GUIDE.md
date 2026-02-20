# 🎁 Gift Analytics Admin Guide

## Guía de Administración del Sistema de Analytics de Gifts

Esta guía te explica dónde revisar y monitorear el sistema de gift analytics.

---

## 📍 DÓNDE REVISAR CADA COSA

### 1. 📊 Dashboards de Metabase (Visualización)

**URL**: https://calm-shoal.metabaseapp.com

**Credenciales**:
- Usuario: rafael1996k@gmail.com
- Password: W7NmehQ51622**M

| Dashboard | URL | Qué Muestra |
|-----------|-----|-------------|
| 🎁 Gift Funnel | [Dashboard 10](https://calm-shoal.metabaseapp.com/dashboard/10) | Funnel de conversión de gifts |
| ⚡ Task Operations | [Dashboard 11](https://calm-shoal.metabaseapp.com/dashboard/11) | Métricas de tareas |
| 🔗 Referral Network | [Dashboard 12](https://calm-shoal.metabaseapp.com/dashboard/12) | Red de referidos |

---

### 2. 🔄 APIs de Monitoreo (Estado del Sistema)

**Base URL**: https://www.mbxarts.com

#### Sync Status (Redis → Supabase)
```bash
# Ver estado del sync
curl https://www.mbxarts.com/api/analytics/sync
```
**Respuesta esperada**:
```json
{
  "status": "idle",
  "last_run": "2026-01-23T10:51:04.602Z",
  "pending_sync": 0,
  "total_synced": 0,
  "redis_configured": true,
  "supabase_configured": true
}
```

#### Refresh Views Status (Materialized Views)
```bash
# Ver estado de refresh de views
curl https://www.mbxarts.com/api/analytics/refresh-views
```

#### Gift Tracking Status
```bash
# Ver estado del sistema de tracking
curl https://www.mbxarts.com/api/analytics/gift/track

# Ver analytics de un gift específico
curl https://www.mbxarts.com/api/analytics/gift/track?gift_id=abc123
```

---

### 3. 🗄️ Supabase (Base de Datos)

**URL**: https://app.supabase.com

**Proyecto**: pwajikcybnicshuqlybo

#### Tablas a Revisar

| Tabla | Propósito | Query Rápida |
|-------|-----------|--------------|
| `gift_analytics` | Datos de gifts sincronizados | `SELECT COUNT(*) FROM gift_analytics;` |
| `sync_state` | Estado de los jobs de sync | `SELECT * FROM sync_state;` |
| `mv_gift_funnel_daily` | Vista agregada del funnel | `SELECT * FROM mv_gift_funnel_daily ORDER BY date DESC LIMIT 10;` |
| `mv_task_operations_daily` | Vista agregada de tasks | `SELECT * FROM mv_task_operations_daily ORDER BY date DESC LIMIT 10;` |
| `mv_referral_network_daily` | Vista agregada de referidos | `SELECT * FROM mv_referral_network_daily ORDER BY date DESC LIMIT 10;` |

#### Queries Útiles para Admin

```sql
-- Ver últimos 10 gifts trackeados
SELECT gift_id, gift_created_at, gift_viewed_at, gift_claimed_at, value_usd
FROM gift_analytics
ORDER BY created_at DESC
LIMIT 10;

-- Ver conversión del funnel (últimos 30 días)
SELECT
  SUM(total_created) as created,
  SUM(total_viewed) as viewed,
  SUM(total_preclaim) as preclaim,
  SUM(total_education) as education,
  SUM(total_claimed) as claimed,
  ROUND(SUM(total_claimed)::numeric / NULLIF(SUM(total_created), 0) * 100, 2) as conversion_rate
FROM mv_gift_funnel_daily
WHERE date >= CURRENT_DATE - INTERVAL '30 days';

-- Ver estado de todos los sync jobs
SELECT id, status, last_run_at, items_processed, error_message
FROM sync_state
ORDER BY last_run_at DESC;
```

---

### 4. ⚡ Vercel (Cron Jobs)

**URL**: https://vercel.com/dashboard

**Proyecto**: cryptogift-wallets-dao (o el nombre de tu proyecto)

**Sección**: Settings → Crons

| Cron Job | Schedule | Propósito |
|----------|----------|-----------|
| `/api/analytics/sync` | Cada 5 min (`*/5 * * * *`) | Sincroniza Redis → Supabase |
| `/api/analytics/refresh-views` | Cada hora (`0 * * * *`) | Refresca materialized views |

**Cómo ver logs de cron**:
1. Ve a Vercel Dashboard
2. Selecciona el proyecto
3. Deployments → Selecciona el deployment actual
4. Logs → Filtra por `/api/analytics/`

---

### 5. 🔴 Redis (Upstash)

**URL**: https://console.upstash.com

**Qué revisar**:
- Conexiones activas
- Keys del namespace `gift:analytics:*`
- Set `gift:analytics:dirty` (gifts pendientes de sync)

**Comandos útiles** (desde Upstash CLI):
```bash
# Ver gifts pendientes de sync
SMEMBERS gift:analytics:dirty

# Ver datos de un gift específico
HGETALL gift:analytics:abc123

# Contar gifts en dirty set
SCARD gift:analytics:dirty
```

---

## 🔧 TROUBLESHOOTING

### Problema: No hay datos en gift_analytics

**Causas posibles**:
1. El frontend no está trackeando eventos
2. Redis no está configurado
3. El sync job no está corriendo

**Verificación**:
```bash
# 1. Verificar que Redis funciona
curl https://www.mbxarts.com/api/analytics/gift/track

# 2. Verificar estado del sync
curl https://www.mbxarts.com/api/analytics/sync

# 3. Verificar que hay eventos en Redis (desde Upstash)
SCARD gift:analytics:dirty
```

### Problema: Dashboards muestran "No results"

**Causas posibles**:
1. Las materialized views están vacías
2. Las views no se han refrescado

**Solución**:
```bash
# Forzar refresh de views
curl -X POST https://www.mbxarts.com/api/analytics/refresh-views \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Problema: Sync job falla

**Verificación**:
```sql
-- Ver último error del sync
SELECT id, status, error_message, last_run_at
FROM sync_state
WHERE id = 'gift_redis_sync';
```

---

## 📈 FLUJO DE DATOS

```
Frontend (Gift Events)
         ↓
    POST /api/analytics/gift/track
         ↓
    Redis (gift:analytics:*)
         ↓
    Vercel Cron (cada 5 min)
         ↓
    POST /api/analytics/sync
         ↓
    Supabase (gift_analytics)
         ↓
    Vercel Cron (cada hora)
         ↓
    Refresh Materialized Views
         ↓
    Metabase Dashboards
```

---

## 🎯 EVENTOS TRACKEADOS

| Evento | Cuándo se dispara | Datos requeridos |
|--------|-------------------|------------------|
| `created` | Gift minteado on-chain | gift_id, creator_address, value_usd |
| `viewed` | Página de claim abierta | gift_id |
| `preclaim` | Usuario inicia preclaim | gift_id, email_hash |
| `education_completed` | Completa todos los módulos | gift_id |
| `claimed` | Gift reclamado exitosamente | gift_id, claimer_address |
| `expired` | Gift expiró sin reclamar | gift_id |
| `returned` | Gift devuelto al creador | gift_id |

---

## 🔐 SEGURIDAD

- **Rate Limiting**: 60 eventos/min por IP
- **Idempotencia**: Mismo gift+evento en 5 min = ignorado
- **Validación**: Solo event_types de whitelist aceptados
- **Sanitización**: Todos los inputs son sanitizados
- **CORS**: Solo dominios permitidos pueden hacer requests

---

## 📞 CONTACTO

Si hay problemas críticos con el sistema de analytics:
- Email: rafael1996k@gmail.com
- Proyecto: CryptoGift DAO

---

Made by mbxarts.com The Moon in a Box property

Co-Author: Godez22
