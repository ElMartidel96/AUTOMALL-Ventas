/**
 * 🎮 Discord Server Setup Script (REST API Version)
 * Uses Discord REST API directly with axios (no discord.js required)
 *
 * Usage: node scripts/setup-discord-rest.js
 *
 * Made by mbxarts.com The Moon in a Box property
 */

const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

// Configuration
const CONFIG = {
  token: process.env.DISCORD_DAO_TOKEN,
  guildId: process.env.DISCORD_DAO_GUILD_ID,
  webhookUrl: process.env.DISCORD_DAO_WEBHOOK_URL,
};

const API_BASE = 'https://discord.com/api/v10';

// Validate configuration
if (!CONFIG.token || !CONFIG.guildId) {
  console.error('❌ Missing Discord credentials in .env.local');
  console.error('Required: DISCORD_DAO_TOKEN, DISCORD_DAO_GUILD_ID');
  process.exit(1);
}

// Create axios instance with auth
const discord = axios.create({
  baseURL: API_BASE,
  headers: {
    'Authorization': `Bot ${CONFIG.token}`,
    'Content-Type': 'application/json',
  }
});

// Discord Permission Flags
const PERMISSIONS = {
  VIEW_CHANNEL: 1n << 10n,
  SEND_MESSAGES: 1n << 11n,
  READ_MESSAGE_HISTORY: 1n << 16n,
  CONNECT: 1n << 20n,
  SPEAK: 1n << 21n,
  MANAGE_MESSAGES: 1n << 13n,
  KICK_MEMBERS: 1n << 1n,
  MUTE_MEMBERS: 1n << 22n,
  MANAGE_NICKNAMES: 1n << 27n,
  ADMINISTRATOR: 1n << 3n,
};

// Channel Types
const CHANNEL_TYPES = {
  GUILD_TEXT: 0,
  GUILD_VOICE: 2,
  GUILD_CATEGORY: 4,
};

// Role definitions
const ROLES = [
  { name: '🔑 Admin', color: 0xE74C3C, permissions: String(PERMISSIONS.ADMINISTRATOR), hoist: true, mentionable: true },
  { name: '🛠️ Moderador', color: 0xE67E22, permissions: String(PERMISSIONS.MANAGE_MESSAGES | PERMISSIONS.KICK_MEMBERS | PERMISSIONS.MUTE_MEMBERS | PERMISSIONS.MANAGE_NICKNAMES | PERMISSIONS.VIEW_CHANNEL | PERMISSIONS.SEND_MESSAGES), hoist: true, mentionable: true },
  { name: '👨‍💻 Team', color: 0x9B59B6, permissions: String(PERMISSIONS.VIEW_CHANNEL | PERMISSIONS.SEND_MESSAGES), hoist: true, mentionable: true },
  { name: '💎 Diamond Holder', color: 0x1ABC9C, permissions: '0', hoist: true, mentionable: false },
  { name: '🥇 Gold Holder', color: 0xF1C40F, permissions: '0', hoist: true, mentionable: false },
  { name: '🥈 Silver Holder', color: 0xBDC3C7, permissions: '0', hoist: true, mentionable: false },
  { name: '🥉 Bronze Holder', color: 0xCD7F32, permissions: '0', hoist: true, mentionable: false },
  { name: '✅ Verified', color: 0x2ECC71, permissions: '0', hoist: false, mentionable: false },
  { name: '📢 Announcements', color: 0x3498DB, permissions: '0', hoist: false, mentionable: true },
  { name: '👥 Member', color: 0x95A5A6, permissions: '0', hoist: false, mentionable: false },
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
      { name: '🔐-verificate-aqui', type: 'text', verificationChannel: true },
      { name: '❓-soporte-verificacion', type: 'text' },
    ]
  },
  {
    name: '💬 COMUNIDAD',
    type: 'category',
    verifiedOnly: true,
    channels: [
      { name: '💬-general', type: 'text' },
      { name: '💬-general-english', type: 'text' },
      { name: '🎉-presentaciones', type: 'text' },
      { name: '📸-memes', type: 'text' },
      { name: '💡-sugerencias', type: 'text' },
    ]
  },
  {
    name: '📚 EDUCACIÓN',
    type: 'category',
    verifiedOnly: true,
    channels: [
      { name: '🎓-aprender-crypto', type: 'text' },
      { name: '📖-tutoriales', type: 'text' },
      { name: '❓-preguntas', type: 'text' },
      { name: '🎯-tareas-dao', type: 'text' },
    ]
  },
  {
    name: '🏛️ GOBERNANZA',
    type: 'category',
    verifiedOnly: true,
    channels: [
      { name: '📜-propuestas', type: 'text' },
      { name: '🗳️-votaciones', type: 'text' },
      { name: '🏆-leaderboard', type: 'text' },
    ]
  },
  {
    name: '🔧 SOPORTE',
    type: 'category',
    channels: [
      { name: '🆘-soporte-general', type: 'text' },
      { name: '🎫-crear-ticket', type: 'text' },
      { name: '🐛-reportar-bugs', type: 'text' },
    ]
  },
  {
    name: '🔊 VOZ',
    type: 'category',
    verifiedOnly: true,
    channels: [
      { name: '🎤 Lounge General', type: 'voice' },
      { name: '🎙️ AMA y Eventos', type: 'voice' },
      { name: '🤝 Reuniones Team', type: 'voice', teamOnly: true },
    ]
  },
];

