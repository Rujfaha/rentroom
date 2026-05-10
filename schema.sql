-- ============================================================
-- ระบบจัดการโรงแรม/รีสอร์ตขนาดเล็กแบบ Multi-Tenant
-- PostgreSQL Schema — Version 1.0
-- ============================================================

-- ========================
-- Extensions
-- ========================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================
-- ENUM Types
-- ========================
CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'staff');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show');
CREATE TYPE payment_status AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE payment_method AS ENUM ('cash', 'bank_transfer', 'credit_card', 'promptpay', 'other');
CREATE TYPE room_status AS ENUM ('available', 'occupied', 'maintenance', 'out_of_order');
CREATE TYPE housekeeping_status AS ENUM ('clean', 'dirty', 'inspected', 'in_progress', 'out_of_service');
CREATE TYPE booking_source AS ENUM ('website', 'walk_in', 'phone', 'ota', 'other');
CREATE TYPE day_type AS ENUM ('weekday', 'weekend', 'holiday', 'special');
CREATE TYPE contact_type AS ENUM ('phone', 'email', 'facebook', 'line', 'instagram', 'website', 'tiktok', 'whatsapp', 'map_url', 'other');

-- ============================================================
-- กลุ่มที่ 1: Auth & Multi-Tenant
-- ============================================================

-- ตาราง Tenant หลัก — ข้อมูลโรงแรม/รีสอร์ต
CREATE TABLE hotels (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(255) NOT NULL,
    slug            VARCHAR(100) NOT NULL UNIQUE,  -- สำหรับ URL subdomain/path
    description     TEXT,
    address         TEXT,
    province        VARCHAR(100),
    district        VARCHAR(100),
    sub_district    VARCHAR(100),
    postal_code     VARCHAR(10),
    latitude        DECIMAL(10, 7),
    longitude       DECIMAL(10, 7),
    logo_url        TEXT,           -- URL/Path ของโลโก้
    cover_image_url TEXT,           -- URL/Path ของรูปปก
    phone           VARCHAR(50),
    email           VARCHAR(255),
    tax_id          VARCHAR(20),    -- เลขประจำตัวผู้เสียภาษี
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    settings        JSONB DEFAULT '{}'::jsonb,  -- ตั้งค่าทั่วไป (สกุลเงิน, timezone ฯลฯ)
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ผู้ใช้งานระบบ (ตารางส่วนกลาง — ไม่มี hotel_id)
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   TEXT NOT NULL,
    full_name       VARCHAR(255) NOT NULL,
    phone           VARCHAR(50),
    avatar_url      TEXT,
    role            user_role NOT NULL DEFAULT 'staff',
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Mapping ผู้ใช้กับโรงแรม (Admin/Staff สามารถดูแลหลายโรงแรมได้)
CREATE TABLE user_hotels (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    hotel_id        UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    assigned_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, hotel_id)
);

-- สิทธิ์เข้าถึงฟีเจอร์ของ Staff
CREATE TABLE staff_permissions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    hotel_id        UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    permission_key  VARCHAR(100) NOT NULL,  -- เช่น 'housekeeping', 'bookings.view', 'expenses'
    is_allowed      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, hotel_id, permission_key)
);

-- ============================================================
-- กลุ่มที่ 2: CMS (Landing Page Content)
-- ============================================================

-- หน้าเพจไดนามิก (Tabs)
CREATE TABLE cms_pages (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id        UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    title           VARCHAR(255) NOT NULL,
    slug            VARCHAR(100) NOT NULL,
    sort_order      INT NOT NULL DEFAULT 0,
    is_published    BOOLEAN NOT NULL DEFAULT FALSE,
    meta_title      VARCHAR(255),
    meta_description TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(hotel_id, slug)
);

