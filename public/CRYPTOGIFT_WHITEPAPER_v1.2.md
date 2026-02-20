# 📘 CRYPTOGIFT WALLETS DAO - WHITEPAPER v1.2.2

**Official Technical Documentation**

**Version**: 1.2.2
**Last Updated**: December 14, 2025
**Network**: Base Mainnet (Chain ID: 8453)
**Token Contract**: `0x5e3a61b550328f3D8C44f60b3e10a49D3d806175`
**Token Owner**: TimelockController `0x9753d772C632e2d117b81d96939B878D74fB5166`

Made by mbxarts.com The Moon in a Box property

---

## 📑 TABLE OF CONTENTS

1. [Executive Summary](#executive-summary)
2. [Vision & Mission](#vision--mission)
3. [The Problem](#the-problem)
4. [The Solution](#the-solution)
5. [Tokenomics](#tokenomics)
6. [Smart Contracts Architecture](#smart-contracts-architecture)
7. [Governance Model](#governance-model)
8. [Roadmap](#roadmap)
9. [Security & Audits](#security--audits)
10. [Governance Risks](#governance-risks)
11. [Team & Legal](#team--legal)
12. [Contact & Resources](#contact--resources)

---

## 🎯 EXECUTIVE SUMMARY

CryptoGift Wallets DAO represents a natural evolution of the CryptoGift ecosystem, transforming Web3 education into a decentralized governance model where learning becomes decision-making power. Built on Base (Ethereum L2), the DAO empowers its community to co-govern the protocol while learning and earning.

**Key Highlights:**
- **Initial Supply**: 2,000,000 CGC (current circulating)
- **Max Supply**: 22,000,000 CGC (theoretical maximum via milestone-based emission)
- **Blockchain**: Base Mainnet (Ethereum Layer 2)
- **Token Standard**: ERC-20
- **Emission Model**: Progressive milestone-based minting
- **Governance**: Aragon OSx v1.4.0
- **Contract Status**: Fully verified on BaseScan ✅

---

## 🌍 VISION & MISSION

### Vision
> **From zero to Web3—together. Learn. Earn. Co-govern.**

### Mission
Democratize access to Web3 through a system where completing educational quests generates governance tokens, turning learning effort into voice and vote in the protocol's future.

---

## ⚠️ THE PROBLEM

### Entry Barriers to Web3

1. **Technical Complexity**
   The blockchain learning curve intimidates new users, creating a significant barrier to entry.

2. **Lack of Incentives**
   Traditional education doesn't reward progress, leading to low engagement and completion rates.

3. **Governance-Community Disconnection**
   Most protocols are governed by early adopters with capital, not by active community members.

4. **No Clear Path**
   No structured route exists from beginner to contributor in the Web3 ecosystem.

### Limitations of Current Models

1. **Airdrop Farming**
   Mercenary behavior without real commitment to the protocol.

2. **Vote Buying**
   Power concentration in whales distorts governance decisions.

3. **Superficial Participation**
   Users voting without understanding proposals creates ineffective governance.

4. **Disconnected Education**
   Courses that don't lead to active participation or real-world application.

---

## ✅ THE SOLUTION: CRYPTOGIFT WALLETS DAO

### The Flagship Product: CryptoGift Wallets

**CryptoGift Wallets** is the core infrastructure of the ecosystem—a production-ready Web3 platform that converts NFTs into fully functional, non-custodial wallets using **ERC-6551 token-bound accounts** and **account abstraction**. This technology enables:

- **NFT = Real Wallet**: Each NFT contains an embedded wallet that can hold real cryptocurrency
- **Gasless Onboarding**: New users can receive and claim crypto gifts without needing ETH for gas
- **Programmable Gifting**: Brands, creators, and DAOs can distribute assets at scale
- **Zero Custody Risk**: Fully non-custodial design with no human intermediaries

**The DAO's Core Purpose**: CryptoGift Wallets DAO exists to bootstrap, govern, and scale this flagship platform—coordinating development, liquidity, incentives, and community education so that more organizations can use CryptoGift Wallets to onboard new users into Web3.

### System Architecture

```
User → Quest Completed → EAS Attestation → MilestoneEscrow → CGC Tokens → Governance Power
```

**Flow Explanation:**

1. **User Completes Quest**: Educational tasks on the platform
2. **EAS Attestation**: Ethereum Attestation Service verifies completion
3. **MilestoneEscrow**: Smart contract releases CGC rewards
4. **Governance Power**: CGC tokens grant voting rights in the DAO

### Core Innovation

CryptoGift Wallets DAO is a Web3 education platform that directly converts learning effort into governance power, creating a cycle of education, participation, and protocol improvement. The DAO governs the development of CryptoGift Wallets, ensuring sustainable growth aligned with community interests.

---

## 💰 TOKENOMICS

### CGC Token Details

- **Name**: CryptoGift Coin
- **Symbol**: CGC
- **Initial Supply**: 2,000,000 CGC (current circulating)
- **Max Supply**: 22,000,000 CGC (theoretical maximum)
- **Emission Model**: Progressive Milestone-Based Minting
- **Decimals**: 18
- **Blockchain**: Base (Ethereum Layer 2)
- **Contract**: `0x5e3a61b550328f3D8C44f60b3e10a49D3d806175`
- **Type**: Pure Governance Token (no economic rights)

### Emission Model: Milestone-Based Progressive Minting

**Key Principle**: New CGC tokens are ONLY minted when the DAO creates measurable value through verified milestone completion.

Unlike traditional fixed-supply or time-based emission models, CGC uses a **value-based emission schedule** where token supply grows proportionally with platform achievements:

- **Platform Development Milestones** → New tokens minted
- **Community Growth Milestones** → New tokens minted
- **Revenue & Adoption Milestones** → New tokens minted
- **DAO Governance Decisions** → Can trigger strategic emissions

**Primary Minter**: MinterGateway v3.3 (`0xdd10540847a4495e21f01230a0d39C7c6785598F`)

This ensures token supply expansion is always backed by real value creation, preventing dilution while allowing sustainable growth.

### Emission Controls (Updated December 2025)

The CGC token uses a **governance-controlled emission architecture** with multiple security layers:

#### Governance Chain
```
Aragon DAO → TimelockController (7-day delay) → CGC Token Owner
```

- **TimelockController**: `0x9753d772C632e2d117b81d96939B878D74fB5166`
  - 7-day delay for all CGC token owner operations
  - Proposer/Executor: Aragon DAO
  - Prevents immediate malicious changes

- **MinterGateway v3.3**: `0xdd10540847a4495e21f01230a0d39C7c6785598F`
  - Primary minting mechanism with hard supply cap
  - Max Mintable: 20,000,000 CGC (enforced at contract level)
  - Requires authorized caller approval for minting
  - Owner: Safe 3/5 Multisig (`0x11323672b5f9bB899Fa332D5d464CC4e66637b42`)
  - Guardian (pause only): Safe 2/3 Multisig

- **MilestoneEscrow**: `0x8346CFcaECc90d678d862319449E5a742c03f109`
  - Task reward distribution (transfers from treasury, no minting)
  - EIP-712 verification for secure claims

**Security Model**:
- Token owner is TimelockController, NOT an EOA
- All owner operations have 7-day delay for community review
- MinterGateway enforces 20M max mintable cap at contract level
- Multiple multisig controls prevent single point of failure

**Maximum Supply**: 22,000,000 CGC total (2M initial + 20M max via Gateway)

### Initial Distribution (2M CGC)

The initial 2,000,000 CGC supply is allocated for bootstrapping the ecosystem:

| Allocation | Percentage | Amount | Purpose |
|---|---|---|---|
| **Referral Program** | 25% | 500,000 CGC | User acquisition & growth |
| **Educational Rewards** | 20% | 400,000 CGC | Quest completions & learning |
| **DAO Treasury** | 25% | 500,000 CGC | Governance controlled reserves |
| **Core Contributors** | 15% | 300,000 CGC | 2 years vesting, 6 month cliff |
| **Liquidity Pool** | 10% | 200,000 CGC | DEX liquidity on Base |
| **Emergency Reserve** | 5% | 100,000 CGC | Multisig 3/5 security buffer |

### Progressive Emission Schedule (20M CGC Future Potential)

The remaining 20,000,000 CGC can be progressively minted through verified milestone achievements:

#### 1. Platform Development Milestones (Target: 8M CGC)
- Dashboard v1.0 Launch → 500,000 CGC
- Task System v2.0 → 1,000,000 CGC
- Mobile App Release → 1,500,000 CGC
- Enterprise Features → 2,000,000 CGC
- API Marketplace Launch → 3,000,000 CGC

#### 2. Community Growth Milestones (Target: 7M CGC)
- 10,000 Active Users → 1,000,000 CGC
- 50,000 Active Users → 2,000,000 CGC
- 100,000 Active Users → 4,000,000 CGC

#### 3. Revenue & Sustainability Milestones (Target: 5M CGC)
- $100K ARR → 1,000,000 CGC
- $500K ARR → 2,000,000 CGC
- $1M ARR → 2,000,000 CGC

**Total Maximum Supply**: 2M (initial) + 20M (progressive) = 22M CGC

**Important Notice on Milestones**:

The milestones listed above are **illustrative examples** of the types of achievements that could trigger token emissions. The actual emission process works as follows:

1. **Proposal**: Any CGC holder with 1,000+ tokens can propose a milestone emission
2. **Specification**: The proposal must include specific, measurable criteria for the milestone
3. **Voting**: The DAO votes on whether the milestone has been achieved
4. **Verification**: Achievement is verified through on-chain attestations (EAS) or other verifiable evidence
5. **Execution**: Upon approval, new tokens are minted via MinterGateway (requires authorized caller)

This governance-driven approach ensures that milestone definitions evolve with community consensus rather than being fixed at launch. Metrics like "Active Users" or "ARR" will be defined by the DAO through specific proposals that include measurement methodology and verification sources.

### Token Utility

1. **Governance**
   - Create and vote on proposals
   - Delegate voting power to representatives
   - Participate in DAO decision-making

2. **Access**
   - Premium educational content
   - Priority features and early access
   - Exclusive NFT badges

3. **Boosts**
   - Experience multipliers for quests
   - Reduced cooldowns on tasks
   - Early access to new features

---

## 🔧 SMART CONTRACTS ARCHITECTURE (Updated December 2025)

All contracts deployed and verified on Base Mainnet (Chain ID: 8453)

### Governance & Token Contracts

#### 1. CGC Token (ERC20Votes)
**Address**: `0x5e3a61b550328f3D8C44f60b3e10a49D3d806175`
**Function**: ERC-20 governance token with voting power delegation
**Supply**: 2,000,000 CGC initial (22,000,000 CGC max via MinterGateway)
**Owner**: TimelockController (NOT an EOA)

#### 2. Aragon DAO
**Address**: `0x3244DFBf9E5374DF2f106E89Cf7972E5D4C9ac31`
**Function**: Decentralized governance with Token Voting plugin
**Framework**: Aragon OSx v1.4.0
**Controls**: TimelockController proposer/executor

#### 3. TimelockController (NEW - December 2025)
**Address**: `0x9753d772C632e2d117b81d96939B878D74fB5166`
**Function**: 7-day delay for CGC token owner operations
**Proposer/Executor**: Aragon DAO
**Security**: Prevents immediate malicious changes to token

#### 4. MinterGateway v3.3 (NEW - December 2025)
**Address**: `0xdd10540847a4495e21f01230a0d39C7c6785598F`
**Function**: Primary minting mechanism with supply cap
**Max Mintable**: 20,000,000 CGC (enforced at contract level)
**Owner**: Safe 3/5 Multisig (`0x11323672b5f9bB899Fa332D5d464CC4e66637b42`)
**Guardian**: Safe 2/3 Multisig (pause only)

### Task System Contracts

#### 5. MilestoneEscrow
**Address**: `0x8346CFcaECc90d678d862319449E5a742c03f109`
**Function**: Task reward distribution with EIP-712 verification
**Features**:
- Transfers from treasury (no minting)
- EIP-712 signature verification
- Integration with task validation system

#### 6. MasterEIP712Controller
**Address**: `0x67D9a01A3F7b5D38694Bb78dD39286Db75D7D869`
**Function**: Centralized authorization control for all system permissions
**Features**:
- Role-based access control
- Signer authorization management
- System-wide permission gateway

#### 7. TaskRulesEIP712
**Address**: `0xdDcfFF04eC6D8148CDdE3dBde42456fB32bcC5bb`
**Function**: Task validation rules and completion verification logic
**Features**:
- Quest completion validation
- Rule-based task verification
- Integration with EAS attestations

### Security Features

- ✅ All contracts verified on BaseScan
- ✅ OpenZeppelin battle-tested libraries
- ✅ 7-day timelock via TimelockController
- ✅ MinterGateway enforces 20M supply cap
- ✅ Multiple multisig controls (3/5 owner, 2/3 guardian)
- ✅ Emergency pause mechanism
- ✅ Bug bounty program (up to 100,000 CGC)
- 📋 External audit planned for Q2 2026

---

## 🗳️ GOVERNANCE MODEL

### Aragon OSx v1.4.0

- **Plugin**: Token Voting v1.3
- **Network**: Base Mainnet (Chain ID: 8453)

### Proposal Types

1. **Token Minting**: New token emissions via MinterGateway (requires governance approval)
2. **Parameter Changes**: Adjustment of caps, limits, multipliers
3. **Integrations**: New quest platforms and educational partners
4. **Treasury Management**: Use of DAO funds for development
5. **Emergencies**: Pauses, fund recovery, critical fixes

### Voting Parameters

- **Minimum Participation**: 10% of circulating supply (initially 200,000 CGC, adjusts as supply grows)
- **Support Threshold**: 51% of votes cast
- **Minimum Duration**: 7 days
- **Minimum Proposer Power**: 1,000 CGC

### Governance Process

1. **Proposal Creation**: Any holder with 1,000+ CGC can create proposals
2. **Discussion Period**: Minimum 7 days for community discussion
3. **Voting Period**: Active voting on proposal outcome
4. **Execution**: Automatic execution if quorum and threshold met
5. **Timelock**: 48h delay before critical changes take effect

---

## 🗺️ ROADMAP

*Last Updated: December 2025*

### Q4 2024 - Foundation ✅ Completed

- ✅ Deploy DAO on Aragon with Token Voting
- ✅ Configure governance plugins
- ✅ Launch CGC token (2M initial supply)
- ✅ Define contract architecture

### Q1 2025 - Core Infrastructure ✅ Completed

- ✅ Deploy MilestoneEscrow + MasterEIP712Controller + TaskRulesEIP712
- ✅ Launch task system with competitive mechanics
- ✅ Implement admin validation panel with EIP-712
- ✅ Integrate automatic CGC payments post-validation
- ✅ Launch multi-level referral system (10%, 5%, 2.5%)

### Q2-Q3 2025 - Growth & Metadata ✅ Completed

- ✅ Launch Aerodrome liquidity pool (WETH/CGC)
- ✅ Complete token metadata (logos, APIs CoinGecko-compliant)
- ✅ Publish Whitepaper v1.2.1
- ✅ Implement bilingual i18n system (ES/EN)

### Q4 2025 - Governance & Listings ✅ NOW (December 2025)

- ✅ Deploy TimelockController (7-day delay for token owner ops)
- ✅ Deploy MinterGateway v3.3 (20M max supply cap)
- ✅ Implement auto-delegation system (ERC20Votes activation)
- ✅ Complete Discord server (21 channels, 10 roles)
- ✅ Domain migration to mbxarts.com
- ✅ Collab.Land installed for token gating
- ✅ Complete Funding Application Guide (Top 5 grants)
- ✅ SEO optimized (robots.txt, sitemap, metadata)
- 🔄 Execute Gateway migration (atomic batch via Gnosis Safe)
- 🔄 CoinGecko listing (re-applying with traction)
- 🔄 BaseScan logo verification (submitted)
- 🔄 Base Builder Grants application (ready)

### Q1 2026 - Traction & Grants 📋 Next

- 📋 Re-apply CoinGecko with traction metrics
- 📋 Submit Base Builder Grants + Optimism Atlas + Gitcoin
- 📋 Expand quest catalog + creator onboarding
- 📋 Advanced analytics dashboard with impact metrics
- 📋 Partnerships with 3+ educational platforms

### Q2-Q3 2026 - Scale 🎯 Planned

- 🎯 Implement Automated Minting System
- 🎯 Plug-and-play/white-label components for brands/NGOs
- 🎯 Massive 1155-TBA-like campaigns
- 🎯 "Gifting for events" (weddings, birthdays, donations)
- 🎯 Mobile-optimized interface

### Q4 2026+ - Vision 🔮 Long-term

- 🔮 API for fintech integration "in two lines"
- 🔮 Bridge to tokenized assets (RWA) and loyalty programs
- 🔮 Massive collaborations with Base ecosystem projects
- 🔮 Advanced DeFi integrations
- 🔮 CGC staking mechanisms
- 🔮 Progressive governance decentralization

---

## 🔐 SECURITY & AUDITS

### Audit Status

- **Internal Security Review**: ✅ Completed
- **External Audit**: 📋 Planned for Q2 2026 (pending grant funding)
- **Audit Firm**: To be selected via DAO governance proposal

**Current Security Posture**: All smart contracts have undergone rigorous internal testing and use battle-tested OpenZeppelin libraries. A formal external audit is planned once grant funding is secured. The DAO will vote on auditor selection to ensure community trust in the process.

### Bug Bounty Program

- **Reward Pool**: Up to 100,000 CGC
- **Scope**: All smart contracts in production
- **Severity Levels**:
  - Critical: 50,000-100,000 CGC
  - High: 10,000-50,000 CGC
  - Medium: 5,000-10,000 CGC
  - Low: 1,000-5,000 CGC

### Security Measures

1. **Smart Contract Security**
   - Verified source code on BaseScan
   - OpenZeppelin libraries for standard implementations
   - EIP-712 signatures for all critical operations
   - Role-based access control (RBAC)

2. **Operational Security**
   - Multisig 3/5 for emergency reserve
   - 48h timelock on critical parameter changes
   - Emergency pause functionality
   - Automated monitoring and alerts

3. **Governance Security**
   - Minimum proposer power requirement (1,000 CGC)
   - Minimum participation threshold (10%)
   - Extended voting periods (7+ days)
   - Transparent on-chain execution

---

## ⚠️ GOVERNANCE RISKS

### DAO-Specific Risk Factors

Participants in CryptoGift Wallets DAO should be aware of the following governance-related risks:

**1. Governance Attack Risks**
- **Vote Concentration**: Large token holders could potentially influence decisions disproportionately
- **Flash Loan Attacks**: Theoretical risk of borrowing tokens to manipulate votes (mitigated by snapshot-based voting)
- **Voter Apathy**: Low participation could lead to decisions made by small, active minorities

**2. Operational Risks**
- **Smart Contract Bugs**: Despite testing, undiscovered vulnerabilities may exist
- **Upgrade Risks**: Protocol upgrades could introduce unintended consequences
- **Key Management**: Multisig key holders represent centralization points during early stages

**3. Decision-Making Risks**
- **Adverse Proposals**: The DAO could theoretically approve proposals harmful to the ecosystem
- **Coordination Failures**: Inability to reach consensus on critical decisions
- **Regulatory Changes**: Future regulations could affect DAO operations

**Mitigation Measures**:
- Minimum participation thresholds (10%) ensure broad consensus
- 48-hour timelocks allow community review before execution
- Emergency pause functionality (3/5 multisig) for critical situations
- Gradual decentralization plan to distribute power over time

---

## 👥 TEAM & LEGAL

### Core Team

| Role | Name | Responsibility |
|------|------|----------------|
| **Founder & Lead** | Rafael Gonzalez | Product strategy, engineering, smart contracts |
| **Community & Growth** | Roberto Legrá | Community building, marketing, partnerships |
| **Business Development** | Leodanni Avila | Operations, business development, outreach |

The team combines expertise in Web3 development, community building, and business operations. Full team profiles with LinkedIn links are available on our [Team Page](https://mbxarts.com/docs?tab=verification).

### Project Information

**Developed by**: The Moon in a Box Inc.
**Project**: CryptoGift Wallets DAO
**Website**: https://mbxarts.com
**GitHub**: https://github.com/CryptoGift-Wallets-DAO/CryptoGift-Wallets-DAO

### Legal Structure

- **Entity**: Delaware C-Corporation (The Moon in a Box Inc.)
- **Governance**: Decentralized via Aragon DAO
- **Token Type**: Utility/Governance (not a security)

### Responsibility Division

- **The Moon in a Box Inc.**: Handles legal compliance, initial development, and operational infrastructure
- **CryptoGift Wallets DAO**: Governs protocol parameters, treasury, emissions, and strategic direction
- **Gradual Transition**: Over time, more responsibilities will transfer from the C-Corp to the DAO as decentralization matures

### Disclaimers

**IMPORTANT LEGAL NOTICES:**

1. **No Investment Advice**: This whitepaper does not constitute investment advice, financial advice, trading advice, or any other sort of advice.

2. **No Guarantee of Returns**: CGC is a governance token, not an investment vehicle. There are no guaranteed returns or profits.

3. **Regulatory Compliance**: Users are responsible for determining whether their use of CGC complies with their local laws and regulations.

4. **Risk Disclosure**: Cryptocurrency investments carry significant risks, including the possible loss of all invested capital.

5. **No Economic Rights**: CGC tokens grant governance rights only, not ownership or economic rights in The Moon in a Box Inc.

---

## 📞 CONTACT & RESOURCES

### Official Links

- **Website**: https://mbxarts.com
- **Documentation**: https://mbxarts.com/docs
- **GitHub**: https://github.com/CryptoGift-Wallets-DAO/CryptoGift-Wallets-DAO
- **BaseScan**: https://basescan.org/address/0x5e3a61b550328f3D8C44f60b3e10a49D3d806175

### Social Media

- **Twitter/X**: https://x.com/cryptogiftdao
- **Discord**: https://discord.gg/XzmKkrvhHc
- **Telegram**: https://t.me/cryptogiftwalletsdao
- **Giveth**: https://giveth.io/project/cryptogift-wallets-dao
- **Email**: admin@mbxarts.com

### APIs (CoinGecko Integration)

- **Total Supply**: `GET /api/token/total-supply`
- **Circulating Supply**: `GET /api/token/circulating-supply`

### Support

For technical support, partnership inquiries, or general questions, please visit our Discord community or create an issue on our GitHub repository.

---

## 📄 APPENDIX

### Technical Specifications

**Network Details:**
- Chain: Base (Optimistic Rollup on Ethereum)
- Chain ID: 8453
- Block Time: ~2 seconds
- Finality: ~12 seconds

**Token Specifications:**
- Standard: ERC-20
- Decimals: 18
- Initial Supply: 2,000,000 (2 × 10^6)
- Max Supply: 22,000,000 (2.2 × 10^7) via milestone-based emission
- Smallest Unit: 0.000000000000000001 CGC (1 wei)

### Version History

- **v1.2.2** (December 14, 2025): Added TimelockController and MinterGateway v3.3 contracts, updated governance model (Aragon DAO → Timelock → Token), documented auto-delegation system, updated smart contracts architecture section
- **v1.2.1** (December 11, 2025): Added CryptoGift Wallets product description, governance risks section, team information, anti-dilution protections, milestone verification process, updated audit status for transparency
- **v1.2** (December 7, 2025): Updated with milestone-based emission model, referral system, API endpoints, progressive tokenomics (2M initial → 22M max supply)
- **v1.1** (January 9, 2025): Updated supply to 2M, added new contracts
- **v1.0** (November 2024): Initial release

---

**© 2024-2025 The Moon in a Box Inc. All rights reserved.**

This document is for informational purposes only and may be subject to change without notice.

---

**END OF WHITEPAPER**
