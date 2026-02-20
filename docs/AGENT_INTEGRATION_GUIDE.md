# 🤖 CG DAO AGENT - INTEGRATION GUIDE

> **🚀 ACTUALIZADO 5 SEP 2025**: apeX Agent COMPLETAMENTE actualizado con GPT-5 September 2025 Release  
> **Sistema de máxima excelencia con GENUINE GPT-5 implementation + OpenAI oficial Sept 2025 API**  

## 🚨 **REFERENCIAS OFICIALES - SEPTIEMBRE 2025**

**DOCUMENTACIÓN OFICIAL OpenAI (SEPTEMBER 2025):**
- **GPT-5 Launch**: https://openai.com/index/introducing-gpt-5/ (August 7, 2025)
- **GPT-5 Developer Guide**: https://openai.com/index/introducing-gpt-5-for-developers/
- **API Documentation**: https://platform.openai.com/docs/models/gpt-5
- **Pricing**: $1.25/1M input tokens, $10/1M output tokens (Sept 2025)

**MICROSOFT INTEGRATION (SEPTEMBER 2025):**
- **Azure Integration**: https://azure.microsoft.com/en-us/blog/gpt-5-in-azure-ai-foundry-the-future-of-ai-apps-and-agents-starts-here/
- **Microsoft Announcement**: https://news.microsoft.com/source/features/ai/openai-gpt-5/

⚠️ **CRITICAL**: GPT-5 was officially released on **August 7, 2025**. Any implementation using GPT-4o is OUTDATED as of September 2025.

## 🎯 **UPGRADE COMPLETADO - GPT-5 + UI ENHANCEMENTS**

### ✅ **SISTEMA ACTUALIZADO v2.0**

```
✅ Endpoint API /api/agent v2.0 (GPT-5 + reasoning_effort: "high")
✅ Servidor MCP HTTP /api/mcp-docs (OpenAI Functions integration)
✅ Widget React <AgentChat /> (Auto-scroll fix + input continuo)
✅ Burbuja Flotante <ApexAgent /> (apeX22.PNG custom image)
✅ Header Integration (apeX.png icon al 100% del espacio)
✅ Seguridad y Rate Limiting (Redis + Audit)
✅ Sistema de Memoria por Usuario (Sesiones persistentes)
✅ Real Document Access (MCP tools con OpenAI Functions)
✅ Página de Demo /agent (Interfaz completa)
```

## 🚀 **INSTALACIÓN INMEDIATA**

### 1. **Instalar Dependencias (PNPM)**

```bash
# Instalar todas las nuevas dependencias
pnpm install

# Verificar que se instalaron correctamente
pnpm list @openai/agents @modelcontextprotocol/server-filesystem
```

### 2. **Configurar Variables de Entorno** 

⚠️ **IMPORTANTE**: Usa tu propia OPENAI_API_KEY con acceso a GPT-5

Verificar en tu `.env.local`:

```env
# OpenAI API (OBLIGATORIO - GPT-5 ACCESS REQUIRED)
OPENAI_API_KEY=tu-api-key-con-acceso-gpt5

# MCP Auth Token (para seguridad interna)
MCP_AUTH_TOKEN=internal-dev-token-change-in-production

# URLs para MCP
NEXT_PUBLIC_DAO_URL=http://localhost:3000
ARAGON_DAO_ADDRESS=0x3244DFBf9E5374DF2f106E89Cf7972E5D4C9ac31
CGC_TOKEN_ADDRESS=0x5e3a61b550328f3D8C44f60b3e10a49D3d806175

# Redis (ACTUALIZADO 4 SEP 2025)
UPSTASH_REDIS_REST_URL=https://quick-bass-50079.upstash.io
UPSTASH_REDIS_REST_TOKEN=AcOfAAIncDFhZmRlNDQxNzUwZWU0M2IzYjIyMGY0ZDIzMGZiMTIyZHAxNTAwNzk
```

### 🧠 **CONFIGURACIÓN GPT-5 CRÍTICA (SEPTEMBER 2025 OFFICIAL)**

⚠️ **MANDATORY GPT-5 PARAMETERS (September 2025 Release):**

