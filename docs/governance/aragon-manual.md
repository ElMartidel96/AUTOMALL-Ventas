# 🏛️ Manual de Gobernanza - CryptoGift Wallets DAO en Aragon OSx

## 1. Información del DAO

### 1.1 Datos de Implementación
- **Nombre**: CryptoGift Wallets
- **Chain**: Base Mainnet (Chain ID: 8453)
- **DAO Address**: `0x3244DFBf9E5374DF2f106E89Cf7972E5D4C9ac31`
- **Framework**: Aragon OSx v1.4.0
- **Token Voting Plugin**: `0x5ADD5dc0a677dbB48fAC5e1DE4ca336d40B161a2`
- **CGC Token**: `0x5e3a61b550328f3D8C44f60b3e10a49D3d806175`
- **TimelockController**: `0x9753d772C632e2d117b81d96939B878D74fB5166` (7-day delay)
- **MinterGateway v3.3**: `0xdd10540847a4495e21f01230a0d39C7c6785598F` (Primary Minter)

### 1.2 Acceso al DAO
- **App URL**: https://app.aragon.org/dao/base-mainnet/0x3244DFBf9E5374DF2f106E89Cf7972E5D4C9ac31
- **Block Explorer**: https://basescan.org/address/0x3244DFBf9E5374DF2f106E89Cf7972E5D4C9ac31

## 2. Estructura de Plugins

### 2.1 Token Voting Plugin v1.3

#### Configuración Actual
```javascript
{
  votingMode: "Standard", // Early execution disabled
  supportThreshold: 51,   // 51% mayoría simple
  minParticipation: 10,   // 10% quórum
  minDuration: 604800,    // 7 días
  minProposerVotingPower: 1000 // 0.1% del supply
}
```

#### Funciones Principales
- `createProposal()`: Crear nueva propuesta
- `vote()`: Votar (For/Against/Abstain)
- `execute()`: Ejecutar propuesta aprobada
- `delegate()`: Delegar poder de voto

### 2.2 Admin Plugin v1.2

#### Propósito
Control de emergencia durante fase inicial (a remover en v2)

#### Capacidades
- Ejecutar acciones inmediatas sin votación
- Pausar contratos en emergencias
- Actualizar parámetros críticos

⚠️ **Nota**: Este plugin será removido mediante propuesta cuando el DAO madure.

## 3. Sistema de Permisos

### 3.1 Matriz de Permisos Actual (Updated December 2025)

| Permiso | Origen | Destino | Condición |
|---------|--------|---------|-----------|
| `EXECUTE_PERMISSION` | Token Voting | DAO | - |
| `UPDATE_VOTING_SETTINGS_PERMISSION` | DAO | Token Voting | - |
| `OWNER_ROLE` | TimelockController | CGC Token | 7-day delay |
| `PROPOSER_ROLE` | Aragon DAO | TimelockController | - |
| `EXECUTOR_ROLE` | Aragon DAO | TimelockController | - |
| `AUTHORIZED_CALLER` | Safe 3/5 | MinterGateway | Minting cap enforced |
| `GUARDIAN_ROLE` | Safe 2/3 | MinterGateway | Pause only |

### 3.2 Gestión de Permisos

#### Grant Permission (Otorgar)
```solidity
dao.grant(
    address _where,  // Contrato objetivo
    address _who,    // Quien recibe el permiso
    bytes32 _permissionId // ID del permiso
);
```

#### Grant with Condition
```solidity
// Example: Grant authorized caller role to MinterGateway
dao.grantWithCondition(
    _where: MinterGateway,
    _who: authorizedCallerAddress,
    _permissionId: MINT_CALLER_ROLE,
    _condition: none // Enforced at contract level
);
```

#### Revoke Permission
```solidity
dao.revoke(_where, _who, _permissionId);
```

## 4. Proceso de Propuestas

### 4.1 Tipos de Propuestas

#### REL - Liberación de Tokens (EIP-712)
**Descripción**: Autoriza pagos desde el Vault al cumplir metas verificadas on-chain.

**Metadata Template**:
```json
{
  "title": "Liberación Mensual - Septiembre 2025",
  "summary": "Distribución de 50,000 CGC para 500 contribuidores",
  "description": "Recompensas por quests completados y verificados via EAS",
  "resources": [
    {"name": "Attestations Report", "url": "ipfs://..."},
    {"name": "Distribution List", "url": "ipfs://..."}
  ]
}
```

