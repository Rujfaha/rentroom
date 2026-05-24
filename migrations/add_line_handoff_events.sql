CREATE TABLE IF NOT EXISTS line_handoff_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  line_user_id TEXT,
  conversation_id UUID REFERENCES line_conversations(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'open',
  source_message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_line_handoff_events_hotel_status
  ON line_handoff_events (hotel_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_line_handoff_events_conversation
  ON line_handoff_events (conversation_id, created_at DESC);

ALTER TABLE line_handoff_events ENABLE ROW LEVEL SECURITY;