-- Sections ภายในหน้าเพจ (Hero, Text, Gallery ฯลฯ)
CREATE TABLE cms_sections (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_id         UUID NOT NULL REFERENCES cms_pages(id) ON DELETE CASCADE,
    hotel_id        UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    section_type    VARCHAR(50) NOT NULL,  -- 'hero', 'text', 'gallery', 'features', 'cta'
    title           VARCHAR(255),
    content         JSONB DEFAULT '{}'::jsonb,  -- เนื้อหาแบบยืดหยุ่น
    sort_order      INT NOT NULL DEFAULT 0,
    is_visible      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- รูปภาพ CMS (แยกตาราง — จัดการ gallery ได้ง่าย)
CREATE TABLE cms_images (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id        UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    section_id      UUID REFERENCES cms_sections(id) ON DELETE SET NULL,
    image_url       TEXT NOT NULL,       -- URL หรือ File Path
    alt_text        VARCHAR(255),
    caption         VARCHAR(500),
    sort_order      INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ข้อมูลติดต่อ / Social Links / นโยบาย
CREATE TABLE cms_hotel_contacts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id        UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    contact_type    contact_type NOT NULL,  -- 'phone', 'line', 'facebook' ฯลฯ
    label           VARCHAR(100),           -- ชื่อที่แสดง เช่น "LINE Official"
    value           TEXT NOT NULL,          -- เบอร์โทร, URL, LINE ID
    icon_url        TEXT,                   -- ไอคอน (ถ้ามี)
    sort_order      INT NOT NULL DEFAULT 0,
    is_visible      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- สถานที่ท่องเที่ยวใกล้เคียง
CREATE TABLE local_attractions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id        UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    image_url       TEXT,
    distance_km     DECIMAL(6, 2),      -- ระยะทางจากโรงแรม (กม.)
    map_url         TEXT,               -- Google Maps link
    sort_order      INT NOT NULL DEFAULT 0,
    is_visible      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- กลุ่มที่ 3: Core Hotel Operations
-- ============================================================

-- ประเภทห้องพัก
CREATE TABLE room_types (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id        UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,  -- เช่น Standard, Deluxe, Villa
    description     TEXT,
    base_price      DECIMAL(10, 2) NOT NULL DEFAULT 0,  -- ราคาฐาน/คืน
    max_guests      INT NOT NULL DEFAULT 2,
    amenities       JSONB DEFAULT '[]'::jsonb,  -- สิ่งอำนวยความสะดวก
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(hotel_id, name)
);

-- ห้องพักจริง (Physical Rooms)
CREATE TABLE rooms (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id        UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    room_type_id    UUID NOT NULL REFERENCES room_types(id) ON DELETE RESTRICT,
    room_number     VARCHAR(20) NOT NULL,   -- เช่น 101, 102, A1
    floor           VARCHAR(10),
    status          room_status NOT NULL DEFAULT 'available',
    housekeeping    housekeeping_status NOT NULL DEFAULT 'clean',
    notes           TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(hotel_id, room_number)
);

-- รูปภาพประเภทห้อง
CREATE TABLE room_type_images (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_type_id    UUID NOT NULL REFERENCES room_types(id) ON DELETE CASCADE,
    hotel_id        UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    image_url       TEXT NOT NULL,
    alt_text        VARCHAR(255),
    is_cover        BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order      INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ลูกค้า / ผู้เข้าพัก (CRM)
CREATE TABLE customers (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id        UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    full_name       VARCHAR(255) NOT NULL,
    phone           VARCHAR(50),
    email           VARCHAR(255),
    line_id         VARCHAR(100),
    id_card_number  VARCHAR(20),        -- เลขบัตรประชาชน (optional)
    nationality     VARCHAR(100),
    notes           TEXT,
    total_stays     INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- การจอง
CREATE TABLE bookings (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id        UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    room_id         UUID NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
    customer_id     UUID REFERENCES customers(id) ON DELETE SET NULL,
    booking_number  VARCHAR(30) NOT NULL UNIQUE,  -- เลขที่การจอง (auto-gen)
    check_in_date   DATE NOT NULL,
    check_out_date  DATE NOT NULL,
    num_guests      INT NOT NULL DEFAULT 1,
    status          booking_status NOT NULL DEFAULT 'pending',
    source          booking_source NOT NULL DEFAULT 'website',
    total_amount    DECIMAL(10, 2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    net_amount      DECIMAL(10, 2) NOT NULL DEFAULT 0,
    special_requests TEXT,
    notes           TEXT,
    confirmed_at    TIMESTAMPTZ,
    checked_in_at   TIMESTAMPTZ,
    checked_out_at  TIMESTAMPTZ,
    cancelled_at    TIMESTAMPTZ,
    cancel_reason   TEXT,
    created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT check_dates CHECK (check_out_date > check_in_date)
);

-- ผู้เข้าพักในแต่ละการจอง (กรณีเข้าพักหลายคน)
CREATE TABLE booking_guests (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id      UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    hotel_id        UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    full_name       VARCHAR(255) NOT NULL,
    phone           VARCHAR(50),
    id_card_number  VARCHAR(20),
    is_primary      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- บันทึกการทำความสะอาด (Housekeeping Logs)
CREATE TABLE housekeeping_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id        UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    room_id         UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    assigned_to     UUID REFERENCES users(id) ON DELETE SET NULL,  -- พนักงานแม่บ้าน
    status          housekeeping_status NOT NULL,
    notes           TEXT,
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- กลุ่มที่ 4: Pricing & Finance
-- ============================================================

-- ฤดูกาลราคา
CREATE TABLE seasons (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id        UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,  -- เช่น High Season, Low Season, Songkran
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT check_season_dates CHECK (end_date >= start_date)
);

-- กฎราคา (ราคาตาม season + room type + วันในสัปดาห์)
CREATE TABLE pricing_rules (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id        UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    room_type_id    UUID NOT NULL REFERENCES room_types(id) ON DELETE CASCADE,
    season_id       UUID REFERENCES seasons(id) ON DELETE SET NULL,
    day_type        day_type NOT NULL DEFAULT 'weekday',
    price           DECIMAL(10, 2) NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(hotel_id, room_type_id, season_id, day_type)
);

-- การชำระเงิน
CREATE TABLE payments (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id        UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    booking_id      UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    amount          DECIMAL(10, 2) NOT NULL,
    method          payment_method NOT NULL DEFAULT 'cash',
    status          payment_status NOT NULL DEFAULT 'pending',
    slip_image_url  TEXT,           -- URL/Path ของรูปสลิปโอนเงิน
    transaction_ref VARCHAR(100),   -- เลขอ้างอิงธุรกรรม
    verified_by     UUID REFERENCES users(id) ON DELETE SET NULL,
    verified_at     TIMESTAMPTZ,
    notes           TEXT,
    paid_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- หมวดหมู่รายจ่าย
CREATE TABLE expense_categories (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id        UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,
    color           VARCHAR(7),     -- HEX color สำหรับ UI
    icon            VARCHAR(50),
    sort_order      INT NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(hotel_id, name)
);

-- รายจ่ายประจำวัน
CREATE TABLE expenses (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id        UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    category_id     UUID REFERENCES expense_categories(id) ON DELETE SET NULL,
    amount          DECIMAL(10, 2) NOT NULL,
    description     TEXT,
    expense_date    DATE NOT NULL DEFAULT CURRENT_DATE,
    receipt_url     TEXT,           -- URL/Path ของใบเสร็จ (ถ้ามี)
    created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Indexes — เพิ่มประสิทธิภาพการค้นหา
-- ============================================================

-- Auth & Multi-Tenant
CREATE INDEX idx_user_hotels_user     ON user_hotels(user_id);
CREATE INDEX idx_user_hotels_hotel    ON user_hotels(hotel_id);
CREATE INDEX idx_staff_perm_user      ON staff_permissions(user_id, hotel_id);

-- CMS
CREATE INDEX idx_cms_pages_hotel      ON cms_pages(hotel_id);
CREATE INDEX idx_cms_sections_page    ON cms_sections(page_id);
CREATE INDEX idx_cms_sections_hotel   ON cms_sections(hotel_id);
CREATE INDEX idx_cms_images_hotel     ON cms_images(hotel_id);
CREATE INDEX idx_cms_images_section   ON cms_images(section_id);
CREATE INDEX idx_cms_contacts_hotel   ON cms_hotel_contacts(hotel_id);
CREATE INDEX idx_attractions_hotel    ON local_attractions(hotel_id);

-- Rooms
CREATE INDEX idx_room_types_hotel     ON room_types(hotel_id);
CREATE INDEX idx_rooms_hotel          ON rooms(hotel_id);
CREATE INDEX idx_rooms_type           ON rooms(room_type_id);
CREATE INDEX idx_rooms_hotel_status   ON rooms(hotel_id, status);
CREATE INDEX idx_rooms_hotel_hk       ON rooms(hotel_id, housekeeping);

-- Bookings
CREATE INDEX idx_bookings_hotel       ON bookings(hotel_id);
CREATE INDEX idx_bookings_room        ON bookings(room_id);
CREATE INDEX idx_bookings_customer    ON bookings(customer_id);
CREATE INDEX idx_bookings_hotel_status ON bookings(hotel_id, status);
CREATE INDEX idx_bookings_dates       ON bookings(hotel_id, check_in_date, check_out_date);
CREATE INDEX idx_bookings_number      ON bookings(booking_number);
CREATE INDEX idx_booking_guests_bk    ON booking_guests(booking_id);

-- Customers
CREATE INDEX idx_customers_hotel      ON customers(hotel_id);
CREATE INDEX idx_customers_phone      ON customers(hotel_id, phone);

-- Housekeeping
CREATE INDEX idx_hk_logs_hotel_room   ON housekeeping_logs(hotel_id, room_id);
CREATE INDEX idx_hk_logs_assigned     ON housekeeping_logs(assigned_to);

-- Finance
CREATE INDEX idx_seasons_hotel        ON seasons(hotel_id);
CREATE INDEX idx_seasons_dates        ON seasons(hotel_id, start_date, end_date);
CREATE INDEX idx_pricing_hotel_room   ON pricing_rules(hotel_id, room_type_id);
CREATE INDEX idx_payments_hotel       ON payments(hotel_id);
CREATE INDEX idx_payments_booking     ON payments(booking_id);
CREATE INDEX idx_payments_status      ON payments(hotel_id, status);
CREATE INDEX idx_expense_cat_hotel    ON expense_categories(hotel_id);
CREATE INDEX idx_expenses_hotel       ON expenses(hotel_id);
CREATE INDEX idx_expenses_date        ON expenses(hotel_id, expense_date);
CREATE INDEX idx_expenses_category    ON expenses(category_id);

-- ============================================================
-- Updated_at Trigger Function (auto-update timestamp)
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER trg_hotels_updated_at BEFORE UPDATE ON hotels FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_cms_pages_updated_at BEFORE UPDATE ON cms_pages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_cms_sections_updated_at BEFORE UPDATE ON cms_sections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_cms_contacts_updated_at BEFORE UPDATE ON cms_hotel_contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_attractions_updated_at BEFORE UPDATE ON local_attractions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_room_types_updated_at BEFORE UPDATE ON room_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_rooms_updated_at BEFORE UPDATE ON rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_seasons_updated_at BEFORE UPDATE ON seasons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_pricing_updated_at BEFORE UPDATE ON pricing_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Schema v2 Additions (Promotions & Hero Slides)
-- ============================================================

CREATE TABLE promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT,
  discount_percentage DECIMAL(5,2),
  discount_text VARCHAR(100),
  valid_until DATE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE hero_slides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text VARCHAR(255),
  headline VARCHAR(255),
  subheadline TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_promotions_updated_at BEFORE UPDATE ON promotions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_hero_slides_updated_at BEFORE UPDATE ON hero_slides FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