// Messages content
const MESSAGES = {
  '📜-bienvenida-y-reglas': `# 🎁 ¡Bienvenido a CryptoGift Wallets DAO!

## 🌟 ¿Qué es CryptoGift Wallets DAO?

Somos una **Organización Autónoma Descentralizada (DAO)** en Base que recompensa a los usuarios por completar tareas educativas y contribuir al ecosistema Web3.

**CGC (CryptoGift Coin)** es nuestro token de gobernanza que permite:
- 🗳️ Votar en propuestas de la DAO
- 🎯 Recibir recompensas por completar tareas
- 🏆 Participar en el sistema de referidos multinivel
- 💎 Acceso a beneficios exclusivos

---

## 📜 REGLAS DE LA COMUNIDAD

**1. Respeto Mutuo** - Trata a todos con respeto. No se tolera discriminación, acoso o bullying.

**2. Sin Spam ni Promociones** - No promociones otros proyectos sin autorización.

**3. Sin Estafas (Scams)** - El equipo NUNCA te pedirá tu seed phrase. NUNCA envíes crypto por DM.

**4. Mantén los Temas en sus Canales** - Usa los canales apropiados.

**5. Sin NSFW** - Contenido para adultos prohibido.

**6. Idiomas** - #💬-general → Español | #💬-general-english → English

---

## 🔗 LINKS OFICIALES

🌐 **Website:** https://mbxarts.com
🐦 **Twitter:** https://x.com/cryptogiftdao
📄 **Whitepaper:** https://mbxarts.com/CRYPTOGIFT_WHITEPAPER_v1.2.pdf
🏛️ **Aragon DAO:** https://app.aragon.org/dao/base-mainnet/0x3244DFBf9E5374DF2f106E89Cf7972E5D4C9ac31
🔍 **BaseScan CGC:** https://basescan.org/token/0x5e3a61b550328f3D8C44f60b3e10a49D3d806175

---

## ⚠️ IMPORTANTE

> El equipo NUNCA te enviará DM primero pidiendo información
> NUNCA compartas tu seed phrase o claves privadas

---

## 🎯 PRIMEROS PASOS

1️⃣ Verifica tu wallet en #🔐-verificate-aqui
2️⃣ Preséntate en #🎉-presentaciones
3️⃣ Revisa las tareas en https://mbxarts.com/tasks
4️⃣ Únete a #💬-general

¡Bienvenido a la familia CryptoGift! 🚀`,

  '📣-anuncios': `# 🎉 ¡El Servidor de Discord está OFICIALMENTE ACTIVO!

Hola a todos 👋

Nuestro servidor de Discord ha sido completamente configurado.

## 🔥 ¿Qué encontrarás aquí?

✅ **Verificación de Holders** - Roles exclusivos según tu balance de CGC
✅ **Sistema de Tareas** - Discute y coordina tareas de la DAO
✅ **Gobernanza** - Propuestas y votaciones en Aragon
✅ **Educación** - Aprende sobre Web3 y Base
✅ **Soporte 24/7** - Nuestro equipo está aquí para ayudarte

## 📊 Estado Actual

- 🟢 Website: https://mbxarts.com - LIVE
- 🟢 CGC Token: Desplegado en Base Mainnet
- 🟢 Aragon DAO: Operacional
- 🟢 Sistema de Tareas: Activo
- 🟢 Sistema de Referidos: 3 niveles

---

**Invita a tus amigos:** https://discord.gg/XzmKkrvhHc

— El Equipo de CryptoGift Wallets DAO`,

  '🔐-verificate-aqui': `# 🔐 VERIFICACIÓN DE WALLET

Para acceder a los canales de la comunidad, necesitas verificar tu wallet.

## 📋 Pasos:

1️⃣ Cuando Collab.Land esté instalado, haz click en el botón de verificación
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

⚠️ **IMPORTANTE:** Este proceso es GRATUITO. Si alguien te pide pagar, es una ESTAFA.`,

  '🔗-links-oficiales': `# 🔗 LINKS OFICIALES

## 🌐 Plataformas Principales

| Plataforma | Link |
|------------|------|
| 🏠 Website | https://mbxarts.com |
| 🐦 Twitter/X | https://x.com/cryptogiftdao |
| 💻 GitHub | https://github.com/CryptoGift-Wallets-DAO |
| 📱 Discord | https://discord.gg/XzmKkrvhHc |

## 📄 Documentación

| Documento | Link |
|-----------|------|
| 📜 Whitepaper | https://mbxarts.com/CRYPTOGIFT_WHITEPAPER_v1.2.pdf |
| 📚 Docs | https://mbxarts.com/docs |

## 🔍 Blockchain

| Recurso | Link |
|---------|------|
| 🏛️ Aragon DAO | https://app.aragon.org/dao/base-mainnet/0x3244DFBf9E5374DF2f106E89Cf7972E5D4C9ac31 |
| 💰 CGC Token | https://basescan.org/token/0x5e3a61b550328f3D8C44f60b3e10a49D3d806175 |

---

⚠️ **Solo confía en links de este canal.**`,

  '🗺️-roadmap': `# 🗺️ ROADMAP

## ✅ Q4 2024 - COMPLETADO
- ✅ Contratos en Base Mainnet
- ✅ CGC Token con emisión por milestones
- ✅ Integración con Aragon DAO
- ✅ Sistema de tareas on-chain

## 🔄 Q1 2025 - EN PROGRESO
- ✅ Sistema de referidos multinivel
- ✅ Bonos automáticos de signup (200 CGC)
- 🔄 Listing en CoinGecko
- 🔄 Verificación en BaseScan
- 🔄 Discord con verificación

## 🎯 Q2 2025 - PLANIFICADO
- 📋 Votación automatizada
- 📋 Mobile optimization
- 📋 Partnerships estratégicos

## 🚀 Q3-Q4 2025 - VISIÓN
- 📋 Auditoría de seguridad
- 📋 Expansión multichain
- 📋 Integraciones DeFi

---

**¿Sugerencias?** Participa en #💡-sugerencias o crea una propuesta en Aragon DAO.`,
};

