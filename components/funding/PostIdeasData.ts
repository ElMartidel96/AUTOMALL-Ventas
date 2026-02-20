// ===== POST IDEAS DATA - CONTENIDO ÉPICO PARA REDES SOCIALES =====
// Basado en análisis profundo de CryptoGift Wallets + DAO

export interface PostIdea {
  id: string;
  content: string;
  contentEn: string;
  type: 'tweet' | 'thread' | 'poll' | 'quote' | 'announcement';
  category: 'educational' | 'emotional' | 'technical' | 'community' | 'viral' | 'cta';
  hashtags: string[];
  bestTime?: string;
  engagement?: string;
}

export interface DayContent {
  day: number;
  theme: string;
  themeEn: string;
  posts: PostIdea[];
}

// ===== 7 DÍAS DE CONTENIDO TWITTER - 30+ POSTS =====
export const twitterWeeklyContent: DayContent[] = [
  // ===== DÍA 1: INTRODUCCIÓN ÉPICA =====
  {
    day: 1,
    theme: 'La Gran Revelación',
    themeEn: 'The Big Reveal',
    posts: [
      {
        id: 'd1-1',
        content: `🎁 Imagina esto:

Tu amigo que "no entiende crypto" abre un mensaje tuyo y descubre:

• Una obra de arte única con la foto de su primer viaje juntos
• Que ESA imagen es una wallet real
• Con $50 en cripto adentro

Su primera wallet. Su primer portafolio. Zero complicaciones.

Eso es CryptoGift 🔮`,
        contentEn: `🎁 Imagine this:

Your friend who "doesn't get crypto" opens a message from you and discovers:

• A unique artwork with your first trip photo together
• That image IS a real wallet
• With $50 in crypto inside

Their first wallet. Their first portfolio. Zero complications.

That's CryptoGift 🔮`,
        type: 'tweet',
        category: 'emotional',
        hashtags: ['Web3', 'CryptoGifting', 'ERC6551', 'Base'],
        bestTime: '9:00 AM',
        engagement: 'Hook emocional - genera curiosidad'
      },
      {
        id: 'd1-2',
        content: `¿Por qué el 99% de la gente NO entra a crypto?

❌ "No sé por dónde empezar"
❌ "Los fees me comen vivo"
❌ "¿Y si pierdo la clave?"
❌ "Es muy complicado"

¿Y si el onboarding fuera... un regalo?

Un NFT que ES tu wallet.
Gas = $0.
Un botón para todo.

Eso construimos en @cryptogiftdao 🎁`,
        contentEn: `Why do 99% of people NOT enter crypto?

❌ "I don't know where to start"
❌ "Fees eat me alive"
❌ "What if I lose the key?"
❌ "It's too complicated"

What if onboarding was... a gift?

An NFT that IS your wallet.
Gas = $0.
One button for everything.

That's what we build at @cryptogiftdao 🎁`,
        type: 'tweet',
        category: 'educational',
        hashtags: ['CryptoAdoption', 'Web3Onboarding', 'GaslessTransactions'],
        bestTime: '12:00 PM'
      },
      {
        id: 'd1-3',
        content: `gm builders 🌅

Hoy quiero presentarles lo que construimos:

CryptoGift Wallets - donde cada regalo se vuelve capital, y cada capital se vuelve historia.

NFT-wallets con ERC-6551 + Account Abstraction + Gobernanza DAO.

El onboarding más humano a crypto.

¿Quién está listo? 👇`,
        contentEn: `gm builders 🌅

Today I want to introduce what we've built:

CryptoGift Wallets - where every gift becomes capital, and every capital becomes a story.

NFT-wallets with ERC-6551 + Account Abstraction + DAO Governance.

The most human crypto onboarding.

Who's ready? 👇`,
        type: 'tweet',
        category: 'community',
        hashtags: ['gm', 'BuildInPublic', 'Base', 'DAO'],
        bestTime: '7:00 AM'
      },
      {
        id: 'd1-4',
        content: `📊 Dato del día:

Según estudios, el 73% de personas que NO están en crypto dicen que es "demasiado complicado".

Pero el 89% de esas mismas personas HAN regalado dinero alguna vez.

¿Y si el regalo fuera la puerta de entrada?

Conectar emociones + tecnología = adopción real 🎁`,
        contentEn: `📊 Fact of the day:

Studies show 73% of people NOT in crypto say it's "too complicated".

But 89% of those same people HAVE gifted money before.

What if the gift was the gateway?

Connecting emotions + technology = real adoption 🎁`,
        type: 'tweet',
        category: 'educational',
        hashtags: ['CryptoAdoption', 'Web3', 'Statistics'],
        bestTime: '3:00 PM'
      },
      {
        id: 'd1-5',
        content: `🧵 THREAD: ¿Qué es ERC-6551 y por qué cambia TODO?

1/ Antes: Tu NFT era solo una imagen.
Ahora: Tu NFT ES una wallet completa.

Puede tener tokens, otros NFTs, ejecutar transacciones.

Es como si tu foto de perfil pudiera guardar dinero 🤯`,
        contentEn: `🧵 THREAD: What is ERC-6551 and why does it change EVERYTHING?

1/ Before: Your NFT was just an image.
Now: Your NFT IS a complete wallet.

It can hold tokens, other NFTs, execute transactions.

It's like your profile pic could store money 🤯`,
        type: 'thread',
        category: 'technical',
        hashtags: ['ERC6551', 'TokenBoundAccounts', 'Web3Education'],
        bestTime: '11:00 AM'
      }
    ]
  },

  // ===== DÍA 2: PROBLEMA/SOLUCIÓN =====
  {
    day: 2,
    theme: 'Las 3 Brechas del Mercado',
    themeEn: 'The 3 Market Gaps',
    posts: [
      {
        id: 'd2-1',
        content: `La brecha emocional del crypto:

La mayoría de entradas al mundo cripto son frías:
• Un tutorial
• Un QR code
• Un exchange intimidante

Pero la adopción REAL sucede cuando hay VÍNCULO.

Un regalo significativo convierte curiosidad en confianza.

Esa es nuestra misión 💜`,
        contentEn: `The emotional gap in crypto:

Most crypto on-ramps are cold:
• A tutorial
• A QR code
• An intimidating exchange

But REAL adoption happens when there's CONNECTION.

A meaningful gift turns curiosity into trust.

That's our mission 💜`,
        type: 'tweet',
        category: 'emotional',
        hashtags: ['CryptoAdoption', 'Web3', 'Emotions'],
        bestTime: '9:00 AM'
      },
      {
        id: 'd2-2',
        content: `Hot take 🔥

Las "crypto gift cards" tradicionales son un SCAM:

❌ Caducan
❌ Dependen de un exchange
❌ Fees escondidos
❌ Cero transparencia

Nosotros:
✅ Nunca expira
✅ On-chain, auditable
✅ Zero fees
✅ TÚ controlas las llaves

No es lo mismo. No se compara.`,
        contentEn: `Hot take 🔥

Traditional "crypto gift cards" are a SCAM:

❌ They expire
❌ Depend on an exchange
❌ Hidden fees
❌ Zero transparency

Us:
✅ Never expires
✅ On-chain, auditable
✅ Zero fees
✅ YOU control the keys

Not the same. No comparison.`,
        type: 'tweet',
        category: 'viral',
        hashtags: ['HotTake', 'CryptoGifts', 'NotYourKeysNotYourCrypto'],
        bestTime: '2:00 PM'
      },
      {
        id: 'd2-3',
        content: `¿Cuál es tu mayor barrera para traer amigos a crypto?

🔹 Es muy complicado explicar
🔹 Los fees los asustan
🔹 Miedo a perder dinero
🔹 No les interesa`,
        contentEn: `What's your biggest barrier to bringing friends to crypto?

🔹 Too complicated to explain
🔹 Fees scare them off
🔹 Fear of losing money
🔹 They're not interested`,
        type: 'poll',
        category: 'community',
        hashtags: ['CryptoCommunity', 'Web3Adoption'],
        bestTime: '12:00 PM'
      },
      {
        id: 'd2-4',
        content: `El problema con onboardear a alguien a crypto:

1. "Descarga esta app"
2. "Verifica tu identidad"
3. "Deposita dinero"
4. "Compra ETH"
5. "Paga gas"
6. "Crea una wallet"
7. "Guarda tu seed phrase"
8. ...

Con CryptoGift:

1. Recibe un NFT
2. Ya tienes crypto

Fin. 🎁`,
        contentEn: `The problem with onboarding someone to crypto:

1. "Download this app"
2. "Verify your identity"
3. "Deposit money"
4. "Buy ETH"
5. "Pay gas"
6. "Create a wallet"
7. "Save your seed phrase"
8. ...

With CryptoGift:

1. Receive an NFT
2. You have crypto

Done. 🎁`,
        type: 'tweet',
        category: 'viral',
        hashtags: ['UX', 'Web3', 'Simplicity'],
        bestTime: '5:00 PM'
      },
      {
        id: 'd2-5',
        content: `"¿Y si baja la cripto?"

La pregunta más común de quien recibe su primer regalo crypto.

Nuestra solución: Un botón.

Cambiar a stablecoin con UN CLIC dentro de la misma wallet.

Sin exchanges.
Sin transferencias.
Sin complicaciones.

Libertad financiera real 💪`,
        contentEn: `"What if the crypto drops?"

The most common question from first-time crypto gift receivers.

Our solution: One button.

Switch to stablecoin with ONE CLICK inside the same wallet.

No exchanges.
No transfers.
No complications.

Real financial freedom 💪`,
        type: 'tweet',
        category: 'educational',
        hashtags: ['Stablecoins', 'CryptoUX', 'DeFi'],
        bestTime: '10:00 AM'
      }
    ]
  },

  // ===== DÍA 3: TECNOLOGÍA REVOLUCIONARIA =====
  {
    day: 3,
    theme: 'La Magia Técnica',
    themeEn: 'The Technical Magic',
    posts: [
      {
        id: 'd3-1',
        content: `🧵 Cómo funciona la magia detrás de CryptoGift:

1/ ERC-721 + ERC-6551 = TBA (Token-Bound Account)

El NFT literalmente ES la cuenta.

No es que "representa" una wallet.
El NFT TIENE la wallet integrada.

Breakthrough tecnológico nivel 🔥🔥🔥`,
        contentEn: `🧵 How the magic behind CryptoGift works:

1/ ERC-721 + ERC-6551 = TBA (Token-Bound Account)

The NFT literally IS the account.

It doesn't "represent" a wallet.
The NFT HAS the wallet built-in.

Technological breakthrough level 🔥🔥🔥`,
        type: 'thread',
        category: 'technical',
        hashtags: ['ERC6551', 'TBA', 'SmartContracts'],
        bestTime: '11:00 AM'
      },
      {
        id: 'd3-2',
        content: `Gas = $0 en CryptoGift

¿Cómo?

Account Abstraction + Paymaster.

Nosotros pagamos el gas por ti.
Tú solo disfrutas la experiencia.

Web3 debería sentirse como Web2.
Sin fricción. Sin sorpresas.

Eso es UX de verdad ✨`,
        contentEn: `Gas = $0 on CryptoGift

How?

Account Abstraction + Paymaster.

We pay the gas for you.
You just enjoy the experience.

Web3 should feel like Web2.
No friction. No surprises.

That's real UX ✨`,
        type: 'tweet',
        category: 'technical',
        hashtags: ['AccountAbstraction', 'Gasless', 'Web3UX'],
        bestTime: '9:00 AM'
      },
      {
        id: 'd3-3',
        content: `¿Por qué construimos en @base?

⚡ Transacciones rápidas
💰 Fees mínimos (~$0.001)
🔒 Seguridad de Ethereum
🌐 Ecosistema en crecimiento
🏗️ Mejor experiencia de desarrollo

Base es el futuro de las aplicaciones mainstream.

Y nosotros estamos aquí desde el principio 🔵`,
        contentEn: `Why do we build on @base?

⚡ Fast transactions
💰 Minimal fees (~$0.001)
🔒 Ethereum security
🌐 Growing ecosystem
🏗️ Best dev experience

Base is the future of mainstream apps.

And we're here from the beginning 🔵`,
        type: 'tweet',
        category: 'technical',
        hashtags: ['Base', 'Layer2', 'Ethereum', 'OnchainSummer'],
        bestTime: '1:00 PM'
      },
      {
        id: 'd3-4',
        content: `Zero custodia. Zero intermediarios.

En CryptoGift, tus fondos NUNCA pasan por nuestras manos.

Todo vive en contratos auditados.
Todo es verificable on-chain.
Todo es tuyo desde el segundo 1.

Not your keys, not your crypto?

Con nosotros: SIEMPRE tus keys 🔐`,
        contentEn: `Zero custody. Zero intermediaries.

On CryptoGift, your funds NEVER touch our hands.

Everything lives in audited contracts.
Everything is verifiable on-chain.
Everything is yours from second 1.

Not your keys, not your crypto?

With us: ALWAYS your keys 🔐`,
        type: 'tweet',
        category: 'technical',
        hashtags: ['SelfCustody', 'DeFi', 'Security'],
        bestTime: '4:00 PM'
      },
      {
        id: 'd3-5',
        content: `🛠️ Stack técnico CryptoGift:

• ERC-6551 Token Bound Accounts
• Account Abstraction (Biconomy)
• Base L2
• Next.js 15 + React 18
• IPFS almacenamiento descentralizado
• Aragon OSx para gobernanza

100% production ready.
100% open source philosophy.
100% cutting edge.`,
        contentEn: `🛠️ CryptoGift tech stack:

• ERC-6551 Token Bound Accounts
• Account Abstraction (Biconomy)
• Base L2
• Next.js 15 + React 18
• IPFS decentralized storage
• Aragon OSx for governance

100% production ready.
100% open source philosophy.
100% cutting edge.`,
        type: 'tweet',
        category: 'technical',
        hashtags: ['TechStack', 'Web3Dev', 'BuildInPublic'],
        bestTime: '3:00 PM'
      }
    ]
  },

  // ===== DÍA 4: CASOS DE USO =====
  {
    day: 4,
    theme: 'Casos de Uso Reales',
    themeEn: 'Real Use Cases',
    posts: [
      {
        id: 'd4-1',
        content: `🎂 Regalo de cumpleaños 2.0:

Antes: Tarjeta de $50 de Amazon que probablemente no usen.

Ahora: NFT personalizado con la foto favorita de ustedes que contiene $50 en crypto.

Su primer portafolio.
Su primera wallet.
Un regalo que puede crecer.

El futuro de los regalos 🎁`,
        contentEn: `🎂 Birthday gift 2.0:

Before: $50 Amazon card they'll probably never use.

Now: Personalized NFT with your favorite photo together containing $50 in crypto.

Their first portfolio.
Their first wallet.
A gift that can grow.

The future of gifting 🎁`,
        type: 'tweet',
        category: 'emotional',
        hashtags: ['Birthday', 'CryptoGifts', 'NFTs'],
        bestTime: '10:00 AM'
      },
      {
        id: 'd4-2',
        content: `💼 Para empresas:

Imagina:
• Loyalty program donde cada punto es crypto real
• Gifts para clientes VIP con NFT-wallets de tu marca
• Onboarding de empleados con su primera wallet

Todo medible. Todo on-chain. Todo sin fricción.

Paquetes corporativos disponibles 🏢`,
        contentEn: `💼 For businesses:

Imagine:
• Loyalty program where every point is real crypto
• VIP client gifts with branded NFT-wallets
• Employee onboarding with their first wallet

All measurable. All on-chain. All frictionless.

Corporate packages available 🏢`,
        type: 'tweet',
        category: 'cta',
        hashtags: ['B2B', 'LoyaltyPrograms', 'CorporateCrypto'],
        bestTime: '9:00 AM'
      },
      {
        id: 'd4-3',
        content: `🎓 Academy by CryptoGift:

El regalo se libera cuando completas el aprendizaje.

• Módulos educativos personalizables
• Quizzes interactivos
• Certificados on-chain
• Progreso medible

Perfecto para:
• ONGs educando comunidades
• Marcas onboardeando usuarios
• Universidades enseñando blockchain

Learn to earn. Literally. 📚`,
        contentEn: `🎓 Academy by CryptoGift:

The gift unlocks when you complete learning.

• Customizable educational modules
• Interactive quizzes
• On-chain certificates
• Measurable progress

Perfect for:
• NGOs educating communities
• Brands onboarding users
• Universities teaching blockchain

Learn to earn. Literally. 📚`,
        type: 'tweet',
        category: 'educational',
        hashtags: ['LearnToEarn', 'Web3Education', 'Academy'],
        bestTime: '2:00 PM'
      },
      {
        id: 'd4-4',
        content: `💒 Bodas Web3:

En vez de sobres con dinero:

NFT-wallets para los novios con contribuciones de todos los invitados.

Cada regalo queda registrado.
Los novios tienen su primera wallet compartida.
La foto del regalo? La de la boda.

El futuro ya llegó 👰🤵`,
        contentEn: `💒 Web3 Weddings:

Instead of money envelopes:

NFT-wallets for the newlyweds with contributions from all guests.

Every gift is recorded.
The couple has their first shared wallet.
The gift photo? The wedding one.

The future is here 👰🤵`,
        type: 'tweet',
        category: 'viral',
        hashtags: ['WeddingGifts', 'Web3Weddings', 'CryptoInnovation'],
        bestTime: '12:00 PM'
      },
      {
        id: 'd4-5',
        content: `🌍 Para ONGs y causas sociales:

• Donaciones transparentes (cada peso rastreable)
• Becas crypto para estudiantes
• Programas de microcréditos descentralizados
• Rewards por voluntariado

Todo auditable. Todo on-chain. Todo con impacto real.

Blockchain para el bien 💚`,
        contentEn: `🌍 For NGOs and social causes:

• Transparent donations (every dollar traceable)
• Crypto scholarships for students
• Decentralized microloan programs
• Volunteer rewards

All auditable. All on-chain. All with real impact.

Blockchain for good 💚`,
        type: 'tweet',
        category: 'emotional',
        hashtags: ['BlockchainForGood', 'SocialImpact', 'NGO'],
        bestTime: '5:00 PM'
      }
    ]
  },

  // ===== DÍA 5: COMUNIDAD Y DAO =====
  {
    day: 5,
    theme: 'Gobernanza y Comunidad',
    themeEn: 'Governance and Community',
    posts: [
      {
        id: 'd5-1',
        content: `🏛️ CryptoGift Wallets DAO

No solo construimos productos.
Construimos comunidad.

Token CGC:
• Participa en decisiones
• Propón mejoras
• Gana por contribuir
• Gobierna el protocolo

De usuarios a owners.
De consumidores a constructores.

Únete: discord.gg/XzmKkrvhHc 💜`,
        contentEn: `🏛️ CryptoGift Wallets DAO

We don't just build products.
We build community.

CGC Token:
• Participate in decisions
• Propose improvements
• Earn for contributing
• Govern the protocol

From users to owners.
From consumers to builders.

Join: discord.gg/XzmKkrvhHc 💜`,
        type: 'tweet',
        category: 'community',
        hashtags: ['DAO', 'Governance', 'Web3Community'],
        bestTime: '9:00 AM'
      },
      {
        id: 'd5-2',
        content: `¿Por qué importa la gobernanza descentralizada?

En Web2: La empresa decide, tú obedeces.
En Web3: La comunidad decide, todos construyen.

En @cryptogiftdao:
• Tú votas el roadmap
• Tú propones features
• Tú recibes rewards por contribuir

Tu voz importa. Literalmente 🗳️`,
        contentEn: `Why does decentralized governance matter?

In Web2: The company decides, you obey.
In Web3: The community decides, everyone builds.

At @cryptogiftdao:
• You vote on the roadmap
• You propose features
• You get rewards for contributing

Your voice matters. Literally 🗳️`,
        type: 'tweet',
        category: 'educational',
        hashtags: ['DAO', 'Decentralization', 'Web3'],
        bestTime: '11:00 AM'
      },
      {
        id: 'd5-3',
        content: `Cada regalo crea una micro-comunidad.

Con CryptoGift, cada campaña puede nacer con:
• Token de gobernanza
• Tesorería propia
• Panel de votación (Aragon)

Imagina: El club de fans de tu marca favorita votando qué producto lanzar.

DAOs everywhere 🌐`,
        contentEn: `Every gift creates a micro-community.

With CryptoGift, each campaign can be born with:
• Governance token
• Own treasury
• Voting panel (Aragon)

Imagine: Your favorite brand's fan club voting on which product to launch.

DAOs everywhere 🌐`,
        type: 'tweet',
        category: 'technical',
        hashtags: ['MicroDAOs', 'CommunityGovernance', 'Aragon'],
        bestTime: '2:00 PM'
      },
      {
        id: 'd5-4',
        content: `🎯 Sistema de referidos CryptoGift DAO:

Invita → Gana → Repite

• Nivel 1: 10% comisión
• Nivel 2: 5% comisión
• Nivel 3: 2.5% comisión

+ Bonus por milestones:
5 refs = 50 CGC
10 refs = 150 CGC
25 refs = 500 CGC

Crecemos juntos 📈`,
        contentEn: `🎯 CryptoGift DAO referral system:

Invite → Earn → Repeat

• Level 1: 10% commission
• Level 2: 5% commission
• Level 3: 2.5% commission

+ Milestone bonuses:
5 refs = 50 CGC
10 refs = 150 CGC
25 refs = 500 CGC

We grow together 📈`,
        type: 'tweet',
        category: 'cta',
        hashtags: ['Referrals', 'EarnCrypto', 'CGC'],
        bestTime: '4:00 PM'
      },
      {
        id: 'd5-5',
        content: `El efecto red de los regalos:

Tu amigo recibe un gift.
Le encanta.
Regala a su círculo.
Ellos regalan al suyo.

Cada regalo es una invitación viral.
Cada nuevo holder, un potencial embajador.

Adopción orgánica powered by human connection 🔄💜`,
        contentEn: `The gift network effect:

Your friend receives a gift.
They love it.
They gift to their circle.
They gift to theirs.

Every gift is a viral invitation.
Every new holder, a potential ambassador.

Organic adoption powered by human connection 🔄💜`,
        type: 'tweet',
        category: 'viral',
        hashtags: ['NetworkEffect', 'ViralGrowth', 'Adoption'],
        bestTime: '6:00 PM'
      }
    ]
  },

  // ===== DÍA 6: EDUCACIÓN PROFUNDA =====
  {
    day: 6,
    theme: 'Deep Dive Educativo',
    themeEn: 'Educational Deep Dive',
    posts: [
      {
        id: 'd6-1',
        content: `🧵 MEGA THREAD: De $0 a tu primera wallet en 2 minutos

1/ Alguien te envía un link.
2/ Abres y ves un NFT hermoso.
3/ Ese NFT YA ES tu wallet.
4/ Ya tienes crypto adentro.
5/ Puedes retirar, cambiar, o holdear.

Sin exchanges.
Sin seed phrases.
Sin complicaciones.

Así de simple 🎁`,
        contentEn: `🧵 MEGA THREAD: From $0 to your first wallet in 2 minutes

1/ Someone sends you a link.
2/ You open it and see a beautiful NFT.
3/ That NFT IS your wallet.
4/ You already have crypto inside.
5/ You can withdraw, swap, or hold.

No exchanges.
No seed phrases.
No complications.

That simple 🎁`,
        type: 'thread',
        category: 'educational',
        hashtags: ['Web3Tutorial', 'CryptoForBeginners', 'EasyOnboarding'],
        bestTime: '10:00 AM'
      },
      {
        id: 'd6-2',
        content: `FAQ del día:

"¿Qué pasa si pierdo acceso a mi NFT-wallet?"

Recuperación social con guardianes.

Designas personas de confianza.
Si pierdes acceso, ellos pueden ayudarte a recuperar.

Sin seed phrases que guardar.
Sin miedo a perder todo.

Seguridad user-friendly 🔒`,
        contentEn: `FAQ of the day:

"What if I lose access to my NFT-wallet?"

Social recovery with guardians.

You designate trusted people.
If you lose access, they can help you recover.

No seed phrases to store.
No fear of losing everything.

User-friendly security 🔒`,
        type: 'tweet',
        category: 'educational',
        hashtags: ['SocialRecovery', 'CryptoSecurity', 'FAQ'],
        bestTime: '9:00 AM'
      },
      {
        id: 'd6-3',
        content: `El mejor regalo no es el objeto.
Es la puerta que abre.

Regalar dinero siempre fue un acto de confianza.
Regalar libertad financiera lo eleva a un pacto de futuro.

CryptoGift convierte ese acto en una experiencia:
• Artística
• Segura
• Sin fricción

Welcome to the future 🚀`,
        contentEn: `The best gift isn't the object.
It's the door it opens.

Gifting money has always been an act of trust.
Gifting financial freedom elevates it to a pact with the future.

CryptoGift turns that act into an experience:
• Artistic
• Secure
• Frictionless

Welcome to the future 🚀`,
        type: 'tweet',
        category: 'emotional',
        hashtags: ['Philosophy', 'FutureOfGifting', 'Web3'],
        bestTime: '8:00 PM'
      },
      {
        id: 'd6-4',
        content: `¿Sabías que...?

El 89% de las personas han regalado dinero alguna vez.

Pero solo el 3% de la población mundial tiene crypto.

El gifting es el puente perfecto entre ambos mundos.

Por eso existe CryptoGift:
Conectamos lo que la gente YA hace con lo que PUEDE hacer 🌉`,
        contentEn: `Did you know...?

89% of people have gifted money at some point.

But only 3% of the world's population has crypto.

Gifting is the perfect bridge between both worlds.

That's why CryptoGift exists:
We connect what people ALREADY do with what they CAN do 🌉`,
        type: 'tweet',
        category: 'educational',
        hashtags: ['Statistics', 'Adoption', 'Bridge'],
        bestTime: '1:00 PM'
      },
      {
        id: 'd6-5',
        content: `Transparencia radical = Confianza

Dashboard público de CryptoGift:
• Reservas on-chain verificables
• Gasto de gas patrocinado visible
• Auditorías en vivo
• Código abierto

No hay cajas negras.
No hay letra pequeña.
Todo está en la blockchain.

Así se construye confianza en 2025 🔍`,
        contentEn: `Radical transparency = Trust

CryptoGift public dashboard:
• Verifiable on-chain reserves
• Visible sponsored gas spending
• Live audits
• Open source code

No black boxes.
No fine print.
Everything's on the blockchain.

That's how you build trust in 2025 🔍`,
        type: 'tweet',
        category: 'technical',
        hashtags: ['Transparency', 'OpenSource', 'Trust'],
        bestTime: '3:00 PM'
      }
    ]
  },

  // ===== DÍA 7: CALL TO ACTION =====
  {
    day: 7,
    theme: 'Únete al Movimiento',
    themeEn: 'Join the Movement',
    posts: [
      {
        id: 'd7-1',
        content: `Una semana compartiendo nuestra visión.

Ahora te toca a ti:

🎁 Prueba la plataforma: mbxarts.com
💬 Únete a Discord: discord.gg/XzmKkrvhHc
🐦 Síguenos para updates
🗳️ Participa en el DAO

El futuro de los regalos se construye juntos.

¿Estás listo? 🚀`,
        contentEn: `A week sharing our vision.

Now it's your turn:

🎁 Try the platform: mbxarts.com
💬 Join Discord: discord.gg/XzmKkrvhHc
🐦 Follow for updates
🗳️ Participate in the DAO

The future of gifting is built together.

Are you ready? 🚀`,
        type: 'tweet',
        category: 'cta',
        hashtags: ['JoinUs', 'CryptoGift', 'Web3Community'],
        bestTime: '12:00 PM'
      },
      {
        id: 'd7-2',
        content: `🎁 CHALLENGE: Regala crypto esta semana

1. Piensa en alguien que NO tiene crypto
2. Crea un NFT-wallet para ellos
3. Ponle algo de valor (aunque sean $5)
4. Envíaselo con un mensaje personal

Taguéanos y cuéntanos la historia.

Los mejores ganarán CGC tokens 💜

#CryptoGiftChallenge`,
        contentEn: `🎁 CHALLENGE: Gift crypto this week

1. Think of someone who DOESN'T have crypto
2. Create an NFT-wallet for them
3. Add some value (even $5)
4. Send it with a personal message

Tag us and tell us the story.

Best ones win CGC tokens 💜

#CryptoGiftChallenge`,
        type: 'tweet',
        category: 'community',
        hashtags: ['CryptoGiftChallenge', 'Web3Challenge', 'Giveaway'],
        bestTime: '10:00 AM'
      },
      {
        id: 'd7-3',
        content: `Resumen de la semana:

✅ NFT que ES wallet (ERC-6551)
✅ Gas = $0 (Account Abstraction)
✅ Zero custodia
✅ Academy educativa
✅ DAO con token CGC
✅ Campañas masivas 1155-TBA
✅ Base L2

Todo production ready.
Todo esperándote.

La próxima semana: más alpha 👀`,
        contentEn: `Week summary:

✅ NFT that IS wallet (ERC-6551)
✅ Gas = $0 (Account Abstraction)
✅ Zero custody
✅ Educational Academy
✅ DAO with CGC token
✅ Mass campaigns 1155-TBA
✅ Base L2

All production ready.
All waiting for you.

Next week: more alpha 👀`,
        type: 'tweet',
        category: 'educational',
        hashtags: ['WeekInReview', 'CryptoGift', 'BuildInPublic'],
        bestTime: '6:00 PM'
      },
      {
        id: 'd7-4',
        content: `Si te gustó esta semana de contenido:

❤️ Like para que llegue a más personas
🔄 RT tu tweet favorito
💬 Comenta qué tema quieres que profundicemos
👥 Invita a un amigo que debería conocernos

Cada interacción nos acerca a más personas que podrían beneficiarse.

Gracias por estar aquí 🙏`,
        contentEn: `If you liked this week's content:

❤️ Like so it reaches more people
🔄 RT your favorite tweet
💬 Comment what topic you want us to dive into
👥 Invite a friend who should know about us

Every interaction brings us closer to more people who could benefit.

Thanks for being here 🙏`,
        type: 'tweet',
        category: 'cta',
        hashtags: ['ThankYou', 'Community', 'Growth'],
        bestTime: '8:00 PM'
      },
      {
        id: 'd7-5',
        content: `gn builders 🌙

Esta semana aprendimos que:

El mejor onboarding a crypto no es un tutorial.
Es un regalo.

El mejor wallet no es una app.
Es un NFT.

La mejor comunidad no se consume.
Se construye.

Nos vemos mañana con más 🔥

gn 💜`,
        contentEn: `gn builders 🌙

This week we learned that:

The best crypto onboarding isn't a tutorial.
It's a gift.

The best wallet isn't an app.
It's an NFT.

The best community isn't consumed.
It's built.

See you tomorrow with more 🔥

gn 💜`,
        type: 'tweet',
        category: 'community',
        hashtags: ['gn', 'BuildInPublic', 'Web3'],
        bestTime: '11:00 PM'
      }
    ]
  }
];

