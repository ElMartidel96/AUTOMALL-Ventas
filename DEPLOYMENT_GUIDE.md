# 🚀 CryptoGift DAO - Guía Completa de Deployment

## 📋 Tabla de Contenidos
1. [Preparación](#preparación)
2. [Deployment Paso a Paso](#deployment-paso-a-paso)
3. [Verificación en Basescan](#verificación-en-basescan)
4. [Post-Deployment](#post-deployment)
5. [Troubleshooting](#troubleshooting)

---

## 🔧 Preparación

### Requisitos Previos
- Node.js v18+
- Git
- Wallet con al menos 0.05 ETH en Base Mainnet
- Acceso a terminal/command line

### 1. Clonar Repositorio
```bash
git clone https://github.com/CryptoGift-Wallets-DAO/CryptoGift-Wallets-DAO.git
cd cryptogift-wallets-DAO
```

### 2. Instalar Dependencias
```bash
npm install
```

### 3. Configurar Variables de Entorno
```bash
# Copiar el archivo de ejemplo
cp .env.dao.example .env.dao

# Editar con tus valores
nano .env.dao
```

**Variables CRÍTICAS a configurar:**
```env
# Tu private key (SIN el 0x al inicio)
PRIVATE_KEY_DAO_DEPLOYER=tu_private_key_aqui

# API Key de Basescan (obtener en https://basescan.org/myapikey)
BASESCAN_API_KEY=tu_api_key_aqui

# Aragon DAO (YA EXISTE - NO CAMBIAR)
ARAGON_DAO_ADDRESS=0x3244DFBf9E5374DF2f106E89Cf7972E5D4C9ac31
```

---

## 🚀 Deployment Paso a Paso

### Opción A: Deployment Automático (RECOMENDADO)

Ejecuta el script maestro que hace todo automáticamente:

```bash
# Para Base Mainnet (PRODUCCIÓN)
npm run deploy:master

# O directamente:
bash scripts/DEPLOY_MASTER.sh --network base
```

Este script:
1. ✅ Verifica tu configuración
2. ✅ Compila los contratos
3. ✅ Ejecuta pre-deployment checks
4. ✅ Despliega todos los contratos
5. ✅ **VERIFICA AUTOMÁTICAMENTE en Basescan**
6. ✅ Guarda las direcciones en .env.dao
7. ✅ Genera archivos de deployment

### Opción B: Deployment Manual (Paso a Paso)

Si prefieres control total:

#### 1. Compilar Contratos
```bash
npm run compile
```

#### 2. Verificar Pre-deployment
```bash
npm run deploy:precheck -- --network base
```

Esto verificará:
- ✅ Balance suficiente (mínimo 0.05 ETH)
- ✅ Network correcta (Chain ID: 8453)
- ✅ Basescan API key válida
- ✅ Contratos compilados

#### 3. Deploy Principal
```bash
npm run deploy:base
```

Esto desplegará:
1. **CGC Token** - 1,000,000 tokens
2. **GovTokenVault** - Con shadow mode activado
3. **AllowedSignersCondition** - Para control de firmantes
4. **MerklePayouts** - Para distribuciones masivas

**IMPORTANTE**: Los contratos se verifican AUTOMÁTICAMENTE durante el deployment

#### 4. Registrar Schemas EAS
```bash
npm run eas:register -- --network base
```

#### 5. Configurar Permisos Aragon
```bash
npm run aragon:setup -- --network base
```

---

## ✅ Verificación en Basescan

### Verificación Automática
Los contratos se verifican automáticamente durante el deployment. Verás:

```
🔍 Verifying contract at 0x...
✅ Contract verified on Basescan!
```

### Links de Verificación
Después del deployment, recibirás links directos:

```
🔗 View on Basescan:
   https://basescan.org/address/0x...#code
```

### Verificación Manual (si falla la automática)
```bash
npx hardhat verify --network base CONTRACT_ADDRESS "Constructor" "Arguments"
```

Ejemplo:
```bash
npx hardhat verify --network base 0x123... "CryptoGift Coin" "CGC" "0xDeployerAddress"
```

---

## 📋 Post-Deployment

### 1. Verificar Deployment
Los archivos se guardan en `deployments/`:
- `deployment-base-latest.json` - Último deployment
- `deployment-base-[timestamp].json` - Histórico

### 2. Actualizar Dashboard
El archivo `.env.dao` se actualiza automáticamente con:
```env
CGC_TOKEN_ADDRESS=0x...
VAULT_ADDRESS=0x...
CONDITION_ADDRESS=0x...
MERKLE_DISTRIBUTOR_ADDRESS=0x...
```

### 3. Configurar Aragon DAO

**IMPORTANTE**: Debes hacer esto manualmente en Aragon App

1. Ir a: https://app.aragon.org/dao/base-mainnet/0x3244DFBf9E5374DF2f106E89Cf7972E5D4C9ac31/dashboard

2. Instalar Token Voting Plugin:
   - Token: `[CGC_TOKEN_ADDRESS del deployment]`
   - Support Threshold: 51%
   - Min Participation: 10%
   - Min Duration: 7 días

3. Crear propuesta para permisos:
   - Grant EXECUTE_PERMISSION al Vault
   - Grant UPDATE_VAULT_PERMISSION al DAO
   - Grant MINT_PERMISSION al Vault

### 4. Desactivar Shadow Mode
Cuando estés listo para producción:

1. Crear propuesta en Aragon para desactivar shadow mode
2. Ejecutar a través de gobernanza

---

## 🔍 Monitoreo Post-Deployment

### Verificar Contratos en Basescan
1. Buscar cada contrato en https://basescan.org
2. Verificar que aparezca ✅ "Contract Source Code Verified"
3. Revisar el tab "Read Contract" y "Write Contract"

### Verificar Balances
```javascript
// Verificar balance del Vault
CGC Token > Read Contract > balanceOf(VAULT_ADDRESS)
// Debe mostrar: 400,000 CGC

// Verificar balance del DAO
CGC Token > Read Contract > balanceOf(ARAGON_DAO_ADDRESS)
// Debe mostrar: 250,000 CGC
```

### Verificar Shadow Mode
```javascript
GovTokenVault > Read Contract > shadowMode()
// Debe retornar: true (activado por seguridad)
```

---

## 🚨 Troubleshooting

### Error: "Insufficient balance"
**Solución**: Necesitas al menos 0.05 ETH en tu wallet

### Error: "Wrong network"
**Solución**: Asegúrate de estar en Base Mainnet (Chain ID: 8453)

### Error: "Contract already verified"
**Solución**: El contrato ya está verificado, no es un error

### Error: "Nonce too high"
**Solución**: Resetea el nonce de tu wallet o espera que se sincronice

### Error durante verificación
Si la verificación automática falla:
1. Espera 1 minuto (Basescan necesita indexar)
2. Intenta verificación manual con el comando verify
3. Verifica que el BASESCAN_API_KEY sea correcto

### Gas Price muy alto
**Solución**: Espera a un momento con menos congestión o ajusta gasPrice en hardhat.config.ts

---

## 📊 Resumen de Costos Estimados

| Operación | Gas Estimado | Costo (a 5 gwei) |
|-----------|--------------|------------------|
| CGC Token | ~1,500,000 | ~0.0075 ETH |
| GovTokenVault | ~2,000,000 | ~0.01 ETH |
| AllowedSignersCondition | ~800,000 | ~0.004 ETH |
| MerklePayouts | ~1,000,000 | ~0.005 ETH |
| **TOTAL** | ~5,300,000 | **~0.027 ETH** |

*Nota: Agregar 50% buffer para seguridad = ~0.04 ETH recomendado*

---

## 🎉 Deployment Exitoso

Una vez completado, tendrás:
- ✅ Todos los contratos desplegados en Base Mainnet
- ✅ **Código fuente verificado en Basescan (automático)**
- ✅ 400,000 CGC en el Vault para recompensas
- ✅ 250,000 CGC en el DAO treasury
- ✅ Shadow mode activado (seguridad)
- ✅ Sistema listo para configuración de gobernanza

### Próximos Pasos
1. ✅ Configurar Token Voting en Aragon
2. ✅ Crear propuesta de permisos
3. ✅ Configurar bots con addresses
4. ✅ Actualizar dashboard
5. ✅ Comenzar distribución de tokens

---

## 📞 Soporte

Si tienes problemas:
- Discord: [CryptoGift DAO Server]
- Email: dao@cryptogift-wallets.com
- GitHub Issues: https://github.com/CryptoGift-Wallets-DAO/issues

---

**Made by mbxarts.com The Moon in a Box property**  
**Co-Author: Godez22**

*Última actualización: 29/08/2025*