// Utility functions
async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getGuildRoles() {
  try {
    const response = await discord.get(`/guilds/${CONFIG.guildId}/roles`);
    return response.data;
  } catch (error) {
    console.error('Error getting roles:', error.response?.data || error.message);
    return [];
  }
}

async function getGuildChannels() {
  try {
    const response = await discord.get(`/guilds/${CONFIG.guildId}/channels`);
    return response.data;
  } catch (error) {
    console.error('Error getting channels:', error.response?.data || error.message);
    return [];
  }
}

async function createRole(roleData) {
  try {
    const response = await discord.post(`/guilds/${CONFIG.guildId}/roles`, roleData);
    return response.data;
  } catch (error) {
    console.error(`Error creating role ${roleData.name}:`, error.response?.data || error.message);
    return null;
  }
}

async function createChannel(channelData) {
  try {
    const response = await discord.post(`/guilds/${CONFIG.guildId}/channels`, channelData);
    return response.data;
  } catch (error) {
    console.error(`Error creating channel ${channelData.name}:`, error.response?.data || error.message);
    return null;
  }
}

async function sendMessage(channelId, content) {
  try {
    // Split message if too long
    const chunks = content.match(/[\s\S]{1,1900}/g) || [content];
    for (const chunk of chunks) {
      await discord.post(`/channels/${channelId}/messages`, { content: chunk });
      await sleep(500); // Avoid rate limits
    }
    return true;
  } catch (error) {
    console.error(`Error sending message:`, error.response?.data || error.message);
    return false;
  }
}

