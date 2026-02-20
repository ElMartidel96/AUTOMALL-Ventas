/**
 * 🎮 Discord Server Setup Script for CryptoGift Wallets DAO
 *
 * This script automatically configures the Discord server with:
 * - Categories and channels
 * - Roles with proper hierarchy and colors
 * - Channel permissions
 * - Welcome messages
 *
 * Usage: node scripts/setup-discord-server.js
 *
 * Made by mbxarts.com The Moon in a Box property
 */

const {
  Client,
  GatewayIntentBits,
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder,
  Colors
} = require('discord.js');
require('dotenv').config({ path: '.env.local' });

// Configuration
const CONFIG = {
  token: process.env.DISCORD_DAO_TOKEN,
  guildId: process.env.DISCORD_DAO_GUILD_ID,
  webhookUrl: process.env.DISCORD_DAO_WEBHOOK_URL,
};

// Validate configuration
if (!CONFIG.token || !CONFIG.guildId) {
  console.error('❌ Missing Discord credentials in .env.local');
  console.error('Required: DISCORD_DAO_TOKEN, DISCORD_DAO_GUILD_ID');
  process.exit(1);
}

// Role definitions with colors and permissions
const ROLES = [
  {
    name: '🔑 Admin',
    color: '#E74C3C',
    permissions: [PermissionFlagsBits.Administrator],
    hoist: true,
    mentionable: true
  },
  {
    name: '🛠️ Moderador',
    color: '#E67E22',
    permissions: [
      PermissionFlagsBits.ManageMessages,
      PermissionFlagsBits.KickMembers,
      PermissionFlagsBits.MuteMembers,
      PermissionFlagsBits.ManageNicknames,
      PermissionFlagsBits.ViewChannel,
      PermissionFlagsBits.SendMessages
    ],
    hoist: true,
    mentionable: true
  },
  {
    name: '👨‍💻 Team',
    color: '#9B59B6',
    permissions: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
    hoist: true,
    mentionable: true
  },
  {
    name: '💎 Diamond Holder',
    color: '#1ABC9C',
    permissions: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
    hoist: true,
    mentionable: false
  },
  {
    name: '🥇 Gold Holder',
    color: '#F1C40F',
    permissions: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
    hoist: true,
    mentionable: false
  },
  {
    name: '🥈 Silver Holder',
    color: '#BDC3C7',
    permissions: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
    hoist: true,
    mentionable: false
  },
  {
    name: '🥉 Bronze Holder',
    color: '#CD7F32',
    permissions: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
    hoist: true,
    mentionable: false
  },
  {
    name: '✅ Verified',
    color: '#2ECC71',
    permissions: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
    hoist: false,
    mentionable: false
  },
  {
    name: '📢 Announcements',
    color: '#3498DB',
    permissions: [],
    hoist: false,
    mentionable: true
  },
  {
    name: '👥 Member',
    color: '#95A5A6',
    permissions: [],
    hoist: false,
    mentionable: false
  },
];

