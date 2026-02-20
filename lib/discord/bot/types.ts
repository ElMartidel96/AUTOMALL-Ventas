/**
 * Discord Bot Types
 *
 * Type definitions for Discord API interactions
 */

// Discord Interaction Types (from Discord API)
export enum InteractionType {
  PING = 1,
  APPLICATION_COMMAND = 2,
  MESSAGE_COMPONENT = 3,
  APPLICATION_COMMAND_AUTOCOMPLETE = 4,
  MODAL_SUBMIT = 5,
}

export enum InteractionResponseType {
  PONG = 1,
  CHANNEL_MESSAGE_WITH_SOURCE = 4,
  DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE = 5,
  DEFERRED_UPDATE_MESSAGE = 6,
  UPDATE_MESSAGE = 7,
  APPLICATION_COMMAND_AUTOCOMPLETE_RESULT = 8,
  MODAL = 9,
}

export enum ApplicationCommandType {
  CHAT_INPUT = 1, // Slash command
  USER = 2,
  MESSAGE = 3,
}

export enum ApplicationCommandOptionType {
  SUB_COMMAND = 1,
  SUB_COMMAND_GROUP = 2,
  STRING = 3,
  INTEGER = 4,
  BOOLEAN = 5,
  USER = 6,
  CHANNEL = 7,
  ROLE = 8,
  MENTIONABLE = 9,
  NUMBER = 10,
  ATTACHMENT = 11,
}

export enum ComponentType {
  ACTION_ROW = 1,
  BUTTON = 2,
  STRING_SELECT = 3,
  TEXT_INPUT = 4,
  USER_SELECT = 5,
  ROLE_SELECT = 6,
  MENTIONABLE_SELECT = 7,
  CHANNEL_SELECT = 8,
}

export enum ButtonStyle {
  PRIMARY = 1,
  SECONDARY = 2,
  SUCCESS = 3,
  DANGER = 4,
  LINK = 5,
}

export enum TextInputStyle {
  SHORT = 1,
  PARAGRAPH = 2,
}

// Discord User
export interface DiscordUser {
  id: string
  username: string
  discriminator: string
  global_name?: string
  avatar?: string
  bot?: boolean
  system?: boolean
  banner?: string
  accent_color?: number
}

// Discord Member (in guild context)
export interface DiscordMember {
  user?: DiscordUser
  nick?: string
  avatar?: string
  roles: string[]
  joined_at: string
  premium_since?: string
  deaf: boolean
  mute: boolean
  pending?: boolean
  permissions?: string
}

// Interaction Data
export interface InteractionData {
  id: string
  name: string
  type: ApplicationCommandType
  resolved?: {
    users?: Record<string, DiscordUser>
    members?: Record<string, DiscordMember>
    roles?: Record<string, any>
    channels?: Record<string, any>
  }
  options?: CommandOption[]
  custom_id?: string
  component_type?: ComponentType
  values?: string[]
  components?: any[]
}

export interface CommandOption {
  name: string
  type: ApplicationCommandOptionType
  value?: string | number | boolean
  options?: CommandOption[]
  focused?: boolean
}

// Main Interaction Object
export interface DiscordInteraction {
  id: string
  application_id: string
  type: InteractionType
  data?: InteractionData
  guild_id?: string
  channel_id?: string
  member?: DiscordMember
  user?: DiscordUser
  token: string
  version: number
  message?: any
  app_permissions?: string
  locale?: string
  guild_locale?: string
}

// Embed Object
export interface DiscordEmbed {
  title?: string
  type?: 'rich' | 'image' | 'video' | 'gifv' | 'article' | 'link'
  description?: string
  url?: string
  timestamp?: string
  color?: number
  footer?: {
    text: string
    icon_url?: string
  }
  image?: {
    url: string
  }
  thumbnail?: {
    url: string
  }
  author?: {
    name: string
    url?: string
    icon_url?: string
  }
  fields?: Array<{
    name: string
    value: string
    inline?: boolean
  }>
}

// Button Component
export interface ButtonComponent {
  type: ComponentType.BUTTON
  style: ButtonStyle
  label?: string
  emoji?: {
    id?: string
    name?: string
    animated?: boolean
  }
  custom_id?: string
  url?: string
  disabled?: boolean
}

