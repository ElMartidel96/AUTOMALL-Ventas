# 📋 GUÍA PASO A PASO: Crear Propuesta en Aragon DAO

## ⚠️ SITUACIÓN ACTUAL (14 DIC 2025)
- **DAO Address**: `0x3244DFBf9E5374DF2f106E89Cf7972E5D4C9ac31`
- **Token Voting Plugin**: `0x5ADD5dc0a677dbB48fAC5e1DE4ca336d40B161a2`
- **Governance Token**: CGC (`0x5e3a61b550328f3D8C44f60b3e10a49D3d806175`)
- **Tu Balance**: 495,300 CGC ✅
- **Mínimo para proponer**: 1 CGC ✅

### ✅ CONTRATOS VERIFICADOS EN BASESCAN
- **TimelockController**: [`0x9753d772C632e2d117b81d96939B878D74fB5166`](https://basescan.org/address/0x9753d772C632e2d117b81d96939B878D74fB5166#code) ✅
- **MinterGateway**: [`0xdd10540847a4495e21f01230a0d39C7c6785598F`](https://basescan.org/address/0xdd10540847a4495e21f01230a0d39C7c6785598F#code) ✅

---

## 🎯 OBJETIVO DE LA PROPUESTA

Ejecutar 4 acciones sobre el contrato CGCToken para configurar el MinterGateway:

| # | Función | Argumento |
|---|---------|-----------|
| 1 | `addMinter` | `0xdd10540847a4495e21f01230a0d39C7c6785598F` (Gateway) |
| 2 | `removeMinter` | `0x8346CFcaECc90d678d862319449E5a742c03f109` (Escrow) |
| 3 | `removeMinter` | `0xc655BF2Bd9AfA997c757Bef290A9Bb6ca41c5dE6` (Deployer) |
| 4 | `transferOwnership` | `0x9753d772C632e2d117b81d96939B878D74fB5166` (Timelock) |

---

## 📝 PASO A PASO EN ARAGON APP

### PASO 1: Conectar Wallet
1. Ve a: https://app.aragon.org/dao/base-mainnet/0x3244DFBf9E5374DF2f106E89Cf7972E5D4C9ac31/proposals
2. Click en **"Connect Wallet"** (arriba a la derecha)
3. Selecciona **MetaMask** o tu wallet
4. Asegúrate de estar en **Base Network** (Chain ID 8453)
5. Usa la wallet del deployer: `0xc655BF2Bd9AfA997c757Bef290A9Bb6ca41c5dE6`

### PASO 2: Crear Nueva Propuesta
1. Click en el botón **"New Proposal"** o **"Create Proposal"**
2. Selecciona **"Create with Actions"** o **"Custom Actions"**

### PASO 3: Información de la Propuesta
- **Title**: `Configure MinterGateway v3.3 - Supply Cap System`
- **Summary/Description**:
```
This proposal configures the MinterGateway system for controlled CGC minting:

1. Add MinterGateway (0xdd10540847a4495e21f01230a0d39C7c6785598F) as authorized minter
2. Remove MilestoneEscrow (0x8346CFcaECc90d678d862319449E5a742c03f109) as minter - it never uses mint()
3. Remove Deployer (0xc655BF2Bd9AfA997c757Bef290A9Bb6ca41c5dE6) as minter
4. Transfer CGCToken ownership to TimelockController (0x9753d772C632e2d117b81d96939B878D74fB5166) with 7-day delay

After this, the Gateway will be the ONLY minter with an enforced 22M supply cap.
```

### PASO 4: Agregar Acción #1 - addMinter(Gateway)
1. Click **"Add Action"** o **"+"**
2. Selecciona **"External Contract"** o **"Raw Transaction"**
3. Llena los campos:
   - **Contract Address**: `0x5e3a61b550328f3D8C44f60b3e10a49D3d806175`
   - **ABI** (pegar este JSON):
   ```json
   [{"inputs":[{"name":"minter","type":"address"}],"name":"addMinter","outputs":[],"stateMutability":"nonpayable","type":"function"}]
   ```
   - **Function**: `addMinter`
   - **minter (address)**: `0xdd10540847a4495e21f01230a0d39C7c6785598F`
   - **ETH Value**: `0`

### PASO 5: Agregar Acción #2 - removeMinter(Escrow)
1. Click **"Add Action"** otra vez
2. Llena los campos:
   - **Contract Address**: `0x5e3a61b550328f3D8C44f60b3e10a49D3d806175`
   - **ABI**:
   ```json
   [{"inputs":[{"name":"minter","type":"address"}],"name":"removeMinter","outputs":[],"stateMutability":"nonpayable","type":"function"}]
   ```
   - **Function**: `removeMinter`
   - **minter (address)**: `0x8346CFcaECc90d678d862319449E5a742c03f109`
   - **ETH Value**: `0`

### PASO 6: Agregar Acción #3 - removeMinter(Deployer)
1. Click **"Add Action"** otra vez
2. Llena los campos:
   - **Contract Address**: `0x5e3a61b550328f3D8C44f60b3e10a49D3d806175`
   - **ABI**: (mismo que paso 5)
   - **Function**: `removeMinter`
   - **minter (address)**: `0xc655BF2Bd9AfA997c757Bef290A9Bb6ca41c5dE6`
   - **ETH Value**: `0`

### PASO 7: Agregar Acción #4 - transferOwnership(Timelock)
1. Click **"Add Action"** otra vez
2. Llena los campos:
   - **Contract Address**: `0x5e3a61b550328f3D8C44f60b3e10a49D3d806175`
   - **ABI**:
   ```json
   [{"inputs":[{"name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"}]
   ```
   - **Function**: `transferOwnership`
   - **newOwner (address)**: `0x9753d772C632e2d117b81d96939B878D74fB5166`
   - **ETH Value**: `0`

### PASO 8: Revisar y Enviar
1. Revisa que las 4 acciones estén correctas
2. Click **"Create Proposal"** o **"Submit"**
3. Confirma la transacción en MetaMask
4. Paga el gas (~0.0001 ETH en Base)

### PASO 9: Votar
1. Una vez creada la propuesta, necesitas votar
2. Click **"Vote"** → **"Yes"**
3. Confirma la transacción
4. Con 495,300 CGC de 2,000,000 total (24.7%), deberías poder aprobar

### PASO 10: Ejecutar (si está aprobada)
1. Si la propuesta alcanza el quórum y aprobación, aparecerá **"Execute"**
2. Click **"Execute"**
3. Confirma la transacción
4. ¡Las 4 acciones se ejecutarán atómicamente!

---

## 🔧 DATOS TÉCNICOS PARA REFERENCIA

### Contract Address (CGCToken):
```
0x5e3a61b550328f3D8C44f60b3e10a49D3d806175
```

### Full ABI (todas las funciones):
```json
[
  {"inputs":[{"name":"minter","type":"address"}],"name":"addMinter","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"name":"minter","type":"address"}],"name":"removeMinter","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"}
]
```

### Calldatas Pre-encodados (alternativa):
Si la interfaz permite raw calldata:

| Acción | Calldata |
|--------|----------|
| addMinter(Gateway) | `0x983b2d56000000000000000000000000dd10540847a4495e21f01230a0d39c7c6785598f` |
| removeMinter(Escrow) | `0x3092afd50000000000000000000000008346cfcaecc90d678d862319449e5a742c03f109` |
| removeMinter(Deployer) | `0x3092afd5000000000000000000000000c655bf2bd9afa997c757bef290a9bb6ca41c5de6` |
| transferOwnership(Timelock) | `0xf2fde38b0000000000000000000000009753d772c632e2d117b81d96939b878d74fb5166` |

---

## ⚠️ VERIFICACIÓN POST-EJECUCIÓN

Después de ejecutar la propuesta, verifica:

```bash
# Gateway es minter
cast call 0x5e3a61b550328f3D8C44f60b3e10a49D3d806175 "minters(address)(bool)" 0xdd10540847a4495e21f01230a0d39C7c6785598F --rpc-url https://mainnet.base.org
# Debe retornar: true

# Escrow NO es minter
cast call 0x5e3a61b550328f3D8C44f60b3e10a49D3d806175 "minters(address)(bool)" 0x8346CFcaECc90d678d862319449E5a742c03f109 --rpc-url https://mainnet.base.org
# Debe retornar: false

# Owner es Timelock
cast call 0x5e3a61b550328f3D8C44f60b3e10a49D3d806175 "owner()(address)" --rpc-url https://mainnet.base.org
# Debe retornar: 0x9753d772C632e2d117b81d96939B878D74fB5166
```

---

Made by mbxarts.com The Moon in a Box property
