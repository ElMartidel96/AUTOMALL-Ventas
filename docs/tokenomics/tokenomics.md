# 💰 CryptoGift Coin (CGC) - Tokenomics Completo v1.0

## 1. Información Básica del Token

### 1.1 Especificaciones Técnicas
- **Nombre**: CryptoGift Coin
- **Símbolo**: CGC
- **Decimales**: 18
- **Supply Total**: 1,000,000 CGC
- **Supply Inicial Circulante**: 50,000 CGC (5%)
- **Blockchain**: Base (Ethereum L2)
- **Estándar**: ERC-20
- **Contrato**: `[A ser desplegado]`

### 1.2 Características del Token
- **Transferible**: Sí
- **Burnable**: No (supply fijo)
- **Mintable**: No (supply fijo)
- **Pausable**: Sí (emergencias via DAO)
- **Upgradeable**: No (inmutable)

## 2. Distribución y Asignación

### 2.1 Tabla de Distribución

| Categoría | % | Cantidad CGC | Cliff | Vesting | Detalles |
|-----------|---|--------------|-------|---------|----------|
| **Recompensas Educativas** | 40% | 400,000 | - | Programático | Liberación por cumplimiento de metas |
| **Tesoro DAO** | 25% | 250,000 | - | - | Controlado por gobernanza |
| **Core Contributors** | 15% | 150,000 | 6 meses | 24 meses lineal | Fundadores y equipo inicial |
| **Desarrollo Ecosistema** | 10% | 100,000 | - | 36 meses | Grants, partnerships, integraciones |
| **Liquidez DEX** | 5% | 50,000 | - | - | Pools iniciales Base/Uniswap |
| **Reserva Emergencia** | 5% | 50,000 | - | - | Multisig 3/5, solo emergencias |

### 2.2 Calendario de Liberación (Release Schedule)

```
Mes 0 (TGE):
- Liquidez DEX: 50,000 CGC (100%)
- Recompensas: 20,000 CGC (5% del allocation)
- Total Circulante: 70,000 CGC (7%)

Mes 1-6:
- Recompensas: ~11,000 CGC/mes
- Core Team: 0 CGC (cliff period)
- Total nuevo: ~66,000 CGC

Mes 7-12:
- Recompensas: ~11,000 CGC/mes
- Core Team: ~6,250 CGC/mes
- Ecosistema: ~2,777 CGC/mes
- Total nuevo: ~120,000 CGC

Mes 13-24:
- Recompensas: ~11,000 CGC/mes
- Core Team: ~6,250 CGC/mes
- Ecosistema: ~2,777 CGC/mes
- Total nuevo: ~240,000 CGC

Mes 25-36:
- Recompensas: ~8,300 CGC/mes (declining)
- Core Team: 0 CGC (vested)
- Ecosistema: ~2,777 CGC/mes
- Total nuevo: ~133,000 CGC
```

## 3. Modelo de Emisión de Recompensas

### 3.1 Estructura de Recompensas por Categoría

#### Tier 1: Onboarding (0-100 CGC)
```javascript
{
  "create_wallet": 10,
  "first_transaction": 20,
  "connect_discord": 15,
  "complete_profile": 25,
  "verify_email": 10,
  "first_referral": 20
}
```

#### Tier 2: Aprendizaje Básico (100-500 CGC)
```javascript
{
  "complete_defi_basics": 100,
  "first_swap": 150,
  "provide_liquidity": 200,
  "stake_tokens": 150,
  "bridge_assets": 100,
  "complete_quiz": 50
}
```

#### Tier 3: Participación Activa (500-2,000 CGC)
```javascript
{
  "create_proposal": 1000,
  "vote_10_proposals": 500,
  "delegate_tokens": 200,
  "attend_community_call": 300,
  "contribute_documentation": 750,
  "report_bug": 1000
}
```

#### Tier 4: Contribución Avanzada (2,000-10,000 CGC)
```javascript
{
  "code_contribution_merged": 5000,
  "security_vulnerability": 10000,
  "create_educational_content": 3000,
  "organize_community_event": 4000,
  "onboard_50_users": 7500
}
```

### 3.2 Sistema de Multiplicadores

#### Multiplicadores Base
- **Daily Streak 7d**: x1.1
- **Daily Streak 30d**: x1.25
- **Daily Streak 90d**: x1.5
- **First 1000 Users**: x2.0
- **Referral Tier 1 (1-10)**: x1.1
- **Referral Tier 2 (11-50)**: x1.25
- **Referral Tier 3 (51+)**: x1.5

