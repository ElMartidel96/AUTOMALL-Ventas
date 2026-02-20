# 🤖 OpenAI API Setup Guide

## 🔑 Para habilitar el agente apeX

El agente apeX requiere una API key válida de OpenAI para funcionar.

### ⚡ Pasos rápidos:

1. **Obtener API Key:**
   - Ir a: https://platform.openai.com/api-keys
   - Crear cuenta si no tienes
   - Crear nueva API key

2. **Configurar localmente:**
   ```bash
   # Editar .env.local
   OPENAI_API_KEY=sk-your-actual-key-here
   ```

3. **Configurar en production (Vercel):**
   - Dashboard Vercel → Project Settings → Environment Variables
   - Agregar: `OPENAI_API_KEY` = `sk-your-actual-key-here`
   - Redeploy

### 🚨 Notas importantes:

- **NUNCA** commitear la API key real en git
- El placeholder actual `your-openai-key-here` está detectado como inválido
- El agente mostrará "OpenAI API key not configured" hasta que se configure correctamente
- Costo: ~$0.002 por conversación promedio

### 🧪 Verificar funcionamiento:

Después de configurar, el agente debe responder sin errores a preguntas como:
- "¿de qué va el proyecto?"
- "¿cuál es el estado del DAO?"

### 💰 Alternativa sin costo:
Si no deseas usar OpenAI, el agente puede deshabilitarse temporalmente editando:
```typescript
// app/api/agent/route.ts
// Comentar la línea que valida la API key
```