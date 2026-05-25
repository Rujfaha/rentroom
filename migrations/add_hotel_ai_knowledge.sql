CREATE TABLE IF NOT EXISTS hotel_ai_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  assistant_name TEXT NOT NULL DEFAULT 'Hospiq',
  tone TEXT,
  supported_languages JSONB NOT NULL DEFAULT '["th"]'::jsonb,
  booking_cta_policy TEXT,
  handoff_policy TEXT,
  fallback_policy TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (hotel_id)
);

CREATE TABLE IF NOT EXISTS hotel_faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT,
  language TEXT NOT NULL DEFAULT 'th',
  keywords JSONB NOT NULL DEFAULT '[]'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hotel_ai_testcases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  user_message TEXT NOT NULL,
  expected_intent TEXT,
  expected_entities JSONB NOT NULL DEFAULT '{}'::jsonb,
  expected_behavior TEXT,
  golden_reply TEXT,
  language TEXT NOT NULL DEFAULT 'th',
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hotel_ai_settings_hotel_active
  ON hotel_ai_settings (hotel_id, is_active);

CREATE INDEX IF NOT EXISTS idx_hotel_faqs_hotel_language_active
  ON hotel_faqs (hotel_id, language, is_active, sort_order);

CREATE INDEX IF NOT EXISTS idx_hotel_faqs_hotel_category
  ON hotel_faqs (hotel_id, category)
  WHERE category IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_hotel_ai_testcases_hotel_language_active
  ON hotel_ai_testcases (hotel_id, language, is_active, created_at DESC);

ALTER TABLE hotel_ai_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotel_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotel_ai_testcases ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trg_hotel_ai_settings_updated_at ON hotel_ai_settings;
CREATE TRIGGER trg_hotel_ai_settings_updated_at
  BEFORE UPDATE ON hotel_ai_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_hotel_faqs_updated_at ON hotel_faqs;
CREATE TRIGGER trg_hotel_faqs_updated_at
  BEFORE UPDATE ON hotel_faqs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_hotel_ai_testcases_updated_at ON hotel_ai_testcases;
CREATE TRIGGER trg_hotel_ai_testcases_updated_at
  BEFORE UPDATE ON hotel_ai_testcases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
