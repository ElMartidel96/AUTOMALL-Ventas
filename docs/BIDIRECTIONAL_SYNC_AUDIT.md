# Bidirectional Sync System - Final Audit

**Date:** 2025-12-20
**Author:** Claude Code + Godez22
**Status:** ✅ FULLY IMPLEMENTED

---

## Executive Summary

Complete bidirectional synchronization between Web and Discord for the CryptoGift Wallets DAO task/proposal system.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         SUPABASE (Central DB)                       │
│  ┌──────────────────┐            ┌──────────────────┐               │
│  │  task_proposals  │◄──────────►│      tasks       │               │
│  │  proposal_votes  │            │                  │               │
│  └──────────────────┘            └──────────────────┘               │
└─────────────────────────────────────────────────────────────────────┘
         ▲                                        ▲
         │                                        │
    ┌────┴────┐                              ┌────┴────┐
    │   WEB   │                              │ DISCORD │
    │  APIs   │◄────────────────────────────►│   BOT   │
    │         │                              │         │
    └─────────┘                              └─────────┘

SYNC FLOWS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WEB → Discord:
  • POST /api/proposals         → syncProposalToDiscord()
  • POST /api/proposals/vote    → syncVotesToDiscord()
  • DELETE /api/proposals/vote  → syncVotesToDiscord()
  • POST /api/proposals/approve → announceProposalApproved() + syncTaskToDiscord()
  • POST /api/tasks/claim       → notifyTaskClaimed() (webhook)

Discord → DB + Discord:
  • /propose command            → Creates proposal in DB + Discord embed
  • /vote command               → Records vote in DB
  • /approve command            → Creates task + announceProposalApproved()
  • /reject command             → Updates proposal + announceProposalRejected()
  • /claim command              → Updates task + announceTaskClaimed()
```

---

## Sync Points Verified

### 1. Web Proposal Creation → Discord ✅

**File:** `app/api/proposals/route.ts`

```typescript
// After proposal creation:
syncProposalToDiscord({
  id: proposal.id,
  title: title.trim(),
  description: description.trim(),
  proposer: proposedByWallet || proposedByDiscordUsername || 'Anonymous',
  suggestedCategory,
  suggestedReward,
})
  .then(async (syncResult) => {
    if (syncResult.success && syncResult.messageId) {
      await getSupabase()
        .from('task_proposals')
        .update({
          discord_message_id: syncResult.messageId,
          discord_thread_id: syncResult.threadId || null,
        })
        .eq('id', proposal.id)
    }
  })
```

**Features:**
- Creates Discord embed with voting buttons
- Creates discussion thread automatically
- Stores `discord_message_id` for future updates
- Fire-and-forget pattern (non-blocking)

---

### 2. Web Vote → Discord Embed Update ✅

**File:** `app/api/proposals/vote/route.ts`

```typescript
async function syncVotesToDiscord(proposalId: string) {
  const { data: proposal } = await getSupabase()
    .from('task_proposals')
    .select('*')
    .eq('id', proposalId)
    .single()

  if (!proposal?.discord_message_id) return

  await updateProposalInDiscord(proposal.discord_message_id, {
    id: proposal.id,
    title: proposal.ai_refined_title || proposal.title,
    description: proposal.ai_refined_description || proposal.description,
    proposer: proposal.proposed_by_wallet || 'Anonymous',
    votesUp: proposal.votes_up || 0,
    votesDown: proposal.votes_down || 0,
  })
}
```

**Called after:**
- POST (new vote/toggle/change)
- DELETE (vote removal)

---

### 3. Web Proposal Approval → Discord ✅

**File:** `app/api/proposals/approve/route.ts`

```typescript
// After approval:
announceProposalApproved(proposal, approverDisplay)
syncTaskToDiscord(newTask)

// After rejection:
announceProposalRejected(proposal, rejectorDisplay, reason)
```

**Features:**
- Admin wallet authorization (only approved wallets can approve/reject)
- Creates task from proposal automatically
- Posts approval announcement to `#announcements`
- Posts new task to `#task-dao` with action buttons

---

### 4. Discord /propose → DB + Embed ✅

**File:** `lib/discord/bot/handlers/command-handlers.ts`