// Channel structure
const CHANNEL_STRUCTURE = [
  {
    name: '📢 INFORMACIÓN',
    type: 'category',
    channels: [
      { name: '📜-bienvenida-y-reglas', type: 'text', readOnly: true },
      { name: '📣-anuncios', type: 'text', readOnly: true },
      { name: '🗺️-roadmap', type: 'text', readOnly: true },
      { name: '🔗-links-oficiales', type: 'text', readOnly: true },
    ]
  },
  {
    name: '✅ VERIFICACIÓN',
    type: 'category',
    channels: [
      { name: '🔐-verificate-aqui', type: 'text', readOnly: false, verificationChannel: true },
      { name: '❓-soporte-verificacion', type: 'text', readOnly: false },
    ]
  },
  {
    name: '💬 COMUNIDAD',
    type: 'category',
    verifiedOnly: true,
    channels: [
      { name: '💬-general', type: 'text', readOnly: false },
      { name: '💬-general-english', type: 'text', readOnly: false },
      { name: '🎉-presentaciones', type: 'text', readOnly: false },
      { name: '📸-memes', type: 'text', readOnly: false },
      { name: '💡-sugerencias', type: 'text', readOnly: false },
    ]
  },
  {
    name: '📚 EDUCACIÓN',
    type: 'category',
    verifiedOnly: true,
    channels: [
      { name: '🎓-aprender-crypto', type: 'text', readOnly: false },
      { name: '📖-tutoriales', type: 'text', readOnly: false },
      { name: '❓-preguntas', type: 'text', readOnly: false },
      { name: '🎯-tareas-dao', type: 'text', readOnly: false },
    ]
  },
  {
    name: '🏛️ GOBERNANZA',
    type: 'category',
    verifiedOnly: true,
    channels: [
      { name: '📜-propuestas', type: 'text', readOnly: false },
      { name: '🗳️-votaciones', type: 'text', readOnly: false },
      { name: '🏆-leaderboard', type: 'text', readOnly: false },
    ]
  },
  {
    name: '🔧 SOPORTE',
    type: 'category',
    channels: [
      { name: '🆘-soporte-general', type: 'text', readOnly: false },
      { name: '🎫-crear-ticket', type: 'text', readOnly: false },
      { name: '🐛-reportar-bugs', type: 'text', readOnly: false },
    ]
  },
  {
    name: '🔊 VOZ',
    type: 'category',
    verifiedOnly: true,
    channels: [
      { name: '🎤 Lounge General', type: 'voice', readOnly: false },
      { name: '🎙️ AMA y Eventos', type: 'voice', readOnly: false },
      { name: '🤝 Reuniones Team', type: 'voice', readOnly: false, teamOnly: true },
    ]
  },
];

// Welcome message content
const WELCOME_MESSAGE = `# 🎁 ¡Bienvenido a CryptoGift Wallets DAO!

## 🌟 ¿Qué es CryptoGift Wallets DAO?

Somos una **Organización Autónoma Descentralizada (DAO)** en Base que recompensa a los usuarios por completar tareas educativas y contribuir al ecosistema Web3.

**CGC (CryptoGift Coin)** es nuestro token de gobernanza que permite:
- 🗳️ Votar en propuestas de la DAO
- 🎯 Recibir recompensas por completar tareas
- 🏆 Participar en el sistema de referidos multinivel
- 💎 Acceso a beneficios exclusivos

---

## 📜 REGLAS DE LA COMUNIDAD

**1. Respeto Mutuo**
   Trata a todos con respeto. No se tolera discriminación, acoso o bullying.

**2. Sin Spam ni Promociones**
   No promociones otros proyectos, NFTs o tokens sin autorización del equipo.

**3. Sin Estafas (Scams)**
   - El equipo NUNCA te pedirá tu seed phrase
   - NUNCA envíes crypto a nadie que lo pida por DM
   - Reporta cualquier mensaje sospechoso

**4. Mantén los Temas en sus Canales**
   Usa los canales apropiados para cada tipo de discusión.

**5. Sin NSFW**
   Contenido para adultos está estrictamente prohibido.

**6. Idiomas**
   - #💬-general → Español
   - #💬-general-english → English

---

## 🔗 LINKS OFICIALES

🌐 **Website:** https://mbxarts.com
🐦 **Twitter:** https://x.com/cryptogiftdao
📄 **Whitepaper:** https://mbxarts.com/CRYPTOGIFT_WHITEPAPER_v1.2.pdf
🏛️ **Aragon DAO:** https://app.aragon.org/dao/base-mainnet/0x3244DFBf9E5374DF2f106E89Cf7972E5D4C9ac31
🔍 **BaseScan CGC:** https://basescan.org/token/0x5e3a61b550328f3D8C44f60b3e10a49D3d806175
💻 **GitHub:** https://github.com/CryptoGift-Wallets-DAO/CryptoGift-Wallets-DAO

---

## ⚠️ IMPORTANTE

> El equipo NUNCA te enviará DM primero pidiendo información
> NUNCA compartas tu seed phrase o claves privadas
> Siempre verifica los links oficiales antes de conectar tu wallet

---

## 🎯 PRIMEROS PASOS

1️⃣ Verifica tu wallet en #🔐-verificate-aqui
2️⃣ Preséntate en #🎉-presentaciones
3️⃣ Revisa las tareas disponibles en https://mbxarts.com/tasks
4️⃣ Únete a la conversación en #💬-general

¡Bienvenido a la familia CryptoGift! 🚀`;

