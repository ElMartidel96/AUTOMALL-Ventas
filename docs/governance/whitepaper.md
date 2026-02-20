# ⚠️ DEPRECATED - See [Whitepaper v1.2](/public/CRYPTOGIFT_WHITEPAPER_v1.2.md)

> **Note**: This document is outdated. The current official whitepaper is **v1.2** available at:
> - Web: https://mbxarts.com/CRYPTOGIFT_WHITEPAPER_v1.2.html
> - Source: `/public/CRYPTOGIFT_WHITEPAPER_v1.2.md`

---

# 📘 CryptoGift Wallets DAO - Whitepaper v1.1 (ARCHIVED)

## Executive Summary

CryptoGift Wallets DAO representa una evolución natural del ecosistema CryptoGift, transformando la educación Web3 en un modelo de gobernanza descentralizada donde el aprendizaje se convierte en poder de decisión. Construido sobre Base (Ethereum L2), el DAO empodera a su comunidad para co-gobernar el protocolo mientras aprenden y ganan.

**Visión**: "From zero to Web3—together. Learn. Earn. Co-govern."

**Misión**: Democratizar el acceso a Web3 mediante un sistema donde completar quests educativos genera tokens de gobernanza, convirtiendo el esfuerzo de aprendizaje en voz y voto en el futuro del protocolo.

## 1. El Problema

### 1.1 Barreras de Entrada a Web3
- **Complejidad técnica**: La curva de aprendizaje de blockchain intimida a nuevos usuarios
- **Falta de incentivos**: El proceso educativo tradicional no recompensa el progreso
- **Desconexión gobernanza-comunidad**: Los protocolos son gobernados por early adopters con capital
- **Ausencia de camino claro**: No existe una ruta estructurada de novato a contribuidor

### 1.2 Limitaciones de Modelos Actuales
- **Airdrop farming**: Comportamiento mercenario sin compromiso real
- **Vote buying**: Concentración de poder en ballenas
- **Participación superficial**: Usuarios que votan sin entender las propuestas
- **Educación desconectada**: Cursos que no llevan a participación activa

## 2. La Solución: CryptoGift Wallets DAO

### 2.1 Arquitectura del Sistema

```
Usuario → Quest Completado → Attestation EAS → MilestoneEscrow → CGC Tokens → Poder de Gobernanza
```

### 2.2 Componentes Clave

#### Token de Gobernanza (CGC)
- **Nombre**: CryptoGift Coin
- **Símbolo**: CGC
- **Supply Total**: 2,000,000 CGC
- **Blockchain**: Base (L2 de Ethereum)
- **Estándar**: ERC-20
- **Dirección**: `0x5e3a61b550328f3D8C44f60b3e10a49D3d806175`

#### Sistema de Liberación Programática - Stack Actual
- **MasterEIP712Controller**: `0x67D9a01A3F7b5D38694Bb78dD39286Db75D7D869`
  - Control layer para toda la lógica de autorización
  - Gestión de firmantes y permisos
  
- **TaskRulesEIP712**: `0xdDcfFF04eC6D8148CDdE3dBde42456fB32bcC5bb`
  - Validation layer para reglas de tareas
  - Lógica de verificación de completitud
  
- **MilestoneEscrow**: `0x8346CFcaECc90d678d862319449E5a742c03f109`
  - Custody layer para tokens CGC
  - Único gate de liberación con EIP-712 + EAS
  - Auto-payments tras validación admin
  
**Nota**: Los contratos anteriores (GovTokenVault, AllowedSignersCondition, MerklePayouts) están deprecados y reemplazados por el stack actual.

#### Gobernanza Aragon OSx
- **Framework**: Aragon OSx v1.4.0
- **Plugin**: Token Voting v1.3
- **Contrato DAO**: `0x3244DFBf9E5374DF2f106E89Cf7972E5D4C9ac31`
- **Red**: Base Mainnet (Chain ID: 8453)

## 3. Tokenomics

### 3.1 Distribución Inicial

| Categoría | Asignación | Cantidad | Vesting |
|-----------|------------|----------|---------|
| Recompensas Educativas | 40% | 800,000 CGC | Liberación programática por metas con caps |
| Tesoro DAO | 25% | 500,000 CGC | Controlado por gobernanza |
| Core Contributors | 15% | 300,000 CGC | 2 años, cliff 6 meses |
| Desarrollo Ecosistema | 10% | 200,000 CGC | Grants y partnerships |
| Liquidez | 5% | 100,000 CGC | DEX pools |
| Reserva Emergencia | 5% | 100,000 CGC | Multisig 3/5 |

