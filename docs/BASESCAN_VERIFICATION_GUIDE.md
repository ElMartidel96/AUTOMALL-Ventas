# 🔍 GUÍA PASO A PASO: Verificación Manual en BaseScan

## ⚠️ IMPORTANTE
La verificación automática via API falló con error 403 (rate limiting). Esta guía te ayudará a verificar los contratos manualmente.

---

## 📋 CONTRATOS A VERIFICAR

| Contrato | Address | Estado |
|----------|---------|--------|
| TimelockController | `0x9753d772C632e2d117b81d96939B878D74fB5166` | ❌ No verificado |
| MinterGateway | `0xdd10540847a4495e21f01230a0d39C7c6785598F` | ❌ No verificado |

---

## 🔧 VERIFICACIÓN #1: TimelockController

### PASO 1: Ir a BaseScan
1. Abre: https://basescan.org/address/0x9753d772C632e2d117b81d96939B878D74fB5166#code
2. Click en la pestaña **"Contract"**
3. Click en **"Verify and Publish"**

### PASO 2: Seleccionar Tipo de Verificación
- **Compiler Type**: `Solidity (Single file)`
- **Compiler Version**: `v0.8.20+commit.a1b79de6`
- **Open Source License Type**: `MIT License (MIT)`
- Click **Continue**

### PASO 3: Configuración del Contrato
- **Optimization**: `Yes`
- **Optimization Runs**: `200`
- **EVM Version**: `paris`

### PASO 4: Código Fuente
**OPCIÓN A - Usar Código Flattened (RECOMENDADO):**

Pega el contenido completo del archivo:
**`contracts/flattened/TimelockController_BASESCAN.sol`** (1232 líneas)

Este archivo ya está limpio y listo para copiar.

**OPCIÓN B - Usar Import (alternativa):**

Si la OPCIÓN A no funciona, intenta con verificación standard-json-input.

### PASO 5: Constructor Arguments (ABI-encoded)
```
0000000000000000000000000000000000000000000000000000000000093a80000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000000100000000000000000000000011323672b5f9bb899fa332d5d464cc4e66637b42000000000000000000000000000000000000000000000000000000000000000100000000000000000000000011323672b5f9bb899fa332d5d464cc4e66637b42
```

**Desglose de argumentos:**
- `minDelay`: 604800 (7 días en segundos = 0x93a80)
- `proposers`: [`0x11323672b5f9BB899FA332d5D464CC4e66637B42`] (Gnosis Safe)
- `executors`: [`0x11323672b5f9BB899FA332d5D464CC4e66637B42`] (Gnosis Safe)

### PASO 6: Verificar
- Click **"Verify and Publish"**
- Espera confirmación ✅

---

## 🔧 VERIFICACIÓN #2: MinterGateway

### PASO 1: Ir a BaseScan
1. Abre: https://basescan.org/address/0xdd10540847a4495e21f01230a0d39C7c6785598F#code
2. Click en la pestaña **"Contract"**
3. Click en **"Verify and Publish"**

### PASO 2: Seleccionar Tipo de Verificación
- **Compiler Type**: `Solidity (Single file)`
- **Compiler Version**: `v0.8.20+commit.a1b79de6`
- **Open Source License Type**: `MIT License (MIT)`
- Click **Continue**

### PASO 3: Configuración del Contrato
- **Optimization**: `Yes`
- **Optimization Runs**: `200`
- **EVM Version**: `paris`

### PASO 4: Código Fuente
Pega el contenido completo del archivo:
**`contracts/flattened/MinterGateway_BASESCAN.sol`** (687 líneas)

Este archivo ya está limpio y listo para copiar. El código comienza con:
```solidity
// SPDX-License-Identifier: MIT
// Sources flattened with hardhat v2.26.3 https://hardhat.org
```

### PASO 5: Constructor Arguments (ABI-encoded)
```
0000000000000000000000005e3a61b550328f3d8c44f60b3e10a49d3d80617500000000000000000000000011323672b5f9bb899fa332d5d464cc4e66637b42000000000000000000000000e9411dd1f2af42186b2bce828b6e7d0dd0d7a6bc
```

**Desglose de argumentos:**
- `_cgcToken`: `0x5e3a61b550328f3D8C44f60b3e10a49D3d806175` (CGC Token)
- `_owner`: `0x11323672b5f9BB899FA332d5D464CC4e66637B42` (Gnosis Safe)
- `_guardian`: `0xe9411dD1f2AF42186B2bce828b6E7D0dD0d7A6bc` (Guardian EOA)

### PASO 6: Verificar
- Click **"Verify and Publish"**
- Espera confirmación ✅

---

## 🚨 TROUBLESHOOTING

### Error: "Bytecode does not match"
- Verifica que el **Compiler Version** sea exactamente `v0.8.20+commit.a1b79de6`
- Verifica que **Optimization** esté en `Yes` con `200` runs
- Verifica que el **EVM Version** sea `paris`

### Error: "Constructor arguments incorrect"
- Los arguments deben estar en formato hexadecimal SIN el prefijo `0x`
- Copia exactamente los valores proporcionados arriba

### Error: "Contract source code already verified"
- ¡El contrato ya está verificado! ✅

### Si nada funciona - OPCIÓN ALTERNATIVA

Usa **Standard Input JSON** en lugar de Single File:

1. Selecciona **Compiler Type**: `Solidity (Standard-Json-Input)`
2. Sube el archivo JSON generado por Hardhat:
   - Compila: `pnpm exec hardhat compile`
   - Busca en: `artifacts/build-info/*.json`
   - Encuentra el archivo más reciente

---

## ✅ VERIFICACIÓN COMPLETADA

Después de verificar ambos contratos, deberías ver:
- ✅ Badge verde de "Contract Source Code Verified"
- ✅ Pestaña "Read Contract" disponible
- ✅ Pestaña "Write Contract" disponible

### URLs para confirmar:
- TimelockController: https://basescan.org/address/0x9753d772C632e2d117b81d96939B878D74fB5166#code
- MinterGateway: https://basescan.org/address/0xdd10540847a4495e21f01230a0d39C7c6785598F#code

---

## 📝 SIGUIENTE PASO

Una vez verificados los contratos, continúa con:
**`docs/ARAGON_PROPOSAL_GUIDE.md`** - Para crear la propuesta en Aragon DAO

---

Made by mbxarts.com The Moon in a Box property