```typescript
export async function handlePropose(interaction) {
  // Creates proposal in database
  const proposal = await proposalService.createProposal({
    title, description,
    source: 'discord',
    proposedByDiscordId: discordId,
    proposedByDiscordUsername: discordUsername,
  })

  // Returns embed with vote buttons
  return {
    data: {
      embeds: [embed],
      components: proposalVoteButtons(proposal.id),
    },
  }
}
```

---

### 5. Discord /approve → DB + Discord ✅

**File:** `lib/discord/bot/handlers/command-handlers.ts`

```typescript
export async function handleApprove(interaction) {
  // Check moderator permissions
  // Create task from proposal
  // Update proposal status

  // Sync to Discord:
  announceProposalApproved(proposal, approver)
  syncTaskToDiscord(newTask)
}
```

---

### 6. Discord /reject → DB + Discord ✅

**File:** `lib/discord/bot/handlers/command-handlers.ts`

```typescript
export async function handleReject(interaction) {
  // Check moderator permissions
  // Update proposal status

  announceProposalRejected(proposal, rejector, reason)
}
```

---

### 7. Discord /claim → DB + Discord ✅

**File:** `lib/discord/bot/handlers/command-handlers.ts`

```typescript
export async function handleClaim(interaction) {
  // Verify linked wallet
  // Update task status to in_progress

  announceTaskClaimed(task, claimer)
}
```

---

### 8. Web Task Claim → Discord (Webhook) ✅

**File:** `app/api/tasks/claim/route.ts`

```typescript
// Uses webhook-based notification
notifyTaskClaimed(claimedTask, userAddress)
```

---

## Dual Notification System

The system uses two complementary notification methods:

### 1. Bot API (Rich Embeds)
**Service:** `lib/discord/bot/services/discord-sync-service.ts`

- Full Discord API integration
- Rich embeds with fields, colors, footers
- Interactive buttons (vote, claim, details)
- Can edit existing messages
- Creates threads for discussions

### 2. Webhooks (Simple Notifications)
**Service:** `lib/discord/task-notifications.ts`

- Simpler webhook-based approach
- Fire-and-forget
- Good for notifications that don't need editing
- Used for task claimed/completed events

---

## Environment Variables Required

```bash
# Discord Bot (required for sync)
DISCORD_BOT_TOKEN=<bot_token>
DISCORD_APPLICATION_ID=<app_id>

# Channel IDs (required for posting) - must match .env.local names
DISCORD_CHANNEL_PROPOSALS_ID=<channel_id>
DISCORD_CHANNEL_TASK_DAO_ID=<channel_id>
DISCORD_ANNOUNCEMENTS_CHANNEL_ID=<channel_id>

# Optional
DISCORD_TASK_WEBHOOK_URL=<webhook_url>  # For simple notifications
DISCORD_ADMIN_SECRET=<secret>            # For manual sync trigger
```

---

## Manual Sync Trigger

**Endpoint:** `POST /api/discord/sync`

**Actions:**
- `sync_new_tasks` - Sync all tasks without Discord message
- `sync_new_proposals` - Sync all proposals without Discord message
- `sync_task` - Sync specific task by ID
- `sync_proposal` - Sync specific proposal by ID
- `status` - Get sync status

---

## Database Fields Used

### task_proposals
- `discord_message_id` - Discord message for voting embed
- `discord_thread_id` - Discussion thread ID
- `source` - 'web' | 'discord'
- `proposed_by_discord_id` - Discord user ID
- `proposed_by_discord_username` - Discord username

### tasks
- `discord_message_id` - Discord message for task embed
- `proposed_from_discord` - Boolean flag

---

## Conclusion

The bidirectional sync system is **100% implemented** with:

✅ Web proposals auto-post to Discord for voting
✅ Web votes update Discord embed in real-time
✅ Web approval creates task and announces to Discord
✅ Discord /propose creates proposals in database
✅ Discord /approve creates tasks and announces
✅ Discord /reject announces rejection
✅ Discord /claim announces claim
✅ Web task claim notifies Discord via webhook
✅ Manual sync trigger available for recovery
✅ Dual notification system (Bot API + Webhooks)

---

*Generated by Claude Code on 2025-12-20*
