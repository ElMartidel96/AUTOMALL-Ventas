# 🛡️ CLAUDE CODE CLI - GUÍA ANTI-CRASH

## 🚨 PROBLEMA IDENTIFICADO
El CLI de Claude Code crashea con error `Bad substitution: hasCode` debido a un **bug conocido** en el parser de shell interno.

## 📊 ANÁLISIS TÉCNICO

### Causa Raíz
1. **Parser defectuoso**: Claude CLI usa parser interno que falla con `${...}`
2. **Instalación NPM inestable**: Especialmente en WSL
3. **Auto-updates**: Cambia a versión inestable durante sesión
4. **Shell incompatible**: dash vs bash en WSL

### Patrón de Falla
```
Error: Bad substitution: hasCode
    at D (file:///.../claude-code/cli.js:80:79195)
    ... [stack trace]
Node.js v20.19.3
```

## 🔧 SOLUCIONES IMPLEMENTADAS

### 1. Sistema de Verificación Externa ✅
```bash
# Script independiente del CLI - NUNCA crashea
node scripts/verify-contracts-external.js
```

### 2. Migración a Instalador Nativo (RECOMENDADO)
```bash
# IMPORTANTE: Claude CLI es la ÚNICA excepción donde usamos npm
# Todo el resto del proyecto usa PNPM

# Desinstalar versión npm problemática
npm uninstall -g @anthropic-ai/claude-code

# Instalar versión nativa estable
curl -fsSL https://claude.ai/install.sh | bash

# Verificar instalación
claude doctor
```

### 3. Configuración Anti-Crash
```bash
# Forzar bash (evitar dash en WSL)
export SHELL=/bin/bash

# Desactivar auto-updates durante desarrollo
export DISABLE_AUTOUPDATER=1

# Variables de entorno para debugging
export CLAUDE_DEBUG=1
export NODE_OPTIONS="--max-old-space-size=4096"
```

### 4. Fixes Temporales
```bash
# NOTA: npm solo para Claude CLI - resto del proyecto usa pnpm
# Si estás atascado con npm, fijar versión específica
npm install -g @anthropic-ai/claude-code@1.0.58

# Lanzar con shell específico
env -i SHELL=/bin/bash PATH="$PATH" claude
```

## 📋 PROTOCOLO DE EMERGENCIA

### Cuando Claude Crashea:
1. **NO ENTRAR EN PÁNICO** - Los datos están seguros
2. Verificar estado con: `node scripts/verify-contracts-external.js`
3. Documentar último estado en `SESION_CONTINUIDAD_*.md`
4. Reiniciar con configuración anti-crash
5. Continuar desde último punto verificado

### Backup Continuo:
```bash
# Auto-backup cada cambio importante
cp .env.dao .env.dao.backup.$(date +%s)
cp -r deployments deployments.backup.$(date +%s)
git add -A && git commit -m "WIP: backup before potential crash"
```

## ⚡ COMANDOS DE EMERGENCIA

```bash
# Verificación rápida de contratos
node scripts/verify-contracts-external.js

# Estado del proyecto
cat deployments/deployment-base-latest.json | jq '.contracts | keys'

# Balance deployer
cast balance 0xc655BF2Bd9AfA997c757Bef290A9Bb6ca41c5dE6 --rpc-url https://mainnet.base.org

# Verificar ownership de token
cast call 0xe8AF8cF18DA5c540daffe76Ae5fEE31C80c74899 "owner()" --rpc-url https://mainnet.base.org
```

## 🎯 ESTADO ACTUAL CONFIRMADO

✅ **TODOS LOS CONTRATOS DESPLEGADOS Y FUNCIONANDO**
- CGC Token: `0xe8AF8cF18DA5c540daffe76Ae5fEE31C80c74899`
- GovTokenVault: `0xF5606020e772308cc66F2fC3D0832bf9E17E68e0`  
- AllowedSignersCondition: `0x6101CAAAD91A848d911171B82369CF90B8B00597`
- MerklePayouts: `0xC75Be1A1fCb412078102b7C286d12E8ACc75b922`

## 🚀 PRÓXIMOS PASOS SIN RIESGO

1. **Transferir tokens al vault** (script independiente)
2. **Configurar permisos Aragon** (via Hardhat/Foundry)
3. **Verificar contratos en Basescan** 
4. **Continuar desarrollo con herramientas externas**

---
**🔒 GARANTÍA**: Con estos protocolos, **NUNCA MÁS** perderemos progreso por crashes del CLI.