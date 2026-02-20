/**
 * Discord Interactions Endpoint
 *
 * Handles all Discord slash commands and interactions
 * This is the main entry point for the Discord bot
 */

// Force Node.js runtime (Edge Runtime has issues with tweetnacl)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import {
  InteractionType,
  InteractionResponseType,
  type DiscordInteraction,
  type InteractionResponse,
} from '@/lib/discord/bot/types'
import {
  verifyDiscordSignature,
  verifyDiscordSignatureNacl,
  getSignatureHeaders,
} from '@/lib/discord/bot/utils/verify-signature'
import {
  handlePropose,
  handleTasks,
  handleClaim,
  handleVote,
  handleApprove,
  handleReject,
  handleMyTasks,
  handleMyProposals,
  handleLinkWallet,
  handleLeaderboard,
  handleHelp,
  handleStats,
} from '@/lib/discord/bot/handlers/command-handlers'
import {
  routeButtonInteraction,
  routeModalSubmission,
} from '@/lib/discord/bot/handlers/component-handlers'
import { errorEmbed } from '@/lib/discord/bot/components/embeds'

/**
 * POST /api/discord/interactions
 *
 * Main endpoint for Discord interactions
 */
export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const body = await request.text()
    const { signature, timestamp } = getSignatureHeaders(request.headers)

    console.log('[Discord] Received request, checking signature...')
    console.log('[Discord] Has PUBLIC_KEY:', !!process.env.DISCORD_PUBLIC_KEY)

    if (!signature || !timestamp) {
      console.error('[Discord] Missing signature headers')
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
    }

    // Verify the signature using tweetnacl
    const isValid = await verifyDiscordSignature(body, signature, timestamp)

    if (!isValid) {
      console.error('[Discord] Invalid signature - verification failed')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    console.log('[Discord] Signature verified successfully!')

    // Parse the interaction
    const interaction: DiscordInteraction = JSON.parse(body)

    console.log(`[Discord] Interaction received: type=${interaction.type}, data=${JSON.stringify(interaction.data?.name || interaction.data?.custom_id)}`)

    // Handle the interaction based on type
    let response: InteractionResponse

    switch (interaction.type) {
      case InteractionType.PING:
        // Discord sends a PING to verify the endpoint
        response = { type: InteractionResponseType.PONG }
        break

      case InteractionType.APPLICATION_COMMAND:
        // Slash command
        response = await handleSlashCommand(interaction)
        break

      case InteractionType.MESSAGE_COMPONENT:
        // Button click or select menu
        response = await routeButtonInteraction(interaction)
        break

      case InteractionType.MODAL_SUBMIT:
        // Modal form submission
        response = await routeModalSubmission(interaction)
        break

      case InteractionType.APPLICATION_COMMAND_AUTOCOMPLETE:
        // Autocomplete (not implemented yet)
        // Cast to unknown first to handle the different response structure
        response = {
          type: InteractionResponseType.APPLICATION_COMMAND_AUTOCOMPLETE_RESULT,
          data: { choices: [] },
        } as unknown as InteractionResponse
        break

      default:
        console.warn(`[Discord] Unknown interaction type: ${interaction.type}`)
        response = {
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            embeds: [errorEmbed('Error', 'Tipo de interacción no soportado')],
            flags: 64, // Ephemeral
          },
        }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[Discord] Interaction error:', error)
    return NextResponse.json(
      {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          embeds: [errorEmbed('Error', 'Ha ocurrido un error procesando tu solicitud')],
          flags: 64,
        },
      },
      { status: 200 } // Discord expects 200 even for errors
    )
  }
}

/**
 * Route slash commands to handlers
 */
async function handleSlashCommand(
  interaction: DiscordInteraction
): Promise<InteractionResponse> {
  const commandName = interaction.data?.name

  console.log(`[Discord] Processing command: /${commandName}`)

  try {
    switch (commandName) {
      case 'propose':
        return await handlePropose(interaction)

      case 'tasks':
        return await handleTasks(interaction)

      case 'claim':
        return await handleClaim(interaction)

      case 'vote':
        return await handleVote(interaction)

      case 'approve':
        return await handleApprove(interaction)

      case 'reject':
        return await handleReject(interaction)

      case 'my-tasks':
        return await handleMyTasks(interaction)

      case 'my-proposals':
        return await handleMyProposals(interaction)

      case 'link-wallet':
        return await handleLinkWallet(interaction)

      case 'leaderboard':
        return await handleLeaderboard(interaction)

      case 'help':
        return await handleHelp(interaction)

      case 'stats':
        return await handleStats(interaction)

      default:
        console.warn(`[Discord] Unknown command: ${commandName}`)
        return {
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            embeds: [
              errorEmbed(
                'Comando Desconocido',
                `El comando \`/${commandName}\` no está implementado.\n\nUsa \`/help\` para ver los comandos disponibles.`
              ),
            ],
            flags: 64,
          },
        }
    }
  } catch (error) {
    console.error(`[Discord] Command error (${commandName}):`, error)
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        embeds: [
          errorEmbed(
            'Error',
            `Ha ocurrido un error ejecutando \`/${commandName}\`.\n\nPor favor intenta de nuevo o contacta a un moderador.`
          ),
        ],
        flags: 64,
      },
    }
  }
}