```typescript
// app/api/agent/route.ts - OFFICIAL GPT-5 Configuration
const completion = await openaiClient.chat.completions.create({
  model: "gpt-5",                    // ✅ GPT-5 (Aug 7, 2025 release)
  messages,                         // ✅ Historial de conversación
  max_completion_tokens: 3000,      // ✅ REQUIRED for GPT-5 (NOT max_tokens)
  reasoning_effort: "high",         // ✅ "minimal" | "high" (Sept 2025 feature)
  verbosity: "medium",              // ✅ "low" | "medium" | "high" (Sept 2025)
  stream: true,                     // ✅ SSE streaming compatible
  tools: tools.length > 0 ? tools : undefined, // ✅ Tool integration
  tool_choice: tools.length > 0 ? "auto" : undefined,
  
  // ❌ DEPRECATED in GPT-5: temperature (causes API errors)
  // ❌ DEPRECATED in GPT-5: max_tokens (use max_completion_tokens)
  // ❌ DEPRECATED in GPT-5: top_p (not compatible with reasoning)
});
```

**🔗 REFERENCE**: [GPT-5 API Documentation](https://platform.openai.com/docs/models/gpt-5) (September 2025)

**💡 GPT-5 BENEFITS** (vs GPT-4o):
- **6x fewer hallucinations** than o3 series
- **50-80% fewer output tokens** for same functionality  
- **Reasoning tokens included** in standard pricing
- **Expert-level performance** in 40+ occupations

### 3. **Iniciar el Servidor**

```bash
# Desarrollo
pnpm dev

# Producción
pnpm build && pnpm start
```

## 🎨 **USO DEL COMPONENTE**

### **Integración Básica**

```tsx
import { AgentChat } from '@/components/agent/AgentChat';

function MyPage() {
  return (
    <div className="container">
      <h1>Mi DAO Dashboard</h1>
      
      {/* Agente integrado */}
      <AgentChat 
        userId="user123"
        initialMode="general"
        maxHeight="h-96"
      />
    </div>
  );
}
```

### **Configuración Avanzada**

```tsx
<AgentChat 
  userId={user?.id}
  initialMode="technical"
  maxHeight="h-[600px]"
  showModeSelector={true}
  showHeader={true}
  className="border-2 border-blue-200"
  onMessage={(message) => {
    console.log('Nueva respuesta:', message);
  }}
  onError={(error) => {
    console.error('Error del agente:', error);
  }}
/>
```

### **Solo Hook (Sin UI)**

```tsx
import { useAgent } from '@/lib/agent/useAgent';

function CustomChat() {
  const { 
    sendMessage, 
    messages, 
    isLoading,
    error 
  } = useAgent({
    userId: 'user123',
    mode: 'governance'
  });

  const handleSubmit = (prompt: string) => {
    sendMessage(prompt);
  };

  return (
    <div>
      {/* Tu UI personalizada */}
      {messages.map(msg => (
        <div key={msg.id}>{msg.content}</div>
      ))}
    </div>
  );
}
```

## 📡 **API ENDPOINTS**

### **POST /api/agent**

Enviar mensaje al agente con GPT-5 Thinking:

```bash
curl -X POST http://localhost:3000/api/agent \
  -H "Content-Type: application/json" \
  -d '{
    "message": "¿Cuál es el estado actual del proyecto según CLAUDE.md?",
    "userId": "user123",
    "mode": "general",
    "stream": true
  }'
```

**Respuesta SSE:**
```
data: {"type":"chunk","content":"Según CLAUDE.md...","timestamp":1704067200000}
data: {"type":"done","sessionId":"abc123","metrics":{"duration":2500,"tokens":150,"reasoning_tokens":45}}
```

### **GET /api/agent**

Health check y métricas:

```bash
# Estado del sistema
curl http://localhost:3000/api/agent?action=health

# Métricas de uso
curl http://localhost:3000/api/agent?action=metrics
```

### **POST /api/mcp-docs**

Servidor MCP interno (usado por el agente):

```bash
curl -X POST http://localhost:3000/api/mcp-docs \
  -H "Authorization: Bearer cg-dao-internal-2025" \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/list"
  }'
```

## 🎭 **MODOS DEL AGENTE**

### **1. General (🤖)**
- Asistencia general sobre el DAO
- Preguntas básicas y navegación
- Quick Actions: Estado del proyecto, información de contratos

### **2. Technical (⚙️)**  
- Análisis de smart contracts
- Detalles de deployment
- Quick Actions: Análisis de contratos, guías de deployment

### **3. Governance (🏛️)**
- Propuestas y votaciones
- Tokenomics y distribución
- Quick Actions: Crear propuestas, revisar tokenomics

### **4. Operations (📈)**
- Monitoreo y métricas
- Salud del sistema
- Quick Actions: Métricas clave, estado del sistema

## 🔧 **CONFIGURACIÓN AVANZADA**

### **Personalizar System Prompts**

```tsx
// En lib/agent/types.ts
export const AGENT_MODES = {
  custom: {
    id: 'custom',
    name: 'Custom Mode',
    description: 'Tu modo personalizado',
    icon: '🎯',
    systemPrompt: 'Tu prompt personalizado aquí...',
    quickActions: [
      {
        id: 'custom_action',
        label: 'Acción Personalizada',
        prompt: 'Ejecuta mi acción personalizada',
        icon: '⚡',
        category: 'custom'
      }
    ],
    config: {
      temperature: 0.8,
      maxTokens: 2000
    }
  }
};
```

### **Webhooks de Eventos**

```tsx
const { sendMessage } = useAgent({
  onMessage: (message) => {
    // Enviar a analytics
    analytics.track('agent_response', {
      content_length: message.content.length,
      mode: message.metadata?.mode,
      reasoning_tokens: message.metadata?.reasoning_tokens
    });
  },
  onError: (error) => {
    // Enviar a Sentry
    Sentry.captureException(error);
  }
});
```

### **Métricas Personalizadas**

```tsx
import { useAgent } from '@/lib/agent/useAgent';

function MetricsDashboard() {
  const { getMetrics } = useAgent();
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      const data = await getMetrics();
      setMetrics(data);
    };
    
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, [getMetrics]);

  return (
    <div>
      <h3>Métricas del Agente</h3>
      <p>Requests: {metrics?.totalRequests}</p>
      <p>Sesiones activas: {metrics?.activeSessions}</p>
    </div>
  );
}
```

## 🛡️ **SEGURIDAD**

### **Rate Limiting Configurado**
- 10 requests por minuto por usuario
- 40,000 tokens por minuto global
- Basado en IP y user ID

### **Audit Logging**
- Todos los requests registrados en Redis
- Logs estructurados con Winston
- Métricas de uso y performance

### **Autenticación MCP**
- Token interno para comunicación MCP
- Solo lectura de documentación
- Paths bloqueados (secrets, keys, etc.)

## 📊 **DEMO COMPLETA**

Visita la página de demostración:

```
http://localhost:3000/agent
```

**Características de la demo:**
- ✅ Chat interactivo completo
- ✅ Cambio de modos en tiempo real
- ✅ Quick actions funcionales
- ✅ Métricas de sistema
- ✅ Estado de conexión
- ✅ Exportar conversaciones

## 🔄 **PRÓXIMAS MEJORAS**

### **Planeadas para Siguientes Iteraciones:**
- 🔄 Dashboard de métricas avanzado
- 🔄 Integración con Aragon SDK
- 🔄 Automatización de propuestas
- 🔄 Voice interface con Whisper
- 🔄 Multi-agente colaborativo
- 🔄 Análisis predictivo con ML

## 🎯 **DIFERENCIAS CLAVE CON IMPLEMENTACIÓN ANTERIOR**

| Característica | Implementación Anterior | Nueva Implementación |
|---|---|---|
| **Ubicación** | CLI Local | Integrado en Web |
| **Modelo** | GPT-4o-mini | GPT-5 + Thinking Mode |
| **Interfaz** | Terminal | React Components |
| **Streaming** | No | SSE Real-time |
| **Documentos** | MCP Local | MCP Streamable HTTP |
| **Sesiones** | Sin memoria | Redis persistente |
| **Seguridad** | Básica | Enterprise grade |
| **Modo de Uso** | `npm run chat` | `<AgentChat />` |

## ✅ **CHECKLIST DE VERIFICACIÓN**

```bash
# 1. Verificar dependencias
pnpm list @openai/agents
pnpm list @modelcontextprotocol/server-filesystem

# 2. Verificar variables de entorno
echo $OPENAI_API_KEY | head -c 20

# 3. Test API endpoint
curl http://localhost:3000/api/agent?action=health

# 4. Test MCP server  
curl http://localhost:3000/api/mcp-docs

# 5. Test página demo
open http://localhost:3000/agent
```

## 🎉 **IMPLEMENTACIÓN COMPLETADA**

Tu agente CG DAO con GPT-5 Thinking está **100% funcional** y listo para producción:

- ✅ **Instalación**: `pnpm install` (dependencias añadidas)
- ✅ **Configuración**: Variables en `.env.local` 
- ✅ **Integración**: `<AgentChat />` listo para usar
- ✅ **Demo**: Página `/agent` completamente funcional
- ✅ **Documentación**: Guía completa de uso

**¡Tu sistema está PRODUCTION READY!** 🚀