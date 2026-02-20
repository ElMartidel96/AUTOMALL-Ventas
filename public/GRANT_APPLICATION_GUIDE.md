# 📚 GUÍA MAESTRA DE SOLICITUDES DE GRANTS Y FINANCIAMIENTO
## CryptoGift Wallets DAO - Documento Oficial de Referencia

**Versión**: 3.0
**Última Actualización**: 11 de Diciembre, 2025
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
14. [Top 5 Oportunidades de Grants / Top 5 Grant Opportunities](#14-top-5-oportunidades-de-grants--top-5-grant-opportunities)
15. [Respuestas Específicas por Grant / Grant-Specific Answers](#15-respuestas-específicas-por-grant--grant-specific-answers)
16. [Plantillas de Texto / Text Templates](#16-plantillas-de-texto--text-templates)

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

### 📖 Historia del Proyecto

CryptoGift Wallets nace con una idea simple pero explosiva: **regalar no solo un objeto, sino una puerta**. Una puerta al futuro financiero… sin fricción, sin sustos técnicos y sin custodios. El "amigo que mira la cripto con recelo" no recibe un sermón ni un tutorial frío: recibe **una pieza de arte** que, por dentro, guarda **capital real on-chain**, listo para usar. Ahí empieza su historia como holder… y ahí empieza la nuestra.

Desde el inicio, el proyecto se diseñó como **infraestructura de producción**, no como experimento:

* **ERC-721 + ERC-6551 (TBA)**: *el NFT es la cuenta* (token-bound account).
* **ERC-1155 + 6551-like (CryptoGift) = 1155-TBA-like**: nuestro protocolo central para **producción masiva** (campañas ilimitadas, concursos, sondeos, packs corporativos, educación y marketing) con **claim EIP-712**, **gas patrocinado**, reglas configurables y **auto-return** si no se reclama. "El arte abre la bóveda; la bóveda escala a millones."

En paralelo, el proyecto evoluciona como **ecosistema gobernado por comunidad**: el DAO se concibe para **coordinar educación, incentivos, liquidez y crecimiento**, alineando recompensas con valor real creado (no con promesas vacías). Con despliegues, contratos verificados, documentación profesional y comunidad activa, CryptoGift Wallets avanza con consistencia y con una tesis clara: **la adopción masiva no se logra empujando wallets, se logra regalando confianza**.

---

### 🎯 ¿De qué trata el proyecto?

**CryptoGift Wallets DAO** es una organización autónoma descentralizada en **Base (L2 de Ethereum)** que convierte el aprendizaje y la participación en **poder real de gobernanza**. El usuario no "consume contenido": completa **quests**, contribuye a **hitos comunitarios** y gana **CGC (CryptoGift Coin)**, que se traduce en voto, propuestas, delegación y decisiones del protocolo.

Y lo más importante: el DAO no existe "al lado" del producto… existe para **arrancar, gobernar y escalar** el producto principal:

**CryptoGift Wallets** es la infraestructura que transforma NFTs en **wallets no custodiales funcionales** para:

* **regalos cripto programables**,
* **onboarding guiado para no-cripto nativos**,
* **interacciones sin gas para el usuario** (paymaster / gas patrocinado),
* y **campañas masivas** vía **1155-TBA-like**, donde cada token puede tener su mini-wallet vinculada y reglas de reclamo (condiciones, fechas, ubicación, tareas, verificación).

El resultado: un sistema donde **la emoción (regalo) activa la adopción**, y la tecnología queda **invisible** hasta que el usuario ya está "dentro".

---

### Versión Corta (50 palabras)
CryptoGift Wallets DAO transforma NFTs en wallets no custodiales mediante ERC-6551, permitiendo regalos cripto programables, onboarding gasless y campañas masivas vía 1155-TBA-like. El DAO gobierna y escala esta infraestructura, coordinando educación, liquidez e incentivos para que la adopción masiva llegue regalando confianza, no empujando wallets.

### Versión Media (150 palabras)
CryptoGift Wallets nace de una tesis simple: **la adopción masiva no se logra empujando wallets, se logra regalando confianza**.

El producto insignia convierte NFTs en wallets no custodiales completamente funcionales usando ERC-6551 (token-bound accounts) y account abstraction. Esto permite que marcas, creadores y DAOs distribuyan activos digitales, quests educativas y recompensas a usuarios sin wallet previa, con experiencia 100% gasless y onboarding guiado.

Pero el core que nadie está ejecutando así es **1155-TBA-like**: producción masiva de tokens con mini-wallets vinculadas, claim EIP-712, gas patrocinado, reglas configurables y auto-return si no se reclama. "El arte abre la bóveda; la bóveda escala a millones."

El propósito central del DAO es **arrancar, gobernar y escalar** esta plataforma, coordinando liquidez, incentivos y educación comunitaria. CryptoGift Wallets no es solo infraestructura educativa: es un **nuevo riel de distribución** para la adopción masiva de Web3 en Base.

### Versión Completa (400+ palabras)

**Historia**: CryptoGift Wallets nace con una idea explosiva: regalar no solo un objeto, sino una puerta al futuro financiero. El "amigo que mira la cripto con recelo" no recibe un sermón ni un tutorial frío: recibe una pieza de arte que, por dentro, guarda capital real on-chain, listo para usar. Ahí empieza su historia como holder.

**El Problema**: El 97% de las gift cards cripto nunca son reclamadas. Los usuarios enfrentan un proceso intimidante: crear wallet, guardar seed phrase, pagar fees de gas. El 70% abandona en el primer minuto. La adopción masiva está bloqueada por fricción técnica y miedo.

**Nuestra Solución - El Core Técnico**:
- **ERC-721 + ERC-6551 (TBA)**: El NFT ES la cuenta (token-bound account)
- **1155-TBA-like**: Producción masiva con claim EIP-712, gas patrocinado, reglas configurables y auto-return
- **Account Abstraction (Biconomy)**: 100% gasless para receivers
- **Base L2**: Transacciones económicas que hacen viable la economía de gifting

**El Flujo**:
1. **Sender** (2 min): Sube imagen, establece monto, genera link compartible
2. **Receiver** (5 min): Click en link → educación interactiva → claim automático
3. **Resultado**: El NFT SE CONVIERTE en wallet con cripto dentro, listo para usar

**Infraestructura de Producción**: Desplegado en Base Mainnet desde Enero 2025, con todos los contratos verificados en BaseScan:
- Sistema de tareas con mecánicas competitivas y timeouts automáticos
- Panel de administración con validación segura EIP-712
- Pagos automáticos de CGC post-validación
- Sistema de referidos multinivel (10%, 5%, 2.5%)
- Gobernanza descentralizada via Aragon DAO
- Pool de liquidez activo en Aerodrome Finance

**El DAO**: No existe "al lado" del producto - existe para arrancarlo, gobernarlo y escalarlo. Los usuarios completan quests, contribuyen a hitos comunitarios y ganan CGC, que se traduce en voto, propuestas y decisiones del protocolo. Las recompensas están alineadas con valor real creado, no con promesas vacías.

**Visión**: Convertir CryptoGift Wallets en componentes plug-and-play/white-label para marcas, creadores, comunidades y ONGs: campañas masivas con 1155-TBA-like, reglas configurables, atribución y reporting en tiempo real. API para integración en fintechs "en dos líneas". Puente hacia activos tokenizados (RWA) y programas de lealtad, manteniendo transparencia radical: reservas on-chain, gasto de gas patrocinado visible, auditorías accesibles.

---

## 🇬🇧 ENGLISH

### 📖 Project History

CryptoGift Wallets was born with a simple yet explosive idea: **gifting not just an object, but a doorway**. A doorway to financial future... without friction, without technical scares, and without custodians. The "friend who looks at crypto with suspicion" doesn't receive a sermon or a cold tutorial: they receive **a piece of art** that, inside, holds **real on-chain capital**, ready to use. That's where their story as a holder begins... and that's where ours begins too.

From the start, the project was designed as **production infrastructure**, not as an experiment:

* **ERC-721 + ERC-6551 (TBA)**: *the NFT is the account* (token-bound account).
* **ERC-1155 + 6551-like (CryptoGift) = 1155-TBA-like**: our core protocol for **massive production** (unlimited campaigns, contests, surveys, corporate packs, education and marketing) with **EIP-712 claim**, **sponsored gas**, configurable rules and **auto-return** if not claimed. "Art opens the vault; the vault scales to millions."

In parallel, the project evolves as a **community-governed ecosystem**: the DAO is conceived to **coordinate education, incentives, liquidity and growth**, aligning rewards with real value created (not empty promises). With deployments, verified contracts, professional documentation and an active community, CryptoGift Wallets advances with consistency and a clear thesis: **mass adoption isn't achieved by pushing wallets, it's achieved by gifting trust**.

---

### 🎯 What is the project about?

**CryptoGift Wallets DAO** is a decentralized autonomous organization on **Base (Ethereum L2)** that converts learning and participation into **real governance power**. Users don't "consume content": they complete **quests**, contribute to **community milestones** and earn **CGC (CryptoGift Coin)**, which translates into voting, proposals, delegation and protocol decisions.

And most importantly: the DAO doesn't exist "alongside" the product... it exists to **bootstrap, govern and scale** the main product:

**CryptoGift Wallets** is the infrastructure that transforms NFTs into **functional non-custodial wallets** for:

* **programmable crypto gifts**,
* **guided onboarding for non-crypto natives**,
* **gasless user interactions** (paymaster / sponsored gas),
* and **massive campaigns** via **1155-TBA-like**, where each token can have its linked mini-wallet and claim rules (conditions, dates, location, tasks, verification).

The result: a system where **emotion (gift) activates adoption**, and technology remains **invisible** until the user is already "inside".

---

### Short Version (50 words)
CryptoGift Wallets DAO transforms NFTs into non-custodial wallets via ERC-6551, enabling programmable crypto gifts, gasless onboarding and massive campaigns via 1155-TBA-like. The DAO governs and scales this infrastructure, coordinating education, liquidity and incentives so mass adoption comes from gifting trust, not pushing wallets.

### Medium Version (150 words)
CryptoGift Wallets is born from a simple thesis: **mass adoption isn't achieved by pushing wallets, it's achieved by gifting trust**.

The flagship product converts NFTs into fully functional non-custodial wallets using ERC-6551 (token-bound accounts) and account abstraction. This allows brands, creators and DAOs to distribute digital assets, educational quests and rewards to users without prior wallets, with 100% gasless experience and guided onboarding.

But the core that nobody is executing like this is **1155-TBA-like**: massive production of tokens with linked mini-wallets, EIP-712 claim, sponsored gas, configurable rules and auto-return if not claimed. "Art opens the vault; the vault scales to millions."

The DAO's core purpose is to **bootstrap, govern and scale** this platform, coordinating liquidity, incentives and community education. CryptoGift Wallets isn't just educational infrastructure: it's a **new distribution rail** for mass Web3 adoption on Base.

### Full Version (400+ words)

**History**: CryptoGift Wallets was born with an explosive idea: gifting not just an object, but a doorway to financial future. The "friend who looks at crypto with suspicion" doesn't receive a sermon or a cold tutorial: they receive a piece of art that, inside, holds real on-chain capital, ready to use. That's where their story as a holder begins.

**The Problem**: 97% of crypto gift cards are never claimed. Users face an intimidating process: create wallet, save seed phrase, pay gas fees. 70% abandon in the first minute. Mass adoption is blocked by technical friction and fear.

**Our Solution - The Technical Core**:
- **ERC-721 + ERC-6551 (TBA)**: The NFT IS the account (token-bound account)
- **1155-TBA-like**: Massive production with EIP-712 claim, sponsored gas, configurable rules and auto-return
- **Account Abstraction (Biconomy)**: 100% gasless for receivers
- **Base L2**: Economic transactions that make gifting economics viable

**The Flow**:
1. **Sender** (2 min): Upload image, set amount, generate shareable link
2. **Receiver** (5 min): Click link → interactive education → automatic claim
3. **Result**: The NFT BECOMES wallet with crypto inside, ready to use

**Production Infrastructure**: Deployed on Base Mainnet since January 2025, with all contracts verified on BaseScan:
- Task system with competitive mechanics and automatic timeouts
- Admin panel with secure EIP-712 validation
- Automatic CGC payments post-validation
- Multi-level referral system (10%, 5%, 2.5%)
- Decentralized governance via Aragon DAO
- Active liquidity pool on Aerodrome Finance

**The DAO**: It doesn't exist "alongside" the product - it exists to bootstrap, govern and scale it. Users complete quests, contribute to community milestones and earn CGC, which translates into voting, proposals and protocol decisions. Rewards are aligned with real value created, not empty promises.

**Vision**: Transform CryptoGift Wallets into plug-and-play/white-label components for brands, creators, communities and NGOs: massive campaigns with 1155-TBA-like, configurable rules, attribution and real-time reporting. API for fintech integration "in two lines". Bridge to tokenized assets (RWA) and loyalty programs, maintaining radical transparency: on-chain reserves, visible sponsored gas spending, accessible audits.

---

# 3. PROPUESTA DE VALOR / VALUE PROPOSITION

## 🇪🇸 ESPAÑOL

### ¿Qué Hace Único a CryptoGift Wallets?

CryptoGift Wallets no es "otro onboarding Web3". Es un **nuevo riel de distribución**: convierte el regalo en un mecanismo de adopción replicable, medible y escalable.

**1. El core que nadie está ejecutando así (y para producción masiva): 1155-TBA-like**
Esto NO es "futuro lejano". Es una de las piezas más valiosas del core:
- Campañas de **millones de tokens**
- **Claim EIP-712** sin custodia
- **Gas patrocinado**
- **Reglas configurables** (fecha/ubicación/tareas/verificación)
- **Auto-return**: si no se reclama, los fondos vuelven automáticamente al emisor
> Esto elimina "cajas negras", caducidades injustas y dependencia de terceros.

**2. El NFT deja de ser "imagen" y se vuelve "bóveda"**
Con **ERC-6551 + account abstraction**, el usuario siente que tiene un objeto con valor real, controlable con acciones simples ("retirar", "cambiar moneda"), sin pelear con gas, setups, ni fricción técnica.

**3. Adopción humana: empezamos por vínculo, no por frialdad**
La mayoría entra a cripto por una rampa fría: exchange, QR, tutorial. Aquí se entra por algo que el cerebro entiende de inmediato: **un regalo con historia**. Eso convierte curiosidad en confianza.

**4. "Aprender para reclamar": la Academy como motor de crecimiento medible**
La Academy no es adorno: es un "growth loop":
- El valor se libera al completar módulos, tests, encuestas o misiones
- Badges/certificaciones on-chain
- KPIs y atribución listos para marcas/ONGs que necesitan medir impacto antes de soltar incentivos

**5. Comunidades superpuestas (micro-DAOs) desde el primer día**
Cada TBA/1155-TBA puede incluir tokens de gobernanza: micro-comunidades que votan, priorizan y gestionan tesorerías (compatible con Aragon). Esto habilita capítulos locales, voluntariado, fans de marca o cohorts educativas con gobernanza real.

**6. Tokenomics con "credibilidad": emisión por hitos verificables**
En lugar de inflar supply por calendario, la emisión progresa cuando hay hitos reales (valor creado). Sumado a verificación criptográfica de logros (EAS), contratos verificados y delegación de voto, el DAO se siente como institución, no como hype.

### Diferenciadores Competitivos

| Característica | CryptoGift | Gift Cards Tradicionales | Onboarding Tools |
|---------------|------------|--------------------------|------------------|
| Claim Rate | **85.7%** | 3-4% | N/A |
| Wallet Real | ✅ ERC-6551/1155-TBA | ❌ Custodial | ⚠️ Requiere setup |
| Gasless | ✅ 100% Patrocinado | ❌ | ⚠️ Parcial |
| Educación Integrada | ✅ Academy Medible | ❌ | ❌ |
| No Custodial | ✅ | ❌ | ✅ |
| B2B Ready | ✅ White-label | ⚠️ | ❌ |
| Auto-Return | ✅ | ❌ | ❌ |
| Campañas Masivas | ✅ 1155-TBA | ❌ | ❌ |
| Micro-DAOs | ✅ | ❌ | ❌ |

---

## 🇬🇧 ENGLISH

### What Makes CryptoGift Wallets Unique?

CryptoGift Wallets isn't "another Web3 onboarding". It's a **new distribution rail**: it turns gifting into a replicable, measurable, scalable adoption mechanism.

**1. The core nobody else is executing like this (and for massive production): 1155-TBA-like**
This is NOT "distant future". It's one of the most valuable pieces of the core:
- Campaigns of **millions of tokens**
- **EIP-712 claim** without custody
- **Sponsored gas**
- **Configurable rules** (date/location/tasks/verification)
- **Auto-return**: if not claimed, funds automatically return to sender
> This eliminates "black boxes", unfair expirations and third-party dependence.

**2. The NFT stops being "image" and becomes "vault"**
With **ERC-6551 + account abstraction**, users feel they have an object with real value, controllable with simple actions ("withdraw", "swap currency"), without fighting with gas, setups, or technical friction.

**3. Human adoption: we start with connection, not coldness**
Most people enter crypto through a cold ramp: exchange, QR, tutorial. Here you enter through something the brain understands immediately: **a gift with a story**. That converts curiosity into trust.

**4. "Learn to claim": the Academy as a measurable growth engine**
The Academy isn't decoration: it's a "growth loop":
- Value is released upon completing modules, tests, surveys or missions
- On-chain badges/certifications
- KPIs and attribution ready for brands/NGOs that need to measure impact before releasing incentives

**5. Overlapping communities (micro-DAOs) from day one**
Each TBA/1155-TBA can include governance tokens: micro-communities that vote, prioritize and manage treasuries (Aragon compatible). This enables local chapters, volunteering, brand fans or educational cohorts with real governance.

**6. Tokenomics with "credibility": emission by verifiable milestones**
Instead of inflating supply by calendar, emission progresses when there are real milestones (value created). Combined with cryptographic achievement verification (EAS), verified contracts and vote delegation, the DAO feels like an institution, not hype.

### Competitive Differentiators

| Feature | CryptoGift | Traditional Gift Cards | Onboarding Tools |
|---------|------------|------------------------|------------------|
| Claim Rate | **85.7%** | 3-4% | N/A |
| Real Wallet | ✅ ERC-6551/1155-TBA | ❌ Custodial | ⚠️ Requires setup |
| Gasless | ✅ 100% Sponsored | ❌ | ⚠️ Partial |
| Integrated Education | ✅ Measurable Academy | ❌ | ❌ |
| Non-Custodial | ✅ | ❌ | ✅ |
| B2B Ready | ✅ White-label | ⚠️ | ❌ |
| Auto-Return | ✅ | ❌ | ❌ |
| Massive Campaigns | ✅ 1155-TBA | ❌ | ❌ |
| Micro-DAOs | ✅ | ❌ | ❌ |

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
- LinkedIn: https://linkedin.com/in/rafaelgonzalez
- Email: admin@mbxarts.com

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
- Website: https://mbxarts.com
- Email: admin@mbxarts.com

---

## 🇬🇧 ENGLISH

### Core Team

**Rafael González** - Founder & Product/Engineering Lead
- Full-stack development and smart contracts
- Product design and technical architecture
- LinkedIn: https://linkedin.com/in/rafaelgonzalez
- Email: admin@mbxarts.com

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
- Website: https://mbxarts.com
- Email: admin@mbxarts.com

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
- ✅ Whitepaper v1.2.1 publicado
- ✅ Aplicación CoinGecko enviada (Diciembre 2025)
- ✅ Aplicación BaseScan enviada (Diciembre 2025)
- ✅ Discord server completamente configurado (21 canales, 10 roles)
- ✅ SEO optimizado (robots.txt, sitemap.xml, metadata)

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
- ✅ Whitepaper v1.2.1 published
- ✅ CoinGecko application submitted (December 2025)
- ✅ BaseScan application submitted (December 2025)
- ✅ Discord server fully configured (21 channels, 10 roles)
- ✅ SEO optimized (robots.txt, sitemap.xml, metadata)

---

# 8. ROADMAP - ¿QUÉ SIGUE AHORA? / WHAT'S NEXT?

## 🇪🇸 ESPAÑOL

### Visión Estratégica

**Lo próximo no es "crecer por crecer". Es escalar sin perder el alma: emoción + infraestructura + medición.**

---

### ✅ COMPLETADO (Q4 2024 - Q4 2025)

**Q4 2024 - Fundación**
- ✅ Deploy DAO en Aragon con Token Voting
- ✅ Lanzar token CGC (2M supply inicial)
- ✅ Arquitectura de contratos definida

**Q1 2025 - Infraestructura Core**
- ✅ Deploy MilestoneEscrow + MasterEIP712Controller + TaskRulesEIP712
- ✅ Sistema de tareas con mecánicas competitivas y timeouts
- ✅ Pagos automáticos de CGC post-validación
- ✅ Sistema de referidos multinivel (10%, 5%, 2.5%)

**Q2-Q3 2025 - Crecimiento**
- ✅ Pool de liquidez Aerodrome activo (WETH/CGC)
- ✅ Token metadata completo (logos, APIs CoinGecko-compliant)
- ✅ Whitepaper v1.2.1 publicado
- ✅ Sistema i18n bilingüe (ES/EN)

**Q4 2025 - Comunidad & Listings (AHORA - Diciembre 2025)**
- ✅ Discord server completo (21 canales, 10 roles)
- ✅ Domain migration a mbxarts.com
- ✅ Collab.Land instalado para token gating
- ✅ Funding Application Guide completo (Top 5 grants)
- ✅ SEO optimizado (robots.txt, sitemap, metadata)
- ✅ Twitter/X corregido (@cryptogiftdao)
- ✅ QR Code con logo CGC para referidos

---

### 🔄 EN PROGRESO (Q4 2025 - Diciembre)

**Listings & Grants:**
- 🔄 CoinGecko: Rechazada → Re-aplicar con más tracción (14 días)
- 🔄 BaseScan: Enviada, esperando respuesta
- 🔄 Base Builder Grants: Ready to apply
- 🔄 Optimism Atlas: Crear perfil
- 🔄 Gitcoin Grants: Preparar para GG24

**Configuración:**
- 🔄 Collab.Land TGR: Configurar Token Gating Rules
- 🔄 Production testing con usuarios reales
- 🔄 DAO Integration: Transferir CGC tokens al vault de Aragon

---

### 📋 PRÓXIMO (Q1 2026)

**Tracción & Grants:**
- 📋 Re-aplicar CoinGecko con métricas de tracción
- 📋 Submit Base Builder Grants application
- 📋 Register en Optimism Atlas para RetroPGF
- 📋 Aplicar a Gitcoin Grants GG24 (Oct 2025 deadline)

**Producto:**
- 📋 Expandir catálogo de quests
- 📋 Onboarding de creadores/educadores
- 📋 Dashboard de analytics avanzado con métricas de impacto
- 📋 Partnerships con 3+ plataformas educativas

---

### 🎯 PLANIFICADO (Q2-Q3 2026)

**Escala sin perder alma:**
- 🎯 Implementar Automated Minting System (diseño en docs/)
- 🎯 Componentes **plug-and-play/white-label** para marcas/ONGs
- 🎯 Campañas masivas **1155-TBA-like** con reglas configurables
- 🎯 "**Gifting for events**" (bodas, cumpleaños, donaciones)
- 🎯 Sistema de NFT achievements on-chain
- 🎯 Interfaz mobile-optimizada

---

### 🔮 VISIÓN (Q4 2026+)

**El riel invisible - Infraestructura Financiera:**
- 🔮 **API para fintechs "en dos líneas"**
- 🔮 Puente hacia **activos tokenizados (RWA)** y programas de lealtad
- 🔮 **Colaboraciones masivas** con proyectos del ecosistema Base
- 🔮 Integraciones DeFi avanzadas
- 🔮 Mecanismos de staking CGC
- 🔮 Descentralización progresiva de gobernanza
- 🔮 **Transparencia radical**: reservas on-chain, gas patrocinado visible, auditorías accesibles

---

## 🇬🇧 ENGLISH

### Strategic Vision

**What's next isn't "growing for the sake of growing". It's scaling without losing the soul: emotion + infrastructure + measurement.**

---

### ✅ COMPLETED (Q4 2024 - Q4 2025)

**Q4 2024 - Foundation**
- ✅ Deploy DAO on Aragon with Token Voting
- ✅ Launch CGC token (2M initial supply)
- ✅ Contract architecture defined

**Q1 2025 - Core Infrastructure**
- ✅ Deploy MilestoneEscrow + MasterEIP712Controller + TaskRulesEIP712
- ✅ Task system with competitive mechanics and timeouts
- ✅ Automatic CGC payments post-validation
- ✅ Multi-level referral system (10%, 5%, 2.5%)

**Q2-Q3 2025 - Growth**
- ✅ Active Aerodrome liquidity pool (WETH/CGC)
- ✅ Complete token metadata (logos, CoinGecko-compliant APIs)
- ✅ Whitepaper v1.2.1 published
- ✅ Bilingual i18n system (ES/EN)

**Q4 2025 - Community & Listings (NOW - December 2025)**
- ✅ Complete Discord server (21 channels, 10 roles)
- ✅ Domain migration to mbxarts.com
- ✅ Collab.Land installed for token gating
- ✅ Complete Funding Application Guide (Top 5 grants)
- ✅ SEO optimized (robots.txt, sitemap, metadata)
- ✅ Twitter/X corrected (@cryptogiftdao)
- ✅ QR Code with CGC logo for referrals

---

### 🔄 IN PROGRESS (Q4 2025 - December)

**Listings & Grants:**
- 🔄 CoinGecko: Rejected → Re-apply with more traction (14 days)
- 🔄 BaseScan: Submitted, awaiting response
- 🔄 Base Builder Grants: Ready to apply
- 🔄 Optimism Atlas: Create profile
- 🔄 Gitcoin Grants: Prepare for GG24

**Configuration:**
- 🔄 Collab.Land TGR: Configure Token Gating Rules
- 🔄 Production testing with real users
- 🔄 DAO Integration: Transfer CGC tokens to Aragon vault

---

### 📋 NEXT (Q1 2026)

**Traction & Grants:**
- 📋 Re-apply CoinGecko with traction metrics
- 📋 Submit Base Builder Grants application
- 📋 Register on Optimism Atlas for RetroPGF
- 📋 Apply to Gitcoin Grants GG24 (Oct 2025 deadline)

**Product:**
- 📋 Expand quest catalog
- 📋 Creator/educator onboarding
- 📋 Advanced analytics dashboard with impact metrics
- 📋 Partnerships with 3+ educational platforms

---

### 🎯 PLANNED (Q2-Q3 2026)

**Scale without losing soul:**
- 🎯 Implement Automated Minting System (design in docs/)
- 🎯 **Plug-and-play/white-label components** for brands/NGOs
- 🎯 Massive **1155-TBA-like campaigns** with configurable rules
- 🎯 "**Gifting for events**" (weddings, birthdays, donations)
- 🎯 On-chain NFT achievements system
- 🎯 Mobile-optimized interface

---

### 🔮 VISION (Q4 2026+)

**The invisible rail - Financial Infrastructure:**
- 🔮 **API for fintechs "in two lines"**
- 🔮 Bridge to **tokenized assets (RWA)** and loyalty programs
- 🔮 **Massive collaborations** with Base ecosystem projects
- 🔮 Advanced DeFi integrations
- 🔮 CGC staking mechanisms
- 🔮 Progressive governance decentralization
- 🔮 **Radical transparency**: on-chain reserves, visible sponsored gas, accessible audits

---

# 9. MODELO DE NEGOCIO / BUSINESS MODEL

## 🇪🇸 ESPAÑOL

### Fuentes de Ingresos

**1. Modelo Freemium** (Lanzamiento Q2 2025)
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

**1. Freemium Model** (Launch Q2 2025)
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

### Measurable KPIs (6 months post-grant)

| Metric | Target |
|--------|--------|
| New Addresses on Base | 2,000-5,000 |
| Transactions Generated | 10,000-20,000 |
| Base-Native Content | 5+ blog posts, 2+ workshops |
| Developer Adoption | 2-3 inspired projects |
| B2B Customers | 5-10 organizations |

---

# 12. URLS Y RECURSOS / URLs & RESOURCES

## URLs Oficiales / Official URLs

### Plataforma / Platform
| Recurso | URL |
|---------|-----|
| **Website Principal** | https://mbxarts.com |
| **Documentación** | https://mbxarts.com/docs |
| **Whitepaper** | https://mbxarts.com/CRYPTOGIFT_WHITEPAPER_v1.2.html |
| **Whitepaper PDF** | https://mbxarts.com/CRYPTOGIFT_WHITEPAPER_v1.2.pdf |
| **Funding Page** | https://mbxarts.com/funding |

### Blockchain / On-Chain
| Recurso | URL |
|---------|-----|
| **CGC Token (BaseScan)** | https://basescan.org/token/0x5e3a61b550328f3D8C44f60b3e10a49D3d806175 |
| **Aragon DAO** | https://app.aragon.org/#/daos/base/0x3244DFBf9E5374DF2f106E89Cf7972E5D4C9ac31 |
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
| **Discord** | https://discord.gg/XzmKkrvhHc |
| **Telegram** | https://t.me/cryptogiftwalletsdao |
| **Twitter** | @cryptogiftdao |
| **Giveth** | https://giveth.io/project/cryptogift-wallets-dao |

## Para Grants y Partnerships / For Grants and Partnerships

**Contacto Principal**: Rafael González
**Email**: admin@mbxarts.com
**Preferencia**: Email para comunicaciones formales, Discord/Twitter para preguntas rápidas
**Disponibilidad para Calls**: Flexible, coordinar via email

---

# 14. TOP 5 OPORTUNIDADES DE GRANTS / TOP 5 GRANT OPPORTUNITIES

## Resumen Ejecutivo / Executive Summary

| # | Oportunidad | Monto | Dificultad | Estado CryptoGift | Prioridad |
|---|-------------|-------|------------|-------------------|-----------|
| 1 | Base Builder Grants | 1-5 ETH ($3k-15k) | Media | ✅ Listo para aplicar | ⭐⭐⭐⭐⭐ |
| 2 | Base Weekly Rewards | 2 ETH/semana | Fácil | ✅ Registrarse en Talent Protocol | ⭐⭐⭐⭐⭐ |
| 3 | Optimism RetroPGF | $10k-500k+ | Media | ⏳ Crear cuenta en Atlas | ⭐⭐⭐⭐ |
| 4 | Gitcoin Grants | $1k-50k+ | Media | ⏳ Crear perfil | ⭐⭐⭐⭐ |
| 5 | Base Batches | Mentorship + Funding | Alta | ⏳ H2 2025 | ⭐⭐⭐ |

---

## 1. BASE BUILDER GRANTS

### 🇪🇸 Información
| Campo | Valor |
|-------|-------|
| **Monto** | 1-5 ETH (≈$3,000-$15,000 USD) |
| **Tipo** | Retroactivo (reward shipped code) |
| **Deadline** | Rolling (aplicar cuando esté listo) |
| **URL** | https://docs.base.org/get-started/get-funded |

### Requisitos
- ✅ Proyecto desplegado en Base Mainnet (TENEMOS)
- ✅ Código verificable/open-source (TENEMOS)
- ✅ Documentación clara (TENEMOS)
- ✅ Pool de liquidez activo (TENEMOS)

### 🇬🇧 Information
| Field | Value |
|-------|-------|
| **Amount** | 1-5 ETH (≈$3,000-$15,000 USD) |
| **Type** | Retroactive (reward shipped code) |
| **Deadline** | Rolling (apply when ready) |
| **URL** | https://docs.base.org/get-started/get-funded |

---

## 2. BASE WEEKLY REWARDS (BUILDER SCORE)

### 🇪🇸 Información
| Campo | Valor |
|-------|-------|
| **Monto** | 2 ETH distribuidos semanalmente |
| **Tipo** | Competencia semanal via Talent Protocol |
| **Dificultad** | Fácil |
| **URL** | https://www.builderscore.xyz/ |

### Cómo Participar
1. Crear cuenta en builderscore.xyz
2. Conectar wallet deployer
3. Registrar proyecto
4. Postear updates semanales en Twitter con #BuildOnBase

### 🇬🇧 How to Participate
1. Create account at builderscore.xyz
2. Connect deployer wallet
3. Register project
4. Post weekly updates on Twitter with #BuildOnBase

---

## 3. OPTIMISM RetroPGF

### 🇪🇸 Información
| Campo | Valor |
|-------|-------|
| **Monto** | $10,000 - $500,000+ |
| **Tipo** | Retroactive Public Goods Funding |
| **Deadline** | Rondas anuales (próxima: 2025) |
| **URL** | https://atlas.optimism.io/ |

### Por Qué CryptoGift Califica
- Infraestructura open-source para onboarding Web3
- Base es parte del Optimism Superchain
- Documentación técnica disponible para otros developers

---

## 4. GITCOIN GRANTS

### 🇪🇸 Información
| Campo | Valor |
|-------|-------|
| **Monto** | $1,000 - $50,000+ |
| **Tipo** | Quadratic Funding |
| **Deadline** | Rondas trimestrales |
| **URL** | https://grants.gitcoin.co |

### Cómo Funciona
- Los usuarios donan pequeñas cantidades al proyecto
- Un matching pool multiplica las donaciones
- Muchas donaciones pequeñas > pocas donaciones grandes

---

## 5. BASE BATCHES

### 🇪🇸 Información
| Campo | Valor |
|-------|-------|
| **Monto** | Mentorship + Resources + Funding |
| **Tipo** | Accelerator/Incubator |
| **Deadline** | Próximo cohort: H2 2025 |
| **URL** | https://basebatches.xyz |

### Estructura
1. **Buildathon**: Desarrollo rápido con mentorship
2. **Incubator**: 4 semanas de soporte estructurado
3. **Pitch Day**: Presentaciones a inversores incluyendo Coinbase Ventures

---

# 15. RESPUESTAS ESPECÍFICAS POR GRANT / GRANT-SPECIFIC ANSWERS

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

## OPTIMISM RetroPGF

### 🇪🇸 ¿Qué impacto hemos creado?

Nuestro impacto incluye:
- Infraestructura open-source para onboarding Web3
- Documentación técnica de ERC-6551 + Account Abstraction
- Modelo innovador de tokenomics (milestone-based emission)
- Comunidad activa educando sobre Web3
- Base es parte del Optimism Superchain

### 🇬🇧 What impact have we created?

Our impact includes:
- Open-source infrastructure for Web3 onboarding
- Technical documentation of ERC-6551 + Account Abstraction
- Innovative tokenomics model (milestone-based emission)
- Active community educating about Web3
- Base is part of the Optimism Superchain

---

# 16. PLANTILLAS DE TEXTO / TEXT TEMPLATES

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

# 📋 CHECKLIST PRE-APLICACIÓN / PRE-APPLICATION CHECKLIST

Antes de enviar cualquier aplicación, verificar:

- [x] URLs funcionando (website, docs, GitHub)
- [x] Contratos verificados en BaseScan
- [x] Logo disponible en formato requerido (PNG, SVG)
- [x] Whitepaper actualizado (v1.2.1)
- [x] APIs respondiendo correctamente
- [x] Discord activo (21 canales, 10 roles)
- [x] Twitter con actividad reciente
- [x] Pool de liquidez verificable (Aerodrome)
- [x] Datos de contacto correctos (admin@mbxarts.com)

---

# 📊 ESTADO DE APLICACIONES / APPLICATION STATUS

| Plataforma | Estado | Fecha | Notas |
|------------|--------|-------|-------|
| **CoinGecko** | ⏳ Enviado | Dic 2025 | Esperando respuesta |
| **BaseScan** | ⏳ Enviado | Dic 2025 | Verificación de logo |
| **Base Builder Grants** | 📋 Pendiente | - | Listo para aplicar |
| **Base Weekly Rewards** | 📋 Pendiente | - | Registrarse en Talent Protocol |
| **Optimism RetroPGF** | 📋 Pendiente | - | Crear cuenta en Atlas |
| **Gitcoin Grants** | 📋 Pendiente | - | Crear perfil |

---

**FIN DEL DOCUMENTO / END OF DOCUMENT**

---

© 2024-2025 The Moon in a Box Inc. | CryptoGift Wallets DAO
Versión 3.0 - Diciembre 2025

Made by mbxarts.com | The Moon in a Box property
