# 🔄 Instrucciones de Migración - Auto-Sync Trigger

## 📋 Descripción
Este archivo contiene instrucciones para aplicar la migración que habilita la sincronización automática cuando se completa una tarea.

## 🎯 Qué hace el trigger

Cuando una tarea cambia a estado `completed`, el trigger automáticamente:

1. **Actualiza `collaborators`**:
   - `total_cgc_earned` += reward de la tarea
   - `tasks_completed` += 1
   - `last_activity` = ahora

2. **Actualiza `user_profiles`**:
   - `total_cgc_earned` += reward de la tarea
   - `total_tasks_completed` += 1
   - `updated_at` = ahora

3. **Registra en `task_history`** (si la tabla existe):
   - Acción: 'completed'
   - Detalles JSON con título, reward, timestamp

## 📂 Archivo de migración

```
supabase/migrations/20251220_task_completion_autosync.sql
```

## 🚀 Cómo aplicar la migración

### Opción 1: Supabase Dashboard (Recomendado)

1. Ir a [Supabase Dashboard](https://supabase.com/dashboard)
2. Seleccionar proyecto `pwajikcybnicshuqlybo`
3. Ir a **SQL Editor**
4. Copiar el contenido de `20251220_task_completion_autosync.sql`
5. Ejecutar el SQL
6. Verificar que el trigger se creó correctamente

### Opción 2: Supabase CLI

```bash
# Si tienes Supabase CLI instalado
supabase db push --linked
```

## ✅ Verificación post-migración

Ejecuta este query para verificar que el trigger existe:

```sql
SELECT
    tgname AS trigger_name,
    tgenabled AS enabled,
    proname AS function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'public.tasks'::regclass
AND tgname = 'task_completion_sync_trigger';
```

Resultado esperado:
```
trigger_name                  | enabled | function_name
------------------------------+---------+----------------------
task_completion_sync_trigger  | O       | sync_task_completion
```

## ⚠️ Notas importantes

1. **Evitar doble conteo**: Después de aplicar el trigger, el código en `/api/tasks/validate/route.ts` (líneas 117-173) que actualiza manualmente `collaborators` es redundante. Puede dejarse como backup o comentarse.

2. **user_profiles**: El trigger ahora sincroniza esta tabla automáticamente. Antes solo se actualizaba `collaborators`.

3. **Rollback**: Si necesitas deshacer:
```sql
DROP TRIGGER IF EXISTS task_completion_sync_trigger ON public.tasks;
DROP FUNCTION IF EXISTS sync_task_completion();
```

## 📊 API de sincronización manual

Si el trigger no está activo, puedes usar la API manual:

```bash
# Sincronizar todos los datos de collaborators
POST /api/tasks/sync-collaborators

# Ver estado de sincronización
GET /api/tasks/sync-collaborators
```

---

*Creado: 2025-12-20*
*Versión: 1.0.0*
