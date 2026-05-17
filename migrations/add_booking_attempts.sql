CREATE TABLE IF NOT EXISTS booking_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  ip_hash TEXT,
  email_hash TEXT,
  phone_hash TEXT,
  room_type_id UUID REFERENCES room_types(id) ON DELETE SET NULL,
  check_in_date DATE,
  check_out_date DATE,
  success BOOLEAN NOT NULL DEFAULT FALSE,
  reason TEXT,
  risk_score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS booking_attempts_hotel_created_idx
ON booking_attempts(hotel_id, created_at DESC);

CREATE INDEX IF NOT EXISTS booking_attempts_action_ip_created_idx
ON booking_attempts(action, ip_hash, created_at DESC);

CREATE INDEX IF NOT EXISTS booking_attempts_action_email_created_idx
ON booking_attempts(action, email_hash, created_at DESC);

CREATE INDEX IF NOT EXISTS booking_attempts_action_phone_created_idx
ON booking_attempts(action, phone_hash, created_at DESC);

CREATE INDEX IF NOT EXISTS booking_attempts_action_success_created_idx
ON booking_attempts(action, success, created_at DESC);