**Actions**:
```javascript
[
  {
    to: MilestoneEscrow, // 0x8346CFcaECc90d678d862319449E5a742c03f109
    value: 0,
    data: encodeFunctionData("updateCaps", [newDailyCap, newWeeklyCap, newMonthlyCap])
  }
]
```

#### PAR - Cambio de Parámetros
**Ejemplos**:
- Actualizar caps de distribución
- Modificar cooldowns
- Ajustar multiplicadores
- Cambiar parámetros de votación

#### INT - Integraciones
**Ejemplos**:
- Agregar nueva plataforma de quests
- Integrar nuevo protocolo DeFi
- Aprobar partnership

#### EMR - Emergencia
**Requisitos**:
- Requiere 75% de aprobación
- Ejecución inmediata sin timelock
- Solo para situaciones críticas

### 4.2 Ciclo de Vida de una Propuesta

```
1. DRAFT (Borrador)
   ↓
2. PUBLISHED (Publicada) - Inicia periodo de votación
   ↓
3. ACTIVE (Activa) - Votación en curso (7 días)
   ↓
4. SUCCEEDED/DEFEATED (Aprobada/Rechazada)
   ↓
5. EXECUTED (Ejecutada) - Si fue aprobada
```

### 4.3 Crear una Propuesta

#### Paso 1: Preparar Metadata
```javascript
const metadata = {
  title: "Actualizar Cap Diario a 10,000 CGC",
  summary: "Incrementar el límite diario de distribución",
  description: "Debido al crecimiento de usuarios...",
  resources: [
    {
      name: "Análisis de Impacto",
      url: "https://forum.cryptogift.com/t/123"
    }
  ]
};
```

#### Paso 2: Definir Actions
```javascript
const actions = [
  {
    to: "0x8346CFcaECc90d678d862319449E5a742c03f109", // MilestoneEscrow address
    value: 0,
    data: encodeFunctionData({
      abi: MilestoneEscrowABI,
      functionName: "updateCaps",
      args: [10000, 60000, 200000]
    })
  }
];
```

#### Paso 3: Crear Propuesta
```javascript
await tokenVoting.createProposal(
  metadata,
  actions,
  0, // allowFailureMap
  0, // startDate (0 = now)
  0  // endDate (0 = minDuration)
);
```

## 5. Proceso de Votación

### 5.1 Opciones de Voto
- **Yes (1)**: A favor
- **No (2)**: En contra
- **Abstain (3)**: Abstención

### 5.2 Cálculo de Resultados

```
Support % = (Yes) / (Yes + No) × 100
Participation % = (Yes + No + Abstain) / Total Supply × 100

Aprobada si:
- Support % ≥ 51% AND
- Participation % ≥ 10%
```

### 5.3 Delegación

#### Delegar Voto
```javascript
await cgcToken.delegate(delegateAddress);
```

#### Auto-Delegación
```javascript
await cgcToken.delegate(myAddress);
```

#### Verificar Delegación
```javascript
const delegate = await cgcToken.delegates(myAddress);
```

## 6. Ejecución de Propuestas

### 6.1 Requisitos para Ejecución
- Propuesta aprobada (SUCCEEDED)
- Periodo de votación finalizado
- Timelock cumplido (si aplica)
- Caller tiene permisos o es público

### 6.2 Ejecutar via UI
1. Navegar a la propuesta aprobada
2. Click en "Execute"
3. Confirmar transacción
4. Verificar ejecución exitosa

### 6.3 Ejecutar via Smart Contract
```javascript
await dao.execute(
  proposalId,
  actions,
  allowFailureMap
);
```

## 7. Escenarios Comunes

### 7.1 Actualizar Caps del Escrow

**Propuesta**:
```javascript
{
  title: "Incrementar Caps Mensuales",
  actions: [{
    to: MilestoneEscrow, // 0x8346CFcaECc90d678d862319449E5a742c03f109
    data: updateCaps(5000, 30000, 100000)
  }]
}
```

### 7.2 Agregar Nuevo Signer

**Propuesta**:
```javascript
{
  title: "Agregar Bot de Wonderverse como Signer",
  actions: [{
    to: AllowedSignersCondition,
    data: addSigner("0xBotAddress...")
  }]
}
```

### 7.3 Pausar Sistema (Emergencia)