// ===== CONTENIDO DISCORD =====
export interface DiscordContent {
  category: string;
  categoryEn: string;
  posts: {
    title: string;
    titleEn: string;
    content: string;
    contentEn: string;
    channel: string;
  }[];
}

export const discordContent: DiscordContent[] = [
  {
    category: 'Mensajes de Bienvenida',
    categoryEn: 'Welcome Messages',
    posts: [
      {
        title: 'Bienvenida Principal',
        titleEn: 'Main Welcome',
        channel: '#bienvenida-y-reglas',
        content: `# 🎁 Bienvenido a CryptoGift Wallets DAO

**Donde cada regalo se vuelve capital, y cada capital se vuelve historia.**

## ¿Qué hacemos?
Construimos la forma más humana de entrar a crypto: a través de regalos.

Un NFT que es una wallet real. Con crypto real. Sin complicaciones.

## ¿Por qué importa?
- 🚫 Sin exchanges intimidantes
- 🚫 Sin seed phrases que guardar
- 🚫 Sin fees de gas
- ✅ Solo un regalo que abre puertas

## Primeros pasos:
1. Lee las reglas en este canal
2. Ve a #verificacion para obtener tu rol
3. Preséntate en #presentaciones
4. Explora y participa!

**Links importantes:**
🌐 Web: https://mbxarts.com
📄 Docs: https://mbxarts.com/docs
🐦 Twitter: @cryptogiftdao

¡Bienvenido a la familia! 💜`,
        contentEn: `# 🎁 Welcome to CryptoGift Wallets DAO

**Where every gift becomes capital, and every capital becomes a story.**

## What do we do?
We build the most human way to enter crypto: through gifts.

An NFT that is a real wallet. With real crypto. No complications.

## Why does it matter?
- 🚫 No intimidating exchanges
- 🚫 No seed phrases to save
- 🚫 No gas fees
- ✅ Just a gift that opens doors

## First steps:
1. Read the rules in this channel
2. Go to #verification to get your role
3. Introduce yourself in #introductions
4. Explore and participate!

**Important links:**
🌐 Web: https://mbxarts.com
📄 Docs: https://mbxarts.com/docs
🐦 Twitter: @cryptogiftdao

Welcome to the family! 💜`
      }
    ]
  },
  {
    category: 'Anuncios Semanales',
    categoryEn: 'Weekly Announcements',
    posts: [
      {
        title: 'Anuncio Semanal Template',
        titleEn: 'Weekly Announcement Template',
        channel: '#anuncios',
        content: `# 📢 Update Semanal - [FECHA]

## 🔥 Lo más importante esta semana:

### Desarrollo
- ✅ [Logro 1]
- ✅ [Logro 2]
- 🔄 [En progreso]

### Comunidad
- 📈 [Métrica de crecimiento]
- 🎉 [Evento/celebración]

### Próximamente
- 👀 [Preview 1]
- 👀 [Preview 2]

## 🗳️ Votación activa
[Link a propuesta si aplica]

## 💬 Tu opinión importa
¿Qué te gustaría ver la próxima semana? Comenta abajo 👇

---
*Síguenos en Twitter para updates diarios: @cryptogiftdao*`,
        contentEn: `# 📢 Weekly Update - [DATE]

## 🔥 Most important this week:

### Development
- ✅ [Achievement 1]
- ✅ [Achievement 2]
- 🔄 [In progress]

### Community
- 📈 [Growth metric]
- 🎉 [Event/celebration]

### Coming Soon
- 👀 [Preview 1]
- 👀 [Preview 2]

## 🗳️ Active Vote
[Link to proposal if applicable]

## 💬 Your opinion matters
What would you like to see next week? Comment below 👇

---
*Follow us on Twitter for daily updates: @cryptogiftdao*`
      },
      {
        title: 'GM Diario',
        titleEn: 'Daily GM',
        channel: '#general',
        content: `☀️ **gm CryptoGift fam!**

Día [X] construyendo el futuro de los regalos crypto.

💡 **Tip del día:** [Consejo útil sobre crypto/web3]

🎯 **Objetivo del día:** [Meta de la comunidad]

¿Cómo empiezas tu día? ☕`,
        contentEn: `☀️ **gm CryptoGift fam!**

Day [X] building the future of crypto gifts.

💡 **Tip of the day:** [Useful crypto/web3 tip]

🎯 **Goal of the day:** [Community goal]

How are you starting your day? ☕`
      }
    ]
  },
  {
    category: 'Engagement Posts',
    categoryEn: 'Engagement Posts',
    posts: [
      {
        title: 'Pregunta de la Semana',
        titleEn: 'Question of the Week',
        channel: '#discusion-general',
        content: `# 🤔 Pregunta de la Semana

**¿Cuál fue tu primer contacto con crypto?**

A) Un amigo me lo explicó
B) Vi un video/artículo online
C) Invertí sin saber mucho
D) Todavía estoy aprendiendo

Comenta tu historia! Las mejores respuestas ganarán CGC 🎁`,
        contentEn: `# 🤔 Question of the Week

**What was your first contact with crypto?**

A) A friend explained it to me
B) I saw a video/article online
C) I invested without knowing much
D) I'm still learning

Share your story! Best answers win CGC 🎁`
      },
      {
        title: 'Celebración de Milestone',
        titleEn: 'Milestone Celebration',
        channel: '#anuncios',
        content: `# 🎉 ¡MILESTONE ALCANZADO!

## [NÚMERO] [MÉTRICA]!

Gracias a cada uno de ustedes por ser parte de esto.

Cada miembro, cada conversación, cada idea nos acerca más a nuestro objetivo:

**Hacer que el onboarding a crypto sea tan simple como recibir un regalo.**

Para celebrar: [RECOMPENSA/ACTIVIDAD]

¡Vamos por el siguiente milestone! 🚀`,
        contentEn: `# 🎉 MILESTONE REACHED!

## [NUMBER] [METRIC]!

Thanks to each of you for being part of this.

Every member, every conversation, every idea brings us closer to our goal:

**Making crypto onboarding as simple as receiving a gift.**

To celebrate: [REWARD/ACTIVITY]

Let's go for the next milestone! 🚀`
      }
    ]
  },
  {
    category: 'Educación',
    categoryEn: 'Education',
    posts: [
      {
        title: 'ERC-6551 Explicado',
        titleEn: 'ERC-6551 Explained',
        channel: '#aprende-web3',
        content: `# 📚 ERC-6551: El estándar que cambia todo

## ¿Qué es?
ERC-6551 permite que cualquier NFT tenga su propia wallet integrada.

## ¿Por qué importa?
Antes: NFT = imagen bonita
Ahora: NFT = wallet completa que puede:
- Guardar otros tokens
- Guardar otros NFTs
- Ejecutar transacciones
- Tener historial propio

## En CryptoGift:
Usamos ERC-6551 para que cuando regalas un NFT, estás regalando una wallet real con crypto real adentro.

**El receptor no necesita:**
- Crear cuenta en exchange
- Entender gas
- Guardar seed phrases

Solo recibe, y ya tiene crypto. Así de simple.

🔗 Más info: https://eips.ethereum.org/EIPS/eip-6551`,
        contentEn: `# 📚 ERC-6551: The standard that changes everything

## What is it?
ERC-6551 allows any NFT to have its own integrated wallet.

## Why does it matter?
Before: NFT = pretty image
Now: NFT = complete wallet that can:
- Hold other tokens
- Hold other NFTs
- Execute transactions
- Have its own history

## In CryptoGift:
We use ERC-6551 so when you gift an NFT, you're gifting a real wallet with real crypto inside.

**The receiver doesn't need to:**
- Create an exchange account
- Understand gas
- Save seed phrases

They just receive, and they have crypto. That simple.

🔗 More info: https://eips.ethereum.org/EIPS/eip-6551`
      }
    ]
  }
];

