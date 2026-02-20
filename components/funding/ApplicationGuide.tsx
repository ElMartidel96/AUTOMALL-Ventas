'use client';

import { useState } from 'react';
import {
  Copy,
  Check,
  Download,
  FileText,
  Globe,
  Building,
  Users,
  Coins,
  Target,
  Rocket,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Star,
  X,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

// ===== DATOS DE LA GUÍA =====
interface GuideSection {
  id: string;
  titleEs: string;
  titleEn: string;
  icon: React.ReactNode;
  contentEs: string;
  contentEn: string;
}

const guideSections: GuideSection[] = [
  {
    id: 'project-history',
    titleEs: '📖 Historia del Proyecto',
    titleEn: '📖 Project History',
    icon: <FileText className="w-5 h-5" />,
    contentEs: `CryptoGift Wallets nace con una idea simple pero explosiva: regalar no solo un objeto, sino una puerta. Una puerta al futuro financiero… sin fricción, sin sustos técnicos y sin custodios.

El "amigo que mira la cripto con recelo" no recibe un sermón ni un tutorial frío: recibe una pieza de arte que, por dentro, guarda capital real on-chain, listo para usar. Ahí empieza su historia como holder… y ahí empieza la nuestra.

Desde el inicio, el proyecto se diseñó como infraestructura de producción, no como experimento:

• ERC-721 + ERC-6551 (TBA): el NFT es la cuenta (token-bound account)
• ERC-1155 + 6551-like = 1155-TBA-like: producción masiva con claim EIP-712, gas patrocinado, reglas configurables y auto-return

"El arte abre la bóveda; la bóveda escala a millones."

Tesis clara: la adopción masiva no se logra empujando wallets, se logra regalando confianza.`,
    contentEn: `CryptoGift Wallets was born with a simple yet explosive idea: gifting not just an object, but a doorway. A doorway to financial future... without friction, without technical scares, and without custodians.

The "friend who looks at crypto with suspicion" doesn't receive a sermon or a cold tutorial: they receive a piece of art that, inside, holds real on-chain capital, ready to use. That's where their story as a holder begins... and that's where ours begins too.

From the start, the project was designed as production infrastructure, not as an experiment:

• ERC-721 + ERC-6551 (TBA): the NFT is the account (token-bound account)
• ERC-1155 + 6551-like = 1155-TBA-like: massive production with EIP-712 claim, sponsored gas, configurable rules and auto-return

"Art opens the vault; the vault scales to millions."

Clear thesis: mass adoption isn't achieved by pushing wallets, it's achieved by gifting trust.`
  },
  {
    id: 'project-short',
    titleEs: 'Descripción Corta (50 palabras)',
    titleEn: 'Short Description (50 words)',
    icon: <FileText className="w-5 h-5" />,
    contentEs: 'CryptoGift Wallets DAO transforma NFTs en wallets no custodiales mediante ERC-6551, permitiendo regalos cripto programables, onboarding gasless y campañas masivas vía 1155-TBA-like. El DAO gobierna y escala esta infraestructura, coordinando educación, liquidez e incentivos para que la adopción masiva llegue regalando confianza, no empujando wallets.',
    contentEn: 'CryptoGift Wallets DAO transforms NFTs into non-custodial wallets via ERC-6551, enabling programmable crypto gifts, gasless onboarding and massive campaigns via 1155-TBA-like. The DAO governs and scales this infrastructure, coordinating education, liquidity and incentives so mass adoption comes from gifting trust, not pushing wallets.'
  },
  {
    id: 'project-medium',
    titleEs: 'Descripción Media (150 palabras)',
    titleEn: 'Medium Description (150 words)',
    icon: <FileText className="w-5 h-5" />,
    contentEs: `CryptoGift Wallets nace de una tesis simple: la adopción masiva no se logra empujando wallets, se logra regalando confianza.

El producto insignia convierte NFTs en wallets no custodiales completamente funcionales usando ERC-6551 (token-bound accounts) y account abstraction. Esto permite que marcas, creadores y DAOs distribuyan activos digitales, quests educativas y recompensas a usuarios sin wallet previa, con experiencia 100% gasless y onboarding guiado.

Pero el core que nadie está ejecutando así es 1155-TBA-like: producción masiva de tokens con mini-wallets vinculadas, claim EIP-712, gas patrocinado, reglas configurables y auto-return si no se reclama. "El arte abre la bóveda; la bóveda escala a millones."

El propósito central del DAO es arrancar, gobernar y escalar esta plataforma, coordinando liquidez, incentivos y educación comunitaria. CryptoGift Wallets no es solo infraestructura educativa: es un nuevo riel de distribución para la adopción masiva de Web3 en Base.`,
    contentEn: `CryptoGift Wallets is born from a simple thesis: mass adoption isn't achieved by pushing wallets, it's achieved by gifting trust.

The flagship product converts NFTs into fully functional non-custodial wallets using ERC-6551 (token-bound accounts) and account abstraction. This allows brands, creators and DAOs to distribute digital assets, educational quests and rewards to users without prior wallets, with 100% gasless experience and guided onboarding.

But the core that nobody is executing like this is 1155-TBA-like: massive production of tokens with linked mini-wallets, EIP-712 claim, sponsored gas, configurable rules and auto-return if not claimed. "Art opens the vault; the vault scales to millions."

The DAO's core purpose is to bootstrap, govern and scale this platform, coordinating liquidity, incentives and community education. CryptoGift Wallets isn't just educational infrastructure: it's a new distribution rail for mass Web3 adoption on Base.`
  },
  {
    id: 'pitch-30s',
    titleEs: 'Pitch de 30 Segundos',
    titleEn: '30-Second Pitch',
    icon: <Rocket className="w-5 h-5" />,
    contentEs: '"CryptoGift Wallets transforma cómo las personas entran al mundo cripto. No empujamos wallets - regalamos confianza. Usando ERC-6551 y nuestro 1155-TBA-like, convertimos NFTs en wallets reales con capital on-chain. Mientras la industria tiene 3-4% de claim rate, nosotros logramos 85.7%. El arte abre la bóveda; la bóveda escala a millones. Somos la infraestructura que marcas, DAOs y empresas necesitan para onboardear usuarios a Web3 a escala."',
    contentEn: '"CryptoGift Wallets transforms how people enter crypto. We don\'t push wallets - we gift trust. Using ERC-6551 and our 1155-TBA-like, we turn NFTs into real wallets with on-chain capital. While the industry has 3-4% claim rate, we achieve 85.7%. Art opens the vault; the vault scales to millions. We are the infrastructure brands, DAOs and companies need to onboard users to Web3 at scale."'
  },
  {
    id: 'why-base',
    titleEs: '¿Por qué Base?',
    titleEn: 'Why Base?',
    icon: <Globe className="w-5 h-5" />,
    contentEs: `Base permite nuestra visión a través de:

1. Compatibilidad EVM para Innovación: Soporte completo para ERC-6551 y EIP-712
2. Economía de Gas Viable: $0.10-0.30 por gift creation vs $10+ en mainnet
3. Infraestructura Madura: Vercel optimizations, ThirdWeb SDK, Biconomy ready
4. Ecosistema de Builders: Comunidad activa para partnerships
5. Potencial Coinbase: Futura integración con Coinbase Wallet

Base Mainnet es nuestro ÚNICO target para 2025. No estamos diversificando entre múltiples L2s.`,
    contentEn: `Base enables our vision through:

1. EVM Compatibility for Innovation: Full support for ERC-6551 and EIP-712
2. Viable Gas Economics: $0.10-0.30 per gift creation vs $10+ on mainnet
3. Mature Infrastructure: Vercel optimizations, ThirdWeb SDK, Biconomy ready
4. Builder Ecosystem: Active community for partnerships
5. Coinbase Potential: Future integration with Coinbase Wallet

Base Mainnet is our ONLY target for 2025. We are not hedging across multiple L2s.`
  },
  {
    id: 'value-prop',
    titleEs: 'Propuesta de Valor - 6 Diferenciadores',
    titleEn: 'Value Proposition - 6 Differentiators',
    icon: <Star className="w-5 h-5" />,
    contentEs: `CryptoGift Wallets no es "otro onboarding Web3". Es un NUEVO RIEL DE DISTRIBUCIÓN.

1. El core que nadie está ejecutando así: 1155-TBA-like
• Campañas de millones de tokens
• Claim EIP-712 sin custodia + Gas patrocinado
• Reglas configurables (fecha/ubicación/tareas/verificación)
• Auto-return: fondos vuelven automáticamente al emisor si no se reclama
→ Elimina "cajas negras", caducidades injustas y dependencia de terceros.

2. El NFT deja de ser "imagen" y se vuelve "bóveda"
Con ERC-6551 + account abstraction, el usuario tiene un objeto con valor real, controlable con acciones simples ("retirar", "cambiar moneda"), sin gas ni fricción técnica.

3. Adopción humana: empezamos por vínculo, no por frialdad
La mayoría entra a cripto por una rampa fría (exchange, QR, tutorial). Aquí se entra por un regalo con historia. Eso convierte curiosidad en confianza.

4. "Aprender para reclamar": Academy como motor de crecimiento medible
• Valor liberado al completar módulos/tests/misiones
• Badges/certificaciones on-chain
• KPIs y atribución para marcas/ONGs que miden impacto

5. Comunidades superpuestas (micro-DAOs) desde el primer día
Cada TBA/1155-TBA puede incluir tokens de gobernanza: capítulos locales, voluntariado, fans de marca con gobernanza real (compatible Aragon).

6. Tokenomics con credibilidad: emisión por hitos verificables
Emisión progresa solo con hitos reales + verificación EAS + delegación de voto. El DAO se siente como institución, no como hype.`,
    contentEn: `CryptoGift Wallets isn't "another Web3 onboarding". It's a NEW DISTRIBUTION RAIL.

1. The core nobody else is executing like this: 1155-TBA-like
• Campaigns of millions of tokens
• EIP-712 claim without custody + Sponsored gas
• Configurable rules (date/location/tasks/verification)
• Auto-return: funds automatically return to sender if not claimed
→ Eliminates "black boxes", unfair expirations and third-party dependence.

2. The NFT stops being "image" and becomes "vault"
With ERC-6551 + account abstraction, users have an object with real value, controllable with simple actions ("withdraw", "swap currency"), without gas or technical friction.

3. Human adoption: we start with connection, not coldness
Most enter crypto through a cold ramp (exchange, QR, tutorial). Here you enter through a gift with a story. That converts curiosity into trust.

4. "Learn to claim": Academy as measurable growth engine
• Value released upon completing modules/tests/missions
• On-chain badges/certifications
• KPIs and attribution for brands/NGOs measuring impact

5. Overlapping communities (micro-DAOs) from day one
Each TBA/1155-TBA can include governance tokens: local chapters, volunteering, brand fans with real governance (Aragon compatible).

6. Tokenomics with credibility: emission by verifiable milestones
Emission progresses only with real milestones + EAS verification + vote delegation. The DAO feels like an institution, not hype.`
  },
  {
    id: 'team',
    titleEs: 'Equipo',
    titleEn: 'Team',
    icon: <Users className="w-5 h-5" />,
    contentEs: `Equipo Principal:

Rafael González - Founder & Product/Engineering Lead
- Desarrollo full-stack y smart contracts
- Diseño de producto y arquitectura técnica
- Email: admin@mbxarts.com

Roberto Legrá - Head of Community & Growth / Marketing Advisor
- Estrategia de crecimiento y comunidad

Leodanni Avila - Business Development & Operations / Marketing Advisor
- Desarrollo de negocio y operaciones

Empresa: The Moon in a Box Inc. (Delaware C-Corporation)`,
    contentEn: `Core Team:

Rafael González - Founder & Product/Engineering Lead
- Full-stack development and smart contracts
- Product design and technical architecture
- Email: admin@mbxarts.com

Roberto Legrá - Head of Community & Growth / Marketing Advisor
- Growth and community strategy

Leodanni Avila - Business Development & Operations / Marketing Advisor
- Business development and operations

Company: The Moon in a Box Inc. (Delaware C-Corporation)`
  },
  {
    id: 'traction',
    titleEs: 'Tracción y Métricas',
    titleEn: 'Traction & Metrics',
    icon: <Target className="w-5 h-5" />,
    contentEs: `Estado Actual:
- Fase: Production Ready (Live en Base Mainnet)
- Contratos Desplegados: 5 (Todos verificados en BaseScan)
- Días de Desarrollo: 400+
- Claim Rate (Beta): 85.7% vs 3-4% industria
- Pool de Liquidez: ~$100 USD (Aerodrome WETH/CGC)
- Discord: Activo (21 canales, 10 roles)

Métricas Técnicas:
- Transacciones On-Chain: 717+ (zero failures)
- Error Rate: 0%
- Uptime: 99.9%
- Idiomas Soportados: 2 (ES/EN)`,
    contentEn: `Current Status:
- Stage: Production Ready (Live on Base Mainnet)
- Contracts Deployed: 5 (All verified on BaseScan)
- Development Days: 400+
- Claim Rate (Beta): 85.7% vs 3-4% industry
- Liquidity Pool: ~$100 USD (Aerodrome WETH/CGC)
- Discord: Active (21 channels, 10 roles)

Technical Metrics:
- On-Chain Transactions: 717+ (zero failures)
- Error Rate: 0%
- Uptime: 99.9%
- Languages Supported: 2 (ES/EN)`
  },
  {
    id: 'tokenomics',
    titleEs: 'Tokenomics',
    titleEn: 'Tokenomics',
    icon: <Coins className="w-5 h-5" />,
    contentEs: `Token CGC:
- Nombre: CryptoGift Coin (CGC)
- Red: Base Mainnet (Chain ID: 8453)
- Contrato: 0x5e3a61b550328f3D8C44f60b3e10a49D3d806175
- Supply Circulante: 2,000,000 CGC
- Supply Máximo: 22,000,000 CGC (via milestone-based emission)
- Decimales: 18
- Estándar: ERC-20 with Votes & Permit

Modelo de Emisión: Los tokens CGC SOLO se mintean cuando el DAO crea valor medible a través de milestones verificados. Esto previene dilución arbitraria mientras permite crecimiento sostenible.`,
    contentEn: `CGC Token:
- Name: CryptoGift Coin (CGC)
- Network: Base Mainnet (Chain ID: 8453)
- Contract: 0x5e3a61b550328f3D8C44f60b3e10a49D3d806175
- Circulating Supply: 2,000,000 CGC
- Max Supply: 22,000,000 CGC (via milestone-based emission)
- Decimals: 18
- Standard: ERC-20 with Votes & Permit

Emission Model: CGC tokens are ONLY minted when the DAO creates measurable value through verified milestone completion. This prevents arbitrary dilution while enabling sustainable growth.`
  },
  {
    id: 'use-of-funds',
    titleEs: 'Uso de Fondos',
    titleEn: 'Use of Funds',
    icon: <Building className="w-5 h-5" />,
    contentEs: `Presupuesto Típico: $10,000 - $15,000

Desglose:
- Security & Audits: $2,000-3,000 (Auditoría + scanning automatizado)
- Gas Sponsorship Pool: $3,000-5,000 (Biconomy Paymaster para 200-400 usuarios)
- Go-to-Market: $2,000-3,000 (Product Hunt + contenido + comunidad)
- Infraestructura: $1,500-2,000 (Vercel Pro + APIs + almacenamiento)
- Contingencia: $1,500-2,000 (Costos inesperados)

Milestones:
- M1: Primeros 100 Usuarios ($3,000)
- M2: 1,000 Gifts + Pilot B2B ($5,000)
- M3: Product-Market Fit ($4,000)
- M4: Contribución al Ecosistema ($3,000)`,
    contentEn: `Typical Budget: $10,000 - $15,000

Breakdown:
- Security & Audits: $2,000-3,000 (Audit + automated scanning)
- Gas Sponsorship Pool: $3,000-5,000 (Biconomy Paymaster for 200-400 users)
- Go-to-Market: $2,000-3,000 (Product Hunt + content + community)
- Infrastructure: $1,500-2,000 (Vercel Pro + APIs + storage)
- Contingency: $1,500-2,000 (Unexpected costs)

Milestones:
- M1: First 100 Users ($3,000)
- M2: 1,000 Gifts + B2B Pilot ($5,000)
- M3: Product-Market Fit ($4,000)
- M4: Ecosystem Contribution ($3,000)`
  },
  {
    id: 'contracts',
    titleEs: 'Contratos Desplegados',
    titleEn: 'Deployed Contracts',
    icon: <FileText className="w-5 h-5" />,
    contentEs: `Contratos en Base Mainnet (Chain ID: 8453):

CGC Token: 0x5e3a61b550328f3D8C44f60b3e10a49D3d806175
MasterEIP712Controller: 0x67D9a01A3F7b5D38694Bb78dD39286Db75D7D869
TaskRulesEIP712: 0xdDcfFF04eC6D8148CDdE3dBde42456fB32bcC5bb
MilestoneEscrow: 0x8346CFcaECc90d678d862319449E5a742c03f109
Aragon DAO: 0x3244DFBf9E5374DF2f106E89Cf7972E5D4C9ac31
Aerodrome Pool: 0x3032f62729513ec8a328143f7d5926b5257a43cd

Todos los contratos están verificados en BaseScan.`,
    contentEn: `Contracts on Base Mainnet (Chain ID: 8453):

CGC Token: 0x5e3a61b550328f3D8C44f60b3e10a49D3d806175
MasterEIP712Controller: 0x67D9a01A3F7b5D38694Bb78dD39286Db75D7D869
TaskRulesEIP712: 0xdDcfFF04eC6D8148CDdE3dBde42456fB32bcC5bb
MilestoneEscrow: 0x8346CFcaECc90d678d862319449E5a742c03f109
Aragon DAO: 0x3244DFBf9E5374DF2f106E89Cf7972E5D4C9ac31
Aerodrome Pool: 0x3032f62729513ec8a328143f7d5926b5257a43cd

All contracts are verified on BaseScan.`
  },
  {
    id: 'urls',
    titleEs: 'URLs y Recursos',
    titleEn: 'URLs & Resources',
    icon: <Globe className="w-5 h-5" />,
    contentEs: `URLs Oficiales:

Website: https://mbxarts.com
Documentación: https://mbxarts.com/docs
Whitepaper: https://mbxarts.com/CRYPTOGIFT_WHITEPAPER_v1.2.html
GitHub: https://github.com/CryptoGift-Wallets-DAO/CryptoGift-Wallets-DAO
Discord: https://discord.gg/XzmKkrvhHc
Telegram: https://t.me/cryptogiftwalletsdao
Twitter: https://x.com/cryptogiftdao
Giveth: https://giveth.io/project/cryptogift-wallets-dao

APIs:
Total Supply: https://mbxarts.com/api/token/total-supply
Circulating Supply: https://mbxarts.com/api/token/circulating-supply

Logos:
Logo 200x200: https://raw.githubusercontent.com/CryptoGift-Wallets-DAO/CryptoGift-Wallets-DAO/main/public/metadata/cgc-logo-200x200.png
Logo 512x512: https://raw.githubusercontent.com/CryptoGift-Wallets-DAO/CryptoGift-Wallets-DAO/main/public/metadata/cgc-logo-512x512.png`,
    contentEn: `Official URLs:

Website: https://mbxarts.com
Documentation: https://mbxarts.com/docs
Whitepaper: https://mbxarts.com/CRYPTOGIFT_WHITEPAPER_v1.2.html
GitHub: https://github.com/CryptoGift-Wallets-DAO/CryptoGift-Wallets-DAO
Discord: https://discord.gg/XzmKkrvhHc
Telegram: https://t.me/cryptogiftwalletsdao
Twitter: https://x.com/cryptogiftdao
Giveth: https://giveth.io/project/cryptogift-wallets-dao

APIs:
Total Supply: https://mbxarts.com/api/token/total-supply
Circulating Supply: https://mbxarts.com/api/token/circulating-supply

Logos:
Logo 200x200: https://raw.githubusercontent.com/CryptoGift-Wallets-DAO/CryptoGift-Wallets-DAO/main/public/metadata/cgc-logo-200x200.png
Logo 512x512: https://raw.githubusercontent.com/CryptoGift-Wallets-DAO/CryptoGift-Wallets-DAO/main/public/metadata/cgc-logo-512x512.png`
  },
  {
    id: 'contact',
    titleEs: 'Contacto',
    titleEn: 'Contact',
    icon: <Users className="w-5 h-5" />,
    contentEs: `Contacto Principal: Rafael González
Email: admin@mbxarts.com
Empresa: The Moon in a Box Inc.
Discord: https://discord.gg/XzmKkrvhHc
Telegram: https://t.me/cryptogiftwalletsdao
Twitter: @cryptogiftdao
Giveth: https://giveth.io/project/cryptogift-wallets-dao

Disponibilidad para Calls: Flexible, coordinar via email`,
    contentEn: `Primary Contact: Rafael González
Email: admin@mbxarts.com
Company: The Moon in a Box Inc.
Discord: https://discord.gg/XzmKkrvhHc
Telegram: https://t.me/cryptogiftwalletsdao
Twitter: @cryptogiftdao
Giveth: https://giveth.io/project/cryptogift-wallets-dao

Availability for Calls: Flexible, coordinate via email`
  },
  {
    id: 'whats-next',
    titleEs: '🚀 ¿Qué Sigue Ahora? - Roadmap (Dic 2025)',
    titleEn: '🚀 What\'s Next? - Roadmap (Dec 2025)',
    icon: <Target className="w-5 h-5" />,
    contentEs: `VISIÓN: Lo próximo no es "crecer por crecer". Es escalar sin perder el alma: emoción + infraestructura + medición.

✅ COMPLETADO (Q4 2024 - Q4 2025):
• Q4 2024: DAO Aragon + Token Voting + CGC (2M supply)
• Q1 2025: MilestoneEscrow + Task system + Referidos multinivel
• Q2-Q3 2025: Pool Aerodrome + Token metadata + Whitepaper + i18n
• Q4 2025: Discord (21 canales) + mbxarts.com + Collab.Land + SEO + QR Code

🔄 EN PROGRESO (Q4 2025 - Diciembre):
• CoinGecko: Rechazada → Re-aplicar con más tracción
• BaseScan: Enviada, esperando respuesta
• Grants: Base Builder, Optimism Atlas, Gitcoin GG24 - Ready to apply
• Collab.Land TGR: Configurar Token Gating Rules
• Production testing con usuarios reales

📋 PRÓXIMO (Q1 2026):
• Re-aplicar CoinGecko con métricas de tracción
• Submit Base Builder Grants + Optimism Atlas + Gitcoin
• Expandir catálogo de quests + onboarding creadores
• Dashboard de analytics avanzado
• Partnerships con 3+ plataformas educativas

🎯 PLANIFICADO (Q2-Q3 2026):
• Automated Minting System implementation
• Componentes plug-and-play/white-label para marcas/ONGs
• Campañas masivas 1155-TBA-like
• "Gifting for events" (bodas, cumpleaños, donaciones)

🔮 VISIÓN (Q4 2026+):
• API para fintechs "en dos líneas"
• Puente hacia activos tokenizados (RWA)
• Colaboraciones masivas con ecosistema Base
• Transparencia radical: reservas on-chain, auditorías accesibles`,
    contentEn: `VISION: What's next isn't "growing for the sake of growing". It's scaling without losing the soul: emotion + infrastructure + measurement.

✅ COMPLETED (Q4 2024 - Q4 2025):
• Q4 2024: DAO Aragon + Token Voting + CGC (2M supply)
• Q1 2025: MilestoneEscrow + Task system + Multi-level referrals
• Q2-Q3 2025: Aerodrome pool + Token metadata + Whitepaper + i18n
• Q4 2025: Discord (21 channels) + mbxarts.com + Collab.Land + SEO + QR Code

🔄 IN PROGRESS (Q4 2025 - December):
• CoinGecko: Rejected → Re-apply with more traction
• BaseScan: Submitted, awaiting response
• Grants: Base Builder, Optimism Atlas, Gitcoin GG24 - Ready to apply
• Collab.Land TGR: Configure Token Gating Rules
• Production testing with real users

📋 NEXT (Q1 2026):
• Re-apply CoinGecko with traction metrics
• Submit Base Builder Grants + Optimism Atlas + Gitcoin
• Expand quest catalog + creator onboarding
• Advanced analytics dashboard
• Partnerships with 3+ educational platforms

🎯 PLANNED (Q2-Q3 2026):
• Automated Minting System implementation
• Plug-and-play/white-label components for brands/NGOs
• Massive 1155-TBA-like campaigns
• "Gifting for events" (weddings, birthdays, donations)

🔮 VISION (Q4 2026+):
• API for fintechs "in two lines"
• Bridge to tokenized assets (RWA)
• Massive collaborations with Base ecosystem
• Radical transparency: on-chain reserves, accessible audits`
  }
];

// ===== TOP 5 GRANTS =====
interface GrantStep {
  stepEs: string;
  stepEn: string;
  details?: string;
}

interface GrantTip {
  tipEs: string;
  tipEn: string;
}

interface TopGrant {
  id: string;
  name: string;
  amount: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  status: 'ready' | 'pending' | 'submitted';
  url: string;
  applyUrl: string;
  priority: number;
  descriptionEs: string;
  descriptionEn: string;
  stepsEs: string[];
  stepsEn: string[];
  tipsEs: string[];
  tipsEn: string[];
  requirementsEs: string[];
  requirementsEn: string[];
  timeline?: string;
}

const topGrants: TopGrant[] = [
  {
    id: 'base-builder',
    name: 'Base Builder Grants',
    amount: '1-5 ETH ($3k-15k)',
    difficulty: 'Medium',
    status: 'ready',
    url: 'https://docs.base.org/get-started/get-funded',
    applyUrl: 'https://paragraph.com/@grants.base.eth/calling-based-builders',
    priority: 5,
    descriptionEs: 'Grants retroactivos para proyectos desplegados en Base. Recompensa código enviado sobre pitches perfectos.',
    descriptionEn: 'Retroactive grants for projects deployed on Base. Rewards shipped code over perfect pitches.',
    stepsEs: [
      '1. Despliega tu proyecto en Base Mainnet (testnet aceptable para prototipos tempranos)',
      '2. Crea documentación clara: README, instrucciones de setup, demo',
      '3. Comparte tu proyecto en Twitter/X mencionando @BuildOnBase',
      '4. Publica en Farcaster con updates de tu progreso',
      '5. Llena el formulario de nominación en paragraph.com/@grants.base.eth',
      '6. Espera contacto del equipo de Base (solo contactan si eres seleccionado)',
      '7. Si te contactan, prepara W8/W9 para KYC y compliance'
    ],
    stepsEn: [
      '1. Deploy your project on Base Mainnet (testnet acceptable for early prototypes)',
      '2. Create clear documentation: README, setup instructions, demo',
      '3. Share your project on Twitter/X mentioning @BuildOnBase',
      '4. Post on Farcaster with progress updates',
      '5. Fill the nomination form at paragraph.com/@grants.base.eth',
      '6. Wait for Base team contact (they only reach out if selected)',
      '7. If contacted, prepare W8/W9 for KYC and compliance'
    ],
    tipsEs: [
      '🎯 El equipo de Base BUSCA proyectos activamente en Twitter y Farcaster - sé visible',
      '💡 "Shipped code > perfect pitches" - muestra producto funcionando, no slides',
      '🔥 Proyectos con tracción real (usuarios, transacciones) tienen prioridad',
      '⚡ Responde SOLO a mensajes de @buildonbase o cuentas seguidas por @BuildOnBase',
      '📊 Incluye métricas: usuarios, TVL, transacciones, engagement',
      '🚫 No hay formulario tradicional - es descubrimiento proactivo del equipo'
    ],
    tipsEn: [
      '🎯 Base team ACTIVELY scouts projects on Twitter and Farcaster - be visible',
      '💡 "Shipped code > perfect pitches" - show working product, not slides',
      '🔥 Projects with real traction (users, transactions) get priority',
      '⚡ Only respond to messages from @buildonbase or accounts followed by @BuildOnBase',
      '📊 Include metrics: users, TVL, transactions, engagement',
      '🚫 No traditional application form - proactive discovery by the team'
    ],
    requirementsEs: [
      'MVP o prototipo desplegado en Base',
      'Equipo pequeño (ideal para noches y fines de semana)',
      'Caso de uso claro y definido',
      'Documentación básica del proyecto'
    ],
    requirementsEn: [
      'MVP or prototype deployed on Base',
      'Small team (ideal for nights and weekends)',
      'Clear and defined use case',
      'Basic project documentation'
    ]
  },
  {
    id: 'base-weekly',
    name: 'Base Weekly Rewards',
    amount: '20 ETH/semana (top 100)',
    difficulty: 'Easy',
    status: 'ready',
    url: 'https://docs.base.org/get-started/get-funded',
    applyUrl: 'https://www.builderscore.xyz/',
    priority: 5,
    descriptionEs: '20 ETH semanales distribuidos entre los top 100 builders en Base. Basado en Builder Score de Talent Protocol.',
    descriptionEn: '20 ETH weekly distributed among top 100 builders on Base. Based on Talent Protocol Builder Score.',
    stepsEs: [
      '1. Ve a builderscore.xyz y conecta tu wallet',
      '2. Obtén un Basename (tu identidad verificada en Base) en base.org/names',
      '3. Vincula tu cuenta de GitHub a tu perfil',
      '4. Vincula tu cuenta de Farcaster',
      '5. Comienza a construir: commits en GitHub, deploy contratos, crea mini apps',
      '6. Mantén un Builder Score ≥ 40 para ser elegible',
      '7. El leaderboard se actualiza diariamente - no necesitas aplicar'
    ],
    stepsEn: [
      '1. Go to builderscore.xyz and connect your wallet',
      '2. Get a Basename (your verified identity on Base) at base.org/names',
      '3. Link your GitHub account to your profile',
      '4. Link your Farcaster account',
      '5. Start building: GitHub commits, deploy contracts, create mini apps',
      '6. Maintain a Builder Score ≥ 40 to be eligible',
      '7. Leaderboard updates daily - no application needed'
    ],
    tipsEs: [
      '🏆 Recompensas son proporcionales a tu score - más construyes, más ganas',
      '📈 Boost tu score: commits open-source, contratos desplegados, mini apps en Farcaster',
      '🔗 Basename es OBLIGATORIO para recibir rewards',
      '⏰ El programa corre hasta Sep 22, 2025 (puede extenderse)',
      '🎮 Usa la mini app de Builder Rewards en Farcaster para más puntos',
      '💡 Contribuye a repos populares del ecosistema Base para más visibilidad'
    ],
    tipsEn: [
      '🏆 Rewards are proportional to your score - more you build, more you earn',
      '📈 Boost your score: open-source commits, deployed contracts, Farcaster mini apps',
      '🔗 Basename is MANDATORY to receive rewards',
      '⏰ Program runs until Sep 22, 2025 (may extend)',
      '🎮 Use the Builder Rewards mini app on Farcaster for more points',
      '💡 Contribute to popular Base ecosystem repos for more visibility'
    ],
    requirementsEs: [
      'Basename (identidad verificada en Base)',
      'Builder Score ≥ 40',
      'Actividad verificada en GitHub y/o on-chain',
      'Wallet compatible con Base'
    ],
    requirementsEn: [
      'Basename (verified identity on Base)',
      'Builder Score ≥ 40',
      'Verified activity on GitHub and/or on-chain',
      'Base-compatible wallet'
    ],
    timeline: 'Activo hasta Sep 22, 2025'
  },
  {
    id: 'optimism-rpgf',
    name: 'Optimism RetroPGF',
    amount: '$10k-500k+',
    difficulty: 'Medium',
    status: 'ready',
    url: 'https://community.optimism.io/citizens-house/rounds/retropgf-6',
    applyUrl: 'https://atlas.optimism.io/',
    priority: 4,
    descriptionEs: 'Retroactive Public Goods Funding. Base es parte del Optimism Superchain, todos los proyectos Base son elegibles.',
    descriptionEn: 'Retroactive Public Goods Funding. Base is part of the Optimism Superchain, all Base projects are eligible.',
    stepsEs: [
      '1. Ve a atlas.optimism.io y crea tu perfil de proyecto',
      '2. Vincula tu email y cuenta de GitHub',
      '3. Verifica tu identidad con Passport (score 20+) o World ID',
      '4. Designa una wallet de gobernanza para recibir el badge de Ciudadano',
      '5. Documenta el IMPACTO de tu proyecto (métricas concretas)',
      '6. Espera el anuncio de la próxima ronda de RetroPGF',
      '7. Aplica durante el período de aplicación de la ronda'
    ],
    stepsEn: [
      '1. Go to atlas.optimism.io and create your project profile',
      '2. Link your email and GitHub account',
      '3. Verify your identity with Passport (score 20+) or World ID',
      '4. Designate a governance wallet to receive Citizen badge',
      '5. Document your project IMPACT (concrete metrics)',
      '6. Wait for the next RetroPGF round announcement',
      '7. Apply during the round application period'
    ],
    tipsEs: [
      '🌐 TODOS los proyectos Base son elegibles - Base es parte del Superchain',
      '📊 El IMPACTO es todo: documenta usuarios, transacciones, valor generado',
      '🏛️ Participa en governance de Optimism para aumentar visibilidad',
      '🔗 La misma wallet NO puede recibir múltiples badges de Ciudadano',
      '⚠️ Wallets sospechosas pueden requerir verificación adicional',
      '💡 Categorías: infraestructura, tooling, analytics, liderazgo de governance'
    ],
    tipsEn: [
      '🌐 ALL Base projects are eligible - Base is part of the Superchain',
      '📊 IMPACT is everything: document users, transactions, value generated',
      '🏛️ Participate in Optimism governance to increase visibility',
      '🔗 Same wallet can NEVER receive multiple Citizen badges',
      '⚠️ Suspicious wallets may require additional verification',
      '💡 Categories: infrastructure, tooling, analytics, governance leadership'
    ],
    requirementsEs: [
      'Proyecto que beneficie al Superchain (incluye Base)',
      'Proof of Personhood (Passport score 20+ o World ID)',
      'Impacto documentable y medible',
      'Perfil completo en Atlas'
    ],
    requirementsEn: [
      'Project benefiting the Superchain (includes Base)',
      'Proof of Personhood (Passport score 20+ or World ID)',
      'Documentable and measurable impact',
      'Complete profile on Atlas'
    ],
    timeline: 'Rondas trimestrales - próxima TBD 2025'
  },
  {
    id: 'gitcoin',
    name: 'Gitcoin Grants (GG24)',
    amount: '$1k-50k+',
    difficulty: 'Medium',
    status: 'ready',
    url: 'https://www.gitcoin.co/blog/gitcoin-grants-2025-strategy',
    applyUrl: 'https://grants.gitcoin.co/',
    priority: 4,
    descriptionEs: 'Quadratic Funding activo en GG24. 6 dominios de funding incluyendo Developer Tooling y Public Goods.',
    descriptionEn: 'Quadratic Funding active in GG24. 6 funding domains including Developer Tooling and Public Goods.',
    stepsEs: [
      '1. Ve a grants.gitcoin.co y crea tu perfil de proyecto',
      '2. Verifica tu Gitcoin Passport (score mínimo requerido)',
      '3. Elige el dominio correcto: Developer Tooling, Public Goods R&D, Privacy, etc.',
      '4. Completa tu aplicación antes del deadline (Oct 17, 2025 para GG24)',
      '5. Durante la ronda de donaciones (Oct 14-28), promueve tu proyecto',
      '6. Consigue MUCHAS donaciones pequeñas (el matching favorece cantidad sobre monto)',
      '7. Espera la distribución del matching pool'
    ],
    stepsEn: [
      '1. Go to grants.gitcoin.co and create your project profile',
      '2. Verify your Gitcoin Passport (minimum score required)',
      '3. Choose the right domain: Developer Tooling, Public Goods R&D, Privacy, etc.',
      '4. Complete your application before deadline (Oct 17, 2025 for GG24)',
      '5. During donation round (Oct 14-28), promote your project',
      '6. Get MANY small donations (matching favors quantity over amount)',
      '7. Wait for matching pool distribution'
    ],
    tipsEs: [
      '💡 100 donaciones de $1 > 1 donación de $100 (quadratic funding)',
      '🎯 Categorías GG24: Dev Tooling, Interop, Public Goods R&D, Privacy',
      '📢 Campaña de donaciones es CRÍTICA - postea diariamente durante la ronda',
      '🤝 Colabora con otros proyectos para cross-promotion',
      '⚠️ Si participas en Retro Round, NO puedes aplicar a QF OSS',
      '🔐 Gitcoin Passport verificado es obligatorio'
    ],
    tipsEn: [
      '💡 100 donations of $1 > 1 donation of $100 (quadratic funding)',
      '🎯 GG24 Categories: Dev Tooling, Interop, Public Goods R&D, Privacy',
      '📢 Donation campaign is CRITICAL - post daily during the round',
      '🤝 Collaborate with other projects for cross-promotion',
      '⚠️ If participating in Retro Round, you CANNOT apply to QF OSS',
      '🔐 Verified Gitcoin Passport is mandatory'
    ],
    requirementsEs: [
      'Proyecto open-source (para OSS rounds)',
      'Gitcoin Passport verificado',
      'Encaja en uno de los 6 dominios de GG24',
      'No participar simultáneamente en Retro + QF'
    ],
    requirementsEn: [
      'Open-source project (for OSS rounds)',
      'Verified Gitcoin Passport',
      'Fits in one of the 6 GG24 domains',
      'No simultaneous Retro + QF participation'
    ],
    timeline: 'GG24: Oct 14-28, 2025 (Applications close Oct 17)'
  },
  {
    id: 'base-batches',
    name: 'Base Batches 002',
    amount: 'Demo Day + Mentorship + Funding',
    difficulty: 'Hard',
    status: 'ready',
    url: 'https://www.basebatches.xyz/',
    applyUrl: 'https://base-batches-startup-track.devfolio.co/',
    priority: 4,
    descriptionEs: 'Programa global de Base. Startup Track para equipos con producto + Builder Track para early-stage. Demo Day en Devconnect Buenos Aires.',
    descriptionEn: 'Base global program. Startup Track for teams with product + Builder Track for early-stage. Demo Day at Devconnect Buenos Aires.',
    stepsEs: [
      '1. Decide tu track: Startup (producto live) o Builder (pre-producto)',
      '2. Ve a base-batches-startup-track.devfolio.co o builder-track',
      '3. Completa la aplicación en Devfolio antes del Oct 18, 2025',
      '4. Si eres seleccionado (notificación Nov 1), únete al programa virtual',
      '5. Startup Track: 4 semanas de mentorship + Demo Day en Buenos Aires',
      '6. Builder Track: 4 semanas de buildathon + acceso a Incubase',
      '7. Top 40 presentan ante VCs, angels y accelerators en Devconnect'
    ],
    stepsEn: [
      '1. Choose your track: Startup (live product) or Builder (pre-product)',
      '2. Go to base-batches-startup-track.devfolio.co or builder-track',
      '3. Complete application on Devfolio before Oct 18, 2025',
      '4. If selected (notification Nov 1), join the virtual program',
      '5. Startup Track: 4 weeks mentorship + Demo Day in Buenos Aires',
      '6. Builder Track: 4 weeks buildathon + Incubase access',
      '7. Top 40 present to VCs, angels and accelerators at Devconnect'
    ],
    tipsEs: [
      '🎯 Base NO toma equity ni tokens - es 100% gratuito',
      '✈️ Top teams reciben viaje cubierto para 1 persona a Buenos Aires',
      '🏆 Demo Day es ante audiencia curada de Coinbase Ventures, VCs, angels',
      '📍 Top 40 obtienen booth en Ethereum World Fair',
      '💡 Builder Track: 100 equipos entran a Incubase con mentorship virtual',
      '⚠️ Wallets screened contra listas OFAC - cumplimiento es obligatorio'
    ],
    tipsEn: [
      '🎯 Base takes NO equity or tokens - 100% free',
      '✈️ Top teams get travel covered for 1 person to Buenos Aires',
      '🏆 Demo Day is before curated audience of Coinbase Ventures, VCs, angels',
      '📍 Top 40 get booth at Ethereum World Fair',
      '💡 Builder Track: 100 teams enter Incubase with virtual mentorship',
      '⚠️ Wallets screened against OFAC lists - compliance is mandatory'
    ],
    requirementsEs: [
      'Startup Track: Producto live, equipo existente',
      'Builder Track: Idea o prototipo temprano',
      'Compromiso de construir en Base',
      'Disponibilidad para programa virtual Oct-Dec 2025'
    ],
    requirementsEn: [
      'Startup Track: Live product, existing team',
      'Builder Track: Idea or early prototype',
      'Commitment to build on Base',
      'Availability for virtual program Oct-Dec 2025'
    ],
    timeline: 'Applications: Sep 29 - Oct 18, 2025 | Program: Oct-Dec 2025'
  }
];

// ===== COMPONENTE PRINCIPAL =====
export function ApplicationGuide() {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showEnglish, setShowEnglish] = useState(false);
  const [viewAllExpanded, setViewAllExpanded] = useState(false);
  const [selectedGrant, setSelectedGrant] = useState<TopGrant | null>(null);

  const toggleSection = (id: string) => {
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const allExpanded: Record<string, boolean> = {};
    guideSections.forEach(section => {
      allExpanded[section.id] = true;
    });
    setExpandedSections(allExpanded);
    setViewAllExpanded(true);
  };

  const collapseAll = () => {
    setExpandedSections({});
    setViewAllExpanded(false);
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Header con Download y View */}
      <div className="glass-card p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
              📚 Application Guide
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Toda la información necesaria para solicitudes de grants
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowEnglish(!showEnglish)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                showEnglish
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              {showEnglish ? '🇬🇧 English' : '🇪🇸 Español'}
            </button>
            <button
              onClick={viewAllExpanded ? collapseAll : expandAll}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                viewAllExpanded
                  ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                  : 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
              }`}
            >
              {viewAllExpanded ? (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Collapse All
                </>
              ) : (
                <>
                  <ChevronRight className="w-4 h-4" />
                  View All
                </>
              )}
            </button>
            <a
              href="/GRANT_APPLICATION_GUIDE.md"
              download="CryptoGift_Grant_Application_Guide.md"
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              <Download className="w-4 h-4" />
              Download Guide
            </a>
          </div>
        </div>
      </div>

      {/* Top 5 Grants */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500" />
          Top 5 Grant Opportunities
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {topGrants.map((grant) => (
            <div
              key={grant.id}
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-gray-100">{grant.name}</h4>
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">{grant.amount}</p>
                </div>
                <div className="flex gap-1">
                  {[...Array(grant.priority)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                {showEnglish ? grant.descriptionEn : grant.descriptionEs}
              </p>
              {grant.timeline && (
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1 font-medium">
                  {grant.timeline}
                </p>
              )}
              <div className="flex items-center justify-between mt-3">
                <span className={`text-xs px-2 py-1 rounded ${
                  grant.status === 'ready' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                  grant.status === 'submitted' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                }`}>
                  {grant.status === 'ready' ? '✅ Ready' :
                   grant.status === 'submitted' ? '📤 Submitted' :
                   '⏳ Pending'}
                </span>
              </div>
              {/* Action Buttons */}
              <div className="flex gap-2 mt-3">
                <a
                  href={grant.applyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
                >
                  <ExternalLink className="w-3 h-3" />
                  Apply
                </a>
                <button
                  onClick={() => setSelectedGrant(grant)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
                >
                  <FileText className="w-3 h-3" />
                  Guide
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grant Guide Modal */}
      {selectedGrant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-t-2xl">
              <button
                onClick={() => setSelectedGrant(null)}
                className="absolute top-4 right-4 p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
              <h2 className="text-2xl font-bold text-white">{selectedGrant.name}</h2>
              <p className="text-white/80 mt-1">{selectedGrant.amount}</p>
              {selectedGrant.timeline && (
                <p className="text-sm text-yellow-300 mt-2 font-medium">{selectedGrant.timeline}</p>
              )}
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Apply Button */}
              <a
                href={selectedGrant.applyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold text-lg rounded-xl hover:opacity-90 transition-opacity shadow-lg"
              >
                <ExternalLink className="w-5 h-5" />
                {showEnglish ? 'Apply Now' : 'Aplicar Ahora'}
              </a>

              {/* Requirements */}
              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl border border-orange-200 dark:border-orange-800">
                <h3 className="font-bold text-orange-800 dark:text-orange-300 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  {showEnglish ? 'Requirements' : 'Requisitos'}
                </h3>
                <ul className="space-y-2">
                  {(showEnglish ? selectedGrant.requirementsEn : selectedGrant.requirementsEs).map((req, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-orange-700 dark:text-orange-300">
                      <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Step by Step */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
                <h3 className="font-bold text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  {showEnglish ? 'Step-by-Step Guide' : 'Guía Paso a Paso'}
                </h3>
                <ol className="space-y-3">
                  {(showEnglish ? selectedGrant.stepsEn : selectedGrant.stepsEs).map((step, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-blue-700 dark:text-blue-300">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {idx + 1}
                      </span>
                      <span className="pt-0.5">{step.replace(/^\d+\.\s*/, '')}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Tips & Tricks */}
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-200 dark:border-green-800">
                <h3 className="font-bold text-green-800 dark:text-green-300 mb-3 flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  {showEnglish ? 'Tips & Tricks' : 'Tips y Trucos'}
                </h3>
                <ul className="space-y-2">
                  {(showEnglish ? selectedGrant.tipsEn : selectedGrant.tipsEs).map((tip, idx) => (
                    <li key={idx} className="text-sm text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30 p-2 rounded-lg">
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Useful Links */}
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                  <ExternalLink className="w-5 h-5" />
                  {showEnglish ? 'Useful Links' : 'Links Útiles'}
                </h3>
                <div className="space-y-2">
                  <a
                    href={selectedGrant.applyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {showEnglish ? 'Application Page' : 'Página de Aplicación'}
                  </a>
                  <a
                    href={selectedGrant.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {showEnglish ? 'Official Documentation' : 'Documentación Oficial'}
                  </a>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setSelectedGrant(null)}
                className="w-full px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                {showEnglish ? 'Close' : 'Cerrar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Application Status */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">
          📊 Application Status
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 px-3 font-medium text-gray-600 dark:text-gray-400">Platform</th>
                <th className="text-left py-2 px-3 font-medium text-gray-600 dark:text-gray-400">Status</th>
                <th className="text-left py-2 px-3 font-medium text-gray-600 dark:text-gray-400">Date</th>
                <th className="text-left py-2 px-3 font-medium text-gray-600 dark:text-gray-400">Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <td className="py-2 px-3 font-medium">CoinGecko</td>
                <td className="py-2 px-3"><span className="px-2 py-1 bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300 rounded text-xs">⏳ Sent</span></td>
                <td className="py-2 px-3 text-gray-600 dark:text-gray-400">Dec 2025</td>
                <td className="py-2 px-3 text-gray-600 dark:text-gray-400">Waiting response</td>
              </tr>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <td className="py-2 px-3 font-medium">BaseScan</td>
                <td className="py-2 px-3"><span className="px-2 py-1 bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300 rounded text-xs">⏳ Sent</span></td>
                <td className="py-2 px-3 text-gray-600 dark:text-gray-400">Dec 2025</td>
                <td className="py-2 px-3 text-gray-600 dark:text-gray-400">Logo verification</td>
              </tr>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <td className="py-2 px-3 font-medium">Base Builder Grants</td>
                <td className="py-2 px-3"><span className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 rounded text-xs">📋 Ready</span></td>
                <td className="py-2 px-3 text-gray-600 dark:text-gray-400">-</td>
                <td className="py-2 px-3 text-gray-600 dark:text-gray-400">Ready to apply</td>
              </tr>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <td className="py-2 px-3 font-medium">Base Weekly Rewards</td>
                <td className="py-2 px-3"><span className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded text-xs">📋 Register</span></td>
                <td className="py-2 px-3 text-gray-600 dark:text-gray-400">-</td>
                <td className="py-2 px-3 text-gray-600 dark:text-gray-400">Register at Talent Protocol</td>
              </tr>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <td className="py-2 px-3 font-medium">Optimism RetroPGF</td>
                <td className="py-2 px-3"><span className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded text-xs">📋 Create Account</span></td>
                <td className="py-2 px-3 text-gray-600 dark:text-gray-400">-</td>
                <td className="py-2 px-3 text-gray-600 dark:text-gray-400">Create account on Atlas</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Sections with Copy Button */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
          📝 Application Content (Click to Expand & Copy)
        </h3>
        {guideSections.map((section) => (
          <div
            key={section.id}
            className="glass-card overflow-hidden"
          >
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg text-blue-600 dark:text-blue-400">
                  {section.icon}
                </div>
                <span className="font-medium text-gray-800 dark:text-gray-100">
                  {showEnglish ? section.titleEn : section.titleEs}
                </span>
              </div>
              {expandedSections[section.id] ? (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {expandedSections[section.id] && (
              <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-800">
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg relative">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 font-mono">
                    {showEnglish ? section.contentEn : section.contentEs}
                  </pre>
                  <button
                    onClick={() => copyToClipboard(
                      showEnglish ? section.contentEn : section.contentEs,
                      section.id
                    )}
                    className="absolute top-2 right-2 p-2 bg-white dark:bg-gray-700 rounded-lg shadow hover:shadow-md transition-shadow"
                    title="Copy to clipboard"
                  >
                    {copiedId === section.id ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
