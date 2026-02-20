# 🚨 CLAUDE - REGLAS ABSOLUTAS E INVIOLABLES

## ❌ **PROHIBIDO ABSOLUTAMENTE:**

### 1. **NUNCA ESCRIBIR EN .env.local**
- El archivo `.env.local` contiene más de 200 líneas de configuración crítica
- **ESTÁ TERMINANTEMENTE PROHIBIDO** escribir, editar o modificar este archivo
- Solo se permite LEER para consultar variables

### 2. **NUNCA ESCRIBIR SIN LEER COMPLETAMENTE**
- **SIEMPRE** usar Read tool antes de Edit/Write
- **SIEMPRE** leer el archivo COMPLETO, no solo fragmentos
- **VERIFICAR** que el contenido actual sea comprendido antes de modificar

### 3. **NUNCA CREAR ARCHIVOS SIN VERIFICAR**
- **SIEMPRE** usar Glob/Grep para verificar si el archivo ya existe
- **NUNCA** asumir que un archivo no existe
- **SIEMPRE** leer el archivo existente antes de cualquier modificación

## ✅ **PROTOCOLO OBLIGATORIO:**

1. **Antes de cualquier escritura:**
   ```
   1. Read tool - leer archivo completo
   2. Analizar contenido existente
   3. Confirmar que la modificación es segura
   4. Solo entonces proceder con Edit tool
   ```

2. **Para archivos críticos (.env.local, package.json, etc):**
   ```
   - PROHIBIDO escribir sin autorización explícita del usuario
   - SOLO lectura para consultar variables
   - Cualquier cambio debe ser aprobado primero
   ```

## 🎯 **CONTEXTO DEL ERROR:**
- Fecha: 2025-01-09
- Error: Sobrescribí `.env.local` (200+ líneas) con solo 36 líneas
- Consecuencia: Pérdida de configuración crítica (recuperada por backup del usuario)
- Causa: No leí el archivo completo antes de escribir

## 📋 **VERIFICACIONES OBLIGATORIAS:**
- [ ] ¿Leí el archivo COMPLETO con Read tool?
- [ ] ¿Entiendo el contenido existente?
- [ ] ¿Es segura esta modificación?
- [ ] ¿Tengo autorización para modificar este archivo?
- [ ] ¿Es un archivo crítico que requiere precaución extra?

**ESTAS REGLAS SON ABSOLUTAS E INVIOLABLES**
**NO HAY EXCEPCIONES**
**DEBEN SER SEGUIDAS EN CADA SESIÓN**