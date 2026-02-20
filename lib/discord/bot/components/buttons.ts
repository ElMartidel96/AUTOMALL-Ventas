/**
 * Discord Button Components
 *
 * Button builders for interactive messages
 */

import { ButtonStyle, ComponentType, type ActionRow, type ButtonComponent } from '../types'

/**
 * Create a button component
 */
function button(options: {
  customId?: string
  label: string
  style: ButtonStyle
  emoji?: string
  url?: string
  disabled?: boolean
}): ButtonComponent {
  const btn: ButtonComponent = {
    type: ComponentType.BUTTON,
    style: options.style,
    label: options.label,
    disabled: options.disabled,
  }

  if (options.customId) {
    btn.custom_id = options.customId
  }

  if (options.url) {
    btn.url = options.url
  }

  if (options.emoji) {
    btn.emoji = { name: options.emoji }
  }

  return btn
}

/**
 * Create an action row with buttons
 */
function actionRow(buttons: ButtonComponent[]): ActionRow {
  return {
    type: ComponentType.ACTION_ROW,
    components: buttons,
  }
}

// ============================================================================
// PROPOSAL BUTTONS
// ============================================================================

/**
 * Voting buttons for a proposal
 */
export function proposalVoteButtons(proposalId: string): ActionRow[] {
  return [
    actionRow([
      button({
        customId: `vote_up:${proposalId}`,
        label: 'Votar a Favor',
        style: ButtonStyle.SUCCESS,
        emoji: '✅',
      }),
      button({
        customId: `vote_down:${proposalId}`,
        label: 'Votar en Contra',
        style: ButtonStyle.DANGER,
        emoji: '❌',
      }),
      button({
        customId: `view_proposal:${proposalId}`,
        label: 'Ver Detalles',
        style: ButtonStyle.SECONDARY,
        emoji: '📋',
      }),
    ]),
  ]
}

/**
 * Moderator action buttons for a proposal
 */
export function proposalModButtons(proposalId: string): ActionRow[] {
  return [
    actionRow([
      button({
        customId: `approve_proposal:${proposalId}`,
        label: 'Aprobar',
        style: ButtonStyle.SUCCESS,
        emoji: '✅',
      }),
      button({
        customId: `reject_proposal:${proposalId}`,
        label: 'Rechazar',
        style: ButtonStyle.DANGER,
        emoji: '❌',
      }),
      button({
        customId: `refine_proposal:${proposalId}`,
        label: 'Refinar con IA',
        style: ButtonStyle.PRIMARY,
        emoji: '🤖',
      }),
    ]),
  ]
}

// ============================================================================
// TASK BUTTONS
// ============================================================================

/**
 * Task action buttons
 */
export function taskActionButtons(taskId: string): ActionRow[] {
  return [
    actionRow([
      button({
        customId: `claim_task:${taskId}`,
        label: 'Reclamar Tarea',
        style: ButtonStyle.SUCCESS,
        emoji: '🎯',
      }),
      button({
        customId: `view_task:${taskId}`,
        label: 'Ver Detalles',
        style: ButtonStyle.SECONDARY,
        emoji: '📋',
      }),
      button({
        label: 'Ver en Web',
        style: ButtonStyle.LINK,
        url: `https://cryptogift.mbxarts.com/tasks?id=${taskId}`,
        emoji: '🌐',
      }),
    ]),
  ]
}

/**
 * Task claimed buttons (for assignee)
 */
export function taskClaimedButtons(taskId: string): ActionRow[] {
  return [
    actionRow([
      button({
        customId: `submit_task:${taskId}`,
        label: 'Enviar Completada',
        style: ButtonStyle.SUCCESS,
        emoji: '📤',
      }),
      button({
        customId: `abandon_task:${taskId}`,
        label: 'Abandonar',
        style: ButtonStyle.DANGER,
        emoji: '🚫',
      }),
      button({
        label: 'Subir Evidencia',
        style: ButtonStyle.LINK,
        url: `https://cryptogift.mbxarts.com/tasks/${taskId}/submit`,
        emoji: '📎',
      }),
    ]),
  ]
}

// ============================================================================
// PAGINATION BUTTONS
// ============================================================================

/**
 * Pagination buttons for lists
 */
export function paginationButtons(
  prefix: string,
  currentPage: number,
  totalPages: number,
  filter?: string
): ActionRow[] {
  const filterParam = filter ? `:${filter}` : ''

  return [
    actionRow([
      button({
        customId: `${prefix}_first${filterParam}`,
        label: '⏮️',
        style: ButtonStyle.SECONDARY,
        disabled: currentPage <= 1,
      }),
      button({
        customId: `${prefix}_prev:${currentPage - 1}${filterParam}`,
        label: '◀️',
        style: ButtonStyle.SECONDARY,
        disabled: currentPage <= 1,
      }),
      button({
        customId: `${prefix}_page`,
        label: `${currentPage}/${totalPages}`,
        style: ButtonStyle.SECONDARY,
        disabled: true,
      }),
      button({
        customId: `${prefix}_next:${currentPage + 1}${filterParam}`,
        label: '▶️',
        style: ButtonStyle.SECONDARY,
        disabled: currentPage >= totalPages,
      }),
      button({
        customId: `${prefix}_last:${totalPages}${filterParam}`,
        label: '⏭️',
        style: ButtonStyle.SECONDARY,
        disabled: currentPage >= totalPages,
      }),
    ]),
  ]
}

// ============================================================================
// UTILITY BUTTONS
// ============================================================================

/**
 * Confirm/Cancel buttons
 */
export function confirmButtons(actionId: string): ActionRow[] {
  return [
    actionRow([
      button({
        customId: `confirm:${actionId}`,
        label: 'Confirmar',
        style: ButtonStyle.SUCCESS,
        emoji: '✅',
      }),
      button({
        customId: `cancel:${actionId}`,
        label: 'Cancelar',
        style: ButtonStyle.DANGER,
        emoji: '❌',
      }),
    ]),
  ]
}

/**
 * Link to website button
 */
export function websiteButton(path = ''): ActionRow[] {
  return [
    actionRow([
      button({
        label: 'Ver en CryptoGift',
        style: ButtonStyle.LINK,
        url: `https://cryptogift.mbxarts.com${path}`,
        emoji: '🌐',
      }),
    ]),
  ]
}

/**
 * Help and info buttons
 */
export function helpButtons(): ActionRow[] {
  return [
    actionRow([
      button({
        label: 'Website',
        style: ButtonStyle.LINK,
        url: 'https://cryptogift.mbxarts.com',
        emoji: '🌐',
      }),
      button({
        label: 'Tareas',
        style: ButtonStyle.LINK,
        url: 'https://cryptogift.mbxarts.com/tasks',
        emoji: '📋',
      }),
      button({
        label: 'Documentación',
        style: ButtonStyle.LINK,
        url: 'https://cryptogift.mbxarts.com/docs',
        emoji: '📚',
      }),
    ]),
  ]
}