async function getChannelMessages(channelId, limit = 1) {
  try {
    const response = await discord.get(`/channels/${channelId}/messages?limit=${limit}`);
    return response.data;
  } catch (error) {
    return [];
  }
}

// Main setup function
async function setupDiscordServer() {
  console.log('🚀 Iniciando configuración del servidor de Discord...\n');
  console.log('📍 Guild ID:', CONFIG.guildId);
  console.log('');

  // Step 1: Get existing roles and channels
  console.log('📋 Obteniendo configuración actual...\n');
  const existingRoles = await getGuildRoles();
  const existingChannels = await getGuildChannels();

  // Get @everyone role ID (it's the same as guild ID)
  const everyoneRoleId = CONFIG.guildId;

  // Store created/existing role IDs
  const roleIds = {};

  // Step 2: Create Roles
  console.log('📋 Creando roles...\n');

  for (const roleData of ROLES) {
    const existingRole = existingRoles.find(r => r.name === roleData.name);

    if (existingRole) {
      console.log(`  ⏭️  Rol "${roleData.name}" ya existe`);
      roleIds[roleData.name] = existingRole.id;
      continue;
    }

    const role = await createRole(roleData);
    if (role) {
      console.log(`  ✅ Rol creado: ${roleData.name}`);
      roleIds[roleData.name] = role.id;
    }
    await sleep(300); // Avoid rate limits
  }

  console.log('\n');

  // Step 3: Create Categories and Channels
  console.log('📁 Creando categorías y canales...\n');

  const verifiedRoleId = roleIds['✅ Verified'];
  const teamRoleId = roleIds['👨‍💻 Team'];
  const adminRoleId = roleIds['🔑 Admin'];
  const moderatorRoleId = roleIds['🛠️ Moderador'];

  const channelIds = {};

  for (const categoryData of CHANNEL_STRUCTURE) {
    // Check if category exists
    let category = existingChannels.find(c => c.name === categoryData.name && c.type === CHANNEL_TYPES.GUILD_CATEGORY);

    if (!category) {
      // Create category
      const permissionOverwrites = [];

      // If verified only, hide from everyone and show to verified
      if (categoryData.verifiedOnly) {
        permissionOverwrites.push({
          id: everyoneRoleId,
          type: 0, // role
          deny: String(PERMISSIONS.VIEW_CHANNEL),
          allow: '0'
        });

        if (verifiedRoleId) {
          permissionOverwrites.push({
            id: verifiedRoleId,
            type: 0,
            allow: String(PERMISSIONS.VIEW_CHANNEL | PERMISSIONS.SEND_MESSAGES),
            deny: '0'
          });
        }

        if (adminRoleId) {
          permissionOverwrites.push({
            id: adminRoleId,
            type: 0,
            allow: String(PERMISSIONS.VIEW_CHANNEL | PERMISSIONS.SEND_MESSAGES | PERMISSIONS.MANAGE_MESSAGES),
            deny: '0'
          });
        }

        if (moderatorRoleId) {
          permissionOverwrites.push({
            id: moderatorRoleId,
            type: 0,
            allow: String(PERMISSIONS.VIEW_CHANNEL | PERMISSIONS.SEND_MESSAGES | PERMISSIONS.MANAGE_MESSAGES),
            deny: '0'
          });
        }
      }

      category = await createChannel({
        name: categoryData.name,
        type: CHANNEL_TYPES.GUILD_CATEGORY,
        permission_overwrites: permissionOverwrites.length > 0 ? permissionOverwrites : undefined
      });

      if (category) {
        console.log(`  ✅ Categoría creada: ${categoryData.name}`);
      }
      await sleep(300);
    } else {
      console.log(`  ⏭️  Categoría "${categoryData.name}" ya existe`);
    }

    if (!category) continue;

    // Create channels in category
    for (const channelData of categoryData.channels) {
      const channelName = channelData.name.toLowerCase().replace(/ /g, '-');
      const existingChannel = existingChannels.find(c =>
        (c.name === channelName || c.name === channelData.name) &&
        c.type !== CHANNEL_TYPES.GUILD_CATEGORY
      );

      if (existingChannel) {
        console.log(`    ⏭️  Canal "${channelData.name}" ya existe`);
        channelIds[channelData.name] = existingChannel.id;
        continue;
      }

      const permissionOverwrites = [];

      // Read-only channels
      if (channelData.readOnly) {
        permissionOverwrites.push({
          id: everyoneRoleId,
          type: 0,
          allow: String(PERMISSIONS.VIEW_CHANNEL | PERMISSIONS.READ_MESSAGE_HISTORY),
          deny: String(PERMISSIONS.SEND_MESSAGES)
        });

        if (adminRoleId) {
          permissionOverwrites.push({
            id: adminRoleId,
            type: 0,
            allow: String(PERMISSIONS.SEND_MESSAGES | PERMISSIONS.MANAGE_MESSAGES),
            deny: '0'
          });
        }

        if (moderatorRoleId) {
          permissionOverwrites.push({
            id: moderatorRoleId,
            type: 0,
            allow: String(PERMISSIONS.SEND_MESSAGES | PERMISSIONS.MANAGE_MESSAGES),
            deny: '0'
          });
        }
      }

      // Team-only channels
      if (channelData.teamOnly) {
        permissionOverwrites.push({
          id: everyoneRoleId,
          type: 0,
          deny: String(PERMISSIONS.VIEW_CHANNEL),
          allow: '0'
        });

        if (teamRoleId) {
          permissionOverwrites.push({
            id: teamRoleId,
            type: 0,
            allow: String(PERMISSIONS.VIEW_CHANNEL | PERMISSIONS.SEND_MESSAGES | PERMISSIONS.CONNECT | PERMISSIONS.SPEAK),
            deny: '0'
          });
        }

        if (adminRoleId) {
          permissionOverwrites.push({
            id: adminRoleId,
            type: 0,
            allow: String(PERMISSIONS.VIEW_CHANNEL | PERMISSIONS.SEND_MESSAGES | PERMISSIONS.CONNECT | PERMISSIONS.SPEAK),
            deny: '0'
          });
        }
      }

      // Verification channel
      if (channelData.verificationChannel) {
        permissionOverwrites.push({
          id: everyoneRoleId,
          type: 0,
          allow: String(PERMISSIONS.VIEW_CHANNEL | PERMISSIONS.READ_MESSAGE_HISTORY),
          deny: String(PERMISSIONS.SEND_MESSAGES)
        });

        if (verifiedRoleId) {
          permissionOverwrites.push({
            id: verifiedRoleId,
            type: 0,
            deny: String(PERMISSIONS.VIEW_CHANNEL),
            allow: '0'
          });
        }
      }

      const channel = await createChannel({
        name: channelData.name,
        type: channelData.type === 'voice' ? CHANNEL_TYPES.GUILD_VOICE : CHANNEL_TYPES.GUILD_TEXT,
        parent_id: category.id,
        permission_overwrites: permissionOverwrites.length > 0 ? permissionOverwrites : undefined
      });

      if (channel) {
        console.log(`    ✅ Canal creado: ${channelData.name}`);
        channelIds[channelData.name] = channel.id;
      }
      await sleep(300);
    }
  }

  console.log('\n');

  // Step 4: Send welcome messages
  console.log('📨 Enviando mensajes de bienvenida...\n');

  // Refresh channels list
  const updatedChannels = await getGuildChannels();

  for (const [channelName, message] of Object.entries(MESSAGES)) {
    const channelId = channelIds[channelName] ||
                     updatedChannels.find(c => c.name === channelName.toLowerCase().replace(/ /g, '-'))?.id;

    if (!channelId) {
      console.log(`  ⚠️  Canal ${channelName} no encontrado`);
      continue;
    }

    // Check if channel has messages
    const existingMessages = await getChannelMessages(channelId);

    if (existingMessages.length === 0) {
      const success = await sendMessage(channelId, message);
      if (success) {
        console.log(`  ✅ Mensaje enviado a ${channelName}`);
      }
    } else {
      console.log(`  ⏭️  ${channelName} ya tiene mensajes`);
    }

    await sleep(500);
  }

  console.log('\n');

  // Summary
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('                    ✅ CONFIGURACIÓN COMPLETADA                     ');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  console.log('📋 PASOS MANUALES NECESARIOS:\n');

  console.log('1. 🤖 INSTALAR COLLAB.LAND (Token Gating) - CRÍTICO');
  console.log('   ┌──────────────────────────────────────────────────────────────┐');
  console.log('   │ a) Ve a: https://collab.land/                                │');
  console.log('   │ b) Click "Add to Server" → Selecciona "CryptoGift_Wallets_DAO"│');
  console.log('   │ c) Acepta los permisos                                       │');
  console.log('   │ d) Ve a: https://cc.collab.land/ → Login con Discord         │');
  console.log('   │ e) Selecciona tu servidor                                    │');
  console.log('   │ f) Click "Token Gating Rules" → "Create TGR"                 │');
  console.log('   │                                                              │');
  console.log('   │ CONFIGURACIÓN TGR:                                           │');
  console.log('   │ • Chain: Base                                                │');
  console.log('   │ • Token Type: ERC-20                                         │');
  console.log('   │ • Address: 0x5e3a61b550328f3D8C44f60b3e10a49D3d806175        │');
  console.log('   │                                                              │');
  console.log('   │ CREAR 4 TGRs:                                                │');
  console.log('   │ • Min 100 CGC → Rol: 🥉 Bronze Holder                        │');
  console.log('   │ • Min 1,000 CGC → Rol: 🥈 Silver Holder                      │');
  console.log('   │ • Min 10,000 CGC → Rol: 🥇 Gold Holder                       │');
  console.log('   │ • Min 100,000 CGC → Rol: 💎 Diamond Holder                   │');
  console.log('   └──────────────────────────────────────────────────────────────┘\n');

  console.log('2. 🔧 MOVER ROL DE COLLAB.LAND (después de instalarlo)');
  console.log('   ┌──────────────────────────────────────────────────────────────┐');
  console.log('   │ a) Ve a Configuración del Servidor → Roles                   │');
  console.log('   │ b) Arrastra el rol "Collab.Land" ARRIBA de todos los roles   │');
  console.log('   │    de holder (Diamond, Gold, Silver, Bronze)                 │');
  console.log('   │ c) Guarda los cambios                                        │');
  console.log('   └──────────────────────────────────────────────────────────────┘\n');

  console.log('3. 👤 ASIGNARTE ROL DE ADMIN');
  console.log('   ┌──────────────────────────────────────────────────────────────┐');
  console.log('   │ a) Click derecho en tu nombre en el servidor                 │');
  console.log('   │ b) "Roles" → Marca "🔑 Admin"                                │');
  console.log('   │ c) Asigna "👨‍💻 Team" a otros miembros del equipo              │');
  console.log('   └──────────────────────────────────────────────────────────────┘\n');

  console.log('4. 🤖 BOTS OPCIONALES (Mejoran la experiencia)');
  console.log('   ┌──────────────────────────────────────────────────────────────┐');
  console.log('   │ • Carl-bot (Reaction Roles): https://carl.gg/                │');
  console.log('   │ • MEE6 (Moderación): https://mee6.xyz/                       │');
  console.log('   │ • Ticket Tool (Soporte): https://tickettool.xyz/             │');
  console.log('   └──────────────────────────────────────────────────────────────┘\n');

  console.log('═══════════════════════════════════════════════════════════════════\n');
  console.log('👋 ¡Script finalizado!\n');
}

// Run the setup
setupDiscordServer().catch(console.error);
