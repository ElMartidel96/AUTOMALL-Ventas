/**
 * Discord Modal Components
 *
 * Modal builders for form inputs
 */

import {
  ComponentType,
  TextInputStyle,
  InteractionResponseType,
  type ActionRow,
  type TextInputComponent,
  type InteractionResponse,
} from '../types'

/**
 * Create a text input component
 */
function textInput(options: {
  customId: string
  label: string
  style?: TextInputStyle
  placeholder?: string
  value?: string
  minLength?: number
  maxLength?: number
  required?: boolean
}): TextInputComponent {
  return {
    type: ComponentType.TEXT_INPUT,
    custom_id: options.customId,
    style: options.style || TextInputStyle.SHORT,
    label: options.label,
    placeholder: options.placeholder,
    value: options.value,
    min_length: options.minLength,
    max_length: options.maxLength,
    required: options.required ?? true,
  }
}

/**
 * Create an action row with a text input
 */
function textInputRow(input: TextInputComponent): ActionRow {
  return {
    type: ComponentType.ACTION_ROW,
    components: [input],
  }
}

/**
 * Create a modal response
 */
function modal(
  customId: string,
  title: string,
  components: ActionRow[]
): InteractionResponse {
  return {
    type: InteractionResponseType.MODAL,
    data: {
      custom_id: customId,
      title,
      components,
    },
  }
}

// ============================================================================
// PROPOSAL MODALS
// ============================================================================

/**
 * Modal for creating a new proposal
 */
export function proposeModal(): InteractionResponse {
  return modal('propose_modal', '📝 Nueva Propuesta de Tarea', [
    textInputRow(
      textInput({
        customId: 'title',
        label: 'Título de la Tarea',
        placeholder: 'Ej: Crear landing page para campaña de verano',
        maxLength: 100,
        required: true,
      })
    ),
    textInputRow(
      textInput({
        customId: 'description',
        label: 'Descripción Detallada',
        style: TextInputStyle.PARAGRAPH,
        placeholder:
          'Describe la tarea en detalle: qué se necesita hacer, requisitos, entregables esperados...',
        maxLength: 1000,
        required: true,
      })
    ),
    textInputRow(
      textInput({
        customId: 'category',
        label: 'Categoría (opcional)',
        placeholder: 'desarrollo, diseño, marketing, comunidad, contenido...',
        maxLength: 50,
        required: false,
      })
    ),
    textInputRow(
      textInput({
        customId: 'reward',
        label: 'Recompensa CGC Sugerida (opcional)',
        placeholder: 'Ej: 500',
        maxLength: 10,
        required: false,
      })
    ),
  ])
}

/**
 * Modal for rejecting a proposal (moderator)
 */
export function rejectProposalModal(proposalId: string): InteractionResponse {
  return modal(`reject_modal:${proposalId}`, '❌ Rechazar Propuesta', [
    textInputRow(
      textInput({
        customId: 'reason',
        label: 'Razón del Rechazo',
        style: TextInputStyle.PARAGRAPH,
        placeholder:
          'Explica por qué se rechaza esta propuesta y qué podría mejorar...',
        maxLength: 500,
        required: true,
      })
    ),
  ])
}

/**
 * Modal for approving a proposal with adjustments (moderator)
 */
export function approveProposalModal(proposalId: string): InteractionResponse {
  return modal(`approve_modal:${proposalId}`, '✅ Aprobar Propuesta', [
    textInputRow(
      textInput({
        customId: 'reward',
        label: 'Recompensa CGC Final',
        placeholder: 'Ej: 500',
        maxLength: 10,
        required: true,
      })
    ),
    textInputRow(
      textInput({
        customId: 'complexity',
        label: 'Complejidad (1-10)',
        placeholder: 'Ej: 5',
        maxLength: 2,
        required: true,
      })
    ),
    textInputRow(
      textInput({
        customId: 'category',
        label: 'Categoría',
        placeholder: 'desarrollo, diseño, marketing, comunidad, contenido...',
        maxLength: 50,
        required: true,
      })
    ),
    textInputRow(
      textInput({
        customId: 'estimated_days',
        label: 'Días Estimados',
        placeholder: 'Ej: 3',
        maxLength: 3,
        required: true,
      })
    ),
  ])
}

// ============================================================================
// VOTE MODALS
// ============================================================================

/**
 * Modal for adding a comment to a vote
 */
export function voteCommentModal(
  proposalId: string,
  voteType: 'up' | 'down'
): InteractionResponse {
  const emoji = voteType === 'up' ? '✅' : '❌'
  const voteLabel = voteType === 'up' ? 'A Favor' : 'En Contra'

  return modal(`vote_comment:${proposalId}:${voteType}`, `${emoji} Voto ${voteLabel}`, [
    textInputRow(
      textInput({
        customId: 'comment',
        label: 'Comentario (opcional)',
        style: TextInputStyle.PARAGRAPH,
        placeholder: 'Añade un comentario explicando tu voto...',
        maxLength: 500,
        required: false,
      })
    ),
  ])
}

// ============================================================================
// WALLET MODALS
// ============================================================================

/**
 * Modal for linking a wallet
 */
export function linkWalletModal(): InteractionResponse {
  return modal('link_wallet_modal', '🔗 Vincular Wallet', [
    textInputRow(
      textInput({
        customId: 'wallet',
        label: 'Dirección de Wallet',
        placeholder: '0x...',
        minLength: 42,
        maxLength: 42,
        required: true,
      })
    ),
  ])
}

// ============================================================================
// TASK MODALS
// ============================================================================

/**
 * Modal for submitting task completion
 */
export function submitTaskModal(taskId: string): InteractionResponse {
  return modal(`submit_task_modal:${taskId}`, '📤 Enviar Tarea Completada', [
    textInputRow(
      textInput({
        customId: 'description',
        label: 'Descripción del Trabajo',
        style: TextInputStyle.PARAGRAPH,
        placeholder: 'Describe brevemente lo que hiciste...',
        maxLength: 500,
        required: true,
      })
    ),
    textInputRow(
      textInput({
        customId: 'evidence_url',
        label: 'URL de Evidencia',
        placeholder: 'https://github.com/..., https://drive.google.com/...',
        maxLength: 500,
        required: true,
      })
    ),
    textInputRow(
      textInput({
        customId: 'notes',
        label: 'Notas Adicionales (opcional)',
        style: TextInputStyle.PARAGRAPH,
        placeholder: 'Cualquier información adicional para el revisor...',
        maxLength: 500,
        required: false,
      })
    ),
  ])
}

/**
 * Modal for abandoning a task
 */
export function abandonTaskModal(taskId: string): InteractionResponse {
  return modal(`abandon_task_modal:${taskId}`, '🚫 Abandonar Tarea', [
    textInputRow(
      textInput({
        customId: 'reason',
        label: '¿Por qué abandonas la tarea?',
        style: TextInputStyle.PARAGRAPH,
        placeholder:
          'Explica brevemente por qué no puedes completar la tarea...',
        maxLength: 500,
        required: true,
      })
    ),
  ])
}