const ANNOUNCEMENT_MESSAGE = `# 🎉 ¡El Servidor de Discord de CryptoGift Wallets DAO está OFICIALMENTE ACTIVO!

Hola a todos 👋

Nos complace anunciar que nuestro servidor de Discord ha sido completamente configurado y está listo para recibir a nuestra comunidad.

## 🔥 ¿Qué encontrarás aquí?

✅ **Verificación de Holders** - Conecta tu wallet y obtén roles exclusivos según tu balance de CGC

✅ **Sistema de Tareas** - Discute y coordina tareas de la DAO para ganar recompensas

✅ **Gobernanza** - Mantente al día con propuestas y votaciones en Aragon

✅ **Educación** - Aprende sobre Web3, Base y el ecosistema crypto

✅ **Soporte 24/7** - Nuestro equipo está aquí para ayudarte

## 📊 Estado Actual del Proyecto

- 🟢 **Website:** https://mbxarts.com - LIVE
- 🟢 **CGC Token:** Desplegado en Base Mainnet
- 🟢 **Aragon DAO:** Operacional
- 🟢 **Sistema de Tareas:** Activo con recompensas automáticas
- 🟢 **Sistema de Referidos:** 3 niveles de comisiones

## 🎯 Próximos Pasos

1. Listing en CoinGecko (pendiente de liquidity pool)
2. Verificación de logo en BaseScan (en proceso)
3. Integración con más wallets

---

**Invita a tus amigos:** https://discord.gg/uWYxwmu9c5

¿Tienes CGC tokens? ¡Verifica tu wallet para obtener tu rol de holder! 💎

— El Equipo de CryptoGift Wallets DAO`;

const VERIFICATION_MESSAGE = `# 🔐 VERIFICACIÓN DE WALLET

Para acceder a los canales de la comunidad y obtener tu rol de holder, necesitas verificar tu wallet.

## 📋 Pasos:

1️⃣ Haz click en el botón de verificación que aparecerá cuando Collab.Land esté configurado
2️⃣ Conecta tu wallet (MetaMask, Coinbase Wallet, etc.)
3️⃣ Firma el mensaje (NO cuesta gas)
4️⃣ ¡Listo! Recibirás tu rol automáticamente

## 🏆 Roles por Balance de CGC:

| Balance | Rol |
|---------|-----|
| 100+ CGC | 🥉 Bronze Holder |
| 1,000+ CGC | 🥈 Silver Holder |
| 10,000+ CGC | 🥇 Gold Holder |
| 100,000+ CGC | 💎 Diamond Holder |

## ❓ ¿No tienes CGC todavía?

Puedes obtener CGC completando tareas en https://mbxarts.com/tasks

---

⚠️ **IMPORTANTE:** Este proceso es GRATUITO. Si alguien te pide pagar o enviar crypto, es una ESTAFA.

---

*Nota: Si Collab.Land no está instalado aún, un administrador configurará la verificación pronto.*`;

const LINKS_MESSAGE = `# 🔗 LINKS OFICIALES DE CRYPTOGIFT WALLETS DAO

## 🌐 Plataformas Principales

| Plataforma | Link |
|------------|------|
| 🏠 Website | https://mbxarts.com |
| 🐦 Twitter/X | https://x.com/cryptogiftdao |
| 💻 GitHub | https://github.com/CryptoGift-Wallets-DAO/CryptoGift-Wallets-DAO |
| 📱 Discord | https://discord.gg/uWYxwmu9c5 |

## 📄 Documentación

| Documento | Link |
|-----------|------|
| 📜 Whitepaper | https://mbxarts.com/CRYPTOGIFT_WHITEPAPER_v1.2.pdf |
| 📚 Docs | https://mbxarts.com/docs |
| 📊 Tokenomics | https://mbxarts.com/docs?tab=tokenomics |

## 🔍 Blockchain

| Recurso | Link |
|---------|------|
| 🏛️ Aragon DAO | https://app.aragon.org/dao/base-mainnet/0x3244DFBf9E5374DF2f106E89Cf7972E5D4C9ac31 |
| 💰 CGC Token | https://basescan.org/token/0x5e3a61b550328f3D8C44f60b3e10a49D3d806175 |
| 📦 MilestoneEscrow | https://basescan.org/address/0x8346CFcaECc90d678d862319449E5a742c03f109 |

## 📱 APIs

| API | Endpoint |
|-----|----------|
| Total Supply | https://mbxarts.com/api/token/total-supply |
| Circulating Supply | https://mbxarts.com/api/token/circulating-supply |

---

⚠️ **Solo confía en links de este canal. Si alguien te envía un link por DM, es probablemente una estafa.**`;

