# 📚 GUÍA MAESTRA DE SOLICITUDES DE GRANTS Y FINANCIAMIENTO

## CryptoGift Wallets DAO - Documento Oficial de Referencia

**Versión**: 2.0
**Última Actualización**: 10 de Diciembre, 2025
**Idiomas**: Español (ES) + English (EN)
**Uso**: Solicitudes de grants, aplicaciones de financiamiento, presentaciones a inversores

---

Made by mbxarts.com | The Moon in a Box Inc.

---

# 📑 ÍNDICE / TABLE OF CONTENTS

1. [Datos del Proyecto / Project Data](#1-datos-del-proyecto--project-data)
2. [Descripción del Proyecto / Project Description](#2-descripción-del-proyecto--project-description)
3. [Propuesta de Valor / Value Proposition](#3-propuesta-de-valor--value-proposition)
4. [Stack Tecnológico / Technology Stack](#4-stack-tecnológico--technology-stack)
5. [Tokenomics](#5-tokenomics)
6. [Equipo / Team](#6-equipo--team)
7. [Tracción y Métricas / Traction & Metrics](#7-tracción-y-métricas--traction--metrics)
8. [Roadmap](#8-roadmap)
9. [Modelo de Negocio / Business Model](#9-modelo-de-negocio--business-model)
10. [Uso de Fondos / Use of Funds](#10-uso-de-fondos--use-of-funds)
11. [Impacto en el Ecosistema / Ecosystem Impact](#11-impacto-en-el-ecosistema--ecosystem-impact)
12. [URLs y Recursos / URLs & Resources](#12-urls-y-recursos--urls--resources)
13. [Contacto / Contact](#13-contacto--contact)
14. [Respuestas Específicas por Grant / Grant-Specific Answers](#14-respuestas-específicas-por-grant--grant-specific-answers)
15. [Plantillas de Texto / Text Templates](#15-plantillas-de-texto--text-templates)

---

# 1. DATOS DEL PROYECTO / PROJECT DATA

## 🇪🇸 ESPAÑOL

### Información General
| Campo | Valor |
|-------|-------|
| **Nombre del Proyecto** | CryptoGift Wallets DAO |
| **Empresa Legal** | The Moon in a Box Inc. (Delaware C-Corp) |
| **Fecha de Fundación** | 2024 |
| **Fase del Proyecto** | Production Ready - Live on Mainnet |
| **Categoría** | Infrastructure / Education / Consumer Web3 |

### Token CGC
| Campo | Valor |
|-------|-------|
| **Nombre** | CryptoGift Coin |
| **Símbolo** | CGC |
| **Red** | Base Mainnet (Chain ID: 8453) |
| **Dirección del Contrato** | `0x5e3a61b550328f3D8C44f60b3e10a49D3d806175` |
| **Supply Inicial** | 2,000,000 CGC |
| **Supply Máximo** | 22,000,000 CGC (via milestone-based emission) |
| **Decimales** | 18 |
| **Estándar** | ERC-20 with Votes & Permit |

### Contratos Desplegados (Base Mainnet)
| Contrato | Dirección | Función |
|----------|-----------|---------|
| **CGC Token** | `0x5e3a61b550328f3D8C44f60b3e10a49D3d806175` | Token de gobernanza |
| **MasterEIP712Controller** | `0x67D9a01A3F7b5D38694Bb78dD39286Db75D7D869` | Control de autorizaciones |
| **TaskRulesEIP712** | `0xdDcfFF04eC6D8148CDdE3dBde42456fB32bcC5bb` | Validación de tareas |
| **MilestoneEscrow** | `0x8346CFcaECc90d678d862319449E5a742c03f109` | Custodia y distribución |
| **Aragon DAO** | `0x3244DFBf9E5374DF2f106E89Cf7972E5D4C9ac31` | Gobernanza descentralizada |
| **Aerodrome Pool** | `0x3032f62729513ec8a328143f7d5926b5257a43cd` | Liquidez WETH/CGC |

---

## 🇬🇧 ENGLISH

### General Information
| Field | Value |
|-------|-------|
| **Project Name** | CryptoGift Wallets DAO |
| **Legal Entity** | The Moon in a Box Inc. (Delaware C-Corp) |
| **Founded** | 2024 |
| **Project Stage** | Production Ready - Live on Mainnet |
| **Category** | Infrastructure / Education / Consumer Web3 |

### CGC Token
| Field | Value |
|-------|-------|
| **Name** | CryptoGift Coin |
| **Symbol** | CGC |
| **Network** | Base Mainnet (Chain ID: 8453) |
| **Contract Address** | `0x5e3a61b550328f3D8C44f60b3e10a49D3d806175` |
| **Initial Supply** | 2,000,000 CGC |
| **Max Supply** | 22,000,000 CGC (via milestone-based emission) |
| **Decimals** | 18 |
| **Standard** | ERC-20 with Votes & Permit |

### Deployed Contracts (Base Mainnet)
| Contract | Address | Function |
|----------|---------|----------|
| **CGC Token** | `0x5e3a61b550328f3D8C44f60b3e10a49D3d806175` | Governance token |
| **MasterEIP712Controller** | `0x67D9a01A3F7b5D38694Bb78dD39286Db75D7D869` | Authorization control |
| **TaskRulesEIP712** | `0xdDcfFF04eC6D8148CDdE3dBde42456fB32bcC5bb` | Task validation |
| **MilestoneEscrow** | `0x8346CFcaECc90d678d862319449E5a742c03f109` | Custody and distribution |
| **Aragon DAO** | `0x3244DFBf9E5374DF2f106E89Cf7972E5D4C9ac31` | Decentralized governance |
| **Aerodrome Pool** | `0x3032f62729513ec8a328143f7d5926b5257a43cd` | WETH/CGC Liquidity |

---

# 2. DESCRIPCIÓN DEL PROYECTO / PROJECT DESCRIPTION

## 🇪🇸 ESPAÑOL

### Versión Corta (50 palabras)
CryptoGift Wallets DAO es la primera infraestructura Web3 que transforma NFTs en wallets completamente funcionales mediante ERC-6551, permitiendo a marcas, creadores y DAOs distribuir activos, recompensas y experiencias educativas a usuarios que aún no tienen wallet, con interacciones gasless y onboarding guiado.

### Versión Media (150 palabras)
CryptoGift Wallets, el producto insignia del ecosistema, es una infraestructura de producción que convierte NFTs en wallets no custodiales completamente funcionales utilizando cuentas vinculadas a tokens ERC-6551 y account abstraction. Este diseño permite que marcas, creadores y DAOs distribuyan activos, quests y recompensas a usuarios que posiblemente no tengan una wallet tradicional, mientras la plataforma maneja las interacciones gasless y el onboarding guiado.

El propósito central de CryptoGift Wallets DAO es impulsar, gobernar y escalar esta plataforma principal: coordinando liquidez, incentivos y educación comunitaria para que más marcas, creadores y organizaciones puedan usar CryptoGift Wallets para incorporar nuevos usuarios a Web3 de manera sostenible y alineada con la misión.

Como resultado, CryptoGift Wallets no es solo una capa educativa sino también un poderoso canal de distribución y activación para la adopción masiva de Web3 en Base.

### Versión Completa (400+ palabras)
CryptoGift Wallets representa una revolución en cómo las personas ingresan al mundo cripto. Nuestra plataforma elimina las tres barreras fundamentales que impiden la adopción masiva: la complejidad técnica del setup de wallets, la falta de incentivos para el aprendizaje, y los costos ocultos de gas que arruinan la experiencia del usuario.

**El Problema**: Actualmente, el 97% de las gift cards cripto nunca son reclamadas. Los usuarios se enfrentan a un proceso intimidante: crear wallet, guardar seed phrase, pagar fees de gas. El 70% abandona en el primer minuto.

**Nuestra Solución**: Usando ERC-6551 (Token Bound Accounts), transformamos cada NFT en una wallet completamente funcional. El flujo es simple:

1. **Para el Sender** (2 minutos): Sube una imagen, establece el monto, genera un link compartible.
2. **Para el Receiver** (5 minutos): Hace clic en el link, completa una educación interactiva de 5 minutos, reclama automáticamente.
3. **Resultado**: El NFT SE CONVIERTE en la wallet con cripto dentro, listo para usar.

**Stack de Innovación**:
- **ERC-6551**: Tu NFT ES tu wallet - no necesitas crear una aparte
- **EIP-712 Signature Gating**: Flujo educativo asegurado con firmas criptográficas
- **Account Abstraction (Biconomy)**: Experiencia 100% gasless para receivers
- **Base L2**: Transacciones rápidas y económicas que hacen viable la economía de gifting

**Infraestructura de Producción**: CryptoGift Wallets está completamente desplegado en Base Mainnet desde Enero 2025, con todos los contratos verificados en BaseScan. El sistema incluye:
- Sistema de tareas con mecánicas competitivas
- Panel de administración para validación segura
- Pagos automáticos de CGC post-validación
- Sistema de referidos multinivel (10%, 5%, 2.5%)
- Gobernanza descentralizada via Aragon DAO
- Pool de liquidez activo en Aerodrome Finance

**Visión a Futuro**: CryptoGift Wallets continuará evolucionando como una capa de infraestructura escalable para gifting cripto programable, onboarding y educación en Base. El roadmap incluye convertir las wallets token-bound en componentes plug-and-play para marcas, creadores y DAOs que quieran distribuir activos, recompensas y rutas de aprendizaje a usuarios no nativos de cripto con experiencias gasless y guiadas.

---

## 🇬🇧 ENGLISH

### Short Version (50 words)
CryptoGift Wallets DAO is the first Web3 infrastructure that transforms NFTs into fully functional wallets using ERC-6551, enabling brands, creators, and DAOs to distribute assets, rewards, and educational experiences to users who don't even have a traditional wallet yet, with gasless interactions and guided onboarding.

### Medium Version (150 words)
CryptoGift Wallets, the flagship product of the ecosystem, is a production-ready infrastructure that turns NFTs into fully functional, non-custodial wallets using ERC-6551 token-bound accounts and account abstraction. This design allows brands, creators, and DAOs to distribute assets, quests, and rewards to users who may not even have a traditional wallet yet, while the platform handles gasless interactions and guided onboarding.

The core purpose of CryptoGift Wallets DAO is to bootstrap, govern, and scale this main platform: coordinating liquidity, incentives, and community education so that more brands, creators, and organizations can use CryptoGift Wallets to onboard new users into Web3 in a sustainable, mission-aligned way.

As a result, CryptoGift Wallets is not only an education layer but also a powerful distribution and activation rail for large-scale Web3 adoption on Base.

### Full Version (400+ words)
CryptoGift Wallets represents a revolution in how people enter the crypto world. Our platform eliminates the three fundamental barriers preventing mass adoption: the technical complexity of wallet setup, the lack of learning incentives, and the hidden gas costs that ruin the user experience.

**The Problem**: Currently, 97% of crypto gift cards are never claimed. Users face an intimidating process: create wallet, save seed phrase, pay gas fees. 70% abandon in the first minute.

**Our Solution**: Using ERC-6551 (Token Bound Accounts), we transform each NFT into a fully functional wallet. The flow is simple:

1. **For the Sender** (2 minutes): Upload an image, set the amount, generate a shareable link.
2. **For the Receiver** (5 minutes): Click the link, complete a 5-minute interactive education, claim automatically.
3. **Result**: The NFT BECOMES the wallet with crypto inside, ready to use.

**Innovation Stack**:
- **ERC-6551**: Your NFT IS your wallet - no need to create a separate one
- **EIP-712 Signature Gating**: Educational flow secured by cryptographic signatures
- **Account Abstraction (Biconomy)**: 100% gasless experience for receivers
- **Base L2**: Fast, cheap transactions enabling viable gifting economics

**Production Infrastructure**: CryptoGift Wallets is fully deployed on Base Mainnet since January 2025, with all contracts verified on BaseScan. The system includes:
- Task system with competitive mechanics
- Admin panel for secure validation
- Automatic CGC payments post-validation
- Multi-level referral system (10%, 5%, 2.5%)
- Decentralized governance via Aragon DAO
- Active liquidity pool on Aerodrome Finance

**Future Vision**: CryptoGift Wallets will continue to evolve as a scalable infrastructure layer for programmable crypto gifting, onboarding, and education on Base. The roadmap includes turning token-bound wallets into plug-and-play components for brands, creators, and DAOs that want to distribute assets, rewards, and learning paths to non-crypto-native users with gasless, guided experiences.

---

# 3. PROPUESTA DE VALOR / VALUE PROPOSITION

## 🇪🇸 ESPAÑOL

### ¿Qué Hace Único a CryptoGift Wallets?

**1. Primera Infraestructura NFT-to-Wallet del Mercado**
Somos los primeros en implementar ERC-6551 específicamente para gifting cripto con educación integrada. No existe competidor directo que combine estas tres innovaciones: NFT como wallet, gates educativos, y experiencia gasless.

**2. Tasa de Conversión 21x Superior**
Mientras la industria promedia 3-4% de claim rate en gift cards cripto, nuestro sistema logra 85.7% en testing. Este diferencial demuestra product-market fit excepcional.

**3. Canal de Distribución B2B Único**
Ofrecemos a marcas, DAOs y empresas una forma completamente nueva de distribuir valor: cada gift es simultáneamente onboarding, educación, y activación de usuario.

**4. Modelo de Emisión Sostenible**
A diferencia de tokens con inflación predeterminada, CGC usa emisión basada en milestones: los tokens solo se mintean cuando el DAO crea valor verificable.

**5. Infraestructura, No Solo Producto**
CryptoGift Wallets no es una app aislada - es infraestructura que otras organizaciones pueden usar para sus propios casos de uso de onboarding y distribución.

### Diferenciadores Competitivos

| Característica | CryptoGift | Gift Cards Tradicionales | Onboarding Tools |
|---------------|------------|--------------------------|------------------|
| Claim Rate | **85.7%** | 3-4% | N/A |
| Wallet Real | ✅ ERC-6551 | ❌ Custodial | ⚠️ Requiere setup |
| Gasless | ✅ 100% | ❌ | ⚠️ Parcial |
| Educación Integrada | ✅ | ❌ | ❌ |
| No Custodial | ✅ | ❌ | ✅ |
| B2B Ready | ✅ | ⚠️ | ❌ |

---

## 🇬🇧 ENGLISH

### What Makes CryptoGift Wallets Unique?

**1. First NFT-to-Wallet Infrastructure in the Market**
We are the first to implement ERC-6551 specifically for crypto gifting with integrated education. No direct competitor combines these three innovations: NFT as wallet, educational gates, and gasless experience.

**2. 21x Superior Conversion Rate**
While the industry averages 3-4% claim rate on crypto gift cards, our system achieves 85.7% in testing. This differential demonstrates exceptional product-market fit.

**3. Unique B2B Distribution Channel**
We offer brands, DAOs, and companies a completely new way to distribute value: each gift is simultaneously onboarding, education, and user activation.

**4. Sustainable Emission Model**
Unlike tokens with predetermined inflation, CGC uses milestone-based emission: tokens are only minted when the DAO creates verifiable value.

**5. Infrastructure, Not Just Product**
CryptoGift Wallets is not an isolated app - it's infrastructure that other organizations can use for their own onboarding and distribution use cases.

### Competitive Differentiators

| Feature | CryptoGift | Traditional Gift Cards | Onboarding Tools |
|---------|------------|------------------------|------------------|
| Claim Rate | **85.7%** | 3-4% | N/A |
| Real Wallet | ✅ ERC-6551 | ❌ Custodial | ⚠️ Requires setup |
| Gasless | ✅ 100% | ❌ | ⚠️ Partial |
| Integrated Education | ✅ | ❌ | ❌ |
| Non-Custodial | ✅ | ❌ | ✅ |
| B2B Ready | ✅ | ⚠️ | ❌ |

---

# 4. STACK TECNOLÓGICO / TECHNOLOGY STACK

## 🇪🇸 ESPAÑOL

### Smart Contracts (Solidity 0.8.20)

**1. CGC Token**
- Implementación ERC-20 con Votes y Permit
- Integración con sistema de minting basado en milestones
- Pausable + Ownable para seguridad

**2. MilestoneEscrow**
- Custodia segura de tokens CGC
- Liberación programática basada en validaciones
- Verificación de firmas EIP-712
- Operaciones batch para distribución eficiente

**3. MasterEIP712Controller**
- Control centralizado de autorizaciones
- Rate limiting por usuario y global
- Sistema de admins múltiples
- Controles de emergencia

**4. TaskRulesEIP712**
- Validación de reglas de tareas
- Cálculo de recompensas basado en complejidad (niveles 1-5)
- Integración con Ethereum Attestation Service (EAS)

### Frontend (Next.js 15 + TypeScript)

- Server-side rendering para SEO
- Diseño mobile-first responsive
- ThirdWeb v5 SDK para interacciones con wallet
- Soporte multi-idioma (i18n) - Español/Inglés
- Wagmi v2 para conexión de wallets

### Account Abstraction

- **Biconomy Paymaster**: Patrocinio de gas para usuarios
- **Smart Contract Wallets**: Para receivers sin wallet previa
- **Gasless Claiming**: Primera y siguientes transacciones sin costo

### Infraestructura

- **Hosting**: Vercel (CI/CD automático)
- **Metadata**: IPFS via NFT.Storage
- **Database**: Supabase (PostgreSQL)
- **Cache**: Upstash Redis
- **RPC**: Base Mainnet público + Alchemy backup

### Gobernanza

- **Framework**: Aragon OSx v1.4.0
- **Plugin**: Token Voting v1.3
- **Timelock**: 48h en funciones críticas
- **Multisig**: 3/5 para emergencias

---

## 🇬🇧 ENGLISH

### Smart Contracts (Solidity 0.8.20)

**1. CGC Token**
- ERC-20 implementation with Votes and Permit
- Integration with milestone-based minting system
- Pausable + Ownable for security

**2. MilestoneEscrow**
- Secure custody of CGC tokens
- Programmatic release based on validations
- EIP-712 signature verification
- Batch operations for efficient distribution

**3. MasterEIP712Controller**
- Centralized authorization control
- Rate limiting per user and global
- Multiple admin system
- Emergency controls

**4. TaskRulesEIP712**
- Task rules validation
- Reward calculation based on complexity (levels 1-5)
- Integration with Ethereum Attestation Service (EAS)

### Frontend (Next.js 15 + TypeScript)

- Server-side rendering for SEO
- Mobile-first responsive design
- ThirdWeb v5 SDK for wallet interactions
- Multi-language support (i18n) - Spanish/English
- Wagmi v2 for wallet connections

### Account Abstraction

- **Biconomy Paymaster**: Gas sponsorship for users
- **Smart Contract Wallets**: For receivers without prior wallet
- **Gasless Claiming**: First and subsequent transactions at no cost

### Infrastructure

- **Hosting**: Vercel (automatic CI/CD)
- **Metadata**: IPFS via NFT.Storage
- **Database**: Supabase (PostgreSQL)
- **Cache**: Upstash Redis
- **RPC**: Base Mainnet public + Alchemy backup

### Governance

- **Framework**: Aragon OSx v1.4.0
- **Plugin**: Token Voting v1.3
- **Timelock**: 48h on critical functions
- **Multisig**: 3/5 for emergencies

---

# 5. TOKENOMICS

## 🇪🇸 ESPAÑOL

### Modelo de Emisión Basado en Milestones

**Principio Fundamental**: Los tokens CGC SOLO se mintean cuando el DAO crea valor medible a través de milestones verificados.

### Supply Actual

| Métrica | Valor |
|---------|-------|
| **Supply Circulante** | 2,000,000 CGC |
| **Supply Máximo Teórico** | 22,000,000 CGC |
| **Modelo de Emisión** | Progressive Milestone-Based |
| **Minter Autorizado** | MilestoneEscrow Contract |

### Distribución Actual (2M CGC)

| Holder | Cantidad | Porcentaje | Propósito |
|--------|----------|------------|-----------|
| **MilestoneEscrow** | 800,000 CGC | 40% | Recompensas de tareas y milestones |
| **Aragon DAO Treasury** | 500,000 CGC | 25% | Reservas controladas por gobernanza |
| **Deployer/Operations** | 595,300 CGC | 29.8% | Operaciones y desarrollo |
| **Pool Aerodrome** | 4,200 CGC | 0.2% | Liquidez DEX |
| **Team (Roberto Legrá)** | 50,000 CGC | 2.5% | Advisor allocation |
| **Team (Leodanni Avila)** | 50,000 CGC | 2.5% | Advisor allocation |

### Emisión Progresiva Futura (20M CGC potencial)

#### Milestones de Desarrollo (Target: 8M CGC)
- Dashboard v1.0 Launch → 500,000 CGC
- Task System v2.0 → 1,000,000 CGC
- Mobile App Release → 1,500,000 CGC
- Enterprise Features → 2,000,000 CGC
- API Marketplace Launch → 3,000,000 CGC

#### Milestones de Comunidad (Target: 7M CGC)
- 10,000 Active Users → 1,000,000 CGC
- 50,000 Active Users → 2,000,000 CGC
- 100,000 Active Users → 4,000,000 CGC

#### Milestones de Revenue (Target: 5M CGC)
- $100K ARR → 1,000,000 CGC
- $500K ARR → 2,000,000 CGC
- $1M ARR → 2,000,000 CGC

### Utilidad del Token

1. **Gobernanza**: Crear y votar propuestas en Aragon DAO
2. **Acceso**: Contenido premium y features exclusivas
3. **Boosts**: Multiplicadores de experiencia y cooldowns reducidos
4. **Staking** (Próximamente): Rewards por participación

---

## 🇬🇧 ENGLISH

### Milestone-Based Emission Model

**Core Principle**: CGC tokens are ONLY minted when the DAO creates measurable value through verified milestone completion.

### Current Supply

| Metric | Value |
|--------|-------|
| **Circulating Supply** | 2,000,000 CGC |
| **Max Theoretical Supply** | 22,000,000 CGC |
| **Emission Model** | Progressive Milestone-Based |
| **Authorized Minter** | MilestoneEscrow Contract |

### Current Distribution (2M CGC)

| Holder | Amount | Percentage | Purpose |
|--------|--------|------------|---------|
| **MilestoneEscrow** | 800,000 CGC | 40% | Task and milestone rewards |
| **Aragon DAO Treasury** | 500,000 CGC | 25% | Governance-controlled reserves |
| **Deployer/Operations** | 595,300 CGC | 29.8% | Operations and development |
| **Aerodrome Pool** | 4,200 CGC | 0.2% | DEX Liquidity |
| **Team (Roberto Legrá)** | 50,000 CGC | 2.5% | Advisor allocation |
| **Team (Leodanni Avila)** | 50,000 CGC | 2.5% | Advisor allocation |

### Future Progressive Emission (20M CGC potential)

#### Development Milestones (Target: 8M CGC)
- Dashboard v1.0 Launch → 500,000 CGC
- Task System v2.0 → 1,000,000 CGC
- Mobile App Release → 1,500,000 CGC
- Enterprise Features → 2,000,000 CGC
- API Marketplace Launch → 3,000,000 CGC

#### Community Milestones (Target: 7M CGC)
- 10,000 Active Users → 1,000,000 CGC
- 50,000 Active Users → 2,000,000 CGC
- 100,000 Active Users → 4,000,000 CGC

#### Revenue Milestones (Target: 5M CGC)
- $100K ARR → 1,000,000 CGC
- $500K ARR → 2,000,000 CGC
- $1M ARR → 2,000,000 CGC

### Token Utility

1. **Governance**: Create and vote on proposals in Aragon DAO
2. **Access**: Premium content and exclusive features
3. **Boosts**: Experience multipliers and reduced cooldowns
4. **Staking** (Coming Soon): Participation rewards

---

# 6. EQUIPO / TEAM

## 🇪🇸 ESPAÑOL

### Equipo Principal

**Rafael González** - Founder & Product/Engineering Lead
- Desarrollo full-stack y smart contracts
- Diseño de producto y arquitectura técnica
- LinkedIn: [Por confirmar]
- Ubicación: [Por confirmar]

**Roberto Legrá** - Head of Community & Growth / Marketing Advisor
- Estrategia de crecimiento y comunidad
- Marketing y partnerships
- Allocation: 50,000 CGC

**Leodanni Avila** - Business Development & Operations / Marketing Advisor
- Desarrollo de negocio y operaciones
- Relaciones con inversores
- Allocation: 50,000 CGC

### Empresa

**The Moon in a Box Inc.**
- Tipo: Delaware C-Corporation
- Enfoque: Productos Web3 de consumo que eliminan barreras de adopción
- Visión: Hacer la tecnología blockchain invisible para usuarios finales
- Email: admin@mbxarts.com

### Advisory (Abierto)
Activamente buscando advisors en:
- Ecosistema Base
- Infraestructura Web3
- Growth y Marketing Cripto

---

## 🇬🇧 ENGLISH

### Core Team

**Rafael González** - Founder & Product/Engineering Lead
- Full-stack development and smart contracts
- Product design and technical architecture
- LinkedIn: [To confirm]
- Location: [To confirm]

**Roberto Legrá** - Head of Community & Growth / Marketing Advisor
- Growth and community strategy
- Marketing and partnerships
- Allocation: 50,000 CGC

**Leodanni Avila** - Business Development & Operations / Marketing Advisor
- Business development and operations
- Investor relations
- Allocation: 50,000 CGC

### Company

**The Moon in a Box Inc.**
- Type: Delaware C-Corporation
- Focus: Consumer Web3 products that eliminate adoption barriers
- Vision: Make blockchain technology invisible to end users
- Email: admin@mbxarts.com

### Advisory (Open)
Actively seeking advisors in:
- Base Ecosystem
- Web3 Infrastructure
- Crypto Growth and Marketing

---

# 7. TRACCIÓN Y MÉTRICAS / TRACTION & METRICS

## 🇪🇸 ESPAÑOL

### Estado Actual del Proyecto

| Métrica | Valor | Notas |
|---------|-------|-------|
| **Fase** | Production Ready | Live en Base Mainnet |
| **Contratos Desplegados** | 5 | Todos verificados en BaseScan |
| **Días de Desarrollo** | 400+ | Desde 2024 |
| **Claim Rate (Beta)** | 85.7% | vs 3-4% industria |
| **Pool de Liquidez** | ~$100 USD | Aerodrome WETH/CGC |
| **Comunidad Discord** | Activa | discord.gg/XzmKkrvhHc |
| **Comunidad Telegram** | Activa | t.me/cryptogiftwalletsdao |
| **Giveth** | Publicado | giveth.io/project/cryptogift-wallets-dao |

### Métricas Técnicas

| Métrica | Valor |
|---------|-------|
| **Transacciones On-Chain** | 717+ (zero failures) |
| **Error Rate** | 0% |
| **Uptime** | 99.9% (Vercel hosted) |
| **Build Deployments** | 100+ |
| **Idiomas Soportados** | 2 (ES/EN) |

### Hitos Completados

- ✅ Smart contracts desplegados y verificados (Enero 2025)
- ✅ Sistema de tareas con mecánicas competitivas
- ✅ Panel de administración con validación segura
- ✅ Sistema de referidos multinivel implementado
- ✅ DAO Aragon operacional
- ✅ Pool de liquidez en Aerodrome (Diciembre 2025)
- ✅ APIs CoinGecko-compliant
- ✅ Whitepaper v1.2 publicado
- ✅ Aplicación CoinGecko enviada (Diciembre 2025)
- ✅ Aplicación BaseScan enviada (Diciembre 2025)

---

## 🇬🇧 ENGLISH

### Current Project Status

| Metric | Value | Notes |
|--------|-------|-------|
| **Stage** | Production Ready | Live on Base Mainnet |
| **Contracts Deployed** | 5 | All verified on BaseScan |
| **Development Days** | 400+ | Since 2024 |
| **Claim Rate (Beta)** | 85.7% | vs 3-4% industry |
| **Liquidity Pool** | ~$100 USD | Aerodrome WETH/CGC |
| **Discord Community** | Active | discord.gg/XzmKkrvhHc |
| **Telegram Community** | Active | t.me/cryptogiftwalletsdao |
| **Giveth** | Published | giveth.io/project/cryptogift-wallets-dao |

### Technical Metrics

| Metric | Value |
|--------|-------|
| **On-Chain Transactions** | 717+ (zero failures) |
| **Error Rate** | 0% |
| **Uptime** | 99.9% (Vercel hosted) |
| **Build Deployments** | 100+ |
| **Languages Supported** | 2 (ES/EN) |

### Completed Milestones

- ✅ Smart contracts deployed and verified (January 2025)
- ✅ Task system with competitive mechanics
- ✅ Admin panel with secure validation
- ✅ Multi-level referral system implemented
- ✅ Aragon DAO operational
- ✅ Liquidity pool on Aerodrome (December 2025)
- ✅ CoinGecko-compliant APIs
- ✅ Whitepaper v1.2 published
- ✅ CoinGecko application submitted (December 2025)
- ✅ BaseScan application submitted (December 2025)

---

# 8. ROADMAP

## 🇪🇸 ESPAÑOL

*Última actualización: Diciembre 2025*

### Q4 2024 - Q1 2025: Fundación e Infraestructura ✅ Completado
- ✅ Deploy DAO en Aragon con Token Voting
- ✅ Lanzar token CGC (2M supply)
- ✅ Deploy MilestoneEscrow + MasterEIP712Controller + TaskRulesEIP712
- ✅ Sistema de tareas competitivas + Pagos automáticos CGC
- ✅ Sistema de referidos multinivel (10%, 5%, 2.5%)

### Q2-Q3 2025: Crecimiento ✅ Completado
- ✅ Pool de liquidez Aerodrome (WETH/CGC)
- ✅ Token metadata + APIs CoinGecko-compliant
- ✅ Whitepaper v1.2.1 + Sistema i18n bilingüe

### Q4 2025: Comunidad & Listings ✅ AHORA (Diciembre 2025)
- ✅ Discord server (21 canales, 10 roles) + mbxarts.com
- ✅ Collab.Land + SEO + Funding Application Guide
- 🔄 CoinGecko (re-aplicar) + BaseScan (enviada)
- 🔄 Grants: Base Builder, Optimism, Gitcoin - Ready to apply

### Q1 2026: Tracción & Grants 📋 Próximo
- 📋 Submit grants + Re-aplicar CoinGecko
- 📋 Expand quests + Partnerships educativas

### Q2-Q3 2026: Escala 🎯 Planificado
- 🎯 Automated Minting + White-label + 1155-TBA-like campaigns

### Q4 2026+: Visión 🔮
- 🔮 API fintechs + RWA + Colaboraciones ecosistema Base

---

## 🇬🇧 ENGLISH

*Last Updated: December 2025*

### Q4 2024 - Q1 2025: Foundation & Infrastructure ✅ Completed
- ✅ Deploy DAO on Aragon with Token Voting
- ✅ Launch CGC token (2M supply)
- ✅ Deploy MilestoneEscrow + MasterEIP712Controller + TaskRulesEIP712
- ✅ Competitive task system + Automatic CGC payments
- ✅ Multi-level referral system (10%, 5%, 2.5%)

### Q2-Q3 2025: Growth ✅ Completed
- ✅ Aerodrome liquidity pool (WETH/CGC)
- ✅ Token metadata + CoinGecko-compliant APIs
- ✅ Whitepaper v1.2.1 + Bilingual i18n system

### Q4 2025: Community & Listings ✅ NOW (December 2025)
- ✅ Discord server (21 channels, 10 roles) + mbxarts.com
- ✅ Collab.Land + SEO + Funding Application Guide
- 🔄 CoinGecko (re-applying) + BaseScan (submitted)
- 🔄 Grants: Base Builder, Optimism, Gitcoin - Ready to apply

### Q1 2026: Traction & Grants 📋 Next
- 📋 Submit grants + Re-apply CoinGecko
- 📋 Expand quests + Educational partnerships

### Q2-Q3 2026: Scale 🎯 Planned
- 🎯 Automated Minting + White-label + 1155-TBA-like campaigns

### Q4 2026+: Vision 🔮
- 🔮 Fintech API + RWA + Base ecosystem collaborations

---

# 9. MODELO DE NEGOCIO / BUSINESS MODEL

## 🇪🇸 ESPAÑOL

### Fuentes de Ingresos

**1. Modelo Freemium** (Planificado Q1-Q2 2026)
- **Gratis**: Hasta 10 gifts/mes
- **Pro**: $9.99/mes ilimitado + features premium
- **Conversión esperada**: 2-5% de usuarios gratuitos

**2. Licenciamiento B2B** (Foco Principal)
| Tier | Precio | Target |
|------|--------|--------|
| Comunidades/DAOs | $100-500/mes | Pequeñas comunidades |
| Empresas | $500-2,000/mes | Empresas medianas |
| Enterprise | $5k+/mes | Grandes corporaciones |

**3. Fees de Transacción** (Opcional)
- 1-2% en on-ramps fiat solamente
- Solo cuando usuarios compran cripto con tarjeta
- Transparente y opt-in

**4. Rev-Share con Creadores** (Futuro)
- Influencers crean templates de gift personalizados
- 10% rev-share en uso de sus templates
- Marketing viral integrado

### Unit Economics Proyectados

| Métrica | Valor |
|---------|-------|
| **CAC** | $5-10 (orgánico + referrals) |
| **LTV** | $50-100 (freemium + B2B) |
| **LTV/CAC** | 5-10x |

### Proyecciones de Revenue

| Período | Revenue Proyectado |
|---------|-------------------|
| Mes 3 | $1k MRR |
| Mes 6 | $10k MRR |
| Mes 12 | $50k MRR |
| Año 2 | $500k ARR |

---

## 🇬🇧 ENGLISH

### Revenue Streams

**1. Freemium Model** (Planned Q1-Q2 2026)
- **Free**: Up to 10 gifts/month
- **Pro**: $9.99/month unlimited + premium features
- **Expected conversion**: 2-5% of free users

**2. B2B Licensing** (Primary Focus)
| Tier | Price | Target |
|------|-------|--------|
| Communities/DAOs | $100-500/month | Small communities |
| Companies | $500-2,000/month | Mid-size companies |
| Enterprise | $5k+/month | Large corporations |

**3. Transaction Fees** (Optional)
- 1-2% on fiat on-ramps only
- Only when users buy crypto with card
- Transparent and opt-in

**4. Creator Rev-Share** (Future)
- Influencers create custom gift templates
- 10% rev-share on their template usage
- Built-in viral marketing

### Projected Unit Economics

| Metric | Value |
|--------|-------|
| **CAC** | $5-10 (organic + referrals) |
| **LTV** | $50-100 (freemium + B2B) |
| **LTV/CAC** | 5-10x |

### Revenue Projections

| Period | Projected Revenue |
|--------|-------------------|
| Month 3 | $1k MRR |
| Month 6 | $10k MRR |
| Month 12 | $50k MRR |
| Year 2 | $500k ARR |

---

# 10. USO DE FONDOS / USE OF FUNDS

## 🇪🇸 ESPAÑOL

### Presupuesto Típico: $10,000 - $15,000

| Categoría | Monto | Uso |
|-----------|-------|-----|
| **Security & Audits** | $2,000-3,000 | Auditoría informal + scanning automatizado |
| **Gas Sponsorship Pool** | $3,000-5,000 | Biconomy Paymaster para primeros 200-400 usuarios |
| **Go-to-Market** | $2,000-3,000 | Product Hunt + contenido + comunidad |
| **Infraestructura** | $1,500-2,000 | Vercel Pro + APIs + almacenamiento |
| **Contingencia** | $1,500-2,000 | Costos inesperados + runway extension |

### Milestones con Fondos

**Milestone 1: Primeros 100 Usuarios Reales** ($3,000)
- Gas sponsorship para onboarding
- Contenido educativo
- Community building inicial

**Milestone 2: 1,000 Gifts + Pilot B2B** ($5,000)
- Expandir pool de gas
- Desarrollo de features B2B
- Case study y documentación

**Milestone 3: Product-Market Fit** ($4,000)
- Marketing amplificado
- Partnerships educativas
- Analytics avanzados

**Milestone 4: Contribución al Ecosistema** ($3,000)
- Documentación open-source
- Workshops/Twitter Spaces
- Contribuciones a repos del ecosistema

---

## 🇬🇧 ENGLISH

### Typical Budget: $10,000 - $15,000

| Category | Amount | Use |
|----------|--------|-----|
| **Security & Audits** | $2,000-3,000 | Informal audit + automated scanning |
| **Gas Sponsorship Pool** | $3,000-5,000 | Biconomy Paymaster for first 200-400 users |
| **Go-to-Market** | $2,000-3,000 | Product Hunt + content + community |
| **Infrastructure** | $1,500-2,000 | Vercel Pro + APIs + storage |
| **Contingency** | $1,500-2,000 | Unexpected costs + runway extension |

### Milestones with Funds

**Milestone 1: First 100 Real Users** ($3,000)
- Gas sponsorship for onboarding
- Educational content
- Initial community building

**Milestone 2: 1,000 Gifts + B2B Pilot** ($5,000)
- Expand gas pool
- B2B feature development
- Case study and documentation

**Milestone 3: Product-Market Fit** ($4,000)
- Amplified marketing
- Educational partnerships
- Advanced analytics

**Milestone 4: Ecosystem Contribution** ($3,000)
- Open-source documentation
- Workshops/Twitter Spaces
- Ecosystem repo contributions

---

# 11. IMPACTO EN EL ECOSISTEMA / ECOSYSTEM IMPACT

## 🇪🇸 ESPAÑOL

### Impacto Directo

**1. Showcase de Capacidades Técnicas**
- Primera app de consumo usando ERC-6551 en Base
- Demuestra beneficios de UX de Account Abstraction
- Prueba que bajos costos de gas habilitan nuevos casos de uso

**2. Onboarding de Nuevos Usuarios**
- Cada gift = 2 nuevos usuarios (sender + receiver)
- 1,000 gifts = 2,000 nuevos usuarios en Base
- Muchos receivers serán usuarios cripto por primera vez

**3. Recursos para Desarrolladores**
- Implementación open-source de ERC-6551
- Documentación y mejores prácticas
- Workshops para educación comunitaria

### Impacto Indirecto

**4. Casos de Uso B2B**
- Comunidades usando CryptoGift para rewards → más transacciones Base
- Empresas usándolo para adquisición → más direcciones Base
- DAOs usándolo para compensación → más actividad Base

**5. Narrativa & Branding**
- "Gifting en Base" se convierte en parte de la identidad del ecosistema
- Historia consumer-friendly (vs narrativa solo DeFi)
- Cobertura mediática destacando ventajas UX de Base

**6. Efectos de Red**
- Sistema de referidos crea loops virales
- Cada usuario puede regalar a 10+ personas
- Potencial de crecimiento exponencial

### KPIs Medibles (6 meses post-grant)

| Métrica | Target |
|---------|--------|
| Nuevas Direcciones en Base | 2,000-5,000 |
| Transacciones Generadas | 10,000-20,000 |
| Contenido Base-Native | 5+ blog posts, 2+ workshops |
| Adopción por Developers | 2-3 proyectos inspirados |
| Clientes B2B | 5-10 organizaciones |

---

## 🇬🇧 ENGLISH

### Direct Impact

**1. Showcase of Technical Capabilities**
- First consumer app using ERC-6551 on Base
- Demonstrates Account Abstraction UX benefits
- Proves low gas costs enable new use cases

**2. Onboarding New Users**
- Each gift = 2 new users (sender + receiver)
- 1,000 gifts = 2,000 new Base users
- Many receivers will be first-time crypto users

**3. Developer Resources**
- Open-source implementation of ERC-6551
- Documentation and best practices
- Workshops for community education

### Indirect Impact

**4. B2B Use Cases**
- Communities using CryptoGift for rewards → more Base transactions
- Companies using it for acquisition → more Base addresses
- DAOs using it for compensation → more Base activity

**5. Narrative & Branding**
- "Gifting on Base" becomes part of ecosystem identity
- Consumer-friendly story (vs DeFi-only narrative)
- Media coverage highlighting Base's UX advantages

**6. Network Effects**
- Referral system creates viral loops
- Each user can gift to 10+ people
- Potential for exponential growth

### Measurable KPIs (6 months post-grant)

| Metric | Target |
|--------|--------|
| New Addresses on Base | 2,000-5,000 |
| Transactions Generated | 10,000-20,000 |
| Base-Native Content | 5+ blog posts, 2+ workshops |
| Developer Adoption | 2-3 inspired projects |
| B2B Customers | 5-10 organizations |

---

# 12. URLS Y RECURSOS / URLS & RESOURCES

## URLs Oficiales / Official URLs

### Plataforma / Platform
| Recurso | URL |
|---------|-----|
| **Website Principal** | https://mbxarts.com |
| **Documentación** | https://mbxarts.com/docs |
| **Whitepaper** | https://mbxarts.com/CRYPTOGIFT_WHITEPAPER_v1.2.pdf |
| **Funding Page** | https://mbxarts.com/funding |

### Blockchain / On-Chain
| Recurso | URL |
|---------|-----|
| **CGC Token (BaseScan)** | https://basescan.org/token/0x5e3a61b550328f3D8C44f60b3e10a49D3d806175 |
| **Aragon DAO** | https://app.aragon.org/dao/base-mainnet/0x3244DFBf9E5374DF2f106E89Cf7972E5D4C9ac31 |
| **Pool Aerodrome** | https://basescan.org/address/0x3032f62729513ec8a328143f7d5926b5257a43cd |
| **MilestoneEscrow** | https://basescan.org/address/0x8346CFcaECc90d678d862319449E5a742c03f109 |

### Código / Code
| Recurso | URL |
|---------|-----|
| **GitHub Repository** | https://github.com/CryptoGift-Wallets-DAO/CryptoGift-Wallets-DAO |
| **Smart Contracts** | Verificados en BaseScan (ver direcciones arriba) |

### Social / Community
| Recurso | URL |
|---------|-----|
| **Twitter/X** | https://x.com/cryptogiftdao |
| **Discord** | https://discord.gg/XzmKkrvhHc |
| **Telegram** | https://t.me/cryptogiftwalletsdao |
| **Giveth** | https://giveth.io/project/cryptogift-wallets-dao |

### APIs
| Endpoint | URL |
|----------|-----|
| **Total Supply** | https://mbxarts.com/api/token/total-supply |
| **Circulating Supply** | https://mbxarts.com/api/token/circulating-supply |
| **Token List (Uniswap format)** | https://mbxarts.com/tokenlist.json |

### Logos / Assets
| Asset | URL |
|-------|-----|
| **Logo 200x200 PNG** | https://raw.githubusercontent.com/CryptoGift-Wallets-DAO/CryptoGift-Wallets-DAO/main/public/metadata/cgc-logo-200x200.png |
| **Logo 512x512 PNG** | https://raw.githubusercontent.com/CryptoGift-Wallets-DAO/CryptoGift-Wallets-DAO/main/public/metadata/cgc-logo-512x512.png |
| **Logo 32x32 SVG** | https://raw.githubusercontent.com/CryptoGift-Wallets-DAO/CryptoGift-Wallets-DAO/main/public/cgc-logo-32x32.svg |

---

# 13. CONTACTO / CONTACT

## Información de Contacto / Contact Information

| Campo | Valor |
|-------|-------|
| **Email Principal** | admin@mbxarts.com |
| **Empresa** | The Moon in a Box Inc. |
| **Fundador** | Rafael González |
| **Discord** | discord.gg/XzmKkrvhHc |
| **Telegram** | t.me/cryptogiftwalletsdao |
| **Twitter** | @cryptogiftdao |
| **Giveth** | giveth.io/project/cryptogift-wallets-dao |

## Para Grants y Partnerships / For Grants and Partnerships

**Contacto Principal**: Rafael González
**Email**: admin@mbxarts.com
**Preferencia**: Email para comunicaciones formales, Discord/Twitter para preguntas rápidas

**Disponibilidad para Calls**: Flexible, coordinar via email

---

# 14. RESPUESTAS ESPECÍFICAS POR GRANT / GRANT-SPECIFIC ANSWERS

## BASE BUILDERS GRANT

### 🇪🇸 ¿Por qué Base específicamente?

Base permite nuestra visión a través de:

1. **Compatibilidad EVM para Innovación**: Soporte completo para ERC-6551 y EIP-712
2. **Economía de Gas Viable**: $0.10-0.30 por gift creation vs $10+ en mainnet
3. **Infraestructura Madura**: Vercel optimizations, ThirdWeb SDK, Biconomy ready
4. **Ecosistema de Builders**: Comunidad activa para partnerships
5. **Potencial Coinbase**: Futura integración con Coinbase Wallet

**Base Mainnet es nuestro ÚNICO target para 2025.** No estamos diversificando entre múltiples L2s.

### 🇬🇧 Why Base specifically?

Base enables our vision through:

1. **EVM Compatibility for Innovation**: Full support for ERC-6551 and EIP-712
2. **Viable Gas Economics**: $0.10-0.30 per gift creation vs $10+ on mainnet
3. **Mature Infrastructure**: Vercel optimizations, ThirdWeb SDK, Biconomy ready
4. **Builder Ecosystem**: Active community for partnerships
5. **Coinbase Potential**: Future integration with Coinbase Wallet

**Base Mainnet is our ONLY target for 2025.** We are not hedging across multiple L2s.

---

## GITCOIN GRANTS

### 🇪🇸 ¿Por qué somos un bien público?

CryptoGift Wallets es infraestructura open-source que:
- Reduce barreras de entrada a Web3 para millones de personas
- Provee educación cripto gratuita integrada
- Crea herramientas que otros proyectos pueden usar
- Beneficia a todo el ecosistema, no solo a nuestros usuarios

### 🇬🇧 Why are we a public good?

CryptoGift Wallets is open-source infrastructure that:
- Reduces Web3 entry barriers for millions of people
- Provides free integrated crypto education
- Creates tools that other projects can use
- Benefits the entire ecosystem, not just our users

---

## ARAGON GRANTS

### 🇪🇸 ¿Cómo beneficiamos al ecosistema Aragon?

- Usamos Aragon OSx v1.4.0 como nuestra capa de gobernanza
- Demostramos que DAOs pueden ser accesibles para usuarios no técnicos
- Contribuimos documentación sobre integración Aragon + consumer apps
- Expandimos el alcance de Aragon a nuevos mercados

### 🇬🇧 How do we benefit the Aragon ecosystem?

- We use Aragon OSx v1.4.0 as our governance layer
- We demonstrate that DAOs can be accessible to non-technical users
- We contribute documentation on Aragon + consumer apps integration
- We expand Aragon's reach to new markets

---

## OPTIMISM RETROPGF

### 🇪🇸 ¿Qué impacto hemos creado?

Aunque somos nuevos en mainnet, nuestro impacto incluye:
- Infraestructura open-source para onboarding Web3
- Documentación técnica de ERC-6551 + Account Abstraction
- Modelo innovador de tokenomics (milestone-based emission)
- Comunidad activa educando sobre Web3

### 🇬🇧 What impact have we created?

Although we are new to mainnet, our impact includes:
- Open-source infrastructure for Web3 onboarding
- Technical documentation of ERC-6551 + Account Abstraction
- Innovative tokenomics model (milestone-based emission)
- Active community educating about Web3

---

# 15. PLANTILLAS DE TEXTO / TEXT TEMPLATES

## Pitch de 30 Segundos / 30-Second Pitch

### 🇪🇸 Español
"CryptoGift Wallets transforma cómo las personas entran al mundo cripto. Usando ERC-6551, convertimos NFTs en wallets reales que cualquiera puede usar sin conocimiento previo. Mientras la industria tiene 3-4% de claim rate en gift cards cripto, nosotros logramos 85.7%. Somos la infraestructura que marcas, DAOs y empresas necesitan para onboardear usuarios a Web3 a escala."

### 🇬🇧 English
"CryptoGift Wallets transforms how people enter the crypto world. Using ERC-6551, we turn NFTs into real wallets that anyone can use without prior knowledge. While the industry has 3-4% claim rate on crypto gift cards, we achieve 85.7%. We are the infrastructure that brands, DAOs, and companies need to onboard users to Web3 at scale."

---

## Descripción del Proyecto (100 palabras) / Project Description (100 words)

### 🇪🇸 Español
CryptoGift Wallets DAO es la primera infraestructura Web3 que transforma NFTs en wallets completamente funcionales mediante ERC-6551 token-bound accounts y account abstraction. La plataforma permite a marcas, creadores y DAOs distribuir activos, recompensas y experiencias educativas a usuarios que aún no tienen wallet tradicional, con interacciones 100% gasless y onboarding guiado.

El token CGC gobierna el protocolo mediante Aragon DAO, con un modelo de emisión basado en milestones que asegura que el supply solo crece cuando se crea valor verificable. Desplegado en Base Mainnet con todos los contratos verificados.

### 🇬🇧 English
CryptoGift Wallets DAO is the first Web3 infrastructure that transforms NFTs into fully functional wallets using ERC-6551 token-bound accounts and account abstraction. The platform enables brands, creators, and DAOs to distribute assets, rewards, and educational experiences to users who don't have a traditional wallet yet, with 100% gasless interactions and guided onboarding.

The CGC token governs the protocol through Aragon DAO, with a milestone-based emission model that ensures supply only grows when verifiable value is created. Deployed on Base Mainnet with all contracts verified.

---

## Descripción del Proyecto (300 palabras) / Project Description (300 words)

### 🇪🇸 Español
CryptoGift Wallets, el producto insignia del ecosistema, es una infraestructura de producción que convierte NFTs en wallets no custodiales completamente funcionales utilizando cuentas vinculadas a tokens ERC-6551 y account abstraction. Este diseño revolucionario permite que marcas, creadores y DAOs distribuyan activos digitales, quests educativas y recompensas a usuarios que posiblemente no tengan una wallet tradicional, mientras la plataforma maneja todas las interacciones gasless y proporciona un onboarding guiado.

El problema que resolvemos es crítico: el 97% de las gift cards cripto nunca son reclamadas porque el proceso de setup de wallet es demasiado intimidante. CryptoGift elimina esta barrera completamente. El sender crea un gift en 2 minutos, el receiver completa una educación interactiva de 5 minutos, y automáticamente obtiene una wallet real con cripto dentro - sin seed phrases, sin gas fees, sin conocimiento previo necesario.

El propósito central de CryptoGift Wallets DAO es impulsar, gobernar y escalar esta plataforma principal, coordinando liquidez, incentivos y educación comunitaria para que más organizaciones puedan usar CryptoGift Wallets para incorporar nuevos usuarios a Web3 de manera sostenible y alineada con la misión.

El token CGC (CryptoGift Coin) es el token de gobernanza del ecosistema, con un modelo de emisión innovador basado en milestones: los tokens solo se mintean cuando el DAO crea valor verificable a través de logros medibles. Este modelo asegura que la expansión del supply siempre esté respaldada por creación real de valor.

Con todos los contratos desplegados y verificados en Base Mainnet, un pool de liquidez activo en Aerodrome Finance, y una comunidad Discord creciente, CryptoGift Wallets está posicionado para convertirse en el canal de distribución y activación principal para la adopción masiva de Web3 en Base.

### 🇬🇧 English
CryptoGift Wallets, the flagship product of the ecosystem, is a production-ready infrastructure that turns NFTs into fully functional, non-custodial wallets using ERC-6551 token-bound accounts and account abstraction. This revolutionary design allows brands, creators, and DAOs to distribute digital assets, educational quests, and rewards to users who may not even have a traditional wallet yet, while the platform handles all gasless interactions and provides guided onboarding.

The problem we solve is critical: 97% of crypto gift cards are never claimed because the wallet setup process is too intimidating. CryptoGift eliminates this barrier completely. The sender creates a gift in 2 minutes, the receiver completes a 5-minute interactive education, and automatically gets a real wallet with crypto inside - no seed phrases, no gas fees, no prior knowledge needed.

The core purpose of CryptoGift Wallets DAO is to bootstrap, govern, and scale this main platform, coordinating liquidity, incentives, and community education so that more organizations can use CryptoGift Wallets to onboard new users into Web3 in a sustainable, mission-aligned way.

The CGC (CryptoGift Coin) token is the ecosystem's governance token, with an innovative milestone-based emission model: tokens are only minted when the DAO creates verifiable value through measurable achievements. This model ensures that supply expansion is always backed by real value creation.

With all contracts deployed and verified on Base Mainnet, an active liquidity pool on Aerodrome Finance, and a growing Discord community, CryptoGift Wallets is positioned to become the primary distribution and activation channel for mass Web3 adoption on Base.

---

## Declaración Final / Final Declaration

### 🇪🇸 Español
Confirmo que toda la información proporcionada en esta aplicación es precisa y verificable. Todos los smart contracts están desplegados y verificados en Base Mainnet. Nos comprometemos a usar los fondos del grant exclusivamente para los propósitos establecidos y a proporcionar reportes transparentes sobre el progreso de los milestones.

### 🇬🇧 English
I confirm that all information provided in this application is accurate and verifiable. All smart contracts are deployed and verified on Base Mainnet. We commit to using grant funds exclusively for stated purposes and to providing transparent reporting on milestone progress.

---

# 📋 CHECKLIST PRE-APLICACIÓN / PRE-APPLICATION CHECKLIST

Antes de enviar cualquier aplicación, verificar:

- [ ] URLs funcionando (website, docs, GitHub)
- [ ] Contratos verificados en BaseScan
- [ ] Logo disponible en formato requerido
- [ ] Whitepaper actualizado
- [ ] APIs respondiendo correctamente
- [ ] Discord activo
- [ ] Twitter con actividad reciente
- [ ] Pool de liquidez verificable
- [ ] Datos de contacto correctos

---

**FIN DEL DOCUMENTO / END OF DOCUMENT**

---

© 2024-2025 The Moon in a Box Inc. | CryptoGift Wallets DAO
Versión 2.0 - Diciembre 2025

Made by mbxarts.com | The Moon in a Box property