### 3.2 Modelo de Emisión con Caps Operativos

#### Recompensas por Tipo de Meta (Base)
- **Metas Diarias**: 100-500 CGC
- **Metas Semanales**: 1,000-5,000 CGC
- **Metas Mensuales**: 10,000-50,000 CGC
- **Achievements Especiales**: Variable según impacto

#### Caps y Límites Operativos
- **Cap Anual**: 800,000 CGC (pool total de recompensas)
- **Cap Mensual**: 66,666 CGC (1/12 del anual)
- **Cap Semanal**: 16,666 CGC (25% del mensual)
- **Cap Diario por Usuario**: 333 CGC (2% del semanal)
- **Cap Post-Multiplicador**: Máximo 120% del tier base

#### Multiplicadores (aplicados en orden)
1. **Streak Bonus**: x1.1 por 7 días consecutivos
2. **Referral Reward**: 10% del earning del referido
3. **Quality Bonus**: x1.5 por contribuciones destacadas
4. **Early Adopter**: x2 primeros 1,000 usuarios

**Fórmula Final**: `min(base_reward * multiplicadores_combinados, cap_post_multiplicador, cap_diario_usuario)`

### 3.3 Utilidad del Token

1. **Gobernanza**
   - Crear y votar propuestas
   - Delegar poder de voto
   - Participar en decisiones del tesoro
   - Sin derechos económicos o revenue sharing

2. **Acceso y Beneficios**
   - Acceso a contenido premium educativo
   - Prioridad en nuevas features
   - Badges y certificaciones NFT
   - Acceso a eventos exclusivos

3. **Boosts y Mejoras** (no financieros)
   - Multiplicadores de experiencia
   - Reducción de cooldowns
   - Acceso anticipado a nuevos quests
   - Personalización de perfil avanzada

## 4. Mecanismos de Gobernanza

### 4.1 Estructura de Propuestas

#### Tipos de Propuesta (Process REL)
1. **Liberación de Tokens**: Distribución de recompensas vía MilestoneEscrow
2. **Cambios de Parámetros**: Ajuste de caps, límites, multiplicadores
3. **Integraciones**: Nuevas plataformas de quests
4. **Treasury Management**: Uso de fondos del DAO
5. **Emergencias**: Pausas, recuperación de fondos

#### Parámetros de Votación (Token Voting Plugin)
- **minParticipation**: 10% del total supply (200,000 CGC)
- **supportThreshold**: 51% de votos a favor sobre votos emitidos
- **minDuration**: 7 días (periodo de votación)
- **minProposerVotingPower**: 1,000 CGC
- **Snapshot**: Al momento de creación de propuesta

**Nota**: Los parámetros se basan en el total supply, no en "tokens en circulación", para evitar ambigüedades.

### 4.2 Delegación y Representación

- **Liquid Democracy**: Delegación revocable en cualquier momento
- **Delegation Rewards**: Incentivos no financieros para delegados activos
- **Transparencia**: Historial de votos público on-chain

### 4.3 Escenarios de Votación

| Escenario | Participación Requerida | Votos a Favor Necesarios |
|-----------|------------------------|-------------------------|
| Supply Total | 200,000 CGC | 102,000 CGC |
| Con 50% Delegado | 200,000 CGC | 102,000 CGC |
| Con 80% en Vesting | 200,000 CGC | 102,000 CGC |

## 5. Sistema de Quests y Educación

### 5.1 Categorías de Quests

#### Onboarding (Nivel 1)
- Crear primera wallet
- Primer swap
- Primera transacción
- Conectar con dApps

**Nota**: KYC es opcional y no remunerado, separado del sistema de gobernanza.

#### DeFi Basics (Nivel 2)
- Proveer liquidez
- Stake tokens
- Usar un bridge
- Interactuar con lending protocol

#### Advanced (Nivel 3)
- Deploy smart contract
- Crear propuesta DAO
- Auditar código
- Contribuir a documentación

### 5.2 Sistema de Attestations

```solidity
struct GoalCompleted {
    address recipient;
    uint256 goalId;
    uint256 score;
    uint256 timestamp;
    uint256 expirationTime;
    bytes32 schemaUID;
}
```

#### Schema UIDs EAS (Base Mainnet)
- **Goal Completion**: `0x...` (pendiente de registro)
- **Task Validation**: `0x...` (pendiente de registro)
- **Milestone Achievement**: `0x...` (pendiente de registro)

