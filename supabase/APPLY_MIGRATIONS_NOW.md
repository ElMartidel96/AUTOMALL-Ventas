# 🚀 APLICAR MIGRACIONES - ORDEN CORRECTO

**Supabase está operacional - Aplicar ahora**

---

## ⚠️ ORDEN CRÍTICO - SEGUIR EXACTAMENTE

### 1️⃣ PRIMERO - Fix Signup Bonus (CRÍTICO)

**Archivo**: `supabase/migrations/20251205_add_signup_bonus_type.sql`

**Qué hace**: Agrega 'signup_bonus' a la constraint de reward_type

**Cómo aplicar**:
1. Ir a Supabase Dashboard → SQL Editor
2. Abrir: `supabase/migrations/20251205_add_signup_bonus_type.sql`
3. Copiar TODO el contenido
4. Pegar en SQL Editor
5. Click "Run"

**Tiempo**: 5 segundos

**Resultado esperado**: "Success. No rows returned"

---

### 2️⃣ SEGUNDO - Security Fixes

**Archivo**: `supabase/migrations/20251205_fix_supabase_linter_issues.sql`

**Qué hace**:
- Corrige 7 SECURITY DEFINER views
- Agrega search_path a 18 funciones
- Mueve pg_trgm extension

**Cómo aplicar**:
1. En SQL Editor (mismo lugar)
2. Abrir: `supabase/migrations/20251205_fix_supabase_linter_issues.sql`
3. Copiar TODO
4. Pegar y Run

**Tiempo**: 30 segundos

---

### 3️⃣ TERCERO - Performance Optimizations

**Archivo**: `supabase/migrations/20251205_optimize_rls_policies.sql`

**Qué hace**:
- Optimiza 10 RLS policies (auth initplan)
- Consolida 54 políticas en 13

**Cómo aplicar**:
1. En SQL Editor
2. Abrir: `supabase/migrations/20251205_optimize_rls_policies.sql`
3. Copiar TODO
4. Pegar y Run

**Tiempo**: 45 segundos

---

## 🎯 RESUMEN RÁPIDO

```bash
# ORDEN:
1. 20251205_add_signup_bonus_type.sql        ← CRÍTICO (fixes 200 CGC bonus)
2. 20251205_fix_supabase_linter_issues.sql   ← Security (26 issues)
3. 20251205_optimize_rls_policies.sql        ← Performance (64 issues)

# TOTAL: 91 issues corregidos
```

---

## ✅ VERIFICACIÓN POST-MIGRACIÓN

Después de aplicar las 3 migraciones:

### Test 1: Signup Bonus
```sql
-- En SQL Editor, verificar que signup_bonus está permitido
SELECT
  con.conname AS constraint_name,
  pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
WHERE con.conname = 'referral_rewards_reward_type_check';

-- Debe incluir 'signup_bonus' en la lista
```

### Test 2: Linter
1. Ir a Database → Linter
2. Click "Refresh"
3. Verificar: **0 ERRORS**, solo warnings de Postgres version

### Test 3: Crear Permanent Invite
1. Ir a `/referrals`
2. Crear nuevo enlace permanente
3. Compartir y hacer que alguien lo use
4. Verificar que recibe 200 CGC

---

## 🐛 SI ALGO FALLA

### Error: "constraint X does not exist"
**Solución**: Continuar con siguiente migración, no es crítico

### Error: "permission denied"
**Solución**: Asegúrate de usar service_role key en Supabase settings

### Error: "relation X already exists"
**Solución**: Ya está aplicada, skip a siguiente

---

## 📞 DESPUÉS DE APLICAR

1. **Reintentar el flujo** que acabas de completar
2. Los 200 CGC deberían depositarse automáticamente
3. Revisar en Database → referral_rewards si aparece el registro

---

Made by mbxarts.com The Moon in a Box property
Co-Author: Godez22
