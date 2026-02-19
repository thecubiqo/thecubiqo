-- Performance indexes for CQ-to-CQ queries
-- Improves efficiency of conversation lookups and active call queries

-- Composite index for conversation participant lookups (used by getConversations)
CREATE INDEX IF NOT EXISTS idx_conversations_participants
  ON cq_conversations(participant_1_id, participant_2_id, last_message_at DESC);

-- Index for finding active/ringing calls efficiently (used by call management)
CREATE INDEX IF NOT EXISTS idx_calls_active
  ON cq_calls(recipient_id, status)
  WHERE status IN ('ringing', 'active');

-- Index for conversation message pagination (used by getMessages)
CREATE INDEX IF NOT EXISTS idx_messages_conversation_active
  ON cq_messages(conversation_id, sent_at DESC)
  WHERE is_deleted = false;