const ROADMAP_MESSAGE = `# 🗺️ ROADMAP DE CRYPTOGIFT WALLETS DAO

## ✅ Q4 2024 - COMPLETADO

- ✅ Despliegue de contratos en Base Mainnet
- ✅ CGC Token con sistema de emisión por milestones
- ✅ Integración con Aragon DAO
- ✅ Sistema de tareas on-chain
- ✅ Panel de administración

## 🔄 Q1 2025 - EN PROGRESO

- ✅ Sistema de referidos multinivel (3 niveles)
- ✅ Bonos automáticos de signup (200 CGC)
- 🔄 Listing en CoinGecko
- 🔄 Verificación de logo en BaseScan
- 🔄 Discord con verificación de holders

## 🎯 Q2 2025 - PLANIFICADO

- 📋 Sistema de votación automatizado
- 📋 Integración con Wonderverse
- 📋 Mobile optimization
- 📋 Partnerships estratégicos

## 🚀 Q3-Q4 2025 - VISIÓN

- 📋 Auditoría de seguridad
- 📋 Expansión multichain
- 📋 Integraciones DeFi
- 📋 Sistema de NFTs para achievements
- 📋 Descentralización completa

---

**¿Tienes sugerencias para el roadmap?** Participa en #💡-sugerencias o crea una propuesta en Aragon DAO.`;

