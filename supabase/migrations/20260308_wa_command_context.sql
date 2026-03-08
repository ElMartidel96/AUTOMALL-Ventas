-- WhatsApp Command Router — Add command_context to sessions
-- Run in Supabase SQL Editor

ALTER TABLE wa_sessions ADD COLUMN IF NOT EXISTS command_context JSONB DEFAULT NULL;

-- Index for quick lookup of active command contexts
CREATE INDEX IF NOT EXISTS idx_wa_sessions_command_context
  ON wa_sessions USING gin (command_context)
  WHERE command_context IS NOT NULL;
