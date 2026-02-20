/**
 * Discord Commands Registration Endpoint
 *
 * Registers slash commands with Discord API
 * Call this endpoint after deploying to set up commands
 */

import { NextRequest, NextResponse } from 'next/server'
import { registerCommands, getCommands, SLASH_COMMANDS } from '@/lib/discord/bot/utils/register-commands'

const APPLICATION_ID = process.env.DISCORD_APPLICATION_ID
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN
const GUILD_ID = process.env.DISCORD_GUILD_ID // Optional: for guild-specific commands

/**
 * POST /api/discord/register-commands
 *
 * Registers all slash commands with Discord
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin authorization (simple secret key check)
    const authHeader = request.headers.get('authorization')
    const expectedKey = process.env.DISCORD_ADMIN_SECRET

    if (expectedKey && authHeader !== `Bearer ${expectedKey}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!APPLICATION_ID || !BOT_TOKEN) {
      return NextResponse.json(
        { error: 'Missing DISCORD_APPLICATION_ID or DISCORD_BOT_TOKEN' },
        { status: 500 }
      )
    }

    // Check if we should register globally or to a specific guild
    const url = new URL(request.url)
    const guildId = url.searchParams.get('guild') || GUILD_ID

    console.log(`[Discord] Registering ${SLASH_COMMANDS.length} commands...`)
    console.log(`[Discord] Mode: ${guildId ? `Guild (${guildId})` : 'Global'}`)

    await registerCommands(APPLICATION_ID, BOT_TOKEN, guildId || undefined)

    return NextResponse.json({
      success: true,
      message: `Successfully registered ${SLASH_COMMANDS.length} commands`,
      mode: guildId ? 'guild' : 'global',
      guildId: guildId || null,
      commands: SLASH_COMMANDS.map((cmd) => cmd.name),
    })
  } catch (error) {
    console.error('[Discord] Registration error:', error)
    return NextResponse.json(
      {
        error: 'Failed to register commands',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/discord/register-commands
 *
 * Gets all registered commands
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin authorization
    const authHeader = request.headers.get('authorization')
    const expectedKey = process.env.DISCORD_ADMIN_SECRET

    if (expectedKey && authHeader !== `Bearer ${expectedKey}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!APPLICATION_ID || !BOT_TOKEN) {
      return NextResponse.json(
        { error: 'Missing DISCORD_APPLICATION_ID or DISCORD_BOT_TOKEN' },
        { status: 500 }
      )
    }

    const url = new URL(request.url)
    const guildId = url.searchParams.get('guild') || GUILD_ID

    const commands = await getCommands(APPLICATION_ID, BOT_TOKEN, guildId || undefined)

    return NextResponse.json({
      success: true,
      mode: guildId ? 'guild' : 'global',
      guildId: guildId || null,
      count: commands.length,
      commands: commands.map((cmd: any) => ({
        id: cmd.id,
        name: cmd.name,
        description: cmd.description,
        options: cmd.options?.length || 0,
      })),
    })
  } catch (error) {
    console.error('[Discord] Get commands error:', error)
    return NextResponse.json(
      {
        error: 'Failed to get commands',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