// Main setup function
async function setupDiscordServer() {
  console.log('🚀 Iniciando configuración del servidor de Discord...\n');

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMembers,
    ]
  });

  try {
    // Login
    console.log('🔐 Conectando al bot de Discord...');
    await client.login(CONFIG.token);
    console.log('✅ Bot conectado exitosamente!\n');

    // Wait for client to be ready
    await new Promise(resolve => {
      if (client.isReady()) {
        resolve();
      } else {
        client.once('ready', resolve);
      }
    });

    // Get guild
    const guild = await client.guilds.fetch(CONFIG.guildId);
    console.log(`📍 Servidor encontrado: ${guild.name}\n`);

    // Get bot's highest role position for comparison
    const botMember = await guild.members.fetch(client.user.id);
    const botHighestRole = botMember.roles.highest;
    console.log(`🤖 Bot role position: ${botHighestRole.position}\n`);

    // Store created roles for reference
    const createdRoles = {};

    // Step 1: Create Roles
    console.log('📋 Creando roles...\n');

    // Get existing roles
    const existingRoles = await guild.roles.fetch();

    for (const roleData of ROLES) {
      // Check if role already exists
      const existingRole = existingRoles.find(r => r.name === roleData.name);

      if (existingRole) {
        console.log(`  ⏭️  Rol "${roleData.name}" ya existe`);
        createdRoles[roleData.name] = existingRole;
        continue;
      }

      try {
        const role = await guild.roles.create({
          name: roleData.name,
          color: roleData.color,
          hoist: roleData.hoist,
          mentionable: roleData.mentionable,
          permissions: roleData.permissions,
          reason: 'CryptoGift Wallets DAO Setup Script'
        });

        createdRoles[roleData.name] = role;
        console.log(`  ✅ Rol creado: ${roleData.name}`);
      } catch (error) {
        console.log(`  ❌ Error creando rol ${roleData.name}: ${error.message}`);
      }
    }

    console.log('\n');

    // Step 2: Create Categories and Channels
    console.log('📁 Creando categorías y canales...\n');

    const verifiedRole = createdRoles['✅ Verified'] || existingRoles.find(r => r.name === '✅ Verified');
    const teamRole = createdRoles['👨‍💻 Team'] || existingRoles.find(r => r.name === '👨‍💻 Team');
    const adminRole = createdRoles['🔑 Admin'] || existingRoles.find(r => r.name === '🔑 Admin');
    const moderatorRole = createdRoles['🛠️ Moderador'] || existingRoles.find(r => r.name === '🛠️ Moderador');

    // Get existing channels
    const existingChannels = await guild.channels.fetch();

    // Store channel references for messages
    const channelRefs = {};

    for (const categoryData of CHANNEL_STRUCTURE) {
      // Check if category exists
      let category = existingChannels.find(c => c.name === categoryData.name && c.type === ChannelType.GuildCategory);

      if (!category) {
        try {
          // Create category with base permissions
          const categoryPermissions = [
            {
              id: guild.roles.everyone.id,
              allow: [PermissionFlagsBits.ViewChannel],
              deny: []
            }
          ];

          // If verified only, deny @everyone and allow verified
          if (categoryData.verifiedOnly) {
            categoryPermissions[0].deny = [PermissionFlagsBits.ViewChannel];

            if (verifiedRole) {
              categoryPermissions.push({
                id: verifiedRole.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                deny: []
              });
            }

            // Always allow admin and moderator
            if (adminRole) {
              categoryPermissions.push({
                id: adminRole.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages],
                deny: []
              });
            }
            if (moderatorRole) {
              categoryPermissions.push({
                id: moderatorRole.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages],
                deny: []
              });
            }
          }

          category = await guild.channels.create({
            name: categoryData.name,
            type: ChannelType.GuildCategory,
            permissionOverwrites: categoryPermissions,
            reason: 'CryptoGift Wallets DAO Setup Script'
          });

          console.log(`  ✅ Categoría creada: ${categoryData.name}`);
        } catch (error) {
          console.log(`  ❌ Error creando categoría ${categoryData.name}: ${error.message}`);
          continue;
        }
      } else {
        console.log(`  ⏭️  Categoría "${categoryData.name}" ya existe`);
      }

      // Create channels in category
      for (const channelData of categoryData.channels) {
        // Check if channel exists
        const existingChannel = existingChannels.find(c =>
          c.name === channelData.name.toLowerCase().replace(/ /g, '-') ||
          c.name === channelData.name
        );

        if (existingChannel) {
          console.log(`    ⏭️  Canal "${channelData.name}" ya existe`);
          channelRefs[channelData.name] = existingChannel;
          continue;
        }

        try {
          const channelType = channelData.type === 'voice' ? ChannelType.GuildVoice : ChannelType.GuildText;

          // Set up permissions
          const channelPermissions = [];

          // Read-only channels
          if (channelData.readOnly) {
            channelPermissions.push({
              id: guild.roles.everyone.id,
              allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
              deny: [PermissionFlagsBits.SendMessages]
            });

            // Allow admins and moderators to post
            if (adminRole) {
              channelPermissions.push({
                id: adminRole.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages],
                deny: []
              });
            }
            if (moderatorRole) {
              channelPermissions.push({
                id: moderatorRole.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages],
                deny: []
              });
            }
          }

          // Team-only channels
          if (channelData.teamOnly) {
            channelPermissions.push({
              id: guild.roles.everyone.id,
              deny: [PermissionFlagsBits.ViewChannel]
            });

            if (teamRole) {
              channelPermissions.push({
                id: teamRole.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak],
                deny: []
              });
            }
            if (adminRole) {
              channelPermissions.push({
                id: adminRole.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.Connect, PermissionFlagsBits.Speak],
                deny: []
              });
            }
          }

          // Verification channel - special permissions
          if (channelData.verificationChannel) {
            channelPermissions.push({
              id: guild.roles.everyone.id,
              allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
              deny: [PermissionFlagsBits.SendMessages]
            });

            // Verified users can't see verification channel
            if (verifiedRole) {
              channelPermissions.push({
                id: verifiedRole.id,
                deny: [PermissionFlagsBits.ViewChannel]
              });
            }
          }

          const channel = await guild.channels.create({
            name: channelData.name,
            type: channelType,
            parent: category.id,
            permissionOverwrites: channelPermissions.length > 0 ? channelPermissions : undefined,
            reason: 'CryptoGift Wallets DAO Setup Script'
          });

          channelRefs[channelData.name] = channel;
          console.log(`    ✅ Canal creado: ${channelData.name}`);
        } catch (error) {
          console.log(`    ❌ Error creando canal ${channelData.name}: ${error.message}`);
        }
      }
    }

    console.log('\n');

    // Step 3: Send welcome messages
    console.log('📨 Enviando mensajes de bienvenida...\n');

    const messageTargets = [
      { channelName: '📜-bienvenida-y-reglas', message: WELCOME_MESSAGE },
      { channelName: '📣-anuncios', message: ANNOUNCEMENT_MESSAGE },
      { channelName: '🔐-verificate-aqui', message: VERIFICATION_MESSAGE },
      { channelName: '🔗-links-oficiales', message: LINKS_MESSAGE },
      { channelName: '🗺️-roadmap', message: ROADMAP_MESSAGE },
    ];

    for (const target of messageTargets) {
      const channel = channelRefs[target.channelName] ||
                     existingChannels.find(c => c.name === target.channelName.toLowerCase().replace(/ /g, '-'));

      if (channel && channel.isTextBased()) {
        try {
          // Check if channel already has messages
          const messages = await channel.messages.fetch({ limit: 1 });

          if (messages.size === 0) {
            // Split message if too long (Discord limit is 2000 chars)
            if (target.message.length > 2000) {
              const chunks = target.message.match(/[\s\S]{1,1900}/g);
              for (const chunk of chunks) {
                await channel.send(chunk);
              }
            } else {
              await channel.send(target.message);
            }
            console.log(`  ✅ Mensaje enviado a ${target.channelName}`);
          } else {
            console.log(`  ⏭️  ${target.channelName} ya tiene mensajes`);
          }
        } catch (error) {
          console.log(`  ❌ Error enviando mensaje a ${target.channelName}: ${error.message}`);
        }
      } else {
        console.log(`  ⚠️  Canal ${target.channelName} no encontrado`);
      }
    }

    console.log('\n');

    // Summary
    console.log('═══════════════════════════════════════════════════════════');
    console.log('                    ✅ CONFIGURACIÓN COMPLETADA             ');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('📋 PRÓXIMOS PASOS MANUALES:\n');
    console.log('1. 🤖 INSTALAR COLLAB.LAND (Token Gating):');
    console.log('   → Ve a: https://collab.land/');
    console.log('   → Click "Add to Server" y selecciona tu servidor');
    console.log('   → Configura en: https://cc.collab.land/');
    console.log('   → Crea TGRs para CGC token: 0x5e3a61b550328f3D8C44f60b3e10a49D3d806175');
    console.log('   → Network: Base | Token Type: ERC-20\n');

    console.log('2. 🤖 INSTALAR CARL-BOT (Reaction Roles):');
    console.log('   → Ve a: https://carl.gg/');
    console.log('   → Click "Invite" y selecciona tu servidor\n');

    console.log('3. 🤖 INSTALAR MEE6 (Moderación):');
    console.log('   → Ve a: https://mee6.xyz/');
    console.log('   → Click "Add to Discord"\n');

    console.log('4. 👤 ASIGNAR ROLES:');
    console.log('   → Click derecho en tu nombre → Roles → Asigna "🔑 Admin"');
    console.log('   → Asigna roles a otros miembros del equipo\n');

    console.log('5. 🔒 MOVER ROL DEL BOT COLLAB.LAND:');
    console.log('   → Después de instalar Collab.Land');
    console.log('   → Ve a Configuración → Roles');
    console.log('   → Arrastra "Collab.Land" arriba de todos los roles de holder\n');

    console.log('═══════════════════════════════════════════════════════════\n');

    // Cleanup
    client.destroy();
    console.log('👋 Bot desconectado. ¡Configuración finalizada!\n');

  } catch (error) {
    console.error('❌ Error fatal:', error);
    client.destroy();
    process.exit(1);
  }
}

// Run the setup
setupDiscordServer();
