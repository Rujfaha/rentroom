ALTER TABLE promotions
ADD COLUMN IF NOT EXISTS promotion_type VARCHAR(30) NOT NULL DEFAULT 'code_required'
  CHECK (promotion_type IN ('automatic', 'code_required', 'private')),
ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ends_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS stay_start_date DATE,
ADD COLUMN IF NOT EXISTS stay_end_date DATE,
ADD COLUMN IF NOT EXISTS priority INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS stackable BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS exclusive BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS max_uses INT,
ADD COLUMN IF NOT EXISTS used_count INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_uses_per_customer INT,
ADD COLUMN IF NOT EXISTS applies_to_all_room_types BOOLEAN NOT NULL DEFAULT TRUE;

UPDATE promotions
SET promotion_type = CASE
  WHEN discount_code IS NULL OR TRIM(discount_code) = '' THEN 'automatic'
  ELSE 'code_required'
END
WHERE promotion_type IS NULL OR promotion_type = 'code_required';

CREATE TABLE IF NOT EXISTS promotion_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  max_uses INT,
  used_count INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(promotion_id, code)
);

CREATE TABLE IF NOT EXISTS promotion_room_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  room_type_id UUID NOT NULL REFERENCES room_types(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(promotion_id, room_type_id)
);

CREATE TABLE IF NOT EXISTS promotion_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  conditions_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  benefits_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(promotion_id)
);

CREATE TABLE IF NOT EXISTS promotion_usages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE RESTRICT,
  promotion_code_id UUID REFERENCES promotion_codes(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  customer_phone VARCHAR(50),
  customer_email VARCHAR(255),
  discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  used_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS booking_promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE RESTRICT,
  promotion_name VARCHAR(255) NOT NULL,
  promotion_code VARCHAR(50),
  discount_type VARCHAR(50),
  discount_value DECIMAL(10, 2),
  discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  conditions_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  benefits_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO promotion_rules (promotion_id, conditions_json, benefits_json)
SELECT
  id,
  '{}'::jsonb,
  jsonb_build_object(
    'type', COALESCE(discount_type, 'percent'),
    'discount_percent', COALESCE(discount_percentage, 0),
    'discount_amount', COALESCE(discount_amount, 0)
  )
FROM promotions
WHERE NOT EXISTS (
  SELECT 1 FROM promotion_rules WHERE promotion_rules.promotion_id = promotions.id
);

INSERT INTO promotion_codes (promotion_id, code)
SELECT id, UPPER(TRIM(discount_code))
FROM promotions
WHERE discount_code IS NOT NULL
  AND TRIM(discount_code) <> ''
  AND NOT EXISTS (
    SELECT 1 FROM promotion_codes
    WHERE promotion_codes.promotion_id = promotions.id
      AND promotion_codes.code = UPPER(TRIM(promotions.discount_code))
  );

CREATE INDEX IF NOT EXISTS idx_promotions_engine_active
ON promotions(hotel_id, is_active, promotion_type, starts_at, ends_at);

CREATE INDEX IF NOT EXISTS idx_promotions_engine_stay_dates
ON promotions(hotel_id, stay_start_date, stay_end_date);

CREATE INDEX IF NOT EXISTS idx_promotion_codes_code
ON promotion_codes(code)
WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_promotion_room_types_lookup
ON promotion_room_types(room_type_id, promotion_id);

CREATE INDEX IF NOT EXISTS idx_promotion_usages_promotion
ON promotion_usages(promotion_id);

CREATE INDEX IF NOT EXISTS idx_promotion_usages_customer_phone
ON promotion_usages(customer_phone)
WHERE customer_phone IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_promotion_usages_customer_email
ON promotion_usages(customer_email)
WHERE customer_email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_booking_promotions_booking
ON booking_promotions(booking_id);

DROP TRIGGER IF EXISTS trg_promotion_codes_updated_at ON promotion_codes;
CREATE TRIGGER trg_promotion_codes_updated_at
BEFORE UPDATE ON promotion_codes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_promotion_rules_updated_at ON promotion_rules;
CREATE TRIGGER trg_promotion_rules_updated_at
BEFORE UPDATE ON promotion_rules
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