// ===== CONTENIDO FARCASTER =====
export interface FarcasterContent {
  type: 'cast' | 'thread' | 'frame';
  content: string;
  contentEn: string;
  channel?: string;
}

export const farcasterContent: FarcasterContent[] = [
  {
    type: 'cast',
    channel: '/base',
    content: `gm /base 👋

Construimos NFT-wallets en Base.

Tu NFT ES tu wallet.
Gas = $0.
Un regalo = primer portafolio crypto.

El onboarding más humano a Web3.

¿Preguntas? 👇`,
    contentEn: `gm /base 👋

We build NFT-wallets on Base.

Your NFT IS your wallet.
Gas = $0.
One gift = first crypto portfolio.

The most human Web3 onboarding.

Questions? 👇`
  },
  {
    type: 'cast',
    channel: '/dao',
    content: `Nueva forma de crear comunidades:

Cada regalo puede nacer con gobernanza.

NFT-wallet + token de voto + tesorería = micro-DAO instantánea.

Para: fan clubs, equipos, causas, eventos.

Todo compatible con Aragon 🏛️`,
    contentEn: `New way to create communities:

Every gift can be born with governance.

NFT-wallet + voting token + treasury = instant micro-DAO.

For: fan clubs, teams, causes, events.

Fully Aragon compatible 🏛️`
  },
  {
    type: 'cast',
    channel: '/education',
    content: `Academy by CryptoGift:

El regalo se libera cuando completas el aprendizaje.

Módulos educativos → Quiz → Certificado on-chain → Crypto desbloqueado.

Learn to earn. Literalmente.

Perfecto para onboarding de marcas y ONGs 📚`,
    contentEn: `Academy by CryptoGift:

The gift unlocks when you complete learning.

Educational modules → Quiz → On-chain certificate → Crypto unlocked.

Learn to earn. Literally.

Perfect for brand and NGO onboarding 📚`
  },
  {
    type: 'thread',
    content: `🧵 Por qué el gifting es el mejor onboarding a crypto:

1/ El 89% de personas han regalado dinero. Solo 3% tiene crypto.

2/ El problema no es la tecnología. Es la entrada.

3/ Un regalo elimina la barrera: alguien más ya hizo el trabajo.

4/ Emociones > Tutoriales. La confianza viene del vínculo.

5/ En CryptoGift: 1 link = 1 wallet = 1 nuevo holder.

El futuro de la adopción es personal 🎁`,
    contentEn: `🧵 Why gifting is the best crypto onboarding:

1/ 89% of people have gifted money. Only 3% have crypto.

2/ The problem isn't technology. It's the entry point.

3/ A gift removes the barrier: someone else already did the work.

4/ Emotions > Tutorials. Trust comes from connection.

5/ On CryptoGift: 1 link = 1 wallet = 1 new holder.

The future of adoption is personal 🎁`
  }
];

// ===== ESTADÍSTICAS Y MÉTRICAS =====
export const contentStats = {
  totalTwitterPosts: 35,
  totalDiscordPosts: 8,
  totalFarcasterPosts: 4,
  daysOfContent: 7,
  categories: ['educational', 'emotional', 'technical', 'community', 'viral', 'cta'],
  platforms: ['Twitter/X', 'Discord', 'Farcaster'],
  estimatedReach: '10,000+ potential impressions/week',
  bestPostingTimes: ['7:00 AM', '9:00 AM', '12:00 PM', '3:00 PM', '6:00 PM', '8:00 PM']
};