#### Multiplicadores de Calidad
- **Content Quality A**: x1.5
- **Content Quality B**: x1.25
- **Content Quality C**: x1.0
- **Bug Severity Critical**: x3.0
- **Bug Severity High**: x2.0
- **Bug Severity Medium**: x1.5
- **Bug Severity Low**: x1.0

### 3.3 Caps y Límites

#### Límites Globales
- **Daily Cap Global**: 5,000 CGC
- **Weekly Cap Global**: 30,000 CGC
- **Monthly Cap Global**: 100,000 CGC

#### Límites por Usuario
- **Daily Cap Usuario**: 500 CGC
- **Weekly Cap Usuario**: 3,000 CGC
- **Monthly Cap Usuario**: 10,000 CGC
- **Cooldown Mínimo**: 1 hora entre claims

#### Límites por Campaña
- **Max Participantes**: 10,000
- **Max Reward Pool**: 50,000 CGC
- **Duración Máxima**: 90 días

## 4. Mecánicas de Staking y Locking

### 4.1 Staking Rewards

| Periodo Lock | APY Base | Bonus Gobernanza | Total APY Max |
|-------------|----------|------------------|---------------|
| No Lock | 5% | 0% | 5% |
| 30 días | 8% | 2% | 10% |
| 90 días | 12% | 5% | 17% |
| 180 días | 15% | 10% | 25% |
| 365 días | 20% | 15% | 35% |

### 4.2 veCGC (Vote Escrowed CGC)

```
veCGC = CGC_amount * time_locked / max_time
```

- **Max Time**: 4 años
- **Min Time**: 1 semana
- **Decay**: Linear
- **Beneficios veCGC**:
  - Boost en rewards (hasta 2.5x)
  - Mayor peso de voto
  - Acceso a airdrops exclusivos
  - Revenue sharing

## 5. Economía y Flujos de Valor

### 5.1 Fuentes de Demanda (Buy Pressure)

1. **Gobernanza**: Necesidad de CGC para votar
2. **Staking**: Lock para obtener yields
3. **Premium Features**: Pago en CGC con 20% descuento
4. **Speculation**: Trading y arbitraje
5. **Treasury Buybacks**: 20% de revenues para recompra

### 5.2 Fuentes de Oferta (Sell Pressure)

1. **Reward Dumping**: Usuarios vendiendo rewards
2. **Vesting Unlocks**: Liberación periódica team/advisors
3. **Liquidity Mining**: Farmers rotando capital
4. **Treasury Sales**: Funding operacional

### 5.3 Mecanismos de Equilibrio

- **Halvings Programados**: Reducción 25% anual en rewards
- **Dynamic Caps**: Ajuste según precio y volumen
- **Burning Events**: Quema de fees del protocolo
- **Lock Incentives**: Mayor APY por periodos largos

## 6. Modelo de Valoración

### 6.1 Modelo DCF (Discounted Cash Flow)

```
Asumiendo:
- Revenue Year 1: $500,000
- Growth Rate: 100% anual (años 1-3), 50% (años 4-5)
- Discount Rate: 30%
- Terminal Multiple: 10x

Valoración = Σ(FCF_t / (1+r)^t) + Terminal Value / (1+r)^5
Valoración Estimada = $8-12M fully diluted
```

### 6.2 Comparables de Mercado

| Protocolo | FDV | Usuarios | FDV/Usuario | Revenue | P/S Ratio |
|-----------|-----|----------|-------------|---------|-----------|
| Protocol A | $50M | 100k | $500 | $5M | 10x |
| Protocol B | $30M | 75k | $400 | $2M | 15x |
| Protocol C | $20M | 50k | $400 | $1M | 20x |
| **CGC Target** | $10M | 50k | $200 | $1M | 10x |

### 6.3 Precio Objetivo

- **Initial Price**: $0.01 USD
- **Target Year 1**: $0.05 USD (5x)
- **Target Year 2**: $0.10 USD (10x)
- **Target Year 3**: $0.20 USD (20x)

## 7. Simulaciones y Escenarios

### 7.1 Escenario Base

