/**
 * Register Discord Slash Commands
 *
 * Run with: node scripts/register-discord-commands.js
 *
 * This script registers all slash commands for the CryptoGift DAO Discord bot
 */

require('dotenv').config({ path: '.env.local' });

const DISCORD_APPLICATION_ID = process.env.DISCORD_APPLICATION_ID || '1451739412139610287';
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID || '1440971032818090006';

if (!DISCORD_BOT_TOKEN) {
  console.error('❌ DISCORD_BOT_TOKEN is required');
  console.log('Set it via environment variable or in .env.local');
  process.exit(1);
}

const commands = [
  {
    name: 'propose',
    description: 'Propose a new task for the DAO community',
    options: [
      {
        name: 'title',
        description: 'Title of the task proposal',
        type: 3, // STRING
        required: true,
      },
      {
        name: 'description',
        description: 'Detailed description of the task',
        type: 3, // STRING
        required: true,
      },
      {
        name: 'category',
        description: 'Category of the task',
        type: 3, // STRING
        required: false,
        choices: [
          { name: 'Development', value: 'development' },
          { name: 'Design', value: 'design' },
          { name: 'Content', value: 'content' },
          { name: 'Marketing', value: 'marketing' },
          { name: 'Community', value: 'community' },
        ],
      },
      {
        name: 'reward',
        description: 'Suggested CGC reward amount',
        type: 4, // INTEGER
        required: false,
      },
    ],
  },
  {
    name: 'tasks',
    description: 'View available tasks in the DAO',
    options: [
      {
        name: 'status',
        description: 'Filter by task status',
        type: 3, // STRING
        required: false,
        choices: [
          { name: 'Available', value: 'available' },
          { name: 'In Progress', value: 'in_progress' },
          { name: 'Completed', value: 'completed' },
        ],
      },
      {
        name: 'category',
        description: 'Filter by category',
        type: 3, // STRING
        required: false,
        choices: [
          { name: 'Development', value: 'development' },
          { name: 'Design', value: 'design' },
          { name: 'Content', value: 'content' },
          { name: 'Marketing', value: 'marketing' },
          { name: 'Community', value: 'community' },
        ],
      },
    ],
  },
  {
    name: 'claim',
    description: 'Claim an available task to work on',
    options: [
      {
        name: 'task_id',
        description: 'The ID of the task to claim',
        type: 3, // STRING
        required: true,
      },
    ],
  },
  {
    name: 'vote',
    description: 'Vote on a task proposal',
    options: [
      {
        name: 'proposal_id',
        description: 'The ID of the proposal',
        type: 3, // STRING
        required: true,
      },
      {
        name: 'vote',
        description: 'Your vote',
        type: 3, // STRING
        required: true,
        choices: [
          { name: 'Upvote', value: 'up' },
          { name: 'Downvote', value: 'down' },
        ],
      },
      {
        name: 'comment',
        description: 'Optional comment with your vote',
        type: 3, // STRING
        required: false,
      },
    ],
  },
  {
    name: 'approve',
    description: '[Moderator] Approve a pending proposal',
    options: [
      {
        name: 'proposal_id',
        description: 'The ID of the proposal to approve',
        type: 3, // STRING
        required: true,
      },
    ],
  },
  {
    name: 'reject',
    description: '[Moderator] Reject a pending proposal',
    options: [
      {
        name: 'proposal_id',
        description: 'The ID of the proposal to reject',
        type: 3, // STRING
        required: true,
      },
      {
        name: 'reason',
        description: 'Reason for rejection',
        type: 3, // STRING
        required: false,
      },
    ],
  },
  {
    name: 'my-tasks',
    description: 'View your claimed and completed tasks',
  },
  {
    name: 'my-proposals',
    description: 'View proposals you have submitted',
  },
  {
    name: 'link-wallet',
    description: 'Link your wallet address to your Discord account',
    options: [
      {
        name: 'wallet',
        description: 'Your Ethereum wallet address (0x...)',
        type: 3, // STRING
        required: true,
      },
    ],
  },
  {
    name: 'leaderboard',
    description: 'View the top contributors leaderboard',
    options: [
      {
        name: 'period',
        description: 'Time period for the leaderboard',
        type: 3, // STRING
        required: false,
        choices: [
          { name: 'This Week', value: 'week' },
          { name: 'This Month', value: 'month' },
          { name: 'All Time', value: 'all' },
        ],
      },
    ],
  },
  {
    name: 'help',
    description: 'Get help with CryptoGift DAO bot commands',
  },
  {
    name: 'stats',
    description: 'View DAO statistics and metrics',
  },
];

async function registerCommands() {
  console.log('🚀 Registering Discord slash commands...\n');

  // Register to guild (faster for testing) or global
  const url = `https://discord.com/api/v10/applications/${DISCORD_APPLICATION_ID}/guilds/${DISCORD_GUILD_ID}/commands`;

  console.log(`📌 Application ID: ${DISCORD_APPLICATION_ID}`);
  console.log(`📌 Guild ID: ${DISCORD_GUILD_ID}`);
  console.log(`📌 Registering ${commands.length} commands...\n`);

  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
      },
      body: JSON.stringify(commands),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Failed to register commands:', response.status);
      console.error(error);
      process.exit(1);
    }

    const data = await response.json();
    console.log('✅ Successfully registered commands:\n');

    for (const cmd of data) {
      console.log(`   /${cmd.name} - ${cmd.description.substring(0, 50)}...`);
    }

    console.log('\n🎉 All commands registered successfully!');
    console.log('\n📋 Endpoint URL (already configured):');
    console.log('   https://www.mbxarts.com/api/discord/interactions');
    console.log('\n🎮 Test the bot in Discord with /help');

  } catch (error) {
    console.error('❌ Error registering commands:', error);
    process.exit(1);
  }
}

registerCommands();