#### Flujo de Verificación
1. Usuario completa quest en plataforma (Wonderverse/Dework/Zealy)
2. Bot verifica cumplimiento
3. Se emite attestation EAS on-chain con TTL 15-30 minutos
4. Admin valida en panel de administración
5. MilestoneEscrow libera tokens automáticamente
6. Anti-replay: nonce único por attestation

## 6. Arquitectura Técnica

### 6.1 Smart Contracts - Stack Actual

#### MilestoneEscrow
- **Dirección**: `0x8346CFcaECc90d678d862319449E5a742c03f109`
- **Función**: Custodia y liberación programática de CGC
- **Verificación**: EIP-712 signatures con EAS attestations
- **Seguridad**: Pausable, caps operativos, cooldowns, anti-replay
- **Auto-payments**: Liberación automática post-validación

#### MasterEIP712Controller
- **Dirección**: `0x67D9a01A3F7b5D38694Bb78dD39286Db75D7D869`
- **Función**: Control centralizado de autorizaciones
- **Integración**: Aragon permission system
- **Control**: Solo DAO puede modificar configuración

#### TaskRulesEIP712
- **Dirección**: `0xdDcfFF04eC6D8148CDdE3dBde42456fB32bcC5bb`
- **Función**: Validación de reglas de tareas
- **Verificación**: Lógica de completitud y elegibilidad
- **Integración**: Con MilestoneEscrow para releases

### 6.2 Infraestructura Off-chain

#### Bots y Servicios
- **Attestation Bot**: Emisión automática de certificados EAS
- **Discord Bot**: Integración con roles y quests
- **Admin Panel**: Validación y aprobación de tareas
- **API Gateway**: Webhooks para plataformas externas

#### Monitoring y Analytics
- **Dashboard**: Métricas en tiempo real
- **Alertas**: Anomalías y límites excedidos
- **Reporting**: Transparencia del tesoro

## 7. Seguridad y Riesgos

### 7.1 Medidas de Seguridad

#### Smart Contract Security
- Auditoría externa pre-launch (pendiente)
- Bug bounty program (hasta 100,000 CGC)
- Timelock en funciones críticas (48h)
- Emergency pause mechanism (multisig 3/5)

#### Operational Security
- **Pausar Sistema**: Deployer wallet + DAO multisig
- **Modificar Caps**: Propuesta DAO (7 días votación)
- **Rotación de Claves**: Trimestral para hot wallets
- **Incident Response**: SLA 1h crítico, 4h alto, 24h medio

### 7.2 Vectores de Riesgo y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Exploit smart contract | Baja | Alto | Auditorías, bug bounty, pausable |
| Sybil attack en quests | Media | Medio | Caps por usuario, rate limits, validación manual |
| Governance attack | Baja | Alto | minParticipation alto, timelock, veto multisig |
| Oracle manipulation | Baja | Medio | Multiple attestation sources, TTL corto |
| Emisiones descontroladas | Media | Alto | Caps jerárquicos, shadow mode, pause |

### 7.3 Política de Privacidad y Datos

- **KYC Opcional**: No vinculado a emisión de tokens
- **Datos Mínimos**: Solo wallet address y completitud de quests
- **Retención**: 90 días para datos operativos
- **GDPR Compliance**: Derecho al olvido implementado

## 8. Roadmap v2 (Actualizado)

### Q4 2024 - Foundation ✅
- [x] Deploy DAO en Aragon
- [x] Configurar Token Voting plugin
- [x] Lanzar CGC token (2M supply)
- [x] Implementar MilestoneEscrow
- [x] Deploy MasterEIP712Controller
- [x] Deploy TaskRulesEIP712

### Q1 2025 - Launch (En progreso)
- [x] Sistema de tareas competitivo
- [x] Panel de administración
- [x] Auto-payments implementados
- [ ] Integración con Wonderverse
- [ ] Primeras 100 quests live
- [ ] 1,000 usuarios activos

### Q2 2025 - Growth
- [ ] Integración Dework y Zealy
- [ ] Lanzamiento mobile app
- [ ] 10,000 usuarios activos
- [ ] Partnerships con 5 protocolos
- [ ] Auditoría de seguridad completa

### Q3 2025 - Expansion
- [ ] Multi-chain deployment (Optimism, Arbitrum)
- [ ] Advanced DeFi quests
- [ ] 50,000 usuarios activos
- [ ] Sistema de badges NFT