**Propuesta**:
```javascript
{
  title: "EMERGENCIA: Pausar MinterGateway",
  actions: [{
    to: MinterGateway, // 0xdd10540847a4495e21f01230a0d39C7c6785598F
    data: pause() // Requires Guardian role (Safe 2/3)
  }]
}
```

### 7.4 Transferir Fondos del Treasury

**Propuesta**:
```javascript
{
  title: "Funding para Development Q4",
  actions: [{
    to: CGCToken,
    data: transfer(devMultisig, 50000e18)
  }]
}
```

## 8. Herramientas y Scripts

### 8.1 CLI Commands

```bash
# Crear propuesta
npx hardhat dao:propose --network base \
  --title "Mi Propuesta" \
  --description "Descripción" \
  --actions actions.json

# Votar
npx hardhat dao:vote --network base \
  --proposal-id 0x123... \
  --support 1

# Ejecutar
npx hardhat dao:execute --network base \
  --proposal-id 0x123...
```

### 8.2 Scripts Útiles

#### Check Voting Power
```javascript
const votingPower = await tokenVoting.getVotingPower(
  proposalId,
  voterAddress
);
```

#### Get Proposal Details
```javascript
const proposal = await tokenVoting.getProposal(proposalId);
console.log({
  tally: proposal.tally,
  open: proposal.open,
  executed: proposal.executed
});
```

## 9. Seguridad y Best Practices

### 9.1 Antes de Crear una Propuesta
- [ ] Discutir en el foro
- [ ] Obtener feedback preliminar
- [ ] Simular acciones en testnet
- [ ] Verificar addresses correctas
- [ ] Calcular gas costs
- [ ] Preparar documentación de soporte

### 9.2 Seguridad en Votación
- Verificar siempre el contenido de la propuesta
- Revisar el código de las actions
- Considerar posibles efectos secundarios
- No votar propuestas sin documentación
- Reportar propuestas sospechosas

### 9.3 Delegación Segura
- Solo delegar a addresses confiables
- Revisar historial de voto del delegado
- Mantener capacidad de revocar delegación
- No delegar a contratos desconocidos

## 10. Upgrades y Migración

### 10.1 Plan de Descentralización

**Fase 1 (Completada Q4 2024)**: DAO deployed, Admin plugin activo
**Fase 2 (Completada Q4 2025)**: TimelockController + MinterGateway deployed
**Fase 3 (Q1-Q2 2026)**: Remover admin plugin, full DAO autonomy
**Fase 4 (Q3-Q4 2026)**: Implementar optimistic voting

### 10.2 Proceso de Upgrade

1. Propuesta de upgrade en forum
2. Audit del nuevo código
3. Testnet deployment
4. Propuesta formal en DAO
5. Migración coordinada
6. Verificación post-upgrade

## 11. Recursos y Soporte

### 11.1 Links Importantes
- **Forum**: https://forum.cryptogift-wallets.com
- **Discord**: https://discord.gg/cryptogift
- **Docs**: https://docs.cryptogift-wallets.com
- **GitHub**: https://github.com/cryptogift-wallets

### 11.2 Herramientas de Análisis
- **Tally**: https://tally.xyz/gov/cryptogift
- **Boardroom**: https://boardroom.io/cryptogift
- **Snapshot**: https://snapshot.org/#/cryptogift.eth

### 11.3 Contacto de Emergencia
- **Security**: security@cryptogift-wallets.com
- **Multisig Emergencia**: 3/5 signers required
- **War Room Discord**: #emergency-response

## 12. FAQ

**Q: ¿Cuánto CGC necesito para crear una propuesta?**
A: 1,000 CGC (0.05% del supply inicial de 2M)

**Q: ¿Puedo cancelar una propuesta activa?**
A: No, una vez publicada debe completar su ciclo

**Q: ¿Qué pasa si una propuesta no alcanza el quórum?**
A: Se marca como DEFEATED y no puede ejecutarse

**Q: ¿Puedo cambiar mi voto?**
A: Sí, mientras la votación esté activa

**Q: ¿Los tokens en staking pueden votar?**
A: Sí, si el contrato de staking implementa delegation

---

*Manual actualizado para Aragon OSx v1.4.0*
*Última revisión: Diciembre 14, 2025*
*Versión: 1.1 (Governance Update - TimelockController + MinterGateway)*