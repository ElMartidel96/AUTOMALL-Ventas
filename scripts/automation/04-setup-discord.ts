import { 
  Client, 
  GatewayIntentBits, 
  REST, 
  Routes,
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  Guild,
  Role
} from "discord.js";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Discord Bot Setup Automation
 * 
 * This script automates:
 * 1. Bot configuration and deployment
 * 2. Server setup (roles, channels)
 * 3. Command registration
 * 4. Token gating integration
 * 5. Notification system
 */

interface DiscordConfig {
  botToken: string;
  clientId: string;
  guildId: string;
  adminRoleId?: string;
}

interface RoleConfig {
  name: string;
  color: number;
  permissions: bigint[];
  position?: number;
  hoist?: boolean;
  mentionable?: boolean;
}

interface ChannelConfig {
  name: string;
  type: ChannelType;
  topic?: string;
  parent?: string;
  permissionOverwrites?: any[];
}

class DiscordAutomation {
  private client: Client;
  private rest: REST;
  private config: DiscordConfig;
  private commands: any[] = [];
  
  constructor() {
    this.config = {
      botToken: process.env.DISCORD_BOT_TOKEN || "",
      clientId: process.env.DISCORD_CLIENT_ID || "",
      guildId: process.env.DISCORD_GUILD_ID || ""
    };
    
    if (!this.config.botToken) {
      throw new Error("DISCORD_BOT_TOKEN not found in .env");
    }
    
    if (!this.config.clientId) {
      throw new Error("DISCORD_CLIENT_ID not found in .env");
    }
    
    if (!this.config.guildId) {
      throw new Error("DISCORD_GUILD_ID not found in .env");
    }
    
    // Initialize Discord client
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildPresences
      ]
    });
    
    // Initialize REST client
    this.rest = new REST({ version: "10" }).setToken(this.config.botToken);
    
    this.setupCommands();
    this.setupEventHandlers();
  }
  
  /**
   * Setup slash commands
   */
  private setupCommands() {
    // Verify command
    const verifyCommand = new SlashCommandBuilder()
      .setName("verify")
      .setDescription("Verify your wallet ownership")
      .addStringOption(option =>
        option.setName("wallet")
          .setDescription("Your wallet address")
          .setRequired(true)
      );
    
    // Stats command
    const statsCommand = new SlashCommandBuilder()
      .setName("stats")
      .setDescription("View your DAO statistics");
    
    // Claim command
    const claimCommand = new SlashCommandBuilder()
      .setName("claim")
      .setDescription("Claim your rewards")
      .addStringOption(option =>
        option.setName("type")
          .setDescription("Type of reward to claim")
          .setRequired(true)
          .addChoices(
            { name: "Daily", value: "daily" },
            { name: "Weekly", value: "weekly" },
            { name: "Quest", value: "quest" }
          )
      );
    
    // Leaderboard command
    const leaderboardCommand = new SlashCommandBuilder()
      .setName("leaderboard")
      .setDescription("View the community leaderboard")
      .addNumberOption(option =>
        option.setName("limit")
          .setDescription("Number of entries to show")
          .setMinValue(5)
          .setMaxValue(50)
      );
    
    // Admin: Setup command
    const setupCommand = new SlashCommandBuilder()
      .setName("setup")
      .setDescription("Setup server channels and roles")
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);
    
    // Admin: Airdrop command
    const airdropCommand = new SlashCommandBuilder()
      .setName("airdrop")
      .setDescription("Distribute tokens to role members")
      .addRoleOption(option =>
        option.setName("role")
          .setDescription("Role to receive airdrop")
          .setRequired(true)
      )
      .addNumberOption(option =>
        option.setName("amount")
          .setDescription("Amount per user")
          .setRequired(true)
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);
    
    this.commands = [
      verifyCommand,
      statsCommand,
      claimCommand,
      leaderboardCommand,
      setupCommand,
      airdropCommand
    ];
  }
  
  /**
   * Setup event handlers
   */
  private setupEventHandlers() {
    this.client.once("ready", () => {
      console.log(`✅ Bot logged in as ${this.client.user?.tag}`);
    });
    
    this.client.on("interactionCreate", async (interaction) => {
      if (!interaction.isChatInputCommand()) return;
      
      console.log(`📝 Command received: ${interaction.commandName}`);
      
      try {
        switch (interaction.commandName) {
          case "verify":
            await this.handleVerify(interaction);
            break;
          
          case "stats":
            await this.handleStats(interaction);
            break;
          
          case "claim":
            await this.handleClaim(interaction);
            break;
          
          case "leaderboard":
            await this.handleLeaderboard(interaction);
            break;
          
          case "setup":
            await this.handleSetup(interaction);
            break;
          
          case "airdrop":
            await this.handleAirdrop(interaction);
            break;
          
          default:
            await interaction.reply("Unknown command");
        }
      } catch (error) {
        console.error(`❌ Error handling command:`, error);
        
        const errorMessage = "An error occurred while processing your command.";
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ content: errorMessage, ephemeral: true });
        } else {
          await interaction.reply({ content: errorMessage, ephemeral: true });
        }
      }
    });
    
    this.client.on("guildMemberAdd", async (member) => {
      console.log(`👋 New member joined: ${member.user.tag}`);
      // Send welcome message
      // Auto-assign roles
      // Create onboarding flow
    });
  }
  
  /**
   * Connect bot to Discord
   */
  async connect(): Promise<void> {
    console.log("\n🤖 Connecting Discord bot...");
    await this.client.login(this.config.botToken);
  }
  
  /**
   * Register slash commands
   */
  async registerCommands(): Promise<void> {
    console.log("\n📝 Registering slash commands...");
    
    try {
      console.log(`Started refreshing ${this.commands.length} application (/) commands.`);
      
      const data = await this.rest.put(
        Routes.applicationGuildCommands(this.config.clientId, this.config.guildId),
        { body: this.commands.map(cmd => cmd.toJSON()) }
      );
      
      console.log(`✅ Successfully registered ${(data as any[]).length} commands`);
    } catch (error) {
      console.error("❌ Error registering commands:", error);
      throw error;
    }
  }
  
  /**
   * Create server roles
   */
  async createRoles(guild: Guild): Promise<Map<string, Role>> {
    console.log("\n👥 Creating server roles...");
    
    const roles = new Map<string, Role>();
    
    const roleConfigs: RoleConfig[] = [
      {
        name: "DAO Member",
        color: 0x3498db, // Blue
        permissions: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory
        ],
        hoist: true,
        mentionable: true
      },
      {
        name: "Contributor",
        color: 0x2ecc71, // Green
        permissions: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.AttachFiles,
          PermissionFlagsBits.EmbedLinks
        ],
        hoist: true
      },
      {
        name: "Core Team",
        color: 0xe74c3c, // Red
        permissions: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ManageMessages,
          PermissionFlagsBits.ManageChannels,
          PermissionFlagsBits.MentionEveryone
        ],
        hoist: true
      },
      {
        name: "Verified",
        color: 0x9b59b6, // Purple
        permissions: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages
        ]
      },
      {
        name: "Quest Master",
        color: 0xf39c12, // Orange
        permissions: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.UseExternalEmojis
        ]
      }
    ];
    
    for (const config of roleConfigs) {
      try {
        // Check if role already exists
        let role = guild.roles.cache.find(r => r.name === config.name);
        
        if (!role) {
          role = await guild.roles.create({
            name: config.name,
            color: config.color,
            permissions: config.permissions,
            hoist: config.hoist,
            mentionable: config.mentionable
          });
          console.log(`✅ Created role: ${config.name}`);
        } else {
          console.log(`⚠️ Role already exists: ${config.name}`);
        }
        
        roles.set(config.name, role);
      } catch (error) {
        console.error(`❌ Failed to create role ${config.name}:`, error);
      }
    }
    
    return roles;
  }
  
  /**
   * Create server channels
   */
  async createChannels(guild: Guild): Promise<void> {
    console.log("\n💬 Creating server channels...");
    
    const channelConfigs: ChannelConfig[] = [
      // Categories
      {
        name: "📢 INFORMATION",
        type: ChannelType.GuildCategory
      },
      {
        name: "💬 COMMUNITY",
        type: ChannelType.GuildCategory
      },
      {
        name: "🎮 QUESTS",
        type: ChannelType.GuildCategory
      },
      {
        name: "🏛️ GOVERNANCE",
        type: ChannelType.GuildCategory
      },
      
      // Information channels
      {
        name: "welcome",
        type: ChannelType.GuildText,
        topic: "Welcome to CryptoGift Wallets DAO!",
        parent: "📢 INFORMATION"
      },
      {
        name: "announcements",
        type: ChannelType.GuildText,
        topic: "Official announcements",
        parent: "📢 INFORMATION"
      },
      {
        name: "rules",
        type: ChannelType.GuildText,
        topic: "Community rules and guidelines",
        parent: "📢 INFORMATION"
      },
      
      // Community channels
      {
        name: "general",
        type: ChannelType.GuildText,
        topic: "General discussion",
        parent: "💬 COMMUNITY"
      },
      {
        name: "introductions",
        type: ChannelType.GuildText,
        topic: "Introduce yourself to the community",
        parent: "💬 COMMUNITY"
      },
      
      // Quest channels
      {
        name: "quest-board",
        type: ChannelType.GuildText,
        topic: "Active quests and challenges",
        parent: "🎮 QUESTS"
      },
      {
        name: "quest-submissions",
        type: ChannelType.GuildText,
        topic: "Submit your quest completions",
        parent: "🎮 QUESTS"
      },
      
      // Governance channels
      {
        name: "proposals",
        type: ChannelType.GuildText,
        topic: "DAO proposals and discussions",
        parent: "🏛️ GOVERNANCE"
      },
      {
        name: "voting",
        type: ChannelType.GuildText,
        topic: "Active votes and results",
        parent: "🏛️ GOVERNANCE"
      }
    ];
    
    // Create categories first
    const categories = new Map<string, any>();
    
    for (const config of channelConfigs.filter(c => c.type === ChannelType.GuildCategory)) {
      try {
        let category = guild.channels.cache.find(
          c => c.name === config.name && c.type === ChannelType.GuildCategory
        );
        
        if (!category) {
          category = await guild.channels.create({
            name: config.name,
            type: config.type
          });
          console.log(`✅ Created category: ${config.name}`);
        } else {
          console.log(`⚠️ Category already exists: ${config.name}`);
        }
        
        categories.set(config.name, category);
      } catch (error) {
        console.error(`❌ Failed to create category ${config.name}:`, error);
      }
    }
    
    // Create text channels
    for (const config of channelConfigs.filter(c => c.type === ChannelType.GuildText)) {
      try {
        let channel = guild.channels.cache.find(
          c => c.name === config.name && c.type === ChannelType.GuildText
        );
        
        if (!channel) {
          const parent = config.parent ? categories.get(config.parent) : undefined;
          
          channel = await guild.channels.create({
            name: config.name,
            type: config.type,
            topic: config.topic,
            parent: parent
          });
          console.log(`✅ Created channel: #${config.name}`);
        } else {
          console.log(`⚠️ Channel already exists: #${config.name}`);
        }
      } catch (error) {
        console.error(`❌ Failed to create channel ${config.name}:`, error);
      }
    }
  }
  
  /**
   * Command handlers
   */
  private async handleVerify(interaction: any): Promise<void> {
    const wallet = interaction.options.getString("wallet");
    await interaction.reply({
      content: `🔐 Verifying wallet: ${wallet}\n\nPlease sign the message in your wallet...`,
      ephemeral: true
    });
    
    // Implementation would include:
    // 1. Generate nonce
    // 2. Request signature
    // 3. Verify ownership
    // 4. Assign verified role
  }
  
  private async handleStats(interaction: any): Promise<void> {
    await interaction.reply({
      embeds: [{
        title: "📊 Your DAO Statistics",
        fields: [
          { name: "CGC Balance", value: "1,000 CGC", inline: true },
          { name: "Voting Power", value: "0.1%", inline: true },
          { name: "Quests Completed", value: "15", inline: true },
          { name: "Rank", value: "#42", inline: true },
          { name: "XP", value: "2,500", inline: true },
          { name: "Contributions", value: "8", inline: true }
        ],
        color: 0x3498db
      }]
    });
  }
  
  private async handleClaim(interaction: any): Promise<void> {
    const type = interaction.options.getString("type");
    await interaction.reply(`🎁 Processing ${type} reward claim...`);
    
    // Implementation would include:
    // 1. Check eligibility
    // 2. Process claim
    // 3. Create attestation
    // 4. Update database
  }
  
  private async handleLeaderboard(interaction: any): Promise<void> {
    const limit = interaction.options.getNumber("limit") || 10;
    
    await interaction.reply({
      embeds: [{
        title: "🏆 Community Leaderboard",
        description: `Top ${limit} members by XP`,
        fields: [
          { name: "1. Alice", value: "10,000 XP", inline: false },
          { name: "2. Bob", value: "8,500 XP", inline: false },
          { name: "3. Charlie", value: "7,200 XP", inline: false }
        ],
        color: 0xf39c12
      }]
    });
  }
  
  private async handleSetup(interaction: any): Promise<void> {
    await interaction.deferReply();
    
    const guild = interaction.guild;
    
    // Create roles and channels
    await this.createRoles(guild);
    await this.createChannels(guild);
    
    await interaction.editReply("✅ Server setup complete!");
  }
  
  private async handleAirdrop(interaction: any): Promise<void> {
    const role = interaction.options.getRole("role");
    const amount = interaction.options.getNumber("amount");
    
    await interaction.reply(`💰 Processing airdrop of ${amount} CGC to ${role.name} members...`);
    
    // Implementation would include:
    // 1. Get role members
    // 2. Prepare merkle tree
    // 3. Create distribution
    // 4. Notify recipients
  }
  
  /**
   * Get bot invite link
   */
  getInviteLink(): string {
    const permissions = [
      PermissionFlagsBits.Administrator // Or specific permissions
    ];
    
    const permissionValue = permissions.reduce((acc, perm) => acc | perm, 0n);
    
    return `https://discord.com/api/oauth2/authorize?client_id=${this.config.clientId}&permissions=${permissionValue}&scope=bot%20applications.commands`;
  }
  
  /**
   * Save configuration
   */
  async saveConfig(): Promise<void> {
    const configDir = path.join(__dirname, "../../config");
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    const config = {
      botToken: "HIDDEN",
      clientId: this.config.clientId,
      guildId: this.config.guildId,
      commands: this.commands.map(cmd => ({
        name: cmd.name,
        description: cmd.description
      })),
      inviteLink: this.getInviteLink(),
      createdAt: new Date().toISOString()
    };
    
    const configFile = path.join(configDir, "discord-config.json");
    fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
    
    console.log(`💾 Config saved to: ${configFile}`);
  }
}