### Q4 2025 - Maturity
- [ ] Full decentralization
- [ ] 100,000 usuarios activos
- [ ] Self-sustaining treasury
- [ ] Governance v2.0 con mejoras UX

## 9. Modelo de Sostenibilidad

### 9.1 Fuentes de Ingresos (Proyectadas)

1. **Protocol Fees**: 0.5% en swaps del ecosistema (futuro)
2. **Premium Features**: Suscripciones para features avanzadas
3. **B2B Services**: Educación white-label para empresas
4. **Grant Funding**: Ethereum Foundation, Base Ecosystem Fund
5. **NFT Sales**: Collectibles y certificados educativos

### 9.2 Uso del Treasury

- **40%**: Desarrollo y mantenimiento
- **30%**: Marketing y growth
- **20%**: Reservas y liquidez
- **10%**: Bug bounties y seguridad

## 10. Conclusión

CryptoGift Wallets DAO representa un nuevo paradigma en la educación y gobernanza Web3. Al alinear incentivos entre aprendizaje, earning y gobernanza, creamos un flywheel sostenible donde cada nuevo miembro fortalece el ecosistema.

Nuestra visión es clara: democratizar el acceso a Web3 no solo como usuarios, sino como co-propietarios y decisores del futuro descentralizado.

## 11. Referencias y Enlaces On-Chain

### Contratos Verificados (Base Mainnet)
- [CGC Token](https://basescan.org/address/0x5e3a61b550328f3D8C44f60b3e10a49D3d806175)
- [MilestoneEscrow](https://basescan.org/address/0x8346CFcaECc90d678d862319449E5a742c03f109)
- [MasterEIP712Controller](https://basescan.org/address/0x67D9a01A3F7b5D38694Bb78dD39286Db75D7D869)
- [TaskRulesEIP712](https://basescan.org/address/0xdDcfFF04eC6D8148CDdE3dBde42456fB32bcC5bb)
- [DAO Contract](https://basescan.org/address/0x3244DFBf9E5374DF2f106E89Cf7972E5D4C9ac31)

### Documentación Técnica
- [Aragon OSx v1.4.0 Documentation](https://devs.aragon.org)
- [Token Voting Plugin v1.3](https://github.com/aragon/osx-plugins)
- [Ethereum Attestation Service](https://attest.org)
- [Base Documentation](https://docs.base.org)
- [EIP-712 Standard](https://eips.ethereum.org/EIPS/eip-712)
- [ERC-1271 Standard](https://eips.ethereum.org/EIPS/eip-1271)

## 12. Disclaimer

Este whitepaper es un documento vivo que evolucionará con el feedback de la comunidad. Los tokens CGC son tokens de gobernanza pura y **NO** constituyen securities ni otorgan derechos económicos o financieros. No existe "revenue sharing" asociado al token CGC. El token otorga exclusivamente derechos de gobernanza y acceso a features del protocolo. Participa bajo tu propio riesgo.

El proyecto se encuentra en desarrollo activo y los parámetros pueden cambiar mediante propuestas de gobernanza. KYC es opcional y no está vinculado a la obtención de tokens de gobernanza.

---

**Contacto**
- Website: https://crypto-gift-wallets-dao.vercel.app
- Discord: https://discord.gg/cryptogift
- Twitter: @cryptogiftdao
- Email: dao@cryptogift-wallets.com
- GitHub: https://github.com/CryptoGift-Wallets-DAO

*Última actualización: 9 de Enero, 2025*
*Versión: 1.1*

## Changelog

### v1.1 (9 Enero 2025)
- Actualizado supply total a 2,000,000 CGC (realidad on-chain)
- Reemplazado stack legacy (Vault/AllowedSigners/Merkle) por arquitectura actual (Master/TaskRules/MilestoneEscrow)
- Añadidas direcciones de contratos verificados en Base Mainnet
- Introducidos caps operativos (anual/mensual/semanal/diario) y cap post-multiplicador
- Redefinidos parámetros de gobernanza en términos de Token Voting plugin
- Movido KYC a opcional/no-remunerado fuera del sistema de gobernanza
- Eliminadas referencias a "revenue sharing" y derechos económicos del token
- Actualizado roadmap v2 con hitos completados y pendientes
- Añadidas políticas de privacidad y datos
- Incluidos enlaces on-chain y schema UIDs (pendientes de registro)

### v1.0 (28 Agosto 2025)
- Release inicial del whitepaper
- Definición de tokenomics con 1M supply (posteriormente actualizado)
- Arquitectura inicial con GovTokenVault (deprecado)