# CryptoGift Coin (CGC) — Tokenomics & Distribution (Base Mainnet)

**Initial Supply:** 2,000,000 CGC (current circulating)
**Max Supply:** 22,000,000 CGC (theoretical maximum via milestone-based emission)
**Emission Model:** Progressive Milestone-Based Minting
**Decimals:** 18
**Contract:** [0x5e3a61b550328f3D8C44f60b3e10a49D3d806175](https://basescan.org/token/0x5e3a61b550328f3D8C44f60b3e10a49D3d806175) (Base Chain ID: 8453)
**TGE (UTC):** 2025-01-31 (Token Generation Event)
**Type:** Pure Governance Token (no economic rights)

## Emission Model Overview

CGC uses a **milestone-based progressive emission model** where new tokens are minted ONLY when the DAO creates measurable value through verified milestone completion:

- **Platform Development Milestones** → New tokens minted (target: 8M CGC)
- **Community Growth Milestones** → New tokens minted (target: 7M CGC)
- **Revenue & Sustainability Milestones** → New tokens minted (target: 5M CGC)
- **DAO Governance Decisions** → Can trigger strategic emissions

**Primary Minter:** MinterGateway v3.3 (`0xdd10540847a4495e21f01230a0d39C7c6785598F`)
- Max Mintable: 20,000,000 CGC (enforced at contract level)
- Requires authorized caller approval for minting
- Owner: Safe 3/5 Multisig

**Token Owner:** TimelockController (`0x9753d772C632e2d117b81d96939B878D74fB5166`)
- 7-day delay for all CGC token owner operations
- Governance Chain: Aragon DAO → TimelockController → CGC Token Owner

This ensures token supply expansion is always backed by real value creation, preventing dilution while allowing sustainable growth.

## Initial Allocation (100%)

### Community Programs & Rewards: 40% (800,000 CGC)
- **TGE Unlock:** 10% (80,000 CGC)
- **Vesting:** 36 months, monthly linear (22,000 CGC/month)
- **Purpose:** Quest rewards, educational achievements, community incentives
- **Control:** MilestoneEscrow contract with caps

### Treasury & Operations (DAO Safe): 25% (500,000 CGC)
- **TGE Unlock:** 0%
- **Vesting:** 48 months, quarterly (31,250 CGC/quarter)
- **Governance:** All releases require DAO proposal approval
- **Purpose:** Protocol development, operations, strategic initiatives
- **Control:** Aragon DAO governance

### Contributors/Team: 15% (300,000 CGC)
- **Cliff:** 12 months
- **Vesting:** 24 months linear after cliff (12,500 CGC/month)
- **TGE Unlock:** 0%
- **Purpose:** Core team and early contributors
- **Note:** Subject to individual vesting agreements

### Liquidity Provision: 10% (200,000 CGC)
- **TGE Unlock:** 100%
- **Purpose:** DEX liquidity pools on Base (Aerodrome/Uniswap)
- **Pairs:** CGC/WETH, CGC/USDC
- **Note:** LP tokens locked for minimum 12 months

### Ecosystem Development: 10% (200,000 CGC)
- **Cliff:** 6 months
- **Vesting:** 18 months linear (11,111 CGC/month)
- **TGE Unlock:** 0%
- **Purpose:** Partnerships, integrations, grants program
- **Control:** DAO governance approval required

### Reserve & Emergency: 5% (100,000 CGC)
- **TGE Unlock:** 0%
- **Vesting:** Locked until DAO approval
- **Purpose:** Emergency situations, protocol security
- **Control:** 3/5 Multisig + DAO approval
- **Note:** Requires critical governance proposal

## Key Addresses

### Token Contract
- **CGC Token:** `0x5e3a61b550328f3D8C44f60b3e10a49D3d806175`

### Governance Contracts (NEW - December 2025)
- **TimelockController (7-day delay):** `0x9753d772C632e2d117b81d96939B878D74fB5166`
- **MinterGateway v3.3 (Primary Minter):** `0xdd10540847a4495e21f01230a0d39C7c6785598F`
- **DAO Treasury (Aragon):** `0x3244DFBf9E5374DF2f106E89Cf7972E5D4C9ac31`

### Task System Contracts
- **MilestoneEscrow (Transfers only):** `0x8346CFcaECc90d678d862319449E5a742c03f109`
- **MasterEIP712Controller:** `0x67D9a01A3F7b5D38694Bb78dD39286Db75D7D869`
- **TaskRulesEIP712:** `0xdDcfFF04eC6D8148CDdE3dBde42456fB32bcC5bb`

### Vesting Contracts (To Be Deployed)
- **Team Vesting Contract:** `TBD - pending deployment`
- **Ecosystem Reserve:** `TBD - pending deployment`
- **Emergency Multisig:** `TBD - pending setup`

### Burn Addresses (Standard)
- **Null Address:** `0x0000000000000000000000000000000000000000`
- **Dead Address:** `0x000000000000000000000000000000000000dEaD`

## Supply Calculation Methodology

```
Circulating Supply = Total Supply - (Treasury Locked + Vested/Locked + Burned + Escrow Holdings)
```

### Current Status (as of Jan 2025)
- **Total Minted:** 2,000,000 CGC
- **In Deployer Wallet:** 2,000,000 CGC (pending distribution)
- **Circulating:** 0 CGC (pre-TGE)
- **Burned:** 0 CGC

### Post-TGE Distribution Plan
1. **Immediate (Day 1):**
   - 200,000 CGC → Liquidity pools
   - 80,000 CGC → Community rewards pool
   - Total Day 1 Circulating: 280,000 CGC (14%)

2. **Month 1-12:**
   - Monthly community rewards: ~22,000 CGC
   - No team tokens (cliff period)
   - Gradual increase via rewards

3. **Month 13+:**
   - Team vesting begins
   - Ecosystem partnerships activate
   - Treasury proposals enable

## Emission Schedule & Caps

### Daily/Weekly/Monthly Caps (Community Rewards)
- **Annual Cap:** 800,000 CGC (total rewards pool)
- **Monthly Cap:** 66,666 CGC (enforced on-chain)
- **Weekly Cap:** 16,666 CGC
- **Daily User Cap:** 333 CGC
- **Post-Multiplier Cap:** 120% of base reward

### Governance Controls
All token emissions and distributions are controlled by:
1. **MinterGateway Cap:** Hard 20M limit enforced at contract level
2. **TimelockController:** 7-day delay for token owner operations
3. **DAO Proposals:** Required for treasury and major allocations
4. **Multisig:** 3/5 for MinterGateway owner, 2/3 for guardian (pause)

## Token Utility

### Governance Rights
- Create and vote on proposals
- Delegate voting power
- Control treasury allocations
- Modify protocol parameters

### Access & Benefits
- Premium educational content
- Priority access to new features
- NFT badges and certifications
- Community events and airdrops

### Non-Financial Benefits
- Experience multipliers
- Reduced cooldowns
- Early access to quests
- Profile customization

**Important:** CGC is a pure governance token with no economic rights, profit sharing, or revenue distribution.

## Compliance & Regulatory

- **No Revenue Sharing:** Token provides governance only
- **No Investment Contract:** Not a security under any jurisdiction
- **KYC Optional:** Not required for token holding or governance
- **Decentralized:** Progressive decentralization via DAO

## Verification & Transparency

### On-Chain Verification
- All contracts verified on BaseScan
- Vesting enforced via smart contracts
- Real-time supply tracking available
- Governance proposals public on Aragon

### Regular Reporting
- Monthly treasury reports
- Quarterly emission updates
- Annual tokenomics review
- Community dashboards

## Updates & Modifications

Any changes to tokenomics require:
1. **Community Discussion:** 7-day forum period
2. **Formal Proposal:** Via Aragon DAO
3. **Voting Period:** 7 days minimum
4. **Execution:** 48-hour timelock
5. **Documentation:** Updated in this document

---

**Last Updated:** December 14, 2025
**Version:** 1.1 (Governance Update)
**Status:** Production
**Next Review:** Q1 2026

## Resources

- **Whitepaper:** [Full Documentation](https://mbxarts.com/CRYPTOGIFT_WHITEPAPER_v1.2.html)
- **DAO Governance:** [Aragon App](https://app.aragon.org/dao/base-mainnet/0x3244DFBf9E5374DF2f106E89Cf7972E5D4C9ac31)
- **Token Contract:** [BaseScan](https://basescan.org/token/0x5e3a61b550328f3D8C44f60b3e10a49D3d806175)
- **GitHub:** [Source Code](https://github.com/CryptoGift-Wallets-DAO/CryptoGift-Wallets-DAO)
- **Website:** [Official Site](https://mbxarts.com)

## Contact

- **Email:** admin@mbxarts.com
- **Discord:** https://discord.gg/XzmKkrvhHc
- **Telegram:** https://t.me/cryptogiftwalletsdao
- **Twitter:** @cryptogiftdao
- **Giveth:** https://giveth.io/project/cryptogift-wallets-dao

---

*This document is maintained by the CryptoGift Wallets DAO community and updated via governance proposals.*