// Select Menu Option
export interface SelectOption {
  label: string
  value: string
  description?: string
  emoji?: {
    id?: string
    name?: string
    animated?: boolean
  }
  default?: boolean
}

// Select Menu Component
export interface SelectMenuComponent {
  type: ComponentType.STRING_SELECT
  custom_id: string
  options: SelectOption[]
  placeholder?: string
  min_values?: number
  max_values?: number
  disabled?: boolean
}

// Text Input Component
export interface TextInputComponent {
  type: ComponentType.TEXT_INPUT
  custom_id: string
  style: TextInputStyle
  label: string
  min_length?: number
  max_length?: number
  required?: boolean
  value?: string
  placeholder?: string
}

// Action Row
export interface ActionRow {
  type: ComponentType.ACTION_ROW
  components: (ButtonComponent | SelectMenuComponent | TextInputComponent)[]
}

// Interaction Response
export interface InteractionResponse {
  type: InteractionResponseType
  data?: {
    tts?: boolean
    content?: string
    embeds?: DiscordEmbed[]
    allowed_mentions?: {
      parse?: ('roles' | 'users' | 'everyone')[]
      roles?: string[]
      users?: string[]
      replied_user?: boolean
    }
    flags?: number
    components?: ActionRow[]
    attachments?: any[]
    custom_id?: string
    title?: string
  }
}

// Command Definition
export interface SlashCommand {
  name: string
  description: string
  type?: ApplicationCommandType
  options?: CommandOptionDefinition[]
  default_member_permissions?: string
  dm_permission?: boolean
  nsfw?: boolean
}

export interface CommandOptionDefinition {
  name: string
  description: string
  type: ApplicationCommandOptionType
  required?: boolean
  choices?: Array<{
    name: string
    value: string | number
  }>
  options?: CommandOptionDefinition[]
  channel_types?: number[]
  min_value?: number
  max_value?: number
  min_length?: number
  max_length?: number
  autocomplete?: boolean
}

// Modal
export interface Modal {
  custom_id: string
  title: string
  components: ActionRow[]
}

// Message Flags
export enum MessageFlags {
  CROSSPOSTED = 1 << 0,
  IS_CROSSPOST = 1 << 1,
  SUPPRESS_EMBEDS = 1 << 2,
  SOURCE_MESSAGE_DELETED = 1 << 3,
  URGENT = 1 << 4,
  HAS_THREAD = 1 << 5,
  EPHEMERAL = 1 << 6,
  LOADING = 1 << 7,
  FAILED_TO_MENTION_SOME_ROLES_IN_THREAD = 1 << 8,
  SUPPRESS_NOTIFICATIONS = 1 << 12,
  IS_VOICE_MESSAGE = 1 << 13,
}

// Colors for embeds
export const EmbedColors = {
  PRIMARY: 0x5865f2, // Discord blurple
  SUCCESS: 0x57f287, // Green
  WARNING: 0xfee75c, // Yellow
  ERROR: 0xed4245, // Red
  INFO: 0x3498db, // Blue
  PURPLE: 0x9b59b6,
  CYAN: 0x00bcd4,
  ORANGE: 0xf39c12,
  CGC_BRAND: 0x8b5cf6, // Purple (CGC brand)
}

// Proposal Status
export type ProposalStatus = 'pending' | 'voting' | 'approved' | 'rejected' | 'converted'

// Proposal from database
export interface Proposal {
  id: string
  title: string
  description: string | null
  source: 'discord' | 'web'
  proposed_by_wallet: string | null
  proposed_by_discord_id: string | null
  proposed_by_discord_username: string | null
  discord_message_id: string | null
  discord_channel_id: string | null
  discord_thread_id: string | null
  votes_up: number
  votes_down: number
  suggested_domain: string | null
  suggested_category: string | null
  suggested_reward: number | null
  suggested_complexity: number | null
  ai_refined_title: string | null
  ai_refined_description: string | null
  status: ProposalStatus
  approved_by_wallet: string | null
  approved_by_discord_id: string | null
  approved_at: string | null
  rejection_reason: string | null
  resulting_task_id: string | null
  created_at: string
  updated_at: string
}