// Main execution
async function main() {
  console.log("🚀 Starting Discord Bot Setup...");
  console.log("================================================");
  
  const discord = new DiscordAutomation();
  
  // Step 1: Connect bot
  console.log("\n📋 Step 1: Connecting Bot");
  await discord.connect();
  
  // Wait for bot to be ready
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Step 2: Register commands
  console.log("\n📋 Step 2: Registering Commands");
  await discord.registerCommands();
  
  // Step 3: Save configuration
  console.log("\n📋 Step 3: Saving Configuration");
  await discord.saveConfig();
  
  // Print invite link
  console.log("\n================================================");
  console.log("✅ DISCORD BOT SETUP COMPLETE!");
  console.log("================================================");
  console.log("\n🔗 Bot Invite Link:");
  console.log(discord.getInviteLink());
  console.log("\n📋 Next Steps:");
  console.log("1. Add bot to your server using the invite link");
  console.log("2. Run /setup command to create channels and roles");
  console.log("3. Configure token gating with your CGC token");
  console.log("4. Set up quest integration webhooks");
  console.log("5. Test commands with team members");
  
  // Keep bot running
  console.log("\n🤖 Bot is running. Press Ctrl+C to stop.");
}

// Export for use in other scripts
export { DiscordAutomation };

// Execute if run directly
if (require.main === module) {
  main().catch((error) => {
    console.error("❌ Setup failed:", error);
    process.exit(1);
  });
}