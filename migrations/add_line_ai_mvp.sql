CREATE TABLE IF NOT EXISTS line_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  line_user_id TEXT NOT NULL,
  display_name TEXT,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (hotel_id, line_user_id)
);

CREATE TABLE IF NOT EXISTS line_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  line_user_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  last_intent TEXT,
  last_message_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS line_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  line_user_id TEXT,
  conversation_id UUID REFERENCES line_conversations(id) ON DELETE SET NULL,
  direction TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text',
  line_message_id TEXT,
  text TEXT,
  ai_provider TEXT,
  ai_model TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_line_users_hotel_user
  ON line_users (hotel_id, line_user_id);

CREATE INDEX IF NOT EXISTS idx_line_conversations_hotel_user_status
  ON line_conversations (hotel_id, line_user_id, status);

CREATE INDEX IF NOT EXISTS idx_line_conversations_last_message
  ON line_conversations (hotel_id, last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_line_messages_hotel_created
  ON line_messages (hotel_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_line_messages_user_created
  ON line_messages (hotel_id, line_user_id, created_at DESC);

ALTER TABLE line_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE line_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE line_messages ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trg_line_users_updated_at ON line_users;
CREATE TRIGGER trg_line_users_updated_at
  BEFORE UPDATE ON line_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_line_conversations_updated_at ON line_conversations;
CREATE TRIGGER trg_line_conversations_updated_at
  BEFORE UPDATE ON line_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