```python
# Parámetros
users_month_1 = 1000
growth_rate = 0.5  # 50% mensual
avg_earn_per_user = 100  # CGC/mes
price_cgc = 0.01  # USD

# Simulación 12 meses
for month in range(1, 13):
    users = users_month_1 * (1 + growth_rate) ** (month - 1)
    monthly_emissions = users * avg_earn_per_user
    market_cap = 1000000 * price_cgc
    
    print(f"Mes {month}:")
    print(f"  Usuarios: {users:,.0f}")
    print(f"  Emisión: {monthly_emissions:,.0f} CGC")
    print(f"  Market Cap: ${market_cap:,.0f}")
```

### 7.2 Escenario Bull

- Usuarios Year 1: 100,000
- Precio CGC: $0.20
- Market Cap: $20M
- Daily Volume: $2M
- TVL Staking: $10M

### 7.3 Escenario Bear

- Usuarios Year 1: 10,000
- Precio CGC: $0.005
- Market Cap: $500k
- Daily Volume: $50k
- TVL Staking: $250k

## 8. Revenue Model y Sostenibilidad

### 8.1 Fuentes de Revenue

| Fuente | % del Total | Estimado Anual |
|--------|-------------|----------------|
| Protocol Fees (0.5%) | 40% | $400,000 |
| Premium Subscriptions | 25% | $250,000 |
| B2B Education Services | 20% | $200,000 |
| NFT Marketplace Fees | 10% | $100,000 |
| Grants y Sponsorships | 5% | $50,000 |
| **Total** | 100% | **$1,000,000** |

### 8.2 Uso del Revenue

- **40%** → Treasury (reservas)
- **30%** → Buyback & Burn
- **20%** → Desarrollo
- **10%** → Marketing

### 8.3 Path to Sustainability

```
Year 1: -$500k (burn rate > revenue)
Year 2: -$100k (approaching breakeven)
Year 3: +$200k (profitable)
Year 4: +$500k (self-sustaining)
Year 5: +$1M (expansion phase)
```

## 9. Riesgos y Mitigaciones

### 9.1 Riesgos de Mercado

| Riesgo | Impacto | Probabilidad | Mitigación |
|--------|---------|--------------|------------|
| Death Spiral | Alto | Media | Halvings automáticos, floor price |
| Whale Manipulation | Alto | Baja | Caps por usuario, timelock |
| Liquidity Crisis | Alto | Media | POL program, incentivos LP |
| Regulatory | Alto | Media | No promises de profit, utility focus |

### 9.2 Ajustes Dinámicos

```solidity
if (price_cgc < 0.001) {
    reduce_emissions(50%);
    increase_staking_apy(100%);
} else if (price_cgc > 0.10) {
    increase_emissions(25%);
    reduce_staking_apy(25%);
}
```

## 10. Governance Parameters

### 10.1 Parámetros Modificables por DAO

- Emission rates (±50% max per proposal)
- Cap limits (global y usuario)
- Staking APY rates
- Fee percentages
- Multiplier values
- Cooldown periods

### 10.2 Parámetros Inmutables

- Total Supply (1M CGC)
- Token decimals (18)
- Core vesting schedules
- Emergency multisig signers

## 11. Conclusiones

El modelo tokenómico de CGC está diseñado para:

1. **Incentivar participación temprana** con multiplicadores agresivos
2. **Mantener estabilidad** mediante caps y límites
3. **Generar valor sostenible** a través de utility real
4. **Descentralizar gradualmente** el poder de decisión
5. **Adaptarse dinámicamente** a condiciones de mercado

Con un supply fijo de 1M CGC y múltiples fuentes de demanda, el token está posicionado para capturar valor del crecimiento del ecosistema educativo Web3.

## Anexo A: Fórmulas Clave

```
Daily Reward = Base_Reward * Σ(Multipliers) * min(1, Daily_Cap_Remaining / Base_Reward)

veCGC_Power = CGC_Locked * (Days_Locked / 1460) ^ 0.5

APY_Effective = APY_Base * (1 + veCGC_Boost) * (1 + Quality_Multiplier)

Treasury_Value = Σ(Protocol_Fees) + Σ(External_Revenues) - Σ(Operational_Costs)
```

## Anexo B: Herramientas de Simulación

Disponible en: `/scripts/tokenomics-simulator.py`

---

*Documento vivo - Se actualizará con feedback de la comunidad*
*Última actualización: Agosto 28, 2025*
*Versión: 1.0*