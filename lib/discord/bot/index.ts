/**
 * Discord Bot Module
 *
 * Main exports for the CryptoGift DAO Discord Bot
 */

// Types
export * from './types'

// Utils
export {
  verifyDiscordSignature,
  verifyDiscordSignatureNacl,
  hasRequiredHeaders,
  getSignatureHeaders,
} from './utils/verify-signature'

export {
  discordAPI,
  sendChannelMessage,
  editMessage,
  deleteMessage,
  createThread,
  addReaction,
  getReactions,
  getUser,
  getGuildMember,
  userHasRole,
  sendDM,
  getChannel,
  editOriginalInteractionResponse,
  sendFollowupMessage,
  deleteOriginalInteractionResponse,
} from './utils/discord-api'

export {
  SLASH_COMMANDS,
  registerCommands,
  getCommands,
  deleteCommand,
} from './utils/register-commands'

// Components
export {
  proposalEmbed,
  proposalApprovedEmbed,
  proposalRejectedEmbed,
  taskEmbed,
  taskListEmbed,
  taskClaimedEmbed,
  taskCompletedEmbed,
  helpEmbed,
  statsEmbed,
  leaderboardEmbed,
  errorEmbed,
  successEmbed,
} from './components/embeds'

export {
  proposalVoteButtons,
  proposalModButtons,
  taskActionButtons,
  taskClaimedButtons,
  paginationButtons,
  confirmButtons,
  websiteButton,
  helpButtons,
} from './components/buttons'

export {
  proposeModal,
  rejectProposalModal,
  approveProposalModal,
  voteCommentModal,
  linkWalletModal,
  submitTaskModal,
  abandonTaskModal,
} from './components/modals'

// Services
export * as proposalService from './services/proposal-service'

export {
  syncProposalToDiscord,
  updateProposalInDiscord,
  announceProposalApproved,
  announceProposalRejected,
  syncTaskToDiscord,
  announceTaskClaimed,
  announceTaskCompleted,
  sendAnnouncement,
  isDiscordSyncConfigured,
} from './services/discord-sync-service'

export {
  refineProposal,
  detectCategory,
  estimateComplexity,
  estimateReward,
  isRefinementError,
} from './services/ai-refinement-service'

// Handlers
export * as commandHandlers from './handlers/command-handlers'
export * as componentHandlers from './handlers/component-handlers'
